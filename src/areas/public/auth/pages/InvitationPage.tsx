import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, CircleCheck, TriangleAlert, UserRound } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "react-oidc-context";
import { ApiError } from "@/shared/api/ApiError";
import { invitationAntiforgeryQueryKey, invitationPaths, invitationPreviewQueryKey,
  getInvitationAntiforgery, previewInvitation, acceptInvitation } from "@/shared/api/invitationContract";
import type { AcceptInvitationRequest, AcceptInvitationResponse } from "@/shared/api/types";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { AuthLayout } from "@/layouts/AuthLayout";
import { Button } from "@/shared/ui/button";
import { DateText } from "@/shared/ui/format/DateText";
import { FormError } from "@/shared/ui/FormError";
import { beginSignOut, cancelSignOut } from "@/auth/signOutStatus";

function initials(value: string | null | undefined, fallback: string): string {
  const name = value?.trim();
  if (!name) return fallback;
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toLocaleUpperCase();
}

function InvitationBrandPanel() {
  const { t } = useTranslation("invitations");
  return <>
    <span className="self-start text-[13px] font-semibold">{t("panel.kicker")}</span>
    <h2 className="max-w-[520px] text-[32px] leading-[1.15] font-bold tracking-[-0.025em]">{t("panel.heading")}</h2>
    <p className="max-w-[500px] text-[15px] leading-[1.6] text-[var(--lado-activo)]/85">{t("panel.description")}</p>
    <ul className="mt-2 flex max-w-[500px] flex-col gap-[18px] text-sm font-normal text-[var(--lado-activo)]/90">
      <li className="flex items-center gap-3">
        <span className="inline-flex size-[34px] shrink-0 items-center justify-center rounded-[9px] bg-[var(--lado-activo)]/15"><UserRound aria-hidden="true" size={20} strokeWidth={1.75} /></span>
        <span>{t("panel.person")}</span>
      </li>
      <li className="flex items-center gap-3">
        <span className="inline-flex size-[34px] shrink-0 items-center justify-center rounded-[9px] bg-[var(--lado-activo)]/15"><Building2 aria-hidden="true" size={20} strokeWidth={1.75} /></span>
        <span>{t("panel.organization")}</span>
      </li>
    </ul>
  </>;
}

function displayError(error: unknown, fallback: (key: string) => string): string {
  if (error instanceof ApiError) {
    if (error.isNetworkError) return fallback("network");
    return error.detail ?? fallback("server");
  }
  return fallback("server");
}

