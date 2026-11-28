import assert from "node:assert/strict";
import { assistantApi } from "./assistant-real-ui.mjs";
import { pickerButton } from "./e2e-pieza.mjs";
import { confirmRecentAuthentication, confirmRecentAuthenticationWhenAsked, stopConfirmingRecentAuthentication } from "./platform-factor-real.mjs";

// Catálogos en el recorrido de usuario (E12, verificación): `armar-un-catalogo` y `catalogo-con-filtros`, los dos recorridos
// del lienzo (docs/design/recorridos). Van después de las acciones del asistente, en las mismas pestañas: arrancan y terminan
// con la Dueña afuera. Plataforma prende Formularios para la organización (el módulo es quitable y llega apagado) y la Dueña
// arma, por la pantalla, un catálogo escrito a mano y uno de los miembros con filtros. Las piezas de pantalla de acá las usa
// también el E2E real de la etapa (test-e2e-real-forms.mjs).

const definition = (id, title, expected) => ({ id: `FRM-${id}`, title: `Catálogos · ${title}`, expected });
export const formsDefinitions = [
  definition("01", "Armar un catálogo escrito a mano", "Plataforma prende Formularios y «Gestión de formularios» trae «Catálogos», vacío. «Nuevo catálogo» abre el editor con «Escritas a mano» y «Texto» en la pieza; «Agregar opción» abre el modal, donde se cargan tres opciones con su código generado desde el texto, y «Crear catálogo» lo crea y abre su editor. «Así lo ve quien lo recibe» muestra las tres en el teléfono. En la compu, «Importar» pega tres filas desde Excel, la revisión dice tres altas y «Aplicar» las suma; en el teléfono, Importar no está."),
  definition("02", "Un catálogo que se arma solo, con filtros", "«De los miembros» en la pieza deja de pedir el tipo de valor y trae «Qué miembros entran». La condición «Activo es Sí» y la Dueña como persona de ejemplo piden la vista previa sola, sin «Probar»; con «Sin incluir a quien lo recibe», la Dueña no está entre las opciones y, sin la casilla, sí: una opción más. «Crear catálogo» lo guarda y, al volver a abrirlo, la condición, la persona y la casilla siguen."),
];

// Nada de la E12 depende de Meta, de un teléfono ni de un proveedor real: no queda nada para probar a mano.
export const formsManualChecks = [];

export const catalogsRoute = "/org/formularios/catalogos";
export const catalogsApi = "/api/organization/forms/catalogs";
/** El nombre del módulo en Plataforma › Organización › Módulos (forms:title). */
export const formsModuleName = "Formularios";

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
const pause = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

/** Los textos de la pieza «De dónde salen las opciones» y «Tipo de valor» (enums.json de Formularios). */
export const sourceLabels = { Manual: "Escritas a mano", Members: "De los miembros", Contacts: "De los contactos de WhatsApp" };
export const valueTypeLabels = { Text: "Texto", WholeNumber: "Número entero", DecimalNumber: "Número decimal", Date: "Fecha" };

/** Las tres opciones de «Motivos de visita» del recorrido, como en el tablero FRM-Catalogo. */
export const visitReasons = ["Seguimiento", "Venta nueva", "Reclamo"];
/** Las filas que se pegan desde Excel en el recorrido: con encabezados, en el orden de la plantilla. */
export const pastedReasons = [["GAR", "Garantía", "Revisar un equipo en garantía"], ["INS", "Instalación", "Instalar un equipo vendido"],
  ["COB", "Cobranza", "Cobrar un pago pendiente"]];

/** Lo copiado de una planilla: los encabezados del catálogo y cada fila, separados con tabulaciones, como lo deja Excel. */
export function tsv(headers, rows) {
  assert.ok(Array.isArray(headers) && headers.length > 0 && rows.every((row) => Array.isArray(row) && row.length === headers.length),
    "Cada fila lleva una celda por encabezado.");
  assert.ok([headers, ...rows].flat().every((cell) => typeof cell === "string" && !/[\t\r\n]/u.test(cell)), "Una celda va en una línea, sin tabulaciones.");
  return [headers, ...rows].map((row) => row.join("\t")).join("\n");
}

