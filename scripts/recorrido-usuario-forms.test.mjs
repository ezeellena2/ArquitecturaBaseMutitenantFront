import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { factorKeeper } from "./platform-factor-real.mjs";
import {
  addFields, apiResponse, catalogsApi, catalogsRoute, choosePlaces, csv, enableModule, fieldProviders, fieldTypeLabels, formsDefinitions, formsManualChecks,
  formsModuleName, newFieldsNotice, nextPreview, optionText, pastedReasons, presented, providerFields, reviewCounts, runFormsJourney, setOptionFields,
  sourceLabels, titleLimit, titleTooLongNotice, tsv, valueTypeLabels, visitReasons, zoneOptions,
} from "./recorrido-usuario-forms.mjs";

const base = new URL("https://localtest.me:5174/");
const locale = (file) => JSON.parse(readFileSync(new URL(`../src/modules/forms/locales/es/${file}.json`, import.meta.url), "utf8"));

test("Catálogos tiene sus tres pasos, uno por recorrido del lienzo, y nada para probar a mano", () => {
  assert.deepEqual(formsDefinitions.map((step) => step.id), ["FRM-01", "FRM-02", "FRM-03"]);
  for (const step of formsDefinitions) assert.ok(step.title.startsWith("Catálogos · ") && step.expected.length > 80, step.id);
  const [manual, filtered, fields] = formsDefinitions.map((step) => step.expected);
  // armar-un-catalogo: el módulo prendido, la pieza, el modal, crear, la vista previa e importar solo en la compu.
  for (const text of ["prende Formularios", "Escritas a mano", "Agregar opción", "Crear catálogo", "Así lo ve quien lo recibe", "Importar", "teléfono"])
    assert.ok(manual.includes(text), text);
  // catalogo-con-filtros: el origen, la persona de ejemplo, sin «Probar», la casilla y lo guardado.
  for (const text of ["De los miembros", "persona de ejemplo", "sin «Probar»", "Sin incluir a quien lo recibe", "Crear catálogo"]) assert.ok(filtered.includes(text), text);
  // campos-de-un-catalogo (E13): abre el catálogo, elige el tipo, carga los valores, qué se ve en WhatsApp y un título que no entra.
  for (const text of ["Agregar campos · 0", "Campos de …", "De un catálogo", "combo", newFieldsNotice, "grisada", "En WhatsApp", "Por ejemplo",
    "30-71234567-1 · Capital", "Aislantes Norte · Gran Buenos Aires", titleTooLongNotice(1)]) assert.ok(fields.includes(text), text);
  assert.equal(formsDefinitions[2].title, "Catálogos · Sumarle campos a un catálogo");
  assert.deepEqual(formsManualChecks, []);
});

test("los textos de los campos que espera el recorrido son los de la app, en español", () => {
  const forms = locale("forms").catalog;
  const enums = locale("enums");
  assert.deepEqual(fieldTypeLabels, enums.FormCatalogFieldType);
  assert.equal(newFieldsNotice, forms.fieldsDialog.saveToLoadValues);
  const issue = (count) => forms.presentation.issues[`TitleTooLong_${count === 1 ? "one" : "other"}`].replace("{{n}}", String(count)).replace("{{max}}", String(titleLimit));
  assert.equal(titleTooLongNotice(1), issue(1));
  assert.equal(titleTooLongNotice(3), issue(3));
  assert.equal(forms.presentation.title.replace("{{n}}", String(titleLimit)), "Título · hasta 30 caracteres");
  assert.equal(forms.presentation.description.replace("{{n}}", "300"), "Descripción · hasta 300");
  assert.equal(forms.fieldsButton.addLabel.replace("{{n}}", "0"), "Agregar campos · 0");
});

test("«Zonas» y «Proveedores» como los tableros: con la zona en el título, solo «Aislantes Norte» no entra en 30", () => {
  assert.equal(new Set(zoneOptions.map((zone) => zone.code)).size, zoneOptions.length);
  for (const provider of fieldProviders) {
    assert.ok(zoneOptions.some((zone) => zone.text === provider.zone), provider.text);
    assert.equal(provider.cuit.length, 13, "El CUIT entra en el largo del campo.");
    assert.ok(presented(provider.text).length <= titleLimit, "El título de siempre entra.");
  }
  assert.equal(new Set(fieldProviders.map((provider) => provider.cuit)).size, fieldProviders.length, "El CUIT es único.");
  assert.deepEqual(fieldProviders.filter((provider) => presented(provider.text, provider.zone).length > titleLimit).map((provider) => provider.text), ["Aislantes Norte"]);
  assert.equal(presented("Abrasivos del Sur", "", "Capital"), "Abrasivos del Sur · Capital", "Un lugar sin contenido no cuenta, como en el servidor.");
  assert.deepEqual(providerFields("Zonas"), [{ name: "CUIT", length: "13", unique: true }, { name: "Zona", type: "Catalog", catalog: "Zonas" }]);
});

