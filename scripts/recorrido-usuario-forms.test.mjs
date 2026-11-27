import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { test } from "node:test";
import {
  apiResponse, catalogsApi, catalogsRoute, csv, formsDefinitions, formsManualChecks, formsModuleName, nextPreview, optionText, pastedReasons,
  reviewCounts, runFormsJourney, sourceLabels, tsv, valueTypeLabels, visitReasons,
} from "./recorrido-usuario-forms.mjs";

const base = new URL("https://localtest.me:5174/");

test("Catálogos tiene sus dos pasos, uno por recorrido del lienzo, y nada para probar a mano", () => {
  assert.deepEqual(formsDefinitions.map((step) => step.id), ["FRM-01", "FRM-02"]);
  for (const step of formsDefinitions) assert.ok(step.title.startsWith("Catálogos · ") && step.expected.length > 80, step.id);
  const [manual, filtered] = formsDefinitions.map((step) => step.expected);
  // armar-un-catalogo: el módulo prendido, la pieza, el modal, crear, la vista previa e importar solo en la compu.
  for (const text of ["prende Formularios", "Escritas a mano", "Agregar opción", "Crear catálogo", "Así lo ve quien lo recibe", "Importar", "teléfono"])
    assert.ok(manual.includes(text), text);
  // catalogo-con-filtros: el origen, la persona de ejemplo, sin «Probar», la casilla y lo guardado.
  for (const text of ["De los miembros", "persona de ejemplo", "sin «Probar»", "Sin incluir a quien lo recibe", "Crear catálogo"]) assert.ok(filtered.includes(text), text);
  assert.deepEqual(formsManualChecks, []);
});

test("las rutas, el módulo y los textos de la pieza son los de la app", () => {
  assert.equal(catalogsRoute, "/org/formularios/catalogos");
  assert.equal(catalogsApi, "/api/organization/forms/catalogs");
  assert.equal(formsModuleName, "Formularios");
  assert.deepEqual(Object.keys(sourceLabels), ["Manual", "Members", "Contacts"]);
  assert.deepEqual(Object.values(valueTypeLabels), ["Texto", "Número entero", "Número decimal", "Fecha"]);
  assert.deepEqual(visitReasons, ["Seguimiento", "Venta nueva", "Reclamo"]);
});

test("lo pegado desde Excel va con tabulaciones y los encabezados del catálogo, y una celda no lleva tabulaciones", () => {
  assert.equal(tsv(["Código", "Texto", "Detalle"], pastedReasons),
    "Código\tTexto\tDetalle\nGAR\tGarantía\tRevisar un equipo en garantía\nINS\tInstalación\tInstalar un equipo vendido\nCOB\tCobranza\tCobrar un pago pendiente");
  assert.equal(tsv(["Código", "Texto"], [["A", ""]]), "Código\tTexto\nA\t");
  assert.throws(() => tsv(["Código", "Texto"], [["A"]]), /una celda por encabezado/u);
  assert.throws(() => tsv(["Código"], [["A\tB"]]), /tabulaciones/u);
});

test("el CSV es UTF-8 de planilla: coma, comillas donde hacen falta y una fila por línea", () => {
  assert.equal(csv(["Código", "Texto"], [["PL-1", "Artículo 1"], ["PL-2", "Con \"comillas\", y coma"]]),
    "Código,Texto\r\nPL-1,Artículo 1\r\nPL-2,\"Con \"\"comillas\"\", y coma\"\r\n");
  assert.throws(() => csv(["Código", "Texto"], [["PL-1"]]));
});

test("la revisión se cuenta en una línea y exige sus cuatro listas", () => {
  const list = (totalCount) => ({ items: [], page: 1, pageSize: 10, totalCount });
  assert.deepEqual(reviewCounts({ rowsRead: 990, unchanged: 985, errors: list(0), added: list(0), changed: list(5), deactivated: list(10) }),
    { rowsRead: 990, unchanged: 985, errors: 0, added: 0, changed: 5, deactivated: 10 });
  assert.throws(() => reviewCounts({ rowsRead: 1, unchanged: 0, errors: list(0), added: list(1), changed: list(0) }), /cuatro listas/u);
});

