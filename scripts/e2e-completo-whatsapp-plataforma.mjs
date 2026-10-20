import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { syntheticEmail } from "./e2e-completo-soporte.mjs";
import { fillOtp } from "./test-e2e-real-ui.mjs";
import { sendWithCooldown } from "./recorrido-usuario-whatsapp.mjs";
import { nationalPhone } from "./recorrido-usuario-e11.mjs";
import { openAction, assertPlatformProblem } from "./e2e-completo-plataforma.mjs";
import { requireExclusivePlatformActor } from "./e2e-completo-seguridad-complemento.mjs";
import { confirmRecentAuthentication, stopConfirmingRecentAuthentication } from "./platform-factor-real.mjs";

const root = "/api/platform/whatsapp";
const def = (id, actor, action, expected, covers = [], extra = {}) => ({
  id, actor, action, expected, covers, area: "WhatsApp de Plataforma", route: "/plataforma/whatsapp",
  source: "scripts/e2e-completo-whatsapp-plataforma.mjs", critical: true, ...extra,
});
export const platformWhatsAppDefinitions = [
  def("WAP-01", "Operador sólo con platform.whatsapp.manage", "Guardar bot y equipo con confirmación reciente, sin atención",
    "Bot y equipo propios se guardan por UI; la prueba vencida exige403 ReauthenticationRequired y confirmación real. Gestión no permite leer consultas. Plantillas se leen sin acreditar escrituras en Meta.", [], { partialOf: ["BACK-WA-023"], route: "/plataforma/whatsapp/bot" }),
  def("WAP-02", "Operador sólo con atención, luego con lectura de cuentas", "Responder una consulta global con prueba vencida y comprobar la cuenta asociada",
    "attend permite responder201 sin confirmación reciente ni lectura de cuenta; al sumar accounts.read por UI, la misma consulta muestra la cuenta propia real.", ["BACK-WA-022"]),
];
export const platformWhatsAppLimitations = {
  "BACK-WA-023": { partialExecutionIds: ["WAP-01"], missing: "Creación y borrado de plantillas de Plataforma en Meta.",
    reason: "Bot y equipos se preparan localmente; crear o borrar plantillas usa WhatsAppTemplateIssuer y Meta. El control Browser no ofrece una respuesta aprobada para plantillas ni credenciales reales. Leer el listado o abrir el formulario no acredita esas escrituras.",
    source: ["src/ArquitecturaBaseMultitenant.Application/Modules/WhatsApp/Services/PlatformWhatsAppTemplateService.cs", "tests/ArquitecturaBaseMultitenant.Api.IntegrationTests/TestFeatures/WhatsAppBrowser/WhatsAppBrowserRequest.cs"] },
};

export function requirePlatformChatAccount(detail, accountId) {
  assert.equal(detail.conversation.accountId ?? null, accountId, "La cuenta asociada depende exactamente de accounts.read.");
}
export function requirePlatformAnswer(detail, { agentId, messageId, text, challenges, confirmations }) {
  assert.equal(challenges, 0, "Responder no exige prueba reciente."); assert.equal(confirmations, 0, "Responder no debe confirmar el factor.");
  assert.equal(detail.conversation.assignee?.id, agentId); assert.equal(detail.conversation.assignedToMe, true);
  const message = detail.messages.items.find((item) => item.id === messageId);
  assert.ok(message, "La respuesta debe persistir en el hilo real.");
  assert.equal(message.text, text); assert.equal(message.direction, "Outbound"); assert.equal(message.kind, "Text");
}
export async function requireRecentWhatsAppProof(response) {
  return assertPlatformProblem(response, 403, "Auth.Platform.ReauthenticationRequired");
}
export async function withRestoredWhatsAppSettings({ read, action, restore }) {
  const before = await read(); let result; const failures = [];
  try { result = await action(before); } catch (error) { failures.push(error); }
  try { await restore(before); } catch (error) { failures.push(error); }
  if (failures.length === 1) throw failures[0];
  if (failures.length > 1) throw new AggregateError(failures, "Fallaron la acción WhatsApp y su restauración por UI.");
  return result;
}

