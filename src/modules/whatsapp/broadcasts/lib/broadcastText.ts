import type { TFunction } from "i18next";
import type { FormatState, MoneyValue } from "@/shared/format/useFormat";
import type { WhatsAppAudienceResponse, WhatsAppBroadcastResponse } from "../../api/types";

/** Una cantidad en el texto: el plural con el número y la cifra con los separadores de la cultura. */
export const countOf = (format: FormatState, value: number) => ({ count: value, n: format.formatInteger(value) });

/** «Minorista» o «Todos los que aceptan». */
export function audienceLabel(audience: WhatsAppAudienceResponse, t: TFunction): string {
  return audience.kind === "Tag" && audience.tag ? audience.tag : t("whatsapp:broadcasts.audience.allAccepting");
}

/** «118 entregados · 86 leídos» de una que ya salió; las demás no tienen resultados. */
export function resultsLabel(broadcast: WhatsAppBroadcastResponse, t: TFunction, format: FormatState): string | null {
  if (broadcast.status !== "Sent" && broadcast.status !== "Sending") return null;
  return t("whatsapp:broadcasts.results", { delivered: format.formatInteger(broadcast.delivered), read: format.formatInteger(broadcast.read) });
}

/** La fecha de la fila: cuándo salió o, si todavía no, para cuándo estaba programada. */
export function broadcastDate(broadcast: WhatsAppBroadcastResponse): { value: string | null | undefined; withTime: boolean } {
  return broadcast.sentAtUtc ? { value: broadcast.sentAtUtc, withTime: false } : { value: broadcast.scheduledAtUtc, withTime: true };
}

/**
 * El costo estimado llega como `Money`, que el contrato publica sin forma (`unknown`): se lee tal cual llega, con su
 * importe y su moneda, y nunca se calcula en el front.
 */
export function asMoney(value: unknown): MoneyValue | null {
  if (typeof value !== "object" || value === null) return null;
  const amount: unknown = Reflect.get(value, "amount");
  const currency: unknown = Reflect.get(value, "currency");
  return typeof amount === "number" && typeof currency === "string" ? { amount, currency } : null;
}

/** La vista previa del mensaje: cada `{{n}}` de la plantilla con lo que se escribió en su variable. */
export function fillTemplate(body: string, values: readonly string[]): string {
  return body.replace(/\{\{(\d+)\}\}/g, (placeholder, index: string) => values[Number(index) - 1]?.trim() || placeholder);
}
