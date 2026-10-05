import { keepPreviousData, useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Power, RotateCw, Trash2 } from "lucide-react";
import { UsersIcon } from "@/shared/ui/icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useCurrentUser } from "@/auth/useCurrentUser";
import { usePermissions } from "@/auth/usePermissions";
import { apiErrorMessage, toastActionError } from "@/shared/api/errorMessage";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import type { OrganizationUserFilterCountsResponse, OrganizationUserResponse, OrganizationUserState } from "@/shared/api/types";
import { usePagedQuery } from "@/shared/hooks/usePagedQuery";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { FilterBar } from "@/shared/ui/FilterBar";
import { Page } from "@/shared/ui/Page";
import { Pagination } from "@/shared/ui/Pagination";
import { RowActions } from "@/shared/ui/RowActions";
import { Surface } from "@/shared/ui/Surface";
import { toast } from "sonner";
import { changeUserStatus, fetchCompanyOptions, fetchUserCounts, fetchUsers, removeUser, resendUserInvitation, revokeUserInvitation, userCompaniesQueryKey, userCountsQueryKey, usersQueryKey, usersQueryRoot, type UsersQuery } from "../api/users";
import { createUserColumns, userPhoneRow } from "../columns";
import { InviteUserDialog } from "../components/InviteUserDialog";
import { activeOrganization } from "@/tenancy/access";

const userFilterKeys = ["state", "companyId"] as const;
// Orden del filtro «Estado» del tablero Usuarios.
const userStates: readonly (OrganizationUserState | undefined)[] = [undefined, "Active", "Invited", "Expired", "Inactive", "PendingDeletion"];
// «Sin empresa» viaja en la URL como companyId=none y a la API como withoutCompany.
const withoutCompanyValue = "none";

function countFor(counts: OrganizationUserFilterCountsResponse | undefined, state: OrganizationUserState | undefined): number | undefined {
  if (!counts) return undefined;
  return state === undefined ? counts.all
    : state === "Active" ? counts.active
      : state === "PendingDeletion" ? counts.pendingDeletion
        : state === "Invited" ? counts.invited
          : state === "Expired" ? counts.expired : counts.inactive;
}

