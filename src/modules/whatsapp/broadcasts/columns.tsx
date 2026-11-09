import type { TFunction } from "i18next";
import type { ReactNode } from "react";
import { Link } from "react-router";
import type { FormatState } from "@/shared/format/useFormat";
import { defineStatusTones } from "@/shared/format/statusTones";
import { ListRow } from "@/shared/ui/app/ListRow";
import type { Column } from "@/shared/ui/DataTable";
import { DateText } from "@/shared/ui/format/DateText";
import { EmptyValue } from "@/shared/ui/format/EmptyValue";
import { PhoneText } from "@/shared/ui/format/PhoneText";
import { StatusBadge } from "@/shared/ui/format/StatusBadge";
import type { WhatsAppBroadcastResponse, WhatsAppRecipientResponse } from "../api/types";
import { countOf } from "../lib/values";
import { audienceLabel, broadcastDate, resultsLabel } from "./lib/broadcastText";

/// Tableros WA-Difusiones y su M-* (.w-est): enviada en verde, programada en celeste y cancelada en gris.
export const broadcastStatusTones = defineStatusTones("WhatsAppBroadcastStatus", { Scheduled: "pending", Sending: "pending", Sent: "success", Cancelled: "neutral" });

/// Tablero WA-Difusion-Resultados: leído y respondió en verde, entregado en gris, se dio de baja en ámbar y no llegó en rojo.
export const recipientStatusTones = defineStatusTones("WhatsAppRecipientStatus", {
  Pending: "neutral", Sent: "neutral", Delivered: "neutral", Read: "success", Replied: "success", Unsubscribed: "warning", Failed: "danger",
});

export const broadcastsPath = "/org/whatsapp/difusiones";
export const newBroadcastPath = `${broadcastsPath}/nueva`;
export const broadcastPath = (id: string) => `${broadcastsPath}/${encodeURIComponent(id)}`;
/** Duplicar (CC17): Nueva difusión con los datos de la original, que se lee por su id. */
export const duplicateSource = "desde";
export const duplicatePath = (id: string) => `${newBroadcastPath}?${duplicateSource}=${encodeURIComponent(id)}`;
export const contactPath = (id: string) => `/org/whatsapp/contactos/${encodeURIComponent(id)}`;

function dateCell(broadcast: WhatsAppBroadcastResponse): ReactNode {
  const { value, withTime } = broadcastDate(broadcast);
  return <DateText value={value} kind={withTime ? "dateTime" : "date"} />;
}

export function createBroadcastColumns(t: TFunction, format: FormatState): Column<WhatsAppBroadcastResponse>[] {
  return [
    // Tablero WA-Difusiones (base de la 12): un dato por celda; la plantilla y cuántos contactos, en sus columnas.
    {
      id: "name", header: t("whatsapp:broadcasts.columns.broadcast"), type: "custom", mobile: "primary", className: "w-[20%]",
      cell: (broadcast) => <Link className="font-medium text-[var(--t1)] hover:underline" to={broadcastPath(broadcast.id)}>{broadcast.name}</Link>,
    },
    { id: "template", header: t("whatsapp:broadcasts.columns.template"), type: "text", value: (broadcast) => broadcast.template.name },
    { id: "audience", header: t("whatsapp:broadcasts.columns.recipients"), type: "custom", cell: (broadcast) => <span>{audienceLabel(broadcast.audience, t)}</span> },
    { id: "recipients", header: t("whatsapp:broadcasts.columns.contacts"), type: "integer", className: "w-24", value: (broadcast) => broadcast.recipients },
    { id: "status", header: t("whatsapp:broadcasts.columns.status"), type: "status", tones: broadcastStatusTones, mobile: "status", value: (broadcast) => broadcast.status },
    {
      id: "results", header: t("whatsapp:broadcasts.columns.results"), type: "custom",
      cell: (broadcast) => { const results = resultsLabel(broadcast, t, format); return results ? <span>{results}</span> : <EmptyValue />; },
    },
    { id: "date", header: t("whatsapp:broadcasts.columns.date"), type: "custom", className: "w-37.5", cell: (broadcast) => dateCell(broadcast) },
  ];
}

/// M-WA-Difusiones: el nombre con la fecha a la derecha, la plantilla, a quiénes y cuántos, y abajo el estado con sus
/// resultados.
export function broadcastPhoneRow(broadcast: WhatsAppBroadcastResponse, t: TFunction, format: FormatState, trailing?: ReactNode): ReactNode {
  const results = resultsLabel(broadcast, t, format);
  return <ListRow key={broadcast.id} to={broadcastPath(broadcast.id)} title={broadcast.name} meta={dateCell(broadcast)}
    lines={[
      [broadcast.template.name, audienceLabel(broadcast.audience, t), t("whatsapp:broadcasts.contacts", countOf(format, broadcast.recipients))].join(" · "),
      <span key="status" className="inline-flex max-w-full items-center gap-1">
        <StatusBadge tones={broadcastStatusTones} value={broadcast.status} className="text-[0.8125rem] text-[var(--t2)]" />
        {results ? <span>{`· ${results}`}</span> : null}
      </span>,
    ]} trailing={trailing} />;
}

/** Tablero WA-Difusion-Resultados (base de la 12): el contacto y su número, cada uno en su columna. */
export function createRecipientColumns(t: TFunction, status: (recipient: WhatsAppRecipientResponse) => ReactNode): Column<WhatsAppRecipientResponse>[] {
  return [
    {
      id: "contact", header: t("whatsapp:broadcasts.recipients.columns.contact"), type: "custom", mobile: "primary", className: "w-[30%]",
      cell: (recipient) => <span className="font-medium text-[var(--t1)]">{recipient.contactName ?? <PhoneText value={recipient.displayNumber} />}</span>,
    },
    { id: "number", header: t("whatsapp:broadcasts.recipients.columns.number"), type: "custom", className: "w-[22%]", cell: (recipient) => <PhoneText value={recipient.displayNumber} /> },
    { id: "status", header: t("whatsapp:broadcasts.recipients.columns.status"), type: "custom", mobile: "status", cell: status },
    { id: "changedAtUtc", header: t("whatsapp:broadcasts.recipients.columns.changed"), type: "custom", className: "w-40", cell: (recipient) => <DateText value={recipient.changedAtUtc} kind="dateTime" /> },
  ];
}
