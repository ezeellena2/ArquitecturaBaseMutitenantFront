import type { TFunction } from "i18next";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { defineStatusTones } from "@/shared/format/statusTones";
import type { FormatState } from "@/shared/format/useFormat";
import { countOf } from "../lib/values";
import { ListRow } from "@/shared/ui/app/ListRow";
import type { Column } from "@/shared/ui/DataTable";
import { DateText } from "@/shared/ui/format/DateText";
import { EmptyValue } from "@/shared/ui/format/EmptyValue";
import { PhoneText } from "@/shared/ui/format/PhoneText";
import { StatusBadge } from "@/shared/ui/format/StatusBadge";
import type { WhatsAppContactBroadcastResponse, WhatsAppContactConversationResponse, WhatsAppContactResponse } from "../api/types";
import { ConsentOrigin, ContactAvatar, ContactTitle } from "./components/ContactParts";
// Cómo le llegó cada difusión: el estado del destinatario se registra una sola vez, en Difusiones.
import { recipientStatusTones } from "../broadcasts/columns";

/// Tableros WA-Contactos y WA-Contacto (.w-est): «Acepta» en verde, «No acepta» y «Sin respuesta» en gris y «Se dio de
/// baja» en ámbar.
export const consentTones = defineStatusTones("WhatsAppConsent", { Accepted: "success", Declined: "neutral", NoAnswer: "neutral", Unsubscribed: "warning" });

export const contactsPath = "/org/whatsapp/contactos";
export const contactPath = (id: string) => `${contactsPath}/${encodeURIComponent(id)}`;
/** La conversación en Chats: «Abrir chat» de la ficha. */
export const chatPath = (conversationId: string) => `/org/whatsapp/chats/${encodeURIComponent(conversationId)}`;
export const broadcastPath = (id: string) => `/org/whatsapp/difusiones/${encodeURIComponent(id)}`;

export function createContactColumns(t: TFunction): Column<WhatsAppContactResponse>[] {
  return [
    {
      // Tablero WA-Contactos: el nombre (o el número, sin nombre) y debajo el número y si está vinculado a su cuenta.
      id: "name", header: t("whatsapp:contacts.columns.contact"), type: "custom", mobile: "primary", className: "w-[34%]",
      cell: (contact) => <Link className="block truncate font-medium text-[var(--t1)] hover:underline" to={contactPath(contact.id)}><ContactTitle contact={contact} /></Link>,
      detail: (contact) => contact.name
        ? <><PhoneText value={contact.displayNumber} />{contact.linkedToAccount ? ` · ${t("whatsapp:contacts.linked")}` : null}</>
        : contact.linkedToAccount ? t("whatsapp:contacts.linked") : null,
    },
    { id: "tags", header: t("whatsapp:contacts.columns.tags"), type: "text", value: (contact) => contact.tags.join(", ") || null },
    {
      id: "consent", header: t("whatsapp:contacts.columns.consent"), type: "status", tones: consentTones, mobile: "status",
      value: (contact) => contact.consent, detail: (contact) => contact.consentSource && contact.consentChangedAtUtc ? <ConsentOrigin contact={contact} /> : null,
    },
    { id: "lastConversationAtUtc", header: t("whatsapp:contacts.columns.lastConversation"), type: "relative", className: "w-[170px]", value: (contact) => contact.lastConversationAtUtc },
  ];
}

/// M-WA-Contactos: el círculo, el nombre con la última conversación a la derecha, el número (y si está vinculado) y, en la
/// línea de abajo, las etiquetas y el consentimiento con su punto. Sin nombre, el número va de título.
export function contactPhoneRow(contact: WhatsAppContactResponse, t: TFunction, trailing?: ReactNode): ReactNode {
  const consent = <span className="inline-flex max-w-full items-center gap-1">
    {contact.tags.length > 0 ? <span className="truncate">{contact.tags.join(", ")}{" ·"}</span> : null}
    <StatusBadge tones={consentTones} value={contact.consent} className="text-[12.5px] text-[var(--t2)]" />
  </span>;
  const number = contact.name ? <><PhoneText value={contact.displayNumber} />{contact.linkedToAccount ? ` · ${t("whatsapp:contacts.linkedShort")}` : null}</> : null;
  return <ListRow key={contact.id} to={contactPath(contact.id)} leading={<ContactAvatar name={contact.name} />}
    title={<ContactTitle contact={contact} />}
    meta={contact.lastConversationAtUtc ? <DateText value={contact.lastConversationAtUtc} kind="relative" /> : undefined}
    lines={[number, consent]} trailing={trailing} />;
}

export function createContactConversationColumns(t: TFunction): Column<WhatsAppContactConversationResponse>[] {
  return [
    // Tablero WA-Contacto: la fecha y debajo el último mensaje (CC18).
    { id: "startedAtUtc", header: t("whatsapp:contacts.conversations.columns.conversation"), type: "relative", mobile: "primary", className: "w-[36%]",
      value: (row) => row.startedAtUtc, detail: (row) => row.lastMessagePreview ?? null },
    { id: "team", header: t("whatsapp:contacts.conversations.columns.team"), type: "text", value: (row) => row.team?.name },
    { id: "assignee", header: t("whatsapp:contacts.conversations.columns.assignee"), type: "text", value: (row) => row.assignee?.name },
    { id: "messageCount", header: t("whatsapp:contacts.conversations.columns.messages"), type: "integer", className: "w-[120px]", value: (row) => row.messageCount },
  ];
}

/// M-WA-Contacto: la fecha con los mensajes a la derecha, el último mensaje y debajo el equipo y quién la atendió.
export function contactConversationPhoneRow(row: WhatsAppContactConversationResponse, t: TFunction, format: FormatState, trailing?: ReactNode): ReactNode {
  const attended = [row.team?.name, row.assignee?.name].filter(Boolean).join(" · ");
  return <ListRow key={row.conversationId} to={chatPath(row.conversationId)} title={<DateText value={row.startedAtUtc} kind="relative" />}
    meta={t("whatsapp:contacts.conversations.messages", countOf(format, row.messageCount))} lines={[row.lastMessagePreview, attended || <EmptyValue key="empty" />]} trailing={trailing} />;
}

export function createContactBroadcastColumns(t: TFunction): Column<WhatsAppContactBroadcastResponse>[] {
  return [
    {
      id: "name", header: t("whatsapp:contacts.broadcasts.columns.broadcast"), type: "custom", mobile: "primary",
      cell: (row) => <Link className="block truncate font-medium text-[var(--t1)] hover:underline" to={broadcastPath(row.broadcastId)}>{row.name}</Link>,
    },
    { id: "sentAtUtc", header: t("whatsapp:contacts.broadcasts.columns.sent"), type: "date", className: "w-[160px]", value: (row) => row.sentAtUtc },
    { id: "status", header: t("whatsapp:contacts.broadcasts.columns.status"), type: "status", tones: recipientStatusTones, mobile: "status", value: (row) => row.status },
  ];
}

export function contactBroadcastPhoneRow(row: WhatsAppContactBroadcastResponse): ReactNode {
  return <ListRow key={row.broadcastId} to={broadcastPath(row.broadcastId)} title={row.name} meta={<DateText value={row.sentAtUtc} kind="shortDate" />}
    lines={[<StatusBadge key="status" tones={recipientStatusTones} value={row.status} className="text-[13px] text-[var(--t2)]" />]} />;
}
