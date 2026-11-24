import type { PermissionGroupResponse, RoleScope } from "@/shared/api/types";

export { canonicalPermissions } from "@/shared/ui/permissionAreas";

/// Los permisos de empresa empiezan con `company.` y valen en un rol de una empresa (o de cada empresa); los demás, en
/// un rol de la organización (back: el catálogo de permisos).
function fitsScope(code: string, scope: RoleScope): boolean {
  return scope === "Organization" ? !code.startsWith("company.") : code.startsWith("company.");
}

/// Los grupos que ofrece el editor para un alcance: cada área con los permisos de ese alcance, sin las que quedan vacías.
/// Sin alcance elegido no hay nada para elegir.
export function groupsForScope(groups: readonly PermissionGroupResponse[], scope: RoleScope | null | undefined): PermissionGroupResponse[] {
  if (!scope) return [];
  return groups
    .map((group) => ({ ...group, permissions: group.permissions.filter((permission) => fitsScope(permission.code, scope)) }))
    .filter((group) => group.permissions.length > 0);
}

/// Cuántos permisos del rol valen en su alcance: la columna «Permisos» y «N permisos» del teléfono.
export function permissionCountInScope(codes: readonly string[], scope: RoleScope): number {
  return codes.filter((code) => fitsScope(code, scope)).length;
}
