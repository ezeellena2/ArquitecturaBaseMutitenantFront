import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { requireE8Control } from "./recorrido-usuario-whatsapp.mjs";
import { nationalPhone } from "./recorrido-usuario-e11.mjs";
import { fillOtp } from "./test-e2e-real-ui.mjs";
import { clickForResponse, requireProblem } from "./e2e-completo-negocio.mjs";
import { assertViewport } from "./e2e-completo-personal.mjs";
import { cleanupContinuationSessions } from "./e2e-completo-continuacion.mjs";

export const quotaWhatsAppDefinitions = [
  { id: "CUOTA-WA-01", area: "WhatsApp · cuota diaria real", actor: "Visitante de entorno fresco y persona con Phone verificado propio", action: "Agotar los800 códigos nuevos y conservar el ingreso protegido dentro del total1000", route: "/registro · /login · /", expected: "Alta Phone verificada consume1 nuevo;799 admisiones nuevas más agotan la capacidad. Otro destino nunca usado recibe429 WhatsApp.LoginCode.DailyLimit con Retry-After/traceId; el Phone verificado todavía recibe202, prueba OTP y Me200 de la misma persona. No acredita ausencia persistida de LoginCodes/outbox.", covers: [], critical: true, source: "back:tests/ArquitecturaBaseMultitenant.Api.IntegrationTests/TestFeatures/WhatsAppBrowser/RecorridoWhatsAppModule.cs; back:src/ArquitecturaBaseMultitenant.Application/Modules/WhatsApp/Services/WhatsAppCodeQuotaIssuer.cs; scripts/e2e-completo-cuota-whatsapp.mjs" },
];

export const quotaWhatsAppLimitations = {
  "BACK-WA-027": {
    partialExecutionIds: ["CUOTA-WA-01"], missing: "ausencia persistida de LoginCodes/outbox",
    reason: "El control code sólo busca outbox cifrado y lanza si no lo encuentra; esa excepción puede terminar RecorridoHost, no certifica ausencia de LoginCodes y no se consulta para el destino rechazado. events sólo consulta WhatsAppMessages. El429 y la UI sin OTP no acreditan ausencia durable ni que no se encoló un envío.",
    source: ["tests/ArquitecturaBaseMultitenant.Api.IntegrationTests/TestFeatures/WhatsAppBrowser/WhatsAppBrowserControl.cs#events/code", "tests/ArquitecturaBaseMultitenant.Api.IntegrationTests/TestFeatures/WhatsAppBrowser/WhatsAppFileBridge.cs", "tools/ArquitecturaBaseMultitenant.RealE2ESetup/RecorridoHost.cs"],
  },
};

export const quotaWhatsAppLimits = { maxRequests: 1000, timeoutMs: 60 * 60_000, cooldownMs: 60_000, newCapacity: 800 };

export function quotaPhonePlan() {
  const phone = (number) => "+54911345678" + String(number).padStart(2, "0");
  return { protectedPhone: phone(97), freshPhone: phone(98), bulk: Array.from({ length: 97 }, (_, number) => number).filter((number) => number !== 90).map(phone) };
}

export function createQuotaBudget({ now = Date.now, maxRequests = quotaWhatsAppLimits.maxRequests, timeoutMs = quotaWhatsAppLimits.timeoutMs } = {}) {
  assert.ok(Number.isSafeInteger(maxRequests) && maxRequests > 0 && maxRequests <= 1000);
  assert.ok(Number.isFinite(timeoutMs) && timeoutMs > 0);
  const started = now(); const day = new Date(started).toISOString().slice(0, 10); let count = 0;
  const check = () => {
    const current = now(); assert.ok(current - started <= timeoutMs, "La prueba de cuota superó su timeout explícito; no sigue enviando.");
    assert.equal(new Date(current).toISOString().slice(0, 10), day, "Cambió el día UTC; no se reinicia ni se infiere el presupuesto anterior.");
  };
  return { check, take() { check(); assert.ok(count < maxRequests, "Se alcanzó el máximo de1000 pedidos de emisión; no se sigue enviando."); count++; }, get count() { return count; }, get remainingMs() { return Math.max(0, started + timeoutMs - now()); } };
}

