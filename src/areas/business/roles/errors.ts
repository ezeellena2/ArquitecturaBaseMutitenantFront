import { ApiError } from "@/shared/api/ApiError";

/// Los datos del editor de roles que pueden llevar un error debajo.
export type RoleField = "name" | "description" | "scope" | "permissions";

const fields: Readonly<Record<string, RoleField>> = {
  "Roles.Role.AlreadyExists": "name",
  "Roles.Role.SystemRoleNameReserved": "name",
  "Roles.Role.NameRequired": "name",
  "Roles.Role.NameTooLong": "name",
  "Roles.Role.DescriptionTooLong": "description",
  "Roles.Role.InvalidScope": "scope",
  "Roles.Role.CompanyRequired": "scope",
  "Roles.Role.CompanyNotAllowed": "scope",
  "Roles.Role.PermissionNotFound": "permissions",
  "Roles.Role.PermissionScopeInvalid": "permissions",
};

/// Tablero Rol: lo que el back rechaza de un dato («Ya existe un rol con ese nombre.») va debajo de ese dato, con el
/// texto del back; lo demás (el 409 de otra persona, un rol de sistema) va donde lo pone `useEditPage`.
export function roleErrorField(error: unknown): RoleField | null {
  return error instanceof ApiError && error.code ? fields[error.code] ?? null : null;
}