test("sumar campos, cargar valores o elegir lugares sin nada que hacer se rechaza antes de tocar la pantalla", async () => {
  const touched = [];
  const page = new Proxy({}, { get: (_, name) => { touched.push(String(name)); return () => {}; } });
  await assert.rejects(addFields(page, []), /Al menos un campo/u);
  await assert.rejects(setOptionFields(page, "Abrasivos del Sur", {}), /Al menos un valor/u);
  await assert.rejects(choosePlaces(page, "Título · hasta 30 caracteres", []), /Al menos un lugar/u);
  assert.deepEqual(touched, []);
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

test("el recorrido corre los tres pasos en orden, en la pestaña de la organización", async () => {
  const page = { url: () => "https://localtest.me:5174/org", name: "organización" };
  const recorded = [];
  const record = async (id, width, getPage, action) => { recorded.push([id, getPage().name, typeof action, width]); };
  await runFormsJourney({ page, platformPage: { name: "plataforma" }, width: 390, base, record, signOut: async () => {}, login: async () => {},
    owner: "e2e-recorrido-empresa@example.test", organization: "Recorrido 390", operator: "e2e-a1-operator@example.test" });
  assert.deepEqual(recorded, [["FRM-01", "organización", "function", 390], ["FRM-02", "organización", "function", 390], ["FRM-03", "organización", "function", 390]]);
});

test("sin la pestaña de Plataforma o sin las sesiones del recorrido, Catálogos no abre pantallas ni se declara aprobado", async () => {
  const touched = [];
  const page = new Proxy({}, { get: (_, name) => { touched.push(String(name)); return () => {}; } });
  const record = async () => { touched.push("record"); };
  const journey = { page, platformPage: page, width: 1440, base, record, signOut: async () => {}, login: async () => {},
    owner: "e2e-recorrido-empresa@example.test", organization: "Recorrido 1440", operator: "e2e-a3-operator@example.test" };
  await assert.rejects(runFormsJourney({ ...journey, platformPage: undefined }), /Plataforma/u);
  await assert.rejects(runFormsJourney({ ...journey, owner: undefined }), /la Dueña/u);
  await assert.rejects(runFormsJourney({ ...journey, operator: undefined }), /operador/u);
  await assert.rejects(runFormsJourney({ ...journey, login: undefined }), /sesiones/u);
  assert.deepEqual(touched, []);
});

/**
 * Una pestaña de Plataforma de mentira para «Prender»: el `PUT` del módulo responde lo que diga `replies`, en orden; el
 * primero sale con el clic en «Prender» y el siguiente, con «Confirmar» de «Confirmá que sos vos», como la repetición del front.
 */
function modulePage(replies) {
  const page = new EventEmitter();
  const log = [];
  const respond = () => {
    const [status, body] = replies.shift();
    const reply = { url: () => "https://localtest.me:5174/api/platform/tenants/7d1c2b9a-3f4e-4a5b-8c6d-0e1f2a3b4c5d/features/forms",
      status: () => status, json: async () => body, request: () => ({ method: () => "PUT" }) };
    setTimeout(() => page.emit("response", reply), 5);
  };
  let reauthOpen = false;
  const locator = (path) => ({
    path, first: () => locator(path), nth: (index) => locator(`${path}[${index}]`), filter: () => locator(path),
    getByRole: (role, options = {}) => locator(`${path} ${role}:${options.name ?? ""}`), locator: (css) => locator(`${path} ${css}`),
    count: async () => path.includes("group:Código") ? 6 : 1,
    fill: async () => { log.push(`fill ${path}`); },
    waitFor: async ({ state } = {}) => { log.push(`wait ${path} ${state ?? "visible"}`); if (path.includes("Confirmá que sos vos") && state !== "hidden") assert.ok(reauthOpen); },
    click: async () => {
      log.push(`click ${path}`);
      if (path.endsWith("button:Prender")) { respond(); reauthOpen = replies.length > 0; }
      if (path.endsWith("button:Confirmar")) { reauthOpen = false; respond(); }
    },
  });
  Object.assign(page, {
    log, goto: async () => {}, keyboard: { press: async () => {} },
    getByRole: (role, options = {}) => locator(`${role}:${options.name ?? ""}`),
    addLocatorHandler: async () => { log.push("confirma sola"); }, removeLocatorHandler: async () => { log.push("deja de confirmar sola"); },
    waitForResponse: (matcher, { timeout = 2_000 } = {}) => new Promise((resolve, reject) => {
      const timer = setTimeout(() => { page.off("response", listener); reject(new Error("timeout")); }, timeout);
      timer.unref();
      const listener = (reply) => { if (matcher(reply)) { clearTimeout(timer); page.off("response", listener); resolve(reply); } };
      page.on("response", listener);
    }),
  });
  page.off = page.removeListener;
  return page;
}

test("Prender un módulo con la prueba del ingreso vencida confirma «Confirmá que sos vos» y espera la repetición del PUT", async () => {
  const operator = "e2e-a3-operator@example.test";
  factorKeeper.remember(operator, "JBSWY3DPEHPK3PXP");
  const tenantId = "7d1c2b9a-3f4e-4a5b-8c6d-0e1f2a3b4c5d";
  const page = modulePage([[403, { code: "Auth.Platform.ReauthenticationRequired" }], [200, {}]]);
  assert.equal(await enableModule(page, base, tenantId, formsModuleName, "Recorrido de Catálogos a 1440.", operator), true);
  assert.ok(page.log.some((line) => line.endsWith("button:Confirmar")), "Confirma con el código del autenticador.");
  assert.equal(page.log.at(-2), "confirma sola", "La pestaña vuelve a confirmar sola lo que siga.");

  const fresh = modulePage([[200, {}]]);
  assert.equal(await enableModule(fresh, base, tenantId, formsModuleName, "Recorrido de Catálogos a 1440.", operator), true);
  assert.ok(!fresh.log.some((line) => line.includes("Confirmá que sos vos")), "Con la prueba vigente no pide confirmar.");

  const other = modulePage([[403, { code: "Auth.Forbidden" }]]);
  await assert.rejects(enableModule(other, base, tenantId, formsModuleName, "Recorrido de Catálogos a 1440.", operator), /prueba del ingreso vencida/u);
  await assert.rejects(enableModule(modulePage([]), base, tenantId, formsModuleName, "Sin operador."), /correo del operador/u);
});
