import { Mail, MoreVertical, ShieldCheck, Star, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import googleMark from "@/assets/google-mark.svg";
import type { AccountLoginMethod } from "@/shared/api/types";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/shared/ui/dropdown-menu";

export type MethodAction = "verify" | "remove" | "primary";
interface Props { methods: readonly AccountLoginMethod[]; onAction: (action: MethodAction, method: AccountLoginMethod) => void }

function MethodIcon({ method }: { method: AccountLoginMethod }) {
  return method.type === "Google" ? <img src={googleMark} width="15" height="15" alt="" aria-hidden="true" /> : <Mail size={16} strokeWidth={1.75} aria-hidden="true" />;
}
function MethodTags({ method }: { method: AccountLoginMethod }) {
  const { t } = useTranslation("account");
  return <span className="flex flex-wrap items-center gap-1.5">
    {method.isPrimary ? <span className="rounded-md bg-[var(--marca-t)] px-2 py-[2px] text-xs text-[var(--marca-tx)]">{t("primary")}</span> : null}
    {method.managedByTenantId ? <span className="rounded-md bg-[var(--s3)] px-2 py-[2px] text-xs text-[var(--t2)]">{t("managed", { organization: method.managedByOrganizationName })}</span> : null}
  </span>;
}
function MethodStatus({ method }: { method: AccountLoginMethod }) {
  const { t } = useTranslation("account");
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] text-[12.5px] font-medium before:size-1.5 before:rounded-full before:bg-current before:content-[''] ${method.isVerified ? "bg-[var(--exito-t)] text-[var(--exito)]" : "bg-[var(--alerta-t)] text-[var(--alerta)]"}`}>
    {t(method.isVerified ? "verified" : "pending")}
  </span>;
}
function MethodMenu({ method, onAction }: { method: AccountLoginMethod; onAction: Props["onAction"] }) {
  const { t } = useTranslation("account");
  return <DropdownMenu>
    <DropdownMenuTrigger asChild><button type="button" aria-label={t("actionsFor", { value: method.value })} className="inline-flex size-11 items-center justify-center rounded-lg text-[var(--t3)] hover:bg-[var(--s3)] md:size-7"><MoreVertical size={16} aria-hidden="true" /></button></DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      {method.canMakePrimary ? <DropdownMenuItem onSelect={() => onAction("primary", method)}><Star size={16} />{t("makePrimary")}</DropdownMenuItem> : null}
      {!method.isVerified ? <DropdownMenuItem onSelect={() => onAction("verify", method)}><ShieldCheck size={16} />{t("verify")}</DropdownMenuItem> : null}
      {method.canMakePrimary || !method.isVerified ? <DropdownMenuSeparator /> : null}
      <DropdownMenuItem variant="destructive" disabled={!method.canRemove} onSelect={() => onAction("remove", method)}><Trash2 size={16} />{t(method.type === "Google" ? "unlink" : "remove")}</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>;
}

export function LoginMethodsTable({ methods, onAction }: Props) {
  const { t } = useTranslation("account");
  const mobile = useMediaQuery("(max-width: 767px)");
  // WhatsApp se habilita con el canal de E8; el backend sigue siendo dueño de las reglas.
  const visible = methods.filter((method) => method.type !== "Phone");
  if (mobile) return <ul className="col-span-full overflow-hidden rounded-xl border border-[var(--borde)]">
    {visible.map((method) => <li key={method.id} className="grid grid-cols-[20px_minmax(0,1fr)_28px] items-center gap-2 border-b border-[var(--borde)] px-3 py-2 last:border-0">
      <MethodIcon method={method} /><div className="min-w-0"><span className="block truncate">{method.value}</span><div className="mt-1 flex flex-wrap items-center gap-1.5"><MethodTags method={method} /><MethodStatus method={method} /></div></div><MethodMenu method={method} onAction={onAction} />
    </li>)}
  </ul>;
  return <div className="col-span-full overflow-hidden rounded-xl border border-[var(--borde)]">
    <table className="w-full table-fixed border-collapse text-left text-[13px]">
      <colgroup><col className="w-[110px]" /><col /><col /><col className="w-[110px]" /><col className="w-[52px]" /></colgroup>
      <thead className="bg-[var(--cab)] text-xs text-[var(--t3)]"><tr>{["type", "destination", "flags", "status", "actions"].map((key) => <th key={key} className="px-3 py-2.5 font-semibold"><span className={key === "flags" || key === "actions" ? "sr-only" : undefined}>{t(key)}</span></th>)}</tr></thead>
      <tbody>{visible.map((method) => <tr key={method.id} className="border-t border-[var(--borde)]">
        <td className="px-3 py-2.5"><span className="flex items-center gap-2 text-[var(--t2)]"><MethodIcon method={method} />{t(method.type === "Google" ? "google" : "email")}</span></td>
        <td className="truncate px-3 py-2.5">{method.value}</td><td className="px-3 py-2.5"><MethodTags method={method} /></td><td className="px-3 py-2.5"><MethodStatus method={method} /></td><td className="px-3 py-2.5"><MethodMenu method={method} onAction={onAction} /></td>
      </tr>)}</tbody>
    </table>
  </div>;
}
