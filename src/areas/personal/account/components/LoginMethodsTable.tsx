import { Mail, MoreVertical, Star, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import googleMark from "@/assets/google-mark.svg";
import type { AccountLoginMethod } from "@/shared/api/types";
import { Button } from "@/shared/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/shared/ui/dropdown-menu";
import { List, ListItem } from "@/shared/ui/List";
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

function methodDetail(method: AccountLoginMethod, t: (key: string, options?: Record<string, unknown>) => string): string {
  return method.managedByTenantId
    ? t("managed", { organization: method.managedByOrganizationName })
    : method.isPrimary
      ? t("primary")
      : t(method.isVerified ? "verified" : "pending");
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
      {method.canMakePrimary && method.canRemove ? <DropdownMenuSeparator /> : null}
      {method.canRemove ? <DropdownMenuItem variant="destructive" onSelect={() => onAction("remove", method)}><Trash2 size={16} />{t(method.type === "Google" ? "unlink" : "remove")}</DropdownMenuItem> : null}
    </DropdownMenuContent>
  </DropdownMenu>;
}

export function LoginMethodsTable({ methods, canLinkGoogle = false, onAction }: Props) {
  const { t } = useTranslation("account");
  const visible = methods.filter((method) => method.type !== "Phone");
  return <List label={t("methods")}>
    {visible.map((method) => <ListItem key={method.id} icon={<MethodIcon method={method} />} title={method.value} detail={methodDetail(method, t)}>
      {!method.isVerified ? <Button type="button" variant="link" size="sm" className="px-1 text-[13px]" onClick={() => onAction("verify", method)}>{t("verify")}</Button> : null}
      {method.canMakePrimary || method.canRemove ? <MethodMenu method={method} onAction={onAction} /> : null}
    </ListItem>)}
    {canLinkGoogle ? <ListItem icon={<img src={googleMark} width="16" height="16" alt="" aria-hidden="true" />} title={t("google")} detail={t("unlinked")}>
      <AccountGoogleButton compact />
    </ListItem> : null}
  </List>;
}
