import { useMutation, useQuery, useQueries, useQueryClient } from "@tanstack/react-query";
import { Building2, Plus, Settings2, Trash2, UserRound } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { useCurrentUser } from "@/auth/useCurrentUser";
import { ApiError } from "@/shared/api/ApiError";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import type { OrganizationUserResponse, RoleResponse, UpdateOrganizationUserRequest } from "@/shared/api/types";
import { Banner } from "@/shared/ui/Banner";
import { Button } from "@/shared/ui/button";
import { ConcurrencyBanner } from "@/shared/ui/ConcurrencyBanner";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { FormError } from "@/shared/ui/FormError";
import { FormField } from "@/shared/ui/FormField";
import { ForbiddenPage } from "@/shared/ui/ForbiddenPage";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { RowActions } from "@/shared/ui/RowActions";
import { Page } from "@/shared/ui/Page";
import { Surface } from "@/shared/ui/Surface";
import { EmptyState } from "@/shared/ui/EmptyState";
import { DateText } from "@/shared/ui/format/DateText";
import { toastError } from "@/shared/ui/sonner";
import { toast } from "sonner";
import { RolesField } from "../components/RolesField";
import { useBreadcrumbLeaf } from "@/shared/hooks/useBreadcrumbLeaf";
import { List, ListItem } from "@/shared/ui/List";
import { ReadOnlyField } from "@/shared/ui/ReadOnlyField";
import { fetchAssignableRoles, fetchCompanyOptions, fetchUser, removeUser, resendUserInvitation, revokeUserInvitation, updateUser, userCompaniesQueryKey, userQueryKey, userRolesQueryKey, usersQueryRoot } from "../api/users";

type CompanyAssignmentDraft = { companyId: string; roleIds: string[] };
type CompanyDialogDraft = { mode: "add" | "roles"; companyId: string; roleIds: string[] };
type AccessDraft = { isActive: boolean; roleIds: string[] };
type UserState = OrganizationUserResponse["state"];

// Tablero Usuario: punto de color y palabra, sin pastilla.
const stateDot: Record<UserState, string> = {
  Active: "bg-[var(--ok)]",
  Invited: "bg-[var(--marca-tx)]",
  Expired: "bg-[var(--alerta)]",
  Inactive: "bg-[var(--t3)]",
  PendingDeletion: "bg-[var(--alerta)]",
};

function failureMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.detail ?? fallback : fallback;
}

function organizationRoleIds(user: OrganizationUserResponse): string[] {
  return user.roles.filter((role) => role.scope === "Organization").map((role) => role.id);
}

function sameRoles(left: readonly string[], right: readonly string[]): boolean {
  return [...left].sort().join("|") === [...right].sort().join("|");
}

// «Sumamos a Ana a Delta S.A.» no lleva otro punto: el nombre ya termina en uno (tablero Usuario).
function sentence(text: string): string {
  return text.replace(/\.\.$/, ".");
}

function Separator() {
  return <span aria-hidden="true">{" · "}</span>;
}

function AccessBox({ title, children }: { title: string; children: ReactNode }) {
  const id = useId();
  return <Surface className="overflow-hidden">
    <section aria-labelledby={id}>
      <header className="flex min-h-10 items-center border-b border-[var(--borde)] bg-[var(--cab)] px-4 text-[13px] font-semibold text-[var(--t1)]"><h2 id={id}>{title}</h2></header>
      {children}
    </section>
  </Surface>;
}

