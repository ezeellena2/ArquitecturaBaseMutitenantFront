import { useMutation, useQuery, useQueries, useQueryClient } from "@tanstack/react-query";
import { Building2, Settings2, Trash2, UserRound } from "lucide-react";
import { useRef, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { useCurrentUser } from "@/auth/useCurrentUser";
import { usePermissions } from "@/auth/usePermissions";
import { actionErrorMessage, isNotFoundError, toastActionError } from "@/shared/api/errorMessage";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import type { OrganizationUserResponse, RoleResponse, UpdateOrganizationUserRequest } from "@/shared/api/types";
import { ApiError } from "@/shared/api/ApiError";
import { useEditPage } from "@/shared/hooks/useEditPage";
import { Banner } from "@/shared/ui/Banner";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { FormError } from "@/shared/ui/FormError";
import { LoadErrorPage } from "@/shared/ui/LoadErrorPage";
import { NotFoundPage } from "@/shared/ui/NotFoundPage";
import { FormField } from "@/shared/ui/FormField";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { RowActions } from "@/shared/ui/RowActions";
import { Page } from "@/shared/ui/Page";
import { Section, SectionFields } from "@/shared/ui/Section";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { SettingsItem } from "@/shared/ui/app/SettingsGroup";
import { EmptyState } from "@/shared/ui/EmptyState";
import { DateText } from "@/shared/ui/format/DateText";
import { toast } from "sonner";
import { ChoiceSheet, CheckRow, RadioRow } from "../components/AccessSheets";
import { RolesField } from "../components/RolesField";
import { useBreadcrumbLeaf } from "@/shared/hooks/useBreadcrumbLeaf";
import { List, ListItem } from "@/shared/ui/List";
import { ReadOnlyField } from "@/shared/ui/ReadOnlyField";
import { fetchAssignableRoles, fetchCompanyOptions, fetchUser, removeUser, resendUserInvitation, revokeUserInvitation, updateUser, userCompaniesQueryKey, userQueryKey, userRolesQueryKey, usersQueryRoot } from "../api/users";
import { userErrorMessage, type UserAction } from "../errors";
import { activeOrganization, homeOf } from "@/tenancy/access";

type CompanyAssignmentDraft = { companyId: string; roleIds: string[] };
/// `missingCompany`: tocó «Sumar» sin elegir la empresa (el campo queda en rojo hasta que elige una).
type CompanyDialogDraft = { mode: "add" | "roles"; companyId: string; roleIds: string[]; missingCompany?: boolean };
type AccessDraft = { isActive: boolean; roleIds: string[] };
type UserState = OrganizationUserResponse["state"];
/// De dónde salió un guardado: su error va en la franja de la ficha o en la del diálogo, arriba de sus botones.
type SaveOrigin = "page" | "dialog";

// Tablero Usuario: punto de color y palabra, sin pastilla.
const stateDot: Record<UserState, string> = {
  Active: "bg-[var(--punto-ok)]",
  Invited: "bg-[var(--marca)]",
  Expired: "bg-[var(--punto-alerta)]",
  Inactive: "bg-[var(--punto-apagado)]",
  PendingDeletion: "bg-[var(--punto-alerta)]",
};

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

export function UserDetailPage() {
  const { t } = useTranslation(["users", "common"]);
  const { memberId = "" } = useParams();
  const { data: currentUser } = useCurrentUser();
  const { can } = usePermissions();
  const canInvite = can("users.invite");
  const canManage = can("users.manage");
  const organizationName = activeOrganization(currentUser)?.name ?? "";
  const client = useQueryClient();
  const navigate = useNavigate();
  const { phone } = useAppChrome();
  const [sheet, setSheet] = useState<"state" | "roles" | null>(null);
  const user = useQuery({ queryKey: userQueryKey(memberId), queryFn: () => fetchUser(memberId), enabled: Boolean(memberId), meta: { silent: true, blocksView: true } });
  useBreadcrumbLeaf(user.data ? user.data.displayName || user.data.email || undefined : undefined);
  const [draft, setDraft] = useState<AccessDraft | null>(null);
  const [companyDialog, setCompanyDialog] = useState<CompanyDialogDraft | null>(null);
  // Lo que el back rechazó en la ficha, al guardar el acceso o al quitar de la organización: va en su franja (tablero Usuario).
  const [failure, setFailure] = useState<{ error: unknown; action: UserAction }>();
  const [dialogFailure, setDialogFailure] = useState<unknown>();
  // Un 409 de concurrencia en el diálogo deja la ficha vieja: al cerrarlo se vuelve a leer si no hay cambios sin guardar.
  // Va aparte del error del diálogo, que se borra al cambiar algo en él.
  const staleAfterDialog = useRef(false);
  const [confirmAction, setConfirmAction] = useState<"disable" | "remove" | "revoke" | null>(null);
  // Antes de las salidas tempranas: la pregunta de salida y el cartel del 409 siguen el borrador del acceso.
  const loaded = user.data;
  const isDirty = Boolean(loaded && draft && canManage && loaded.state !== "PendingDeletion"
    && (draft.isActive !== (loaded.state === "Active") || !sameRoles(draft.roleIds, organizationRoleIds(loaded))));
  // La ficha es la de quien está mirando («Lucía (vos)» en el tablero Usuario): los errores de la última Dueña lo dicen.
  const self = Boolean(loaded?.userId && loaded.userId === currentUser?.id);
  // Tableros Usuario y Avisos: el 409 en su cartel, «Cambios sin guardar» en la banda, el error de guardado en la franja
  // y «¿Salir sin guardar?» antes de irse con cambios.
  const edit = useEditPage({
    isDirty, error: failure?.error,
    onSeeNew: () => { void user.refetch().then(() => { setDraft(null); setFailure(undefined); }); },
    onContinueEditing: () => setFailure(undefined),
    errorMessage: (error) => userErrorMessage(error, t, { self, action: failure?.action ?? "save" }),
  });
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
    mutationFn: ({ request }: { request: UpdateOrganizationUserRequest; message: string; keepDraft?: boolean; origin: SaveOrigin }) => updateUser(memberId, request),
    onSuccess: async (_result, { message, keepDraft }) => { setFailure(undefined); setDialogFailure(undefined); if (!keepDraft) setDraft(null); setCompanyDialog(null); toast.success(sentence(message)); await refresh(); },
    onError: (error, { origin }) => {
      if (origin !== "dialog") { setFailure({ error, action: "save" }); return; }
      if (error instanceof ApiError && error.code === "General.ConcurrencyConflict") staleAfterDialog.current = true;
      setDialogFailure(error);
    },
  });
  const remove = useMutation({
    mutationFn: (_message: string) => removeUser(memberId, user.data?.version ?? 0),
    // Ya no hay nada que perder: la salida al listado no pregunta.
    onSuccess: async (_result, message) => { toast.success(sentence(message)); await client.invalidateQueries({ queryKey: usersQueryRoot }); edit.allowNextNavigation(); void navigate("/org/usuarios"); },
    onError: (error) => setFailure({ error, action: "remove" }),
  });
  const revoke = useMutation({
    mutationFn: (invitationId: string) => revokeUserInvitation(invitationId),
    onSuccess: async () => { toast.success(sentence(t("users:detail.messages.revoked", { email: user.data?.email ?? "" }))); await refresh(); },
    onError: (error) => toastActionError(error, t),
  });
  const resend = useIdempotentMutation((invitationId: string, key) => resendUserInvitation(invitationId, key));

  if (user.isPending) return <Page backTo={{ to: "/org/usuarios", label: t("users:back") }} title={t("users:detail.loading")}><p role="status">{t("common:states.loading")}</p></Page>;
  // «Criterio · Avisos» (Pantalla de error): la ficha no cargó y no hay nada que mostrar; si no existe (404),
  // «No encontramos esta página» (errores.md).
  if (user.error && !user.data) return isNotFoundError(user.error)
    ? <NotFoundPage homePath={homeOf("business")} screen={t("users:detail.title")} back={{ to: "/org/usuarios", label: t("users:back") }} />
    : <LoadErrorPage onRetry={() => { void user.refetch(); }} screen={t("users:detail.title")} back={{ to: "/org/usuarios", label: t("users:back") }} />;
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
  const dialogError = actionErrorMessage(dialogFailure, t);
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
        message: t("users:detail.messages.saved", { name: displayName }), origin: "page",
      });
    } catch { /* El error queda visible en la franja o en el cartel de concurrencia. */ }
  }

  // Las empresas se guardan al momento, desde el diálogo o el ⋮: no esperan a «Guardar cambios».
  async function saveCompanies(assignments: CompanyAssignmentDraft[], message: string, origin: SaveOrigin) {
    if (origin === "dialog") setDialogFailure(undefined); else setFailure(undefined);
    try {
      await save.mutateAsync({ request: { roleIds: saved.roleIds, companies: assignments, version: member.version }, message, keepDraft: true, origin });
    } catch { /* El error queda visible en la franja de la ficha o en la del diálogo. */ }
  }

  async function saveCompanyDialog() {
    if (!companyDialog) return;
    // «Criterio · Botones»: «Sumar» no se apaga; sin empresa, el campo dice qué falta.
    if (!companyDialog.companyId) { setCompanyDialog({ ...companyDialog, missingCompany: true }); return; }
    const name = companyName(companyDialog.companyId);
    if (companyDialog.mode === "add") {
      await saveCompanies([...changeableAssignments, { companyId: companyDialog.companyId, roleIds: companyDialog.roleIds }],
        t("users:detail.messages.companyAdded", { name: displayName, company: name }), "dialog");
      return;
    }
    await saveCompanies(changeableAssignments.map((assignment) => assignment.companyId === companyDialog.companyId
      ? { ...assignment, roleIds: companyDialog.roleIds } : assignment), t("users:detail.messages.companyRolesSaved", { company: name }), "dialog");
  }

  function openCompanyDialog(next: CompanyDialogDraft) {
    setCompanyDialog(next);
    setDialogFailure(undefined);
  }

  // La X, Escape y «Cancelar» cierran igual: el error del diálogo se va con él. Después de un 409, la ficha se vuelve a
  // leer; con cambios sin guardar no, para conservarlos: el próximo «Guardar cambios» muestra el cartel del 409.
  function closeCompanyDialog() {
    setCompanyDialog(null);
    setDialogFailure(undefined);
    if (!staleAfterDialog.current) return;
    staleAfterDialog.current = false;
    if (!isDirty) { setDraft(null); void refresh(); }
  }

  function changeCompanyDialog(next: CompanyDialogDraft) {
    setCompanyDialog(next);
    setDialogFailure(undefined);
  }

  function resendInvitation() {
    if (!member.invitationId) return;
    resend.mutate(member.invitationId, {
      onSuccess: async () => {
        toast.success(sentence(t("users:detail.messages.resent", { email: member.email ?? "" })));
        await client.invalidateQueries({ queryKey: userQueryKey(memberId) });
      },
      onError: (error) => toastActionError(error, t),
    });
  }

  const removeDescription = pendingDeletion
    ? t("users:detail.confirm.removePendingDeletionDescription", { organization: organizationName })
    : managedDomain
      ? t("users:detail.confirm.removeManagedDescription", { organization: organizationName, domain: managedDomain })
      : t("users:detail.confirm.removeDescription", { organization: organizationName });
  const confirmations = {
    disable: { title: t("users:detail.confirm.disableTitle", { name: displayName }), description: t("users:detail.confirm.disableDescription", { organization: organizationName }), label: t("users:detail.confirm.disableConfirm"), run: () => { void saveAccess(); } },
    remove: { title: t("users:detail.confirm.removeTitle", { name: displayName, organization: organizationName }), description: removeDescription, label: t("users:detail.confirm.removeConfirm"), run: () => { setFailure(undefined); remove.mutate(t("users:detail.messages.removed", { name: displayName, organization: organizationName })); } },
    revoke: { title: t("users:detail.confirm.revokeTitle", { email: member.email ?? "" }), description: t("users:detail.confirm.revokeDescription"), label: t("users:detail.confirm.revokeConfirm"), run: () => { if (member.invitationId) revoke.mutate(member.invitationId); } },
  };
  const confirmation = confirmAction ? confirmations[confirmAction] : null;
  const stateLabel = <span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className={`size-[7px] shrink-0 rounded-full ${stateDot[shownState]}`} />{t(`users:states.${shownState}`)}</span>;
  const roleNames = current.roleIds.map((id) => orgRoles.find((role) => role.id === id)?.name ?? member.roles.find((role) => role.id === id)?.name)
    .filter(Boolean).join(", ");
  const orgRoleValues = orgRoles.map((role) => role.id);

  const detail = isInvitation
    ? <Trans ns="users" i18nKey={member.state === "Expired" ? "detail.expiredOn" : "detail.expiresOn"} components={{ date: <DateText value={member.invitationExpiresAtUtc} kind="date" /> }} />
    : <Trans ns="users" i18nKey="detail.since" components={{ date: <DateText value={member.createdAtUtc} kind="date" /> }} />;
  const summary = <>
    <span className="inline-flex items-center gap-1.5 text-[var(--t1)]"><span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${stateDot[shownState]}`} />{t(`users:states.${shownState}`)}</span>
    {edit.unsaved ? <><Separator />{edit.unsaved}</> : null}
    {member.email ? <><Separator />{member.email}</> : null}
    <Separator />{detail}
  </>;

  return <>
    <Page banner={edit.banner} icon={UserRound} backTo={{ to: "/org/usuarios", label: t("users:back") }} title={displayName || t("users:detail.title")} summary={summary}
      // En el teléfono, con cambios, la barra dice «Cambios sin guardar» en lugar del correo, como Configuración (M-Avisos).
      phoneSubtitle={edit.unsaved ?? member.email ?? undefined} phoneBody="gray"
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
      <div className="flex flex-col gap-4 max-md:gap-0">
        {/* Tablero Usuario: el error de guardado, en una franja debajo de la banda; en el teléfono, con el margen de las tarjetas. */}
        {edit.formError ? <div className="max-md:mx-4 max-md:mt-3.5">{edit.formError}</div> : null}
        {pendingDeletion ? <Banner tone="warning"><Trans ns="users" i18nKey="detail.deletionScheduled" components={{ date: <DateText value={member.deletionScheduledForUtc} kind="date" /> }} /></Banner> : null}

        <Section title={t("users:detail.accessTitle")}>
          {/* Tablero M-Usuario: en el teléfono, filas con › que abren una hoja para elegir. */}
          {phone ? <ul className="m-0 list-none p-0">
            <SettingsItem title={t("users:detail.status")} detail={stateLabel} onClick={editable && isMember ? () => setSheet("state") : undefined} />
            <SettingsItem title={t("users:detail.organizationRoles")} detail={roleNames || t("users:detail.noRoles")} onClick={editable ? () => setSheet("roles") : undefined} />
          </ul> : <SectionFields className="grid gap-4 md:grid-cols-2">
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
          </SectionFields>}
        </Section>

        <Section title={t("users:detail.companyAccess")} action={editable ? { label: t("users:detail.addCompany"),
          disabled: !companies.data || activeCompanies.every((company) => assignedCompanyIds.has(company.id)) || save.isPending,
          onClick: () => openCompanyDialog({ mode: "add", companyId: "", roleIds: [] }) } : undefined}>
            {member.companies.length === 0 ? <p className="p-4 text-[13px] text-[var(--t2)] md:px-5">{t("users:detail.noCompanies")}</p> : <List label={t("users:detail.companyAccess")}>
              {member.companies.map((company) => {
                const preserved = preservedCompanyIds.has(company.companyId);
                const assignment = { companyId: company.companyId, roleIds: company.roles.map((role) => role.id) };
                const roleNames = company.roles.map((role) => role.name).join(", ") || t("users:detail.companyNoRoles");
                return <ListItem key={company.companyId} icon={<Building2 aria-hidden="true" />} title={company.companyName}
                  detail={preserved ? <>{roleNames}<Separator />{t("users:detail.companyInactive")}</> : roleNames}>
                  {editable && !preserved ? <RowActions label={t("users:detail.companyActions", { name: company.companyName })} actions={[
                    { label: t("users:detail.changeCompanyRoles"), accessibleName: t("users:detail.changeCompanyRoles"), icon: Settings2, onSelect: () => openCompanyDialog({ mode: "roles", ...assignment }) },
                    { label: t("users:detail.removeCompanyAction"), accessibleName: t("users:detail.removeCompanyAction"), icon: Trash2, destructive: true,
                      onSelect: () => { void saveCompanies(changeableAssignments.filter((item) => item.companyId !== company.companyId), t("users:detail.messages.companyRemoved", { name: displayName, company: company.companyName }), "page"); } },
                  ]} /> : null}
                </ListItem>;
              })}
            </List>}
        </Section>
      </div>
    </Page>
    <ChoiceSheet open={sheet === "state"} onOpenChange={(open) => { if (!open) setSheet(null); }} title={t("users:detail.status")}>
      {(["Active", "Inactive"] as const).map((value) => <RadioRow key={value} name="user-state" label={t(`users:states.${value}`)}
        description={t(value === "Active" ? "users:detail.statusActiveDescription" : "users:detail.statusInactiveDescription")}
        checked={current.isActive === (value === "Active")} onChoose={() => { changeDraft({ isActive: value === "Active" }); setSheet(null); }} />)}
    </ChoiceSheet>
    <ChoiceSheet open={sheet === "roles"} onOpenChange={(open) => { if (!open) setSheet(null); }} title={t("users:detail.organizationRoles")}>
      <CheckRow label={t("users:detail.allRoles")} checked={orgRoleValues.length > 0 && orgRoleValues.every((id) => current.roleIds.includes(id))}
        onCheckedChange={(checked) => changeDraft({ roleIds: checked ? [...new Set([...current.roleIds, ...orgRoleValues])] : current.roleIds.filter((id) => !orgRoleValues.includes(id)) })} />
      {orgRoles.map((role) => <CheckRow key={role.id} label={role.name} checked={current.roleIds.includes(role.id)}
        onCheckedChange={(checked) => changeDraft({ roleIds: checked ? [...current.roleIds, role.id] : current.roleIds.filter((id) => id !== role.id) })} />)}
    </ChoiceSheet>
    <Dialog open={companyDialog !== null} onOpenChange={(open) => { if (!open && !save.isPending) closeCompanyDialog(); }}>
      {/* «Criterio · Diálogos»: dos campos, el chico de 420 px. Tablero Usuario (v100): «Roles en la empresa» aparece al
          elegir la empresa y es opcional. */}
      <DialogContent size="sm">
        <DialogHeader><DialogTitle>{companyDialog?.mode === "add" ? t("users:detail.addCompanyTitle") : t("users:detail.changeCompanyRolesTitle", { name: companyName(companyDialog?.companyId ?? "") })}</DialogTitle></DialogHeader>
        <DialogBody>
          {companyDialog?.mode === "add" ? <FormField label={t("users:invite.company")} required error={companyDialog.missingCompany ? t("users:detail.companyRequired") : undefined}>
            <Select value={companyDialog.companyId} onValueChange={(companyId) => changeCompanyDialog({ ...companyDialog, companyId, roleIds: [], missingCompany: false })}>
              <SelectTrigger className="w-full" aria-label={t("users:invite.company")}><SelectValue placeholder={t("users:invite.chooseCompany")} /></SelectTrigger>
              <SelectContent position="popper">{activeCompanies.filter((company) => !assignedCompanyIds.has(company.id)).map((company) => <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>)}</SelectContent>
            </Select>
          </FormField> : null}
          {companyDialog?.companyId ? <RolesField label={t("users:invite.companyRoles")} allLabel={t("users:detail.allRoles")}
            options={dialogCompanyRoles.map((role: RoleResponse) => ({ value: role.id, label: role.name }))} value={companyDialog.roleIds}
            onChange={(roleIds) => changeCompanyDialog({ ...companyDialog, roleIds })} placeholder={t("users:detail.noRoles")} /> : null}
          {/* «Criterio · Diálogos»: el error general, también el 409, en la franja arriba de los botones. */}
          {dialogError ? <FormError message={dialogError} /> : null}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={save.isPending} onClick={closeCompanyDialog}>{t("common:actions.cancel")}</Button>
          <Button type="button" disabled={save.isPending} onClick={() => { void saveCompanyDialog(); }}>{save.isPending ? t("common:states.saving") : companyDialog?.mode === "add" ? t("users:detail.addCompanyConfirm") : t("users:detail.saveCompanyRoles")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <ConfirmDialog open={confirmation !== null} onOpenChange={(open) => { if (!open) setConfirmAction(null); }} destructive
      title={confirmation?.title ?? ""} description={confirmation?.description} confirmLabel={confirmation?.label ?? ""}
      onConfirm={() => confirmation?.run()} />
    {edit.leaveDialog}
  </>;
}
