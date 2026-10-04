import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Pencil, Plus, Power, ShieldCheck, UserRound } from "lucide-react";
// «Delta S.A.» + «. Quedaste…» no repite el punto final del nombre.
const sentence = (text: string) => text.replace("..", ".");
import { useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router";
import { usePermissions } from "@/auth/usePermissions";
import { ApiError } from "@/shared/api/ApiError";
import { actionErrorMessage, apiErrorMessage, toastActionError } from "@/shared/api/errorMessage";
import type { AddCompanyMemberRequest, CompanyMemberResponse, RoleResponse, UpdateCompanyRequest } from "@/shared/api/types";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { usePagedQuery } from "@/shared/hooks/usePagedQuery";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { FilterBar } from "@/shared/ui/FilterBar";
import { FormError } from "@/shared/ui/FormError";
import { LoadErrorPage } from "@/shared/ui/LoadErrorPage";
import { FormField } from "@/shared/ui/FormField";
import { TaxIdText } from "@/shared/ui/format/TaxIdText";
import { TimeZoneText } from "@/shared/ui/format/TimeZoneText";
import { MultiSelect } from "@/shared/ui/MultiSelect";
import { Page } from "@/shared/ui/Page";
import { Pagination } from "@/shared/ui/Pagination";
import { RowActions } from "@/shared/ui/RowActions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Surface } from "@/shared/ui/Surface";
import { TabCount, Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { toast } from "sonner";
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
import { companyMemberPhoneRow, createCompanyMemberColumns } from "../columns";
import { ListRow } from "@/shared/ui/app/ListRow";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { useBreadcrumbLeaf } from "@/shared/hooks/useBreadcrumbLeaf";
import { CompanyFields, companyPayload, draftFromCompany, emptyCompanyDraft, useCompanyTaxIdValid, type CompanyDraft } from "../components/CompanyFields";

type CompanyTab = "members" | "roles";
// Orden del filtro «Estado» del tablero Empresa.
const states = [undefined, "Active", "Inactive", "PendingDeletion"] as const;
const memberFilterKeys = ["state", "roleId"] as const;

export function CompanyDetailPage() {
  const { t } = useTranslation(["companies", "common"]);
  const { companyId } = useParams();
  const id = companyId ?? "";
  const navigate = useNavigate();
  const { can, canInCompany } = usePermissions();
  const canManageCompany = can("companies.manage");
  const canReadMembers = canInCompany(id, "company.members.read");
  const canManageMembers = canInCompany(id, "company.members.manage");
  const canReadRoles = can("roles.read");
  const canManageRoles = can("roles.manage");
  const queryClient = useQueryClient();
  const { phone } = useAppChrome();
  const { filters, pagination, query: memberQuery, result: members, paginationProps } = usePagedQuery({
    filterKeys: memberFilterKeys,
    defaultSort: "displayName",
    toQuery: (page, values): CompanyMembersQuery => ({
      ...page,
      state: states.find((item) => item === values.state),
      roleId: values.roleId === "none" ? undefined : values.roleId,
      withoutRoles: values.roleId === "none" ? true : undefined,
    }),
    queryKey: (query) => companyMembersQueryKey(id, query), queryFn: (query) => fetchCompanyMembers(id, query),
    enabled: canReadMembers && Boolean(id), meta: { silent: true },
  });
  const { state, roleId, withoutRoles } = memberQuery;
  const debouncedSearch = memberQuery.search ?? undefined;
  const company = useQuery({ queryKey: companyQueryKey(id), queryFn: () => fetchCompany(id), enabled: Boolean(id), meta: { silent: true, blocksView: true } });
  useBreadcrumbLeaf(company.data?.name);
  const counts = useQuery({ queryKey: companyMembersCountQueryKey(id, debouncedSearch || undefined), queryFn: () => fetchCompanyMemberCounts(id, debouncedSearch || undefined), enabled: canReadMembers && Boolean(id), meta: { silent: true } });
  const roles = useQuery({ queryKey: ["roles", "company-options", id], queryFn: () => fetchAssignableCompanyRoles(id), enabled: (canReadRoles || canReadMembers) && Boolean(id), meta: { silent: true } });
  const activeRoles = (roles.data?.items ?? []).filter((role) => !role.isSystemRole || role.name !== "TenantAdmin");
  const [tab, setTab] = useState<CompanyTab>("members");
  // Los roles propios se paginan en el cliente: el pie es el mismo que el de Miembros (tablero Empresa).
  const [rolePage, setRolePage] = useState(1);
  const [rolePageSize, setRolePageSize] = useState(10);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [roleTarget, setRoleTarget] = useState<CompanyMemberResponse | null>(null);
  const [roleDraft, setRoleDraft] = useState<string[]>([]);
  const [mutationError, setMutationError] = useState<unknown>();
  const [statusTarget, setStatusTarget] = useState<CompanyMemberResponse | null>(null);
  const [companyStatusConfirm, setCompanyStatusConfirm] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editDraft, setEditDraft] = useState<CompanyDraft>(emptyCompanyDraft);
  const { cuitType, taxIdValid } = useCompanyTaxIdValid(editDraft);
  const [editFailure, setEditFailure] = useState<unknown>();
  // Un 409 de concurrencia en un diálogo deja la ficha vieja: al cerrarlo se vuelve a leer (la ficha no tiene cambios
  // sin guardar propios). Va aparte del error, que se borra al cambiar algo en el diálogo.
  const staleAfterDialog = useRef(false);
  const failDialog = (setError: (error: unknown) => void) => (error: unknown) => {
    if (error instanceof ApiError && error.code === "General.ConcurrencyConflict") staleAfterDialog.current = true;
    setError(error);
  };
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
    onSuccess: async (_result, member) => { setRoleTarget(null); setMutationError(undefined); toast.success(t("companies:messages.rolesUpdated", { name: member.displayName })); await invalidate(); },
    onError: failDialog(setMutationError),
  });
  const changeMemberState = useMutation({
    mutationFn: (member: CompanyMemberResponse) => changeCompanyMemberStatus(id, member.memberId, { status: member.membershipStatus === "Active" ? "Inactive" : "Active", version: member.version }),
    onSuccess: async (_result, member) => { setStatusTarget(null); toast.success(t(member.membershipStatus === "Active" ? "companies:messages.memberRemoved" : "companies:messages.memberRestored", { name: member.displayName })); await invalidate(); },
    onError: (error) => toastActionError(error, t),
  });
  const changeCompanyState = useMutation({
    mutationFn: () => changeCompanyStatus(id, { status: company.data?.status === "Active" ? "Inactive" : "Active", version: company.data?.version }),
    onSuccess: async () => { setCompanyStatusConfirm(false); toast.success(sentence(t(company.data?.status === "Active" ? "companies:messages.deactivated" : "companies:messages.activated", { name: company.data?.name ?? "" }))); await invalidate(); },
    onError: (error) => toastActionError(error, t),
  });
  const saveCompany = useMutation({
    mutationFn: () => {
      const payload: UpdateCompanyRequest = { ...companyPayload(editDraft, cuitType?.code), version: company.data!.version };
      return updateCompany(id, payload);
    },
    onSuccess: async () => { setEditOpen(false); setEditFailure(undefined); toast.success(t("companies:messages.detailUpdated")); await invalidate(); },
    onError: failDialog(setEditFailure),
  });

  if (company.isPending) return <Page icon={Building2} title={t("companies:detail.loading")}><p role="status" className="p-4 text-[13px] text-[var(--t2)]">{t("common:states.loading")}</p></Page>;
  // «Criterio · Avisos» (Pantalla de error): la ficha no cargó y no hay nada que mostrar.
  if (!company.data) return <LoadErrorPage onRetry={() => { void company.refetch(); }} screen={t("companies:detail.title")} back={{ to: "/org/empresas", label: t("companies:back") }} />;
  const data = company.data;

  function openEdit() {
    setEditDraft(draftFromCompany(data));
    setEditFailure(undefined);
    setEditOpen(true);
  }

  // La X, Escape y «Cancelar» cierran igual: el error se va con el diálogo y, si hubo un 409, la ficha se vuelve a leer.
  function afterDialog() {
    if (!staleAfterDialog.current) return;
    staleAfterDialog.current = false;
    void invalidate();
  }
  function closeAdd() { setAddOpen(false); setMutationError(undefined); afterDialog(); }
  function closeRoles() { setRoleTarget(null); setMutationError(undefined); afterDialog(); }
  function closeEdit() { setEditOpen(false); setEditFailure(undefined); afterDialog(); }

  function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editDraft.name.trim() || !taxIdValid) return;
    saveCompany.mutate();
  }

  function submitAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedMemberId) return;
    addMember.mutate({ memberId: selectedMemberId, roleIds }, {
      onSuccess: async () => { setAddOpen(false); setSelectedMemberId(""); setRoleIds([]); toast.success(t("companies:messages.memberAdded", { name: candidates.find((member) => member.memberId === selectedMemberId)?.displayName ?? "" })); await invalidate(); },
      onError: failDialog(setMutationError),
    });
  }

  const memberActions = (member: CompanyMemberResponse) => <RowActions label={t("companies:memberActions", { name: member.displayName })} actions={[
        { label: t("companies:actions.changeRoles"), accessibleName: t("companies:actions.changeRoles"), icon: ShieldCheck, onSelect: () => { setRoleTarget(member); setRoleDraft(member.roles.map((role) => role.id)); setMutationError(undefined); }, hidden: !canManageMembers || member.state !== "Active" || member.membershipStatus !== "Active" || data.status !== "Active" },
        { label: t("companies:actions.viewUser"), accessibleName: t("companies:actions.viewUser"), icon: UserRound, onSelect: () => { void navigate(`/org/usuarios/${encodeURIComponent(member.memberId)}`); } },
        // Tablero Empresa: «Quitar de la empresa» (también con la baja pedida) pide confirmación; «Volver a sumar» es directo.
        { label: t(member.membershipStatus === "Active" ? "companies:actions.removeMember" : "companies:actions.restoreMember"), accessibleName: t(member.membershipStatus === "Active" ? "companies:actions.removeMember" : "companies:actions.restoreMember"), icon: Power, onSelect: () => { if (member.membershipStatus === "Active") setStatusTarget(member); else changeMemberState.mutate(member); }, destructive: member.membershipStatus === "Active", hidden: !canManageMembers || data.status !== "Active" },
      ]} />;
  const memberColumns: Column<CompanyMemberResponse>[] = [
    ...createCompanyMemberColumns(t),
    { id: "actions", header: t("companies:columns.actions"), type: "actions", cell: memberActions },
  ];
  // Sin filtro el botón dice «Estado: todos» o «Rol: todos» y el menú ofrece «Todos», como el tablero.
  const filteredState = state ?? "";
  const countForState = (value: typeof states[number]) => value === undefined ? counts.data?.all : value === "Active" ? counts.data?.active : value === "PendingDeletion" ? counts.data?.pendingDeletion : value === "Inactive" ? counts.data?.inactive : counts.data?.invited;
  const selectableRoles = activeRoles.filter((role) => role.scope === "AnyCompany" || role.companyId === id);
  // Pestaña Roles: solo los roles propios de esta empresa.
  const ownRoles = activeRoles.filter((role) => role.scope === "SpecificCompany" && role.companyId === id);
  const canAdd = canManageMembers && data.status === "Active";
  const roleActions = (role: RoleResponse) => <RowActions label={t("companies:roleActions", { name: role.name })} actions={[
    { label: t("companies:actions.edit"), accessibleName: t("companies:actions.edit"), icon: Pencil, onSelect: () => { void navigate(`/org/roles/${encodeURIComponent(role.id)}`); } },
  ]} />;
  const roleColumns: Column<RoleResponse>[] = [
    { id: "name", header: t("companies:roleColumns.name"), type: "custom", mobile: "primary", cell: (role) => <Link to={`/org/roles/${encodeURIComponent(role.id)}`} className="font-medium text-[var(--t1)] hover:underline">{role.name}</Link> },
    // Anchos del tablero Empresa (Roles): el rol se lleva el resto; Usuarios y Permisos, 120 px.
    { id: "userCount", header: t("companies:roleColumns.users"), type: "integer", className: "w-[132px]", value: (role) => role.userCount },
    { id: "permissions", header: t("companies:roleColumns.permissions"), type: "integer", className: "w-[132px]", value: (role) => role.permissions.length, mobile: "status" },
    { id: "actions", header: t("companies:columns.actions"), type: "actions", cell: (role) => roleActions(role) },
  ];

  return <>
    <Tabs value={tab} onValueChange={(value) => setTab(value as CompanyTab)} className="contents!">
    <Page icon={Building2} title={data.name} backTo={{ to: "/org/empresas", label: t("companies:back") }}
      phoneBody="flush"
      // Tablero M-Empresa: debajo del título, el CUIT y la zona; crear es un «+» flotante según la pestaña.
      phoneSubtitle={<>{data.taxId ? <><TaxIdText value={data.taxId} withType />{" · "}</> : null}<TimeZoneText value={data.timeZoneId} /></>}
      fab={tab === "members"
        ? canAdd ? { label: t("companies:actions.addMember"), onClick: () => { setMutationError(undefined); setAddOpen(true); } } : undefined
        : canManageRoles ? { label: t("companies:detail.createRole"), to: `/org/roles/new?scope=SpecificCompany&companyId=${encodeURIComponent(id)}` } : undefined}
      // Tablero Empresa: el estado primero, con punto y palabra; después el CUIT y la zona, formateados.
      summary={<>
        <span className="inline-flex items-center gap-1.5 text-[var(--t1)]"><span aria-hidden="true" className={`size-2 rounded-full ${data.status === "Active" ? "bg-[var(--punto-ok)]" : "bg-[var(--punto-apagado)]"}`} />{t(`companies:status.${data.status}`)}</span>
        {data.taxId ? <><span aria-hidden="true">{" · "}</span><TaxIdText value={data.taxId} withType /></> : null}
        <span aria-hidden="true">{" · "}</span><TimeZoneText value={data.timeZoneId} />
      </>}
      actions={<>
        {canManageCompany ? <Button type="button" variant="outline" onClick={openEdit}>{t("companies:actions.editCompany")}</Button> : null}
        {canAdd && tab === "members" ? <Button type="button" onClick={() => { setMutationError(undefined); setAddOpen(true); }}><Plus aria-hidden="true" className="size-4" />{t("companies:actions.addMember")}</Button> : null}
        {canManageRoles && tab === "roles" ? <Button asChild><Link to={`/org/roles/new?scope=SpecificCompany&companyId=${encodeURIComponent(id)}`}><Plus aria-hidden="true" className="size-4" />{t("companies:detail.createRole")}</Link></Button> : null}
      </>}
      moreActions={canManageCompany ? { label: t("companies:actions.more"), items: [{ label: t("companies:actions.editCompany"), onSelect: openEdit, hidden: !phone }, { label: t(data.status === "Active" ? "companies:actions.deactivate" : "companies:actions.activate"), onSelect: () => { if (data.status === "Active") setCompanyStatusConfirm(true); else changeCompanyState.mutate(); }, destructive: data.status === "Active" }] } : undefined}
      // Tablero «Criterio · Marco»: las pestañas van en su banda, debajo de la de la página, con la cantidad en gris.
      tabs={<TabsList aria-label={t("companies:detail.tabsLabel")}>
        <TabsTrigger value="members">{t("companies:detail.members")}<TabCount>{members.data?.totalCount ?? data.memberCount}</TabCount></TabsTrigger>
        {canReadRoles ? <TabsTrigger value="roles">{t("companies:detail.roles")}<TabCount>{ownRoles.length}</TabCount></TabsTrigger> : null}
      </TabsList>}>
        <TabsContent value="members" className="flex flex-col gap-3">
          {!canReadMembers ? <FormError message={t("companies:detail.membersForbidden")} /> : <>
            {counts.isError ? <FormError message={apiErrorMessage(counts.error, t)} /> : null}
            <FilterBar phoneTools="none" label={t("companies:detail.filters.label")} searchLabel={t("companies:detail.filters.search")} searchValue={pagination.search ?? ""} onSearchChange={pagination.setSearch}
              filters={[
                { key: "roleId", label: t("companies:detail.filters.role"), menuLabel: t("companies:detail.filters.roleMenu"), value: filters.values.roleId ?? "", active: filters.values.roleId !== undefined, onChange: (value) => filters.setFilter("roleId", value === "all" ? undefined : value), options: [{ value: "all", label: t("companies:detail.filters.allRoles") }, { value: "none", label: t("companies:detail.filters.withoutRoles") }, ...selectableRoles.map((role) => ({ value: role.id, label: role.name }))] },
                { key: "state", label: t("companies:detail.filters.state"), menuLabel: t("companies:detail.filters.stateMenu"), value: filteredState, active: state !== undefined, onChange: (value) => filters.setFilter("state", value === "all" ? undefined : value), options: states.map((value) => ({ value: value ?? "all", label: value ? t(`companies:detail.filters.states.${value}`) : t("companies:detail.filters.allStates"), count: countForState(value) })) },
              ]}
              clearLabel={t("common:actions.clear")} onClear={filters.clear} />
            <Surface className="overflow-hidden" phoneFlush>
              <DataTable columns={memberColumns} mobileRow={(member) => companyMemberPhoneRow(member, t, memberActions(member))} rows={members.data?.items ?? []} rowKey={(member) => member.memberId} isLoading={members.isPending} isFetching={members.isFetching}
                error={members.error ? apiErrorMessage(members.error, t) : undefined} onRetry={() => { void members.refetch(); void counts.refetch(); }}
                emptyTitle={state || roleId || withoutRoles || pagination.search ? t("companies:detail.empty.filtered") : t("companies:detail.empty.all")} emptyAction={state || roleId || withoutRoles || pagination.search ? <Button type="button" variant="outline" onClick={filters.clear}>{t("common:actions.clearFilters")}</Button> : undefined}
                sort={pagination.sort} onSortChange={pagination.toggleSort} />
              {paginationProps ? <Pagination {...paginationProps} /> : null}
            </Surface>
          </>}
        </TabsContent>
        {canReadRoles ? <TabsContent value="roles">
          <Surface className="overflow-hidden" phoneFlush>
            <DataTable columns={roleColumns} mobileRow={(role) => <ListRow key={role.id} to={`/org/roles/${encodeURIComponent(role.id)}`} title={role.name}
              meta={t("roles:phone.users", { count: role.userCount })} lines={[t("roles:phone.permissions", { count: role.permissions.length })]} trailing={roleActions(role)} />} rows={ownRoles.slice((rolePage - 1) * rolePageSize, rolePage * rolePageSize)} rowKey={(role) => role.id} isLoading={roles.isPending} isFetching={roles.isFetching} error={roles.error ? apiErrorMessage(roles.error, t) : undefined} onRetry={() => { void roles.refetch(); }} emptyTitle={t("companies:detail.rolesEmpty")} />
            {roles.data ? <Pagination page={rolePage} pageSize={rolePageSize} totalCount={ownRoles.length} totalPages={Math.max(1, Math.ceil(ownRoles.length / rolePageSize))}
              hasPrevious={rolePage > 1} hasNext={rolePage * rolePageSize < ownRoles.length} onPageChange={setRolePage}
              onPageSizeChange={(size) => { setRolePageSize(size); setRolePage(1); }} /> : null}
          </Surface>
        </TabsContent> : null}
    </Page>
    </Tabs>

    <Dialog open={addOpen} onOpenChange={(open) => { if (!open) closeAdd(); }}>
      <DialogContent mobileFullHeight>
        <DialogHeader><DialogTitle>{t("companies:addMember.title")}</DialogTitle><DialogDescription>{data.name}</DialogDescription></DialogHeader>
        <form onSubmit={submitAdd} className="flex min-h-0 flex-col">
          <div className="flex flex-col gap-4 overflow-y-auto px-5 py-4">
            <FormField label={t("companies:addMember.user")} required>
              <Select value={selectedMemberId} onValueChange={(value) => setSelectedMemberId(value)} disabled={candidateQuery.isPending || existingMemberIds.isPending || candidates.length === 0}>
                <SelectTrigger className="w-full" aria-label={t("companies:addMember.user")}><SelectValue placeholder={candidateQuery.isPending || existingMemberIds.isPending ? t("common:states.loading") : t("companies:addMember.chooseUser")} /></SelectTrigger>
                <SelectContent>{candidates.map((member) => <SelectItem key={member.memberId} value={member.memberId}>{member.displayName}{" · "}{member.email ?? t("companies:addMember.withoutEmail")}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <FormField label={t("companies:addMember.roles")}>
              <MultiSelect options={selectableRoles.map((role) => ({ value: role.id, label: role.name }))} value={roleIds} onChange={setRoleIds} placeholder={t("companies:addMember.chooseRoles")} />
            </FormField>
            {/* «Criterio · Diálogos»: el error general, también el 409, en la franja arriba de los botones. */}
            {candidateQuery.isError ? <FormError message={apiErrorMessage(candidateQuery.error, t)} /> : null}
            {existingMemberIds.isError ? <FormError message={apiErrorMessage(existingMemberIds.error, t)} /> : null}
            <FormError message={actionErrorMessage(mutationError, t)} />
          </div>
          <DialogFooter className="border-t border-[var(--borde)] px-5 py-4">
            <Button type="button" variant="outline" onClick={closeAdd}>{t("common:actions.cancel")}</Button>
            <Button type="submit" disabled={!selectedMemberId || addMember.isPending}>{addMember.isPending ? t("common:states.saving") : t("companies:actions.addMember")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <Dialog open={roleTarget !== null} onOpenChange={(open) => { if (!open) closeRoles(); }}>
      <DialogContent mobileFullHeight>
        <DialogHeader><DialogTitle>{roleTarget ? t("companies:editMemberRoles.title", { name: roleTarget.displayName }) : t("companies:editMemberRoles.title", { name: "" })}</DialogTitle><DialogDescription>{data.name}</DialogDescription></DialogHeader>
        <div className="flex flex-col gap-4 px-5 py-4">
          <FormField label={t("companies:editMemberRoles.roles")}>
            <MultiSelect options={selectableRoles.map((role) => ({ value: role.id, label: role.name }))} value={roleDraft} onChange={(next) => { setRoleDraft(next); setMutationError(undefined); }} placeholder={t("companies:addMember.chooseRoles")} />
          </FormField>
          {/* Tablero Empresa (v97): el error, una sola vez, en la franja con su ícono arriba de los botones. */}
          <FormError message={actionErrorMessage(mutationError, t)} />
        </div>
        <DialogFooter className="border-t border-[var(--borde)] px-5 py-4">
          <Button type="button" variant="outline" onClick={closeRoles}>{t("common:actions.cancel")}</Button>
          <Button type="button" disabled={!roleTarget || changeMemberRoles.isPending} onClick={() => roleTarget && changeMemberRoles.mutate(roleTarget)}>{changeMemberRoles.isPending ? t("common:states.saving") : t("companies:editMemberRoles.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <ConfirmDialog open={statusTarget !== null} onOpenChange={(open) => { if (!open) setStatusTarget(null); }}
      title={statusTarget ? t("companies:confirm.removeMember", { name: statusTarget.displayName }) : ""}
      description={t("companies:confirm.removeMemberDescription", { company: data.name })}
      confirmLabel={t("companies:confirm.removeMemberConfirm")} destructive
      onConfirm={() => { if (statusTarget) changeMemberState.mutate(statusTarget); }} />
    <ConfirmDialog open={companyStatusConfirm} onOpenChange={setCompanyStatusConfirm}
      title={t("companies:confirm.deactivate", { name: data.name })}
      description={t("companies:confirm.deactivateDescription")}
      confirmLabel={t("companies:confirm.deactivateConfirm")} destructive onConfirm={() => changeCompanyState.mutate()} />

    <Dialog open={editOpen} onOpenChange={(open) => { if (!open) closeEdit(); }}>
      <DialogContent mobileFullHeight>
        <DialogHeader><DialogTitle>{t("companies:editTitle")}</DialogTitle></DialogHeader>
        <form onSubmit={submitEdit} className="flex min-h-0 flex-col">
          <div className="flex flex-col gap-4 overflow-y-auto px-5 py-4">
            <CompanyFields draft={editDraft} onChange={setEditDraft} taxIdValid={taxIdValid} />
            <FormError message={actionErrorMessage(editFailure, t)} />
          </div>
          <DialogFooter className="border-t border-[var(--borde)] px-5 py-4">
            <Button type="button" variant="outline" onClick={closeEdit}>{t("common:actions.cancel")}</Button>
            <Button type="submit" disabled={saveCompany.isPending || !taxIdValid}>{saveCompany.isPending ? t("common:states.saving") : t("companies:form.save")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </>;
}
