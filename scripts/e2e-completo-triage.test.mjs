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

const quotaNavigationFailure = (mode = "domcontentloaded", route = "/registro") => `page.goto: Timeout 45000ms exceeded.\nCall log:\n  - navigating to "https://localtest.me:5174${route}?token=reservado", waiting until "${mode}"\n Captura no disponible (TimeoutError).`;

const emptyOperatorLabelFailure = "La opción del gestor propio debe tener un nombre accesible no vacío en el selector de Operadores.";
const activeConversationDeleteConflict = "La acción UI debe responder 204.\n\n409 !== 204\n Tránsito de autenticación: []";
test("AS06 describe el DELETE409 real de escritorio sin acreditar el borrado ni alterar evidencias", () => {
  const history = Object.freeze([Object.freeze({ status: "failed", actual: "La preparación debe llegar a Borrar antes del final del Fake.", image: "previa.png" })]);
  const trace = Object.freeze([{ route: "/connect/token", status: 200 }]);
  const failure = Object.freeze({ width: 1440, status: "failed", actual: activeConversationDeleteConflict, image: "AS-SUP-06-1440.png", currentRoute: "/org", severity: "high", previousAttempts: history, authenticationTrace: trace });
  const phone = Object.freeze({ width: 390, status: "failed", actual: "La preparación debe llegar a Borrar antes del final del Fake.", currentRoute: "/org/asistente", image: "AS-SUP-06-390.png" });
  const input = Object.freeze([Object.freeze({ id: "AS-SUP-06", actor: "Dueña de conversación propia", expected: "Borrar204 y luego404", results: Object.freeze([failure, phone]) })]);
  const before = structuredClone(input); const [entry] = enrichExecutionFailures(input); const result = entry.results[0];
  assert.deepEqual(input, before); assert.notEqual(entry, input[0]);
  for (const key of Object.keys(failure).filter((key) => key !== "severity")) assert.equal(result[key], failure[key], key);
  assert.equal(entry.actor, input[0].actor); assert.equal(entry.expected, input[0].expected); assert.equal(entry.results[1], phone);
  assert.equal(result.severity, "medium"); assert.match(result.analysis, /DELETE.*409.*204/u);
  assert.match(result.analysis, /primer turno.*PNG.*mismo ID/u); assert.match(result.analysis, /dos.*Generating/u);
  assert.match(result.analysis, /bytes exactos.*no-store.*attachment/u);
  assert.match(result.analysis, /historial.*versión.*inferencia/iu); assert.match(result.analysis, /no.*código.*HTTP/iu);
  assert.match(result.analysis, /404.*no resurrección.*no.*acreditad/iu);
  assert.match(result.probableArea, /Front.*historial.*inferencia/iu);
  assert.match(result.reproduce.join(" "), /primer turno.*PNG.*Generating.*Borrar.*409/iu);
  assert.doesNotMatch([result.analysis, ...result.reproduce].join(" "), /https:|@[a-z]|\b[0-9a-f]{8}-[0-9a-f]{4}/iu);
  assert.deepEqual(enrichExecutionFailures([entry]), [entry]); assert.equal(history[0].analysis, undefined);
});

test("AS06 no aplica a otro ancho, ruta, firma, estado ni a un conflicto histórico", () => {
  const failure = { width: 1440, status: "failed", actual: activeConversationDeleteConflict, currentRoute: "/org" };
  const rows = [
    { id: "OTRO", results: [failure] },
    { id: "AS-SUP-06", results: [{ ...failure, width: 390 }, { ...failure, status: "passed" }, { ...failure, status: "blocked" },
      { ...failure, currentRoute: "/org/asistente" }, { ...failure, actual: "Expected values to be strictly equal:\n\n409 !== 204" },
      { ...failure, actual: activeConversationDeleteConflict.replace("409 !== 204", "400 !== 204") },
      { ...failure, actual: "locator.waitFor: Timeout 30000ms exceeded.", previousAttempts: [failure] }] },
  ];
  const result = enrichExecutionFailures(rows); assert.deepEqual(result, rows); result.forEach((row, i) => assert.equal(row, rows[i]));
});

