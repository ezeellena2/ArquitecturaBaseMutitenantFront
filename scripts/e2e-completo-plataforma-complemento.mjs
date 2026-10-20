import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { fillOtp } from "./test-e2e-real-ui.mjs";
import { plainTextBody } from "./test-e2e-real-mail.mjs";
import { responsesForAction } from "./test-e2e-real-whatsapp-action.mjs";
import { recoveryRow, selectRecovery } from "./test-e2e-real-whatsapp-recovery.mjs";
import { requireE8Control, sendWithCooldown } from "./recorrido-usuario-whatsapp.mjs";
import { assertPlatformProblem, createPlatformRecorder } from "./e2e-completo-plataforma.mjs";
import { openAccountActions } from "./test-e2e-real-e9.mjs";
import { syntheticEmail, requireSyntheticEmail } from "./e2e-completo-soporte.mjs";
import { confirmRecentAuthentication, confirmRecentAuthenticationWhenAsked, stopConfirmingRecentAuthentication } from "./platform-factor-real.mjs";
import { openPlatformSettings, savePlatformSettings, restorableSettings, withRestoredSettings } from "./test-e2e-real-whatsapp-settings.mjs";
import { parseLegalPublicationReceipt, acceptPublishedLegalAndReturn, assertPendingTerms } from "./test-e2e-real-legal.mjs";
import { journeyDate } from "./recorrido-usuario.mjs";
import { createAssistantControl } from "./assistant-real-control.mjs";
import { acceptAssistantNoticeFromHome } from "./assistant-real-ui.mjs";

const definition = (number, actor, action, route, expected, covers = []) => ({ id: `PLAT-C-${String(number).padStart(2, "0")}`, area: "Complemento de Plataforma", actor, action, route, expected, covers, critical: true, source: "scripts/e2e-completo-plataforma-complemento.mjs" });
export const supplementPlatformDefinitions = [
  definition(1, "Persona, Dueño y operador completo nuevos", "Preparar fixtures propias por UI", "/registro · /registro/empresa · /plataforma", "Cuenta y organización propias, sesiones públicas cerradas y operador con los permisos necesarios."),
  definition(2, "Operador con operators.manage", "Invitar dos operadores nuevos por UI", "/plataforma/cuentas", "Correo libre, permiso elegido, 201 y pickup; ambos quedan Invited sin Personal ni organizaciones.", ["BACK-PL-020"]),
  definition(3, "Operador con operators.manage", "Invitar una persona existente y un operador pendiente", "/plataforma/cuentas", "409 AccountExists e InvitationExists en el formulario, sin mezclar las cuentas.", ["BACK-PL-021"]),
  definition(4, "Operador con operators.manage", "Reenviar, revocar y volver a invitar el mismo correo", "/plataforma/cuentas/:id", "Reenvío renueva plazo y pickup; revocación responde204, ficha404 y correo libre para otra invitación.", ["BACK-PL-022"]),
  definition(5, "Operador con todos los permisos", "Intentar cambiar o quitar su propio acceso", "/plataforma/cuentas/:id", "La UI oculta las acciones propias; PUT/DELETE responden403 Users.User.CannotModifySelf. No certifica LastManager."),
  definition(6, "Operador nuevo con sólo audit.read", "Buscar y filtrar una organización desde Auditoría", "/plataforma/auditoria", "Selector paginado y listado funcionan con audit.read; tenants/paged403 y el token no posee tenants.read.", ["BACK-PL-030"]),
  definition(7, "Visitante y operador con gestión de recuperaciones", "Rechazar Phone inexistente y recuperación de operadora", "/recuperar · /plataforma/recuperaciones", "Phone anterior desconocido400 sin código; aprobar un pedido de operadora409 OperatorAccount. No certifica la rama Sin cuenta.", ["BACK-RE-002"]),
  definition(8, "Operador con recoveries.manage", "Rechazar un pedido propio con dos revisores abiertos", "/plataforma/recuperaciones", "Rechazo200 versiona la fila; el correo del destino confirma el rechazo sin motivo interno.", ["BACK-RE-006"]),
  definition(9, "Segundo revisor con versión anterior", "Rechazar con la versión ya resuelta por el primero", "/plataforma/recuperaciones", "409 General.ConcurrencyConflict con borrador conservado; la fila sigue Rejected y conserva el motivo ganador.", ["BACK-RE-009"]),
  definition(10, "Persona Phone y operador de recuperaciones", "Ocupar por UI el destino probado antes de aprobar", "/recuperar · /registro · /plataforma/recuperaciones", "Aprobar409 MethodInUse; pedido Pending, misma versión y métodos originales intactos.", ["BACK-RE-008"]),
  definition(11, "Operador con tenants.manage", "Crear organización desde el listado e invitar Dueño", "/plataforma/organizaciones", "Crear abre el formulario, guarda organización/primera empresa, abre su ficha y Dueños; invitación real en pickup.", ["GUIA-crear-una-organizacion-01", "GUIA-crear-una-organizacion-02", "GUIA-crear-una-organizacion-03"]),
  definition(12, "Dueño nuevo y operador de configuración", "Preparar alta pendiente con RequiresApproval temporal", "/registro/empresa", "Alta propia requiresApproval y Recibimos el pedido; la política se restaura por UI en finally antes de continuar."),
  definition(13, "Operador y Dueño destinatario por correo", "Revisar desde Para resolver, aprobar con motivo y recibir aviso", "/plataforma · /plataforma/organizaciones/:id", "Revisar lleva a la ficha propia; Historial, Dueños y Página cargan; aprobar activa con motivo y emite correo real.", ["GUIA-aprobar-una-organizacion-01", "GUIA-aprobar-una-organizacion-02", "GUIA-aprobar-una-organizacion-03", "GUIA-aprobar-una-organizacion-04", "GUIA-aprobar-una-organizacion-05"]),
  definition(14, "Operador con legal.manage", "Publicar términos nuevos vigentes por UI", "/plataforma/legales/nueva", "Abre Publicar versión nueva, elige documento/fecha/ambos idiomas, confirma201 y conserva recibo/versionado.", ["GUIA-publicar-una-version-legal-01", "GUIA-publicar-una-version-legal-02"]),
  definition(15, "Dueño de organización propia", "Aceptar la nueva versión al volver a ingresar", "/aceptar-terminos", "La versión del recibo figura pendiente; casilla explícita, POST204, retorno empresarial200 y Me sin pendientes.", ["GUIA-publicar-una-version-legal-03", "SCREEN-aceptar-terminos"]),
];

