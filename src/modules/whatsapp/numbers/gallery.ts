import type { PlatformWhatsAppNumberResponse, WhatsAppNumberListResponse, WhatsAppNumberResponse } from "../api/types";
import { api, click, galleryApp, galleryCase, galleryPending, page, press, type GalleryAction, type GalleryApiResponse, type GalleryCase, type GalleryPending } from "../test/gallery";

const signup = { appId: "gallery-app", configId: "gallery-config", sdkVersion: "v26.0" };
const route = "/org/whatsapp/numeros";
const platformRoute = "/plataforma/whatsapp/numero";

// Los números de los tableros WA-Admin: el de toda la organización (también en la app) y el de Delta Sur sin medio de pago.
const central: WhatsAppNumberResponse = { id: "0a6f1c1e-5b8e-4c62-9d10-000000000100", displayNumber: "+5491155550100", verifiedName: "Grupo Delta",
  company: null, status: "Connected", coexistence: true, serviceMessagesThisMonth: 640, freeServiceMessages: 1000, chargedServiceMessagesThisMonth: 0,
  connectedAtUtc: "2026-01-12T13:00:00Z", version: 3 };
const south: WhatsAppNumberResponse = { ...central, id: "0a6f1c1e-5b8e-4c62-9d10-000000000200", displayNumber: "+5493515550200", verifiedName: "Delta Sur",
  company: { id: "6d1a0c55-2f7e-4b2a-8c3d-0000000000c3", name: "Delta Sur S.R.L." }, status: "PaymentMissing", coexistence: false, serviceMessagesThisMonth: 310,
  version: 7 };
/** El nombre del ⋮ de Delta Sur, con el teléfono como lo muestra `PhoneText` en es-AR. */
const southActions = "Acciones de 0351 15-555-0200";
const companies = page([{ id: "6d1a0c55-2f7e-4b2a-8c3d-0000000000c1", name: "Delta S.A." }, { id: "6d1a0c55-2f7e-4b2a-8c3d-0000000000c2", name: "Delta Norte S.A." }, south.company!]);

const list = (items: WhatsAppNumberResponse[], paymentMissing: number): WhatsAppNumberListResponse => ({ numbers: page(items), paymentMissing, signup });
const numbersApi = (items = [central, south], paymentMissing = 1): GalleryApiResponse[] => [
  api("GET", "/api/organization/whatsapp/numbers", list(items, paymentMissing)),
  api("GET", "/api/organization/whatsapp/numbers/company-options", companies),
];

/** Los estados de WA-Admin y M-WA-Admin (control «estado»): la lista, su ⋮ y lo que abre, el desconectado y el tope. */
function adminCases(board: "WA-Admin" | "M-WA-Admin"): GalleryCase[] {
  const at = (state: string, responses: GalleryApiResponse[], actions: GalleryAction[], readyText: string, readySelector?: string) =>
    galleryCase("numeros", board, state, galleryApp("business", route, responses, { actions, readyText, readySelector }));
  const menu = [press(southActions)];
  return [
    at("Lista", numbersApi(), [], "310 de 1.000 gratis"),
    at("Menú del número", numbersApi(), menu, "Comprobar medio de pago", "[role=menu]"),
    at("Cambiar a quién atiende", numbersApi(), [...menu, click("Cambiar a quién atiende", "menuitem")], "A quién atiende", "[role=dialog]"),
    at("Desconectar", numbersApi(), [...menu, click("Desconectar", "menuitem")], "Sus chats quedan para leer", "[role=dialog]"),
    at("Desconectado", numbersApi([central, { ...south, status: "Disconnected", serviceMessagesThisMonth: 0 }], 0), [], "Desconectado"),
    at("Pasado el tope", numbersApi([{ ...central, serviceMessagesThisMonth: 1240, chargedServiceMessagesThisMonth: 240 }, south]), [], "240 se cobran"),
  ];
}

/** WA-Alta y M-WA-Alta: el diálogo «Conectar número» con «Atiende a» cerrado y abierto. */
function connectCases(board: "WA-Alta" | "M-WA-Alta"): GalleryCase[] {
  const open = [click("Conectar número")];
  return [
    galleryCase("numeros", board, "Atiende a", galleryApp("business", route, numbersApi(), { actions: open, readySelector: "[role=dialog]", readyText: "Seguir en Meta" })),
    galleryCase("numeros", board, "Atiende a · elegir", galleryApp("business", route, numbersApi(), {
      actions: [...open, press("Atiende a", "combobox")], readyText: "Delta Norte S.A." })),
  ];
}

