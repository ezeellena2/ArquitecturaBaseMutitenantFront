import { describe, expect, it } from "vitest";
import type { PermissionGroupResponse } from "@/shared/api/types";
import { groupsForScope, permissionCountInScope } from "./permissionPicker";

const groups: PermissionGroupResponse[] = [
  { area: "users", name: "Usuarios", permissions: [
    { code: "users.read", name: "Ver usuarios", description: "Consultar la lista.", includes: [], grantable: true },
    { code: "users.invite", name: "Invitar usuarios", description: "Enviar una invitación.", includes: ["users.read"], grantable: true },
    { code: "users.manage", name: "Administrar usuarios", description: "Editar y dar de baja.", includes: ["users.read"], grantable: true },
  ] },
  { area: "roles", name: "Roles", permissions: [
    { code: "roles.read", name: "Ver roles", description: "", includes: [], grantable: true },
    { code: "roles.manage", name: "Administrar roles", description: "", includes: ["roles.read"], grantable: false },
  ] },
  { area: "company", name: "Miembros de empresa", permissions: [
    { code: "company.members.read", name: "Ver miembros", description: "", includes: [], grantable: true },
    { code: "company.members.manage", name: "Administrar miembros", description: "", includes: ["company.members.read"], grantable: true },
  ] },
];

describe("permissionPicker", () => {
  it("un rol de la organización ve los permisos de la organización; uno de empresa, los de empresa; sin alcance, nada", () => {
    expect(groupsForScope(groups, "Organization").map((group) => group.area)).toEqual(["users", "roles"]);
    expect(groupsForScope(groups, "SpecificCompany").map((group) => group.area)).toEqual(["company"]);
    expect(groupsForScope(groups, "AnyCompany").map((group) => group.area)).toEqual(["company"]);
    expect(groupsForScope(groups, null)).toEqual([]);
  });

  it("cuenta los permisos del rol que valen en su alcance (la columna «Permisos»)", () => {
    const codes = ["roles.read", "company.members.read", "company.members.manage"];
    expect(permissionCountInScope(codes, "Organization")).toBe(1);
    expect(permissionCountInScope(codes, "SpecificCompany")).toBe(2);
  });
});
