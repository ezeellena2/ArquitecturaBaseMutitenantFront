import type { TFunction } from "i18next";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { defineStatusTones } from "@/shared/format/statusTones";
import { ListCard } from "@/shared/ui/app/ListRow";
import { NumberText } from "@/shared/ui/format/NumberText";
import type { Column } from "@/shared/ui/DataTable";
import { DateText } from "@/shared/ui/format/DateText";
import { PhoneText } from "@/shared/ui/format/PhoneText";
import { StatusBadge } from "@/shared/ui/format/StatusBadge";
import type { WhatsAppBroadcastResponse, WhatsAppRecipientResponse } from "../api/types";
import { audienceLabel, broadcastDate, broadcastResults } from "./lib/broadcastText";

/// Tableros WA-Difusiones y su M-* (.w-est): enviada en verde, programada en celeste y cancelada en gris.
export const broadcastStatusTones = defineStatusTones("WhatsAppBroadcastStatus", { Scheduled: "pending", Sending: "pending", Sent: "success", Cancelled: "neutral" });

/// Tablero WA-Difusion-Resultados: leído y respondió en verde, entregado en gris, se dio de baja en ámbar y no llegó en rojo.
export const recipientStatusTones = defineStatusTones("WhatsAppRecipientStatus", {
  Pending: "neutral", Sent: "neutral", Uncertain: "warning", Delivered: "neutral", Read: "success", Replied: "success", Unsubscribed: "warning", Failed: "danger",
});

export const broadcastsPath = "/org/whatsapp/difusiones";
export const newBroadcastPath = `${broadcastsPath}/nueva`;
export const broadcastPath = (id: string) => `${broadcastsPath}/${encodeURIComponent(id)}`;
/** Duplicar (CC17): Nueva difusión con los datos de la original, que se lee por su id. */
export const duplicateSource = "desde";
export const duplicatePath = (id: string) => `${newBroadcastPath}?${duplicateSource}=${encodeURIComponent(id)}`;
export const contactPath = (id: string) => `/org/whatsapp/contactos/${encodeURIComponent(id)}`;

function dateCell(broadcast: WhatsAppBroadcastResponse): ReactNode {
  return <DateText value={broadcastDate(broadcast)} kind="dateTime" />;
}

export function createBroadcastColumns(t: TFunction): Column<WhatsAppBroadcastResponse>[] {
  return [
    // Tablero WA-Difusiones (base de la 12): un dato por celda; la plantilla y cuántos contactos, en sus columnas.
    {
      id: "name", sortable: true, header: t("whatsapp:broadcasts.columns.broadcast"), type: "custom", mobile: "primary", className: "w-[20%]",
      cell: (broadcast) => <Link className="font-medium text-[var(--t1)] hover:underline" to={broadcastPath(broadcast.id)}>{broadcast.name}</Link>,
    },
    { id: "template", sortable: true, header: t("whatsapp:broadcasts.columns.template"), type: "text", value: (broadcast) => broadcast.template.name },
    { id: "audience", header: t("whatsapp:broadcasts.columns.recipients"), type: "custom", cell: (broadcast) => <span>{audienceLabel(broadcast.audience, t)}</span> },
    { id: "recipients", sortable: true, header: t("whatsapp:broadcasts.columns.contacts"), type: "integer", className: "w-24", value: (broadcast) => broadcast.recipients },
    { id: "status", sortable: true, header: t("whatsapp:broadcasts.columns.status"), type: "status", tones: broadcastStatusTones, mobile: "status", value: (broadcast) => broadcast.status },
    // WA-Difusiones-Base2 (263): entregados y leídos, cada uno en su columna de números; antes de salir, una raya.
    { id: "delivered", sortable: true, header: t("whatsapp:broadcasts.columns.delivered"), type: "integer", className: "w-28", value: (broadcast) => broadcastResults(broadcast)?.delivered },
    { id: "read", sortable: true, header: t("whatsapp:broadcasts.columns.read"), type: "integer", className: "w-24", value: (broadcast) => broadcastResults(broadcast)?.read },
    { id: "date", sortable: true, sortAs: "date", header: t("whatsapp:broadcasts.columns.date"), type: "custom", className: "w-37.5", cell: (broadcast) => dateCell(broadcast) },
  ];
}

/// M-Filas-Base2 (M-WA-Difusiones, 263): una tarjeta con su estado, la fecha y, si ya salió, entregados y leídos, cada dato
/// con su nombre. La plantilla y a quiénes se leen en la difusión.
export function broadcastPhoneRow(broadcast: WhatsAppBroadcastResponse, t: TFunction, trailing?: ReactNode): ReactNode {
  const results = broadcastResults(broadcast);
  return <ListCard key={broadcast.id} to={broadcastPath(broadcast.id)} title={broadcast.name} fields={[
    { label: t("whatsapp:broadcasts.columns.status"), value: <StatusBadge tones={broadcastStatusTones} value={broadcast.status} /> },
    { label: t("whatsapp:broadcasts.columns.date"), value: dateCell(broadcast) },
    { label: t("whatsapp:broadcasts.columns.delivered"), value: <NumberText value={results?.delivered} /> },
    { label: t("whatsapp:broadcasts.columns.read"), value: <NumberText value={results?.read} /> },
  ]} trailing={trailing} />;
}

/** Tablero WA-Difusion-Resultados (base de la 12): el contacto y su número, cada uno en su columna. */
export function createRecipientColumns(t: TFunction, status: (recipient: WhatsAppRecipientResponse) => ReactNode): Column<WhatsAppRecipientResponse>[] {
  return [
    {
      id: "contact", sortable: true, header: t("whatsapp:broadcasts.recipients.columns.contact"), type: "custom", mobile: "primary", className: "w-[30%]",
      cell: (recipient) => <span className="font-medium text-[var(--t1)]">{recipient.contactName ?? <PhoneText value={recipient.displayNumber} />}</span>,
    },
    { id: "number", sortable: true, sortAs: "code", header: t("whatsapp:broadcasts.recipients.columns.number"), type: "custom", className: "w-[22%]", cell: (recipient) => <PhoneText value={recipient.displayNumber} /> },
    { id: "status", sortable: true, sortAs: "status", header: t("whatsapp:broadcasts.recipients.columns.status"), type: "custom", mobile: "status", cell: status },
    { id: "changedAtUtc", sortable: true, sortAs: "date", header: t("whatsapp:broadcasts.recipients.columns.changed"), type: "custom", className: "w-40", cell: (recipient) => <DateText value={recipient.changedAtUtc} kind="dateTime" /> },
  ];
}
