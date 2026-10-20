import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { fillOtp } from "./test-e2e-real-ui.mjs";
import { forceBusinessLogin, clickForResponse, invitationTokenFromMessage, requireOrganizationPermissions } from "./e2e-completo-negocio.mjs";
import { assistantLogin } from "./assistant-real-ui.mjs";
import { nationalPhone, outboundCount } from "./recorrido-usuario-e11.mjs";
import { setTimeout as delay } from "node:timers/promises";
import { sendWithCooldown } from "./recorrido-usuario-whatsapp.mjs";
import { responsesForAction } from "./test-e2e-real-whatsapp-action.mjs";
import { requireModuleProblem, runModuleDependency } from "./e2e-completo-modulos.mjs";
import { assertViewport } from "./e2e-completo-personal.mjs";

const root = "/api/organization/whatsapp";
const def = (id, actor, action, route, expected, covers = [], extra = {}) => ({
  id: "WAS-" + id, area: "WhatsApp · complemento E11", actor, action, route, expected, covers,
  source: "scripts/e2e-completo-whatsapp-complemento.mjs", critical: true, ...extra,
});
export const supplementWhatsAppDefinitions = [
  def("01", "Dueño y operador", "Preparar organización, agente y número controlado", "/registro/empresa", "Cuentas creadas por UI, módulo prendido por operador y número Connected del control Testing.", [], { setup: true }),
  def("02", "Cliente con Phone verificado", "Preparar vínculo real con su cuenta", "/registro · /mensajes", "OTP real de Testing y webhook/worker vinculan el cliente; sólo se copiará desde ese momento.", [], { setup: true }),
  def("03", "Dueño y agente", "Preparar roles separados e invitación real", "/org/roles/nuevo · /org/usuarios", "La cuenta B2C del agente no lee las copias del cliente; invitación aceptada por UI y acceso Business con exactamente whatsapp.customers.", [], { setup: true }),
  def("04", "Dos agentes de Clientes", "Tomar simultáneamente el mismo chat y rechazar el mensaje perdedor", "/org/whatsapp/chats/:id", "Uno toma, otro recibe 409 TakenByOther con su nombre; el mensaje perdedor no se guarda ni sale. Respuesta y nota propias quedan verificadas.", ["BACK-WA-008"]),
  def("05", "Miembro con atención Internos", "Atender un mensaje de miembro activo sin permiso Clientes", "/org/whatsapp/chats?inbox=internal", "Phone verificado de miembro activo llega a Internos; agente con sólo whatsapp.internal toma y responde y Clientes devuelve 403.", ["BACK-WA-010"]),
  def("06", "Cliente por transporte controlado", "Dar de baja promociones con el botón real del bot", "/org/whatsapp/contactos/:id", "Accepted pasa a Unsubscribed con origen/fecha y confirmación real del bot; no certifica una difusión pendiente.", [], { partialOf: ["BACK-WA-018"] }),
  def("07", "Dueño con atención Clientes", "Revisar CSV/XLSX, límites y conservar una baja al importar", "/org/whatsapp/contactos", "Preview no guarda, informa fila/motivo; CSV/XLSX y 5000 filas aceptados, 5001 rechazadas; importar no revierte Unsubscribed.", ["BACK-WA-013"]),
  def("08", "Dueño con permiso de invitar", "Confirmar Cargar teléfonos con empresa y rol", "/org/usuarios/cargar-telefonos", "El POST real reserva la invitación con empresa/rol elegidos; no certifica el rechazo 503 sin canal o pago.", [], { partialOf: ["BACK-WA-015"] }),
  def("09", "Persona B2C vinculada", "Leer Mensajes y desvincular por UI", "/mensajes/:id", "Sólo copias propias posteriores al vínculo, sin nota ni autor interno; Desvincular borra copias/vínculo y conserva el chat de la organización.", ["BACK-WA-019"]),
  def("10", "Actores del complemento", "Salir de todas las sesiones por UI", "/ · /org · /plataforma", "Las pestañas de Persona, Dueño, agente y operador salen por UI antes de cerrar."),
];

