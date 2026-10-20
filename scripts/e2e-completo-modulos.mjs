import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { assistantHomeRoute, assistantLogin, acceptAssistantNoticeFromHome } from "./assistant-real-ui.mjs";
import { createAssistantControl } from "./assistant-real-control.mjs";
import { assertViewport } from "./e2e-completo-personal.mjs";

const def = (id, actor, action, route, expected, covers = [], extra = {}) => ({ id: "MOD-" + id, area: "Asistente y WhatsApp", actor, action, route, expected, covers, critical: true, ...extra });
const wrongAccess = [
  ["05", "Asistente de organización", "/api/organization/assistant"],
  ["06", "Asistente de Plataforma", "/api/platform/assistant"],
  ["07", "Catálogo de modelos de Plataforma", "/api/platform/assistant/models"],
  ["08", "Configuración de Plataforma", "/api/platform/assistant/settings"],
  ["09", "Uso de Plataforma", "/api/platform/assistant/usage"],
  ["10", "Chats de organización", "/api/organization/whatsapp/customers/conversations"],
  ["11", "Consultas de Plataforma", "/api/platform/whatsapp/conversations"],
];
export const moduleDefinitions = [
  def("01", "Persona A", "Preparar conversación y PNG propios", "/asistente", "Registro por UI, proveedor controlado, aviso aceptado por UI y recursos privados reales.", [], { setup: true }),
  def("02", "Persona B", "Preparar otra persona independiente", "/asistente", "Otra cuenta creada por UI, con asistente configurado y aviso propio.", [], { setup: true }),
  def("03", "Persona B", "Consultar conversación existente de A", "/api/me/assistant/conversations/:id", "404 Assistant.Conversation.NotFound con traceId, sin título ni mensajes de A.", ["BACK-AS-014"]),
  def("04", "Persona B", "Descargar PNG existente de A", "/api/me/assistant/conversations/:id/attachments/:id", "404 del recurso privado, sin bytes del PNG ni metadatos de A."),
  ...wrongAccess.map(([id, action, route]) => def(id, "Persona B con token consumer", "Denegar " + action + " desde Personal", route, "403 Tenancy.Access.Wrong con traceId; no se leen datos del otro acceso.")),
  def("12", "Dueño A", "Registrar organización nueva para probar módulos apagados", "/registro/empresa", "Organización propia creada por UI, sin habilitar automáticamente Asistente ni WhatsApp.", [], { setup: true }),
  def("13", "Dueño A", "Consultar Asistente apagado", "/api/organization/assistant", "Estado y configuración devuelven 404 Http.NotFound antes de evaluar permisos."),
  def("14", "Dueño A", "Abrir la pantalla del Asistente apagado", "/org/asistente", "Muestra No encontramos esta página y no presenta un compositor ni enlaces de configuración utilizables."),
  def("15", "Dueño A", "Consultar WhatsApp apagado", "/api/organization/whatsapp", "Chats, contactos, números y difusiones devuelven 404 Http.NotFound."),
  def("16", "Dueño A", "Abrir una bandeja WhatsApp apagada", "/org/whatsapp/chats", "Muestra No encontramos esta página y no ofrece el área WhatsApp como utilizable."),
  def("17", "Dueño A", "Preparar asistente y miembro sin roles", "/org/usuarios", "El control configura sólo el proveedor E2E; la invitación por UI no concede roles y se crean conversación/PNG privados de A.", [], { setup: true }),
  def("18", "Miembro sin permisos", "Abrir el chat del Asistente habilitado", "/org/asistente", "La UI muestra Sin permiso; la API responde 403 Http.Forbidden y los permisos efectivos no incluyen assistant.use.", ["BACK-AS-003"]),
  def("19", "Miembro sin permisos", "Abrir Configuración del Asistente", "/org/asistente/configuracion", "UI y API deniegan acceso; no recibe claves, modelos configurados ni valores de configuración."),
  def("20", "Miembro sin permisos", "Abrir Uso del Asistente", "/org/asistente/uso", "UI y API deniegan acceso; no recibe uso de otras personas ni costos."),
  def("21", "Miembro sin permisos", "Intentar escribir OwnKey sin permiso", "/api/organization/assistant/settings", "403 Http.Forbidden antes de leer o escribir configuración, sin clave real."),
  def("22", "Dueño sin política OwnKey", "Intentar habilitar una clave propia no autorizada", "/org/asistente/configuracion", "403 Assistant.Settings.OwnKeyNotAllowed y modo/versión guardados intactos; no se inventa una clave de Anthropic."),
  def("23", "Dueño con token business", "Consultar asistente Personal", "/api/me/assistant", "403 Tenancy.Access.Wrong: pertenecer a una organización no mezcla los historiales de los accesos."),
  def("24", "Dueño con token business", "Consultar modelos globales de Plataforma", "/api/platform/assistant/models", "403 Tenancy.Access.Wrong, sin catálogo global."),
  def("25", "Dueño con token business", "Consultar Mensajes de una persona", "/api/me/whatsapp/conversations", "403 Tenancy.Access.Wrong; el permiso B2B no permite leer las copias B2C."),
  def("26", "Dueño B", "Registrar otra organización independiente", "/registro/empresa", "Otra cuenta/organización creadas por UI, con proveedor controlado propio.", [], { setup: true }),
  def("27", "Dueño B", "Consultar conversación real de A desde B", "/api/organization/assistant/conversations/:id", "404 Assistant.Conversation.NotFound aunque ambos sean Dueños y ambos módulos estén habilitados.", ["BACK-AS-014"]),
  def("28", "Dueño B", "Descargar PNG real de A desde B", "/api/organization/assistant/conversations/:id/attachments/:id", "404 del archivo privado; no entrega bytes ni metadatos de la otra organización."),
  def("29", "Operador con todos los permisos", "Habilitar WhatsApp en las dos organizaciones", "/plataforma/organizaciones/:id", "Prender con motivo y versión por UI habilita el módulo sin conectar Meta.", [], { setup: true }),
  def("30", "Dueño A", "Conectar un número por el canal controlado", "/org/whatsapp/numeros", "El número sintético existe realmente en A y su API autenticada lo devuelve; no se certifica Meta.", [], { setup: true }),
  def("31", "Dueño B", "Consultar el número real de A desde B", "/api/organization/whatsapp/numbers/:id", "404 WhatsApp.Number.NotFound con traceId, sin teléfono ni nombre de A.", ["BACK-WA-021"]),
  def("32", "Miembro sin permisos WhatsApp", "Abrir cada bandeja y gestión habilitadas", "/org/whatsapp/chats", "Con módulo prendido, cada UI muestra Sin permiso y cada API responde 403; no obtiene chats, contactos, difusiones o administración.", ["BACK-WA-020"]),
  def("33", "Actores de esta suite", "Cerrar las sesiones por UI", "/org · /plataforma", "Salir cierra las sesiones pública y de Plataforma antes del siguiente ancho."),
];

