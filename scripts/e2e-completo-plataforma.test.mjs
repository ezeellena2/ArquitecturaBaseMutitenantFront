import assert from "node:assert/strict";
import { test } from "node:test";
import { assertPlatformProblem, createPlatformRecorder, platformDefinitions } from "./e2e-completo-plataforma.mjs";
import { backendUseCases } from "./e2e-completo-inventario-back.mjs";
import { guidedCases, screens } from "./e2e-completo-inventario-front.mjs";

test("un rechazo de seguridad exige estado, código y traceId reales", async () => {
  const response = (status, body) => ({ status: () => status, json: async () => body });
  await assert.doesNotReject(assertPlatformProblem(response(403, { code: "Http.Forbidden", traceId: "trace" }), 403, "Http.Forbidden"));
  for (const [status, body] of [[200, { code: "Http.Forbidden", traceId: "trace" }], [401, { code: "Http.Forbidden", traceId: "trace" }], [403, { code: "General.Error", traceId: "trace" }], [403, { code: "Http.Forbidden" }]]) {
    await assert.rejects(assertPlatformProblem(response(status, body), 403, "Http.Forbidden"));
  }
});

test("una dependencia fallida bloquea sólo sus casos y deja continuar los independientes", async () => {
  const executed = []; const blocked = []; const page = {};
  const step = createPlatformRecorder({
    record: async (id, currentPage, action) => { executed.push(id); assert.equal(currentPage(), page); try { return { ok: true, value: await action() }; } catch (error) { return { ok: false, error }; } },
    block: async (id, reason, currentPage) => { blocked.push({ id, reason }); assert.equal(currentPage, page); },
  });
  assert.equal((await step("fixture", page, async () => { throw new Error("No creada"); })).ok, false);
  let dependentRan = false;
  assert.equal((await step("depende", page, async () => { dependentRan = true; }, ["fixture"])).ok, false);
  assert.equal((await step("independiente", page, async () => "ok")).value, "ok");
  assert.equal((await step("no-comenzado", page, async () => "no", ["ausente"])).ok, false);
  assert.equal(dependentRan, false);
  assert.deepEqual(executed, ["fixture", "independiente"]);
  assert.deepEqual(blocked.map((item) => item.id), ["depende", "no-comenzado"]);
  assert.ok(blocked[0].reason.includes("fixture"));
});

test("una acción ejecuta una sola vez y conserva su resultado para habilitar la siguiente", async () => {
  const calls = []; const page = {};
  const step = createPlatformRecorder({ record: async (id, _page, action) => { calls.push(id); return { ok: true, value: await action() }; }, block: () => assert.fail("No debe bloquear") });
  assert.deepEqual(await step("primero", page, async () => "primero"), { ok: true, value: "primero" });
  assert.equal((await step("segundo", page, async () => "segundo", ["primero"])).ok, true);
  assert.deepEqual(calls, ["primero", "segundo"]);
});

test("la captura usa la pestaña del conflicto creada dentro de la acción", async () => {
  const initial = {}; const conflict = {}; let active = initial; let captured;
  const step = createPlatformRecorder({ record: async (_id, currentPage, action) => { const value = await action(); captured = currentPage(); return { ok: true, value }; }, block: () => assert.fail("No debe bloquear") });
  await step("409", () => active, async () => { active = conflict; return "Conflicto visible"; });
  assert.equal(captured, conflict);
});

test("la cobertura usa IDs reales y no confunde abrir una pestaña con modificar sus datos", () => {
  const known = new Set([...backendUseCases, ...guidedCases, ...screens.map((screen) => ({ id: `SCREEN-${screen.id}` }))].map((entry) => entry.id));
  assert.equal(new Set(platformDefinitions.map((entry) => entry.id)).size, platformDefinitions.length);
  for (const entry of platformDefinitions) for (const id of entry.covers) assert.ok(known.has(id), `Referencia desconocida: ${id}`);
  const tabCases = platformDefinitions.filter((entry) => ["PLAT-15", "PLAT-16", "PLAT-17"].includes(entry.id));
  for (const entry of tabCases) {
    assert.ok(entry.covers.includes("SCREEN-organizacion"));
    for (const writeId of ["BACK-PL-012", "BACK-PL-013", "BACK-PL-014"]) assert.equal(entry.covers.includes(writeId), false);
  }
  assert.ok(platformDefinitions.find((entry) => entry.id === "PLAT-23").covers.includes("BACK-ID-021"));
  assert.ok(platformDefinitions.find((entry) => entry.id === "PLAT-34").covers.includes("BACK-PL-027"));
});
