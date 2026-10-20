import assert from "node:assert/strict";
import test from "node:test";
import { additionalCovers, additionalCoverageRows, applyAdditionalCoverage } from "./e2e-completo-cobertura.mjs";
import { guidedCases, screens } from "./e2e-completo-inventario-front.mjs";
import { backendUseCases } from "./e2e-completo-inventario-back.mjs";
import { businessDefinitions } from "./e2e-completo-negocio.mjs";
import { platformDefinitions } from "./e2e-completo-plataforma.mjs";
import { personalDefinitions } from "./e2e-completo-personal.mjs";
import { policyDefinitions } from "./e2e-completo-politicas.mjs";
import { moduleDefinitions } from "./e2e-completo-modulos.mjs";
import { buildMatrix } from "./e2e-completo-matriz.mjs";

const definitions = [...businessDefinitions, ...platformDefinitions, ...personalDefinitions, ...policyDefinitions, ...moduleDefinitions];
const knownExecutions = new Map(definitions.map((item) => [item.id, item]));
const knownMatrix = new Set([...guidedCases, ...backendUseCases].map((item) => item.id).concat(screens.map((item) => "SCREEN-" + item.id)));

test("cada enlace tiene ejecución y fila reales, con IDs únicos y evidencia concreta", () => {
  assert.equal(new Set(additionalCoverageRows.map((row) => row.executionId)).size, additionalCoverageRows.length);
  assert.equal(Object.keys(additionalCovers).length, additionalCoverageRows.length);
  for (const { executionId, matrixIds, source, evidence } of additionalCoverageRows) {
    assert.ok(knownExecutions.has(executionId), "Ejecución desconocida: " + executionId);
    assert.ok(matrixIds.length > 0); assert.equal(new Set(matrixIds).size, matrixIds.length);
    assert.match(source, /^scripts\/e2e-completo-.+\.mjs#.+/u);
    assert.ok(evidence.trim().length > 30);
    assert.deepEqual(additionalCovers[executionId], matrixIds);
    for (const id of matrixIds) assert.ok(knownMatrix.has(id), "Fila desconocida: " + id);
  }
});

test("los enlaces distinguen acciones completas de rutas y pasos parecidos", () => {
  assert.ok(additionalCovers["BIZ-03"].includes("GUIA-crear-un-rol-y-asignarlo-04"));
  assert.ok(additionalCovers["BIZ-12"].includes("GUIA-configuracion-y-dominio-02"));
  assert.ok(additionalCovers["BIZ-35"].includes("GUIA-sumar-una-empresa-02"));
  assert.ok(additionalCovers["POL-10"].includes("GUIA-registrar-empresa-05"));
  const all = Object.values(additionalCovers).flat();
  assert.equal(all.includes("GUIA-configuracion-y-dominio-03"), false, "Leer un TXT no verifica DNS.");
  assert.equal(all.includes("GUIA-registrar-empresa-04"), false, "Estos registros no cargan el CUIT de la primera empresa.");
  assert.equal(all.includes("GUIA-sumar-una-empresa-04"), false, "BIZ-09 elige persona; no elige sus roles.");
  assert.equal(additionalCovers["BIZ-09"], undefined, "La variante del Administrador de empresa no certifica los pasos de la Dueña.");
  assert.ok(additionalCovers["BIZ-27"].includes("SCREEN-empresa"));
  assert.equal(all.includes("GUIA-publicar-una-version-legal-01"), false, "Esperar el enlace Publicar no lo activa.");
  assert.equal(all.some((id) => id.startsWith("GUIA-ingresar-con-google-")), false);
  assert.equal(additionalCovers["MOD-14"], undefined, "La pantalla 404 no acredita un chat funcional.");
  assert.equal(additionalCovers["MOD-32"], undefined, "El 403 de todas las áreas no acredita sus pantallas funcionales.");
});

function linked(execution) {
  return applyAdditionalCoverage([execution])[0];
}

test("el helper combina enlaces sin mutar definiciones, resultados ni estados", () => {
  const results = Object.freeze([Object.freeze({ width: 1440, status: "failed", actual: "Fallo real" })]);
  const covers = Object.freeze(["BACK-ORIGINAL", "GUIA-configuracion-y-dominio-01"]);
  const input = Object.freeze([
    Object.freeze({ id: "BIZ-12", covers, results }),
    Object.freeze({ id: "SIN-MAPA", results: Object.freeze([]) }),
  ]);
  const actual = applyAdditionalCoverage(input);
  assert.notEqual(actual, input);
  assert.notEqual(actual[0], input[0]);
  assert.deepEqual(actual[0].covers, ["BACK-ORIGINAL", "GUIA-configuracion-y-dominio-01", "GUIA-configuracion-y-dominio-02", "SCREEN-configuracion"]);
  assert.equal(actual[0].results, results);
  assert.deepEqual(input[0].covers, covers);
  assert.deepEqual(actual[1], input[1]);
  assert.deepEqual(applyAdditionalCoverage(actual), actual, "Aplicarlo dos veces no duplica enlaces.");
  assert.deepEqual(applyAdditionalCoverage([]), []);
});

test("un vínculo sin resultados deja ambos anchos bloqueados y no modifica su definición", () => {
  const target = guidedCases.find((item) => item.id === "GUIA-configuracion-y-dominio-01");
  const execution = { ...knownExecutions.get("BIZ-12"), results: [] };
  const original = JSON.stringify(execution);
  const matrix = buildMatrix({ guided: [target], executions: [linked(execution)] });
  assert.deepEqual(matrix[0].results.map((item) => item.status), ["blocked", "blocked"]);
  assert.equal(JSON.stringify(execution), original);
});

test("cada ancho conserva su resultado: uno aprobado no sustituye al ausente o fallido", () => {
  const target = guidedCases.find((item) => item.id === "GUIA-configuracion-y-dominio-01");
  const execution = { ...knownExecutions.get("BIZ-12"), results: [{ width: 1440, status: "passed", actual: "acción verificada" }] };
  let row = buildMatrix({ guided: [target], executions: [linked(execution)] })[0];
  assert.deepEqual(row.results.map((item) => item.status), ["passed", "blocked"]);
  execution.results.push({ width: 390, status: "failed", actual: "falló el dominio" });
  row = buildMatrix({ guided: [target], executions: [linked(execution)] })[0];
  assert.deepEqual(row.results.map((item) => item.status), ["passed", "failed"]);
  execution.results[1] = { width: 390, status: "passed", actual: "acción verificada en teléfono" };
  row = buildMatrix({ guided: [target], executions: [linked(execution)] })[0];
  assert.equal(row.results.every((item) => item.status === "passed"), true);
});
