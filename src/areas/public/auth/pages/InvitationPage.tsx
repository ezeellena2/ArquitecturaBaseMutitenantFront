import { useEffect, useRef, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "react-oidc-context";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import { invitationAntiforgeryQueryKey, invitationPaths, invitationPreviewQueryKey,
  getInvitationAntiforgery, previewInvitation, acceptInvitation } from "@/shared/api/invitationContract";
import type { AcceptInvitationRequest, AcceptInvitationResponse } from "@/shared/api/types";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { AuthLayout } from "@/layouts/AuthLayout";
import { AuthStatus } from "../components/AuthStatus";
import { Avatar } from "@/shared/ui/Avatar";
import { Banner } from "@/shared/ui/Banner";
import { Button } from "@/shared/ui/button";
import { DateText } from "@/shared/ui/format/DateText";
import { FormError } from "@/shared/ui/FormError";
import { ClockIcon } from "@/shared/ui/icons";
import { useSignOut } from "@/auth/useSignOut";
import { accountPagePaths } from "@/shared/api/accountContract";
import { homeOf, parseAccess } from "@/tenancy/access";

function initials(value: string | null | undefined, fallback: string): string {
  const name = value?.trim();
  if (!name) return fallback;
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toLocaleUpperCase();
}

// «Vence: En 6 días» del tablero, redondeado; el último medio día dice «Hoy».
function daysUntil(value: string): number {
  return Math.max(0, Math.round((Date.parse(value) - Date.now()) / 86_400_000));
}

// Tablero Invitacion (v106), «Sin cuenta: cargando»: lo que pasa mientras tanto, en una línea centrada y gris, con 48
// arriba y abajo; en el teléfono, con la letra de 14,5 de M-Invitacion. También al entrar a la organización.
function StatusText({ children }: { children: ReactNode }) {
  return <p role="status" aria-busy="true" className="py-12 text-center text-[13px] leading-normal text-[var(--t2)] max-md:text-[14.5px]">{children}</p>;
}

export function InvitationPage() {
  const location = useLocation();
  return <InvitationFlow key={location.key} />;
}

function InvitationFlow() {
  const { t } = useTranslation("invitations");
  const { t: tErrors } = useTranslation("errors");
  const auth = useAuth();
  const signOut = useSignOut();
  const location = useLocation();
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [loadedLocationKey, setLoadedLocationKey] = useState<string | null>(null);
  const [previewCacheKey, setPreviewCacheKey] = useState(() => crypto.randomUUID());
  const [accepted, setAccepted] = useState<AcceptInvitationResponse | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const entered = useRef(false);

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
    acceptInvitation(request, key, antiforgery.data!.requestToken), { meta: { handlesError: true } });

  const invitation = preview.data;
  const acceptedView = accepted !== null || invitation?.state === "Accepted";
  const needsPersonalMethod = accepted?.needsPersonalLoginMethod ?? invitation?.needsPersonalLoginMethod ?? false;
  // Sin aviso de respaldo no hay pantalla intermedia: al aceptar se entra directo a la organización.
  const entering = acceptedView && !needsPersonalMethod;
  const organizationId = accepted?.organizationId ?? invitation?.organizationId ?? undefined;
  const organizationName = invitation?.organizationName ?? t("organizationFallback");
  const email = invitation?.email ?? "";
  const inviter = invitation?.inviterName ?? organizationName;
  const inviterRoles = invitation?.inviterRoles ?? [];
  const companies = invitation?.companies ?? [];
  const roles = invitation?.roles ?? [];

  async function acceptInvitationNow() {
    if (!invitation || antiforgery.data?.requestToken === undefined) return;
    setActionError(null);
    try {
      // Sin cuenta, la leyenda «Al aceptar … aceptás los Términos» hace de consentimiento.
      setAccepted(await accept.mutateAsync({ token, acceptedTerms: invitation.state === "NoAccount" }));
    } catch (error) {
      setActionError(apiErrorMessage(error, tErrors));
    }
  }

  async function enterAsBusiness(returnTo: string) {
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

  useEffect(() => {
    if (!entering || entered.current) return;
    entered.current = true;
    void enterAsBusiness(homeOf("business"));
  });

  async function signOutAndContinue() {
    setActionError(null);
    const signedOut = await signOut({
      post_logout_redirect_uri: new URL(invitationPaths.page, window.location.origin).toString(),
      extraQueryParams: { preserveInvitation: "true" },
    });
    if (!signedOut) setActionError(tErrors("server"));
  }

  function returnToOwnAccess() {
    navigate(homeOf(parseAccess(auth.user?.profile.access) ?? "consumer"), { replace: true });
  }

  const loading = loadedLocationKey !== location.key || antiforgery.isPending
    || (antiforgery.data !== undefined && preview.isPending);
  const error = antiforgery.error ?? preview.error;
  const retry = () => {
    void antiforgery.refetch();
    if (antiforgery.data) void preview.refetch();
  };
  const days = invitation?.expiresAtUtc ? daysUntil(invitation.expiresAtUtc) : 0;
  const note = "text-center text-xs leading-normal text-[var(--t3)]";

  return <AuthLayout access="consumer">
    {loading ? <StatusText>{t("loading")}</StatusText>
      : error ? <div className="flex flex-col gap-5">
        <h1 className="text-[24px] leading-[1.2] font-bold tracking-[-0.02em]">{t("pageTitle")}</h1>
        <FormError message={apiErrorMessage(error, tErrors)} />
        <Button type="button" variant="outline" size="lg" onClick={retry}>{t("retry")}</Button>
      </div>
        : invitation ? entering && !actionError ? <StatusText>{t("accepted.entering", { organization: organizationName })}</StatusText>
          : acceptedView ? <AuthStatus icon={Check} tone="ok" largeIcon title={t("accepted.title", { organization: organizationName })}
            detail={<Trans ns="invitations" i18nKey="accepted.email" values={{ email }} components={{ strong: <strong className="font-semibold text-[var(--t1)]" /> }} />}
            actions={needsPersonalMethod ? <>
              <Button type="button" size="lg" onClick={() => void enterAsBusiness(accountPagePaths.account)}>{t("accepted.addNow")}</Button>
              <Button type="button" variant="outline" size="lg" onClick={() => void enterAsBusiness(homeOf("business"))}>{t("accepted.later")}</Button>
            </> : <Button type="button" size="lg" onClick={() => void enterAsBusiness(homeOf("business"))}>{t("accepted.openOrganization")}</Button>}>
            {needsPersonalMethod ? <Banner tone="warning">{t("accepted.personalMethodNotice")}</Banner> : null}
            <FormError message={actionError} />
          </AuthStatus> : invitation.state === "Expired" || invitation.state === "Invalid" || invitation.state === "OrganizationSuspended"
            ? <AuthStatus icon={ClockIcon} tone={invitation.state === "Invalid" ? "neutral" : "warning"}
              title={t(`states.${invitation.state}.title`, { organization: organizationName, inviter })}
              detail={t(`states.${invitation.state}.description`, { organization: organizationName, inviter })}
              actions={<Button asChild variant="outline" size="lg"><Link to="/login">{t("backToSignIn")}</Link></Button>} />
            : <div className="flex flex-col gap-5">
          <span aria-hidden="true" className="flex size-14 items-center justify-center rounded-[14px] bg-[linear-gradient(135deg,var(--marca),var(--auth-panel-mid))] text-xl font-bold text-[var(--lado-activo)]">{initials(organizationName, "O")}</span>
          <div>
            <h1 className="text-[24px] leading-[1.2] font-bold tracking-[-0.02em]">{t("join.title", { organization: organizationName })}</h1>
            <p className="mt-1.5 break-all text-sm text-[var(--t2)]"><Trans ns="invitations" i18nKey="join.forEmail" values={{ email }} components={{ strong: <strong className="font-semibold text-[var(--t1)]" /> }} /></p>
          </div>
          <div className="flex items-center gap-3.5 rounded-[10px] border border-[var(--borde)] bg-[var(--s2)] px-3 py-2.5">
            <Avatar size="large" initials={initials(inviter, "O").charAt(0)} />
            <span className="flex min-w-0 flex-col leading-[1.3]">
              <span className="truncate text-[15px] font-semibold text-[var(--t1)]">{t("join.invitedBy", { inviter })}</span>
              <span className="text-[13px] text-[var(--t3)]">
                {inviterRoles.join(", ")}{inviterRoles.length > 0 && invitation.issuedAtUtc ? " · " : null}
                {invitation.issuedAtUtc ? <DateText value={invitation.issuedAtUtc} kind="relative" /> : null}
              </span>
            </span>
          </div>
          <dl className="grid grid-cols-[110px_minmax(0,1fr)] gap-x-4 gap-y-2.5 rounded-[10px] border border-[var(--borde)] px-3.5 py-3 text-[13px]">
            {companies.length > 0 ? <><dt className="text-[var(--t2)]">{t("join.company")}</dt><dd className="font-medium text-[var(--t1)]">{companies.join(", ")}</dd></> : null}
            {roles.length > 0 ? <><dt className="text-[var(--t2)]">{t("join.roles")}</dt><dd className="font-medium text-[var(--t1)]">{roles.join(", ")}</dd></> : null}
            <dt className="text-[var(--t2)]">{t("join.expires")}</dt>
            <dd className="font-medium text-[var(--t1)]"><time dateTime={invitation.expiresAtUtc ?? undefined}>{days > 0 ? t("join.expiresIn", { count: days }) : t("join.expiresToday")}</time></dd>
          </dl>
          {invitation.state === "WrongSession" ? <>
            <FormError tone="warning" message={t("wrongSession", { currentEmail: invitation.currentAccountEmail ?? t("accountFallback"), email })} />
            <div className="flex flex-col gap-2.5">
              <Button type="button" size="lg" onClick={() => void signOutAndContinue()}>{t("join.signOutAndContinue", { email })}</Button>
              {/* Tablero Invitacion (sesión ajena): «Seguir como Lucía», con el nombre de pila de la cuenta abierta. */}
              <Button type="button" size="lg" variant="outline" onClick={returnToOwnAccess}>{t("join.continueAs", { name: invitation.currentAccountName?.trim().split(/\s+/)[0]
                || (typeof auth.user?.profile.name === "string" ? auth.user.profile.name : invitation.currentAccountEmail ?? t("accountFallback")) })}</Button>
            </div>
          </> : invitation.state === "SignInRequired" ? <>
            <Button type="button" size="lg" onClick={() => {
              setActionError(null);
              void navigate(`/login?${new URLSearchParams({ returnUrl: invitationPaths.page })}`);
            }}>{t("join.signIn")}</Button>
            <p className={note}>{t("join.signInDescription", { email })}</p>
          </> : <>
            {/* «Criterio · Botones», Guardando (tablero Invitacion, «Sin cuenta: aceptando»): dice qué hace, con el aro blanco
                de 14, y no se puede volver a tocar. */}
            <Button type="button" size="lg" disabled={accept.isPending} className="disabled:opacity-85" onClick={() => void acceptInvitationNow()}>
              {accept.isPending ? <><span aria-hidden="true" className="size-3.5 animate-spin rounded-full border-2 border-[var(--lado-activo)]/40 border-t-[var(--lado-activo)] motion-reduce:animate-none" />{t("join.accepting")}</>
                : t("join.accept")}
            </Button>
            <p className={note}>{invitation.state === "NoAccount" ? t("join.termsNotice")
              : t("join.joinsProfiles", { organization: organizationName })}</p>
          </>}
          <FormError message={actionError} />
        </div> : null}
  </AuthLayout>;
}
