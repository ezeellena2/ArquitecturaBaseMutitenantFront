import assert from "node:assert/strict";
import { test } from "node:test";
import { policyDefinitions, requireClosedSignup, requireOrganizationLimit, requireSlugAvailability } from "./e2e-completo-politicas.mjs";
import { backendUseCases } from "./e2e-completo-inventario-back.mjs";
import { guidedCases, screens } from "./e2e-completo-inventario-front.mjs";

const response = (status, body) => ({ status: () => status, json: async () => body });

test("el cierre de cada registro exige su propio 403 y ProblemDetails", async () => {
  await requireClosedSignup(response(403, { code: "Auth.Signup.Closed", traceId: "trace" }), "consumer");
  await requireClosedSignup(response(403, { code: "Auth.BusinessSignup.Closed", traceId: "trace" }), "business");
  for (const body of [{ code: "Http.Forbidden", traceId: "trace" }, { code: "Auth.BusinessSignup.Closed", traceId: "trace" }, { code: "Auth.Signup.Closed" }]) await assert.rejects(requireClosedSignup(response(403, body), "consumer"));
  await assert.rejects(requireClosedSignup(response(200, { code: "Auth.Signup.Closed", traceId: "trace" }), "consumer"));
});

test("el límite de una organización no se acredita con cualquier 409 ni sin el límite devuelto", async () => {
  await requireOrganizationLimit(response(409, { code: "Tenancy.Organization.LimitReached", traceId: "trace", limit: 1 }), 1);
  for (const body of [{ code: "General.ConcurrencyConflict", traceId: "trace", limit: 1 }, { code: "Tenancy.Organization.LimitReached", traceId: "trace", limit: 2 }, { code: "Tenancy.Organization.LimitReached", traceId: "trace" }]) await assert.rejects(requireOrganizationLimit(response(409, body), 1));
});

test("la disponibilidad tiene que corresponder al slug y estado que la UI acaba de consultar", async () => {
  await requireSlugAvailability(response(200, { slug: "admin", availability: "Reserved" }), "admin", "Reserved");
  await assert.rejects(requireSlugAvailability(response(200, { slug: "otro", availability: "Reserved" }), "admin", "Reserved"));
  await assert.rejects(requireSlugAvailability(response(200, { slug: "admin", availability: "Available" }), "admin", "Reserved"));
  await assert.rejects(requireSlugAvailability(response(403, { slug: "admin", availability: "Reserved" }), "admin", "Reserved"));
});

test("las políticas enlazan acciones concretas de la matriz y conservan un caso de restauración", () => {
  const known = new Set([...backendUseCases, ...guidedCases, ...screens.map((screen) => ({ id: `SCREEN-${screen.id}` }))].map((entry) => entry.id));
  assert.equal(new Set(policyDefinitions.map((entry) => entry.id)).size, policyDefinitions.length);
  for (const item of policyDefinitions) for (const id of item.covers) assert.ok(known.has(id), `ID desconocido: ${id}`);
  for (const id of ["BACK-ID-005", "BACK-OR-003", "BACK-OR-004", "BACK-OR-005", "BACK-OR-006"]) assert.ok(policyDefinitions.some((entry) => entry.covers.includes(id)), id);
  assert.ok(policyDefinitions.find((item) => item.id === "POL-12").action.includes("Restaurar"));
});