const completedActiveConversationPreparation = "La preparación debe llegar a Borrar antes del final del Fake.\n+ actual - expected\n\n+ 'Complete'\n- 'Generating'\n Tránsito de autenticación: []";
test("AS06 distingue la ventana temporal móvil que terminó antes de intentar DELETE", () => {
  const history = Object.freeze([Object.freeze({ width: 390, status: "failed", actual: "Expected values to be strictly equal: 400 !== 404", image: "previa-movil.png" })]);
  const failure = Object.freeze({ width: 390, status: "failed", actual: completedActiveConversationPreparation, currentRoute: "/org/asistente", image: "AS-SUP-06-390.png", previousAttempts: history });
  const input = Object.freeze([Object.freeze({ id: "AS-SUP-06", actor: "Dueña propia", results: Object.freeze([failure]) })]);
  const snapshot = structuredClone(input); const [entry] = enrichExecutionFailures(input); const result = entry.results[0];
  assert.deepEqual(input, snapshot); assert.notEqual(entry, input[0]);
  for (const key of Object.keys(failure)) assert.equal(result[key], failure[key], key);
  assert.equal(result.severity, "medium"); assert.match(result.probableArea, /entorno.*preparación.*arnés/iu);
  assert.match(result.analysis, /Complete.*Generating/u); assert.match(result.analysis, /Fake.*3 segundos/u);
  assert.match(result.analysis, /primera.*Generating.*bytes.*control.*diálogo/iu);
  assert.match(result.analysis, /no.*DELETE.*204.*404.*no resurrección.*no.*acreditad/iu);
  assert.match(result.analysis, /no demuestra.*defecto.*producto/iu); assert.doesNotMatch(result.analysis, /409|ConcurrencyConflict/u);
  assert.match(result.reproduce.join(" "), /primer turno.*PNG.*Borrar.*Generating.*Complete/iu);
  assert.deepEqual(enrichExecutionFailures([entry]), [entry]); assert.equal(history[0].analysis, undefined);
});

test("AS06 no infiere la preparación móvil desde firmas parecidas, históricas u otros actores", () => {
  const failure = { width: 390, status: "failed", actual: completedActiveConversationPreparation, currentRoute: "/org/asistente" };
  const rows = [
    { id: "AS-SUP-05", results: [failure] },
    { id: "AS-SUP-06", results: [{ ...failure, width: 1440 }, { ...failure, currentRoute: "/org" },
      { ...failure, status: "passed" }, { ...failure, status: "blocked" },
      { ...failure, actual: completedActiveConversationPreparation.replace("+ 'Complete'", "+ 'Stopped'") },
      { ...failure, actual: completedActiveConversationPreparation.replace("- 'Generating'", "- 'Complete'") },
      { ...failure, actual: "La preparación debe llegar a Borrar antes del final del Fake." },
      { ...failure, actual: "locator.waitFor: Timeout 30000ms exceeded.", previousAttempts: [failure] }] },
  ];
  const result = enrichExecutionFailures(rows); assert.deepEqual(result, rows); result.forEach((row, i) => assert.equal(row, rows[i]));
});

test("WAP01 analiza sólo la etiqueta vacía observada y conserva el fallo, las capturas y sus antecedentes", () => {
  const history = Object.freeze([Object.freeze({ status: "failed", actual: "locator.click: Timeout 30000ms exceeded.", image: "anterior.png" })]);
  const trace = Object.freeze([{ route: "/connect/token", status: 200 }]);
  const failed = Object.freeze({ width: 1440, status: "failed", actual: emptyOperatorLabelFailure + " Tránsito de autenticación: []", image: "WAP-01-1440.png", currentRoute: "/plataforma/whatsapp/equipos", previousAttempts: history, authenticationTrace: trace, severity: "high" });
  const passed = Object.freeze({ width: 390, status: "passed", actual: "Pasó", image: "movil.png" });
  const input = Object.freeze([Object.freeze({ id: "WAP-01", actor: "Gestor propio", route: "/plataforma/whatsapp/bot", expected: "Nombre accesible", results: Object.freeze([failed, passed]) })]);
  const before = structuredClone(input); const [entry] = enrichExecutionFailures(input); const result = entry.results[0];
  assert.deepEqual(input, before); assert.notEqual(entry, input[0]); assert.equal(entry.actor, input[0].actor); assert.equal(entry.route, input[0].route); assert.equal(entry.expected, input[0].expected);
  for (const key of Object.keys(failed).filter((key) => key !== "severity")) assert.equal(result[key], failed[key], key);
  assert.equal(entry.results[1], passed); assert.equal(result.previousAttempts, history); assert.equal(result.severity, "medium");
  assert.match(result.analysis, /etiqueta.*vacía/iu); assert.match(result.analysis, /correo.*ID real/iu);
  assert.match(result.analysis, /403.*200/u); assert.match(result.analysis, /equipo.*201.*GET200/iu);
  assert.match(result.analysis, /Http\.Forbidden/u); assert.match(result.analysis, /plantillas.*200/iu);
  assert.match(result.analysis, /DisplayName.*string\.Empty/u); assert.match(result.probableArea, /inferencia/iu);
  assert.match(result.reproduce.join(" "), /Crear equipo.*Operadores.*Buscar/iu);
  assert.doesNotMatch([result.analysis, ...result.reproduce].join(" "), /WAP-02|https:|@[a-z]|\b[0-9a-f]{8}-[0-9a-f]{4}/iu);
  assert.deepEqual(enrichExecutionFailures([entry]), [entry]); assert.equal(history[0].analysis, undefined);
});

