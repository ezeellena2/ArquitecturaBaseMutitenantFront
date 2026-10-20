import assert from "node:assert/strict";
import test from "node:test";
import { securitySupplementDefinitions, securitySupplementProofGroups, requireRecoveryRejected, requireTenFailuresAndReload, requireCancelledStepUp, requireExclusivePlatformActor } from "./e2e-completo-seguridad-complemento.mjs";
import * as security from "./e2e-completo-seguridad-complemento.mjs";

const problem = (status, code, retryAfter, header = retryAfter) => ({
  status: () => status,
  json: async () => ({ code, traceId: "traza", ...(retryAfter === undefined ? {} : { retryAfter }) }),
  headers: () => ({ ...(header === undefined ? {} : { "retry-after": String(header) }) }),
});
const denied = () => ({ status: 403, key: "misma-operacion", code: "Auth.Platform.ReauthenticationRequired" });
const account = () => ({ id: "propia", state: "Active", operatorVersion: 9, operatorPermissions: ["platform.audit.read"] });

test("cuatro registros y PL003 exige las siete pruebas anteriores más las dos ramas nuevas juntas", () => {
  assert.equal(securitySupplementDefinitions.length, 4);
  assert.equal(new Set(securitySupplementDefinitions.map(({ id }) => id)).size, 4);
  assert.deepEqual(securitySupplementDefinitions.flatMap(({ covers }) => covers).sort(), ["BACK-ID-025", "BACK-PL-002", "BACK-PL-005"]);
  assert.deepEqual(securitySupplementProofGroups, { "BACK-PL-003": [["PLAT-01", "PLAT-02", "PLAT-03", "PLAT-04", "PLAT-05", "PLAT-06", "PLAT-07", "SEC-04"]] });
  const alternatives = securitySupplementProofGroups["BACK-PL-003"];
  for (const missing of alternatives[0]) {
    const executed = new Set(alternatives[0].filter((id) => id !== missing));
    assert.equal(alternatives.some((group) => group.every((id) => executed.has(id))), false);
  }
});

test("reutilizar recuperación exige el error exacto y no confunde un fallo del autenticador", async () => {
  await requireRecoveryRejected(problem(400, "Auth.TwoFactor.RecoveryInvalid"));
  await assert.rejects(() => requireRecoveryRejected(problem(400, "Auth.TwoFactor.Invalid")));
  await assert.rejects(() => requireRecoveryRejected(problem(200, "Auth.TwoFactor.RecoveryInvalid")));
});

test("el décimo fallo y el código correcto tras recarga deben conservar bloqueo y Retry-After", async () => {
  const wrong = () => problem(400, "Auth.TwoFactor.Invalid");
  const ten = [...Array.from({ length: 9 }, wrong), problem(429, "Identity.Account.LockedOut", 900)];
  await requireTenFailuresAndReload(ten, problem(429, "Identity.Account.LockedOut", 895));
  await assert.rejects(() => requireTenFailuresAndReload(ten.slice(1), problem(429, "Identity.Account.LockedOut", 895)));
  await assert.rejects(() => requireTenFailuresAndReload([...ten.slice(0, 8), problem(429, "Identity.Account.LockedOut", 900), ten[9]], ten[9]));
  await assert.rejects(() => requireTenFailuresAndReload(ten, problem(400, "Auth.TwoFactor.Invalid")));
  await assert.rejects(() => requireTenFailuresAndReload(ten, problem(429, "Identity.Account.LockedOut", 895, 900)));
  await assert.rejects(() => requireTenFailuresAndReload(ten, problem(429, "Identity.Account.LockedOut", 0)));
});

test("cancelar no admite escritura exitosa, cambio de clave, confirmación ni cambio del destino", () => {
  requireCancelledStepUp([denied(), denied()], [], account(), account());
  assert.throws(() => requireCancelledStepUp([denied(), { ...denied(), status: 200 }], [], account(), account()));
  assert.throws(() => requireCancelledStepUp([denied(), { ...denied(), key: "otra-operacion" }], [], account(), account()));
  assert.throws(() => requireCancelledStepUp([denied(), { ...denied(), replayed: "true" }], [], account(), account()));
  assert.throws(() => requireCancelledStepUp([denied(), { ...denied(), code: "Http.Forbidden" }], [], account(), account()));
  assert.throws(() => requireCancelledStepUp([denied(), denied()], [{ status: 200 }], account(), account()));
  assert.throws(() => requireCancelledStepUp([denied(), denied()], [], account(), { ...account(), operatorVersion: 10 }));
  assert.throws(() => requireCancelledStepUp([denied(), denied()], [], account(), { ...account(), operatorPermissions: [] }));
  assert.throws(() => requireCancelledStepUp([denied(), denied()], [], { id: "sin-version" }, { id: "sin-version" }));
});

