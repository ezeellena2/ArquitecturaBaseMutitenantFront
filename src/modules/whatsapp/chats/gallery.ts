import { referenceDataFixture } from "../../../test/mocks/handlers.ts";
import type {
  WhatsAppChatMessageResponse, WhatsAppConversationChannelResponse, WhatsAppConversationRowResponse, WhatsAppTemplateOptionResponse,
} from "../api/types";
import {
  api, click, fill, galleryApp, galleryCase, galleryPending, page, press,
  type GalleryAction, type GalleryApiResponse, type GalleryCase, type GalleryPending,
} from "../test/gallery";

// Galería de Chats (WA-Chats*, M-WA-*, Plat-WA-Chats y sus M-*): los datos de ejemplo de cada tablero, a las 11:00 del
// martes 13/10/2026 en Buenos Aires (14:00 UTC). «Hoy» es el 13, «Ayer» el 12 y «Lunes» el 5.
const today = (time: string) => `2026-10-13T${utc(time)}:00Z`;
const yesterday = (time: string) => `2026-10-12T${utc(time)}:00Z`;
const monday = (time: string) => `2026-10-05T${utc(time)}:00Z`;
function utc(time: string) { const [hours, minutes] = time.split(":").map(Number); return `${String(hours + 3).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`; }

const org = "/api/organization/whatsapp";
const platform = "/api/platform/whatsapp";
const lucia = { id: "lucia", name: "Lucía Fernández" };
const tomas = { id: "tomas", name: "Tomás Acosta" };
const ventas = { id: "team-ventas", name: "Ventas" };
const soporte = { id: "team-soporte", name: "Soporte" };
const delta: WhatsAppConversationChannelResponse = { id: "number-delta", displayNumber: "+5493515550200", status: "Connected" };

type Row = WhatsAppConversationRowResponse;
function row(fields: Partial<Row> & Pick<Row, "id" | "displayNumber" | "lastMessageAtUtc">): Row {
  return { inbox: "Customers", contactId: null, contactName: null, tags: [], lastMessagePreview: null, unread: false, team: ventas, assignee: lucia,
    linkedToAccount: false, windowOpenUntilUtc: null, readOnly: false, accountId: null, version: 1, channel: delta, assignedToMe: true, ...fields };
}
type Message = WhatsAppChatMessageResponse;
const received = (id: string, text: string, at: string): Message => ({ id, kind: "Text", direction: "Inbound", author: null, text, mediaKind: null, status: "Received", failureReason: null, createdAtUtc: at });
const sent = (id: string, text: string, at: string, author: string | null = lucia.name): Message => ({ ...received(id, text, at), direction: "Outbound", author, status: "Read" });
const event = (id: string, text: string, at: string): Message => ({ ...received(id, text, at), kind: "Event", direction: "Outbound" });
const media = (id: string, mediaKind: Message["mediaKind"], at: string): Message => ({ ...received(id, "", at), kind: "Media", text: null, mediaKind });
const note = (id: string, text: string, at: string): Message => ({ ...sent(id, text, at), kind: "Note" });

const welcome = "Hola, gracias por escribir a Grupo Delta. ¿En qué te ayudamos?";

// WA-Chats, «Clientes»: Martina, a la que atiende Lucía, y las otras cuatro de la bandeja.
const martina = row({ id: "c-martina", contactId: "contact-martina", contactName: "Martina López", displayNumber: "+5491155556203", tags: ["Mayorista"], linkedToAccount: true,
  lastMessagePreview: "2 cajas de tornillos. ¿Atienden hasta las 18?", lastMessageAtUtc: today("10:42"), windowOpenUntilUtc: "2026-10-14T13:42:00Z", version: 3 });
const unknown = row({ id: "c-nuevo", contactId: "contact-0192", displayNumber: "+5493515550192", lastMessagePreview: "Quiero consultar un pedido.", lastMessageAtUtc: today("10:15"),
  unread: true, assignee: null, assignedToMe: false, windowOpenUntilUtc: "2026-10-14T13:15:00Z" });
