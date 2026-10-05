import { describe, expect, it } from "vitest";
import { ApiError } from "@/shared/api/ApiError";
import { roleErrorField } from "./errors";

const rejected = (code: string, status = 409) => new ApiError(status, { status, code, detail: "Texto del back." });

describe("roleErrorField", () => {
  // Tablero Rol: lo que el back rechaza de un dato va debajo de ese dato; lo demás, en la franja de la ficha.
  it.each([
    ["Roles.Role.AlreadyExists", "name"],
    ["Roles.Role.SystemRoleNameReserved", "name"],
    ["Roles.Role.NameRequired", "name"],
    ["Roles.Role.NameTooLong", "name"],
    ["Roles.Role.DescriptionTooLong", "description"],
    ["Roles.Role.InvalidScope", "scope"],
    ["Roles.Role.CompanyRequired", "scope"],
    ["Roles.Role.CompanyNotAllowed", "scope"],
    ["Roles.Role.PermissionNotFound", "permissions"],
    ["Roles.Role.PermissionScopeInvalid", "permissions"],
  ])("%s va en el campo %s", (code, field) => {
    expect(roleErrorField(rejected(code))).toBe(field);
  });

  it("el 409 de otra persona, un rol de sistema y lo que no es del back no tienen campo", () => {
    expect(roleErrorField(rejected("General.ConcurrencyConflict"))).toBeNull();
    expect(roleErrorField(rejected("Roles.Role.SystemRoleCannotChange", 403))).toBeNull();
    expect(roleErrorField(new Error("bug"))).toBeNull();
  });
});
