import assert from "node:assert/strict";
import test from "node:test";
import { EventEmitter } from "node:events";
import * as organization from "./e2e-completo-organizaciones-complemento.mjs";
import { organizationSupplementDefinitions, organizationSupplementProofGroups, requireExpiredMemberOnce, requireUrgentPageFirst, requirePreservedPersonal, requireUnavailableInvitation, requireStateHistory, requireRevokedBusiness } from "./e2e-completo-organizaciones-complemento.mjs";

test("la barra móvil de Organización selecciona sólo01 y04 sobre el plan original", async () => {
  const targets = ["ORX-01", "ORX-04"]; const recorded = []; const executed = [];
  assert.deepEqual(organization.organizationSupplementMobileBarDefinitions.map(({ id }) => id), targets);
  const h = { width: 390, record: async (id, _page, action) => { recorded.push(id); return { ok: true, value: await action() }; } };
  await organization.runOrganizationMobileBarCases(h, { run: async (selected, repair, definitions) => {
    assert.equal(selected, h); assert.equal(repair, true);
    for (const row of definitions) assert.equal(row, organizationSupplementDefinitions.find(({ id }) => id === row.id));
    const run = organization.createOrganizationRecorder(selected, { repair, definitions, outcomes: new Map(), getPage: () => "Plataforma", setCapturePage: () => {} });
    for (const number of [1, 2, 3, 4]) await run(number, async () => executed.push(`ORX-${String(number).padStart(2, "0")}`));
  } });
  assert.deepEqual(recorded, targets); assert.deepEqual(executed, targets);
  await assert.rejects(organization.runOrganizationMobileBarCases({ ...h, width: 1440 }, { run: async () => assert.fail("Sólo390") }), /390/u);
});

test("el estado móvil de Organización elige la acción dentro del menú de la hoja titulada", async () => {
  const calls = [];
  const ready = { filter: () => ready, first: () => ready, waitFor: async () => calls.push("ficha lista") };
  const direct = { or: () => ready, isVisible: async () => false };
  const trigger = { filter: () => trigger, first: () => trigger, waitFor: async (options) => assert.deepEqual(options, { state: "visible" }), getAttribute: async () => "dialog", click: async () => calls.push("abrir barra") };
  const menu = { waitFor: async () => calls.push("menú visible"), getByRole: (role, options) => { assert.equal(role, "menuitem"); assert.deepEqual(options, { name: "Suspender", exact: true }); return { click: async () => calls.push("Suspender") }; } };
  const dialog = { waitFor: async (options) => calls.push(options?.state === "hidden" ? "hoja cerrada" : "hoja visible"), getByRole: (role) => { assert.equal(role, "menu"); return menu; } };
  const heading = { filter: () => heading, first: () => heading, innerText: async () => "Organización propia" };
  const page = { viewportSize: () => ({ width: 390 }), getByRole: (role, options) => {
    if (role === "button") return options.name === "Suspender" ? direct : trigger;
    if (role === "heading") return heading;
    assert.equal(role, "dialog", "No se busca un menuitem global bajo el overlay.");
    assert.deepEqual(options, { name: "Organización propia", exact: true }); return dialog;
  } };
  await organization.openOrganizationStateAction(page, "Suspender");
  assert.deepEqual(calls, ["ficha lista", "abrir barra", "hoja visible", "menú visible", "Suspender", "hoja cerrada"]);
});

test("el estado de Organización conserva botón directo o RowActions de escritorio", async () => {
  for (const visible of [true, false]) {
    const calls = [];
    const ready = { filter: () => ready, first: () => ready, waitFor: async () => calls.push("ficha lista") };
    const direct = { or: () => ready, isVisible: async () => visible, click: async () => calls.push("directo") };
    const trigger = { filter: () => trigger, first: () => trigger, click: async () => calls.push("RowActions") };
    const page = { viewportSize: () => ({ width: 1440 }), getByRole: (role, options) => {
      if (role === "button") return options.name === "Suspender" ? direct : trigger;
      assert.equal(role, "menuitem"); assert.deepEqual(options, { name: "Suspender", exact: true }); return { click: async () => calls.push("acción") };
    } };
    await organization.openOrganizationStateAction(page, "Suspender");
    assert.deepEqual(calls, visible ? ["ficha lista", "directo"] : ["ficha lista", "RowActions", "acción"]);
  }
});

