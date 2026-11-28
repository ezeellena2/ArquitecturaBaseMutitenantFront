// Galería de la E12 · Catálogos (scripts/capturas/etapa-12.json): los quince tableros de la etapa, los trece de la §10 de la
// spec sin FRM-Catalogo-Nuevo ni FRM-Catalogo-Tipo (que se fueron como diálogos, 262) y la propuesta con su teléfono, a 1440,
// 390 y 320. La app se fotografía en el arnés visual con estas respuestas ficticias, armadas con los contratos del back y los
// datos de los tests del front, que siguen a los tableros; no acredita el back. `node scripts/galeria-etapa-12.mjs` vuelve a
// escribir el JSON; galeria-etapa-12.test.mjs comprueba que el archivo es el que sale de acá y que cada estado de cada tablero
// está una vez por ancho, como caso o pendiente con su motivo.
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const galleryFile = "scripts/capturas/etapa-12.json";
export const galleryNow = "2026-11-24T14:00:00Z";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Los quince tableros, con su grupo y su ancho: los M- se fotografían a 390 y a 320 (que se compara con el de 390). */
export const galleryBoards = [
  ["FRM-Catalogos", "catalogos"], ["M-FRM-Catalogos", "catalogos"],
  ["FRM-Catalogo", "catalogo"], ["M-FRM-Catalogo", "catalogo"],
  ["FRM-Catalogo-Opciones", "opciones"], ["M-FRM-Catalogo-Opciones", "opciones"],
  ["FRM-Catalogo-Ordenar", "ordenar"], ["M-FRM-Catalogo-Ordenar", "ordenar"],
  ["FRM-Catalogo-Importar", "importar"],
  ["FRM-Catalogo-Filtros", "filtros"], ["M-FRM-Catalogo-Filtros", "filtros"],
  ["FRM-Catalogo-Contactos", "contactos"], ["M-FRM-Catalogo-Contactos", "contactos"],
  ["FRM-Catalogo-Opciones-Propuesta", "propuesta"], ["M-FRM-Catalogo-Opciones-Propuesta", "propuesta"],
];
const viewports = { 1440: { width: 1440, height: 900 }, 390: { width: 390, height: 844 }, 320: { width: 320, height: 844 } };
export const boardWidths = (board) => board.startsWith("M-") ? [390, 320] : [1440];

// ── Respuestas ──────────────────────────────────────────────────────────────────────────────────────────────────────────
const api = (method, apiPath, body, status = 200, extra = {}) => ({ method, path: apiPath, status, ...(body === undefined ? {} : { body }), ...extra });
const problem = (status, code, detail, extra = {}) => ({ type: "about:blank", title: status === 404 ? "No encontrado" : status === 409 ? "Conflicto" : status === 400 ? "Datos inválidos" : "Error",
  status, detail, code, traceId: "00-galeria-etapa-12-00", ...extra });
const paged = (items, totalCount = items.length, page = 1, pageSize = 10) => {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  return { items, page, pageSize, totalCount, totalPages, hasPrevious: page > 1, hasNext: page < totalPages };
};

const ownerPermissions = ["users.read", "users.invite", "users.manage", "roles.read", "roles.manage", "companies.read", "companies.manage",
  "company.members.read", "company.members.manage", "settings.read", "settings.manage", "publicpage.manage", "audit.read"];
const whatsappPermissions = ["whatsapp.customers", "whatsapp.internal", "whatsapp.broadcasts", "whatsapp.manage"];

/** Lucía, Dueña de Grupo Delta, con Formularios prendido y, salvo que se pida, WhatsApp; con «Administrar catálogos» o solo «Ver». */
export function meOf({ manage = true, whatsapp = true } = {}) {
  const organization = [...ownerPermissions, ...(whatsapp ? whatsappPermissions : []), "formcatalogs.read", ...(manage ? ["formcatalogs.manage"] : [])];
  return {
    id: "lucia", displayName: "Lucía Fernández", firstName: "Lucía", lastName: "Fernández", email: "lucia.fernandez@delta.ejemplo.com",
    access: "business", activeTenantId: "grupo-delta", hasPersonalSpace: true,
    organizations: [
      { id: "grupo-delta", name: "Grupo Delta", roleName: "Dueño", status: "Active", memberStatus: "Active", isSelectable: true },
      { id: "beta", name: "Beta S.R.L.", roleName: "Miembro", status: "Suspended", memberStatus: "Active", isSelectable: false },
    ],
    effectivePermissions: { platform: [], organization, companies: {} }, features: whatsapp ? ["whatsapp", "forms"] : ["forms"], permissions: organization,
    culture: "es-AR", timeZoneId: "America/Argentina/Buenos_Aires", currencyCode: "ARS", organizationCountryCode: "AR", version: 42,
    needsPersonalLoginMethod: false, pendingLegalDocuments: [], moduleCapabilities: [],
  };
}

const catalogs = "/api/organization/forms/catalogs";
const shell = (me) => [api("GET", "/api/me", me), api("GET", "/api/organization/whatsapp/untaken", { customers: 0, internal: null })];

const listRow = (id, name, extra = {}) => ({ id, name, description: null, source: "Manual", valueType: "Text", optionsCount: 4, isActive: true, usable: true, unusableReason: null, ...extra });
// Tablero FRM-Catalogos: los siete catálogos de «Todos», ordenados por nombre.
export const catalogRows = [
  listRow("c-clientes", "Clientes", { source: "Contacts", optionsCount: null }),
  listRow("c-depositos", "Depósitos", { isActive: false }),
  listRow("c-motivos", "Motivos de visita"),
  listRow("c-prov", "Proveedores", { optionsCount: 1097 }),
  listRow("c-recargo", "Recargo por zona", { valueType: "DecimalNumber", optionsCount: 6 }),
  listRow("c-resp", "Responsables de obra", { source: "Members", optionsCount: null, usable: false, unusableReason: "RoleMissing" }),
  listRow("c-sup", "Supervisores", { source: "Members", optionsCount: 7 }),
];

const detail = (id, name, extra = {}) => ({
  id, name, description: null, source: "Manual", valueType: "Text", filters: null, roles: null, companies: null, sample: null,
  isActive: true, usable: true, unusableReason: null, canManage: true, itemCounts: { total: 4, active: 3 }, modifiedAtUtc: "2026-11-20T13:00:00Z",
  modifiedBy: null, version: 7, ...extra,
});
const item = (id, position, text, code, extra = {}) => ({ id, position, text, code, detail: null, value: null, isActive: true, textRepeated: false, ...extra });

// FRM-Catalogo, «Sin cambios»: cuatro opciones, «Cobranza» dada de baja.
const motivos = detail("c-motivos", "Motivos de visita", { description: "Por qué se visita a un cliente." });
const motivosItems = [
  item("i-seg", 1, "Seguimiento", "SEG", { detail: "Visita programada a un cliente actual" }),
  item("i-ven", 2, "Venta nueva", "VEN", { detail: "Primera visita a un cliente" }),
  item("i-rec", 3, "Reclamo", "REC", { detail: "Hay un problema para resolver" }),
  item("i-cob", 4, "Cobranza", "COB", { detail: "Cobrar un pago pendiente", isActive: false }),
];
// «Con tipo de valor»: el recargo de cada zona, decimal.
const recargo = detail("c-recargo", "Recargo por zona", { description: "Lo que se suma al envío según la zona.", valueType: "DecimalNumber", itemCounts: { total: 6, active: 6 } });
const recargoItems = [["Capital", "CAP", "2500.00"], ["GBA Norte", "GBN", "3200.00"], ["GBA Sur", "GBS", "3200.00"], ["GBA Oeste", "GBO", "3500.50"],
  ["Interior", "INT", "5800.00"], ["Patagonia", "PAT", "9000.00"]].map(([text, code, value], index) => item(`i-${code.toLowerCase()}`, index + 1, text, code, { value }));
