import { useEffect, useRef, useState } from "react";
import { useAuth } from "react-oidc-context";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";
import { AuthLayout } from "@/layouts/AuthLayout";
import { takeExpiredSessionNotice } from "@/auth/sessionExpiredNotice";
import { ApiError } from "@/shared/api/ApiError";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { useRetryAfterCountdown } from "@/shared/api/useRetryAfterCountdown";
import { useCountdown } from "@/shared/hooks/useCountdown";
import { Button } from "@/shared/ui/button";
import { FormError } from "@/shared/ui/FormError";
import { AlertTriangleIcon, ClockIcon, LockIcon } from "@/shared/ui/icons";
import { requestLoginCode, verifyLoginCode } from "../api/loginCode";
import { AuthStatus, type AuthStatusProps } from "../components/AuthStatus";
import { BusinessAccessResult } from "../components/BusinessAccessResult";
import { PlatformAccessResult } from "../components/PlatformAccessResult";
import { AuthCodeStep } from "../components/AuthCodeStep";
import { AuthLink, AuthLinkRow } from "../components/AuthLink";
import { EmailCodeForm } from "../components/EmailCodeForm";
import { GoogleButton } from "../components/GoogleButton";
import { loginCodeMessage } from "../errors";
import { carriedLoginRedirectError, carryLoginRedirectError, forgetLoginRedirectError } from "../lib/loginRedirectError";
import type { CodeStep } from "../lib/loginCodeState";
import { loginReturnUrl, safeReturnUrl } from "../lib/returnUrl";
import type { PendingDeletionState } from "@/shared/api/types";
import { accountErrorCodes, pendingDeletionFromProblem } from "@/shared/api/accountContract";
import { getPendingDeletion, cancelAccountDeletion } from "../api/deletion";
import { PendingDeletionPanel } from "../components/PendingDeletionPanel";
import { toast } from "sonner";
import { toastError } from "@/shared/ui/sonner";
import { accessOfPath, homeOf, isUnavailableCode, loginPathOf, type UnavailableCode } from "@/tenancy/access";

export interface LoginPageProps {
  access: "consumer" | "business";
  completeLogin?: (returnUrl: string) => void;
}

const followAuthorize = (url: string) => globalThis.location.assign(url);

// La organización suspendida, en revisión o cerrada: los textos de la organización no disponible, con el círculo de su estado.
const unavailableResults: Record<UnavailableCode, { title: string; description: string; icon: AuthStatusProps["icon"]; tone: AuthStatusProps["tone"] }> = {
  "Tenancy.Tenant.Suspended": { title: "suspendedTitle", description: "suspendedDescription", icon: AlertTriangleIcon, tone: "warning" },
  "Tenancy.Tenant.PendingApproval": { title: "pendingTitle", description: "pendingDescription", icon: ClockIcon, tone: "brand" },
  "Tenancy.Tenant.Closed": { title: "closedTitle", description: "closedDescription", icon: LockIcon, tone: "neutral" },
};

