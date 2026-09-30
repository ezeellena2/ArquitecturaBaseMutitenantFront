import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "react-oidc-context";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/auth/useCurrentUser";
import { beginSignOut, cancelSignOut } from "@/auth/signOutStatus";
import { SessionStatusPage } from "@/auth/SessionStatusPage";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import type { OrganizationSummary } from "@/shared/api/types";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/shared/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { useAccess } from "./useAccess";
import { useSwitchAccess, type SwitchTarget } from "./useSwitchAccess";

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

function SignOutIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
    <path d="M10 16l-4-4 4-4" />
    <path d="M6 12h10" />
  </svg>;
}

interface ProfileRowProps {
  name: string;
  detail: string | null;
  checked: boolean;
  disabled: boolean;
  suspended: boolean;
  mobile: boolean;
  onSelect: () => void;
  statusLabel: string;
}

function ProfileRow({ name, detail, checked, disabled, suspended, mobile, onSelect, statusLabel }: ProfileRowProps) {
  const content = <>
    <span aria-hidden="true" className={`inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-[11.5px] font-bold ${checked ? "bg-[var(--lado-activo)] text-[var(--marca-tx)]" : "bg-[var(--s3)] text-[var(--t2)]"}`}>
      {initials(name)}
    </span>
    <span className="flex min-w-0 flex-1 flex-col leading-[1.3]">
      <span className="truncate text-[13px] font-medium text-[var(--t1)]">{name}</span>
      {detail ? <span className="text-xs text-[var(--t3)]">{detail}</span> : null}
    </span>
    {suspended ? <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--alerta-t)] px-2.5 py-[3px] text-[12.5px] font-medium text-[var(--alerta)] before:size-1.5 before:rounded-full before:bg-current before:content-['']">{statusLabel}</span> : null}
    {checked ? <Check size={16} strokeWidth={2.25} className="text-[var(--t3)]" aria-hidden="true" /> : null}
  </>;
  const rowClass = `flex min-h-11 w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] text-[var(--t1)] ${checked ? "bg-[var(--marca-t)] font-medium" : "hover:bg-[var(--s2)]"} ${disabled ? "cursor-default data-[disabled]:opacity-100" : "cursor-pointer"}`;

  return mobile ? (
    <button type="button" disabled={disabled} aria-current={checked ? "true" : undefined} onClick={onSelect} className={rowClass}>
      {content}
    </button>
  ) : (
    <DropdownMenuItem
      role={disabled ? "menuitem" : "menuitemradio"}
      aria-checked={disabled ? undefined : checked}
      disabled={disabled}
      onSelect={onSelect}
      className={rowClass}
    >
      {content}
    </DropdownMenuItem>
  );
}

interface MenuBodyProps {
  mobile: boolean;
  name: string;
  email: string | null;
  organizations: readonly OrganizationSummary[];
  access: "consumer" | "business" | "platform" | null;
  activeTenantId: string | null;
  hasPersonalSpace: boolean;
  onSwitch: (target: SwitchTarget, targetName: string) => void;
  onSignOut: () => void;
  onClose: () => void;
}

function MenuBody({ mobile, name, email, organizations, access, activeTenantId, hasPersonalSpace, onSwitch, onSignOut, onClose }: MenuBodyProps) {
  const { t } = useTranslation();
  const personal = t("accessMenu.personal");
  const itemClass = `flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] text-[var(--t1)] hover:bg-[var(--s2)] ${mobile ? "min-h-11" : "min-h-[34px]"}`;

  return <>
    <div className={`flex items-center gap-3 ${mobile ? "px-[2px] py-2.5" : "px-2.5 py-2"}`}>
      <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--marca)] text-base font-semibold text-[var(--lado-activo)] md:size-10">{initials(name).slice(0, 1)}</span>
      <span className="flex min-w-0 flex-1 flex-col leading-[1.3]">
        <span className="truncate text-[15px] font-semibold text-[var(--t1)]">{name}</span>
        {email ? <span className="truncate text-[13px] text-[var(--t2)]">{email}</span> : null}
      </span>
    </div>
    <div className="my-1 h-px bg-[var(--borde)]" aria-hidden="true" />
    <div className={`${mobile ? "px-3 pb-1 pt-2 text-[13px]" : "px-2.5 pb-0.5 pt-1.5 text-xs"} font-semibold text-[var(--t3)]`}>{t("accessMenu.profiles")}</div>
    {(hasPersonalSpace || access === "business") ? (
      <ProfileRow
        name={personal}
        detail={t("accessMenu.personalDetail")}
        checked={access === "consumer"}
        disabled={false}
        suspended={false}
        mobile={mobile}
        statusLabel=""
        onSelect={() => { if (access === "consumer") onClose(); else onSwitch({ access: "consumer" }, personal); }}
      />
    ) : null}
    {organizations.map((organization) => (
      <ProfileRow
        key={organization.id}
        name={organization.name}
        detail={organization.roleName ?? null}
        checked={access === "business" && activeTenantId === organization.id}
        disabled={organization.status !== "Active" || organization.memberStatus !== "Active" || organization.isSelectable === false}
        suspended={organization.status === "Suspended"}
        mobile={mobile}
        statusLabel={t("accessMenu.suspended")}
        onSelect={() => {
          if (access === "business" && activeTenantId === organization.id) onClose();
          else onSwitch({ access: "business", tenantId: organization.id }, organization.name);
        }}
      />
    ))}
    <div className="my-1 h-px bg-[var(--borde)]" aria-hidden="true" />
    {mobile ? (
      <button type="button" onClick={onSignOut} className={itemClass}><SignOutIcon />{t("accessMenu.signOut")}</button>
    ) : (
      <DropdownMenuItem onSelect={onSignOut} className={itemClass}><SignOutIcon />{t("accessMenu.signOut")}</DropdownMenuItem>
    )}
  </>;
}