// «1.097 opciones» y FRM-Catalogo-Importar: los proveedores, de a diez.
const proveedores = detail("c-prov", "Proveedores", { description: "Los proveedores de la obra.", itemCounts: { total: 1097, active: 1097 } });
const proveedoresItems = [["Abrasivos del Sur", "CUIT 30-71234567-1"], ["Aluminios Cuyo", "CUIT 30-70011223-4"], ["Arenera San Pedro", "CUIT 30-68877665-2"],
  ["Bulones Mar del Plata", "CUIT 30-71567890-2"], ["Cales del Oeste", null], ["Cementos del Plata", "CUIT 30-69001234-8"], ["Cerámicos Neuquén", null],
  ["Chapas del Litoral", "CUIT 33-70123456-9"], ["Construcciones Ruta 5", null], ["Corralón El Sol", "CUIT 30-71111222-3"]]
  .map(([text, extraDetail], index) => item(`i-p${index + 1}`, index + 1, text, `PRV-${String(index + 1).padStart(4, "0")}`, { detail: extraDetail }));
// «10.000 opciones»: el tope de un catálogo (42).
const articulos = detail("c-articulos", "Artículos", { description: "El catálogo completo de la ferretería.", itemCounts: { total: 10_000, active: 10_000 } });
const articulosItems = ["Abrazadera 1/2\"", "Abrazadera 3/4\"", "Adhesivo epoxi", "Alambre galvanizado", "Arandela plana 6 mm", "Bisagra 3\"", "Broca 8 mm",
  "Buje de nylon", "Burlete adhesivo", "Cable unipolar 2,5 mm"].map((text, index) => item(`i-a${index + 1}`, index + 1, text, `ART-${String(index + 1).padStart(5, "0")}`));

// FRM-Catalogo-Filtros, «Sin cambios»: «Supervisores», con dos condiciones y Tomás Acosta de ejemplo.
const supervisores = detail("c-sup", "Supervisores", {
  description: "Quienes pueden aprobar una visita.", source: "Members", itemCounts: { total: 0, active: 0 }, version: 4,
  filters: { sourceVersion: 1, excludeRecipient: true, detail: "company", sort: { column: "name", descending: false }, conditions: [
    { column: "role", operator: "hasAny", values: ["r-sup", "r-jefe"] }, { column: "active", operator: "is", values: ["true"] }] },
  roles: [{ id: "r-sup", name: "Supervisor" }, { id: "r-jefe", name: "Jefe de obra" }], companies: [], sample: { id: "m-tomas", name: "Tomás Acosta", detail: "Delta S.A." },
});
const responsables = detail("c-resp", "Responsables de obra", {
  description: "Quienes firman el parte de obra.", source: "Members", itemCounts: { total: 0, active: 0 }, version: 2, usable: false, unusableReason: "RoleMissing",
  filters: { ...supervisores.filters, conditions: [{ column: "role", operator: "hasAny", values: ["r-borrado"] }] }, roles: [], companies: [], sample: supervisores.sample,
});
// FRM-Catalogo-Contactos: los clientes con la etiqueta «Mayorista».
const clientes = detail("c-clientes", "Clientes", {
  description: "Los clientes de la bandeja, por etiqueta.", source: "Contacts", itemCounts: { total: 0, active: 0 }, version: 3,
  filters: { sourceVersion: 1, excludeRecipient: false, detail: "tags", sort: { column: "name", descending: false }, conditions: [{ column: "tags", operator: "hasAny", values: ["Mayorista"] }] },
});
const membersSource = { version: 1, columns: [
  { key: "name", type: "Text", operators: ["contains", "equals"], canDetail: false, canSort: true },
  { key: "role", type: "List", operators: ["hasAny", "hasNone"], canDetail: true, canSort: false },
  { key: "company", type: "List", operators: ["hasAny", "hasNone"], canDetail: true, canSort: false },
  { key: "active", type: "Boolean", operators: ["is"], canDetail: false, canSort: false },
] };
const three = { total: 3, exceedsLimit: false, options: [
  { text: "Florencia Fernández de la Fue…", detail: "Florencia Fernández de la Fuente · Delta Norte" },
  { text: "Martín Paz", detail: "Delta S.A." }, { text: "Paula Méndez", detail: "Delta S.A." }] };
const contactsThree = { total: 3, exceedsLimit: false, options: [
  { text: "Almacén Don Pepe", detail: "Mayorista" }, { text: "Ferretería Norte", detail: "Mayorista" }, { text: "Kiosco La Esquina", detail: "Mayorista, Minorista" }] };
const noneFound = { total: 0, exceedsLimit: false, options: [] };
const filterSources = [
  api("GET", `${catalogs}/sources/members`, membersSource),
  api("GET", `${catalogs}/sources/members/roles`, paged([{ id: "r-aud", name: "Auditor" }, { id: "r-jefe", name: "Jefe de obra" }, { id: "r-sup", name: "Supervisor" }, { id: "r-ven", name: "Vendedor" }])),
  api("GET", `${catalogs}/sources/members/companies`, paged([{ id: "e-delta", name: "Delta S.A." }, { id: "e-norte", name: "Delta Norte" }])),
  api("GET", `${catalogs}/sample-members`, paged([
    { memberId: "m-tomas", name: "Tomás Acosta", roles: ["Vendedor"], companies: ["Delta S.A."] },
    { memberId: "m-martin", name: "Martín Paz", roles: ["Supervisor"], companies: ["Delta S.A."] },
    { memberId: "m-paula", name: "Paula Méndez", roles: ["Jefe de obra"], companies: ["Delta S.A."] }])),
  api("GET", `${catalogs}/sources/contacts/tags`, paged([{ name: "Mayorista", contacts: 4 }, { name: "Minorista", contacts: 7 }, { name: "VIP", contacts: 2 }])),
  api("GET", `${catalogs}/sample-contacts`, paged([{ contactId: "k-pepe", name: "Almacén Don Pepe" }, { contactId: "k-norte", name: "Ferretería Norte" }])),
];

// FRM-Catalogo-Importar, «Revisión»: proveedores.xlsx, 1.106 filas leídas y 1.084 sin cambios.
const errorsPage = [
  { row: 37, column: "code", code: "Forms.Catalog.DuplicateCode", value: null, otherRow: 52 },
  { row: 88, column: "text", code: "Forms.Catalog.ItemTextTooLong", value: null, otherRow: null },
  { row: 90, column: "code", code: "Forms.Catalog.ItemTextTooLong", value: null, otherRow: null },
];
function importReview(overrides = {}) {
  return {
    version: 7, sha256: "a1b2c3d4", sheetName: "Hoja 1", rowsRead: 1106, unchanged: 1084, deactivationShare: 0.003, errorShare: 0.011,
    confirmDeactivations: false, confirmErrors: false,
    errors: paged(errorsPage, 12),
    added: paged([{ row: 1098, code: "PRV-1098", text: "Bulones Mar del Plata" }]),
    changed: paged([
      { row: 11, code: "PRV-0010", column: "text", before: "Cementos del Plata", after: "Cementos del Plata S.A." },
      { row: 11, code: "PRV-0010", column: "detail", before: "CUIT 30-69001234-8", after: "CUIT 30-69001234-9" }]),
    deactivated: paged([{ code: "PRV-0005", text: "Aluminios Cuyo" }]),
    ...overrides,
  };
}
const xlsx = { name: "proveedores.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", base64: "UEsDBBQAAAAIAA==", byteLength: 24_576 };

