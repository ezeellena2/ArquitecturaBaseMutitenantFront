import { useMutation, useQuery, useQueries, useQueryClient } from "@tanstack/react-query";
import { Building2, Mail, Plus, RotateCw, Settings2, Trash2, UserRound } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { useCurrentUser } from "@/auth/useCurrentUser";
import { ApiError } from "@/shared/api/ApiError";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import type { OrganizationUserResponse, RoleResponse, UpdateOrganizationUserRequest } from "@/shared/api/types";
import { Button } from "@/shared/ui/button";
import { ConcurrencyBanner } from "@/shared/ui/ConcurrencyBanner";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { FormError } from "@/shared/ui/FormError";
import { FormField } from "@/shared/ui/FormField";
import { ForbiddenPage } from "@/shared/ui/ForbiddenPage";
import { MultiSelect } from "@/shared/ui/MultiSelect";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { RowActions } from "@/shared/ui/RowActions";
import { Page } from "@/shared/ui/Page";
import { Surface } from "@/shared/ui/Surface";
import { EmptyState } from "@/shared/ui/EmptyState";
import { DateText } from "@/shared/ui/format/DateText";
import { toastError } from "@/shared/ui/sonner";
import { toast } from "sonner";
import { changeUserStatus, fetchAssignableRoles, fetchCompanyOptions, fetchUser, removeUser, resendUserInvitation, revokeUserInvitation, updateUser, userCompaniesQueryKey, userQueryKey, userRolesQueryKey, usersQueryRoot } from "../api/users";

type CompanyAssignmentDraft = { companyId: string; roleIds: string[] };
type CompanyDialogDraft = { mode: "add" | "roles"; companyId: string; roleIds: string[] };

function failureMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.detail ?? fallback : fallback;
}

function organizationRoleIds(user: OrganizationUserResponse): string[] {
  return user.roles.filter((role) => role.scope === "Organization").map((role) => role.id);
}