export function UserDetailPage() {
  const { t } = useTranslation(["users", "common"]);
  const { memberId = "" } = useParams();
  const { data: currentUser } = useCurrentUser();
  const canRead = currentUser?.permissions?.includes("users.read") === true;
  const canInvite = currentUser?.permissions?.includes("users.invite") === true;
  const canManage = currentUser?.permissions?.includes("users.manage") === true;
  const organizationName = currentUser?.organizations.find((organization) => organization.id === currentUser.activeTenantId)?.name ?? "";
  const client = useQueryClient();
  const navigate = useNavigate();
  const companiesTitleId = useId();
  const user = useQuery({ queryKey: userQueryKey(memberId), queryFn: () => fetchUser(memberId), enabled: canRead && Boolean(memberId), meta: { silent: true } });
  useBreadcrumbLeaf(user.data ? user.data.displayName || user.data.email || undefined : undefined);
  const [draft, setDraft] = useState<AccessDraft | null>(null);
  const [companyDialog, setCompanyDialog] = useState<CompanyDialogDraft | null>(null);
  const [failure, setFailure] = useState<unknown>();
  const [confirmAction, setConfirmAction] = useState<"disable" | "remove" | "revoke" | null>(null);
  const roles = useQueries({ queries: (["Organization", "Company"] as const).map((scope) => ({
    queryKey: userRolesQueryKey(scope), queryFn: () => fetchAssignableRoles(scope), enabled: canManage && user.data !== undefined,
    meta: { silent: true },
  })) });
  const companies = useQuery({ queryKey: userCompaniesQueryKey, queryFn: fetchCompanyOptions, enabled: canManage && user.data !== undefined, meta: { silent: true } });
  const orgRoles = roles[0].data?.items ?? [];
  const companyRoles = roles[1].data?.items ?? [];
  const activeCompanies = (companies.data?.items ?? []).filter((company) => company.status === "Active");
  const refresh = () => Promise.all([client.invalidateQueries({ queryKey: userQueryKey(memberId) }), client.invalidateQueries({ queryKey: usersQueryRoot })]);
  const save = useMutation({
    mutationFn: ({ request }: { request: UpdateOrganizationUserRequest; message: string; keepDraft?: boolean }) => updateUser(memberId, request),
    onSuccess: async (_result, { message, keepDraft }) => { setFailure(undefined); if (!keepDraft) setDraft(null); setCompanyDialog(null); toast.success(sentence(message)); await refresh(); },
    onError: (error) => setFailure(error),
  });
  const remove = useMutation({
    mutationFn: (_message: string) => removeUser(memberId, user.data?.version ?? 0),
    onSuccess: async (_result, message) => { toast.success(sentence(message)); await client.invalidateQueries({ queryKey: usersQueryRoot }); void navigate("/org/usuarios"); },
    onError: (error) => toastError(failureMessage(error, t("common:states.error"))),
  });
  const revoke = useMutation({
    mutationFn: (invitationId: string) => revokeUserInvitation(invitationId),
    onSuccess: async () => { toast.success(sentence(t("users:detail.messages.revoked", { email: user.data?.email ?? "" }))); await refresh(); },
    onError: (error) => toastError(failureMessage(error, t("common:states.error"))),
  });
  const resend = useIdempotentMutation((invitationId: string, key) => resendUserInvitation(invitationId, key));

  if (!canRead) return <ForbiddenPage homePath="/org" />;
  if (user.isPending) return <Page backTo={{ to: "/org/usuarios", label: t("users:back") }} title={t("users:detail.loading")}><p role="status">{t("common:states.loading")}</p></Page>;
  if (user.error) return <Page backTo={{ to: "/org/usuarios", label: t("users:back") }} title={t("users:detail.title")}><FormError message={failureMessage(user.error, t("common:states.error"))} /></Page>;
  if (!user.data) return <Page backTo={{ to: "/org/usuarios", label: t("users:back") }} title={t("users:detail.title")}><EmptyState title={t("users:empty.missing")} /></Page>;

  const member = user.data;
  const displayName = member.displayName || member.email || "";
  const isInvitation = member.state === "Invited" || member.state === "Expired";
  const isMember = member.state === "Active" || member.state === "Inactive";
  const pendingDeletion = member.state === "PendingDeletion";
  const editable = canManage && !pendingDeletion;
  const saved: AccessDraft = { isActive: member.state === "Active", roleIds: organizationRoleIds(member) };
  const current = draft ?? saved;
  const shownState: UserState = isMember ? (current.isActive ? "Active" : "Inactive") : member.state;
  const isDirty = editable && (current.isActive !== saved.isActive || !sameRoles(current.roleIds, saved.roleIds));
  const saveError = failure instanceof ApiError ? failure : undefined;
  const registryById = new Map((companies.data?.items ?? []).map((company) => [company.id, company]));
  const preservedCompanyIds = new Set(member.companies.filter((company) => company.status !== "Active"
    || registryById.get(company.companyId)?.status === "Inactive").map((company) => company.companyId));
  const changeableAssignments = member.companies.filter((company) => !preservedCompanyIds.has(company.companyId))
    .map((company) => ({ companyId: company.companyId, roleIds: company.roles.map((role) => role.id) }));
  const assignedCompanyIds = new Set(member.companies.map((company) => company.companyId));
  const companyName = (companyId: string) => activeCompanies.find((company) => company.id === companyId)?.name
    ?? member.companies.find((company) => company.companyId === companyId)?.companyName ?? "";
  const dialogCompanyRoles = companyRoles.filter((role) => role.scope === "AnyCompany" || role.companyId === companyDialog?.companyId);
  const managedDomain = member.hasManagedEmail && member.email ? member.email.slice(member.email.indexOf("@") + 1) : null;

  function changeDraft(change: Partial<AccessDraft>) {
    setDraft({ ...current, ...change });
    setFailure(undefined);
  }

  async function saveAccess() {
    setFailure(undefined);
    try {
      await save.mutateAsync({
        request: { ...(isMember ? { isActive: current.isActive } : {}), roleIds: current.roleIds, companies: changeableAssignments, version: member.version },
        message: t("users:detail.messages.saved", { name: displayName }),
      });
    } catch { /* El error queda visible en la franja o en el cartel de concurrencia. */ }
  }

  // Las empresas se guardan al momento, desde el diálogo o el ⋮: no esperan a «Guardar cambios».
  async function saveCompanies(assignments: CompanyAssignmentDraft[], message: string) {
    setFailure(undefined);
    try {
      await save.mutateAsync({ request: { roleIds: saved.roleIds, companies: assignments, version: member.version }, message, keepDraft: true });
    } catch { /* El error queda visible en la franja o en el cartel de concurrencia. */ }
  }

  async function saveCompanyDialog() {
    if (!companyDialog?.companyId) return;
    const name = companyName(companyDialog.companyId);
    if (companyDialog.mode === "add") {
      await saveCompanies([...changeableAssignments, { companyId: companyDialog.companyId, roleIds: companyDialog.roleIds }],
        t("users:detail.messages.companyAdded", { name: displayName, company: name }));
      return;
    }
    await saveCompanies(changeableAssignments.map((assignment) => assignment.companyId === companyDialog.companyId
      ? { ...assignment, roleIds: companyDialog.roleIds } : assignment), t("users:detail.messages.companyRolesSaved", { company: name }));
  }

  function resendInvitation() {
    if (!member.invitationId) return;
    void resend.mutateAsync(member.invitationId).then(async () => {
      toast.success(sentence(t("users:detail.messages.resent", { email: member.email ?? "" })));
      await client.invalidateQueries({ queryKey: userQueryKey(memberId) });
    }).catch((error: unknown) => toastError(failureMessage(error, t("common:states.error"))));
  }

  const removeDescription = pendingDeletion
    ? t("users:detail.confirm.removePendingDeletionDescription", { organization: organizationName })
    : managedDomain
      ? t("users:detail.confirm.removeManagedDescription", { organization: organizationName, domain: managedDomain })
      : t("users:detail.confirm.removeDescription", { organization: organizationName });
  const confirmations = {
    disable: { title: t("users:detail.confirm.disableTitle", { name: displayName }), description: t("users:detail.confirm.disableDescription", { organization: organizationName }), label: t("users:detail.confirm.disableConfirm"), run: () => { void saveAccess(); } },
    remove: { title: t("users:detail.confirm.removeTitle", { name: displayName, organization: organizationName }), description: removeDescription, label: t("users:detail.confirm.removeConfirm"), run: () => remove.mutate(t("users:detail.messages.removed", { name: displayName, organization: organizationName })) },
    revoke: { title: t("users:detail.confirm.revokeTitle", { email: member.email ?? "" }), description: t("users:detail.confirm.revokeDescription"), label: t("users:detail.confirm.revokeConfirm"), run: () => { if (member.invitationId) revoke.mutate(member.invitationId); } },
  };
  const confirmation = confirmAction ? confirmations[confirmAction] : null;

  const detail = isInvitation
    ? <Trans ns="users" i18nKey={member.state === "Expired" ? "detail.expiredOn" : "detail.expiresOn"} components={{ date: <DateText value={member.invitationExpiresAtUtc} kind="date" /> }} />
    : <Trans ns="users" i18nKey="detail.since" components={{ date: <DateText value={member.createdAtUtc} kind="date" /> }} />;
  const summary = <>
    <span className="inline-flex items-center gap-1.5 text-[var(--t1)]"><span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${stateDot[shownState]}`} />{t(`users:states.${shownState}`)}</span>
    {isDirty ? <><Separator /><span className="font-medium text-[var(--alerta)]">{t("users:detail.unsaved")}</span></> : null}
    {member.email ? <><Separator />{member.email}</> : null}
    <Separator />{detail}
  </>;

  return <>
    <ConcurrencyBanner error={saveError} isDirty={isDirty || companyDialog !== null} onSeeNew={() => { void user.refetch().then(() => { setDraft(null); setCompanyDialog(null); setFailure(undefined); }); }} onContinueEditing={() => setFailure(undefined)} />
    <Page icon={UserRound} backTo={{ to: "/org/usuarios", label: t("users:back") }} title={displayName || t("users:detail.title")} summary={summary}
      moreActions={canManage && !pendingDeletion ? { label: t("users:detail.moreActions"), items: [
        { label: t("users:actions.resend"), onSelect: resendInvitation, hidden: !isInvitation || !canInvite || !member.invitationId },
        { label: t("users:actions.revoke"), onSelect: () => setConfirmAction("revoke"), destructive: true, hidden: !isInvitation || !member.invitationId },
        { label: t("users:actions.remove"), onSelect: () => setConfirmAction("remove"), destructive: true, hidden: !isMember },
      ] } : undefined}
      actions={canManage ? pendingDeletion
        ? <Button type="button" variant="danger" onClick={() => setConfirmAction("remove")}>{t("users:actions.remove")}</Button>
        : <>
          <Button type="button" variant="outline" onClick={() => { setDraft(null); setFailure(undefined); }}>{t("users:detail.discard")}</Button>
          <Button type="button" disabled={!isDirty || save.isPending || !roles[0].data || !roles[1].data || !companies.data}
            onClick={() => { if (saved.isActive && !current.isActive) setConfirmAction("disable"); else void saveAccess(); }}>
            {save.isPending ? t("common:states.saving") : t("users:detail.save")}
          </Button>
        </> : undefined}>
      <div className="flex flex-col gap-4">
        {failure && !(failure instanceof ApiError && failure.code === "General.ConcurrencyConflict") ? <FormError message={failureMessage(failure, t("common:states.error"))} /> : null}
        {pendingDeletion ? <Banner tone="warning"><Trans ns="users" i18nKey="detail.deletionScheduled" components={{ date: <DateText value={member.deletionScheduledForUtc} kind="date" /> }} /></Banner> : null}

        <AccessBox title={t("users:detail.accessTitle")}>
          <div className="grid gap-4 p-4 md:grid-cols-2 md:p-5">
            {editable && isMember ? <FormField label={t("users:detail.status")}>
              <Select value={current.isActive ? "Active" : "Inactive"} onValueChange={(value) => changeDraft({ isActive: value === "Active" })}>
                <SelectTrigger className="w-full" aria-label={t("users:detail.status")}><SelectValue /></SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="Active" description={t("users:detail.statusActiveDescription")}>{t("users:states.Active")}</SelectItem>
                  <SelectItem value="Inactive" description={t("users:detail.statusInactiveDescription")}>{t("users:states.Inactive")}</SelectItem>
                </SelectContent>
              </Select>
            </FormField> : <ReadOnlyField label={t("users:detail.status")}>{t(`users:states.${member.state}`)}</ReadOnlyField>}
            {editable ? <RolesField label={t("users:detail.organizationRoles")} allLabel={t("users:detail.allRoles")}
              options={orgRoles.map((role) => ({ value: role.id, label: role.name }))} value={current.roleIds}
              onChange={(roleIds) => changeDraft({ roleIds })} placeholder={t("users:detail.noRoles")} />
              : <ReadOnlyField label={t("users:detail.organizationRoles")}>{member.roles.filter((role) => role.scope === "Organization").map((role) => role.name).join(", ") || t("users:detail.noRoles")}</ReadOnlyField>}
          </div>
        </AccessBox>

        <Surface className="overflow-hidden">
          <section aria-labelledby={companiesTitleId}>
            <header className="flex min-h-10 items-center justify-between gap-3 border-b border-[var(--borde)] bg-[var(--cab)] px-4 text-[13px] font-semibold text-[var(--t1)]">
              <h2 id={companiesTitleId}>{t("users:detail.companyAccess")}</h2>
              {editable ? <Button type="button" size="sm" variant="outline" disabled={!companies.data || activeCompanies.every((company) => assignedCompanyIds.has(company.id)) || save.isPending}
                onClick={() => { setCompanyDialog({ mode: "add", companyId: "", roleIds: [] }); setFailure(undefined); }}><Plus aria-hidden="true" className="size-4" />{t("users:detail.addCompany")}</Button> : null}
            </header>
            {member.companies.length === 0 ? <p className="p-4 text-[13px] text-[var(--t2)] md:px-5">{t("users:detail.noCompanies")}</p> : <List label={t("users:detail.companyAccess")}>
              {member.companies.map((company) => {
                const preserved = preservedCompanyIds.has(company.companyId);
                const assignment = { companyId: company.companyId, roleIds: company.roles.map((role) => role.id) };
                const roleNames = company.roles.map((role) => role.name).join(", ") || t("users:detail.companyNoRoles");
                return <ListItem key={company.companyId} icon={<Building2 aria-hidden="true" />} title={company.companyName}
                  detail={preserved ? <>{roleNames}<Separator />{t("users:detail.companyInactive")}</> : roleNames}>
                  {editable && !preserved ? <RowActions label={t("users:detail.companyActions", { name: company.companyName })} actions={[
                    { label: t("users:detail.changeCompanyRoles"), accessibleName: t("users:detail.changeCompanyRoles"), icon: Settings2, onSelect: () => { setCompanyDialog({ mode: "roles", ...assignment }); setFailure(undefined); } },
                    { label: t("users:detail.removeCompanyAction"), accessibleName: t("users:detail.removeCompanyAction"), icon: Trash2, destructive: true,
                      onSelect: () => { void saveCompanies(changeableAssignments.filter((item) => item.companyId !== company.companyId), t("users:detail.messages.companyRemoved", { name: displayName, company: company.companyName })); } },
                  ]} /> : null}
                </ListItem>;
              })}
            </List>}
          </section>
        </Surface>
      </div>
    </Page>
    <Dialog open={companyDialog !== null} onOpenChange={(open) => { if (!open && !save.isPending) setCompanyDialog(null); }}>
      <DialogContent className="md:max-w-[480px]">
        <DialogHeader><DialogTitle>{companyDialog?.mode === "add" ? t("users:detail.addCompanyTitle") : t("users:detail.changeCompanyRolesTitle", { name: companyName(companyDialog?.companyId ?? "") })}</DialogTitle></DialogHeader>
        <div className="flex flex-col gap-4 p-5">
          {companyDialog?.mode === "add" ? <FormField label={t("users:invite.company")} required>
            <Select value={companyDialog.companyId} onValueChange={(companyId) => setCompanyDialog({ ...companyDialog, companyId, roleIds: [] })}>
              <SelectTrigger className="w-full" aria-label={t("users:invite.company")}><SelectValue placeholder={t("users:invite.chooseCompany")} /></SelectTrigger>
              <SelectContent position="popper">{activeCompanies.filter((company) => !assignedCompanyIds.has(company.id)).map((company) => <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>)}</SelectContent>
            </Select>
          </FormField> : null}
          {companyDialog?.companyId ? <RolesField label={t("users:invite.companyRoles")} allLabel={t("users:detail.allRoles")}
            options={dialogCompanyRoles.map((role: RoleResponse) => ({ value: role.id, label: role.name }))} value={companyDialog.roleIds}
            onChange={(roleIds) => setCompanyDialog({ ...companyDialog, roleIds })} placeholder={t("users:detail.noRoles")} /> : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={save.isPending} onClick={() => setCompanyDialog(null)}>{t("common:actions.cancel")}</Button>
          <Button type="button" disabled={save.isPending || !companyDialog?.companyId} onClick={() => { void saveCompanyDialog(); }}>{save.isPending ? t("common:states.saving") : companyDialog?.mode === "add" ? t("users:detail.addCompanyConfirm") : t("users:detail.saveCompanyRoles")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <ConfirmDialog open={confirmation !== null} onOpenChange={(open) => { if (!open) setConfirmAction(null); }} destructive
      title={confirmation?.title ?? ""} description={confirmation?.description} confirmLabel={confirmation?.label ?? ""}
      onConfirm={() => confirmation?.run()} />
  </>;
}
