import { ApiError } from "@/shared/api/ApiError";

export const tenantStateConflictCodes = ["Tenancy.Tenant.InvalidTransition"] as const;
export function tenantCreateErrorField(error: ApiError): "name" | "firstCompanyName" | "ownerEmail" | undefined {
  switch (error.code) {
    case "Tenancy.Tenant.NameRequired":
    case "Tenancy.Tenant.NameTooLong": return "name";
    case "Tenancy.Company.NameRequired":
    case "Tenancy.Company.NameTooLong": return "firstCompanyName";
    case "Users.Email.Invalid": return "ownerEmail";
    default: return undefined;
  }
}
export function isTenantStateConflict(error: unknown): boolean {
  return error instanceof ApiError && (error.code === "General.ConcurrencyConflict" || error.status === 409 && tenantStateConflictCodes.some((code) => code === error.code));
}
