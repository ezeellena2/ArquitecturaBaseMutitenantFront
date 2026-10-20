import assert from "node:assert/strict";
import test from "node:test";
import { enrichBaselineIncidents } from "./e2e-completo-triage.mjs";
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
