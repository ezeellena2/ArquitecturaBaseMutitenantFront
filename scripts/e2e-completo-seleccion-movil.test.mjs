import assert from "node:assert/strict";
import test from "node:test";
import { selectMobileBarCases } from "./e2e-completo-seleccion-movil.mjs";

test("sólo los objetivos sustituyen evidencia; las fixtures se ejecutan y el resto se omite", async () => {
  const recorded = []; const actions = []; const blocked = [];
  const h = selectMobileBarCases({ width: 390,
    record: async (id, getPage, action, diagnostic) => { recorded.push([id, getPage(), diagnostic]); return { ok: true, value: await action() }; },
    block: (id, reason, page) => { blocked.push([id, reason, page]); return { ok: false }; },
  }, { targets: ["OBJ"], prepare: ["PREP"] });
  assert.deepEqual(await h.record("PREP", () => "p", async () => { actions.push("PREP"); return 7; }), { ok: true, value: 7, preparationOnly: true });
  assert.deepEqual(await h.record("OTRO", () => "p", async () => assert.fail("No es necesario")), { ok: false, skipped: true });
  const diagnostic = () => "diagnóstico";
  assert.deepEqual(await h.record("OBJ", () => "propia", async () => { actions.push("OBJ"); return 9; }, diagnostic), { ok: true, value: 9 });
  await h.block("OTRO", "sin fixture", "p"); await h.block("OBJ", "sin fixture", "propia");
  assert.deepEqual(actions, ["PREP", "OBJ"]); assert.deepEqual(recorded, [["OBJ", "propia", diagnostic]]);
  assert.deepEqual(blocked, [["OBJ", "sin fixture", "propia"]]);
});

test("un fallo de preparación conserva la causa y no aprueba el objetivo", async () => {
  const cause = new Error("No cargó su invitación"); let records = 0;
  const h = selectMobileBarCases({ width: 390, record: () => { records++; } }, { targets: ["OBJ"], prepare: ["PREP"] });
  await assert.rejects(h.record("PREP", () => null, async () => { throw cause; }), (error) => error.cause === cause && error.message.includes("PREP"));
  assert.equal(records, 0);
});

test("el adaptador de fases originales puede visitar callbacks omitidos sin ejecutarlos", async () => {
  const h = selectMobileBarCases({ width: 390 }, { targets: ["OBJ"], skippedOk: true });
  assert.deepEqual(await h.record("OMITIDO", () => null, () => assert.fail("No se repite")), { ok: true, skipped: true });
  for (const options of [{ targets: ["OBJ", "OBJ"] }, { targets: ["OBJ"], prepare: ["OBJ"] }]) assert.throws(() => selectMobileBarCases({ width: 390 }, options));
  assert.throws(() => selectMobileBarCases({ width: 1440 }, { targets: ["OBJ"] }), /390/u);
});
