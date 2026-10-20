import assert from "node:assert/strict";
import test from "node:test";
import { enrichOriginalExecutions } from "./e2e-completo-metadatos-base.mjs";

test("completa el contexto original sin mutar la ejecución ni sus resultados", () => {
  const result = Object.freeze({ width: 390, status: "failed", currentRoute: "/ruta-real-de-captura", actual: "Falló la acción original", image: "captura.png", attempts: Object.freeze([{ status: "blocked" }]) });
  const results = Object.freeze([result]);
  const source = Object.freeze({ guion: "guion-original", paso: 1, route: "—" });
  const execution = Object.freeze({ id: "BASE-E8B-50-1", actor: "Actor del recorrido de usuario", route: "Ver paso del recorrido", source, action: "Acción original", expected: "Esperado original", covers: Object.freeze(["BACK-AS-009"]), status: "failed", results });
  const input = Object.freeze([execution]);
  const before = structuredClone(input);
  const [actual] = enrichOriginalExecutions(input);
  assert.deepEqual(input, before);
  assert.notEqual(actual, execution);
  assert.notEqual(actual.actor, execution.actor);
  assert.ok(actual.route.startsWith("/"));
  assert.equal(actual.source.guion, source.guion);
  assert.match(actual.source.script, /^scripts\/.+\.mjs$/u);
  assert.equal(actual.source.step, "E8B-50-1");
  for (const field of ["results", "status", "action", "expected", "covers"]) assert.equal(actual[field], execution[field], field);
  assert.equal(actual.results[0], result);
  assert.equal(actual.results[0].currentRoute, "/ruta-real-de-captura");
});

test("el enriquecimiento es idempotente y no fusiona intentos ni ejecuciones", () => {
  const input = [{ id: "BASE-11", results: [{ width: 1440, status: "passed" }] }, { id: "BASE-E9-03", results: [{ width: 390, status: "blocked" }] }, { id: "BASE-11", results: [] }];
  const once = enrichOriginalExecutions(input);
  const twice = enrichOriginalExecutions(once);
  assert.deepEqual(twice, once);
  assert.equal(twice.length, input.length);
  for (const [index, item] of twice.entries()) assert.equal(item.results, input[index].results);
});

test("sólo reconoce IDs BASE exactos y deja intactas las nuevas ejecuciones", () => {
  const unknown = ["NUEVO-PER-01", "BASE-99", "BASE-E8-99", "BASE-E11-01-extra", "BASE-E9-00", "BASE-1", "01", "BASE-toString"].map((id) => Object.freeze({ id, actor: "Actor propio", route: "/ruta-propia", source: "fuente-propia", results: Object.freeze([]) }));
  const actual = enrichOriginalExecutions(Object.freeze(unknown));
  assert.deepEqual(actual, unknown);
  for (const [index, item] of actual.entries()) assert.equal(item, unknown[index]);
  assert.deepEqual(enrichOriginalExecutions([]), []);
});