const federico = row({ id: "c-federico", contactId: "contact-federico", contactName: "Federico Díaz", displayNumber: "+5491155552871", lastMessagePreview: "¿Siguen abiertos el sábado?",
  lastMessageAtUtc: yesterday("18:30"), unread: true, team: soporte, assignee: null, assignedToMe: false, windowOpenUntilUtc: "2026-10-13T21:30:00Z" });
const javier = row({ id: "c-javier", contactId: "contact-javier", contactName: "Javier Pereyra", displayNumber: "+5491155553388", lastMessagePreview: "Perfecto, gracias.",
  lastMessageAtUtc: yesterday("16:25"), team: soporte, assignee: tomas, assignedToMe: false, windowOpenUntilUtc: "2026-10-13T19:25:00Z" });
const carla = row({ id: "c-carla", contactId: "contact-carla", contactName: "Carla Ruiz", displayNumber: "+5491155551146", tags: ["Delta Sur S.R.L."],
  lastMessagePreview: "Vos: Te esperamos.", lastMessageAtUtc: monday("11:07"), windowOpenUntilUtc: "2026-10-06T14:06:00Z" });
const counts = { customers: 5, internal: 2, untaken: 2 };
const customersList = (rows: readonly Row[], untaken = 2) => api("GET", `${org}/customers/conversations`, { conversations: page(rows), counts: { ...counts, untaken } });
const customerTeams = api("GET", `${org}/customers/inbox-teams`, page([ventas, soporte, { id: "team-general", name: "Atención general" }]));
const conversation = (path: string, conversationRow: Row, messages: readonly Message[]) => api("GET", path, { conversation: conversationRow, messages: page(messages) });

const martinaMessages = (at: (time: string) => string = today): Message[] => [
  received("m-1", "Hola, buen día. Quiero hacer un pedido.", at("10:39")),
  sent("m-2", welcome, at("10:39"), null),
  received("m-3", "Hacer un pedido", at("10:40")),
  event("m-4", "Eligió «Hacer un pedido» · pasó a Ventas", at("10:40")),
  event("m-5", "Lucía Fernández tomó la conversación", at("10:41")),
  sent("m-6", "Hola, Martina. ¿Qué te gustaría pedir?", at("10:41")),
  received("m-7", "2 cajas de tornillos. ¿Atienden hasta las 18?", at("10:42")),
];
const unknownMessages: Message[] = [
  received("n-1", "Hola, quiero hacer un pedido.", today("10:14")),
  sent("n-2", welcome, today("10:14"), null),
  received("n-3", "Hacer un pedido", today("10:15")),
  event("n-4", "Eligió «Hacer un pedido» · pasó a Ventas", today("10:15")),
];
const javierMessages: Message[] = [
  received("j-1", "Hola, ¿me confirman cuándo sale el pedido 1038?", yesterday("16:20")),
  event("j-2", "Eligió «Consultar un pedido» · pasó a Soporte", yesterday("16:20")),
  event("j-3", "Tomás Acosta tomó la conversación", yesterday("16:21")),
  sent("j-4", "Hola, Javier. Sale mañana a la mañana.", yesterday("16:24"), tomas.name),
  received("j-5", "Perfecto, gracias.", yesterday("16:25")),
];
const carlaMessages: Message[] = [
  received("k-1", "Hola, ¿tienen tarugos del 8?", monday("11:02")),
  event("k-2", "Eligió «Hacer un pedido» · pasó a Ventas", monday("11:02")),
  event("k-3", "Lucía Fernández tomó la conversación", monday("11:03")),
  sent("k-4", "Sí, tenemos. ¿Cuántas cajas?", monday("11:05")),
  received("k-5", "Tres. Paso a la tarde.", monday("11:06")),
];
const customers = [martina, unknown, federico, javier, carla];

/** La bandeja de Clientes con su conversación abierta y los equipos del filtro. */
function customersChat(open: Row, messages: readonly Message[], options: { list?: readonly Row[]; extra?: GalleryApiResponse[] } = {}) {
  return [...(options.extra ?? []), conversation(`${org}/customers/conversations/${open.id}`, open, messages),
    customersList(options.list ?? customers.map((item) => item.id === open.id ? open : item)), customerTeams];
}

