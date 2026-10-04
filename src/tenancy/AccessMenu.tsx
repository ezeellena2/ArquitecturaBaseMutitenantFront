import { Check, ChevronDown, UserRound } from "lucide-react";
import { Link } from "react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAccess } from "./useAccess";
import { initials, useProfiles, type ProfileEntry } from "./useProfiles";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { LogOutIcon } from "@/shared/ui/icons";

function ProfileRow({ profile, onClose }: { profile: ProfileEntry; onClose: () => void }) {
  const rowClass = `flex w-full min-h-9 items-center gap-2 rounded-[6px] px-2.5 py-1.5 text-left text-[13px] lg:min-h-9 lg:gap-2.5 ${profile.checked ? "bg-[var(--marca-t)] font-medium text-[var(--marca-tx)]" : profile.unavailable ? "cursor-pointer text-[var(--t3)]" : "cursor-pointer text-[var(--t1)] hover:bg-[var(--s2)]"}`;

  return <DropdownMenuItem
    role="menuitemradio"
    aria-checked={profile.checked}
    aria-disabled={profile.unavailable || undefined}
    onSelect={() => { if (profile.checked) onClose(); else profile.select(); }}
    className={rowClass}
  >
    <span aria-hidden="true" className={`inline-flex size-7 shrink-0 items-center justify-center rounded-[8px] text-[11.5px] font-bold lg:size-8 ${profile.checked ? "bg-[var(--lado-activo)] text-[var(--marca-tx)]" : "bg-[var(--s3)] text-[var(--t2)]"}`}>
      {initials(profile.name)}
    </span>
    <span className="flex min-w-0 flex-1 flex-col leading-[1.3]">
      <span className="truncate text-[13px] font-medium text-[var(--t1)] lg:text-[14px]">{profile.name}</span>
      {profile.detail ? <span className="text-[12px] text-[var(--t3)] lg:text-[13px]">{profile.detail}</span> : null}
    </span>
    {profile.checked ? <Check size={16} strokeWidth={2.25} className="text-[var(--t3)]" aria-hidden="true" /> : null}
  </DropdownMenuItem>;
}

/// El menú de la cuenta, arriba a la derecha en la compu (tablero «Criterio · Menús»): quién sos, tus perfiles, Mi
/// cuenta y Salir. En el teléfono lo mismo vive en la pestaña «Más».
export function AccessMenu() {
  const { t } = useTranslation();
  const { activeTenantId, organizations } = useAccess();
  const { account, name, email, access, profiles, signOut, status } = useProfiles();
  const [open, setOpen] = useState(false);

  if (!account) return null;
  if (status) return <div className="fixed inset-0 z-[100]">{status}</div>;
  const currentOrganization = organizations.find((organization) => organization.id === activeTenantId);
  const activeName = access === "consumer" ? t("accessMenu.personal") : currentOrganization?.name ?? "";
  const itemClass = "flex w-full min-h-[34px] items-center gap-2 rounded-[6px] px-2.5 py-1.5 text-[13px] text-[var(--t1)] hover:bg-[var(--s2)]";

  return <DropdownMenu open={open} onOpenChange={setOpen}>
    <DropdownMenuTrigger asChild>
      <button type="button" aria-label={`${name}, ${activeName}`} className="inline-flex h-11 items-center gap-2.5 rounded-xl border border-transparent bg-transparent py-0 pl-1.5 pr-2.5 text-left hover:border-[var(--borde)] hover:bg-[var(--lado-activo)] data-[state=open]:border-[var(--borde)] data-[state=open]:bg-[var(--lado-activo)]">
        <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--marca)] text-sm font-semibold text-[var(--lado-activo)]">{initials(name).slice(0, 1)}</span>
        <span className="flex flex-col leading-[1.25]"><span className="text-sm font-semibold text-[var(--t1)]">{name}</span><span className="text-[13px] text-[var(--t2)]">{activeName}</span></span>
        <ChevronDown size={14} strokeWidth={2} className="text-[var(--t3)]" aria-hidden="true" />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" alignOffset={8} sideOffset={6} aria-label={t("accessMenu.menuFor", { name })} className="w-[320px] min-w-0 rounded-[10px] border-[var(--borde)] bg-[var(--lado-activo)] p-1 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-3 px-2.5 py-2">
        <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--marca)] text-base font-semibold text-[var(--lado-activo)]">{initials(name).slice(0, 1)}</span>
        <span className="flex min-w-0 flex-1 flex-col leading-[1.3]">
          <span className="truncate text-[15px] font-semibold text-[var(--t1)]">{name}</span>
          {email ? <span className="truncate text-[13px] text-[var(--t2)]">{email}</span> : null}
        </span>
      </div>
      <div className="my-1 h-px bg-[var(--borde)]" aria-hidden="true" />
      <div className="px-2.5 pb-0.5 pt-1.5 text-xs font-semibold text-[var(--t3)]">{t("accessMenu.profiles")}</div>
      {profiles.map((profile) => <ProfileRow key={profile.key} profile={profile} onClose={() => setOpen(false)} />)}
      <div className="my-1 h-px bg-[var(--borde)]" aria-hidden="true" />
      <DropdownMenuItem asChild className={itemClass}><Link to="/cuenta" onClick={() => setOpen(false)}><UserRound size={16} aria-hidden="true" />{t("accessMenu.myAccount")}</Link></DropdownMenuItem>
      <DropdownMenuItem onSelect={() => { setOpen(false); void signOut(); }} className={itemClass}><LogOutIcon className="size-4" />{t("accessMenu.signOut")}</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>;
}