test("WAP01 no hereda firmas ni enriquece passed, WAP02, otros IDs o errores genéricos", () => {
  const failure = { status: "failed", actual: emptyOperatorLabelFailure, currentRoute: "/plataforma/whatsapp/equipos" };
  const rows = [
    { id: "WAP-02", results: [failure] }, { id: "OTRO", results: [failure] },
    { id: "WAP-01", results: [{ ...failure, status: "passed" }, { ...failure, status: "blocked" },
      { ...failure, actual: "locator.click: Timeout 30000ms exceeded.", previousAttempts: [failure] },
      { ...failure, actual: emptyOperatorLabelFailure + " Otro error" }, { ...failure, currentRoute: "/plataforma/whatsapp/bot" }] },
  ];
  const actual = enrichExecutionFailures(rows); assert.deepEqual(actual, rows); actual.forEach((row, i) => assert.equal(row, rows[i]));
});

test("cuota analiza sólo el timeout real de navegación y conserva actual, estado, imágenes e historial sin acreditar progreso", () => {
  const previousAttempts = Object.freeze([Object.freeze({ status: "failed", actual: quotaNavigationFailure("load"), image: "", reason: "Primer intento conservado" })]);
  const results = [1440, 390].map((width) => Object.freeze({ width, status: "failed", actual: quotaNavigationFailure(), currentRoute: "/registro", image: undefined,
    previousAttempts, severity: "high", authenticationTrace: Object.freeze([{ route: "/connect/token", status: 200 }]), extra: "Conservado" }));
  const input = Object.freeze([Object.freeze({ id: "CUOTA-WA-01", expected: "800 admisiones y reserva protegida", results: Object.freeze(results) })]);
  const snapshot = structuredClone(input); const [entry] = enrichExecutionFailures(input);
  assert.deepEqual(input, snapshot); assert.notEqual(entry, input[0]); assert.equal(entry.expected, input[0].expected);
  for (const [index, result] of entry.results.entries()) {
    for (const key of Object.keys(results[index]).filter((key) => key !== "severity")) assert.equal(result[key], results[index][key], key);
    assert.equal(result.previousAttempts, previousAttempts); assert.equal(result.severity, "medium");
    assert.match(result.probableArea, /entorno.*navegación.*arnés/iu);
    assert.match(result.analysis, /no acreditó.*800/iu); assert.match(result.analysis, /no se comprob(?:ó|aron).*DailyLimit/iu);
    assert.match(result.analysis, /no demuestra.*(?:bug|defecto).*cuota/iu); assert.match(result.analysis, /ausencia.*LoginCodes\/outbox/iu);
    assert.match(result.analysis, /causa.*sin confirmar/iu); assert.match(result.analysis, /primer intento.*único reintento aislado/iu);
    assert.doesNotMatch(result.analysis, /\b100\b/u);
    assert.match(result.reproduce.join(" "), new RegExp(String(result.width), "u"));
    assert.match(result.reproduce.join(" "), /e2e-completo-cuota-whatsapp\.mjs/u);
    assert.match(result.reproduce.join(" "), /detener.*sin.*reintentos adicionales/iu);
    assert.doesNotMatch([result.analysis, result.probableArea, ...result.reproduce].join(" "), /reservado|https:|\?token/u);
  }
  assert.deepEqual(enrichExecutionFailures([entry]), [entry]); assert.equal(previousAttempts[0].analysis, undefined);
});