// FRM-Catalogo-Opciones-Propuesta: lo que propone el asistente para «Motivos de visita» (catalogoptions.edit@1).
const proposalItems = [
  item("i-seg", 1, "Seguimiento", "SEG", { detail: "Visita programada a un cliente actual" }),
  item("i-ven", 2, "Venta nueva", "VEN", { detail: "Primera visita a un cliente" }),
  item("i-vma", 3, "Venta mayorista", "VMA", { detail: "Visita a un cliente que compra por mayor" }),
  item("i-rec", 4, "Reclamo", "REC", { detail: "Hay un problema para resolver" }),
];
const proposal = (extra = {}) => ({
  id: "p-1", conversationId: "c-1", kind: "action", action: "catalogoptions.edit", version: 1, state: "new",
  target: { id: "c-motivos", label: "Motivos de visita", version: 7 }, baseVersion: 7,
  values: [
    { field: "options", value: { op: "add", key: "GAR", row: { code: "GAR", text: "Garantía", detail: "Revisar un equipo en garantía" } } },
    { field: "options", value: { op: "add", key: "INS", row: { code: "INS", text: "Instalación", detail: "Instalar un equipo vendido" } } },
    { field: "options", value: { op: "change", key: "i-ven", row: { detail: "Primera visita a un cliente nuevo" } }, label: "Venta nueva", doubt: "Assistant.Action.Doubt.Similar" },
    { field: "options", value: { op: "remove", key: "i-rec" }, label: "Reclamo" },
  ],
  ...extra,
});

// ── Acciones ───────────────────────────────────────────────────────────────────────────────────────────────────────────
const dialog = (name) => ({ role: "dialog", name });
const click = (name, role = "button", extra = {}) => ({ type: "click", role, name, exact: true, ...extra });
const clickIn = (within, name, role = "button", extra = {}) => click(name, role, { within, ...extra });
/** La pieza para elegir (262): su botón se llama con su rótulo y lo elegido, así que se busca por el comienzo. */
const piece = (label, extra = {}) => ({ type: "click", role: "button", name: label, exact: false, ...extra });
/**
 * La pieza por su nombre entero, el rótulo y lo elegido («Estado De baja»), exacto: así no la confunde la (i) de su campo
 * («Más información sobre Estado») ni otra pieza que tenga ese texto elegido («Detalle Etiquetas»).
 */
const pick = (label, chosen, extra = {}) => click(`${label} ${chosen}`, "button", extra);
const choose = (name) => ({ type: "click", role: "option", name, exact: false });
/** Cierra la lista de una pieza de varios con Esc, desde la opción que se eligió. */
const closeList = (name) => ({ type: "press", role: "option", name, exact: false, key: "Escape" });
/** Los ⋮ (RowActions y el de la banda): en la compu un menú, en el teléfono una hoja; se abren con Enter, como en los tests. */
const menu = (name) => ({ type: "press", role: "button", name, exact: true, key: "Enter" });
const fill = (name, value, extra = {}) => ({ type: "fill", role: "textbox", name, value, exact: true, ...extra });
const escape = (within) => ({ type: "press", role: within.role, name: within.name, exact: true, key: "Escape" });
const upload = { type: "upload", label: "Archivo", exact: true, files: [xlsx] };

const longText = "Reclamo por un equipo que no enciende";
const optionsOfMotivos = dialog("Opciones de «Motivos de visita»");
const newOptionsOfMotivos = dialog("Opciones nuevas de «Motivos de visita»");
const sortDialog = dialog("Ordenar las opciones");
const importDialog = (name = "Proveedores") => dialog(`Importar opciones a «${name}»`);
const sortMenu = [menu("Más acciones de las opciones"), click("Ordenar por…", "menuitem")];
/** «Así lo ve quien lo recibe» del teléfono: en la barra a 390 y, a 320, en el ⋮ de la barra (Page, barInSheet). */
const openPreview = (width, more) => width === 320 ? [menu(more), click("Así lo ve quien lo recibe", "menuitem")] : [click("Así lo ve quien lo recibe")];
const previewDialog = dialog("Así lo ve quien lo recibe");

// ── Estados ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
const listPath = "/org/formularios/catalogos";
const editorPath = (id, query = "") => `${listPath}/${id}${query}`;
const ready = { main: "main", dialog: '[role="dialog"]', listbox: '[role="listbox"]', menu: '[role="menu"]' };
const listResponses = (rows = catalogRows, counts = { all: 7, active: 6 }) => [api("GET", catalogs, paged(rows)), api("GET", `${catalogs}/filter-counts`, counts)];
const editorResponses = (catalog, items, extra = []) => [...extra, api("GET", `${catalogs}/${catalog.id}`, catalog), api("GET", `${catalogs}/${catalog.id}/items`, paged(items, catalog.itemCounts.total))];
const motivosEditor = (extra = []) => editorResponses(motivos, motivosItems, extra);
const recargoEditor = (extra = []) => editorResponses(recargo, recargoItems, extra);
const putOk = (id, version = 8) => api("PUT", `${catalogs}/${id}`, { version, itemIdentityMap: [] });
const filtersEditor = (catalog, preview = three, extra = []) => [...extra, api("GET", `${catalogs}/${catalog.id}`, catalog), ...filterSources, api("POST", `${catalogs}/previews`, preview)];
const newEditor = (preview = three) => [...filterSources, api("POST", `${catalogs}/previews`, preview)];
const saved = "Guardamos el catálogo.";

/** Un estado: su ruta, sus respuestas, sus pasos y lo que tiene que verse; `me`, `hang` y `actionsAt(width)` si hacen falta. */
const state = (name, route, responses, actions, readySelector, extra = {}) => ({ ...extra, name, route, responses, actions, readySelector });