// «Foto, audio o documento» (D7): lo que mandó se dice, sin descarga.
const martinaMedia = { ...martina, lastMessagePreview: "Mandó un audio", lastMessageAtUtc: today("10:44"), windowOpenUntilUtc: "2026-10-14T13:44:00Z" };
const martinaMediaMessages = [...martinaMessages(), media("m-8", "Image", today("10:43")), media("m-9", "Document", today("10:43")), media("m-10", "Audio", today("10:44"))];
// «Lo tomó otra persona»: Lucía le escribe al número sin tomar y, mientras, Tomás lo tomó (409 TakenByOther).
const unknownTaken = { ...unknown, unread: false, assignee: tomas, assignedToMe: false };
const unknownTakenMessages = [...unknownMessages.slice(0, 3), event("n-4", "Eligió «Hacer un pedido» · pasó a Ventas", today("10:15")),
  event("n-5", "Tomás Acosta tomó la conversación · 10:16", today("10:16"))];
const afterSend = { method: "POST", path: `${org}/customers/conversations/c-nuevo/messages` } as const;
const takenByOther: GalleryApiResponse[] = [
  { ...conversation(`${org}/customers/conversations/c-nuevo`, unknownTaken, unknownTakenMessages), afterResponse: afterSend },
  { ...customersList(customers.map((item) => item.id === unknown.id ? unknownTaken : item), 1), afterResponse: afterSend },
  api("POST", `${org}/customers/conversations/c-nuevo/messages`, { code: "WhatsApp.Conversation.TakenByOther", detail: "Otra persona tomó esta conversación y tu mensaje no salió.", takenBy: tomas.name }, 409),
];
// «Número desconectado» (D7): sus chats quedan para leer. «Sin medio de pago» (CC13): el número no responde.
const carlaDisconnected = { ...carla, readOnly: true, channel: { ...delta, status: "Disconnected" as const } };
const carlaUnpaid = { ...carla, lastMessagePreview: "¿Me lo pueden mandar por moto?", lastMessageAtUtc: monday("11:20"), windowOpenUntilUtc: "2026-10-06T14:20:00Z",
  channel: { ...delta, status: "PaymentMissing" as const } };
const carlaReadMessages = [...carlaMessages, sent("k-6", "Te esperamos.", monday("11:07"))];
const carlaUnpaidMessages = [...carlaMessages, received("k-6", "¿Me lo pueden mandar por moto?", monday("11:20"))];
// WA-Chats-24h: la misma conversación, ayer; la ventana venció hoy a las 10:42.
const martinaClosed = { ...martina, lastMessageAtUtc: yesterday("10:42"), windowOpenUntilUtc: "2026-10-13T13:42:00Z" };
const martinaNote = [...martinaMessages(), note("m-8", "Es mayorista: confirmar precio con Carolina antes de responder.", today("10:43"))];

// WA-Chats, «Internos»: Tomás, empleado de Delta S.A., en «Carga de pedidos».
const cargas = { id: "team-cargas", name: "Carga de pedidos" };
const tomasChat = row({ id: "c-tomas", inbox: "Internal", contactName: tomas.name, displayNumber: "+5491155554521", tags: ["Delta S.A."], team: cargas,
  lastMessagePreview: "Bien. Me pidieron 20 cajas de tarugos del 8. ¿Hay stock?", lastMessageAtUtc: today("10:51"), windowOpenUntilUtc: "2026-10-14T13:51:00Z" });
const martin = row({ id: "c-martin", inbox: "Internal", contactName: "Martín Paz", displayNumber: "+5491155557730", team: cargas, assignee: null, assignedToMe: false, unread: true,
  lastMessagePreview: "Mañana paso por el depósito.", lastMessageAtUtc: yesterday("17:00"), windowOpenUntilUtc: "2026-10-13T20:00:00Z" });
