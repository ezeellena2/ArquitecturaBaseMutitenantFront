import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import googleMark from "@/assets/google-mark.svg";
import type { AccountLoginMethod } from "@/shared/api/types";
import { Button } from "@/shared/ui/button";
import { RowActions } from "@/shared/ui/RowActions";
import { PhoneText } from "@/shared/ui/format/PhoneText";
import { useFormat } from "@/shared/format/useFormat";
import { DeleteIcon, MailIcon, StarIcon, WhatsAppIcon } from "@/shared/ui/icons";
import { List, ListItem } from "@/shared/ui/List";
import { StatusDotMark } from "@/shared/ui/StatusDot";
import { AccountGoogleButton } from "./AccountGoogleButton";

export type MethodAction = "verify" | "remove" | "primary";
interface Props {
  methods: readonly AccountLoginMethod[];
  canLinkGoogle?: boolean;
  onAction: (action: MethodAction, method: AccountLoginMethod, trigger?: HTMLButtonElement | null) => void;
}

function MethodIcon({ method }: { method: AccountLoginMethod }) {
  return method.type === "Google" ? <img src={googleMark} width="16" height="16" alt="" aria-hidden="true" /> : method.type === "Phone" ? <WhatsAppIcon className="size-4" /> : <MailIcon className="size-4" />;
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
  const format = useFormat();
  const value = method.type === "Phone" ? format.formatPhone(method.value ?? "") : method.value;
  return <RowActions label={t("actionsFor", { value })} title={method.type === "Google" ? t("google") : value ?? undefined} actions={[
    { label: t("makePrimary"), accessibleName: t("makePrimary"), icon: StarIcon, hidden: !method.canMakePrimary, onSelect: (trigger) => onAction("primary", method, trigger) },
    { label: t(method.type === "Google" ? "unlink" : "remove"), accessibleName: t(method.type === "Google" ? "unlink" : "remove"), icon: DeleteIcon, destructive: true, hidden: !method.canRemove, onSelect: (trigger) => onAction("remove", method, trigger) },
  ]} />;
}

export function LoginMethodsTable({ methods, canLinkGoogle = false, onAction }: Props) {
  const { t } = useTranslation("account");
  return <List label={t("methods")}>
    {methods.map((method) => <ListItem key={method.id} className="min-h-14" icon={<MethodIcon method={method} />} title={method.type === "Google" ? t("google") : method.type === "Phone" ? <PhoneText value={method.value} /> : method.value} detail={methodDetail(method, t)}>
      {/* Cuenta (.cb-enl de 13) y M-Cuenta (.acc-t de 15, como «Vincular»). */}
      {!method.isVerified ? <Button type="button" variant="link" size="sm" className="px-1 text-[13px] max-md:text-[15px]" onClick={() => onAction("verify", method)}>{t("verify")}</Button> : null}
      {method.canMakePrimary || method.canRemove ? <MethodMenu method={method} onAction={onAction} /> : null}
    </ListItem>)}
    {canLinkGoogle ? <ListItem icon={<img src={googleMark} width="16" height="16" alt="" aria-hidden="true" />} title={t("google")} detail={t("unlinked")}>
      <AccountGoogleButton compact />
    </ListItem> : null}
  </List>;
}
