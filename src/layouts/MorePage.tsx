import { Check } from "lucide-react";
import { LogOutIcon } from "@/shared/ui/icons";
import { useTranslation } from "react-i18next";
import { Navigate, useLocation } from "react-router";
import { useCurrentUser } from "@/auth/useCurrentUser";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import { cn } from "@/shared/lib/utils";
import { AppBar } from "@/shared/ui/app/AppBar";
import { Avatar } from "@/shared/ui/Avatar";
import { GroupTitle, SettingsGroup, SettingsItem } from "@/shared/ui/app/SettingsGroup";
import { initials, useProfiles } from "@/tenancy/useProfiles";
import { platformNavigation } from "./navigation/platform";
import { useNavigation } from "./navigation/useNavigation";
import { usePermissions } from "@/auth/usePermissions";
import { visibleNavigation } from "./navigation/visible";
import { activeOrganization, homeOf } from "@/tenancy/access";

/// Tableros M-Mas-Personal, M-WA-Menu y M-Mas-Plat: la pestaña «Más» del teléfono. Arriba quién sos; después tus perfiles, para
/// cambiar de uno a otro (Plataforma no tiene perfiles); Administración con lo que tus permisos dejan ver; al final Mi cuenta y
/// Salir. En la compu no existe: el menú lateral y el de la cuenta hacen lo mismo, así que vuelve al Inicio.
export function MorePage() {
  const { t } = useTranslation();
  const phone = useMediaQuery("(max-width: 767px)");
  const { data: user } = useCurrentUser();
  const { nameLabel, detail, avatarInitials, avatarMuted, access, profiles, signOut, status } = useProfiles();
  const composedNavigation = useNavigation(access ?? "consumer");
  const permissions = usePermissions();
  const navigation = visibleNavigation(composedNavigation, permissions);
  const { pathname } = useLocation();
  if (!phone) return <Navigate to={homeOf(access ?? "consumer")} replace />;
  if (status) return <div className="fixed inset-0 z-[100]">{status}</div>;
  if (access === "platform" && pathname === "/mas" && platformNavigation.moreTo) return <Navigate to={platformNavigation.moreTo} replace />;

  const panel = navigation.administration;
  const administration = panel ? [...(panel.sections ?? []).flatMap((section) => section.links), ...panel.links] : [];
  const personalModules = navigation.moreLinks ?? [];
  const subtitle = access === "platform" ? t("navigation.platform")
    : access === "business" ? activeOrganization(user)?.name : t("accessMenu.personal");

  return <div className="flex min-h-full flex-col bg-[var(--s2)]">
    <AppBar title={t("navigation.more")} subtitle={subtitle} />
    <div className="flex items-center gap-3.5 px-5 pt-2 pb-1">
      <Avatar size="profile" initials={avatarInitials} muted={avatarMuted} />
      <span className="flex min-w-0 flex-col leading-[normal]">
        <span className="truncate text-[18px] font-semibold text-[var(--t1)]">{nameLabel}</span>
        {detail ? <span className="truncate text-[13.5px] text-[var(--t3)]">{detail}</span> : null}
      </span>
    </div>

    {access !== "platform" ? <>
      <GroupTitle>{t("accessMenu.profiles")}</GroupTitle>
      <SettingsGroup label={t("accessMenu.profiles")}>
        {profiles.map((profile) => <SettingsItem key={profile.key} title={profile.name} detail={profile.detail ?? undefined} onClick={profile.select}
          tone={profile.unavailable ? "muted" : undefined}
          leading={<span aria-hidden="true" className={cn("inline-flex size-9 shrink-0 items-center justify-center rounded-[10px] text-[13px] font-bold",
            profile.checked ? "bg-[var(--marca-t)] text-[var(--marca-tx)]" : "bg-[var(--s3)] text-[var(--t2)]")}>{initials(profile.name)}</span>}
          trailing={profile.checked ? <Check size={18} strokeWidth={2.25} aria-label={t("accessMenu.current")} className="shrink-0 text-[var(--marca)]" /> : <span />} />)}
      </SettingsGroup>
    </> : null}

    {personalModules.length > 0 ? <>
      <GroupTitle>{t("navigation.sections")}</GroupTitle>
      <SettingsGroup label={t("navigation.sections")}>
        {personalModules.map((entry) => <SettingsItem key={entry.path} title={t(entry.phoneLabelKey ?? entry.labelKey)} to={entry.path} />)}
      </SettingsGroup>
    </> : null}

    {administration.length > 0 ? <>
      <GroupTitle>{t("navigation.administration")}</GroupTitle>
      <SettingsGroup label={t("navigation.administration")}>
        {administration.map((entry) => <SettingsItem key={entry.labelKey} title={t(entry.phoneLabelKey ?? entry.labelKey)} to={entry.path} />)}
      </SettingsGroup>
    </> : null}

    <SettingsGroup label={t("accessMenu.myAccount")} className="mt-4">
      <SettingsItem title={t("accessMenu.myAccount")} to="/cuenta" />
      <SettingsItem title={t("accessMenu.signOut")} tone="danger" onClick={() => { void signOut(); }} trailing={<span />}
        leading={<LogOutIcon className="size-[18px] shrink-0 text-[var(--peligro)]" />} />
    </SettingsGroup>
  </div>;
}
