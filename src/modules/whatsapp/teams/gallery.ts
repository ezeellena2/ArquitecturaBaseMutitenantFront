import type { WhatsAppReferenceResponse, WhatsAppTeamResponse } from "../api/types";
import { api, click, fill, galleryApp, galleryCase, page, press, type GalleryAction, type GalleryCase, type GalleryPending, type GalleryScope } from "../test/gallery";

// Los equipos de los tableros WA-Equipos y Plat-WA-Equipos, con sus nombres, bandejas, personas y avisos.
const team = (id: string, name: string, inbox: WhatsAppTeamResponse["inbox"], memberPreview: string[], notifyAfterMinutes: number | null): WhatsAppTeamResponse =>
  ({ id, name, inbox, memberCount: memberPreview.length, memberPreview, notifyAfterMinutes, version: 1 });
const organizationTeams = [
  team("team-ventas", "Ventas", "Customers", ["Lucía Fernández", "Carolina Vega"], 10),
  team("team-soporte", "Soporte", "Customers", ["Tomás Acosta", "Paula Méndez"], 15),
  team("team-atencion", "Atención general", "Customers", ["Lucía Fernández", "Tomás Acosta", "Martín Paz"], 10),
  team("team-pedidos", "Carga de pedidos", "Internal", ["Martín Paz"], 30),
];
const platformTeams = [
  team("team-soporte-plat", "Soporte", null, ["Martín Sosa", "Laura Díaz"], 10),
  team("team-altas", "Altas", null, ["Laura Díaz"], 30),
];
const person = (id: string, name: string): WhatsAppReferenceResponse => ({ id, name });
// Por nombre, como las ordena el back: así lo elegido se lee «Carolina Vega, Paula Méndez», como el tablero.
const organizationMembers = [person("member-carolina", "Carolina Vega"), person("member-lucia", "Lucía Fernández"), person("member-martin", "Martín Paz"),
  person("member-paula", "Paula Méndez"), person("member-tomas", "Tomás Acosta")];
const operators = [person("operator-laura", "Laura Díaz"), person("operator-martin", "Martín Sosa")];

const routes = { business: "/org/whatsapp/equipos", platform: "/plataforma/whatsapp/equipos" } as const;
const base = { business: "/api/organization/whatsapp/teams", platform: "/api/platform/whatsapp/teams" } as const;

function teamsApp(scope: Exclude<GalleryScope, "consumer">, options: { actions?: GalleryAction[]; readySelector?: string; readyText: string }) {
  const teams = scope === "business" ? organizationTeams : platformTeams;
  return galleryApp(scope, routes[scope], [
    api("GET", `${base[scope]}/member-options`, page(scope === "business" ? organizationMembers : operators)),
    api("GET", base[scope], page(teams)),
  ], options);
}

const dialog = { role: "dialog", name: "Crear equipo" } as const;
// Elegir en un `MultiSelect`: cada opción es un `menuitemcheckbox` que se nombra con su `aria-labelledby`; Escape cierra
// el desplegable y deja el diálogo abierto. El rótulo va exacto: en Plataforma, «Menú de Martín Sosa» (la cuenta, arriba)
// también lo contiene.
const choose = (names: readonly string[], field: string): GalleryAction[] => [click(field, "button", dialog),
  ...names.map((name): GalleryAction => ({ type: "click", label: name, exact: true })), { type: "press", label: names.at(-1), exact: true, key: "Escape" }];

/** WA-Equipos-Crear: «Soporte · Delta Sur», bandeja Clientes, Carolina Vega y Paula Méndez, y el aviso a los 10 minutos. */
const createOrganization: GalleryAction[] = [click("Crear equipo"), fill("Nombre", "Soporte · Delta Sur", dialog), ...choose(["Carolina Vega", "Paula Méndez"], "Personas")];
/** Plat-WA-Equipos «Crear equipo»: «Cuentas» con Martín Sosa, a los 10 minutos. */
const createPlatform: GalleryAction[] = [click("Crear equipo"), fill("Nombre", "Cuentas", dialog), ...choose(["Martín Sosa"], "Operadores")];
const openNotice = press("Aviso por correo si nadie lo toma", "combobox");

/** Galería de la E11 de esta área: un caso por tablero y estado que se fotografía, y lo pendiente con su motivo. */
export const teamsGalleryCases: readonly GalleryCase[] = [
  galleryCase("equipos", "WA-Equipos", "Lista", teamsApp("business", { readyText: "Atención general" }), { props: {} }),
  galleryCase("equipos", "M-WA-Equipos", "Lista", teamsApp("business", { readyText: "Bandeja Internos · 1 persona" }), { props: {} }),
  ...(["WA-Equipos-Crear", "M-WA-Equipos-Crear"] as const).flatMap((board) => [
    galleryCase("equipos", board, "Crear equipo", teamsApp("business", { actions: createOrganization, readySelector: "[role='dialog']", readyText: "Carolina Vega, Paula Méndez" })),
    galleryCase("equipos", board, "Elegir el aviso", teamsApp("business", { actions: [...createOrganization, openNotice], readySelector: "[role='listbox']", readyText: "No avisar" })),
  ]),
  galleryCase("equipos", "Plat-WA-Equipos", "Lista", teamsApp("platform", { readyText: "Martín Sosa, Laura Díaz" })),
  galleryCase("equipos", "M-Plat-WA-Equipos", "Lista", teamsApp("platform", { readyText: "Martín Sosa, Laura Díaz" })),
  ...(["Plat-WA-Equipos", "M-Plat-WA-Equipos"] as const).map((board) =>
    galleryCase("equipos", board, "Crear equipo", teamsApp("platform", { actions: createPlatform, readySelector: "[role='dialog']", readyText: "Aviso por correo si nadie lo toma" }))),
];
export const teamsGalleryPending: readonly GalleryPending[] = [];
