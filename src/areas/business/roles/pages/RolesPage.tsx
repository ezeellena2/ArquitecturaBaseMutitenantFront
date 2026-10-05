import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { ShieldIcon } from "@/shared/ui/icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import { usePermissions } from "@/auth/usePermissions";
import { usePagedQuery } from "@/shared/hooks/usePagedQuery";
import { apiErrorMessage, toastActionError } from "@/shared/api/errorMessage";
import type { Column } from "@/shared/ui/DataTable";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { DataTable } from "@/shared/ui/DataTable";
import { FilterBar } from "@/shared/ui/FilterBar";
import { Page } from "@/shared/ui/Page";
import { Pagination } from "@/shared/ui/Pagination";
import { RowActions } from "@/shared/ui/RowActions";
import { Surface } from "@/shared/ui/Surface";
import { toastError } from "@/shared/ui/sonner";
import { toast } from "sonner";
import type { RoleResponse } from "@/shared/api/types";
import {
  deleteRole,
  fetchRoles,
  fetchCompanyOptions,
  roleCompanyOptionsQueryKey,
  rolesQueryKey,
  rolesQueryKeyRoot,
  type RolesQuery,
} from "../api/roles";
import { createRoleColumns, rolePhoneRow } from "../columns";
import { displayRoleName } from "../lib/systemRoles";

// «Vale en» (tablero Roles): toda la organización o una empresa por nombre, en un solo filtro.
const roleFilterKeys = ["vale"] as const;
const roleCountScopes = [undefined, "Organization", "Company"] as const;

