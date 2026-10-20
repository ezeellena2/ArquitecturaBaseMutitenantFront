import assert from "node:assert/strict";
import test from "node:test";
import { domainSupplementDefinitions, domainSupplementLimitations, requirePreparedDomain, requirePreservedDomainBinding, requireManagedLoginRejection } from "./e2e-completo-dominio-complemento.mjs";
import * as domain from "./e2e-completo-dominio-complemento.mjs";

test("la preparación conserva un Administrador activo en cada empresa que administra el propietario", async () => {
  const admin = { id: "admin", name: "Administrador", isSystemRole: true }; const ownerRole = { id: "owner", name: "Dueño", isSystemRole: true };
  const owner = { memberId: "original", userId: "u-original", state: "Active", roles: [ownerRole], companies: [
    { companyId: "a", status: "Active", roles: [admin] }, { companyId: "b", status: "Active", roles: [admin] },
    { companyId: "inactiva", status: "Active", roles: [admin] }, { companyId: "sin-rol", status: "Active", roles: [] },
  ] };
  const before = structuredClone(owner); let backup = { memberId: "suplente", userId: "u-suplente", state: "Active", roles: [ownerRole], companies: [], version: 1 }; const writes = [];
  const h = { base: new URL("https://localtest.me"), api: async (_page, route) => ({ status: () => 200, json: async () => {
    if (route === "/api/users/original") return owner;
    if (route.startsWith("/api/users/paged?")) return { items: [{ memberId: backup.memberId, userId: backup.userId }] };
    if (route === "/api/users/suplente") return backup;
    const id = route.split("/").at(-1); assert.ok(["a", "b", "inactiva"].includes(id)); return { id, name: `Empresa ${id}`, status: id === "inactiva" ? "Inactive" : "Active" };
  } }) };
  await domain.prepareDomainBackupAdministration(h, {}, { ownerMemberId: "original", ownerId: "u-original", backupMe: { id: backup.userId, activeTenantId: "org", access: "business" }, backupEmail: "suplente@example.test", organizationId: "org" }, {
    addCompany: async (_h, _page, memberId, company, role) => { assert.equal(memberId, "suplente"); assert.equal(role.id, admin.id); writes.push(company.id); backup = { ...backup, version: backup.version + 1, companies: [...backup.companies, { companyId: company.id, status: "Active", roles: [admin] }] }; },
  });
  assert.deepEqual(writes, ["a", "b"]); assert.deepEqual(owner, before); assert.deepEqual(backup.roles, [ownerRole]);
});

test("la preparación rechaza una suplente ajena, inactiva o sin la asignación persistida", async () => {
  const args = { ownerMemberId: "original", ownerId: "u-original", backupMe: { id: "u-suplente", activeTenantId: "org", access: "business" }, backupEmail: "suplente@example.test", organizationId: "org" };
  for (const mutation of ["otro-tenant", "misma-identidad", "inactiva", "sin-persistir"]) {
    const input = structuredClone(args); if (mutation === "otro-tenant") input.backupMe.activeTenantId = "ajena"; if (mutation === "misma-identidad") input.backupMe.id = input.ownerId;
    const admin = { id: "admin", name: "Administrador", isSystemRole: true }; const role = { id: "owner", name: "Dueño", isSystemRole: true };
    const h = { api: async (_page, route) => ({ status: () => 200, json: async () => route.startsWith("/api/users/paged?") ? { items: [{ memberId: "suplente", userId: "u-suplente" }] }
      : route === "/api/users/original" ? { memberId: "original", userId: "u-original", state: "Active", companies: [{ companyId: "a", status: "Active", roles: [admin] }] }
        : route === "/api/users/suplente" ? { memberId: "suplente", userId: "u-suplente", state: mutation === "inactiva" ? "Inactive" : "Active", roles: [role], companies: [] }
          : { id: "a", status: "Active" } }) };
    await assert.rejects(domain.prepareDomainBackupAdministration(h, {}, input, { addCompany: async () => { assert.equal(mutation, "sin-persistir"); } }));
  }
});

test("el guardado de dominio diagnostica método, ruta y código HTTP real sin la consulta", async () => {
  const route = "/api/users/11111111-1111-4111-8111-111111111111";
  const response = { url: () => `https://localtest.me${route}`, request: () => ({ method: () => "PUT" }), status: () => 409, json: async () => ({ code: "Companies.Membership.LastCompanyAdmin", detail: "dato privado" }) };
  const page = { waitForResponse: async (predicate) => { assert.equal(predicate(response), true); return response; } };
  await assert.rejects(domain.clickDomainForResponse(page, { click: async () => {} }, `${route}?secret=oculto`, "PUT"), (error) => {
    assert.match(error.message, /PUT \/api\/users\/:id.*409.*Companies\.Membership\.LastCompanyAdmin/u);
    assert.equal(error.message.includes("oculto"), false); assert.equal(error.message.includes("dato privado"), false); return true;
  });
});

test("el focal de dominio conserva los tres callbacks y sólo admite390", async () => {
  assert.deepEqual(domain.domainPendingRepairDefinitions.map(({ id }) => id), ["DOM-01", "DOM-02", "DOM-03"]);
  for (const [i, row] of domain.domainPendingRepairDefinitions.entries()) assert.equal(row, domainSupplementDefinitions[i]);
  const h = { width: 390 }; let runs = 0;
  await domain.runDomainPendingRepairCases(h, { run: async (actual) => { assert.equal(actual, h); runs++; } }); assert.equal(runs, 1);
  await assert.rejects(domain.runDomainPendingRepairCases({ width: 1440 }, { run: async () => assert.fail("Sólo390") }), /390/u);
});

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
