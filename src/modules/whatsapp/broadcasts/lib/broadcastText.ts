import type { TFunction } from "i18next";
import type { WhatsAppAudienceResponse, WhatsAppBroadcastResponse } from "../../api/types";

/** «Minorista» o «Todos los que aceptan». */
export function audienceLabel(audience: WhatsAppAudienceResponse, t: TFunction): string {
  return audience.kind === "Tag" && audience.tag ? audience.tag : t("whatsapp:broadcasts.audience.allAccepting");
}

/** «118 entregados · 86 leídos» de una que ya salió; las demás no tienen resultados. */
/** Los resultados de una difusión, cada uno en su columna (WA-Difusiones-Base2, 263): solo si ya salió o está saliendo. */
export function broadcastResults(broadcast: WhatsAppBroadcastResponse): { delivered: number; read: number } | null {
  return broadcast.status === "Sent" || broadcast.status === "Sending" ? { delivered: broadcast.delivered, read: broadcast.read } : null;
}

/** La fecha de la fila: cuándo salió o, si todavía no, para cuándo estaba programada; las dos con la hora (WA-Difusiones-Base2). */
export function broadcastDate(broadcast: WhatsAppBroadcastResponse): string | null | undefined {
  return broadcast.sentAtUtc ?? broadcast.scheduledAtUtc;
}

/** La vista previa del mensaje: cada `{{n}}` de la plantilla con lo que se escribió en su variable. */
export function fillTemplate(body: string, values: readonly string[]): string {
  return body.replace(/\{\{(\d+)\}\}/g, (placeholder, index: string) => values[Number(index) - 1]?.trim() || placeholder);
}
