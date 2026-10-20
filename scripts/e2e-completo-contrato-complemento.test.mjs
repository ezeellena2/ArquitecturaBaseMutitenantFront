import assert from "node:assert/strict";
import test from "node:test";
import { buildMatrix } from "./e2e-completo-matriz.mjs";
import { contractSupplementDefinitions, contractSupplementProofGroups, assertLegacyDoorCookies, requireSharedQuotaResponse, assertNoAutomaticRoleRetry, withRestoredTenantQuota, assertSameIdempotentAttempt, requireSuccessfulRoleReplay, assertSingleRoleEffects, assertAbandonedSettings } from "./e2e-completo-contrato-complemento.mjs";

test("cada record enlaza sólo su conducta completa y HTTP offline requiere todos los pasos por ancho", () => {
  assert.deepEqual(contractSupplementDefinitions.map((entry) => entry.id), ["CON-01", "CON-02", "CON-03", "CON-04"]);
  assert.deepEqual(contractSupplementDefinitions.flatMap((entry) => entry.covers), ["BACK-ID-029", "BACK-HT-003", "BACK-HT-002"]);
  assert.deepEqual(contractSupplementProofGroups, { "BACK-HT-004": [["NUEVO-PER-15", "NUEVO-PER-16", "CON-04"]] });
  const executions = contractSupplementProofGroups["BACK-HT-004"][0].map((id) => ({ id, results: [1440, 390].map((width) => ({ width, status: "passed" })) }));
  const matrix = (rows) => buildMatrix({ backend: [{ id: "BACK-HT-004" }], executions: rows, additionalProofGroups: contractSupplementProofGroups })[0];
  assert.ok(matrix(executions).results.every((result) => result.status === "passed"));
  for (let index = 0; index < executions.length; index++) {
    assert.ok(matrix(executions.filter((_, position) => position !== index)).results.every((result) => result.status === "blocked"));
    const failed = structuredClone(executions); failed[index].results[1].status = "failed";
    assert.equal(matrix(failed).results.find((result) => result.width === 390).status, "failed");
  }
});

test("el reintento mantiene la clave y los bytes originales del cuerpo perdido", () => {
  const original = { key: "60c031f6-c011-43d7-abd3-65a84daebded", body: '{"name":"Consulta","permissions":["roles.read"]}' };
  assertSameIdempotentAttempt(original, { ...original });
  assert.throws(() => assertSameIdempotentAttempt(original, { ...original, key: "otra" }));
  assert.throws(() => assertSameIdempotentAttempt(original, { ...original, body: original.body.replace("Consulta", "Otra") }));
  assert.throws(() => assertSameIdempotentAttempt(original, { ...original, body: " " + original.body }));
});

test("replay exitoso exige201, cuerpo idéntico y encabezado real de replay", async () => {
  const id = "60c031f6-c011-43d7-abd3-65a84daebded"; const body = JSON.stringify(id);
  const original = { status: 201, body };
  const response = (status, value, header = "true") => ({ status: () => status, text: async () => value, headers: () => ({ "idempotent-replayed": header }) });
  assert.equal(await requireSuccessfulRoleReplay(original, response(201, body)), id);
  for (const reply of [response(200, body), response(409, body), response(201, body, null), response(201, JSON.stringify("otro recurso"))]) await assert.rejects(requireSuccessfulRoleReplay(original, reply));
});

test("un recurso y su evento de creación se mantienen idénticos después de replays y rechazo422", () => {
  const snapshot = { role: { id: "propio", name: "Rol propio", version: 1 }, roles: { totalCount: 1, items: [{ id: "propio", name: "Rol propio" }] }, audit: { hasMore: false, items: [{ id: "evento", entityType: "Role", action: "Created", affectedDisplayName: "Rol propio" }] } };
  assertSingleRoleEffects(snapshot, structuredClone(snapshot), "propio", "Rol propio");
  for (const change of [
    (copy) => { copy.roles.items.push({ id: "duplicado", name: "Rol propio" }); copy.roles.totalCount++; },
    (copy) => { copy.audit.items.push({ ...copy.audit.items[0], id: "evento2" }); },
    (copy) => { copy.role.version++; },
  ]) { const changed = structuredClone(snapshot); change(changed); assert.throws(() => assertSingleRoleEffects(snapshot, changed, "propio", "Rol propio")); }
  assert.throws(() => assertSingleRoleEffects({ ...snapshot, audit: { hasMore: false, items: [] } }, snapshot, "propio", "Rol propio"));
});

test("una respuesta abandonada no cambia ruta ni borrador ni anuncia éxito o reenvía", () => {
  const expected = { route: "/org/configuracion", draft: "Borrador posterior", writes: 3 };
  const actual = { ...expected, successes: 0 };
  assertAbandonedSettings(actual, expected);
  for (const change of [{ route: "/org" }, { draft: "Operación anterior" }, { successes: 1 }, { writes: 4 }]) assert.throws(() => assertAbandonedSettings({ ...actual, ...change }, expected));
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
