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
  act, addOptions, apiResponse, applyImport, catalogsApi, createCatalog, csv, enableModule, ensureDisplayName, formsModuleName, nextPreview,
  openCatalogs, pickSample, reviewCounts, reviewImport, saveCatalog, sessionOf, startCatalog, toggleMany, tsv,
} from "./recorrido-usuario-forms.mjs";

/**
 * E2E real de Catálogos (E12, §15 de la spec): los cinco casos, con el front, la sesión, la base, el correo y el canal privado
 * de WhatsApp de Testing reales, sin Meta. Antes, Plataforma prende Formularios (y WhatsApp, para los contactos) en la
 * organización de la preparación E7. Lo que el control y la pantalla no dan lo hace la orden «forms» del preparador
 * (RealE2ESetup, FormsCommand): un contacto que escribe con el nombre de su perfil y el EXPLAIN de las lecturas de las opciones.
 */
export const formsE2ECases = [
  ["FRM-01", "A mano: «Proveedores» pegando desde una planilla y «Recargo por zona», decimal, con el valor en su columna"],
  ["FRM-02", "Carga de una vez: una planilla de 1.000 filas, otra con bajas, y la exportación se reimporta sin diferencias"],
  ["FRM-03", "Miembros: filtros con una persona de ejemplo, vacío y con opciones, con «Sin incluir a quien lo recibe»"],
  ["FRM-04", "Contactos: por etiqueta, sin teléfonos a la vista, y un contacto nuevo con el nombre de su perfil"],
  ["FRM-05", "Volumen: 10.000 opciones; buscar, guardar una y exportar, cada lectura con su EXPLAIN"],
];

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

/** Los cinco casos, cada uno una función sobre la misma organización y sus dos pestañas. */
export function formsE2ESteps({ page, platformPage, browser, env, tenantId, names, downloads }) {
  const base = baseUrl;
  const items = async (catalogId, query = "") => {
    const read = await assistantApi(page, { route: `${catalogsApi}/${catalogId}/items?status=All&pageSize=100${query}` });
    assert.equal(read.status, 200, `Las opciones respondieron ${read.status}.`);
    return read.body;
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
  };
}

/** Corre los casos pedidos en una organización nueva del entorno aislado, a 1440. */
export async function runFormsRealE2E({ build = false, cases = formsE2ECases.map(([id]) => id) } = {}) {
  assert.ok(cases.length > 0 && cases.every((id) => formsE2ECases.some(([known]) => known === id)) && new Set(cases).size === cases.length, "Casos de Catálogos inválidos.");
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
      assert.ok(await enableModule(platformPage, baseUrl, tenantId, formsModuleName, "E2E de Catálogos (E12).", operatorEmail), "Formularios llega apagado y Plataforma lo prende.");
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

