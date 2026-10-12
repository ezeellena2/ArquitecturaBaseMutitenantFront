import { Pencil } from "lucide-react";
import { usePagedQuery } from "@/shared/hooks/usePagedQuery";
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
 * SpecificCompany). El servidor pagina los roles propios; el pie es el mismo que el de Miembros.
 */
export function CompanyRolesTab({ roles }: { roles: CompanyRoles }) {
  const { t } = useTranslation(["companies", "roles", "common"]);
  const navigate = useNavigate();
  const { result: query, paginationProps } = usePagedQuery({ filterKeys: [] as const, prefix: "roles.", defaultSort: "name",
    toQuery: ({ page, pageSize }) => ({ page, pageSize, sort: "name" }),
    queryKey: (page) => [...roles.own.queryKeyRoot, page], queryFn: (page) => roles.own.queryFn(page),
    enabled: roles.canReadRoles, staleTime: 30_000, meta: { silent: true } });
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
    <DataTable columns={columns} rows={query.data?.items ?? []} rowKey={(role) => role.id}
      mobileRow={(role) => <ListRow key={role.id} to={`/org/roles/${encodeURIComponent(role.id)}`} title={role.name}
        meta={t("roles:phone.users", { count: role.userCount })} lines={[t("roles:phone.permissions", { count: role.permissions.length })]} trailing={roleActions(role)} />}
      isLoading={query.isPending} isFetching={query.isFetching} error={query.error ? apiErrorMessage(query.error, t) : undefined}
      onRetry={() => { void query.refetch(); }} emptyTitle={t("companies:detail.rolesEmpty")} />
    {paginationProps ? <Pagination {...paginationProps} /> : null}
  </Surface>;
}
