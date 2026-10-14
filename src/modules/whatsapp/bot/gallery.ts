import type { PlatformWhatsAppBotResponse, WhatsAppBotMenuOption, WhatsAppBotResponse, WhatsAppNumberResponse, WhatsAppTeamResponse } from "../api/types";
import { api, click, galleryApp, galleryCase, page, press, type GalleryAction, type GalleryApiResponse, type GalleryCase, type GalleryPending } from "../test/gallery";

const route = "/org/whatsapp/bot";
const platformRoute = "/plataforma/whatsapp/bot";

// Los números de WA-Respuestas: el de toda la organización (el elegido) y el de Delta Sur.
const central: WhatsAppNumberResponse = { id: "0a6f1c1e-5b8e-4c62-9d10-000000000100", displayNumber: "+5491155550100", verifiedName: "Grupo Delta",
  company: null, status: "Connected", coexistence: true, serviceMessagesThisMonth: 640, freeServiceMessages: 1000, chargedServiceMessagesThisMonth: 0,
  connectedAtUtc: "2026-01-12T13:00:00Z", version: 3 };
const south: WhatsAppNumberResponse = { ...central, id: "0a6f1c1e-5b8e-4c62-9d10-000000000200", displayNumber: "+5493515550200", verifiedName: "Delta Sur",
  company: { id: "6d1a0c55-2f7e-4b2a-8c3d-0000000000c3", name: "Delta Sur S.R.L." }, status: "PaymentMissing", coexistence: false, serviceMessagesThisMonth: 310 };
/** La píldora del número, con el teléfono como lo muestra `PhoneText` en es-AR. */
const numberPill = "Número: 011 15-5555-0100 · Toda la organización";

const team = (id: string, name: string, inbox: WhatsAppTeamResponse["inbox"] = "Customers"): WhatsAppTeamResponse =>
  ({ id: `7e2b3c44-0000-4000-8000-0000000000${id}`, name, inbox, memberCount: 3, memberPreview: [], version: 1 });
const sales = team("01", "Ventas");
const support = team("02", "Soporte");
const general = team("03", "Atención general");
const orders = team("04", "Carga de pedidos", "Internal");
const option = (id: string, label: string, patch: Partial<WhatsAppBotMenuOption>): WhatsAppBotMenuOption =>
  ({ id: `8f3c4d55-0000-4000-8000-0000000000${id}`, label, action: "Team", teamId: sales.id, isSystem: false, ...patch });
const reply = (text: string): Partial<WhatsAppBotMenuOption> => ({ action: "Reply", teamId: null, reply: text });

// El menú de WA-Respuestas y, para el tope, las seis opciones que suma «Tope de 10 opciones».
const menu = [option("01", "Hacer un pedido", {}), option("02", "Consultar un pedido", { teamId: support.id }),
  option("03", "Horarios y dirección", reply("Estamos en Av. Corrientes 1234, de 9 a 18")), option("04", "Hablar con alguien", { teamId: general.id })];
const fullMenu = [...menu, option("05", "Formas de pago", reply("Efectivo, transferencia o tarjeta")), option("06", "Envíos a domicilio", reply("Enviamos en CABA y GBA")),
  option("07", "Pedir presupuesto", {}), option("08", "Reclamos", { teamId: support.id }), option("09", "Cambios y devoluciones", { teamId: support.id }),
  option("10", "Trabajar con nosotros", reply("Dejanos tu CV en el local"))];
