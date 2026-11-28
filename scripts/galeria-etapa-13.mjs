// Galería de la E13 · Campos de los catálogos (scripts/capturas/etapa-13.json): los ocho tableros de la etapa, a 1440, 390 y
// 320, y el diálogo de importar con las columnas de los campos al lado de FRM-Catalogo-Importar. La app se fotografía en el
// arnés visual con estas respuestas ficticias, armadas con los contratos del back y los datos de los tests del front, que
// siguen a los tableros («Proveedores» con CUIT y Zona, de «Zonas»); no acredita el back. `node scripts/galeria-etapa-13.mjs`
// vuelve a escribir el JSON; galeria-etapa-13.test.mjs comprueba que el archivo es el que sale de acá y que cada estado de
// cada tablero está una vez por ancho, como caso o pendiente con su motivo.
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { boardWidths, caseId, meOf } from "./galeria-etapa-12.mjs";

export const galleryFile = "scripts/capturas/etapa-13.json";
export const galleryNow = "2026-11-28T14:00:00Z";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Los ocho tableros de la etapa, con su grupo: los M- se fotografían a 390 y a 320 (que se compara con el de 390). */
export const galleryBoards = [
  ["FRM-Catalogo-13", "catalogo-13"], ["M-FRM-Catalogo-13", "catalogo-13"],
  ["FRM-Catalogo-Campos", "campos"], ["M-FRM-Catalogo-Campos", "campos"],
  ["FRM-Catalogo-Opciones-13", "opciones-13"], ["M-FRM-Catalogo-Opciones-13", "opciones-13"],
  ["FRM-Catalogo-Ordenar-13", "ordenar-13"], ["M-FRM-Catalogo-Ordenar-13", "ordenar-13"],
];
/** El diálogo de importar con las columnas de los campos, al lado de su tablero de la E12 (no tiene uno propio en la E13). */
export const importBoard = ["FRM-Catalogo-Importar", "importar-13"];
const viewports = { 1440: { width: 1440, height: 900 }, 390: { width: 390, height: 844 }, 320: { width: 320, height: 844 } };

// ── Respuestas ──────────────────────────────────────────────────────────────────────────────────────────────────────────
const api = (method, apiPath, body, status = 200, extra = {}) => ({ method, path: apiPath, status, ...(body === undefined ? {} : { body }), ...extra });
const problem = (status, code, detail, extra = {}) => ({ type: "about:blank", title: status === 409 ? "Conflicto" : status === 400 ? "Datos inválidos" : "Error",
  status, detail, code, traceId: "00-galeria-etapa-13-00", ...extra });
const paged = (items, totalCount = items.length, page = 1, pageSize = 10) => {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  return { items, page, pageSize, totalCount, totalPages, hasPrevious: page > 1, hasNext: page < totalPages };
};

const catalogs = "/api/organization/forms/catalogs";
const shell = (me) => [api("GET", "/api/me", me), api("GET", "/api/organization/whatsapp/untaken", { customers: 0, internal: null })];

/** La clave de un campo como la arma el servidor: el nombre en minúsculas, sin acentos y con «_» entre palabras. */
export const fieldKey = (name) => name.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/gu, "_").replace(/^_|_$/gu, "");
const field = (id, name, type, extra = {}) => ({ id, key: fieldKey(name), name, type, sourceCatalogId: null, sourceCatalogName: null, required: false, unique: false,
  maxLength: null, min: null, max: null, isActive: true, valuesCount: 1097, ...extra });
// FRM-Catalogo-Campos, «Los campos»: el CUIT, texto de hasta 13, obligatorio y único, y la Zona, de «Zonas», obligatoria.
const cuit = field("f-cuit", "CUIT", "Text", { required: true, unique: true, maxLength: 13 });
const zona = field("f-zona", "Zona", "Catalog", { required: true, sourceCatalogId: "c-zonas", sourceCatalogName: "Zonas" });
// FRM-Catalogo-Ordenar-13: los campos que se ordenan, uno de cada tipo.
const rubro = field("f-rubro", "Rubro", "Text", { maxLength: 40 });
const plazo = field("f-plazo", "Plazo de pago", "WholeNumber", { min: "0", max: "365", valuesCount: 1096 });
const alta = field("f-alta", "Alta", "Date");
const iva = field("f-iva", "Retiene IVA", "YesNo");
// «20 campos»: el tope (42 y 105), con los dos de siempre y dieciocho de texto.
const moreNames = ["Rubro", "Plazo de pago", "Alta", "Retiene IVA", "Contacto", "Condición de IVA", "Ingresos brutos", "Banco", "Cuenta", "Moneda",
  "Descuento", "Calificación", "Sitio web", "Horario de entrega", "Depósito", "Responsable", "Observaciones", "Transporte"];