export function InvitationPage() {
  const { t } = useTranslation("invitations");
  const { t: tErrors } = useTranslation("errors");
  const auth = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [loadedLocationKey, setLoadedLocationKey] = useState<string | null>(null);
  const [previewCacheKey, setPreviewCacheKey] = useState(() => crypto.randomUUID());
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [accepted, setAccepted] = useState<AcceptInvitationResponse | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const fragment = location.hash.startsWith("#") ? location.hash.slice(1) : "";
    if (fragment) {
      window.history.replaceState(window.history.state, document.title, invitationPaths.page);
      setToken(fragment);
    } else {
      setToken(null);
    }
    setPreviewCacheKey(crypto.randomUUID());
    setLoadedLocationKey(location.key);
  }, [location.hash, location.key]);

  const antiforgery = useQuery({
    queryKey: invitationAntiforgeryQueryKey,
    queryFn: getInvitationAntiforgery,
    staleTime: 5 * 60 * 1000,
    meta: { silent: true },
  });
  const preview = useQuery({
    queryKey: [...invitationPreviewQueryKey, previewCacheKey],
    queryFn: () => previewInvitation(token, antiforgery.data!.requestToken),
    enabled: loadedLocationKey === location.key && typeof antiforgery.data?.requestToken === "string",
    retry: false,
    meta: { silent: true },
  });
  const accept = useIdempotentMutation((request: AcceptInvitationRequest, key) =>
    acceptInvitation(request, key, antiforgery.data!.requestToken));

  const invitation = preview.data;
  const acceptedView = accepted !== null || invitation?.state === "Accepted";
  const needsPersonalMethod = accepted?.needsPersonalLoginMethod ?? invitation?.needsPersonalLoginMethod ?? false;
  const organizationId = accepted?.organizationId ?? invitation?.organizationId ?? undefined;
  const organizationName = invitation?.organizationName ?? t("organizationFallback");
  const email = invitation?.email ?? "";
  const inviter = invitation?.inviterName ?? organizationName;

  async function acceptInvitationNow() {
    if (!invitation || antiforgery.data?.requestToken === undefined) return;
    setActionError(null);
    try {
      const result = await accept.mutateAsync({ token, acceptedTerms: invitation.state === "NoAccount" && acceptedTerms });
      setAccepted(result);
    } catch (error) {
      setActionError(displayError(error, tErrors));
    }
  }

  async function enterAsBusiness(returnTo: "/org" | "/cuenta") {
    setActionError(null);
    try {
      await auth.signinRedirect({
        state: { returnTo },
        extraQueryParams: { access: "business", ...(organizationId ? { tenant: organizationId } : {}) },
      });
    } catch {
      setActionError(tErrors("server"));
    }
  }

  async function signOutAndContinue() {
    beginSignOut();
    setActionError(null);
    try {
      const result: unknown = await auth.signoutRedirect({
        post_logout_redirect_uri: new URL(invitationPaths.page, window.location.origin).toString(),
        extraQueryParams: { preserveInvitation: "true" },
      });
      if (result === null) cancelSignOut();
    } catch {
      cancelSignOut();
      setActionError(tErrors("server"));
    }
  }

  function returnToOwnAccess() {
    const access = auth.user?.profile.access;
    navigate(access === "business" ? "/org" : access === "platform" ? "/plataforma" : "/", { replace: true });
  }

  const loading = loadedLocationKey !== location.key || antiforgery.isPending
    || (antiforgery.data !== undefined && preview.isPending);
  const error = antiforgery.error ?? preview.error;
  const retry = () => {
    void antiforgery.refetch();
    if (antiforgery.data) void preview.refetch();
  };

  return <AuthLayout access="business" brandPanel="blank" brandPanelContent={<InvitationBrandPanel />}>
    {loading ? <div role="status" aria-busy="true" aria-label={t("loading")} className="flex min-h-36 items-center justify-center text-sm text-[var(--t2)]">{t("loading")}</div>
      : error ? <div className="flex flex-col gap-5">
        <h1 className="text-[26px] leading-tight font-bold tracking-[-0.02em]">{t("pageTitle")}</h1>
        <FormError message={displayError(error, tErrors)} />
        <Button type="button" variant="outlineSurface" size="lg" onClick={retry}>{t("retry")}</Button>
      </div>
        : invitation ? acceptedView ? <div className="flex flex-col gap-[22px]">
          <span aria-hidden="true" className="flex size-[46px] items-center justify-center self-center rounded-full bg-[var(--exito-t)] text-[var(--exito)]"><CircleCheck size={22} strokeWidth={2} /></span>
          <div className="text-center">
            <h1 className="text-[26px] leading-tight font-bold tracking-[-0.02em]">{t("accepted.title", { organization: organizationName })}</h1>
            <p className="mt-2 break-all text-[15px] leading-normal text-[var(--t2)]">{t("accepted.email", { email })}</p>
          </div>
          {needsPersonalMethod ? <div role="status" className="flex items-start gap-2.5 rounded-xl bg-[var(--alerta-t)] px-3.5 py-3 text-sm leading-normal text-[var(--alerta)]">
            <TriangleAlert aria-hidden="true" className="mt-0.5 shrink-0" size={18} strokeWidth={2} />
            <span>{t("accepted.personalMethodNotice")}</span>
          </div> : null}
          <div className="flex flex-col gap-2.5">
            {needsPersonalMethod ? <>
              <Button type="button" size="lg" onClick={() => void enterAsBusiness("/cuenta")}>{t("accepted.addNow")}</Button>
              <Button type="button" variant="outlineSurface" size="lg" onClick={() => void enterAsBusiness("/org")}>{t("accepted.later")}</Button>
            </> : <Button type="button" size="lg" onClick={() => void enterAsBusiness("/org")}>{t("accepted.openOrganization")}</Button>}
          </div>
          <FormError message={actionError} />
        </div> : invitation.state === "Expired" || invitation.state === "Invalid" || invitation.state === "OrganizationSuspended" ? <div className="flex flex-col gap-[22px]">
          <span aria-hidden="true" className="flex size-[46px] items-center justify-center self-center rounded-full bg-[var(--alerta-t)] text-[var(--alerta)]"><TriangleAlert size={20} strokeWidth={1.75} /></span>
          <div className="text-center">
            <h1 className="text-[26px] leading-tight font-bold tracking-[-0.02em]">{t(`states.${invitation.state}.title`, { organization: organizationName, inviter })}</h1>
            <p className="mt-2 text-[15px] leading-normal text-[var(--t2)]">{t(`states.${invitation.state}.description`, { organization: organizationName, inviter })}</p>
          </div>
          <Link to="/login" className="inline-flex h-10 items-center justify-center rounded-[10px] border border-[var(--t3)] text-sm font-semibold text-[var(--t1)] hover:bg-[var(--s2)]">{t("backToSignIn")}</Link>
        </div> : <div className="flex flex-col gap-5">
          <div className="flex size-[46px] items-center justify-center self-center rounded-full bg-[var(--marca-t)] text-[var(--marca-tx)]" aria-hidden="true">
            <span className="text-sm font-bold">{initials(organizationName, "O")}</span>
          </div>
          <div className="text-center">
            <p className="text-[13px] font-semibold text-[var(--t2)]">{t("pageTitle")}</p>
            <h1 className="mt-1 text-[26px] leading-tight font-bold tracking-[-0.02em]">{t("join.title", { organization: organizationName })}</h1>
            <p className="mt-2 break-all text-[15px] leading-normal text-[var(--t2)]">{t("join.forEmail", { email })}</p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-[var(--borde2)] bg-[var(--lado-activo)] px-3.5 py-3">
            <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--marca-t)] text-sm font-semibold text-[var(--marca-tx)]">{initials(inviter, "O")}</span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-[14px] font-semibold text-[var(--t1)]">{t("join.invitedBy", { inviter })}</span>
              {invitation.issuedAtUtc ? <span className="text-[13px] text-[var(--t2)]"><DateText value={invitation.issuedAtUtc} kind="relative" /></span> : null}
            </span>
          </div>
          <dl className="flex items-baseline justify-between gap-3 border-b border-[var(--borde2)] pb-3 text-[13px]">
            <dt className="text-[var(--t2)]">{t("join.expires")}</dt>
            <dd className="font-medium text-[var(--t1)]"><DateText value={invitation.expiresAtUtc} kind="relative" /></dd>
          </dl>
          {invitation.state === "WrongSession" ? <div role="alert" className="rounded-xl bg-[var(--alerta-t)] px-3.5 py-3 text-[13px] leading-normal text-[var(--alerta)]">
            {t("wrongSession", { currentEmail: invitation.currentAccountEmail ?? t("accountFallback"), email })}
          </div> : null}
          {invitation.state === "SignInRequired" ? <p className="text-[13px] leading-normal text-[var(--t2)]">{t("join.signInDescription", { email })}</p> : null}
          {invitation.state === "NoAccount" ? <label className="flex items-start gap-2.5 text-[13px] leading-normal text-[var(--t1)]">
            <input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} className="mt-0.5 size-[18px] shrink-0 accent-[var(--marca)]" />
            <span><Trans ns="invitations" i18nKey="join.terms" components={{
              terms: <Link to="/terminos" target="_blank" rel="noopener" className="font-semibold text-[var(--marca-tx)] hover:underline" />,
              privacy: <Link to="/privacidad" target="_blank" rel="noopener" className="font-semibold text-[var(--marca-tx)] hover:underline" />,
            }} /></span>
          </label> : null}
          <div className="flex flex-col gap-2.5">
            {invitation.state === "WrongSession" ? <>
              <Button type="button" size="lg" onClick={() => void signOutAndContinue()}>{t("join.signOutAndContinue", { email })}</Button>
              <Button type="button" size="lg" variant="outlineSurface" onClick={returnToOwnAccess}>{t("join.continueAs", { name: typeof auth.user?.profile.name === "string" ? auth.user.profile.name : invitation.currentAccountEmail ?? t("accountFallback") })}</Button>
            </> : invitation.state === "SignInRequired" ? <Button type="button" size="lg" onClick={() => {
              setActionError(null);
                void auth.signinRedirect({ state: { returnTo: invitationPaths.page }, extraQueryParams: { access: "consumer" } })
                .catch(() => setActionError(tErrors("server")));
            }}>{t("join.signIn")}</Button>
              : <Button type="button" size="lg" disabled={accept.isPending || (invitation.state === "NoAccount" && !acceptedTerms)} onClick={() => void acceptInvitationNow()}>
                {accept.isPending ? t("join.accepting") : t("join.accept")}
              </Button>}
          </div>
          <FormError message={actionError} />
        </div> : null}
  </AuthLayout>;
}
