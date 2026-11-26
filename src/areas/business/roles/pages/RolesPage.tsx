import { companyOptions } from "@/shared/api/resourceOptions";
import { useResourceOptions } from "@/shared/hooks/useResourceOptions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
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
import { toast } from "sonner";
import type { RoleResponse } from "@/shared/api/types";
import { AssistantProposalMark, useAssistantProposal, useAssistantProposalConfirmation } from "@/shared/assistant-actions";
import {
  deleteRole,
  fetchRole,
  fetchRoles,
  fetchRoleCounts,
  roleCountsQueryKey,
  roleQueryKey,
  rolesQueryKey,
  rolesQueryKeyRoot,
  type RolesQuery,
} from "../api/roles";
import { createRoleColumns, rolePhoneRow } from "../columns";
import { useFormat } from "@/shared/format/useFormat";
import { countOf } from "@/shared/format/countOf";

// «Vale en» (tablero Roles): toda la organización o una empresa por nombre, en un solo filtro.
const roleFilterKeys = ["vale"] as const;

/** Dar de baja no tiene campos: lo que se confirma es cuál, que es el rol que nombra la propuesta. */
const toRemoveProposal = (): true => true;

interface RemoveVariables {
  readonly role: RoleResponse;
  readonly version: number;
  /** Con una propuesta del asistente: la tarjeta pasa a aplicada después de la baja. */
  readonly markApplied?: () => Promise<void>;
}

