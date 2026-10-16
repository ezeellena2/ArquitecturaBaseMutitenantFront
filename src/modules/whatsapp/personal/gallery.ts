import type { PersonalWhatsAppConversationResponse, WhatsAppChatMessageResponse } from "../api/types";
import { api, click, galleryApp, galleryCase, page, press, type GalleryApiResponse, type GalleryCase, type GalleryPending } from "../test/gallery";

// Galería de «Mensajes» de la persona (WA-Mensajes, M-WA-Mensajes y M-WA-Mensaje): Lucía, en su perfil personal, a las
// 11:00 del martes 13/10/2026 en Buenos Aires. Lo que ella escribió es entrante para la organización.
const base = "/api/me/whatsapp/conversations";
const clementina: PersonalWhatsAppConversationResponse = { id: "link-clementina", organizationName: "La Clementina", linkedAtUtc: "2026-09-20T15:00:00Z",
  lastMessageAtUtc: "2026-10-13T13:42:00Z", lastMessagePreview: "Vos: Gracias, paso a las 17.", displayNumber: "+5491155550300" };
const conversations: PersonalWhatsAppConversationResponse[] = [clementina,
  { id: "link-delta", organizationName: "Grupo Delta", linkedAtUtc: "2026-09-02T12:00:00Z", lastMessageAtUtc: "2026-10-12T15:00:00Z",
    lastMessagePreview: "Tu pedido 1043 está listo.", displayNumber: "+5493515550200" },
  { id: "link-rosales", organizationName: "Ferretería Rosales", linkedAtUtc: "2026-08-14T12:00:00Z", lastMessageAtUtc: "2026-09-28T18:00:00Z",
    lastMessagePreview: "Te esperamos.", displayNumber: "+5491155550400" },
];
const message = (id: string, direction: WhatsAppChatMessageResponse["direction"], text: string, at: string): WhatsAppChatMessageResponse => ({
  id, kind: "Text", direction, author: direction === "Outbound" ? "Carla" : null, text, mediaKind: null, status: direction === "Outbound" ? "Read" : "Received",
  failureReason: null, createdAtUtc: `2026-10-13T${at}:00Z` });
const messages = [
  message("c-1", "Inbound", "Hola, ¿tienen empanadas de humita para hoy?", "13:30"),
  message("c-2", "Outbound", "Hola Lucía, sí. ¿Cuántas querés?", "13:35"),
  message("c-3", "Inbound", "Una docena. Paso a las 17.", "13:40"),
  message("c-4", "Outbound", "Perfecto, te las dejamos listas.", "13:41"),
  message("c-5", "Inbound", "Gracias, paso a las 17.", "13:42"),
];
const withConversations: GalleryApiResponse[] = [
  // En orden de lectura; la página del contrato trae lo más nuevo primero (CC15).
  api("GET", `${base}/link-clementina`, { conversation: clementina, messages: page([...messages].reverse()) }),
  api("GET", base, page(conversations)),
];
const empty = [api("GET", base, page([]))];
const personal = (route: string, responses: GalleryApiResponse[], options: Parameters<typeof galleryApp>[3] = {}) => galleryApp("consumer", route, responses, options);
const unlink = [press("Acciones de La Clementina"), click("Desvincular", "menuitem")];

/** Galería de la E11 de esta área: un caso por tablero y estado que se fotografía, y lo pendiente con su motivo. */
export const personalGalleryCases: readonly GalleryCase[] = [
  galleryCase("mensajes", "WA-Mensajes", "Conversación", personal("/mensajes", withConversations, { readyText: "Vinculada desde el 20/09/2026" })),
  galleryCase("mensajes", "WA-Mensajes", "Vacío", personal("/mensajes", empty, { readyText: "Todavía no tenés mensajes con organizaciones" })),
  galleryCase("mensajes", "WA-Mensajes", "Menú de la conversación", personal("/mensajes", withConversations, {
    actions: [press("Acciones de La Clementina")], readyText: "Desvincular" })),
  galleryCase("mensajes", "WA-Mensajes", "Desvincular", personal("/mensajes", withConversations, {
    actions: unlink, readyText: "Deja de verse en Mensajes y La Clementina ya no la ve unida a tu cuenta." })),
  galleryCase("mensajes", "M-WA-Mensajes", "Lista", personal("/mensajes", withConversations, { readyText: "Ferretería Rosales" })),
  galleryCase("mensajes", "M-WA-Mensajes", "Vacío", personal("/mensajes", empty, { readyText: "Todavía no tenés mensajes con organizaciones" })),
  galleryCase("mensajes", "M-WA-Mensaje", "Conversación", personal("/mensajes/link-clementina", withConversations, { readyText: "Seguir en WhatsApp" })),
  galleryCase("mensajes", "M-WA-Mensaje", "Menú", personal("/mensajes/link-clementina", withConversations, {
    actions: [press("Acciones de La Clementina")], readyText: "Desvincular" })),
  galleryCase("mensajes", "M-WA-Mensaje", "Desvincular", personal("/mensajes/link-clementina", withConversations, {
    actions: unlink, readyText: "Deja de verse en Mensajes y La Clementina ya no la ve unida a tu cuenta." })),
];
export const personalGalleryPending: readonly GalleryPending[] = [];