export const twentyFields = [cuit, zona, ...moreNames.map((name, index) => field(`f-x${index + 1}`, name, "Text", { valuesCount: 0 }))];

const presentation = { title: ["text"], description: ["field:f-cuit", "field:f-zona"] };
const noIssues = { count: 0, examples: [] };
const detail = (id, name, extra = {}) => ({
  id, name, description: null, source: "Manual", valueType: "Text", filters: null, roles: null, companies: null, sample: null,
  isActive: true, usable: true, unusableReason: null, canManage: true, itemCounts: { total: 4, active: 4 }, modifiedAtUtc: "2026-11-27T13:00:00Z",
  modifiedBy: null, version: 7, fields: [], presentation: { title: ["text"], description: ["detail"] }, presentationIssues: noIssues, ...extra,
});
const item = (id, position, text, code, extra = {}) => ({ id, position, text, code, detail: null, value: null, isActive: true, textRepeated: false, fields: {},
  presentationIssue: null, ...extra });

// «Zonas»: la fuente de la Zona. «Cuyo» está dada de baja (FRM-Catalogo-Opciones-13, «Un valor de una opción dada de baja»).
export const zonasItems = [["z-cap", "Capital", "CAP"], ["z-gba", "Gran Buenos Aires", "GBA"], ["z-int", "Interior", "INT"], ["z-pat", "Patagonia", "PAT"],
  ["z-lit", "Litoral", "LIT"], ["z-cuy", "Cuyo", "CUY", false]].map(([id, text, code, isActive = true], index) => item(id, index + 1, text, code, { isActive }));

// FRM-Catalogo-13, «Campos»: «Proveedores», de a diez, con el CUIT y la zona; «Aluminios Cuyo» está dada de baja.
export const proveedores = detail("c-prov", "Proveedores", { description: "A quiénes se les compra.", itemCounts: { total: 1097, active: 1096 },
  fields: [cuit, zona], presentation });
const providerRows = [
  ["Abrasivos del Sur", "30-71234567-1", "z-cap", "Abrasivos", "Ferretería", "30", "2021-03-12", true],
  ["Aceros Rosario", "30-70988123-4", "z-gba", "Aceros", "Siderurgia", "60", "2019-08-05", false],
  ["Aislantes Norte", "33-71011223-9", "z-int", "Aislantes", "Construcción", "30", "2022-11-21", true],
  ["Alambres Patagónicos", "30-69877654-2", "z-pat", "Alambres", "Siderurgia", "90", "2020-02-14", true],
  ["Aluminios Cuyo", "30-71455890-7", "z-lit", "Aluminio", "Construcción", null, "2018-06-30", false],
  ["Andamios Litoral", "30-70233456-1", "z-cap", "Andamios", "Construcción", "45", "2023-09-09", false],
  ["Arenas del Paraná", "30-71899001-5", "z-gba", "Áridos", "Construcción", "30", "2024-01-17", true],
  ["Bulonera Central", "30-70345678-9", "z-int", "Bulones", "Ferretería", "15", "2017-05-02", false],
  ["Caños y Conexiones", "30-71123987-3", "z-pat", "Sanitarios", "Sanitarios", "60", "2021-10-28", true],
  ["Cementos del Plata", "30-69001234-8", "z-lit", "Cemento", "Construcción", "30", "2016-04-11", false],
];
/** Las diez opciones de la primera página; con `sortFields`, también los valores de los campos de FRM-Catalogo-Ordenar-13. */
export function providerItems({ sortFields = false, override = {} } = {}) {
  return providerRows.map(([text, cuitValue, zone, extraDetail, rubroValue, plazoValue, altaValue, ivaValue], index) => {
    const id = `i-p${index + 1}`;
    const values = { "f-cuit": cuitValue, "f-zona": zone, ...(sortFields
      ? { "f-rubro": rubroValue, ...(plazoValue ? { "f-plazo": plazoValue } : {}), "f-alta": altaValue, "f-iva": ivaValue } : {}) };
    return item(id, index + 1, text, `PRV-${String(index + 1).padStart(4, "0")}`, { detail: extraDetail, isActive: text !== "Aluminios Cuyo", fields: values,
      ...override[id] });
  });
}
const provItems = providerItems();

