import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { baselineCoreUrl, baselineLoadHooks, installBaselineAdapter, isDirectBaselineEntry, transformBaselineReadiness } from "./e2e-completo-linea-base.mjs";

const coreSource = await readFile(new URL(baselineCoreUrl), "utf8");

test("la única transformación del core es el deadline de readiness de60 a180segundos", () => {
  const transformed = transformBaselineReadiness(coreSource);
  const marker = "async function waitForAlive(request) {";
  const start = coreSource.indexOf(marker);
  const deadline = coreSource.indexOf("60_000", start);
  assert.ok(deadline > start);
  assert.equal(transformed, `${coreSource.slice(0, deadline)}180_000${coreSource.slice(deadline + "60_000".length)}`);
  const assertions = (source) => source.split(/\r?\n/u).filter((line) => line.includes("assert.") || line.includes("t.test(") || line.includes("test("));
  assert.deepEqual(assertions(transformed), assertions(coreSource));
});

test("el guard rechaza un readiness cambiado, duplicado o ya adaptado", () => {
  for (const source of [coreSource.replace("async function waitForAlive(request)", "async function waitForAlive(other)"), coreSource.replace("const deadline = Date.now() + 60_000;", "const deadline = Date.now() + 61_000;"), coreSource.replace("// El proxy Vite aún puede estar arrancando.", "assert.fail();"), transformBaselineReadiness(coreSource), `${coreSource}\nasync function waitForAlive(request) {}`]) assert.throws(() => transformBaselineReadiness(source));
});

test("el loader sólo transforma la URL original exacta y delega todas las demás intactas", () => {
  const calls = [];
  const result = { format: "module", source: coreSource };
  const next = (...args) => { calls.push(args); return result; };
  const hooks = baselineLoadHooks();
  for (const url of ["file:///otro/test-e2e-real.test.mjs", `${baselineCoreUrl}?otro=1`, new URL("test-e2e-real-e9.mjs", baselineCoreUrl).href, "node:assert/strict"]) assert.equal(hooks.load(url, { format: "module" }, next), result);
  assert.equal(calls.length, 4);
  assert.equal(hooks.load(baselineCoreUrl, { format: "module" }, next).source, transformBaselineReadiness(coreSource));
  assert.throws(() => hooks.load(baselineCoreUrl, {}, () => ({ format: "commonjs", source: coreSource })));
});

test("Chrome y los contextos siguen siendo reales y sus bindings se restauran una sola vez al terminar", async () => {
  const calls = []; const timeouts = [];
  const context = { setDefaultNavigationTimeout: (value) => timeouts.push(value) };
  const browser = { async newContext(options) { assert.equal(this, browser); calls.push({ contextOptions: options }); return context; } };
  const browserType = { async launch(options) { assert.equal(this, browserType); calls.push({ launchOptions: options }); return browser; } };
  const originalLaunch = browserType.launch; const originalNewContext = browser.newContext;
  let registered; let afterHook; let deregisters = 0;
  const dispose = installBaselineAdapter({ browserType, register: (hooks) => { registered = hooks; return { deregister() { deregisters++; } }; }, registerAfter: (hook) => { afterHook = hook; } });
  assert.equal(typeof registered.load, "function");
  assert.equal(await browserType.launch({ headless: true, channel: "chromium", args: ["--test"] }), browser);
  assert.equal(await browser.newContext({ locale: "es-AR" }), context);
  assert.deepEqual(calls, [{ launchOptions: { headless: true, channel: "chrome", args: ["--test"] } }, { contextOptions: { locale: "es-AR" } }]);
  assert.deepEqual(timeouts, [180_000]);
  afterHook(); dispose();
  assert.equal(deregisters, 1);
  assert.equal(browserType.launch, originalLaunch);
  assert.equal(browser.newContext, originalNewContext);
});

test("una falla al instalar el loader restaura launch y no registra un after incompleto", () => {
  const launch = async () => {};
  const browserType = { launch };
  assert.throws(() => installBaselineAdapter({ browserType, register: () => { throw new Error("No disponible"); }, registerAfter: () => assert.fail("No debe registrar after") }));
  assert.equal(browserType.launch, launch);
});

test("el entryguard sólo permite ejecución directa del adaptador, no importarlo como helper", () => {
  assert.equal(isDirectBaselineEntry(undefined), false);
  assert.equal(isDirectBaselineEntry(new URL("e2e-completo-linea-base.test.mjs", import.meta.url).pathname), false);
  assert.equal(isDirectBaselineEntry(new URL("e2e-completo-linea-base.mjs", import.meta.url)), true);
  assert.equal(isDirectBaselineEntry(new URL(baselineCoreUrl)), false);
});
