import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useAuth } from "react-oidc-context";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useSearchParams } from "react-router";
import { emailFromNavigation } from "../lib/loginEmail";
import { z } from "zod";
import { LockIcon } from "@/shared/ui/icons";
import { AuthLayout } from "@/layouts/AuthLayout";
import { ApiError } from "@/shared/api/ApiError";
import { applyApiErrorToForm } from "@/shared/api/formErrors";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { useRetryAfterCountdown } from "@/shared/api/useRetryAfterCountdown";
import { useCountdown } from "@/shared/hooks/useCountdown";
import { Button } from "@/shared/ui/button";
import { FormError } from "@/shared/ui/FormError";
import { AuthDestinationField } from "../components/AuthDestinationField";
import { authDestinationSchema, destinationFromFields, destinationNavigationState, phoneFromNavigation, signupCodeOperation, signupCodeRequest, sameSignupCodeOperation, type SignupCodeOperation } from "../lib/authDestinationForm";
import { loginDestinationErrorField } from "../lib/loginDestination";
import type { LoginDestination } from "@/shared/api/types";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import { useHasLoginChannel } from "@/shared/account/useLoginChannels";
import { accountErrorCodes } from "@/shared/api/accountContract";
import { PlatformAccessResult } from "../components/PlatformAccessResult";
import { requestSignup, verifySignup } from "../api/signup";
import { AuthStatus } from "../components/AuthStatus";
import { AuthCodeStep } from "../components/AuthCodeStep";
import { AuthLink, AuthLinkRow } from "../components/AuthLink";
import { GoogleButton } from "../components/GoogleButton";
import { loginCodeErrorMessage, loginCodeMessage } from "../errors";
import { loginReturnUrl, safeReturnUrl } from "../lib/returnUrl";
import { SessionStatusPage } from "@/auth/SessionStatusPage";

function signupSchema(t: Parameters<typeof authDestinationSchema>[0]) {
  return authDestinationSchema(t).safeExtend({ acceptedTerms: z.boolean() });
}
type SignupFields = z.infer<ReturnType<typeof signupSchema>>;

const followAuthorize = (url: string) => globalThis.location.assign(url);

