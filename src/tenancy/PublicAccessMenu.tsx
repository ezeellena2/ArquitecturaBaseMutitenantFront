import { useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/shared/ui/Sheet";
import { Avatar } from "@/shared/ui/Avatar";
import { LogOutIcon, UserIcon } from "@/shared/ui/icons";
import { AccessMenu } from "./AccessMenu";
import { initials, useProfiles } from "./useProfiles";

/** El menú usa la sesión global, nunca los datos de la organización publicada. */
function MobilePublicAccessMenu() {
  const { t } = useTranslation(["common", "storefront"]);
  const { account, name, email, access, profiles, signOut, status, accountHref } = useProfiles();
  const [open, setOpen] = useState(false);
  if (!account) return null;
  if (status) return <div className="fixed inset-0 z-[100]">{status}</div>;
  const itemClass = "flex w-full min-h-11 items-center gap-2.5 rounded-[6px] px-2.5 text-left text-[14px] text-[var(--t1)] hover:bg-[var(--s2)]";
  const separator = <div className="my-1 h-px bg-[var(--borde)]" aria-hidden="true" />;

  return <Sheet open={open} onOpenChange={setOpen}>
    <SheetTrigger asChild>
      <button type="button" aria-label={t("storefront:menu.account")} className="inline-flex items-center justify-center rounded-full border-0 bg-transparent p-0 focus-visible:outline-2 focus-visible:outline-[var(--foco)]">
        <Avatar initials={initials(name).slice(0, 1)} size="small" />
      </button>
    </SheetTrigger>
    {/* M-Pagina-Publica: la cuenta abre una hoja inferior con la identidad, perfiles, Mi cuenta y Salir, sin ✕. */}
    <SheetContent showCloseButton={false} aria-describedby={undefined} onInteractOutside={() => setOpen(false)}
      className="rounded-t-[16px] [&_[data-slot=dialog-handle]]:h-1">
      <SheetTitle className="sr-only">{t("accessMenu.menuFor", { name })}</SheetTitle>
      <div className="flex items-center gap-3 px-3 py-2.5">
        <Avatar initials={initials(name).slice(0, 1)} size="medium" className="text-[14px]" />
        <span className="flex min-w-0 flex-1 flex-col leading-[1.3]">
          <span className="truncate text-[14px] font-semibold text-[var(--t1)]">{name}</span>
          {email ? <span className="truncate text-[12.5px] text-[var(--t3)]">{email}</span> : null}
        </span>
      </div>
      <div className="flex flex-col px-2 pt-1.5 pb-[calc(10px+env(safe-area-inset-bottom))]">
        {access !== "platform" ? <>
          <div className="px-2.5 pt-2 pb-1 text-[12.5px] font-semibold text-[var(--t3)]">{t("accessMenu.profiles")}</div>
          <div role="group" aria-label={t("accessMenu.profiles")}>
            {profiles.map((profile) => <button key={profile.key} type="button" aria-pressed={profile.checked} aria-disabled={profile.unavailable || undefined}
              onClick={() => { setOpen(false); if (!profile.checked) profile.select(); }}
              className={cn(itemClass, profile.checked ? "bg-[var(--marca-t)] text-[var(--marca-tx)]" : profile.unavailable ? "text-[var(--t3)]" : "")}>
              <span aria-hidden="true" className={"inline-flex size-7 shrink-0 items-center justify-center rounded-[8px] text-[11.5px] font-bold " + (profile.checked ? "bg-[var(--lado-activo)] text-[var(--marca-tx)]" : "bg-[var(--s3)] text-[var(--t2)]")}>{initials(profile.name)}</span>
              <span className="flex min-w-0 flex-1 flex-col leading-[1.3]">
                <span className="truncate">{profile.name}</span>
                {profile.detail ? <span className="text-[12.5px] text-[var(--t3)]">{profile.detail}</span> : null}
              </span>
              {profile.checked ? <Check size={16} strokeWidth={2.25} className="text-[var(--t3)]" aria-hidden="true" /> : null}
            </button>)}
          </div>
          {separator}
        </> : null}
        <Link to={accountHref} onClick={() => setOpen(false)} className={itemClass}><UserIcon className="size-4 text-[var(--t3)]" />{t("accessMenu.myAccount")}</Link>
        {separator}
        <button type="button" onClick={() => { setOpen(false); void signOut(); }} className={itemClass}><LogOutIcon className="size-4 text-[var(--t3)]" />{t("accessMenu.signOut")}</button>
      </div>
    </SheetContent>
  </Sheet>;
}

/** Escritorio reutiliza el menú de siempre; el teléfono usa la hoja aprobada en lugar de la pestaña privada Más. */
export function PublicAccessMenu() {
  const phone = useMediaQuery("(max-width: 767px)");
  return phone ? <MobilePublicAccessMenu /> : <AccessMenu />;
}