// «Un título que no entra»: el título sale del detalle, y el de «Aceros Rosario» tiene 44 caracteres (36).
export const longTitle = "Aceros y perfiles laminados para estructuras";
const titleTooLong = { ...proveedores, presentation: { title: ["detail"], description: ["field:f-cuit", "field:f-zona"] },
  presentationIssues: { count: 1, examples: [{ itemId: "i-p2", text: longTitle, issue: "TitleTooLong" }] } };
const titleTooLongItems = providerItems({ override: { "i-p2": { detail: longTitle, presentationIssue: "TitleTooLong" } } });
// FRM-Catalogo-Ordenar-13: «Proveedores» con un campo de cada tipo, guardados, para ordenar por cualquiera.
const sortable = { ...proveedores, fields: [cuit, zona, rubro, plazo, alta, iva] };

// El combo del catálogo de un campo (111): los catálogos a mano activos, cada uno con sus opciones, como el listado de la E12.
const comboRow = (id, name, optionsCount, extra = {}) => ({ id, name, description: null, source: "Manual", valueType: "Text", optionsCount, isActive: true,
  usable: true, unusableReason: null, ...extra });
export const comboRows = [comboRow("c-motivos", "Motivos de visita", 3), comboRow("c-productos", "Productos", 10), comboRow("c-prov", "Proveedores", 1097),
  comboRow("c-recargo", "Recargo por zona", 6, { valueType: "DecimalNumber" }), comboRow("c-tipos", "Tipos de producto", 12), comboRow("c-zonas", "Zonas", 6)];
const comboResponses = [
  api("GET", catalogs, paged([]), 200, { query: { search: "zorro" } }),
  api("GET", catalogs, paged(comboRows.filter((row) => /zo/iu.test(row.name))), 200, { query: { search: "zo" } }),
  api("GET", catalogs, paged(comboRows)),
];

/**
 * El editor de «Proveedores»: su ficha, su primera página y las opciones de «Zonas» que nombra (por identidad, también las de
 * baja) o que se eligen (las activas); el combo, por si se abre. `extra` va primero: gana sobre las de siempre.
 */
function providerEditor({ catalog = proveedores, items = provItems, zonas = zonasItems, extra = [] } = {}) {
  return [...extra, api("GET", `${catalogs}/c-prov`, catalog), api("GET", `${catalogs}/c-prov/items`, paged(items, catalog.itemCounts.total)),
    api("GET", `${catalogs}/c-zonas/items`, paged(zonas, zonas.length, 1, 100), 200, { query: { status: "All" } }),
    api("GET", `${catalogs}/c-zonas/items`, paged(zonas.filter((zone) => zone.isActive)), 200, { query: { status: "Active" } }),
    ...comboResponses];
}
const putOk = (version = 8) => api("PUT", `${catalogs}/c-prov`, { version, itemIdentityMap: [], fieldIdentityMap: [] });
// Un catálogo nuevo, como en la E12: por si la pantalla pide los orígenes con filtros.
const membersSource = { version: 1, columns: [
  { key: "name", type: "Text", operators: ["contains", "equals"], canDetail: false, canSort: true },
  { key: "role", type: "List", operators: ["hasAny", "hasNone"], canDetail: true, canSort: false },
  { key: "company", type: "List", operators: ["hasAny", "hasNone"], canDetail: true, canSort: false },
  { key: "active", type: "Boolean", operators: ["is"], canDetail: false, canSort: false },
] };
const newEditor = () => [api("GET", `${catalogs}/sources/members`, membersSource), api("POST", `${catalogs}/previews`, { total: 0, exceedsLimit: false, options: [] }), ...comboResponses];