async function closePlatformSession(h, page) {
  await stopConfirmingRecentAuthentication(page);
  await page.goto(new URL("/plataforma", h.base).href);
  const original = page.viewportSize(); await page.setViewportSize({ width: 1440, height: 900 });
  try {
    const profile = page.getByRole("button", { name: /, Plataforma$/u }).filter({ visible: true }).first();
    const email = page.getByRole("textbox", { name: "Correo electrónico", exact: true });
    const factor = page.getByRole("heading", { name: /^(Verificación en dos pasos|Protegé tu cuenta de operador)$/u });
    await profile.or(email).or(factor).filter({ visible: true }).first().waitFor();
    assert.equal(await factor.isVisible(), false, "El ingreso de Plataforma debe completar su factor antes de cambiar de operador.");
    // Sólo una sesión Plataforma confirmada se cierra; no se toca la sesión pública independiente.
    if (await profile.isVisible()) await h.signOut(page);
  } finally { if (original) await page.setViewportSize(original); }
}

/** Las pestañas comparten una cookie Plataforma: todo cambio de operador pasa por Salir e ingreso UI/MFA. */
export function createPlatformWhatsAppSessions(h, { setCapturePage, closePlatform = (page) => closePlatformSession(h, page) }) {
  const identities = new Map(); let active; let normalized = false;
  const validate = (me, email, expected) => {
    const known = identities.get(email);
    assert.ok(me?.id, "El ingreso debe devolver una cuenta real.");
    if (known) assert.equal(me.id, known.id, "Volver al operador debe conservar exactamente su identidad.");
    if (expected.id !== undefined) assert.equal(me.id, expected.id, "El ingreso debe corresponder al operador propio invitado.");
    requireExclusivePlatformActor(me, expected.permissions ?? known?.permissions ?? me.effectivePermissions.platform);
    if (!known) identities.set(email, { id: me.id, permissions: [...me.effectivePermissions.platform] });
  };
  const leave = async () => {
    if (!active) return;
    setCapturePage(active.page); await closePlatform(active.page); active = undefined;
  };
  return {
    leave,
    async enter(page, email, expected = {}) {
      if (active?.page === page && active.email === email && active.me) {
        setCapturePage(page); validate(active.me, email, expected); return active.me;
      }
      await leave(); setCapturePage(page);
      if (!normalized) { await closePlatform(page); normalized = true; }
      active = { page, email };
      const me = await h.login(page, email, "platform"); validate(me, email, expected); active.me = me;
      return me;
    },
  };
}

