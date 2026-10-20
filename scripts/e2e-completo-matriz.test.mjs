import assert from "node:assert/strict";
import { test } from "node:test";
import { buildMatrix, importedJourneySteps, parseTapSummary, resultsFromProofs, safeEvidenceText } from "./e2e-completo-matriz.mjs";

test("los diagnósticos omiten queries y fragmentos HTTP y WebSocket", () => {
  const actual = safeEvidenceText("GET https://localtest.me:5174/login?state=privado#secreto y wss://localtest.me:5174/?token=privado");
  assert.ok(!actual.includes("privado") && !actual.includes("secreto"));
  assert.match(actual, /localtest\.me:5174\/login/);
});

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

test("proofIds y existingCaseIds originales forman una única prueba conjunta", () => {
  const backend = [{ id: "A", proofIds: ["01"], existingCaseIds: ["02"] }];
  const executions = [{ id: "BASE-01", results: [{ width: 1440, status: "passed", actual: "Primera acción" }] }];
  let row = buildMatrix({ backend, executions })[0];
  assert.deepEqual(row.proofGroups, [["BASE-01", "BASE-02"]]);
  assert.deepEqual(row.results.map((result) => result.status), ["blocked", "blocked"]);
  executions.push({ id: "BASE-02", results: [{ width: 1440, status: "passed", actual: "Segunda acción" }] });
  row = buildMatrix({ backend, executions })[0];
  assert.deepEqual(row.results.map((result) => result.status), ["passed", "blocked"]);
  assert.deepEqual(row.results[0].proofIds, ["BASE-01", "BASE-02"]);
});

test("una ejecución covers completa es alternativa a originales pendientes", () => {
  const execution = { id: "NUEVO", covers: ["A"], results: [{ width: 1440, status: "passed", actual: "Acción completa", image: "nueva.png" }] };
  const [row] = buildMatrix({ backend: [{ id: "A", proofIds: ["01"], existingCaseIds: ["02"] }], executions: [execution] });
  assert.deepEqual(row.proofGroups, [["BASE-01", "BASE-02"], ["NUEVO"]]);
  assert.deepEqual(row.proofIds, ["BASE-01", "BASE-02", "NUEVO"]);
  assert.deepEqual(row.results.map((result) => result.status), ["passed", "blocked"]);
  assert.deepEqual(row.results[0].proofIds, ["NUEVO"]);
  assert.equal(row.results[0].image, "nueva.png");
});

test("un grupo original completo pasa aunque otra alternativa no se haya ejecutado", () => {
  const executions = [
    { id: "BASE-01", results: [{ width: 1440, status: "passed", actual: "Primero" }] },
    { id: "BASE-02", results: [{ width: 1440, status: "passed", actual: "Segundo" }] },
    { id: "NUEVO", covers: ["A"], results: [{ width: 1440, status: "blocked", actual: "Preparación ausente" }] },
  ];
  const [row] = buildMatrix({ backend: [{ id: "A", existingCaseIds: ["01", "02"] }], executions });
  assert.deepEqual(row.results.map((result) => result.status), ["passed", "blocked"]);
  assert.deepEqual(row.results[0].proofIds, ["BASE-01", "BASE-02"]);
  assert.equal(row.results[0].actual.includes("Preparación ausente"), false);
});

test("dos covers son alternativas por ancho y no se juntan con originales incompletos", () => {
  const executions = [
    { id: "BASE-01", results: [{ width: 1440, status: "passed", actual: "Sólo una parte" }, { width: 390, status: "passed" }] },
    { id: "NUEVO-A", covers: ["A"], results: [{ width: 1440, status: "passed", actual: "Alternativa A" }] },
    { id: "NUEVO-B", covers: ["A"], results: [{ width: 390, status: "passed", actual: "Alternativa B" }] },
  ];
  let row = buildMatrix({ backend: [{ id: "A", existingCaseIds: ["01", "02"] }], executions })[0];
  assert.deepEqual(row.results.map((result) => result.status), ["passed", "passed"]);
  assert.deepEqual(row.results.map((result) => result.proofIds), [["NUEVO-A"], ["NUEVO-B"]]);
  executions[2].results[0].status = "pending";
  row = buildMatrix({ backend: [{ id: "A", existingCaseIds: ["01", "02"] }], executions })[0];
  assert.deepEqual(row.results.map((result) => result.status), ["passed", "blocked"]);
});

test("cualquier fallo ejecutado asociado prevalece aun si otro grupo está verde", () => {
  const failure = { width: 1440, status: "failed", actual: "Fallo real", image: "fallo.png", severity: "high" };
  for (const failedId of ["BASE-01", "NUEVO-A", "NUEVO-B"]) {
    const executions = [
      { id: "BASE-01", results: [{ width: 1440, status: "passed" }] },
      { id: "NUEVO-A", covers: ["A"], results: [{ width: 1440, status: "passed" }] },
      { id: "NUEVO-B", covers: ["A"], results: [{ width: 1440, status: "passed" }] },
    ];
    executions.find((item) => item.id === failedId).results[0] = failure;
    const [row] = buildMatrix({ backend: [{ id: "A", existingCaseIds: ["01", "02"] }], executions });
    assert.equal(row.results[0].status, "failed", failedId);
    assert.equal(row.results[0].actual, failure.actual);
    assert.equal(row.results[0].image, failure.image);
    assert.equal(row.results[0].severity, failure.severity);
    assert.equal(row.results[1].status, "blocked");
  }
});

test("un motivo manual no oculta un fallo real asociado en ese ancho", () => {
  const [row] = buildMatrix({ backend: [{ id: "META", manual: "Proveedor real pendiente" }], executions: [
    { id: "REAL", covers: ["META"], results: [{ width: 1440, status: "failed", actual: "Rechazo incorrecto", image: "fallo.png" }, { width: 390, status: "passed" }] },
  ] });
  assert.deepEqual(row.results.map((result) => result.status), ["failed", "manual"]);
  assert.equal(row.results[0].image, "fallo.png");
  assert.equal(row.results[1].actual, "Proveedor real pendiente");
});

test("un estado desconocido o pendiente no acredita una prueba conjunta", () => {
  for (const status of ["pending", "running", "skipped", undefined]) {
    assert.equal(resultsFromProofs(["A"], [{ id: "A", results: [{ width: 1440, status }] }])[0].status, "blocked");
  }
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
