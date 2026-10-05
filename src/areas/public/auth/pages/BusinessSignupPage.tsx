import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { useEffect, useMemo, useState } from "react";
import { Controller, useController, useForm, useWatch } from "react-hook-form";
import { useAuth } from "react-oidc-context";
import { Trans, useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";
import { Check } from "lucide-react";
import { z } from "zod";
import { ClockIcon, LockIcon } from "@/shared/ui/icons";
import { AuthLayout } from "@/layouts/AuthLayout";
import { ApiError } from "@/shared/api/ApiError";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { useRetryAfterCountdown } from "@/shared/api/useRetryAfterCountdown";
import { useCountdown } from "@/shared/hooks/useCountdown";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { Button } from "@/shared/ui/button";
import { FormError } from "@/shared/ui/FormError";
import { FormField } from "@/shared/ui/FormField";
import { EmailField } from "@/shared/ui/fields/EmailField";
import { cn } from "@/shared/lib/utils";
import { Input } from "@/shared/ui/input";
import { isValidTaxId } from "@/shared/ui/fields/TaxIdField";
import type { TaxIdTypeReference } from "@/shared/referenceData/referenceData";
import { useCuitType } from "@/shared/referenceData/useCuitType";
import { effectiveCulture } from "@/shared/i18n";
import { browserTimeZone } from "@/shared/time/browserTimeZone";
import { getGoogleSignupAntiforgery, googleSignupAntiforgeryQueryKey } from "../api/googleSignup";
import {
  checkBusinessSlug,
  createBusinessOrganization,
  requestBusinessSignupCode,
  verifyBusinessSignupCode,
} from "../api/businessSignup";
import { AuthStatus } from "../components/AuthStatus";
import { AuthCodeStep } from "../components/AuthCodeStep";
import { AuthLink, AuthLinkRow } from "../components/AuthLink";
import { AuthMessage } from "../components/AuthMessage";
import { GoogleButton } from "../components/GoogleButton";
import { businessSignupErrorField, loginCodeErrorKey, loginCodeMessage } from "../errors";
import { homeOf, loginPathOf } from "@/tenancy/access";

type Step = "email" | "code" | "details" | "success" | "approval" | "closed";

/// El correo, como el registro de personas: sin la casilla, la aceptación se pide antes de revisar el correo.
function emailFormSchema(t: TFunction) {
  return z.object({ email: z.string().trim().pipe(z.email(t("login.emailInvalid"))), acceptedTerms: z.boolean() });
}

/// «Tu organización»: lo obligatorio dice qué falta y el CUIT, que es opcional, se revisa con su tipo del catálogo.
function organizationFormSchema(t: TFunction, cuitType: TaxIdTypeReference | undefined) {
  return z.object({
    organizationName: z.string().trim().min(1, t("businessSignup.organizationRequired")),
    slug: z.string().min(1, t("businessSignup.slugInvalid")),
    firstCompanyName: z.string().trim().min(1, t("businessSignup.companyRequired")),
    taxNumber: z.string().refine((value) => value === "" || (cuitType !== undefined && isValidTaxId(cuitType, value)), t("businessSignup.taxIdInvalid")),
  });
}

type EmailForm = z.input<ReturnType<typeof emailFormSchema>>;
type EmailValues = z.output<ReturnType<typeof emailFormSchema>>;
type OrganizationForm = z.input<ReturnType<typeof organizationFormSchema>>;
type OrganizationValues = z.output<ReturnType<typeof organizationFormSchema>>;

/// «Registrá tu empresa» (tableros Registro-Empresa y M-Registro-Empresa): el correo y «Tu organización» con React Hook
/// Form y zod, como el editor de Roles; el código, con el paso común del ingreso (`AuthCodeStep`).
export function BusinessSignupPage() {
  const { t } = useTranslation("auth");
  const auth = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [step, setStep] = useState<Step>(auth.isAuthenticated ? "details" : "email");
  // El correo al que mandamos el código y, después, el que dice la API para avisar la aprobación: con Google o con sesión
  // no se escribió ninguno.
  const [email, setEmail] = useState("");
  const [notificationEmail, setNotificationEmail] = useState("");
  const [code, setCode] = useState("");
  const [requestError, setRequestError] = useState<ApiError | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  // El tope llega en el 409 (limit) para decir «Llegaste al límite de N organizaciones propias».
  const [limitCount, setLimitCount] = useState<number | null>(null);
  const resend = useCountdown(0);
  const retry = useRetryAfterCountdown();
  const googleComplete = searchParams.get("google") === "complete";
  const closedByCallback = searchParams.get("error") === "Auth.BusinessSignup.Closed";
  const cuitType = useCuitType();
  const emailSchema = useMemo(() => emailFormSchema(t), [t]);
  const organizationSchema = useMemo(() => organizationFormSchema(t, cuitType), [t, cuitType]);
  const emailForm = useForm<EmailForm, unknown, EmailValues>({ resolver: zodResolver(emailSchema), defaultValues: { email: "", acceptedTerms: auth.isAuthenticated } });
  const organizationForm = useForm<OrganizationForm, unknown, OrganizationValues>({
    resolver: zodResolver(organizationSchema), defaultValues: { organizationName: "", slug: "", firstCompanyName: "", taxNumber: "" },
  });
  const acceptedTerms = useWatch({ control: emailForm.control, name: "acceptedTerms" });
  const organizationName = useWatch({ control: organizationForm.control, name: "organizationName" });
  const slugField = useController({ control: organizationForm.control, name: "slug" });
  const taxNumberField = useController({ control: organizationForm.control, name: "taxNumber" });
  const slug = slugField.field.value;
  const slugToCheck = useDebouncedValue(slug.trim().toLowerCase());

  const requestCode = useIdempotentMutation((destination: string, key) => requestBusinessSignupCode({
    email: destination,
    acceptedTerms: true,
    culture: effectiveCulture() ?? navigator.language,
    timeZoneId: browserTimeZone(),
  }, key), { meta: { handlesError: true } });
  const verifyCode = useIdempotentMutation((input: { email: string; code: string }, key) => verifyBusinessSignupCode({
    ...input,
    acceptedTerms: true,
    culture: effectiveCulture() ?? navigator.language,
    timeZoneId: browserTimeZone(),
  }, key), { meta: { handlesError: true } });
  const antiforgery = useQuery({ queryKey: googleSignupAntiforgeryQueryKey,
    queryFn: getGoogleSignupAntiforgery, enabled: step === "details", meta: { silent: true } });
  const slugQuery = useQuery({ queryKey: ["business-signup", "slug", slugToCheck],
    queryFn: () => checkBusinessSlug(slugToCheck), enabled: step === "details" && slugToCheck !== "",
    retry: false, staleTime: 0 });
  const createMutation = useIdempotentMutation((input: {
    organizationName: string; slug: string; firstCompanyName: string; taxNumber: string;
  }, key) => createBusinessOrganization({
    organizationName: input.organizationName,
    slug: input.slug,
    firstCompanyName: input.firstCompanyName,
    taxId: input.taxNumber ? { type: cuitType?.code ?? "", number: input.taxNumber } : null,
    acceptedTerms: true,
  }, key, antiforgery.data?.requestToken ?? ""), { meta: { handlesError: true } });

  useEffect(() => {
    if (auth.isAuthenticated && step === "email") {
      setStep("details");
      emailForm.setValue("acceptedTerms", true);
    }
  }, [auth.isAuthenticated, step, emailForm]);

  useEffect(() => {
    if (!googleComplete) return;
    emailForm.setValue("acceptedTerms", true);
    setStep("details");
    const next = new URLSearchParams(searchParams);
    next.delete("google");
    setSearchParams(next, { replace: true });
  }, [googleComplete, searchParams, setSearchParams, emailForm]);

  useEffect(() => {
    if (closedByCallback) setStep("closed");
  }, [closedByCallback]);

  const slugAvailability = slugQuery.data?.availability;
  const slugMatchesInput = slugToCheck === slug.trim().toLowerCase();
  const slugError = organizationForm.formState.errors.slug?.message;
  const slugAvailable = slug !== "" && slugMatchesInput && slugAvailability === "Available" && !slugError;
  const canCreate = acceptedTerms && Boolean(antiforgery.data?.requestToken) && !createMutation.isPending;

  // Como el tablero Registro-Empresa: los botones no se apagan por los términos; sin la casilla, el aviso va debajo de ella.
  function requireTerms() {
    emailForm.setError("acceptedTerms", { type: "required", message: t("businessSignup.acceptRequired") });
  }

  const sendCode = emailForm.handleSubmit((values) => {
    setRequestError(null);
    requestCode.mutate(values.email, {
      onSuccess: (response) => {
        setEmail(values.email);
        setCode("");
        resend.restart(response.resendAfterSeconds);
        setStep("code");
      },
      onError: (caught) => {
        if (!(caught instanceof ApiError)) throw caught;
        if (caught.code === "Auth.BusinessSignup.Closed") { setStep("closed"); return; }
        setRequestError(caught);
        retry.startFromError(caught);
      },
    });
  });

  function confirmCode() {
    setRequestError(null);
    verifyCode.mutate({ email, code }, {
      onSuccess: () => setStep("details"),
      onError: (caught) => {
        if (!(caught instanceof ApiError)) throw caught;
        if (caught.code === "Auth.BusinessSignup.Closed") { setStep("closed"); return; }
        setRequestError(caught);
      },
    });
  }

  function resendCode() {
    setRequestError(null);
    requestCode.mutate(email, {
      onSuccess: (response) => {
        setCode("");
        resend.restart(response.resendAfterSeconds);
      },
      onError: (caught) => {
        if (!(caught instanceof ApiError)) throw caught;
        if (caught.code === "Auth.BusinessSignup.Closed") { setStep("closed"); return; }
        setRequestError(caught);
        retry.startFromError(caught);
      },
    });
  }

  function createRejected(caught: unknown) {
    if (!(caught instanceof ApiError)) throw caught;
    if (caught.code === "Auth.BusinessSignup.Closed") { setStep("closed"); return; }
    if (caught.code === "Tenancy.Organization.LimitReached") {
      setLimitCount(typeof caught.problem.limit === "number" ? caught.problem.limit : null);
      setLimitReached(true);
      return;
    }
    const rejected = businessSignupErrorField(caught);
    if (rejected) organizationForm.setError(rejected.field, { type: "server", message: t(rejected.key) });
    else setRequestError(caught);
  }

  // La dirección tiene que estar libre: mientras se revisa no se crea, y si está reservada o tomada, el campo lo dice.
  const submitOrganization = organizationForm.handleSubmit((values) => {
    if (!slugAvailable) {
      if (slugAvailability === "Reserved") organizationForm.setError("slug", { type: "server", message: t("businessSignup.slugReserved") });
      else if (slugAvailability === "Taken") organizationForm.setError("slug", { type: "server", message: t("businessSignup.slugTaken") });
      return;
    }
    if (!canCreate) return;
    setRequestError(null);
    setLimitReached(false);
    createMutation.mutate({ organizationName: values.organizationName, slug: slugToCheck, firstCompanyName: values.firstCompanyName, taxNumber: values.taxNumber }, {
      onSuccess: (response) => {
        setNotificationEmail(response.notificationEmail ?? email);
        setStep(response.requiresApproval ? "approval" : "success");
      },
      onError: createRejected,
    });
  });

  async function enterOrganization() {
    await auth.signinRedirect({ extraQueryParams: { access: "business" }, state: { returnTo: homeOf("business") } });
  }

  const requestErrorText = requestError
    ? requestError.code?.startsWith("Auth.LoginCode.") ? t(loginCodeErrorKey(requestError))
      : t("businessSignup.serverError")
    : null;
  // El paso del código dice lo mismo que el del ingreso: el texto y los intentos que quedan.
  const codeMessage = requestError
    ? requestError.code?.startsWith("Auth.LoginCode.") ? loginCodeMessage(requestError, t) : { text: t("businessSignup.serverError") }
    : null;
  const termsError = emailForm.formState.errors.acceptedTerms?.message;
  const { errors } = organizationForm.formState;

  return <AuthLayout access="business" panelIntro={t("businessSignup.panelIntro")}>
    {step === "closed" ? <AuthStatus icon={LockIcon} title={t("businessSignup.closedTitle")} detail={t("businessSignup.closedDetail")}
      actions={<Button asChild variant="outline" size="lg"><Link to="/">{t("businessSignup.backHome")}</Link></Button>} />
      : step === "success" ? <AuthStatus icon={Check} tone="ok" title={t("businessSignup.doneTitle", { organization: organizationName.trim() })}
        detail={t("businessSignup.doneDetail")}
        actions={<Button type="button" size="lg" onClick={() => void enterOrganization()}>{t("businessSignup.openOrganization", { organization: organizationName.trim() })}</Button>} />
        : step === "approval" ? <AuthStatus icon={ClockIcon} tone="warning" title={t("businessSignup.approvalTitle")}
          detail={<Trans ns="auth" i18nKey="businessSignup.approvalDetail" values={{ organization: organizationName.trim(), email: notificationEmail }} components={{ strong: <strong className="font-semibold text-[var(--t1)]" /> }} />}
          actions={<Button asChild variant="outline" size="lg"><Link to="/">{t("businessSignup.backHome")}</Link></Button>} />
          : step === "email" ? <section className="flex flex-col gap-[22px]">
            <h1 className="text-[24px] leading-[1.2] font-bold tracking-[-0.02em]">{t("businessSignup.title")}</h1>
            <form noValidate className="flex flex-col gap-[22px]" onSubmit={(event) => {
              if (!acceptedTerms) { event.preventDefault(); requireTerms(); return; }
              void sendCode(event);
            }}>
              <label className="flex items-center gap-2.5 text-[14px] text-[var(--t1)]">
                <input type="checkbox" {...emailForm.register("acceptedTerms", { onChange: () => emailForm.clearErrors("acceptedTerms") })}
                  className="size-[18px] shrink-0 accent-[var(--marca)]" />
                <span>{t("businessSignup.accept")} <AuthLink to="/terminos">{t("businessSignup.terms")}</AuthLink> {t("businessSignup.join")} <AuthLink to="/privacidad">{t("businessSignup.privacy")}</AuthLink></span>
              </label>
              {termsError ? <p role="alert" className="-mt-4 text-[13px] text-[var(--peligro)]">{termsError}</p> : null}
              <GoogleButton mode="signup" access="business" acceptedTerms={acceptedTerms} onTermsRequired={requireTerms} returnTo="/registro/empresa" />
              <div className="flex items-center gap-3 text-[13px] text-[var(--t3)]"><span className="h-px flex-1 bg-[var(--borde)]" /><span>{t("businessSignup.or")}</span><span className="h-px flex-1 bg-[var(--borde)]" /></div>
              <Controller control={emailForm.control} name="email" render={({ field }) => <FormField label={t("businessSignup.email")} variant="auth" error={emailForm.formState.errors.email?.message}>
                <EmailField name={field.name} ref={field.ref} value={field.value} onBlur={field.onBlur} onChange={(value) => field.onChange(value ?? "")} />
              </FormField>} />
              <FormError message={requestErrorText} />
              <Button type="submit" size="lg" className="w-full" disabled={retry.isRunning} pending={requestCode.isPending} pendingLabel={t("common:code.sending")}>{retry.label ?? t("businessSignup.continue")}</Button>
            </form>
            <AuthLinkRow>{t("businessSignup.alreadyRegistered")}<AuthLink to={loginPathOf("business")}>{t("businessSignup.loginBusiness")}</AuthLink></AuthLinkRow>
          </section>
            : step === "code" ? <AuthCodeStep destination={email} code={code} onBack={() => { setStep("email"); setCode(""); setRequestError(null); }}
              onCodeChange={(next) => { setCode(next); setRequestError(null); }} onVerify={confirmCode} onResend={resendCode}
              invalid={requestError?.code === "Auth.LoginCode.Invalid"} locked={verifyCode.isPending} message={codeMessage}
              verifyPending={verifyCode.isPending} resendSeconds={resend.seconds} resendRetryLabel={retry.label} resendPending={requestCode.isPending} />
              : <form noValidate className="flex flex-col gap-[22px]" onSubmit={(event) => { void submitOrganization(event); }}>
                <div><h1 className="text-[24px] leading-[1.2] font-bold tracking-[-0.02em]">{t("businessSignup.organizationTitle")}</h1>
                  <p className="mt-1.5 text-sm leading-normal text-[var(--t2)]">{t("businessSignup.ownerNote")}</p></div>
                <AuthMessage message={limitReached ? { text: limitCount === null ? t("businessSignup.limitTitleNoCount") : t("businessSignup.limitTitle", { count: limitCount }),
                  details: [t("businessSignup.limitDetail")] } : null} />
                <FormField label={t("businessSignup.organizationName")} variant="auth" required error={errors.organizationName?.message}>
                  <Input {...organizationForm.register("organizationName", { onChange: () => setLimitReached(false) })} autoComplete="organization" maxLength={120} />
                </FormField>
                <FormField label={t("businessSignup.pageAddress")} variant="auth" required
                  error={slugError
                    ?? (slugAvailability === "Reserved" ? t("businessSignup.slugReserved")
                      : slugAvailability === "Taken" ? t("businessSignup.slugTaken")
                        : slugQuery.isError ? t("businessSignup.slugInvalid") : undefined)}>
                  <SlugInput suffix={t("businessSignup.domainSuffix")} name={slugField.field.name} value={slug} onBlur={slugField.field.onBlur}
                    onChange={(event) => { slugField.field.onChange(event.target.value.trim().toLowerCase()); setLimitReached(false); }}
                    autoComplete="off" spellCheck={false} />
                </FormField>
                {/* Vacío no deja hueco: compensa los 22 px de la columna, porque el tablero no deja espacio bajo la dirección. */}
                <div className="-mt-[22px] text-[12px] [&:not(:empty)]:pt-1.5" aria-live="polite">
                  {slug !== "" && !slugMatchesInput ? <span className="text-[var(--t3)]">{t("common:states.loading")}</span>
                    : slugAvailability === "Available" && !slugError ? <span role="status" className="inline-flex items-center gap-1 text-[var(--ok)]"><Check size={14} />{t("businessSignup.slugAvailable")}</span> : null}
                </div>
                <FormField label={t("businessSignup.firstCompany")} variant="auth" required error={errors.firstCompanyName?.message}>
                  <Input {...organizationForm.register("firstCompanyName")} autoComplete="organization" maxLength={120} />
                </FormField>
                <FormField label={t("businessSignup.taxId")} variant="auth" error={errors.taxNumber?.message}>
                  <Input name={taxNumberField.field.name} value={taxNumberField.field.value} onBlur={taxNumberField.field.onBlur}
                    onChange={(event) => taxNumberField.field.onChange(event.target.value.replace(/\D/g, "").slice(0, 11))}
                    inputMode="numeric" autoComplete="off" placeholder="30-12345678-1" maxLength={11} />
                </FormField>
                <FormError message={requestErrorText} />
                {/* «Criterio · Botones»: no se apaga por lo escrito (los términos ya se aceptaron en el primer paso); solo
                    mientras carga la protección del envío. */}
                <Button type="submit" size="lg" className="w-full" disabled={!antiforgery.data?.requestToken} pending={createMutation.isPending} pendingLabel={t("businessSignup.creating")}>{t("businessSignup.create")}</Button>
              </form>}
  </AuthLayout>;

}

// Tablero Registro-Empresa (.in-pre, lienzo v104): 44 de alto con radio 10, en la compu y en el teléfono. El dominio va en
// una caja gris aparte, pegada al campo, con la letra del campo (15). El texto ocupa todo el alto de la caja, sin el alto
// ni el radio que `Input` toma en el teléfono.
function SlugInput({ suffix, className, ...inputProps }: React.ComponentProps<"input"> & { suffix: string }) {
  return <div className="flex h-11 items-stretch overflow-hidden rounded-[10px] border border-[var(--borde2)] bg-[var(--lado-activo)] focus-within:border-[var(--marca)] focus-within:ring-[3px] focus-within:ring-[var(--foco-halo)]">
    <Input {...inputProps} className={cn(className, "h-full min-w-0 flex-1 rounded-none border-0 shadow-none focus-visible:ring-0 max-md:h-full max-md:rounded-none")} />
    <span data-slug-suffix className="flex shrink-0 items-center border-l border-[var(--borde)] bg-[var(--s2)] px-3 text-[15px] text-[var(--t2)]">{suffix}</span>
  </div>;
}