test("ambas ramas exigen un operador exclusivo con exactamente el permiso esperado", () => {
  const actor = { access: "platform", activeTenantId: null, hasPersonalSpace: false, organizations: [], effectivePermissions: { platform: ["platform.audit.read"], organization: [], companies: {} } };
  requireExclusivePlatformActor(actor, ["platform.audit.read"]);
  for (const changed of [{ hasPersonalSpace: true }, { organizations: [{ id: "ajena" }] }, { access: "consumer" }, { activeTenantId: "org" }, { effectivePermissions: { ...actor.effectivePermissions, platform: ["platform.audit.read", "platform.accounts.read"] } }]) {
    assert.throws(() => requireExclusivePlatformActor({ ...actor, ...changed }, ["platform.audit.read"]));
  }
});

test("preparar permisos espera ficha antes del botón desktop o la hoja móvil y conserva motivo y selección", async () => {
  for (const mobile of [false, true]) {
    const waiting = Promise.withResolvers(); const loaded = Promise.withResolvers(); const calls = []; let ready = false; let opened = false; let text;
    const waitForAction = async () => { waiting.resolve(); await loaded.promise; };
    const direct = {
      or: () => { throw new Error("Acciones visible no acredita que Cambiar permisos ya esté disponible en escritorio."); },
      waitFor: async () => { assert.equal(mobile, false); await waitForAction(); },
      isVisible: async () => { assert.equal(ready, true, "No se puede decidir el tipo de acción durante la carga."); return !mobile; },
      click: async () => { assert.equal(mobile, false); calls.push("directo"); opened = true; },
    };
    const picker = { focus: async () => calls.push("picker"), press: async (key) => assert.equal(key, "ArrowDown"), innerText: async () => "Ver organizaciones, Ver la auditoría" };
    const form = { waitFor: async () => assert.equal(opened, true), getByRole: (role, options) => {
      if (role === "button") { assert.equal(options.name, "Permisos de plataforma"); return picker; }
      assert.equal(role, "textbox"); return { fill: async (value) => { text = value; } };
    } };
    const page = {
      viewportSize: () => ({ width: mobile ? 390 : 1440 }),
      keyboard: { press: async (key) => assert.equal(key, "Escape") },
      getByRole: (role, { name } = {}) => {
        if (role === "button" && name === "Cambiar permisos") return direct;
        if (role === "button") { assert.equal(name, "Acciones de Cuenta propia"); return { waitFor: async () => { assert.equal(mobile, true); await waitForAction(); }, getAttribute: async () => "dialog", click: async () => { assert.equal(mobile, true); calls.push("hoja"); } }; }
        if (role === "menuitem") { assert.equal(name, "Cambiar permisos"); return { click: async () => { assert.equal(mobile, true); opened = true; } }; }
        if (role === "dialog") { assert.equal(name, "Cambiar permisos de Cuenta propia"); return form; }
        if (role === "menu") return { isVisible: async () => true };
        assert.equal(role, "menuitemcheckbox"); return { nth: (index) => { assert.equal(index, 0); return { click: async () => calls.push("selección") }; } };
      },
    };
    const pending = security.prepareSecurityPermissions(page, "Cuenta propia", 0, "Motivo conservado."); void pending.catch(() => {});
    await Promise.race([waiting.promise, pending]); assert.deepEqual(calls, []);
    ready = true; loaded.resolve(); const prepared = await pending;
    assert.deepEqual(calls, [mobile ? "hoja" : "directo", "picker", "selección"]);
    assert.equal(text, "Motivo conservado."); assert.equal(prepared.form, form); assert.equal(prepared.picker, picker); assert.equal(prepared.selection, "Ver organizaciones, Ver la auditoría");
  }
});

test("la reparación de step-up sólo ejecuta02 y no repite recuperación, bloqueo o ramas de Inicio", async () => {
  assert.deepEqual(security.securityStepUpRepairDefinitions.map((entry) => entry.id), ["SEC-02"]);
  for (const width of [1440, 390]) {
    const records = []; const calls = []; const setupFailure = new Error("Ingreso de preparación fallido");
    const locator = { or() { return this; }, filter() { return this; }, first() { return this; }, waitFor: async () => {}, isVisible: async () => false };
    const page = { close: async () => calls.push("cerrar"), goto: async () => calls.push("abandonar puerta incompleta"), viewportSize: () => ({ width, height: 900 }), setViewportSize: async () => {}, getByRole: () => locator };
    const h = { width, base: new URL("https://localtest.me"), newPage: async () => page,
      login: async (_page, email, access) => { assert.equal(_page, page); assert.equal(email, width === 1440 ? "e2e-e9a-operator@example.test" : "e2e-e9b-operator@example.test"); assert.equal(access, "platform"); calls.push("ingreso UI de preparación02"); throw setupFailure; },
      record: async (id, getPage, action) => { records.push(id); assert.equal(getPage(), page); try { return { ok: true, value: await action() }; } catch (error) { assert.equal(error, setupFailure); return { ok: false, error }; } },
      signOut: async () => assert.fail("No se completó una sesión"),
    };
    await security.runSecurityStepUpRepairCases(h);
    assert.deepEqual(records, ["SEC-02"]); assert.deepEqual(calls, ["ingreso UI de preparación02", "abandonar puerta incompleta", "cerrar"]);
  }
});