const internalInbox: GalleryApiResponse[] = [
  conversation(`${org}/internal/conversations/c-tomas`, tomasChat, [
    received("t-1", "Hola, Lucía. Ya terminé la visita en Ferretería Rosales.", today("10:48")),
    event("t-2", "Pasó a Carga de pedidos", today("10:48")),
    event("t-3", "Lucía Fernández tomó la conversación", today("10:49")),
    sent("t-4", "Genial, Tomás. ¿Cómo te fue?", today("10:50")),
    received("t-5", "Bien. Me pidieron 20 cajas de tarugos del 8. ¿Hay stock?", today("10:51")),
  ]),
  api("GET", `${org}/internal/conversations`, { conversations: page([tomasChat, martin]), counts }),
  api("GET", `${org}/internal/inbox-teams`, page([cargas])),
];

// M-WA-Chats suma a Laura, que atiende Carolina, y el número sin tomar pide «hacer un pedido».
const laura = row({ id: "c-laura", contactId: "contact-laura", contactName: "Laura Méndez", displayNumber: "+5491155559012", lastMessagePreview: "¿Tienen envío a domicilio?",
  lastMessageAtUtc: monday("12:10"), assignee: { id: "carolina", name: "Carolina Vega" }, assignedToMe: false });
const phoneCustomers = [martina, { ...unknown, lastMessagePreview: "Quiero hacer un pedido." }, federico, javier, carla, laura];

// WA-Chats-Pasar: los otros equipos y las personas de Ventas (CC01).
const transferOptions = (people: readonly { id: string; name: string; takenCount: number }[]) => [
  api("GET", `${org}/customers/conversations/c-martina/transfer-options/teams`, page([{ ...soporte, memberCount: 2 }, { id: "team-general", name: "Atención general", memberCount: 3 }])),
  api("GET", `${org}/customers/conversations/c-martina/transfer-options/people`, page(people)),
];
const carolina = { id: "carolina", name: "Carolina Vega", takenCount: 3 };

// WA-Chats-Plantilla: las plantillas aprobadas, con la vista previa (CC03) y el costo que calcula el back.
const templates: WhatsAppTemplateOptionResponse[] = [
  { templateId: "t-pedido-listo", name: "Pedido listo", category: "Utility", body: "Hola {{1}}, tu pedido {{2}} está listo. Podés retirarlo en el local de 9 a 18.",
    variables: ["Nombre", "Número de pedido"], estimatedCost: { amount: 0.03, currency: "USD" } },
  { templateId: "t-seguimos", name: "Seguimos tu pedido", category: "Utility", body: "Hola {{1}}, tu pedido {{2}} ya salió.",
    variables: ["Nombre", "Número de pedido"], estimatedCost: { amount: 0.03, currency: "USD" } },
];
const reference = referenceDataFixture();
const withDollars = api("GET", "/api/reference-data", { ...reference, currencies: [...reference.currencies,
  { ...reference.currencies[0], code: "USD", name: "Dólar estadounidense", namePlural: "Dólares estadounidenses", displaySymbol: "US$", symbol: "US$", minorUnits: 2, sortOrder: 2 }] });
const templateChat = customersChat(martinaClosed, martinaMessages(yesterday), {
  extra: [withDollars, api("GET", `${org}/customers/conversations/c-martina/template-options`, page(templates))] });
const chooseTemplate = (dialog: string): GalleryAction[] => [click("Elegir plantilla"), click("Plantilla", "combobox", { role: "dialog", name: dialog }),
  click("Pedido listo", "option"), fill("Nombre", "Martina", { role: "dialog", name: dialog }), fill("Número de pedido", "1043", { role: "dialog", name: dialog })];

// Plat-WA-Chats: las Consultas de Plataforma, sin bandejas; Lucía, vinculada a su cuenta, la atiende Martín Sosa.
const martinSosa = { id: "martin-sosa", name: "Martín Sosa" };
const platformNumber: WhatsAppConversationChannelResponse = { id: "number-platform", displayNumber: "+5491155550000", status: "Connected" };
const altas = { id: "team-altas", name: "Altas" };
const platformLucia = row({ id: "c-lucia", inbox: null, contactName: lucia.name, displayNumber: "+5491155554521", linkedToAccount: true, accountId: "account-lucia",
  team: soporte, assignee: martinSosa, channel: platformNumber, lastMessagePreview: "Por correo, a lucia.fer@gmail.com. Ya pedí dos.", lastMessageAtUtc: today("10:42"),
  windowOpenUntilUtc: "2026-10-14T13:42:00Z" });
