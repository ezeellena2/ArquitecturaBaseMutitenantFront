import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import path from "node:path";
import { after } from "node:test";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

export const baselineCoreUrl = new URL("./test-e2e-real.test.mjs", import.meta.url).href;

// Guard completo: si cambia este helper original, se revisa el adaptador antes de volver a ejecutarlo.
// No modifica ningún assert, escenario, espera funcional ni archivo del runner original.
const originalReadiness = `async function waitForAlive(request) {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    try {
      const response = await request.get(new URL("/alive", baseUrl).href);
      if (response.status() === 200) return;
    } catch {
      // El proxy Vite aún puede estar arrancando.
    }
    await delay(500);
  }
  throw new Error("El front o la Api del AppHost E2E no quedaron listos.");
}`;

export function transformBaselineReadiness(source) {
  assert.equal(typeof source, "string");
  const newline = source.includes("\r\n") ? "\r\n" : "\n";
  const expected = originalReadiness.replaceAll("\n", newline);
  assert.equal(source.match(/^async function waitForAlive\(request\) \{/gm)?.length, 1, "Debe existir una sola función waitForAlive original.");
  assert.equal(source.split(expected).length, 2, "El cuerpo de waitForAlive debe coincidir exactamente con el original revisado.");
  return source.replace(expected, expected.replace("Date.now() + 60_000", "Date.now() + 180_000"));
}

export function baselineLoadHooks() {
  return {
    load(url, context, nextLoad) {
      const loaded = nextLoad(url, context);
      if (url !== baselineCoreUrl) return loaded;
      assert.equal(loaded.format, "module", "El core original debe cargarse como ESM.");
      assert.ok(loaded.source != null, "El loader debe devolver el fuente original.");
      const source = typeof loaded.source === "string" ? loaded.source : Buffer.from(loaded.source).toString("utf8");
      return { ...loaded, source: transformBaselineReadiness(source) };
    },
  };
}

export function installBaselineAdapter({ browserType = chromium, register = registerHooks, registerAfter = after } = {}) {
  const launch = browserType.launch;
  const contextBindings = new Map();
  let hook;
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    try { hook?.deregister(); }
    finally {
      browserType.launch = launch;
      for (const [browser, newContext] of contextBindings) browser.newContext = newContext;
      contextBindings.clear();
    }
  };
  browserType.launch = async function (options = {}) {
    const browser = await launch.call(browserType, { ...options, channel: "chrome" });
    if (!contextBindings.has(browser)) {
      const newContext = browser.newContext;
      contextBindings.set(browser, newContext);
      browser.newContext = async function (...args) {
        const context = await newContext.apply(browser, args);
        // Se mantienen páginas, tráfico, cookies, API y sesiones reales. Los timeouts explícitos del core prevalecen.
        context.setDefaultNavigationTimeout(180_000);
        return context;
      };
    }
    return browser;
  };
  try {
    hook = register(baselineLoadHooks());
    registerAfter(dispose);
    return dispose;
  } catch (error) {
    dispose();
    throw error;
  }
}

export function isDirectBaselineEntry(entry) {
  if (!entry) return false;
  return (entry instanceof URL ? entry.href : pathToFileURL(path.resolve(entry)).href) === import.meta.url;
}

// Ejecución autorizada por el coordinador:
// node --test --test-name-pattern="^registro real" scripts/e2e-completo-linea-base.mjs
// Importar este módulo como helper sólo expone funciones: no registra los tests originales ni inicia el entorno.
if (isDirectBaselineEntry(process.argv[1])) {
  const dispose = installBaselineAdapter();
  try { await import(baselineCoreUrl); }
  catch (error) { dispose(); throw error; }
}
