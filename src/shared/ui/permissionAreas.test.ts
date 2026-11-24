import { describe, expect, it } from "vitest";
import type { PermissionGroupResponse } from "@/shared/api/types";
import {
  allowedPermissions,
  areaHasUngrantable,
  areaHelp,
  areaStartsOpen,
  areaState,
  changePermission,
  includedBy,
  toggleArea,
} from "./permissionAreas";

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
const [users, roles] = groups;

describe("permissionAreas", () => {
  it("lo que un rol permite suma lo incluido, ordenado y sin repetidos, para compararlo con lo guardado (260)", () => {
    expect(allowedPermissions(groups, ["users.manage"])).toEqual(["users.manage", "users.read"]);
    expect(allowedPermissions(groups, ["users.manage", "users.read", "users.manage"])).toEqual(["users.manage", "users.read"]);
    expect(allowedPermissions(groups, ["unknown.code"])).toEqual(["unknown.code"]);
  });

  it("lo incluido nombra a todos los marcados que lo incluyen, en el orden del catálogo", () => {
    expect(includedBy(groups, ["users.manage", "users.invite", "users.read"], "users.read")).toEqual(["Invitar usuarios", "Administrar usuarios"]);
    expect(includedBy(groups, ["users.read"], "users.read")).toEqual([]);
  });

  it("marcar suma lo incluido; desmarcar saca solo ese y lo incluido queda", () => {
    expect(changePermission(groups, [], "users.manage", true)).toEqual(["users.manage", "users.read"]);
    expect(changePermission(groups, ["users.manage", "users.read"], "users.manage", false)).toEqual(["users.read"]);
  });

  it("la casilla del área va vacía, parcial o completa, y elige o quita el área entera", () => {
    expect(areaState(users, [])).toBe("empty");
    expect(areaState(users, ["users.read"])).toBe("partial");
    expect(areaState(users, ["users.invite", "users.manage", "users.read"])).toBe("full");
    expect(toggleArea(groups, users, ["roles.read"])).toEqual(["roles.read", "users.invite", "users.manage", "users.read"]);
    expect(toggleArea(groups, users, ["roles.read", "users.invite", "users.manage", "users.read"])).toEqual(["roles.read"]);
  });

  it("un área con un permiso que quien edita no tiene apaga su casilla (269)", () => {
    expect(areaHasUngrantable(users)).toBe(false);
    expect(areaHasUngrantable(roles)).toBe(true);
  });

  it("arranca abierta el área con algo guardado o elegido; un rol nuevo, todas cerradas", () => {
    expect(areaStartsOpen(users, ["users.read"], [])).toBe(true);
    expect(areaStartsOpen(users, [], ["users.read"])).toBe(true);
    expect(areaStartsOpen(roles, [], [])).toBe(false);
  });

  it("la (i) del área dice qué permite cada permiso, uno por renglón", () => {
    expect(areaHelp(users)).toBe("Ver usuarios — Consultar la lista.\nInvitar usuarios — Enviar una invitación.\nAdministrar usuarios — Editar y dar de baja.");
  });
});