export function RolesPage() {
  const { t } = useTranslation(["roles", "common"]);
  const { can } = usePermissions();
  const canManage = can("roles.manage");
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { filters, pagination, query, result: roles, paginationProps } = usePagedQuery({
    filterKeys: roleFilterKeys,
    defaultSort: "name",
    toQuery: (page, values): RolesQuery => ({
      ...page,
      scope: values.vale === "Organization" ? "Organization" : undefined,
      companyId: values.vale && values.vale !== "Organization" ? values.vale : undefined,
    }),
    queryKey: rolesQueryKey, queryFn: fetchRoles, meta: { silent: true, blocksView: true },
  });
  const vale = filters.values.vale;
  const debouncedSearch = query.search ?? undefined;
  const companies = useQuery({
    queryKey: roleCompanyOptionsQueryKey,
    queryFn: fetchCompanyOptions,
    enabled: can("companies.read"),
    meta: { silent: true },
  });
  const activeCompanies = (companies.data?.items ?? []).filter((company) => company.status === "Active");
  const companyCounts = useQueries({ queries: activeCompanies.map((company) => ({
    queryKey: [...rolesQueryKeyRoot, "company-count", company.id, debouncedSearch ?? ""],
    queryFn: () => fetchRoles({ page: 1, pageSize: 10, search: debouncedSearch || undefined, companyId: company.id }),
    meta: { silent: true },
  })) });
  // Tablero Roles: el menú de «Vale en» cuenta lo que coincide con la búsqueda; el resumen de la banda, todos los roles.
  // Sin búsqueda son las mismas consultas.
  const countsFor = (search: string) => roleCountScopes.map((countScope) => ({
    queryKey: [...rolesQueryKeyRoot, "scope-count", countScope ?? "all", search],
    queryFn: () => fetchRoles({ page: 1, pageSize: 10, search: search || undefined, scope: countScope }),
    meta: { silent: true },
  }));
  const scopeCounts = useQueries({ queries: countsFor(debouncedSearch ?? "") });
  const totalCounts = useQueries({ queries: countsFor("") });
  const [roleToDelete, setRoleToDelete] = useState<RoleResponse | null>(null);
  const remove = useMutation({
    mutationFn: (role: RoleResponse) => deleteRole(role.id, role.version),
    onSuccess: async (_result, role) => {
      setRoleToDelete(null);
      toast.success(t("roles:removed", { name: role.name }));
      await queryClient.invalidateQueries({ queryKey: rolesQueryKeyRoot });
    },
    onError: (error) => toastActionError(error, t),
  });

  const companyNames = new Map((companies.data?.items ?? []).map((company) => [company.id, company.name]));
  const rowActions = (role: RoleResponse) => <RowActions
        label={t("roles:rowActions", { name: displayRoleName(role, t) })}
        title={displayRoleName(role, t)}
        actions={[
          { label: t("roles:viewPermissions"), accessibleName: t("roles:viewPermissions"), icon: Eye, onSelect: () => { void navigate(`/org/roles/${encodeURIComponent(role.id)}`); }, hidden: !role.isSystemRole && canManage },
          { label: t("roles:edit"), accessibleName: t("roles:edit"), icon: Pencil, onSelect: () => { void navigate(`/org/roles/${encodeURIComponent(role.id)}`); }, hidden: role.isSystemRole || !canManage },
          { label: t("roles:deactivate"), accessibleName: t("roles:deactivate"), icon: Trash2, onSelect: () => {
            if (role.userCount > 0) {
              toastError(t("roles:errors.hasUsers", { count: role.userCount, name: role.name }));
            } else {
              setRoleToDelete(role);
            }
          }, destructive: true, hidden: role.isSystemRole || !canManage },
        ]}
      />;
  const columns: Column<RoleResponse>[] = [
    ...createRoleColumns(t, companyNames),
    { id: "actions", header: t("roles:columns.actions"), type: "actions", cell: rowActions },
  ];

  const listSummary = roles.data ? totalCounts.every((count) => count.data !== undefined)
    ? t("roles:listSummary", { total: totalCounts[0].data?.totalCount ?? roles.data.totalCount, count: totalCounts[0].data?.totalCount ?? roles.data.totalCount,
      organization: totalCounts[1].data?.totalCount ?? 0, company: totalCounts[2].data?.totalCount ?? 0 })
    : t("roles:listSummaryFallback", { count: roles.data.totalCount }) : undefined;
  // Sin filtro el botón dice «Vale en: todos» y el menú ofrece «Todos», como el tablero.
  const filterValue = vale ?? "";
  const countFor = (index: number) => scopeCounts[index].data?.totalCount;

  return <>
    <Page
      icon={ShieldIcon}
      title={t("roles:title")}
      summary={listSummary}
      phoneBody="flush"
      fab={canManage ? { label: t("roles:create"), to: "/org/roles/nuevo" } : undefined}
      actions={canManage ? <Button asChild><Link to="/org/roles/nuevo"><Plus aria-hidden="true" className="size-3.5" strokeWidth={2.25} />{t("roles:create")}</Link></Button> : undefined}
    >
      <div className="flex flex-col gap-3 md:gap-3.5">
        <FilterBar phoneTools="filter"
          label={t("roles:filters.label")}
          searchLabel={t("roles:filters.search")}
          searchValue={pagination.search ?? ""}
          onSearchChange={pagination.setSearch}
          filters={[{
            key: "vale",
            label: t("roles:filters.scope"),
            menuLabel: t("roles:filters.scopeMenu"),
            value: filterValue,
            active: vale !== undefined,
            onChange: (value) => filters.setFilter("vale", value === "all" ? undefined : value),
            options: [
              { value: "all", label: t("roles:filters.allScopes"), count: countFor(0) },
              { value: "Organization", label: t("roles:scope.organization"), count: countFor(1) },
              ...activeCompanies.map((company, index) => ({ value: company.id, label: company.name, count: companyCounts[index]?.data?.totalCount })),
            ],
          }]}
          clearLabel={t("common:actions.clear")}
          onClear={filters.clear}
        />
        <Surface className="overflow-hidden" phoneFlush>
          <DataTable
            columns={columns}
            mobileRow={(role) => rolePhoneRow(role, t, companyNames, rowActions(role))}
            rows={roles.data?.items ?? []}
            rowKey={(role) => role.id}
            isLoading={roles.isPending}
            isFetching={roles.isFetching}
            error={roles.error ? apiErrorMessage(roles.error, t) : undefined}
            onRetry={() => { void roles.refetch(); }}
            emptyTitle={vale || pagination.search ? t("roles:emptyFiltered") : t("roles:empty")}
            emptyAction={vale || pagination.search ? <Button type="button" variant="outline" onClick={filters.clear}>{t("common:actions.clearFilters")}</Button> : undefined}
            sort={pagination.sort}
            onSortChange={pagination.toggleSort}
          />
          {paginationProps ? <Pagination {...paginationProps} /> : null}
        </Surface>
      </div>
    </Page>
    <ConfirmDialog
      open={roleToDelete !== null}
      onOpenChange={(open) => { if (!open) setRoleToDelete(null); }}
      title={t("roles:confirmDeactivate", { name: roleToDelete?.name ?? "" })}
      description={t("roles:confirmDeactivateDescription")}
      confirmLabel={t("roles:deactivate")}
      destructive
      onConfirm={() => { if (roleToDelete) remove.mutate(roleToDelete); }}
    />
  </>;
}
