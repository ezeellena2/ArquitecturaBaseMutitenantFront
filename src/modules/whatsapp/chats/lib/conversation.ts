import type { FormatState, MoneyValue } from "@/shared/format/useFormat";
import { isPast } from "@/shared/time/serverClock";
import type { WhatsAppChatMessageResponse, WhatsAppConversationRowResponse } from "../../api/types";

/** Las iniciales del círculo («Martina López» → «ML»). */
export function initialsOf(name: string): string {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word.charAt(0).toUpperCase()).join("");
}

/**
 * Qué deja hacer el compositor del chat abierto (WA-Chats y sus estados), en este orden:
 * - `readOnly`: el número se desconectó (D7): solo leer, sin notas.
 * - `takenByOther`: lo atiende otra persona; queda la nota interna.
 * - `paymentRequired`: el back rechazó un envío por falta de medio de pago.
 * - `windowClosed`: pasaron 24 h desde su último mensaje: solo plantilla.
 * - `open`: escribir (si estaba sin tomar, mandar lo toma).
 */
export type ComposerState =
  | { kind: "readOnly" }
  | { kind: "takenByOther"; name: string }
  | { kind: "paymentRequired" }
  | { kind: "windowClosed" }
  | { kind: "open" };

export function composerState(row: WhatsAppConversationRowResponse, meId: string, flags: { paymentRequired: boolean; windowClosed: boolean }): ComposerState {
  if (row.readOnly) return { kind: "readOnly" };
  if (row.assignee && row.assignee.id !== meId) return { kind: "takenByOther", name: row.assignee.name };
  if (flags.paymentRequired) return { kind: "paymentRequired" };
  if (flags.windowClosed || !row.windowOpenUntilUtc || isPast(row.windowOpenUntilUtc)) return { kind: "windowClosed" };
  return { kind: "open" };
}

/** Nadie lo tomó: el encabezado ofrece «Tomar» y la fila dice «Sin tomar». */
export const isUntaken = (row: WhatsAppConversationRowResponse) => !row.assignee;

/**
 * Lo que aclara quién es, debajo del nombre (WA-Chats, .hc .tx span): sin tomar, «Sin tomar · Ventas»; si no, lo que se
 * sabe del contacto («Vinculada a su cuenta», «Empleado», sus etiquetas) o, si no hay nada, el equipo y quién lo atiende.
 */
export function rowDescriptors(row: WhatsAppConversationRowResponse, texts: { untaken: string; linked: string; employee: string }): string[] {
  const team = row.team?.name;
  if (isUntaken(row)) return [texts.untaken, ...(team ? [team] : [])];
  const known = [...(row.linkedToAccount ? [texts.linked] : []), ...(row.inbox === "Internal" ? [texts.employee] : []), ...row.tags];
  if (known.length > 0) return known;
  return [...(team ? [team] : []), ...(row.assignee ? [row.assignee.name] : [])];
}

/** La tercera línea de la fila de la bandeja: «Ventas · Lucía Fernández» o «Ventas · Sin tomar». */
export function rowAssignment(row: WhatsAppConversationRowResponse, untaken: string): string {
  return [row.team?.name, row.assignee?.name ?? untaken].filter(Boolean).join(" · ");
}

/** El último mensaje que mandó la otra parte, para decir cuándo escribió por última vez (aviso de las 24 h). */
export function lastInbound(messages: readonly WhatsAppChatMessageResponse[]): WhatsAppChatMessageResponse | undefined {
  return messages.findLast((message) => message.direction === "Inbound" && message.kind !== "Event" && message.kind !== "Note");
}

/** `Money` llega como `unknown` en el schema generado: se acepta solo con su importe y su moneda. */
export function isMoney(value: unknown): value is MoneyValue {
  return typeof value === "object" && value !== null && "amount" in value && "currency" in value
    && typeof value.amount === "number" && typeof value.currency === "string";
}

/** Un trozo de la vista previa de una plantilla: texto tal cual o el valor de una variable (en negrita). */
export type PreviewPart = { kind: "text"; text: string } | { kind: "variable"; index: number; text: string };

/** CC03: el cuerpo con `{{1}}`, `{{2}}`… reemplazados por lo que se escribió; lo vacío queda como está. */
export function templatePreview(body: string, values: readonly string[]): PreviewPart[] {
  return body.split(/(\{\{\d+\}\})/).filter((part) => part !== "").map((part) => {
    const match = /^\{\{(\d+)\}\}$/.exec(part);
    if (!match) return { kind: "text", text: part };
    const index = Number(match[1]) - 1;
    const value = values[index]?.trim();
    return { kind: "variable", index, text: value ? value : part };
  });
}

type DayFormat = Pick<FormatState, "formatCalendar" | "formatDate" | "formatTime" | "formatShortDate">;

/** Hoy, ayer u otro día, en la zona de la persona: lo resuelve `formatCalendar` («hoy, 10:42»). */
function dayOf(format: DayFormat, value: string, words: { today: string; yesterday: string }): "today" | "yesterday" | "other" {
  const calendar = format.formatCalendar(value);
  if (calendar === format.formatDate(value)) return "other";
  return calendar.startsWith(words.today) ? "today" : calendar.startsWith(words.yesterday) ? "yesterday" : "other";
}

/**
 * La hora de la fila de la bandeja (WA-Chats, .l1 span): la hora si es de hoy, «Ayer» o la fecha corta. `calendarWords`
 * son las palabras de `format:calendar` (minúsculas), para reconocer hoy y ayer; `labels`, las del tablero.
 */
export function chatTime(format: DayFormat, value: string, calendarWords: { today: string; yesterday: string }, labels: { yesterday: string }): string {
  const day = dayOf(format, value, calendarWords);
  return day === "today" ? format.formatTime(value) : day === "yesterday" ? labels.yesterday : format.formatShortDate(value);
}

/** El separador de días del hilo (.w-dia): «Hoy», «Ayer» o la fecha corta. */
export function chatDay(format: DayFormat, value: string, calendarWords: { today: string; yesterday: string }, labels: { today: string; yesterday: string }): string {
  const day = dayOf(format, value, calendarWords);
  return day === "today" ? labels.today : day === "yesterday" ? labels.yesterday : format.formatShortDate(value);
}

/** El número como lo muestra `PhoneText`; si el back mandara uno que no se puede leer, tal cual llegó. */
export function phoneLabel(format: Pick<FormatState, "isLoading" | "formatPhone">, value: string): string {
  if (format.isLoading) return value;
  try { return format.formatPhone(value); } catch { return value; }
}

/** El enlace para seguir la charla en WhatsApp (WA-Mensajes, «Seguir en WhatsApp»): wa.me con solo los dígitos. */
export function whatsappLink(number: string): string {
  return `https://wa.me/${number.replace(/\D/g, "")}`;
}