export function supplementPhoneFixtures(width) {
  assert.ok([1440, 390].includes(width)); const offset = width === 1440 ? 0 : 1;
  return Object.fromEntries(["unknown", "operatorNext", "owner", "occupiedNext"].map((name, index) => [name, `+54911345678${10 + index * 2 + offset}`]));
}
export function requireAuditOnlyActor(me) {
  assert.equal(me.access, "platform"); assert.deepEqual(me.effectivePermissions.platform, ["platform.audit.read"]);
}
export function requirePendingOperator(detail, permissions) {
  assert.equal(detail.kind, "Operator"); assert.equal(detail.state, "Invited"); assert.equal(detail.hasPersonalSpace, false);
  assert.deepEqual(detail.organizations, []); assert.deepEqual([...detail.operatorPermissions].sort(), [...permissions].sort());
}
export function requireRecoveryUnchanged(before, after, methodsBefore, methodsAfter) {
  assert.equal(after.id, before.id); assert.equal(after.status, "Pending"); assert.equal(after.version, before.version);
  assert.deepEqual(methodsAfter, methodsBefore);
}
export function requireRejectedNotice(eml, reason) {
  const text = plainTextBody(eml); assert.ok(text?.includes("No pudimos recuperar tu cuenta"));
  assert.ok(text.includes("no pudimos confirmar que la cuenta sea tuya")); assert.equal(text.includes(reason), false);
}

