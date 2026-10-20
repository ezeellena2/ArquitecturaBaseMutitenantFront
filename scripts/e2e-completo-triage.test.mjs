import assert from "node:assert/strict";
import test from "node:test";
import { enrichBaselineIncidents, enrichExecutionFailures } from "./e2e-completo-triage.mjs";
import { parseFunctionalBaselineIncidents, renderBaselineIncidentsHTML } from "./e2e-completo-incidentes.mjs";

const names = {
  A8: "A8: sesiones antiguas abren ambas puertas y conservan Plataforma a 1440 y 390",
  A9: "A9: el Dueño invitado ingresa con código sin abrir el enlace a 1440 y 390",
  A3: "A3: Plataforma y persona conviven en el mismo navegador",
};
const original = (key) => parseFunctionalBaselineIncidents(`${names[key]}: falló en “paso original” [TimeoutError] detalle original.`)[0];

test("enriquece sólo los tres nombres exactos sin agregar incidentes ni modificar hechos originales", () => {
  const input = ["A8", "A9", "A3"].map((key) => Object.freeze(original(key)));
  const before = structuredClone(input);
  Object.freeze(input);
  const actual = enrichBaselineIncidents(input);
  assert.equal(actual.length, 3);
  assert.notEqual(actual, input);
  assert.deepEqual(input, before);
  for (const [index, item] of actual.entries()) {
    for (const field of ["name", "action", "stage", "actual", "severity", "caseFilter", "command", "reproduce", "captureReason"]) {
      assert.deepEqual(item[field], before[index][field], field);
    }
    for (const field of ["width", "height", "results", "status"]) assert.equal(Object.hasOwn(item, field), false, field);
    assert.ok(item.analysis.length > 80);
    assert.ok(item.area.length > 10);
    assert.ok(item.route.startsWith("/plataforma"));
  }
  assert.match(actual[0].analysis, /dos cookies.*consumer/iu);
  assert.match(actual[0].analysis, /expectProfile.*15 segundos/iu);
  assert.match(actual[0].analysis, /no demuestra pérdida/iu);
  assert.equal(Object.hasOwn(actual[0], "image"), false);
  assert.match(actual[1].analysis, /createPlatformOrganization.*antes de navegar/iu);
  assert.match(actual[1].analysis, /about:blank/u);
  assert.equal(actual[1].image, "baseline-A9-plataforma.png");
  assert.match(actual[1].analysis, /baseline-A9-invitado\.png/u);
  assert.match(actual[1].analysis, /1280 × 720/u);
  assert.match(actual[2].analysis, /coexistencia.*recargas.*salida pública/iu);
  assert.match(actual[2].analysis, /clic en Salir/iu);
  assert.match(actual[2].analysis, /hipótesis.*no confirmada/iu);
  assert.equal(Object.hasOwn(actual[2], "image"), false);
});

test("es idempotente y conserva análisis, rutas y capturas ya registrados", () => {
  const initial = original("A9");
  const input = [{ ...initial, analysis: "Análisis anterior explícito", area: "Área anterior", route: "/ruta-explicita", image: "captura-original.png", width: 1280 }];
  const snapshot = structuredClone(input);
  assert.deepEqual(enrichBaselineIncidents(input), snapshot);
  assert.deepEqual(input, snapshot);
  const enriched = enrichBaselineIncidents([original("A8"), original("A9"), original("A3")]);
  assert.deepEqual(enrichBaselineIncidents(enriched), enriched);
});

test("un nombre desconocido o parecido queda intacto y no se duplica", () => {
  const unknown = Object.freeze({ ...original("A3"), name: names.A3 + " (otro intento)", analysis: "Dato propio", results: Object.freeze([]) });
  const actual = enrichBaselineIncidents(Object.freeze([unknown]));
  assert.deepEqual(actual, [unknown]);
  assert.equal(actual[0], unknown);
  assert.deepEqual(enrichBaselineIncidents([]), []);
  const duplicatedInput = [original("A8"), original("A8")];
  assert.equal(enrichBaselineIncidents(duplicatedInput).length, 2, "El enriquecimiento conserva el inventario que recibió, sin fusionar ni crear filas.");
});