const responseAt = (route, method) => (response) => new URL(response.url()).pathname === route && response.request().method() === method;
async function read(h, page, route) {
  const response = await h.api(page, route); assert.equal(response.status(), 200); return response.json();
}
async function uiWrite(page, button, route, method, status, email, { requireProof = false } = {}) {
  await stopConfirmingRecentAuthentication(page);
  const pending = page.waitForResponse(responseAt(route, method)); void pending.catch(() => {});
  await button.click(); let response = await pending;
  if (requireProof || response.status() === 403) {
    await requireRecentWhatsAppProof(response);
    const replay = page.waitForResponse((reply) => responseAt(route, method)(reply) && reply.status() !== 403); void replay.catch(() => {});
    await confirmRecentAuthentication(page, email); response = await replay;
  }
  if (status !== null) assert.equal(response.status(), status); return response;
}
async function choosePermissions(page, dialog, labels) {
  const picker = dialog.getByRole("button", { name: "Permisos de plataforma", exact: true });
  await picker.focus(); await picker.press("ArrowDown");
  for (const label of labels) {
    const option = page.getByRole("menuitemcheckbox", { name: label, exact: true });
    if (await option.getAttribute("aria-checked") !== "true") await option.click();
  }
  await page.keyboard.press("Escape");
}
async function inviteOperator(h, page, fullEmail, label, permissionLabel, permission) {
  const email = syntheticEmail(label);
  await page.goto(new URL("/plataforma/cuentas", h.base).href);
  await page.getByRole("button", { name: "Invitar operador", exact: true }).filter({ visible: true }).first().click();
  const dialog = page.getByRole("dialog", { name: "Invitar operador", exact: true });
  await dialog.getByRole("textbox", { name: "Correo", exact: true }).fill(email);
  await choosePermissions(page, dialog, [permissionLabel]);
  const issued = await uiWrite(page, dialog.getByRole("button", { name: "Invitar", exact: true }), "/api/platform/operators/invitations", "POST", 201, fullEmail);
  const account = await issued.json(); assert.ok(account.id); await dialog.waitFor({ state: "hidden" });
  const detail = await read(h, page, "/api/platform/accounts/" + account.id);
  assert.deepEqual(detail.operatorPermissions, [permission]); assert.equal(detail.kind, "Operator");
  return { email, id: account.id };
}
async function welcomeDialog(h, page) {
  await page.goto(new URL("/plataforma/whatsapp/bot", h.base).href);
  await page.getByRole("heading", { name: "Bot", exact: true }).waitFor();
  if (h.width === 390) await page.getByRole("button", { name: /^Bienvenida/u }).click();
  else {
    const row = page.getByRole("button", { name: "Acciones de Bienvenida", exact: true });
    await row.focus(); await row.press("ArrowDown"); await page.getByRole("menuitem", { name: "Editar", exact: true }).click();
  }
  return page.getByRole("dialog", { name: "Bienvenida", exact: true });
}
async function saveWelcome(h, page, text, email, requireProof = false) {
  const dialog = await welcomeDialog(h, page); await dialog.getByRole("textbox", { name: "Texto", exact: true }).fill(text);
  const saved = await uiWrite(page, dialog.getByRole("button", { name: h.width === 390 ? "Guardar" : "Guardar cambios", exact: true }), root + "/bot", "PUT", 200, email, { requireProof });
  const body = await saved.json(); assert.equal(body.welcome, text); await dialog.waitFor({ state: "hidden" });
  assert.equal((await read(h, page, root + "/bot")).welcome, text); return body;
}
async function setConsultations(h, page, enabled, email) {
  await page.goto(new URL("/plataforma/whatsapp/numero", h.base).href);
  const toggle = page.getByRole("switch", { name: "Atiende consultas", exact: true }); await toggle.waitFor();
  if (await toggle.isChecked() !== enabled) await uiWrite(page, toggle, root + "/number", "PUT", 200, email);
  assert.equal(await toggle.isChecked(), enabled);
  assert.equal((await read(h, page, root + "/number")).consultationsEnabled, enabled);
}
async function addPhone(h, page, phone, cursor) {
  await page.goto(new URL("/cuenta", h.base).href); await page.getByRole("heading", { name: "Mi cuenta", exact: true }).waitFor();
  await page.getByRole("button", { name: "Agregar correo o teléfono", exact: true }).click();
  const dialog = page.getByRole("dialog"); await dialog.getByRole("button", { name: "WhatsApp", exact: true }).click();
  await dialog.getByRole("textbox", { name: "Número", exact: true }).fill(nationalPhone(phone));
  const send = () => uiWrite(page, dialog.getByRole("button", { name: "Enviar código", exact: true }), "/api/me/login-methods", "POST", null);
  // El cooldown es una respuesta propia del envío, no una espera fija de preparación.
  const sent = await sendWithCooldown(send); assert.equal(sent.status(), 202); const methodId = (await sent.json()).methodId;
  await fillOtp(dialog, (await cursor("code")).proof);
  await uiWrite(page, dialog.getByRole("button", { name: "Verificar", exact: true }), "/api/me/login-methods/" + methodId + "/verify", "POST", 204);
  await dialog.waitFor({ state: "hidden" });
  const methods = (await read(h, page, "/api/me/login-methods")).methods;
  assert.ok(methods.some((method) => method.id === methodId && method.type === "Phone" && method.isVerified));
}
async function createTeam(h, page, email, manager, name) {
  await page.goto(new URL("/plataforma/whatsapp/equipos", h.base).href);
  await page.getByRole("button", { name: "Crear equipo", exact: true }).filter({ visible: true }).first().click();
  const dialog = page.getByRole("dialog", { name: "Crear equipo", exact: true });
  await dialog.getByRole("textbox", { name: "Nombre", exact: true }).fill(name);
  const options = await read(h, page, root + "/teams/member-options?page=1&pageSize=100&search=" + encodeURIComponent(manager.email));
  const own = options.items.find((item) => item.id === manager.id); assert.ok(own, "El gestor propio debe ser una opción real del equipo.");
  const picker = dialog.getByRole("button", { name: "Operadores", exact: true }); await picker.focus(); await picker.press("ArrowDown");
  await page.getByRole("searchbox", { name: "Buscar", exact: true }).fill(own.name);
  await page.getByRole("menuitemcheckbox", { name: own.name, exact: true }).click(); await page.keyboard.press("Escape");
  const created = await uiWrite(page, dialog.getByRole("button", { name: "Crear equipo", exact: true }), root + "/teams", "POST", 201, email);
  const team = await created.json(); assert.ok(team.id); await dialog.waitFor({ state: "hidden" });
  const persisted = await read(h, page, root + "/teams/" + team.id);
  assert.equal(persisted.name, name); assert.deepEqual(persisted.members.map((member) => member.id), [manager.id]); return team;
}
async function deleteTeam(h, page, email, name) {
  await page.goto(new URL("/plataforma/whatsapp/equipos", h.base).href);
  const row = page.getByRole("button", { name: "Acciones de " + name, exact: true });
  await row.waitFor(); if (await row.getAttribute("aria-haspopup") === "dialog") await row.click(); else { await row.focus(); await row.press("ArrowDown"); }
  await page.getByRole("menuitem", { name: "Borrar", exact: true }).click();
  const confirm = page.getByRole("dialog", { name: "¿Borrar «" + name + "»?", exact: true });
  const current = (await read(h, page, root + "/teams?page=1&pageSize=100&search=" + encodeURIComponent(name))).items.find((item) => item.name === name); assert.ok(current);
  await uiWrite(page, confirm.getByRole("button", { name: "Borrar", exact: true }), root + "/teams/" + current.id, "DELETE", 204, email);
  await confirm.waitFor({ state: "hidden" });
}

