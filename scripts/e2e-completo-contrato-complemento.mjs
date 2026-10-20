import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { fillOtp } from "./test-e2e-real-ui.mjs";
import { watchResponses } from "./test-e2e-real-e9.mjs";
import { sendWithCooldown } from "./recorrido-usuario-whatsapp.mjs";
import { confirmRecentAuthentication, stopConfirmingRecentAuthentication } from "./platform-factor-real.mjs";
import { clickForResponse, requireProblem } from "./e2e-completo-negocio.mjs";
import { openPlatformSettings } from "./test-e2e-real-whatsapp-settings.mjs";
import { cleanupContinuationSessions } from "./e2e-completo-continuacion.mjs";
import { assertViewport } from "./e2e-completo-personal.mjs";

export const contractSupplementDefinitions = [
  { id: "CON-01", area: "Sesión histórica", actor: "Otra persona con organización propia y operador con sesión separada", action: "Abrir las dos puertas con la cookie pública firmada del operador anterior", route: "/login · /login/empresa", expected: "Cada puerta retira sólo el legado público, admite a la cuenta por OTP y conserva la misma sesión de Plataforma tras F5, en un único contexto persistente.", covers: ["BACK-ID-029"], critical: true, source: "scripts/test-e2e-real.test.mjs#A8: sesiones antiguas abren ambas puertas y conservan Plataforma a 1440 y 390" },
  { id: "CON-02", area: "Contrato HTTP", actor: "Dueña de organización propia y operador con settings.manage y MFA", action: "Agotar la cuota compartida al guardar un rol y reintentar sólo a mano", route: "/org/roles/:id", expected: "429 Security.RateLimit.Exceeded con Retry-After; cuenta regresiva avanza, botón apagado y borrador intacto; nada se reenvía al vencer; reintento manual200. La cuota original se restaura por UI en finally.", covers: ["BACK-HT-003"], critical: true, source: "scripts/test-e2e-real-e9.mjs#E9-9: una cuota baja frena «Guardar» de un rol con su cuenta y el reintento es a mano" },
  { id: "CON-03", area: "Contrato HTTP", actor: "Dueña de una organización creada por UI", action: "Perder el201 de un rol confirmado y reintentar con la misma clave y cuerpo", route: "/org/roles/nuevo · /api/roles", expected: "Reintentar por UI conserva bytes y clave, reproduce201 con Idempotent-Replayed:true y mismo ID; replay API idéntico y cuerpo cambiado422 Request.IdempotencyKeyReused dejan un solo recurso y evento de creación.", covers: ["BACK-HT-002"], critical: true, source: "back:docs/rules/idempotencia.md; src/areas/business/roles/pages/RoleEditorPage.tsx; back:src/ArquitecturaBaseMultitenant.Api/Idempotency/IdempotencyFilter.cs" },
  { id: "CON-04", area: "Contrato HTTP", actor: "Dueña con borrador de Configuración", action: "Reintentar consulta/guardado sin transporte y abandonar una respuesta tardía real", route: "/org/configuracion", expected: "GET fallido muestra error común y Reintentar carga200; PUT fallido conserva borrador y sólo Reintentar guarda200. Otro PUT200 retenido llega después de salir y reabrir por UI: no muestra éxito, no navega ni reemplaza el nuevo borrador. El grupo suma el offline real de PER15/16.", covers: [], critical: true, source: "src/areas/business/settings/pages/SettingsPage.tsx; src/shared/api/queryClient.ts; scripts/e2e-completo-personal.mjs#NUEVO-PER-15/16" },
];
// La cuota global se prueba sola, con un único ancho y entorno propio: nunca en el lote compartido.
export const contractQuotaRepairDefinitions = contractSupplementDefinitions.filter((entry) => entry.id === "CON-02");
export const contractTransportRepairDefinitions = contractSupplementDefinitions.filter((entry) => ["CON-03", "CON-04"].includes(entry.id));
export const contractSharedDefinitions = contractSupplementDefinitions.filter((entry) => entry.id !== "CON-02");

export const contractSupplementProofGroups = { "BACK-HT-004": [["NUEVO-PER-15", "NUEVO-PER-16", "CON-04"]] };