test("cuota no hereda la firma de un intento previo ni enriquece passed, otros IDs o fallos distintos", () => {
  const rows = [
    { id: "CUOTA-WA-01 (otro)", results: [{ status: "failed", actual: quotaNavigationFailure() }] },
    { id: "OTRO", results: [{ status: "failed", actual: quotaNavigationFailure() }] },
    { id: "CUOTA-WA-01", results: [
      { status: "passed", actual: quotaNavigationFailure() }, { status: "blocked", actual: quotaNavigationFailure() },
      { status: "failed", actual: "No llegó DailyLimit", previousAttempts: [{ status: "failed", actual: quotaNavigationFailure() }] },
      { status: "failed", actual: quotaNavigationFailure().replace("page.goto", "locator.waitFor") },
      { status: "failed", actual: quotaNavigationFailure().replace("45000", "30000") },
      { status: "failed", actual: quotaNavigationFailure("load", "/login") },
      { status: "failed", actual: quotaNavigationFailure().replace(" Captura no disponible (TimeoutError).", "") },
      { status: "failed", actual: "page.goto: Timeout 45000ms exceeded.", currentRoute: "/registro" },
    ] },
  ];
  const actual = enrichExecutionFailures(rows); assert.deepEqual(actual, rows);
  actual.forEach((row, index) => assert.equal(row, rows[index]));
});

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

test("Personal agrega sólo la respuesta OAuth segura del intento actual y conserva toda su evidencia", () => {
  const authenticationTrace = Object.freeze([Object.freeze({ route: "/connect/authorize", status: 302, access: "business", error: "access_denied", domainCode: "Tenancy.Access.NotMember" })]);
  const previousAttempts = Object.freeze([Object.freeze({ status: "failed", actual: "Callback anterior", image: "anterior.png" })]);
  const result = Object.freeze({ width: 390, status: "failed", currentRoute: "/auth/callback", image: "NUEVO-PER-09-390.png",
    actual: "Destino protegido /org/usuarios desde Personal: Timeout", authenticationTrace, previousAttempts });
  const input = Object.freeze([Object.freeze({ id: "NUEVO-PER-09", results: Object.freeze([result]) })]);
  const snapshot = structuredClone(input);
  const [enriched] = enrichExecutionFailures(input); const actual = enriched.results[0];
  assert.match(actual.analysis, /\/connect\/authorize.*302.*business.*access_denied.*Tenancy\.Access\.NotMember/u);
  assert.match(actual.analysis, /no identifica la causa interna/u);
  assert.deepEqual(input, snapshot);
  for (const key of Object.keys(result)) assert.equal(actual[key], result[key], key);
  assert.deepEqual(enrichExecutionFailures([enriched]), [enriched]);
  assert.equal(previousAttempts[0].analysis, undefined);
});

test("Personal no hereda códigos de otro intento ni une trazas parciales o rutas distintas", () => {
  const observed = { route: "/connect/authorize", status: 302, access: "business", error: "access_denied", domainCode: "Tenancy.Access.NotMember" };
  const variants = [undefined, [],
    ...Object.keys(observed).map((key) => [{ ...observed, [key]: undefined }]),
    [{ ...observed, status: 400 }], [{ ...observed, access: "consumer" }], [{ ...observed, route: "/connect/token" }],
    [{ ...observed, error: "otro_error" }], [{ ...observed, domainCode: "Tenancy.Access.Other" }],
    [{ ...observed, error: undefined }, { ...observed, domainCode: undefined }],
  ];
  for (const authenticationTrace of variants) {
    const [entry] = enrichExecutionFailures([{ id: "NUEVO-PER-09", results: [{ status: "failed", currentRoute: "/auth/callback",
      actual: "Destino protegido /org/usuarios desde Personal: Timeout", authenticationTrace,
      previousAttempts: [{ authenticationTrace: [observed] }] }] }]);
    assert.doesNotMatch(entry.results[0].analysis, /access_denied|Tenancy\.Access\.NotMember/u);
  }
  for (const actual of ["Timeout", "Destino protegido /plataforma/cuentas desde Personal: Timeout"]) {
    const [entry] = enrichExecutionFailures([{ id: "NUEVO-PER-09", results: [{ status: "failed", currentRoute: "/auth/callback", actual, authenticationTrace: [observed] }] }]);
    assert.doesNotMatch(entry.results[0].analysis, /access_denied|Tenancy\.Access\.NotMember/u);
  }
});

