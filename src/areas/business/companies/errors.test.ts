import { describe, expect, it } from "vitest";
import { ApiError } from "@/shared/api/ApiError";
import { companyErrorField, memberErrorField } from "./errors";

const rejected = (code: string, status = 400) => new ApiError(status, { status, code, detail: "Texto del back." });

describe("companyErrorField", () => {
  // Tableros Empresas y Empresa: lo que el back rechaza de un dato va debajo de ese dato, con el texto del back.
  it.each([
    ["Tenancy.Company.NameRequired", "name"],
    ["Tenancy.Company.NameTooLong", "name"],
    ["TaxIds.TaxId.Invalid", "taxNumber"],
    ["Tenancy.Company.TimeZoneRequired", "timeZoneId"],
    ["Tenancy.Company.TimeZoneUnavailable", "timeZoneId"],
  ])("%s va en el campo %s", (code, field) => {
    expect(companyErrorField(rejected(code))).toBe(field);
  });

  // Tableros Empresas y M-Empresas («Crear empresa: ya hay una con ese CUIT»): el CUIT repetido va en la franja.
  it("el CUIT repetido, el 409 de otra persona y lo que no es del back no tienen campo", () => {
    expect(companyErrorField(rejected("Tenancy.Company.TaxIdAlreadyUsed", 409))).toBeNull();
    expect(companyErrorField(rejected("General.ConcurrencyConflict", 409))).toBeNull();
    expect(companyErrorField(new Error("bug"))).toBeNull();
  });
});

describe("memberErrorField", () => {
  it.each([
    ["Companies.Membership.AlreadyExists", "memberId"],
    ["Companies.Membership.MemberInactive", "memberId"],
    ["Roles.Role.NotFound", "roleIds"],
    ["Roles.RoleAssignment.CompanyRequired", "roleIds"],
    ["Roles.RoleAssignment.CompanyNotAllowed", "roleIds"],
    ["Roles.RoleAssignment.CompanyMismatch", "roleIds"],
  ])("%s va en el campo %s", (code, field) => {
    expect(memberErrorField(rejected(code))).toBe(field);
  });

  // Tablero Empresa (v97): la regla del último administrador va en la franja del diálogo, como el 409.
  it("el último administrador, la empresa inactiva, el 409 y lo que no es del back no tienen campo", () => {
    expect(memberErrorField(rejected("Companies.Membership.LastCompanyAdmin", 409))).toBeNull();
    expect(memberErrorField(rejected("Tenancy.Company.Inactive", 409))).toBeNull();
    expect(memberErrorField(rejected("General.ConcurrencyConflict", 409))).toBeNull();
    expect(memberErrorField(new Error("bug"))).toBeNull();
  });
});
