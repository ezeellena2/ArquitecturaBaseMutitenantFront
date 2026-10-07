import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
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
import { FormField } from "@/shared/ui/FormField";
import { EmailField } from "@/shared/ui/fields/EmailField";
import { requestSignup, verifySignup } from "../api/signup";
import { AuthStatus } from "../components/AuthStatus";
import { AuthCodeStep } from "../components/AuthCodeStep";
import { AuthLink, AuthLinkRow } from "../components/AuthLink";
import { GoogleButton } from "../components/GoogleButton";
import { loginCodeErrorKey, loginCodeMessage } from "../errors";
import { safeReturnUrl } from "../lib/returnUrl";
import { SessionStatusPage } from "@/auth/SessionStatusPage";
import { effectiveCulture } from "@/shared/i18n";
import { browserTimeZone } from "@/shared/time/browserTimeZone";

const schema = z.object({ email: z.email(), acceptedTerms: z.literal(true) });
type SignupFields = z.infer<typeof schema>;

export function SignupPage() {
  const { t } = useTranslation("auth");
  const auth = useAuth();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [emailTaken, setEmailTaken] = useState(false);
  const returnTo = safeReturnUrl(searchParams.get("returnTo") ?? searchParams.get("returnUrl"), "/");
  const googleComplete = searchParams.get("google") === "complete";
  const startedOidc = useRef(false);
  const [step, setStep] = useState<{ email: string } | null>(null);
  const [closed, setClosed] = useState(searchParams.get("error") === "Auth.Signup.Closed");
  const [code, setCode] = useState("");
  const [error, setError] = useState<ApiError | null>(null);
  const { control, register, handleSubmit, getValues, setError: setFieldError, clearErrors, formState: { errors } } = useForm<SignupFields>({
    resolver: zodResolver(schema),
    defaultValues: { email: emailFromNavigation(location.state), acceptedTerms: false as true },
  });
  const acceptedTerms = useWatch({ control, name: "acceptedTerms" });
  const request = useIdempotentMutation((email: string, key) => requestSignup({ email, acceptedTerms: true, culture: effectiveCulture() ?? navigator.language, timeZoneId: browserTimeZone() }, key), { meta: { handlesError: true } });
  const verify = useIdempotentMutation((input: { email: string; code: string; acceptedTerms: true }, key) => verifySignup({ ...input, culture: effectiveCulture() ?? navigator.language, timeZoneId: browserTimeZone() }, key), { meta: { handlesError: true } });
  const resend = useCountdown(0);
  const retry = useRetryAfterCountdown();

  useEffect(() => {
    if (!googleComplete || startedOidc.current) return;
    startedOidc.current = true;
    void auth.signinRedirect({ extraQueryParams: { access: "consumer" }, state: { returnTo } });
  }, [auth, googleComplete, returnTo]);

  // Como el tablero Registro: los botones no se apagan por los términos; sin la casilla, el aviso va debajo de ella.
  function requireTerms() {
    setFieldError("acceptedTerms", { type: "required", message: t("signup.acceptRequired") });
  }

  async function begin({ email }: SignupFields) {
    setError(null);
    setEmailTaken(false);
    try {
      const response = await request.mutateAsync(email);
      setStep({ email });
      setCode("");
      resend.restart(response.resendAfterSeconds);
    } catch (caught) {
      if (!(caught instanceof ApiError)) throw caught;
      setEmailTaken(caught.code === "Auth.Signup.EmailTaken");
      if (caught.code === "Auth.Signup.Closed") { setClosed(true); return; }
      if (!applyApiErrorToForm(caught, setFieldError, { email: "email", acceptedTerms: "acceptedTerms" })) setError(caught);
      retry.startFromError(caught);
    }
  }

  async function verifyCode() {
    if (!step) return;
    setError(null);
    try {
      await verify.mutateAsync({ email: step.email, code, acceptedTerms: true });
      await auth.signinRedirect({ extraQueryParams: { access: "consumer" }, state: { returnTo } });
    } catch (caught) {
      if (!(caught instanceof ApiError)) throw caught;
      setError(caught);
    }
  }

  async function resendCode() {
    if (!step) return;
    setError(null);
    try {
      const response = await request.mutateAsync(step.email);
      setCode("");
      resend.restart(response.resendAfterSeconds);
    } catch (caught) {
      if (!(caught instanceof ApiError)) throw caught;
      setError(caught);
      retry.startFromError(caught);
    }
  }

  if (googleComplete) return <SessionStatusPage status="starting" />;

  return <AuthLayout access="consumer">
    {closed ? <AuthStatus icon={LockIcon} title={t("signup.closedTitle")} detail={t("signup.closedDetail")}
      actions={<Button asChild size="lg"><Link to="/login">{t("signup.backToLogin")}</Link></Button>} />
      : step === null ? <div className="flex flex-col gap-[22px]">
      <h1 className="text-[24px] leading-[1.2] font-bold tracking-[-0.02em]">{t("signup.title")}</h1>
      <label className="flex items-center gap-2.5 text-[14px] text-[var(--t1)]">
        <input type="checkbox" {...register("acceptedTerms", { onChange: () => clearErrors("acceptedTerms") })} className="size-[18px] shrink-0 accent-[var(--marca)]" />
        <span>{t("signup.acceptPrefix")} <AuthLink to="/terminos">{t("signup.terms")}</AuthLink> {t("signup.acceptJoin")} <AuthLink to="/privacidad">{t("signup.privacy")}</AuthLink></span>
      </label>
      {errors.acceptedTerms ? <p role="alert" className="text-[13px] text-[var(--peligro)]">{errors.acceptedTerms.message ?? t("signup.acceptRequired")}</p> : null}
      <GoogleButton mode="signup" acceptedTerms={acceptedTerms} onTermsRequired={requireTerms} returnTo={returnTo} />
      <div className="flex items-center gap-3 text-[13px] text-[var(--t3)]"><span className="h-px flex-1 bg-[var(--borde)]" /><span>{t("login.or")}</span><span className="h-px flex-1 bg-[var(--borde)]" /></div>
      <form noValidate onSubmit={(event) => {
        if (!acceptedTerms) { event.preventDefault(); requireTerms(); return; }
        void handleSubmit(begin)(event);
      }} className="flex flex-col gap-[22px]">
        <div className="flex flex-col gap-1.5">
          <Controller control={control} name="email" render={({ field }) => <FormField label={t("login.emailLabel")} variant="auth" error={errors.email?.type === "server" ? errors.email.message : errors.email ? t("login.emailInvalid") : undefined}>
            <EmailField name={field.name} ref={field.ref} value={field.value} onChange={(value) => { field.onChange(value); clearErrors("email"); setEmailTaken(false); }} onBlur={field.onBlur} />
          </FormField>} />
          {emailTaken && errors.email ? <AuthLink className="self-start text-[14px]!" to="/login" state={{ email: getValues("email") }}>{t("signup.enter")}</AuthLink> : null}
        </div>
        <FormError message={error ? t(loginCodeErrorKey(error)) : null} />
        <Button type="submit" size="lg" className="w-full" disabled={retry.isRunning} pending={request.isPending} pendingLabel={t("common:code.sending")}>{retry.label ?? t("signup.create")}</Button>
      </form>
      {/* Tablero Registro: los dos enlaces a 22 entre sí, como el resto de la columna (en Ingreso van a 8). */}
      <div className="flex flex-col gap-[22px]">
        <AuthLinkRow>{t("signup.haveAccount")}<AuthLink to="/login">{t("signup.login")}</AuthLink></AuthLinkRow>
        <AuthLinkRow>{t("login.haveBusiness")}<AuthLink to="/registro/empresa">{t("login.registerIt")}</AuthLink></AuthLinkRow>
      </div>
    </div> : <AuthCodeStep destination={step.email} code={code} onBack={() => { setStep(null); setCode(""); setError(null); }}
      onCodeChange={(next) => { setCode(next); if (error?.code === "Auth.LoginCode.Invalid") setError(null); }}
      onVerify={() => void verifyCode()} onResend={() => void resendCode()}
      invalid={error?.code === "Auth.LoginCode.Invalid"} locked={verify.isPending} message={error ? loginCodeMessage(error, t) : null}
      verifyLabel={t("signup.verify")} verifyPending={verify.isPending}
      resendSeconds={resend.seconds} resendRetryLabel={retry.label} resendPending={request.isPending} />}
  </AuthLayout>;
}
