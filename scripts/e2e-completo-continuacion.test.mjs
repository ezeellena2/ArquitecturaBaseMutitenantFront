import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { existingScriptCases } from "./e2e-completo-inventario-front.mjs";
import { cleanupContinuationSessions, continuationDefinitions, continuationExportSuffix, continuationModuleUrl, exposeJourneyExports, loadContinuationModule, runContinuationCases } from "./e2e-completo-continuacion.mjs";

const original = await readFile(new URL("./recorrido-usuario.mjs", import.meta.url), "utf8");
const definitions = existingScriptCases.filter((entry) => /^\d{2}$/.test(entry.id)).map((entry) => [entry.id, entry.title, entry.expected]);

test("la transformación sólo agrega la exposición de los dos símbolos privados y conserva cada byte de conducta", () => {
  const transformed = exposeJourneyExports(original);
  assert.equal(transformed, original + continuationExportSuffix);
  assert.equal(transformed.slice(0, original.length), original);
  assert.equal(continuationExportSuffix.trim(), "export { runWidth, definitions };");
  assert.equal(transformed.match(/export \{ runWidth, definitions \};/g)?.length, 1);
});

test("el loader rechaza estructura inesperada o una exposición ya aplicada", () => {
  assert.throws(() => exposeJourneyExports(original.replace("async function runWidth({ width, context, env, record, output, signal })", "async function runWidth({ page })")));
  assert.throws(() => exposeJourneyExports(original.replace("const definitions = [", "const cases = [")));
  assert.throws(() => exposeJourneyExports(original.replace("await runE11Journey(", "await otraFuncion(")));
  assert.throws(() => exposeJourneyExports(original + continuationExportSuffix));
  assert.throws(() => exposeJourneyExports("export async function runWidth() {}"));
});

test("el hook sólo modifica la URL exacta con query y se desregistra después del import", async () => {
  const calls = [];
  let hook;
  const untouched = { format: "module", source: "export const other = true;" };
  const exposed = { runWidth: async () => {}, definitions };
  const result = await loadContinuationModule({
    register: (value) => { hook = value; calls.push("register"); return { deregister: () => calls.push("deregister") }; },
    importModule: async (url) => {
      assert.equal(url, continuationModuleUrl);
      const queried = new URL(url); assert.ok(queried.search.length > 0);
      const plain = new URL(url); plain.search = "";
      assert.equal(hook.load(plain.href, {}, () => untouched), untouched);
      assert.equal(hook.load(`${plain.href}?otra-query=1`, {}, () => untouched), untouched);
      const loaded = hook.load(url, {}, () => ({ format: "module", source: Buffer.from(original) }));
      assert.equal(loaded.source, original + continuationExportSuffix);
      calls.push("import");
      return exposed;
    },
  });
  assert.equal(result, exposed);
  assert.deepEqual(calls, ["register", "import", "deregister"]);
});

test("un import fallido no deja el hook registrado", async () => {
  let removed = false;
  await assert.rejects(loadContinuationModule({
    register: () => ({ deregister: () => { removed = true; } }),
    importModule: async () => { throw new Error("No se pudo cargar"); },
  }), /No se pudo cargar/);
  assert.equal(removed, true);
});

test("los IDs de continuación son exactamente los BASE del inventario existente", () => {
  assert.deepEqual(continuationDefinitions.map((entry) => entry.id), existingScriptCases.map((entry) => `BASE-${entry.id}`));
  assert.equal(new Set(continuationDefinitions.map((entry) => entry.id)).size, continuationDefinitions.length);
});

test("delega runWidth sin cambiar acciones y ante aborto sólo bloquea IDs pendientes que no visitó", async () => {
  const getPage = () => ({ name: "página real" });
  const action = async () => "Acción original";
  const calls = [];
  const pendingId = continuationDefinitions.at(-1).id;
  const h = {
    width: 390, context: { cookies: async () => [] }, env: { name: "entorno" }, output: "C:/salida", signal: new AbortController().signal,
    record: async (...args) => { calls.push(["record", ...args]); return { ok: true }; },
    isPending: (id) => id === pendingId,
    block: async (...args) => calls.push(["block", ...args]),
    base: new URL("https://localtest.me:7433"),
  };
  await assert.rejects(runContinuationCases(h, { load: async () => ({ runWidth: async (input) => {
    assert.equal(input.width, h.width); assert.equal(input.context, h.context); assert.equal(input.env, h.env);
    assert.equal(input.output, h.output); assert.equal(input.signal, h.signal);
    await input.record("01", 390, getPage, action, () => "diagnóstico original");
    throw new Error("Preparación interrumpida");
  } }) }), /Preparación interrumpida/);
  assert.equal(calls[0][0], "record"); assert.equal(calls[0][1], "BASE-01");
  assert.equal(calls[0][2], getPage); assert.equal(calls[0][3], action);
  assert.deepEqual(calls.filter(([kind]) => kind === "block").map(([, id]) => id), [pendingId]);
});

