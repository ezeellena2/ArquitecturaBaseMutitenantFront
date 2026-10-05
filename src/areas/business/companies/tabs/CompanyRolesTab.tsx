import { Pencil } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import type { RoleResponse } from "@/shared/api/types";
import { ListRow } from "@/shared/ui/app/ListRow";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { Pagination } from "@/shared/ui/Pagination";
import { RowActions } from "@/shared/ui/RowActions";
import { Surface } from "@/shared/ui/Surface";
import type { CompanyRoles } from "./useCompanyRoles";

/**
 * Pestaña Roles de la ficha (tableros Empresa y M-Empresa): los roles que valen solo en esta empresa (alcance
 * SpecificCompany). Se paginan acá: el pie es el mismo que el de Miembros.
 */
export function CompanyRolesTab({ roles }: { roles: CompanyRoles }) {
  const { t } = useTranslation(["companies", "roles", "common"]);
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { query, own } = roles;
  const roleActions = (role: RoleResponse) => <RowActions label={t("companies:roleActions", { name: role.name })} title={role.name} actions={[
    { label: t("companies:actions.edit"), accessibleName: t("companies:actions.edit"), icon: Pencil, onSelect: () => { void navigate(`/org/roles/${encodeURIComponent(role.id)}`); } },
  ]} />;
  const columns: Column<RoleResponse>[] = [
    { id: "name", header: t("companies:roleColumns.name"), type: "custom", mobile: "primary",
      cell: (role) => <Link to={`/org/roles/${encodeURIComponent(role.id)}`} className="font-medium text-[var(--t1)] hover:underline">{role.name}</Link> },
    // Anchos del tablero Empresa (Roles): el rol se lleva el resto; Usuarios y Permisos, 120 px.
    { id: "userCount", header: t("companies:roleColumns.users"), type: "integer", className: "w-[132px]", value: (role) => role.userCount },
    { id: "permissions", header: t("companies:roleColumns.permissions"), type: "integer", className: "w-[132px]", value: (role) => role.permissions.length, mobile: "status" },
    { id: "actions", header: t("companies:columns.actions"), type: "actions", cell: (role) => roleActions(role) },
  ];

  return <Surface className="overflow-hidden" phoneFlush>
    <DataTable columns={columns} rows={own.slice((page - 1) * pageSize, page * pageSize)} rowKey={(role) => role.id}
      mobileRow={(role) => <ListRow key={role.id} to={`/org/roles/${encodeURIComponent(role.id)}`} title={role.name}
        meta={t("roles:phone.users", { count: role.userCount })} lines={[t("roles:phone.permissions", { count: role.permissions.length })]} trailing={roleActions(role)} />}
      isLoading={query.isPending} isFetching={query.isFetching} error={query.error ? apiErrorMessage(query.error, t) : undefined}
      onRetry={() => { void query.refetch(); }} emptyTitle={t("companies:detail.rolesEmpty")} />
    {query.data ? <Pagination page={page} pageSize={pageSize} totalCount={own.length} totalPages={Math.max(1, Math.ceil(own.length / pageSize))}
      hasPrevious={page > 1} hasNext={page * pageSize < own.length} onPageChange={setPage}
      onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} /> : null}
  </Surface>;
}
