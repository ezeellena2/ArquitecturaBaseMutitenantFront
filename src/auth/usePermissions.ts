import { useMemo } from "react";
import type { MeResponse } from "@/shared/api/types";
import { useCurrentUser } from "./useCurrentUser";

/// Los permisos del catálogo del back (`Domain/Authorization/Permissions.cs`) que valen en toda la organización. Los
/// de la plataforma se suman con su backoffice (E9).
export const organizationPermissions = [
  "users.read", "users.invite", "users.manage",
  "roles.read", "roles.manage", "roles.assign",
  "companies.read", "companies.manage",
  "settings.read", "settings.manage",
  "audit.read",
  "publicpage.manage",
] as const;

/// Los que valen en una empresa del grupo.
export const companyPermissions = ["company.members.read", "company.members.manage"] as const;

export type OrganizationPermission = (typeof organizationPermissions)[number];
export type CompanyPermission = (typeof companyPermissions)[number];
export type Permission = OrganizationPermission | CompanyPermission;

export interface Permissions {
  /** Si la sesión tiene el permiso en la organización activa. */
  can: (permission: OrganizationPermission) => boolean;
  /** Si lo tiene en esa empresa: los de los roles de la organización y los de sus roles en la empresa. */
  canInCompany: (companyId: string, permission: CompanyPermission) => boolean;
  /** Si el módulo está prendido en el acceso activo; apagado, su ruta no existe. */
  hasFeature: (feature: string) => boolean;
}

/// Los permisos salen de `effectivePermissions` de /api/me. Mientras el back no llene el mapa por empresa, una empresa
/// que no figura usa los de la organización, que es lo que el back aplica con los roles de toda la organización. Los
/// permisos del front son solo experiencia de uso: decide el back.
export function permissionsOf(me: Pick<MeResponse, "effectivePermissions" | "features"> | undefined): Permissions {
  const organization: readonly string[] = me?.effectivePermissions.organization ?? [];
  const companies = me?.effectivePermissions.companies ?? {};
  const features: readonly string[] = me?.features ?? [];
  return {
    can: (permission) => organization.includes(permission),
    canInCompany: (companyId, permission) => (companies[companyId] ?? organization).includes(permission),
    hasFeature: (feature) => features.includes(feature),
  };
}

export function usePermissions(): Permissions {
  const { data } = useCurrentUser();
  return useMemo(() => permissionsOf(data), [data]);
}
