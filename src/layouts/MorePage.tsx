import { Check } from "lucide-react";
import { LogOutIcon } from "@/shared/ui/icons";
import { useTranslation } from "react-i18next";
import { Navigate } from "react-router";
import { useCurrentUser } from "@/auth/useCurrentUser";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import { cn } from "@/shared/lib/utils";
import { AppBar } from "@/shared/ui/app/AppBar";
import { GroupTitle, SettingsGroup, SettingsItem } from "@/shared/ui/app/SettingsGroup";
import { initials, useProfiles } from "@/tenancy/useProfiles";
import { businessNavigation } from "./navigation/business";

/// Tableros M-Mas-Personal y M-WA-Menu: la pestaña «Más» del teléfono. Arriba quién sos; después tus perfiles, para
/// cambiar de uno a otro; en una organización, Administración con lo que tus permisos dejan ver; al final Mi cuenta y
/// Salir. En la compu no existe: el menú lateral y el de la cuenta hacen lo mismo, así que vuelve al Inicio.
export function MorePage() {
  const { t } = useTranslation();
  const phone = useMediaQuery("(max-width: 767px)");
  const { data: user } = useCurrentUser();
  const { name, email, access, profiles, signOut, status } = useProfiles();
  const home = access === "business" ? "/org" : "/";
  if (!phone) return <Navigate to={home} replace />;
  if (status) return <div className="fixed inset-0 z-[100]">{status}</div>;

  const permissions = new Set(user?.permissions ?? []);
  const panel = businessNavigation.administration;
  const administration = access === "business" && panel
    ? [...(panel.sections ?? []).flatMap((section) => section.links), ...panel.links]
      .filter((entry) => entry.to && (!entry.permission || permissions.has(entry.permission)))
    : [];
  const subtitle = access === "business"
    ? user?.organizations.find((organization) => organization.id === user.activeTenantId)?.name
    : t("accessMenu.personal");

  return <div className="flex min-h-full flex-col bg-[var(--s2)]">
    <AppBar title={t("navigation.more")} subtitle={subtitle} />
    <div className="flex items-center gap-3.5 px-5 pt-2 pb-1">
      <span aria-hidden="true" className="inline-flex size-14 shrink-0 items-center justify-center rounded-full bg-[var(--marca)] text-[20px] font-semibold text-[var(--lado-activo)]">{name.charAt(0).toUpperCase()}</span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-[18px] font-semibold text-[var(--t1)]">{name}</span>
        {email ? <span className="truncate text-[13.5px] text-[var(--t3)]">{email}</span> : null}
      </span>
    </div>

    <GroupTitle>{t("accessMenu.profiles")}</GroupTitle>
    <SettingsGroup label={t("accessMenu.profiles")}>
      {profiles.map((profile) => <SettingsItem key={profile.key} title={profile.name} detail={profile.detail ?? undefined} onClick={profile.select}
        tone={profile.unavailable ? "muted" : undefined}
        leading={<span aria-hidden="true" className={cn("inline-flex size-9 shrink-0 items-center justify-center rounded-[10px] text-[13px] font-bold",
          profile.checked ? "bg-[var(--marca-t)] text-[var(--marca-tx)]" : "bg-[var(--s3)] text-[var(--t2)]")}>{initials(profile.name)}</span>}
        trailing={profile.checked ? <Check size={18} strokeWidth={2.25} aria-label={t("accessMenu.current")} className="shrink-0 text-[var(--marca)]" /> : <span />} />)}
    </SettingsGroup>

    {administration.length > 0 ? <>
      <GroupTitle>{t("navigation.administration")}</GroupTitle>
      <SettingsGroup label={t("navigation.administration")}>
        {administration.map((entry) => <SettingsItem key={entry.labelKey} title={t(entry.labelKey)} to={entry.to!} />)}
      </SettingsGroup>
    </> : null}

    <SettingsGroup label={t("accessMenu.myAccount")} className="mt-4">
      <SettingsItem title={t("accessMenu.myAccount")} to="/cuenta" />
      <SettingsItem title={t("accessMenu.signOut")} tone="danger" onClick={() => { void signOut(); }} trailing={<span />}
        leading={<LogOutIcon className="size-[18px] shrink-0 text-[var(--peligro)]" />} />
    </SettingsGroup>
  </div>;
}