export function UserDetailPage() {
  const { t } = useTranslation(["users", "common"]);
  const { memberId = "" } = useParams();
  const { data: currentUser } = useCurrentUser();
  const canRead = currentUser?.permissions?.includes("users.read") === true;
  const canInvite = currentUser?.permissions?.includes("users.invite") === true;
  const canManage = currentUser?.permissions?.includes("users.manage") === true;
  const client = useQueryClient();
  const navigate = useNavigate();
  const user = useQuery({ queryKey: userQueryKey(memberId), queryFn: () => fetchUser(memberId), enabled: canRead && Boolean(memberId), meta: { silent: true } });
  const [roleDraft, setRoleDraft] = useState<string[] | null>(null);
  const [companyDialog, setCompanyDialog] = useState<CompanyDialogDraft | null>(null);
  const [failure, setFailure] = useState<unknown>();
  const [confirmAction, setConfirmAction] = useState<"disable" | "remove" | "revoke" | null>(null);
  const currentRoleIds = roleDraft ?? (user.data ? organizationRoleIds(user.data) : []);
  const roles = useQueries({ queries: (["Organization", "Company"] as const).map((scope) => ({
    queryKey: userRolesQueryKey(scope), queryFn: () => fetchAssignableRoles(scope), enabled: canManage && user.data !== undefined,
    meta: { silent: true },
  })) });
  const companies = useQuery({ queryKey: userCompaniesQueryKey, queryFn: fetchCompanyOptions, enabled: canManage && user.data !== undefined, meta: { silent: true } });
  const orgRoles = roles[0].data?.items ?? [];
  const companyRoles = roles[1].data?.items ?? [];
  const activeCompanies = (companies.data?.items ?? []).filter((company) => company.status === "Active");
  const save = useMutation({
    mutationFn: ({ request }: { request: UpdateOrganizationUserRequest; messageKey: string; preserveRoleDraft?: boolean }) => updateUser(memberId, request),
    onSuccess: async (_result, { messageKey, preserveRoleDraft }) => { setFailure(undefined); if (!preserveRoleDraft) setRoleDraft(null); setCompanyDialog(null); toast.success(t(messageKey)); await Promise.all([client.invalidateQueries({ queryKey: userQueryKey(memberId) }), client.invalidateQueries({ queryKey: usersQueryRoot })]); },
    onError: (error) => setFailure(error),
  });
  const setStatus = useMutation({
    mutationFn: (isActive: boolean) => changeUserStatus(memberId, { isActive, version: user.data?.version }),
    onSuccess: async (_result, isActive) => { setConfirmAction(null); toast.success(t(isActive ? "users:messages.enabled" : "users:messages.disabled")); await Promise.all([client.invalidateQueries({ queryKey: userQueryKey(memberId) }), client.invalidateQueries({ queryKey: usersQueryRoot })]); },
    onError: (error) => toastError(failureMessage(error, t("common:states.error"))),
  });
  const remove = useMutation({
    mutationFn: () => removeUser(memberId, user.data?.version ?? 0),
    onSuccess: async () => { setConfirmAction(null); toast.success(t("users:messages.removed")); await client.invalidateQueries({ queryKey: usersQueryRoot }); void navigate("/org/usuarios"); },
    onError: (error) => toastError(failureMessage(error, t("common:states.error"))),
  });
  const revoke = useMutation({
    mutationFn: (invitationId: string) => revokeUserInvitation(invitationId),
    onSuccess: async () => { setConfirmAction(null); toast.success(t("users:messages.revoked")); await Promise.all([client.invalidateQueries({ queryKey: userQueryKey(memberId) }), client.invalidateQueries({ queryKey: usersQueryRoot })]); },
    onError: (error) => toastError(failureMessage(error, t("common:states.error"))),
  });
  const resend = useIdempotentMutation((invitationId: string, key) => resendUserInvitation(invitationId, key));

  if (!canRead) return <ForbiddenPage homePath="/org" />;
  if (user.isPending) return <Page backTo={{ to: "/org/usuarios", label: t("users:back") }} title={t("users:detail.loading")}><p role="status">{t("common:states.loading")}</p></Page>;
  if (user.error) return <Page backTo={{ to: "/org/usuarios", label: t("users:back") }} title={t("users:detail.title")}><FormError message={failureMessage(user.error, t("common:states.error"))} /></Page>;
  if (!user.data) return <Page backTo={{ to: "/org/usuarios", label: t("users:back") }} title={t("users:detail.title")}><EmptyState title={t("users:empty.missing")} /></Page>;

  const member = user.data;
  const isEditableState = member.state !== "PendingDeletion";
  const isDirty = JSON.stringify(organizationRoleIds(member)) !== JSON.stringify(currentRoleIds);
  const saveError = failure instanceof ApiError ? failure : undefined;
  const inactiveMemberships = member.companies.filter((company) => company.status !== "Active");
  const registryById = new Map((companies.data?.items ?? []).map((company) => [company.id, company]));
  const preservedCompanyIds = new Set(inactiveMemberships.map((company) => company.companyId));
  for (const company of member.companies) {
    if (registryById.get(company.companyId)?.status === "Inactive") preservedCompanyIds.add(company.companyId);
  }
  const changeableAssignments = member.companies.filter((company) => company.status === "Active" && !preservedCompanyIds.has(company.companyId))
    .map((company) => ({ companyId: company.companyId, roleIds: company.roles.map((role) => role.id) }));
  const hasUnavailableMemberships = preservedCompanyIds.size > 0;
  const assignedCompanyIds = new Set(member.companies.map((company) => company.companyId));
  const dialogCompanyName = activeCompanies.find((company) => company.id === companyDialog?.companyId)?.name ?? "";
  const dialogCompanyRoles = companyRoles.filter((role) => role.scope === "AnyCompany" || role.companyId === companyDialog?.companyId);

  function updateOrganizationRoles(roleIds: string[]) {
    setRoleDraft(roleIds);
    setFailure(undefined);
  }

  function updateRequest(assignments: CompanyAssignmentDraft[]): UpdateOrganizationUserRequest {
    return { roleIds: currentRoleIds, companies: assignments, version: member.version };
  }

  function updateCompanyRequest(assignments: CompanyAssignmentDraft[]): UpdateOrganizationUserRequest {
    return { roleIds: organizationRoleIds(member), companies: assignments, version: member.version };
  }

  async function saveCompanyAssignments(assignments: CompanyAssignmentDraft[], messageKey: string) {
    setFailure(undefined);
    try {
      await save.mutateAsync({ request: updateCompanyRequest(assignments), messageKey, preserveRoleDraft: true });
    } catch { /* El error de concurrencia o validación queda visible en la ficha. */ }
  }

  function openCompanyDialog(mode: "add" | "roles", assignment?: CompanyAssignmentDraft) {
    setCompanyDialog({ mode, companyId: assignment?.companyId ?? "", roleIds: assignment?.roleIds ?? [] });
    setFailure(undefined);
  }

  async function saveCompanyDialog() {
    if (!companyDialog?.companyId) return;
    const nextAssignments = companyDialog.mode === "add"
      ? [...changeableAssignments, { companyId: companyDialog.companyId, roleIds: companyDialog.roleIds }]
      : changeableAssignments.map((assignment) => assignment.companyId === companyDialog.companyId
        ? { ...assignment, roleIds: companyDialog.roleIds }
        : assignment);
    await saveCompanyAssignments(nextAssignments, companyDialog.mode === "add"
      ? "users:messages.companyAdded" : "users:messages.companyRolesSaved");
  }

  async function removeCompany(companyId: string) {
    const nextAssignments = changeableAssignments.filter((assignment) => assignment.companyId !== companyId);
    await saveCompanyAssignments(nextAssignments, "users:messages.companyRemoved");
  }

  async function saveChanges() {
    setFailure(undefined);
    try {
      await save.mutateAsync({ request: updateRequest(changeableAssignments), messageKey: "users:messages.saved" });
    } catch { /* El error de concurrencia o validación queda visible en la ficha. */ }
  }

  return <>
    <ConcurrencyBanner error={saveError} isDirty={isDirty || companyDialog !== null} onSeeNew={() => { void user.refetch().then((result) => { if (result.data) setRoleDraft(organizationRoleIds(result.data)); setCompanyDialog(null); setFailure(undefined); }); }} onContinueEditing={() => setFailure(undefined)} />
    <Page icon={UserRound} backTo={{ to: "/org/usuarios", label: t("users:back") }} title={member.displayName || member.email || t("users:detail.title")} summary={member.email ?? undefined} status={<span className="rounded-full bg-[var(--s2)] px-2 py-0.5 text-xs">{t(`users:states.${member.state}`)}</span>} actions={canManage ? <>
      {member.state === "Active" ? <Button type="button" variant="outline" onClick={() => setConfirmAction("disable")}>{t("users:actions.disable")}</Button> : null}
      {member.state === "Inactive" ? <Button type="button" variant="outline" onClick={() => setStatus.mutate(true)}>{t("users:actions.enable")}</Button> : null}
      {member.state === "Invited" || member.state === "Expired" ? <>
        {canInvite && member.invitationId ? <Button type="button" variant="outline" onClick={() => { void resend.mutateAsync(member.invitationId!).then(async () => { toast.success(t("users:messages.resent")); await client.invalidateQueries({ queryKey: userQueryKey(memberId) }); }).catch((error: unknown) => toastError(failureMessage(error, t("common:states.error")))); }}><RotateCw aria-hidden="true" className="size-4" />{t("users:actions.resend")}</Button> : null}
        {member.invitationId ? <Button type="button" variant="destructive" onClick={() => setConfirmAction("revoke")}>{t("users:actions.revoke")}</Button> : null}
      </> : null}
      {member.state !== "Invited" && member.state !== "Expired" ? <Button type="button" variant="destructive" onClick={() => setConfirmAction("remove")}>{t("users:actions.remove")}</Button> : null}
    </> : undefined}>
      <div className="flex flex-col gap-4">
        {failure && !(failure instanceof ApiError && failure.code === "General.ConcurrencyConflict") ? <FormError message={failureMessage(failure, t("common:states.error"))} /> : null}
        {member.state === "PendingDeletion" ? <p className="rounded-[10px] border border-[var(--alerta)] bg-[var(--alerta-t)] p-3 text-[13px] text-[var(--t1)]">{t("users:detail.pendingDeletion")}</p> : null}
    <Surface className="overflow-hidden">
          <header className="flex min-h-10 items-center border-b border-[var(--borde)] bg-[var(--cab)] px-4 text-[13px] font-semibold text-[var(--t1)]"><h2>{t("users:detail.accessTitle")}</h2></header>
          <div className="grid gap-4 p-4 md:grid-cols-2 md:p-5">
            <FormField label={t("users:invite.email")}><p className="min-h-9 content-center break-all text-[13px] text-[var(--t1)]">{member.email ?? <span className="text-[var(--t3)]">{"—"}</span>}</p></FormField>
            <FormField label={t("users:detail.joined")}><p className="min-h-9 content-center text-[13px] text-[var(--t1)]"><DateText value={member.createdAtUtc} kind="date" /></p></FormField>
            {member.invitationIssuedAtUtc ? <FormField label={t("users:detail.invitationSent")}><p className="min-h-9 content-center text-[13px] text-[var(--t1)]"><DateText value={member.invitationIssuedAtUtc} kind="dateTime" /></p></FormField> : null}
            {member.invitationExpiresAtUtc ? <FormField label={t("users:columns.expires")}><p className="min-h-9 content-center text-[13px] text-[var(--t1)]"><DateText value={member.invitationExpiresAtUtc} kind="date" /></p></FormField> : null}
            {member.hasManagedEmail ? <p className="flex items-start gap-2 text-[13px] text-[var(--t2)] md:col-span-2"><Mail aria-hidden="true" className="mt-0.5 size-4 shrink-0" />{t("users:managedEmail")}</p> : null}
          </div>
        </Surface>

        <Surface className="overflow-hidden">
          <header className="flex min-h-10 items-center justify-between gap-3 border-b border-[var(--borde)] bg-[var(--cab)] px-4 text-[13px] font-semibold text-[var(--t1)]"><h2>{t("users:detail.organizationRoles")}</h2></header>
          <div className="p-4 md:p-5">
            {isEditableState ? <FormField label={t("users:detail.organizationRoles")}><MultiSelect options={orgRoles.map((role) => ({ value: role.id, label: role.name }))} value={currentRoleIds} onChange={updateOrganizationRoles} placeholder={t("users:invite.chooseRoles")} /></FormField>
              : <p className="text-[13px] text-[var(--t2)]">{t("users:detail.pendingDeletionRoles")}</p>}
          </div>
        </Surface>

        <Surface className="overflow-hidden">
          <header className="flex min-h-10 items-center justify-between gap-3 border-b border-[var(--borde)] bg-[var(--cab)] px-4 text-[13px] font-semibold text-[var(--t1)]">
            <h2>{t("users:detail.companyAccess")}</h2>
            {canManage && isEditableState ? <Button type="button" size="sm" variant="outline" disabled={!companies.data || activeCompanies.every((company) => assignedCompanyIds.has(company.id)) || save.isPending} onClick={() => openCompanyDialog("add")}><Plus aria-hidden="true" className="size-4" />{t("users:invite.addCompany")}</Button> : null}
          </header>
          <div className="flex flex-col gap-3 p-4 md:p-5">
            {hasUnavailableMemberships ? <p className="rounded-lg bg-[var(--s2)] p-3 text-[13px] text-[var(--t2)]">{t("users:detail.preservedCompanies")}</p> : null}
            {member.companies.filter((company) => preservedCompanyIds.has(company.companyId)).map((company) => <div key={company.companyId} className="rounded-lg border border-[var(--borde)] p-3">
              <div className="flex items-center gap-2 text-[13px] font-semibold"><Building2 aria-hidden="true" className="size-4 text-[var(--t2)]" />{company.companyName}<span className="ml-auto text-xs font-normal text-[var(--t2)]">{t("users:detail.companyInactive")}</span></div>
              <p className="mt-2 text-[13px] text-[var(--t2)]">{company.roles.map((role) => role.name).join(", ") || "—"}</p>
            </div>)}
            {changeableAssignments.map((assignment) => {
              const company = activeCompanies.find((item) => item.id === assignment.companyId);
              const companyName = company?.name ?? member.companies.find((item) => item.companyId === assignment.companyId)?.companyName ?? t("users:invite.chooseCompany");
              return <div key={`company-${assignment.companyId}`} className="grid gap-3 rounded-lg border border-[var(--borde)] p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto] md:items-end">
                <div className="min-w-0 self-center">
                  <p className="truncate text-[13px] font-semibold text-[var(--t1)]">{companyName}</p>
                  <p className="mt-1 truncate text-[13px] text-[var(--t2)]">{assignment.roleIds.map((id) => companyRoles.find((role) => role.id === id)?.name).filter(Boolean).join(", ") || "—"}</p>
                </div>
                {canManage && isEditableState ? <RowActions label={t("users:detail.companyActions", { name: companyName })} actions={[
                  { label: t("users:detail.changeCompanyRoles"), accessibleName: t("users:detail.changeCompanyRoles"), icon: Settings2, onSelect: () => openCompanyDialog("roles", assignment) },
                  { label: t("users:detail.removeCompanyAction"), accessibleName: t("users:detail.removeCompanyAction"), icon: Trash2, onSelect: () => { void removeCompany(assignment.companyId); }, destructive: true },
                ]} /> : null}
              </div>;
            })}
            {changeableAssignments.length === 0 && preservedCompanyIds.size === 0 ? <p className="text-[13px] text-[var(--t2)]">{t("users:detail.noCompanies")}</p> : null}
          </div>
        </Surface>

        {canManage && isEditableState && isDirty ? <div className="flex justify-end"><Button type="button" disabled={save.isPending || !roles[0].data || !roles[1].data || !companies.data} onClick={() => { void saveChanges(); }}>{save.isPending ? t("common:states.saving") : t("users:detail.save")}</Button></div> : null}
      </div>
    </Page>
    <Dialog open={companyDialog !== null} onOpenChange={(open) => { if (!open && !save.isPending) setCompanyDialog(null); }}>
      <DialogContent className="md:max-w-[480px]">
        <DialogHeader><DialogTitle>{companyDialog?.mode === "add" ? t("users:detail.addCompanyTitle") : t("users:detail.changeCompanyRolesTitle", { name: dialogCompanyName })}</DialogTitle></DialogHeader>
        <div className="flex flex-col gap-4 p-5">
          {companyDialog?.mode === "add" ? <FormField label={t("users:invite.company")} required>
            <Select value={companyDialog.companyId} onValueChange={(companyId) => setCompanyDialog({ ...companyDialog, companyId, roleIds: [] })}>
              <SelectTrigger className="w-full"><SelectValue placeholder={t("users:invite.chooseCompany")} /></SelectTrigger>
              <SelectContent position="popper">{activeCompanies.filter((company) => !assignedCompanyIds.has(company.id)).map((company) => <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>)}</SelectContent>
            </Select>
          </FormField> : null}
          {companyDialog?.companyId ? <FormField label={t("users:invite.companyRoles")}>
            <MultiSelect options={dialogCompanyRoles.map((role: RoleResponse) => ({ value: role.id, label: role.name }))} value={companyDialog.roleIds} onChange={(roleIds) => setCompanyDialog({ ...companyDialog, roleIds })} placeholder={t("users:invite.chooseRoles")} />
          </FormField> : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={save.isPending} onClick={() => setCompanyDialog(null)}>{t("common:actions.cancel")}</Button>
          <Button type="button" disabled={save.isPending || !companyDialog?.companyId} onClick={() => { void saveCompanyDialog(); }}>{save.isPending ? t("common:states.saving") : companyDialog?.mode === "add" ? t("users:detail.addCompanyTitle") : t("users:detail.saveCompanyRoles")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <ConfirmDialog open={confirmAction !== null} onOpenChange={(open) => { if (!open) setConfirmAction(null); }} destructive
      title={t(`users:confirm.${confirmAction}`, { name: member.displayName || member.email || "" })}
      description={t(`users:confirm.${confirmAction}Description`)}
      confirmLabel={t(`users:actions.${confirmAction}`)}
      onConfirm={() => {
        if (confirmAction === "disable") setStatus.mutate(false);
        if (confirmAction === "remove") remove.mutate();
        if (confirmAction === "revoke" && member.invitationId) revoke.mutate(member.invitationId);
      }}
    />
  </>;
}