export function AccessMenu() {
  const { t } = useTranslation();
  const auth = useAuth();
  const queryClient = useQueryClient();
  const mobile = useMediaQuery("(max-width: 767px)");
  const { data: account } = useCurrentUser();
  const { access, activeTenantId, hasPersonalSpace, organizations } = useAccess();
  const switching = useSwitchAccess();
  const [open, setOpen] = useState(false);
  const [targetName, setTargetName] = useState("");

  if (!account) return null;
  const name = account.displayName || account.email || "";
  const currentOrganization = organizations.find((organization) => organization.id === activeTenantId);
  const activeName = access === "consumer" ? t("accessMenu.personal") : currentOrganization?.name ?? "";
  const menuTitle = t("accessMenu.menuFor", { name });
  const avatar = <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--marca)] text-sm font-semibold text-[var(--lado-activo)] md:size-8">{initials(name).slice(0, 1)}</span>;

  function onSwitch(target: SwitchTarget, destinationName: string) {
    setOpen(false);
    setTargetName(destinationName);
    void switching.switchAccess(target);
  }

  async function onSignOut() {
    setOpen(false);
    beginSignOut();
    queryClient.clear();
    try {
      await auth.signoutRedirect();
    } catch {
      cancelSignOut();
    }
  }

  if (switching.isSwitching) return <div className="fixed inset-0 z-[100]"><SessionStatusPage status="switching" targetName={targetName} /></div>;
  if (switching.hasError) return <div className="fixed inset-0 z-[100]"><SessionStatusPage status="error" loginPath={access === "business" ? "/login/empresa" : "/login"} /></div>;

  const menuBody = <MenuBody
    mobile={mobile}
    name={name}
    email={account.email ?? null}
    organizations={organizations}
    access={access}
    activeTenantId={activeTenantId}
    hasPersonalSpace={hasPersonalSpace}
    onSwitch={onSwitch}
    onSignOut={() => { void onSignOut(); }}
    onClose={() => setOpen(false)}
  />;

  return mobile ? (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" aria-label={t("accessMenu.accountAndProfiles")} className="inline-flex size-11 items-center justify-center rounded-xl">{avatar}</button>
      </DialogTrigger>
      <DialogContent showCloseButton={false} aria-describedby={undefined} className="gap-0 px-2 pb-3 pt-2">
        <DialogTitle className="sr-only">{menuTitle}</DialogTitle>
        <span className="mx-auto mb-2 h-1 w-9 rounded-full bg-[var(--borde2)]" aria-hidden="true" />
        {menuBody}
      </DialogContent>
    </Dialog>
  ) : (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label={`${name}, ${activeName}`} className="inline-flex h-11 items-center gap-2.5 rounded-xl border border-transparent bg-transparent py-0 pl-1.5 pr-2.5 text-left hover:border-[var(--borde)] hover:bg-[var(--lado-activo)] data-[state=open]:border-[var(--borde)] data-[state=open]:bg-[var(--lado-activo)]">
          {avatar}
          <span className="flex flex-col leading-[1.25]"><span className="text-sm font-semibold text-[var(--t1)]">{name}</span><span className="text-[13px] text-[var(--t2)]">{activeName}</span></span>
          <ChevronDown size={14} strokeWidth={2} className="text-[var(--t3)]" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" alignOffset={8} sideOffset={6} aria-label={menuTitle} className="w-[330px] min-w-0 rounded-xl border-[var(--borde)] bg-[var(--lado-activo)] p-1.5 shadow-[var(--shadow-card)]">
        {menuBody}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