function catalogsStates(phone) {
  const all = state("Todos", listPath, listResponses(), [], 'a[href$="/c-prov"]');
  const empty = state("Sin coincidencias", `${listPath}?search=herramientas`, listResponses([]), [], ready.main, { readyText: "Ningún catálogo coincide con los filtros." });
  const loading = state("Cargando", listPath, listResponses(), [], ready.main, { hang: { path: `${catalogs}?**`, method: "GET" } });
  const none = state("Vacío", listPath, listResponses([], { all: 0, active: 0 }), [], ready.main, { readyText: "Todavía no hay catálogos." });
  const failed = state("Error", listPath, [api("GET", catalogs, problem(500, "General.Unexpected", "Algo salió mal."), 500), api("GET", `${catalogs}/filter-counts`, { all: 7, active: 6 })],
    [], ready.main, { readyText: "No pudimos cargar los catálogos." });
  const sortBy = [click("Ordenar por: Catálogo, de la A a la Z")];
  if (phone) {
    return [all, state("Filtros", listPath, listResponses(), [click("Filtros de catálogos")], ready.dialog, { readyText: "Origen" }), empty, loading, none, failed,
      state("Ordenar por", listPath, listResponses(), sortBy, ready.dialog, { readyText: "Columna" })];
  }
  const bySource = (name, source) => state(name, `${listPath}?source=${source}`, listResponses(catalogRows.filter((row) => row.source === source)), [],
    `a[href$="/${catalogRows.find((row) => row.source === source).id}"]`);
  const byOptions = [...catalogRows].sort((a, b) => (a.optionsCount ?? -1) === (b.optionsCount ?? -1) ? a.name.localeCompare(b.name, "es") : (b.optionsCount ?? -1) - (a.optionsCount ?? -1));
  return [all, state("Filtro abierto", listPath, listResponses(), [click("Origen: todos")], ready.listbox, { readyText: "Todos los orígenes" }),
    bySource("Escritas a mano", "Manual"), bySource("De los miembros", "Members"), bySource("De los contactos", "Contacts"),
    empty, loading, none, failed,
    state("Filtro de estado", listPath, listResponses(), [click("Estado: todos")], ready.listbox, { readyText: "Dados de baja" }),
    state("Ordenar por abierto", listPath, listResponses(), sortBy, ready.dialog, { readyText: "Columna" }),
    state("Ordenado por Opciones", `${listPath}?sort=-optionsCount`, listResponses(byOptions), [], 'a[href$="/c-prov"]', { readyText: "Ordenar por: Opciones, de mayor a menor" })];
}

/** FRM-Catalogo: el editor de un catálogo a mano y sus estados (§10), en la compu. */
function catalogStates() {
  const path = editorPath("c-motivos");
  const base = (name, actions, readySelector, extra = {}) => state(name, path, motivosEditor(extra.responses ?? []), actions, readySelector, { ...extra, responses: undefined });
  const edited = [fill("Texto de Reclamo", "Reclamo urgente")];
  const saveAndClose = (within) => [click("Guardar cambios"), escape(within)];
  const recargoPath = editorPath("c-recargo");
  return [
    base("Sin cambios", [], 'input[aria-label="Texto de Seguimiento"]'),
    base("Con cambios", edited, 'input[aria-label="Texto de Reclamo urgente"]'),
    base("Código repetido", [fill("Código de Venta nueva", "SEG"), ...saveAndClose(optionsOfMotivos)], ready.main, { readyText: "Ya está en la opción 1." }),
    base("Texto repetido", [fill("Texto de Reclamo", "Seguimiento")], ready.main, { readyText: "Otra opción tiene el mismo texto." }),
    base("Texto de más de 30", [fill("Texto de Reclamo", longText), ...saveAndClose(optionsOfMotivos)], ready.main, { readyText: "Puede tener hasta 30 caracteres." }),
    base("Una opción nueva", [click("Agregar opción"), fill("Texto", "Garantía", { within: newOptionsOfMotivos }), clickIn(newOptionsOfMotivos, "Generar desde el texto"),
      clickIn(newOptionsOfMotivos, "Listo")], 'input[aria-label="Texto de Garantía"]'),
    base("Borrar una opción", [click("Borrar Reclamo")], ready.dialog, { readyText: "Se borra al guardar el catálogo. Hasta entonces se puede restaurar." }),
    base("Se borra al guardar", [click("Borrar Reclamo"), clickIn(dialog("¿Borrar «Reclamo»?"), "Borrar opción")], ready.main, { readyText: "Se borra al guardar" }),
    base("Restaurar una opción", [click("Borrar Reclamo"), clickIn(dialog("¿Borrar «Reclamo»?"), "Borrar opción"), menu("Acciones de Reclamo")], ready.menu, { readyText: "Restaurar" }),
    base("Reactivar una opción", [menu("Acciones de Cobranza")], ready.menu, { readyText: "Reactivar" }),
    base("Movimientos pendientes", [click("Bajar Seguimiento")], ready.main, { readyText: "1 movimiento pendiente. Se aplica al guardar." }),
    base("Orden pendiente", [...sortMenu, clickIn(sortDialog, "Ordenar")], ready.main, { readyText: "Se ordenará por «Texto», de la A a la Z, al guardar." }),
    base("Más acciones", [menu("Más acciones de las opciones")], ready.menu, { readyText: "Generar los códigos que faltan" }),
    base("Acciones del catálogo", [menu("Acciones de Motivos de visita")], ready.menu, { readyText: "Dar de baja" }),
    base("Varias elegidas", [click("Elegir Seguimiento", "checkbox", { force: true }), click("Elegir Venta nueva", "checkbox", { force: true })], ready.main, { readyText: "2 elegidas" }),
    base("Vista previa abierta", [click("Elegí una opción", "button", { exact: false })], 'input[type="radio"]'),
    base("Vista previa con varias", [click("Varias"), click("Elegí una opción", "button", { exact: false })], 'input[type="checkbox"]', { readyText: "Elegí hasta 3" }),
    base("Guardando", [...edited, click("Guardar cambios")], ready.main, { readyText: "Guardando…", hang: { path: `${catalogs}/c-motivos`, method: "PUT" } }),
    base("Guardado", [...edited, click("Guardar cambios")], ready.main, { readyText: saved, responses: [putOk("c-motivos")] }),
    base("No se guardó", [...edited, click("Guardar cambios")], ready.main, { readyText: "Algo salió mal. Probá de nuevo en un rato.",
      responses: [api("PUT", `${catalogs}/c-motivos`, problem(500, "General.Unexpected", "Algo salió mal."), 500)] }),
    base("Otra persona guardó", [...edited, click("Guardar cambios")], ready.dialog, { readyText: "Laura Ríos lo guardó mientras lo editabas.", responses: [
      api("GET", `${catalogs}/c-motivos`, { ...motivos, modifiedBy: "Laura Ríos", version: 8, itemCounts: { total: 5, active: 4 } }, 200, { afterResponse: { method: "PUT", path: `${catalogs}/c-motivos` } }),
      api("PUT", `${catalogs}/c-motivos`, problem(409, "General.ConcurrencyConflict", "Otra persona cambió esto. Revisá la versión más reciente antes de guardar."), 409)] }),
    base("Dar de baja el catálogo", [menu("Acciones de Motivos de visita"), click("Dar de baja", "menuitem")], ready.dialog, { readyText: "Sus opciones dejan de poder elegirse." }),
    state("De baja", path, editorResponses({ ...motivos, isActive: false }, motivosItems), [], ready.main, { readyTexts: ["Seguimiento", "De baja"] }),
    state("De baja: acciones", path, editorResponses({ ...motivos, isActive: false }, motivosItems), [menu("Acciones de Motivos de visita")], ready.menu, { readyText: "Reactivar" }),
    state("Sin opciones", path, editorResponses({ ...motivos, itemCounts: { total: 0, active: 0 } }, []), [], ready.main, { readyText: "Todavía no hay opciones." }),
    state("1.097 opciones", editorPath("c-prov"), editorResponses(proveedores, proveedoresItems), [], 'input[aria-label="Texto de Abrasivos del Sur"]'),
    state("10.000 opciones", editorPath("c-articulos"), editorResponses(articulos, articulosItems), [], 'input[aria-label="Texto de Adhesivo epoxi"]'),
    state("Con tipo de valor", recargoPath, recargoEditor(), [], 'input[aria-label="Valor de Capital"]'),
    state("Valor de otro tipo", recargoPath, recargoEditor(), [fill("Valor de Capital", "dos mil"), click("Guardar cambios"), escape(dialog("Opciones de «Recargo por zona»"))],
      ready.main, { readyText: "Escribí un número." }),
    state("Agregar una opción con valor", recargoPath, recargoEditor(), [click("Agregar opción")], ready.dialog, { readyText: "Valor (decimal)" }),
    state("Falta el valor", recargoPath, recargoEditor(), [click("Agregar opción"), fill("Texto", "Costa Atlántica", { within: dialog("Opciones nuevas de «Recargo por zona»") }),
      clickIn(dialog("Opciones nuevas de «Recargo por zona»"), "Listo"), click("Guardar cambios"), escape(dialog("Opciones de «Recargo por zona»"))], ready.main, { readyText: "Escribí el valor." }),
    state("Nuevo catálogo", `${listPath}/nuevo`, newEditor(), [], ready.main, { readyText: "De dónde salen las opciones" }),
    state("Falta el nombre", `${listPath}/nuevo`, newEditor(), [click("Crear catálogo")], ready.main, { readyText: "Escribí el nombre del catálogo." }),
    state("Nuevo: de dónde salen", `${listPath}/nuevo`, newEditor(), [piece("De dónde salen las opciones")], ready.listbox, { readyText: "Se arma sola con los contactos de Clientes, por etiqueta." }),
    state("Nuevo: sin el módulo de WhatsApp", `${listPath}/nuevo`, newEditor(), [piece("De dónde salen las opciones")], ready.listbox,
      { readyText: "Se arma sola con los miembros de la organización", me: meOf({ whatsapp: false }) }),
    state("Nuevo: tipo de valor", `${listPath}/nuevo`, newEditor(), [piece("Tipo de valor")], ready.listbox, { readyText: "Número decimal" }),
    state("Solo lectura", path, editorResponses({ ...motivos, canManage: false }, motivosItems), [], ready.main, { readyTexts: ["Seguimiento", "Exportar"], me: meOf({ manage: false }) }),
    state("Cargando", path, motivosEditor(), [], ready.main, { hang: { path: `${catalogs}/c-motivos`, method: "GET" } }),
    state("No existe", path, [api("GET", `${catalogs}/c-motivos`, problem(404, "Forms.Catalog.NotFound", "No encontramos este catálogo."), 404),
      api("GET", `${catalogs}/c-motivos/items`, problem(404, "Forms.Catalog.NotFound", "No encontramos este catálogo."), 404)], [], ready.main, { readyText: "No encontramos esta página" }),
  ];
}

