import assert from "node:assert/strict";
import test from "node:test";
import { mobileBarPlans, mobileBarActionIds, mobileBarActionDefinitions,
  collectMobileBarActionDefinitions } from "./e2e-completo-acciones-moviles.mjs";

const expectedIds = [
  "BIZ-19", "BIZ-20", "BIZ-21", "BIZ-22", "BIZ-34", "SUP-BIZ-01", "SUP-RO-06",
  "PLAT-22", "PLAT-24", "PLAT-25", "PLAT-27", "PLAT-29", "PLAT-35", "PLAT-37",
  "PLAT-C-01", "PLAT-C-04", "PLAT-C-17", "PLAT-C-18", "PLAT-C-20", "PUB-C-02", "PUB-C-05",
  "IDS-06", "IDS-09", "ORX-01", "ORX-04", "WAS-04", "WAS-05", "WAS-06", "WAS-09",
  "WAP-02", "BASE-E11-10", "BASE-E11-12", "BASE-E11-13", "BASE-E9-03", "BASE-E9-05", "SEC-02",
];

test("selecciona los36 casos exactos de barra, incluidos los verdes y CuentaPlatform ya hoja", () => {
  assert.deepEqual([...mobileBarActionIds].sort(), [...expectedIds].sort());
  assert.equal(new Set(mobileBarActionIds).size, expectedIds.length);
  assert.deepEqual(mobileBarActionDefinitions.map((row) => row.id), mobileBarActionIds);
  assert.ok(mobileBarPlans.every((plan) => /^accionesmoviles.+arreglo$/u.test(plan.name)));
  assert.equal(new Set(mobileBarPlans.map((plan) => plan.name)).size, mobileBarPlans.length);
});

test("cada definición es el objeto original de un módulo conocido, sin crear otro ID ni rebajar el contrato", async () => {
  for (const plan of mobileBarPlans) {
    assert.match(plan.module, /^\.\/e2e-completo-[a-z-]+\.mjs$/u);
    const original = await import(new URL(plan.module, import.meta.url));
    const definitions = original[plan.definitionsExport];
    assert.ok(Array.isArray(definitions), plan.definitionsExport);
    for (const definition of plan.definitions) assert.equal(definitions.find((row) => row.id === definition.id), definition);
    assert.match(plan.runExport, /^run[A-Za-z]+Cases$/u);
    assert.ok(plan.preparation.length > 0);
  }
});

test("el agregador rechaza IDs duplicados o vacíos antes de poder programar una ejecución doble", () => {
  const original = mobileBarActionDefinitions[0];
  assert.throws(() => collectMobileBarActionDefinitions([{ definitions: [original, original] }]), /duplicado/u);
  assert.throws(() => collectMobileBarActionDefinitions([{ definitions: [{ id: "" }] }]), /ID/u);
  const selected = collectMobileBarActionDefinitions([{ definitions: [original] }]);
  assert.equal(selected[0], original);
});
