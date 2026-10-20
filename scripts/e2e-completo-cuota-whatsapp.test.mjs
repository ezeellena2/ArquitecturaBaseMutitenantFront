import assert from "node:assert/strict";
import test from "node:test";
import { buildMatrix } from "./e2e-completo-matriz.mjs";
import { quotaWhatsAppDefinitions, quotaWhatsAppLimitations, quotaPhonePlan, createQuotaBudget, nextQuotaDestination, rememberQuotaKey, requireWhatsAppDailyLimit, phoneForm } from "./e2e-completo-cuota-whatsapp.mjs";

test("el formulario Phone espera DOMContentLoaded y cada control visible, sin esperar load ni reintentar navegación", async () => {
  for (const route of ["/registro", "/login"]) for (const missingPhone of [false, true]) {
    const calls = []; const failure = new Error("El número no apareció");
    const control = (name) => ({
      waitFor: async (options) => { assert.deepEqual(options, { state: "visible" }); calls.push("visible " + name); if (name === "número" && missingPhone) throw failure; },
      click: async () => calls.push("elegir WhatsApp"), fill: async (value) => { assert.equal(value, "11 3456-7897"); calls.push("llenar número"); },
      check: async () => calls.push("aceptar términos"),
    });
    const page = {
      goto: async (url, options) => { assert.equal(url, "https://localtest.me" + route); assert.deepEqual(options, { waitUntil: "domcontentloaded" }); calls.push("DOMContentLoaded"); },
      getByRole: (role, options) => {
        if (role === "button") { assert.deepEqual(options, { name: "WhatsApp", exact: true }); return control("WhatsApp"); }
        if (role === "textbox") { assert.equal(options.name.test("Tu número de WhatsApp"), true); return control("número"); }
        assert.equal(role, "checkbox"); assert.equal(options.name.test("Acepto los Términos"), true); return control("términos");
      },
    };
    const prepare = () => phoneForm({ base: new URL("https://localtest.me/") }, page, "+5491134567897", route);
    if (missingPhone) await assert.rejects(prepare, (error) => error === failure); else await prepare();
    assert.deepEqual(calls, ["DOMContentLoaded", "visible WhatsApp", "elegir WhatsApp", "visible número",
      ...(missingPhone ? [] : ["llenar número", ...(route === "/registro" ? ["visible términos", "aceptar términos"] : [])])]);
  }
});

test("una ejecución parcial verde nunca aprueba la ausencia persistida no observable", () => {
  assert.deepEqual(quotaWhatsAppDefinitions.map((entry) => entry.id), ["CUOTA-WA-01"]);
  assert.deepEqual(quotaWhatsAppDefinitions[0].covers, []);
  assert.deepEqual(quotaWhatsAppLimitations["BACK-WA-027"].partialExecutionIds, ["CUOTA-WA-01"]);
  assert.equal(quotaWhatsAppLimitations["BACK-WA-027"].missing, "ausencia persistida de LoginCodes/outbox");
  const [row] = buildMatrix({ backend: [{ id: "BACK-WA-027" }], executions: [{ ...quotaWhatsAppDefinitions[0], results: [1440, 390].map((width) => ({ width, status: "passed" })) }], verificationLimitations: quotaWhatsAppLimitations });
  assert.ok(row.results.every((result) => result.status === "blocked"));
});

test("el plan reserva protegido97 y fresco98 sin emitir a operador99 ni canal90", () => {
  const plan = quotaPhonePlan(); assert.equal(plan.protectedPhone, "+5491134567897"); assert.equal(plan.freshPhone, "+5491134567898");
  assert.equal(plan.bulk.length, 96); assert.equal(new Set(plan.bulk).size, 96);
  for (const phone of [...plan.bulk, plan.protectedPhone, plan.freshPhone]) assert.match(phone, /^\+54911345678\d{2}$/u);
  for (const phone of [plan.protectedPhone, plan.freshPhone, "+5491134567899", "+5491134567890"]) assert.equal(plan.bulk.includes(phone), false);
});

test("el presupuesto detiene1000 pedidos, timeout y cambio de día sin reiniciar cuota", () => {
  let now = Date.parse("2026-10-20T12:00:00Z"); const budget = createQuotaBudget({ now: () => now, maxRequests: 1000, timeoutMs: 60_000 });
  for (let index = 0; index < 1000; index++) budget.take(); assert.equal(budget.count, 1000); assert.throws(() => budget.take());
  const timed = createQuotaBudget({ now: () => now, timeoutMs: 1000 }); now += 1001; assert.throws(() => timed.check());
  now = Date.parse("2026-10-20T23:59:59Z"); const day = createQuotaBudget({ now: () => now, timeoutMs: 60_000 }); now += 2000; assert.throws(() => day.check());
});

test("el siguiente destino respeta el cooldown real y espera sólo cuando todos siguen pendientes", () => {
  const pool = [{ readyAt: 61_000 }, { readyAt: 0 }, { readyAt: 70_000 }];
  assert.deepEqual(nextQuotaDestination(pool, 1000), { index: 1, waitMs: 0 });
  pool[1].readyAt = 80_000; assert.deepEqual(nextQuotaDestination(pool, 1000), { index: 0, waitMs: 60_000 });
  assert.deepEqual(nextQuotaDestination(pool, 61_000), { index: 0, waitMs: 0 }); assert.throws(() => nextQuotaDestination([], 0));
});

test("cada formulario nuevo emite una clave nueva y válida, nunca replay para agotar capacidad", () => {
  const keys = new Set(); const key = "18349a2b-e7ed-48ee-8d62-7434b5ad2f8f";
  rememberQuotaKey(keys, key); assert.equal(keys.size, 1); assert.throws(() => rememberQuotaKey(keys, key)); assert.throws(() => rememberQuotaKey(keys, undefined));
});

test("DailyLimit exige429, código exacto, traceId y Retry-After positivo coincidente", async () => {
  const problem = { code: "WhatsApp.LoginCode.DailyLimit", traceId: "traza", retryAfter: 3600 };
  const response = (status = 429, body = problem, header = String(body.retryAfter)) => ({ status: () => status, json: async () => body, headers: () => ({ "retry-after": header }) });
  assert.deepEqual(await requireWhatsAppDailyLimit(response()), problem);
  for (const reply of [response(400), response(429, { ...problem, code: "Auth.LoginCode.ResendTooSoon" }), response(429, { ...problem, code: "Security.RateLimit.Exceeded" }), response(429, { ...problem, traceId: "" }), response(429, { ...problem, retryAfter: 0 }), response(429, problem, "3599")]) await assert.rejects(requireWhatsAppDailyLimit(reply));
});