const pendingHomeFailure = "locator.waitFor: Timeout 15000ms exceeded. waiting for getByRole('dialog', { name: 'Antes de tu primera consulta', exact: true }).or(getByRole('heading', { name: '¿Qué querés consultar?', exact: true })).or(getByRole('heading', { name: 'El asistente todavía no está configurado', exact: true })).first() to be visible";
const replayLocationFailure = "Expected values to be strictly equal:\n+ actual - expected\n\n+ undefined\n- 'https://localtest.me:5174/api/platform/tenants/a87b6b2a-49b8-4afe-ab64-f9efe9249c1e'";
const finalReplayLocationFailure = replayLocationFailure.replace("Expected values to be strictly equal:", "El replay201 debe conservar Location del alta201.");

test("C13 móvil identifica la composición del inicio sin atribuir una falla a la aprobación todavía no visitada", () => {
  const previousAttempts = Object.freeze([Object.freeze({ status: "blocked", actual: "Dependencia anterior" })]);
  const authenticationTrace = Object.freeze([Object.freeze({ route: "/connect/token", status: 200 })]);
  const result = Object.freeze({ width: 390, status: "failed", actual: pendingHomeFailure, currentRoute: "/plataforma/organizaciones", image: "PLAT-C-13-390.png", previousAttempts, authenticationTrace, severity: "high" });
  const input = Object.freeze([Object.freeze({ id: "PLAT-C-13", results: Object.freeze([result]) })]); const snapshot = structuredClone(input);
  const [entry] = enrichExecutionFailures(input); const actual = entry.results[0];
  assert.deepEqual(input, snapshot); assert.equal(actual.status, "failed"); assert.equal(actual.width, 390);
  for (const key of Object.keys(result).filter((key) => key !== "severity")) assert.equal(actual[key], result[key], key);
  assert.match(actual.analysis, /PlatformHomeRoute.*Organizaciones/iu);
  assert.match(actual.analysis, /PlatformHomePage.*PlatformToResolve.*escritorio/iu);
  assert.match(actual.analysis, /antes de.*Revisar/iu);
  assert.match(actual.analysis, /aprobación.*correo.*sin acreditar/iu);
  assert.match(actual.probableArea, /Front.*390.*arnés/iu); assert.equal(actual.severity, "medium");
  assert.deepEqual(enrichExecutionFailures([entry]), [entry]);
});

test("C16 atribuye sólo Location ausente al replay BufferedJson y conserva su evidencia HTTP y captura", () => {
  const result = Object.freeze({ width: 390, status: "failed", actual: replayLocationFailure, currentRoute: "/plataforma/organizaciones", image: "PLAT-C-16-390.png", severity: "high", authenticationTrace: Object.freeze([{ route: "/connect/token", status: 200 }]) });
  const input = Object.freeze([Object.freeze({ id: "PLAT-C-16", results: Object.freeze([result]) })]); const snapshot = structuredClone(input);
  const [entry] = enrichExecutionFailures(input); const actual = entry.results[0];
  assert.deepEqual(input, snapshot); for (const key of Object.keys(result).filter((key) => key !== "severity")) assert.equal(actual[key], result[key], key);
  assert.match(actual.analysis, /201.*Location/iu); assert.match(actual.analysis, /status.*cuerpo.*IDs/iu);
  assert.match(actual.analysis, /BufferedJson.*ContentResult/iu); assert.match(actual.analysis, /api-http\.md/iu);
  assert.match(actual.analysis, /no acredita.*duplicación.*perfiles.*aceptación/iu);
  assert.match(actual.probableArea, /^Back.*IdempotencyFilter.*BufferedJson/iu);
  assert.doesNotMatch([actual.analysis, actual.probableArea, ...actual.reproduce].join(" "), /https:|localtest|a87b6b2a/u);
  assert.deepEqual(enrichExecutionFailures([entry]), [entry]);
});

