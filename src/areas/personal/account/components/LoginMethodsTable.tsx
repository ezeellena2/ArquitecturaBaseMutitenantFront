import { Mail, MoreVertical, Star, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import googleMark from "@/assets/google-mark.svg";
import type { AccountLoginMethod } from "@/shared/api/types";
import { Button } from "@/shared/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/shared/ui/dropdown-menu";
import { AccountGoogleButton } from "./AccountGoogleButton";

export type MethodAction = "verify" | "remove" | "primary";
interface Props {
  methods: readonly AccountLoginMethod[];
  canLinkGoogle?: boolean;
  onAction: (action: MethodAction, method: AccountLoginMethod) => void;
}

function MethodIcon({ method }: { method: AccountLoginMethod }) {
  return method.type === "Google" ? <img src={googleMark} width="16" height="16" alt="" aria-hidden="true" /> : <Mail size={16} strokeWidth={1.75} aria-hidden="true" />;
}

function MethodDetail({ method }: { method: AccountLoginMethod }) {
  const { t } = useTranslation("account");
  const label = method.managedByTenantId
    ? t("managed", { organization: method.managedByOrganizationName })
    : method.isPrimary
      ? t("primary")
      : t(method.isVerified ? "verified" : "pending");
  return <span className="block truncate text-[13px] text-[var(--t3)]">{label}</span>;
}

function MethodMenu({ method, onAction }: { method: AccountLoginMethod; onAction: Props["onAction"] }) {
  const { t } = useTranslation("account");
  return <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button type="button" aria-label={t("actionsFor", { value: method.value })} className="inline-flex size-8 shrink-0 items-center justify-center rounded-[8px] text-[var(--t3)] hover:bg-[var(--s3)]">
        <MoreVertical size={16} aria-hidden="true" />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      {method.canMakePrimary ? <DropdownMenuItem onSelect={() => onAction("primary", method)}><Star size={16} />{t("makePrimary")}</DropdownMenuItem> : null}
      {method.canMakePrimary ? <DropdownMenuSeparator /> : null}
      <DropdownMenuItem variant="destructive" disabled={!method.canRemove} onSelect={() => onAction("remove", method)}><Trash2 size={16} />{t(method.type === "Google" ? "unlink" : "remove")}</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>;
}

export function LoginMethodsTable({ methods, canLinkGoogle = false, onAction }: Props) {
  const { t } = useTranslation("account");
  const visible = methods.filter((method) => method.type !== "Phone");
  return <ul aria-label={t("methods")} className="m-0 list-none p-0">
    {visible.map((method) => <li key={method.id} className="flex min-h-14 items-center gap-3 border-b border-[var(--borde)] px-4 py-2 odd:bg-[var(--fila-alterna)] last:border-0">
      <MethodIcon method={method} />
      <span className="flex min-w-0 flex-1 flex-col"><span className="truncate font-medium text-[var(--t1)]">{method.value}</span><MethodDetail method={method} /></span>
      {!method.isVerified ? <Button type="button" variant="link" size="sm" className="px-1 text-[13px]" onClick={() => onAction("verify", method)}>{t("verify")}</Button> : null}
      <MethodMenu method={method} onAction={onAction} />
    </li>)}
    {canLinkGoogle ? <li className="flex min-h-14 items-center gap-3 border-b border-[var(--borde)] px-4 py-2 odd:bg-[var(--fila-alterna)] last:border-0">
      <img src={googleMark} width="16" height="16" alt="" aria-hidden="true" />
      <span className="flex min-w-0 flex-1 flex-col"><span className="font-medium text-[var(--t1)]">{t("google")}</span><span className="text-[13px] text-[var(--t3)]">{t("unlinked")}</span></span>
      <AccountGoogleButton compact />
    </li> : null}
  </ul>;
}
