import type { Column } from "@/shared/ui/DataTable";
import type { RoleResponse, RoleScope } from "@/shared/api/types";
import { Link } from "react-router";

type TranslateRole = (key: string) => string;

const roleColumnDefinitions = {
  name: { id: "name", header: "roles:columns.name", type: "text", mobile: "primary", sortable: true, value: (role: RoleResponse) => role.name },
  scope: { id: "scope", header: "roles:columns.scope", type: "text", mobile: "status", value: (role: RoleResponse) => role.scope },
  userCount: { id: "userCount", header: "roles:columns.users", type: "integer", value: (role: RoleResponse) => role.userCount },
  permissions: { id: "permissions", header: "roles:columns.permissions", type: "integer", value: (role: RoleResponse) => role.permissions.length },
} satisfies Record<string, Column<RoleResponse>>;

export const roleColumns: Column<RoleResponse>[] = Object.values(roleColumnDefinitions);

function scopeLabel(scope: RoleScope, t: TranslateRole, companyName?: string): string {
  switch (scope) {
    case "Organization": return t("roles:scope.organization");
    case "AnyCompany": return t("roles:scope.company");
    case "SpecificCompany": return companyName ?? t("roles:scope.specificCompany");
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

export function createRoleColumns(t: TranslateRole, companyNames: ReadonlyMap<string, string> = new Map()): Column<RoleResponse>[] {
  return [
    {
      // Anchos del tablero Roles: 1.6fr, 1.3fr, 100 px y 100 px, más los márgenes de cada celda.
      ...roleColumnDefinitions.name,
      header: t("roles:columns.name"),
      type: "custom",
      className: "w-[39%]",
      cell: (role) => <div className="min-w-0">
        <Link className="block truncate font-medium text-[var(--t1)] hover:underline" to={`/org/roles/${encodeURIComponent(role.id)}`}>{displayRoleName(role, t)}</Link>
        {role.isSystemRole ? <span className="block text-xs text-[var(--t3)]">{t("roles:system")}</span> : null}
      </div>,
    },
    { ...roleColumnDefinitions.scope, header: t("roles:columns.scope"), type: "custom", cell: (role) => <span>{scopeLabel(role.scope, t, role.companyId ? companyNames.get(role.companyId) : undefined)}</span> },
    { ...roleColumnDefinitions.userCount, header: t("roles:columns.users"), className: "w-[112px]" },
    { ...roleColumnDefinitions.permissions, header: t("roles:columns.permissions"), className: "w-[112px]", value: visiblePermissionCount },
  ];
}
