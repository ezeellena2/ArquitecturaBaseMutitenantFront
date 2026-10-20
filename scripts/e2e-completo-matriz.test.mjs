import assert from "node:assert/strict";
import { test } from "node:test";
import { buildMatrix, importedJourneySteps, parseTapSummary, resultsFromProofs } from "./e2e-completo-matriz.mjs";

test("la matriz no aprueba por el nombre de un script o por compartir ruta", () => {
  const [item] = buildMatrix({ backend: [{ id: "A", route: "/org", existingScripts: ["recorrido-usuario.mjs"] }], executions: [{ id: "otro", route: "/org", results: [{ width: 1440, status: "passed" }, { width: 390, status: "passed" }] }] });
  assert.ok(item.results.every((result) => result.status === "blocked"));
});

test("todos los pasos enlazados y ambos anchos deben haber sido ejecutados", () => {
  const executions = [{ id: "BASE-01", results: [{ width: 1440, status: "passed", actual: "A" }, { width: 390, status: "passed", actual: "B" }] }];
  assert.ok(resultsFromProofs(["BASE-01"], executions).every((result) => result.status === "passed"));
  assert.ok(resultsFromProofs(["BASE-01", "ausente"], executions).every((result) => result.status === "blocked"));
  executions[0].results[1].status = "failed";
  assert.equal(resultsFromProofs(["BASE-01"], executions)[1].status, "failed");
  assert.equal(resultsFromProofs(["BASE-01", "ausente"], executions)[1].status, "failed", "Una falla ejecutada no se esconde detrás de un paso pendiente.");
});

test("la integración externa es manual aunque haya cobertura controlada", () => {
  const [item] = buildMatrix({ backend: [{ id: "META", manual: "Alta con número real de Meta" }] });
  assert.ok(item.results.every((result) => result.status === "manual"));
});

test("los pendientes de un recorrido cortado nunca se importan como aprobados", () => {
  const [item] = importedJourneySteps({ steps: [{ id: "01", title: "Entrar", results: [{ width: 1440, status: "passed", image: "01.png" }, { width: 390, status: "pending" }] }] }, "C:/front/recorrido/2026-10-20", "C:/front/completo/2026-10-20");
  assert.equal(item.results[0].status, "passed");
  assert.equal(item.results[1].status, "blocked");
  assert.match(item.results[0].image, /recorrido\/2026-10-20\/01.png$/);
});

test("la línea de base sólo pasa cuando hay totales y cero fallas y cancelaciones", () => {
  assert.equal(parseTapSummary("# tests 4\n# pass 4\n# fail 0\n# cancelled 0").status, "passed");
  assert.equal(parseTapSummary("ℹ tests 4\nℹ pass 3\nℹ fail 1\n✖ caso malo").status, "failed");
  assert.equal(parseTapSummary("").status, "failed");
});
