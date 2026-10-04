import { keepPreviousData, useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Pencil, Plus, Power, RotateCw, Trash2, Users } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useFormat } from "@/shared/format/useFormat";
import { useNavigate } from "react-router";
import { useCurrentUser } from "@/auth/useCurrentUser";
import { ApiError } from "@/shared/api/ApiError";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import type { InviteOrganizationUserRequest, OrganizationUserFilterCountsResponse, OrganizationUserResponse, OrganizationUserState, RoleResponse } from "@/shared/api/types";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { useFilters } from "@/shared/hooks/useFilters";
import { usePagination } from "@/shared/hooks/usePagination";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { FilterBar } from "@/shared/ui/FilterBar";
import { FormError } from "@/shared/ui/FormError";
import { FormField } from "@/shared/ui/FormField";
import { ForbiddenPage } from "@/shared/ui/ForbiddenPage";
import { MultiSelect } from "@/shared/ui/MultiSelect";
import { Input } from "@/shared/ui/input";
import { Page } from "@/shared/ui/Page";
import { Pagination } from "@/shared/ui/Pagination";
import { RowActions } from "@/shared/ui/RowActions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Surface } from "@/shared/ui/Surface";
import { toastError } from "@/shared/ui/sonner";
import { toast } from "sonner";
import { changeUserStatus, fetchAssignableRoles, fetchCompanyOptions, fetchUserCounts, fetchUsers, inviteUser, removeUser, resendUserInvitation, revokeUserInvitation, userCompaniesQueryKey, userCountsQueryKey, userRolesQueryKey, usersQueryKey, usersQueryRoot, type UsersQuery } from "../api/users";
import { createUserColumns } from "../columns";

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

// «Ninguna» en el desplegable de Empresa del tablero Usuarios (Invitar).
const noCompany = "none";

function failureMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.detail ?? fallback : fallback;
}

