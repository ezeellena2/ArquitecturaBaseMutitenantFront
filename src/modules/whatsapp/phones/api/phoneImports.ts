import { api } from "@/shared/api/httpClient";
import type { WhatsAppPhoneImportPreviewResponse, WhatsAppPhoneImportRequest, WhatsAppPhoneImportResponse } from "../../api/types";

const base = "/api/organization/whatsapp/phone-imports";

/** Qué pasaría con cada teléfono, sin guardar: ya es miembro, se invita o es inválido. Nunca dice si hay una cuenta. */
export function previewPhoneImport(request: WhatsAppPhoneImportRequest): Promise<WhatsAppPhoneImportPreviewResponse> {
  return api.post(`${base}/preview`, request);
}

/** Vincula a los que ya son miembros y les manda la invitación por WhatsApp a los demás. */
export function importPhones(request: WhatsAppPhoneImportRequest, idempotencyKey: string): Promise<WhatsAppPhoneImportResponse> {
  return api.post(base, request, { headers: { "Idempotency-Key": idempotencyKey } });
}