/** M-FRM-Catalogo: el editor en el teléfono; la vista previa va en la barra (a 320, en su ⋮). */
function phoneCatalogStates() {
  const path = editorPath("c-motivos");
  const base = (name, actions, readySelector, extra = {}) => state(name, path, motivosEditor(extra.responses ?? []), actions, readySelector, { ...extra, responses: undefined });
  const editReclamo = [click("Editar Reclamo"), fill("Texto", "Reclamo urgente", { within: dialog("Opción 3 de 4") }), clickIn(dialog("Opción 3 de 4"), "Volver a la lista"),
    clickIn(dialog("Opciones"), "Listo")];
  const deleteReclamo = [click("Borrar Reclamo"), clickIn(dialog("¿Borrar «Reclamo»?"), "Borrar opción")];
  return [
    base("Sin cambios", [], ready.main, { readyTexts: ["Seguimiento", "Cobranza"] }),
    base("Con cambios", editReclamo, ready.main, { readyText: "Reclamo urgente" }),
    base("Borrar una opción", [click("Borrar Reclamo")], ready.dialog, { readyText: "Se borra al guardar el catálogo. Hasta entonces se puede restaurar." }),
    base("Se borra al guardar", deleteReclamo, ready.main, { readyText: "Se borra al guardar" }),
    base("Restaurar una opción", [...deleteReclamo, menu("Acciones de Reclamo")], ready.menu, { readyText: "Restaurar" }),
    base("Reactivar una opción", [menu("Acciones de Cobranza")], ready.menu, { readyText: "Reactivar" }),
    base("Más acciones", [menu("Más acciones de las opciones")], ready.menu, { readyText: "Descargar la plantilla" }),
    base("Así lo ve quien lo recibe", [], ready.dialog, { actionsAt: (width) => openPreview(width, "Acciones de Motivos de visita"), readyText: "Una opción" }),
    base("Dar de baja el catálogo", [menu("Acciones de Motivos de visita"), click("Dar de baja", "menuitem")], ready.dialog, { readyText: "Sus opciones dejan de poder elegirse." }),
    base("Guardado", [...editReclamo, click("Guardar cambios")], ready.main, { readyText: saved, responses: [putOk("c-motivos")] }),
    state("Sin opciones", path, editorResponses({ ...motivos, itemCounts: { total: 0, active: 0 } }, []), [], ready.main, { readyText: "Todavía no hay opciones." }),
    state("Nuevo catálogo", `${listPath}/nuevo`, newEditor(), [], ready.main, { readyText: "De dónde salen las opciones" }),
    state("Nuevo: de dónde salen", `${listPath}/nuevo`, newEditor(), [piece("De dónde salen las opciones")], ready.listbox, { readyText: "Se arma sola con los contactos de Clientes, por etiqueta." }),
    state("Solo lectura", path, editorResponses({ ...motivos, canManage: false }, motivosItems), [], ready.main, { readyTexts: ["Seguimiento", "Exportar"], me: meOf({ manage: false }) }),
  ];
}

/** FRM-Catalogo-Opciones: el modal de opciones en la compu (117). */
function optionsStates() {
  const path = editorPath("c-motivos");
  const base = (name, actions, readySelector, extra = {}) => state(name, path, motivosEditor(), actions, readySelector, extra);
  return [
    base("Agregar una opción", [click("Agregar opción")], ready.dialog, { readyText: "Nueva opción" }),
    base("Agregar otra", [click("Agregar opción"), fill("Texto", "Garantía", { within: newOptionsOfMotivos }), clickIn(newOptionsOfMotivos, "Generar desde el texto"),
      clickIn(newOptionsOfMotivos, "Agregar opción")], ready.dialog, { readyTexts: ["Garantía", "Nueva opción"] }),
    base("Editar una opción", [click("Editar Venta nueva")], ready.dialog, { readyText: "Opción 2 de 4" }),
    base("Una opción dada de baja", [click("Editar Cobranza")], ready.dialog, { readyText: "Opción 4 de 4" }),
    base("Elegir el estado", [click("Editar Cobranza"), pick("Estado", "De baja", { within: optionsOfMotivos })], ready.listbox, { readyText: "Activa" }),
    base("Una opción por borrar", [click("Editar Reclamo"), clickIn(optionsOfMotivos, "Quitar opción"), clickIn({ role: "alertdialog", name: "¿Borrar «Reclamo»?" }, "Borrar opción")],
      ready.dialog, { readyText: "Restaurar" }),
    base("Código repetido", [fill("Código de Venta nueva", "SEG"), click("Guardar cambios")], ready.dialog, { readyText: "Ya está en la opción 1." }),
    base("Texto repetido", [fill("Texto de Reclamo", "Seguimiento"), click("Editar Seguimiento", "button", { nth: 1 })], ready.dialog, { readyText: "Otra opción tiene el mismo texto." }),
    base("Texto de más de 30", [fill("Texto de Reclamo", longText), click("Guardar cambios")], ready.dialog, { readyText: "Puede tener hasta 30 caracteres." }),
    state("Con un valor", editorPath("c-recargo"), recargoEditor(), [click("Editar Capital")], ready.dialog, { readyText: "Valor (decimal)" }),
  ];
}

