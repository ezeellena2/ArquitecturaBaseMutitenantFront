import assert from "node:assert/strict";
import test from "node:test";
import { assertProblemResponse, assertViewport, withOffline } from "./e2e-completo-personal.mjs";

test("la desconexión se restaura aunque falle el paso o su captura", async () => {
  const transitions = [];
  const context = { setOffline: async (offline) => transitions.push(offline) };
  await assert.rejects(withOffline(context, async () => { throw new Error("falló el paso"); }), /falló el paso/);
  assert.deepEqual(transitions, [true, false]);
});

test("el modo sin red se conserva hasta terminar el registro del paso", async () => {
  const transitions = [];
  const context = { setOffline: async (offline) => transitions.push(offline) };
  assert.equal(await withOffline(context, async () => {
    assert.deepEqual(transitions, [true]);
    return "captura terminada";
  }), "captura terminada");
  assert.deepEqual(transitions, [true, false]);
});

test("un rechazo sólo cuenta con status, código y traceId del contrato", async () => {
  const response = (status, body) => ({ status: () => status, json: async () => body });
  await assertProblemResponse(response(403, { code: "Tenancy.Access.Wrong", traceId: "sintetico" }), 403, "Tenancy.Access.Wrong");
  await assert.rejects(assertProblemResponse(response(200, { code: "Tenancy.Access.Wrong", traceId: "sintetico" }), 403, "Tenancy.Access.Wrong"));
  await assert.rejects(assertProblemResponse(response(403, { code: "General.Unexpected", traceId: "sintetico" }), 403, "Tenancy.Access.Wrong"));
  await assert.rejects(assertProblemResponse(response(403, { code: "Tenancy.Access.Wrong" }), 403, "Tenancy.Access.Wrong"));
});

test("el control del ancho tolera el redondeo de un píxel y denuncia el desborde real", async () => {
  await assertViewport({ evaluate: async () => ({ width: 390, document: 391, body: 390 }) });
  await assert.rejects(assertViewport({ evaluate: async () => ({ width: 390, document: 412, body: 390 }) }), /desborde/);
});