const endpoint = (route, method = "POST") => (response) => new URL(response.url()).pathname === route && response.request().method() === method;
const operatorByPage = new WeakMap();
async function clickHttp(page, button, route, status, method = "POST") {
  const send = async () => (await responsesForAction(page, [endpoint(route, method)], () => button.click({ timeout: 90_000 })))[0];
  const principal = route.startsWith("/api/platform/") ? operatorByPage.get(page) : null;
  if (principal) await stopConfirmingRecentAuthentication(page);
  try {
    let response = status === 202 ? await sendWithCooldown(send) : await send();
    if (principal && response.status() === 403 && status !== 403) {
      await page.getByRole("dialog", { name: "Confirmá que sos vos", exact: true }).waitFor();
      const replay = page.waitForResponse((reply) => endpoint(route, method)(reply) && reply.status() !== 403);
      void replay.catch(() => {});
      await confirmRecentAuthentication(page, principal); response = await replay;
    }
    assert.equal(response.status(), status); return response;
  } finally { if (principal) await confirmRecentAuthenticationWhenAsked(page, principal); }
}
async function read(h, page, route) {
  const response = await h.api(page, route); assert.equal(response.status(), 200); return response.json();
}
async function notice(env, email, before, predicate) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    const found = (await env.messages(email, before)).find(({ body }) => predicate(plainTextBody(body) ?? ""));
    if (found) return found.body;
    await delay(250);
  }
  throw new Error("No llegó el aviso esperado al pickup propio.");
}
async function whatsapp(page, phone, label = /^(Tu )?número de WhatsApp$/iu) {
  await page.getByRole("button", { name: "WhatsApp", exact: true }).click();
  await page.getByRole("textbox", { name: label }).fill(phone);
}
async function inviteOperator(h, page, email, status = 201) {
  requireSyntheticEmail(email);
  await page.goto(new URL("/plataforma/cuentas", h.base).href);
  await page.getByRole("button", { name: "Invitar operador", exact: true }).filter({ visible: true }).first().click();
  const dialog = page.getByRole("dialog", { name: "Invitar operador", exact: true });
  await dialog.getByRole("textbox", { name: "Correo", exact: true }).fill(email);
  const picker = dialog.getByRole("button", { name: "Permisos de plataforma", exact: true });
  await picker.focus(); await picker.press("ArrowDown");
  assert.equal(await page.getByRole("menuitemcheckbox").count(), 14);
  await page.getByRole("menuitemcheckbox", { name: "Ver la auditoría", exact: true }).click();
  await page.keyboard.press("Escape");
  const before = new Set(await h.env.files());
  const response = await clickHttp(page, dialog.getByRole("button", { name: "Invitar", exact: true }), "/api/platform/operators/invitations", status);
  if (status !== 201) return { response, dialog, before };
  const issued = await response.json(); assert.ok(issued.id && issued.expiresAtUtc);
  await dialog.waitFor({ state: "hidden" });
  const detail = await read(h, page, `/api/platform/accounts/${issued.id}`);
  requirePendingOperator(detail, ["platform.audit.read"]);
  await notice(h.env, email, before, (text) => /operador/iu.test(text));
  return { ...issued, email, detail };
}
async function registerPhone(h, page, phone, scenario) {
  const fixture = await requireE8Control(h.env)(scenario, phone);
  await page.goto(new URL("/registro", h.base).href); await whatsapp(page, phone);
  await page.getByRole("checkbox", { name: /Acepto los Términos/ }).check();
  await clickHttp(page, page.getByRole("button", { name: "Crear cuenta", exact: true }), "/api/auth/signup", 202);
  await fillOtp(page, (await fixture("code")).proof);
  await clickHttp(page, page.getByRole("button", { name: "Verificar y crear la cuenta", exact: true }), "/api/auth/signup/verify", 204);
  await page.waitForURL((url) => url.pathname === "/");
  await page.getByRole("navigation", { name: "Secciones", exact: true }).or(page.getByRole("button", { name: /, Personal$/ })).filter({ visible: true }).first().waitFor();
  const me = await read(h, page, "/api/me"); assert.equal(me.access, "consumer");
  return me;
}
async function requestRecovery(h, page, previous, next, scenario) {
  const phone = next.startsWith("+"); const fixture = phone ? await requireE8Control(h.env)(scenario, next) : null;
  await page.goto(new URL("/recuperar", h.base).href);
  if (previous.startsWith("+")) await whatsapp(page, previous, /Número de WhatsApp$/u);
  else await page.getByRole("textbox", { name: "Correo electrónico", exact: true }).fill(previous);
  await clickHttp(page, page.getByRole("button", { name: "Seguir", exact: true }), "/api/account-recovery/preview", 204);
  await page.getByRole("heading", { name: "¿Dónde te escribimos?", exact: true }).waitFor();
  if (phone) await whatsapp(page, next, /Número de WhatsApp nuevo$/u);
  else await page.getByRole("textbox", { name: "Correo electrónico nuevo", exact: true }).fill(next);
  const before = new Set(await h.env.files());
  await clickHttp(page, page.getByRole("button", { name: "Enviar código", exact: true }), "/api/account-recovery/code", 202);
  await fillOtp(page, phone ? (await fixture("code")).proof : await h.env.code(next, before));
  const replies = await responsesForAction(page, [endpoint("/api/account-recovery/verify"), endpoint("/api/account-recovery")], () => page.getByRole("button", { name: "Verificar", exact: true }).click());
  assert.equal(replies[0].status(), 204); assert.equal(replies[1].status(), 202);
  await page.getByRole("heading", { name: "Recibimos tu pedido", exact: true }).waitFor();
}
async function recoveryList(h, page, next) {
  return read(h, page, `/api/platform/recoveries/paged?page=1&pageSize=100&search=${encodeURIComponent(next)}`);
}
async function openRecovery(h, page, next, previous) {
  const [response] = await responsesForAction(page, [endpoint("/api/platform/recoveries/paged", "GET")], () => page.goto(new URL(`/plataforma/recuperaciones?search=${encodeURIComponent(next)}`, h.base).href));
  assert.equal(response.status(), 200); const items = (await response.json()).items;
  const pending = previous?.startsWith("+") ? selectRecovery(items, previous, next) : (() => { assert.equal(items.length, 1); return items[0]; })();
  assert.equal(pending.status, "Pending");
  await recoveryRow(page, pending).getByRole("button", { name: /^Acciones de/ }).click();
  await page.getByRole("menuitem", { name: "Revisar", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Revisar el pedido", exact: true }); await dialog.waitFor();
  return { pending, dialog };
}
async function changeOrganization(h, page, id, action, reason) {
  const button = page.getByRole("button", { name: action, exact: true });
  if (await button.isVisible()) await button.click();
  else { const menu = page.getByRole("button", { name: /^Acciones de/ }); await menu.click(); await page.getByRole("menuitem", { name: action, exact: true }).click(); }
  const dialog = page.getByRole("dialog").filter({ has: page.getByRole("textbox", { name: /^Motivo/ }) });
  await dialog.getByRole("textbox", { name: /^Motivo/ }).fill(reason);
  const suffix = { Suspender: "suspend", Reactivar: "reactivate", Aprobar: "approve" }[action];
  await clickHttp(page, dialog.getByRole("button", { name: action, exact: true }), `/api/platform/tenants/${id}/${suffix}`, 200);
  await dialog.waitFor({ state: "hidden" });
}

export async function runSupplementPlatformCases(h) {
  const run = createPlatformRecorder(h); const pages = [];
  const newPage = async () => { const page = await h.newPage(); pages.push(page); return page; };
  const page = await newPage(); const publicPage = await newPage(); const auditPage = await newPage();
  const operatorEmail = h.width === 1440 ? "e2e-e9r-operator@example.test" : "e2e-e9l-operator@example.test";
  const phone = supplementPhoneFixtures(h.width); const tag = randomUUID().slice(0, 8);
  const step = (number, target, action, dependencies = []) => run(`PLAT-C-${String(number).padStart(2, "0")}`, target, action, dependencies.map((value) => `PLAT-C-${String(value).padStart(2, "0")}`));
  let person; let business; let operator; let audit; let disposable; let fullSignedIn = false; let auditSignedIn = false;
  let stalePage; let staleReview; let rejected; let publicSignedIn = false; let pendingOwner; let pendingBusiness; let publication;
  const url = (route) => new URL(route, h.base).href;
  const ensureFull = async () => {
    if (fullSignedIn) return;
    if (auditSignedIn) { await h.signOut(auditPage); auditSignedIn = false; }
    operator = await h.login(page, operatorEmail, "platform"); fullSignedIn = true;
    operatorByPage.set(page, operatorEmail);
  };
  try {
    await step(1, page, async () => {
      person = await h.registerPerson(publicPage); publicSignedIn = true; await h.signOut(publicPage); publicSignedIn = false;
      business = await h.registerBusiness(publicPage); publicSignedIn = true; await h.signOut(publicPage); publicSignedIn = false;
      await ensureFull();
      for (const permission of ["platform.operators.manage", "platform.recoveries.manage", "platform.tenants.manage", "platform.legal.manage"]) assert.ok(operator.effectivePermissions.platform.includes(permission));
      await page.goto(url(`/plataforma/organizaciones/${business.me.activeTenantId}`));
      // Dos transiciones propias dejan eventos reales para buscar esta organización desde Auditoría.
      await changeOrganization(h, page, business.me.activeTenantId, "Suspender", "Preparación del filtro de auditoría propio.");
      await changeOrganization(h, page, business.me.activeTenantId, "Reactivar", "Restaurar organización propia tras preparar auditoría.");
      return "Cuenta y organización propias creadas por UI; organización activa y operador completo con autenticador real.";
    });
    await step(2, page, async () => {
      audit = await inviteOperator(h, page, syntheticEmail("audit-only"));
      disposable = await inviteOperator(h, page, syntheticEmail("revocar-operador"));
      return "Dos altas201 por UI con audit.read y aviso pickup; cuentas Operator/Invited sin Personal ni organizaciones.";
    }, [1]);
    await step(3, page, async () => {
      for (const [email, code, text] of [[person.email, "Platform.Operator.AccountExists", "Ese correo ya tiene una cuenta. Un operador no puede tener perfiles de persona."], [disposable.email, "Platform.Operator.InvitationExists", "Ese correo ya tiene una invitación. Reenviala desde la lista."]]) {
        const attempt = await inviteOperator(h, page, email, 409); await assertPlatformProblem(attempt.response, 409, code);
        await attempt.dialog.getByText(text, { exact: true }).waitFor(); await attempt.dialog.getByRole("button", { name: "Cancelar", exact: true }).click();
        assert.equal((await h.env.messages(email, attempt.before)).length, 0);
      }
      return "Persona existente y operador pendiente fueron rechazados409 en Correo, sin emitir nuevas invitaciones.";
    }, [1, 2]);
    await step(4, page, async () => {
      await page.goto(url(`/plataforma/cuentas/${disposable.id}`)); await openAccountActions(page, disposable.email);
      const before = new Set(await h.env.files());
      const resent = await clickHttp(page, page.getByRole("menuitem", { name: "Reenviar invitación", exact: true }), `/api/platform/operators/${disposable.id}/invitation/resend`, 200);
      const renewed = await resent.json(); assert.ok(Date.parse(renewed.expiresAtUtc) > Date.parse(disposable.expiresAtUtc));
      await notice(h.env, disposable.email, before, (text) => /operador/iu.test(text));
      await openAccountActions(page, disposable.email); await page.getByRole("menuitem", { name: "Revocar invitación", exact: true }).click();
      const dialog = page.getByRole("dialog", { name: `¿Revocar la invitación a ${disposable.email}?`, exact: true });
      await clickHttp(page, dialog.getByRole("button", { name: "Revocar", exact: true }), `/api/platform/operators/${disposable.id}/invitation`, 204, "DELETE");
      await dialog.waitFor({ state: "hidden" });
      await assertPlatformProblem(await h.api(page, `/api/platform/accounts/${disposable.id}`), 404, "Users.User.NotFound");
      const reinvited = await inviteOperator(h, page, disposable.email); assert.notEqual(reinvited.id, disposable.id);
      return "Reenvío renovó plazo y correo real; revocar204 dejó ficha404 y el mismo correo pudo recibir otra invitación con ID nuevo.";
    }, [2]);
    await step(5, page, async () => {
      const own = await read(h, page, `/api/platform/accounts/${operator.id}`);
      await page.goto(url(`/plataforma/cuentas/${operator.id}`)); await page.getByRole("heading", { name: own.displayName, exact: true }).waitFor();
      for (const action of ["Cambiar permisos", "Quitar operador"]) assert.equal(await page.getByRole("button", { name: action, exact: true }).count(), 0);
      for (const method of ["PUT", "DELETE"]) await assertPlatformProblem(await h.api(page, `/api/platform/accounts/${operator.id}/operator`, { method, data: { version: own.operatorVersion, reason: "Negativo de autoedición propia.", ...(method === "PUT" ? { permissions: own.operatorPermissions } : {}) }, headers: { "Idempotency-Key": randomUUID() } }), 403, "Users.User.CannotModifySelf");
      const after = await read(h, page, `/api/platform/accounts/${operator.id}`); assert.equal(after.operatorVersion, own.operatorVersion); assert.deepEqual(after.operatorPermissions, own.operatorPermissions);
      return "Autoedición y retiro propios403 Users.User.CannotModifySelf; permisos/versión intactos. LastManager requiere otra fixture y no se certifica.";
    }, [1]);
    await step(6, auditPage, async () => {
      await h.signOut(page); fullSignedIn = false; await stopConfirmingRecentAuthentication(page);
      const me = await h.login(auditPage, audit.email, "platform"); auditSignedIn = true; requireAuditOnlyActor(me);
      await auditPage.goto(url("/plataforma/auditoria")); await auditPage.getByRole("heading", { name: "Auditoría", exact: true }).waitFor();
      if (h.width === 390) await auditPage.getByRole("button", { name: "Filtrar la auditoría", exact: true }).click();
      else { const filter = auditPage.getByRole("button", { name: "Organización: todas", exact: true }); await filter.focus(); await filter.press("ArrowDown"); }
      const [options] = await responsesForAction(auditPage, [(reply) => endpoint("/api/platform/audit/organizations/paged", "GET")(reply) && new URL(reply.url()).searchParams.get("search") === business.organization], () => auditPage.getByRole("searchbox", { name: "Filtrar por organización", exact: true }).fill(business.organization));
      assert.equal(options.status(), 200); assert.ok((await options.json()).items.some((item) => item.id === business.me.activeTenantId));
      const [filtered] = await responsesForAction(auditPage, [(reply) => endpoint("/api/platform/audit", "GET")(reply) && new URL(reply.url()).searchParams.get("tenantId") === business.me.activeTenantId], () => auditPage.getByRole(h.width === 390 ? "radio" : "menuitemradio", { name: business.organization, exact: true }).click());
      assert.equal(filtered.status(), 200); assert.equal(new URL(auditPage.url()).searchParams.get("tenantId"), business.me.activeTenantId);
      await assertPlatformProblem(await h.api(auditPage, "/api/platform/tenants/paged?page=1&pageSize=10"), 403, "Http.Forbidden");
      return "Auditor real con sólo audit.read buscó la organización por selector paginado y filtró200; Organizaciones sigue403.";
    }, [1, 2]);
    await step(7, page, async () => {
      await publicPage.goto(url("/recuperar")); await whatsapp(publicPage, phone.unknown, /Número de WhatsApp$/u);
      await assertPlatformProblem(await clickHttp(publicPage, publicPage.getByRole("button", { name: "Seguir", exact: true }), "/api/account-recovery/preview", 400), 400, "Platform.AccountRecovery.PhoneAccountNotFound");
      assert.equal(await publicPage.getByRole("textbox", { name: "Código 1", exact: true }).count(), 0);
      await ensureFull(); await requestRecovery(h, publicPage, operatorEmail, phone.operatorNext, `pc-operator-${h.width}-${tag}`);
      const review = await openRecovery(h, page, phone.operatorNext);
      await review.dialog.getByRole("textbox", { name: /Motivo/ }).fill("No se admite recuperar una operadora por esta vía.");
      await assertPlatformProblem(await clickHttp(page, review.dialog.getByRole("button", { name: "Aprobar", exact: true }), `/api/platform/recoveries/${review.pending.id}/approve`, 409), 409, "Platform.AccountRecovery.OperatorAccount");
      await review.dialog.getByText("La cuenta es de un operador de la plataforma: no se recupera desde acá.", { exact: true }).waitFor();
      const after = (await recoveryList(h, page, phone.operatorNext)).items.find((item) => item.id === review.pending.id); assert.equal(after.status, "Pending");
      await review.dialog.getByRole("button", { name: "Cancelar", exact: true }).click();
      return "Phone inexistente400 sin código; recuperar operadora409 con aviso UI y pedido Pending. No se creó artificialmente un pedido Sin cuenta.";
    }, [1]);
    await step(8, page, async () => {
      await ensureFull(); const next = syntheticEmail("rechazo"); await requestRecovery(h, publicPage, person.email, next);
      const review = await openRecovery(h, page, next); stalePage = await newPage(); operatorByPage.set(stalePage, operatorEmail); await confirmRecentAuthenticationWhenAsked(stalePage, operatorEmail);
      staleReview = await openRecovery(h, stalePage, next); assert.equal(staleReview.pending.version, review.pending.version);
      const reason = `Motivo interno ${tag}`; await review.dialog.getByRole("textbox", { name: /Motivo/ }).fill(reason);
      await staleReview.dialog.getByRole("textbox", { name: /Motivo/ }).fill("Segundo revisor conserva su borrador.");
      const before = new Set(await h.env.files());
      const response = await clickHttp(page, review.dialog.getByRole("button", { name: "Rechazar", exact: true }), `/api/platform/recoveries/${review.pending.id}/reject`, 200);
      assert.equal(response.request().postDataJSON().version, review.pending.version); await review.dialog.waitFor({ state: "hidden" });
      rejected = (await recoveryList(h, page, next)).items.find((item) => item.id === review.pending.id);
      assert.equal(rejected.status, "Rejected"); assert.notEqual(rejected.version, review.pending.version); assert.equal(rejected.reason, reason);
      requireRejectedNotice(await notice(h.env, next, before, (text) => text.includes("No pudimos recuperar tu cuenta")), reason);
      return "Rechazo por UI200 cambió versión a Rejected y el aviso real al destino no incluyó el motivo interno; segundo formulario sigue con su versión original.";
    }, [1]);
    await step(9, () => stalePage ?? page, async () => {
      await assertPlatformProblem(await clickHttp(stalePage, staleReview.dialog.getByRole("button", { name: "Rechazar", exact: true }), `/api/platform/recoveries/${staleReview.pending.id}/reject`, 409), 409, "General.ConcurrencyConflict");
      await staleReview.dialog.getByRole("alert").waitFor();
      assert.equal(await staleReview.dialog.getByRole("textbox", { name: /Motivo/ }).inputValue(), "Segundo revisor conserva su borrador.");
      const after = (await read(h, page, "/api/platform/recoveries/paged?page=1&pageSize=100")).items.find((item) => item.id === rejected.id);
      assert.equal(after.status, "Rejected"); assert.equal(after.version, rejected.version); assert.equal(after.reason, rejected.reason);
      return "Segundo revisor obtuvo409 General.ConcurrencyConflict con borrador intacto; no cambió la decisión ni el motivo ganador.";
    }, [8]);
    await step(10, page, async () => {
      await ensureFull(); const owner = await registerPhone(h, publicPage, phone.owner, `pc-owner-${h.width}-${tag}`); publicSignedIn = true;
      await h.signOut(publicPage); publicSignedIn = false;
      await requestRecovery(h, publicPage, phone.owner, phone.occupiedNext, `pc-recovery-${h.width}-${tag}`);
      const review = await openRecovery(h, page, phone.occupiedNext, phone.owner);
      const original = (await read(h, page, `/api/platform/accounts/${owner.id}`)).loginMethods;
      const second = await registerPhone(h, publicPage, phone.occupiedNext, `pc-occupied-${h.width}-${tag}`); publicSignedIn = true; assert.notEqual(second.id, owner.id);
      await h.signOut(publicPage); publicSignedIn = false;
      await review.dialog.getByRole("textbox", { name: /Motivo/ }).fill("El destino cambió de propietario después de verificarse.");
      await assertPlatformProblem(await clickHttp(page, review.dialog.getByRole("button", { name: "Aprobar", exact: true }), `/api/platform/recoveries/${review.pending.id}/approve`, 409), 409, "Platform.AccountRecovery.MethodInUse");
      await review.dialog.getByText("Ese método de ingreso ya es de otra cuenta.", { exact: true }).waitFor();
      const after = selectRecovery((await recoveryList(h, page, phone.occupiedNext)).items, phone.owner, phone.occupiedNext);
      requireRecoveryUnchanged(review.pending, after, original, (await read(h, page, `/api/platform/accounts/${owner.id}`)).loginMethods);
      await review.dialog.getByRole("button", { name: "Cancelar", exact: true }).click();
      return "Otra cuenta probó el Phone después del pedido; aprobar409 MethodInUse mantuvo Pending, versión y métodos originales sin cambios.";
    }, [1]);
    await runVisibleJourneys();
  } finally {
    if (publicSignedIn) {
      try { await h.signOut(publicPage); }
      catch {
        // La identidad del alta pendiente todavía no tiene marco privado: elige explícitamente la puerta Personal.
        await publicPage.goto(url("/login"));
        const terms = publicPage.getByRole("heading", { name: "Actualizamos los términos", exact: true });
        await terms.or(publicPage.getByRole("navigation", { name: "Secciones", exact: true })).or(publicPage.getByRole("button", { name: /, Personal$/ })).filter({ visible: true }).first().waitFor();
        if (await terms.isVisible()) { await publicPage.getByRole("checkbox", { name: /Leí y acepto/ }).check(); await clickHttp(publicPage, publicPage.getByRole("button", { name: "Aceptar y seguir", exact: true }), "/api/legal/accept", 204); }
        await h.signOut(publicPage);
      }
    }
    if (auditSignedIn) await h.signOut(auditPage).catch(() => {});
    if (fullSignedIn) await h.signOut(page).catch(() => {});
    for (const target of pages) if (!target.isClosed()) { await stopConfirmingRecentAuthentication(target); await target.close(); }
  }

  async function runVisibleJourneys() {
    await step(11, page, async () => {
      await ensureFull(); const name = `Creada por Plataforma ${h.width} ${tag}`; const email = syntheticEmail("owner-plataforma");
      await page.goto(url("/plataforma/organizaciones")); await page.getByRole("button", { name: "Crear organización", exact: true }).filter({ visible: true }).first().click();
      const dialog = page.getByRole("dialog"); await dialog.getByRole("textbox", { name: "Nombre de la organización" }).fill(name);
      await dialog.getByRole("textbox", { name: "Primera empresa" }).fill(`${name} Centro`); await dialog.getByRole("textbox", { name: "Correo del Dueño" }).fill(email);
      const before = new Set(await h.env.files()); const response = await clickHttp(page, dialog.getByRole("button", { name: "Crear organización", exact: true }), "/api/platform/tenants", 201);
      const created = await response.json(); assert.ok(created.id); await dialog.waitFor({ state: "hidden" });
      await page.goto(url(`/plataforma/organizaciones/${created.id}`)); await page.getByRole("heading", { name, exact: true }).waitFor();
      await page.getByRole("tab", { name: /^Dueños/ }).click(); await page.getByText("Invitación pendiente", { exact: true }).waitFor();
      const mail = await notice(h.env, email, before, (text) => /invit/iu.test(text)); assert.ok(plainTextBody(mail)?.includes(name));
      return "Listado→Crear guardó organización/primera empresa e invitó Dueño; ficha y Dueños muestran Invitación pendiente y pickup contiene la invitación real.";
    }, [1]);
    await step(12, publicPage, async () => {
      await ensureFull(); let current;
      await withRestoredSettings({
        read: async () => current = await openPlatformSettings(page, h.base.origin),
        prepare: async (baseline) => { current = await savePlatformSettings(page, current, { ...restorableSettings(baseline), consumerSignup: "Open", businessSignup: "RequiresApproval" }, "Preparar solicitud propia pendiente de aprobación."); },
        body: async () => {
          pendingOwner = syntheticEmail("owner-pendiente"); const name = `Pendiente complemento ${h.width} ${tag}`; const slug = `pc-${h.width}-${tag}`;
          await publicPage.goto(url("/registro/empresa")); await publicPage.getByRole("checkbox", { name: /Acepto los Términos/ }).check();
          await publicPage.getByRole("textbox", { name: "Tu correo electrónico", exact: true }).fill(pendingOwner);
          const before = new Set(await h.env.files()); await clickHttp(publicPage, publicPage.getByRole("button", { name: "Continuar", exact: true }), "/api/auth/business-signup/code", 202);
          await fillOtp(publicPage, await h.env.code(pendingOwner, before)); await clickHttp(publicPage, publicPage.getByRole("button", { name: "Verificar", exact: true }), "/api/auth/business-signup/verify", 204); publicSignedIn = true;
          await publicPage.getByRole("heading", { name: "Tu organización", exact: true }).waitFor();
          await publicPage.getByRole("textbox", { name: "Nombre de la organización", exact: true }).fill(name); await publicPage.getByRole("textbox", { name: /Dirección de tu página/ }).fill(slug); await publicPage.getByRole("textbox", { name: "Primera empresa", exact: true }).fill(`${name} Centro`); await publicPage.getByText("Disponible", { exact: true }).waitFor();
          const response = await clickHttp(publicPage, publicPage.getByRole("button", { name: "Crear organización", exact: true }), "/api/auth/business-signup", 200); assert.equal((await response.json()).requiresApproval, true);
          await publicPage.getByRole("heading", { name: "Recibimos el pedido", exact: true }).waitFor();
          const matches = (await read(h, page, `/api/platform/tenants/paged?page=1&pageSize=100&search=${encodeURIComponent(name)}`)).items; assert.equal(matches.length, 1); pendingBusiness = matches[0]; assert.equal(pendingBusiness.status, "PendingApproval");
        },
        restore: async (baseline) => { current = await openPlatformSettings(page, h.base.origin); await savePlatformSettings(page, current, restorableSettings(baseline), "Restaurar política inicial antes de continuar el complemento."); },
      });
      return "Alta propia PendingApproval/Recibimos el pedido; RequiresApproval temporal restaurado por UI en finally.";
    }, [1]);
    await step(13, page, async () => {
      await ensureFull(); await createAssistantControl(h.env.command)("prepare", { email: operatorEmail, access: "platform" });
      await page.goto(url("/plataforma")); await acceptAssistantNoticeFromHome(page);
      const pending = page.getByRole("region", { name: "Para resolver", exact: true }); await pending.getByText(pendingBusiness.name, { exact: true }).waitFor();
      await pending.getByRole("link", { name: "Revisar", exact: true }).and(page.locator(`a[href='/plataforma/organizaciones/${pendingBusiness.id}']`)).click(); await page.getByRole("heading", { name: pendingBusiness.name, exact: true }).waitFor();
      for (const title of ["Historial", "Dueños", "Página pública"]) {
        await page.getByRole("tab", { name: new RegExp(`^${title}`) }).click(); const panel = page.getByRole("tabpanel"); await panel.waitFor(); await panel.getByRole("status").waitFor({ state: "hidden" });
        assert.ok((await panel.innerText()).trim().length > 0); assert.equal(await panel.getByRole("alert").count(), 0);
      }
      const before = new Set(await h.env.files()); const reason = "Datos propios verificados para aprobar la organización.";
      await changeOrganization(h, page, pendingBusiness.id, "Aprobar", reason); await page.getByText("Activa", { exact: true }).first().waitFor();
      const persisted = await read(h, page, `/api/platform/tenants/${pendingBusiness.id}`); assert.equal(persisted.status, "Active"); assert.equal(persisted.lastStateChange.reason, reason);
      await notice(h.env, pendingOwner, before, (text) => /aprobad/iu.test(text));
      return "Para resolver→Revisar abrió la solicitud; se revisaron Historial/Dueños/Página, se aprobó con motivo y la cuenta Dueña recibió el correo de aprobación real, sin certificar WhatsApp.";
    }, [12]);
    await step(14, page, async () => {
      // Cierra explícitamente la identidad pública creada por el alta pendiente antes del nuevo ingreso del Dueño.
      if (publicSignedIn) { await publicPage.goto(url("/login")); await publicPage.waitForURL((target) => target.pathname === "/"); await publicPage.getByRole("navigation", { name: "Secciones", exact: true }).or(publicPage.getByRole("button", { name: /, Personal$/ })).filter({ visible: true }).first().waitFor(); await read(h, publicPage, "/api/me"); await h.signOut(publicPage); publicSignedIn = false; }
      await ensureFull(); await page.goto(url("/plataforma/legales")); await page.getByRole("link", { name: "Publicar versión nueva", exact: true }).first().click();
      await page.getByRole("combobox", { name: "Documento" }).click(); await page.getByRole("option", { name: /Términos y condiciones/ }).click();
      await page.getByRole("textbox", { name: "Vigente desde" }).fill(journeyDate().split("-").reverse().join("/"));
      await page.getByRole("textbox", { name: "En español" }).fill(`Términos del escenario aislado ${tag}: uso del servicio y responsabilidades de la cuenta.`);
      await page.getByRole("textbox", { name: "En inglés" }).fill(`Terms for isolated scenario ${tag}: service use and account responsibilities.`);
      await page.getByRole("button", { name: "Publicar", exact: true }).click();
      const response = await clickHttp(page, page.getByRole("alertdialog").getByRole("button", { name: "Publicar", exact: true }), "/api/platform/legal-documents", 201);
      publication = parseLegalPublicationReceipt(await response.text()); assert.equal(response.request().postDataJSON().kind, "Terms");
      await acceptPublishedLegalAndReturn(page, publication, "/api/platform/legal-documents");
      return "Desde Documentos legales se publicó Terms201 con vigencia de hoy y ambos idiomas; recibo y aceptación del operador confirmados por HTTP real.";
    }, [1]);
    await step(15, publicPage, async () => {
      await publicPage.goto(url("/login/empresa")); await publicPage.getByRole("textbox", { name: "Correo electrónico", exact: true }).fill(business.email);
      const before = new Set(await h.env.files()); await clickHttp(publicPage, publicPage.getByRole("button", { name: "Enviar código", exact: true }), "/api/auth/login-code", 202);
      await fillOtp(publicPage, await h.env.code(business.email, before)); await clickHttp(publicPage, publicPage.getByRole("button", { name: "Verificar", exact: true }), "/api/auth/login-code/verify", 200); publicSignedIn = true;
      await publicPage.getByRole("heading", { name: "Actualizamos los términos", exact: true }).waitFor(); assertPendingTerms(await read(h, publicPage, "/api/me"), publication);
      await acceptPublishedLegalAndReturn(publicPage, publication, "/api/me"); await publicPage.waitForURL((target) => target.pathname === "/org");
      const me = await read(h, publicPage, "/api/me"); assert.equal(me.access, "business"); assert.equal(me.activeTenantId, business.me.activeTenantId); assert.equal(me.pendingLegalDocuments.length, 0);
      return "Dueño ingresó por OTP, vio pendiente el recibo Terms recién publicado, marcó la casilla y aceptó204; volvió a su organización con Me200 sin pendientes.";
    }, [1, 14]);
  }
}