export async function requireModuleProblem(response, status, codes) {
  assert.equal(response.status(), status, "La ruta real debe responder " + status + ".");
  const problem = await response.json();
  assert.ok(codes.includes(problem.code), "El rechazo debe tener el código propio de esta política.");
  assert.ok(typeof problem.traceId === "string" && problem.traceId.length > 0, "ProblemDetails debe incluir traceId.");
  for (const field of ["conversation", "messages", "bytes", "file", "phone", "displayNumber", "apiKey"]) assert.equal(Object.hasOwn(problem, field), false, "Un rechazo no entrega datos privados.");
  return problem;
}

export function ownKeyRequest(settings) {
  return { mode: "OwnKey", modelId: settings.modelId, effort: settings.effort, dailyMessageLimit: settings.dailyMessageLimit,
    monthlyBudget: settings.monthlyBudget, keyAction: "keep", apiKey: null, version: settings.version };
}

export async function runModuleDependency(h, outcomes, id, dependencies, getPage, action) {
  const missing = dependencies.filter((key) => outcomes.get(key)?.ok !== true);
  if (missing.length) {
    const blocked = { ok: false, blocked: true };
    outcomes.set(id, blocked);
    await h.block(id, "Faltó preparar: " + missing.join(", ") + ".", getPage());
    return blocked;
  }
  const outcome = await h.record(id, getPage, action);
  outcomes.set(id, outcome);
  return outcome;
}

