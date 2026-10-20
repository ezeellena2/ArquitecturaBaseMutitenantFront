import assert from "node:assert/strict";
import test from "node:test";
import { ownKeyRequest, requireModuleProblem, runModuleDependency } from "./e2e-completo-modulos.mjs";

test("una preparación fallida bloquea la acción dependiente sin ejecutarla", async () => {
  let actions = 0; const blocked = [];
  const h = { block: async (id, reason) => blocked.push({ id, reason }), record: async () => { actions++; return { ok: true }; } };
  const outcomes = new Map([["MOD-01", { ok: false }]]);
  const result = await runModuleDependency(h, outcomes, "MOD-02", ["MOD-01"], () => null, async () => { actions++; });
  assert.equal(result.ok, false); assert.equal(actions, 0); assert.equal(blocked.length, 1);
  assert.match(blocked[0].reason, /MOD-01/);
});

test("un recurso ajeno sólo se considera oculto si el 404 trae el código esperado y traceId", async () => {
  const response = (status, body) => ({ status: () => status, json: async () => body });
  const good = { code: "Assistant.Attachment.NotFound", traceId: "sintetico" };
  await requireModuleProblem(response(404, good), 404, [good.code]);
  await assert.rejects(requireModuleProblem(response(403, good), 404, [good.code]));
  await assert.rejects(requireModuleProblem(response(404, { ...good, code: "Http.NotFound" }), 404, [good.code]));
  await assert.rejects(requireModuleProblem(response(404, { code: good.code }), 404, [good.code]));
});

test("el intento OwnKey conserva contrato y versión sin fabricar una clave del proveedor", () => {
  const request = ownKeyRequest({ modelId: "modelo-sintetico", effort: "Low", dailyMessageLimit: 50, monthlyBudget: null, version: 0, allowOwnKey: false, maskedKeySuffix: "no-copiar" });
  assert.equal(request.mode, "OwnKey"); assert.equal(request.keyAction, "keep"); assert.equal(request.apiKey, null); assert.equal(request.version, 0);
  assert.equal(Object.hasOwn(request, "allowOwnKey"), false); assert.equal(Object.hasOwn(request, "maskedKeySuffix"), false);
});