export function assertSameIdempotentAttempt(original, replay) {
  assert.match(original.key, /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/iu);
  assert.ok(typeof original.body === "string" && original.body.length > 0);
  assert.equal(replay.key, original.key, "El reintento debe conservar la clave del formulario.");
  assert.equal(replay.body, original.body, "El hash exige los mismos bytes del cuerpo, no sólo JSON equivalente.");
}

export async function requireSuccessfulRoleReplay(original, response) {
  assert.equal(original.status, 201); assert.equal(response.status(), original.status);
  assert.equal(response.headers()["idempotent-replayed"], "true");
  const body = await response.text(); assert.equal(body, original.body);
  const id = JSON.parse(body); assert.match(id, /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/iu); return id;
}

export function assertSingleRoleEffects(original, replay, roleId, roleName) {
  assert.equal(original.role.id, roleId); assert.equal(original.role.name, roleName);
  assert.equal(original.roles.totalCount, 1);
  assert.deepEqual(original.roles.items.map((role) => ({ id: role.id, name: role.name })), [{ id: roleId, name: roleName }]);
  assert.equal(original.audit.hasMore, false);
  assert.equal(original.audit.items.length, 1, "La creación real debe tener exactamente una entrada auditable.");
  const event = original.audit.items[0]; assert.equal(event.entityType, "Role"); assert.equal(event.action, "Created"); assert.equal(event.affectedDisplayName, roleName);
  assert.deepEqual(replay, original, "El replay y la clave reutilizada no deben cambiar el recurso ni sus eventos.");
}

export function assertAbandonedSettings(actual, expected) {
  assert.equal(actual.route, expected.route); assert.equal(actual.draft, expected.draft);
  assert.equal(actual.successes, 0, "La respuesta tardía no debe anunciar éxito de una operación abandonada.");
  assert.equal(actual.writes, expected.writes, "La respuesta tardía no puede enviar otra escritura.");
}

