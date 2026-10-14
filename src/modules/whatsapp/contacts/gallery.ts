import type { WhatsAppContactBroadcastResponse, WhatsAppContactConversationResponse, WhatsAppContactResponse } from "../api/types";
import { api, click, galleryApp, galleryCase, galleryPending, page, press, type GalleryCase, type GalleryPending } from "../test/gallery";

const group = "contactos";
const contacts = "/api/organization/whatsapp/contacts";

/// Tableros WA-Contactos y M-WA-Contactos: los diez de la primera página, con sus números en E.164 (CC18). «Hoy» y «Ayer»
/// son del martes 13/10/2026 de la galería; quien acepta lo dijo en el bot, y «Se dio de baja», con el botón de la difusión.
const contact = (id: string, name: string | null, displayNumber: string, values: Partial<WhatsAppContactResponse>): WhatsAppContactResponse => ({
  id, name, displayNumber, tags: [], consent: "NoAnswer", consentSource: null, consentChangedAtUtc: null, linkedToAccount: false,
  lastConversationAtUtc: null, latestConversationId: null, version: 1, ...values,
});
const accepted = (date: string) => ({ consent: "Accepted" as const, consentSource: "Bot" as const, consentChangedAtUtc: date });
const declined = (date: string) => ({ consent: "Declined" as const, consentSource: "Bot" as const, consentChangedAtUtc: date });

const martina = contact("contact-martina", "Martina López", "+5491155556203", {
  tags: ["Mayorista"], ...accepted("2026-08-20T13:00:00Z"), linkedToAccount: true, lastConversationAtUtc: "2026-10-13T12:00:00Z",
  latestConversationId: "conversation-martina-2", version: 4,
});
const firstPage: WhatsAppContactResponse[] = [
  martina,
  contact("contact-0192", null, "+5493515550192", { lastConversationAtUtc: "2026-10-13T11:20:00Z" }),
  contact("contact-federico", "Federico Díaz", "+5491155552087", { tags: ["Minorista"], ...declined("2026-09-03T14:00:00Z"), lastConversationAtUtc: "2026-10-12T18:00:00Z" }),
  contact("contact-javier", "Javier Pereyra", "+5491155553388", { tags: ["Mayorista"], ...accepted("2026-07-11T15:00:00Z"), linkedToAccount: true, lastConversationAtUtc: "2026-10-12T15:30:00Z" }),
  contact("contact-carla", "Carla Ruiz", "+5491155551146", { consent: "Unsubscribed", consentSource: "Unsubscribe", consentChangedAtUtc: "2026-09-29T12:40:00Z", lastConversationAtUtc: "2026-09-29T12:40:00Z" }),
  contact("contact-laura", "Laura Méndez", "+5491155553378", { tags: ["Minorista"], ...accepted("2026-06-02T13:00:00Z"), lastConversationAtUtc: "2026-09-28T16:00:00Z" }),
  contact("contact-sergio", "Sergio Gómez", "+5491155559021", { ...declined("2026-09-25T13:00:00Z"), lastConversationAtUtc: "2026-09-25T13:00:00Z" }),
  contact("contact-lucas", "Lucas Benítez", "+5491155554410", { tags: ["Minorista"], ...accepted("2026-05-19T13:00:00Z"), lastConversationAtUtc: "2026-09-25T14:00:00Z" }),
  contact("contact-valeria", "Valeria Sosa", "+5491155556120", { tags: ["Minorista"], ...accepted("2026-05-30T13:00:00Z"), lastConversationAtUtc: "2026-09-25T15:00:00Z" }),
  contact("contact-diego", "Diego Romero", "+5491155558834", { lastConversationAtUtc: "2026-09-24T13:00:00Z" }),
];
const tags = api("GET", `${contacts}/tags`, page(["Mayorista", "Minorista"]));
const list = [api("GET", contacts, { contacts: page(firstPage, 486), total: 486, accepting: 312 }), tags];