test("el renderer muestra el análisis separado del fallo y la captura A9 sin atribuirle un ancho", () => {
  const [incident] = enrichBaselineIncidents([original("A9")]);
  const html = renderBaselineIncidentsHTML([incident]);
  assert.match(html, /Análisis posterior/u);
  assert.match(html, /detalle original/u);
  assert.match(html, /src="baseline-A9-plataforma\.png"/u);
  assert.match(html, /baseline-A9-invitado\.png/u);
  assert.match(html, /Ancho no registrado por separado/u);
  assert.equal(Object.hasOwn(incident, "width"), false);
});

test("enriquece los fallos de callback sin mutar evidencia, estado, rutas, anchos ni intentos", () => {
  const previousAttempts = Object.freeze([Object.freeze({ status: "blocked", actual: "Dependencia anterior", image: "anterior.png" })]);
  const attempts = Object.freeze([Object.freeze({ status: "failed", actual: "Intento conservado" })]);
  const result = Object.freeze({ width: 1440, status: "failed", actual: "Timeout al volver a /auth/callback", image: "evidencia.png", currentRoute: "/auth/callback", currentHost: "localtest.me:5174", route: "/ruta-registrada", previousAttempts, attempts, severity: "high", extra: "Se conserva" });
  const input = Object.freeze([
    Object.freeze({ id: "NUEVO-PER-09", route: "/org/usuarios · /plataforma/cuentas", actor: "Persona", results: Object.freeze([result]) }),
    Object.freeze({ id: "POL-11", route: "/org", results: Object.freeze([Object.freeze({ ...result, width: 390 })]) }),
  ]);
  const snapshot = structuredClone(input);
  const enriched = enrichExecutionFailures(input);
  assert.deepEqual(input, snapshot);
  assert.notEqual(enriched, input);
  assert.equal(enriched.length, input.length);
  for (const [index, entry] of enriched.entries()) {
    assert.equal(entry.route, input[index].route);
    const actual = entry.results[0];
    for (const field of Object.keys(result).filter((field) => field !== "severity")) assert.deepEqual(actual[field], input[index].results[0][field], field);
    assert.equal(actual.previousAttempts, previousAttempts);
    assert.equal(actual.attempts, attempts);
    assert.equal(actual.status, "failed");
    assert.equal(actual.severity, "medium");
    assert.ok(actual.analysis.length > 80);
    assert.ok(actual.probableArea.length > 10);
    assert.ok(actual.reproduce.length >= 3);
  }
});

test("sólo analiza esos IDs, en failed y con evidencia actual del callback genérico", () => {
  const untouched = [
    { id: "OTRO", results: [{ status: "failed", currentRoute: "/auth/callback" }] },
    { id: "NUEVO-PER-09 (otro)", results: [{ status: "failed", actual: "/auth/callback" }] },
    { id: "POL-11", results: [
      { status: "passed", currentRoute: "/auth/callback" },
      { status: "blocked", actual: "No pudimos iniciar tu sesión" },
      { status: "manual", actual: "/auth/callback" },
      { status: "failed", currentRoute: "/org", actual: "No apareció una fila", previousAttempts: [{ actual: "/auth/callback" }] },
      { status: "failed", actual: "CallbackPage: error sin diagnóstico" },
    ] },
    { id: "NUEVO-PER-09" },
  ];
  assert.deepEqual(enrichExecutionFailures(untouched), untouched);
  for (const [index, entry] of enrichExecutionFailures(untouched).entries()) assert.equal(entry, untouched[index]);
  assert.deepEqual(enrichExecutionFailures(), []);
});