const publicCookieName = ".AspNetCore.Identity.Application";
const platformCookieName = ".AspNetCore.Identity.Platform";
export function assertLegacyDoorCookies(before, after) {
  assert.ok(before.some((cookie) => cookie.name === publicCookieName), "Antes de tocar la puerta debe estar el legado real.");
  assert.ok(before.some((cookie) => cookie.name === platformCookieName), "Plataforma debe tener su cookie independiente.");
  assert.equal(after.some((cookie) => cookie.name === publicCookieName), false, "La puerta debe retirar la cookie pública antigua.");
  assert.ok(after.some((cookie) => cookie.name === platformCookieName), "Retirar el legado no puede borrar Plataforma.");
}
export async function requireSharedQuotaResponse(response) {
  assert.equal(response.status(), 429);
  const problem = await response.json(); assert.equal(problem.code, "Security.RateLimit.Exceeded");
  assert.ok(Number.isInteger(problem.retryAfter) && problem.retryAfter > 0);
  assert.equal(response.headers()["retry-after"], String(problem.retryAfter));
  return problem;
}
export function assertNoAutomaticRoleRetry(atLimit, writes) {
  assert.equal(writes.length, atLimit, "La cuenta regresiva y su vencimiento no reenvían escrituras.");
}
function quotaFailureDescription(error) {
  const message = String(error?.message ?? error)
    .replace(/\bhttps?:\/\/[^\s"'<>]+/giu, (value) => { try { return new URL(value).pathname; } catch { return "[URL]"; } })
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/giu, "Bearer [oculto]");
  const compact = (value, limit) => value.length <= limit ? value : value.slice(0, limit - 1) + "…";
  const lines = message.split(/\r?\n/u).map((line) => line.replace(/\s+/gu, " ").trim()).filter(Boolean);
  const first = lines[0] ?? "Sin detalle"; const waiting = lines.find((line) => /\bwaiting\b/iu.test(line));
  const detail = waiting && waiting !== first ? `${compact(first, 200)} · ${waiting}` : first;
  return compact(`${compact(String(error?.name ?? "Error").replace(/\s+/gu, " ").trim(), 50)}: ${detail}`, 450);
}
export async function withRestoredTenantQuota({ read, prepare, body, restore }) {
  const original = await read(); const failures = []; const phases = []; let result; let phase = "prepare";
  try { await prepare(original); phase = "body"; result = await body(original); }
  catch (error) { failures.push(error); phases.push(phase); }
  finally { try { await restore(original); } catch (error) { failures.push(error); phases.push("restore"); } }
  if (failures.length === 1) throw failures[0];
  if (failures.length > 1) throw new AggregateError(failures, "Fallaron la cuota compartida y su restauración por UI. " + failures.map((error, index) => `${phases[index]}: ${quotaFailureDescription(error)}`).join(" | "));
  return result;
}

const pathOf = (response) => new URL(response.url()).pathname;
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const read = async (h, page, route) => { const response = await h.api(page, route); assert.equal(response.status(), 200); return response.json(); };
const appFrame = (h, page, profile) => page.getByRole(h.width === 390 ? "navigation" : "button", h.width === 390 ? { name: "Secciones", exact: true } : { name: new RegExp(`, ${escapeRegex(profile)}$`, "u") }).filter({ visible: true }).first().waitFor();
const operatorOf = (width) => width === 1440 ? "e2e-a3-operator@example.test" : "e2e-a1-operator@example.test";
const roleWrite = (roleId) => (method, path) => method === "PUT" && path === `/api/roles/${roleId}`;

async function loginOpenDoor(h, page, email) {
  await page.getByRole("textbox", { name: "Correo electrónico", exact: true }).fill(email);
  const before = new Set(await h.env.files());
  const sent = await sendWithCooldown(() => clickForResponse(page, page.getByRole("button", { name: "Enviar código", exact: true }), "/api/auth/login-code", "POST", null));
  assert.equal(sent.status(), 202); await page.getByRole("heading", { name: "Revisá tu correo", exact: true }).waitFor();
  await fillOtp(page, await h.env.code(email, before));
  await clickForResponse(page, page.getByRole("button", { name: "Verificar", exact: true }), "/api/auth/login-code/verify", "POST");
}

async function checkLegacyDoors(h, page, platformPage, state) {
  const person = await h.registerBusiness(page); state.publicSignedIn = true;
  await h.signOut(page); state.publicSignedIn = false;
  const operator = await h.login(platformPage, operatorOf(h.width), "platform"); state.platformSignedIn = true;
  assert.equal(operator.access, "platform");
  for (const [access, entryName, profile, route] of [["consumer", "Ingresá", "Personal", "/"], ["business", "Ingresá como empresa", person.organization, "/org"]]) {
    await page.goto(h.base.href);
    const entry = page.getByRole("link", { name: entryName, exact: true }).filter({ visible: true }).first(); await entry.waitFor();
    // oldSession() también vuelve a preparar Plataforma. Aquí sólo se emite la cookie real de A8, sin seed adicional.
    const cookie = await h.env.command("legacy-session", { kind: "issue-public-operator" });
    assert.equal(cookie.name, publicCookieName); assert.ok(typeof cookie.value === "string" && cookie.value.length > 0);
    await h.context.addCookies([{ ...cookie, url: h.base.origin, httpOnly: true, secure: true, sameSite: "Lax", expires: Math.floor(Date.now() / 1000) + 86400 }]);
    const before = await h.context.cookies(h.base.href);
    await entry.click(); await page.getByRole("textbox", { name: "Correo electrónico", exact: true }).waitFor();
    assertLegacyDoorCookies(before, await h.context.cookies(h.base.href));
    assert.equal(await page.getByRole("heading", { name: "No pudimos iniciar tu sesión", exact: true }).count(), 0);
    assert.equal(await page.getByRole("link", { name: "Ir a Plataforma", exact: true }).count(), 0);
    await loginOpenDoor(h, page, person.email); state.publicSignedIn = true;
    await page.waitForURL((url) => url.origin === h.base.origin && url.pathname === route); await appFrame(h, page, profile);
    const account = await read(h, page, "/api/me"); assert.equal(account.id, person.me.id); assert.equal(account.access, access);
    if (access === "business") assert.equal(account.activeTenantId, person.me.activeTenantId);
    await assertViewport(page);
    await platformPage.reload(); await appFrame(h, platformPage, "Plataforma");
    const preserved = await read(h, platformPage, "/api/me"); assert.equal(preserved.id, operator.id); assert.equal(preserved.access, "platform");
    if (access === "consumer") { await h.signOut(page); state.publicSignedIn = false; }
  }
  return "Ambas puertas retiraron sólo la cookie antigua; la misma cuenta entró por OTP a Personal y Empresa, y F5 conservó al operador de Plataforma en el único contexto Chromium.";
}

async function saveTenantQuota(h, page, value, reason, operatorEmail) {
  const quota = page.getByRole("textbox", { name: "Pedidos · Por organización", exact: true }); await quota.fill(value);
  const save = page.getByRole("button", { name: "Guardar cambios", exact: true });
  if (await save.isDisabled()) return { asked: false, settings: await read(h, page, "/api/platform/settings") };
  // La misma preparación del callback E9-9: un contacto vacío se completa con un buzón sintético válido para guardar.
  for (const [name, email] of [["Correo de ventas", "e2e-sales@example.test"], ["Correo de soporte", "e2e-support@example.test"]]) {
    const field = page.getByRole("textbox", { name, exact: true }); if (!(await field.inputValue())) await field.fill(email);
  }
  await save.click();
  const dialog = page.getByRole("dialog", { name: "¿Guardar la configuración?", exact: true }); await dialog.getByRole("textbox", { name: /^Motivo/u }).fill(reason);
  const answered = page.waitForResponse((response) => pathOf(response) === "/api/platform/settings" && response.request().method() === "PUT" && response.status() !== 403); void answered.catch(() => {});
  await dialog.getByRole("button", { name: "Guardar", exact: true }).click();
  const confirm = page.getByRole("dialog", { name: "Confirmá que sos vos", exact: true });
  const asked = await Promise.race([confirm.waitFor({ timeout: 10_000 }).then(() => true, () => false), answered.then(() => false)]);
  if (asked) await confirmRecentAuthentication(page, operatorEmail);
  const response = await answered; assert.equal(response.status(), 200); assert.ok(Number.isInteger((await response.json()).version));
  await dialog.waitFor({ state: "hidden" }); await page.getByText("Guardamos la configuración.", { exact: true }).first().waitFor();
  return { asked, settings: await read(h, page, "/api/platform/settings") };
}

async function checkSharedQuota(h, page, platformPage, state) {
  const business = await h.registerBusiness(page); state.publicSignedIn = true;
  const roleName = `Contrato de cuota ${randomUUID().slice(0, 8)}`;
  await page.goto(new URL("/org/roles/nuevo", h.base).href); await page.getByRole("textbox", { name: "Nombre", exact: true }).fill(roleName);
  await page.getByRole("combobox", { name: "Vale en", exact: true }).click(); await page.getByRole("option", { name: "Toda la organización", exact: true }).click();
  await page.getByRole("button", { name: "Abrir o cerrar Roles", exact: true }).click(); await page.getByRole("checkbox", { name: "Ver roles", exact: true }).check();
  const created = await clickForResponse(page, page.getByRole("button", { name: "Crear rol", exact: true }), "/api/roles", "POST", 201);
  const roleId = await created.json(); assert.match(roleId, /^[0-9a-f-]{36}$/iu); await page.getByRole("heading", { name: roleName, exact: true }).waitFor();
  const email = operatorOf(h.width); const operator = await h.login(platformPage, email, "platform"); state.platformSignedIn = true;
  assert.ok(operator.effectivePermissions.platform.includes("platform.settings.manage"));
  const writes = watchResponses(page, roleWrite(roleId));
  try {
    return await withRestoredTenantQuota({
      read: async () => {
        const settings = await openPlatformSettings(platformPage, h.base.origin); const field = platformPage.getByRole("textbox", { name: "Pedidos · Por organización", exact: true });
        const value = await field.inputValue(); assert.notEqual(value, "1", "La cuota inicial debe permitir preparar el recorrido.");
        assert.equal(settings.rateLimits.tenant.windowSeconds, 60, "El callback original usa una ventana real de un minuto.");
        return { value, limits: settings.rateLimits };
      },
      prepare: async () => {
        await stopConfirmingRecentAuthentication(platformPage);
        const expired = await h.env.command("recent-proof", { kind: "expire", email }); assert.ok(expired.expired >= 1);
        const changed = await saveTenantQuota(h, platformPage, "1", "E2E contrato: cuota compartida de una escritura por minuto.", email);
        assert.equal(changed.asked, true, "La preparación con prueba vencida debe confirmar el autenticador.");
        assert.deepEqual(changed.settings.rateLimits.tenant, { permitLimit: 1, windowSeconds: 60 });
      },
      body: async (original) => {
        // Ventanas de minuto calendario: se entra temprano para observar la cuenta, como E9-9.
        const second = new Date().getUTCSeconds(); if (second > 35) await delay((61 - second) * 1000);
        const description = page.getByRole("textbox", { name: "Descripción", exact: true }); let limited; let written;
        for (let attempt = 1; attempt <= 3 && !limited; attempt++) {
          written = `Borrador del límite compartido ${attempt}`; await description.fill(written);
          const response = await clickForResponse(page, page.getByRole("button", { name: "Guardar cambios", exact: true }), `/api/roles/${roleId}`, "PUT", null);
          if (response.status() === 429) limited = response; else assert.equal(response.status(), 200);
        }
        assert.ok(limited, "La cuota real de una escritura por minuto debe frenar Guardar.");
        const problem = await requireSharedQuotaResponse(limited);
        await page.getByRole("alert").filter({ hasText: "Hiciste muchos pedidos seguidos. Esperá un momento." }).waitFor();
        const waiting = page.getByRole("button", { name: /^Reintentá en \d+:\d{2}$/u }); await waiting.waitFor();
        assert.equal(await waiting.isDisabled(), true); assert.equal(await description.inputValue(), written); const atLimit = writes.seen.length;
        if (problem.retryAfter >= 5) { const shown = await waiting.innerText(); await delay(2000); assert.notEqual(await waiting.innerText(), shown, "La cuenta regresiva debe avanzar."); }
        const restored = await saveTenantQuota(h, platformPage, original.value, "E2E contrato: restaurar la cuota antes del reintento manual.", email);
        assert.deepEqual(restored.settings.rateLimits, original.limits); assertNoAutomaticRoleRetry(atLimit, writes.seen);
        const save = page.getByRole("button", { name: "Guardar cambios", exact: true }); await save.waitFor({ timeout: (problem.retryAfter + 15) * 1000 }); await delay(1500);
        assertNoAutomaticRoleRetry(atLimit, writes.seen); assert.equal(await save.isDisabled(), false);
        await clickForResponse(page, save, `/api/roles/${roleId}`, "PUT");
        await page.getByText(`Guardamos el rol ${roleName}.`, { exact: true }).waitFor(); assert.equal(writes.seen.length, atLimit + 1);
        const role = await read(h, page, `/api/roles/${roleId}`); assert.equal(role.description, written);
        const me = await read(h, page, "/api/me"); assert.equal(me.id, business.me.id); assert.equal(me.activeTenantId, business.me.activeTenantId); await assertViewport(page);
        return "429 compartido con código/Retry-After, cuenta regresiva y borrador conservado; cero reenvíos automáticos antes o después del vencimiento y un único guardado manual200. Cuota original restaurada por UI.";
      },
      restore: async (original) => {
        // Se relee también si preparar guardó y falló después; no depende de un flag de éxito de la comprobación.
        await openPlatformSettings(platformPage, h.base.origin);
        const restored = await saveTenantQuota(h, platformPage, original.value, "E2E contrato: restauración final de la cuota inicial.", email);
        assert.deepEqual(restored.settings.rateLimits, original.limits);
      },
    });
  } finally { writes.stop(); }
}

function deferred() {
  const pending = Promise.withResolvers(); void pending.promise.catch(() => {}); return pending;
}

const roleAttempt = (request) => ({ key: request.headers()["idempotency-key"], body: request.postData() });
async function roleEffects(h, page, id, name) {
  return {
    role: await read(h, page, `/api/roles/${id}`),
    roles: await read(h, page, "/api/roles/paged?page=1&pageSize=50&search=" + encodeURIComponent(name)),
    audit: await read(h, page, "/api/organization/audit?period=all&category=roles&limit=50&search=" + encodeURIComponent(name)),
  };
}

async function checkLostRoleReplay(h, page, _platformPage, state) {
  await h.registerBusiness(page); state.publicSignedIn = true;
  const name = `Contrato replay ${randomUUID().slice(0, 8)}`;
  const initialRoles = await read(h, page, "/api/roles/paged?page=1&pageSize=50&search=" + encodeURIComponent(name)); assert.equal(initialRoles.totalCount, 0);
  await page.goto(new URL("/org/roles/nuevo", h.base).href);
  await page.getByRole("textbox", { name: "Nombre", exact: true }).fill(name);
  await page.getByRole("combobox", { name: "Vale en", exact: true }).click(); await page.getByRole("option", { name: "Toda la organización", exact: true }).click();
  await page.getByRole("button", { name: "Abrir o cerrar Roles", exact: true }).click(); await page.getByRole("checkbox", { name: "Ver roles", exact: true }).check();
  const lost = deferred(); const attempts = []; const routeUrl = new URL("/api/roles", h.base).href;
  const intercept = async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    attempts.push(roleAttempt(route.request()));
    if (attempts.length !== 1) return route.continue();
    try {
      // Sólo se pierde el transporte de una respuesta real ya confirmada; no se fabrica ningún HTTP.
      const response = await route.fetch({ timeout: 45_000 });
      const original = { status: response.status(), body: await response.text() }; assert.equal(original.status, 201);
      await route.abort("failed"); lost.resolve(original);
    } catch (error) { lost.reject(error); await route.abort("failed").catch(() => {}); }
  };
  await page.route(routeUrl, intercept);
  try {
    const failed = page.waitForEvent("requestfailed", { predicate: (request) => new URL(request.url()).pathname === "/api/roles" && request.method() === "POST" }); void failed.catch(() => {});
    await page.getByRole("button", { name: "Crear rol", exact: true }).click(); await failed;
    const original = await lost.promise; const id = JSON.parse(original.body);
    await page.getByText("No pudimos conectarnos. Revisá tu conexión.", { exact: true }).first().waitFor();
    assert.equal(await page.getByRole("textbox", { name: "Nombre", exact: true }).inputValue(), name);
    const committed = await roleEffects(h, page, id, name); assertSingleRoleEffects(committed, committed, id, name);
    assert.equal(attempts.length, 1, "La pérdida de respuesta no reenvía el alta sin la acción de la persona.");
    const replay = await clickForResponse(page, page.getByRole("button", { name: "Reintentar", exact: true }).filter({ visible: true }).first(), "/api/roles", "POST", 201);
    assert.equal(attempts.length, 2); assertSameIdempotentAttempt(attempts[0], attempts[1]);
    assert.equal(await requireSuccessfulRoleReplay(original, replay), id);
    await page.waitForURL((url) => url.pathname === `/org/roles/${id}`); await page.getByRole("heading", { name, exact: true }).waitFor();
    const headers = { "Idempotency-Key": attempts[0].key, "Content-Type": "application/json" };
    const directReplay = await h.api(page, "/api/roles", { method: "POST", headers, data: attempts[0].body });
    assert.equal(await requireSuccessfulRoleReplay(original, directReplay), id);
    const changed = { ...JSON.parse(attempts[0].body), name: name + " distinto" };
    await requireProblem(await h.api(page, "/api/roles", { method: "POST", headers, data: JSON.stringify(changed) }), 422, "Request.IdempotencyKeyReused");
    assertSingleRoleEffects(committed, await roleEffects(h, page, id, name), id, name);
    assert.equal((await read(h, page, "/api/roles/paged?page=1&pageSize=50&search=" + encodeURIComponent(changed.name))).totalCount, 0);
    await assertViewport(page);
    return "Se perdió sólo el201 real posterior al commit; Reintentar conservó bytes/clave y reprodujo201+Idempotent-Replayed:true. Replay API idéntico y cuerpo cambiado422 dejaron un único rol y exactamente el mismo evento de creación.";
  } finally { await page.unroute(routeUrl, intercept); }
}

