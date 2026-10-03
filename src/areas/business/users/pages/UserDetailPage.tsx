import { useMutation, useQuery, useQueries, useQueryClient } from "@tanstack/react-query";
import { Building2, Mail, Plus, RotateCw, Trash2, UserRound } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { useCurrentUser } from "@/auth/useCurrentUser";
import { ApiError } from "@/shared/api/ApiError";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import type { InviteOrganizationUserRequest, OrganizationUserResponse, RoleResponse } from "@/shared/api/types";
import { Button } from "@/shared/ui/button";
import { ConcurrencyBanner } from "@/shared/ui/ConcurrencyBanner";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { FormError } from "@/shared/ui/FormError";
import { FormField } from "@/shared/ui/FormField";
import { ForbiddenPage } from "@/shared/ui/ForbiddenPage";
import { MultiSelect } from "@/shared/ui/MultiSelect";
import { Page } from "@/shared/ui/Page";
import { Surface } from "@/shared/ui/Surface";
import { EmptyState } from "@/shared/ui/EmptyState";
import { DateText } from "@/shared/ui/format/DateText";
import { toastError } from "@/shared/ui/sonner";
import { toast } from "sonner";
import { changeUserStatus, fetchAssignableRoles, fetchCompanyOptions, fetchUser, removeUser, resendUserInvitation, revokeUserInvitation, updateUser, userCompaniesQueryKey, userQueryKey, userRolesQueryKey, usersQueryRoot } from "../api/users";

type CompanyAssignmentDraft = { companyId: string; roleIds: string[] };
type UserDraft = { roleIds: string[]; companies: CompanyAssignmentDraft[] };

function failureMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.detail ?? fallback : fallback;
}

