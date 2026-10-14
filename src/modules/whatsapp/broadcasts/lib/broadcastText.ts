import type { TFunction } from "i18next";
import type { FormatState } from "@/shared/format/useFormat";
import type { WhatsAppAudienceResponse, WhatsAppBroadcastResponse } from "../../api/types";

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

/** La vista previa del mensaje: cada `{{n}}` de la plantilla con lo que se escribió en su variable. */
export function fillTemplate(body: string, values: readonly string[]): string {
  return body.replace(/\{\{(\d+)\}\}/g, (placeholder, index: string) => values[Number(index) - 1]?.trim() || placeholder);
}
