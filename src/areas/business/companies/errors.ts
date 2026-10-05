import { ApiError } from "@/shared/api/ApiError";

/// Los datos de «Crear empresa» y «Editar empresa» que pueden llevar un error debajo.
export type CompanyField = "name" | "taxNumber" | "timeZoneId";

/// Los de «Agregar miembro» y «Roles de …».
export type MemberField = "memberId" | "roleIds";

// El CUIT repetido (`Tenancy.Company.TaxIdAlreadyUsed`) no está: los tableros Empresas y M-Empresas lo dibujan en la
// franja del diálogo. Tampoco el último administrador, que el tablero Empresa (v97) pone en la franja.
const companyFields: Readonly<Record<string, CompanyField>> = {
  "Tenancy.Company.NameRequired": "name",
  "Tenancy.Company.NameTooLong": "name",
  "TaxIds.TaxId.Invalid": "taxNumber",
  "Tenancy.Company.TimeZoneRequired": "timeZoneId",
  "Tenancy.Company.TimeZoneUnavailable": "timeZoneId",
};

const memberFields: Readonly<Record<string, MemberField>> = {
  "Companies.Membership.AlreadyExists": "memberId",
  "Companies.Membership.MemberInactive": "memberId",
  "Roles.Role.NotFound": "roleIds",
  "Roles.RoleAssignment.CompanyRequired": "roleIds",
  "Roles.RoleAssignment.CompanyNotAllowed": "roleIds",
  "Roles.RoleAssignment.CompanyMismatch": "roleIds",
};

const fieldOf = <TField extends string>(fields: Readonly<Record<string, TField>>, error: unknown): TField | null =>
  error instanceof ApiError && error.code ? fields[error.code] ?? null : null;

/// Como Roles: lo que el back rechaza de un dato de la empresa va debajo de ese dato, con el texto del back; lo demás
/// (el CUIT repetido, el 409 de otra persona) va en la franja del diálogo.
export function companyErrorField(error: unknown): CompanyField | null {
  return fieldOf(companyFields, error);
}

/// Lo que el back rechaza de la persona o de los roles elegidos va debajo de ese campo; lo demás, en la franja.
export function memberErrorField(error: unknown): MemberField | null {
  return fieldOf(memberFields, error);
}
