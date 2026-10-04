import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "react-oidc-context";
import { Trans, useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";
import { Check, ChevronLeft, CircleAlert, Clock3, LockKeyhole } from "lucide-react";
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
import { Input } from "@/shared/ui/input";
import { isValidTaxId } from "@/shared/ui/fields/TaxIdField";
import { OtpInput } from "@/shared/ui/OtpInput";
import { useReferenceData } from "@/shared/referenceData/useReferenceData";
import { effectiveCulture } from "@/shared/i18n";
import { browserTimeZone } from "@/shared/time/browserTimeZone";
import { getGoogleSignupAntiforgery, googleSignupAntiforgeryQueryKey } from "../api/googleSignup";
import {
  checkBusinessSlug,
  createBusinessOrganization,
  requestBusinessSignupCode,
  verifyBusinessSignupCode,
} from "../api/businessSignup";
import { GoogleButton } from "../components/GoogleButton";
import { loginCodeErrorKey } from "../errors";

type Step = "email" | "code" | "details" | "success" | "approval" | "closed";

export function BusinessSignupPage() {
  const { t } = useTranslation("auth");
  const auth = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [step, setStep] = useState<Step>(auth.isAuthenticated ? "details" : "email");
  const [acceptedTerms, setAcceptedTerms] = useState(auth.isAuthenticated);
  const [termsError, setTermsError] = useState(false);
  const [email, setEmail] = useState("");
  // El correo al que avisamos la aprobación lo dice la API: con Google o con sesión no se escribió ninguno.
  const [notificationEmail, setNotificationEmail] = useState("");
  const [code, setCode] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [requestError, setRequestError] = useState<ApiError | null>(null);
  const [organizationName, setOrganizationName] = useState("");
  const [firstCompanyName, setFirstCompanyName] = useState("");
  const [slug, setSlug] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [organizationError, setOrganizationError] = useState(false);
  const [companyError, setCompanyError] = useState(false);
  const [slugError, setSlugError] = useState<"invalid" | "reserved" | "taken" | null>(null);
  const [taxIdError, setTaxIdError] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  // El tope llega en el 409 (limit) para decir «Llegaste al límite de N organizaciones propias».
  const [limitCount, setLimitCount] = useState<number | null>(null);
  const { data: referenceData } = useReferenceData();
  const resend = useCountdown(0);
  const retry = useRetryAfterCountdown();
  const slugToCheck = useDebouncedValue(slug.trim().toLowerCase());
  const googleComplete = searchParams.get("google") === "complete";
  const closedByCallback = searchParams.get("error") === "Auth.BusinessSignup.Closed";
  const cuitType = useMemo(() => referenceData?.taxIdTypes
    .filter((type) => type.isEnabled && type.validatorKey === "ar-cuit-mod11"
      && type.countryCode === "AR" && (type.appliesTo === "Company" || type.appliesTo === "Both"))
    .sort((left, right) => (left.sortOrder ?? Number.MAX_SAFE_INTEGER) - (right.sortOrder ?? Number.MAX_SAFE_INTEGER))[0],
  [referenceData]);

  const requestCode = useIdempotentMutation((destination: string, key) => requestBusinessSignupCode({
    email: destination,
    acceptedTerms: true,
    culture: effectiveCulture() ?? navigator.language,
    timeZoneId: browserTimeZone(),
  }, key));
  const verifyCode = useIdempotentMutation((input: { email: string; code: string }, key) => verifyBusinessSignupCode({
    ...input,
    acceptedTerms: true,
    culture: effectiveCulture() ?? navigator.language,
    timeZoneId: browserTimeZone(),
  }, key));
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
  }, key, antiforgery.data?.requestToken ?? ""));

  useEffect(() => {
    if (auth.isAuthenticated && step === "email") {
      setStep("details");
      setAcceptedTerms(true);
    }
  }, [auth.isAuthenticated, step]);

  useEffect(() => {
    if (!googleComplete) return;
    setAcceptedTerms(true);
    setStep("details");
    const next = new URLSearchParams(searchParams);
    next.delete("google");
    setSearchParams(next, { replace: true });
  }, [googleComplete, searchParams, setSearchParams]);

  useEffect(() => {
    if (closedByCallback) setStep("closed");
  }, [closedByCallback]);

  const slugAvailability = slugQuery.data?.availability;
  const slugMatchesInput = slugToCheck === slug.trim().toLowerCase();
  const slugAvailable = slug !== "" && slugMatchesInput && slugAvailability === "Available" && !slugError;
  const taxIdValid = taxNumber === "" || Boolean(cuitType && isValidTaxId(cuitType, taxNumber));
  const canCreate = acceptedTerms && Boolean(antiforgery.data?.requestToken) && !createMutation.isPending;

  async function sendCode() {
    const destination = email.trim();
    if (!zodEmailIsValid(destination)) {
      setEmailError(true);
      return;
    }
    setEmailError(false);
    setRequestError(null);
    try {
      const response = await requestCode.mutateAsync(destination);
      setEmail(destination);
      setCode("");
      resend.restart(response.resendAfterSeconds);
      setStep("code");
    } catch (caught) {
      if (!(caught instanceof ApiError)) throw caught;
      if (caught.code === "Auth.BusinessSignup.Closed") { setStep("closed"); return; }
      setRequestError(caught);
      retry.startFromError(caught);
    }
  }

  async function confirmCode() {
    if (code.length !== 6) return;
    setRequestError(null);
    try {
      await verifyCode.mutateAsync({ email, code });
      setStep("details");
    } catch (caught) {
      if (!(caught instanceof ApiError)) throw caught;
      if (caught.code === "Auth.BusinessSignup.Closed") { setStep("closed"); return; }
      setRequestError(caught);
    }
  }

  async function resendCode() {
    setRequestError(null);
    try {
      const response = await requestCode.mutateAsync(email);
      setCode("");
      resend.restart(response.resendAfterSeconds);
    } catch (caught) {
      if (!(caught instanceof ApiError)) throw caught;
      if (caught.code === "Auth.BusinessSignup.Closed") { setStep("closed"); return; }
      setRequestError(caught);
      retry.startFromError(caught);
    }
  }

  async function submitOrganization() {
    setOrganizationError(organizationName.trim() === "");
    setCompanyError(firstCompanyName.trim() === "");
    if (organizationName.trim() === "" || firstCompanyName.trim() === "") return;
    if (slug === "" || !slugAvailable) {
      if (!slug) setSlugError("invalid");
      else if (slugAvailability === "Reserved") setSlugError("reserved");
      else if (slugAvailability === "Taken") setSlugError("taken");
      return;
    }
    if (!taxIdValid) { setTaxIdError(true); return; }
    if (!canCreate) return;
    setRequestError(null);
    setLimitReached(false);
    setTaxIdError(false);
    try {
      const response = await createMutation.mutateAsync({
        organizationName: organizationName.trim(),
        slug: slugToCheck,
        firstCompanyName: firstCompanyName.trim(),
        taxNumber,
      });
      setNotificationEmail(response.notificationEmail ?? email);
      setStep(response.requiresApproval ? "approval" : "success");
    } catch (caught) {
      if (!(caught instanceof ApiError)) throw caught;
      if (caught.code === "Auth.BusinessSignup.Closed") { setStep("closed"); return; }
      if (caught.code === "Tenancy.Organization.LimitReached") {
        setLimitCount(typeof caught.problem.limit === "number" ? caught.problem.limit : null);
        setLimitReached(true);
        return;
      }
      if (caught.code === "Tenancy.TenantSlug.Reserved") { setSlugError("reserved"); return; }
      if (caught.code === "Tenancy.TenantSlug.Taken") { setSlugError("taken"); return; }
      if (caught.code === "Tenancy.TenantSlug.Invalid") { setSlugError("invalid"); return; }
      if (caught.code === "TaxIds.TaxId.Invalid") { setTaxIdError(true); return; }
      setRequestError(caught);
    }
  }

  async function enterOrganization() {
    await auth.signinRedirect({ extraQueryParams: { access: "business" }, state: { returnTo: "/org" } });
  }

  const requestErrorText = requestError
    ? requestError.code?.startsWith("Auth.LoginCode.") ? t(loginCodeErrorKey(requestError))
      : t("businessSignup.serverError")
    : null;

  return <AuthLayout access="business" panelIntro={t("businessSignup.panelIntro")}>
    {step === "closed" ? <StatusPanel icon="lock" title={t("businessSignup.closedTitle")}
      detail={t("businessSignup.closedDetail")} action={t("businessSignup.backHome")} href="/" />
      : step === "success" ? <StatusPanel icon="success"
        title={t("businessSignup.doneTitle", { organization: organizationName.trim() })}
        detail={t("businessSignup.doneDetail")} action={t("businessSignup.openOrganization", { organization: organizationName.trim() })}
        onAction={() => void enterOrganization()} />
        : step === "approval" ? <StatusPanel icon="approval" title={t("businessSignup.approvalTitle")}
          detail={<Trans ns="auth" i18nKey="businessSignup.approvalDetail" values={{ organization: organizationName.trim(), email: notificationEmail }} components={{ strong: <strong className="font-semibold text-[var(--t1)]" /> }} />}
          action={t("businessSignup.backHome")} href="/" />
          : step === "email" ? <section className="flex flex-col gap-[22px]">
            <h1 className="text-[26px] font-bold leading-tight">{t("businessSignup.title")}</h1>
            <label className="flex items-start gap-2 text-[13px] text-[var(--t2)]">
              <input type="checkbox" checked={acceptedTerms} onChange={(event) => { setAcceptedTerms(event.target.checked); setTermsError(false); }}
                className="mt-0.5 size-4 accent-[var(--marca)]" />
              <span>{t("businessSignup.accept")} <Link to="/terminos" className="font-semibold text-[var(--marca)] hover:underline">{t("businessSignup.terms")}</Link> {t("businessSignup.join")} <Link to="/privacidad" className="font-semibold text-[var(--marca)] hover:underline">{t("businessSignup.privacy")}</Link></span>
            </label>
            {termsError ? <p role="alert" className="-mt-4 text-[13px] text-[var(--peligro)]">{t("businessSignup.acceptRequired")}</p> : null}
            <GoogleButton mode="signup" access="business" acceptedTerms={acceptedTerms} onTermsRequired={() => setTermsError(true)} returnTo="/registro/empresa" />
            <div className="flex items-center gap-3 text-[13px] text-[var(--t3)]"><span className="h-px flex-1 bg-[var(--borde)]" /><span>{t("businessSignup.or")}</span><span className="h-px flex-1 bg-[var(--borde)]" /></div>
            <FormField label={t("businessSignup.email")} variant="auth" error={emailError ? t("login.emailInvalid") : undefined}>
              <EmailField name="email" value={email} onChange={(value) => { setEmail(value ?? ""); setEmailError(false); }} />
            </FormField>
            <FormError message={requestErrorText} />
            <Button type="button" size="lg" className="w-full" disabled={requestCode.isPending || retry.isRunning}
              onClick={() => { if (acceptedTerms) void sendCode(); else setTermsError(true); }}>{retry.label ?? t("businessSignup.continue")}</Button>
            <div className="text-center text-[13px] text-[var(--t2)]">{t("businessSignup.alreadyRegistered")} <Link to="/login/empresa" className="font-semibold text-[var(--marca)] hover:underline">{t("businessSignup.loginBusiness")}</Link></div>
          </section>
            : step === "code" ? <section className="flex flex-col gap-[22px]">
              <button type="button" onClick={() => { setStep("email"); setCode(""); setRequestError(null); }}
                className="inline-flex items-center gap-1 self-start text-[13px] font-semibold text-[var(--marca)] hover:underline"><ChevronLeft size={16} aria-hidden="true" />{t("businessSignup.changeEmail")}</button>
              <div><h1 className="text-[26px] font-bold leading-tight">{t("businessSignup.codeTitle")}</h1>
                <p id="business-signup-code-hint" className="mt-2 text-[13px] text-[var(--t2)]"><Trans ns="auth" i18nKey="businessSignup.sentCode" values={{ email }} components={{ strong: <strong className="font-semibold text-[var(--t1)]" /> }} /></p></div>
              <OtpInput length={6} value={code} onChange={(next) => { setCode(next); setRequestError(null); }}
                label={t("businessSignup.codeLabel")} invalid={requestError?.code === "Auth.LoginCode.Invalid"}
                disabled={verifyCode.isPending} aria-describedby="business-signup-code-hint" />
              <FormError message={requestErrorText} />
              <div className="flex flex-col gap-2.5">
                <Button type="button" size="lg" onClick={() => void confirmCode()} disabled={code.length !== 6 || verifyCode.isPending}>{t("businessSignup.verify")}</Button>
                <Button type="button" size="lg" variant="outline"
                  onClick={() => void resendCode()} disabled={resend.isRunning || retry.isRunning || requestCode.isPending}>
                  {retry.label ?? (resend.isRunning ? t("businessSignup.resendIn", { seconds: resend.seconds }) : t("businessSignup.resend"))}
                </Button>
              </div>
            </section>
              : <section className="flex flex-col gap-[22px]">
                <div><h1 className="text-[26px] font-bold leading-tight">{t("businessSignup.organizationTitle")}</h1>
                  <p className="mt-2 text-[14px] text-[var(--t2)]">{t("businessSignup.ownerNote")}</p></div>
                {limitReached ? <div role="alert" className="flex items-start gap-2.5 rounded-[10px] bg-[var(--peligro-t)] px-3 py-2.5 text-[13px] leading-normal text-[var(--peligro)]">
                  <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  <span><span className="block">{limitCount === null ? t("businessSignup.limitTitleNoCount") : t("businessSignup.limitTitle", { count: limitCount })}</span>
                    <span className="block">{t("businessSignup.limitDetail")}</span></span>
                </div> : null}
                <FormField label={t("businessSignup.organizationName")} variant="auth" required error={organizationError ? t("businessSignup.organizationRequired") : undefined}>
                  <Input value={organizationName} onChange={(event) => { setOrganizationName(event.target.value); setOrganizationError(false); setLimitReached(false); }}
                    autoComplete="organization" maxLength={120} />
                </FormField>
                <FormField label={t("businessSignup.pageAddress")} variant="auth" required
                  error={slugError ? t(`businessSignup.slug${slugError[0]!.toUpperCase()}${slugError.slice(1)}`)
                    : slugAvailability === "Reserved" ? t("businessSignup.slugReserved")
                      : slugAvailability === "Taken" ? t("businessSignup.slugTaken")
                        : slugQuery.isError ? t("businessSignup.slugInvalid") : undefined}>
                  <SlugInput suffix={t("businessSignup.domainSuffix")} value={slug}
                    onChange={(event) => { setSlug(event.target.value.trim().toLowerCase()); setSlugError(null); setLimitReached(false); }}
                    autoComplete="off" spellCheck={false} />
                </FormField>
                {/* Vacío no deja hueco: compensa los 22 px de la columna, porque el tablero no deja espacio bajo la dirección. */}
                <div className="-mt-[22px] text-[12px] [&:not(:empty)]:pt-1.5" aria-live="polite">
                  {slug !== "" && !slugMatchesInput ? <span className="text-[var(--t3)]">{t("common:states.loading")}</span>
                    : slugAvailability === "Available" && !slugError ? <span role="status" className="inline-flex items-center gap-1 text-[var(--ok)]"><Check size={14} />{t("businessSignup.slugAvailable")}</span> : null}
                </div>
                <FormField label={t("businessSignup.firstCompany")} variant="auth" required error={companyError ? t("businessSignup.companyRequired") : undefined}>
                  <Input value={firstCompanyName} onChange={(event) => { setFirstCompanyName(event.target.value); setCompanyError(false); }}
                    autoComplete="organization" maxLength={120} />
                </FormField>
                <FormField label={t("businessSignup.taxId")} variant="auth" error={taxIdError || !taxIdValid ? t("businessSignup.taxIdInvalid") : undefined}>
                  <Input value={taxNumber} onChange={(event) => { setTaxNumber(event.target.value.replace(/\D/g, "").slice(0, 11)); setTaxIdError(false); }}
                    inputMode="numeric" autoComplete="off" placeholder="30-12345678-9" maxLength={11} />
                </FormField>
                <FormError message={requestErrorText} />
                <Button type="button" size="lg" className="w-full" disabled={!canCreate}
                  onClick={() => void submitOrganization()}>{createMutation.isPending ? t("businessSignup.creating") : t("businessSignup.create")}</Button>
              </section>}
  </AuthLayout>;

  function StatusPanel({ icon, title, detail, action, href, onAction }: {
    icon: "lock" | "success" | "approval"; title: string; detail: ReactNode; action: string; href?: string;
    onAction?: () => void;
  }) {
    const Icon = icon === "lock" ? LockKeyhole : icon === "success" ? Check : Clock3;
    const tone = icon === "success" ? "bg-[var(--ok-t)] text-[var(--ok)]"
      : icon === "approval" ? "bg-[var(--alerta-t)] text-[var(--alerta)]" : "bg-[var(--s3)] text-[var(--t2)]";
    return <section className="flex flex-col items-center gap-[22px] text-center">
      <div aria-hidden="true" className={`flex size-[52px] items-center justify-center rounded-full ${tone}`}><Icon size={20} /></div>
      <div><h1 className="text-[22px] font-bold leading-tight">{title}</h1><p className="mt-2 text-sm text-[var(--t2)]">{detail}</p></div>
      {onAction ? <Button type="button" size="lg" className="w-full" onClick={onAction}>{action}</Button>
        : <Button asChild variant="outline" size="lg" className="w-full"><Link to={href ?? "/"}>{action}</Link></Button>}
    </section>;
  }
}

// Tablero Registro-Empresa: el dominio va en una caja gris aparte, pegada al campo.
function SlugInput({ suffix, className, ...inputProps }: React.ComponentProps<"input"> & { suffix: string }) {
  return <div className="flex items-stretch overflow-hidden rounded-[10px] border border-[var(--borde2)] bg-[var(--lado-activo)] focus-within:border-[var(--marca)] focus-within:ring-[3px] focus-within:ring-[var(--foco-halo)]">
    <Input {...inputProps} className={`min-w-0 flex-1 rounded-none border-0 shadow-none focus-visible:ring-0 ${className ?? ""}`} />
    <span data-slug-suffix className="flex shrink-0 items-center border-l border-[var(--borde)] bg-[var(--s2)] px-3 text-[13px] text-[var(--t2)]">{suffix}</span>
  </div>;
}

function zodEmailIsValid(value: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
}
