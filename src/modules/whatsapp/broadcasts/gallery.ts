import { referenceDataFixture } from "../../../test/mocks/handlers.ts";
import type { WhatsAppBroadcastResponse, WhatsAppRecipientResponse, WhatsAppTemplateOptionResponse } from "../api/types";
import { api, click, fill, galleryApp, galleryCase, page, press, type GalleryAction, type GalleryCase, type GalleryPending } from "../test/gallery";

const group = "difusiones";
const broadcasts = "/api/organization/whatsapp/broadcasts";

/// Tablero WA-Difusiones: dos enviadas y una programada para el 20/12 a las 09:00 de Buenos Aires. Cada una va a quienes
/// aceptan promociones con esa etiqueta; el costo lo calcula el back con la tarifa de Marketing de Argentina (0,0618 USD).
const broadcast = (values: Partial<WhatsAppBroadcastResponse> & Pick<WhatsAppBroadcastResponse, "id" | "name" | "template" | "audience" | "recipients">): WhatsAppBroadcastResponse => ({
  variables: [], status: "Sent", scheduledAtUtc: null, sentAtUtc: null, delivered: 0, read: 0, replied: 0, unsubscribed: 0, failed: 0,
  estimatedCost: { amount: 0, currency: "USD" }, version: 1, ...values,
});
const empanadas = broadcast({
  id: "broadcast-empanadas", name: "20 % en empanadas", template: { id: "template-promo", name: "Promo semanal" }, audience: { kind: "Tag", tag: "Minorista" },
  recipients: 124, sentAtUtc: "2026-09-25T12:00:00Z", delivered: 118, read: 86, replied: 12, unsubscribed: 2, failed: 6,
  estimatedCost: { amount: 7.66, currency: "USD" }, version: 5,
});
const holidays = broadcast({
  id: "broadcast-fiestas", name: "Horario de fiestas", template: { id: "template-horario", name: "Aviso de horario" }, audience: { kind: "Tag", tag: "Mayorista" },
  recipients: 48, status: "Scheduled", scheduledAtUtc: "2026-12-20T12:00:00Z", estimatedCost: { amount: 2.97, currency: "USD" }, version: 2,
});
const products = broadcast({
  id: "broadcast-novedades", name: "Nuevos productos", template: { id: "template-novedades", name: "Novedades" }, audience: { kind: "Tag", tag: "Mayorista" },
  recipients: 48, sentAtUtc: "2026-09-02T13:00:00Z", delivered: 47, read: 40, replied: 3, unsubscribed: 0, failed: 1,
  estimatedCost: { amount: 2.97, currency: "USD" }, version: 4,
});
const list = (programmed: WhatsAppBroadcastResponse) => [api("GET", broadcasts, {
  broadcasts: page([empanadas, programmed, products]), scheduled: programmed.status === "Scheduled" ? 1 : 0,
})];
const cancelled = { ...holidays, status: "Cancelled" as const, version: 3 };

/// Tablero WA-Difusion-Resultados: los cinco del tablero (a las 09:00 salió) y cinco más de los minoristas que aceptan.
const recipient = (contactId: string, contactName: string | null, displayNumber: string, status: WhatsAppRecipientResponse["status"], changedAtUtc: string,
  failureReason: string | null = null): WhatsAppRecipientResponse => ({ contactId, contactName, displayNumber, status, failureReason, changedAtUtc });
const recipients = [
  recipient("contact-laura", "Laura Méndez", "+5491155553378", "Replied", "2026-09-25T13:12:00Z"),
  recipient("contact-lucas", "Lucas Benítez", "+5491155554410", "Read", "2026-09-25T12:48:00Z"),
  recipient("contact-carla", "Carla Ruiz", "+5491155551146", "Unsubscribed", "2026-09-25T12:40:00Z"),
  recipient("contact-valeria", "Valeria Sosa", "+5491155556120", "Delivered", "2026-09-25T12:31:00Z"),
  recipient("contact-6650", null, "+5491155556650", "Failed", "2026-09-25T12:30:00Z", "Ese número no tiene WhatsApp"),
  recipient("contact-paula", "Paula Herrera", "+5491155557731", "Read", "2026-09-25T12:29:00Z"),
  recipient("contact-matias", "Matías Ortiz", "+5491155552264", "Delivered", "2026-09-25T12:27:00Z"),
  recipient("contact-sofia", "Sofía Castro", "+5491155559418", "Read", "2026-09-25T12:25:00Z"),
  recipient("contact-nicolas", "Nicolás Vega", "+5491155550875", "Delivered", "2026-09-25T12:22:00Z"),
  recipient("contact-julieta", "Julieta Ramos", "+5491155553042", "Read", "2026-09-25T12:20:00Z"),
];
const results = [api("GET", `${broadcasts}/${empanadas.id}`, { broadcast: empanadas, recipients: page(recipients, 124) })];
const resultsPath = `/org/whatsapp/difusiones/${empanadas.id}`;

