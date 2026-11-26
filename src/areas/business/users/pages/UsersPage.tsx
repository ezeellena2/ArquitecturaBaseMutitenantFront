import { companyOptions } from "@/shared/api/resourceOptions";
import { useResourceOptions } from "@/shared/hooks/useResourceOptions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Power, Trash2 } from "lucide-react";
import { CloseIcon, RotateIcon } from "@/shared/ui/icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import { useCurrentUser } from "@/auth/useCurrentUser";
import { usePermissions } from "@/auth/usePermissions";
import { apiErrorMessage, isRateLimitError, toastActionError } from "@/shared/api/errorMessage";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import type { OrganizationUserResponse, OrganizationUserState } from "@/shared/api/types";
import { usePagedQuery } from "@/shared/hooks/usePagedQuery";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { FilterBar } from "@/shared/ui/FilterBar";
import { Page } from "@/shared/ui/Page";
import { Pagination } from "@/shared/ui/Pagination";
import { RowActions, type RowAction } from "@/shared/ui/RowActions";
import { useResourceAction } from "@/shared/hooks/useResourceAction";
import { Surface } from "@/shared/ui/Surface";
import { toast } from "sonner";
import { changeUserStatus, fetchUserCounts, fetchUsers, removeUser, resendUserInvitation, revokeUserInvitation, userCountsQueryKey, usersQueryKey, usersQueryRoot, type UsersQuery } from "../api/users";
import { createUserColumns, userContactText, userInvitationChannel, userPhoneRow } from "../columns";
import { InviteUserDialog } from "../components/InviteUserDialog";
import { activeOrganization } from "@/tenancy/access";
import { useModulePageActions } from "@/shared/modules/useModules";
import { useFormat } from "@/shared/format/useFormat";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { invitationPerson, useResendInvitation } from "@/shared/hooks/useResendInvitation";
import { ResendInvitationDialog } from "@/shared/ui/InvitationDelivery";

const userFilterKeys = ["state", "companyId"] as const;
// Orden del filtro «Estado» del tablero Usuarios.
const userStates: readonly (OrganizationUserState | undefined)[] = [undefined, "Active", "Invited", "Expired", "Inactive", "PendingDeletion"];
// «Sin empresa» viaja en la URL como companyId=none y a la API como withoutCompany.
const withoutCompanyValue = "none";

