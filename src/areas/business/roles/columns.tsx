import type { Column } from "@/shared/ui/DataTable";
import type { RoleResponse, RoleScope } from "@/shared/api/types";
import { Link } from "react-router";
import type { ReactNode } from "react";
import { ListCard } from "@/shared/ui/app/ListRow";
import { NumberText } from "@/shared/ui/format/NumberText";
import { permissionCountInScope } from "./lib/permissionPicker";

type TranslateRole = (key: string) => string;

const roleColumnDefinitions = {
  name: { id: "name", header: "roles:columns.name", type: "text", mobile: "primary", sortable: true, value: (role: RoleResponse) => role.name },
  scope: { id: "scope", sortable: true, sortAs: "status", header: "roles:columns.scope", type: "text", mobile: "status", value: (role: RoleResponse) => role.scope },
  userCount: { id: "userCount", sortable: true, header: "roles:columns.users", type: "integer", value: (role: RoleResponse) => role.userCount },
  permissions: { id: "permissions", sortable: true, header: "roles:columns.permissions", type: "integer", value: (role: RoleResponse) => role.permissions.length },
} satisfies Record<string, Column<RoleResponse>>;

export const roleColumns: Column<RoleResponse>[] = Object.values(roleColumnDefinitions);

/// «Vale en»: toda la organización, cada empresa (los roles que ya valen así) o el nombre de la empresa.
export function roleScopeLabel(scope: RoleScope, t: TranslateRole, companyName?: string): string {
  switch (scope) {
    case "Organization": return t("roles:scope.organization");
    case "AnyCompany": return t("roles:scope.company");
    case "SpecificCompany": return companyName ?? t("roles:scope.specificCompany");
  }
}

const visiblePermissionCount = (role: RoleResponse) => permissionCountInScope(role.permissions, role.scope);

export function createRoleColumns(t: TranslateRole): Column<RoleResponse>[] {
  return [
    {
      // Tablero Roles (base de la 12): un dato por celda; si es de sistema o propio va en su columna, «Tipo».
      ...roleColumnDefinitions.name,
      header: t("roles:columns.name"),
      type: "custom",
      className: "w-[30%]",
      cell: (role) => <Link className="font-medium text-[var(--t1)] hover:underline" to={`/org/roles/${encodeURIComponent(role.id)}`}>{role.name}</Link>,
    },
    { id: "type", sortable: true, sortAs: "status", header: t("roles:columns.type"), type: "custom", className: "w-36", cell: (role) => <span>{t(role.isSystemRole ? "roles:system" : "roles:custom")}</span> },
    { ...roleColumnDefinitions.scope, header: t("roles:columns.scope"), type: "custom", cell: (role) => <span>{roleScopeLabel(role.scope, t, role.companyName ?? undefined)}</span> },
    { ...roleColumnDefinitions.userCount, header: t("roles:columns.users"), className: "w-28" },
    { ...roleColumnDefinitions.permissions, header: t("roles:columns.permissions"), className: "w-28", value: visiblePermissionCount },
  ];
}

/// Tablero M-Filas-Base2 (M-Roles, 263): en el teléfono cada rol es una tarjeta con su tipo, dónde vale, cuántos lo tienen y
/// cuántos permisos tiene, cada dato con su nombre.
export function rolePhoneRow(role: RoleResponse, t: TranslateRole, trailing: ReactNode): ReactNode {
  return <ListCard key={role.id} to={`/org/roles/${encodeURIComponent(role.id)}`} title={role.name} fields={[
    { label: t("roles:columns.type"), value: t(role.isSystemRole ? "roles:system" : "roles:custom") },
    { label: t("roles:columns.scope"), value: roleScopeLabel(role.scope, t, role.companyName ?? undefined) },
    { label: t("roles:columns.users"), value: <NumberText value={role.userCount} /> },
    { label: t("roles:columns.permissions"), value: <NumberText value={visiblePermissionCount(role)} /> },
  ]} trailing={trailing} />;
}
