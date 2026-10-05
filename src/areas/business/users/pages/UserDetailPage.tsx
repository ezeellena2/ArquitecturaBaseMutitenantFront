import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueries, useQueryClient } from "@tanstack/react-query";
import { Building2, Settings2, Trash2 } from "lucide-react";
import { UserIcon } from "@/shared/ui/icons";
import { useRef, useState } from "react";
import { useController } from "react-hook-form";
import { Trans, useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import { useCurrentUser } from "@/auth/useCurrentUser";
import { usePermissions } from "@/auth/usePermissions";
import { ApiError } from "@/shared/api/ApiError";
import { actionErrorMessage, isNotFoundError, toastActionError } from "@/shared/api/errorMessage";
import type { OrganizationUserResponse, UpdateOrganizationUserRequest } from "@/shared/api/types";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { useBreadcrumbLeaf } from "@/shared/hooks/useBreadcrumbLeaf";
import { useEditForm } from "@/shared/hooks/useEditForm";
import { useEditPage } from "@/shared/hooks/useEditPage";
import { orderLike } from "@/shared/lib/orderLike";
import { Banner } from "@/shared/ui/Banner";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { EmptyState } from "@/shared/ui/EmptyState";
import { FormField } from "@/shared/ui/FormField";
import { List, ListItem } from "@/shared/ui/List";
import { LoadErrorPage } from "@/shared/ui/LoadErrorPage";
import { NotFoundPage } from "@/shared/ui/NotFoundPage";
import { Page } from "@/shared/ui/Page";
import { ReadOnlyField } from "@/shared/ui/ReadOnlyField";
import { RowActions } from "@/shared/ui/RowActions";
import { Section, SectionFields } from "@/shared/ui/Section";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { SettingsItem } from "@/shared/ui/app/SettingsGroup";
import { DateText } from "@/shared/ui/format/DateText";
import { StatusBadge } from "@/shared/ui/format/StatusBadge";
import { activeOrganization, homeOf } from "@/tenancy/access";
import { fetchAssignableRoles, fetchCompanyOptions, fetchUser, removeUser, resendUserInvitation, revokeUserInvitation, updateUser, userCompaniesQueryKey, userQueryKey, userRolesQueryKey, usersQueryRoot } from "../api/users";
import { userStateTones } from "../columns";
import { ChoiceSheet, CheckRow, RadioRow } from "../components/AccessSheets";
import { RolesField } from "../components/RolesField";
import { UserCompanyDialog } from "../components/UserCompanyDialog";
import { userErrorMessage, type UserAction } from "../errors";
import { companyAssignments, organizationRoleIds, sentence, type CompanyAssignment } from "../lib/access";

/// El acceso a la organización no tiene reglas propias en la pantalla: lo que el back rechaza va en la franja.
const accessFormSchema = z.object({ isActive: z.boolean(), roleIds: z.array(z.string()) });
type AccessForm = z.infer<typeof accessFormSchema>;
type UserState = OrganizationUserResponse["state"];
/// De dónde salió un guardado: su error va en la franja de la ficha o en la del diálogo, arriba de sus botones.
type SaveOrigin = "page" | "dialog";
/// «Sumar empresa» o «Cambiar roles» de una empresa; `returnFocusTo`, el ⋮ que lo abrió. `version` es la de la ficha al
/// abrirlo: el diálogo arranca con lo de ese momento y, si mientras tanto otra persona cambió algo, guardar da 409.
type CompanyDialogState = { mode: "add" | "roles"; assignment: CompanyAssignment; version: number; returnFocusTo?: HTMLElement | null };

interface SaveVariables {
  request: UpdateOrganizationUserRequest;
  message: string;
  origin: SaveOrigin;
  /** El acceso que se guardó: la ficha queda limpia con eso. Sin esto (las empresas), lo que se está editando se conserva. */
  access?: AccessForm;
}

function savedAccess(user: OrganizationUserResponse): AccessForm {
  return { isActive: user.state === "Active", roleIds: organizationRoleIds(user) };
}

function Separator() {
  return <span aria-hidden="true">{" · "}</span>;
}

export function UserDetailPage() {
  const { t } = useTranslation(["users", "common"]);
  const { memberId = "" } = useParams();
  const user = useQuery({ queryKey: userQueryKey(memberId), queryFn: () => fetchUser(memberId), enabled: Boolean(memberId), meta: { silent: true, blocksView: true } });
  useBreadcrumbLeaf(user.data ? user.data.displayName || user.data.email || undefined : undefined);

  if (user.isPending) return <Page backTo={{ to: "/org/usuarios", label: t("users:back") }} title={t("users:detail.loading")}><p role="status">{t("common:states.loading")}</p></Page>;
  // «Criterio · Avisos» (Pantalla de error): la ficha no cargó y no hay nada que mostrar; si no existe (404),
  // «No encontramos esta página» (errores.md).
  if (user.error && !user.data) return isNotFoundError(user.error)
    ? <NotFoundPage homePath={homeOf("business")} screen={t("users:detail.title")} back={{ to: "/org/usuarios", label: t("users:back") }} />
    : <LoadErrorPage onRetry={() => { void user.refetch(); }} screen={t("users:detail.title")} back={{ to: "/org/usuarios", label: t("users:back") }} />;
  if (!user.data) return <Page backTo={{ to: "/org/usuarios", label: t("users:back") }} title={t("users:detail.title")}><EmptyState title={t("users:empty.missing")} /></Page>;
  // Lo que se edita depende del estado: si cambia (aceptó la invitación, la deshabilitó otra persona, pidió la baja), la
  // ficha se arma de nuevo con lo guardado.
  return <UserDetail key={`${memberId}:${user.data.state}`} memberId={memberId} member={user.data} reload={async () => (await user.refetch()).data} />;
}

/// La ficha de una persona (tableros Usuario y M-Usuario), como el editor de Roles: el acceso con React Hook Form y zod,
/// la versión de `useEditForm`, y el 409, «Cambios sin guardar», la franja y «¿Salir sin guardar?» de `useEditPage`. Las
/// empresas se guardan al momento, desde su diálogo o el ⋮, y conservan lo que se está editando del acceso.
function UserDetail({ memberId, member, reload }: { memberId: string; member: OrganizationUserResponse; reload: () => Promise<OrganizationUserResponse | undefined> }) {
  const { t } = useTranslation(["users", "common"]);
  const { data: currentUser } = useCurrentUser();
  const { can } = usePermissions();
  const canInvite = can("users.invite");
  const canManage = can("users.manage");
  const organizationName = activeOrganization(currentUser)?.name ?? "";
  const client = useQueryClient();
  const navigate = useNavigate();
  const { phone } = useAppChrome();
  const [sheet, setSheet] = useState<"state" | "roles" | null>(null);
  const { form, version, resetTo, wrote } = useEditForm({ read: member, toValues: savedAccess, resolver: zodResolver(accessFormSchema) });
  const isActiveField = useController({ control: form.control, name: "isActive" });
  const roleIdsField = useController({ control: form.control, name: "roleIds" });
  const current: AccessForm = { isActive: isActiveField.field.value, roleIds: roleIdsField.field.value };
  const [companyDialog, setCompanyDialog] = useState<CompanyDialogState | null>(null);
  // Lo que el back rechazó en la ficha, al guardar el acceso o al quitar de la organización: va en su franja (tablero Usuario).
  const [failure, setFailure] = useState<{ error: unknown; action: UserAction }>();
  const [dialogFailure, setDialogFailure] = useState<unknown>();
  // Un 409 de concurrencia en el diálogo deja la ficha vieja: al cerrarlo se vuelve a leer si no hay cambios sin guardar.
  // Va aparte del error del diálogo, que se borra al cambiar algo en él.
  const staleAfterDialog = useRef(false);
  const [confirmAction, setConfirmAction] = useState<"disable" | "remove" | "revoke" | null>(null);
  const isInvitation = member.state === "Invited" || member.state === "Expired";
  const isMember = member.state === "Active" || member.state === "Inactive";
  const pendingDeletion = member.state === "PendingDeletion";
  const editable = canManage && !pendingDeletion;
  const isDirty = editable && form.formState.isDirty;
  // La ficha es la de quien está mirando («Lucía (vos)» en el tablero Usuario): los errores de la última Dueña lo dicen.
  const self = Boolean(member.userId && member.userId === currentUser?.id);
  // Tableros Usuario y Avisos: el 409 en su cartel, «Cambios sin guardar» en la banda, el error de guardado en la franja
  // y «¿Salir sin guardar?» antes de irse con cambios.
  const edit = useEditPage({
    isDirty, error: failure?.error,
    onSeeNew: () => { void reload().then((fresh) => { if (fresh) resetTo(fresh); setFailure(undefined); }); },
    onContinueEditing: () => setFailure(undefined),
    errorMessage: (error) => userErrorMessage(error, t, { self, action: failure?.action ?? "save" }),
  });
  const roles = useQueries({ queries: (["Organization", "Company"] as const).map((scope) => ({
    queryKey: userRolesQueryKey(scope), queryFn: () => fetchAssignableRoles(scope), enabled: canManage, meta: { silent: true },
  })) });
  const companies = useQuery({ queryKey: userCompaniesQueryKey, queryFn: fetchCompanyOptions, enabled: canManage, meta: { silent: true } });
  const orgRoles = roles[0].data?.items ?? [];
  const companyRoles = roles[1].data?.items ?? [];
  const activeCompanies = (companies.data?.items ?? []).filter((company) => company.status === "Active");
  const refresh = () => Promise.all([client.invalidateQueries({ queryKey: userQueryKey(memberId) }), client.invalidateQueries({ queryKey: usersQueryRoot })]);
  const save = useMutation({
    mutationFn: ({ request }: SaveVariables) => updateUser(memberId, request),
    // Lo guardado (el acceso, o las empresas sin tocar lo que se está editando) pasa a ser la base, con la versión que
    // respondió el guardado.
    onSuccess: async (result, { request, message, access }) => {
      setFailure(undefined);
      setDialogFailure(undefined);
      if (access) form.reset(access);
      setCompanyDialog(null);
      toast.success(sentence(message));
      await refresh();
      if (request.version != null) wrote(request.version, result.version, client.getQueryData<OrganizationUserResponse>(userQueryKey(memberId)));
    },
    onError: (error, { origin }) => {
      if (origin !== "dialog") { setFailure({ error, action: "save" }); return; }
      if (error instanceof ApiError && error.code === "General.ConcurrencyConflict") staleAfterDialog.current = true;
      setDialogFailure(error);
    },
  });
  const remove = useMutation({
    mutationFn: (_message: string) => removeUser(memberId, member.version),
    // Ya no hay nada que perder: la salida al listado no pregunta.
    onSuccess: async (_result, message) => { toast.success(sentence(message)); await client.invalidateQueries({ queryKey: usersQueryRoot }); edit.allowNextNavigation(); void navigate("/org/usuarios"); },
    onError: (error) => setFailure({ error, action: "remove" }),
  });
  const revoke = useMutation({
    mutationFn: (invitationId: string) => revokeUserInvitation(invitationId),
    onSuccess: async () => { toast.success(sentence(t("users:detail.messages.revoked", { email: member.email ?? "" }))); await refresh(); },
    onError: (error) => toastActionError(error, t),
  });
  const resend = useIdempotentMutation((invitationId: string, key) => resendUserInvitation(invitationId, key));

  const displayName = member.displayName || member.email || "";
  const shownState: UserState = isMember ? (current.isActive ? "Active" : "Inactive") : member.state;
  const dialogError = actionErrorMessage(dialogFailure, t);
  const { preserved: preservedCompanyIds, changeable: changeableAssignments } = companyAssignments(member.companies, companies.data?.items ?? []);
  const assignedCompanyIds = new Set(member.companies.map((company) => company.companyId));
  const companyName = (companyId: string) => activeCompanies.find((company) => company.id === companyId)?.name
    ?? member.companies.find((company) => company.companyId === companyId)?.companyName ?? "";
  const managedDomain = member.hasManagedEmail && member.email ? member.email.slice(member.email.indexOf("@") + 1) : null;

  // Lo elegido va en el orden de lo guardado: sacar un rol y volver a ponerlo no cuenta como un cambio.
  function changeAccess(change: Partial<AccessForm>) {
    if (change.isActive !== undefined) isActiveField.field.onChange(change.isActive);
    if (change.roleIds) roleIdsField.field.onChange(orderLike(form.formState.defaultValues?.roleIds, change.roleIds));
    setFailure(undefined);
  }

  function saveAccess(values: AccessForm) {
    setFailure(undefined);
    save.mutate({
      request: { ...(isMember ? { isActive: values.isActive } : {}), roleIds: values.roleIds, companies: changeableAssignments, version },
      message: t("users:detail.messages.saved", { name: displayName }), origin: "page", access: values,
    });
  }

  // Tablero Usuario: deshabilitar pide confirmación antes de guardar.
  const submit = form.handleSubmit((values) => {
    if (member.state === "Active" && !values.isActive) setConfirmAction("disable");
    else saveAccess(values);
  });

  // Las empresas se guardan al momento, desde el diálogo o el ⋮: no esperan a «Guardar cambios». El ⋮ actúa sobre la
  // última lectura; el diálogo, sobre la de cuando se abrió.
  function saveCompanies(assignments: CompanyAssignment[], message: string, origin: SaveOrigin, sentVersion = member.version) {
    if (origin === "dialog") setDialogFailure(undefined); else setFailure(undefined);
    save.mutate({ request: { roleIds: organizationRoleIds(member), companies: assignments, version: sentVersion }, message, origin });
  }

  function saveCompanyDialog({ mode, version: openedVersion }: CompanyDialogState, assignment: CompanyAssignment) {
    const name = companyName(assignment.companyId);
    if (mode === "add") {
      saveCompanies([...changeableAssignments, assignment], t("users:detail.messages.companyAdded", { name: displayName, company: name }), "dialog", openedVersion);
      return;
    }
    saveCompanies(changeableAssignments.map((item) => item.companyId === assignment.companyId ? assignment : item),
      t("users:detail.messages.companyRolesSaved", { company: name }), "dialog", openedVersion);
  }

  function openCompanyDialog(next: CompanyDialogState) {
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
    if (isDirty) return;
    void refresh().then(() => {
      const fresh = client.getQueryData<OrganizationUserResponse>(userQueryKey(memberId));
      if (fresh) resetTo(fresh);
    });
  }

  // «Descartar cambios» vuelve a la última lectura de lo guardado, con su versión.
  function discard() {
    resetTo(member);
    setFailure(undefined);
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
    disable: { title: t("users:detail.confirm.disableTitle", { name: displayName }), description: t("users:detail.confirm.disableDescription", { organization: organizationName }), label: t("users:detail.confirm.disableConfirm"), run: () => saveAccess(form.getValues()) },
    remove: { title: t("users:detail.confirm.removeTitle", { name: displayName, organization: organizationName }), description: removeDescription, label: t("users:detail.confirm.removeConfirm"), run: () => { setFailure(undefined); remove.mutate(t("users:detail.messages.removed", { name: displayName, organization: organizationName })); } },
    revoke: { title: t("users:detail.confirm.revokeTitle", { email: member.email ?? "" }), description: t("users:detail.confirm.revokeDescription"), label: t("users:detail.confirm.revokeConfirm"), run: () => { if (member.invitationId) revoke.mutate(member.invitationId); } },
  };
  const confirmation = confirmAction ? confirmations[confirmAction] : null;
  // Tableros Usuario y M-Usuario: punto de color y palabra, sin pastilla, con los tonos de Usuarios.
  const stateLabel = <StatusBadge tones={userStateTones} value={shownState} className="text-[var(--t3)]" />;
  const roleNames = current.roleIds.map((id) => orgRoles.find((role) => role.id === id)?.name ?? member.roles.find((role) => role.id === id)?.name)
    .filter(Boolean).join(", ");

  const detail = isInvitation
    ? <Trans ns="users" i18nKey={member.state === "Expired" ? "detail.expiredOn" : "detail.expiresOn"} components={{ date: <DateText value={member.invitationExpiresAtUtc} kind="date" /> }} />
    : <Trans ns="users" i18nKey="detail.since" components={{ date: <DateText value={member.createdAtUtc} kind="date" /> }} />;
  const summary = <>
    <StatusBadge tones={userStateTones} value={shownState} />
    {edit.unsaved ? <><Separator />{edit.unsaved}</> : null}
    {member.email ? <><Separator />{member.email}</> : null}
    <Separator />{detail}
  </>;

  return <>
    <Page banner={edit.banner} icon={UserIcon} backTo={{ to: "/org/usuarios", label: t("users:back") }} title={displayName || t("users:detail.title")} summary={summary}
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
          <Button type="button" variant="outline" onClick={discard}>{t("users:detail.discard")}</Button>
          {/* «Criterio · Botones»: se apaga solo sin cambios; no espera a los roles ni a las empresas. */}
          <Button type="submit" form="user-access" disabled={!isDirty} pending={save.isPending}>
            {t("users:detail.save")}
          </Button>
        </> : undefined}>
      <div className="flex flex-col gap-4 max-md:gap-0">
        {/* Tablero Usuario: el error de guardado, en una franja debajo de la banda. En el teléfono va en la banda debajo de
            la barra (M-Usuario, v106): la pone useEditPage en `banner`. */}
        {edit.formError}
        {pendingDeletion ? <Banner tone="warning"><Trans ns="users" i18nKey="detail.deletionScheduled" components={{ date: <DateText value={member.deletionScheduledForUtc} kind="date" /> }} /></Banner> : null}

        <Section title={t("users:detail.accessTitle")}>
          <form id="user-access" noValidate aria-label={displayName || t("users:detail.title")} onSubmit={(event) => { void submit(event); }}>
            {/* Tablero M-Usuario: en el teléfono, filas con › que abren una hoja para elegir. */}
            {phone ? <ul className="m-0 list-none p-0">
              <SettingsItem title={t("users:detail.status")} detail={stateLabel} onClick={editable && isMember ? () => setSheet("state") : undefined} />
              <SettingsItem title={t("users:detail.organizationRoles")} detail={roleNames || t("users:detail.noRoles")} onClick={editable ? () => setSheet("roles") : undefined} />
            </ul> : <SectionFields className="grid gap-4 md:grid-cols-2">
              {editable && isMember ? <FormField label={t("users:detail.status")}>
                <Select value={current.isActive ? "Active" : "Inactive"} onValueChange={(value) => changeAccess({ isActive: value === "Active" })}>
                  <SelectTrigger className="w-full" aria-label={t("users:detail.status")}><SelectValue /></SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="Active" description={t("users:detail.statusActiveDescription")}>{t("users:states.Active")}</SelectItem>
                    <SelectItem value="Inactive" description={t("users:detail.statusInactiveDescription")}>{t("users:states.Inactive")}</SelectItem>
                  </SelectContent>
                </Select>
              </FormField> : <ReadOnlyField label={t("users:detail.status")}>{t(`users:states.${member.state}`)}</ReadOnlyField>}
              {editable ? <RolesField label={t("users:detail.organizationRoles")} allLabel={t("users:detail.allRoles")}
                options={orgRoles.map((role) => ({ value: role.id, label: role.name, description: role.description ?? undefined }))} value={current.roleIds}
                onChange={(roleIds) => changeAccess({ roleIds })} placeholder={t("users:detail.noRoles")} />
                : <ReadOnlyField label={t("users:detail.organizationRoles")}>{member.roles.filter((role) => role.scope === "Organization").map((role) => role.name).join(", ") || t("users:detail.noRoles")}</ReadOnlyField>}
            </SectionFields>}
          </form>
        </Section>

        <Section title={t("users:detail.companyAccess")} action={editable ? { label: t("users:detail.addCompany"),
          disabled: !companies.data || activeCompanies.every((company) => assignedCompanyIds.has(company.id)) || save.isPending,
          onClick: () => openCompanyDialog({ mode: "add", assignment: { companyId: "", roleIds: [] }, version: member.version }) } : undefined}>
            {member.companies.length === 0 ? <p className="p-4 text-[13px] text-[var(--t2)] md:px-5">{t("users:detail.noCompanies")}</p> : <List label={t("users:detail.companyAccess")}>
              {member.companies.map((company) => {
                const preserved = preservedCompanyIds.has(company.companyId);
                const assignment = { companyId: company.companyId, roleIds: company.roles.map((role) => role.id) };
                const roleNames = company.roles.map((role) => role.name).join(", ") || t("users:detail.companyNoRoles");
                return <ListItem key={company.companyId} icon={<Building2 aria-hidden="true" />} title={company.companyName}
                  detail={preserved ? <>{roleNames}<Separator />{t("users:detail.companyInactive")}</> : roleNames}>
                  {editable && !preserved ? <RowActions label={t("users:detail.companyActions", { name: company.companyName })} actions={[
                    { label: t("users:detail.changeCompanyRoles"), accessibleName: t("users:detail.changeCompanyRoles"), icon: Settings2,
                      onSelect: (trigger) => openCompanyDialog({ mode: "roles", assignment, version: member.version, returnFocusTo: trigger }) },
                    { label: t("users:detail.removeCompanyAction"), accessibleName: t("users:detail.removeCompanyAction"), icon: Trash2, destructive: true,
                      onSelect: () => saveCompanies(changeableAssignments.filter((item) => item.companyId !== company.companyId), t("users:detail.messages.companyRemoved", { name: displayName, company: company.companyName }), "page") },
                  ]} /> : null}
                </ListItem>;
              })}
            </List>}
        </Section>
      </div>
    </Page>
    {/* Tablero M-Usuario (v99): el estado, con tilde y sin descripción, se elige y la hoja se cierra; los roles se marcan
        con casillas, sin «Todos», y «Listo» cierra la hoja. Lo elegido queda como «Cambios sin guardar» hasta guardar. */}
    <ChoiceSheet open={sheet === "state"} onOpenChange={(open) => { if (!open) setSheet(null); }} title={t("users:detail.status")}>
      {(["Active", "Inactive"] as const).map((value) => <RadioRow key={value} name="user-state" label={t(`users:states.${value}`)}
        checked={current.isActive === (value === "Active")} onChoose={() => { changeAccess({ isActive: value === "Active" }); setSheet(null); }} />)}
    </ChoiceSheet>
    <ChoiceSheet open={sheet === "roles"} onOpenChange={(open) => { if (!open) setSheet(null); }} title={t("users:detail.organizationRoles")}
      done={{ label: t("common:actions.done"), onClick: () => setSheet(null) }}>
      {orgRoles.map((role) => <CheckRow key={role.id} label={role.name} checked={current.roleIds.includes(role.id)}
        onCheckedChange={(checked) => changeAccess({ roleIds: checked ? [...current.roleIds, role.id] : current.roleIds.filter((id) => id !== role.id) })} />)}
    </ChoiceSheet>
    {companyDialog ? <UserCompanyDialog mode={companyDialog.mode} assignment={companyDialog.assignment} companyName={companyName(companyDialog.assignment.companyId)}
      companies={activeCompanies.filter((company) => !assignedCompanyIds.has(company.id))} roles={companyRoles} pending={save.isPending} error={dialogError}
      returnFocusTo={companyDialog.returnFocusTo} onEdit={() => setDialogFailure(undefined)} onClose={closeCompanyDialog}
      onSave={(assignment) => saveCompanyDialog(companyDialog, assignment)} /> : null}
    <ConfirmDialog open={confirmation !== null} onOpenChange={(open) => { if (!open) setConfirmAction(null); }} destructive
      title={confirmation?.title ?? ""} description={confirmation?.description} confirmLabel={confirmation?.label ?? ""}
      onConfirm={() => confirmation?.run()} />
    {edit.leaveDialog}
  </>;
}
