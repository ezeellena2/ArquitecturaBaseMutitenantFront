import assert from "node:assert/strict";
import test from "node:test";
import { clearPlatformKeyFixtureRequest, ownKeyRequest, requireModuleProblem, requirePrivateUsage, runModuleDependency, withMissingAssistantKeyFixture, withRestoredPersonalSetting, wrongAccessProblemCode } from "./e2e-completo-modulos.mjs";

test("el permiso HTTP se evalúa antes del filtro de acceso sólo en las rutas que lo declaran", () => {
  for (const route of ["/api/organization/assistant", "/api/platform/assistant", "/api/platform/assistant/models", "/api/platform/assistant/settings", "/api/platform/assistant/usage", "/api/organization/whatsapp/customers/conversations", "/api/platform/whatsapp/conversations"]) assert.equal(wrongAccessProblemCode(route), "Http.Forbidden");
  for (const route of ["/api/me/assistant", "/api/me/whatsapp/conversations"]) assert.equal(wrongAccessProblemCode(route), "Tenancy.Access.Wrong");
  assert.throws(() => wrongAccessProblemCode("/api/otra"));
});

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

test("personalEnabled vuelve al valor leído aunque falle la comprobación", async () => {
  let enabled = true; const writes = [];
  const failure = new Error("La pantalla no abrió");
  await assert.rejects(withRestoredPersonalSetting(async () => ({ personalEnabled: enabled }), async (value) => { writes.push(value); enabled = value; }, async () => {
    enabled = false; throw failure;
  }), (error) => error === failure);
  assert.equal(enabled, true); assert.deepEqual(writes, [true]);
  const value = await withRestoredPersonalSetting(async () => ({ personalEnabled: enabled }), async (next) => { writes.push(next); enabled = next; }, async () => "comprobado");
  assert.equal(value, "comprobado"); assert.deepEqual(writes, [true]);
});

test("un fallo de restauración conserva también el fallo original", async () => {
  let enabled = false;
  const initial = new Error("Fallo del escenario"); const cleanup = new Error("Fallo de restauración");
  await assert.rejects(withRestoredPersonalSetting(async () => ({ personalEnabled: enabled }), async () => { throw cleanup; }, async () => {
    enabled = true; throw initial;
  }), (error) => error instanceof AggregateError && error.errors.includes(initial) && error.errors.includes(cleanup));
});

test("Uso exige Money y agrupación reales y rechaza contenido privado en cualquier nivel", () => {
  const data = () => ({ month: "2026-10", cost: { amount: 800, currency: "USD" }, totalQueries: 1, peopleCount: 1,
    rows: { items: [{ kind: "day", day: "2026-10-20", cost: { amount: 800, currency: "USD" }, queries: 1 }], totalCount: 1 } });
  requirePrivateUsage(data(), "day", ["consulta privada"]);
  for (const change of [
    (usage) => { usage.rows.items[0].conversationId = "privada"; },
    (usage) => { usage.extra = { apiKey: "secreta" }; },
    (usage) => { usage.rows.items[0].displayName = "consulta privada"; },
    (usage) => { usage.cost.amount = -1; },
    (usage) => { usage.rows.items[0].kind = "person"; },
    (usage) => { usage.rows.items = []; },
  ]) {
    const usage = data(); change(usage);
    assert.throws(() => requirePrivateUsage(usage, "day", ["consulta privada"]));
  }
});

test("la preparación sin clave conserva configuración y versión sin enviar una clave", () => {
  const settings = { defaultModelId: "modelo", allowedModelIds: ["modelo"], effort: "low", dailyMessageLimit: 50,
    monthlyOrganizationBudget: { amount: 1000, currency: "USD" }, personalEnabled: true, retentionDays: 30, version: 17,
    hasKey: true, maskedKeySuffix: "privado" };
  const request = clearPlatformKeyFixtureRequest(settings);
  assert.equal(request.keyAction, "clear"); assert.equal(request.apiKey, null); assert.equal(request.version, 17);
  assert.deepEqual(request.allowedModelIds, settings.allowedModelIds); assert.notEqual(request.allowedModelIds, settings.allowedModelIds);
  assert.equal(request.defaultModelId, settings.defaultModelId); assert.equal(request.personalEnabled, true);
  assert.equal(Object.hasOwn(request, "hasKey"), false); assert.equal(Object.hasOwn(request, "maskedKeySuffix"), false);
  assert.equal(JSON.stringify(request).includes("privado"), false);
});

test("la fixture de falta de clave restaura después de comprobar UI, incluso si la comprobación falla", async () => {
  const calls = []; const failure = new Error("La UI permitió enviar");
  await assert.rejects(withMissingAssistantKeyFixture(async () => { calls.push("prepare"); }, async () => { calls.push("restore"); }, async () => {
    calls.push("UI"); throw failure;
  }), (error) => error === failure);
  assert.deepEqual(calls, ["prepare", "UI", "restore"]);
});

test("una preparación rechazada no ejecuta la UI ni oculta el fallo de restauración", async () => {
  let actions = 0; const failure = new Error("Clear rechazado"); const cleanup = new Error("Prepare Fake falló");
  await assert.rejects(withMissingAssistantKeyFixture(async () => { throw failure; }, async () => { throw cleanup; }, async () => { actions++; }),
    (error) => error instanceof AggregateError && error.errors.includes(failure) && error.errors.includes(cleanup));
  assert.equal(actions, 0);
});
