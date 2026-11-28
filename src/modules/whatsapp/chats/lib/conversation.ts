import type { FormatState } from "@/shared/format/useFormat";
import { parseUtcInstant } from "@/shared/time/parseUtcInstant";
import { isPast } from "@/shared/time/serverClock";
import type { WhatsAppChatMessageResponse, WhatsAppConversationRowResponse } from "../../api/types";

/** Las iniciales del círculo («Martina López» → «ML»). */
export function initialsOf(name: string): string {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word.charAt(0).toUpperCase()).join("");
}

/**
 * Qué deja hacer el compositor del chat abierto (WA-Chats y sus estados), en este orden:
 * - `readOnly`: el número se desconectó (D7): solo leer, sin notas.
 * - `takenByOther`: lo atiende otra persona (CC13, `assignedToMe`); queda la nota interna.
 * - `paymentRequired`: no sale nada por falta de medio de pago. D1: sin medio de pago el número igual responde hasta los
 *   1.000 mensajes gratis del mes, así que `channel.status` (CC13) solo traba si pasaron 24 h, porque ahí queda solo una
 *   plantilla y las plantillas siempre lo exigen (`template`); pasado el tope lo dice el back con su 409 (`freeLimit`).
 * - `windowClosed`: pasaron 24 h desde su último mensaje: solo plantilla.
 * - `open`: escribir (si estaba sin tomar, mandar lo toma).
 */
export type ComposerState =
  | { kind: "readOnly" }
  | { kind: "takenByOther"; name: string }
  | { kind: "paymentRequired"; reason: "freeLimit" | "template" }
  | { kind: "windowClosed" }
  | { kind: "open" };

/**
 * Rechazos locales (409) del envío que todavía pueden no figurar en la fila cacheada, anclados al estado en que ocurrieron
 * para que una relectura posterior del servidor que los resuelve los deje sin efecto automáticamente (KAN-93).
 */
export interface ComposerFlags {
  /**
   * `true` o el estado del canal + contador de lectura en que el back devolvió `PaymentRequired`.
   * Se despeja cuando el canal pasa a `Connected` (saliendo de `PaymentMissing`, o en una lectura posterior al 409).
   */
  readonly paymentRequired?: boolean | {
    readonly channelStatus: WhatsAppConversationRowResponse["channel"]["status"];
    readonly rejectedAt?: number;
  };
  /**
   * `true` o el `windowOpenUntilUtc` que tenía la fila cuando el back devolvió `WindowClosed` (`null` si no tenía).
   * Se despeja automáticamente cuando llega una ventana futura posterior a la rechazada.
   */
  readonly windowClosed?: boolean | { readonly windowOpenUntilUtc: string | null };
  /**
   * `true` o el contador de lectura en que el back devolvió `ReadOnly`.
   * Se despeja cuando una lectura posterior trae la conversación editable y el canal conectado.
   */
  readonly readOnly?: boolean | { readonly rejectedAt: number };
}

function isReadOnlyFlagActive(
  row: WhatsAppConversationRowResponse,
  flag: ComposerFlags["readOnly"],
  updateCount?: number,
): boolean {
  if (!flag) return false;
  if (flag === true) return true;
  if (row.readOnly || row.channel.status === "Disconnected") return true;
  return updateCount === undefined || updateCount <= flag.rejectedAt;
}

function isPaymentRequiredFlagActive(
  row: WhatsAppConversationRowResponse,
  flag: ComposerFlags["paymentRequired"],
  updateCount?: number,
): boolean {
  if (!flag) return false;
  if (flag === true) return true;
  if (row.channel.status === "Connected") {
    if (flag.channelStatus !== "Connected") return false;
    return updateCount === undefined || flag.rejectedAt === undefined || updateCount <= flag.rejectedAt;
  }
  return true;
}

function isWindowClosedFlagActive(
  row: WhatsAppConversationRowResponse,
  flag: ComposerFlags["windowClosed"],
): boolean {
  if (!flag) return false;
  if (flag === true) return true;
  if (!row.windowOpenUntilUtc || isPast(row.windowOpenUntilUtc)) return true;
  if (flag.windowOpenUntilUtc === null) return false;
  return parseUtcInstant(row.windowOpenUntilUtc).getTime() <= parseUtcInstant(flag.windowOpenUntilUtc).getTime();
}

/** Retira las marcas locales ya resueltas por la fila del servidor para que no puedan reactivarse más adelante. */
export function pruneComposerFlags(
  row: WhatsAppConversationRowResponse,
  flags: ComposerFlags,
  updateCount?: number,
): ComposerFlags {
  const next: {
    paymentRequired?: ComposerFlags["paymentRequired"];
    windowClosed?: ComposerFlags["windowClosed"];
    readOnly?: ComposerFlags["readOnly"];
  } = {};
  if (isPaymentRequiredFlagActive(row, flags.paymentRequired, updateCount)) next.paymentRequired = flags.paymentRequired;
  if (isWindowClosedFlagActive(row, flags.windowClosed)) next.windowClosed = flags.windowClosed;
  if (isReadOnlyFlagActive(row, flags.readOnly, updateCount)) next.readOnly = flags.readOnly;
  return next;
}

export function composerState(
  row: WhatsAppConversationRowResponse,
  flags: ComposerFlags,
  updateCount?: number,
): ComposerState {
  if (row.readOnly || row.channel.status === "Disconnected" || isReadOnlyFlagActive(row, flags.readOnly, updateCount))
    return { kind: "readOnly" };
  if (row.assignee && !row.assignedToMe) return { kind: "takenByOther", name: row.assignee.name };
  if (isPaymentRequiredFlagActive(row, flags.paymentRequired, updateCount))
    return { kind: "paymentRequired", reason: "freeLimit" };
  if (isWindowClosedFlagActive(row, flags.windowClosed) || !row.windowOpenUntilUtc || isPast(row.windowOpenUntilUtc))
    return row.channel.status === "PaymentMissing" ? { kind: "paymentRequired", reason: "template" } : { kind: "windowClosed" };
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

/**
 * CC15: la página 1 trae los mensajes más recientes primero. El hilo va del más viejo al más nuevo, como WhatsApp;
 * a igual hora, se da vuelta el orden del contrato.
 */
export function chronological(messages: readonly WhatsAppChatMessageResponse[]): WhatsAppChatMessageResponse[] {
  return [...messages].reverse().sort((a, b) => (a.createdAtUtc < b.createdAtUtc ? -1 : a.createdAtUtc > b.createdAtUtc ? 1 : 0));
}

/** El último mensaje que mandó la otra parte, para decir cuándo escribió por última vez (aviso de las 24 h). Recibe el hilo en orden. */
export function lastInbound(messages: readonly WhatsAppChatMessageResponse[]): WhatsAppChatMessageResponse | undefined {
  return messages.findLast((message) => message.direction === "Inbound" && message.kind !== "Event" && message.kind !== "Note");
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

type DayFormat = Pick<FormatState, "formatDate" | "formatDateTime">;

/** La hora de la fila de la bandeja (WA-Chats, .l1 span): la fecha y la hora completas, en la zona de quien mira. */
export function chatTime(format: DayFormat, value: string): string {
  return format.formatDateTime(value);
}

/** El separador de días del hilo (WA-Chats, .w-dia): la fecha completa, nunca «Hoy» ni «Ayer». */
export function chatDay(format: DayFormat, value: string): string {
  return format.formatDate(value);
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