// ── Acciones ───────────────────────────────────────────────────────────────────────────────────────────────────────────
const dialog = (name) => ({ role: "dialog", name });
const click = (name, role = "button", extra = {}) => ({ type: "click", role, name, exact: true, ...extra });
const clickIn = (within, name, role = "button", extra = {}) => click(name, role, { within, ...extra });
/** La pieza para elegir (262) por su nombre entero, el rótulo y lo elegido, exacto; solo en un campo opcional, sin asterisco. */
const pick = (label, chosen, extra = {}) => click(`${label} ${chosen}`, "button", extra);
/**
 * Una pieza por una parte de su nombre que ningún otro botón de su diálogo tiene: la de un campo obligatorio puede sumar su
 * asterisco al nombre (e2e-pieza.mjs), y «Catálogo» se confundiría con «De un catálogo», así que se busca por lo elegido.
 */
const piece = (label, extra = {}) => ({ type: "click", role: "button", name: label, exact: false, ...extra });
const choose = (name) => ({ type: "click", role: "option", name, exact: false });
const menu = (name) => ({ type: "press", role: "button", name, exact: true, key: "Enter" });
const fill = (name, value, extra = {}) => ({ type: "fill", role: "textbox", name, value, exact: true, ...extra });

const fieldsOfProveedores = dialog("Campos de «Proveedores»");
const openFields = (count = 2) => [click(`Agregar campos · ${count}`)];
const optionsOfProveedores = dialog("Opciones de «Proveedores»");
const sortDialog = dialog("Ordenar las opciones");
const importDialog = dialog("Importar opciones a «Proveedores»");
/** El ⋮ con «Ordenar por…»: en la compu, el de «Opciones»; en el teléfono, el de la banda. */
const sortMenuOf = (phone) => [menu(phone ? "Acciones de Proveedores" : "Más acciones de las opciones"), click("Ordenar por…", "menuitem")];
/** «Así lo ve quien lo recibe» de la compu, con la lista abierta, como la dibuja el tablero en «En WhatsApp». */
const openPhoneList = click("Elegí una opción");

// ── Estados ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
const listPath = "/org/formularios/catalogos";
const editorPath = `${listPath}/c-prov`;
const ready = { main: "main", dialog: '[role="dialog"]', alert: '[role="alertdialog"]', listbox: '[role="listbox"]', menu: '[role="menu"]' };
const saved = "Guardamos el catálogo.";
/** Un estado: sus respuestas, sus pasos y lo que tiene que verse; `route`, `me` y `label` si hacen falta. */
const state = (name, responses, actions, readySelector, extra = {}) => ({ route: editorPath, ...extra, name, responses, actions, readySelector });
const zonaWithoutValues = { ...proveedores, fields: [cuit, { ...zona, valuesCount: 0 }] };
const readOnly = { me: meOf({ manage: false }) };