export function nextQuotaDestination(pool, now) {
  assert.ok(pool.length > 0 && pool.every((item) => Number.isFinite(item.readyAt)) && Number.isFinite(now));
  let index = 0; for (let position = 1; position < pool.length; position++) if (pool[position].readyAt < pool[index].readyAt) index = position;
  return { index, waitMs: Math.max(0, pool[index].readyAt - now) };
}

export function rememberQuotaKey(keys, key) {
  assert.ok(typeof key === "string" && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/iu.test(key), "El formulario debe aportar una clave idempotente real.");
  assert.equal(keys.has(key), false, "Cada intento debe ser otra emisión, nunca el replay de un código ya admitido."); keys.add(key);
}

export async function requireWhatsAppDailyLimit(response) {
  const problem = await requireProblem(response, 429, "WhatsApp.LoginCode.DailyLimit");
  assert.ok(Number.isSafeInteger(problem.retryAfter) && problem.retryAfter > 0 && problem.retryAfter <= 86400);
  assert.equal(response.headers()["retry-after"], String(problem.retryAfter)); return problem;
}

async function waitRealCooldown(milliseconds, budget) {
  const readyAt = Date.now() + milliseconds;
  while (Date.now() < readyAt) {
    budget.check(); const chunk = Math.min(60_000, readyAt - Date.now(), budget.remainingMs);
    assert.ok(chunk > 0, "No queda tiempo para respetar el cooldown real."); await delay(chunk);
  }
  budget.check();
}

async function phoneForm(h, page, phone, route) {
  await page.goto(new URL(route, h.base).href);
  await page.getByRole("button", { name: "WhatsApp", exact: true }).click();
  await page.getByRole("textbox", { name: /^(Tu )?número de WhatsApp$/iu }).fill(nationalPhone(phone));
  if (route === "/registro") await page.getByRole("checkbox", { name: /Acepto los Términos/u }).check();
}

async function privatePerson(h, page) {
  await page.getByRole("navigation", { name: "Secciones", exact: true }).or(page.getByRole("button", { name: /, Personal$/u })).filter({ visible: true }).first().waitFor();
  const response = await h.api(page, "/api/me"); assert.equal(response.status(), 200);
  const person = await response.json(); assert.equal(person.access, "consumer"); return person;
}

