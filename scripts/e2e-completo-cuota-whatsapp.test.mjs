import assert from "node:assert/strict";
import test from "node:test";
import { buildMatrix } from "./e2e-completo-matriz.mjs";
import { quotaWhatsAppDefinitions, quotaWhatsAppLimitations, quotaPhonePlan, createQuotaBudget, nextQuotaDestination, rememberQuotaKey, requireWhatsAppDailyLimit, phoneForm, observeQuotaResources, diagnoseQuotaNavigation, waitRealCooldown } from "./e2e-completo-cuota-whatsapp.mjs";

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

test("una navegación que vence conserva el error y observa diagnóstico antes de volver al record", async () => {
  const failure = Object.assign(new Error("page.goto: Timeout 45000ms exceeded."), { name: "TimeoutError" });
  const calls = [];
  const page = { goto: async () => { calls.push("navegar"); throw failure; }, getByRole: () => assert.fail("No se interactúa después del timeout") };
  await assert.rejects(() => phoneForm({ base: new URL("https://localtest.me/") }, page, "+5491134567897", "/registro", {
    onNavigationFailure: async (error) => { assert.equal(error, failure); calls.push("diagnosticar"); },
  }), (error) => error === failure);
  assert.deepEqual(calls, ["navegar", "diagnosticar"]);
});

test("las altas siguientes vuelven por Usar otro número o enlaces reales y nunca recargan Vite", async () => {
  for (const previousStatus of [202, 429]) {
    const calls = []; let currentPath = "/registro";
    const control = (name) => ({
      waitFor: async () => calls.push("visible " + name),
      click: async () => { calls.push("click " + name); if (name === "Ingresá") currentPath = "/login"; if (name === "Creá una") currentPath = "/registro"; },
      fill: async (value) => { assert.equal(value, "11 3456-7897"); calls.push("llenar número"); },
      check: async () => calls.push("términos"),
    });
    const page = {
      url: () => "https://localtest.me" + currentPath,
      goto: async () => { calls.push("recarga inesperada"); },
      waitForURL: async (predicate) => { assert.equal(predicate(new URL(page.url())), true); calls.push("ruta " + currentPath); },
      getByRole: (role, options) => control(role === "textbox" ? "número" : role === "checkbox" ? "términos" : options.name),
    };
    await phoneForm({ base: new URL("https://localtest.me/") }, page, "+5491134567897", "/registro", { previousStatus });
    assert.deepEqual(calls, [
      ...(previousStatus === 202 ? ["visible Usar otro número", "click Usar otro número"]
        : ["visible Ingresá", "click Ingresá", "ruta /login", "visible Creá una", "click Creá una", "ruta /registro"]),
      "visible WhatsApp", "click WhatsApp", "visible número", "llenar número", "visible términos", "términos",
    ]);
  }
});

test("si falta el regreso por UI se conserva su fallo y no se sustituye por una recarga", async () => {
  const failure = new Error("El regreso al formulario no está disponible"); const calls = [];
  const page = {
    url: () => "https://localtest.me/registro", goto: async () => assert.fail("No hay fallback de recarga"),
    getByRole: (role, options) => {
      assert.equal(role, "button"); assert.equal(options.name, "Usar otro número");
      return { waitFor: async () => { calls.push("esperar regreso"); throw failure; }, click: async () => assert.fail("No se fuerza el regreso") };
    },
  };
  await assert.rejects(() => phoneForm({ base: new URL("https://localtest.me/") }, page, "+5491134567897", "/registro", { previousStatus: 202 }), (error) => error === failure);
  assert.deepEqual(calls, ["esperar regreso"]);
});