/** M-FRM-Catalogo-Opciones: el modal ocupa la pantalla; primero la lista y, al tocar una, la opción. */
function phoneOptionsStates() {
  const path = editorPath("c-motivos");
  const base = (name, actions, readySelector, extra = {}) => state(name, path, motivosEditor(), actions, readySelector, extra);
  const withError = [click("Editar Venta nueva"), fill("Código", "SEG", { within: dialog("Opción 2 de 4") }), clickIn(dialog("Opción 2 de 4"), "Volver a la lista"),
    clickIn(dialog("Opciones"), "Listo"), click("Guardar cambios")];
  return [
    base("La lista", [click("Editar Venta nueva"), clickIn(dialog("Opción 2 de 4"), "Volver a la lista")], ready.dialog, { readyTexts: ["Seguimiento", "Cobranza"] }),
    base("La lista con errores", withError, ready.dialog, { readyText: "Tiene un error" }),
    base("Una opción nueva", [click("Agregar opción")], ready.dialog, { readyText: "Nueva opción" }),
    base("Una opción guardada", [click("Editar Venta nueva")], ready.dialog, { readyText: "Opción 2 de 4" }),
    base("Elegir el estado", [click("Editar Cobranza"), pick("Estado", "De baja", { within: dialog("Opción 4 de 4") })], ready.listbox, { readyText: "Activa" }),
    base("Código repetido", [...withError, click("Venta nueva", "button", { exact: false, within: dialog("Opciones") })], ready.dialog, { readyText: "Ya está en la opción 1." }),
  ];
}

/** FRM-Catalogo-Ordenar y su teléfono: «Ordenar las opciones» (224). */
function sortStates(phone) {
  const path = editorPath("c-motivos");
  const base = (name, actions, readySelector, extra = {}) => state(name, path, motivosEditor(extra.responses ?? []), actions, readySelector, { ...extra, responses: undefined });
  const byCode = [...sortMenu, piece("Columna", { within: sortDialog }), choose("Código"), pick("Orden", "De la A a la Z", { within: sortDialog }), choose("De la Z a la A")];
  const pending = [...sortMenu, clickIn(sortDialog, "Ordenar")];
  const sorted = [...motivosItems].sort((a, b) => a.text.localeCompare(b.text, "es")).map((row, index) => ({ ...row, position: index + 1 }));
  const common = [
    base("Ordenar las opciones", sortMenu, ready.dialog, { readyText: "Las opciones con el mismo valor quedan en el orden de ahora" }),
    base("Elegir la columna", [...sortMenu, piece("Columna", { within: sortDialog })], ready.listbox, { readyText: "Código" }),
    base("Por código, de la Z a la A", byCode, ready.dialog, { readyText: "De la Z a la A" }),
    base("Orden pendiente", pending, ready.main, { readyText: "Se ordenará por «Texto», de la A a la Z, al guardar." }),
  ];
  const moves = base("Con movimientos: apagado", [click("Bajar Seguimiento"), menu("Más acciones de las opciones")], ready.menu, { readyText: "Primero descartá los cambios de posición." });
  if (phone) return [...common, moves];
  return [...common,
    base("Cambiar el orden pendiente", [...pending, ...sortMenu, piece("Columna", { within: sortDialog }), choose("Código")], ready.dialog, { readyText: "Código" }),
    base("Guardado: ordenadas", [...pending, click("Guardar cambios")], ready.main, { readyText: saved, responses: [
      api("GET", `${catalogs}/c-motivos/items`, paged(sorted), 200, { afterResponse: { method: "PUT", path: `${catalogs}/c-motivos` } }), putOk("c-motivos")] }),
    state("Sin guardar: apagado", `${listPath}/nuevo`, newEditor(), [menu("Más acciones de las opciones")], ready.menu, { readyText: "Guardá el catálogo antes." }),
    moves,
  ];
}

/** FRM-Catalogo-Importar: «Importar opciones» de Proveedores (120), solo en la compu. */
function importStates() {
  const path = editorPath("c-prov");
  const box = importDialog();
  const open = [click("Importar")];
  const previewPath = `${catalogs}/c-prov/imports/previews`;
  const applyPath = `${catalogs}/c-prov/imports`;
  const base = (name, actions, readySelector, extra = {}) => state(name, path, editorResponses(proveedores, proveedoresItems, extra.responses ?? []), actions, readySelector,
    { ...extra, responses: undefined });
  const reviewed = (overrides) => [api("POST", previewPath, importReview(overrides))];
  const review = [...open, upload, clickIn(box, "Revisar")];
  const paste = [...open, pick("Desde", "Subir un archivo", { within: box }), choose("Pegar desde Excel")];
  const pasted = "Código\tTexto\tDetalle\nPRV-1098\tBulones Mar del Plata\tCUIT 30-71567890-2\nPRV-1099\tCerámicos Neuquén\t\nPRV-1100\tChapas del Litoral\tCUIT 33-70123456-9";
  const foreign = "Código\tTexto\tDetalle\tRubro\nPRV-1098\tBulones Mar del Plata\tCUIT 30-71567890-2\tBulones\nPRV-1099\tCerámicos Neuquén\t\tCerámicos";
  const applyButton = "Aplicar sin las 12 filas con errores";
  return [
    base("Elegir un archivo", open, ready.dialog, { readyText: "Ningún archivo elegido" }),
    base("Elegir desde dónde", [...open, pick("Desde", "Subir un archivo", { within: box })], ready.listbox, { readyText: "Pegar desde Excel" }),
    base("Revisar sin archivo", [...open, clickIn(box, "Revisar")], ready.dialog, { readyText: "Elegí un archivo." }),
    base("Archivo elegido", [...open, upload], ready.dialog, { readyText: "proveedores.xlsx" }),
    base("Archivo que no sirve", review, ready.dialog, { readyText: "El archivo no es un XLSX ni un CSV en UTF-8.", responses: [api("POST", previewPath,
      problem(400, "Forms.CatalogImport.FileInvalid", "El archivo no es un XLSX ni un CSV en UTF-8.", { errors: { file: ["El archivo no es un XLSX ni un CSV en UTF-8."] } }), 400)] }),
    base("Pegar: la grilla vacía", paste, 'textarea[aria-label="Pegá acá las filas"]'),
    base("Revisar sin filas", [...paste, clickIn(box, "Revisar")], ready.dialog, { readyText: "Pegá las filas." }),
    base("Pegar: con filas", [...paste, fill("Pegá acá las filas", pasted, { within: box })], ready.dialog, { readyText: "3 filas" }),
    base("Pegar: una columna ajena", [...paste, fill("Pegá acá las filas", foreign, { within: box })], ready.dialog, { readyText: "«Rubro» no es una columna del catálogo: no se manda." }),
    base("Revisando", review, ready.dialog, { readyText: "Revisando…", hang: { path: previewPath, method: "POST" } }),
    base("Revisión: errores", review, ready.dialog, { readyTexts: ["Filas leídas", "Está repetido en la fila 52."], responses: reviewed() }),
    base("Revisión: altas", [...review, clickIn(box, "Altas 1", "tab")], ready.dialog, { readyText: "PRV-1098", responses: reviewed() }),
    base("Revisión: cambios", [...review, clickIn(box, "Cambios 2", "tab")], ready.dialog, { readyText: "Cementos del Plata S.A.", responses: reviewed() }),
    base("Revisión: bajas", [...review, clickIn(box, "Bajas 1", "tab")], ready.dialog, { readyText: "PRV-0005", responses: reviewed() }),
    base("Muchas bajas", review, ready.dialog, { readyText: "Antes de aplicar", responses: reviewed({ confirmDeactivations: true, deactivationShare: 0.38,
      deactivated: paged([{ code: "PRV-0005", text: "Aluminios Cuyo" }, { code: "PRV-0012", text: "Hormigonera Sur" }], 412) }) }),
    base("Muchas filas con error", review, ready.dialog, { readyText: "Antes de aplicar", responses: reviewed({ confirmErrors: true, errorShare: 0.13, errors: paged(errorsPage, 140) }) }),
    state("Un valor ambiguo", editorPath("c-recargo"), recargoEditor([api("POST", `${catalogs}/c-recargo/imports/previews`, importReview({
      rowsRead: 7, unchanged: 5, errorShare: 0.1429, errors: paged([{ row: 3, column: "value", code: "Forms.CatalogImport.ValueAmbiguous", value: "1.500", otherRow: null }]),
      added: paged([]), changed: paged([]), deactivated: paged([]) }))]),
    [click("Importar"), upload, clickIn(importDialog("Recargo por zona"), "Revisar")], ready.dialog, { readyText: "se lee de dos formas" }),
    base("Aplicando", [...review, clickIn(box, applyButton)], ready.dialog, { readyText: "Aplicando…", responses: reviewed(), hang: { path: applyPath, method: "POST" } }),
    base("Otra persona guardó", [...review, clickIn(box, applyButton)], ready.dialog, { readyText: "Otra persona guardó el catálogo. Revisá de nuevo.", responses: [...reviewed(),
      api("POST", applyPath, problem(409, "General.ConcurrencyConflict", "Otra persona cambió esto. Revisá la versión más reciente antes de guardar."), 409)] }),
    base("Otra importación en curso", [...review, clickIn(box, applyButton)], ready.dialog, { readyText: "Ya tenés una importación o una exportación en curso.", responses: [...reviewed(),
      api("POST", applyPath, problem(409, "Forms.CatalogImport.Busy", "Ya tenés una importación o una exportación en curso. Probá en un momento."), 409)] }),
  ];
}

