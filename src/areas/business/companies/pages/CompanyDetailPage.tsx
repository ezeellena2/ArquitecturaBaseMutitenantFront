import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Pencil, Plus, Power, ShieldCheck, UserRound } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router";
import { useCurrentUser } from "@/auth/useCurrentUser";
import { ApiError } from "@/shared/api/ApiError";
import type { AddCompanyMemberRequest, CompanyMemberResponse, CompanyResponse, RoleResponse, UpdateCompanyRequest } from "@/shared/api/types";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { useFilters } from "@/shared/hooks/useFilters";
import { usePagination } from "@/shared/hooks/usePagination";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { ConcurrencyBanner } from "@/shared/ui/ConcurrencyBanner";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { FilterBar } from "@/shared/ui/FilterBar";
import { FormError } from "@/shared/ui/FormError";
import { FormField } from "@/shared/ui/FormField";
import { TaxIdField, type TaxIdDraft } from "@/shared/ui/fields/TaxIdField";
import { TimeZoneSelect } from "@/shared/ui/fields/TimeZoneSelect";
import { Input } from "@/shared/ui/input";
import { MultiSelect } from "@/shared/ui/MultiSelect";
import { Page } from "@/shared/ui/Page";
import { Pagination } from "@/shared/ui/Pagination";
import { RowActions } from "@/shared/ui/RowActions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Surface } from "@/shared/ui/Surface";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { toastError } from "@/shared/ui/sonner";
import { toast } from "sonner";
import { ForbiddenPage } from "@/shared/ui/ForbiddenPage";
import {
  addCompanyMember,
  changeCompanyMemberStatus,
  changeCompanyStatus,
  companyMembersCountQueryKey,
  companyMembersQueryKey,
  companyMembersQueryRoot,
  companyQueryKey,
  companiesQueryRoot,
  fetchAssignableCompanyRoles,
  fetchCompany,
  fetchCompanyMemberCounts,
  fetchCompanyMemberIds,
  fetchCompanyMembers,
  fetchOrganizationMembers,
  updateCompany,
  updateCompanyMemberRoles,
  type CompanyMembersQuery,
} from "../api/companies";
import { createCompanyMemberColumns } from "../columns";

type CompanyTab = "members" | "roles";
type CompanyDraft = { name: string; taxId: TaxIdDraft | null; timeZoneId: string };
const states = [undefined, "Active", "PendingDeletion", "Inactive", "Invited"] as const;
const initialDraft: CompanyDraft = { name: "", taxId: null, timeZoneId: "" };

function draftFromCompany(company: CompanyResponse): CompanyDraft {
  return { name: company.name, taxId: company.taxId ? { type: company.taxId.type, number: company.taxId.number } : null, timeZoneId: company.timeZoneId };
}

function failureMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.detail ?? fallback : fallback;
}