test("Personal distingue el destino registrado de una ruta desconocida sin inferirlo de intentos anteriores", () => {
  const [entry] = enrichExecutionFailures([{ id: "NUEVO-PER-09", route: "/org/usuarios · /plataforma/cuentas", results: [
    { width: 1440, status: "failed", currentRoute: "/auth/callback", actual: "Timeout del estado terminal", previousAttempts: [{ actual: "Destino protegido /plataforma/cuentas desde Personal: /auth/callback" }] },
    { width: 390, status: "failed", currentRoute: "/auth/callback", actual: "Destino protegido /org/usuarios desde Personal: Timeout del estado terminal" },
  ] }]);
  assert.match(entry.results[0].analysis, /destino protegido.*no (?:quedó )?registrado/iu);
  assert.match(entry.results[0].reproduce.join(" "), /ambas rutas por separado/iu);
  assert.match(entry.results[1].analysis, /destino protegido registrado.*\/org\/usuarios/iu);
  assert.ok(entry.results[1].reproduce.some((step) => step.includes("/org/usuarios")));
  assert.doesNotMatch(entry.results[1].reproduce.join(" "), /\/plataforma\/cuentas/u);
  assert.match(entry.results[0].analysis, /detalle seguro de autenticación.*cuando esté disponible/iu);
});

test("usa la observación actual aunque la captura antigua apunte a otra pestaña y no copia consultas al análisis", () => {
  const actual = 'page.goto: Navigation to "https://localtest.me/plataforma/cuentas?token=secreto" is interrupted by "https://localtest.me/auth/callback?code=654321&state=privado"';
  const [entry] = enrichExecutionFailures([{ id: "NUEVO-PER-09", results: [{ width: 390, status: "failed", currentRoute: "/cuenta", actual, image: "original.png" }] }]);
  const result = entry.results[0];
  assert.equal(result.actual, actual);
  assert.equal(result.currentRoute, "/cuenta");
  assert.equal(result.image, "original.png");
  assert.equal(result.severity, "medium");
  assert.doesNotMatch([result.analysis, result.probableArea, ...result.reproduce].join(" "), /secreto|654321|privado|https:|\?code|\?token/u);
  const [malformed] = enrichExecutionFailures([{ id: "NUEVO-PER-09", results: [{ status: "failed", currentRoute: "/auth/callback", actual: "Destino protegido /ruta-no-autorizada?token=secreto desde Personal: fallo" }] }]);
  assert.doesNotMatch(JSON.stringify({ analysis: malformed.results[0].analysis, reproduce: malformed.results[0].reproduce }), /ruta-no-autorizada|secreto/u);
});

test("Políticas explica el estado pendiente y marca el área como inferencia sin afirmar un código OAuth recibido", () => {
  const [entry] = enrichExecutionFailures([{ id: "POL-11", results: [{ width: 1440, status: "failed", actual: "No pudimos iniciar tu sesión", currentRoute: "/auth/callback" }] }]);
  const result = entry.results[0];
  assert.match(result.analysis, /RequiresApproval.*Recibimos el pedido.*\/org/u);
  assert.match(result.analysis, /CallbackPage.*PendingApproval.*LoginPage/u);
  assert.match(result.analysis, /inferencia/iu);
  assert.match(result.analysis, /detalle seguro de autenticación.*cuando esté disponible/iu);
  assert.match(result.probableArea, /probable|inferencia/iu);
  assert.match(result.reproduce.join(" "), /restaurar.*política/iu);
  assert.equal(result.status, "failed");
  assert.deepEqual(enrichExecutionFailures([entry]), [entry]);
});

test("conserva authenticationTrace sin afirmar que falta un código que el resultado sí registró", () => {
  const authenticationTrace = Object.freeze([{ stage: "authorize", errorOAuth: "access_denied", code: "Tenancy.PendingApproval" }, { stage: "token", status: 400 }]);
  for (const id of ["NUEVO-PER-09", "POL-11"]) {
    const [entry] = enrichExecutionFailures([{ id, results: [{ status: "failed", currentRoute: "/auth/callback", authenticationTrace }] }]);
    assert.equal(entry.results[0].authenticationTrace, authenticationTrace);
    assert.match(entry.results[0].analysis, /detalle seguro de autenticación.*se conserva/iu);
    assert.doesNotMatch(entry.results[0].analysis, /código OAuth.*no (?:quedó )?registrado/iu);
  }
});