const consultations = [platformLucia,
  row({ id: "c-registro", inbox: null, displayNumber: "+5493515550192", team: altas, assignee: null, assignedToMe: false, unread: true, channel: platformNumber,
    lastMessagePreview: "¿Cómo registro mi empresa?", lastMessageAtUtc: today("10:15") }),
  row({ id: "c-beto", inbox: null, contactName: "Beto Ramírez", displayNumber: "+5491155556677", team: soporte, assignee: null, assignedToMe: false, unread: true, channel: platformNumber,
    lastMessagePreview: "Nos suspendieron Beta S.R.L., ¿qué hacemos?", lastMessageAtUtc: yesterday("19:10") }),
  row({ id: "c-julio", inbox: null, contactName: "Julio Pérez", displayNumber: "+5491155558899", team: soporte, assignee: { id: "laura-diaz", name: "Laura Díaz" }, assignedToMe: false,
    channel: platformNumber, lastMessagePreview: "Gracias, ya pude entrar.", lastMessageAtUtc: yesterday("15:40") }),
];
const platformInbox: GalleryApiResponse[] = [
  conversation(`${platform}/conversations/c-lucia`, platformLucia, [
    received("p-1", "Hola, no me llega el código para entrar.", today("10:39")),
    sent("p-2", "Hola, gracias por escribir a ArquitecturaBase. ¿En qué te ayudamos?", today("10:39"), null),
    received("p-3", "Hablar con alguien", today("10:40")),
    event("p-4", "Eligió «Hablar con alguien» · pasó a Soporte", today("10:40")),
    event("p-5", "Martín Sosa tomó la conversación", today("10:41")),
    sent("p-6", "Hola, Lucía. ¿El código te llega por correo o por WhatsApp?", today("10:41"), martinSosa.name),
    received("p-7", "Por correo, a lucia.fer@gmail.com. Ya pedí dos.", today("10:42")),
  ]),
  api("GET", `${platform}/conversations`, { conversations: page(consultations), counts: { customers: 4, internal: 0, untaken: 2 } }),
  api("GET", `${platform}/inbox-teams`, page([soporte, altas])),
];

const business = (route: string, responses: GalleryApiResponse[], options: Parameters<typeof galleryApp>[3] = {}) => galleryApp("business", route, responses, options);
const chat = (id: string) => `/org/whatsapp/chats/${id}`;

