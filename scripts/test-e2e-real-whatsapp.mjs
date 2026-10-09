import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createServer } from "vite";
import { chromium } from "playwright";
import { fillOtp } from "./test-e2e-real-ui.mjs";
import { caseDelay, newCaseContext, runCase } from "./test-e2e-real-case.mjs";
import { fixtureProtocol } from "./test-e2e-real-whatsapp-ipc.mjs";
import { newPlatformContext, recoveryRow, selectRecovery, waitForPlatformSession } from "./test-e2e-real-whatsapp-recovery.mjs";
import { responsesForAction } from "./test-e2e-real-whatsapp-action.mjs";

// Sólo RealE2ESetup en Testing inicia este runner. Front/API/OIDC/PostgreSQL son reales.
// FIXTURE es IPC privado: el host no publica líneas, respuestas, números ni pruebas.
const root = path.resolve(import.meta.dirname, "..");
const base = "https://localtest.me:5176";
const ipc = fixtureProtocol(process.stdin, process.stdout);
let server; let browser; let stage = "arranque"; let step = "inicio"; let lastFailure = ""; let completed = 0;
const check = (label) => process.stdout.write(`CHECK ${label}\n`);
const start = (label) => { stage = label; step = "inicio"; lastFailure = ""; check(`INICIO ${label}`); };
const detail = (label) => { step = label; check(`INICIO ${stage}; paso ${step}`); };
const pass = (label) => { completed++; check(`OK ${label}`); };
const begin = async (scenario, phone) => {
  assert.equal((await ipc.request({ kind: "begin", scenario, phone })).ok, true);
  return (kind, extra = {}) => ipc.request({ kind, scenario, phone, ...extra });
};
const pathname = (response) => new URL(response.url()).pathname;
async function clickHttp(page, button, endpoint, status, method = "POST") {
  const [response] = await responsesForAction(page,
    [(reply) => pathname(reply) === endpoint && reply.request().method() === method], () => button.click());
  assert.equal(response.status(), status);
  return response;
}
async function whatsapp(page, phone, label = /^(Tu )?número de WhatsApp$/i) {
  await page.getByRole("button", { name: "WhatsApp", exact: true }).click();
  await page.getByRole("textbox", { name: label }).fill(phone);
}
async function authenticated(page, width, organization = "Personal") {
  await (width === 390 ? page.getByRole("navigation", { name: "Secciones" }) : page.getByRole("button", { name: new RegExp(`, ${organization}$`) })).waitFor();
}
async function signout(page, width, organization = "Personal") {
  if (width === 390) {
    await page.goto(`${base}/mas`);
    await page.getByRole("button", { name: /^Salir/ }).click();
    await page.getByRole("navigation", { name: "Secciones" }).waitFor({ state: "detached" });
  } else {
    await page.getByRole("button", { name: new RegExp(`, ${organization}$`) }).click();
    await page.getByRole("menuitem", { name: "Salir", exact: true }).click();
    await page.getByRole("link", { name: "Ingresá", exact: true }).first().waitFor();
  }
}
async function login(page, phone, door, scenario) {
  const fixture = await begin(scenario, phone);
  await page.goto(`${base}${door === "business" ? "/login/empresa" : "/login"}`);
  await whatsapp(page, phone);
  await clickHttp(page, page.getByRole("button", { name: "Enviar código", exact: true }), "/api/auth/login-code", 202);
  await page.getByRole("heading", { name: "Revisá tu WhatsApp", exact: true }).waitFor();
  await fillOtp(page, (await fixture("code")).proof);
  await clickHttp(page, page.getByRole("button", { name: "Verificar", exact: true }), "/api/auth/login-code/verify", 200);
}
async function botLink(phone, scenario) {
  const fixture = await begin(scenario, phone);
  assert.equal((await fixture("inbound")).status, 200);
  assert.equal((await fixture("inbound")).status, 200);
  const pending = (await fixture("events")).events.filter((event) => event.direction === "Inbound");
  assert.equal(pending.length, 1); // El mismo ID real del webhook no duplica la entrada.
  const link = (await fixture("bot")).proof;
  const processed = (await fixture("events")).events.filter((event) => event.direction === "Inbound");
  assert.deepEqual(processed, [{ kind: "Text", direction: "Inbound", status: "Processed", processed: true }]);
  return link;
}
async function recovery(page, previous, next, scenario) {
  const fixture = await begin(scenario, next);
  await page.goto(`${base}/recuperar`); await whatsapp(page, previous, /Número de WhatsApp$/);
  await clickHttp(page, page.getByRole("button", { name: "Seguir", exact: true }), "/api/account-recovery/preview", 204);
  await page.getByRole("heading", { name: "¿Dónde te escribimos?", exact: true }).waitFor();
  await whatsapp(page, next, /Número de WhatsApp nuevo$/);
  await clickHttp(page, page.getByRole("button", { name: "Enviar código", exact: true }), "/api/account-recovery/code", 202);
  await page.getByRole("heading", { name: "Revisá tu WhatsApp", exact: true }).waitFor();
  await fillOtp(page, (await fixture("code")).proof);
  const [verified, submitted] = await responsesForAction(page, [
    (response) => pathname(response) === "/api/account-recovery/verify" && response.request().method() === "POST",
    (response) => pathname(response) === "/api/account-recovery" && response.request().method() === "POST",
  ], () => page.getByRole("button", { name: "Verificar", exact: true }).click());
  assert.equal(verified.status(), 204); assert.equal(submitted.status(), 202);
  await page.getByRole("heading", { name: "Recibimos tu pedido", exact: true }).waitFor();
}
async function platformLogin(page, scenario) {
  const fixture = await begin(scenario, "+5491134567899");
  await page.goto(`${base}/plataforma`);
  await page.getByRole("textbox", { name: "Correo electrónico" }).fill("e8-operator@example.test");
  await clickHttp(page, page.getByRole("button", { name: "Enviar código", exact: true }), "/api/auth/login-code", 202);
  await page.getByRole("heading", { name: "Revisá tu correo", exact: true }).waitFor();
  await fillOtp(page, (await fixture("operatorCode")).proof);
  await clickHttp(page, page.getByRole("button", { name: "Verificar", exact: true }), "/api/auth/login-code/verify", 200);
  detail("esperar sesión privada de Plataforma");
  await waitForPlatformSession(page, async () => {
    detail("aceptar términos del operador por UI");
    await clickHttp(page, page.getByRole("button", { name: "Aceptar y seguir", exact: true }), "/api/legal/accept", 204);
    detail("esperar Plataforma después de aceptar términos");
  });
}
async function reviewRecovery(page, previous, next, action) {
  const mobile = page.viewportSize().width === 390;
  detail("abrir lista de recuperaciones");
  let [response] = await responsesForAction(page, [(reply) => pathname(reply) === "/api/platform/recoveries/paged"],
    () => page.goto(`${base}/plataforma/recuperaciones`));
  await page.getByRole("heading", { name: "Recuperaciones", exact: true }).waitFor();
  if (!mobile) {
    detail("buscar pedido en escritorio");
    [response] = await responsesForAction(page,
      [(reply) => pathname(reply) === "/api/platform/recoveries/paged" && new URL(reply.url()).searchParams.get("search") === next],
      () => page.getByRole("searchbox", { name: "Buscar por cuenta, correo o teléfono" }).fill(next));
  }
  assert.equal(response.status(), 200);
  detail("correlacionar pedido Phone");
  const pedido = selectRecovery((await response.json()).items, previous, next); assert.equal(pedido.status, "Pending");
  const target = recoveryRow(page, pedido); await target.waitFor(); assert.equal(await target.count(), 1);
  detail("abrir acciones del pedido");
  await target.getByRole("button", { name: /^Acciones de/ }).click();
  detail("abrir revisión humana");
  await page.getByRole("menuitem", { name: "Revisar", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Revisar el pedido", exact: true });
  detail("completar motivo humano");
  await dialog.getByRole("textbox", { name: /Motivo/ }).fill("Verificación humana del recorrido aislado.");
  detail("confirmar decisión humana");
  await clickHttp(page, dialog.getByRole("button", { name: action === "approve" ? "Aprobar" : "Rechazar", exact: true }), `/api/platform/recoveries/${pedido.id}/${action}`, 200);
  await dialog.waitFor({ state: "hidden" });
  detail("leer decisión persistida después de F5");
  const [persisted] = await responsesForAction(page,
    [(reply) => pathname(reply) === "/api/platform/recoveries/paged" && (mobile || new URL(reply.url()).searchParams.get("search") === next)], () => page.reload());
  const resolved = (await persisted.json()).items.find((item) => item.id === pedido.id);
  assert.equal(resolved?.status, action === "approve" ? "Approved" : "Rejected");
  await recoveryRow(page, resolved).getByText(action === "approve" ? "Aprobado" : "Rechazado", { exact: true }).waitFor();
}
function observe(page) {
  const oidc = []; const calls = [];
  page.on("request", (request) => {
    const url = new URL(request.url()); calls.push({ path: url.pathname, method: request.method() });
    if (url.pathname === "/connect/authorize") oidc.push({ path: url.pathname, access: url.searchParams.get("access"), state: !!url.searchParams.get("state"), pkce: !!url.searchParams.get("code_challenge") });
    if (url.pathname === "/connect/token") oidc.push({ path: url.pathname });
  });
  page.on("response", async (response) => {
    if (response.status() >= 400 && pathname(response).startsWith("/api")) {
      const problem = await response.json().catch(() => ({}));
      // Sólo catálogo de códigos ASCII, nunca cuerpos, títulos ni URLs.
      lastFailure = `${response.status()} ${/^[A-Za-z0-9.]+$/.test(problem.code ?? "") ? problem.code : "sin-codigo"}`;
    }
  });
  return { oidc, calls };
}
function consumerOidc(observed, since) {
  const fresh = observed.oidc.slice(since);
  assert.ok(fresh.some((request) => request.path === "/connect/authorize" && request.access === "consumer" && request.state && request.pkce));
  assert.ok(fresh.some((request) => request.path === "/connect/token"));
}
async function requestDeletion(page) {
  await page.goto(`${base}/cuenta`);
  await page.getByRole("button", { name: "Dar de baja", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "¿Dar de baja tu cuenta?", exact: true });
  await dialog.getByRole("textbox", { name: /Motivo/ }).fill("Prueba aislada de cancelación por enlace.");
  await clickHttp(page, dialog.getByRole("button", { name: "Dar de baja", exact: true }), "/api/me/deletion", 200);
  await page.getByRole("heading", { name: "Cerramos tu sesión", exact: true }).waitFor();
}
async function pendingLink(page, phone, width, scenario, observed) {
  // LoginLinkIssuer limita por cuenta durante 60 s, incluso si la recuperación cambió su Phone.
  // Respetamos el cooldown real de la fixture sin modificar opciones ni adelantar su reloj.
  detail("esperar ventana real de emisión de enlace");
  await caseDelay(60_000);
  detail("generar enlace del bot para baja pendiente");
  const fixture = await begin(scenario, phone); // Cursor anterior al ticket emitido por redeem.
  const link = await botLink(phone, `${scenario}-bot`);
  const since = observed.oidc.length;
  await page.goto(link); await page.getByRole("button", { name: "Continuar", exact: true }).waitFor();
  const redeemed = await clickHttp(page, page.getByRole("button", { name: "Continuar", exact: true }), "/api/auth/login-link/redeem", 403);
  const problem = await redeemed.json(); assert.equal(problem.code, "Identity.Account.PendingDeletion");
  assert.equal(typeof problem.cancelTicket, "string");
  await page.getByRole("heading", { name: "Tu cuenta tiene la baja pedida", exact: true }).waitFor();
  assert.equal(observed.oidc.length, since); assert.equal(new URL(page.url()).hash, "");
  return { fixture, ticket: problem.cancelTicket, since, width };
}

async function journey(width, index) {
  const phone = `+54911345678${80 + index * 6}`, next = `+54911345678${81 + index * 6}`;
  const recovered = `+54911345678${82 + index * 6}`, unknown = `+54911345678${83 + index * 6}`;
  const rejected = `+54911345678${84 + index * 6}`, businessPhone = `+54911345678${85 + index * 6}`;
  const context = await newCaseContext(browser, { ignoreHTTPSErrors: true, locale: "es-AR", viewport: { width, height: width === 390 ? 844 : 900 } });
  const page = await context.newPage(); page.setDefaultTimeout(30_000); const observed = observe(page);
  start(`registro Phone ${width}`);
  const signup = await begin(`signup-${width}`, phone);
  await page.goto(`${base}/registro`); await whatsapp(page, phone);
  await page.getByRole("checkbox", { name: /Acepto los Términos/ }).check();
  await clickHttp(page, page.getByRole("button", { name: "Crear cuenta", exact: true }), "/api/auth/signup", 202);
  await fillOtp(page, (await signup("code")).proof);
  await clickHttp(page, page.getByRole("button", { name: "Verificar y crear la cuenta", exact: true }), "/api/auth/signup/verify", 204);
  await authenticated(page, width); await page.reload(); await authenticated(page, width); pass(`registro y OIDC consumer/F5 ${width}`);

  start(`agregar Phone ${width}`); const added = await begin(`add-${width}`, next);
  await page.goto(`${base}/cuenta`); await page.getByRole("button", { name: "Agregar correo o teléfono", exact: true }).click();
  const dialog = page.getByRole("dialog"); await dialog.getByRole("button", { name: "WhatsApp", exact: true }).click();
  await dialog.getByRole("textbox", { name: "Número", exact: true }).fill(next);
  const addReply = await clickHttp(page, dialog.getByRole("button", { name: "Enviar código", exact: true }), "/api/me/login-methods", 202);
  const methodId = (await addReply.json()).methodId;
  const otp = (await added("code")).proof;
  await fillOtp(dialog, `${otp[0] === "0" ? "1" : "0"}${otp.slice(1)}`);
  await clickHttp(page, dialog.getByRole("button", { name: "Verificar", exact: true }), `/api/me/login-methods/${methodId}/verify`, 400);
  await fillOtp(dialog, otp);
  await clickHttp(page, dialog.getByRole("button", { name: "Verificar", exact: true }), `/api/me/login-methods/${methodId}/verify`, 204);
  await dialog.waitFor({ state: "hidden" }); await page.reload(); await page.getByRole("button", { name: new RegExp(`^Acciones de.*${next.slice(-4)}`) }).waitFor(); pass(`agregado OTP real/error y F5 ${width}`);
  start(`principal y quitar Phone ${width}`); const methodStart = observed.calls.length;
  for (const [action, endpoint, method] of [["Hacer principal", `/api/me/login-methods/${methodId}/primary`, "PUT"], ["Quitar", `/api/me/login-methods/${methodId}`, "DELETE"]]) {
    await begin(`method-${method.toLowerCase()}-${width}`, next);
    await page.getByRole("button", { name: new RegExp(`^Acciones de.*${next.slice(-4)}`) }).click();
    await page.getByRole("menuitem", { name: action, exact: true }).click();
    assert.equal(await page.getByRole("dialog").getByRole("group", { name: "Código" }).count(), 0);
    await clickHttp(page, page.getByRole("dialog").getByRole("button", { name: action, exact: true }), endpoint, 204, method);
    await page.getByRole("dialog").waitFor({ state: "hidden" });
  }
  assert.equal(observed.calls.slice(methodStart).filter((call) => call.method === "POST" && /login-code|\/code$/.test(call.path)).length, 0);
  pass(`principal/quitar sin OTP ${width}`); await signout(page, width);

  start(`ingreso Phone consumer ${width}`); await login(page, phone, "consumer", `login-${width}`);
  await authenticated(page, width); await page.reload(); await authenticated(page, width); pass(`ingreso consumer/F5 ${width}`); await signout(page, width);
  start(`bot webhook y enlace ${width}`); const link = await botLink(phone, `bot-${width}`);
  const since = observed.oidc.length; const redeemStart = observed.calls.filter((call) => call.path === "/api/auth/login-link/redeem").length;
  await page.goto(link); await page.getByRole("button", { name: "Continuar", exact: true }).waitFor();
  assert.equal(new URL(page.url()).hash, ""); assert.equal(observed.oidc.length, since);
  assert.equal(observed.calls.filter((call) => call.path === "/api/auth/login-link/redeem").length, redeemStart);
  await clickHttp(page, page.getByRole("button", { name: "Continuar", exact: true }), "/api/auth/login-link/redeem", 200);
  await authenticated(page, width); consumerOidc(observed, since); await page.reload(); await authenticated(page, width);
  pass(`webhook HMAC/dedupe persistente/bot/preview/redeem/OIDC state PKCE/F5 ${width}`); await signout(page, width);
  start(`enlace usado ${width}`); const replayOidc = observed.oidc.length;
  await page.goto(link); await page.getByRole("heading", { name: "Este enlace ya no sirve", exact: true }).waitFor();
  await page.reload(); await page.getByRole("heading", { name: "Este enlace ya no sirve", exact: true }).waitFor();
  assert.equal(observed.oidc.length, replayOidc); pass(`rechazo de enlace usado/F5 sin OIDC ${width}`);

  start(`CTA registro WhatsApp ${width}`); const registration = new URL(await botLink(unknown, `unknown-${width}`));
  assert.equal(registration.pathname, "/registro"); assert.deepEqual([...registration.searchParams], [["channel", "whatsapp"]]); assert.equal(registration.hash, "");
  await page.goto(registration.href); const emptyPhone = page.getByRole("textbox", { name: /Número de WhatsApp$/ });
  await emptyPhone.waitFor(); assert.equal(await emptyPhone.inputValue(), ""); await page.reload(); await emptyPhone.waitFor(); assert.equal(await emptyPhone.inputValue(), "");
  // Segunda cuenta existente por alta UI/OTP reales: el error de destino ocupado requiere otro Phone.
  const botSignup = await begin(`bot-signup-${width}`, unknown); await emptyPhone.fill(unknown);
  await page.getByRole("checkbox", { name: /Acepto los Términos/ }).check();
  await clickHttp(page, page.getByRole("button", { name: "Crear cuenta", exact: true }), "/api/auth/signup", 202);
  await fillOtp(page, (await botSignup("code")).proof);
  await clickHttp(page, page.getByRole("button", { name: "Verificar y crear la cuenta", exact: true }), "/api/auth/signup/verify", 204);
  await authenticated(page, width); await page.reload(); await authenticated(page, width);
  pass(`bot desconocido/registro WhatsApp vacío/alta real/F5 ${width}`); await signout(page, width);

  start(`errores Phone ${width}`); await begin(`missing-login-${width}`, next); await page.goto(`${base}/login`); await whatsapp(page, next);
  await clickHttp(page, page.getByRole("button", { name: "Enviar código", exact: true }), "/api/auth/login-code", 400);
  await page.getByText("No hay una cuenta con ese número.", { exact: true }).waitFor();
  await page.getByRole("link", { name: "Crear mi cuenta", exact: true }).click();
  assert.ok((await page.getByRole("textbox", { name: /Número de WhatsApp$/ }).inputValue()).endsWith(next.slice(-4)));
  await begin(`taken-signup-${width}`, phone); await page.goto(`${base}/registro`); await whatsapp(page, phone); await page.getByRole("checkbox", { name: /Acepto los Términos/ }).check();
  await clickHttp(page, page.getByRole("button", { name: "Crear cuenta", exact: true }), "/api/auth/signup", 400);
  await page.getByText("Ya tenés una cuenta con ese número.", { exact: true }).waitFor();
  await begin(`missing-recovery-${width}`, next); await page.goto(`${base}/recuperar`); await whatsapp(page, next, /Número de WhatsApp$/);
  await clickHttp(page, page.getByRole("button", { name: "Seguir", exact: true }), "/api/account-recovery/preview", 400);
  await page.getByText("No hay una cuenta con ese número.", { exact: true }).waitFor();
  await begin(`taken-recovery-${width}`, unknown); await page.goto(`${base}/recuperar`); await whatsapp(page, phone, /Número de WhatsApp$/); await page.getByRole("button", { name: "Seguir", exact: true }).click();
  await page.getByRole("heading", { name: "¿Dónde te escribimos?", exact: true }).waitFor(); await whatsapp(page, unknown, /Número de WhatsApp nuevo$/);
  const occupiedRecovery = await clickHttp(page, page.getByRole("button", { name: "Enviar código", exact: true }), "/api/account-recovery/code", 400);
  assert.equal((await occupiedRecovery.json()).code, "Platform.AccountRecovery.PhoneMethodInUse");
  await page.getByText("Ese número ya es de otra cuenta.", { exact: true }).waitFor(); pass(`errores sin cuenta/ocupado/recuperación ${width}`);

  start(`recuperación asistida Phone ${width}`); await recovery(page, phone, recovered, `recovery-approve-${width}`); pass(`solicitud recuperación Phone/OTP ${width}`);
  const operatorContext = await newPlatformContext(browser, width);
  const operator = await operatorContext.newPage(); operator.setDefaultTimeout(30_000); observe(operator);
  await platformLogin(operator, `operator-${width}`);
  start(`aprobar recuperación Phone ${width}`); await reviewRecovery(operator, phone, recovered, "approve");
  await login(page, recovered, "consumer", `recovered-login-${width}`); await authenticated(page, width); await page.reload(); await authenticated(page, width);
  await page.goto(`${base}/cuenta`); await page.getByRole("button", { name: new RegExp(`^Acciones de.*${recovered.slice(-4)}`) }).waitFor();
  pass(`aprobación humana Phone persistida/ingreso/F5 ${width}`); await signout(page, width);
  start(`rechazar recuperación Phone ${width}`); await recovery(page, phone, rejected, `recovery-reject-${width}`); await reviewRecovery(operator, phone, rejected, "reject");
  await begin(`rejected-login-${width}`, rejected); await page.goto(`${base}/login`); await whatsapp(page, rejected);
  await clickHttp(page, page.getByRole("button", { name: "Enviar código", exact: true }), "/api/auth/login-code", 400);
  await page.getByText("No hay una cuenta con ese número.", { exact: true }).waitFor(); pass(`rechazo humano Phone persistido/sin ingreso ${width}`); await operatorContext.close();

  start(`registro empresarial Phone ${width}`); const business = await begin(`business-signup-${width}`, businessPhone); const orgName = `Empresa E8 ${randomUUID().slice(0, 8)}`;
  await page.goto(`${base}/registro/empresa`); await whatsapp(page, businessPhone, /número de WhatsApp$/i); await page.getByRole("checkbox", { name: /Acepto los Términos/ }).check();
  await clickHttp(page, page.getByRole("button", { name: "Continuar", exact: true }), "/api/auth/business-signup/code", 202); await fillOtp(page, (await business("code")).proof);
  await clickHttp(page, page.getByRole("button", { name: "Verificar", exact: true }), "/api/auth/business-signup/verify", 204);
  await page.getByRole("heading", { name: "Tu organización", exact: true }).waitFor();
  await page.getByRole("textbox", { name: "Nombre de la organización", exact: true }).fill(orgName);
  await page.getByRole("textbox", { name: /Dirección de tu página/ }).fill(`e8-${randomUUID().slice(0, 8)}`);
  await page.getByRole("textbox", { name: "Primera empresa", exact: true }).fill(`${orgName} Centro`); await page.getByText("Disponible", { exact: true }).waitFor();
  const created = await clickHttp(page, page.getByRole("button", { name: "Crear organización", exact: true }), "/api/auth/business-signup", 200); assert.equal((await created.json()).requiresApproval, false);
  await page.getByRole("button", { name: `Entrar a ${orgName}`, exact: true }).click(); await page.waitForURL((url) => url.pathname === "/org");
  await authenticated(page, width, orgName); await page.reload(); await authenticated(page, width, orgName); pass(`registro empresarial/OIDC/F5 ${width}`); await signout(page, width, orgName);
  start(`ingreso empresarial Phone ${width}`); await login(page, businessPhone, "business", `business-login-${width}`); await page.waitForURL((url) => url.pathname === "/org");
  await authenticated(page, width, orgName); await page.reload(); await authenticated(page, width, orgName); pass(`ingreso empresarial Phone/F5 ${width}`); await signout(page, width, orgName);

  start(`baja pendiente por enlace ${width}`); await login(page, recovered, "consumer", `deletion-login-${width}`); await authenticated(page, width);
  await begin(`deletion-${width}`, recovered); await requestDeletion(page); const pending = await pendingLink(page, recovered, width, `pending-${width}`, observed);
  const redeemCount = observed.calls.filter((call) => call.path === "/api/auth/login-link/redeem").length;
  await clickHttp(page, page.getByRole("button", { name: "Cancelar la baja y entrar", exact: true }), "/api/auth/deletion/cancel", 200);
  await authenticated(page, width); consumerOidc(observed, pending.since);
  assert.equal(observed.calls.filter((call) => call.path === "/api/auth/login-link/redeem").length, redeemCount);
  await page.reload(); await authenticated(page, width); pass(`cancelación de baja por enlace/OIDC nuevo sin otro redeem/F5 ${width}`);
  start(`ticket cancelación vencido ${width}`); await begin(`deletion-again-${width}`, recovered); await requestDeletion(page);
  const expired = await pendingLink(page, recovered, width, `expired-${width}`, observed); assert.equal((await expired.fixture("expireTicket", { ticket: expired.ticket })).ok, true);
  await clickHttp(page, page.getByRole("button", { name: "Cancelar la baja y entrar", exact: true }), "/api/auth/deletion/cancel", 403);
  await page.getByRole("heading", { name: "Este enlace ya no sirve", exact: true }).waitFor(); assert.equal(observed.oidc.length, expired.since);
  await page.reload(); await page.getByRole("heading", { name: "Este enlace ya no sirve", exact: true }).waitFor(); assert.equal(observed.oidc.length, expired.since);
  pass(`ticket vencido/inválido/F5 sin OIDC ${width}`);
}

try {
  if (process.env.MT_E2E_ISOLATED !== "1" || !process.env.E8_CERT || !process.env.E8_KEY || !process.env.API_HTTPS) throw new Error("Fixture aislada requerida.");
  server = await createServer({ root, configFile: path.join(root, "vite.config.ts"), logLevel: "silent", cacheDir: path.join(root, "node_modules/.tmp-e8-oct09/vite-whatsapp"),
    server: { port: 5176, strictPort: true, https: { cert: await fs.readFile(process.env.E8_CERT), key: await fs.readFile(process.env.E8_KEY) } } });
  await server.listen(); browser = await chromium.launch({ headless: true });
  for (const [index, width] of [1440, 390].entries()) await runCase(AbortSignal.timeout(600_000), () => journey(width, index));
  check(`FINAL ${completed} grupos reales correctos en 1440/390; Meta Cloud/delivered pendiente`);
} catch (error) {
  // Playwright y assert pueden incluir URLs/pruebas en sus mensajes. Sólo metadata saneada.
  check(`FALLO ${stage}; paso ${step}; tipo ${/^[A-Za-z]+$/.test(error?.name ?? "") ? error.name : "Error"}; HTTP ${lastFailure || "sin-error"}`);
  process.exitCode = 1;
} finally {
  ipc.close(); await browser?.close(); await server?.close();
}