/** FRM-Catalogo-13: el editor de «Proveedores» con sus campos, «En WhatsApp» y el teléfono al costado (§Pantallas). */
function catalogStates() {
  const base = (name, actions, readySelector, extra = {}) => state(name, providerEditor({ extra: extra.responses ?? [] }), actions, readySelector, { ...extra, responses: undefined });
  const newField = [...openFields(), clickIn(fieldsOfProveedores, "Agregar campo"), fill("Nombre", "Plazo de pago", { within: fieldsOfProveedores }),
    clickIn(fieldsOfProveedores, "Listo")];
  const notConvertible = problem(400, "Forms.Catalog.FieldTypeNotConvertible", "Hay valores que no se pueden convertir al tipo nuevo.", {
    errors: { "fields.1.type": ["1.097 opciones tienen un valor que no es un número entero."] }, invalidCount: 1097,
    invalidRows: provItems.map((row) => ({ position: row.position, itemId: row.id, text: row.text, reason: "invalid" })) });
  const inUse = problem(409, "Forms.Catalog.ItemInUse", "No se puede borrar porque se usa. Podés darla de baja.", {
    errors: { "deleteItems.0": ["No se puede borrar porque se usa. Podés darla de baja."] }, uses: ["options"] });
  const deactivatedGba = zonasItems.map((zone) => zone.id === "z-gba" ? { ...zone, isActive: false } : zone);
  return [
    base("Campos", [], 'input[aria-label="CUIT de Abrasivos del Sur"]', { readyText: "Capital" }),
    base("Un campo recién agregado", newField, ready.main, { readyText: "Guardá el catálogo para cargar los valores de los campos nuevos." }),
    base("Cambiar el tipo con errores", [...openFields(), clickIn(fieldsOfProveedores, "Zona", "button", { exact: false }),
      piece("Tipo", { within: fieldsOfProveedores }), choose("Número entero"), clickIn(fieldsOfProveedores, "Listo"), click("Guardar cambios")],
    ready.main, { readyText: "«Zona» · Tipo: 1.097 opciones tienen un valor que no es un número entero.", responses: [api("PUT", `${catalogs}/c-prov`, notConvertible, 400)] }),
    base("Una opción en uso", [click("Borrar Aceros Rosario"), clickIn(dialog("¿Borrar «Aceros Rosario»?"), "Borrar opción"), click("Guardar cambios")], ready.main,
      { readyText: "No se puede borrar: la usa otra opción. Podés darla de baja.", responses: [api("PUT", `${catalogs}/c-prov`, inUse, 409)] }),
    base("Reactivar una opción", [menu("Acciones de Aluminios Cuyo")], ready.menu, { readyText: "Reactivar" }),
    base("En WhatsApp", [openPhoneList], 'input[type="radio"]', { readyText: "30-71234567-1 · Capital" }),
    base("Elegir qué muestra", [openPhoneList, piece("Descripción · hasta 300")], ready.listbox, { readyText: "Código" }),
    base("Columnas", [click("Columnas")], ready.listbox, { readyText: "CUIT" }),
    state("Nuevo catálogo", newEditor(), [], ready.main, { route: `${listPath}/nuevo`, readyText: "En WhatsApp" }),
    base("Guardado", [fill("CUIT de Aceros Rosario", "30-70988123-5"), click("Guardar cambios")], ready.main, { readyText: saved, responses: [putOk()] }),
    state("Valor de una opción dada de baja", providerEditor({ zonas: deactivatedGba }), [], 'input[aria-label="CUIT de Aceros Rosario"]', { readyText: "Gran Buenos Aires" }),
    state("Solo lectura", providerEditor({ catalog: { ...proveedores, canManage: false } }), [], ready.main, { readyTexts: ["30-71234567-1", "Exportar"], ...readOnly }),
    state("Un título que no entra", providerEditor({ catalog: titleTooLong, items: titleTooLongItems }), [openPhoneList], 'input[type="radio"]',
      { readyText: "1 opción supera los 30 caracteres del título." }),
  ];
}

/** M-FRM-Catalogo-13: el editor en el teléfono; «Así lo ve quien lo recibe» es el ojo de la barra, también a 320. */
function phoneCatalogStates() {
  const base = (name, actions, readySelector, extra = {}) => state(name, providerEditor(), actions, readySelector, extra);
  const tooLong = (name, actions, readySelector, readyText) => state(name, providerEditor({ catalog: titleTooLong, items: titleTooLongItems }), actions, readySelector, { readyText });
  return [
    base("Campos", [], ready.main, { readyTexts: ["Abrasivos del Sur", "30-71234567-1"] }),
    base("Elegir qué muestra", [piece("Descripción · hasta 300")], ready.listbox, { readyText: "Listo (2)" }),
    tooLong("Un título que no entra", [], ready.main, "1 opción supera los 30 caracteres del título."),
    tooLong("Un título que no entra: cómo se ve", [click("Así lo ve quien lo recibe")], ready.dialog, longTitle),
    base("Reactivar una opción", [menu("Acciones de Aluminios Cuyo")], ready.menu, { readyText: "Reactivar" }),
    base("Columnas", [click("Columnas")], ready.listbox, { readyText: "Listo (2)" }),
  ];
}