export function LoginPage({ access, completeLogin = followAuthorize }: LoginPageProps) {
  const { t } = useTranslation(["auth", "errors"]);
  const auth = useAuth();
  const [searchParams] = useSearchParams();
  const returnUrl = loginReturnUrl(searchParams.get("returnUrl"));
  const redirectError = searchParams.get("error");
  const [googleError, setGoogleError] = useState<string | null>(() => redirectError ?? carriedLoginRedirectError() ?? null);
  const [sessionExpired] = useState(() => {
    if (!returnUrl) return false;
    const stored = takeExpiredSessionNotice();
    return searchParams.get("session") === "expired" || stored;
  });
  const startedOidc = useRef(false);
  const [step, setStep] = useState<CodeStep | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<ApiError | null>(null);
  const [result, setResult] = useState<"noBusiness" | "inactive" | "platformOnly" | UnavailableCode | null>(null);
  const resend = useIdempotentMutation((email: string, key) => requestLoginCode(email, key), { meta: { handlesError: true } });
  const verify = useIdempotentMutation((input: { email: string; code: string; returnUrl: string }, key) => verifyLoginCode(input, key), { meta: { handlesError: true } });
  const resendTimer = useCountdown(0);
  const verifyRetry = useRetryAfterCountdown();
  const resendRetry = useRetryAfterCountdown();
  const [pending, setPending] = useState<PendingDeletionState | null>(null);
  const [cancelFailure, setCancelFailure] = useState<string | null>(null);
  const [googleProofExpired, setGoogleProofExpired] = useState(false);
  const googleProofRequested = useRef(false);
  const googlePending = googleError === accountErrorCodes.pendingDeletion && !googleProofExpired;
  const cancel = useIdempotentMutation((ticket: string, key) => cancelAccountDeletion(ticket, key), { meta: { handlesError: true } });

  useEffect(() => {
    if (!googlePending || googleProofRequested.current) return;
    googleProofRequested.current = true;
    void getPendingDeletion().then(setPending).catch(() => { setGoogleProofExpired(true); setGoogleError(null); forgetLoginRedirectError(); });
  }, [googlePending]);

  useEffect(() => {
    if (returnUrl || pending || googlePending || startedOidc.current) return;
    startedOidc.current = true;
    if (redirectError && !googleProofExpired) carryLoginRedirectError(redirectError);
    const destination = homeOf(access);
    const returnTo = safeReturnUrl(searchParams.get("returnUrl"), destination);
    const returnAccess = accessOfPath(returnTo.split(/[?#]/u)[0] ?? returnTo);
    void auth.signinRedirect({
      state: { returnTo },
      extraQueryParams: {
        access: returnAccess === "platform" ? returnAccess : access,
        ...(searchParams.get("session") === "expired" ? { prompt: "login" } : {}),
      },
    });
  }, [access, auth, redirectError, returnUrl, searchParams, pending, googlePending, googleProofExpired]);

  useEffect(() => { if (returnUrl) forgetLoginRedirectError(); }, [returnUrl]);

  if (!returnUrl && !pending) return null;

  async function cancelDeletion() {
    if (!pending) return;
    setCancelFailure(null);
    try {
      const response = await cancel.mutateAsync(pending.cancelTicket);
      toast.success(t("deletion.cancelled"));
      completeLogin(response.returnUrl);
    } catch (caught) {
      const message = apiErrorMessage(caught, t);
      if (caught instanceof ApiError && caught.status >= 400 && caught.status < 500) {
        setPending(null); setGoogleProofExpired(true); setGoogleError(null); forgetLoginRedirectError(); backToEmail(); toastError(message);
      } else setCancelFailure(message);
    }
  }

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
    if (!step || !returnUrl) return;
    setError(null);
    try {
      const response = await verify.mutateAsync({ email: step.destination, code, returnUrl });
      completeLogin(response.returnUrl);
    } catch (caught) {
      if (!(caught instanceof ApiError)) throw caught;
      const deletion = pendingDeletionFromProblem(caught.problem);
      if (deletion) { setPending(deletion); return; }
      verifyRetry.startFromError(caught);
      if (caught.code === "Auth.LoginCode.Expired" || caught.code === "Auth.LoginCode.TooManyAttempts" || caught.code === "Identity.Account.LockedOut") {
        resendTimer.restart(0);
      }
      if (caught.code === "Identity.Account.LockedOut") setCode("");
      if (caught.code === "Tenancy.Access.PlatformOnly") setResult("platformOnly");
      else if (caught.code === "Tenancy.Access.NotMember") setResult("noBusiness");
      else if (caught.code === "Tenancy.Member.Inactive") { setError(caught); setResult("inactive"); }
      else if (isUnavailableCode(caught.code)) { setError(caught); setResult(caught.code); }
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
      resendRetry.startFromError(caught);
    }
  }

  const wrongCode = error?.code === "Auth.LoginCode.Invalid" || error?.code === "Auth.LoginCode.TooManyAttempts";
  const codeSpent = error?.code === "Auth.LoginCode.TooManyAttempts" || error?.code === "Identity.Account.LockedOut";
  const accountClosed = error?.code === "Identity.Account.Suspended";
  const organizationName = typeof error?.problem.organizationName === "string" ? error.problem.organizationName : "";
  const unavailable = isUnavailableCode(result) ? unavailableResults[result] : null;

  return <AuthLayout access={access}>
    {pending ? <PendingDeletionPanel pending={pending} onCancel={() => { void cancelDeletion(); }} busy={cancel.isPending} failure={cancelFailure} />
      : result === "platformOnly" ? <PlatformAccessResult access={access} onSignedOut={() => { backToEmail(); dismissGoogleError(); setPending(null); setCancelFailure(null); }} />
      : result === "noBusiness" ? <BusinessAccessResult status="noBusiness" />
        : result === "inactive" ? <BusinessAccessResult status="inactive" organizationName={organizationName} />
          : unavailable ? <AuthStatus icon={unavailable.icon} tone={unavailable.tone}
            title={t(`errors:errorPage.unavailable.${unavailable.title}`, { organizationName })}
            detail={t(`errors:errorPage.unavailable.${unavailable.description}`)}
            actions={<Button asChild size="lg"><Link to="/login">{t("login.enterAsPerson")}</Link></Button>} />
            : step === null ? <div className="flex flex-col gap-[22px]">
      <h1 className="text-[24px] leading-[1.2] font-bold tracking-[-0.02em]">{access === "business" ? t("login.businessTitle") : t("login.personalTitle")}</h1>
      {/* Tableros Ingreso y M-Ingreso («Tu sesión venció», .msj.info): la franja de los mensajes, en petróleo y con el reloj. */}
      {sessionExpired ? <FormError tone="info" icon={ClockIcon} message={t("login.sessionExpired")} /> : null}
      <GoogleButton mode="login" access={access} returnUrl={returnUrl!} />
      <div className="flex items-center gap-3 text-[13px] text-[var(--t3)]"><span className="h-px flex-1 bg-[var(--borde)]" /><span>{t("login.or")}</span><span className="h-px flex-1 bg-[var(--borde)]" /></div>
      <EmailCodeForm onCodeRequested={startCode} onSubmitStart={dismissGoogleError} notice={googleError ? { text: t("login.googleError"), details: [t("login.googleErrorHelp")] } : undefined} />
      <div className="flex flex-col gap-2">
        {access === "consumer" ? <>
          <AuthLinkRow>{t("login.noAccount")}<AuthLink to="/registro">{t("login.createOne")}</AuthLink></AuthLinkRow>
          <AuthLinkRow>{t("login.haveBusiness")}<AuthLink to={loginPathOf("business")}>{t("login.enterAsBusiness")}</AuthLink></AuthLinkRow>
        </> : <>
          <AuthLinkRow>{t("login.businessNotRegistered")}<AuthLink to="/registro/empresa">{t("login.registerIt")}</AuthLink></AuthLinkRow>
          <AuthLinkRow>{t("login.enterAsPersonQuestion")}<AuthLink to="/login">{t("login.enterHere")}</AuthLink></AuthLinkRow>
        </>}
      </div>
      <AuthLinkRow>{t("recovery.cannotSignIn")}<AuthLink to="/recuperar">{t("recovery.link")}</AuthLink></AuthLinkRow>
    </div> : <AuthCodeStep destination={step.destination} code={code} onBack={backToEmail}
      onCodeChange={(next) => { setCode(next); if (wrongCode) setError(null); }}
      onVerify={() => void submitCode()} onResend={() => void resendCode()}
      invalid={wrongCode} locked={verify.isPending || codeSpent || accountClosed}
      message={error ? loginCodeMessage(error, t) : null}
      verifyLabel={verifyRetry.label ?? undefined} verifyDisabled={verifyRetry.isRunning || codeSpent || accountClosed} verifyPending={verify.isPending}
      resendSeconds={accountClosed ? 0 : resendTimer.seconds} resendRetryLabel={accountClosed ? null : resendRetry.label}
      resendDisabled={accountClosed} resendPending={resend.isPending}
      footer={accountClosed ? <div className="flex justify-center"><Button type="button" variant="link" className="text-[13px] leading-[normal]" onClick={backToEmail}>{t("login.backToLogin")}</Button></div> : null} />}
  </AuthLayout>;
}
