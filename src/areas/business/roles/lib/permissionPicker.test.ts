import { describe, expect, it } from "vitest";
import type { PermissionGroupResponse } from "@/shared/api/types";
import {
  groupsForScope,
  isAreaExpanded,
  permissionCountInScope,
  selectionCount,
  withGroup,
  withPermission,
} from "./permissionPicker";

const groups: PermissionGroupResponse[] = [
  { area: "roles", name: "Roles", permissions: [
    { code: "roles.read", name: "Ver roles", description: "" },
    { code: "roles.manage", name: "Administrar roles", description: "" },
  ] },
  { area: "company", name: "Miembros de empresa", permissions: [
    { code: "company.members.read", name: "Ver miembros", description: "" },
    { code: "company.members.manage", name: "Administrar miembros", description: "" },
  ] },
  { area: "users", name: "Usuarios", permissions: [{ code: "users.read", name: "Ver usuarios", description: "" }] },
];

describe("permissionPicker", () => {
  it("un rol de la organización ve los permisos de la organización; uno de empresa, los de empresa; sin alcance, nada", () => {
    expect(groupsForScope(groups, "Organization").map((group) => group.area)).toEqual(["roles", "users"]);
    expect(groupsForScope(groups, "SpecificCompany").map((group) => group.area)).toEqual(["company"]);
    expect(groupsForScope(groups, "AnyCompany").map((group) => group.area)).toEqual(["company"]);
    expect(groupsForScope(groups, null)).toEqual([]);
  });

  it("cuenta los permisos del rol que valen en su alcance (la columna «Permisos»)", () => {
    const codes = ["roles.read", "company.members.read", "company.members.manage"];
    expect(permissionCountInScope(codes, "Organization")).toBe(1);
    expect(permissionCountInScope(codes, "SpecificCompany")).toBe(2);
  });

  it("«1 de 2»: los elegidos de un grupo o de todos los que se ven", () => {
    const visible = groupsForScope(groups, "Organization");
    expect(selectionCount(visible[0].permissions, ["roles.read", "company.members.read"])).toEqual({ selected: 1, total: 2 });
    expect(selectionCount(visible.flatMap((group) => group.permissions), ["roles.read", "users.read"])).toEqual({ selected: 2, total: 3 });
  });

  it("marcar un permiso o un grupo deja la lista ordenada y sin repetidos, para compararla con lo guardado", () => {
    expect(withPermission(["users.read"], "roles.read", true)).toEqual(["roles.read", "users.read"]);
    expect(withPermission(["roles.read", "users.read"], "roles.read", true)).toEqual(["roles.read", "users.read"]);
    expect(withPermission(["roles.read", "users.read"], "roles.read", false)).toEqual(["users.read"]);
    expect(withGroup(["users.read"], ["roles.read", "roles.manage"], true)).toEqual(["roles.manage", "roles.read", "users.read"]);
    expect(withGroup(["roles.manage", "roles.read", "users.read"], ["roles.read", "roles.manage"], false)).toEqual(["users.read"]);
  });

  it("al entrar, un grupo está abierto si tiene algo marcado; abrirlo o cerrarlo a mano manda", () => {
    const [roles, users] = groupsForScope(groups, "Organization");
    expect(isAreaExpanded({}, roles, ["roles.read"])).toBe(true);
    expect(isAreaExpanded({}, users, ["roles.read"])).toBe(false);
    expect(isAreaExpanded({ roles: false }, roles, ["roles.read"])).toBe(false);
    expect(isAreaExpanded({ users: true }, users, [])).toBe(true);
  });
});
