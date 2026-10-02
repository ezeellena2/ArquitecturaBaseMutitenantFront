import type { Column } from "@/shared/ui/DataTable";
import type { RoleResponse, RoleScope } from "@/shared/api/types";
import { Link } from "react-router";

type TranslateRole = (key: string) => string;

const roleColumnDefinitions = {
  name: { id: "name", header: "roles:columns.name", type: "text", mobile: "primary", sortable: true, value: (role: RoleResponse) => role.name },
  description: { id: "description", header: "roles:columns.description", type: "text", priority: "low", value: (role: RoleResponse) => role.description },
  scope: { id: "scope", header: "roles:columns.scope", type: "text", mobile: "status", value: (role: RoleResponse) => role.scope },
  isSystemRole: { id: "isSystemRole", header: "roles:columns.type", type: "text", value: (role: RoleResponse) => role.isSystemRole ? "roles:system" : "roles:custom" },
  userCount: { id: "userCount", header: "roles:columns.users", type: "integer", value: (role: RoleResponse) => role.userCount },
  permissions: { id: "permissions", header: "roles:columns.permissions", type: "integer", value: (role: RoleResponse) => role.permissions.length },
} satisfies Record<string, Column<RoleResponse>>;

export const roleColumns: Column<RoleResponse>[] = Object.values(roleColumnDefinitions);

function scopeLabel(scope: RoleScope, t: TranslateRole): string {
  switch (scope) {
    case "Organization": return t("roles:scope.organization");
    case "AnyCompany": return t("roles:scope.company");
    case "SpecificCompany": return t("roles:scope.specificCompany");
  }
}

export function displayRoleName(role: RoleResponse, t: TranslateRole): string {
  if (!role.isSystemRole) return role.name;
  if (role.name === "TenantAdmin") return t("roles:systemRoles.owner");
  if (role.name === "CompanyAdmin") return t("roles:systemRoles.companyAdmin");
  return role.name;
}

export function displayRoleDescription(role: RoleResponse, t: TranslateRole): string | null {
  if (role.description) return role.description;
  if (role.name === "TenantAdmin") return t("roles:systemRoles.ownerDescription");
  if (role.name === "CompanyAdmin") return t("roles:systemRoles.companyAdminDescription");
  return null;
}

function visiblePermissionCount(role: RoleResponse): number {
  return role.permissions.filter((code) => role.scope === "Organization"
    ? !code.startsWith("company.")
    : code.startsWith("company.")).length;
}

export function createRoleColumns(t: TranslateRole): Column<RoleResponse>[] {
  return [
    {
      ...roleColumnDefinitions.name,
      header: t("roles:columns.name"),
      type: "custom",
      cell: (role) => <Link className="block truncate font-medium text-[var(--marca-tx)] hover:underline" to={`/org/roles/${encodeURIComponent(role.id)}`}>{displayRoleName(role, t)}</Link>,
    },
    { ...roleColumnDefinitions.description, header: t("roles:columns.description"), value: (role) => displayRoleDescription(role, t) },
    { ...roleColumnDefinitions.scope, header: t("roles:columns.scope"), type: "custom", cell: (role) => <span>{scopeLabel(role.scope, t)}</span> },
    { ...roleColumnDefinitions.isSystemRole, header: t("roles:columns.type"), type: "custom", cell: (role) => <span>{t(role.isSystemRole ? "roles:system" : "roles:custom")}</span> },
    { ...roleColumnDefinitions.userCount, header: t("roles:columns.users") },
    { ...roleColumnDefinitions.permissions, header: t("roles:columns.permissions"), value: visiblePermissionCount },
  ];
}