/** FRM-Catalogo-Filtros y su teléfono: «Supervisores», de los miembros (§10). */
function filtersStates(phone) {
  const path = editorPath("c-sup");
  const base = (name, actions, readySelector, extra = {}) => state(name, path, filtersEditor(supervisores, extra.preview ?? three, extra.responses ?? []), actions, readySelector,
    { ...extra, preview: undefined, responses: undefined });
  const updating = { hang: { path: `${catalogs}/previews`, method: "POST" } };
  const missing = state("Rol que ya no existe", editorPath("c-resp"), filtersEditor(responsables), [], ready.main, { readyText: "Ese rol ya no existe. Elegí otro." });
  if (phone) {
    const preview = (width) => openPreview(width, "Acciones de Supervisores");
    const card = click("Supervisor, Jefe de obra", "button", { exact: false });
    const edit = dialog("Editar condición");
    return [
      base("Sin cambios", [], ready.main, { readyText: "Supervisor, Jefe de obra" }),
      base("Con cambios", [card, piece("Comparación", { within: edit }), choose("no tiene ninguno de"), clickIn(edit, "Listo")], ready.main, { readyText: "no tiene ninguno de" }),
      base("Acciones de una condición", [menu("Acciones de la condición Rol")], ready.menu, { readyText: "Quitar condición" }),
      base("Editar una condición", [card], ready.dialog, { readyText: "Editar condición" }),
      base("Así lo ve quien lo recibe", [], ready.dialog, { actionsAt: preview, readyText: "Martín Paz" }),
      base("Elegir a quién", [], ready.listbox, { actionsAt: (width) => [...preview(width), piece("Persona", { within: previewDialog })], readyText: "Paula Méndez" }),
      base("Actualizando", [], '[aria-label="Actualizando la vista previa"]', { ...updating, actionsAt: preview }),
      base("Ninguna opción", [], ready.dialog, { actionsAt: preview, readyText: "Ninguna opción", preview: noneFound }),
      base("Más de 200", [], ready.dialog, { actionsAt: preview, readyText: "y 212 opciones más", preview: { ...three, total: 215, exceedsLimit: true } }),
      missing,
      base("Elegir los roles", [card, pick("Valor", "Supervisor, Jefe de obra", { within: edit })], ready.listbox, { readyText: "Auditor" }),
    ];
  }
  const changed = [piece("Comparación", { nth: 0 }), choose("no tiene ninguno de")];
  return [
    base("Sin cambios", [], ready.main, { readyText: "Martín Paz" }),
    base("Con cambios", changed, ready.main, { readyText: "no tiene ninguno de" }),
    base("Elegir a quién", [piece("Persona")], ready.listbox, { readyText: "Paula Méndez" }),
    base("Actualizando", [], '[aria-label="Actualizando la vista previa"]', updating),
    base("Ninguna opción", [], ready.main, { readyText: "Ninguna opción", preview: noneFound }),
    base("Más de 200", [], ready.main, { readyText: "y 212 opciones más", preview: { ...three, total: 215, exceedsLimit: true } }),
    missing,
    state("Nuevo catálogo", `${listPath}/nuevo`, newEditor(), [piece("De dónde salen las opciones"), choose("De los miembros")], ready.main, { readyText: "Qué miembros entran" }),
    state("Crear sin persona", `${listPath}/nuevo`, newEditor(), [piece("De dónde salen las opciones"), choose("De los miembros"),
      { ...fill("Nombre del catálogo", "Responsables de depósito"), exact: false }, click("Agregar condición"), piece("Roles"), choose("Supervisor"), closeList("Supervisor"),
      click("Crear catálogo")], ready.main, { readyText: "Elegí una persona." }),
    base("Guardado", [...changed, click("Guardar cambios")], ready.main, { readyText: saved, responses: [putOk("c-sup", 5)] }),
    base("Elegir los roles", [piece("Roles")], ready.listbox, { readyText: "Auditor" }),
  ];
}

