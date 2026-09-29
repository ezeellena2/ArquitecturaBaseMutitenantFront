import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useAuth } from "react-oidc-context";
import { Trans, useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";
import { z } from "zod";
import { ChevronLeft, LockKeyhole } from "lucide-react";
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
import { OtpInput } from "@/shared/ui/OtpInput";
import { requestSignup, verifySignup } from "../api/signup";
import { GoogleButton } from "../components/GoogleButton";
import { loginCodeErrorKey } from "../errors";
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
  const returnTo = safeReturnUrl(searchParams.get("returnTo") ?? searchParams.get("returnUrl"), "/");
  const googleComplete = searchParams.get("google") === "complete";
  const startedOidc = useRef(false);
  const [step, setStep] = useState<{ email: string } | null>(null);
  const [closed, setClosed] = useState(searchParams.get("error") === "Auth.Signup.Closed");
  const [code, setCode] = useState("");
  const [error, setError] = useState<ApiError | null>(null);
  const { control, register, handleSubmit, setError: setFieldError, formState: { errors } } = useForm<SignupFields>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", acceptedTerms: false as true },
  });
  const acceptedTerms = useWatch({ control, name: "acceptedTerms" });
  const request = useIdempotentMutation((email: string, key) => requestSignup({ email, acceptedTerms: true, culture: effectiveCulture() ?? navigator.language, timeZoneId: browserTimeZone() }, key));
  const verify = useIdempotentMutation((input: { email: string; code: string; acceptedTerms: true }, key) => verifySignup({ ...input, culture: effectiveCulture() ?? navigator.language, timeZoneId: browserTimeZone() }, key));
  const resend = useCountdown(0);
  const retry = useRetryAfterCountdown();

  useEffect(() => {
    if (!googleComplete || startedOidc.current) return;
    startedOidc.current = true;
    void auth.signinRedirect({ extraQueryParams: { access: "consumer" }, state: { returnTo } });
  }, [auth, googleComplete, returnTo]);

  async function begin({ email }: SignupFields) {
    setError(null);
    try {
      const response = await request.mutateAsync(email);
      setStep({ email });
      setCode("");
      resend.restart(response.resendAfterSeconds);
    } catch (caught) {
      if (!(caught instanceof ApiError)) throw caught;
      if (caught.code === "Auth.Signup.Closed") { setClosed(true); return; }
      if (!applyApiErrorToForm(caught, setFieldError, { email: "email", acceptedTerms: "acceptedTerms" })) setError(caught);
      retry.startFromError(caught);
    }
  }

  async function verifyCode() {
    if (!step || code.length !== 6) return;
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

  const attemptsLeft = typeof error?.problem.attemptsLeft === "number" ? error.problem.attemptsLeft : null;

  if (googleComplete) return <SessionStatusPage status="starting" />;

  return <AuthLayout access="consumer">
    {closed ? <div className="flex flex-col items-center gap-[22px] text-center">
      <div aria-hidden="true" className="flex size-[52px] items-center justify-center rounded-full bg-[var(--s3)] text-[var(--t2)]"><LockKeyhole size={18} /></div>
      <div><h1 className="text-[22px] font-bold leading-tight">{t("signup.closedTitle")}</h1>
        <p className="mt-2 text-sm text-[var(--t2)]">{t("signup.closedDetail")}</p>
      </div>
      <Link to="/login" className="inline-flex h-10 w-full items-center justify-center rounded-[10px] bg-[var(--marca)] text-sm font-semibold text-[var(--lado-activo)]">{t("signup.backToLogin")}</Link>
    </div> : step === null ? <div className="flex flex-col gap-[22px]">
      <h1 className="text-[26px] font-bold leading-tight">{t("signup.title")}</h1>
      <form noValidate onSubmit={(event) => { void handleSubmit(begin)(event); }} className="flex flex-col gap-[22px]">
        <label className="flex items-start gap-2 text-[13px] text-[var(--t2)]">
          <input type="checkbox" {...register("acceptedTerms")} className="mt-0.5 size-4 accent-[var(--marca)]" />
          <span>{t("signup.acceptPrefix")} <Link to="/terminos" className="font-semibold text-[var(--marca)] hover:underline">{t("signup.terms")}</Link> {t("signup.acceptJoin")} <Link to="/privacidad" className="font-semibold text-[var(--marca)] hover:underline">{t("signup.privacy")}</Link></span>
        </label>
        {errors.acceptedTerms ? <p role="alert" className="text-[13px] text-[var(--peligro)]">{errors.acceptedTerms.message ?? t("signup.acceptRequired")}</p> : null}
        <GoogleButton mode="signup" acceptedTerms={acceptedTerms} returnTo={returnTo} />
        <div className="flex items-center gap-3 text-[13px] text-[var(--t3)]"><span className="h-px flex-1 bg-[var(--t3)]" /><span>{t("login.or")}</span><span className="h-px flex-1 bg-[var(--t3)]" /></div>
        <Controller control={control} name="email" render={({ field }) => <FormField label={t("login.emailLabel")} error={errors.email?.type === "server" ? errors.email.message : errors.email ? t("login.emailInvalid") : undefined}>
          <EmailField name={field.name} ref={field.ref} value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
        </FormField>} />
        <FormError message={error ? t(loginCodeErrorKey(error)) : null} />
        <Button type="submit" size="lg" className="w-full" disabled={!acceptedTerms || request.isPending || retry.isRunning}>{retry.label ?? t("signup.create")}</Button>
      </form>
      <div className="flex flex-col gap-2 text-center text-[13px] text-[var(--t2)]">
        <div>{t("signup.haveAccount")} <Link to="/login" className="font-semibold text-[var(--marca)] hover:underline">{t("signup.login")}</Link></div>
      </div>
    </div> : <div className="flex flex-col gap-[22px]">
      <button type="button" onClick={() => { setStep(null); setCode(""); setError(null); }} className="inline-flex items-center gap-1 self-start text-[13px] font-semibold text-[var(--marca)] hover:underline"><ChevronLeft size={16} aria-hidden="true" />{t("login.otherEmail")}</button>
      <div><h1 className="text-[26px] font-bold leading-tight">{t("login.checkEmail")}</h1>
        <p id="signup-code-hint" className="mt-2 text-[13px] text-[var(--t2)]"><Trans ns="auth" i18nKey="login.sentCode" values={{ email: step.email }} components={{ strong: <strong className="font-semibold text-[var(--t1)]" /> }} /></p>
      </div>
      <OtpInput length={6} value={code} onChange={(next) => { setCode(next); if (error?.code === "Auth.LoginCode.Invalid") setError(null); }} label={t("login.codeLabel")} invalid={error?.code === "Auth.LoginCode.Invalid"} disabled={verify.isPending} aria-describedby="signup-code-hint" />
      <FormError message={error ? <>{t(loginCodeErrorKey(error))}{attemptsLeft !== null ? <span className="block">{t("login.attemptsLeft", { count: attemptsLeft })}</span> : null}</> : null} />
      <div className="flex flex-col gap-2.5">
        <Button type="button" size="lg" onClick={() => void verifyCode()} disabled={code.length !== 6 || verify.isPending}>{t("signup.verify")}</Button>
        <Button type="button" size="lg" variant="outline" className="border-[var(--t3)]" onClick={() => void resendCode()} disabled={resend.isRunning || retry.isRunning || request.isPending}>
          {retry.label ?? (resend.isRunning ? t("login.resendIn", { seconds: resend.seconds }) : t("login.resendCode"))}
        </Button>
      </div>
    </div>}
  </AuthLayout>;
}