async function openSettingsThroughNavigation(h, page) {
  const settings = page.getByRole("link", { name: "Configuración", exact: true }).filter({ visible: true }).first();
  if (!(await settings.isVisible())) {
    if (h.width === 390) await page.getByRole("link", { name: "Más", exact: true }).filter({ visible: true }).first().click();
    else await page.getByRole("button", { name: "Administración", exact: true }).click();
  }
  await settings.click(); await page.waitForURL((url) => url.pathname === "/org/configuracion");
}

async function checkAbandonedSettings(h, page, _platformPage, state) {
  await h.registerBusiness(page); state.publicSignedIn = true;
  const routePath = "/api/organization/settings"; const routeUrl = new URL(routePath, h.base).href;
  const before = await read(h, page, routePath); let failReads = true; let failWrite = false; let holdWrite = false; let holding = false; let writes = 0; let failedReads = 0;
  const acquired = deferred(); const release = deferred(); const delivered = deferred();
  const intercept = async (route) => {
    const method = route.request().method();
    if (method === "GET" && failReads) { failedReads++; return route.abort("internetdisconnected"); }
    if (method !== "PUT") return route.continue();
    writes++;
    if (failWrite) return route.abort("internetdisconnected");
    if (!holdWrite) return route.continue();
    holdWrite = false; holding = true;
    try {
      const response = await route.fetch({ timeout: 45_000 }); assert.equal(response.status(), 200);
      acquired.resolve({ response, request: route.request().postDataJSON() });
      await release.promise; await route.fulfill({ response }); delivered.resolve();
    } catch (error) { acquired.reject(error); delivered.reject(error); await route.abort("failed").catch(() => {}); }
  };
  await page.route(routeUrl, intercept);
  const nameField = page.getByRole("textbox", { name: "Nombre de la organización", exact: true });
  const success = page.getByText("Guardamos la configuración.", { exact: true });
  try {
    await page.goto(new URL("/org/configuracion", h.base).href);
    await page.getByRole("heading", { name: "No pudimos abrir esta pantalla", exact: true }).waitFor(); assert.ok(failedReads > 0);
    failReads = false;
    const recovered = await clickForResponse(page, page.getByRole("button", { name: "Reintentar", exact: true }).filter({ visible: true }).first(), routePath, "GET", 200);
    assert.deepEqual(await recovered.json(), before); await nameField.waitFor();
    const draft = "Borrador recuperable " + randomUUID().slice(0, 8); await nameField.fill(draft); failWrite = true;
    const failed = page.waitForEvent("requestfailed", { predicate: (request) => new URL(request.url()).pathname === routePath && request.method() === "PUT" }); void failed.catch(() => {});
    await page.getByRole("button", { name: "Guardar cambios", exact: true }).click(); await failed;
    await page.getByText("No pudimos conectarnos. Revisá tu conexión.", { exact: true }).first().waitFor();
    assert.equal(await nameField.inputValue(), draft); assert.equal(writes, 1); assert.deepEqual(await read(h, page, routePath), before);
    failWrite = false;
    const retried = await clickForResponse(page, page.getByRole("button", { name: "Reintentar", exact: true }).filter({ visible: true }).first(), routePath, "PUT", 200);
    assert.equal(retried.request().postDataJSON().name, draft); assert.equal(writes, 2);
    await success.waitFor(); assert.equal((await read(h, page, routePath)).name, draft);
    await page.mouse.move(0, 0); await success.waitFor({ state: "hidden" });

    const lateName = "Confirmado antes de salir " + randomUUID().slice(0, 8); await nameField.fill(lateName); holdWrite = true;
    const sent = page.waitForRequest((request) => new URL(request.url()).pathname === routePath && request.method() === "PUT"); void sent.catch(() => {});
    await page.getByRole("button", { name: "Guardar cambios", exact: true }).click(); await sent;
    const held = await acquired.promise; assert.equal(held.request.name, lateName);
    const committed = await read(h, page, routePath); assert.equal(committed.name, lateName); assert.ok(committed.version > before.version);
    await page.getByRole("link", { name: "Inicio", exact: true }).filter({ visible: true }).first().click();
    const leave = page.getByRole("dialog", { name: "¿Salir sin guardar?", exact: true }); await leave.getByRole("button", { name: "Salir sin guardar", exact: true }).click();
    await page.waitForURL((url) => url.pathname === "/org");
    // La lectura puede seguir fresca en React Query: volver por UI no exige un GET nuevo para esta comprobación.
    await openSettingsThroughNavigation(h, page); await nameField.waitFor();
    const nextDraft = "Borrador posterior " + randomUUID().slice(0, 8); await nameField.fill(nextDraft);
    const atAbandon = writes; assert.equal(atAbandon, 3);
    const arrived = page.waitForResponse((response) => pathOf(response) === routePath && response.request().method() === "PUT" && response.status() === 200); void arrived.catch(() => {});
    release.resolve(); await delivered.promise; const lateResponse = await arrived; await lateResponse.finished();
    assert.equal((await lateResponse.json()).version, committed.version);
    // Da paso a los callbacks reales del fetch y React; no se altera estado ni DOM de la aplicación.
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))); await delay(250);
    assertAbandonedSettings({ route: new URL(page.url()).pathname, draft: await nameField.inputValue(), successes: await success.filter({ visible: true }).count(), writes }, { route: "/org/configuracion", draft: nextDraft, writes: atAbandon });
    assert.deepEqual(await read(h, page, routePath), committed);
    await assertViewport(page);
    return "Consulta de Configuración sin transporte mostró error común y Reintentar200; guardado sin transporte conservó borrador y reintento manual200. Un PUT200 real retenido hasta salir/reabrir por UI no revivió el guardado ni reemplazó el nuevo borrador; el commit anterior se reconoció explícitamente.";
  } finally {
    release.resolve(); if (holding) await delivered.promise.catch(() => {});
    await page.unroute(routeUrl, intercept);
  }
}

