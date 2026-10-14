import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
import type { WhatsAppBroadcastResponse, WhatsAppRecipientResponse, WhatsAppTemplateOptionResponse } from "../../api/types";

/// Datos de prueba de Difusiones: solo a quienes aceptan y ningún número de empleado. El costo llega del back.
export const sent: WhatsAppBroadcastResponse = {
  id: "broadcast-sent", name: "20 % en empanadas", template: { id: "template-promo", name: "Promo semanal" }, audience: { kind: "Tag", tag: "Minorista" },
  recipients: 124, status: "Sent", scheduledAtUtc: null, sentAtUtc: "2026-09-25T12:00:00Z", delivered: 118, read: 86, replied: 12, unsubscribed: 2, failed: 6,
  estimatedCost: { amount: 7.66, currency: "ARS" }, version: 3,
};

export const scheduled: WhatsAppBroadcastResponse = {
  ...sent, id: "broadcast-scheduled", name: "Horario de fiestas", template: { id: "template-hours", name: "Aviso de horario" }, audience: { kind: "AllAccepting", tag: null },
  recipients: 48, status: "Scheduled", scheduledAtUtc: "2026-12-20T12:00:00Z", sentAtUtc: null, delivered: 0, read: 0, replied: 0, unsubscribed: 0, failed: 0, version: 7,
};

export const promoTemplate: WhatsAppTemplateOptionResponse = {
  templateId: "template-hours", name: "Aviso de horario", category: "Marketing", body: "Hola {{1}}, el 24 y el 31 atendemos de 9 a 13.",
  variables: ["Nombre"], estimatedCost: { amount: 0.06, currency: "ARS" },
};

export const recipients: WhatsAppRecipientResponse[] = [
  { contactId: "contact-laura", contactName: "Laura Méndez", displayNumber: "+5491155553378", status: "Replied", failureReason: null, changedAtUtc: "2026-09-25T13:12:00Z" },
  { contactId: "contact-unknown", contactName: null, displayNumber: "+5491155556650", status: "Failed", failureReason: "Ese número no tiene WhatsApp", changedAtUtc: "2026-09-25T12:30:00Z" },
];

export function paged<T>(items: readonly T[], totalCount = items.length) {
  return { items: [...items], page: 1, pageSize: 10, totalCount, totalPages: Math.max(1, Math.ceil(totalCount / 10)), hasPrevious: false, hasNext: totalCount > 10 };
}

/** El marco pide el contador de Chats. */
export function frameHandlers() {
  server.use(http.get("/api/organization/whatsapp/untaken", () => HttpResponse.json({ customers: 0, internal: null })));
}
