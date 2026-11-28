import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtemp, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright";
import { assistantApi, assistantLogin } from "./assistant-real-ui.mjs";
import { baseUrl, createEnvironment } from "./recorrido-usuario-entorno.mjs";
import { plainTextBody } from "./test-e2e-real-mail.mjs";
import {
  act, addFields, addOptions, apiResponse, applyImport, catalogsApi, catalogState, choosePlaces, createCatalog, csv, enableModule, ensureDisplayName,
  exampleText, formsModuleName, nextPreview, openCatalog, openCatalogs, pickSample, previewRows, providerFields, reviewCounts, reviewImport,
  saveCatalog, sessionOf, startCatalog, toggleMany, tsv, zoneOptions,
} from "./recorrido-usuario-forms.mjs";

/**
 * E2E real de Catálogos (E12, §15 de su spec) y de los campos de los catálogos (E13, «Cómo se cierra» de su spec): los ocho
 * casos, con el front, la sesión, la base, el correo y el canal privado de WhatsApp de Testing reales, sin Meta. Antes,
 * Plataforma prende Formularios (y WhatsApp, para los contactos) en la organización de la preparación E7. Lo que el control y
 * la pantalla no dan lo hace la orden «forms» del preparador (RealE2ESetup, FormsCommand): un contacto que escribe con el
 * nombre de su perfil y el EXPLAIN de las lecturas de las opciones. Los de la E13 no mandan nada por WhatsApp.
 */
export const formsE2ECases = [
  ["FRM-01", "A mano: «Proveedores» pegando desde una planilla y «Recargo por zona», decimal, con el valor en su columna"],
  ["FRM-02", "Carga de una vez: una planilla de 1.000 filas, otra con bajas, y la exportación se reimporta sin diferencias"],
  ["FRM-03", "Miembros: filtros con una persona de ejemplo, vacío y con opciones, con «Sin incluir a quien lo recibe»"],
  ["FRM-04", "Contactos: por etiqueta, sin teléfonos a la vista, y un contacto nuevo con el nombre de su perfil"],
  ["FRM-05", "Volumen: 10.000 opciones; buscar, guardar una y exportar, cada lectura con su EXPLAIN"],
  ["FRM-06", "Campos: «Proveedores» con CUIT, Zona (de «Zonas») y Plazo de pago, cargados importando una planilla y exportados de nuevo sin diferencias"],
  ["FRM-07", "En WhatsApp: el CUIT en la descripción, guardado y visto en el teléfono al costado"],
  ["FRM-08", "Una zona dada de baja: «Proveedores» se sigue guardando, importando y exportando con el valor que tenía"],
];

/** Los casos de la E13 que siguen al que arma sus catálogos: «Zonas» y «Proveedores» con sus campos, de FRM-06. */
const fieldsFollowers = ["FRM-07", "FRM-08"];

/** El operador de Plataforma que prende los módulos (el del asistente real a 1440). */
const operatorEmail = "e2e-a1-operator@example.test";

/** Los números de la fixture de WhatsApp de este E2E: el del escenario que conecta el número y uno por contacto. */
export const formsPhones = { scenario: "+5491134567890", nora: "+5491134567891", hugo: "+5491134567892", unnamed: "+5491134567893", lucas: "+5491134567894" };

/** Los nombres de una corrida: con su marca, así nada choca con otra en la misma base. */
export function formsNames(tag) {
  assert.match(String(tag ?? ""), /^[a-z0-9]{2,8}$/u, "La marca de la corrida es corta.");
  return {
    providers: `Proveedores ${tag}`, surcharge: `Recargo por zona ${tag}`, sheet: `Planilla ${tag}`, volume: `Diez mil ${tag}`,
    members: `Supervisión ${tag}`, contacts: `Clientes mayoristas ${tag}`,
    role: `Supervisión ${tag}`, emptyRole: `Sin nadie ${tag}`, tag: `Mayorista ${tag}`,
    memberA: `e2e-frm-ana-${tag}@example.test`, memberB: `e2e-frm-bruno-${tag}@example.test`,
    memberAName: ["Ana", `Ruiz ${tag}`], memberBName: ["Bruno", `Paz ${tag}`],
    nora: `Nora Benítez ${tag}`, hugo: `Hugo Ferreyra ${tag}`, lucas: `Lucas Profile ${tag}`, scenario: `frm-${tag}`,
    zones: `Zonas ${tag}`, fieldProviders: `Proveedores con campos ${tag}`,
  };
}

/** Las filas de «Proveedores» que se pegan desde la planilla: código, texto y detalle. */
export const providerRows = [
  ["PRV-0001", "Abrasivos del Sur", "CUIT 30-71234567-1"], ["PRV-0002", "Bulones Mar del Plata", "CUIT 30-71567890-2"],
  ["PRV-0003", "Cementos del Plata", "CUIT 30-69001234-8"], ["PRV-0004", "Cerámicos «Neuquén»", ""], ["PRV-0005", "Aluminios Cuyo", "Entrega los martes"],
];