/** FRM-Catalogo-Campos: el modal «Campos de …» en la compu (125). */
function fieldsStates() {
  const base = (name, actions, readySelector, extra = {}) => state(name, providerEditor(), [...openFields(), ...actions], readySelector, extra);
  const onZona = [clickIn(fieldsOfProveedores, "Zona", "button", { exact: false })];
  const combo = [...onZona, piece("Zonas", { within: fieldsOfProveedores })];
  const searching = (text) => ({ type: "fill", role: "combobox", name: "Buscar en Catálogo", value: text, exact: true });
  const newField = [clickIn(fieldsOfProveedores, "Agregar campo"), fill("Nombre", "Plazo de pago", { within: fieldsOfProveedores })];
  const typeList = [...newField, piece("Tipo", { within: fieldsOfProveedores })];
  return [
    base("Los campos", [], ready.dialog, { readyText: "2 de 20" }),
    base("Un campo de un catálogo", onZona, ready.dialog, { readyText: "Campo 2 de 2" }),
    base("Elegir el catálogo", combo, ready.listbox, { readyText: "6 catálogos" }),
    base("Buscar un catálogo", [...combo, searching("zo")], ready.listbox, { readyText: "2 catálogos" }),
    base("Ningún catálogo coincide", [...combo, searching("zorro")], ready.listbox, { readyText: "Ningún catálogo coincide con «zorro»." }),
    base("Agregar un campo", newField, ready.dialog, { readyText: "3 de 20" }),
    base("Elegir el tipo", typeList, ready.listbox, { readyText: "Número con decimales" }),
    base("Un número", [...typeList, choose("Número entero"), fill("Desde", "0", { within: fieldsOfProveedores }), fill("Hasta", "365", { within: fieldsOfProveedores })],
      ready.dialog, { readyText: "Rango" }),
    base("Clave repetida", [clickIn(fieldsOfProveedores, "Agregar campo"), fill("Nombre", "Cuit", { within: fieldsOfProveedores })], ready.dialog, { readyText: "Ya la usa «CUIT»." }),
    state("Quitar un campo", providerEditor({ catalog: zonaWithoutValues }), [...openFields(), ...onZona, clickIn(fieldsOfProveedores, "Quitar campo")], ready.alert,
      { readyText: "También se saca de «En WhatsApp» de este catálogo." }),
    base("Quitar un campo con valores", [clickIn(fieldsOfProveedores, "Quitar campo")], ready.alert, { readyText: "Sí, quitar el campo y sus 1.097 valores" }),
    state("20 campos", providerEditor({ catalog: { ...proveedores, fields: twentyFields } }), openFields(20), ready.dialog, { readyText: "20 de 20" }),
    state("Sin campos todavía", providerEditor({ catalog: { ...proveedores, fields: [], presentation: { title: ["text"], description: ["detail"] } },
      items: provItems.map((row) => ({ ...row, fields: {} })) }), openFields(0), ready.dialog, { readyText: "1 de 20" }),
    state("Solo lectura", providerEditor({ catalog: { ...proveedores, canManage: false } }), [click("Campos · 2")], ready.dialog, { readyText: "Obligatorio · Único", ...readOnly }),
  ];
}

/** M-FRM-Catalogo-Campos: el modal ocupa la pantalla; primero la lista y, al tocar un campo, el campo con «Volver a la lista». */
function phoneFieldsStates() {
  const list = dialog("Campos");
  const onZona = [clickIn(list, "Zona", "button", { exact: false })];
  const base = (name, actions, readySelector, extra = {}) => state(name, providerEditor(), [...openFields(), ...actions], readySelector, extra);
  return [
    base("La lista", [], ready.dialog, { readyText: "Campos · 2 de 20" }),
    base("Un campo", [clickIn(list, "CUIT", "button", { exact: false })], ready.dialog, { readyText: "Campo 1 de 2" }),
    base("Un campo de un catálogo", onZona, ready.dialog, { readyText: "Zonas" }),
    base("Elegir el catálogo", [...onZona, piece("Zonas", { within: dialog("Campo 2 de 2") })], ready.listbox, { readyText: "6 catálogos" }),
    base("Un campo nuevo", [clickIn(list, "Agregar campo")], ready.dialog, { readyText: "Nuevo campo" }),
    base("Elegir el tipo", [clickIn(list, "Agregar campo"), piece("Tipo", { within: dialog("Nuevo campo") })], ready.listbox, { readyText: "Número con decimales" }),
    state("Quitar un campo", providerEditor({ catalog: zonaWithoutValues }), [...openFields(), ...onZona, clickIn(dialog("Campo 2 de 2"), "Quitar campo")], ready.alert,
      { readyText: "También se saca de «En WhatsApp» de este catálogo." }),
  ];
}