function draftFromUser(user: OrganizationUserResponse): UserDraft {
  return {
    roleIds: user.roles.filter((role) => role.scope === "Organization").map((role) => role.id),
    companies: user.companies.filter((company) => company.status === "Active").map((company) => ({
      companyId: company.companyId, roleIds: company.roles.map((role) => role.id),
    })),
  };
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
  const [draftState, setDraftState] = useState<UserDraft | null>(null);
  const [failure, setFailure] = useState<unknown>();
  const [confirmAction, setConfirmAction] = useState<"disable" | "remove" | "revoke" | null>(null);
  const draft = draftState ?? (user.data ? draftFromUser(user.data) : null);
  const roles = useQueries({ queries: (["Organization", "Company"] as const).map((scope) => ({
    queryKey: userRolesQueryKey(scope), queryFn: () => fetchAssignableRoles(scope), enabled: canManage && user.data !== undefined,
    meta: { silent: true },
  })) });
  const companies = useQuery({ queryKey: userCompaniesQueryKey, queryFn: fetchCompanyOptions, enabled: canManage && user.data !== undefined, meta: { silent: true } });
  const orgRoles = roles[0].data?.items ?? [];
  const companyRoles = roles[1].data?.items ?? [];
  const activeCompanies = (companies.data?.items ?? []).filter((company) => company.status === "Active");
  const save = useMutation({
    mutationFn: (request: InviteOrganizationUserRequest & { version: number }) => updateUser(memberId, request),
    onSuccess: async () => { setFailure(undefined); setDraftState(null); toast.success(t("users:messages.saved")); await Promise.all([client.invalidateQueries({ queryKey: userQueryKey(memberId) }), client.invalidateQueries({ queryKey: usersQueryRoot })]); },
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
  if (!user.data || !draft) return <Page backTo={{ to: "/org/usuarios", label: t("users:back") }} title={t("users:detail.title")}><EmptyState title={t("users:empty.missing")} /></Page>;

  const member = user.data;
  const currentDraft: UserDraft = draft;
  const isEditableState = member.state !== "PendingDeletion";
  const base = draftFromUser(member);
  const isDirty = JSON.stringify(base) !== JSON.stringify(currentDraft);
  const saveError = failure instanceof ApiError ? failure : undefined;
  const inactiveMemberships = member.companies.filter((company) => company.status !== "Active");
  const registryById = new Map((companies.data?.items ?? []).map((company) => [company.id, company]));
  const preservedCompanyIds = new Set(inactiveMemberships.map((company) => company.companyId));
  for (const company of member.companies) {
    if (registryById.get(company.companyId)?.status === "Inactive") preservedCompanyIds.add(company.companyId);
  }
  const changeableAssignments = currentDraft.companies.filter((assignment) => !preservedCompanyIds.has(assignment.companyId));
  const hasUnavailableMemberships = preservedCompanyIds.size > 0;

  function updateDraft(patch: Partial<UserDraft>) {
    setDraftState({ ...currentDraft, ...patch });
  }

  function addCompany() {
    const selected = currentDraft.companies.map((assignment) => assignment.companyId);
    const next = activeCompanies.find((company) => !selected.includes(company.id));
    if (next) updateDraft({ companies: [...currentDraft.companies, { companyId: next.id, roleIds: [] }] });
  }

  async function saveChanges() {
    setFailure(undefined);
    const safeCompanyAssignments = changeableAssignments.map((assignment) => ({ companyId: assignment.companyId, roleIds: assignment.roleIds }));
    try {
      await save.mutateAsync({ roleIds: currentDraft.roleIds, companies: safeCompanyAssignments, version: member.version });
    } catch { /* El error de concurrencia o validación queda visible en la ficha. */ }
  }

  return <>
    <ConcurrencyBanner error={saveError} isDirty={isDirty} onSeeNew={() => { void user.refetch().then((result) => { if (result.data) setDraftState(draftFromUser(result.data)); setFailure(undefined); }); }} onContinueEditing={() => setFailure(undefined)} />
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
        {member.state === "PendingDeletion" ? <p className="rounded-[10px] border border-[var(--alerta)] bg-[var(--alerta-t)] p-3 text-sm text-[var(--t1)]">{t("users:detail.pendingDeletion")}</p> : null}
        <Surface className="overflow-hidden">
          <header className="flex min-h-10 items-center border-b border-[var(--borde)] bg-[var(--cab)] px-4 text-[13px] font-semibold text-[var(--t1)]"><h2>{t("users:detail.accessTitle")}</h2></header>
          <div className="grid gap-4 p-4 md:grid-cols-2 md:p-5">
            <FormField label={t("users:invite.email")}><p className="min-h-9 content-center break-all text-sm text-[var(--t1)]">{member.email ?? <span className="text-[var(--t3)]">{"—"}</span>}</p></FormField>
            <FormField label={t("users:detail.joined")}><p className="min-h-9 content-center text-sm text-[var(--t1)]"><DateText value={member.createdAtUtc} kind="date" /></p></FormField>
            {member.invitationIssuedAtUtc ? <FormField label={t("users:detail.invitationSent")}><p className="min-h-9 content-center text-sm text-[var(--t1)]"><DateText value={member.invitationIssuedAtUtc} kind="dateTime" /></p></FormField> : null}
            {member.invitationExpiresAtUtc ? <FormField label={t("users:columns.expires")}><p className="min-h-9 content-center text-sm text-[var(--t1)]"><DateText value={member.invitationExpiresAtUtc} kind="date" /></p></FormField> : null}
            {member.hasManagedEmail ? <p className="flex items-start gap-2 text-sm text-[var(--t2)] md:col-span-2"><Mail aria-hidden="true" className="mt-0.5 size-4 shrink-0" />{t("users:managedEmail")}</p> : null}
          </div>
        </Surface>

        <Surface className="overflow-hidden">
          <header className="flex min-h-10 items-center justify-between gap-3 border-b border-[var(--borde)] bg-[var(--cab)] px-4 text-[13px] font-semibold text-[var(--t1)]"><h2>{t("users:detail.organizationRoles")}</h2></header>
          <div className="p-4 md:p-5">
            {isEditableState ? <FormField label={t("users:detail.organizationRoles")}><MultiSelect options={orgRoles.map((role) => ({ value: role.id, label: role.name }))} value={currentDraft.roleIds} onChange={(roleIds) => updateDraft({ roleIds })} placeholder={t("users:invite.chooseRoles")} /></FormField>
              : <p className="text-sm text-[var(--t2)]">{t("users:detail.pendingDeletionRoles")}</p>}
          </div>
        </Surface>

        <Surface className="overflow-hidden">
          <header className="flex min-h-10 items-center justify-between gap-3 border-b border-[var(--borde)] bg-[var(--cab)] px-4 text-[13px] font-semibold text-[var(--t1)]">
            <h2>{t("users:detail.companyAccess")}</h2>
            {canManage && isEditableState ? <Button type="button" size="sm" variant="outline" disabled={!companies.data || activeCompanies.length <= currentDraft.companies.filter((assignment) => activeCompanies.some((company) => company.id === assignment.companyId)).length} onClick={addCompany}><Plus aria-hidden="true" className="size-4" />{t("users:invite.addCompany")}</Button> : null}
          </header>
          <div className="flex flex-col gap-3 p-4 md:p-5">
            {hasUnavailableMemberships ? <p className="rounded-lg bg-[var(--s2)] p-3 text-sm text-[var(--t2)]">{t("users:detail.preservedCompanies")}</p> : null}
            {member.companies.filter((company) => preservedCompanyIds.has(company.companyId)).map((company) => <div key={company.companyId} className="rounded-lg border border-[var(--borde)] p-3">
              <div className="flex items-center gap-2 text-sm font-semibold"><Building2 aria-hidden="true" className="size-4 text-[var(--t2)]" />{company.companyName}<span className="ml-auto text-xs font-normal text-[var(--t2)]">{t("users:detail.companyInactive")}</span></div>
              <p className="mt-2 text-sm text-[var(--t2)]">{company.roles.map((role) => role.name).join(", ") || "—"}</p>
            </div>)}
            {changeableAssignments.map((assignment) => {
              const company = activeCompanies.find((item) => item.id === assignment.companyId);
              const availableRoles = companyRoles.filter((role: RoleResponse) => role.scope === "AnyCompany" || role.companyId === assignment.companyId);
              return <div key={`company-${assignment.companyId}`} className="grid gap-3 rounded-lg border border-[var(--borde)] p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto] md:items-end">
                <FormField label={t("users:invite.company")}><p className="min-h-9 content-center text-sm font-medium">{company?.name ?? member.companies.find((item) => item.companyId === assignment.companyId)?.companyName ?? t("users:invite.chooseCompany")}</p></FormField>
                <FormField label={t("users:invite.companyRoles")}><MultiSelect options={availableRoles.map((role) => ({ value: role.id, label: role.name }))} value={assignment.roleIds} onChange={(roleIds) => updateDraft({ companies: currentDraft.companies.map((item) => item.companyId === assignment.companyId ? { ...item, roleIds } : item) })} placeholder={t("users:invite.chooseRoles")} /></FormField>
                {canManage && isEditableState ? <Button type="button" variant="ghost" size="icon" aria-label={t("users:detail.removeCompany", { name: company?.name ?? "" })} onClick={() => updateDraft({ companies: currentDraft.companies.filter((item) => item.companyId !== assignment.companyId) })}><Trash2 aria-hidden="true" className="size-4" /></Button> : null}
              </div>;
            })}
            {changeableAssignments.length === 0 && preservedCompanyIds.size === 0 ? <p className="text-sm text-[var(--t2)]">{t("users:detail.noCompanies")}</p> : null}
          </div>
        </Surface>

        {canManage && isEditableState ? <div className="flex justify-end"><Button type="button" disabled={!isDirty || save.isPending || !roles[0].data || !roles[1].data || !companies.data} onClick={() => { void saveChanges(); }}>{save.isPending ? t("common:states.saving") : t("users:detail.save")}</Button></div> : null}
      </div>
    </Page>
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
