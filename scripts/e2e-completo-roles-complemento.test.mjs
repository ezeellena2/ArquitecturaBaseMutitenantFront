import assert from "node:assert/strict";
import test from "node:test";
import { backendUseCases } from "./e2e-completo-inventario-back.mjs";
import { guidedCases, screens } from "./e2e-completo-inventario-front.mjs";
import { roleSupplementDefinitions, assertPermissionCatalog, assertAssignedRoleUnchanged, assertCompanyOnlyPermissions, assertCompanyCyclePreserved } from "./e2e-completo-roles-complemento.mjs";
import * as roles from "./e2e-completo-roles-complemento.mjs";

test("el runner móvil de Roles repite06 con sólo01/03/05 y conserva los otros resultados", async () => {
  const target = "SUP-RO-06"; const fixtures = ["SUP-RO-01", "SUP-RO-03", "SUP-RO-05"];
  assert.deepEqual(roles.roleSupplementMobileBarDefinitions.map(({ id }) => id), [target]);
  assert.equal(roles.roleSupplementMobileBarDefinitions[0], roleSupplementDefinitions.find(({ id }) => id === target));
  const recorded = []; const executed = [];
  const h = { width: 390, record: async (id, _page, action) => { recorded.push(id); return { ok: true, value: await action() }; } };
  await roles.runRoleMobileBarCases(h, { run: async (selected) => {
    for (const row of roleSupplementDefinitions) {
      const result = await selected.record(row.id, () => ({}), async () => executed.push(row.id));
      if (row.id !== target && !fixtures.includes(row.id)) assert.deepEqual(result, { ok: false, skipped: true });
    }
  } });
  assert.deepEqual(recorded, [target]); assert.deepEqual(new Set(executed), new Set([...fixtures, target]));
  await assert.rejects(roles.runRoleMobileBarCases({ ...h, width: 1440 }, { run: async () => assert.fail("Sólo390") }), /390/u);
});

test("las seis acciones enlazan filas existentes y RO007 sólo en la comprobación de todos los estados", () => {
  assert.equal(roleSupplementDefinitions.length, 6);
  assert.equal(new Set(roleSupplementDefinitions.map((entry) => entry.id)).size, 6);
  const known = new Set([...backendUseCases, ...guidedCases].map((entry) => entry.id).concat(screens.map((entry) => `SCREEN-${entry.id}`)));
  for (const entry of roleSupplementDefinitions) for (const id of entry.covers) assert.ok(known.has(id), id);
  assert.equal(roleSupplementDefinitions.filter((entry) => entry.covers.includes("BACK-RO-007")).length, 1);
});

test("el catálogo exige orden completo, traducción de grupo, nombre y descripción", () => {
  const expected = [{ area: "users", name: "Usuarios", permissions: [{ code: "users.read", name: "Ver usuarios", description: "Leer las personas." }, { code: "users.invite", name: "Invitar usuarios", description: "Invitar personas." }] }];
  assertPermissionCatalog(structuredClone(expected), expected);
  for (const mutate of [
    (groups) => groups[0].permissions.reverse(),
    (groups) => { groups[0].name = "Area.users"; },
    (groups) => { groups[0].permissions[0].name = "Permission.users.read"; },
    (groups) => { groups[0].permissions[0].description = "PermissionDescription.users.read"; },
    (groups) => groups[0].permissions.pop(),
  ]) { const changed = structuredClone(expected); mutate(changed); assert.throws(() => assertPermissionCatalog(changed, expected)); }
});

test("los rechazos de rol conservan asignación y versión también para invitados y deshabilitados", () => {
  const role = { id: "role", name: "Lectura", scope: "SpecificCompany", companyId: "company", isSystemRole: false, userCount: 1, version: 7, permissions: ["company.members.read"] };
  for (const state of ["Active", "Invited", "Inactive"]) for (const code of ["Roles.Role.HasUsers", "Roles.Role.ScopeChangeHasUsers"]) {
    const member = { memberId: "member", state, version: 3, roles: [], companies: [{ companyId: "company", roles: [{ id: "role" }] }] };
    const input = { role, member, state, code, problem: { code, userCount: 1 }, afterRole: structuredClone(role), afterMember: structuredClone(member) };
    assertAssignedRoleUnchanged(input);
    assert.throws(() => assertAssignedRoleUnchanged({ ...input, problem: { code, userCount: 0 } }));
    assert.throws(() => assertAssignedRoleUnchanged({ ...input, afterRole: { ...role, version: 8 } }));
    assert.throws(() => assertAssignedRoleUnchanged({ ...input, afterMember: { ...member, companies: [] } }));
    assert.throws(() => assertAssignedRoleUnchanged({ ...input, member: { ...member, state: "Expired" } }));
  }
});

