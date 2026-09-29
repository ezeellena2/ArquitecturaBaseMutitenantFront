import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Clock3, ChevronRight, LockKeyhole, LogOut, TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "react-oidc-context";
import { SessionStatusPage } from "@/auth/SessionStatusPage";
import { beginSignOut, cancelSignOut, useIsSigningOut } from "@/auth/signOutStatus";
import { useCurrentUser } from "@/auth/useCurrentUser";
import { useSwitchAccess, type SwitchTarget } from "@/tenancy/useSwitchAccess";

export type UnavailableCode = "Tenancy.Tenant.Suspended" | "Tenancy.Tenant.PendingApproval" | "Tenancy.Tenant.Closed";

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

export function OrganizationUnavailablePage({ code, organizationName, organizationId }: {
  code: UnavailableCode;
  organizationName: string;
  organizationId: string;
}) {
  const { t } = useTranslation(["errors", "common", "auth"]);
  const { data: account } = useCurrentUser();
  const switching = useSwitchAccess();
  const auth = useAuth();
  const queryClient = useQueryClient();
  const isSigningOut = useIsSigningOut();
  const [targetName, setTargetName] = useState("");

  if (isSigningOut) return <SessionStatusPage status="closing" />;
  if (switching.isSwitching) return <SessionStatusPage status="switching" targetName={targetName} />;
  if (switching.hasError) return <SessionStatusPage status="error" loginPath="/login/empresa" />;

  const pending = code === "Tenancy.Tenant.PendingApproval";
  const closed = code === "Tenancy.Tenant.Closed";
  const title = t(`errors:errorPage.unavailable.${pending ? "pendingTitle" : closed ? "closedTitle" : "suspendedTitle"}`, { organizationName });
  const description = t(`errors:errorPage.unavailable.${pending ? "pendingDescription" : closed ? "closedDescription" : "suspendedDescription"}`);
  const Icon = pending ? Clock3 : closed ? LockKeyhole : TriangleAlert;
  const iconTone = pending ? "bg-[var(--marca-t)] text-[var(--marca-tx)]" : closed ? "bg-[var(--s3)] text-[var(--t2)]" : "bg-[var(--alerta-t)] text-[var(--alerta)]";
  const organizations = account?.organizations.filter((item) => item.id !== organizationId && item.status === "Active") ?? [];

  function changeProfile(target: SwitchTarget, name: string): void {
    setTargetName(name);
    void switching.switchAccess(target);
  }

  async function signOut(): Promise<void> {
    beginSignOut();
    queryClient.clear();
    try {
      await auth.signoutRedirect();
    } catch {
      cancelSignOut();
    }
  }

  return <main className="relative min-h-dvh bg-[var(--fondo)] px-5 py-8 text-[var(--t1)]">
    <div className="absolute left-6 top-6 flex items-center gap-2.5 text-[17px] font-bold md:left-12 md:top-8">
      <span aria-hidden="true" className="size-8 rounded-[9px] bg-gradient-to-br from-[var(--marca)] to-[var(--marca-2)]" />
      {t("auth:brand")}
    </div>
    <div className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-[460px] flex-col justify-center gap-[22px] pt-12">
      <div className="flex flex-col items-center gap-4 text-center">
        <span aria-hidden="true" className={`inline-flex size-16 items-center justify-center rounded-full ${iconTone}`}><Icon size={20} strokeWidth={1.75} /></span>
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.02em]">{title}</h1>
          <p className="mt-2 text-[15px] text-[var(--t2)]">{description}</p>
        </div>
      </div>
      <div className="rounded-2xl border border-[var(--borde)] bg-[var(--lado-activo)] p-1.5 shadow-[var(--shadow-card)]">
        <div className="px-3 pb-1 pt-2 text-[13px] font-semibold text-[var(--t3)]">{t("errors:errorPage.unavailable.otherProfile")}</div>
        {account?.hasPersonalSpace ? <button type="button" onClick={() => changeProfile({ access: "consumer" }, t("common:accessMenu.personal"))} className="flex min-h-12 w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-[var(--s2)] focus-visible:outline-2 focus-visible:outline-[var(--foco)]">
          <span aria-hidden="true" className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--marca-t)] text-sm font-semibold text-[var(--marca-tx)]">{t("common:accessMenu.personal").slice(0, 1)}</span>
          <span className="flex flex-1 flex-col text-sm"><span className="font-semibold">{t("common:accessMenu.personal")}</span><span className="text-[13px] text-[var(--t3)]">{t("common:accessMenu.personalDetail")}</span></span>
          <ChevronRight size={16} strokeWidth={1.75} aria-hidden="true" />
        </button> : null}
        {organizations.map((organization) => <button key={organization.id} type="button" onClick={() => changeProfile({ access: "business", tenantId: organization.id }, organization.name)} className="flex min-h-12 w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-[var(--s2)] focus-visible:outline-2 focus-visible:outline-[var(--foco)]">
          <span aria-hidden="true" className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--marca-t)] text-[13px] font-semibold text-[var(--marca-tx)]">{initials(organization.name)}</span>
          <span className="flex flex-1 flex-col text-sm"><span className="font-semibold">{organization.name}</span>{organization.roleName ? <span className="text-[13px] text-[var(--t3)]">{organization.roleName}</span> : null}</span>
          <ChevronRight size={16} strokeWidth={1.75} aria-hidden="true" />
        </button>)}
      </div>
      <button type="button" onClick={() => { void signOut(); }} className="mx-auto inline-flex min-h-11 items-center gap-2 rounded-lg px-4 text-sm font-medium text-[var(--t2)] hover:bg-[var(--s2)] focus-visible:outline-2 focus-visible:outline-[var(--foco)]">
        <LogOut size={16} strokeWidth={1.75} aria-hidden="true" />{t("common:accessMenu.signOut")}
      </button>
    </div>
  </main>;
}