const schedule = { timeZoneId: "America/Argentina/Buenos_Aires",
  days: (["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const).map((day) => ({ day, from: "09:00:00", to: "18:00:00" })) };
const bot = (patch: Partial<WhatsAppBotResponse> = {}): WhatsAppBotResponse => ({ numberId: central.id,
  welcome: "Hola, gracias por escribir a Grupo Delta. ¿En qué te ayudamos?",
  outOfHours: "Hola, ahora estamos cerrados. Te respondemos el próximo día hábil desde las 9.", schedule, menu,
  askPromotions: true, offerAccountLink: true, employeesTeamId: orders.id, version: 5, ...patch });

const botApi = (current = bot()): GalleryApiResponse[] => [
  api("GET", "/api/organization/whatsapp/numbers", { numbers: page([central, south]), paymentMissing: 1, signup: null }),
  api("GET", "/api/organization/whatsapp/teams", page([sales, support, general, orders])),
  api("GET", `/api/organization/whatsapp/numbers/${central.id}/bot`, current),
];

/** Los estados de WA-Respuestas y M-WA-Respuestas (control «estado»). En el teléfono, las filas se tocan; en la compu, su ⋮. */
function settingsCases(board: "WA-Respuestas" | "M-WA-Respuestas"): GalleryCase[] {
  const phone = board.startsWith("M-");
  const at = (state: string, actions: GalleryAction[], readyText: string, current = bot(), readySelector?: string) =>
    galleryCase("bot", board, state, galleryApp("business", route, botApi(current), { actions, readyText, readySelector }));
  const edit = (row: string): GalleryAction[] => phone ? [click(row)] : [press(`Acciones de ${row}`), click("Editar", "menuitem")];
  return [
    at("Configuración", [], "Pasa a Ventas"),
    at("Editar bienvenida", edit("Bienvenida"), "Guardar", bot(), "[role=dialog]"),
    at("Editar fuera de horario", edit("Fuera de horario"), "Días y horarios de atención", bot(), "[role=dialog]"),
    at("Elegir el número", [phone ? click(numberPill) : press(numberPill)], "Delta Sur S.R.L.", bot(), phone ? "[role=dialog]" : "[role=menu]"),
    at("Tope de 10 opciones", [], "Trabajar con nosotros", bot({ menu: fullMenu })),
    at("Tope de 10 · qué significa", [click("Agregar opción")], "WhatsApp muestra hasta 10 opciones", bot({ menu: fullMenu }), "[role=dialog]"),
    at("Además apagado", [], "Preguntar por promociones", bot({ askPromotions: false, offerAccountLink: false })),
  ];
}

// Plat-WA-Bot: la opción del sistema primero y tres opciones que pasan a los equipos de Plataforma.
const platformSupport = team("11", "Soporte");
const platformSignups = team("12", "Altas");
const platformCare = team("13", "Atención");
const platformBot: PlatformWhatsAppBotResponse = { welcome: "Hola, somos ArquitecturaBase. ¿En qué te ayudamos?",
  outOfHours: "Hola, ahora no atendemos. Te respondemos el próximo día hábil desde las 9.", schedule, version: 2, menu: [
    option("21", "Entrar a mi cuenta", { action: "Reply", teamId: null, reply: null, isSystem: true }),
    option("22", "No me llega el código", { teamId: platformSupport.id }),
    option("23", "Registrar mi empresa", { teamId: platformSignups.id }),
    option("24", "Hablar con alguien", { teamId: platformCare.id }),
  ] };
const platformApi: GalleryApiResponse[] = [
  api("GET", "/api/platform/whatsapp/bot", platformBot),
  api("GET", "/api/platform/whatsapp/teams", page([platformSupport, platformSignups, platformCare])),
];

/** Galería de la E11 de esta área: un caso por tablero y estado que se fotografía, y lo pendiente con su motivo. */
export const botGalleryCases: readonly GalleryCase[] = [
  ...settingsCases("WA-Respuestas"),
  galleryCase("bot", "WA-Admin-Editar", "Editar opción", galleryApp("business", route, botApi(), {
    actions: [press("Acciones de Hacer un pedido"), click("Editar", "menuitem")], readySelector: "[role=dialog]", readyText: "Editar opción 1" }), { props: {} }),
  galleryCase("bot", "WA-Bot-Recorrido", "Recorrido", galleryApp("business", `${route}?vista=recorrido`, botApi(), { readyText: "¿Es un empleado?" }), { props: {} }),
  ...settingsCases("M-WA-Respuestas"),
  galleryCase("bot", "M-WA-Editar", "Editar opción", galleryApp("business", route, botApi(), {
    actions: [click("Hacer un pedido")], readySelector: "[role=dialog]", readyText: "Editar opción 1" }), { props: {} }),
  galleryCase("bot", "M-WA-Bot-Recorrido", "Recorrido", galleryApp("business", `${route}?vista=recorrido`, botApi(), { readyText: "¿Es un empleado?" }), { props: {} }),
  galleryCase("bot", "Plat-WA-Bot", "Configuración", galleryApp("platform", platformRoute, platformApi, { readyText: "Del sistema" }), { props: {} }),
  galleryCase("bot", "Plat-WA-Bot-Recorrido", "Recorrido", galleryApp("platform", `${platformRoute}?vista=recorrido`, platformApi,
    { readyText: "Enlace para entrar o registrarse" }), { props: {} }),
  galleryCase("bot", "M-Plat-WA-Bot", "Configuración", galleryApp("platform", platformRoute, platformApi, { readyText: "Del sistema" }), { stateKey: "pestana" }),
  galleryCase("bot", "M-Plat-WA-Bot", "Recorrido", galleryApp("platform", `${platformRoute}?vista=recorrido`, platformApi, { readyText: "Lo manda el bot" }),
    { stateKey: "pestana" }),
];
export const botGalleryPending: readonly GalleryPending[] = [];