test("el miembro sólo obtiene su permiso de empresa y lo pierde completo al inactivarla", () => {
  const fixture = { userId: "person", tenantId: "org", companyId: "company" };
  const active = { id: "person", access: "business", activeTenantId: "org", effectivePermissions: { organization: [], platform: [], companies: { company: ["company.members.read"] } } };
  const inactive = { ...active, effectivePermissions: { ...active.effectivePermissions, companies: {} } };
  assertCompanyOnlyPermissions(active, fixture, true);
  assertCompanyOnlyPermissions(inactive, fixture, false);
  assertCompanyOnlyPermissions(structuredClone(active), fixture, true);
  assert.throws(() => assertCompanyOnlyPermissions(active, fixture, false));
  assert.throws(() => assertCompanyOnlyPermissions(inactive, fixture, true));
  assert.throws(() => assertCompanyOnlyPermissions({ ...active, id: "owner" }, fixture, true));
  assert.throws(() => assertCompanyOnlyPermissions({ ...active, effectivePermissions: { ...active.effectivePermissions, organization: ["users.read"] } }, fixture, true));
});

test("reactivar sólo puede cambiar estado y versión de empresa, sin perder datos ni miembros", () => {
  const before = { company: { id: "company", name: "Propia", status: "Active", version: 2, taxId: { number: "sintético" }, memberCount: 3 }, members: { totalCount: 3, items: [{ memberId: "a", roles: [{ id: "role" }] }] }, member: { memberId: "a", state: "Active", companies: [{ companyId: "company", roles: [{ id: "role" }] }] } };
  const after = { ...structuredClone(before), company: { ...before.company, status: "Active", version: 4 } };
  assertCompanyCyclePreserved(before, after);
  assert.throws(() => assertCompanyCyclePreserved(before, { ...after, company: { ...after.company, status: "Inactive" } }));
  assert.throws(() => assertCompanyCyclePreserved(before, { ...after, company: { ...after.company, name: "Perdió datos" } }));
  assert.throws(() => assertCompanyCyclePreserved(before, { ...after, members: { ...after.members, items: [] } }));
  assert.throws(() => assertCompanyCyclePreserved(before, { ...after, member: { ...after.member, companies: [] } }));
});

test("la tarjeta de empresa se verifica sin exigir una región que no existe en desktop", async () => {
  let href = "/org/empresas/propia"; let text = "Empresa propia (A) Lectura de miembros"; let waited = false;
  const page = { getByRole: (role, { name }) => {
    if (role === "heading") { assert.equal(name, "Tus empresas"); return { waitFor: async () => {} }; }
    assert.equal(role, "link", "El encabezado desktop no está dentro de una región accesible.");
    assert.ok(name.test("Empresa propia (A) Lectura de miembros")); assert.equal(name.test("Empresa propia A Lectura de miembros"), false, "El nombre se escapa como texto literal.");
    return { waitFor: async () => { waited = true; }, getAttribute: async (attribute) => { assert.equal(attribute, "href"); return href; }, innerText: async () => text };
  } };
  await roles.assertCompanyHomeCard(page, { id: "propia", name: "Empresa propia (A)" }, "Lectura de miembros"); assert.equal(waited, true);
  href = "/org/empresas/ajena"; await assert.rejects(() => roles.assertCompanyHomeCard(page, { id: "propia", name: "Empresa propia (A)" }, "Lectura de miembros"));
  href = "/org/empresas/propia"; text = "Empresa propia (A) Otro rol";
  await assert.rejects(() => roles.assertCompanyHomeCard(page, { id: "propia", name: "Empresa propia (A)" }, "Lectura de miembros"));
});