async function closeCase(h, pages, state) {
  const failures = []; const [page, platformPage] = pages;
  for (const target of pages) {
    try {
      await stopConfirmingRecentAuthentication(target);
      const cancel = target.getByRole("dialog").getByRole("button", { name: "Cancelar", exact: true }).first(); if (await cancel.isVisible()) await cancel.click();
      const discard = target.getByRole("button", { name: "Descartar cambios", exact: true }).filter({ visible: true }).first(); if (await discard.isVisible()) await discard.click();
    } catch (error) { failures.push(error); }
  }
  for (const [target, signedIn] of [[page, state.publicSignedIn], [platformPage, state.platformSignedIn]]) { try { if (signedIn) await h.signOut(target); } catch (error) { failures.push(error); } }
  // Si un fallo dejó sólo el legado o una puerta incompleta, la propia UI retira la cookie. Nunca se limpia el contexto.
  try { await cleanupContinuationSessions(h); } catch (error) { failures.push(error); }
  for (const target of pages) { try { await target.close(); } catch (error) { failures.push(error); } }
  if (failures.length === 1) throw failures[0];
  if (failures.length > 1) throw new AggregateError(failures, "Fallaron salidas UI del complemento de contrato.");
}

const contractChecks = new Map([["CON-01", checkLegacyDoors], ["CON-02", checkSharedQuota], ["CON-03", checkLostRoleReplay], ["CON-04", checkAbandonedSettings]]);

async function runContractCases(h, definitions, { checks = contractChecks, close = closeCase } = {}) {
  const outcomes = new Map();
  for (const { id } of definitions) {
    const check = checks.get(id); assert.equal(typeof check, "function");
    const pages = [await h.newPage(), await h.newPage()]; const state = { publicSignedIn: false, platformSignedIn: false };
    try {
      outcomes.set(id, await h.record(id, () => state.capturePage ?? pages[0], async () => {
        try { return await check(h, ...pages, state); }
        catch (error) { if (id === "CON-02") state.capturePage = pages[1]; throw error; }
      }));
    } finally { await close(h, pages, state); }
  }
  return outcomes;
}

/** El lote compartido conserva las conductas1/3/4; CON-02 sólo se ejecuta en un entorno aislado exclusivo. */
export async function runContractSupplementCases(h, options) { return runContractCases(h, contractSharedDefinitions, options); }
export async function runContractQuotaRepairCases(h, options) { return runContractCases(h, contractQuotaRepairDefinitions, options); }
export async function runContractTransportRepairCases(h, options) { return runContractCases(h, contractTransportRepairDefinitions, options); }
