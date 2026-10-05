import type { PermissionGroupResponse, RoleScope } from "@/shared/api/types";

type Permission = PermissionGroupResponse["permissions"][number];

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

/// «1 de 2»: cuántos de estos permisos están elegidos.
export function selectionCount(permissions: readonly Permission[], selected: readonly string[]): { selected: number; total: number } {
  return { selected: permissions.filter((permission) => selected.includes(permission.code)).length, total: permissions.length };
}

// Ordenada y sin repetidos: así lo elegido se compara con lo guardado aunque se marque en otro orden.
const canonical = (codes: Iterable<string>) => [...new Set(codes)].sort();

/// Marca o desmarca un permiso.
export function withPermission(selected: readonly string[], code: string, checked: boolean): string[] {
  return canonical(checked ? [...selected, code] : selected.filter((item) => item !== code));
}

/// La casilla de un grupo: marca o desmarca todos sus permisos.
export function withGroup(selected: readonly string[], codes: readonly string[], checked: boolean): string[] {
  return canonical(checked ? [...selected, ...codes] : selected.filter((item) => !codes.includes(item)));
}

/// Lo elegido de un rol, en la forma que usa el editor.
export function canonicalPermissions(codes: readonly string[]): string[] {
  return canonical(codes);
}

/// Tableros Rol y M-Rol: un grupo está abierto si tiene algo marcado, hasta que la persona lo abre o lo cierra.
export function isAreaExpanded(toggled: Readonly<Record<string, boolean>>, group: PermissionGroupResponse, selected: readonly string[]): boolean {
  return toggled[group.area] ?? group.permissions.some((permission) => selected.includes(permission.code));
}