const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jh5kAAAAASUVORK5CYII=", "base64");
const heading = (page, name) => page.getByRole("heading", { name, exact: true }).waitFor();
const forbidden = "No tenés permiso para ver esta página";
const notFound = "No encontramos esta página";
const wrong = ["Tenancy.Access.Wrong"];
const noPermission = ["Http.Forbidden"];
const privateMissing = ["Assistant.Conversation.NotFound", "Assistant.Attachment.NotFound"];

async function read(h, page, route) {
  const response = await h.api(page, route);
  assert.equal(response.status(), 200, "La lectura propia debe responder 200.");
  return response.json();
}

async function prepareAssistant(h, page, actor, control) {
  await control("prepare", { email: actor.email, access: actor.me.access, ...(actor.me.activeTenantId ? { tenantId: actor.me.activeTenantId } : {}) });
  await page.goto(new URL(assistantHomeRoute(actor.me.access, h.width), h.base).href);
  await acceptAssistantNoticeFromHome(page);
  assert.equal((await read(h, page, actor.me.access === "consumer" ? "/api/me/assistant" : "/api/organization/assistant")).noticeAccepted, true);
}

async function createPrivateResources(h, page, prefix) {
  const created = await h.api(page, prefix + "/conversations", { method: "POST", data: {}, headers: { "Idempotency-Key": randomUUID() } });
  assert.equal(created.status(), 201);
  const conversation = await created.json();
  const uploaded = await h.api(page, prefix + "/conversations/" + conversation.id + "/attachments", { method: "POST", headers: { "Idempotency-Key": randomUUID() },
    multipart: { conversationVersion: String(conversation.version), file: { name: "privado-e2e.png", mimeType: "image/png", buffer: png } } });
  assert.equal(uploaded.status(), 201);
  const attachment = await uploaded.json();
  assert.equal((await h.api(page, prefix + "/conversations/" + conversation.id + "/attachments/" + attachment.id)).status(), 200);
  return { conversation, attachment };
}