/** Las opciones de «Recargo por zona», con el valor como lo escribe una persona en es-AR y como lo guarda el servidor. */
export const surchargeOptions = [
  { text: "Capital", code: "CAP", value: "2500,50", canonical: 2500.5 },
  { text: "Interior", code: "INT", value: "5800", canonical: 5800 },
];

/** Una planilla de `count` filas, «PL-0001»…, con el texto de cada una; `changed` cambia el texto de algunas. */
export function sheetRows(count, { skip = new Set(), changed = new Set() } = {}) {
  assert.ok(Number.isInteger(count) && count > 0 && count <= 10_000, "Hasta 10.000 filas.");
  const width = String(count).length < 4 ? 4 : String(count).length;
  return Array.from({ length: count }, (_, index) => index + 1).filter((row) => !skip.has(row))
    .map((row) => [`PL-${String(row).padStart(width, "0")}`, changed.has(row) ? `Artículo ${row} revisado` : `Artículo ${row}`]);
}

/** Las 10.000 opciones de la prueba de volumen: «C00001»… con «Opción 00001»…, como FormCatalogVolumeTests. */
export function volumeRows(count = 10_000) {
  return Array.from({ length: count }, (_, index) => {
    const number = String(index + 1).padStart(5, "0");
    return [`C${number}`, `Opción ${number}`];
  });
}

/** Las columnas de la planilla de «Proveedores con campos» (E13): las del catálogo y una por campo, por su nombre. */
export const fieldSheetHeaders = ["Código", "Texto", "CUIT", "Zona", "Plazo de pago", "Detalle"];
/**
 * Las filas de esa planilla: la zona por su texto o, en una, por su código («GBA»), como acepta una fuente (B7); un plazo vacío
 * queda sin valor. Dos son de «Patagonia», la zona que FRM-08 da de baja.
 */
export const fieldSheet = [
  { code: "PRV-0001", text: "Abrasivos del Sur", cuit: "30-71234567-1", zone: "Capital", zoneText: "Capital", term: "30", detail: "Abrasivos" },
  { code: "PRV-0002", text: "Aceros Rosario", cuit: "30-70988123-4", zone: "GBA", zoneText: "Gran Buenos Aires", term: "60", detail: "Aceros" },
  { code: "PRV-0003", text: "Aislantes Norte", cuit: "33-71011223-9", zone: "Interior", zoneText: "Interior", term: "30", detail: "" },
  { code: "PRV-0004", text: "Alambres Patagónicos", cuit: "30-69877654-2", zone: "Patagonia", zoneText: "Patagonia", term: "90", detail: "Alambres" },
  { code: "PRV-0005", text: "Andamios Litoral", cuit: "30-70233456-1", zone: "Capital", zoneText: "Capital", term: "", detail: "Andamios" },
  { code: "PRV-0006", text: "Bulonera Central", cuit: "30-70345678-9", zone: "Patagonia", zoneText: "Patagonia", term: "15", detail: "Bulones" },
];
/** Una fila de la planilla, en el orden de sus columnas. */
export const fieldSheetCells = (row) => [row.code, row.text, row.cuit, row.zone, row.term, row.detail];
/** Los campos de «Proveedores con campos»: los del recorrido y el plazo de pago, un número entero de 0 a 365. */
export const fieldsOf = (zonesName) => [...providerFields(zonesName), { name: "Plazo de pago", type: "WholeNumber", min: "0", max: "365" }];

/** Un teléfono de la fixture como lo dice una persona («3456-7891»): ningún texto del catálogo lo puede llevar. */
export const phoneFragments = (phones) => Object.values(phones).map((phone) => phone.slice(-8)).flatMap((digits) => [digits, `${digits.slice(0, 4)}-${digits.slice(4)}`]);

const delay = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

/** Crea un rol de la organización por la API, como la Dueña en Roles; devuelve su id. */
async function createRole(page, name, permissions) {
  const created = await assistantApi(page, { route: "/api/roles", method: "POST", key: randomUUID(),
    body: { name, description: null, scope: "Organization", companyId: null, permissions } });
  assert.equal(created.status, 201, `Crear el rol ${name} respondió ${created.status}.`);
  return created.body;
}

/**
 * Invita a una persona con un rol y la hace aceptar en otro contexto, con su propia sesión, como en las acciones; después
 * carga su nombre en «Tus datos», sin el cual no entra a un catálogo de miembros.
 */
