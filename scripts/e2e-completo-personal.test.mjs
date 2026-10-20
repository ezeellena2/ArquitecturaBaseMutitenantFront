import assert from "node:assert/strict";
import test from "node:test";
import { assertProblemResponse, assertViewport, openExistingPersonalAccount, solePersonalMethod, withOffline } from "./e2e-completo-personal.mjs";

test("la prueba del último método no acepta una fixture vacía, adicional, pendiente o administrada", () => {
  const method = { id: "method", isVerified: true, canRemove: false, managedByTenantId: null };
  assert.equal(solePersonalMethod([method]), method);
  for (const methods of [[], [method, method], [{ ...method, isVerified: false }], [{ ...method, managedByTenantId: "org" }], [{ ...method, canRemove: true }]]) assert.throws(() => solePersonalMethod(methods));
});

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
  await assertProblemResponse(response(403, { code: "Http.Forbidden", traceId: "sintetico" }), 403, "Http.Forbidden");
  await assert.rejects(assertProblemResponse(response(200, { code: "Http.Forbidden", traceId: "sintetico" }), 403, "Http.Forbidden"));
  await assert.rejects(assertProblemResponse(response(403, { code: "Tenancy.Access.Wrong", traceId: "sintetico" }), 403, "Http.Forbidden"));
  await assert.rejects(assertProblemResponse(response(403, { code: "Http.Forbidden" }), 403, "Http.Forbidden"));
});

test("la segunda pestaña abre la cuenta de la sesión existente sin pedir otro ingreso ni OTP", async () => {
  const calls = [];
  const account = { id: "persona-propia", access: "consumer", version: 7 };
  const page = {
    goto: async (url) => calls.push(["goto", url]),
    getByRole: (role, options) => ({ waitFor: async () => calls.push([role, options.name]) }),
  };
  const h = {
    base: new URL("https://localtest.me:7433"),
    api: async (target, route) => { assert.equal(target, page); calls.push(["api", route]); return { status: () => 200, json: async () => account }; },
    login: async () => assert.fail("La cookie vigente evita un login nuevo."),
  };
  assert.equal(await openExistingPersonalAccount(h, page, account.id), account);
  assert.deepEqual(calls, [["goto", "https://localtest.me:7433/cuenta"], ["heading", "Mi cuenta"], ["api", "/api/me"]]);
  await assert.rejects(openExistingPersonalAccount(h, page, "otra-persona"));
  account.access = "business";
  await assert.rejects(openExistingPersonalAccount(h, page, account.id));
});

test("el control del ancho tolera el redondeo de un píxel y denuncia el desborde real", async () => {
  await assertViewport({ evaluate: async () => ({ width: 390, document: 391, body: 390 }) });
  await assert.rejects(assertViewport({ evaluate: async () => ({ width: 390, document: 412, body: 390 }) }), /desborde/);
});
