import assert from "node:assert/strict";
import test from "node:test";
import { domainSupplementDefinitions, domainSupplementLimitations, requirePreparedDomain, requirePreservedDomainBinding, requireManagedLoginRejection } from "./e2e-completo-dominio-complemento.mjs";
import * as domain from "./e2e-completo-dominio-complemento.mjs";

test("el estado móvil se elige por su etiqueta visible y se comprueba después de cerrar la hoja", async () => {
  for (const width of [390, 1440]) for (const active of [false, true]) {
    const label = active ? "Activo" : "Deshabilitado"; const calls = []; let chosen; let closed = false;
    const state = { click: async () => calls.push("Estado"), getByText: (text, options) => {
      assert.equal(text, label); assert.deepEqual(options, { exact: true }); return { waitFor: async () => { assert.equal(closed, true); assert.equal(chosen, label); calls.push("estado visible"); } };
    } };
    const region = { getByRole: (role, { name }) => { assert.equal(role, "button"); assert.equal(String(name), String(/^Estado/u)); return state; } };
    const sheet = { getByText: (text, options) => { assert.equal(text, label); assert.deepEqual(options, { exact: true }); return {
      click: async () => { chosen = text; closed = true; calls.push("etiqueta visible"); },
    }; }, waitFor: async ({ state }) => { assert.equal(state, "hidden"); assert.equal(closed, true); calls.push("hoja cerrada"); } };
    const page = { getByRole: (role, options = {}) => {
      if (width === 390) {
        if (role === "region") { assert.equal(options.name, "Acceso a la organización"); return region; }
        assert.equal(role, "dialog", "El input radio sr-only no es el blanco del clic real."); assert.equal(options.name, "Estado"); return sheet;
      }
      if (role === "combobox") { assert.equal(options.name, "Estado"); return state; }
      assert.equal(role, "option"); assert.equal(options.name, label); return { click: async () => { chosen = label; calls.push("opción escritorio"); } };
    } };
    await domain.chooseDomainMemberState({ width }, page, active); assert.equal(chosen, label);
    assert.deepEqual(calls, width === 390 ? ["Estado", "etiqueta visible", "hoja cerrada", "estado visible"] : ["Estado", "opción escritorio"]);
  }
});

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
