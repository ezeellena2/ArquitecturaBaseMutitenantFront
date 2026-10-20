import assert from "node:assert/strict";
import test from "node:test";
import { buildMatrix } from "./e2e-completo-matriz.mjs";
import { legalSupplementDefinitions, legalSupplementProofGroups, previousCivilDate, assertLegalPublicationRequest, assertStaleLegalRequest, requirePastLegalPublication } from "./e2e-completo-legales-complemento.mjs";

test("PL028 requiere ambos records y conserva cualquier fallo real o ancho faltante", () => {
  assert.deepEqual(legalSupplementDefinitions.map((entry) => entry.id), ["LEG-01", "LEG-02"]);
  assert.deepEqual(legalSupplementProofGroups, { "BACK-PL-028": [["LEG-01", "LEG-02"]] });
  assert.deepEqual(legalSupplementDefinitions.flatMap((entry) => entry.covers), ["BACK-CU-018"]);
  const executions = legalSupplementDefinitions.map((entry) => ({ ...entry, results: [1440, 390].map((width) => ({ width, status: "passed" })) }));
  const matrix = (rows) => buildMatrix({ backend: [{ id: "BACK-PL-028" }], executions: rows, additionalProofGroups: legalSupplementProofGroups })[0];
  assert.ok(matrix(executions).results.every((result) => result.status === "passed"));
  for (const index of [0, 1]) {
    assert.ok(matrix(executions.filter((_, position) => position !== index)).results.every((result) => result.status === "blocked"));
    const failed = structuredClone(executions); failed[index].results[1].status = "failed";
    assert.equal(matrix(failed).results.find((result) => result.width === 390).status, "failed");
  }
});

test("ayer se calcula desde la fecha civil de Buenos Aires, incluidos mes, año y bisiesto", () => {
  assert.equal(previousCivilDate("2026-10-20"), "2026-10-19");
  assert.equal(previousCivilDate("2026-01-01"), "2025-12-31");
  assert.equal(previousCivilDate("2024-03-01"), "2024-02-29");
  assert.throws(() => previousCivilDate("2026-02-30"));
  assert.throws(() => previousCivilDate("2026-10-20T00:00:00Z"));
});

test("publicar exige DateOnly y los contenidos exactos en ambas culturas, sin campos inventados", () => {
  const contents = [{ culture: "es-AR", text: "Términos sintéticos" }, { culture: "en-US", text: "Synthetic terms" }];
  const body = { kind: "Terms", effectiveOn: "2026-10-20", contents };
  assertLegalPublicationRequest(body, "2026-10-20", contents);
  for (const changed of [{ ...body, effectiveOn: "2026-10-20T03:00:00Z" }, { ...body, contents: contents.slice(0, 1) }, { ...body, contents: [contents[0], { ...contents[1], text: "Otro texto" }] }, { ...body, effectiveAtUtc: "inventado" }]) assert.throws(() => assertLegalPublicationRequest(changed, "2026-10-20", contents));
});

test("la carrera debe enviar la versión vieja real, nunca la nueva ya refrescada", () => {
  const first = { id: "v1", version: 7 }; const second = { id: "v2", version: 8 };
  assertStaleLegalRequest({ documents: [first] }, first, second);
  assert.throws(() => assertStaleLegalRequest({ documents: [second] }, first, second));
  assert.throws(() => assertStaleLegalRequest({ documents: [{ ...first, version: 8 }] }, first, second));
  assert.throws(() => assertStaleLegalRequest({ documents: [first, second] }, first, second));
});

test("la fecha pasada exige su 400 y error de campo, sin aceptar otro fallo de validación", async () => {
  const response = (status, code, errors) => ({ status: () => status, json: async () => ({ code, traceId: "traza", errors }) });
  await requirePastLegalPublication(response(400, "Legal.Publication.EffectiveDatePast", { effectiveOn: ["Fecha pasada"] }));
  for (const reply of [response(409, "Legal.Publication.EffectiveDatePast", { effectiveOn: ["Fecha pasada"] }), response(400, "Validation.Failed", { effectiveOn: ["Fecha pasada"] }), response(400, "Legal.Publication.EffectiveDatePast", { contents: ["Otro campo"] })]) await assert.rejects(requirePastLegalPublication(reply));
});
