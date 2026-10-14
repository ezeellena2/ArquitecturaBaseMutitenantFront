import type { WhatsAppTemplateCategory, WhatsAppTemplateResponse, WhatsAppTemplateStatus } from "../api/types";
import { api, click, fill, galleryApp, galleryCase, page, type GalleryAction, type GalleryCase, type GalleryPending } from "../test/gallery";

// Las plantillas de los tableros WA-Plantillas y Plat-WA-Plantillas: nombres, tipos, estados en Meta y fechas.
const at = (date: string) => `${date}T15:00:00Z`;
const template = (id: string, name: string, category: WhatsAppTemplateCategory, status: WhatsAppTemplateStatus, date: string,
  extra: Partial<WhatsAppTemplateResponse> = {}): WhatsAppTemplateResponse =>
  ({ id, name, category, languages: [{ culture: "es-AR", category }], body: "", variables: [], status, isSystem: false, updatedAtUtc: at(date), version: 1, title: null, ...extra });

const organizationTemplates = [
  template("tpl-pedido", "Pedido listo", "Utility", "Approved", "2026-09-20"),
  template("tpl-turno", "Recordatorio de turno", "Utility", "Approved", "2026-09-18"),
  template("tpl-novedades", "Novedades", "Marketing", "Pending", "2026-09-30"),
  template("tpl-promo", "Promo semanal", "Marketing", "Rejected", "2026-09-29", { rejectionReason: "El formato no cumple las reglas de Meta" }),
];
const consultations = [
  template("tpl-seguimos", "Seguimos tu consulta", "Utility", "Approved", "2026-09-28"),
  template("tpl-dato", "Te pedimos un dato más", "Utility", "Pending", "2026-10-02"),
];
// Las 16 del sistema (E8), en español y en inglés: `invitacion_organizacion` es Marketing en español y Utility en inglés
// (CC24; lo decide el dato del back).
const system = (name: string, title: string, date: string, category: WhatsAppTemplateCategory = "Utility", english: WhatsAppTemplateCategory = category) =>
  template(`tpl-${name}`, name, category, "Approved", date, { title, isSystem: true, languages: [{ culture: "es-AR", category }, { culture: "en-US", category: english }] });
const systemTemplates = [
  system("codigo_ingreso", "Código de ingreso", "2026-09-15", "Authentication"),
  system("invitacion_organizacion", "Invitación a una organización", "2026-09-15", "Marketing", "Utility"),
  system("aviso_metodo_ingreso", "Aviso de método de ingreso", "2026-09-15"),
  system("revisa_metodos_ingreso", "Revisá tus métodos de ingreso", "2026-09-15"),
  system("baja_cuenta_pedida", "Baja pedida", "2026-09-15"),
  system("baja_cuenta_cancelada", "Baja cancelada", "2026-09-15"),
  system("cuenta_eliminada", "Cuenta eliminada", "2026-09-15"),
  system("recuperacion_recibida", "Recuperación recibida", "2026-09-15"),
  system("recuperacion_aprobada", "Recuperación aprobada", "2026-09-15"),
  system("recuperacion_rechazada", "Recuperación rechazada", "2026-09-15"),
  system("baja_cuenta_plataforma", "Baja iniciada por la plataforma", "2026-10-04"),
  system("baja_cuenta_plataforma_suspendida", "Baja por la plataforma, cuenta suspendida", "2026-10-04"),
  system("recuperacion_aviso_cuenta", "Aviso de recuperación a la cuenta", "2026-10-06"),
  system("organizacion_aprobada", "Organización aprobada", "2026-10-08"),
  system("organizacion_rechazada", "Organización rechazada", "2026-10-08"),
  system("pagina_publica_moderada", "Página pública moderada", "2026-10-08"),
];
// Los conteos de la banda y del segmentado de Plat-WA-Plantillas: «18 plantillas · 17 aprobadas», 2 y 16.
const platformCounts = { approved: 17, consultations: consultations.length, system: systemTemplates.length };
const secondPage = { items: systemTemplates.slice(10), page: 2, pageSize: 10, totalCount: systemTemplates.length, totalPages: 2, hasPrevious: true, hasNext: false };

const organizationApp = (options: { actions?: GalleryAction[]; readySelector?: string; readyText: string }) => galleryApp("business", "/org/whatsapp/plantillas", [
  api("GET", "/api/organization/whatsapp/templates", { templates: page(organizationTemplates), approved: 2, consultations: null, system: null }),
], options);

const platformList = (group: "Consultations" | "System", pageNumber = 1) => galleryApp("platform",
  `/plataforma/whatsapp/plantillas${group === "System" ? `?grupo=sistema${pageNumber > 1 ? `&page=${pageNumber}` : ""}` : ""}`, [
    api("GET", "/api/platform/whatsapp/templates", {
      templates: group === "Consultations" ? page(consultations) : pageNumber > 1 ? secondPage : page(systemTemplates.slice(0, 10), systemTemplates.length), ...platformCounts,
    }, 200, { group, ...(pageNumber > 1 ? { page: String(pageNumber) } : {}) }),
  ], { readyText: group === "Consultations" ? "Te pedimos un dato más" : pageNumber > 1 ? "Página pública moderada" : "Invitación a una organización" });

const why: GalleryAction[] = [click("Por qué la rechazó Meta")];
const dialog = { role: "dialog", name: "Nueva plantilla" } as const;
/** WA-Plantilla-Nueva: «Pedido listo», Utilidad, el texto con sus dos datos (el nombre y el número de pedido). */
const create: GalleryAction[] = [click("Nueva plantilla"), fill("Nombre", "Pedido listo", dialog),
  fill("Texto", "Hola {{1}}, tu pedido {{2}} está listo. Podés retirarlo en el local de 9 a 18.", dialog),
  fill("Dato 1", "nombre", dialog), fill("Dato 2", "número de pedido", dialog)];

/** Galería de la E11 de esta área: un caso por tablero y estado que se fotografía, y lo pendiente con su motivo. */
export const templatesGalleryCases: readonly GalleryCase[] = [
  ...(["WA-Plantillas", "M-WA-Plantillas"] as const).flatMap((board) => [
    galleryCase("plantillas", board, "Lista", organizationApp({ readyText: "Recordatorio de turno" })),
    galleryCase("plantillas", board, "Por qué la rechazó Meta", organizationApp({ actions: why, readySelector: "[role='dialog']", readyText: "Revisada el 29/09/2026" })),
  ]),
  ...(["WA-Plantilla-Nueva", "M-WA-Plantilla-Nueva"] as const).map((board) => galleryCase("plantillas", board, "Nueva plantilla",
    organizationApp({ actions: create, readySelector: "[role='dialog']", readyText: "Mandar a Meta" }), { props: {} })),
  galleryCase("plantillas", "Plat-WA-Plantillas", "Para consultas", platformList("Consultations"), { stateKey: "pestana" }),
  galleryCase("plantillas", "Plat-WA-Plantillas", "Del sistema", platformList("System"), { stateKey: "pestana" }),
  galleryCase("plantillas", "Plat-WA-Plantillas", "Del sistema: página 2", platformList("System", 2), { stateKey: "pestana" }),
  galleryCase("plantillas", "M-Plat-WA-Plantillas", "Para consultas", platformList("Consultations"), { stateKey: "pestana" }),
  galleryCase("plantillas", "M-Plat-WA-Plantillas", "Del sistema", platformList("System"), { stateKey: "pestana" }),
];
export const templatesGalleryPending: readonly GalleryPending[] = [];
