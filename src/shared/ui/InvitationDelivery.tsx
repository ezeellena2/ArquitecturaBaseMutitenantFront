import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { InvitationDeliveryStatus } from "@/shared/api/types";
import { invitationDeliveryTones } from "@/shared/format/statusTones";
import { useFormat } from "@/shared/format/useFormat";
import type { ResendInvitation } from "@/shared/hooks/useResendInvitation";
import { useAppChrome } from "./app/AppChrome";
import { SettingsItem } from "./app/SettingsGroup";
import { ConfirmDialog } from "./ConfirmDialog";
import { StatusBadge } from "./format/StatusBadge";
import { RotateIcon } from "./icons";
import { InfoTip } from "./InfoTip";
import { Section } from "./Section";

/** Por dónde salió una invitación: el correo o, la de un teléfono, WhatsApp. El porqué de su entrega lo nombra. */
export type InvitationChannel = "email" | "whatsapp";

const channelKey = { email: "Email", whatsapp: "WhatsApp" } as const;

/// La entrega de una invitación (`invitationDelivery`, 0066 §4; tableros Usuarios, Usuario, Empresa, Cuentas y Cuenta-Plat
/// `-Base2`): el punto y la palabra (Pendiente, Enviada, Sin confirmar o No se pudo enviar) y, salvo la enviada, su porqué en
/// la (i), según el canal. Sin invitación pendiente, la raya. `info={false}` la deja sin la (i) donde no se puede tocar: dentro
/// de una tarjeta que abre la ficha, que la muestra con su (i).
export function InvitationDeliveryBadge({ value, channel, info = true }: { value: InvitationDeliveryStatus | null | undefined; channel: InvitationChannel; info?: boolean }) {
  const { t } = useTranslation();
  const format = useFormat();
  const reason = value === "Pending" ? t("invitationDelivery.why.Pending")
    : value === "Uncertain" || value === "Failed" ? t(`invitationDelivery.why.${value}${channelKey[channel]}`) : null;
  if (value == null || !info || !reason) return <StatusBadge tones={invitationDeliveryTones} value={value} />;
  return <span className="inline-flex items-center gap-1">
    <StatusBadge tones={invitationDeliveryTones} value={value} />
    <InfoTip text={reason} title={format.formatEnum(invitationDeliveryTones.enum, value)} />
  </span>;
}

/// La confirmación de reenviar una invitación sin confirmar (tableros `-Base2`, «Reenviar una invitación sin confirmar»), que
/// abre `useResendInvitation`: «¿Reenviar la invitación a …?», con quién revisar (su nombre o «la persona») y el canal que no
/// confirmó el envío.
export function ResendInvitationDialog({ resend, name, person, channel, pending }: {
  resend: ResendInvitation;
  /** A quién se reenvía, como dice la fila: el nombre, el correo o el teléfono. */
  name: string;
  /** Con quién revisar: el nombre de la persona, si lo tiene. */
  person?: string | null;
  channel: InvitationChannel;
  pending: boolean;
}) {
  const { t } = useTranslation();
  return <ConfirmDialog open={resend.confirming !== null} onOpenChange={(open) => { if (!open) resend.close(); }}
    title={t("invitationDelivery.resend.title", { name })}
    description={t(`invitationDelivery.resend.description${channelKey[channel]}`, { person: person || t("invitationDelivery.resend.thePerson") })}
    confirmLabel={t("invitationDelivery.resend.confirm")} returnFocusTo={resend.confirming?.trigger}
    pending={pending} pendingLabel={t("invitationDelivery.resend.pending")} onConfirm={resend.confirm} />;
}

export interface InvitationDetail { key: string; label: string; value: ReactNode }

/// La caja «Invitación» de una ficha (tableros Usuario-Base2 y Cuenta-Plat-Base2, primera en el cuerpo): cada dato con su
/// nombre, en dos columnas en la compu (el nombre sobre arena clara) y uno debajo de otro en el teléfono (M-Usuario-Base2 y
/// M-Cuenta-Plat-Base2). «Reenviar invitación» va en su encabezado cuando la ficha no lo tiene en la banda.
export function InvitationSection({ details, resend }: {
  details: readonly InvitationDetail[];
  resend?: { onClick: () => void; pending: boolean };
}) {
  const { t } = useTranslation();
  const { phone } = useAppChrome();
  return <Section title={t("invitationDelivery.box.title")} action={resend ? { label: t("invitationDelivery.box.resend"), icon: RotateIcon,
    onClick: resend.onClick, pending: resend.pending, pendingLabel: t("invitationDelivery.resend.pending") } : undefined}>
    {phone ? <ul className="m-0 list-none p-0">
      {details.map((detail) => <SettingsItem key={detail.key} title={detail.label} detail={detail.value} />)}
    </ul> : <dl className="m-0 grid grid-cols-[12.5rem_minmax(0,1fr)] text-[0.875rem] [&>div:first-child>*]:border-t-0">
      {details.map((detail) => <div key={detail.key} className="contents">
        <dt className="border-t border-[var(--borde)] bg-[var(--s2)] px-3.5 py-2.25 text-[var(--t2)]">{detail.label}</dt>
        <dd className="m-0 flex min-w-0 flex-wrap items-center gap-1 border-t border-[var(--borde)] px-3.5 py-2.25 text-[var(--t1)] [overflow-wrap:anywhere]">{detail.value}</dd>
      </div>)}
    </dl>}
  </Section>;
}