test("el ciclo exige PUT y estado real, usando acción inversa móvil y badge desktop sin dejar menú abierto", async () => {
  for (const width of [1440, 390]) for (const active of [false, true]) {
    let status = active ? "Inactive" : "Active"; let open = false; let checked = false; let writes = 0;
    const next = active ? "Active" : "Inactive";
    const response = { url: () => "https://localtest.me/api/companies/propia/status", request: () => ({ method: () => "PUT" }), status: () => 200 };
    const write = async () => { status = next; open = false; writes++; };
    const item = (name) => ({ click: async () => { assert.equal(open, true); if (active) await write(); else open = false; }, waitFor: async () => { assert.equal(name, active ? "Inactivar" : "Activar"); assert.equal(status, next); assert.equal(open, true); checked = true; } });
    const menu = { waitFor: async (options) => assert.equal(open, options?.state !== "hidden"), getByRole: (role, options) => { assert.equal(role, "menuitem"); assert.equal(options.exact, true); return item(options.name); } };
    const sheet = { waitFor: menu.waitFor, getByRole: (role) => { assert.equal(role, "menu"); return menu; } };
    const desktopMenu = { filter: () => desktopMenu, last: () => menu };
    const title = { filter: () => title, first: () => title, innerText: async () => "Empresa propia" };
    const page = {
      viewportSize: () => ({ width }),
      waitForResponse: async (predicate) => { assert.equal(predicate(response), true); return response; },
      keyboard: { press: async (key) => { assert.equal(key, "Escape"); open = false; } },
      getByText: (label) => { assert.equal(width, 1440, "La ficha móvil comunica el estado mediante el menú."); assert.equal(label, active ? "Activa" : "Inactiva"); return { first: () => ({ waitFor: async () => { assert.equal(status, next); checked = true; } }) }; },
      getByRole: (role, { name } = {}) => {
        if (role === "heading") return title;
        if (role === "menu") { assert.equal(width, 1440); return desktopMenu; }
        if (role === "button") { assert.equal(name, "Más acciones"); return { waitFor: async (options) => assert.deepEqual(options, { state: "visible" }), getAttribute: async () => "dialog", click: async () => { open = !open; }, focus: async () => {}, press: async (key) => { assert.equal(key, "Enter"); open = true; } }; }
        assert.equal(role, "dialog");
        if (name) { assert.equal(width, 390); assert.equal(name, "Empresa propia"); return sheet; }
        assert.equal(open, false, "La confirmación se usa después del cierre de la hoja."); return { getByRole: () => ({ click: write }) };
      },
    };
    const h = { width, api: async (target, route) => { assert.equal(target, page); assert.equal(route, "/api/companies/propia"); return { status: () => 200, json: async () => ({ status }) }; } };
    assert.equal((await roles.companyStatus(h, page, { id: "propia" }, active)).status, next);
    assert.equal(writes, 1); assert.equal(checked, true); assert.equal(open, false);
  }
});

test("deshabilitar espera la elección móvil y confirma un único PUT antes de verificar el estado persistido", async () => {
  for (const width of [1440, 390]) {
    let sheetOpen = false; let sheetClosed = false; let chosen = false; let confirmed = false; let writes = 0; let persisted = "Inactive";
    const response = { url: () => "https://localtest.me/api/users/propio", request: () => ({ method: () => "PUT" }), status: () => 200 };
    const option = { click: async () => { chosen = true; sheetOpen = false; } };
    const sheet = {
      getByText: () => option,
      waitFor: async ({ state }) => { assert.equal(state, "hidden"); assert.equal(chosen, true); assert.equal(sheetOpen, false); sheetClosed = true; },
      getByRole: () => ({ check: async () => { assert.fail("El radio sr-only no es el destino visible de la elección móvil."); } }),
    };
    const page = {
      goto: async (url) => { assert.equal(new URL(url).pathname, "/org/usuarios/propio"); },
      waitForResponse: async (predicate) => { assert.equal(predicate(response), true); return response; },
      getByRole: (role, { name } = {}) => {
        if (role === "region") return { getByRole: () => ({ click: async () => { sheetOpen = true; } }) };
        if (role === "combobox") return { click: async () => {} };
        if (role === "option") return option;
        if (role === "dialog") return name === "Estado" ? sheet : { getByRole: () => ({ click: async () => { assert.equal(confirmed, true); writes++; } }) };
        assert.equal(role, "button"); assert.equal(name, "Guardar cambios");
        return { click: async () => { assert.equal(chosen, true); if (width === 390) assert.equal(sheetClosed, true); confirmed = true; } };
      },
    };
    const h = { width, base: "https://localtest.me", api: async (target, route) => { assert.equal(target, page); assert.equal(route, "/api/users/propio"); assert.equal(writes, 1); return { status: () => 200, json: async () => ({ state: persisted }) }; } };
    assert.equal(typeof roles.disableMember, "function");
    await roles.disableMember(h, page, "propio"); assert.equal(writes, 1);
    writes = 0; confirmed = false; persisted = "Active";
    await assert.rejects(() => roles.disableMember(h, page, "propio"), /Inactive/u, "Un PUT exitoso no reemplaza la lectura del estado persistido.");
  }
});