export function UsersPage() {
  const { t } = useTranslation(["users", "common"]);
  const { data: currentUser } = useCurrentUser();
  const { can } = usePermissions();
  const canInvite = can("users.invite");
  const canManage = can("users.manage");
  const canFilterByCompany = can("companies.read");
  const organizationName = activeOrganization(currentUser)?.name ?? "";
  const client = useQueryClient();
  const navigate = useNavigate();
  const { filters, pagination, query, result: users, paginationProps } = usePagedQuery({
    filterKeys: userFilterKeys,
    defaultSort: "displayName",
    toQuery: (page, values): UsersQuery => {
      const companyFilter = canFilterByCompany ? values.companyId : undefined;
      return {
        ...page,
        state: userStates.find((state) => state === values.state),
        companyId: companyFilter && companyFilter !== withoutCompanyValue ? companyFilter : undefined,
        withoutCompany: companyFilter === withoutCompanyValue ? true : undefined,
      };
    },
    queryKey: usersQueryKey, queryFn: fetchUsers, meta: { silent: true, blocksView: true },
  });
  const { state, companyId, withoutCompany, search: debouncedSearch } = query;
  const companyFilter = withoutCompany ? withoutCompanyValue : companyId;
  const countQuery = { search: debouncedSearch, companyId, withoutCompany };
  const counts = useQuery({
    queryKey: userCountsQueryKey(countQuery), queryFn: () => fetchUserCounts(countQuery),
    placeholderData: keepPreviousData, meta: { silent: true },
  });
  const companies = useQuery({
    queryKey: userCompaniesQueryKey, queryFn: fetchCompanyOptions, enabled: canFilterByCompany,
    meta: { silent: true },
  });
  // Conteos del filtro «Empresa»: cada empresa y «Sin empresa», con la búsqueda y el estado elegidos.
  const companyCountTargets = ["all", ...(companies.data?.items ?? []).filter((company) => company.status === "Active").map((company) => company.id), withoutCompanyValue];
  const companyCounts = useQueries({ queries: companyCountTargets.map((target) => {
    const targetQuery = { search: debouncedSearch || undefined, ...(target === withoutCompanyValue ? { withoutCompany: true } : target === "all" ? {} : { companyId: target }) };
    return { queryKey: userCountsQueryKey(targetQuery), queryFn: () => fetchUserCounts(targetQuery), enabled: canFilterByCompany, meta: { silent: true } };
  }) });
  const [inviteOpen, setInviteOpen] = useState(false);
  const activeCompanies = (companies.data?.items ?? []).filter((company) => company.status === "Active");
  const [target, setTarget] = useState<OrganizationUserResponse | null>(null);
  const [confirmAction, setConfirmAction] = useState<"revoke" | "disable" | "remove" | null>(null);

  const resend = useIdempotentMutation((invitationId: string, key) => resendUserInvitation(invitationId, key));
  const invalidate = async () => client.invalidateQueries({ queryKey: usersQueryRoot });
  const revoke = useMutation({
    mutationFn: (user: OrganizationUserResponse) => revokeUserInvitation(user.invitationId!),
    onSuccess: async (_result, user) => { toast.success(t("users:messages.revoked", { email: user.email ?? "" })); setTarget(null); setConfirmAction(null); await invalidate(); },
    onError: (error) => toastActionError(error, t),
  });
  const changeStatus = useMutation({
    mutationFn: (user: OrganizationUserResponse & { isActive: boolean }) => changeUserStatus(user.memberId, { isActive: user.isActive, version: user.version }),
    onSuccess: async (_result, user) => { toast.success(t(user.isActive ? "users:messages.enabled" : "users:messages.disabled", { name: user.displayName || user.email || "" })); setTarget(null); setConfirmAction(null); await invalidate(); },
    onError: (error) => toastActionError(error, t),
  });
  const remove = useMutation({
    mutationFn: (user: OrganizationUserResponse) => removeUser(user.memberId, user.version),
    onSuccess: async (_result, user) => { toast.success(t("users:messages.removed", { name: user.displayName || user.email || "", organization: organizationName })); setTarget(null); setConfirmAction(null); await invalidate(); },
    onError: (error) => toastActionError(error, t),
  });

  const rowActions = (member: OrganizationUserResponse) => <RowActions
      label={t("users:rowActions", { name: member.displayName || member.email || "" })}
      title={member.displayName || member.email || ""}
      actions={[
        { label: t("users:actions.view"), accessibleName: t("users:actions.view"), icon: Pencil, onSelect: () => { void navigate(`/org/usuarios/${encodeURIComponent(member.memberId)}`); } },
        { label: t("users:actions.resend"), accessibleName: t("users:actions.resend"), icon: RotateCw, onSelect: () => { if (member.invitationId) resend.mutate(member.invitationId, { onSuccess: async () => { toast.success(t("users:messages.resent", { email: member.email ?? "" })); await invalidate(); }, onError: (error) => toastActionError(error, t) }); }, hidden: !canInvite || !member.invitationId || (member.state !== "Invited" && member.state !== "Expired") },
        { label: t("users:actions.enable"), accessibleName: t("users:actions.enable"), icon: Power, onSelect: () => changeStatus.mutate({ ...member, isActive: true }), hidden: !canManage || member.state !== "Inactive" },
        { label: t("users:actions.disable"), accessibleName: t("users:actions.disable"), icon: Power, destructive: true, onSelect: () => { setTarget(member); setConfirmAction("disable"); }, hidden: !canManage || member.state !== "Active" },
        { label: t("users:actions.revoke"), accessibleName: t("users:actions.revoke"), icon: Trash2, destructive: true, onSelect: () => { setTarget(member); setConfirmAction("revoke"); }, hidden: !canManage || !member.invitationId || (member.state !== "Invited" && member.state !== "Expired") },
        { label: t("users:actions.remove"), accessibleName: t("users:actions.remove"), icon: Trash2, destructive: true, onSelect: () => { setTarget(member); setConfirmAction("remove"); }, hidden: !canManage || member.state !== "PendingDeletion" },
      ]}
    />;
  const tableColumns: Column<OrganizationUserResponse>[] = [
    ...createUserColumns(t),
    { id: "actions", header: t("users:columns.actions"), type: "actions", cell: rowActions },
  ];
  const stateCount = (value: OrganizationUserState | undefined) => countFor(counts.data, value);
  // «N invitaciones» del tablero: las pendientes y las vencidas.
  const listSummary = counts.data ? <span className="max-md:text-[12px]">{t("users:summary", { total: counts.data.all, active: counts.data.active, invited: counts.data.invited + counts.data.expired })}</span> : undefined;
  // Sin filtro el botón dice «Estado: todos» o «Empresa: todas» y el menú ofrece «Todos» o «Todas», como el tablero.
  const currentState = state ?? "";

  return <>
    <Page icon={UsersIcon} title={t("users:title")} summary={listSummary} phoneBody="flush"
      fab={canInvite ? { label: t("users:invite.open"), onClick: () => setInviteOpen(true) } : undefined}
      actions={canInvite ? <Button type="button" onClick={() => setInviteOpen(true)}><Plus aria-hidden="true" className="size-3.5" strokeWidth={2.25} />{t("users:invite.open")}</Button> : undefined}>
      <div className="flex flex-col gap-3 md:gap-3.5">
        <FilterBar
          label={t("users:filters.label")}
          searchLabel={t("users:filters.search")}
          searchValue={pagination.search ?? ""}
          onSearchChange={pagination.setSearch}
          filters={[
            { key: "state", label: t("users:filters.state"), menuLabel: t("users:filters.stateMenu"), value: currentState, active: state !== undefined, onChange: (value) => filters.setFilter("state", value === "all" ? undefined : value), options: userStates.map((value) => ({ value: value ?? "all", label: t(`users:filters.states.${value ?? "all"}`), count: stateCount(value) })) },
            ...(canFilterByCompany ? [{ key: "companyId", label: t("users:filters.company"), menuLabel: t("users:filters.companyMenu"), value: companyFilter ?? "", active: companyFilter !== undefined, onChange: (value: string) => filters.setFilter("companyId", value === "all" ? undefined : value), options: [
              ...companyCountTargets.map((target, index) => ({ value: target, label: target === "all" ? t("users:filters.allCompanies") : target === withoutCompanyValue ? t("users:filters.withoutCompany") : companies.data?.items.find((item) => item.id === target)?.name ?? target, count: countFor(companyCounts[index]?.data, state) })),
            ] }] : []),
          ]}
          clearLabel={t("common:actions.clear")}
          onClear={filters.clear}
        />
        <Surface className="overflow-hidden" phoneFlush>
          <DataTable
            columns={tableColumns}
            mobileRow={(member) => userPhoneRow(member, t, rowActions(member))}
            rows={users.data?.items ?? []}
            rowKey={(member) => member.memberId}
            isLoading={users.isPending}
            isFetching={users.isFetching}
            error={users.error ? apiErrorMessage(users.error, t) : undefined}
            onRetry={() => { void users.refetch(); void counts.refetch(); }}
            emptyTitle={state || companyFilter || pagination.search ? t("users:empty.filtered") : t("users:empty.all")}
            emptyAction={state || companyFilter || pagination.search ? <Button type="button" variant="outline" onClick={filters.clear}>{t("users:empty.clear")}</Button> : undefined}
            sort={pagination.sort}
            onSortChange={pagination.toggleSort}
          />
          {paginationProps ? <Pagination {...paginationProps} /> : null}
        </Surface>
      </div>
    </Page>

    {inviteOpen ? <InviteUserDialog companies={activeCompanies} onClose={() => setInviteOpen(false)} onInvited={invalidate} /> : null}

    <ConfirmDialog open={confirmAction !== null} onOpenChange={(open) => { if (!open) { setConfirmAction(null); setTarget(null); } }} destructive={confirmAction !== null}
      title={target ? t(`users:confirm.${confirmAction}`, { name: target.displayName || target.email || "", email: target.email ?? "", organization: organizationName }) : ""}
      description={confirmAction ? t(`users:confirm.${confirmAction}Description`, { organization: organizationName }) : undefined}
      confirmLabel={confirmAction ? t(`users:confirm.${confirmAction}Confirm`) : ""}
      onConfirm={() => {
        if (!target || !confirmAction) return;
        if (confirmAction === "revoke" && target.invitationId) revoke.mutate(target);
        if (confirmAction === "disable") changeStatus.mutate({ ...target, isActive: false });
        if (confirmAction === "remove") remove.mutate(target);
      }}
    />
  </>;
}
