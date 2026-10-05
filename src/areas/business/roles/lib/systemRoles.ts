import type { RoleResponse } from "@/shared/api/types";

type Translate = (key: string) => string;
type Role = Pick<RoleResponse, "name" | "isSystemRole" | "description">;

/// Los roles de sistema llegan con su nombre interno (back: los roles de sistema de cada organización); en pantalla van
/// con el suyo: «Dueño» y «Administrador».
const systemRoleTexts: Readonly<Record<string, { name: string; description: string }>> = {
  TenantAdmin: { name: "roles:systemRoles.owner", description: "roles:systemRoles.ownerDescription" },
  CompanyAdmin: { name: "roles:systemRoles.companyAdmin", description: "roles:systemRoles.companyAdminDescription" },
};

const systemTexts = (role: Role) => role.isSystemRole ? systemRoleTexts[role.name] : undefined;

export function displayRoleName(role: Pick<Role, "name" | "isSystemRole">, t: Translate): string {
  const texts = systemTexts({ ...role, description: null });
  return texts ? t(texts.name) : role.name;
}

/// La del back; si un rol de sistema no la trae, la suya.
export function displayRoleDescription(role: Role, t: Translate): string | null {
  if (role.description) return role.description;
  const texts = systemTexts(role);
  return texts ? t(texts.description) : null;
}