/** Galería de la E11 de esta área: un caso por tablero y estado que se fotografía, y lo pendiente con su motivo. */
export const chatsGalleryCases: readonly GalleryCase[] = [
  // WA-Chats: la bandeja y la conversación abierta, en cada estado del tablero.
  galleryCase("chats", "WA-Chats", "Clientes", business("/org/whatsapp/chats", customersChat(martina, martinaMessages()), { readyText: "2 cajas de tornillos. ¿Atienden hasta las 18?" })),
  galleryCase("chats", "WA-Chats", "Internos", business("/org/whatsapp/chats?inbox=internal", internalInbox, { readyText: "¿Cómo te fue?" })),
  galleryCase("chats", "WA-Chats", "Foto, audio o documento", business(chat("c-martina"), customersChat(martinaMedia, martinaMediaMessages), { readyText: "Mandó un documento" })),
  galleryCase("chats", "WA-Chats", "Lo atiende otra persona", business(chat("c-javier"), customersChat(javier, javierMessages), { readyText: "Lo atiende Tomás Acosta" })),
  galleryCase("chats", "WA-Chats", "Lo tomó otra persona", business(chat("c-nuevo"), [...takenByOther, ...customersChat(unknown, unknownMessages)], {
    actions: [fill("Mensaje", "Hola, ¿qué te gustaría pedir?"), click("Enviar")], readyText: "No pudimos mandar tu mensaje: Tomás Acosta tomó el chat antes." })),
  galleryCase("chats", "WA-Chats", "Número desconectado", business(chat("c-carla"), customersChat(carlaDisconnected, carlaReadMessages), { readyText: "Número desconectado" })),
  galleryCase("chats", "WA-Chats", "Número desconectado · qué significa", business(chat("c-carla"), customersChat(carlaDisconnected, carlaReadMessages), {
    actions: [click("Qué significa")], readyText: "Sus chats quedan para leer, sin responder" })),
  galleryCase("chats", "WA-Chats", "Sin medio de pago", business(chat("c-carla"), customersChat(carlaUnpaid, carlaUnpaidMessages), { readyText: "Sin medio de pago" })),
  galleryCase("chats", "WA-Chats", "Sin medio de pago · qué significa", business(chat("c-carla"), customersChat(carlaUnpaid, carlaUnpaidMessages), {
    actions: [click("Qué significa")], readyText: "Falta medio de pago en Meta" })),
  // WA-Chats-24h, -Nota, -Pasar, -Plantilla y -SinTomar.
  galleryCase("chats", "WA-Chats-24h", "Pasaron 24 horas", business(chat("c-martina"), customersChat(martinaClosed, martinaMessages(yesterday)), { readyText: "Elegir plantilla" })),
  galleryCase("chats", "WA-Chats-24h", "Qué significa", business(chat("c-martina"), customersChat(martinaClosed, martinaMessages(yesterday)), {
    actions: [click("Qué significa")], readyText: "Pasadas 24 horas, WhatsApp solo deja mandarle una plantilla aprobada" })),
  galleryCase("chats", "WA-Chats-Nota", "Nota interna", business(chat("c-martina"), customersChat(martina, martinaNote), {
    actions: [click("Nota interna")], readyText: "Es mayorista: confirmar precio con Carolina antes de responder.", readyTexts: ["Guardar nota"] }), { props: {} }),
  galleryCase("chats", "WA-Chats-Pasar", "Pasar a", business(chat("c-martina"), [...transferOptions([carolina]), ...customersChat(martina, martinaMessages())], {
    actions: [press("Pasar")], readyText: "Personas de Ventas" }), { props: {} }),
  galleryCase("chats", "WA-Chats-Plantilla", "Plantilla elegida", business(chat("c-martina"), templateChat, {
    actions: chooseTemplate("Mandar plantilla a Martina López"), readyText: "Costo estimado:", readyTexts: ["0,03"] })),
  galleryCase("chats", "WA-Chats-SinTomar", "Sin tomar", business(chat("c-nuevo"), customersChat(unknown, unknownMessages), { readyText: "Sin tomar · Ventas" }), { props: {} }),
  // En el teléfono: la lista y cada conversación como otra pantalla.
  galleryCase("chats", "M-WA-Chats", "Clientes", business("/org/whatsapp/chats", [customersList(phoneCustomers), customerTeams], { readyText: "Laura Méndez" })),
  galleryCase("chats", "M-WA-Chats", "Internos", business("/org/whatsapp/chats?inbox=internal", internalInbox, { readyText: "Martín Paz" })),
  galleryCase("chats", "M-WA-Conversacion", "Conversación", business(chat("c-martina"), customersChat(martina, martinaMessages()), { readyText: "2 cajas de tornillos. ¿Atienden hasta las 18?" })),
  galleryCase("chats", "M-WA-Conversacion", "Foto, audio o documento", business(chat("c-martina"), customersChat(martinaMedia, martinaMediaMessages), { readyText: "Mandó un audio" })),
  galleryCase("chats", "M-WA-Conversacion", "Lo atiende otra persona", business(chat("c-javier"), customersChat(javier, javierMessages), { readyText: "Lo atiende Tomás Acosta" })),
  galleryCase("chats", "M-WA-Conversacion", "Lo tomó otra persona", business(chat("c-nuevo"), [...takenByOther, ...customersChat(unknown, unknownMessages)], {
    actions: [fill("Mensaje", "Hola, ¿qué te gustaría pedir?"), click("Enviar")], readyText: "No pudimos mandar tu mensaje: Tomás Acosta tomó el chat antes." })),
  galleryCase("chats", "M-WA-Conversacion", "Número desconectado", business(chat("c-carla"), customersChat(carlaDisconnected, carlaReadMessages), { readyText: "Número desconectado" })),
  galleryCase("chats", "M-WA-Conversacion", "Número desconectado · qué significa", business(chat("c-carla"), customersChat(carlaDisconnected, carlaReadMessages), {
    actions: [click("Qué significa")], readyText: "Sus chats quedan para leer, sin responder" })),
  galleryCase("chats", "M-WA-Conversacion", "Sin medio de pago", business(chat("c-carla"), customersChat(carlaUnpaid, carlaUnpaidMessages), { readyText: "Sin medio de pago" })),
  galleryCase("chats", "M-WA-Conversacion", "Sin medio de pago · qué significa", business(chat("c-carla"), customersChat(carlaUnpaid, carlaUnpaidMessages), {
    actions: [click("Qué significa")], readyText: "Falta medio de pago en Meta" })),
  galleryCase("chats", "M-WA-24h", "Pasaron 24 horas", business(chat("c-martina"), customersChat(martinaClosed, martinaMessages(yesterday)), { readyText: "Elegir plantilla" })),
  galleryCase("chats", "M-WA-24h", "Qué significa", business(chat("c-martina"), customersChat(martinaClosed, martinaMessages(yesterday)), {
    actions: [click("Qué significa")], readyText: "Pasadas 24 horas, WhatsApp solo deja mandarle una plantilla aprobada" })),
  galleryCase("chats", "M-WA-Chats-Nota", "Nota interna", business(chat("c-martina"), customersChat(martina, martinaNote), {
    actions: [click("Nota interna")], readyText: "Es mayorista: confirmar precio con Carolina antes de responder." }), { props: {} }),
  galleryCase("chats", "M-WA-Chats-Pasar", "Pasar a", business(chat("c-martina"), [...transferOptions([carolina, { id: "diego", name: "Diego Ramos", takenCount: 1 }]),
    ...customersChat(martina, martinaMessages())], { actions: [press("Acciones de Martina López"), click("Pasar", "menuitem")], readyText: "Diego Ramos" }), { props: {} }),
  galleryCase("chats", "M-WA-Chats-Plantilla", "Plantilla elegida", business(chat("c-martina"), templateChat, {
    actions: chooseTemplate("Mandar plantilla"), readyText: "Costo estimado:", readyTexts: ["0,03"] })),
  // El ⋮ de un número sin nombre: su nombre es el número con el formato de la cultura, por eso se busca por su rótulo.
  galleryCase("chats", "M-WA-Chats-SinTomar", "Sin tomar", business(chat("c-nuevo"), customersChat(unknown, unknownMessages), {
    actions: [{ type: "press", label: "Acciones de", key: "Enter" }], readyText: "Ver ficha del contacto" }), { props: {} }),
  // Consultas de Plataforma.
  galleryCase("chats", "Plat-WA-Chats", "Consultas", galleryApp("platform", "/plataforma/whatsapp", platformInbox, { readyText: "Ver la cuenta" }), { props: {} }),
  galleryCase("chats", "M-Plat-WA-Chats", "Consultas", galleryApp("platform", "/plataforma/whatsapp", platformInbox, { readyText: "Beto Ramírez" }), { props: {} }),
  galleryCase("chats", "M-Plat-WA-Conversacion", "Conversación", galleryApp("platform", "/plataforma/whatsapp/consultas/c-lucia", platformInbox, {
    readyText: "Por correo, a lucia.fer@gmail.com. Ya pedí dos." })),
  galleryCase("chats", "M-Plat-WA-Conversacion", "Menú de la conversación", galleryApp("platform", "/plataforma/whatsapp/consultas/c-lucia", platformInbox, {
    actions: [press("Acciones de Lucía Fernández")], readyText: "Ver la cuenta" })),
];

const templateStatus = "Las opciones de plantilla del chat (template-options) no traen su estado en Meta: la app no puede mostrar «Aviso de turno · En revisión en Meta» ni «Oferta de octubre · Rechazada por Meta» apagadas, como el tablero.";
export const chatsGalleryPending: readonly GalleryPending[] = [
  galleryPending("chats", "WA-Chats-Plantilla", "Elegir la plantilla", templateStatus),
  galleryPending("chats", "M-WA-Chats-Plantilla", "Elegir la plantilla", templateStatus),
];