/// El ⋮ de un usuario. El reenvío vive por invitación (R04), como AccountActions de Plataforma: cada una con su clave y su
/// dueño, así reenviar otra no le cambia la clave y un reintento conserva sus avisos. Si la anterior quedó «Sin confirmar»,
/// reenviar pide revisar con la persona antes (Usuarios-Base2, 0066 §4).
function UserRowActions({ member, label, title, actions, pending }: { member: OrganizationUserResponse; label: string; title: string;
  actions: (resend: (trigger: HTMLElement | null) => void) => readonly RowAction[]; pending: boolean }) {
  const { t } = useTranslation(["users", "common"]);
  const client = useQueryClient();
  const action = useResourceAction<{ invitationId: string; email: string }>({ onError: (error) => toastActionError(error, t) });
  const resend = useIdempotentMutation(action.guarded((operation, key: string) => resendUserInvitation(operation.invitationId, key),
    (_response, operation) => { toast.success(t("users:messages.resent", { email: operation.email })); void client.invalidateQueries({ queryKey: usersQueryRoot }); }),
    { meta: action.meta, sameOperation: (previous, next) => previous.invitationId === next.invitationId });
  const format = useFormat();
  const send = (settled?: () => void) => {
    if (member.invitationId) resend.mutate({ invitationId: member.invitationId, email: userContactText(member, format) }, { onSettled: settled });
  };
  const confirmResend = useResendInvitation(member.invitationDelivery, send);
  // Reenviar y Reactivar van directo a la red: mientras esperan, el ⋮ muestra que trabaja (115).
  return <>
    <RowActions label={label} title={title} actions={actions(confirmResend.start)} pending={pending || resend.isPending} />
    <ResendInvitationDialog resend={confirmResend} name={title} person={invitationPerson(member.displayName)} channel={userInvitationChannel(member)} pending={resend.isPending} />
  </>;
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
  const pageActions = useModulePageActions("users");
  const format = useFormat();
  const { phone } = useAppChrome();
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
  const { state, companyId, withoutCompany } = query;
  const companyFilter = withoutCompany ? withoutCompanyValue : companyId;
  // El resumen cuenta todo lo de la lista: los conteos se piden una vez, sin la búsqueda ni los filtros, porque los filtros
  // no llevan cantidades (143).
  const counts = useQuery({ queryKey: userCountsQueryKey({}), queryFn: () => fetchUserCounts({}), meta: { silent: true } });
  const companies = useResourceOptions(companyOptions, canFilterByCompany);
  // Las opciones del filtro «Empresa»: «Todas», cada empresa activa y «Sin empresa», sin cantidades (143).
  const companyCountTargets = ["all", ...(companies.data?.items ?? []).filter((company) => company.status === "Active").map((company) => company.id), withoutCompanyValue];
  const [inviteOpen, setInviteOpen] = useState(false);
  const [target, setTarget] = useState<OrganizationUserResponse | null>(null);
  const [confirmAction, setConfirmAction] = useState<"revoke" | "disable" | "remove" | null>(null);

  const invalidate = async () => client.invalidateQueries({ queryKey: usersQueryRoot });
  // La confirmación espera la respuesta y se cierra con ella, sea cual sea («Criterio · Diálogos»).
  const closeConfirmation = () => { setTarget(null); setConfirmAction(null); };
  const revoke = useMutation({
    mutationFn: (user: OrganizationUserResponse) => revokeUserInvitation(user.invitationId!),
    onSuccess: async (_result, user) => { toast.success(t("users:messages.revoked", { email: userContactText(user, format) })); setTarget(null); setConfirmAction(null); await invalidate(); },
    onError: (error) => { closeConfirmation(); toastActionError(error, t); },
  });
  const changeStatus = useMutation({
    mutationFn: (user: OrganizationUserResponse & { isActive: boolean }) => changeUserStatus(user.memberId, { isActive: user.isActive, version: user.version }),
    onSuccess: async (_result, user) => { toast.success(t(user.isActive ? "users:messages.enabled" : "users:messages.disabled", { name: user.displayName || userContactText(user, format) })); setTarget(null); setConfirmAction(null); await invalidate(); },
    onError: (error) => { closeConfirmation(); toastActionError(error, t); },
  });
  const remove = useMutation({
    mutationFn: (user: OrganizationUserResponse) => removeUser(user.memberId, user.version),
    onSuccess: async (_result, user) => { toast.success(t("users:messages.removed", { name: user.displayName || userContactText(user, format), organization: organizationName })); setTarget(null); setConfirmAction(null); await invalidate(); },
    onError: (error) => { closeConfirmation(); toastActionError(error, t); },
  });

  const rowActions = (member: OrganizationUserResponse) => <UserRowActions member={member} pending={changeStatus.isPending && changeStatus.variables?.memberId === member.memberId}
      label={t("users:rowActions", { name: member.displayName || userContactText(member, format) })}
      title={member.displayName || userContactText(member, format)}
      actions={(resend) => [
        { label: t("users:actions.view"), accessibleName: t("users:actions.view"), icon: Pencil, onSelect: () => { void navigate(`/org/usuarios/${encodeURIComponent(member.memberId)}`); } },
        { label: t("users:actions.resend"), accessibleName: t("users:actions.resend"), icon: RotateIcon, onSelect: resend, hidden: !canInvite || !member.invitationId || (member.state !== "Invited" && member.state !== "Expired") },
        { label: t("users:actions.enable"), accessibleName: t("users:actions.enable"), icon: Power, onSelect: () => changeStatus.mutate({ ...member, isActive: true }), hidden: !canManage || member.state !== "Inactive" },
        { label: t("users:actions.disable"), accessibleName: t("users:actions.disable"), icon: Power, destructive: true, onSelect: () => { setTarget(member); setConfirmAction("disable"); }, hidden: !canManage || member.state !== "Active" },
        // «Criterio · Menús» y tablero Usuarios (v109): abajo, después de la franja, en rojo y con la ✕.
        { label: t("users:actions.revoke"), accessibleName: t("users:actions.revoke"), icon: CloseIcon, destructive: true, onSelect: () => { setTarget(member); setConfirmAction("revoke"); }, hidden: !canManage || !member.invitationId || (member.state !== "Invited" && member.state !== "Expired") },
        { label: t("users:actions.remove"), accessibleName: t("users:actions.remove"), icon: Trash2, destructive: true, onSelect: () => { setTarget(member); setConfirmAction("remove"); }, hidden: !canManage || member.state !== "PendingDeletion" },
      ]}
    />;
  const tableColumns: Column<OrganizationUserResponse>[] = [
    ...createUserColumns(t),
    { id: "actions", header: t("users:columns.actions"), type: "actions", cell: rowActions },
  ];
  // «N invitaciones» del tablero: las pendientes y las vencidas.
  const listSummary = counts.data ? <span className="max-md:text-[0.75rem]">{t("users:summary", { total: format.formatInteger(counts.data.all), active: format.formatInteger(counts.data.active), invited: format.formatInteger(counts.data.invited + counts.data.expired) })}</span> : undefined;
  // Sin filtro el botón dice «Estado: todos» o «Empresa: todas» y el menú ofrece «Todos» o «Todas», como el tablero.
  const currentState = state ?? "";

  // Lo que suman los módulos («Cargar teléfonos», tablero Usuarios): un secundario en la banda y, en el teléfono, el ⋮ de
  // la barra (M-Usuarios).
  const moduleActions = pageActions.map((action) => <Button key={action.to} asChild variant="outline"><Link to={action.to}>{t(action.labelKey)}</Link></Button>);
  const invite = canInvite ? <Button type="button" onClick={() => setInviteOpen(true)}><Plus aria-hidden="true" className="size-3.5" strokeWidth={2.25} />{t("users:invite.open")}</Button> : null;

  return <>
    <Page title={t("users:title")} summary={listSummary} phoneBody="flush"
      fab={canInvite ? { label: t("users:invite.open"), onClick: () => setInviteOpen(true) } : undefined}
      moreActions={phone && pageActions.length ? { label: t("users:detail.moreActions"), items: pageActions.map((action) => ({ label: t(action.labelKey), onSelect: () => { void navigate(action.to); } })) } : undefined}
      actions={moduleActions.length || invite ? <>{phone ? null : moduleActions}{invite}</> : undefined}>
      <div className="flex flex-col gap-3 md:gap-3.5">
        <FilterBar sort={{ columns: tableColumns, value: pagination.sort, onChange: pagination.setSort }} screen={t("users:title")}
          label={t("users:filters.label")}
          searchLabel={t("users:filters.search")}
          searchValue={pagination.search ?? ""}
          onSearchChange={pagination.setSearch}
          filters={[
            { key: "state", label: t("users:filters.state"), menuLabel: t("users:filters.stateMenu"), value: currentState, active: state !== undefined, onChange: (value) => filters.setFilter("state", value === "all" ? undefined : value), options: userStates.map((value) => ({ value: value ?? "all", label: t(`users:filters.states.${value ?? "all"}`) })) },
            ...(canFilterByCompany ? [{ key: "companyId", label: t("users:filters.company"), menuLabel: t("users:filters.companyMenu"), remote: companies.remote, selectedLabel: companies.knownItems.find((item) => item.id === companyFilter)?.name, value: companyFilter ?? "", active: companyFilter !== undefined, onChange: (value: string) => filters.setFilter("companyId", value === "all" ? undefined : value), options: [
              ...companyCountTargets.map((target) => ({ value: target, label: target === "all" ? t("users:filters.allCompanies") : target === withoutCompanyValue ? t("users:filters.withoutCompany") : companies.data?.items.find((item) => item.id === target)?.name ?? target })),
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
            error={users.error ? isRateLimitError(users.error) ? t("users:loadFailed") : apiErrorMessage(users.error, t) : undefined}
            errorDescription={isRateLimitError(users.error) ? apiErrorMessage(users.error, t) : undefined}
            failure={users.error}
            onRetry={() => { void users.refetch(); void counts.refetch(); }}
            emptyTitle={state || companyFilter || pagination.search ? t("users:empty.filtered") : t("users:empty.all")}
            emptyAction={state || companyFilter || pagination.search ? <Button type="button" variant="outline" onClick={filters.clear}>{t("users:empty.clear")}</Button> : undefined}
            sort={pagination.sort}
            onSortChange={pagination.setSort}
          />
          {paginationProps ? <Pagination {...paginationProps} /> : null}
        </Surface>
      </div>
    </Page>

    {inviteOpen ? <InviteUserDialog onClose={() => setInviteOpen(false)} onInvited={invalidate} /> : null}

    <ConfirmDialog open={confirmAction !== null} onOpenChange={(open) => { if (!open) { setConfirmAction(null); setTarget(null); } }} destructive={confirmAction === "remove" || confirmAction === "revoke"}
      title={target ? t(`users:confirm.${confirmAction}`, { name: target.displayName || userContactText(target, format), email: userContactText(target, format), organization: organizationName }) : ""}
      description={confirmAction ? t(`users:confirm.${confirmAction}Description`, { organization: organizationName }) : undefined}
      confirmLabel={confirmAction ? t(`users:confirm.${confirmAction}Confirm`) : ""}
      pending={confirmAction === "revoke" ? revoke.isPending : confirmAction === "disable" ? changeStatus.isPending : confirmAction === "remove" ? remove.isPending : false}
      pendingLabel={confirmAction === "revoke" ? t("users:confirm.revoking") : confirmAction === "disable" ? t("users:confirm.disabling") : t("users:confirm.removing")}
      onConfirm={() => {
        if (!target || !confirmAction) return;
        if (confirmAction === "revoke" && target.invitationId) revoke.mutate(target);
        if (confirmAction === "disable") changeStatus.mutate({ ...target, isActive: false });
        if (confirmAction === "remove") remove.mutate(target);
      }}
    />
  </>;
}
