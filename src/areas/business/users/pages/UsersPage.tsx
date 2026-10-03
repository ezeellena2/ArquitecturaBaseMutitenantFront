import { keepPreviousData, useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Mail, Plus, Power, RotateCw, Trash2, UserRound } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useCurrentUser } from "@/auth/useCurrentUser";
import { ApiError } from "@/shared/api/ApiError";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import type { InviteOrganizationUserRequest, OrganizationUserResponse, OrganizationUserState, RoleResponse } from "@/shared/api/types";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { useFilters } from "@/shared/hooks/useFilters";
import { usePagination } from "@/shared/hooks/usePagination";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
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
import { createUserColumns, userStateLabel } from "../columns";

const userFilterKeys = ["state", "companyId"] as const;
const userStates: readonly (OrganizationUserState | undefined)[] = [undefined, "Active", "PendingDeletion", "Invited", "Expired", "Inactive"];

type CompanyAssignmentDraft = { companyId: string; roleIds: string[] };

function failureMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.detail ?? fallback : fallback;
}

export function UsersPage() {
  const { t } = useTranslation(["users", "common"]);
  const { data: currentUser } = useCurrentUser();
  const canRead = currentUser?.permissions?.includes("users.read") === true;
  const canInvite = currentUser?.permissions?.includes("users.invite") === true;
  const canManage = currentUser?.permissions?.includes("users.manage") === true;
  const canFilterByCompany = currentUser?.permissions?.includes("companies.read") === true;
  const client = useQueryClient();
  const navigate = useNavigate();
  const filters = useFilters(userFilterKeys);
  const pagination = usePagination(undefined, { defaultSort: "displayName" });
  const debouncedSearch = useDebouncedValue(pagination.search ?? "");
  const stateValue = userStates.some((state) => state === filters.values.state) ? filters.values.state : undefined;
  const state = stateValue as OrganizationUserState | undefined;
  const companyId = canFilterByCompany ? filters.values.companyId : undefined;
  const query: UsersQuery = {
    page: pagination.page,
    pageSize: pagination.pageSize,
    sort: pagination.sort,
    search: debouncedSearch || undefined,
    state,
    companyId,
  };
  const users = useQuery({
    queryKey: usersQueryKey(query), queryFn: () => fetchUsers(query), enabled: canRead,
    placeholderData: keepPreviousData, meta: { silent: true },
  });
  const countQuery = { search: debouncedSearch || undefined, companyId };
  const counts = useQuery({
    queryKey: userCountsQueryKey(countQuery), queryFn: () => fetchUserCounts(countQuery), enabled: canRead,
    placeholderData: keepPreviousData, meta: { silent: true },
  });
  const companies = useQuery({
    queryKey: userCompaniesQueryKey, queryFn: fetchCompanyOptions, enabled: canRead && canFilterByCompany,
    meta: { silent: true },
  });
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
  const [assignments, setAssignments] = useState<CompanyAssignmentDraft[]>([]);
  const [inviteError, setInviteError] = useState<string>();
  const [target, setTarget] = useState<OrganizationUserResponse | null>(null);
  const [confirmAction, setConfirmAction] = useState<"revoke" | "disable" | "remove" | null>(null);

  const invite = useIdempotentMutation((request: InviteOrganizationUserRequest, key) => inviteUser(request, key));
  const resend = useIdempotentMutation((invitationId: string, key) => resendUserInvitation(invitationId, key));
  const invalidate = async () => client.invalidateQueries({ queryKey: usersQueryRoot });
  const revoke = useMutation({
    mutationFn: (invitationId: string) => revokeUserInvitation(invitationId),
    onSuccess: async () => { toast.success(t("users:messages.revoked")); setTarget(null); setConfirmAction(null); await invalidate(); },
    onError: (error) => toastError(failureMessage(error, t("common:states.error"))),
  });
  const changeStatus = useMutation({
    mutationFn: (user: OrganizationUserResponse & { isActive: boolean }) => changeUserStatus(user.memberId, { isActive: user.isActive, version: user.version }),
    onSuccess: async (_result, user) => { toast.success(t(user.isActive ? "users:messages.enabled" : "users:messages.disabled")); setTarget(null); setConfirmAction(null); await invalidate(); },
    onError: (error) => toastError(failureMessage(error, t("common:states.error"))),
  });
  const remove = useMutation({
    mutationFn: (user: OrganizationUserResponse) => removeUser(user.memberId, user.version),
    onSuccess: async () => { toast.success(t("users:messages.removed")); setTarget(null); setConfirmAction(null); await invalidate(); },
    onError: (error) => toastError(failureMessage(error, t("common:states.error"))),
  });

  if (!canRead) return <ForbiddenPage homePath="/org" />;

  const tableColumns: Column<OrganizationUserResponse>[] = [
    ...createUserColumns(t),
    { id: "actions", header: t("users:columns.actions"), type: "actions", cell: (member) => <RowActions
      label={t("users:rowActions", { name: member.displayName || member.email || "" })}
      actions={[
        { label: t("users:actions.view"), accessibleName: t("users:actions.view"), icon: Eye, onSelect: () => { void navigate(`/org/usuarios/${encodeURIComponent(member.memberId)}`); } },
        { label: t("users:actions.resend"), accessibleName: t("users:actions.resend"), icon: RotateCw, onSelect: () => { if (member.invitationId) void resend.mutateAsync(member.invitationId).then(async () => { toast.success(t("users:messages.resent")); await invalidate(); }).catch((error: unknown) => toastError(failureMessage(error, t("common:states.error")))); }, hidden: !canInvite || !member.invitationId || (member.state !== "Invited" && member.state !== "Expired") },
        { label: t("users:actions.enable"), accessibleName: t("users:actions.enable"), icon: Power, onSelect: () => changeStatus.mutate({ ...member, isActive: true }), hidden: !canManage || member.state !== "Inactive" },
        { label: t("users:actions.disable"), accessibleName: t("users:actions.disable"), icon: Power, destructive: true, onSelect: () => { setTarget(member); setConfirmAction("disable"); }, hidden: !canManage || member.state !== "Active" },
        { label: t("users:actions.revoke"), accessibleName: t("users:actions.revoke"), icon: Trash2, destructive: true, onSelect: () => { setTarget(member); setConfirmAction("revoke"); }, hidden: !canManage || !member.invitationId || (member.state !== "Invited" && member.state !== "Expired") },
        { label: t("users:actions.remove"), accessibleName: t("users:actions.remove"), icon: Trash2, destructive: true, onSelect: () => { setTarget(member); setConfirmAction("remove"); }, hidden: !canManage || member.state !== "PendingDeletion" },
      ]}
    /> },
  ];
  const stateCount = (value: OrganizationUserState | undefined) => value === undefined ? counts.data?.all
    : value === "Active" ? counts.data?.active
      : value === "PendingDeletion" ? counts.data?.pendingDeletion
        : value === "Invited" ? counts.data?.invited
          : value === "Expired" ? counts.data?.expired : counts.data?.inactive;
  const listSummary = counts.data ? <span className="max-md:text-[12px]">{t("users:summary", { total: counts.data.all, active: counts.data.active, invited: counts.data.invited })}</span> : undefined;
  const currentState = state ?? "all";

  async function submitInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setInviteError(undefined);
    const payload: InviteOrganizationUserRequest = {
      email: email.trim(),
      roleIds: organizationRoleIds,
      companies: assignments.filter((item) => item.companyId).map((item) => ({ companyId: item.companyId, roleIds: item.roleIds })),
    };
    if (organizationRoleIds.length === 0 && !payload.companies?.some((company) => company.roleIds?.length)) {
      setInviteError(t("users:invite.roleRequired"));
      return;
    }
    try {
      await invite.mutateAsync(payload);
      toast.success(t("users:messages.invited"));
      setInviteOpen(false);
      setEmail("");
      setOrganizationRoleIds([]);
      setAssignments([]);
      await invalidate();
    } catch (error) {
      setInviteError(failureMessage(error, t("common:states.error")));
    }
  }

  function addCompanyAssignment() {
    const available = activeCompanies.find((company) => !assignments.some((assignment) => assignment.companyId === company.id));
    if (available) setAssignments([...assignments, { companyId: available.id, roleIds: [] }]);
  }

  return <>
    <Page icon={UserRound} title={t("users:title")} summary={listSummary} actions={canInvite ? <Button type="button" onClick={() => setInviteOpen(true)}><Plus aria-hidden="true" className="size-4" />{t("users:invite.open")}</Button> : undefined}>
      <div className="flex flex-col gap-3">
        <FilterBar
          label={t("users:filters.label")}
          searchLabel={t("users:filters.search")}
          searchValue={pagination.search ?? ""}
          onSearchChange={pagination.setSearch}
          filters={[
            { key: "state", label: t("users:filters.state"), menuLabel: t("users:filters.state"), value: currentState, active: state !== undefined, onChange: (value) => filters.setFilter("state", value === "all" ? undefined : value), options: userStates.map((value) => ({ value: value ?? "all", label: value ? userStateLabel(value, t) : t("users:states.all"), count: stateCount(value) })) },
            ...(canFilterByCompany ? [{ key: "companyId", label: t("users:filters.company"), menuLabel: t("users:filters.company"), value: companyId ?? "all", active: companyId !== undefined, onChange: (value: string) => filters.setFilter("companyId", value === "all" ? undefined : value), options: [{ value: "all", label: t("users:filters.allCompanies") }, ...(companies.data?.items ?? []).map((company) => ({ value: company.id, label: company.name }))] }] : []),
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
            emptyTitle={state || companyId || pagination.search ? t("users:empty.filtered") : t("users:empty.all")}
            emptyAction={state || companyId || pagination.search ? <Button type="button" variant="outline" onClick={filters.clear}>{t("users:empty.clear")}</Button> : undefined}
            sort={pagination.sort}
            onSortChange={pagination.toggleSort}
          />
          {users.data ? <Pagination page={users.data.page} pageSize={users.data.pageSize} totalCount={users.data.totalCount} totalPages={users.data.totalPages} hasPrevious={users.data.hasPrevious} hasNext={users.data.hasNext} onPageChange={pagination.setPage} onPageSizeChange={pagination.setPageSize} /> : null}
        </Surface>
      </div>
    </Page>

    <Dialog open={inviteOpen} onOpenChange={(open) => { setInviteOpen(open); if (!open) setInviteError(undefined); }}>
      <DialogContent mobileFullHeight>
        <DialogHeader><DialogTitle>{t("users:invite.title")}</DialogTitle><DialogDescription>{t("users:invite.description")}</DialogDescription></DialogHeader>
        <form onSubmit={(event) => { void submitInvite(event); }} className="flex min-h-0 flex-col">
          <div className="flex flex-col gap-4 overflow-y-auto px-5 py-4">
            {inviteError ? <FormError message={inviteError} /> : null}
            <FormField label={t("users:invite.email")} required><Input autoComplete="email" type="email" required maxLength={254} placeholder={t("users:invite.emailPlaceholder")} value={email} onChange={(event) => setEmail(event.target.value)} /></FormField>
            <FormField label={t("users:invite.organizationRoles")} required>
              <MultiSelect options={organizationRoles.map((role: RoleResponse) => ({ value: role.id, label: role.name }))} value={organizationRoleIds} onChange={setOrganizationRoleIds} placeholder={t("users:invite.chooseRoles")} />
            </FormField>
            <section className="flex flex-col gap-3 border-t border-[var(--borde)] pt-4">
              <div className="flex items-center justify-between gap-3"><div><h3 className="text-sm font-semibold">{t("users:invite.companyRoles")}</h3><p className="mt-1 text-xs text-[var(--t2)]">{t("users:invite.companyRolesHint")}</p></div>
                <Button type="button" size="sm" variant="outline" disabled={activeCompanies.length <= assignments.length} onClick={addCompanyAssignment}><Plus aria-hidden="true" className="size-4" />{t("users:invite.addCompany")}</Button>
              </div>
              {assignments.map((assignment, index) => {
                const availableCompanyRoles = companyRoles.filter((role) => role.scope === "AnyCompany" || role.companyId === assignment.companyId);
                const otherCompanyIds = assignments.filter((_item, itemIndex) => itemIndex !== index).map((item) => item.companyId);
                return <div key={`company-${index}`} className="grid gap-3 rounded-lg border border-[var(--borde)] p-3 md:grid-cols-2">
                  <FormField label={t("users:invite.company")}>
                    <Select value={assignment.companyId} onValueChange={(value) => setAssignments(assignments.map((item, itemIndex) => itemIndex === index ? { companyId: value, roleIds: [] } : item))}>
                      <SelectTrigger className="w-full"><SelectValue placeholder={t("users:invite.chooseCompany")} /></SelectTrigger>
                      <SelectContent>{activeCompanies.filter((company) => !otherCompanyIds.includes(company.id)).map((company) => <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </FormField>
                  <FormField label={t("users:invite.companyRoles")}>
                    <MultiSelect options={availableCompanyRoles.map((role) => ({ value: role.id, label: role.name }))} value={assignment.roleIds} onChange={(roleIds) => setAssignments(assignments.map((item, itemIndex) => itemIndex === index ? { ...item, roleIds } : item))} placeholder={t("users:invite.chooseRoles")} />
                  </FormField>
                </div>;
              })}
            </section>
          </div>
          <DialogFooter className="border-t border-[var(--borde)] px-5 py-4">
            <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>{t("common:actions.cancel")}</Button>
            <Button type="submit" disabled={invite.isPending}>{invite.isPending ? t("common:states.saving") : <><Mail aria-hidden="true" className="size-4" />{t("users:invite.send")}</>}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <ConfirmDialog open={confirmAction !== null} onOpenChange={(open) => { if (!open) { setConfirmAction(null); setTarget(null); } }} destructive={confirmAction !== null}
      title={target ? t(`users:confirm.${confirmAction}`, { name: target.displayName || target.email || "" }) : ""}
      description={confirmAction ? t(`users:confirm.${confirmAction}Description`) : undefined}
      confirmLabel={confirmAction ? t(`users:actions.${confirmAction}`) : ""}
      onConfirm={() => {
        if (!target || !confirmAction) return;
        if (confirmAction === "revoke" && target.invitationId) revoke.mutate(target.invitationId);
        if (confirmAction === "disable") changeStatus.mutate({ ...target, isActive: false });
        if (confirmAction === "remove") remove.mutate(target);
      }}
    />
  </>;
}