async function inviteMember(page, browser, env, email, roleIds, [firstName, lastName]) {
  const before = new Set(await env.files());
  const invited = await assistantApi(page, { route: "/api/users/invitations", method: "POST", key: randomUUID(), body: { email, roleIds, companies: [] } });
  assert.equal(invited.status, 201, `Invitar respondió ${invited.status}.`);
  let link;
  for (const deadline = Date.now() + 60_000; !link && Date.now() < deadline;) {
    link = (await env.messages(email, before)).map(({ body }) => plainTextBody(body)?.match(/https:\/\/[^\s]+\/invitacion#[A-Za-z0-9_-]+/u)?.[0]).find(Boolean);
    if (!link) await delay(250);
  }
  assert.ok(link, "La invitación llegó al correo aislado.");
  const context = await browser.newContext({ ignoreHTTPSErrors: true, locale: "es-AR", viewport: { width: 1440, height: 900 } });
  try {
    const member = await context.newPage();
    member.setDefaultTimeout(30_000);
    await member.goto(link);
    await member.getByRole("button", { name: "Aceptar invitación", exact: true }).click();
    await member.getByRole("heading", { name: /^Te sumaste a /u }).filter({ visible: true }).first().waitFor();
    await member.getByRole("button", { name: "Más tarde", exact: true }).click({ timeout: 5_000 }).catch(() => {});
    await member.waitForURL((current) => current.pathname.startsWith("/org"));
    return await ensureDisplayName(member, firstName, lastName);
  } finally { await context.close(); }
}

/** Un contacto de la bandeja Clientes por su teléfono, sin mostrarlo: su id, su nombre, sus etiquetas y su versión. */
async function contactByPhone(page, phone) {
  const listed = await assistantApi(page, { route: "/api/organization/whatsapp/contacts?pageSize=100" });
  assert.equal(listed.status, 200, `Clientes respondió ${listed.status}.`);
  const digits = phone.replace(/\D/gu, "").slice(-10);
  const contact = listed.body.contacts.items.find((item) => item.displayNumber.replace(/\D/gu, "").endsWith(digits));
  assert.ok(contact, "El contacto que escribió está en Clientes.");
  return contact;
}

/** Le pone una etiqueta a un contacto por la API, como su ficha, con su nombre de ahora y su versión. */
async function tagContact(page, phone, tag) {
  const contact = await contactByPhone(page, phone);
  const saved = await assistantApi(page, { route: `/api/organization/whatsapp/contacts/${contact.id}`, method: "PUT",
    body: { name: contact.name, tags: [...new Set([...contact.tags, tag])], consent: contact.consent, version: contact.version } });
  assert.equal(saved.status, 200, `Etiquetar el contacto respondió ${saved.status}.`);
  return contact;
}

/** El plan de las lecturas de las opciones entre `mark` y ahora, con la organización en el alcance (FormsCommand). */
async function explained(env, tenantId, action) {
  await env.command("forms", { kind: "mark" });
  await action();
  const plan = await env.command("forms", { kind: "explain", tenantId });
  assert.ok(plan.reads > 0, "La API leyó las opciones.");
  assert.equal(plan.sequential, 0, "Ninguna lectura recorre toda la tabla de opciones.");
  assert.ok(plan.largestRows <= 1_000, `Una lectura trajo ${plan.largestRows} filas, más de una tanda.`);
  return plan;
}

/** Los ocho casos, cada uno una función sobre la misma organización y sus dos pestañas. */
export function formsE2ESteps({ page, platformPage, browser, env, tenantId, names, downloads }) {
  const base = baseUrl;
  const items = async (catalogId, query = "") => {
    const read = await assistantApi(page, { route: `${catalogsApi}/${catalogId}/items?status=All&pageSize=100${query}` });
    assert.equal(read.status, 200, `Las opciones respondieron ${read.status}.`);
    return read.body;
  };
  // «Zonas» y «Proveedores con campos», con sus campos y sus valores: los arma FRM-06 y los usan FRM-07 y FRM-08.
  let fieldCatalogs;
  const fieldCatalogsReady = () => {
    assert.ok(fieldCatalogs, "FRM-07 y FRM-08 siguen a FRM-06, que arma sus catálogos.");
    return fieldCatalogs;
  };
  // «Exportar» el catálogo abierto y reimportar ese Excel: cada fila vuelve sin cambios. Cancela la revisión.
  const exportAndReimport = async (catalog, label) => {
    const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Exportar", exact: true }).click()]);
    const exported = path.join(downloads, `${label}-${randomUUID()}.xlsx`);
    await download.saveAs(exported);
    const again = await reviewImport(page, catalog, { file: exported });
    const counts = reviewCounts(again.review);
    assert.deepEqual({ errors: counts.errors, added: counts.added, changed: counts.changed, deactivated: counts.deactivated },
      { errors: 0, added: 0, changed: 0, deactivated: 0 }, `Reimportar lo exportado dio ${JSON.stringify(counts)}.`);
    assert.equal(counts.unchanged, counts.rowsRead, "Cada fila exportada se reimporta sin cambios.");
    await again.dialog.getByRole("button", { name: "Cancelar", exact: true }).click();
    await again.dialog.waitFor({ state: "hidden" });
    return counts;
  };
  // Lo guardado de cada proveedor: el CUIT, la identidad de su zona y el plazo, por código.
  const savedFieldValues = async () => {
    const { providers, fields } = fieldCatalogsReady();
    const { items: rows } = await catalogState(page, providers.id);
    return Object.fromEntries(rows.map((row) => [row.code, { cuit: row.fields[fields.cuit] ?? null, zone: row.fields[fields.zone] ?? null, term: row.fields[fields.term] ?? null }]));
  };
  return {
    "FRM-01": async () => {
      await openCatalogs(page, base);
      await startCatalog(page, { name: names.providers });
      const providers = await createCatalog(page);
      const { dialog, review } = await reviewImport(page, providers, { paste: tsv(["Código", "Texto", "Detalle"], providerRows) });
      assert.deepEqual(reviewCounts(review), { rowsRead: providerRows.length, unchanged: 0, errors: 0, added: providerRows.length, changed: 0, deactivated: 0 });
      await applyImport(page, providers, dialog);
      const pasted = await items(providers.id);
      assert.deepEqual(pasted.items.map((item) => [item.code, item.text, item.detail ?? ""]), providerRows, "Lo pegado quedó tal cual, en su orden.");

      await openCatalogs(page, base);
      await startCatalog(page, { name: names.surcharge, valueType: "DecimalNumber" });
      await addOptions(page, surchargeOptions);
      await page.getByRole("columnheader", { name: "Valor", exact: true }).waitFor();
      const surcharge = await createCatalog(page);
      assert.equal(surcharge.valueType, "DecimalNumber");
      const saved = await items(surcharge.id);
      assert.deepEqual(saved.items.map((item) => [item.code, Number(item.value)]), surchargeOptions.map((option) => [option.code, option.canonical]));
      // El valor va en su columna, con el formato de la persona.
      assert.match(await page.getByRole("textbox", { name: "Valor de Capital", exact: true }).inputValue(), /^2\.500,5/u);
      return "Proveedores pegó cinco filas que quedaron tal cual; Recargo por zona guardó sus valores decimales y los muestra en su columna.";
    },
    "FRM-02": async () => {
      await openCatalogs(page, base);
      await startCatalog(page, { name: names.sheet });
      const sheet = await createCatalog(page);
      const first = await reviewImport(page, sheet, { file: { name: "planilla.csv", mimeType: "text/csv", buffer: Buffer.from(csv(["Código", "Texto"], sheetRows(1_000)), "utf8") } });
      assert.deepEqual(reviewCounts(first.review), { rowsRead: 1_000, unchanged: 0, errors: 0, added: 1_000, changed: 0, deactivated: 0 });
      await applyImport(page, sheet, first.dialog);
      // La segunda planilla no trae diez (se dan de baja, no se borran) y cambia el texto de cinco.
      const skip = new Set([3, 14, 159, 265, 358, 497, 512, 640, 777, 999]);
      const changed = new Set([10, 20, 30, 40, 50]);
      const second = await reviewImport(page, sheet, { file: { name: "planilla-con-bajas.csv", mimeType: "text/csv",
        buffer: Buffer.from(csv(["Código", "Texto"], sheetRows(1_000, { skip, changed })), "utf8") } });
      assert.deepEqual(reviewCounts(second.review), { rowsRead: 990, unchanged: 985, errors: 0, added: 0, changed: 5, deactivated: 10 });
      assert.equal(second.review.confirmDeactivations, false, "Diez bajas de mil no piden confirmar.");
      await applyImport(page, sheet, second.dialog);
      const counted = await assistantApi(page, { route: `${catalogsApi}/${sheet.id}` });
      assert.deepEqual(counted.body.itemCounts, { total: 1_000, active: 990 });

      const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Exportar", exact: true }).click()]);
      const exported = path.join(downloads, `exportado-${randomUUID()}.xlsx`);
      await download.saveAs(exported);
      const again = await reviewImport(page, sheet, { file: exported });
      const counts = reviewCounts(again.review);
      assert.deepEqual({ errors: counts.errors, added: counts.added, changed: counts.changed, deactivated: counts.deactivated },
        { errors: 0, added: 0, changed: 0, deactivated: 0 }, `Reimportar lo exportado dio ${JSON.stringify(counts)}.`);
      assert.equal(counts.unchanged, counts.rowsRead, "Cada fila exportada se reimporta sin cambios.");
      await again.dialog.getByRole("button", { name: "Cancelar", exact: true }).click();
      return `Mil filas dieron mil altas; la segunda planilla, diez bajas y cinco cambios; el Excel exportado (${counts.rowsRead} filas) se reimporta sin diferencias.`;
    },
    "FRM-03": async () => {
      const role = await createRole(page, names.role, ["users.read"]);
      const emptyRole = await createRole(page, names.emptyRole, ["users.read"]);
      assert.ok(emptyRole, "El rol sin nadie existe.");
      const ana = await inviteMember(page, browser, env, names.memberA, [role], names.memberAName);
      await inviteMember(page, browser, env, names.memberB, [role], names.memberBName);
      await openCatalogs(page, base);
      await startCatalog(page, { source: "Members", name: names.members });
      await page.getByRole("button", { name: "Agregar condición", exact: true }).click();
      await toggleMany(page, page, "Roles", names.role);
      // Con la condición lista, la vista previa espera la persona de ejemplo: sin ella no se pide (SampleRequired).
      let sample;
      const one = await nextPreview(page, async () => { sample = await pickSample(page, page, "Persona", ana); },
        (request) => request.filters?.excludeRecipient === true && request.filters.conditions?.[0]?.values?.length === 1);
      assert.equal(one.body.total, 1, "Con la casilla, de las dos con el rol queda la otra.");
      const two = await nextPreview(page, () => page.getByRole("checkbox", { name: "Sin incluir a quien lo recibe", exact: true }).click(),
        (request) => request.filters?.excludeRecipient === false);
      assert.equal(two.body.total, 2, "Sin la casilla, las dos.");
      await nextPreview(page, () => toggleMany(page, page, "Roles", names.emptyRole), (request) => request.filters?.conditions?.[0]?.values?.length === 2);
      const none = await nextPreview(page, () => toggleMany(page, page, "Roles", names.role),
        (request) => request.filters?.conditions?.[0]?.values?.length === 1 && request.filters.conditions[0].values[0] === emptyRole);
      assert.equal(none.body.total, 0, "Con el rol sin nadie, ninguna opción.");
      await page.getByRole("group", { name: "Así lo ve quien lo recibe", exact: true }).getByText("Ninguna opción", { exact: true }).waitFor();
      await page.getByRole("checkbox", { name: "Sin incluir a quien lo recibe", exact: true }).click();
      const back = await nextPreview(page, () => toggleMany(page, page, "Roles", names.role),
        (request) => request.filters?.excludeRecipient === true && request.filters.conditions?.[0]?.values?.length === 2);
      assert.equal(back.body.total, 1, "Con los dos roles y la casilla, otra vez una.");
      const created = await createCatalog(page);
      await page.reload();
      await page.getByRole("heading", { name: "Qué miembros entran", exact: true }).first().waitFor();
      const detail = await assistantApi(page, { route: `${catalogsApi}/${created.id}` });
      assert.equal(detail.body.filters.excludeRecipient, true);
      assert.deepEqual(new Set(detail.body.filters.conditions[0].values), new Set([role, emptyRole]));
      assert.equal(detail.body.sample?.name, sample);
      assert.equal(sample, ana, "La persona de ejemplo es una de las que tienen el rol.");
      return `Con la persona de ejemplo «${sample}»: una opción con la casilla, dos sin ella y ninguna con el rol sin nadie; se guardó con su persona y la casilla.`;
    },
    "FRM-04": async () => {
      await enableModule(platformPage, base, tenantId, "WhatsApp", "E2E de Catálogos: los contactos de Clientes.", operatorEmail);
      const control = await env.whatsapp.begin(names.scenario, formsPhones.scenario);
      await control("orgNumber", { tenantId });
      const write = async (phone, profileName) => {
        const reply = await env.command("forms", { kind: "contactInbound", scenario: names.scenario, phone, text: "Hola", ...(profileName ? { profileName } : {}) });
        assert.equal(reply.status, 200, `El webhook respondió ${reply.status}.`);
        await control("orgProcess");
      };
      await write(formsPhones.nora, names.nora);
      await write(formsPhones.hugo, names.hugo);
      await write(formsPhones.unnamed);
      assert.equal((await contactByPhone(page, formsPhones.nora)).name, names.nora, "Sin nombre, el contacto toma el de su perfil (81).");
      // C14: el contacto sin nombre ni perfil no se ofrece aunque tenga la etiqueta; entran Nora y Hugo.
      await tagContact(page, formsPhones.nora, names.tag);
      await tagContact(page, formsPhones.hugo, names.tag);
      await tagContact(page, formsPhones.unnamed, names.tag);

      await openCatalogs(page, base);
      await startCatalog(page, { source: "Contacts", name: names.contacts });
      await page.getByRole("heading", { name: "Qué contactos entran", exact: true }).first().waitFor();
      await page.getByRole("button", { name: "Agregar condición", exact: true }).click();
      const tagged = await nextPreview(page, () => toggleMany(page, page, "Etiquetas", names.tag),
        (request) => request.filters?.conditions?.[0]?.values?.[0] === names.tag);
      assert.equal(tagged.body.total, 2, "Con la etiqueta, los dos contactos con nombre; el que no tiene nombre ni perfil no se ofrece (C14).");
      assert.ok(tagged.body.options.some((option) => option.text === names.nora), "Nora se ve por su nombre.");
      assert.ok(tagged.body.options.some((option) => option.text === names.hugo), "Hugo se ve por su nombre.");
      const created = await createCatalog(page);
      const fragments = phoneFragments(formsPhones);
      const main = await page.getByRole("main").innerText();
      for (const fragment of fragments) assert.ok(!main.includes(fragment), "Ningún teléfono a la vista en el catálogo.");
      for (const option of tagged.body.options) for (const fragment of fragments) assert.ok(!`${option.text} ${option.detail ?? ""}`.includes(fragment), "La vista previa no lleva teléfonos.");

      // Un contacto nuevo que escribe sin nombre aparece con el de su perfil (81).
      await write(formsPhones.lucas, names.lucas);
      assert.equal((await contactByPhone(page, formsPhones.lucas)).name, names.lucas, "El contacto nuevo tomó el nombre de su perfil.");
      await tagContact(page, formsPhones.lucas, names.tag);
      const [preview] = await Promise.all([page.waitForResponse(apiResponse("POST", `${catalogsApi}/previews`)), page.reload()]);
      const reread = await preview.json();
      assert.equal(reread.total, 3, "El contacto nuevo con la etiqueta entra al catálogo; el que no tiene nombre ni perfil sigue afuera (C14).");
      await page.getByRole("group", { name: "Así lo ve quien lo recibe", exact: true }).getByText(names.lucas, { exact: true }).waitFor();
      assert.equal(created.source, "Contacts");
      return "Clientes mayoristas lista los dos contactos con nombre que tienen la etiqueta, Nora por el nombre de su perfil, sin teléfonos ni el contacto sin nombre ni perfil; un contacto nuevo que escribió sin nombre entró con el de su perfil.";
    },
    "FRM-05": async () => {
      await openCatalogs(page, base);
      await startCatalog(page, { name: names.volume });
      const volume = await createCatalog(page);
      const loaded = await reviewImport(page, volume, { file: { name: "diez-mil.csv", mimeType: "text/csv", buffer: Buffer.from(csv(["Código", "Texto"], volumeRows()), "utf8") } });
      assert.deepEqual(reviewCounts(loaded.review), { rowsRead: 10_000, unchanged: 0, errors: 0, added: 10_000, changed: 0, deactivated: 0 });
      await applyImport(page, volume, loaded.dialog);
      const add = page.getByRole("button", { name: "Agregar opción", exact: true }).first();
      for (const deadline = Date.now() + 30_000; await add.getAttribute("aria-disabled") !== "true";) {
        assert.ok(Date.now() < deadline, "Con 10.000 opciones, «Agregar opción» queda apagado.");
        await delay(250);
      }

      const search = await explained(env, tenantId, async () => {
        const response = await act(page, (reply) => apiResponse("GET", `${catalogsApi}/${volume.id}/items`)(reply) && new URL(reply.url()).searchParams.get("search") === "09876",
          () => page.getByRole("searchbox", { name: "Buscar opción", exact: true }).fill("09876"), { status: 200 });
        assert.equal((await response.json()).totalCount, 1, "Buscar trae una sola.");
      });
      const save = await explained(env, tenantId, async () => {
        await page.getByRole("textbox", { name: "Texto de Opción 09876", exact: true }).fill("Opción cambiada");
        await saveCatalog(page, volume.id);
      });
      assert.equal(save.itemUpdates, 1, "Guardar una opción escribe solo esa.");
      const exported = await explained(env, tenantId, async () => {
        const [download] = await Promise.all([page.waitForEvent("download", { timeout: 120_000 }), page.getByRole("button", { name: "Exportar", exact: true }).click()]);
        const file = path.join(downloads, `diez-mil-${randomUUID()}.xlsx`);
        await download.saveAs(file);
        assert.ok((await stat(file)).size > 0, "Exportar baja el Excel.");
      });
      assert.ok(exported.reads >= 10, "Exportar lee las opciones de a tandas.");
      return `10.000 opciones: buscar (${search.reads} lecturas), guardar una (${save.reads}, una sola escrita) y exportar (${exported.reads} tandas), ninguna recorre la tabla.`;
    },
    "FRM-06": async () => {
      await openCatalogs(page, base);
      await startCatalog(page, { name: names.zones });
      await addOptions(page, zoneOptions);
      const zones = await createCatalog(page);
      await openCatalogs(page, base);
      await startCatalog(page, { name: names.fieldProviders, description: "A quiénes se les compra." });
      const providers = await createCatalog(page);
      // Los campos se arman en «Campos de …» y se guardan con el catálogo; los valores llegan después, importando.
      await addFields(page, fieldsOf(names.zones));
      const saved = await saveCatalog(page, providers.id);
      assert.equal(saved.fieldIdentityMap?.length, 3, "Guardar responde la identidad de los tres campos nuevos.");
      const { fields: byName } = await catalogState(page, providers.id);
      const fields = { cuit: byName.CUIT?.id, zone: byName.Zona?.id, term: byName["Plazo de pago"]?.id };
      assert.ok(fields.cuit && fields.zone && fields.term, "Los tres campos quedaron guardados con su identidad.");
      assert.deepEqual([byName.CUIT.type, byName.CUIT.maxLength, byName.CUIT.unique], ["Text", 13, true]);
      assert.deepEqual([byName.Zona.type, byName.Zona.sourceCatalogId], ["Catalog", zones.id]);
      assert.deepEqual([byName["Plazo de pago"].type, byName["Plazo de pago"].min, byName["Plazo de pago"].max], ["WholeNumber", "0", "365"]);

      const sheet = { name: "proveedores-con-campos.csv", mimeType: "text/csv", buffer: Buffer.from(csv(fieldSheetHeaders, fieldSheet.map(fieldSheetCells)), "utf8") };
      const { dialog, review } = await reviewImport(page, providers, { file: sheet });
      assert.deepEqual(reviewCounts(review), { rowsRead: fieldSheet.length, unchanged: 0, errors: 0, added: fieldSheet.length, changed: 0, deactivated: 0 });
      await applyImport(page, providers, dialog);
      const zoneIds = Object.fromEntries((await items(zones.id)).items.map((item) => [item.text, item.id]));
      fieldCatalogs = { zones, providers, fields, zoneIds };
      assert.deepEqual(await savedFieldValues(), Object.fromEntries(fieldSheet.map((row) =>
        [row.code, { cuit: row.cuit, zone: zoneIds[row.zoneText], term: row.term || null }])), "Cada fila guardó su CUIT, la identidad de su zona (también por código) y su plazo.");

      const counts = await exportAndReimport(providers, "proveedores-con-campos");
      return `«${names.fieldProviders}» sumó CUIT, Zona (de «${names.zones}») y Plazo de pago; la planilla dio ${fieldSheet.length} altas con sus valores (una zona por su código) y el Excel exportado (${counts.rowsRead} filas) se reimporta sin diferencias.`;
    },
    "FRM-07": async () => {
      const { providers, fields } = fieldCatalogsReady();
      await openCatalog(page, base, providers, fieldSheet[0].text);
      // La descripción pasa del detalle al CUIT; el título sigue en el texto.
      await choosePlaces(page, "Descripción · hasta 300", ["Detalle", "CUIT"]);
      assert.deepEqual(await exampleText(page), [fieldSheet[0].text, fieldSheet[0].cuit], "«Por ejemplo» arma la primera opción como el servidor.");
      const expected = fieldSheet.map((row) => ({ title: row.text, detail: row.cuit }));
      assert.deepEqual(await previewRows(page), expected, "El teléfono de al lado muestra el CUIT debajo de cada opción.");
      await saveCatalog(page, providers.id);
      const { detail, items: rows } = await catalogState(page, providers.id);
      assert.deepEqual(detail.presentation, { title: ["text"], description: [`field:${fields.cuit}`] });
      assert.equal(detail.presentationIssues.count, 0, "Todo entra en WhatsApp.");
      assert.ok(rows.every((row) => !row.presentationIssue), "Ninguna opción tiene un aviso.");
      await openCatalog(page, base, providers, fieldSheet[0].text);
      assert.deepEqual(await previewRows(page), expected, "Al volver a abrirlo, el teléfono sigue mostrando el CUIT.");
      return `La descripción en WhatsApp quedó en el CUIT («${fieldSheet[0].text}» con «${fieldSheet[0].cuit}» debajo), guardada como field:<id> y vista en el teléfono al costado, también al volver a abrirlo.`;
    },
    "FRM-08": async () => {
      const { zones, providers, zoneIds } = fieldCatalogsReady();
      const patagonia = zoneIds.Patagonia;
      const southern = fieldSheet.filter((row) => row.zoneText === "Patagonia");
      assert.ok(patagonia && southern.length === 2, "Dos proveedores tienen «Patagonia».");
      // «Zonas» da de baja «Patagonia».
      await openCatalog(page, base, zones, zoneOptions[0].text);
      await page.getByRole("checkbox", { name: "Activa: Patagonia", exact: true }).click();
      await saveCatalog(page, zones.id);
      assert.equal((await items(zones.id)).items.find((item) => item.id === patagonia)?.isActive, false, "«Patagonia» quedó dada de baja.");

      // Se sigue guardando: la celda dice la zona guardada y otro cambio se guarda sin tocarla.
      await openCatalog(page, base, providers, fieldSheet[0].text);
      await page.getByRole("button", { name: new RegExp(`^Zona de ${southern[0].text} Patagonia`, "u") }).waitFor();
      await page.getByRole("textbox", { name: `Plazo de pago de ${fieldSheet[0].text}`, exact: true }).fill("45");
      await saveCatalog(page, providers.id);
      let values = await savedFieldValues();
      for (const row of southern) assert.equal(values[row.code].zone, patagonia, `${row.code} conserva «Patagonia» al guardar.`);
      assert.equal(values[fieldSheet[0].code].term, "45");

      // Se sigue importando: la fila que nombra la zona dada de baja que ya tenía se conserva; ponerla en otra opción es un error.
      const keep = southern[0];
      const change = { ...fieldSheet[0], term: "50" };
      const wrong = { ...fieldSheet[2], zone: "Patagonia" };
      const paste = (rows) => tsv(fieldSheetHeaders, rows.map(fieldSheetCells));
      const rejected = await reviewImport(page, providers, { paste: paste([keep, change, wrong]) });
      assert.equal(reviewCounts(rejected.review).errors, 1, "Una zona dada de baja no se elige como valor nuevo.");
      await rejected.dialog.getByRole("button", { name: "Cancelar", exact: true }).click();
      await rejected.dialog.waitFor({ state: "hidden" });
      const accepted = await reviewImport(page, providers, { paste: paste([keep, change]) });
      assert.deepEqual(reviewCounts(accepted.review), { rowsRead: 2, unchanged: 1, errors: 0, added: 0, changed: 1, deactivated: 0 });
      await applyImport(page, providers, accepted.dialog);
      values = await savedFieldValues();
      assert.equal(values[keep.code].zone, patagonia, "Importar conserva «Patagonia» en la fila que ya la tenía.");
      assert.equal(values[wrong.code].zone, zoneIds.Interior, "La fila rechazada no cambió su zona.");
      assert.equal(values[change.code].term, "50");

      // Se sigue exportando: el Excel se reimporta sin diferencias y la zona sigue.
      const counts = await exportAndReimport(providers, "proveedores-zona-de-baja");
      values = await savedFieldValues();
      for (const row of southern) assert.equal(values[row.code].zone, patagonia, `${row.code} conserva «Patagonia» al exportar y reimportar.`);
      return `Con «Patagonia» dada de baja, «${names.fieldProviders}» se guardó (plazo 45), importó (una fila sin cambios con la zona de baja y otra con el plazo 50; ponerla en otra opción fue un error) y exportó ${counts.rowsRead} filas sin diferencias, con la zona guardada en sus dos proveedores.`;
    },
  };
}

/** Corre los casos pedidos en una organización nueva del entorno aislado, a 1440. */
export async function runFormsRealE2E({ build = false, cases = formsE2ECases.map(([id]) => id) } = {}) {
  assert.ok(cases.length > 0 && cases.every((id) => formsE2ECases.some(([known]) => known === id)) && new Set(cases).size === cases.length, "Casos de Catálogos inválidos.");
  const builder = cases.indexOf("FRM-06");
  assert.ok(cases.every((id, index) => !fieldsFollowers.includes(id) || (builder >= 0 && builder < index)), "FRM-07 y FRM-08 siguen a FRM-06, que arma sus catálogos.");
  const env = await createEnvironment({ build });
  const downloads = await mkdtemp(path.join(os.tmpdir(), "arquitecturabase-catalogos-"));
  let browser;
  try {
    await env.command("platform", { kind: "prepare" });
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ ignoreHTTPSErrors: true, locale: "es-AR", viewport: { width: 1440, height: 900 }, acceptDownloads: true });
    try {
      const page = await context.newPage();
      const platformPage = await context.newPage();
      page.setDefaultTimeout(30_000); platformPage.setDefaultTimeout(30_000);
      await page.goto(new URL("/alive", baseUrl).href);
      await assistantLogin(page, env, baseUrl, env.businessEmail, "business");
      await assistantLogin(platformPage, env, baseUrl, operatorEmail, "platform");
      const { tenantId } = await sessionOf(page);
      assert.ok(await enableModule(platformPage, baseUrl, tenantId, formsModuleName, "E2E de Catálogos (E12 y E13).", operatorEmail), "Formularios llega apagado y Plataforma lo prende.");
      const names = formsNames(Date.now().toString(36).slice(-6));
      const steps = formsE2ESteps({ page, platformPage, browser, env, tenantId, names, downloads });
      for (const id of cases) {
        const result = await steps[id]();
        process.stdout.write(`CHECK OK ${id} ${result}\n`);
      }
    } finally { await context.close(); }
  } finally {
    await browser?.close();
    await env.stop();
    await rm(downloads, { recursive: true, force: true });
  }
}

