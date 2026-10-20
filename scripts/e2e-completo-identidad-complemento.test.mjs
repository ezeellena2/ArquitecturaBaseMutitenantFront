import assert from "node:assert/strict";
import test from "node:test";
import { identitySupplementDefinitions, identitySupplementLimitations, identityPhoneFixtures, requireThirtyDayGrace, requireEmailOwnership, runIdentityDependency } from "./e2e-completo-identidad-complemento.mjs";

test("ocho registros de identidad con coberturas completas y límites explícitos", () => {
  assert.equal(identitySupplementDefinitions.length, 8);
  assert.equal(new Set(identitySupplementDefinitions.map((item) => item.id)).size, 8);
  const covers = identitySupplementDefinitions.flatMap((item) => item.covers);
  for (const id of ["CU-005", "CU-007", "CU-014", "CU-015", "CU-017", "ID-009", "ID-024", "ID-018"]) assert.ok(covers.includes("BACK-" + id), id);
  assert.equal(covers.includes("BACK-ID-019"), false, "El desempate no prueba también la antigüedad diferenciada sin selección anterior.");
  assert.match(identitySupplementLimitations["BACK-ID-019"].missing, /empate/iu);
  assert.match(identitySupplementLimitations["BACK-ID-019"].source, /Connect/iu);
});

test("los Phone propios son sintéticos, distintos entre anchos y ajenos a las otras suites", () => {
  const all = [1440, 390].flatMap((width) => Object.values(identityPhoneFixtures(width)));
  assert.equal(new Set(all).size, all.length);
  for (const phone of all) assert.match(phone, /^\+54911345678[456]\d$/u);
  assert.throws(() => identityPhoneFixtures(1280));
});

test("la baja exige exactamente treinta días dentro de la ventana observada", () => {
  const start = Date.parse("2026-10-20T12:00:00Z");
  requireThirtyDayGrace("2026-11-19T12:00:01Z", start, start + 2000);
  for (const wrong of ["2026-11-18T12:00:01Z", "2026-11-20T12:00:01Z", "2026-11-19T12:00:01", "no-fecha"]) assert.throws(() => requireThirtyDayGrace(wrong, start, start + 2000));
});

test("la posesión distingue pendiente, verificado y ausente sin transferir otro método", () => {
  const email = "reserva@example.test";
  requireEmailOwnership({ methods: [{ id: "r", type: "Email", value: email, isVerified: false }] }, email, "pending");
  requireEmailOwnership({ methods: [{ id: "r", type: "Email", value: email, isVerified: true }] }, email, "verified");
  requireEmailOwnership({ methods: [] }, email, "absent");
  assert.throws(() => requireEmailOwnership({ methods: [{ type: "Email", value: email, isVerified: false }] }, email, "verified"));
  assert.throws(() => requireEmailOwnership({ methods: [{ type: "Email", value: email, isVerified: true }] }, email, "absent"));
});

test("una dependencia fallida bloquea sólo su caso y conserva los independientes", async () => {
  const actions = []; const blocks = []; const outcomes = new Map([["IDS-04", { ok: false }]]); const page = {};
  const h = { record: async (id, getPage, action) => { assert.equal(getPage(), page); actions.push(id); return { ok: true, value: await action() }; }, block: async (id, reason, target) => { blocks.push({ id, reason, target }); } };
  await runIdentityDependency(h, outcomes, "IDS-05", ["IDS-04"], page, async () => assert.fail("No se preparó la cuenta en baja."));
  assert.deepEqual(actions, []); assert.equal(blocks[0].target, page); assert.match(blocks[0].reason, /IDS-04/u);
  await runIdentityDependency(h, outcomes, "IDS-06", [], page, async () => "Independiente");
  assert.deepEqual(actions, ["IDS-06"]); assert.equal(outcomes.get("IDS-06").ok, true);
});
