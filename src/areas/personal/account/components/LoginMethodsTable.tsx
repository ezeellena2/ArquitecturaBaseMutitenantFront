import { Star, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import googleMark from "@/assets/google-mark.svg";
import type { AccountLoginMethod } from "@/shared/api/types";
import { Button } from "@/shared/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/shared/ui/dropdown-menu";
import { MailIcon, MoreVerticalIcon } from "@/shared/ui/icons";
import { List, ListItem } from "@/shared/ui/List";
import { StatusDotMark } from "@/shared/ui/StatusDot";
import { AccountGoogleButton } from "./AccountGoogleButton";

export type MethodAction = "verify" | "remove" | "primary";
interface Props {
  methods: readonly AccountLoginMethod[];
  canLinkGoogle?: boolean;
  onAction: (action: MethodAction, method: AccountLoginMethod) => void;
}

function MethodIcon({ method }: { method: AccountLoginMethod }) {
  return method.type === "Google" ? <img src={googleMark} width="16" height="16" alt="" aria-hidden="true" /> : <MailIcon className="size-4" />;
}

/// Tableros Cuenta y Cuenta-Metodo: debajo del dato, «Principal» y «Administrado por…» (las dos, si son las dos), «Sin
/// verificar» o nada; un método verificado no lo dice («el estado solo si pide atención», Criterio · Decisiones). Google va
/// por su nombre y lleva debajo su correo. Toda fila mide 56, diga algo debajo o no.
function methodDetail(method: AccountLoginMethod, t: (key: string, options?: Record<string, unknown>) => string): ReactNode {
  // M-Cuenta (.w-est.amb): en el teléfono, «Sin verificar» lleva el punto ámbar de un estado que pide atención; en la
  // compu (Cuenta), la palabra sola.
  if (!method.isVerified) return <span className="inline-flex items-center gap-1.5"><StatusDotMark tone="warning" className="hidden max-md:block" />{t("pending")}</span>;
  const parts = [
    method.type === "Google" ? method.value : null,
    method.isPrimary ? t("primary") : null,
    method.managedByTenantId ? t("managed", { organization: method.managedByOrganizationName }) : null,
  ].filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(" · ") : undefined;
}

function MethodMenu({ method, onAction }: { method: AccountLoginMethod; onAction: Props["onAction"] }) {
  const { t } = useTranslation("account");
  return <DropdownMenu>
    <DropdownMenuTrigger asChild>
      {/* Tableros Cuenta (el ⋮ de 16, gris medio) y M-Cuenta (.ap-it .ap-ib: de 20, casi negro, en un botón de 44, así la
          fila mide 60). */}
      <button type="button" aria-label={t("actionsFor", { value: method.value })} className="inline-flex size-8 shrink-0 items-center justify-center rounded-[8px] text-[var(--t2)] hover:bg-[var(--s3)] max-md:size-11 max-md:rounded-full max-md:text-[var(--t1)]">
        <MoreVerticalIcon className="size-4 max-md:size-5" />
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
    {visible.map((method) => <ListItem key={method.id} className="min-h-14" icon={<MethodIcon method={method} />} title={method.type === "Google" ? t("google") : method.value} detail={methodDetail(method, t)}>
      {/* Cuenta (.cb-enl de 13) y M-Cuenta (.acc-t de 15, como «Vincular»). */}
      {!method.isVerified ? <Button type="button" variant="link" size="sm" className="px-1 text-[13px] max-md:text-[15px]" onClick={() => onAction("verify", method)}>{t("verify")}</Button> : null}
      {method.canMakePrimary || method.canRemove ? <MethodMenu method={method} onAction={onAction} /> : null}
    </ListItem>)}
    {canLinkGoogle ? <ListItem icon={<img src={googleMark} width="16" height="16" alt="" aria-hidden="true" />} title={t("google")} detail={t("unlinked")}>
      <AccountGoogleButton compact />
    </ListItem> : null}
  </List>;
}