test("un nombre de más de 30 caracteres se ve cortado en 29 y «…», como en WhatsApp (36)", () => {
  assert.equal(optionText("Ana Ruiz"), "Ana Ruiz");
  assert.equal(optionText("x".repeat(30)), "x".repeat(30));
  assert.equal(optionText("Florencia Fernández de la Fuente"), "Florencia Fernández de la Fue…");
});

test("la respuesta esperada se reconoce por método y ruta, sin mirar la consulta", () => {
  const reply = (method, url) => ({ url: () => url, request: () => ({ method: () => method }) });
  const matcher = apiResponse("GET", `${catalogsApi}/c-1/items`);
  assert.equal(matcher(reply("GET", `https://localtest.me:5174${catalogsApi}/c-1/items?page=1&search=09876`)), true);
  assert.equal(matcher(reply("PUT", `https://localtest.me:5174${catalogsApi}/c-1/items`)), false);
  assert.equal(matcher(reply("GET", `https://localtest.me:5174${catalogsApi}/c-1`)), false);
});

test("la vista previa que se espera es la pedida con lo elegido: una vieja o una que falló no cuentan", async () => {
  const page = new EventEmitter();
  page.off = page.removeListener;
  const preview = (request, status, body) => ({
    url: () => `https://localtest.me:5174${catalogsApi}/previews`, status: () => status, ok: () => status === 200,
    request: () => ({ method: () => "POST", postDataJSON: () => request }), json: async () => body,
  });
  const found = await nextPreview(page, async () => {
    page.emit("response", preview({ filters: { excludeRecipient: true } }, 200, { total: 1, options: [] }));
    page.emit("response", preview({ filters: { excludeRecipient: false } }, 500, null));
    setTimeout(() => page.emit("response", preview({ filters: { excludeRecipient: false } }, 200, { total: 2, options: [] })), 10);
  }, (request) => request.filters.excludeRecipient === false, { timeout: 2_000 });
  assert.deepEqual(found.body, { total: 2, options: [] });
  assert.equal(page.listenerCount("response"), 0, "Deja de escuchar al terminar.");
  await assert.rejects(nextPreview(page, async () => {}, () => true, { timeout: 300 }), /no se pidió/u);
});

test("el recorrido corre los dos pasos en orden, en la pestaña de la organización", async () => {
  const page = { url: () => "https://localtest.me:5174/org", name: "organización" };
  const recorded = [];
  const record = async (id, width, getPage, action) => { recorded.push([id, getPage().name, typeof action, width]); };
  await runFormsJourney({ page, platformPage: { name: "plataforma" }, width: 390, base, record, signOut: async () => {}, login: async () => {},
    owner: "e2e-recorrido-empresa@example.test", organization: "Recorrido 390" });
  assert.deepEqual(recorded, [["FRM-01", "organización", "function", 390], ["FRM-02", "organización", "function", 390]]);
});

test("sin la pestaña de Plataforma o sin las sesiones del recorrido, Catálogos no abre pantallas ni se declara aprobado", async () => {
  const touched = [];
  const page = new Proxy({}, { get: (_, name) => { touched.push(String(name)); return () => {}; } });
  const record = async () => { touched.push("record"); };
  const journey = { page, platformPage: page, width: 1440, base, record, signOut: async () => {}, login: async () => {},
    owner: "e2e-recorrido-empresa@example.test", organization: "Recorrido 1440" };
  await assert.rejects(runFormsJourney({ ...journey, platformPage: undefined }), /Plataforma/u);
  await assert.rejects(runFormsJourney({ ...journey, owner: undefined }), /la Dueña/u);
  await assert.rejects(runFormsJourney({ ...journey, login: undefined }), /sesiones/u);
  assert.deepEqual(touched, []);
});
