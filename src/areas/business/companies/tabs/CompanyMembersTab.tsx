import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Power, RotateCw, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { usePermissions } from "@/auth/usePermissions";
import { apiErrorMessage, toastActionError } from "@/shared/api/errorMessage";
import type { CompanyMemberResponse, CompanyResponse, RoleResponse } from "@/shared/api/types";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { FilterBar } from "@/shared/ui/FilterBar";
import { FormError } from "@/shared/ui/FormError";
import { Pagination } from "@/shared/ui/Pagination";
import { RowActions } from "@/shared/ui/RowActions";
import { Surface } from "@/shared/ui/Surface";
import {
  changeCompanyMemberStatus,
  companiesQueryRoot,
  companyMembersCountQueryKey,
  fetchCompanyMemberCounts,
  resendCompanyInvitation,
  revokeCompanyInvitation,
} from "../api/companies";
import { companyMemberPhoneRow, createCompanyMemberColumns, isCompanyInvitation } from "../columns";
import { MemberRolesDialog } from "../components/MemberRolesDialog";
import { memberStates, type CompanyMembersList } from "./useCompanyMembers";

/// Un miembro elegido desde su ⋮: el diálogo le devuelve el foco a ese botón al cerrar.
interface MemberTarget {
  member: CompanyMemberResponse;
  trigger: HTMLButtonElement | null;
}

/**
 * Pestaña Miembros de la ficha (tableros Empresa y M-Empresa): búsqueda, filtros de rol y de estado con sus cantidades,
 * la tabla (las filas en el teléfono) y el ⋮ de cada miembro. Es dueña de sus diálogos: los roles de un miembro y las
 * confirmaciones para quitarlo o para revocar su invitación.
 */
