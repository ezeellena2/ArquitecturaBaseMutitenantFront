import { Check } from "lucide-react";
import { Link } from "react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { activeOrganization } from "./access";
import { initials, useProfiles, type ProfileEntry } from "./useProfiles";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Avatar } from "@/shared/ui/Avatar";
import { ChevronDownIcon, LogOutIcon, UserIcon } from "@/shared/ui/icons";

// «Criterio · Menús» y tableros Inicio-Personal y Cuenta (.w-mn): filas de 44 con el ícono del perfil de 28, el nombre
// en 13 y el rol o el estado en gris de 12,5; el perfil activo, en petróleo sobre petróleo claro y con tilde.
function ProfileRow({ profile, onClose }: { profile: ProfileEntry; onClose: () => void }) {
  const rowClass = `flex w-full min-h-11 items-center gap-2.5 rounded-[6px] px-2.5 py-0 text-left text-[13px] ${profile.checked ? "bg-[var(--marca-t)] text-[var(--marca-tx)]" : profile.unavailable ? "cursor-pointer text-[var(--t3)]" : "cursor-pointer text-[var(--t1)] hover:bg-[var(--s2)]"}`;

  return <DropdownMenuItem
    role="menuitemradio"
    aria-checked={profile.checked}
    aria-disabled={profile.unavailable || undefined}
    onSelect={() => { if (profile.checked) onClose(); else profile.select(); }}
    className={rowClass}
  >
    <span aria-hidden="true" className={`inline-flex size-7 shrink-0 items-center justify-center rounded-[8px] text-[11.5px] font-bold ${profile.checked ? "bg-[var(--lado-activo)] text-[var(--marca-tx)]" : "bg-[var(--s3)] text-[var(--t2)]"}`}>
      {initials(profile.name)}
    </span>
    <span className="flex min-w-0 flex-1 flex-col leading-[1.3]">
      <span className="truncate text-[13px]">{profile.name}</span>
      {profile.detail ? <span className={`text-[12.5px] ${profile.checked ? "" : "text-[var(--t3)]"}`}>{profile.detail}</span> : null}
    </span>
    {profile.checked ? <Check size={16} strokeWidth={2.25} className="text-[var(--t3)]" aria-hidden="true" /> : null}
  </DropdownMenuItem>;
}

/// El menú de la cuenta, arriba a la derecha en la compu (tablero «Criterio · Menús»): quién sos, tus perfiles, Mi
/// cuenta y Salir. En el teléfono lo mismo vive en la pestaña «Más».
export function AccessMenu() {
  const { t } = useTranslation();
  const { account, name, email, access, profiles, signOut, status } = useProfiles();
  const [open, setOpen] = useState(false);

  if (!account) return null;
  if (status) return <div className="fixed inset-0 z-[100]">{status}</div>;
  const activeName = access === "consumer" ? t("accessMenu.personal") : activeOrganization(account)?.name ?? "";
  // Mi cuenta y Salir van cada uno en su grupo, separados por una línea con aire, como en el tablero.
  const itemClass = "flex w-full min-h-9 items-center gap-2.5 rounded-[6px] border-t-0 px-2.5 py-0 text-[13px] text-[var(--t1)] hover:bg-[var(--s2)]";
  const separator = <div className="my-1 h-px bg-[var(--borde)]" aria-hidden="true" />;

  return <DropdownMenu open={open} onOpenChange={setOpen}>
    <DropdownMenuTrigger asChild>
      {/* «Criterio · Menús»: tu inicial, tu nombre en 13 y negrita y el perfil en gris de 12; abierto, en blanco con borde. */}
      <button type="button" aria-label={`${name}, ${activeName}`} className="inline-flex h-10 items-center gap-2.5 rounded-[10px] border border-transparent bg-transparent py-0 pl-1 pr-2 text-left hover:border-[var(--borde)] hover:bg-[var(--lado-activo)] data-[state=open]:border-[var(--borde)] data-[state=open]:bg-[var(--lado-activo)]">
        <Avatar initials={initials(name).slice(0, 1)} />
        <span className="flex flex-col leading-[1.25]"><span className="text-[13px] font-bold text-[var(--t1)]">{name}</span><span className="text-[12px] text-[var(--t2)]">{activeName}</span></span>
        <ChevronDownIcon strokeWidth={2} className="size-3.5 text-[var(--t3)]" />
      </button>
    </DropdownMenuTrigger>
    {/* Las filas miden 320, como en «Criterio · Menús» y en el tablero Inicio-Personal; la caja suma su margen de 4 y el
        borde, y queda alineada con el botón por la derecha. */}
    <DropdownMenuContent align="end" sideOffset={6} aria-label={t("accessMenu.menuFor", { name })} className="w-[330px] min-w-0 max-w-[330px] rounded-[10px] border-[var(--borde)] bg-[var(--lado-activo)] p-1 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2.5 p-2.5">
        <Avatar size="medium" initials={initials(name).slice(0, 1)} />
        <span className="flex min-w-0 flex-1 flex-col leading-[1.3]">
          <span className="truncate text-[13px] font-semibold text-[var(--t1)]">{name}</span>
          {email ? <span className="truncate text-[12.5px] text-[var(--t3)]">{email}</span> : null}
        </span>
      </div>
      {separator}
      <div className="px-2.5 pt-2 pb-1 text-[12.5px] leading-[normal] font-semibold text-[var(--t3)]">{t("accessMenu.profiles")}</div>
      <DropdownMenuGroup>
        {profiles.map((profile) => <ProfileRow key={profile.key} profile={profile} onClose={() => setOpen(false)} />)}
      </DropdownMenuGroup>
      {separator}
      <DropdownMenuItem asChild className={itemClass}><Link to="/cuenta" onClick={() => setOpen(false)}><UserIcon className="size-4" />{t("accessMenu.myAccount")}</Link></DropdownMenuItem>
      {separator}
      <DropdownMenuItem onSelect={() => { setOpen(false); void signOut(); }} className={itemClass}><LogOutIcon className="size-4" />{t("accessMenu.signOut")}</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>;
}
