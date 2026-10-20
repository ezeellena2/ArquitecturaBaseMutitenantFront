import assert from "node:assert/strict";
import test from "node:test";
import { domainSupplementDefinitions, domainSupplementLimitations, requirePreparedDomain, requirePreservedDomainBinding, requireManagedLoginRejection } from "./e2e-completo-dominio-complemento.mjs";

test("tres registros sólo acreditan retiro y disponibilidad, nunca verificación TXT", () => {
  assert.equal(domainSupplementDefinitions.length, 3);
  assert.equal(new Set(domainSupplementDefinitions.map((item) => item.id)).size, 3);
  assert.deepEqual(domainSupplementDefinitions.flatMap((item) => item.covers).sort(), ["BACK-CF-006", "BACK-CU-016"]);
  assert.match(domainSupplementLimitations["BACK-CF-005"].reason, /DNS real/u);
  assert.match(domainSupplementLimitations["BACK-CF-005"].reason, /Verified.*no acredita/u);
});

test("el preparador exige el dominio verificado y el método administrado de su organización exacta", () => {
  const domain = { id: "d", domain: "corp.example.test", status: "Verified", version: 3 };
  const managed = { id: "m", type: "Email", value: "e2e-managed@corp.example.test", isVerified: true, managedByTenantId: "org", managedByOrganizationName: "Organización" };
  assert.deepEqual(requirePreparedDomain([domain], { methods: [managed] }, "org"), { domain, managed });
  for (const status of ["Pending", "Removed"]) assert.throws(() => requirePreparedDomain([{ ...domain, status }], { methods: [managed] }, "org"));
  assert.throws(() => requirePreparedDomain([domain], { methods: [{ ...managed, managedByTenantId: "ajena" }] }, "org"));
  assert.throws(() => requirePreparedDomain([], { methods: [managed] }, "org"));
});

test("el retiro conserva la misma vinculación y deja un correo nuevo como propio", () => {
  const prior = { id: "m", type: "Email", value: "e2e-managed@corp.example.test", isVerified: true, managedByTenantId: "org", managedByOrganizationName: "Organización" };
  const own = { id: "nuevo", type: "Email", value: "nuevo@corp.example.test", isVerified: true, managedByTenantId: null };
  requirePreservedDomainBinding(prior, { methods: [prior, own] }, own.value);
  assert.throws(() => requirePreservedDomainBinding(prior, { methods: [{ ...prior, managedByTenantId: null }, own] }, own.value));
  assert.throws(() => requirePreservedDomainBinding(prior, { methods: [prior, { ...own, managedByTenantId: "org" }] }, own.value));
  assert.throws(() => requirePreservedDomainBinding(prior, { methods: [prior, { ...own, isVerified: false }] }, own.value));
});

test("la disponibilidad se revalida al verificar el código válido anterior", async () => {
  const response = (status, code) => ({ status: () => status, json: async () => ({ code, traceId: "traza" }) });
  await requireManagedLoginRejection(response(400, "Auth.LoginCode.Invalid"));
  await assert.rejects(() => requireManagedLoginRejection(response(400, "Auth.LoginCode.AccountNotFound")));
  await assert.rejects(() => requireManagedLoginRejection(response(200, "Auth.LoginCode.Invalid")));
});