/** Dos comprobaciones con cuentas propias, dentro del contexto real que aporta main. */
export async function runPlatformWhatsAppCases(h) {
  const fullPage = await h.newPage(); const managerPage = await h.newPage(); const agentPage = await h.newPage(); const publicPage = await h.newPage();
  const pages = [fullPage, managerPage, agentPage, publicPage]; const failures = []; let publicSignedIn = false;
  const fullEmail = h.width === 1440 ? "e2e-5d-operator@example.test" : "e2e-a9-operator@example.test";
  const phone = h.width === 1440 ? "+5491134567864" : "+5491134567865"; const tag = randomUUID().slice(0, 8);
  let capturePage = fullPage; let owner; let cursor; let agent; let manager; let ready = false; let team; let originalBot;
  const teamName = "Equipo de prueba " + h.width + " " + tag;
  const sessions = createPlatformWhatsAppSessions(h, { setCapturePage: (page) => { capturePage = page; } });
  const full = async () => {
    const me = await sessions.enter(fullPage, fullEmail);
    for (const permission of ["platform.operators.manage", "platform.accounts.read", "platform.accounts.manage", "platform.whatsapp.manage"]) assert.ok(me.effectivePermissions.platform.includes(permission));
    return me;
  };
  const manage = () => sessions.enter(managerPage, manager.email, { id: manager.id, permissions: ["platform.whatsapp.manage"] });
  const attend = (withAccounts = false) => sessions.enter(agentPage, agent.email, {
    id: agent.id, permissions: ["platform.whatsapp.attend", ...(withAccounts ? ["platform.accounts.read"] : [])],
  });
  const leavePublic = async () => {
    if (!publicSignedIn) return;
    capturePage = publicPage; await publicPage.goto(new URL("/cuenta", h.base).href);
    await publicPage.getByRole("heading", { name: "Mi cuenta", exact: true }).waitFor();
    await h.signOut(publicPage); publicSignedIn = false;
  };
  const result01 = await h.record("WAP-01", () => capturePage, async () => {
    capturePage = publicPage; owner = await h.registerBusiness(publicPage); publicSignedIn = true;
    cursor = await h.env.whatsapp.begin("wap-" + h.width + "-" + tag, phone);
    await addPhone(h, publicPage, phone, cursor); await leavePublic();
    // orgProcess usa el worker real global; esta organización propia no recibe ningún mensaje ficticio.
    assert.ok((await cursor("orgNumber", { tenantId: owner.me.activeTenantId })).numberId);
    await full();
    agent = await inviteOperator(h, fullPage, fullEmail, "wap-atencion", "Atender consultas", "platform.whatsapp.attend");
    manager = await inviteOperator(h, fullPage, fullEmail, "wap-gestion", "Administrar el WhatsApp de Plataforma", "platform.whatsapp.manage");
        const number = await read(h, fullPage, root + "/number"); originalBot = await read(h, fullPage, root + "/bot");
        assert.equal(number.number?.status, "Connected", "El canal global del control debe estar conectado.");
        ready = true;
        await manage();
        await stopConfirmingRecentAuthentication(managerPage);
        const expired = await h.env.command("recent-proof", { kind: "expire", email: manager.email }); assert.ok(expired.expired >= 1);
        await saveWelcome(h, managerPage, "Bienvenida de prueba " + tag, manager.email, true);
        team = await createTeam(h, managerPage, manager.email, manager, teamName);
        await assertPlatformProblem(await h.api(managerPage, root + "/conversations?page=1&pageSize=20"), 403, "Http.Forbidden");
        await managerPage.goto(new URL("/plataforma/whatsapp/plantillas", h.base).href);
        await managerPage.getByRole("heading", { name: "Plantillas", exact: true }).waitFor();
        await read(h, managerPage, root + "/templates?page=1&pageSize=20&group=Consultations");
        const savedWelcome = await welcomeDialog(h, managerPage);
        assert.equal(await savedWelcome.getByRole("textbox", { name: "Texto", exact: true }).inputValue(), "Bienvenida de prueba " + tag);
        return "Gestor sólo manage confirmó F2 tras403 real, guardó Bienvenida y equipo; consultas403. Plantillas sólo se leyeron; sus escrituras en Meta siguen pendientes.";
  });
  try {
    if (!ready) await h.block("WAP-02", "No se prepararon por UI la cuenta Phone y los operadores propios de WAP-01.", capturePage);
    else await h.record("WAP-02", () => capturePage, async () => withRestoredWhatsAppSettings({
      read: async () => { await full(); return read(h, fullPage, root + "/number"); },
      action: async (before) => {
        assert.equal(before.number?.status, "Connected"); capturePage = fullPage; await setConsultations(h, fullPage, true, fullEmail);
        assert.equal((await cursor("inbound")).status, 200); await cursor("orgProcess");
        let me = await attend();
        await stopConfirmingRecentAuthentication(agentPage);
        const expired = await h.env.command("recent-proof", { kind: "expire", email: agent.email }); assert.ok(expired.expired >= 1);
        const list = await read(h, agentPage, root + "/conversations?page=1&pageSize=100&search=" + encodeURIComponent(phone));
        const conversation = list.conversations.items.find((item) => item.displayNumber === phone); assert.ok(conversation?.id);
        const route = root + "/conversations/" + conversation.id;
        let detail = await read(h, agentPage, route); requirePlatformChatAccount(detail, null);
        await assertPlatformProblem(await h.api(agentPage, "/api/platform/accounts/" + owner.me.id), 403, "Http.Forbidden");
        await agentPage.goto(new URL("/plataforma/whatsapp/consultas/" + conversation.id, h.base).href);
        const input = agentPage.getByRole("textbox", { name: "Mensaje", exact: true }); await input.waitFor();
        assert.equal(await agentPage.getByRole("link", { name: "Ver la cuenta", exact: true }).count(), 0);
        if (h.width === 390) {
          await agentPage.getByRole("button", { name: /^Acciones de /u }).click();
          assert.equal(await agentPage.getByRole("menuitem", { name: "Ver la cuenta", exact: true }).count(), 0); await agentPage.keyboard.press("Escape");
        }
        let challenges = 0; let confirmations = 0;
        const watch = (response) => { if (responseAt(route + "/messages", "POST")(response) && response.status() === 403) challenges++; };
        const confirm = (request) => { if (new URL(request.url()).pathname === "/api/platform/reauthentication" && request.method() === "POST") confirmations++; };
        agentPage.on("response", watch); agentPage.on("request", confirm);
        const text = "Respuesta de Plataforma " + tag; let sent;
        try {
          await input.fill(text);
          const pending = agentPage.waitForResponse(responseAt(route + "/messages", "POST")); void pending.catch(() => {});
          await agentPage.getByRole("button", { name: "Enviar", exact: true }).click();
          const response = await pending; assert.equal(response.status(), 201); sent = await response.json();
        } finally { agentPage.off("response", watch); agentPage.off("request", confirm); }
        assert.equal(await agentPage.getByRole("dialog", { name: "Confirmá que sos vos", exact: true }).isVisible(), false);
        detail = await read(h, agentPage, route); requirePlatformChatAccount(detail, null);
        requirePlatformAnswer(detail, { agentId: me.id, messageId: sent.id, text, challenges, confirmations });
        await full();
        const account = await read(h, fullPage, "/api/platform/accounts/" + agent.id);
        await fullPage.goto(new URL("/plataforma/cuentas/" + agent.id, h.base).href); await openAction(fullPage, "Cambiar permisos");
        const permissions = fullPage.getByRole("dialog", { name: "Cambiar permisos de " + account.displayName, exact: true });
        await choosePermissions(fullPage, permissions, ["Ver cuentas"]); await permissions.getByRole("textbox", { name: /^Motivo/u }).fill("Verificar cuenta asociada de una consulta propia.");
        await uiWrite(fullPage, permissions.getByRole("button", { name: "Guardar cambios", exact: true }), "/api/platform/accounts/" + agent.id + "/operator", "PUT", 200, fullEmail);
        await permissions.waitFor({ state: "hidden" });
        me = await attend(true); assert.equal(me.id, agent.id);
        detail = await read(h, agentPage, route); requirePlatformChatAccount(detail, owner.me.id);
        await agentPage.goto(new URL("/plataforma/whatsapp/consultas/" + conversation.id, h.base).href); await input.waitFor();
        if (h.width === 390) {
          await agentPage.getByRole("button", { name: /^Acciones de /u }).click(); await agentPage.getByRole("menuitem", { name: "Ver la cuenta", exact: true }).waitFor();
        } else {
          const link = agentPage.getByRole("link", { name: "Ver la cuenta", exact: true }); await link.waitFor(); assert.equal(await link.getAttribute("href"), "/plataforma/cuentas/" + owner.me.id);
        }
        assert.equal((await read(h, agentPage, "/api/platform/accounts/" + owner.me.id)).id, owner.me.id);
        return "attend respondió201 con F2 vencido sin desafío ni confirmación y tomó su chat; accountId/enlace ausentes. Con accounts.read concedido por UI, misma consulta y cuenta propia coinciden.";
      },
      restore: async (before) => { await full(); await setConsultations(h, fullPage, before.consultationsEnabled, fullEmail); },
    }));
  } finally {
    if (team) { try { await manage(); await deleteTeam(h, managerPage, manager.email, teamName); team = undefined; } catch (error) { failures.push(error); } }
    if (originalBot) {
      try {
        await full();
        const current = await read(h, fullPage, root + "/bot");
        if (current.welcome !== originalBot.welcome) await saveWelcome(h, fullPage, originalBot.welcome, fullEmail);
      } catch (error) { failures.push(error); }
    }
    try { await sessions.leave(); } catch (error) { failures.push(error); }
    try { await leavePublic(); } catch (error) { failures.push(error); }
    for (const page of pages) { try { await stopConfirmingRecentAuthentication(page); await page.close(); } catch (error) { failures.push(error); } }
  }
  if (failures.length) throw new AggregateError(failures, "No se completó la salida por UI de WhatsApp de Plataforma.");
  return result01;
}
