import { useEffect, useRef, useState } from "react";
import { useAuth } from "react-oidc-context";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";
import { AuthLayout } from "@/layouts/AuthLayout";
import { ApiError } from "@/shared/api/ApiError";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { useRetryAfterCountdown } from "@/shared/api/useRetryAfterCountdown";
import { useCountdown } from "@/shared/hooks/useCountdown";
import { Button } from "@/shared/ui/button";
import { FormError } from "@/shared/ui/FormError";
import { OtpInput } from "@/shared/ui/OtpInput";
import { requestLoginCode, verifyLoginCode } from "../api/loginCode";
import { EmailCodeForm } from "../components/EmailCodeForm";
import { GoogleButton } from "../components/GoogleButton";
import { loginCodeErrorKey } from "../errors";
import { carriedLoginRedirectError, carryLoginRedirectError, forgetLoginRedirectError } from "../lib/loginRedirectError";
import type { CodeStep } from "../lib/loginCodeState";
import { authorizeReturnUrl, safeReturnUrl } from "../lib/returnUrl";

export interface LoginPageProps {
  access: "consumer" | "business";
  completeLogin?: (returnUrl: string) => void;
}

const followAuthorize = (url: string) => globalThis.location.assign(url);

export function LoginPage({ access, completeLogin = followAuthorize }: LoginPageProps) {
  const { t } = useTranslation("auth");
  const auth = useAuth();
  const [searchParams] = useSearchParams();
  const returnUrl = authorizeReturnUrl(searchParams.get("returnUrl"));
  const redirectError = searchParams.get("error");
  const [googleError, setGoogleError] = useState<string | null>(() => redirectError ?? carriedLoginRedirectError() ?? null);
  const startedOidc = useRef(false);
  const [step, setStep] = useState<CodeStep | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<ApiError | null>(null);
  const [result, setResult] = useState<"noBusiness" | "inactive" | null>(null);
  const resend = useIdempotentMutation((email: string, key) => requestLoginCode(email, key));
  const verify = useIdempotentMutation((input: { email: string; code: string; returnUrl: string }, key) => verifyLoginCode(input, key));
  const resendTimer = useCountdown(0);
  const retry = useRetryAfterCountdown();

  useEffect(() => {
    if (returnUrl || startedOidc.current) return;
    startedOidc.current = true;
    if (redirectError) carryLoginRedirectError(redirectError);
    const destination = access === "business" ? "/org" : "/";
    const returnTo = safeReturnUrl(searchParams.get("returnUrl"), destination);
    void auth.signinRedirect({ state: { returnTo }, extraQueryParams: { access } });
  }, [access, auth, redirectError, returnUrl, searchParams]);

  useEffect(() => { if (returnUrl) forgetLoginRedirectError(); }, [returnUrl]);

  if (!returnUrl) return null;

  function startCode(next: CodeStep) {
    setStep(next);
    setCode("");
    setError(null);
    resendTimer.restart(60);
  }

  function dismissGoogleError() { setGoogleError(null); forgetLoginRedirectError(); }

  function backToEmail() {
    setStep(null);
    setCode("");
    setError(null);
    setResult(null);
    resendTimer.restart(0);
  }

  async function submitCode() {
    if (!step || !returnUrl || code.length !== 6) return;
    setError(null);
    try {
      const response = await verify.mutateAsync({ email: step.destination, code, returnUrl });
      completeLogin(response.returnUrl);
    } catch (caught) {
      if (!(caught instanceof ApiError)) throw caught;
      if (caught.code === "Tenancy.Access.NotMember") setResult("noBusiness");
      else if (caught.code === "Tenancy.Member.Inactive") { setError(caught); setResult("inactive"); }
      else setError(caught);
    }
  }

  async function resendCode() {
    if (!step) return;
    setError(null);
    try {
      const response = await resend.mutateAsync(step.destination);
      setCode("");
      resendTimer.restart(response.resendAfterSeconds);
    } catch (caught) {
      if (!(caught instanceof ApiError)) throw caught;
      setError(caught);
      retry.startFromError(caught);
    }
  }

  const errorKey = error ? loginCodeErrorKey(error) : null;
  const attemptsLeft = typeof error?.problem.attemptsLeft === "number" ? error.problem.attemptsLeft : null;
  const wrongCode = error?.code === "Auth.LoginCode.Invalid";
  const codeSpent = error?.code === "Auth.LoginCode.TooManyAttempts" || error?.code === "Identity.Account.LockedOut";
  const accountClosed = error?.code === "Identity.Account.Suspended";
  const organizationName = typeof error?.problem.organizationName === "string" ? error.problem.organizationName : "";

  return <AuthLayout access={access}>
    {result === "noBusiness" ? <div className="flex flex-col gap-[22px] text-center">
      <h1 className="text-[26px] font-bold leading-tight">{t("login.noBusiness")}</h1>
      <Link to="/login" className="inline-flex h-10 items-center justify-center rounded-[10px] border border-[var(--t3)] text-sm font-semibold">{t("login.enterAsPerson")}</Link>
    </div> : result === "inactive" ? <div className="flex flex-col gap-[22px] text-center">
      <h1 className="text-[26px] font-bold leading-tight">{t("login.inactiveBusiness", { organizationName })}</h1>
      <p className="text-sm text-[var(--t2)]">{t("login.askOwner")}</p>
      <Link to="/login" className="inline-flex h-10 items-center justify-center rounded-[10px] bg-[var(--marca)] text-sm font-semibold text-[var(--lado-activo)]">{t("login.enterAsPerson")}</Link>
    </div> : step === null ? <div className="flex flex-col gap-[22px]">
      <h1 className="text-[26px] font-bold leading-tight">{access === "business" ? t("login.businessTitle") : t("login.personalTitle")}</h1>
      <GoogleButton mode="login" access={access} returnUrl={returnUrl} />
      <div className="flex items-center gap-3 text-[13px] text-[var(--t3)]"><span className="h-px flex-1 bg-[var(--t3)]" /><span>{t("login.or")}</span><span className="h-px flex-1 bg-[var(--t3)]" /></div>
      <EmailCodeForm onCodeRequested={startCode} onSubmitStart={dismissGoogleError} notice={googleError ? <><span>{t("login.googleError")}</span><span className="block">{t("login.googleErrorHelp")}</span></> : undefined} />
      <div className="flex flex-col gap-2 text-[13px] text-[var(--t2)]">
        {access === "consumer" ? <>
          <div>{t("login.noAccount")} <Link to="/registro" className="font-semibold text-[var(--marca)] hover:underline">{t("login.createOne")}</Link></div>
          <div>{t("login.haveBusiness")} <Link to="/login/empresa" className="font-semibold text-[var(--marca)] hover:underline">{t("login.enterAsBusiness")}</Link></div>
        </> : <>
          <div>{t("login.enterAsPersonQuestion")} <Link to="/login" className="font-semibold text-[var(--marca)] hover:underline">{t("login.enterHere")}</Link></div>
        </>}
      </div>
    </div> : <div className="flex flex-col gap-[22px]">
      <button type="button" onClick={backToEmail} className="self-start text-[13px] font-semibold text-[var(--marca)] hover:underline">{t("login.otherEmail")}</button>
      <div><h1 className="text-[26px] font-bold leading-tight">{t("login.checkEmail")}</h1>
        <p id="login-code-hint" className="mt-2 text-sm text-[var(--t2)]">{t("login.sentCode", { email: step.destination })}</p>
      </div>
      <OtpInput length={6} value={code} onChange={(next) => { setCode(next); if (wrongCode) setError(null); }} label={t("login.codeLabel")} invalid={wrongCode} disabled={verify.isPending || accountClosed} aria-describedby="login-code-hint" />
      <FormError message={errorKey ? <>{t(errorKey)}{attemptsLeft !== null ? <span className="block">{t("login.attemptsLeft", { count: attemptsLeft })}</span> : null}{codeSpent && error?.code === "Auth.LoginCode.TooManyAttempts" ? <span className="block">{t("login.requestNewCode")}</span> : null}{error?.code === "Identity.Account.LockedOut" ? <span className="block">{t("login.tryLater")}</span> : null}{accountClosed ? <span className="block">{t("login.contactSupport")}</span> : null}</> : null} />
      <div className="flex flex-col gap-2.5">
        <Button type="button" size="lg" onClick={() => void submitCode()} disabled={code.length !== 6 || verify.isPending || codeSpent || accountClosed}>{t("login.verify")}</Button>
        <Button type="button" size="lg" variant="outline" className="border-[var(--t3)]" onClick={() => void resendCode()} disabled={resendTimer.isRunning || retry.isRunning || resend.isPending || accountClosed}>
          {retry.label ?? (resendTimer.isRunning ? t("login.resendIn", { seconds: resendTimer.seconds }) : t("login.resendCode"))}
        </Button>
      </div>
      {accountClosed ? <button type="button" onClick={backToEmail} className="self-center text-sm font-semibold text-[var(--marca)]">{t("login.backToLogin")}</button> : null}
    </div>}
  </AuthLayout>;
}
