import assert from "node:assert/strict";
import test from "node:test";
import { existingScriptCases } from "./e2e-completo-inventario-front.mjs";
import { baselinewhatsapp, baselineasistente, baselineorgwa, baselineseguridad,
  prepareBaselineFixture, runOriginalBaselinePhase, withBaselineFixture } from "./e2e-completo-fases-baseline.mjs";

const definitions = ["E8-01", "E8-02", "E8-03"].map((id) => ({ id: "BASE-" + id }));
function harness(statuses = {}) {
  const calls = []; const blocks = [];
  const h = { width: 1440, resultFor: (id) => ({ status: statuses[id] ?? "pending" }),
    record: async (id, getPage, action) => {
      calls.push({ id, page: getPage() });
      try { return { ok: true, value: await action() }; }
      catch (error) { statuses[id] = "failed"; return { ok: false, error }; }
    }, block: async (id, reason, page) => { blocks.push({ id, reason, page }); } };
  return { h, calls, blocks };
}

test("bridge conserva callback original y no omite pasos por antecedentes verdes", async () => {
  const { h, calls } = harness({ "BASE-E8-01": "passed" }); let actions = 0;
  await runOriginalBaselinePhase(h, [definitions[0]], async (record) => {
    const action = async () => { actions++; return "comprobado"; };
    const result = await record("E8-01", 1440, () => "pantalla", action);
    assert.equal(result.value, "comprobado");
  });
  assert.equal(actions, 1); assert.deepEqual(calls, [{ id: "BASE-E8-01", page: "pantalla" }]);
});

test("record fallido corta el flujo original y bloquea sólo pendientes no visitados de la fase", async () => {
  const { h, calls, blocks } = harness({ "BASE-E8-03": "passed" }); const failure = new Error("falló la acción"); let continued = false;
  await assert.rejects(() => runOriginalBaselinePhase(h, definitions, async (record) => {
    await record("E8-01", 1440, () => "fallo", async () => { throw failure; }); continued = true;
  }), (error) => error === failure);
  assert.equal(continued, false); assert.equal(calls.length, 1);
  assert.deepEqual(blocks.map((item) => item.id), ["BASE-E8-02"]);
  assert.ok(blocks[0].reason.includes("no llegó"));
});

test("bridge rechaza ancho o ID ajeno antes de registrar evidencia", async () => {
  for (const [id, width] of [["E8-01", 390], ["E9-01", 1440]]) {
    const { h, calls } = harness();
    await assert.rejects(() => runOriginalBaselinePhase(h, definitions, (record) => record(id, width, () => "pantalla", async () => "no")));
    assert.equal(calls.length, 0);
  }
});

test("un paso que ya falló no se convierte en bloqueado si la fase no lo alcanza", async () => {
  const { h, blocks } = harness({ "BASE-E8-02": "failed" });
  await assert.rejects(() => runOriginalBaselinePhase(h, definitions, async () => { throw new Error("preparación"); }));
  assert.deepEqual(blocks.map((item) => item.id), ["BASE-E8-01", "BASE-E8-03"]);
});

test("preparación usa registro y publicación UI sólo cuando la fase lo necesita", async () => {
  const events = []; const owner = { email: "preparacion@example.test", organization: "Organización propia", slug: "propia", me: { access: "business", activeTenantId: "tenant-real" } };
  const fixture = { page: "persona", platformPage: "operador" };
  await prepareBaselineFixture({ width: 1440 }, fixture, { business: true, publish: true }, {
    registerBusiness: async (page) => { events.push(["registro", page]); return owner; },
    publish: async (current) => { assert.equal(current.owner, owner); events.push(["publicar", current.page]); current.site = new URL("https://propia.localtest.me:5174"); },
    signOut: async (page) => { events.push(["salir", page]); },
    operatorLogin: async (page, email) => { events.push(["operador MFA", page, email]); },
  });
  assert.deepEqual(events, [["registro", "persona"], ["publicar", "persona"], ["salir", "persona"], ["operador MFA", "operador", "e2e-a3-operator@example.test"]]);
  assert.equal(fixture.owner, owner); assert.ok(fixture.site);
});

test("seguridad reserva5b/5c sin usarlos para preparar al operador", async () => {
  const seen = [];
  await prepareBaselineFixture({ width: 390 }, { page: "p", platformPage: "o" }, { business: false, publish: false }, {
    registerBusiness: async () => { throw new Error("no corresponde"); }, publish: async () => { throw new Error("no corresponde"); },
    signOut: async () => { throw new Error("no hay sesión pública de setup"); }, operatorLogin: async (_page, email) => { seen.push(email); },
  });
  assert.deepEqual(seen, ["e2e-a1-operator@example.test"]);
});

test("fallar preparando bloquea la fase y ejecuta salida UI y cierre de ambas pestañas", async () => {
  const { h, blocks } = harness(); const events = [];
  const page = { close: async () => { events.push("cerrar persona"); } };
  const platformPage = { close: async () => { events.push("cerrar operador"); } };
  const queue = [page, platformPage]; h.newPage = async () => queue.shift();
  const failure = new Error("preparación falló"); let ran = false;
  await assert.rejects(() => withBaselineFixture(h, { definitions }, async () => { ran = true; }, {
    prepare: async () => { throw failure; }, cleanup: async () => { events.push("salida UI"); },
  }), (error) => error === failure);
  assert.equal(ran, false); assert.equal(blocks.length, 3);
  assert.deepEqual(events, ["salida UI", "cerrar persona", "cerrar operador"]);
});

test("fallo de salida conserva el error y cierra todas las pestañas", async () => {
  const { h } = harness(); const closed = []; h.newPage = async () => ({ close: async () => { closed.push(true); } });
  await assert.rejects(() => withBaselineFixture(h, { definitions }, async () => {}, {
    prepare: async () => {}, cleanup: async () => { throw new Error("salida UI falló"); },
  }), /salida UI falló/u);
  assert.equal(closed.length, 2);
});

test("cuatro suites separadas conservan69 IDs originales sin duplicarlos ni incluir núcleo1–29", () => {
  const suites = [baselinewhatsapp, baselineasistente, baselineorgwa, baselineseguridad];
  assert.deepEqual(suites.map((suite) => suite.definitions.length), [26, 21, 15, 7]);
  const known = new Set(existingScriptCases.map((entry) => "BASE-" + entry.id));
  const ids = suites.flatMap((suite) => suite.definitions.map((entry) => entry.id));
  assert.equal(new Set(ids).size, 69);
  for (const id of ids) { assert.ok(known.has(id)); assert.ok(!/^BASE-(?:0[1-9]|[12]\d)$/u.test(id)); }
  for (const suite of suites) assert.equal(typeof suite.run, "function");
});