export function RolesPage() {
  const { t } = useTranslation(["roles", "common"]);
  const format = useFormat();
  const { can } = usePermissions();
  const canManage = can("roles.manage");
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { filters, pagination, result: roles, paginationProps } = usePagedQuery({
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
  const companies = useResourceOptions(companyOptions, can("companies.read"));
  const activeCompanies = (companies.data?.items ?? []).filter((company) => company.status === "Active");
  // El resumen cuenta todo lo de la lista: los conteos se piden una vez, sin la búsqueda ni los filtros, porque los filtros
  // no llevan cantidades (143).
  const counts = useQuery({ queryKey: roleCountsQueryKey(), queryFn: () => fetchRoleCounts(), meta: { silent: true } });
  const [roleToDelete, setRoleToDelete] = useState<RoleResponse | null>(null);
  // Confirmar-Propuesta y su M- (ADR 0068 §9): con `?proposal=<id>`, la confirmación de dar de baja abre sobre el rol que
  // nombra la propuesta, con «Propuesta del asistente» en el título, hasta que se cierra. Lo lee de nuevo para decir si
  // alguien lo tiene, como siempre: con personas, «Dar de baja» queda apagado con su motivo. Cerrarla saca `?proposal` y la
  // lista vuelve a ser la de siempre.
  const removeProposal = useAssistantProposal("roles.remove@1", toRemoveProposal);
  const proposedRoleId = removeProposal.status === "ready" ? removeProposal.proposal.target?.id : undefined;
  const proposedRole = useQuery({ queryKey: roleQueryKey(proposedRoleId ?? ""), queryFn: () => fetchRole(proposedRoleId!),
    enabled: canManage && Boolean(proposedRoleId), meta: { silent: true } });
  const removeConfirmation = useAssistantProposalConfirmation(removeProposal.status === "ready" ? removeProposal : undefined);
  const closeProposal = removeConfirmation.close;
  const removing = removeConfirmation.open && canManage && proposedRole.data && proposedRole.data.id === proposedRoleId
    && !proposedRole.data.isSystemRole && roleToDelete === null
    ? { proposal: removeConfirmation.open, role: proposedRole.data } : undefined;
  const remove = useMutation({
    mutationFn: ({ role, version }: RemoveVariables) => deleteRole(role.id, version),
    onSuccess: async (_result, { role, markApplied }) => {
      if (markApplied) void markApplied();
      setRoleToDelete(null);
      toast.success(t("roles:removed", { name: role.name }));
      await queryClient.invalidateQueries({ queryKey: rolesQueryKeyRoot });
    },
    // La confirmación espera la respuesta y se cierra con ella, sea cual sea («Criterio · Diálogos»).
    onError: (error) => { setRoleToDelete(null); toastActionError(error, t); },
  });
  const confirmRole = removing?.role ?? roleToDelete;
  const confirmInUse = removing && removing.role.userCount > 0 ? removing.role.userCount : 0;
  function confirmRemove() {
    if (removing) {
      // Manda la versión que leyó la propuesta al abrirse; la confirmación se cierra con la respuesta, junto con la propuesta.
      const { proposal, role } = removing;
      remove.mutate({ role, version: proposal.proposal.target?.version ?? role.version, markApplied: proposal.markApplied },
        { onSettled: () => closeProposal(proposal.proposalId) });
    }
    else if (roleToDelete) remove.mutate({ role: roleToDelete, version: roleToDelete.version });
  }

  const rowActions = (role: RoleResponse) => <RowActions
        label={t("roles:rowActions", { name: role.name })}
        title={role.name}
        actions={[
          { label: t("roles:viewPermissions"), accessibleName: t("roles:viewPermissions"), icon: Eye, onSelect: () => { void navigate(`/org/roles/${encodeURIComponent(role.id)}`); }, hidden: !role.isSystemRole && canManage },
          { label: t("roles:edit"), accessibleName: t("roles:edit"), icon: Pencil, onSelect: () => { void navigate(`/org/roles/${encodeURIComponent(role.id)}`); }, hidden: role.isSystemRole || !canManage },
          // Con usuarios no se puede inactivar: la opción va apagada y con el motivo debajo (pantallas-y-ui, 13/10).
          { label: t("roles:deactivate"), accessibleName: t("roles:deactivate"), icon: Trash2, onSelect: () => setRoleToDelete(role),
            disabledReason: role.userCount > 0 ? t("roles:inUse", countOf(format, role.userCount)) : undefined,
            destructive: true, hidden: role.isSystemRole || !canManage },
        ]}
      />;
  const columns: Column<RoleResponse>[] = [
    ...createRoleColumns(t),
    { id: "actions", header: t("roles:columns.actions"), type: "actions", cell: rowActions },
  ];

  const totals = counts.data?.total;
  const listSummary = roles.data ? totals
    ? t("roles:listSummary", { ...countOf(format, totals.all), organization: format.formatInteger(totals.organization), company: format.formatInteger(totals.company) })
    : t("roles:listSummaryFallback", countOf(format, roles.data.totalCount)) : undefined;
  const filterValue = vale ?? "";

  return <>
    <Page
      title={t("roles:title")}
      summary={listSummary}
      phoneBody="flush"
      fab={canManage ? { label: t("roles:create"), to: "/org/roles/nuevo" } : undefined}
      actions={canManage ? <Button asChild><Link to="/org/roles/nuevo"><Plus aria-hidden="true" className="size-3.5" strokeWidth={2.25} />{t("roles:create")}</Link></Button> : undefined}
    >
      <div className="flex flex-col gap-3 md:gap-3.5">
        <FilterBar sort={{ columns: columns, value: pagination.sort, onChange: pagination.setSort }} phoneTools="filter" screen={t("roles:title")}
          label={t("roles:filters.label")}
          searchLabel={t("roles:filters.search")}
          searchValue={pagination.search ?? ""}
          onSearchChange={pagination.setSearch}
          filters={[{
            key: "vale",
            label: t("roles:filters.scope"),
            menuLabel: t("roles:filters.scopeMenu"),
            value: filterValue,
            active: vale !== undefined, remote: companies.remote, selectedLabel: companies.knownItems.find((item) => item.id === vale)?.name,
            onChange: (value) => filters.setFilter("vale", value === "all" ? undefined : value),
            options: [
              { value: "all", label: t("roles:filters.allScopes") },
              { value: "Organization", label: t("roles:scope.organization") },
              ...activeCompanies.map((company) => ({ value: company.id, label: company.name })),
            ],
          }]}
          clearLabel={t("common:actions.clear")}
          onClear={filters.clear}
        />
        <Surface className="overflow-hidden" phoneFlush>
          <DataTable
            columns={columns}
            mobileRow={(role) => rolePhoneRow(role, t, rowActions(role))}
            rows={roles.data?.items ?? []}
            rowKey={(role) => role.id}
            isLoading={roles.isPending}
            isFetching={roles.isFetching}
            error={roles.error ? apiErrorMessage(roles.error, t) : undefined}
            onRetry={() => { void roles.refetch(); }}
            emptyTitle={vale || pagination.search ? t("roles:emptyFiltered") : t("roles:empty")}
            emptyAction={vale || pagination.search ? <Button type="button" variant="outline" onClick={filters.clear}>{t("common:actions.clearFilters")}</Button> : undefined}
            sort={pagination.sort}
            onSortChange={pagination.setSort}
          />
          {paginationProps ? <Pagination {...paginationProps} /> : null}
        </Surface>
      </div>
    </Page>
    <ConfirmDialog
      open={confirmRole !== null}
      onOpenChange={(open) => {
        if (open) return;
        setRoleToDelete(null);
        if (removing) closeProposal(removing.proposal.proposalId);
      }}
      title={t("roles:confirmDeactivate", { name: confirmRole?.name ?? "" })}
      titleAside={removing ? <AssistantProposalMark /> : undefined}
      // Desde la propuesta puede abrir sobre un rol que alguien tiene: lo que la ruta frena lo dice la confirmación.
      description={confirmInUse ? t("roles:confirmDeactivateInUse") : t("roles:confirmDeactivateDescription")}
      confirmDisabledReason={confirmInUse ? t("roles:inUse", countOf(format, confirmInUse)) : undefined}
      confirmLabel={t("roles:deactivate")}
      destructive
      pending={remove.isPending} pendingLabel={t("roles:deactivating")}
      onConfirm={confirmRemove}
    />
  </>;
}
