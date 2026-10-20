import assert from "node:assert/strict";
import test from "node:test";
import { contractSupplementDefinitions, assertLegacyDoorCookies, requireSharedQuotaResponse, assertNoAutomaticRoleRetry, withRestoredTenantQuota } from "./e2e-completo-contrato-complemento.mjs";

test("sólo los dos records completos enlazan sesión histórica y cuota compartida", () => {
  assert.deepEqual(contractSupplementDefinitions.map((entry) => entry.id), ["CON-01", "CON-02"]);
  assert.deepEqual(contractSupplementDefinitions.flatMap((entry) => entry.covers), ["BACK-ID-029", "BACK-HT-003"]);
});

test("la puerta retira sólo el legado público y conserva la cookie separada de Plataforma", () => {
  const publicCookie = { name: ".AspNetCore.Identity.Application" }; const platformCookie = { name: ".AspNetCore.Identity.Platform" };
  assertLegacyDoorCookies([publicCookie, platformCookie], [platformCookie]);
  assert.throws(() => assertLegacyDoorCookies([platformCookie], [platformCookie]));
  assert.throws(() => assertLegacyDoorCookies([publicCookie], [platformCookie]));
  assert.throws(() => assertLegacyDoorCookies([publicCookie, platformCookie], [publicCookie, platformCookie]));
  assert.throws(() => assertLegacyDoorCookies([publicCookie, platformCookie], []));
});

test("la cuota exige su código real y Retry-After igual a la espera positiva del problema", async () => {
  const response = (status, problem, retry = problem.retryAfter) => ({ status: () => status, json: async () => problem, headers: () => ({ "retry-after": String(retry) }) });
  const problem = { code: "Security.RateLimit.Exceeded", retryAfter: 25, traceId: "real-trace" };
  assert.deepEqual(await requireSharedQuotaResponse(response(429, problem)), problem);
  for (const reply of [response(400, problem), response(429, { ...problem, code: "Identity.Account.LockedOut" }), response(429, { ...problem, retryAfter: 0 }), response(429, problem, 26)]) await assert.rejects(requireSharedQuotaResponse(reply));
});

test("no admite ninguna escritura automática durante ni después de la cuenta regresiva", () => {
  assertNoAutomaticRoleRetry(3, [{}, {}, {}]);
  assert.throws(() => assertNoAutomaticRoleRetry(3, [{}, {}, {}, {}]));
});

test("la cuota se restaura aunque la preparación haya escrito y falle o falle la comprobación", async () => {
  for (const stage of ["prepare", "body"]) {
    const events = []; const failure = new Error(stage); const baseline = { permitLimit: 150, windowSeconds: 60 };
    await assert.rejects(withRestoredTenantQuota({ read: async () => baseline, prepare: async () => { events.push("preparar UI"); if (stage === "prepare") throw failure; }, body: async () => { events.push("comprobar"); throw failure; }, restore: async (original) => { assert.equal(original, baseline); events.push("restaurar UI"); } }), (error) => error === failure);
    assert.deepEqual(events, stage === "prepare" ? ["preparar UI", "restaurar UI"] : ["preparar UI", "comprobar", "restaurar UI"]);
  }
  const first = new Error("comprobación"); const second = new Error("restauración");
  await assert.rejects(withRestoredTenantQuota({ read: async () => ({}), prepare: async () => {}, body: async () => { throw first; }, restore: async () => { throw second; } }), (error) => error instanceof AggregateError && error.errors[0] === first && error.errors[1] === second);
});