test("un record fallido corta la secuencia y bloquea los no visitados, incluso fallas anteriores, conservando verdes", async () => {
  const failure = new Error("Falló la primera acción real"); const calls = []; let nextRan = false;
  const previous = new Map(continuationDefinitions.map((entry) => [entry.id, { status: "passed", actual: "Verificado antes" }]));
  previous.set("BASE-01", { status: "blocked" }); previous.set("BASE-03", { status: "pending" }); previous.set("BASE-04", { status: "blocked" });
  previous.set("BASE-05", { status: "failed", actual: "Fallo anterior conservado" });
  const originalGreen = previous.get("BASE-02");
  const h = {
    width: 1440, context: { cookies: async () => [] }, base: new URL("https://localtest.me:7433"),
    record: async (id, _page, action) => {
      calls.push(["record", id]);
      try { return { ok: true, value: await action() }; }
      catch (error) { previous.set(id, { status: "failed", actual: "Fallo observado" }); return { ok: false, error }; }
    },
    resultFor: (id, width) => { assert.equal(width, 1440); return previous.get(id); },
    block: async (id) => { calls.push(["block", id]); previous.set(id, { status: "blocked" }); },
  };
  await assert.rejects(runContinuationCases(h, { load: async () => ({ runWidth: async ({ record }) => {
    await record("01", 1440, () => null, async () => { throw failure; });
    nextRan = true;
    await record("02", 1440, () => null, async () => "No debe ejecutarse");
  } }) }), (error) => error === failure);
  assert.equal(nextRan, false);
  assert.deepEqual(calls, [["record", "BASE-01"], ["block", "BASE-03"], ["block", "BASE-04"], ["block", "BASE-05"]]);
  assert.equal(previous.get("BASE-02"), originalGreen);
  assert.equal(previous.get("BASE-05").status, "blocked");
});

test("un record fallido sin error ofrece un diagnóstico corto y no ejecuta la siguiente acción", async () => {
  let nextRan = false;
  const h = { width: 390, base: new URL("https://localtest.me:7433"), context: { cookies: async () => [] },
    record: async () => ({ ok: false }), isPending: () => false, block: async () => assert.fail("No hay pendientes") };
  await assert.rejects(runContinuationCases(h, { load: async () => ({ runWidth: async ({ record }) => {
    await record("01", 390, () => null, async () => "acción"); nextRan = true;
  } }) }), /No se completó BASE-01\./u);
  assert.equal(nextRan, false);
});

function cleanupHarness({ publicCookie = true, platformCookie = true, platformFactorPending = false } = {}) {
  const calls = [];
  const h = {
    base: new URL("https://localtest.me:7433"),
    context: { cookies: async () => [
      ...(publicCookie ? [{ name: ".AspNetCore.Identity.Application" }] : []),
      ...(platformCookie ? [{ name: ".AspNetCore.Identity.Platform" }] : []),
    ] },
    newPage: async () => {
      let route;
      const page = {
        goto: async (url) => { route = new URL(url).pathname; calls.push(["goto", route]); },
        close: async () => calls.push(["close", route]),
        getByRole: (role, { name }) => {
          const isFactor = platformFactorPending && route === "/plataforma";
          const visible = isFactor ? role === "heading" : role === "button" && name instanceof RegExp;
          const locator = {
            filter: () => locator,
            last: () => locator,
            waitFor: async () => { if (!visible) throw new Error("No visible"); },
            isVisible: async () => visible,
          };
          return locator;
        },
      };
      return page;
    },
    signOut: async () => calls.push(["logout"]),
  };
  return { h, calls };
}

test("limpia por UI sólo las dos sesiones propias que muestran el marco y cierra sus nuevas pestañas", async () => {
  const { h, calls } = cleanupHarness();
  await cleanupContinuationSessions(h);
  assert.deepEqual(calls, [["goto", "/cuenta"], ["logout"], ["close", "/cuenta"], ["goto", "/plataforma"], ["logout"], ["close", "/plataforma"]]);
});

test("un factor de Plataforma pendiente se cierra sin fabricar una sesión ni borrar cookies", async () => {
  const { h, calls } = cleanupHarness({ publicCookie: false, platformFactorPending: true });
  await cleanupContinuationSessions(h);
  assert.deepEqual(calls, [["goto", "/plataforma"], ["close", "/plataforma"]]);
});