/// Tablero WA-Contacto: sus dos conversaciones (con el último mensaje, CC18) y las tres difusiones que le llegaron, todas a
/// los mayoristas que aceptan.
const conversations: WhatsAppContactConversationResponse[] = [
  { conversationId: "conversation-martina-2", startedAtUtc: "2026-10-13T12:00:00Z", team: { id: "team-sales", name: "Ventas" },
    assignee: { id: "member-lucia", name: "Lucía Fernández" }, messageCount: 8, lastMessagePreview: "Quiero hacer un pedido." },
  { conversationId: "conversation-martina-1", startedAtUtc: "2026-09-12T15:00:00Z", team: { id: "team-support", name: "Soporte" },
    assignee: { id: "member-tomas", name: "Tomás Acosta" }, messageCount: 9, lastMessagePreview: "Hola, ¿cómo hago para pedir una factura?" },
];
const broadcasts: WhatsAppContactBroadcastResponse[] = [
  { broadcastId: "broadcast-novedades", name: "Nuevos productos", sentAtUtc: "2026-09-02T13:00:00Z", status: "Read" },
  { broadcastId: "broadcast-agosto", name: "Precios de agosto", sentAtUtc: "2026-08-04T13:00:00Z", status: "Delivered" },
  { broadcastId: "broadcast-mayoristas", name: "Bienvenida a mayoristas", sentAtUtc: "2026-07-14T13:00:00Z", status: "Read" },
];
function detail(read: WhatsAppContactResponse) {
  return [
    api("GET", `${contacts}/${read.id}`, read),
    api("GET", `${contacts}/${read.id}/conversations`, page(conversations)),
    api("GET", `${contacts}/${read.id}/broadcasts`, page(broadcasts)),
    tags,
  ];
}
const martinaPath = `/org/whatsapp/contactos/${martina.id}`;
const unlinked = { ...martina, linkedToAccount: false };

const fileUpload = "Elegir el archivo es subir uno, y la base de la galería no tiene la acción «upload»: sin archivo no hay vista previa ni importación.";

/** Galería de la E11 de esta área: un caso por tablero y estado que se fotografía, y lo pendiente con su motivo. */
export const contactsGalleryCases: readonly GalleryCase[] = [
  galleryCase(group, "WA-Contactos", "Lista", galleryApp("business", "/org/whatsapp/contactos", list, { readyText: "Martina López" }), { props: {} }),
  galleryCase(group, "M-WA-Contactos", "Lista", galleryApp("business", "/org/whatsapp/contactos", list, { readyText: "Martina López" }), { props: {} }),

  galleryCase(group, "WA-Contacto", "Ficha", galleryApp("business", martinaPath, detail(martina), { readyText: "Quiero hacer un pedido." })),
  galleryCase(group, "WA-Contacto", "Editar contacto", galleryApp("business", martinaPath, detail(martina), {
    actions: [click("Editar contacto")], readySelector: "[role=dialog]", readyText: "Promociones",
  })),
  galleryCase(group, "WA-Contacto", "Sin vínculo", galleryApp("business", martinaPath, detail(unlinked), { readyText: "Quiero hacer un pedido." })),
  galleryCase(group, "M-WA-Contacto", "Ficha", galleryApp("business", martinaPath, detail(martina), { readyText: "Quiero hacer un pedido." })),
  galleryCase(group, "M-WA-Contacto", "Editar contacto", galleryApp("business", martinaPath, detail(martina), {
    actions: [press("Acciones de Martina López"), click("Editar contacto", "menuitem")], readySelector: "[role=dialog]", readyText: "Promociones",
  })),
  galleryCase(group, "M-WA-Contacto", "Sin vínculo", galleryApp("business", martinaPath, detail(unlinked), { readyText: "Quiero hacer un pedido." })),
];

export const contactsGalleryPending: readonly GalleryPending[] = [
  ...["WA-Contactos-Importar", "M-WA-Contactos-Importar"].flatMap((board) => ["Archivo elegido", "Con filas que no entran", "Importado"]
    .map((state) => galleryPending(group, board, state, fileUpload))),
];