test("la reparación de estados ejecuta sólo ORX04 sin reconstruir invitaciones ni moderación verdes", async () => {
  assert.deepEqual(organization.organizationStateRepairDefinitions.map((entry) => entry.id), ["ORX-04"]);
  const seen = []; const outcomes = new Map(); let captured;
  const record = organization.createOrganizationRecorder({ record: async (id, getPage, action) => { assert.equal(getPage(), "Plataforma"); seen.push(id); return action(); } }, {
    repair: true, definitions: organization.organizationStateRepairDefinitions, outcomes, getPage: () => captured, setCapturePage: (page) => { captured = page; }, defaultPage: "Plataforma",
  });
  for (const number of [1, 2, 3, 4]) await record(number, async () => { assert.equal(number, 4); return { ok: true }; });
  assert.deepEqual(seen, ["ORX-04"]); assert.deepEqual([...outcomes.keys()], [4]);
});

test("llegar a org no permite leer Me antes de que Inicio-Miembro termine su lectura autenticada", async () => {
  const ready = Promise.withResolvers(); const waiting = Promise.withResolvers(); const calls = []; const me = { access: "business", activeTenantId: "propia" };
  const page = { waitForURL: async (predicate) => { assert.equal(predicate(new URL("https://localtest.me/org")), true); calls.push("URL org"); }, getByRole: (role, options) => {
    assert.equal(role, "heading"); assert.deepEqual(options, { name: "Tus empresas", exact: true });
    return { waitFor: async (options) => { assert.equal(options, undefined); calls.push("esperar Inicio-Miembro"); waiting.resolve(); await ready.promise; calls.push("Home real listo"); } };
  } };
  const h = { api: async (target, route) => { assert.equal(target, page); assert.equal(route, "/api/me"); calls.push("Me con Bearer observado"); return { status: () => 200, json: async () => me }; } };
  const pending = organization.readInvitedCompanyHomeSession(h, page); await waiting.promise;
  assert.deepEqual(calls, ["URL org", "esperar Inicio-Miembro"]); ready.resolve(); assert.equal(await pending, me);
  assert.deepEqual(calls, ["URL org", "esperar Inicio-Miembro", "Home real listo", "Me con Bearer observado"]);
});

test("si Inicio-Miembro no carga conserva el fallo sin llamar API ni saltar a otra ruta", async () => {
  const failure = new Error("Inicio-Miembro siguió cargando");
  const page = { waitForURL: async () => {}, getByRole: () => ({ waitFor: async () => { throw failure; } }), goto: async () => assert.fail("No hay navegación alternativa") };
  await assert.rejects(() => organization.readInvitedCompanyHomeSession({ api: async () => assert.fail("La SPA aún no emitió Bearer") }, page), (error) => error === failure);
});

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

test("ORX04 muestra el motivo unido al actor móvil en su tabpanel y captura Plataforma aun si la fila no aparece", async () => {
  for (const width of [390, 1440]) for (const present of [true, false]) {
    const reason = "Cierre propio del helper."; const calls = []; let capturePage = "Personal";
    const change = { reason, atUtc: "2026-10-20T03:40:50Z", action: "Organización cerrada" };
    const row = { reason, occurredAtUtc: change.atUtc, action: change.action, actor: "Operador", actorRole: "Plataforma" };
    const expected = { waitFor: async () => { calls.push("fila propia"); if (!present) throw new Error("La fila propia falta"); } };
    const panel = {
      getByRole: (role) => { assert.equal(width, 390); assert.equal(role, "listitem"); return { filter: ({ hasText }) => { assert.equal(hasText, reason); return expected; } }; },
      getByText: (text, options) => { assert.equal(width, 1440); assert.equal(text, reason); assert.deepEqual(options, { exact: true }); return { filter: () => ({ first: () => expected }) }; },
    };
    const page = {
      reload: async () => calls.push("recargar ficha"),
      getByRole: (role, options) => {
        if (role === "tabpanel") return panel;
        assert.equal(role, "tab"); assert.deepEqual(options, { name: "Historial", exact: true });
        return { click: async () => calls.push("Historial") };
      },
    };
    const h = { width, api: async (target, route) => {
      assert.equal(target, page); assert.equal(capturePage, page);
      assert.equal(route, "/api/platform/tenants/propia/history?limit=100");
      calls.push("GET200 UTC exacto"); return { status: () => 200, json: async () => ({ items: [row] }) };
    } };
    const verify = () => organization.verifyOrganizationClosureHistory(h, page, "propia", [change], (target) => { capturePage = target; });
    if (present) await verify(); else await assert.rejects(verify, /La fila propia falta/u);
    assert.equal(capturePage, page);
    assert.deepEqual(calls, ["GET200 UTC exacto", "recargar ficha", "Historial", "fila propia"]);
  }
});