export function CompanyDetailPage() {
  const { t } = useTranslation(["companies", "common"]);
  const { companyId } = useParams();
  const id = companyId ?? "";
  const navigate = useNavigate();
  const { data: currentUser } = useCurrentUser();
  const canRead = currentUser?.permissions?.includes("companies.read") === true;
  const canManageCompany = currentUser?.permissions?.includes("companies.manage") === true;
  const canReadMembers = currentUser?.permissions?.includes("company.members.read") === true;
  const canManageMembers = currentUser?.permissions?.includes("company.members.manage") === true;
  const canReadRoles = currentUser?.permissions?.includes("roles.read") === true;
  const canManageRoles = currentUser?.permissions?.includes("roles.manage") === true;
  const queryClient = useQueryClient();
  const filters = useFilters(["state", "roleId"] as const);
  const pagination = usePagination(undefined, { defaultSort: "displayName" });
  const debouncedSearch = useDebouncedValue(pagination.search ?? "");
  const stateValue = filters.values.state;
  const state = states.some((item) => item === stateValue) ? stateValue as CompanyMembersQuery["state"] : undefined;
  const roleId = filters.values.roleId === "none" ? undefined : filters.values.roleId;
  const withoutRoles = filters.values.roleId === "none" ? true : undefined;
  const memberQuery: CompanyMembersQuery = { page: pagination.page, pageSize: pagination.pageSize, sort: pagination.sort, search: debouncedSearch || undefined, state, roleId, withoutRoles };
  const company = useQuery({ queryKey: companyQueryKey(id), queryFn: () => fetchCompany(id), enabled: canRead && Boolean(id), meta: { silent: true } });
  const members = useQuery({ queryKey: companyMembersQueryKey(id, memberQuery), queryFn: () => fetchCompanyMembers(id, memberQuery), enabled: canReadMembers && Boolean(id), placeholderData: keepPreviousData, meta: { silent: true } });
  const counts = useQuery({ queryKey: companyMembersCountQueryKey(id, debouncedSearch || undefined), queryFn: () => fetchCompanyMemberCounts(id, debouncedSearch || undefined), enabled: canReadMembers && Boolean(id), meta: { silent: true } });
  const roles = useQuery({ queryKey: ["roles", "company-options", id], queryFn: () => fetchAssignableCompanyRoles(id), enabled: (canReadRoles || canReadMembers) && Boolean(id), meta: { silent: true } });
  const activeRoles = (roles.data?.items ?? []).filter((role) => !role.isSystemRole || role.name !== "TenantAdmin");
  const [tab, setTab] = useState<CompanyTab>("members");
  const [addOpen, setAddOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [roleTarget, setRoleTarget] = useState<CompanyMemberResponse | null>(null);
  const [roleDraft, setRoleDraft] = useState<string[]>([]);
  const [mutationError, setMutationError] = useState<unknown>();
  const [statusTarget, setStatusTarget] = useState<CompanyMemberResponse | null>(null);
  const [companyStatusConfirm, setCompanyStatusConfirm] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editDraft, setEditDraft] = useState<CompanyDraft>(initialDraft);
  const [taxIdValid, setTaxIdValid] = useState(true);
  const [editFailure, setEditFailure] = useState<unknown>();
  const existingMemberIds = useQuery({ queryKey: ["companies", id, "all-member-ids"], queryFn: () => fetchCompanyMemberIds(id), enabled: addOpen && canManageMembers, meta: { silent: true } });
  const alreadyAssigned = new Set(existingMemberIds.data ?? []);
  const candidateQuery = useQuery({ queryKey: ["organization-members", "company-candidates"], queryFn: fetchOrganizationMembers, enabled: addOpen && canManageMembers, meta: { silent: true } });
  const candidates = (candidateQuery.data?.items ?? []).filter((member) => !alreadyAssigned.has(member.memberId));

  const invalidate = async () => {
      await Promise.all([
      queryClient.invalidateQueries({ queryKey: companyMembersQueryRoot(id) }),
      queryClient.invalidateQueries({ queryKey: companyQueryKey(id) }),
      queryClient.invalidateQueries({ queryKey: companiesQueryRoot }),
    ]);
  };
  const addMember = useIdempotentMutation((request: AddCompanyMemberRequest, key) => addCompanyMember(id, request, key));
  const changeMemberRoles = useMutation({
    mutationFn: (member: CompanyMemberResponse) => updateCompanyMemberRoles(id, member.memberId, { roleIds: roleDraft, version: member.version }),
    onSuccess: async () => { setRoleTarget(null); setMutationError(undefined); toast.success(t("companies:messages.rolesUpdated")); await invalidate(); },
    onError: setMutationError,
  });
  const changeMemberState = useMutation({
    mutationFn: (member: CompanyMemberResponse) => changeCompanyMemberStatus(id, member.memberId, { status: member.membershipStatus === "Active" ? "Inactive" : "Active", version: member.version }),
    onSuccess: async (_result, member) => { setStatusTarget(null); toast.success(t(member.membershipStatus === "Active" ? "companies:messages.memberRemoved" : "companies:messages.memberRestored")); await invalidate(); },
    onError: (error) => toastError(failureMessage(error, t("common:states.error"))),
  });
  const changeCompanyState = useMutation({
    mutationFn: () => changeCompanyStatus(id, { status: company.data?.status === "Active" ? "Inactive" : "Active", version: company.data?.version }),
    onSuccess: async () => { setCompanyStatusConfirm(false); toast.success(t(company.data?.status === "Active" ? "companies:messages.deactivated" : "companies:messages.activated")); await invalidate(); },
    onError: (error) => toastError(failureMessage(error, t("common:states.error"))),
  });
  const saveCompany = useMutation({
    mutationFn: () => {
      const payload: UpdateCompanyRequest = { name: editDraft.name.trim(), taxIdType: editDraft.taxId?.type || null, taxIdNumber: editDraft.taxId?.number || null, timeZoneId: editDraft.timeZoneId, version: company.data!.version };
      return updateCompany(id, payload);
    },
    onSuccess: async () => { setEditOpen(false); setEditFailure(undefined); toast.success(t("companies:messages.updated")); await invalidate(); },
    onError: setEditFailure,
  });

  if (!canRead) return <ForbiddenPage homePath="/org" />;
  if (company.isPending) return <Page icon={Building2} title={t("companies:detail.loading")}><p role="status" className="p-4 text-[13px] text-[var(--t2)]">{t("common:states.loading")}</p></Page>;
  if (company.isError || !company.data) return <Page icon={Building2} title={t("companies:detail.title")} backTo={{ to: "/org/empresas", label: t("companies:back") }}><div className="p-4"><FormError message={failureMessage(company.error, t("common:states.error"))} /><Button type="button" variant="outline" onClick={() => { void company.refetch(); }}>{t("common:actions.retry")}</Button></div></Page>;
  const data = company.data;

  function openEdit() {
    setEditDraft(draftFromCompany(data));
    setTaxIdValid(true);
    setEditFailure(undefined);
    setEditOpen(true);
  }

  function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editDraft.name.trim() || !editDraft.timeZoneId || !taxIdValid) return;
    if (editDraft.taxId && Boolean(editDraft.taxId.type) !== Boolean(editDraft.taxId.number)) {
      setEditFailure(new Error(t("companies:validation.taxIdPair")));
      return;
    }
    saveCompany.mutate();
  }

  function submitAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedMemberId) return;
    addMember.mutate({ memberId: selectedMemberId, roleIds }, {
      onSuccess: async () => { setAddOpen(false); setSelectedMemberId(""); setRoleIds([]); toast.success(t("companies:messages.memberAdded")); await invalidate(); },
      onError: setMutationError,
    });
  }

  const memberColumns: Column<CompanyMemberResponse>[] = [
    ...createCompanyMemberColumns(t).slice(0, -1),
    {
      id: "actions", header: t("companies:columns.actions"), type: "actions",
      cell: (member) => <RowActions label={t("companies:memberActions", { name: member.displayName })} actions={[
        { label: t("companies:actions.changeRoles"), accessibleName: t("companies:actions.changeRoles"), icon: ShieldCheck, onSelect: () => { setRoleTarget(member); setRoleDraft(member.roles.map((role) => role.id)); setMutationError(undefined); }, hidden: !canManageMembers || member.state !== "Active" || member.membershipStatus !== "Active" || data.status !== "Active" },
        { label: t("companies:actions.viewUser"), accessibleName: t("companies:actions.viewUser"), icon: UserRound, onSelect: () => { void navigate(`/org/usuarios/${encodeURIComponent(member.memberId)}`); } },
        { label: t(member.membershipStatus === "Active" ? "companies:actions.removeMember" : "companies:actions.restoreMember"), accessibleName: t(member.membershipStatus === "Active" ? "companies:actions.removeMember" : "companies:actions.restoreMember"), icon: Power, onSelect: () => setStatusTarget(member), destructive: member.membershipStatus === "Active", hidden: !canManageMembers || data.status !== "Active" || member.state === "PendingDeletion" },
      ]} />,
    },
  ];
  const filteredState = state ?? "all";
  const countForState = (value: typeof states[number]) => value === undefined ? counts.data?.all : value === "Active" ? counts.data?.active : value === "PendingDeletion" ? counts.data?.pendingDeletion : value === "Inactive" ? counts.data?.inactive : counts.data?.invited;
  const selectableRoles = activeRoles.filter((role) => role.scope === "AnyCompany" || role.companyId === id);
  const canAdd = canManageMembers && data.status === "Active";
  const roleColumns: Column<RoleResponse>[] = [
    { id: "name", header: t("companies:roleColumns.name"), type: "custom", mobile: "primary", cell: (role) => <Link to={`/org/roles/${encodeURIComponent(role.id)}`} className="font-medium text-[var(--marca-tx)] hover:underline">{role.name}</Link> },
    { id: "scope", header: t("companies:roleColumns.scope"), type: "text", value: (role) => t(role.scope === "AnyCompany" ? "roles:scope.company" : "roles:scope.specificCompany") },
    { id: "userCount", header: t("companies:roleColumns.users"), type: "integer", value: (role) => role.userCount },
    { id: "permissions", header: t("companies:roleColumns.permissions"), type: "integer", value: (role) => role.permissions.length, mobile: "status" },
  ];

  return <>
    <ConcurrencyBanner error={editFailure ?? mutationError} isDirty={false} onSeeNew={() => { setEditDraft(draftFromCompany(data)); setEditFailure(undefined); setMutationError(undefined); void company.refetch(); }} onContinueEditing={() => { setEditFailure(undefined); setMutationError(undefined); }} />
    <Page icon={Building2} title={data.name} backTo={{ to: "/org/empresas", label: t("companies:back") }}
      summary={[data.taxId ? `${data.taxId.type} ${data.taxId.number}` : null, data.timeZoneId].filter(Boolean).join(" · ")}
      status={t(`companies:status.${data.status}`)}
      actions={<>
        {canManageCompany ? <Button type="button" variant="outline" onClick={openEdit}><Pencil aria-hidden="true" className="size-4" />{t("companies:actions.edit")}</Button> : null}
        {canAdd && tab === "members" ? <Button type="button" onClick={() => { setMutationError(undefined); setAddOpen(true); }}><Plus aria-hidden="true" className="size-4" />{t("companies:actions.addMember")}</Button> : null}
      </>}
      moreActions={canManageCompany ? { label: t("companies:actions.more"), items: [{ label: t(data.status === "Active" ? "companies:actions.deactivate" : "companies:actions.activate"), onSelect: () => setCompanyStatusConfirm(true), destructive: data.status === "Active" }] } : undefined}>
      <Tabs value={tab} onValueChange={(value) => setTab(value as CompanyTab)} className="flex flex-col gap-4">
        <TabsList variant="line" aria-label={t("companies:detail.tabsLabel")} className="w-full justify-start border-b border-[var(--borde)] rounded-none">
          <TabsTrigger value="members">{t("companies:detail.members")} <span className="text-xs text-[var(--t2)]">{members.data?.totalCount ?? data.memberCount}</span></TabsTrigger>
          {canReadRoles ? <TabsTrigger value="roles">{t("companies:detail.roles")} <span className="text-xs text-[var(--t2)]">{selectableRoles.length}</span></TabsTrigger> : null}
        </TabsList>
        <TabsContent value="members" className="flex flex-col gap-3">
          {!canReadMembers ? <FormError message={t("companies:detail.membersForbidden")} /> : <>
            {counts.isError ? <FormError message={failureMessage(counts.error, t("common:states.error"))} /> : null}
            <FilterBar label={t("companies:detail.filters.label")} searchLabel={t("companies:detail.filters.search")} searchValue={pagination.search ?? ""} onSearchChange={pagination.setSearch}
              filters={[
                { key: "roleId", label: t("companies:detail.filters.role"), menuLabel: t("companies:detail.filters.role"), value: filters.values.roleId ?? "all", active: filters.values.roleId !== undefined, onChange: (value) => filters.setFilter("roleId", value === "all" ? undefined : value), options: [{ value: "all", label: t("companies:detail.filters.allRoles") }, { value: "none", label: t("companies:detail.filters.withoutRoles") }, ...selectableRoles.map((role) => ({ value: role.id, label: role.name }))] },
                { key: "state", label: t("companies:detail.filters.state"), menuLabel: t("companies:detail.filters.state"), value: filteredState, active: state !== undefined, onChange: (value) => filters.setFilter("state", value === "all" ? undefined : value), options: states.map((value) => ({ value: value ?? "all", label: value ? t(`companies:memberStates.${value}`) : t("companies:detail.filters.allStates"), count: countForState(value) })) },
              ]}
              clearLabel={t("common:actions.clear")} onClear={filters.clear} />
            <Surface className="overflow-hidden">
              <DataTable columns={memberColumns} rows={members.data?.items ?? []} rowKey={(member) => member.memberId} isLoading={members.isPending} isFetching={members.isFetching}
                error={members.error ? failureMessage(members.error, t("common:states.error")) : undefined} onRetry={() => { void members.refetch(); void counts.refetch(); }}
                emptyTitle={state || roleId || withoutRoles || pagination.search ? t("companies:detail.empty.filtered") : t("companies:detail.empty.all")} emptyAction={state || roleId || withoutRoles || pagination.search ? <Button type="button" variant="outline" onClick={filters.clear}>{t("common:actions.clear")}</Button> : undefined}
                sort={pagination.sort} onSortChange={pagination.toggleSort} />
              {members.data ? <Pagination page={members.data.page} pageSize={members.data.pageSize} totalCount={members.data.totalCount} totalPages={members.data.totalPages} hasPrevious={members.data.hasPrevious} hasNext={members.data.hasNext} onPageChange={pagination.setPage} onPageSizeChange={pagination.setPageSize} /> : null}
            </Surface>
          </>}
        </TabsContent>
        {canReadRoles ? <TabsContent value="roles">
          <Surface className="overflow-hidden">
            <DataTable columns={roleColumns} rows={selectableRoles} rowKey={(role) => role.id} isLoading={roles.isPending} isFetching={roles.isFetching} error={roles.error ? failureMessage(roles.error, t("common:states.error")) : undefined} onRetry={() => { void roles.refetch(); }} emptyTitle={t("companies:detail.rolesEmpty")} />
            {canManageRoles ? <div className="border-t border-[var(--borde)] p-3"><Button asChild variant="outline"><Link to={`/org/roles/new?scope=SpecificCompany&companyId=${encodeURIComponent(id)}`}>{t("companies:detail.createRole")}</Link></Button></div> : null}
          </Surface>
        </TabsContent> : null}
      </Tabs>
    </Page>

    <Dialog open={addOpen} onOpenChange={(open) => { setAddOpen(open); if (!open) setMutationError(undefined); }}>
      <DialogContent mobileFullHeight>
        <DialogHeader><DialogTitle>{t("companies:addMember.title")}</DialogTitle><DialogDescription>{data.name}</DialogDescription></DialogHeader>
        <form onSubmit={submitAdd} className="flex min-h-0 flex-col">
          <div className="flex flex-col gap-4 overflow-y-auto px-5 py-4">
            {mutationError ? <FormError message={failureMessage(mutationError, t("common:states.error"))} /> : null}
            {candidateQuery.isError ? <FormError message={failureMessage(candidateQuery.error, t("common:states.error"))} /> : null}
            {existingMemberIds.isError ? <FormError message={failureMessage(existingMemberIds.error, t("common:states.error"))} /> : null}
            <FormField label={t("companies:addMember.user")} required>
              <Select value={selectedMemberId} onValueChange={(value) => setSelectedMemberId(value)} disabled={candidateQuery.isPending || existingMemberIds.isPending || candidates.length === 0}>
                <SelectTrigger className="w-full" aria-label={t("companies:addMember.user")}><SelectValue placeholder={candidateQuery.isPending || existingMemberIds.isPending ? t("common:states.loading") : t("companies:addMember.chooseUser")} /></SelectTrigger>
                <SelectContent>{candidates.map((member) => <SelectItem key={member.memberId} value={member.memberId}>{member.displayName}{" · "}{member.email ?? t("companies:addMember.withoutEmail")}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <FormField label={t("companies:addMember.roles")}>
              <MultiSelect options={selectableRoles.map((role) => ({ value: role.id, label: role.name }))} value={roleIds} onChange={setRoleIds} placeholder={t("companies:addMember.chooseRoles")} />
            </FormField>
          </div>
          <DialogFooter className="border-t border-[var(--borde)] px-5 py-4">
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>{t("common:actions.cancel")}</Button>
            <Button type="submit" disabled={!selectedMemberId || addMember.isPending}>{addMember.isPending ? t("common:states.saving") : t("companies:actions.addMember")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <Dialog open={roleTarget !== null} onOpenChange={(open) => { if (!open) { setRoleTarget(null); setMutationError(undefined); } }}>
      <DialogContent mobileFullHeight>
        <DialogHeader><DialogTitle>{roleTarget ? t("companies:editMemberRoles.title", { name: roleTarget.displayName }) : t("companies:editMemberRoles.title", { name: "" })}</DialogTitle><DialogDescription>{data.name}</DialogDescription></DialogHeader>
        <div className="flex flex-col gap-4 px-5 py-4">
          {mutationError ? <FormError message={failureMessage(mutationError, t("common:states.error"))} /> : null}
          <FormField label={t("companies:editMemberRoles.roles")}>
            <MultiSelect options={selectableRoles.map((role) => ({ value: role.id, label: role.name }))} value={roleDraft} onChange={setRoleDraft} placeholder={t("companies:addMember.chooseRoles")} />
          </FormField>
          {mutationError instanceof ApiError && mutationError.code === "Companies.Membership.LastCompanyAdmin" ? <p role="alert" className="text-[13px] text-[var(--alerta)]">{t("companies:editMemberRoles.lastAdmin")}</p> : null}
        </div>
        <DialogFooter className="border-t border-[var(--borde)] px-5 py-4">
          <Button type="button" variant="outline" onClick={() => setRoleTarget(null)}>{t("common:actions.cancel")}</Button>
          <Button type="button" disabled={!roleTarget || changeMemberRoles.isPending} onClick={() => roleTarget && changeMemberRoles.mutate(roleTarget)}>{changeMemberRoles.isPending ? t("common:states.saving") : t("companies:editMemberRoles.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <ConfirmDialog open={statusTarget !== null} onOpenChange={(open) => { if (!open) setStatusTarget(null); }}
      title={statusTarget ? t(statusTarget.membershipStatus === "Active" ? "companies:confirm.removeMember" : "companies:confirm.restoreMember", { name: statusTarget.displayName }) : ""}
      description={t(statusTarget?.membershipStatus === "Active" ? "companies:confirm.removeMemberDescription" : "companies:confirm.restoreMemberDescription")}
      confirmLabel={t(statusTarget?.membershipStatus === "Active" ? "companies:actions.removeMember" : "companies:actions.restoreMember")} destructive={statusTarget?.membershipStatus === "Active"}
      onConfirm={() => { if (statusTarget) changeMemberState.mutate(statusTarget); }} />
    <ConfirmDialog open={companyStatusConfirm} onOpenChange={setCompanyStatusConfirm}
      title={t(data.status === "Active" ? "companies:confirm.deactivate" : "companies:confirm.activate", { name: data.name })}
      description={t(data.status === "Active" ? "companies:confirm.deactivateDescription" : "companies:confirm.activateDescription")}
      confirmLabel={t(data.status === "Active" ? "companies:actions.deactivate" : "companies:actions.activate")} destructive={data.status === "Active"} onConfirm={() => changeCompanyState.mutate()} />

    <Dialog open={editOpen} onOpenChange={(open) => { setEditOpen(open); if (!open) setEditFailure(undefined); }}>
      <DialogContent mobileFullHeight>
        <DialogHeader><DialogTitle>{t("companies:editTitle")}</DialogTitle><DialogDescription>{data.name}</DialogDescription></DialogHeader>
        <form onSubmit={submitEdit} className="flex min-h-0 flex-col">
          <div className="flex flex-col gap-4 overflow-y-auto px-5 py-4">
            {editFailure ? <FormError message={failureMessage(editFailure, t("common:states.error"))} /> : null}
            <FormField label={t("companies:form.name")} required><Input required maxLength={120} autoComplete="organization" value={editDraft.name} onChange={(event) => setEditDraft({ ...editDraft, name: event.target.value })} /></FormField>
            <FormField label={t("companies:form.taxId")}><TaxIdField value={editDraft.taxId} onChange={(taxId) => setEditDraft({ ...editDraft, taxId })} onValidityChange={setTaxIdValid} typeLabel={t("companies:form.taxIdType")} appliesTo="Company" /></FormField>
            <FormField label={t("companies:form.timeZone")} required><TimeZoneSelect variant="compact" value={editDraft.timeZoneId} onChange={(timeZoneId) => setEditDraft({ ...editDraft, timeZoneId })} placeholder={t("companies:form.chooseTimeZone")} /></FormField>
          </div>
          <DialogFooter className="border-t border-[var(--borde)] px-5 py-4">
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>{t("common:actions.cancel")}</Button>
            <Button type="submit" disabled={saveCompany.isPending || !taxIdValid}>{saveCompany.isPending ? t("common:states.saving") : t("companies:form.save")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </>;
}