// Son límites de preparación/observación del protocolo existente, no resultados aprobados.
export const supplementWhatsAppLimitations = {
  "BACK-WA-015": { partialExecutionIds: ["WAS-08"], missing: "503 sin canal de Plataforma o sin pago, y ausencia de envíos en esas condiciones.", reason: "CanInvite usa WhatsAppPlatformChannelState Connected. Desconectar un número de organización no cambia ese canal; la UI/API de Plataforma no ofrece desconectarlo y el control Browser no prepara PaymentMissing. El bridge de cuotas pertenece al Asistente.", source: ["src/ArquitecturaBaseMultitenant.Application/Modules/WhatsApp/Services/WhatsAppPhoneImportResolver.cs", "src/ArquitecturaBaseMultitenant.Infrastructure/Modules/WhatsApp/WhatsAppChannelSettings.cs", "tests/ArquitecturaBaseMultitenant.Api.IntegrationTests/TestFeatures/WhatsAppBrowser/WhatsAppBrowserControl.Organization.cs"] },
  "BACK-WA-018": { partialExecutionIds: ["WAS-06"], missing: "Una difusión pendiente relee la baja y omite al destinatario.", reason: "El control actual prepara un canal y procesa entradas del bot, pero no una plantilla aprobada ni una difusión pendiente. WAS-06 sólo comprueba la baja real, su origen/fecha y confirmación.", source: ["tests/ArquitecturaBaseMultitenant.Api.IntegrationTests/TestFeatures/WhatsAppBrowser/WhatsAppBrowserControl.Organization.cs"] },
  "BACK-WA-025": { partialExecutionIds: [], missing: "Respuesta neutra al operador sin enlace, nombre ni tipo de cuenta.", reason: "El comando bot del control devuelve una prueba LinkUrl o falla si no existe. events sólo expone metadatos; ninguno permite inspeccionar la respuesta neutra del bot de Plataforma sin ampliar el control existente.", source: ["tests/ArquitecturaBaseMultitenant.Api.IntegrationTests/TestFeatures/WhatsAppBrowser/WhatsAppBrowserControl.cs"] },
};

export function requireTakeRace(replies) {
  assert.equal(replies.length, 2);
  assert.equal(replies.filter((reply) => reply.status === 200).length, 1, "Sólo un agente debe ganar la toma.");
  assert.equal(replies.filter((reply) => reply.status === 409).length, 1, "El otro agente debe recibir 409.");
  const winnerIndex = replies.findIndex((reply) => reply.status === 200);
  const winner = replies[winnerIndex].body;
  const problem = replies[1 - winnerIndex].body;
  assert.equal(problem.code, "WhatsApp.Conversation.TakenByOther");
  assert.ok(typeof problem.traceId === "string" && problem.traceId.length > 0);
  assert.ok(typeof winner.assignee?.name === "string" && winner.assignee.name.length > 0);
  assert.equal(problem.takenBy, winner.assignee.name);
  return { winnerIndex, winner, problem };
}

export function requirePersonalCopies(detail, { answer, note, beforeLink }) {
  const messages = detail.messages.items;
  assert.ok(messages.some((message) => message.text === answer), "La copia debe contener la respuesta posterior al vínculo.");
  assert.ok(messages.every((message) => message.kind !== "Note" && message.author == null), "Mensajes no publica notas ni autores internos.");
  for (const text of [note, beforeLink].filter(Boolean)) assert.ok(messages.every((message) => message.text !== text), "Mensajes no copia contenido privado ni previo al vínculo.");
}

export function contactImportCsv({ first, second, unsubscribed }) {
  for (const value of [first, second, unsubscribed]) assert.match(value, /^\+54911345678\d{2}$/u, "Sólo teléfonos sintéticos del escenario.");
  return ["Nombre;Teléfono;Etiqueta;Acepta promociones",
    "Nuevo uno;" + first + ";VIP;Sí", "Nuevo dos;" + second + ";;no", "Inválido;123;;",
    "Repetido;" + first + ";;", "Con baja;" + unsubscribed + ";;Sí"].join("\n");
}

export async function closeSupplementSessions(signedIn, signOut) {
  const failures = [];
  for (const page of [...signedIn].reverse()) {
    try { await signOut(page); signedIn.delete(page); }
    catch (error) { failures.push(error); }
  }
  if (failures.length) throw new AggregateError(failures, "No salieron todas las sesiones del complemento por UI.");
}