/** FRM-Catalogo-Contactos y su teléfono: «Clientes», de los contactos de WhatsApp (55). */
function contactsStates(phone) {
  const path = editorPath("c-clientes");
  const base = (name, actions, readySelector, extra = {}) => state(name, path, filtersEditor(clientes, extra.preview ?? contactsThree, extra.responses ?? []), actions, readySelector,
    { ...extra, preview: undefined, responses: undefined });
  const updating = { hang: { path: `${catalogs}/previews`, method: "POST" } };
  const noWhatsApp = state("Sin WhatsApp", path, filtersEditor({ ...clientes, usable: false, unusableReason: "ChannelUnavailable" }, contactsThree), [], ready.main,
    { readyText: "No se puede usar", me: meOf({ whatsapp: false }) });
  if (phone) {
    const preview = (width) => openPreview(width, "Acciones de Clientes");
    const card = click("Mayorista", "button", { exact: false, nth: 0 });
    const edit = dialog("Editar condición");
    return [
      base("Sin cambios", [], ready.main, { readyText: "tiene alguna de" }),
      base("Con cambios", [card, pick("Valor", "Mayorista", { within: edit }), choose("Minorista"), closeList("Minorista"), clickIn(edit, "Listo")], ready.main, { readyText: "Mayorista, Minorista" }),
      base("Acciones de una condición", [menu("Acciones de la condición Etiqueta")], ready.menu, { readyText: "Quitar condición" }),
      base("Editar una condición", [card], ready.dialog, { readyText: "Editar condición" }),
      base("Elegir etiquetas", [card, pick("Valor", "Mayorista", { within: edit })], ready.listbox, { readyText: "Minorista" }),
      base("Así lo ve quien lo recibe", [], ready.dialog, { actionsAt: preview, readyText: "Almacén Don Pepe" }),
      base("Elegir a quién", [], ready.listbox, { actionsAt: (width) => [...preview(width), piece("Cliente", { within: previewDialog })], readyText: "Ferretería Norte" }),
      base("Actualizando", [], '[aria-label="Actualizando la vista previa"]', { ...updating, actionsAt: preview }),
      base("Ninguna opción", [], ready.dialog, { actionsAt: preview, readyText: "Ninguna opción", preview: noneFound }),
      base("Más de 200", [], ready.dialog, { actionsAt: preview, readyText: "y 212 opciones más", preview: { ...contactsThree, total: 215, exceedsLimit: true } }),
      noWhatsApp,
    ];
  }
  const changed = [pick("Etiquetas", "Mayorista"), choose("Minorista"), closeList("Minorista")];
  return [
    base("Sin cambios", [], ready.main, { readyText: "Almacén Don Pepe" }),
    base("Con cambios", changed, ready.main, { readyText: "Mayorista, Minorista" }),
    base("Elegir etiquetas", [pick("Etiquetas", "Mayorista")], ready.listbox, { readyText: "Minorista" }),
    base("Elegir a quién", [pick("Cliente", "Sin cliente")], ready.listbox, { readyText: "Ferretería Norte" }),
    base("Actualizando", [], '[aria-label="Actualizando la vista previa"]', updating),
    base("Ninguna opción", [], ready.main, { readyText: "Ninguna opción", preview: noneFound }),
    base("Más de 200", [], ready.main, { readyText: "y 212 opciones más", preview: { ...contactsThree, total: 215, exceedsLimit: true } }),
    noWhatsApp,
    state("Nuevo catálogo", `${listPath}/nuevo`, newEditor(contactsThree), [piece("De dónde salen las opciones"), choose("De los contactos de WhatsApp")], ready.main, { readyText: "Qué contactos entran" }),
    base("Guardado", [...changed, click("Guardar cambios")], ready.main, { readyText: saved, responses: [putOk("c-clientes", 4)] }),
  ];
}

/** FRM-Catalogo-Opciones-Propuesta y su teléfono: el editor abierto desde una propuesta del asistente (§17). */
function proposalStates(phone) {
  const path = editorPath("c-motivos", "?proposal=p-1");
  const withProposal = (catalog, value) => [api("GET", "/api/organization/assistant/proposals/p-1", value), ...editorResponses(catalog, proposalItems)];
  const motivosAll = { ...motivos, itemCounts: { total: 4, active: 4 } };
  const states = [
    state("Propuesta cargada", path, withProposal(motivosAll, proposal()), [], ready.main, { readyTexts: ["Propuesta del asistente", "Lo que cambia"] }),
    state("Una opción para revisar", path, withProposal(motivosAll, proposal()), phone ? [] : [{ type: "scroll", role: "textbox", name: "Detalle de Venta nueva", exact: true }], ready.main,
      { readyText: "Hay más de una opción parecida." }),
    state("El catálogo cambió desde la propuesta", path, withProposal(motivosAll, proposal({ baseVersion: 6 })), [], ready.main,
      { readyText: "El catálogo Motivos de visita cambió desde la propuesta." }),
  ];
  return phone ? states : [...states, { name: "Con la columna de un campo", pending: "Los campos de un catálogo llegan con la E13 (campos extra y qué viaja a WhatsApp): en la E12 una opción no tiene la columna de un campo, ni en el editor ni en la propuesta, y la app no la puede mostrar sin lo nuevo de esa etapa." }];
}

export const boardStates = {
  "FRM-Catalogos": () => catalogsStates(false), "M-FRM-Catalogos": () => catalogsStates(true),
  "FRM-Catalogo": catalogStates, "M-FRM-Catalogo": phoneCatalogStates,
  "FRM-Catalogo-Opciones": optionsStates, "M-FRM-Catalogo-Opciones": phoneOptionsStates,
  "FRM-Catalogo-Ordenar": () => sortStates(false), "M-FRM-Catalogo-Ordenar": () => sortStates(true),
  "FRM-Catalogo-Importar": importStates,
  "FRM-Catalogo-Filtros": () => filtersStates(false), "M-FRM-Catalogo-Filtros": () => filtersStates(true),
  "FRM-Catalogo-Contactos": () => contactsStates(false), "M-FRM-Catalogo-Contactos": () => contactsStates(true),
  "FRM-Catalogo-Opciones-Propuesta": () => proposalStates(false), "M-FRM-Catalogo-Opciones-Propuesta": () => proposalStates(true),
};

/** El id de un caso: el tablero y el estado, sin acentos ni signos; a 320, con «-320». */
export function caseId(board, stateName, width) {
  const slug = `${board}-${stateName}`.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/gu, "-").replace(/^-|-$/gu, "");
  return width === 320 ? `${slug}-320` : slug;
}

const appPath = (route) => `/src/test/etapa8VisualApp.html?${new URLSearchParams({ as: "visual-owner", route })}`;

export function buildGallery() {
  const cases = [];
  const pending = [];
  for (const [board, group] of galleryBoards) {
    for (const entry of boardStates[board]()) {
      for (const width of boardWidths(board)) {
        const base = { id: caseId(board, entry.name, width), group, board };
        if (entry.pending) { pending.push({ ...base, viewport: viewports[width], label: entry.name, reason: entry.pending }); continue; }
        const app = { path: appPath(entry.route), captureMode: "harness", site: "main", userFixture: "visual-owner", now: galleryNow,
          actions: entry.actionsAt ? [...entry.actions, ...entry.actionsAt(width)] : entry.actions, readySelector: entry.readySelector,
          ...(entry.readyText ? { readyText: entry.readyText } : {}), ...(entry.readyTexts ? { readyTexts: entry.readyTexts } : {}),
          ...(entry.hang ? { hang: entry.hang } : {}),
          responses: [...shell(entry.me ?? meOf()), ...entry.responses] };
        cases.push({ ...base, state: entry.name, stateKey: "estado", props: { estado: entry.name }, viewport: viewports[width], label: entry.name, captureExtent: "viewport", app });
      }
    }
  }
  return {
    version: 1, stage: "12", issuer: "http://localtest.me:5192",
    evidence: "E12 · Catálogos: API y sesión ficticias para comparar con los quince tableros de la etapa (lienzo v185, decisión 284); no acredita E2E ni el back.",
    cases, pending,
  };
}

export const galleryText = () => `${JSON.stringify(buildGallery(), null, 2)}\n`;

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  writeFileSync(path.join(root, galleryFile), galleryText(), "utf8");
  console.info(`Escribí ${galleryFile}.`);
}
