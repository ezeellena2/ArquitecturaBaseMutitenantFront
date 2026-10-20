import assert from "node:assert/strict";
import test from "node:test";
import { EventEmitter } from "node:events";
import * as organization from "./e2e-completo-organizaciones-complemento.mjs";
import { organizationSupplementDefinitions, organizationSupplementProofGroups, requireExpiredMemberOnce, requireUrgentPageFirst, requirePreservedPersonal, requireUnavailableInvitation, requireStateHistory, requireRevokedBusiness } from "./e2e-completo-organizaciones-complemento.mjs";

test("el observador anterior al diálogo detecta una emisión prematura sin publicar destino ni clave", async () => {
  const page = new EventEmitter(); const base = new URL("https://localtest.me"); const phases = [];
  const request = { url: () => base.origin + "/api/users/invitations?private=oculto", method: () => "POST", headers: () => ({ "idempotency-key": "clave-privada" }) };
  await assert.rejects(() => organization.observeOrganizationInvitationAction({ base }, page, async ({ phase, assertNoPosts }) => {
    assert.equal(page.listenerCount("request"), 1); phase("empresa"); page.emit("request", request); page.emit("response", { request: () => request, status: () => 201 });
    phase("antesInvitar"); assertNoPosts(); assert.fail("No se pulsa Invitar tras un envío prematuro.");
  }, { onPhase: (phase) => phases.push(phase) }), (error) => {
    assert.ok(error.message.includes('"count":1')); assert.ok(error.message.includes('"phase":"empresa","status":201,"sameKey":true'));
    assert.ok(error.message.includes("antesInvitar")); for (const secret of ["clave-privada", "oculto", "https://"]) assert.equal(error.message.includes(secret), false);
    return true;
  });
  assert.deepEqual(phases, ["abrir", "empresa", "antesInvitar"]); assert.equal(page.listenerCount("request"), 0); assert.equal(page.listenerCount("response"), 0);
});

test("el intento explícito registra HTTP, cantidad y comparación de clave sin absorber su timeout", async () => {
  const page = new EventEmitter(); const base = new URL("https://localtest.me"); let snapshot;
  const original = new Error("locator.click: Timeout 15000ms exceeded. URL https://private.example/?secret=valor +5491134567810");
  await assert.rejects(() => organization.observeOrganizationInvitationAction({ base }, page, async ({ phase, assertNoPosts, summary }) => {
    for (const [address, method] of [["https://otro.example/api/users/invitations", "POST"], [base.origin + "/api/users/paged", "POST"], [base.origin + "/api/users/invitations", "GET"]]) {
      const request = { url: () => address, method: () => method, headers: () => ({ "idempotency-key": "ignorada" }) };
      page.emit("request", request); page.emit("response", { request: () => request, status: () => 200 });
    }
    assertNoPosts(); phase("clickInvitar");
    for (const [key, status] of [["primera-clave", 201], ["primera-clave", 201], ["otra-clave", 409]]) {
      const request = { url: () => base.origin + "/api/users/invitations", method: () => "POST", headers: () => ({ "idempotency-key": key }) };
      page.emit("request", request); page.emit("response", { request: () => request, status: () => status });
    }
    snapshot = summary(); throw original;
  }), (error) => { assert.equal(error.cause, original); assert.ok(error.message.includes("Timeout 15000ms exceeded")); for (const secret of ["primera-clave", "otra-clave", "https://", "+5491134567810"]) assert.equal(error.message.includes(secret), false); return true; });
  assert.equal(snapshot.count, 3); assert.deepEqual(snapshot.posts.map((post) => post.sameKey), [true, true, false]); assert.deepEqual(snapshot.posts.map((post) => post.status), [201, 201, 409]);
  assert.equal(page.listenerCount("request"), 0); assert.equal(page.listenerCount("response"), 0);
});

test("la salida espera Mi cuenta antes de pedir el logout real y conserva el fallo de carga", async () => {
  for (const ready of [true, false]) {
    const calls = []; const page = { goto: async () => calls.push("cuenta"), getByRole: (role, options) => { assert.equal(role, "heading"); assert.deepEqual(options, { name: "Mi cuenta", exact: true }); return { waitFor: async () => { calls.push("lista"); if (!ready) throw new Error("Cuenta cargando"); } }; } };
    const h = { base: new URL("https://localtest.me"), signOut: async (target) => { assert.equal(target, page); calls.push("salir UI"); } };
    if (ready) await organization.leaveOrganizationSession(h, page); else await assert.rejects(() => organization.leaveOrganizationSession(h, page), /Cuenta cargando/u);
    assert.deepEqual(calls, ready ? ["cuenta", "lista", "salir UI"] : ["cuenta", "lista"]);
  }
});

test("la reparación usa los mismos callbacks1–3 y omite por completo4 verde", async () => {
  assert.deepEqual(organization.organizationRepairDefinitions.map((row) => row.id), ["ORX-01", "ORX-02", "ORX-03"]);
  let active; const calls = []; const outcomes = new Map();
  const h = { record: async (id, getPage, action) => { calls.push(id); await action(); assert.equal(getPage(), active); return { ok: true }; } };
  const run = organization.createOrganizationRecorder(h, { repair: true, outcomes, getPage: () => active, setCapturePage: (page) => { active = page; } });
  for (const number of [1, 2, 3, 4]) await run(number, async () => { if (number === 4) assert.fail("No vuelve a probar4"); active = "página de acción " + number; }, "preparación");
  assert.deepEqual(calls, ["ORX-01", "ORX-02", "ORX-03"]); assert.deepEqual([...outcomes.keys()], [1, 2, 3]);
});

test("el recorder conserva un record fallido para que su preparación no habilite dependientes", async () => {
  const outcomes = new Map(); const failed = { ok: false, error: new Error("Invitar falló") };
  const run = organization.createOrganizationRecorder({ record: async () => failed }, { repair: true, outcomes, getPage: () => "actual", setCapturePage: () => {} });
  assert.equal(await run(1, async () => {}), failed); assert.equal(outcomes.get(1).ok, false);
});

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