test("el diagnóstico inicia cuatro probes independientes y descarta datos de respuesta ajenos a las métricas", async () => {
  const started = []; const complete = [];
  const result = diagnoseQuotaNavigation({ base: new URL("https://localtest.me:5174/registro"), resources: { pending: { document: 1 } }, probe: (url) => {
    started.push({ origin: url.origin, path: url.pathname, query: url.search });
    return new Promise((resolve, reject) => complete.push({ resolve, reject }));
  } });
  assert.deepEqual(started.map((entry) => entry.path), ["/alive", "/", "/@vite/client", "/src/index.css"]);
  assert.equal(started[0].origin, "https://127.0.0.1:7280"); assert.ok(started.every((entry) => entry.query === ""));
  complete[0].resolve({ outcome: "response", status: 200, bytes: 12, elapsedMs: 2, body: "privado", headers: { location: "privado" } });
  complete[1].reject(new Error("dato privado del transporte"));
  complete[2].resolve({ outcome: "timeout", bytes: 0, elapsedMs: 5000 });
  complete[3].resolve({ outcome: "response", status: 200, bytes: 123, elapsedMs: 4 });
  const diagnostic = await result;
  assert.deepEqual(diagnostic.http.map((entry) => [entry.name, entry.outcome]), [["api-alive", "response"], ["front-index", "probe-error"], ["vite-client", "timeout"], ["front-css", "response"]]);
  assert.equal(diagnostic.http[0].status, 200); assert.equal(diagnostic.http[3].bytes, 123);
  assert.doesNotMatch(JSON.stringify(diagnostic), /privado|https?:|location|headers|body/u);
  await assert.rejects(() => diagnoseQuotaNavigation({ base: "https://example.com/", probe: () => assert.fail("No se visita un origen externo") }));
});

test("los recursos pendientes conservan sólo tipos y contadores y desmontan todos sus listeners", () => {
  const listeners = new Map(); const removed = [];
  const observer = observeQuotaResources({ on: (event, listener) => listeners.set(event, listener), off: (event, listener) => { assert.equal(listeners.get(event), listener); removed.push(event); listeners.delete(event); } });
  const request = (type) => ({ resourceType: () => type, url: () => assert.fail("No se leen URLs de recursos") });
  const document = request("document"), script = request("script"), stylesheet = request("stylesheet");
  for (const item of [document, script, stylesheet]) listeners.get("request")(item);
  listeners.get("requestfinished")(script); listeners.get("requestfailed")(stylesheet);
  const snapshot = observer.snapshot();
  assert.deepEqual(snapshot.pending, { document: 1 }); assert.equal(snapshot.started, 3); assert.equal(snapshot.finished, 1); assert.equal(snapshot.failed, 1);
  for (const key of ["nodeRssMiB", "nodeHeapMiB", "systemFreeMiB", "nodeCpuMs"]) assert.ok(Number.isSafeInteger(snapshot[key]) && snapshot[key] >= 0);
  observer.stop(); assert.equal(listeners.size, 0); assert.deepEqual(removed, ["request", "requestfinished", "requestfailed"]);
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

test("cruzar el instante listo entre lecturas no se confunde con agotar el presupuesto", async () => {
  const times = [0, 0, 1]; let checks = 0;
  await waitRealCooldown(1, { check: () => checks++, remainingMs: 60 * 60_000 }, {
    now: () => times.shift() ?? 1, sleep: async () => assert.fail("El cooldown ya terminó; no queda espera real"),
  });
  assert.equal(checks, 2);
});

test("la espera conserva tramos reales de60s y propaga el presupuesto agotado", async () => {
  let now = 0; const sleeps = [];
  await waitRealCooldown(60_001, { check() {}, get remainingMs() { return 120_000 - now; } }, {
    now: () => now, sleep: async (milliseconds) => { sleeps.push(milliseconds); now += milliseconds; },
  });
  assert.deepEqual(sleeps, [60_000, 1]); assert.equal(now, 60_001);
  const failure = new Error("Presupuesto agotado");
  await assert.rejects(() => waitRealCooldown(1, { check: () => { throw failure; } }, { now: () => 0, sleep: async () => assert.fail("No se espera sin presupuesto") }), (error) => error === failure);
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
