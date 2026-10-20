import assert from "node:assert/strict";
import test from "node:test";
import { identitySupplementDefinitions, identitySupplementLimitations, identityPhoneFixtures, requireThirtyDayGrace, requireEmailOwnership, runIdentityDependency } from "./e2e-completo-identidad-complemento.mjs";
import * as identity from "./e2e-completo-identidad-complemento.mjs";

test("nueve registros de identidad cubren el desempate y el fallback por antigüedad mediante grupo conjunto", () => {
  assert.equal(identitySupplementDefinitions.length, 9);
  assert.equal(new Set(identitySupplementDefinitions.map((item) => item.id)).size, 9);
  const covers = identitySupplementDefinitions.flatMap((item) => item.covers);
  for (const id of ["CU-005", "CU-007", "CU-014", "CU-015", "CU-017", "ID-009", "ID-024", "ID-018"]) assert.ok(covers.includes("BACK-" + id), id);
  assert.equal(covers.includes("BACK-ID-019"), false, "El desempate no prueba también la antigüedad diferenciada sin selección anterior.");
  assert.equal(Object.hasOwn(identitySupplementLimitations, "BACK-ID-019"), false);
  assert.deepEqual(identity.identitySupplementProofGroups["BACK-ID-019"], [["IDS-07", "IDS-09"]]);
  assert.match(identitySupplementDefinitions.find((item) => item.id === "IDS-09").expected, /JoinedAtUtc.*distintos/u);
});

test("los Phone propios son sintéticos, distintos entre anchos y ajenos a las otras suites", () => {
  const all = [1440, 390].flatMap((width) => Object.values(identityPhoneFixtures(width)));
  assert.equal(new Set(all).size, all.length);
  for (const phone of all) assert.match(phone, /^\+54911345678[456]\d$/u);
  assert.throws(() => identityPhoneFixtures(1280));
});

test("la baja exige exactamente treinta días dentro de la ventana observada", () => {
  const start = Date.parse("2026-10-20T12:00:00Z");
  requireThirtyDayGrace("2026-11-19T12:00:01Z", start, start + 2000);
  for (const wrong of ["2026-11-18T12:00:01Z", "2026-11-20T12:00:01Z", "2026-11-19T12:00:01", "no-fecha"]) assert.throws(() => requireThirtyDayGrace(wrong, start, start + 2000));
});

test("la posesión distingue pendiente, verificado y ausente sin transferir otro método", () => {
  const email = "reserva@example.test";
  requireEmailOwnership({ methods: [{ id: "r", type: "Email", value: email, isVerified: false }] }, email, "pending");
  requireEmailOwnership({ methods: [{ id: "r", type: "Email", value: email, isVerified: true }] }, email, "verified");
  requireEmailOwnership({ methods: [] }, email, "absent");
  assert.throws(() => requireEmailOwnership({ methods: [{ type: "Email", value: email, isVerified: false }] }, email, "verified"));
  assert.throws(() => requireEmailOwnership({ methods: [{ type: "Email", value: email, isVerified: true }] }, email, "absent"));
});

test("una dependencia fallida bloquea sólo su caso y conserva los independientes", async () => {
  const actions = []; const blocks = []; const outcomes = new Map([["IDS-04", { ok: false }]]); const page = {};
  const h = { record: async (id, getPage, action) => { assert.equal(getPage(), page); actions.push(id); return { ok: true, value: await action() }; }, block: async (id, reason, target) => { blocks.push({ id, reason, target }); } };
  await runIdentityDependency(h, outcomes, "IDS-05", ["IDS-04"], page, async () => assert.fail("No se preparó la cuenta en baja."));
  assert.deepEqual(actions, []); assert.equal(blocks[0].target, page); assert.match(blocks[0].reason, /IDS-04/u);
  await runIdentityDependency(h, outcomes, "IDS-06", [], page, async () => "Independiente");
  assert.deepEqual(actions, ["IDS-06"]); assert.equal(outcomes.get("IDS-06").ok, true);
});

test("LastAdmin espera el bloqueo renderizado y mantiene la exigencia de aria-disabled", async () => {
  const waiting = Promise.withResolvers(); const ready = Promise.withResolvers(); let loaded = false; let reads = 0; let opened = false;
  const info = { waitFor: async () => { waiting.resolve(); await ready.promise; }, click: async () => { opened = true; } };
  let aria = "true";
  const page = { getByRole: (role, options = {}) => {
    if (role === "dialog") return { getByText: (name) => { assert.equal(name.test("Organización propia"), true); return { first: () => ({ waitFor: async () => assert.equal(opened, true) }) }; } };
    if (options.name === "Por qué no podés darte de baja") return info;
    assert.equal(options.name, "Dar de baja");
    return { getAttribute: async (name) => { assert.equal(name, "aria-disabled"); assert.equal(loaded, true); reads++; return aria; } };
  } };
  const pending = identity.requireSoleOwnerDeletionUi(page, "Organización propia");
  await waiting.promise; assert.equal(reads, 0); assert.equal(opened, false);
  loaded = true; ready.resolve(); await pending; assert.equal(reads, 1); assert.equal(opened, true);
  aria = null; await assert.rejects(() => identity.requireSoleOwnerDeletionUi(page, "Organización propia"));
});

