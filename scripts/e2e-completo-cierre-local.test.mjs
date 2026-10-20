import assert from "node:assert/strict";
import test from "node:test";
import { requireGoogleChallenge, requireOwnerPreserved, localClosureDefinitions } from "./e2e-completo-cierre-local.mjs";

test("el desafío Google exige HTTPS y host exacto, sin acreditar posesión ni vinculación", () => {
  assert.equal(requireGoogleChallenge({ redirectUrl: "https://accounts.google.com/o/oauth2/v2/auth?state=privado" }, "accounts.google.com"), true);
  for (const redirectUrl of ["http://accounts.google.com/auth", "https://accounts.google.com.evil.test/auth", "/auth", "https://otro.test/"]) assert.throws(() => requireGoogleChallenge({ redirectUrl }, "accounts.google.com"));
  assert.throws(() => requireGoogleChallenge({ redirectUrl: "https://accounts.google.com/auth" }, "otro.test"));
});

test("LastTenantAdmin conserva exactamente membresía, roles y versión del único Dueño", () => {
  const before = { memberId: "m", userId: "u", state: "Active", roles: [{ id: "owner", name: "Dueño" }], companies: [], version: 4 };
  const problem = { code: "Tenancy.Member.LastTenantAdmin", traceId: "t" };
  requireOwnerPreserved(before, structuredClone(before), problem);
  for (const after of [{ ...before, version: 5 }, { ...before, roles: [] }, { ...before, state: "Inactive" }]) assert.throws(() => requireOwnerPreserved(before, after, problem));
  assert.throws(() => requireOwnerPreserved(before, before, { ...problem, code: "Tenancy.Member.CannotDisableSelf" }));
  assert.throws(() => requireOwnerPreserved(before, before, { ...problem, traceId: "" }));
});

test("cada cierre local declara sólo la acción completa que ejecuta", () => {
  assert.deepEqual(localClosureDefinitions.map((entry) => entry.id), ["CIERRE-01", "CIERRE-02", "CIERRE-03"]);
  assert.deepEqual(localClosureDefinitions[0].covers, ["BACK-CU-011"]);
  assert.deepEqual(localClosureDefinitions[1].covers, ["BACK-OR-017"]);
  assert.ok(localClosureDefinitions[2].covers.includes("GUIA-sumar-una-empresa-04"));
});