/** FRM-Catalogo-Opciones-13: el modal de opciones de la E12, con una fila por campo (F3). */
function optionsStates() {
  const base = (name, actions, readySelector, extra = {}) => state(name, providerEditor({ items: extra.items }), actions, readySelector, { ...extra, items: undefined });
  const editAceros = [click("Editar Aceros Rosario")];
  const cuyoItems = providerItems({ override: { "i-p2": { fields: { "f-cuit": "30-70988123-4", "f-zona": "z-cuy" } } } });
  return [
    base("Editar una opción", editAceros, ready.dialog, { readyText: "Opción 2 de 1.097" }),
    base("Elegir el estado", [...editAceros, pick("Estado", "Activa", { within: optionsOfProveedores })], ready.listbox, { readyText: "De baja" }),
    base("Agregar una opción", [click("Agregar opción")], ready.dialog, { readyText: "Nueva opción" }),
    base("Un campo nuevo", [...openFields(), clickIn(fieldsOfProveedores, "Agregar campo"), fill("Nombre", "Plazo de pago", { within: fieldsOfProveedores }),
      clickIn(fieldsOfProveedores, "Listo"), ...editAceros], ready.dialog, { readyTexts: ["Opción 2 de 1.097", "Plazo de pago"] }),
    base("Un valor de una opción dada de baja", [...editAceros, piece("Zona", { within: optionsOfProveedores })], ready.listbox, { readyText: "De baja", items: cuyoItems }),
  ];
}

/** M-FRM-Catalogo-Opciones-13: el modal ocupa la pantalla; primero la lista y, al tocar una, la opción con sus campos. */
function phoneOptionsStates() {
  const base = (name, actions, readySelector, extra = {}) => state(name, providerEditor(), actions, readySelector, extra);
  const one = dialog("Opción 2 de 1.097");
  const editAceros = [click("Editar Aceros Rosario")];
  const withError = [...editAceros, fill("Código", "PRV-0001", { within: one }), clickIn(one, "Volver a la lista"), clickIn(dialog("Opciones"), "Listo"), click("Guardar cambios")];
  return [
    base("La lista", [...editAceros, clickIn(one, "Volver a la lista")], ready.dialog, { readyTexts: ["Abrasivos del Sur", "Aceros Rosario"] }),
    base("La lista con errores", withError, ready.dialog, { readyText: "Tiene un error" }),
    base("Una opción nueva", [click("Agregar opción")], ready.dialog, { readyText: "Nueva opción" }),
    base("Una opción guardada", editAceros, ready.dialog, { readyTexts: ["Opción 2 de 1.097", "Zona"] }),
    base("Elegir el estado", [...editAceros, pick("Estado", "Activa", { within: one })], ready.listbox, { readyText: "De baja" }),
    base("Código repetido", [...withError, click("Aceros Rosario", "button", { exact: false, within: dialog("Opciones") })], ready.dialog, { readyText: "Ya está en la opción 1." }),
  ];
}

/** FRM-Catalogo-Ordenar-13 y su teléfono: «Ordenar las opciones» por un campo de cada tipo (224). */
function sortStates(phone) {
  const base = (name, actions, readySelector, extra = {}) => state(name, providerEditor({ catalog: sortable, items: providerItems({ sortFields: true }) }), actions,
    readySelector, extra);
  const columns = [...sortMenuOf(phone), piece("Columna", { within: sortDialog })];
  const by = (column) => [...columns, choose(column)];
  return [
    base("Elegir la columna", columns, ready.listbox, { readyText: "Retiene IVA" }),
    base("Por «Rubro»", by("Rubro"), ready.dialog, { readyText: "De la A a la Z" }),
    base("Por un número", by("Plazo de pago"), ready.dialog, { readyText: "De menor a mayor" }),
    base("Por una fecha", by("Alta"), ready.dialog, { readyText: "De la más antigua a la más reciente" }),
    base("Por sí o no", by("Retiene IVA"), ready.dialog, { readyText: "Primero «No»" }),
    base("Por un campo de otro catálogo", by("Zona"), ready.dialog, { readyText: "De la A a la Z" }),
    base("Orden pendiente por «Rubro»", [...by("Rubro"), clickIn(sortDialog, "Ordenar")], ready.main, { readyText: "Se ordenará por «Rubro», de la A a la Z, al guardar." }),
  ];
}

