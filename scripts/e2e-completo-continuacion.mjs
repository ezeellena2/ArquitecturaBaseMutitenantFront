import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { existingScriptCases } from "./e2e-completo-inventario-front.mjs";

// Una instancia separada del módulo permite exponer sus símbolos privados sin editar el archivo ni su conducta.
export const continuationModuleUrl = new URL("./recorrido-usuario.mjs?e2e-completo-continuacion=exponer-runWidth-v1", import.meta.url).href;
export const continuationExportSuffix = "\nexport { runWidth, definitions };\n";

export const continuationDefinitions = existingScriptCases.map((entry) => ({
  id: `BASE-${entry.id}`,
  area: "Continuación del recorrido existente",
  actor: "Actor sintético definido por el recorrido existente",
  action: entry.title,
  route: entry.route ?? "/",
  expected: entry.expected,
  source: entry.source,
  existingScripts: [entry.script],
  critical: true,
}));
const knownIds = new Set(existingScriptCases.map((entry) => entry.id));

/** No reemplaza, mueve ni elimina código: sólo admite la estructura conocida y agrega una declaración export. */
export function exposeJourneyExports(source) {
  assert.equal(typeof source, "string", "El loader debe recibir el texto del módulo original.");
  const normalized = source.replaceAll("\r\n", "\n");
  const unique = (text) => normalized.split(text).length - 1 === 1;
  for (const marker of [
    "const definitions = [\n",
    "async function runWidth({ width, context, env, record, output, signal }) {\n",
    "export async function main({ build = true, widths: selectedWidths = widths } = {}) {\n",
    "await runE8Journey({ page, platformPage, width, env, base: baseUrl, site, record, signOut, awaitApp, awaitPlatformHome: waitForPlatformHome, signal });",
    "await runAssistantJourney({ page, platformPage, width, env, base: baseUrl, businessEmail, operatorEmail: operator,",
    "await runE11Journey({ page, platformPage, width, env, base: baseUrl, record, signOut, awaitApp,",
    "await runE9Journey({ platformPage, width, env, base: baseUrl, record, signOut, login, requestCode, verify,",
    "if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {\n  await main(parseJourneyArguments(process.argv.slice(2)));\n}",
  ]) assert.ok(unique(marker), "El recorrido cambió de estructura; no se aplica el adaptador de exposición.");
  assert.equal(/export\s*\{[^}]*\b(?:runWidth|definitions)\b[^}]*\}/u.test(normalized), false,
    "El adaptador no se aplica dos veces ni sobre una API distinta.");
  assert.equal(/export\s+(?:async\s+)?function\s+runWidth\b/u.test(normalized), false);
  assert.equal(/export\s+(?:const|let|var)\s+definitions\b/u.test(normalized), false);
  return source + continuationExportSuffix;
}

/** El hook coincide sólo con la URL privada de esta continuación y se retira incluso si importar falla. */
export async function loadContinuationModule({ register = registerHooks, importModule = (url) => import(url) } = {}) {
  const hook = register({
    load(url, context, nextLoad) {
      const loaded = nextLoad(url, context);
      if (url !== continuationModuleUrl) return loaded;
      assert.equal(loaded.format, "module", "El recorrido debe seguir siendo un módulo ESM.");
      const source = typeof loaded.source === "string" ? loaded.source : Buffer.from(loaded.source).toString("utf8");
      return { ...loaded, source: exposeJourneyExports(source) };
    },
  });
  try {
    const module = await importModule(continuationModuleUrl);
    assert.equal(typeof module.runWidth, "function", "Falta la función original del recorrido.");
    assert.ok(Array.isArray(module.definitions) && module.definitions.length === 30,
      "La lista privada del núcleo debe conservar sus treinta pasos.");
    for (const row of module.definitions) assert.ok(Array.isArray(row) && row.length === 3 && knownIds.has(row[0]));
    return module;
  } finally { hook.deregister(); }
}

async function cleanupSession(h, { cookieName, route, access }) {
  const cookies = await h.context.cookies(h.base.href);
  if (!cookies.some((cookie) => cookie.name === cookieName)) return;
  const page = await h.newPage();
  try {
    await page.goto(new URL(route, h.base).href);
    const menu = page.getByRole("button", { name: access === "platform" ? /, Plataforma$/ : /, .+$/ }).filter({ visible: true }).last();
    const sections = page.getByRole("navigation", { name: "Secciones", exact: true });
    const login = page.getByRole("textbox", { name: "Correo electrónico", exact: true });
    const factor = page.getByRole("heading", { name: /^(Protegé tu cuenta de operador|Verificación en dos pasos)$/ });
    // Una cookie cuyo factor no se completó no autoriza una sesión: esa pestaña se cierra sin fabricar un logout.
    await Promise.any([menu.waitFor(), sections.waitFor(), login.waitFor(), factor.waitFor()]);
    if (await menu.isVisible() || await sections.isVisible()) await h.signOut(page);
  } finally { await page.close(); }
}

export async function cleanupContinuationSessions(h) {
  await cleanupSession(h, { cookieName: ".AspNetCore.Identity.Application", route: "/cuenta", access: "consumer" });
  await cleanupSession(h, { cookieName: ".AspNetCore.Identity.Platform", route: "/plataforma", access: "platform" });
}

async function blockUnvisitedPending(h, visited, error) {
  for (const entry of continuationDefinitions) {
    if (visited.has(entry.id)) continue;
    const previous = h.resultFor?.(entry.id, h.width);
    const pending = h.isPending?.(entry.id, h.width) ?? (!previous || ["pending", "blocked"].includes(previous.status));
    if (pending) await h.block(entry.id, `La continuación no llegó a este paso: ${error.name ?? "Error"}.`);
  }
}

export async function runContinuationCases(h, { load = loadContinuationModule } = {}) {
  const visited = new Set();
  let failure;
  try {
    const { runWidth } = await load();
    await runWidth({ width: h.width, context: h.context, env: h.env, output: h.output, signal: h.signal,
      record: (id, width, getPage, action) => {
        assert.equal(width, h.width, "El recorrido conserva el ancho elegido por el coordinador.");
        assert.ok(knownIds.has(id), "El recorrido no puede producir IDs fuera de su inventario.");
        const targetId = `BASE-${id}`;
        visited.add(targetId);
        // Root conserva resultados verdes anteriores y ejecuta estas acciones sólo para reconstruir la fixture.
        return h.record(targetId, getPage, action);
      },
    });
  } catch (error) { failure = error; }
  try { await cleanupContinuationSessions(h); }
  catch (error) { failure = failure ? new AggregateError([failure, error], "Fallaron la continuación y su salida por UI.") : error; }
  if (failure) {
    await blockUnvisitedPending(h, visited, failure);
    throw failure;
  }
  return { visited: [...visited] };
}