export function SignupPage({ completeAuthorization = followAuthorize }: { completeAuthorization?: (url: string) => void }) {
  const { t } = useTranslation("auth");
  const auth = useAuth();
  const schema = useMemo(() => signupSchema(t), [t]);
  const hasWhatsApp = useHasLoginChannel("whatsapp");
  const [platformOnly, setPlatformOnly] = useState(false);
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [emailTaken, setEmailTaken] = useState(false);
  const returnTo = safeReturnUrl(searchParams.get("returnTo") ?? searchParams.get("returnUrl"), "/");
  const originalReturn = loginReturnUrl(searchParams.get("returnUrl") ?? searchParams.get("returnTo"));
  // Se continúa la autorización original para conservar PKCE, state y el callback del subdominio que la inició.
  const authorizeReturn = originalReturn !== "/invitacion" ? originalReturn : undefined;
  const loginReturn = authorizeReturn ?? returnTo;
  const loginHref = loginReturn === "/" ? "/login" : `/login?${new URLSearchParams({ returnUrl: loginReturn })}`;
  const googleComplete = searchParams.get("google") === "complete";
  const startedOidc = useRef(false);
  const [journey, setJourney] = useState(0);
  const [step, setStep] = useState<LoginDestination | null>(null);
  const [closed, setClosed] = useState(searchParams.get("error") === "Auth.Signup.Closed");
  const [code, setCode] = useState("");
  const [error, setError] = useState<ApiError | null>(null);
  const { control, register, handleSubmit, getValues, setValue, setError: setFieldError, clearErrors, formState: { errors } } = useForm<SignupFields>({
    resolver: zodResolver(schema),
    defaultValues: { channel: phoneFromNavigation(location.state) ? "phone" : "email", phone: phoneFromNavigation(location.state), email: emailFromNavigation(location.state), acceptedTerms: false },
  });
  const acceptedTerms = useWatch({ control, name: "acceptedTerms" });
  const channel = useWatch({ control, name: "channel" });
  const email = useWatch({ control, name: "email" });
  const phone = useWatch({ control, name: "phone" });
  const request = useIdempotentMutation((operation: SignupCodeOperation, key) => requestSignup(signupCodeRequest(operation), key), { meta: { handlesError: true }, sameOperation: sameSignupCodeOperation });
  const verify = useIdempotentMutation((operation: SignupCodeOperation & { code: string }, key) => verifySignup({ ...signupCodeRequest(operation), code: operation.code }, key), { meta: { handlesError: true }, sameOperation: sameSignupCodeOperation });
  const resend = useCountdown(0);
  const retry = useRetryAfterCountdown();

  useEffect(() => {
    if (!googleComplete || startedOidc.current) return;
    startedOidc.current = true;
    if (authorizeReturn) completeAuthorization(authorizeReturn);
    else void auth.signinRedirect({ extraQueryParams: { access: "consumer" }, state: { returnTo } });
  }, [auth, authorizeReturn, completeAuthorization, googleComplete, returnTo]);

  // Como el tablero Registro: los botones no se apagan por los términos; sin la casilla, el aviso va debajo de ella.
  function requireTerms() {
    setFieldError("acceptedTerms", { type: "required", message: t("signup.acceptRequired") });
  }

  async function begin(values: SignupFields) {
    setError(null);
    setEmailTaken(false);
    if (values.channel === "phone" && !hasWhatsApp) return;
    const destination = destinationFromFields(values);
    try {
      const response = await request.mutateAsync(signupCodeOperation(destination, journey));
      setStep(destination);
      setCode("");
      resend.restart(response.resendAfterSeconds);
    } catch (caught) {
      if (!(caught instanceof ApiError)) throw caught;
      setEmailTaken(caught.code === "Auth.Signup.EmailTaken" || caught.code === accountErrorCodes.signupPhoneTaken);
      if (caught.code === "Auth.Signup.Closed") { setClosed(true); return; }
      if (loginDestinationErrorField(caught)) setFieldError("phone", { type: "server", message: apiErrorMessage(caught, t) });
      else if (!applyApiErrorToForm(caught, setFieldError, { email: "email", phone: "phone", acceptedTerms: "acceptedTerms" })) setError(caught);
      retry.startFromError(caught);
    }
  }

  async function verifyCode() {
    if (!step) return;
    setError(null);
    try {
      await verify.mutateAsync({ ...signupCodeOperation(step, journey), code });
      if (authorizeReturn) completeAuthorization(authorizeReturn);
      else await auth.signinRedirect({ extraQueryParams: { access: "consumer" }, state: { returnTo } });
    } catch (caught) {
      if (!(caught instanceof ApiError)) throw caught;
      if (caught.code === "Tenancy.Access.PlatformOnly") { setPlatformOnly(true); return; }
      if (caught.code === "Auth.Signup.Closed") { setClosed(true); return; }
      if (caught.code === "Auth.LoginCode.Expired" || caught.code === "Auth.LoginCode.TooManyAttempts") resend.restart(0);
      retry.startFromError(caught);
      setError(caught);
    }
  }

  async function resendCode() {
    if (!step) return;
    setError(null);
    try {
      const response = await request.mutateAsync(signupCodeOperation(step, journey));
      setCode("");
      resend.restart(response.resendAfterSeconds);
    } catch (caught) {
      if (!(caught instanceof ApiError)) throw caught;
      if (caught.code === "Auth.Signup.Closed") { setClosed(true); return; }
      setError(caught);
      retry.startFromError(caught);
    }
  }

  if (googleComplete) return <SessionStatusPage status="starting" />;

  return <AuthLayout access="consumer">
    {platformOnly ? <PlatformAccessResult access="consumer" onSignedOut={() => { setPlatformOnly(false); setStep(null); setCode(""); setError(null); setValue("channel", "email"); setValue("email", ""); setValue("phone", null); setValue("acceptedTerms", false); }} /> : closed ? <AuthStatus icon={LockIcon} title={t("signup.closedTitle")} detail={t("signup.closedDetail")}
      actions={<Button asChild size="lg"><Link to={loginHref}>{t("signup.backToLogin")}</Link></Button>} />
      : step === null ? <div className="flex flex-col gap-[22px]">
      <h1 className="text-[24px] leading-[1.2] font-bold tracking-[-0.02em]">{t("signup.title")}</h1>
      <label className="flex items-center gap-2.5 text-[14px] text-[var(--t1)]">
        <input type="checkbox" {...register("acceptedTerms", { onChange: () => clearErrors("acceptedTerms") })} className="size-[18px] shrink-0 accent-[var(--marca)]" />
        <span>{t("signup.acceptPrefix")} <AuthLink to="/terminos">{t("signup.terms")}</AuthLink> {t("signup.acceptJoin")} <AuthLink to="/privacidad">{t("signup.privacy")}</AuthLink></span>
      </label>
      {errors.acceptedTerms ? <p role="alert" className="text-[13px] text-[var(--peligro)]">{errors.acceptedTerms.message ?? t("signup.acceptRequired")}</p> : null}
      <GoogleButton mode="signup" acceptedTerms={acceptedTerms} onTermsRequired={requireTerms} returnTo={authorizeReturn ?? returnTo} />
      <div className="flex items-center gap-3 text-[13px] text-[var(--t3)]"><span className="h-px flex-1 bg-[var(--borde)]" /><span>{t("login.or")}</span><span className="h-px flex-1 bg-[var(--borde)]" /></div>
      <form noValidate onSubmit={(event) => {
        if (!acceptedTerms) { event.preventDefault(); requireTerms(); return; }
        void handleSubmit(begin)(event);
      }} className="flex flex-col gap-[22px]">
        <div className="flex flex-col gap-1.5">
          <AuthDestinationField phoneLabel={t("signup.phoneLabel")} channel={channel} email={email} phone={phone}
            onChannelChange={(value) => { setJourney((previous) => previous + 1); setValue("channel", value); clearErrors(); setEmailTaken(false); setError(null); }}
            onEmailChange={(value) => { setValue("email", value); clearErrors("email"); setEmailTaken(false); }}
            onPhoneChange={(value) => { setValue("phone", value); clearErrors("phone"); setEmailTaken(false); }}
            error={channel === "phone" && hasWhatsApp ? errors.phone?.message : errors.email?.message} />
          {emailTaken ? <AuthLink className="self-start text-[14px]!" to={loginHref} state={destinationNavigationState(destinationFromFields(getValues()))}>{t("signup.enter")}</AuthLink> : null}
        </div>
        <FormError message={error ? loginCodeErrorMessage(error, t) : null} />
        <Button type="submit" size="lg" className="w-full" disabled={retry.isRunning} pending={request.isPending} pendingLabel={t("common:code.sending")}>{retry.label ?? t("signup.create")}</Button>
      </form>
      {/* Tablero Registro: los dos enlaces a 22 entre sí, como el resto de la columna (en Ingreso van a 8). */}
      <div className="flex flex-col gap-[22px]">
        <AuthLinkRow>{t("signup.haveAccount")}<AuthLink to={loginHref}>{t("signup.login")}</AuthLink></AuthLinkRow>
        <AuthLinkRow>{t("login.haveBusiness")}<AuthLink to="/registro/empresa">{t("login.registerIt")}</AuthLink></AuthLinkRow>
      </div>
    </div> : <AuthCodeStep destination={step.type === "email" ? step.email : ""} phone={step.type === "phone" ? step.phone : undefined} code={code} onBack={() => { setJourney((previous) => previous + 1); setStep(null); setCode(""); setError(null); }}
      onCodeChange={(next) => { setCode(next); if (error?.code === "Auth.LoginCode.Invalid") setError(null); }}
      onVerify={() => void verifyCode()} onResend={() => void resendCode()}
      invalid={error?.code === "Auth.LoginCode.Invalid"} locked={verify.isPending} message={error ? loginCodeMessage(error, t) : null}
      verifyLabel={retry.label ?? t("signup.verify")} verifyDisabled={retry.isRunning || error?.code === "Auth.LoginCode.TooManyAttempts" || error?.code === "Identity.Account.LockedOut"} verifyPending={verify.isPending}
      resendSeconds={resend.seconds} resendRetryLabel={retry.label} resendPending={request.isPending} />}
  </AuthLayout>;
}