/// Tablero WA-Difusion-Nueva: la plantilla de Marketing aprobada con su variable, la estimación del back (48 mayoristas
/// que aceptan, US$ 2,97, con la tarifa de Argentina, CC16) y el catálogo con el dólar para mostrar ese costo.
const hours: WhatsAppTemplateOptionResponse = {
  templateId: "template-horario", name: "Aviso de horario", category: "Marketing", variables: ["Nombre del cliente"],
  body: "Hola {{1}}, te contamos el horario de fiestas de Grupo Delta: el 24 y el 31 atendemos de 9 a 13. Te esperamos.",
  estimatedCost: { amount: 0.0618, currency: "USD" },
};
const reference = referenceDataFixture("es-AR");
const withDollar = { ...reference, currencies: [...reference.currencies, { code: "USD", numericCode: "840", minorUnits: 2, symbol: "US$", displaySymbol: "US$",
  name: "Dólar estadounidense", namePlural: "Dólares estadounidenses", isEnabled: true, sortOrder: 2 }] };
const draft = [
  api("GET", `${broadcasts}/template-options`, page([hours])),
  api("GET", `${broadcasts}/tags`, page(["Mayorista", "Minorista"])),
  api("GET", `${broadcasts}/estimate`, { recipients: 48, estimatedCost: { amount: 2.97, currency: "USD" }, country: "AR" }, 200, { kind: "Tag", tag: "Mayorista" }),
  // Antes de elegir la etiqueta, la estimación de todos los que aceptan.
  api("GET", `${broadcasts}/estimate`, { recipients: 312, estimatedCost: { amount: 19.28, currency: "USD" }, country: "AR" }),
  api("GET", "/api/reference-data", withDollar),
];
const fillDraft: GalleryAction[] = [
  fill("Nombre", "Horario de fiestas"),
  click("Plantilla", "combobox"), click("Aviso de horario · Marketing", "option"),
  fill("Nombre del cliente", "Martina"),
  click("Una etiqueta", "radio"), click("Etiqueta", "combobox"), click("Mayorista", "option"),
  click("Programar", "radio"), fill("Fecha y hora", "20/12/2026 09:00"),
];
const newPath = "/org/whatsapp/difusiones/nueva";

const listCases = (board: "WA-Difusiones" | "M-WA-Difusiones", menuState: string): GalleryCase[] => [
  galleryCase(group, board, "Lista", galleryApp("business", "/org/whatsapp/difusiones", list(holidays), { readyText: "Horario de fiestas" })),
  // En la compu el ⋮ abre su menú; en el teléfono, la hoja con el nombre de la difusión.
  galleryCase(group, board, menuState, galleryApp("business", "/org/whatsapp/difusiones", list(holidays), {
    actions: [press("Acciones de Horario de fiestas")], readySelector: board === "WA-Difusiones" ? "[role=menu]" : "[role=dialog]", readyText: "Cancelar difusión",
  })),
  galleryCase(group, board, "Cancelar difusión", galleryApp("business", "/org/whatsapp/difusiones", list(holidays), {
    actions: [press("Acciones de Horario de fiestas"), click("Cancelar difusión", "menuitem")], readySelector: "[role=dialog]",
    readyText: "No se va a mandar a los 48 contactos",
  })),
  galleryCase(group, board, "Cancelada", galleryApp("business", "/org/whatsapp/difusiones", list(cancelled), { readyText: "Cancelada" })),
];

const newCases = (board: "WA-Difusion-Nueva" | "M-WA-Difusion-Nueva"): GalleryCase[] => [
  galleryCase(group, board, "Borrador", galleryApp("business", newPath, draft, {
    actions: fillDraft, readyText: "Hola Martina, te contamos el horario de fiestas", readyTexts: ["48 contactos", "US$ 2,97"],
  })),
  galleryCase(group, board, "Confirmar la programación", galleryApp("business", newPath, draft, {
    actions: [...fillDraft, click("Programar")], readySelector: "[role=dialog]", readyText: "20/12/2026 a las 09:00, hora de Buenos Aires (GMT−3)",
  })),
];

const resultsCases = (board: "WA-Difusion-Resultados" | "M-WA-Difusion-Resultados"): GalleryCase[] => [
  galleryCase(group, board, "Resultados", galleryApp("business", resultsPath, results, { readyText: "Laura Méndez" })),
  galleryCase(group, board, "Por qué no llegó", galleryApp("business", resultsPath, results, {
    actions: [click("Por qué no llegó")], readySelector: "[role=dialog]", readyText: "Ese número no tiene WhatsApp",
  })),
];

/** Galería de la E11 de esta área: un caso por tablero y estado que se fotografía, y lo pendiente con su motivo. */
export const broadcastsGalleryCases: readonly GalleryCase[] = [
  ...listCases("WA-Difusiones", "Menú de la programada"), ...listCases("M-WA-Difusiones", "Acciones de la programada"),
  ...newCases("WA-Difusion-Nueva"), ...newCases("M-WA-Difusion-Nueva"),
  ...resultsCases("WA-Difusion-Resultados"), ...resultsCases("M-WA-Difusion-Resultados"),
];
export const broadcastsGalleryPending: readonly GalleryPending[] = [];