export function UsersPage() {
  const { t } = useTranslation(["users", "common"]);
  const format = useFormat();
  const { data: currentUser } = useCurrentUser();
  const canRead = currentUser?.permissions?.includes("users.read") === true;
  const canInvite = currentUser?.permissions?.includes("users.invite") === true;
  const canManage = currentUser?.permissions?.includes("users.manage") === true;
  const canFilterByCompany = currentUser?.permissions?.includes("companies.read") === true;
  const organizationName = currentUser?.organizations.find((organization) => organization.id === currentUser.activeTenantId)?.name ?? "";
  const client = useQueryClient();
  const navigate = useNavigate();
  const filters = useFilters(userFilterKeys);
  const pagination = usePagination(undefined, { defaultSort: "displayName" });
  const debouncedSearch = useDebouncedValue(pagination.search ?? "");
  const stateValue = userStates.some((state) => state === filters.values.state) ? filters.values.state : undefined;
  const state = stateValue as OrganizationUserState | undefined;
  const companyFilter = canFilterByCompany ? filters.values.companyId : undefined;
  const withoutCompany = companyFilter === withoutCompanyValue ? true : undefined;
  const companyId = companyFilter && !withoutCompany ? companyFilter : undefined;
  const query: UsersQuery = {
    page: pagination.page,
    pageSize: pagination.pageSize,
    sort: pagination.sort,
    search: debouncedSearch || undefined,
    state,
    companyId,
    withoutCompany,
  };
  const users = useQuery({
    queryKey: usersQueryKey(query), queryFn: () => fetchUsers(query), enabled: canRead,
    placeholderData: keepPreviousData, meta: { silent: true },
  });
  const countQuery = { search: debouncedSearch || undefined, companyId, withoutCompany };
  const counts = useQuery({
    queryKey: userCountsQueryKey(countQuery), queryFn: () => fetchUserCounts(countQuery), enabled: canRead,
    placeholderData: keepPreviousData, meta: { silent: true },
  });
  const companies = useQuery({
    queryKey: userCompaniesQueryKey, queryFn: fetchCompanyOptions, enabled: canRead && canFilterByCompany,
    meta: { silent: true },
  });
  // Conteos del filtro «Empresa»: cada empresa y «Sin empresa», con la búsqueda y el estado elegidos.
  const companyCountTargets = ["all", ...(companies.data?.items ?? []).filter((company) => company.status === "Active").map((company) => company.id), withoutCompanyValue];
  const companyCounts = useQueries({ queries: companyCountTargets.map((target) => {
    const targetQuery = { search: debouncedSearch || undefined, ...(target === withoutCompanyValue ? { withoutCompany: true } : target === "all" ? {} : { companyId: target }) };
    return { queryKey: userCountsQueryKey(targetQuery), queryFn: () => fetchUserCounts(targetQuery), enabled: canRead && canFilterByCompany, meta: { silent: true } };
  }) });
  const [inviteOpen, setInviteOpen] = useState(false);
  const roleQueries = useQueries({ queries: (["Organization", "Company"] as const).map((scope) => ({
    queryKey: userRolesQueryKey(scope), queryFn: () => fetchAssignableRoles(scope), enabled: canInvite && inviteOpen,
    meta: { silent: true },
  })) });
  const organizationRoles = roleQueries[0].data?.items ?? [];
  const companyRoles = roleQueries[1].data?.items ?? [];
  const activeCompanies = (companies.data?.items ?? []).filter((company) => company.status === "Active");
  const [email, setEmail] = useState("");
  const [organizationRoleIds, setOrganizationRoleIds] = useState<string[]>([]);
  // Decisión 4 del usuario: como el tablero, se invita a una sola empresa; desde la ficha se suman más.
  const [inviteCompanyId, setInviteCompanyId] = useState("");
  const [inviteCompanyRoleIds, setInviteCompanyRoleIds] = useState<string[]>([]);
  const [inviteError, setInviteError] = useState<string>();
  const [target, setTarget] = useState<OrganizationUserResponse | null>(null);
  const [confirmAction, setConfirmAction] = useState<"revoke" | "disable" | "remove" | null>(null);

  const invite = useIdempotentMutation((request: InviteOrganizationUserRequest, key) => inviteUser(request, key));
  const resend = useIdempotentMutation((invitationId: string, key) => resendUserInvitation(invitationId, key));
  const invalidate = async () => client.invalidateQueries({ queryKey: usersQueryRoot });
  const revoke = useMutation({
    mutationFn: (user: OrganizationUserResponse) => revokeUserInvitation(user.invitationId!),
    onSuccess: async (_result, user) => { toast.success(t("users:messages.revoked", { email: user.email ?? "" })); setTarget(null); setConfirmAction(null); await invalidate(); },
    onError: (error) => toastError(failureMessage(error, t("common:states.error"))),
  });
  const changeStatus = useMutation({
    mutationFn: (user: OrganizationUserResponse & { isActive: boolean }) => changeUserStatus(user.memberId, { isActive: user.isActive, version: user.version }),
    onSuccess: async (_result, user) => { toast.success(t(user.isActive ? "users:messages.enabled" : "users:messages.disabled", { name: user.displayName || user.email || "" })); setTarget(null); setConfirmAction(null); await invalidate(); },
    onError: (error) => toastError(failureMessage(error, t("common:states.error"))),
  });
  const remove = useMutation({
    mutationFn: (user: OrganizationUserResponse) => removeUser(user.memberId, user.version),
    onSuccess: async (_result, user) => { toast.success(t("users:messages.removed", { name: user.displayName || user.email || "", organization: organizationName })); setTarget(null); setConfirmAction(null); await invalidate(); },
    onError: (error) => toastError(failureMessage(error, t("common:states.error"))),
  });

  if (!canRead) return <ForbiddenPage homePath="/org" />;

  const tableColumns: Column<OrganizationUserResponse>[] = [
    ...createUserColumns(t),
    { id: "actions", header: t("users:columns.actions"), type: "actions", cell: (member) => <RowActions
      label={t("users:rowActions", { name: member.displayName || member.email || "" })}
      actions={[
        { label: t("users:actions.view"), accessibleName: t("users:actions.view"), icon: Pencil, onSelect: () => { void navigate(`/org/usuarios/${encodeURIComponent(member.memberId)}`); } },
        { label: t("users:actions.resend"), accessibleName: t("users:actions.resend"), icon: RotateCw, onSelect: () => { if (member.invitationId) void resend.mutateAsync(member.invitationId).then(async () => { toast.success(t("users:messages.resent", { email: member.email ?? "" })); await invalidate(); }).catch((error: unknown) => toastError(failureMessage(error, t("common:states.error")))); }, hidden: !canInvite || !member.invitationId || (member.state !== "Invited" && member.state !== "Expired") },
        { label: t("users:actions.enable"), accessibleName: t("users:actions.enable"), icon: Power, onSelect: () => changeStatus.mutate({ ...member, isActive: true }), hidden: !canManage || member.state !== "Inactive" },
        { label: t("users:actions.disable"), accessibleName: t("users:actions.disable"), icon: Power, destructive: true, onSelect: () => { setTarget(member); setConfirmAction("disable"); }, hidden: !canManage || member.state !== "Active" },
        { label: t("users:actions.revoke"), accessibleName: t("users:actions.revoke"), icon: Trash2, destructive: true, onSelect: () => { setTarget(member); setConfirmAction("revoke"); }, hidden: !canManage || !member.invitationId || (member.state !== "Invited" && member.state !== "Expired") },
        { label: t("users:actions.remove"), accessibleName: t("users:actions.remove"), icon: Trash2, destructive: true, onSelect: () => { setTarget(member); setConfirmAction("remove"); }, hidden: !canManage || member.state !== "PendingDeletion" },
      ]}
    /> },
  ];
  const stateCount = (value: OrganizationUserState | undefined) => countFor(counts.data, value);
  // «N invitaciones» del tablero: las pendientes y las vencidas.
  const listSummary = counts.data ? <span className="max-md:text-[12px]">{t("users:summary", { total: counts.data.all, active: counts.data.active, invited: counts.data.invited + counts.data.expired })}</span> : undefined;
  // Sin filtro el botón dice «Estado: todos» o «Empresa: todas» y el menú ofrece «Todos» o «Todas», como el tablero.
  const currentState = state ?? "";

  async function submitInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setInviteError(undefined);
    const payload: InviteOrganizationUserRequest = {
      email: email.trim(),
      roleIds: organizationRoleIds,
      companies: inviteCompanyId ? [{ companyId: inviteCompanyId, roleIds: inviteCompanyRoleIds }] : [],
    };
    try {
      const issued = await invite.mutateAsync(payload);
      toast.success(t("users:messages.invited", { email: payload.email, date: format.formatDate(issued.expiresAtUtc) }));
      setInviteOpen(false);
      setEmail("");
      setOrganizationRoleIds([]);
      setInviteCompanyId("");
      setInviteCompanyRoleIds([]);
      await invalidate();
    } catch (error) {
      setInviteError(failureMessage(error, t("common:states.error")));
    }
  }


  return <>
    <Page icon={Users} title={t("users:title")} summary={listSummary} actions={canInvite ? <Button type="button" onClick={() => setInviteOpen(true)}><Plus aria-hidden="true" className="size-4" />{t("users:invite.open")}</Button> : undefined}>
      <div className="flex flex-col gap-3">
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
        <Surface className="overflow-hidden">
          <DataTable
            columns={tableColumns}
            rows={users.data?.items ?? []}
            rowKey={(member) => member.memberId}
            isLoading={users.isPending}
            isFetching={users.isFetching}
            error={users.error ? failureMessage(users.error, t("common:states.error")) : undefined}
            onRetry={() => { void users.refetch(); void counts.refetch(); }}
            emptyTitle={state || companyFilter || pagination.search ? t("users:empty.filtered") : t("users:empty.all")}
            emptyAction={state || companyFilter || pagination.search ? <Button type="button" variant="outline" onClick={filters.clear}>{t("users:empty.clear")}</Button> : undefined}
            sort={pagination.sort}
            onSortChange={pagination.toggleSort}
          />
          {users.data ? <Pagination page={users.data.page} pageSize={users.data.pageSize} totalCount={users.data.totalCount} totalPages={users.data.totalPages} hasPrevious={users.data.hasPrevious} hasNext={users.data.hasNext} onPageChange={pagination.setPage} onPageSizeChange={pagination.setPageSize} /> : null}
        </Surface>
      </div>
    </Page>

    <Dialog open={inviteOpen} onOpenChange={(open) => { setInviteOpen(open); if (!open) setInviteError(undefined); }}>
      <DialogContent mobileFullHeight>
        <DialogHeader><DialogTitle>{t("users:invite.title")}</DialogTitle></DialogHeader>
        <form onSubmit={(event) => { void submitInvite(event); }} className="flex min-h-0 flex-col">
          <div className="flex flex-col gap-4 overflow-y-auto px-5 py-4">
            {inviteError ? <FormError message={inviteError} /> : null}
            <FormField label={t("users:invite.email")} required><Input autoComplete="email" type="email" required maxLength={254} placeholder={t("users:invite.emailPlaceholder")} value={email} onChange={(event) => setEmail(event.target.value)} /></FormField>
            <FormField label={t("users:invite.organizationRoles")}>
              <MultiSelect options={organizationRoles.map((role: RoleResponse) => ({ value: role.id, label: role.name }))} value={organizationRoleIds} onChange={setOrganizationRoleIds} placeholder={t("users:invite.noRoles")} />
            </FormField>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label={t("users:invite.company")}>
                <Select value={inviteCompanyId || noCompany} onValueChange={(value) => { setInviteCompanyId(value === noCompany ? "" : value); setInviteCompanyRoleIds([]); }}>
                  <SelectTrigger className="w-full" aria-label={t("users:invite.company")}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={noCompany}>{t("users:invite.noCompany")}</SelectItem>
                    {activeCompanies.map((company) => <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label={t("users:invite.companyRoles")}>
                {inviteCompanyId
                  ? <MultiSelect options={companyRoles.filter((role) => role.scope === "AnyCompany" || role.companyId === inviteCompanyId).map((role) => ({ value: role.id, label: role.name }))} value={inviteCompanyRoleIds} onChange={setInviteCompanyRoleIds} placeholder={t("users:invite.noRoles")} />
                  : <button type="button" disabled className="flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-[8px] border border-[var(--borde2)] bg-[var(--s2)] px-3 text-left text-[13px] text-[var(--t3)] max-md:h-12 max-md:rounded-[12px] max-md:text-[16px]">{t("users:invite.chooseCompanyFirst")}<ChevronDown aria-hidden="true" className="size-4 shrink-0" /></button>}
              </FormField>
            </div>
          </div>
          <DialogFooter className="border-t border-[var(--borde)] px-5 py-4">
            <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>{t("common:actions.cancel")}</Button>
            <Button type="submit" disabled={invite.isPending}>{invite.isPending ? t("common:states.saving") : t("users:invite.send")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

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