/** «Importar opciones» de «Proveedores», pegando: la grilla con una columna por campo activo, después del texto y antes del detalle. */
export const pastedWithFields = ["Código\tTexto\tCUIT\tZona\tDetalle", "PRV-1098\tBulones Mar del Plata\t30-71567890-2\tCapital\tBulones",
  "PRV-1099\tCerámicos Neuquén\t30-71901234-6\tPatagonia\t", "PRV-1100\tChapas del Litoral\t33-70123456-9\tLitoral\tChapas"].join("\n");
function importStates() {
  const paste = [click("Importar"), pick("Desde", "Subir un archivo", { within: importDialog }), choose("Pegar desde Excel")];
  const suffix = ", con las columnas de los campos";
  return [
    state("Pegar: la grilla vacía", providerEditor(), paste, 'textarea[aria-label="Pegá acá las filas"]', { label: `Pegar: la grilla vacía${suffix}`, readyText: "CUIT" }),
    state("Pegar: con filas", providerEditor(), [...paste, fill("Pegá acá las filas", pastedWithFields, { within: importDialog })], ready.dialog,
      { label: `Pegar: con filas${suffix}`, readyTexts: ["3 filas", "30-71567890-2"] }),
  ];
}

export const boardStates = {
  "FRM-Catalogo-13": catalogStates, "M-FRM-Catalogo-13": phoneCatalogStates,
  "FRM-Catalogo-Campos": fieldsStates, "M-FRM-Catalogo-Campos": phoneFieldsStates,
  "FRM-Catalogo-Opciones-13": optionsStates, "M-FRM-Catalogo-Opciones-13": phoneOptionsStates,
  "FRM-Catalogo-Ordenar-13": () => sortStates(false), "M-FRM-Catalogo-Ordenar-13": () => sortStates(true),
  "FRM-Catalogo-Importar": importStates,
};

const appPath = (route) => `/src/test/etapa8VisualApp.html?${new URLSearchParams({ as: "visual-owner", route })}`;

export function buildGallery() {
  const cases = [];
  const pending = [];
  for (const [board, group] of [...galleryBoards, importBoard]) {
    for (const entry of boardStates[board]()) {
      const label = entry.label ?? entry.name;
      for (const width of boardWidths(board)) {
        const base = { id: caseId(board, label, width), group, board };
        if (entry.pending) { pending.push({ ...base, viewport: viewports[width], label, reason: entry.pending }); continue; }
        const app = { path: appPath(entry.route), captureMode: "harness", site: "main", userFixture: "visual-owner", now: galleryNow,
          actions: entry.actions, readySelector: entry.readySelector,
          ...(entry.readyText ? { readyText: entry.readyText } : {}), ...(entry.readyTexts ? { readyTexts: entry.readyTexts } : {}),
          ...(entry.hang ? { hang: entry.hang } : {}),
          responses: [...shell(entry.me ?? meOf()), ...entry.responses] };
        cases.push({ ...base, state: entry.name, stateKey: "estado", props: { estado: entry.name }, viewport: viewports[width], label, captureExtent: "viewport", app });
      }
    }
  }
  return {
    version: 1, stage: "13", issuer: "http://localtest.me:5192",
    evidence: "E13 · Campos de los catálogos: API y sesión ficticias para comparar con los ocho tableros de la etapa (lienzo v186, decisión 285) y el diálogo de importar con las columnas de los campos al lado de FRM-Catalogo-Importar; no acredita E2E ni el back.",
    cases, pending,
  };
}

export const galleryText = () => `${JSON.stringify(buildGallery(), null, 2)}\n`;

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  writeFileSync(path.join(root, galleryFile), galleryText(), "utf8");
  console.info(`Escribí ${galleryFile}.`);
}