test("la aceptación legal exige alerta sin POST antes de marcar la casilla", async () => {
  for (const accidentalPost of [false, true]) {
    let listener; let removed = false; let clicked = false;
    const checkbox = { isChecked: async () => false };
    const page = {
      on: (event, handler) => { assert.equal(event, "request"); listener = handler; },
      off: (event, handler) => { assert.equal(event, "request"); assert.equal(handler, listener); removed = true; },
      getByRole: (role, options) => {
        if (role === "checkbox") return checkbox;
        if (role === "button") { assert.equal(options.name, "Aceptar y seguir"); return { click: async () => { clicked = true; if (accidentalPost) listener({ method: () => "POST", url: () => "https://localtest.me/api/legal/accept" }); } }; }
        assert.equal(role, "alert"); return { filter: ({ hasText }) => { assert.equal(hasText, "Aceptá los Términos y la Política de privacidad."); return { waitFor: async () => assert.equal(clicked, true) }; } };
      },
    };
    if (accidentalPost) await assert.rejects(() => identity.requireExplicitLegalConsent(page), /aceptación/iu);
    else await identity.requireExplicitLegalConsent(page);
    assert.equal(removed, true);
  }
});

test("cambiar organización espera la ficha antes de decidir acción y conserva motivo, ruta y HTTP200", async () => {
  for (const mode of ["directo", "hoja"]) {
    const waiting = Promise.withResolvers(); const loaded = Promise.withResolvers(); const actions = []; let ready = false;
    const direct = { filter: () => direct, first: () => direct, isVisible: async () => { assert.equal(ready, true); return mode === "directo"; },
      click: async () => actions.push("abrir directo"), or: () => ({ first: () => ({ waitFor: async () => { waiting.resolve(); await loaded.promise; } }) }) };
    const menu = { filter: () => menu, first: () => menu, getAttribute: async () => "dialog", click: async () => actions.push("abrir hoja") };
    const dialog = { filter: () => dialog, getByRole: (role) => role === "textbox" ? { fill: async (reason) => assert.match(reason, /última Dueña/u) } : { click: async () => actions.push("confirmar") }, waitFor: async ({ state }) => assert.equal(state, "hidden") };
    const response = { url: () => "https://localtest.me/api/platform/tenants/propia/suspend", request: () => ({ method: () => "POST" }), status: () => 200 };
    const page = { goto: async (url) => assert.equal(new URL(url).pathname, "/plataforma/organizaciones/propia"),
      waitForResponse: async (predicate) => { assert.equal(predicate(response), true); return response; },
      getByRole: (role, options = {}) => {
        if (role === "dialog") return dialog;
        if (role === "textbox") return {};
        if (role === "menuitem") { assert.equal(options.name, "Suspender"); return { click: async () => actions.push("opción Suspender") }; }
        return typeof options.name === "string" ? direct : menu;
      },
    };
    const pending = identity.changeOrganization({ base: "https://localtest.me" }, page, { me: { activeTenantId: "propia" } }, "Suspender", "operador@example.test");
    await waiting.promise; assert.deepEqual(actions, []); ready = true; loaded.resolve(); await pending;
    assert.deepEqual(actions, mode === "directo" ? ["abrir directo", "confirmar"] : ["abrir hoja", "opción Suspender", "confirmar"]);
  }
});

test("el fallback exige dos candidatas activas de antigüedad diferente y la recordada suspendida", () => {
  const organizations = ["antigua", "reciente", "recordada"];
  const account = { organizations: organizations.map((tenantId, index) => ({ tenantId, status: "Active", tenantStatus: index === 2 ? "Suspended" : "Active", joinedAtUtc: `2026-10-20T12:0${index}:00Z` })) };
  identity.requireChronologicalFallback(account, organizations, "antigua");
  assert.throws(() => identity.requireChronologicalFallback(account, organizations, "reciente"), /antigua/iu);
  const sameTime = structuredClone(account); sameTime.organizations[1].joinedAtUtc = sameTime.organizations[0].joinedAtUtc;
  assert.throws(() => identity.requireChronologicalFallback(sameTime, organizations, "antigua"), /distintos/iu);
  const inactive = structuredClone(account); inactive.organizations[1].tenantStatus = "Suspended";
  assert.throws(() => identity.requireChronologicalFallback(inactive, organizations, "antigua"));
  const accessible = structuredClone(account); accessible.organizations[2].tenantStatus = "Active";
  assert.throws(() => identity.requireChronologicalFallback(accessible, organizations, "antigua"));
  assert.throws(() => identity.requireChronologicalFallback(account, ["antigua", "recordada"], "antigua"));
});