// Plat-WA-Numero: el número de la plataforma desde el 12/01/2026, con los avisos del mes y las consultas.
const platformNumber: WhatsAppNumberResponse = { ...central, id: "0a6f1c1e-5b8e-4c62-9d10-000000001000", displayNumber: "+5491140001000",
  verifiedName: "ArquitecturaBase", coexistence: false, serviceMessagesThisMonth: 580, version: 4 };
const platform = (patch: Partial<PlatformWhatsAppNumberResponse> = {}): PlatformWhatsAppNumberResponse =>
  ({ number: platformNumber, consultationsEnabled: true, systemMessagesThisMonth: 11900, signup, ...patch });

function platformCases(board: "Plat-WA-Numero" | "M-Plat-WA-Numero"): GalleryCase[] {
  const at = (state: string, response: PlatformWhatsAppNumberResponse, readyText: string, actions: GalleryAction[] = [], readySelector?: string) =>
    galleryCase("numeros", board, state, galleryApp("platform", platformRoute, [api("GET", "/api/platform/whatsapp/number", response)],
      { actions, readyText, readySelector }));
  return [
    at("Conectado", platform(), "580 de 1.000 gratis este mes"),
    at("Consultas apagadas", platform({ consultationsEnabled: false }), "11.900 mensajes este mes"),
    at("Falta medio de pago", platform({ number: { ...platformNumber, status: "PaymentMissing" } }), "Las consultas siguen hasta 1.000 por mes",
      [click("Por qué no puede mandar mensajes")], "[role=dialog]"),
    at("Sin número", platform({ number: null, systemMessagesThisMonth: 0 }), "Todavía no hay un número conectado"),
  ];
}

/** Galería de la E11 de esta área: un caso por tablero y estado que se fotografía, y lo pendiente con su motivo. */
export const numbersGalleryCases: readonly GalleryCase[] = [
  ...adminCases("WA-Admin"),
  galleryCase("numeros", "WA-Admin-Pago", "Falta medio de pago", galleryApp("business", route, numbersApi(), {
    actions: [click("Qué significa")], readySelector: "[role=dialog]", readyText: "no tiene medio de pago" }), { props: {} }),
  galleryCase("numeros", "WA-Admin-Vacio", "Sin números", galleryApp("business", route, numbersApi([], 0), { readyText: "Conectar número" }), { props: {} }),
  ...connectCases("WA-Alta"),
  ...adminCases("M-WA-Admin"),
  galleryCase("numeros", "M-WA-Admin-Pago", "Falta medio de pago", galleryApp("business", route, numbersApi(), {
    actions: [click("Qué significa")], readySelector: "[role=dialog]", readyText: "no tiene medio de pago" }), { props: {} }),
  galleryCase("numeros", "M-WA-Admin-Vacio", "Sin números", galleryApp("business", route, numbersApi([], 0), { readyText: "Todavía no hay números conectados." }), { props: {} }),
  ...connectCases("M-WA-Alta"),
  ...platformCases("Plat-WA-Numero"),
  ...platformCases("M-Plat-WA-Numero"),
];

const sdk = "Sale de la ventana de Facebook (FB.login y WA_EMBEDDED_SIGNUP): el arnés no carga el SDK real ni abre la ventana de Meta.";
const metaWindow = "La ventana de Meta la dibuja Facebook: el tablero es referencia y la app no la programa.";
export const numbersGalleryPending: readonly GalleryPending[] = [
  ...(["Conectado", "Cancelado", "Error de Meta"] as const).map((state) => galleryPending("numeros", "WA-Alta", state, sdk)),
  ...(["Ventana de Meta abierta", "Conectado", "Cancelado", "Error de Meta"] as const).flatMap((state) =>
    (["M-WA-Alta", "Plat-WA-Alta", "M-Plat-WA-Alta"] as const).map((board) => galleryPending("numeros", board, state, sdk))),
  galleryPending("numeros", "WA-Alta-Meta", "Ventana de Meta", metaWindow),
  galleryPending("numeros", "WA-Alta-Coexistencia", "Ventana de Meta", metaWindow),
];
