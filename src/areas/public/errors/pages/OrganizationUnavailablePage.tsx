import { initials } from "@/shared/lib/initials";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { AlertTriangleIcon, ClockIcon, LockIcon, LogOutIcon } from "@/shared/ui/icons";
import { useTranslation } from "react-i18next";
import { SessionStatusPage } from "@/auth/SessionStatusPage";
import { useIsSigningOut } from "@/auth/signOutStatus";
import { useSignOut } from "@/auth/useSignOut";
import { useCurrentUser } from "@/auth/useCurrentUser";
import { useSwitchAccess, type SwitchTarget } from "@/tenancy/useSwitchAccess";
import { BrandMark } from "@/shared/ui/BrandMark";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import { GroupTitle, SettingsGroup, SettingsItem } from "@/shared/ui/app/SettingsGroup";
import { isSelectable, loginPathOf, type UnavailableCode } from "@/tenancy/access";


export function OrganizationUnavailablePage({ code, organizationName, organizationId }: {
  code: UnavailableCode;
  organizationName: string;
  organizationId: string;
}) {
  const { t } = useTranslation(["errors", "common", "auth"]);
  const { data: account } = useCurrentUser();
  const switching = useSwitchAccess();
  const signOut = useSignOut();
  const isSigningOut = useIsSigningOut();
  const [targetName, setTargetName] = useState("");
  const phone = useMediaQuery("(max-width: 767px)");

  if (isSigningOut) return <SessionStatusPage status="closing" />;
  if (switching.isSwitching) return <SessionStatusPage status="switching" targetName={targetName} />;
  if (switching.hasError) return <SessionStatusPage status="error" loginPath={loginPathOf("business")} />;

  const pending = code === "Tenancy.Tenant.PendingApproval";
  const closed = code === "Tenancy.Tenant.Closed";
  const title = t(`errors:errorPage.unavailable.${pending ? "pendingTitle" : closed ? "closedTitle" : "suspendedTitle"}`, { organizationName });
  const description = t(`errors:errorPage.unavailable.${pending ? "pendingDescription" : closed ? "closedDescription" : "suspendedDescription"}`);
  // Tableros Perfil-Suspendido y M-Perfil-Suspendido: el reloj, el candado y el triángulo del set (shared/ui/icons).
  const Icon = pending ? ClockIcon : closed ? LockIcon : AlertTriangleIcon;
  const iconTone = pending ? "bg-[var(--marca-t)] text-[var(--marca-tx)]" : closed ? "bg-[var(--s3)] text-[var(--t2)]" : "bg-[var(--alerta-t)] text-[var(--alerta)]";
  const organizations = account?.organizations.filter((item) => item.id !== organizationId && isSelectable(item)) ?? [];

  function changeProfile(target: SwitchTarget, name: string): void {
    setTargetName(name);
    void switching.switchAccess(target);
  }

  // Tablero M-Perfil-Suspendido: en el teléfono el fondo es gris y sin la marca; arriba el aviso, después
  // «Elegí otro perfil» como grupo de la app y «Salir» abajo.
  if (phone) {
    const otherProfile = t("errors:errorPage.unavailable.otherProfile");
    const profileInitials = (text: string) => <span aria-hidden="true" className="inline-flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--s3)] text-[13px] font-bold text-[var(--t2)]">{text}</span>;
    return <main className="flex min-h-dvh flex-col bg-[var(--s2)] text-[var(--t1)]">
      <div className="flex flex-col items-center gap-2.5 px-8 pt-16 pb-[22px] text-center">
        <span aria-hidden="true" className={`inline-flex size-16 items-center justify-center rounded-full ${iconTone}`}><Icon className="size-7" /></span>
        <h1 className="mt-1.5 text-[22px] font-bold leading-tight tracking-[-0.015em]">{title}</h1>
        <p className="text-[15px] leading-normal text-[var(--t2)]">{description}</p>
      </div>
      <GroupTitle>{otherProfile}</GroupTitle>
      <SettingsGroup label={otherProfile}>
        {account?.hasPersonalSpace ? <SettingsItem leading={profileInitials(t("common:accessMenu.personal").slice(0, 1))} title={t("common:accessMenu.personal")}
          detail={t("common:accessMenu.personalDetail")} onClick={() => changeProfile({ access: "consumer" }, t("common:accessMenu.personal"))} /> : null}
        {organizations.map((organization) => <SettingsItem key={organization.id} leading={profileInitials(initials(organization.name))} title={organization.name}
          detail={organization.roleName ?? undefined} onClick={() => changeProfile({ access: "business", tenantId: organization.id }, organization.name)} />)}
      </SettingsGroup>
      <button type="button" onClick={() => { void signOut(); }} className="mx-auto mt-auto mb-10 inline-flex h-11 items-center gap-2 rounded-[22px] px-5 text-[15.5px] font-semibold text-[var(--t1)] focus-visible:outline-2 focus-visible:outline-[var(--foco)]">
        <LogOutIcon className="size-[18px]" />{t("common:accessMenu.signOut")}
      </button>
    </main>;
  }

  return <main className="relative min-h-dvh bg-[var(--fondo)] px-5 py-8 text-[var(--t1)]">
    <div className="absolute left-6 top-6 flex items-center gap-2.5 text-[17px] font-bold md:left-12 md:top-8">
      <BrandMark />
      {t("auth:brand")}
    </div>
    {/* Tablero Perfil-Suspendido: el círculo, el texto, la tarjeta y «Salir» van a 22 uno del otro; el título y el
        párrafo, con la altura normal de su letra. */}
    <div className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-[460px] flex-col justify-center gap-[22px]">
      <span aria-hidden="true" className={`inline-flex size-[52px] items-center justify-center self-center rounded-full ${iconTone}`}><Icon className="size-5" /></span>
      <div className="text-center">
        <h1 className="text-xl leading-[normal] font-bold tracking-[-0.02em]">{title}</h1>
        <p className="mt-1.5 text-sm leading-[normal] text-[var(--t2)]">{description}</p>
      </div>
      <div className="rounded-2xl border border-[var(--borde)] bg-[var(--lado-activo)] p-1.5 shadow-[var(--shadow-card)]">
        {/* Tablero Perfil-Suspendido: la lista de perfiles como la de tu menú, con el nombre en 13 y 500, el rol en 12 y el
            ícono del perfil de 28 con la sigla en 11,5 y negrita; arriba, el título de un menú (.menu-tit: 6 arriba y 2
            abajo); a la derecha, la flecha gris clara de 15 (.menu-it svg). */}
        <div className="px-3 pt-1.5 pb-0.5 text-[12px] leading-[normal] font-semibold text-[var(--t3)]">{t("errors:errorPage.unavailable.otherProfile")}</div>
        {account?.hasPersonalSpace ? <button type="button" onClick={() => changeProfile({ access: "consumer" }, t("common:accessMenu.personal"))} className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 py-1 text-left hover:bg-[var(--s2)] focus-visible:outline-2 focus-visible:outline-[var(--foco)]">
          <span aria-hidden="true" className="inline-flex size-7 shrink-0 items-center justify-center rounded-[8px] bg-[var(--s3)] text-[11.5px] font-bold text-[var(--t2)]">{t("common:accessMenu.personal").slice(0, 1)}</span>
          <span className="flex flex-1 flex-col text-[13px] leading-[1.3]"><span className="font-medium">{t("common:accessMenu.personal")}</span><span className="text-[12px] text-[var(--t3)]">{t("common:accessMenu.personalDetail")}</span></span>
          <ChevronRight size={15} strokeWidth={1.75} aria-hidden="true" className="shrink-0 text-[var(--t3)]" />
        </button> : null}
        {organizations.map((organization) => <button key={organization.id} type="button" onClick={() => changeProfile({ access: "business", tenantId: organization.id }, organization.name)} className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 py-1 text-left hover:bg-[var(--s2)] focus-visible:outline-2 focus-visible:outline-[var(--foco)]">
          <span aria-hidden="true" className="inline-flex size-7 shrink-0 items-center justify-center rounded-[8px] bg-[var(--s3)] text-[11.5px] font-bold text-[var(--t2)]">{initials(organization.name)}</span>
          <span className="flex flex-1 flex-col text-[13px] leading-[1.3]"><span className="font-medium">{organization.name}</span>{organization.roleName ? <span className="text-[12px] text-[var(--t3)]">{organization.roleName}</span> : null}</span>
          <ChevronRight size={15} strokeWidth={1.75} aria-hidden="true" className="shrink-0 text-[var(--t3)]" />
        </button>)}
      </div>
      <button type="button" onClick={() => { void signOut(); }} className="mx-auto inline-flex min-h-9 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold text-[var(--t2)] hover:bg-[var(--s2)] focus-visible:outline-2 focus-visible:outline-[var(--foco)]">
        <LogOutIcon className="size-3.5" />{t("common:accessMenu.signOut")}
      </button>
    </div>
  </main>;
}