test("C16 con la firma final en org informa sólo las comprobaciones previas alcanzadas por ese callback", () => {
  for (const width of [1440, 390]) {
    const previousAttempts = Object.freeze([Object.freeze({ width, status: "failed", actual: replayLocationFailure, currentRoute: "/plataforma/organizaciones", image: "historica.png" })]);
    const attempts = Object.freeze([Object.freeze({ status: "failed", actual: "Intento anterior conservado" })]);
    const authenticationTrace = Object.freeze([Object.freeze({ route: "/connect/token", status: 200 })]);
    const result = Object.freeze({ width, status: "failed", actual: finalReplayLocationFailure, currentRoute: "/org", image: `PLAT-C-16-${width}.png`, previousAttempts, attempts, authenticationTrace });
    const input = Object.freeze([Object.freeze({ id: "PLAT-C-16", results: Object.freeze([result]) })]); const snapshot = structuredClone(input);
    const [entry] = enrichExecutionFailures(input); const enriched = entry.results[0];
    assert.deepEqual(input, snapshot); for (const key of Object.keys(result)) assert.equal(enriched[key], result[key], key);
    assert.match(enriched.analysis, /aserción final/iu);
    assert.match(enriched.analysis, /422.*Request\.IdempotencyKeyReused/u);
    assert.match(enriched.analysis, /historial.*sin nuevos eventos/iu);
    assert.match(enriched.analysis, /NoAccount.*aceptación200.*Business.*sin Personal/u);
    assert.match(enriched.analysis, /operador.*sin perfiles públicos/iu);
    assert.match(enriched.analysis, /un único correo de invitación/iu);
    assert.match(enriched.analysis, /sigue failed/u); assert.match(enriched.analysis, /BufferedJson.*ContentResult/u);
    assert.equal(previousAttempts[0].analysis, undefined);
    assert.deepEqual(enrichExecutionFailures([entry]), [entry]);
  }
});

test("C16 no hereda el alcance final desde la ruta, una firma parecida ni intentos históricos", () => {
  const variants = [
    { actual: replayLocationFailure, currentRoute: "/org", previousAttempts: [{ actual: finalReplayLocationFailure, currentRoute: "/org" }] },
    { actual: finalReplayLocationFailure, currentRoute: "/plataforma/organizaciones" },
    { actual: finalReplayLocationFailure.replace("alta201.", "alta201 (otra aserción)."), currentRoute: "/org" },
    { actual: replayLocationFailure, currentRoute: "/plataforma/organizaciones" },
  ];
  for (const variant of variants) {
    const [entry] = enrichExecutionFailures([{ id: "PLAT-C-16", results: [{ width: 1440, status: "failed", ...variant }] }]);
    assert.doesNotMatch(entry.results[0].analysis, /aserción final|aceptación200|un único correo de invitación/u);
    assert.match(entry.results[0].analysis, /no acredita.*perfiles.*aceptación/iu);
  }
});

test("el triage de Plataforma exige ID, fallo y señal actuales, sin heredar causas de otros anchos o intentos", () => {
  const c13 = { width: 390, status: "failed", actual: pendingHomeFailure, currentRoute: "/plataforma/organizaciones" };
  const c16 = { width: 390, status: "failed", actual: replayLocationFailure, currentRoute: "/plataforma/organizaciones" };
  const untouched = [
    { id: "PLAT-C-13", results: [{ ...c13, width: 1440 }, { ...c13, currentRoute: "/auth/callback" }, { ...c13, status: "blocked" }, { ...c13, actual: "Otro timeout" }] },
    { id: "PLAT-C-16", results: [{ ...c16, status: "passed" }, { ...c16, actual: "Otro fallo", previousAttempts: [c16] }, { ...c16, actual: replayLocationFailure.replace("/api/platform/tenants/", "/api/otra-ruta/") }] },
    { id: "PLAT-C-16 (otro)", results: [c16] }, { id: "PLAT-C-12", results: [c13] },
  ];
  for (const [index, entry] of enrichExecutionFailures(untouched).entries()) assert.equal(entry, untouched[index]);
  const [newWait] = enrichExecutionFailures([{ id: "PLAT-C-13", results: [{ ...c13, actual: "locator.waitFor: Timeout waiting for getByRole('region', { name: 'Para resolver', exact: true })" }] }]);
  assert.match(newWait.results[0].analysis, /PlatformHomeRoute/iu);
});