async function inviteEmpty(h, page, email) {
  await page.goto(new URL("/org/usuarios", h.base).href);
  await page.getByRole("button", { name: "Invitar usuario", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Invitar usuario", exact: true });
  await dialog.getByRole("textbox", { name: "Correo", exact: true }).fill(email);
  const issued = page.waitForResponse((response) => new URL(response.url()).pathname === "/api/users/invitations" && response.request().method() === "POST");
  await dialog.getByRole("button", { name: "Invitar", exact: true }).click();
  assert.equal((await issued).status(), 201);
  await dialog.waitFor({ state: "hidden" });
}

async function turnOnWhatsApp(h, page, tenantId) {
  await page.goto(new URL("/plataforma/organizaciones/" + tenantId + "?tab=modules", h.base).href);
  await page.getByRole("tab", { name: /^Módulos/ }).click();
  await page.getByRole("button", { name: "Acciones de WhatsApp", exact: true }).click();
  await page.getByRole("menuitem", { name: "Prender", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("textbox", { name: /Motivo/ }).fill("Prueba integral aislada de permisos e identidad de los módulos.");
  const changed = page.waitForResponse((response) => new URL(response.url()).pathname === "/api/platform/tenants/" + tenantId + "/features/whatsapp" && response.request().method() === "PUT");
  await dialog.getByRole("button", { name: "Prender", exact: true }).click();
  assert.equal((await changed).status(), 200);
  await dialog.waitFor({ state: "hidden" });
}

export async function runModuleCases(h) {
  const page = await h.newPage();
  const platformPage = await h.newPage();
  const outcomes = new Map();
  const control = createAssistantControl(h.env.command);
  const tag = randomUUID().slice(0, 8);
  const emptyEmail = "e2e-modulos-vacio-" + tag + "@example.test";
  const operatorEmail = h.width === 1440 ? "e2e-5d-operator@example.test" : "e2e-a9-operator@example.test";
  let current;
  let platformOpen = false;
  let personA; let personB; let personalResources;
  let ownerA; let ownerB; let organizationResources; let numberId;
  const run = (id, deps, action, target = page) => runModuleDependency(h, outcomes, "MOD-" + id, deps.map((key) => "MOD-" + key), () => target, action);
  const signOut = async () => { if (current) { await h.signOut(page); current = null; } };
  const as = async (email, access = "business") => {
    if (current?.email === email && current.access === access) return read(h, page, "/api/me");
    await signOut();
    await assistantLogin(page, h.env, h.base, email, access);
    current = { email, access };
    return read(h, page, "/api/me");
  };
  try {
    await run("01", [], async () => {
      personA = await h.registerPerson(page); current = { email: personA.email, access: "consumer" };
      await prepareAssistant(h, page, personA, control);
      personalResources = await createPrivateResources(h, page, "/api/me/assistant");
      return "Persona A y sus recursos privados existen por UI/API reales en la base aislada.";
    });
    await run("02", ["01"], async () => {
      await signOut(); personB = await h.registerPerson(page); current = { email: personB.email, access: "consumer" };
      await prepareAssistant(h, page, personB, control);
      assert.notEqual(personB.me.id, personA.me.id);
      return "Persona B independiente, con el aviso propio aceptado por UI.";
    });
    await run("03", ["01", "02"], async () => {
      await requireModuleProblem(await h.api(page, "/api/me/assistant/conversations/" + personalResources.conversation.id), 404, ["Assistant.Conversation.NotFound"]);
      return "Una conversación existente de otra persona devolvió 404 propio del recurso, sin datos.";
    });
    await run("04", ["01", "02"], async () => {
      await requireModuleProblem(await h.api(page, "/api/me/assistant/conversations/" + personalResources.conversation.id + "/attachments/" + personalResources.attachment.id), 404, privateMissing);
      return "El PNG existente de otra persona no se descargó: 404 del recurso privado.";
    });
    for (const [id, , route] of wrongAccess) await run(id, ["02"], async () => {
      await requireModuleProblem(await h.api(page, route), 403, wrong);
      return "El token consumer fue rechazado con Tenancy.Access.Wrong y traceId antes de leer el otro acceso.";
    });
    await run("12", [], async () => {
      await signOut(); ownerA = await h.registerBusiness(page); current = { email: ownerA.email, access: "business" };
      assert.equal(ownerA.me.features.includes("assistant"), false); assert.equal(ownerA.me.features.includes("whatsapp"), false);
      return "Organización A nueva, con ambos módulos apagados y Dueño real.";
    });
    await run("13", ["12"], async () => {
      for (const route of ["/api/organization/assistant", "/api/organization/assistant/settings"]) await requireModuleProblem(await h.api(page, route), 404, ["Http.NotFound"]);
      return "Asistente apagado ocultó estado y configuración con 404 Http.NotFound.";
    });
    await run("14", ["12"], async () => {
      await page.goto(new URL("/org/asistente", h.base).href); await heading(page, notFound);
      assert.equal(await page.getByRole("textbox", { name: "Tu consulta", exact: true }).count(), 0);
      assert.equal(await page.getByRole("link", { name: "Asistente", exact: true }).filter({ visible: true }).count(), 0);
      await assertViewport(page);
      return "La ruta directa del módulo apagado mostró 404 y ningún compositor ni enlace utilizable.";
    });
    await run("15", ["12"], async () => {
      for (const suffix of ["customers/conversations", "contacts", "numbers", "broadcasts"]) await requireModuleProblem(await h.api(page, "/api/organization/whatsapp/" + suffix), 404, ["Http.NotFound"]);
      return "Las cuatro áreas de WhatsApp apagado quedaron ocultas por 404.";
    });
    await run("16", ["12"], async () => {
      await page.goto(new URL("/org/whatsapp/chats", h.base).href); await heading(page, notFound);
      assert.equal(await page.getByRole("link", { name: /^Chats(?: \d+)?$/ }).filter({ visible: true }).count(), 0);
      await assertViewport(page);
      return "WhatsApp apagado mostró 404 sin bandeja ni navegación utilizable.";
    });
    await run("17", ["12"], async () => {
      await prepareAssistant(h, page, ownerA, control);
      organizationResources = await createPrivateResources(h, page, "/api/organization/assistant");
      await inviteEmpty(h, page, emptyEmail);
      return "Asistente preparado en A y una invitación sin roles creada por UI; conversación y PNG privados propios existentes.";
    });
    await run("18", ["17"], async () => {
      const member = await as(emptyEmail);
      assert.deepEqual(member.effectivePermissions.organization, []);
      assert.equal(member.features.includes("assistant"), true);
      await requireModuleProblem(await h.api(page, "/api/organization/assistant"), 403, noPermission);
      await page.goto(new URL("/org/asistente", h.base).href); await heading(page, forbidden);
      assert.equal(await page.getByRole("textbox", { name: "Tu consulta", exact: true }).count(), 0);
      await assertViewport(page);
      return "Con el módulo habilitado, el miembro sin roles recibió 403 y una pantalla Sin permiso sin compositor.";
    });
    for (const [id, suffix] of [["19", "configuracion"], ["20", "uso"]]) await run(id, ["18"], async () => {
      const endpoint = suffix === "uso" ? "usage" : "settings";
      await requireModuleProblem(await h.api(page, "/api/organization/assistant/" + endpoint), 403, noPermission);
      await page.goto(new URL("/org/asistente/" + suffix, h.base).href); await heading(page, forbidden);
      await assertViewport(page);
      return "La pantalla y su API denegaron el permiso de administración sin exponer datos.";
    });
    await run("21", ["18"], async () => {
      await requireModuleProblem(await h.api(page, "/api/organization/assistant/settings", { method: "PUT", data: { mode: "OwnKey" } }), 403, noPermission);
      return "La escritura de configuración fue rechazada por permiso antes de validar o guardar el cuerpo.";
    });
    await run("22", ["17"], async () => {
      await as(ownerA.email);
      const settings = await read(h, page, "/api/organization/assistant/settings"); assert.equal(settings.allowOwnKey, false);
      await requireModuleProblem(await h.api(page, "/api/organization/assistant/settings", { method: "PUT", data: ownKeyRequest(settings) }), 403, ["Assistant.Settings.OwnKeyNotAllowed"]);
      const preserved = await read(h, page, "/api/organization/assistant/settings");
      assert.equal(preserved.version, settings.version); assert.equal(preserved.mode, settings.mode);
      await page.goto(new URL("/org/asistente/configuracion", h.base).href);
      await heading(page, "Configuración"); await assertViewport(page);
      return "La política impidió OwnKey con el modo y la versión intactos, sin enviar una clave real.";
    });
    for (const [id, route] of [["23", "/api/me/assistant"], ["24", "/api/platform/assistant/models"], ["25", "/api/me/whatsapp/conversations"]]) await run(id, ["22"], async () => {
      await requireModuleProblem(await h.api(page, route), 403, wrong);
      return "El token Business no autorizó recursos de Personal ni de Plataforma.";
    });
    await run("26", [], async () => {
      await signOut(); ownerB = await h.registerBusiness(page); current = { email: ownerB.email, access: "business" };
      assert.notEqual(ownerB.me.activeTenantId, ownerA?.me.activeTenantId);
      await prepareAssistant(h, page, ownerB, control);
      return "Organización B independiente creada por UI, con su Asistente habilitado y su aviso aceptado.";
    });
    await run("27", ["17", "26"], async () => {
      await requireModuleProblem(await h.api(page, "/api/organization/assistant/conversations/" + organizationResources.conversation.id), 404, ["Assistant.Conversation.NotFound"]);
      return "El Dueño de B no pudo leer la conversación existente del Dueño de A.";
    });
    await run("28", ["17", "26"], async () => {
      await requireModuleProblem(await h.api(page, "/api/organization/assistant/conversations/" + organizationResources.conversation.id + "/attachments/" + organizationResources.attachment.id), 404, privateMissing);
      return "El Dueño de B no recibió el PNG existente de A ni sus metadatos.";
    });
    await run("29", ["12", "26"], async () => {
      await assistantLogin(platformPage, h.env, h.base, operatorEmail, "platform"); platformOpen = true;
      await turnOnWhatsApp(h, platformPage, ownerA.me.activeTenantId);
      await turnOnWhatsApp(h, platformPage, ownerB.me.activeTenantId);
      return "El operador prendió WhatsApp con motivo por UI en ambas organizaciones aisladas, sin Meta.";
    }, platformPage);
    await run("30", ["29"], async () => {
      await as(ownerA.email);
      const cursor = await h.env.whatsapp.begin("integral-numero-" + h.width + "-" + tag, h.width === 1440 ? "+5491134567896" : "+5491134567897");
      numberId = (await cursor("orgNumber", { tenantId: ownerA.me.activeTenantId })).numberId;
      assert.match(numberId, /^[0-9a-f-]{36}$/iu);
      await read(h, page, "/api/organization/whatsapp/numbers/" + numberId);
      await page.goto(new URL("/org/whatsapp/numeros", h.base).href); await heading(page, "Números"); await assertViewport(page);
      return "El número creado por el canal de Testing existe y su Dueño lo puede leer; Meta queda a mano.";
    });
    await run("31", ["26", "30"], async () => {
      await as(ownerB.email);
      await requireModuleProblem(await h.api(page, "/api/organization/whatsapp/numbers/" + numberId), 404, ["WhatsApp.Number.NotFound"]);
      return "Con el módulo prendido en B, el número real de A respondió 404 WhatsApp.Number.NotFound sin datos.";
    });
    await run("32", ["18", "29"], async () => {
      const member = await as(emptyEmail); assert.equal(member.features.includes("whatsapp"), true);
      const areas = [["chats", "customers/conversations"], ["contactos", "contacts"], ["difusiones", "broadcasts"], ["numeros", "numbers"], ["bot", "numbers"], ["equipos", "teams"], ["plantillas", "templates"]];
      for (const [route, endpoint] of areas) {
        await requireModuleProblem(await h.api(page, "/api/organization/whatsapp/" + endpoint), 403, noPermission);
        await page.goto(new URL("/org/whatsapp/" + route, h.base).href); await heading(page, forbidden);
      }
      await requireModuleProblem(await h.api(page, "/api/organization/whatsapp/internal/conversations"), 403, noPermission);
      await assertViewport(page);
      return "Con WhatsApp prendido, Clientes/Internos, Contactos, Difusiones, Números, Bot, Equipos y Plantillas denegaron el permiso.";
    });
    await run("33", [], async () => {
      await signOut();
      if (platformOpen) { await h.signOut(platformPage); platformOpen = false; }
      return "Se cerraron por UI las sesiones pública y de Plataforma que abrió esta suite.";
    });
  } finally {
    await page.close(); await platformPage.close();
  }
  return outcomes;
}