const heading = (page, name) => page.getByRole("heading", { name, exact: true }).waitFor();
const responseAt = (route, method = "GET") => (response) => new URL(response.url()).pathname === route && response.request().method() === method;
async function read(h, page, route) {
  const response = await h.api(page, route); assert.equal(response.status(), 200, "La lectura privada real debe responder 200.");
  return response.json();
}
async function mark(page, checkbox, checked) {
  if (await checkbox.isChecked() === checked) return;
  const id = await checkbox.getAttribute("id");
  if (id && await page.locator('label[for="' + id + '"]').count()) await page.locator('label[for="' + id + '"]').click();
  else await checkbox.click();
  assert.equal(await checkbox.isChecked(), checked);
}
async function chooseRole(page, width, label, name, checked = true) {
  await page.getByRole("button", { name: new RegExp("^" + label) }).click();
  if (width === 390) {
    const sheet = page.getByRole("dialog", { name: label, exact: true });
    await mark(page, sheet.getByRole("checkbox", { name, exact: true }), checked);
    await sheet.getByRole("button", { name: "Listo", exact: true }).click();
  } else {
    const option = page.getByRole("menuitemcheckbox", { name, exact: true });
    if (await option.getAttribute("aria-checked") !== String(checked)) await option.click();
    await page.keyboard.press("Escape");
  }
}
async function createRole(h, page, name, permission) {
  const catalog = await read(h, page, "/api/permissions");
  const group = catalog.find((entry) => entry.permissions.some((item) => item.code === permission));
  assert.ok(group);
  const item = group.permissions.find((entry) => entry.code === permission);
  await page.goto(new URL("/org/roles/nuevo", h.base).href);
  await page.getByRole("textbox", { name: "Nombre", exact: true }).fill(name);
  await page.getByRole("combobox", { name: "Vale en", exact: true }).click();
  await page.getByRole("option", { name: "Toda la organización", exact: true }).click();
  await page.getByRole("button", { name: "Abrir o cerrar " + group.name, exact: true }).click();
  await mark(page, page.getByRole("checkbox", { name: item.name, exact: true }), true);
  const created = await clickForResponse(page, page.getByRole("button", { name: "Crear rol", exact: true }), "/api/roles", "POST", 201);
  const id = await created.json(); assert.match(id, /^[0-9a-f-]{36}$/iu);
  assert.deepEqual((await read(h, page, "/api/roles/" + id)).permissions, [permission]);
  return { id, name };
}
async function setName(h, page, name) {
  await page.goto(new URL("/cuenta", h.base).href); await heading(page, "Mi cuenta");
  await page.getByRole("textbox", { name: "Nombre", exact: true }).fill(name);
  await clickForResponse(page, page.getByRole("button", { name: "Guardar cambios", exact: true }), "/api/me", "PUT");
}
async function moreAction(page, label) {
  await page.getByRole("button", { name: /^Acciones de / }).first().click();
  return page.getByRole("menuitem", { name: label, exact: true });
}
async function takeButton(page, width) {
  return width === 390 ? moreAction(page, "Tomar") : page.getByRole("button", { name: "Tomar", exact: true });
}
async function openImport(page, width) {
  await page.getByRole("button", { name: width === 390 ? "Importar" : "Importar contactos", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Importar contactos", exact: true });
  await dialog.waitFor(); return dialog;
}
async function uploadPreview(page, dialog, file, status = 200) {
  const response = page.waitForResponse(responseAt(root + "/contacts/import/preview", "POST"));
  void response.catch(() => {});
  await dialog.locator('input[type="file"]').setInputFiles(file);
  const reply = await response; assert.equal(reply.status(), status); return reply.json();
}
async function registerPhone(h, page, phone, cursor) {
  await page.goto(new URL("/registro", h.base).href);
  await page.getByRole("button", { name: "WhatsApp", exact: true }).click();
  await page.getByRole("textbox", { name: /^(Tu )?número de WhatsApp$/iu }).fill(nationalPhone(phone));
  await mark(page, page.getByRole("checkbox", { name: /Acepto los Términos/ }), true);
  await sendWithCooldown(() => clickForResponse(page, page.getByRole("button", { name: "Crear cuenta", exact: true }), "/api/auth/signup", "POST", null));
  await fillOtp(page, (await cursor("code")).proof);
  await clickForResponse(page, page.getByRole("button", { name: "Verificar y crear la cuenta", exact: true }), "/api/auth/signup/verify", "POST", 204);
  await page.waitForURL((url) => url.pathname === "/");
  await page.getByRole("navigation", { name: "Secciones", exact: true }).or(page.getByRole("button", { name: /, Personal$/ })).filter({ visible: true }).first().waitFor();
  return read(h, page, "/api/me");
}
async function addPhone(h, page, phone, cursor) {
  await page.goto(new URL("/cuenta", h.base).href); await heading(page, "Mi cuenta");
  await page.getByRole("button", { name: "Agregar correo o teléfono", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "WhatsApp", exact: true }).click();
  await dialog.getByRole("textbox", { name: "Número", exact: true }).fill(nationalPhone(phone));
  const sent = await sendWithCooldown(() => clickForResponse(page, dialog.getByRole("button", { name: "Enviar código", exact: true }), "/api/me/login-methods", "POST", null));
  const methodId = (await sent.json()).methodId;
  await fillOtp(dialog, (await cursor("code")).proof);
  await clickForResponse(page, dialog.getByRole("button", { name: "Verificar", exact: true }), "/api/me/login-methods/" + methodId + "/verify", "POST", 204);
  await dialog.waitFor({ state: "hidden" });
  const methods = (await read(h, page, "/api/me/login-methods")).methods;
  assert.ok(methods.some((method) => method.id === methodId && method.type === "Phone" && method.isVerified));
}
async function turnOn(h, page, tenantId) {
  await page.goto(new URL("/plataforma/organizaciones/" + tenantId + "?tab=modules", h.base).href);
  await page.getByRole("tab", { name: /^Módulos/ }).click();
  await page.getByRole("button", { name: "Acciones de WhatsApp", exact: true }).click();
  await page.getByRole("menuitem", { name: "Prender", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("textbox", { name: /Motivo/ }).fill("Complemento E11 aislado con datos sintéticos y sin Meta.");
  await clickForResponse(page, dialog.getByRole("button", { name: "Prender", exact: true }), "/api/platform/tenants/" + tenantId + "/features/whatsapp", "PUT");
  await dialog.waitFor({ state: "hidden" });
}

async function invitationFromMail(h, email, before) {
  const deadline = Date.now() + 95_000;
  while (Date.now() < deadline) {
    for (const { body } of await h.env.messages(email, before)) {
      const token = invitationTokenFromMessage(body, h.base);
      if (token) return token;
    }
    await delay(250);
  }
  throw new Error("No llegó la invitación real al pickup aislado.");
}

export async function runSupplementWhatsAppCases(h) {
  const ownerPage = await h.newPage(); const agentPage = await h.newPage();
  const personPage = await h.newPage(); const platformPage = await h.newPage();
  const outcomes = new Map(); const pages = [ownerPage, agentPage, personPage, platformPage];
  const signedIn = new Set(); let capturePage = ownerPage;
  const tag = randomUUID().slice(0, 8);
  const phone = h.width === 1440 ? "+5491134567870" : "+5491134567871";
  const memberPhone = h.width === 1440 ? "+5491134567872" : "+5491134567873";
  const invitePhone = h.width === 1440 ? "+5491134567874" : "+5491134567875";
  const firstImport = h.width === 1440 ? "+5491134567876" : "+5491134567877";
  const secondImport = h.width === 1440 ? "+5491134567878" : "+5491134567879";
  const beforeLink = "Quiero consultar antes de vincular mi cuenta.";
  const answer = "Respuesta del agente del complemento " + tag + ".";
  const note = "Nota reservada del complemento " + tag + ".";
  let owner; let agent; let person; let cursor; let internalCursor; let numberId; let customerChat; let linkedId;
  let customerRole; let internalRole; let memberId; let company; let winnerPage;
  const run = (id, deps, action) => runModuleDependency(h, outcomes, "WAS-" + id, deps.map((key) => "WAS-" + key), () => capturePage, async () => {
    capturePage = ownerPage; return action();
  });
  const ownerLogin = async () => { const me = await forceBusinessLogin(h, ownerPage, owner.email); signedIn.add(ownerPage); assert.equal(me.id, owner.me.id); return me; };
  try {
    await run("01", [], async () => {
      owner = await h.registerBusiness(ownerPage); signedIn.add(ownerPage);
      await setName(h, ownerPage, "Dueño complemento " + tag);
      company = (await read(h, ownerPage, "/api/companies/paged?page=1&pageSize=100")).items.find((item) => item.name === owner.companyName);
      assert.ok(company?.id);
      await h.signOut(ownerPage); signedIn.delete(ownerPage);
      agent = await h.registerPerson(agentPage); signedIn.add(agentPage);
      await setName(h, agentPage, "Agente complemento " + tag);
      await h.signOut(agentPage); signedIn.delete(agentPage);
      await assistantLogin(platformPage, h.env, h.base, h.width === 1440 ? "e2e-5d-operator@example.test" : "e2e-a9-operator@example.test", "platform");
      signedIn.add(platformPage); capturePage = platformPage;
      await turnOn(h, platformPage, owner.me.activeTenantId);
      cursor = await h.env.whatsapp.begin("sup-cliente-" + h.width + "-" + tag, phone);
      numberId = (await cursor("orgNumber", { tenantId: owner.me.activeTenantId })).numberId;
      assert.match(numberId, /^[0-9a-f-]{36}$/iu);
      await ownerLogin();
      assert.equal((await read(h, ownerPage, root + "/numbers/" + numberId)).status, "Connected");
      await h.signOut(ownerPage); signedIn.delete(ownerPage);
      await assertViewport(platformPage);
      return "Organización y agente por UI; operador prendió WhatsApp y control Testing creó su número Connected sin Meta.";
    });
    await run("02", ["01"], async () => {
      capturePage = personPage;
      person = await registerPhone(h, personPage, phone, cursor); signedIn.add(personPage);
      assert.equal(person.access, "consumer"); assert.equal(person.activeTenantId, null);
      assert.equal((await cursor("orgInbound", { text: beforeLink })).status, 200);
      const offered = await cursor("orgProcess");
      assert.ok(offered.buttons.some((button) => button.id === "bot.link"));
      assert.equal((await cursor("orgInbound", { reply: { type: "button", id: "bot.link" } })).status, 200);
      const linked = await cursor("orgProcess"); assert.ok(linked.text?.length > 0);
      await personPage.goto(new URL("/mensajes", h.base).href);
      await heading(personPage, "Mensajes");
      const own = (await read(h, personPage, "/api/me/whatsapp/conversations")).items.find((item) => item.organizationName === owner.organization);
      assert.ok(own?.id); linkedId = own.id;
      await assertViewport(personPage);
      return "Cliente Phone verificado por OTP real, vinculado por botón bot.link y visible en Mensajes.";
    });
    await run("03", ["02"], async () => {
      await ownerLogin();
      customerRole = await createRole(h, ownerPage, "Clientes complemento " + tag, "whatsapp.customers");
      internalRole = await createRole(h, ownerPage, "Internos complemento " + tag, "whatsapp.internal");
      const before = new Set(await h.env.files());
      await ownerPage.goto(new URL("/org/usuarios", h.base).href);
      await ownerPage.getByRole("button", { name: "Invitar usuario", exact: true }).click();
      const dialog = ownerPage.getByRole("dialog", { name: "Invitar usuario", exact: true });
      await dialog.getByRole("textbox", { name: "Correo", exact: true }).fill(agent.email);
      await dialog.getByRole("button", { name: "Roles de la organización", exact: true }).click();
      await ownerPage.getByRole("menuitemcheckbox", { name: customerRole.name, exact: true }).click();
      await ownerPage.keyboard.press("Escape");
      const issued = await clickForResponse(ownerPage, dialog.getByRole("button", { name: "Invitar", exact: true }), "/api/users/invitations", "POST", 201);
      const invitationId = (await issued.json()).invitationId;
      const row = (await read(h, ownerPage, "/api/users/paged?search=" + encodeURIComponent(agent.email) + "&page=1&pageSize=100")).items.find((item) => item.invitationId === invitationId);
      assert.ok(row?.memberId); memberId = row.memberId;
      const token = await invitationFromMail(h, agent.email, before);
      await dialog.waitFor({ state: "hidden" });
      await h.signOut(ownerPage); signedIn.delete(ownerPage);
      await h.login(agentPage, agent.email, "consumer"); signedIn.add(agentPage); capturePage = agentPage;
      assert.ok((await read(h, agentPage, "/api/me/whatsapp/conversations")).items.every((item) => item.id !== linkedId));
      await requireModuleProblem(await h.api(agentPage, "/api/me/whatsapp/conversations/" + linkedId), 404, ["WhatsApp.Link.NotFound"]);
      await agentPage.goto(new URL("/invitacion#" + token, h.base).href);
      await clickForResponse(agentPage, agentPage.getByRole("button", { name: "Aceptar invitación", exact: true }), "/api/invitations/accept", "POST");
      await agentPage.waitForURL((url) => url.pathname === "/org");
      const me = await read(h, agentPage, "/api/me");
      assert.equal(me.id, agent.me.id); assert.equal(me.activeTenantId, owner.me.activeTenantId);
      requireOrganizationPermissions(me, ["whatsapp.customers"]);
      const list = await read(h, agentPage, root + "/customers/conversations");
      customerChat = list.conversations.items.find((item) => item.displayNumber === phone);
      assert.ok(customerChat?.id); assert.equal(customerChat.linkedToAccount, true); assert.equal(customerChat.assignee, null);
      await agentPage.goto(new URL("/org/whatsapp/chats/" + customerChat.id, h.base).href);
      await agentPage.getByRole("log", { name: /^Mensajes con / }).waitFor();
      await ownerLogin();
      const member = await read(h, ownerPage, "/api/users/" + memberId); assert.equal(member.state, "Active");
      await ownerPage.goto(new URL("/org/whatsapp/chats/" + customerChat.id, h.base).href);
      await ownerPage.getByRole("log", { name: /^Mensajes con / }).waitFor();
      return "Invitación aceptada por UI; dos pestañas con identidades distintas y chat sin tomar, agente sólo Clientes.";
    });
    await run("04", ["03"], async () => {
      const endpoint = root + "/customers/conversations/" + customerChat.id;
      const before = outboundCount(await cursor("orgOutbound"));
      const actors = [ownerPage, agentPage];
      const buttons = await Promise.all(actors.map((page) => takeButton(page, h.width)));
      const replies = await Promise.all(actors.map(async (page, index) => {
        const [response] = await responsesForAction(page, [responseAt(endpoint + "/take", "POST")], () => buttons[index].click());
        return { status: response.status(), body: await response.json() };
      }));
      const race = requireTakeRace(replies); winnerPage = actors[race.winnerIndex]; const loserPage = actors[1 - race.winnerIndex];
      capturePage = loserPage;
      const rejected = "No debe salir " + tag;
      const problem = await requireModuleProblem(await h.api(loserPage, endpoint + "/messages", { method: "POST", headers: { "Idempotency-Key": randomUUID() }, data: { text: rejected } }), 409, ["WhatsApp.Conversation.TakenByOther"]);
      assert.equal(problem.takenBy, race.winner.assignee.name);
      assert.equal(outboundCount(await cursor("orgOutbound")), before);
      assert.ok((await read(h, loserPage, endpoint)).messages.items.every((message) => message.text !== rejected));
      await loserPage.getByText("Lo atiende " + race.winner.assignee.name, { exact: true }).waitFor();
      assert.equal(await loserPage.getByRole("textbox", { name: "Mensaje", exact: true }).count(), 0);
      await winnerPage.getByRole("textbox", { name: "Mensaje", exact: true }).fill(answer);
      await clickForResponse(winnerPage, winnerPage.getByRole("button", { name: "Enviar", exact: true }), endpoint + "/messages", "POST");
      await winnerPage.getByRole("log", { name: /^Mensajes con / }).getByText(answer, { exact: true }).waitFor();
      assert.equal(outboundCount(await cursor("orgOutbound")), before + 1);
      await winnerPage.getByRole("button", { name: "Nota interna", exact: true }).click();
      await winnerPage.getByRole("textbox", { name: "Nota interna", exact: true }).fill(note);
      const saved = await clickForResponse(winnerPage, winnerPage.getByRole("button", { name: "Guardar nota", exact: true }), endpoint + "/notes", "POST");
      assert.equal((await saved.json()).kind, "Note");
      await winnerPage.getByRole("log", { name: /^Mensajes con / }).getByText(note, { exact: true }).waitFor();
      assert.equal(outboundCount(await cursor("orgOutbound")), before + 1);
      capturePage = winnerPage; await assertViewport(winnerPage);
      return "Toma simultánea: un 200 y un409 con takenBy exacto; perdedor no guardó ni envió. Ganador respondió una vez y nota quedó interna.";
    });
    await run("05", ["03"], async () => {
      await ownerLogin();
      await ownerPage.goto(new URL("/org/usuarios/" + memberId, h.base).href);
      await chooseRole(ownerPage, h.width, "Roles de la organización", customerRole.name, false);
      await chooseRole(ownerPage, h.width, "Roles de la organización", internalRole.name);
      await clickForResponse(ownerPage, ownerPage.getByRole("button", { name: "Guardar cambios", exact: true }), "/api/users/" + memberId, "PUT");
      const detail = await read(h, ownerPage, "/api/users/" + memberId);
      assert.deepEqual(detail.roles.map((role) => role.id), [internalRole.id]); assert.equal(detail.state, "Active");
      const me = await forceBusinessLogin(h, agentPage, agent.email); signedIn.add(agentPage); capturePage = agentPage;
      requireOrganizationPermissions(me, ["whatsapp.internal"]);
      internalCursor = await h.env.whatsapp.begin("sup-miembro-" + h.width + "-" + tag, memberPhone);
      await addPhone(h, agentPage, memberPhone, internalCursor);
      await internalCursor("orgNumber", { tenantId: owner.me.activeTenantId });
      const text = "Consulta de miembro activo " + tag;
      assert.equal((await internalCursor("orgInbound", { text })).status, 200); await internalCursor("orgProcess");
      const internal = (await read(h, agentPage, root + "/internal/conversations")).conversations.items.find((item) => item.displayNumber === memberPhone);
      assert.ok(internal?.id); assert.equal(internal.inbox, "Internal");
      await requireModuleProblem(await h.api(agentPage, root + "/customers/conversations"), 403, ["Http.Forbidden"]);
      const endpoint = root + "/internal/conversations/" + internal.id;
      await agentPage.goto(new URL("/org/whatsapp/chats/" + internal.id + "?inbox=internal", h.base).href);
      await agentPage.getByRole("log", { name: /^Mensajes con / }).getByText(text, { exact: true }).waitFor();
      const before = outboundCount(await internalCursor("orgOutbound"));
      await clickForResponse(agentPage, await takeButton(agentPage, h.width), endpoint + "/take", "POST");
      const reply = "Respuesta interna " + tag;
      await agentPage.getByRole("textbox", { name: "Mensaje", exact: true }).fill(reply);
      await clickForResponse(agentPage, agentPage.getByRole("button", { name: "Enviar", exact: true }), endpoint + "/messages", "POST");
      await agentPage.getByRole("log", { name: /^Mensajes con / }).getByText(reply, { exact: true }).waitFor();
      assert.equal(outboundCount(await internalCursor("orgOutbound")), before + 1);
      assert.ok((await read(h, agentPage, endpoint)).messages.items.some((message) => message.text === reply));
      await assertViewport(agentPage);
      return "Miembro activo con Phone verificado entró a Internos; agente sólo whatsapp.internal tomó/respondió; Clientes403.";
    });
    await run("06", ["03"], async () => {
      await ownerLogin();
      await ownerPage.goto(new URL("/org/whatsapp/contactos/" + customerChat.contactId, h.base).href);
      const edit = h.width === 390 ? await moreAction(ownerPage, "Editar contacto") : ownerPage.getByRole("button", { name: "Editar contacto", exact: true });
      await edit.click(); const dialog = ownerPage.getByRole("dialog", { name: "Editar contacto", exact: true });
      await dialog.getByRole("radio", { name: "Acepta", exact: true }).click();
      await clickForResponse(ownerPage, dialog.getByRole("button", { name: h.width === 390 ? "Guardar" : "Guardar cambios", exact: true }), root + "/contacts/" + customerChat.contactId, "PUT");
      assert.equal((await read(h, ownerPage, root + "/contacts/" + customerChat.contactId)).consent, "Accepted");
      assert.equal((await cursor("orgInbound", { reply: { type: "button", id: "bot.unsubscribe" } })).status, 200);
      const turn = await cursor("orgProcess"); assert.ok(turn.text?.length > 0);
      const contact = await read(h, ownerPage, root + "/contacts/" + customerChat.contactId);
      assert.equal(contact.consent, "Unsubscribed"); assert.equal(contact.consentSource, "Unsubscribe");
      assert.match(contact.consentChangedAtUtc, /Z$/u); assert.ok(Number.isFinite(Date.parse(contact.consentChangedAtUtc)));
      await ownerPage.reload(); await ownerPage.getByText("Se dio de baja", { exact: false }).first().waitFor();
      return "bot.unsubscribe cambió Accepted a Unsubscribed, origen/fecha UTC y confirmación real; difusión pendiente sigue sin probar.";
    });
    await run("07", ["06"], async () => {
      await ownerLogin(); await ownerPage.goto(new URL("/org/whatsapp/contactos", h.base).href);
      const initial = await read(h, ownerPage, root + "/contacts?page=1&pageSize=100");
      let writes = 0; const watch = (request) => { if (new URL(request.url()).pathname === root + "/contacts/import" && request.method() === "POST") writes++; };
      ownerPage.on("request", watch);
      const csv = contactImportCsv({ first: firstImport, second: secondImport, unsubscribed: phone });
      const file = { name: "contactos-sinteticos.csv", mimeType: "text/csv", buffer: Buffer.from(csv) };
      try {
        let dialog = await openImport(ownerPage, h.width);
        const preview = await uploadPreview(ownerPage, dialog, file);
        assert.equal(preview.new, 2); assert.equal(preview.updated, 1); assert.equal(preview.rejected.totalCount, 2);
        assert.deepEqual(preview.rejected.items.map((row) => row.row), [4, 5]);
        for (const row of preview.rejected.items) {
          assert.ok(row.reason?.length > 0); await dialog.getByText("Fila " + row.row, { exact: true }).waitFor();
          await dialog.getByText(row.reason, { exact: true }).first().waitFor();
        }
        assert.equal(writes, 0); assert.equal((await read(h, ownerPage, root + "/contacts?page=1&pageSize=100")).total, initial.total);
        await dialog.getByRole("button", { name: "Cancelar", exact: true }).click();
        dialog = await openImport(ownerPage, h.width);
        const sample = await h.api(ownerPage, root + "/contacts/import-sample"); assert.equal(sample.status(), 200);
        const workbook = await uploadPreview(ownerPage, dialog, { name: "ejemplo.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buffer: await sample.body() });
        assert.ok(workbook.rows > 0); await dialog.getByRole("button", { name: "Cancelar", exact: true }).click();
        dialog = await openImport(ownerPage, h.width);
        const english = await uploadPreview(ownerPage, dialog, { name: "english.csv", mimeType: "text/csv", buffer: Buffer.from("Name;Phone;Tag;Accepts promotions\nExample;" + firstImport + ";;yes") });
        assert.equal(english.new, 1); assert.equal(english.rejected.totalCount, 0);
        await dialog.getByRole("button", { name: "Cancelar", exact: true }).click();
        const rows = Array.from({ length: 5000 }, () => "Fila;" + firstImport + ";;");
        dialog = await openImport(ownerPage, h.width);
        const maximum = await uploadPreview(ownerPage, dialog, { name: "limite5000.csv", mimeType: "text/csv", buffer: Buffer.from("Nombre;Teléfono;Etiqueta;Acepta promociones\n" + rows.join("\n")) });
        assert.equal(maximum.rejected.totalCount, 4999); assert.equal(maximum.new, 1);
        await dialog.getByRole("button", { name: "Cancelar", exact: true }).click();
        dialog = await openImport(ownerPage, h.width);
        const tooMany = await uploadPreview(ownerPage, dialog, { name: "exceso5001.csv", mimeType: "text/csv", buffer: Buffer.from("Nombre;Teléfono;Etiqueta;Acepta promociones\n" + [...rows, rows[0]].join("\n")) }, 400);
        assert.equal(tooMany.code, "WhatsApp.Import.TooManyRows"); assert.ok(tooMany.traceId?.length > 0);
        assert.equal(writes, 0); assert.equal((await read(h, ownerPage, root + "/contacts?page=1&pageSize=100")).total, initial.total);
        await dialog.getByRole("button", { name: "Cancelar", exact: true }).click();
        dialog = await openImport(ownerPage, h.width); await uploadPreview(ownerPage, dialog, file);
        const imported = await clickForResponse(ownerPage, dialog.getByRole("button", { name: /^Importar \d+ contactos?$/u }), root + "/contacts/import", "POST");
        const result = await imported.json(); assert.equal(result.imported, 2); assert.equal(result.updated, 1); assert.equal(result.rejected.totalCount, 2);
        await dialog.waitFor({ state: "hidden" }); assert.equal(writes, 1);
        const contact = await read(h, ownerPage, root + "/contacts/" + customerChat.contactId);
        assert.equal(contact.consent, "Unsubscribed"); assert.equal(contact.consentSource, "Unsubscribe");
        assert.equal((await read(h, ownerPage, root + "/contacts?page=1&pageSize=100")).total, initial.total + 2);
        await ownerPage.reload(); await assertViewport(ownerPage);
      } finally { ownerPage.off("request", watch); }
      return "Preview CSV español/inglés y XLSX sin guardar; filas/motivos visibles, 5000 aceptadas/5001 rechazadas, importación conserva la baja.";
    });
    await run("08", ["01"], async () => {
      await ownerLogin();
      const before = await read(h, ownerPage, "/api/users/paged?page=1&pageSize=100");
      await ownerPage.goto(new URL("/org/usuarios/cargar-telefonos", h.base).href);
      await ownerPage.getByRole("textbox", { name: "Uno por renglón, hasta 200", exact: true }).fill(nationalPhone(invitePhone));
      await ownerPage.getByRole("combobox", { name: "Empresa", exact: true }).click();
      await ownerPage.getByRole("option", { name: company.name, exact: true }).click();
      await ownerPage.getByRole("button", { name: "Roles en la empresa", exact: true }).click();
      await ownerPage.getByRole("menuitemcheckbox", { name: "Administrador", exact: true }).click(); await ownerPage.keyboard.press("Escape");
      const reviewed = await clickForResponse(ownerPage, ownerPage.getByRole("button", { name: /^Revisar 1 teléfono$/u }).first(), root + "/phone-imports/preview", "POST");
      const preview = await reviewed.json(); assert.equal(preview.invites, 1); assert.equal(preview.invalid, 0);
      const confirmed = await clickForResponse(ownerPage, ownerPage.getByRole("button", { name: "Vincular y mandar 1 invitación", exact: true }).first(), root + "/phone-imports", "POST");
      const request = confirmed.request().postDataJSON(); assert.equal(request.companyId, company.id); assert.equal(request.roleIds.length, 1);
      assert.deepEqual(await confirmed.json(), { linked: 0, invited: 1, invalid: 0 });
      const after = await read(h, ownerPage, "/api/users/paged?page=1&pageSize=100");
      const added = after.items.filter((item) => !before.items.some((previous) => previous.memberId === item.memberId));
      assert.equal(added.length, 1); assert.equal(added[0].state, "Invited");
      const invited = await read(h, ownerPage, "/api/users/" + added[0].memberId);
      assert.deepEqual(invited.companies.map((entry) => ({ companyId: entry.companyId, roleIds: entry.roles.map((role) => role.id) })), [{ companyId: company.id, roleIds: request.roleIds }]);
      await assertViewport(ownerPage);
      return "Confirmación por UI creó una invitación real con empresa/rol elegidos; 503 por canal/pago sigue sin preparación disponible.";
    });
    await run("09", ["02", "04"], async () => {
      capturePage = personPage;
      const endpoint = "/api/me/whatsapp/conversations/" + linkedId;
      const list = await read(h, personPage, "/api/me/whatsapp/conversations");
      assert.ok(list.items.some((item) => item.id === linkedId));
      requirePersonalCopies(await read(h, personPage, endpoint), { answer, note, beforeLink });
      // La pestaña conserva la identidad B2C y navega dentro de la SPA, aunque otras pestañas ingresaron como empresa.
      await personPage.locator("a[href='/mensajes/" + linkedId + "']").first().click();
      await personPage.getByRole("log", { name: /^Mensajes con / }).getByText(answer, { exact: true }).waitFor();
      assert.equal(await personPage.getByText(note, { exact: true }).count(), 0);
      assert.equal(await personPage.getByText(beforeLink, { exact: true }).count(), 0);
      await (await moreAction(personPage, "Desvincular")).click();
      const dialog = personPage.getByRole("dialog", { name: "¿Desvincular la conversación con " + owner.organization + "?", exact: true });
      await clickForResponse(personPage, dialog.getByRole("button", { name: "Desvincular", exact: true }), endpoint + "/link", "DELETE", 204);
      assert.ok((await read(h, personPage, "/api/me/whatsapp/conversations")).items.every((item) => item.id !== linkedId));
      await requireModuleProblem(await h.api(personPage, endpoint), 404, ["WhatsApp.Link.NotFound"]);
      const retained = await read(h, ownerPage, root + "/customers/conversations/" + customerChat.id);
      assert.equal(retained.conversation.linkedToAccount, false);
      assert.ok(retained.messages.items.some((message) => message.text === answer)); assert.ok(retained.messages.items.some((message) => message.text === note));
      await assertViewport(personPage);
      return "Mensajes sólo mostró sus copias posteriores al vínculo, sin autor/nota; Desvincular por UI dejó copia404 y chat empresarial íntegro.";
    });
    await run("10", [], async () => {
      await closeSupplementSessions(signedIn, async (page) => {
        capturePage = page;
        const cancel = page.getByRole("dialog").getByRole("button", { name: "Cancelar", exact: true }).first();
        if (await cancel.isVisible()) await cancel.click();
        await h.signOut(page);
      });
      assert.equal(signedIn.size, 0);
      return "Persona, agente, Dueño y operador salieron por UI; no se borraron cookies ni se reemplazó el contexto.";
    });
  } finally { for (const page of pages) await page.close(); }
  return outcomes;
}
