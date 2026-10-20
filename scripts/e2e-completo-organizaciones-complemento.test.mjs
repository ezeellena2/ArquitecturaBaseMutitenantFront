import assert from "node:assert/strict";
import test from "node:test";
import { organizationSupplementDefinitions, organizationSupplementProofGroups, requireExpiredMemberOnce, requireUrgentPageFirst, requirePreservedPersonal, requireUnavailableInvitation, requireStateHistory, requireRevokedBusiness } from "./e2e-completo-organizaciones-complemento.mjs";

test("cuatro registros y las ramas agrupadas exigen todas sus pruebas exactas", () => {
  assert.equal(organizationSupplementDefinitions.length, 4); assert.equal(new Set(organizationSupplementDefinitions.map((row) => row.id)).size, 4);
  assert.deepEqual(organizationSupplementDefinitions.flatMap((row) => row.covers).sort(), ["BACK-EM-007", "BACK-IN-006", "BACK-OR-021", "BACK-PL-013"]);
  assert.deepEqual(organizationSupplementProofGroups, { "BACK-OR-012": [["BIZ-20", "ORX-01"]], "BACK-IN-003": [["AS-SUP-01", "ORX-02"]], "BACK-PL-009": [["PLAT-27", "PLAT-28", "PLAT-29", "ORX-04"]] });
  assert.equal(organizationSupplementDefinitions[3].covers.includes("BACK-PL-009"), false);
});

test("un invitado vencido se cuenta una sola vez incluso en el facet de invitados", () => {
  const member = { memberId: "nuevo", invitationId: "invitacion", state: "Invited", membershipStatus: "Active", invitationExpiresAtUtc: "2026-10-19T00:00:00Z" };
  requireExpiredMemberOnce({ all: 1, active: 0, invited: 1 }, { totalCount: 1, items: [member] }, member.memberId, Date.parse("2026-10-20T00:00:00Z"));
  for (const counts of [{ all: 2, active: 0, invited: 1 }, { all: 1, active: 1, invited: 1 }, { all: 1, active: 0, invited: 2 }]) assert.throws(() => requireExpiredMemberOnce(counts, { totalCount: 1, items: [member] }, member.memberId));
  assert.throws(() => requireExpiredMemberOnce({ all: 1, active: 0, invited: 1 }, { totalCount: 1, items: [member, member] }, member.memberId));
});

test("el pendiente de página moderada debe anteceder a un pendiente anterior no urgente", () => {
  const page = { area: "publicPage", kind: "publicPageBlocked", items: [{ urgent: true, sinceUtc: "2026-10-20T00:00:00Z" }] };
  const domain = { area: "settings", kind: "domainUnverified", items: [{ urgent: false, sinceUtc: "2026-10-19T00:00:00Z" }] };
  requireUrgentPageFirst({ pendingGroups: [page, domain] });
  assert.throws(() => requireUrgentPageFirst({ pendingGroups: [domain, page] }));
  assert.throws(() => requireUrgentPageFirst({ pendingGroups: [page] }));
  assert.throws(() => requireUrgentPageFirst({ pendingGroups: [{ ...page, items: [{ urgent: false }] }, domain] }));
});

test("Personal conservado debe ser la misma identidad y el mismo acceso Personal previo", () => {
  const before = { id: "misma", access: "consumer", activeTenantId: "personal", hasPersonalSpace: true };
  requirePreservedPersonal(before, { ...before, organizations: [{ status: "Suspended" }] }, "misma");
  for (const changed of [{ id: "otra" }, { access: "business" }, { activeTenantId: "empresa" }, { hasPersonalSpace: false }]) assert.throws(() => requirePreservedPersonal(before, { ...before, ...changed }, "misma"));
  assert.throws(() => requirePreservedPersonal(before, before, "otro-miembro"));
});

test("las invitaciones no disponibles conservan membresía invitada y no conceden identidad activa", () => {
  const member = { memberId: "nuevo", state: "Invited", userId: null };
  for (const state of ["Expired", "OrganizationSuspended"]) requireUnavailableInvitation({ state }, { ...member, state: state === "Expired" ? "Expired" : "Invited" });
  assert.throws(() => requireUnavailableInvitation({ state: "Expired" }, member));
  for (const changed of [{ state: "Active" }, { userId: "activado" }]) assert.throws(() => requireUnavailableInvitation({ state: "Expired" }, { ...member, ...changed }));
  assert.throws(() => requireUnavailableInvitation({ state: "Ready" }, member));
});

test("ficha e historial deben conservar una sola transición con el mismo motivo, fecha UTC y acción real", () => {
  const change = { reason: "Cierre propio", atUtc: "2026-10-20T03:40:50Z", action: "Organización cerrada" };
  const row = { reason: change.reason, occurredAtUtc: change.atUtc, action: change.action, actor: "Operador", actorRole: "Plataforma" };
  requireStateHistory([change], { items: [row] });
  assert.throws(() => requireStateHistory([change], { items: [] })); assert.throws(() => requireStateHistory([change], { items: [row, row] }));
  for (const wrong of [{ occurredAtUtc: "2026-10-19T03:40:50Z" }, { occurredAtUtc: "2026-10-20T03:40:50-03:00" }, { reason: "Otro motivo" }, { action: "Otra acción" }, { actor: "" }]) assert.throws(() => requireStateHistory([change], { items: [{ ...row, ...wrong }] }));
});

test("un Bearer empresarial anterior queda rechazado por revocación OIDC o estado suspendido, con ProblemDetails preciso", async () => {
  const response = (status, code, extra = {}) => ({ status: () => status, json: async () => ({ code, traceId: "traza", ...extra }) });
  await requireRevokedBusiness(response(401, "Http.Unauthorized")); await requireRevokedBusiness(response(403, "Tenancy.Tenant.Suspended"));
  for (const wrong of [response(200, "Http.Unauthorized"), response(401, "Tenancy.Tenant.Suspended"), response(403, "Http.Forbidden"), response(403, "Tenancy.Tenant.Suspended", { items: [] }), response(401, "Http.Unauthorized", { traceId: "" })]) await assert.rejects(requireRevokedBusiness(wrong));
});