/** Un CSV en UTF-8 como lo guarda una planilla: separado por coma, con comillas donde hacen falta, una fila por línea. */
export function csv(headers, rows) {
  assert.ok(rows.every((row) => row.length === headers.length), "Cada fila lleva una celda por encabezado.");
  const cell = (value) => /[",\r\n]/u.test(value) ? `"${value.replaceAll("\"", "\"\"")}"` : value;
  return `${[headers, ...rows].map((row) => row.map((value) => cell(String(value))).join(",")).join("\r\n")}\r\n`;
}

/** La respuesta de la API que pide `method` a `pathname`, sin mirar la consulta. */
export const apiResponse = (method, pathname) => (response) => response.request().method() === method && new URL(response.url()).pathname === pathname;

/** Corre `action` y espera la respuesta que la sigue; falla con su estado si no es la esperada. */
export async function act(page, matcher, action, { status, timeout = 30_000 } = {}) {
  const [response] = await Promise.all([page.waitForResponse(matcher, { timeout }), action()]);
  if (status !== undefined) assert.equal(response.status(), status, `${response.request().method()} ${new URL(response.url()).pathname} respondió ${response.status()}.`);
  return response;
}

/** Abre la pieza con ese rótulo, en `scope` (la página o un diálogo), y elige la opción; la lista vive en un portal. */
export async function pick(page, scope, label, option) {
  await pickerButton(scope, label).click();
  const name = typeof option === "string" ? new RegExp(`^${escapeRegExp(option)}`, "u") : option;
  await page.getByRole("option", { name }).first().click();
}

/** Una pieza de varios (roles, etiquetas): elige o saca la opción y cierra la lista. */
export async function toggleMany(page, scope, label, option) {
  await pick(page, scope, label, option);
  await page.keyboard.press("Escape");
  await page.getByRole("listbox").waitFor({ state: "hidden" });
}

/**
 * Prende un módulo para la organización, como Plataforma por la pantalla: Organización › Módulos › ⋮ › «Prender», con motivo.
 * `platformPage` tiene la sesión de `operatorEmail`. Si ya estaba prendido, no hace nada. Prender pide la prueba reciente del
 * ingreso (`platform.tenants.manage`, 10 minutos): si venció, el back responde 403 `Auth.Platform.ReauthenticationRequired`, el
 * front abre «Confirmá que sos vos» y, confirmada, repite el `PUT`; acá se espera esa repetición, como en el E9.
 */
export async function enableModule(platformPage, base, tenantId, moduleName, reason, operatorEmail) {
  assert.match(String(tenantId ?? ""), /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu, "La organización es un id.");
  assert.match(String(operatorEmail ?? ""), /@/u, "Prender un módulo necesita el correo del operador, por si pide «Confirmá que sos vos».");
  await platformPage.goto(new URL(`/plataforma/organizaciones/${tenantId}?tab=modules`, base).href);
  await platformPage.getByRole("tab", { name: /^Módulos/u }).click();
  await platformPage.getByRole("button", { name: `Acciones de ${moduleName}`, exact: true }).first().click();
  const menu = platformPage.getByRole("menu");
  await menu.waitFor();
  const enable = menu.getByRole("menuitem", { name: "Prender", exact: true });
  if (!await enable.count()) {
    await platformPage.keyboard.press("Escape");
    return false;
  }
  await enable.click();
  const dialog = platformPage.getByRole("dialog").filter({ has: platformPage.getByRole("textbox", { name: /Motivo/u }) });
  await dialog.getByRole("textbox", { name: /Motivo/u }).fill(reason);
  const feature = moduleName === formsModuleName ? "forms" : moduleName === "WhatsApp" ? "whatsapp" : null;
  assert.ok(feature, "El módulo es Formularios o WhatsApp.");
  const matcher = apiResponse("PUT", `/api/platform/tenants/${tenantId}/features/${feature}`);
  // La confirmación va a mano: la que se hace sola (completeOperatorFactor) corre recién en la acción siguiente.
  await stopConfirmingRecentAuthentication(platformPage);
  try {
    let response = await act(platformPage, matcher, () => dialog.getByRole("button", { name: "Prender", exact: true }).click());
    if (response.status() === 403) {
      const replay = platformPage.waitForResponse((reply) => matcher(reply) && reply.status() !== 403, { timeout: 60_000 });
      void replay.catch(() => {});
      assert.equal((await response.json()).code, "Auth.Platform.ReauthenticationRequired", "Un 403 al prender es la prueba del ingreso vencida.");
      await confirmRecentAuthentication(platformPage, operatorEmail);
      response = await replay;
    }
    assert.equal(response.status(), 200, `PUT ${new URL(response.url()).pathname} respondió ${response.status()}.`);
  } finally {
    await confirmRecentAuthenticationWhenAsked(platformPage, operatorEmail);
  }
  await dialog.waitFor({ state: "hidden" });
  return true;
}

/** Catálogos por su dirección, con el título a la vista; devuelve la respuesta del listado. */
export async function openCatalogs(page, base) {
  const [list] = await Promise.all([page.waitForResponse(apiResponse("GET", catalogsApi)), page.goto(new URL(catalogsRoute, base).href)]);
  assert.equal(list.status(), 200, `El listado de catálogos respondió ${list.status()}.`);
  await page.getByRole("heading", { name: "Catálogos", exact: true }).filter({ visible: true }).first().waitFor();
  return list.json();
}

/**
 * «Nuevo catálogo» desde el listado (en el teléfono, el «+»): el editor con el origen, el tipo de valor y el nombre. No lo crea.
 */
export async function startCatalog(page, { source = "Manual", valueType = "Text", name, description }) {
  assert.ok(source in sourceLabels && valueType in valueTypeLabels, "Origen y tipo de valor del contrato.");
  assert.ok(source === "Manual" || valueType === "Text", "Uno con filtros es siempre de texto.");
  await page.getByRole("link", { name: "Nuevo catálogo", exact: true }).filter({ visible: true }).first().click();
  await page.getByRole("heading", { name: "Nuevo catálogo", exact: true }).filter({ visible: true }).first().waitFor();
  const sourcePicker = pickerButton(page, "De dónde salen las opciones");
  assert.match(await sourcePicker.innerText(), /Escritas a mano/u, "Un catálogo nuevo arranca escrito a mano.");
  if (source !== "Manual") {
    await pick(page, page, "De dónde salen las opciones", sourceLabels[source]);
    assert.equal(await pickerButton(page, "Tipo de valor").count(), 0, "Uno con filtros no pide el tipo de valor.");
  }
  if (valueType !== "Text") await pick(page, page, "Tipo de valor", valueTypeLabels[valueType]);
  await page.getByRole("textbox", { name: /^Nombre/u }).fill(name);
  if (description) await page.getByRole("textbox", { name: /^Descripción/u }).fill(description);
}

/**
 * Carga opciones en el modal de «Agregar opción» (117): cada una con su texto y, si se pide, su código (o «Generar desde el
 * texto»), su valor y su detalle; «Listo» las deja en el borrador. En el teléfono el modal ocupa la pantalla y vuelve a la
 * lista antes de sumar otra.
 */
export async function addOptions(page, options, { phone = false } = {}) {
  assert.ok(Array.isArray(options) && options.length > 0, "Al menos una opción.");
  await page.getByRole("button", { name: "Agregar opción", exact: true }).filter({ visible: true }).first().click();
  const dialog = page.locator('[role="dialog"]').last();
  await dialog.getByRole("textbox", { name: "Texto", exact: true }).waitFor();
  for (const [index, option] of options.entries()) {
    if (index > 0) {
      if (phone) await dialog.getByRole("button", { name: "Volver a la lista", exact: true }).click();
      await dialog.getByRole("button", { name: "Agregar opción", exact: true }).click();
    }
    await dialog.getByRole("textbox", { name: "Texto", exact: true }).fill(option.text);
    if (option.code) await dialog.getByRole("textbox", { name: "Código", exact: true }).fill(option.code);
    else await dialog.getByRole("button", { name: "Generar desde el texto", exact: true }).click();
    if (option.value !== undefined) await dialog.getByRole("textbox", { name: /^Valor \(/u }).fill(option.value);
    if (option.detail) await dialog.getByRole("textbox", { name: "Detalle", exact: true }).fill(option.detail);
  }
  if (phone) await dialog.getByRole("button", { name: "Volver a la lista", exact: true }).click();
  await dialog.getByRole("button", { name: "Listo", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
}

/** «Crear catálogo»: el `POST` con su Idempotency-Key, 201, y el editor del catálogo creado. Devuelve el detalle. */
export async function createCatalog(page) {
  const response = await act(page, apiResponse("POST", catalogsApi),
    () => page.getByRole("button", { name: "Crear catálogo", exact: true }).filter({ visible: true }).first().click(), { status: 201 });
  assert.ok(response.request().headers()["idempotency-key"], "Crear manda su Idempotency-Key.");
  const { catalog } = await response.json();
  await page.waitForURL((url) => url.pathname === `${catalogsRoute}/${catalog.id}`);
  await page.getByText("Guardamos el catálogo.", { exact: true }).first().waitFor();
  return catalog;
}

/** «Guardar cambios», el de la banda o el fijo del teléfono: el `PUT` con su versión y «Guardamos el catálogo.». */
export async function saveCatalog(page, catalogId) {
  const response = await act(page, apiResponse("PUT", `${catalogsApi}/${catalogId}`),
    () => page.getByRole("button", { name: "Guardar cambios", exact: true }).filter({ visible: true }).last().click(), { status: 200 });
  await page.getByText("Guardamos el catálogo.", { exact: true }).first().waitFor();
  return response.json();
}

/**
 * «Así lo ve quien lo recibe» de un catálogo a mano: en la compu, al costado; en el teléfono, desde la barra. Abre la lista
 * como la dibuja WhatsApp y devuelve los textos de las opciones.
 */
export async function previewOptions(page, { phone = false } = {}) {
  let scope = page;
  if (phone) {
    await page.getByRole("button", { name: "Así lo ve quien lo recibe", exact: true }).click();
    scope = page.getByRole("dialog", { name: "Así lo ve quien lo recibe", exact: true });
  }
  const preview = scope.getByRole("group", { name: "Así lo ve quien lo recibe", exact: true }).first();
  await preview.getByRole("button", { name: /Elegí una opción/u }).click();
  const options = await preview.getByRole("radio").evaluateAll((radios) => radios.map((radio) => radio.closest("label")?.innerText.split("\n")[0].trim() ?? ""));
  if (phone) {
    await page.keyboard.press("Escape");
    await scope.waitFor({ state: "hidden" });
  }
  return options;
}

/**
 * «Importar» de la compu (no va en el teléfono): «Desde» en la pieza y lo pegado desde Excel (agrega) o un archivo (reemplaza);
 * «Revisar» devuelve la revisión sin guardar. Deja el diálogo abierto para aplicar o cancelar.
 */
export async function reviewImport(page, catalog, { paste, file, timeout = 120_000 }) {
  assert.ok((paste === undefined) !== (file === undefined), "Se importa lo pegado o un archivo, nunca los dos.");
  await page.getByRole("button", { name: "Importar", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: `Importar opciones a «${catalog.name}»`, exact: true });
  await dialog.waitFor();
  if (paste !== undefined) {
    await pick(page, dialog, "Desde", "Pegar desde Excel");
    await dialog.getByRole("textbox", { name: "Pegá acá las filas", exact: true }).fill(paste);
    await dialog.getByRole("table", { name: "Filas pegadas", exact: true }).waitFor();
  } else {
    await dialog.locator('input[type="file"]').setInputFiles(file);
    await dialog.getByText(typeof file === "string" ? file.split(/[\\/]/u).at(-1) : file.name, { exact: true }).waitFor();
  }
  const response = await act(page, apiResponse("POST", `${catalogsApi}/${catalog.id}/imports/previews`),
    () => dialog.getByRole("button", { name: "Revisar", exact: true }).click(), { status: 200, timeout });
  await dialog.getByText("Filas leídas", { exact: true }).waitFor({ timeout });
  return { dialog, review: await response.json() };
}

/** «Aplicar» lo revisado: el mismo archivo con su SHA-256 y la clave del intento; «Importamos las opciones.». */
export async function applyImport(page, catalog, dialog, { timeout = 180_000 } = {}) {
  const response = await act(page, apiResponse("POST", `${catalogsApi}/${catalog.id}/imports`),
    () => dialog.getByRole("button", { name: /^Aplicar/u }).click(), { status: 200, timeout });
  assert.ok(response.request().headers()["idempotency-key"], "Aplicar manda su Idempotency-Key.");
  await dialog.waitFor({ state: "hidden", timeout });
  await page.getByText("Importamos las opciones.", { exact: true }).first().waitFor();
  return response.json();
}

/** Lo que cuenta la revisión de una importación, para comparar en una línea. */
export function reviewCounts(review) {
  assert.ok(review && ["errors", "added", "changed", "deactivated"].every((key) => Number.isInteger(review[key]?.totalCount)), "La revisión trae sus cuatro listas.");
  return { rowsRead: review.rowsRead, unchanged: review.unchanged, errors: review.errors.totalCount, added: review.added.totalCount,
    changed: review.changed.totalCount, deactivated: review.deactivated.totalCount };
}

/**
 * Espera la vista previa de un catálogo con filtros que cumple `matches(pedido)`: se pide sola, con una espera, al cambiar
 * algo (sin «Probar»). Devuelve el pedido y la respuesta.
 */
export async function nextPreview(page, action, matches = () => true, { timeout = 30_000 } = {}) {
  const seen = [];
  const listener = async (response) => {
    if (!apiResponse("POST", `${catalogsApi}/previews`)(response)) return;
    try { seen.push({ request: response.request().postDataJSON(), status: response.status(), body: response.ok() ? await response.json() : null }); }
    catch { /* Una respuesta cortada por otra más nueva no cuenta. */ }
  };
  page.on("response", listener);
  try {
    await action();
    for (const deadline = Date.now() + timeout; ;) {
      const found = seen.find((item) => item.status === 200 && matches(item.request));
      if (found) return found;
      assert.ok(Date.now() < deadline, "La vista previa no se pidió con lo elegido.");
      await pause(200);
    }
  } finally { page.off("response", listener); }
}

/** La organización y el nombre de quien tiene la sesión, como los lee la pantalla (/api/me). */
export async function sessionOf(page) {
  const me = await assistantApi(page, { route: "/api/me" });
  assert.equal(me.status, 200, "La sesión lee /api/me.");
  return { tenantId: me.body.activeTenantId, name: me.body.displayName || me.body.email };
}

/**
 * El nombre visible de quien tiene la sesión, como lo guarda «Tus datos» (PUT /api/me con su versión) si todavía no tiene: los
 * miembros sin nombre no entran a un catálogo de miembros ni a su persona de ejemplo (MemberDirectoryReader).
 */
export async function ensureDisplayName(page, firstName, lastName) {
  const me = await assistantApi(page, { route: "/api/me" });
  assert.equal(me.status, 200, "La sesión lee /api/me.");
  if (me.body.displayName) return me.body.displayName;
  const saved = await assistantApi(page, { route: "/api/me", method: "PUT",
    body: { firstName, lastName, culture: me.body.culture, timeZoneId: me.body.timeZoneId, version: me.body.version } });
  assert.equal(saved.status, 200, `Guardar el nombre respondió ${saved.status}.`);
  return `${firstName} ${lastName}`;
}

/** Un nombre como lo muestra WhatsApp en una opción: más de 30 caracteres se cortan en 29 y «…» (decisión 36). */
export const optionText = (name) => name.length > 30 ? `${name.slice(0, 29)}…` : name;

/**
 * Elige la persona o el cliente de ejemplo en la pieza (262), que busca en la lista del servidor: la que empieza con `name`
 * o, si no está, la primera. Devuelve cómo se llama la elegida.
 */
export async function pickSample(page, scope, label, name) {
  await pickerButton(scope, label).click();
  const options = page.getByRole("listbox").getByRole("option");
  await options.first().waitFor();
  const wanted = name ? options.filter({ hasText: new RegExp(`^${escapeRegExp(name)}`, "u") }) : options;
  const chosen = await wanted.count() ? wanted.first() : options.first();
  const chosenName = (await chosen.innerText()).split(/\r?\n/u)[0].trim();
  await chosen.click();
  return chosenName;
}

/**
 * Los pasos, cada uno una función que devuelve lo que pasó. `ctx`: la pestaña de la organización (`page`), la de Plataforma
 * con su operador (`platformPage`), el ancho, la base, las sesiones del recorrido (`login(email, access, target)`, `signOut`)
 * la Dueña (`owner`) con su organización (`organization`) y el correo del operador (`operator`).
 */
export function formsSteps(ctx) {
  const { page, platformPage, width, base, owner, organization } = ctx;
  const phone = width < 768;
  const url = (route) => new URL(route, base).href;
  let tenantId; let ownerName; let manual;

  const asOwner = async () => {
    await page.goto(url("/org"));
    const loginBox = page.getByRole("textbox", { name: "Correo electrónico", exact: true }).or(page.getByRole("link", { name: "Ingresá", exact: true }));
    const inside = page.getByRole("button", { name: new RegExp(`, ${escapeRegExp(organization)}$`, "u") }).or(page.getByRole("navigation", { name: "Secciones", exact: true }));
    await loginBox.or(inside).filter({ visible: true }).first().waitFor({ timeout: 30_000 });
    if (await loginBox.filter({ visible: true }).count()) await ctx.login(owner, "business", page);
  };
  // Lo que usan los dos pasos: la Dueña adentro y Formularios prendido para su organización por Plataforma.
  const prepared = async () => {
    if (tenantId) return;
    await asOwner();
    ({ tenantId } = await sessionOf(page));
    // La Dueña se registró solo con su correo: con su nombre es la persona de ejemplo del catálogo de miembros.
    ownerName = await ensureDisplayName(page, "Dueña", `Recorrido ${width}`);
    await enableModule(platformPage, base, tenantId, formsModuleName, `Recorrido de Catálogos a ${width}.`, ctx.operator);
  };

  return {
    "01": async () => {
      await prepared();
      const list = await openCatalogs(page, base);
      assert.equal(list.totalCount, 0, "La organización empieza sin catálogos.");
      await page.getByText("Todavía no hay catálogos.", { exact: true }).filter({ visible: true }).first().waitFor();
      await startCatalog(page, { name: "Motivos de visita", description: "Por qué se visita a un cliente." });
      assert.match(await pickerButton(page, "Tipo de valor").innerText(), /Texto/u);
      await addOptions(page, visitReasons.map((text) => ({ text })), { phone });
      manual = await createCatalog(page);
      const shown = await previewOptions(page, { phone });
      assert.deepEqual(shown, visitReasons, `La vista previa muestra ${JSON.stringify(shown)}.`);
      if (phone) {
        assert.equal(await page.getByRole("button", { name: "Importar", exact: true }).count(), 0, "Importar no va en el teléfono.");
        return `«Motivos de visita» se creó con sus tres opciones y códigos generados; la vista previa del teléfono las muestra y no hay Importar.`;
      }
      const { dialog, review } = await reviewImport(page, manual, { paste: tsv(["Código", "Texto", "Detalle"], pastedReasons) });
      assert.deepEqual(reviewCounts(review), { rowsRead: 3, unchanged: 0, errors: 0, added: 3, changed: 0, deactivated: 0 });
      await applyImport(page, manual, dialog);
      await page.getByRole("textbox", { name: "Texto de Instalación", exact: true }).waitFor();
      return "«Motivos de visita» se creó con sus tres opciones y códigos generados; la vista previa las muestra, y pegar tres filas dio tres altas que «Aplicar» sumó.";
    },
    "02": async () => {
      await prepared();
      await openCatalogs(page, base);
      await startCatalog(page, { source: "Members", name: "Equipo activo" });
      await page.getByRole("heading", { name: "Qué miembros entran", exact: true }).first().waitFor();
      // La condición: la primera que propone es por rol; pasa a «Activo», que viene con «Sí».
      let previewScope = page;
      if (phone) {
        await page.getByRole("button", { name: "Agregar condición", exact: true }).click();
        const edit = page.getByRole("dialog", { name: "Editar condición", exact: true });
        await pick(page, edit, "Columna", "Activo");
        await edit.getByRole("button", { name: "Listo", exact: true }).click();
        await edit.waitFor({ state: "hidden" });
        await page.getByRole("button", { name: "Así lo ve quien lo recibe", exact: true }).click();
        previewScope = page.getByRole("dialog", { name: "Así lo ve quien lo recibe", exact: true });
      } else {
        await page.getByRole("button", { name: "Agregar condición", exact: true }).click();
        await pick(page, page, "Columna", "Activo");
      }
      let sample;
      const excluded = await nextPreview(page, async () => { sample = await pickSample(page, previewScope, "Persona", ownerName); },
        (request) => request.sampleMemberId && request.filters?.excludeRecipient === true && request.filters.conditions?.[0]?.column === "active");
      assert.ok(!excluded.body.options.some((option) => option.text === optionText(sample)), "Con la casilla, la persona de ejemplo no se elige a sí misma.");
      if (excluded.body.total === 0) await previewScope.getByText("Ninguna opción", { exact: true }).first().waitFor();
      if (phone) { await page.keyboard.press("Escape"); await previewScope.waitFor({ state: "hidden" }); }
      const included = await nextPreview(page, () => page.getByRole("checkbox", { name: "Sin incluir a quien lo recibe", exact: true }).click(),
        (request) => request.filters?.excludeRecipient === false);
      assert.equal(included.body.total, excluded.body.total + 1, "Sin la casilla, la persona de ejemplo es una opción más.");
      assert.ok(included.body.options.some((option) => option.text === optionText(sample)), "Sin la casilla, la persona de ejemplo está entre las opciones.");
      await page.getByRole("checkbox", { name: "Sin incluir a quien lo recibe", exact: true }).click();
      const created = await createCatalog(page);
      assert.equal(created.source, "Members");
      await page.reload();
      await page.getByRole("heading", { name: "Qué miembros entran", exact: true }).first().waitFor();
      const detail = await assistantApi(page, { route: `${catalogsApi}/${created.id}` });
      assert.equal(detail.status, 200);
      assert.deepEqual(detail.body.filters.conditions, [{ column: "active", operator: "is", values: ["true"] }]);
      assert.equal(detail.body.filters.excludeRecipient, true);
      assert.equal(detail.body.sample?.name, sample);
      assert.equal(await page.getByRole("checkbox", { name: "Sin incluir a quien lo recibe", exact: true }).isChecked(), true);
      await ctx.signOut(page, organization);
      return `«Equipo activo» se creó con «Activo es Sí» y la persona de ejemplo: con la casilla, ${excluded.body.total} opciones sin ella; sin la casilla, ${included.body.total}. La condición, la persona y la casilla siguen al volver.`;
    },
  };
}

/** Sigue a las acciones del asistente en las mismas pestañas; arranca y termina con la Dueña afuera. */
export async function runFormsJourney(ctx) {
  assert.ok(ctx?.platformPage && ctx.page && typeof ctx.base === "object", "Catálogos necesita la pestaña de la organización y la de Plataforma.");
  assert.ok([ctx.record, ctx.login, ctx.signOut].every((value) => typeof value === "function")
    && [ctx.owner, ctx.organization, ctx.operator].every((value) => typeof value === "string" && value.length > 0),
    "Catálogos sigue al recorrido: necesita sus sesiones, la Dueña, su organización y el operador.");
  const steps = formsSteps(ctx);
  for (const { id } of formsDefinitions) {
    const key = id.slice("FRM-".length);
    await ctx.record(id, ctx.width, () => ctx.page, steps[key],
      (error) => `Ruta ${new URL(ctx.page.url()).pathname}; ${error.name}. Los correos y los códigos se omiten.`);
  }
}
