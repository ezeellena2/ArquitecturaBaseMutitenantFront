import assert from "node:assert/strict";
import test from "node:test";
import { backendUseCases } from "./e2e-completo-inventario-back.mjs";
import { guidedCases, screens } from "./e2e-completo-inventario-front.mjs";
import { roleSupplementDefinitions, assertPermissionCatalog, assertAssignedRoleUnchanged, assertCompanyOnlyPermissions, assertCompanyCyclePreserved } from "./e2e-completo-roles-complemento.mjs";

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