export function CompanyMembersTab({ company, list, roles }: {
  company: CompanyResponse;
  list: CompanyMembersList;
  /** Los roles que se asignan en esta empresa: las opciones del filtro «Rol» y del diálogo de roles. */
  roles: readonly RoleResponse[];
}) {
  const { t } = useTranslation(["companies", "common"]);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { can, canInCompany } = usePermissions();
  const canReadMembers = canInCompany(company.id, "company.members.read");
  const canManageMembers = canInCompany(company.id, "company.members.manage");
  // La ficha de Usuario pide `users.read` de la organización: sin ese permiso, «Ver usuario» no se ofrece (B4).
  const canViewUsers = can("users.read");
  const { filters, pagination, query, result: members, paginationProps } = list;
  const { state, roleId, withoutRoles } = query;
  const search = query.search ?? undefined;
  const counts = useQuery({ queryKey: companyMembersCountQueryKey(company.id, search), queryFn: () => fetchCompanyMemberCounts(company.id, search),
    enabled: canReadMembers, meta: { silent: true } });
  const [rolesTarget, setRolesTarget] = useState<MemberTarget | null>(null);
  const [removeTarget, setRemoveTarget] = useState<MemberTarget | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<MemberTarget | null>(null);
  const changeMemberState = useMutation({
    mutationFn: (member: CompanyMemberResponse) => changeCompanyMemberStatus(company.id, member.memberId,
      { status: member.membershipStatus === "Active" ? "Inactive" : "Active", version: member.version }),
    onSuccess: async (_result, member) => {
      setRemoveTarget(null);
      toast.success(t(member.membershipStatus === "Active" ? "companies:messages.memberRemoved" : "companies:messages.memberRestored", { name: member.displayName }));
      await queryClient.invalidateQueries({ queryKey: companiesQueryRoot });
    },
    onError: (error) => toastActionError(error, t),
  });
  // Decisión 97: la invitación de un miembro se reenvía o se revoca desde su empresa. Reenviar manda la misma invitación,
  // con su clave de idempotencia; la lista se vuelve a leer con la invitación nueva y su vencimiento.
  const resendInvitation = useIdempotentMutation((member: CompanyMemberResponse, key) => resendCompanyInvitation(company.id, member.invitationId ?? "", key));
  const revokeInvitation = useMutation({
    mutationFn: (member: CompanyMemberResponse) => revokeCompanyInvitation(company.id, member.invitationId ?? ""),
    onSuccess: async (_result, member) => {
      setRevokeTarget(null);
      toast.success(t("companies:messages.invitationRevoked", { email: member.email ?? member.displayName }));
      await queryClient.invalidateQueries({ queryKey: companiesQueryRoot });
    },
    onError: (error) => toastActionError(error, t),
  });
  const resend = (member: CompanyMemberResponse) => resendInvitation.mutate(member, {
    onSuccess: async () => {
      toast.success(t("companies:messages.invitationResent", { email: member.email ?? member.displayName }));
      await queryClient.invalidateQueries({ queryKey: companiesQueryRoot });
    },
    onError: (error) => toastActionError(error, t),
  });

  if (!canReadMembers) return <FormError message={t("companies:detail.membersForbidden")} />;

  const editable = company.status === "Active";
  const memberActions = (member: CompanyMemberResponse) => {
    // Tableros Empresa y M-Empresa (v108): el ⋮ de una invitación trae solo «Reenviar invitación» y, de peligro, «Revocar
    // invitación». Sin `invitationId` (una invitación que no se resuelve desde esta empresa) va sin ⋮.
    if (isCompanyInvitation(member)) {
      const hidden = !canManageMembers || !editable || !member.invitationId;
      return <RowActions label={t("companies:memberActions", { name: member.displayName })} title={member.displayName} actions={[
        { label: t("companies:actions.resendInvitation"), accessibleName: t("companies:actions.resendInvitation"), icon: RotateCw, hidden, onSelect: () => resend(member) },
        { label: t("companies:actions.revokeInvitation"), accessibleName: t("companies:actions.revokeInvitation"), icon: Trash2, destructive: true, hidden,
          onSelect: (trigger) => setRevokeTarget({ member, trigger }) },
      ]} />;
    }
    const removing = member.membershipStatus === "Active";
    return <RowActions label={t("companies:memberActions", { name: member.displayName })} title={member.displayName} actions={[
      { label: t("companies:actions.changeRoles"), accessibleName: t("companies:actions.changeRoles"), icon: ShieldCheck, onSelect: (trigger) => setRolesTarget({ member, trigger }),
        hidden: !canManageMembers || member.state !== "Active" || member.membershipStatus !== "Active" || !editable },
      { label: t("companies:actions.viewUser"), accessibleName: t("companies:actions.viewUser"), icon: UserRound, onSelect: () => { void navigate(`/org/usuarios/${encodeURIComponent(member.memberId)}`); }, hidden: !canViewUsers },
      // Tablero Empresa: «Quitar de la empresa» (también con la baja pedida) pide confirmación; «Volver a sumar» es directo.
      { label: t(removing ? "companies:actions.removeMember" : "companies:actions.restoreMember"), accessibleName: t(removing ? "companies:actions.removeMember" : "companies:actions.restoreMember"),
        icon: Power, destructive: removing, hidden: !canManageMembers || !editable,
        onSelect: (trigger) => { if (removing) setRemoveTarget({ member, trigger }); else changeMemberState.mutate(member); } },
    ]} />;
  };
  const columns: Column<CompanyMemberResponse>[] = [
    ...createCompanyMemberColumns(t),
    { id: "actions", header: t("companies:columns.actions"), type: "actions", cell: memberActions },
  ];
  // Sin filtro el botón dice «Estado: todos» o «Rol: todos» y el menú ofrece «Todos», como el tablero.
  const countForState = (value: typeof memberStates[number]) => value === undefined ? counts.data?.all : value === "Active" ? counts.data?.active
    : value === "PendingDeletion" ? counts.data?.pendingDeletion : value === "Inactive" ? counts.data?.inactive : counts.data?.invited;
  const filtered = Boolean(state || roleId || withoutRoles || pagination.search);

  return <>
    {counts.isError ? <FormError message={apiErrorMessage(counts.error, t)} /> : null}
    <FilterBar phoneTools="none" label={t("companies:detail.filters.label")} searchLabel={t("companies:detail.filters.search")} searchValue={pagination.search ?? ""} onSearchChange={pagination.setSearch}
      filters={[
        { key: "roleId", label: t("companies:detail.filters.role"), menuLabel: t("companies:detail.filters.roleMenu"), value: filters.values.roleId ?? "", active: filters.values.roleId !== undefined,
          onChange: (value) => filters.setFilter("roleId", value === "all" ? undefined : value),
          options: [{ value: "all", label: t("companies:detail.filters.allRoles") }, { value: "none", label: t("companies:detail.filters.withoutRoles") }, ...roles.map((role) => ({ value: role.id, label: role.name }))] },
        { key: "state", label: t("companies:detail.filters.state"), menuLabel: t("companies:detail.filters.stateMenu"), value: state ?? "", active: state !== undefined,
          onChange: (value) => filters.setFilter("state", value === "all" ? undefined : value),
          options: memberStates.map((value) => ({ value: value ?? "all", label: value ? t(`companies:detail.filters.states.${value}`) : t("companies:detail.filters.allStates"), count: countForState(value) })) },
      ]}
      clearLabel={t("common:actions.clear")} onClear={filters.clear} />
    <Surface className="overflow-hidden" phoneFlush>
      <DataTable columns={columns} mobileRow={(member) => companyMemberPhoneRow(member, t, memberActions(member))} rows={members.data?.items ?? []} rowKey={(member) => member.memberId}
        isLoading={members.isPending} isFetching={members.isFetching} error={members.error ? apiErrorMessage(members.error, t) : undefined}
        onRetry={() => { void members.refetch(); void counts.refetch(); }}
        emptyTitle={filtered ? t("companies:detail.empty.filtered") : t("companies:detail.empty.all")}
        emptyAction={filtered ? <Button type="button" variant="outline" onClick={filters.clear}>{t("common:actions.clearFilters")}</Button> : undefined}
        sort={pagination.sort} onSortChange={pagination.toggleSort} />
      {paginationProps ? <Pagination {...paginationProps} /> : null}
    </Surface>

    {rolesTarget ? <MemberRolesDialog companyId={company.id} member={rolesTarget.member} roles={roles} returnFocusTo={rolesTarget.trigger}
      onClose={() => setRolesTarget(null)} /> : null}
    {removeTarget ? <ConfirmDialog open onOpenChange={(open) => { if (!open) setRemoveTarget(null); }}
      title={t("companies:confirm.removeMember", { name: removeTarget.member.displayName })}
      description={t("companies:confirm.removeMemberDescription", { company: company.name })}
      confirmLabel={t("companies:confirm.removeMemberConfirm")} destructive returnFocusTo={removeTarget.trigger}
      onConfirm={() => changeMemberState.mutate(removeTarget.member)} /> : null}
    {/* Tablero Empresa: revocar pide confirmación con el correo de la invitación. */}
    {revokeTarget ? <ConfirmDialog open onOpenChange={(open) => { if (!open) setRevokeTarget(null); }}
      title={t("companies:confirm.revokeInvitation", { email: revokeTarget.member.email ?? revokeTarget.member.displayName })}
      description={t("companies:confirm.revokeInvitationDescription")}
      confirmLabel={t("companies:confirm.revokeInvitationConfirm")} destructive returnFocusTo={revokeTarget.trigger}
      onConfirm={() => revokeInvitation.mutate(revokeTarget.member)} /> : null}
  </>;
}
