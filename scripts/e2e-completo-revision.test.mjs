import assert from "node:assert/strict";
import test from "node:test";
import * as review from "./e2e-completo-revision.mjs";

test("la revisión ejecuta sólo objetivos y preparaciones, sin sustituir evidencias previas", async () => {
  for (const width of [1440, 390]) {
    const recorded = []; const actions = []; const blocked = [];
    const h = { width, record: async (id, page, action) => { recorded.push(id); return { ok: true, value: await action() }; }, block: (id) => blocked.push(id) };
    const selected = review.selectReviewedCases(h, ["objetivo"], ["preparación"]);
    for (const id of ["anterior verde", "preparación", "objetivo"]) await selected.record(id, () => ({}), async () => actions.push(id));
    selected.block("ajeno", "sin preparación"); selected.block("objetivo", "falló");
    assert.deepEqual(recorded, ["objetivo"]); assert.deepEqual(actions, ["preparación", "objetivo"]); assert.deepEqual(blocked, ["objetivo"]);
    await assert.rejects(selected.record("preparación", () => ({}), async () => { throw new Error("falló preparación"); }), /falló preparación/u);
  }
});

test("cada focal publica exactamente el caso revisado y Plataforma móvil exige390", () => {
  for (const [definitions, id] of [[review.reviewedPersonalDefinitions, "NUEVO-PER-09"], [review.reviewedPendingDefinitions, "POL-11"], [review.reviewedPlatformMobileDefinitions, "PLAT-C-13"], [review.reviewedIdempotencyDefinitions, "PLAT-C-16"]]) assert.deepEqual(definitions.map((row) => row.id), [id]);
  assert.throws(() => review.runReviewedPlatformMobileCases({ width: 1440 }));
});