export async function runQuotaWhatsAppCases(h) {
  const page = await h.newPage(); let signedIn = false;
  try {
    return await h.record("CUOTA-WA-01", () => page, async () => {
      const budget = createQuotaBudget(); const plan = quotaPhonePlan(); const begin = requireE8Control(h.env);
      const tag = `${h.width}-${randomUUID().slice(0, 8)}`; const keys = new Set(); const used = new Set(); let requests = 0; let admittedNew = 0;
      const observed = (request) => { if (request.method() === "POST" && ["/api/auth/signup", "/api/auth/login-code"].includes(new URL(request.url()).pathname)) requests++; };
      page.on("request", observed);
      const issue = async (phone, route = "/registro") => {
        budget.check(); await phoneForm(h, page, phone, route); budget.take(); const before = requests;
        const response = await clickForResponse(page, page.getByRole("button", { name: route === "/registro" ? "Crear cuenta" : "Enviar código", exact: true }), route === "/registro" ? "/api/auth/signup" : "/api/auth/login-code", "POST", null);
        assert.equal(requests, before + 1, "No se permiten envíos automáticos fuera del presupuesto."); assert.equal(requests, budget.count);
        rememberQuotaKey(keys, response.request().headers()["idempotency-key"]); used.add(phone); budget.check(); return response;
      };
      const reportProgress = () => { if (admittedNew > 0 && admittedNew % 100 === 0) console.log(`CUOTA-WA-01 ${h.width}: ${admittedNew} altas admitidas; ${requests} pedidos de emisión.`); };
      try {
        console.log(`CUOTA-WA-01 ${h.width}: inicio aislado, máximo1000 pedidos y60 minutos, sin cambiar cuotas ni reloj.`);
        const signup = await begin(`quota-wa-signup-${tag}`, plan.protectedPhone);
        const first = await issue(plan.protectedPhone); assert.equal(first.status(), 202); admittedNew++;
        assert.equal((await first.json()).resendAfterSeconds, 60);
        await fillOtp(page, (await signup("code")).proof);
        await clickForResponse(page, page.getByRole("button", { name: "Verificar y crear la cuenta", exact: true }), "/api/auth/signup/verify", "POST", 204);
        const person = await privatePerson(h, page); signedIn = true;
        const methods = await h.api(page, "/api/me/login-methods"); assert.equal(methods.status(), 200);
        assert.ok((await methods.json()).methods.some((method) => method.type === "Phone" && method.value === plan.protectedPhone && method.isVerified), "El ingreso protegido necesita su Phone propio realmente verificado.");
        await h.signOut(page); signedIn = false;
        const pool = plan.bulk.map((phone) => ({ phone, readyAt: 0 })); let exhausted = false;
        while (budget.count < quotaWhatsAppLimits.maxRequests - 2) {
          budget.check(); const next = nextQuotaDestination(pool, Date.now()); await waitRealCooldown(next.waitMs, budget);
          const target = pool[next.index]; const response = await issue(target.phone);
          if (response.status() === 202) {
            const body = await response.json(); assert.equal(body.resendAfterSeconds, 60);
            target.readyAt = Date.now() + quotaWhatsAppLimits.cooldownMs; admittedNew++; reportProgress();
            assert.ok(admittedNew <= quotaWhatsAppLimits.newCapacity, "El límite de nuevos no debe superar800 admisiones en este entorno fresco."); continue;
          }
          const problem = await response.json();
          if (response.status() === 429 && problem.code === "Auth.LoginCode.ResendTooSoon") {
            assert.ok(Number.isSafeInteger(problem.retryAfter) && problem.retryAfter > 0);
            target.readyAt = Date.now() + problem.retryAfter * 1000; continue;
          }
          await requireWhatsAppDailyLimit(response); assert.equal(admittedNew, 800, "El alta inicial consume1 de las800 admisiones nuevas; el entorno debe ser fresco.");
          await page.getByRole("alert").first().waitFor(); exhausted = true; break;
        }
        assert.equal(exhausted, true, "No se alcanzó DailyLimit dentro de1000 pedidos y el timeout; no se infiere un límite diario de otros errores.");
        assert.equal(used.has(plan.freshPhone), false, "El destino final debe conservarse sin ninguna petición anterior de esta prueba.");
        const fresh = await issue(plan.freshPhone); await requireWhatsAppDailyLimit(fresh);
        await page.getByRole("alert").first().waitFor(); assert.equal(await page.getByRole("textbox", { name: "Código 1", exact: true }).count(), 0);
        // No se pide code de98: ese control no representa ausencia durable y puede terminar el host.
        const login = await begin(`quota-wa-login-${tag}`, plan.protectedPhone);
        const protectedResponse = await issue(plan.protectedPhone, "/login"); assert.equal(protectedResponse.status(), 202, "La capacidad reservada debe permitir el ingreso verificado después de agotar los nuevos.");
        await fillOtp(page, (await login("code")).proof);
        await clickForResponse(page, page.getByRole("button", { name: "Verificar", exact: true }), "/api/auth/login-code/verify", "POST", 200);
        const returned = await privatePerson(h, page); signedIn = true; assert.equal(returned.id, person.id);
        assert.equal(requests, budget.count); assert.ok(requests <= 1000); budget.check(); await assertViewport(page);
        return `800 admisiones nuevas reales (1alta verificada y799 pendientes), DailyLimit429 y destino fresco429 con Retry-After/traceId; ingreso protegido202+OTP+Me200 de la misma persona. ${requests} pedidos de emisión, cooldown real60s, sin cambio de cuotas/reloj. No acredita ausencia persistida de LoginCodes/outbox.`;
      } finally { page.off("request", observed); }
    });
  } finally {
    try { if (signedIn) await h.signOut(page); }
    finally { try { await cleanupContinuationSessions(h); } finally { await page.close(); } }
  }
}
