import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Shield } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { toast } from "sonner";
import { usePermissions } from "@/auth/usePermissions";
import { useBreadcrumbLeaf } from "@/shared/hooks/useBreadcrumbLeaf";
import { useUnsavedChangesGuard } from "@/shared/hooks/useUnsavedChangesGuard";
import { ApiError } from "@/shared/api/ApiError";
import { actionErrorMessage, apiErrorMessage } from "@/shared/api/errorMessage";
import type { CompanyResponse, CreateRoleRequest, PermissionGroupResponse, RoleResponse, RoleScope, UpdateRoleRequest } from "@/shared/api/types";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { Button } from "@/shared/ui/button";
import { ConcurrencyBanner } from "@/shared/ui/ConcurrencyBanner";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { FormError } from "@/shared/ui/FormError";
import { LoadErrorPage } from "@/shared/ui/LoadErrorPage";
import { FormField } from "@/shared/ui/FormField";
import { Input } from "@/shared/ui/input";
import { Page } from "@/shared/ui/Page";
import { Section } from "@/shared/ui/Section";
import { Checkbox } from "@/shared/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";
import { fetchCompanyOptions, fetchPermissionGroups, fetchRole, permissionGroupsQueryKey, roleQueryKey, rolesQueryKeyRoot, createRole, updateRole } from "../api/roles";
import { displayRoleDescription, displayRoleName } from "../columns";

interface RoleDraft {
  name: string;
  description: string;
  scope: RoleScope | undefined;
  companyId: string;
  permissions: string[];
}

// La casilla: en la compu, la de siempre con borde visible; en el teléfono (tablero M-Rol, .ap-chk), de 22 con borde de 1,5.
const checkClass = "border-[var(--t2)] max-md:size-[22px]! max-md:rounded-[6px]! max-md:border-[1.5px]! max-md:border-[var(--borde2)]! max-md:enabled:data-[state=checked]:border-[var(--marca)]!";

const emptyDraft: RoleDraft = { name: "", description: "", scope: undefined, companyId: "", permissions: [] };

function draftFromRole(role: RoleResponse): RoleDraft {
  return { name: role.name, description: role.description ?? "", scope: role.scope, companyId: role.companyId ?? "", permissions: [...role.permissions] };
}

function sameDraft(left: RoleDraft, right: RoleDraft): boolean {
  return left.name === right.name && left.description === right.description && left.scope === right.scope
    && left.companyId === right.companyId
    && [...left.permissions].sort().join("\u0000") === [...right.permissions].sort().join("\u0000");
}

function groupsForScope(groups: readonly PermissionGroupResponse[], scope: RoleScope | undefined) {
  if (!scope) return [];
  return groups.map((group) => ({
    ...group,
    permissions: group.permissions.filter((permission) => scope === "Organization"
      ? !permission.code.startsWith("company.")
      : permission.code.startsWith("company.")),
  })).filter((group) => group.permissions.length > 0);
}

function scopeTranslationKey(scope: RoleScope): string {
  switch (scope) {
    case "Organization": return "roles:scope.organization";
    case "AnyCompany": return "roles:scope.company";
    case "SpecificCompany": return "roles:scope.specificCompany";
  }
}

export function RoleEditorPage({ mode }: { mode: "create" | "edit" }) {
  const { t } = useTranslation(["roles", "common", "errors"]);
  const { roleId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const canManage = can("roles.manage");
  const role = useQuery({
    queryKey: roleQueryKey(roleId ?? ""),
    queryFn: () => fetchRole(roleId!),
    enabled: mode === "edit" && Boolean(roleId),
    meta: { silent: true, blocksView: true },
  });
  const requestedScope = searchParams.get("scope");
  const requestedCompanyId = searchParams.get("companyId") ?? "";
  const initialCreateDraft: RoleDraft = requestedScope === "SpecificCompany"
    ? { ...emptyDraft, scope: "SpecificCompany", companyId: requestedCompanyId }
    : requestedScope === "AnyCompany" ? { ...emptyDraft, scope: "AnyCompany" } : emptyDraft;
  const permissions = useQuery({
    queryKey: permissionGroupsQueryKey,
    queryFn: fetchPermissionGroups,
    enabled: mode === "edit" || canManage,
    meta: { silent: true },
  });
  const [draftState, setDraftState] = useState<RoleDraft | null>(() => mode === "create" ? initialCreateDraft : null);
  const [expandedAreas, setExpandedAreas] = useState<Set<string> | null>(null);
  const draft = draftState ?? (role.data ? draftFromRole(role.data) : emptyDraft);
  const original = role.data ? draftFromRole(role.data) : emptyDraft;
  const companies = useQuery({
    queryKey: ["role-company-options"],
    queryFn: fetchCompanyOptions,
    enabled: can("companies.read") && (mode === "create" || draft.scope === "SpecificCompany"),
    meta: { silent: true },
  });
  const companyName = draft.companyId ? companies.data?.items.find((company) => company.id === draft.companyId)?.name : undefined;
  // «Vale en» (tablero Rol): toda la organización o una empresa por nombre. «Cada empresa» queda para la API.
  const valeEn = draft.scope === "Organization" ? "Organization"
    : draft.scope === "SpecificCompany" && draft.companyId ? `company:${draft.companyId}`
      : draft.scope === "AnyCompany" ? "AnyCompany" : "";
  const valeEnText = (scope: RoleScope) => scope === "SpecificCompany" ? companyName ?? t("roles:scope.specificCompany") : t(scopeTranslationKey(scope));
  const isSystemRole = role.data?.isSystemRole === true;
  const editable = canManage && mode === "create" || canManage && mode === "edit" && !isSystemRole;
  const isDirty = editable && !sameDraft(draft, original);
  const guard = useUnsavedChangesGuard(isDirty);
  const [leaveConfirmationOpen, setLeaveConfirmationOpen] = useState(false);
  const [failure, setFailure] = useState<unknown>();
  const [validation, setValidation] = useState<{ name?: string; scope?: string; companyId?: string; permissions?: string }>({});
  const visibleGroups = useMemo(() => groupsForScope(permissions.data ?? [], draft.scope), [permissions.data, draft.scope]);
  const selectedCount = visibleGroups.reduce((total, group) => total + group.permissions.filter((item) => draft.permissions.includes(item.code)).length, 0);
  const availableCount = visibleGroups.reduce((total, group) => total + group.permissions.length, 0);

  useBreadcrumbLeaf(mode === "create" ? t("roles:createTitle") : role.data ? displayRoleName(role.data, t) : undefined);

  // El alta usa una clave por formulario que se renueva después de un 4xx: corregido el nombre, el segundo envío
  // no choca con la respuesta guardada del primero (B2).
  const create = useIdempotentMutation((request: CreateRoleRequest, key) => createRole(request, key));
  const update = useMutation({ mutationFn: (request: UpdateRoleRequest) => updateRole(roleId!, request) });
  const saving = create.isPending || update.isPending;

  /// Se valida antes de enviar; muestra el primer dato que falta, como hasta ahora.
  function validRequest(): CreateRoleRequest | null {
    if (draft.name.trim() === "") {
      setValidation((current) => ({ ...current, name: t("roles:validation.nameRequired") }));
      return null;
    }
    if (!draft.scope) {
      setValidation((current) => ({ ...current, scope: t("roles:validation.scopeRequired") }));
      return null;
    }
    if (draft.scope === "SpecificCompany" && !draft.companyId) {
      setValidation((current) => ({ ...current, companyId: t("roles:validation.companyRequired") }));
      return null;
    }
    if (draft.permissions.length === 0) {
      setValidation((current) => ({ ...current, permissions: t("roles:validation.permissionsRequired") }));
      return null;
    }
    return {
      name: draft.name.trim(),
      description: draft.description.trim() || null,
      scope: draft.scope,
      companyId: draft.scope === "SpecificCompany" ? draft.companyId : null,
      permissions: draft.permissions,
    };
  }

  async function saved(id: string, savedDraft: RoleDraft) {
    setFailure(undefined);
    setValidation({});
    toast.success(t(mode === "create" ? "roles:created" : "roles:updated", { name: savedDraft.name.trim() }));
    await queryClient.invalidateQueries({ queryKey: rolesQueryKeyRoot });
    await queryClient.invalidateQueries({ queryKey: roleQueryKey(id) });
    if (mode === "create") {
      guard.allowNextNavigation();
      void navigate(`/org/roles/${encodeURIComponent(id)}`, { replace: true });
    } else {
      setDraftState(savedDraft);
    }
  }

  function save() {
    const request = validRequest();
    if (!request) return;
    const submitted = draft;
    setFailure(undefined);
    if (mode === "create") create.mutate(request, { onSuccess: (id) => saved(id, submitted), onError: setFailure });
    else update.mutate({ ...request, version: role.data!.version }, { onSuccess: () => saved(roleId!, submitted), onError: setFailure });
  }

  // «Vale en toda la organización»: en la oración, el alcance va en minúscula.
  const scopeInSentence = (scope: RoleScope) => scope === "SpecificCompany" ? companyName ?? t("roles:scopeInSentence.specificCompany")
    : t(scope === "Organization" ? "roles:scopeInSentence.organization" : "roles:scopeInSentence.company");
  const summary = mode === "edit" && role.data ? t("roles:scopeAndUsers", { scope: scopeInSentence(role.data.scope), count: role.data.userCount }) : undefined;
  const title = mode === "create" ? t("roles:createTitle") : role.data ? displayRoleName(role.data, t) : t("roles:editorTitle");

  if (mode === "edit" && role.isPending) return <Page icon={Shield} title={t("roles:editorTitle")}><p role="status" className="p-4 text-[13px] text-[var(--t2)]">{t("common:states.loading")}</p></Page>;
  // «Criterio · Avisos» (Pantalla de error): el rol no cargó y no hay nada que mostrar.
  if (mode === "edit" && !role.data) return <LoadErrorPage onRetry={() => { void role.refetch(); }} screen={t("roles:editorTitle")} back={{ to: "/org/roles", label: t("roles:backToList") }} />;

  function changeDraft(patch: Partial<RoleDraft>) {
    if (patch.scope !== undefined && patch.scope !== draft.scope) setExpandedAreas(null);
    setDraftState((current) => ({ ...(current ?? (role.data ? draftFromRole(role.data) : emptyDraft)), ...patch }));
    setValidation({});
    setFailure(undefined);
  }

  function togglePermission(code: string, checked: boolean) {
    const next = checked ? [...new Set([...draft.permissions, code])] : draft.permissions.filter((item) => item !== code);
    changeDraft({ permissions: next });
  }

  function toggleGroup(codes: readonly string[], checked: boolean) {
    const next = new Set(draft.permissions);
    for (const code of codes) {
      if (checked) next.add(code);
      else next.delete(code);
    }
    changeDraft({ permissions: [...next] });
  }

  function toggleArea(area: string) {
    setExpandedAreas((current) => {
      const initiallyExpanded = visibleGroups.filter((group) => group.permissions.some((permission) => draft.permissions.includes(permission.code))).map((group) => group.area);
      const next = new Set(current ?? initiallyExpanded);
      if (next.has(area)) next.delete(area);
      else next.add(area);
      return next;
    });
  }

  function leave() {
    if (isDirty) setLeaveConfirmationOpen(true);
    else { guard.allowNextNavigation(); void navigate("/org/roles"); }
  }

  // Lienzo v87: al editar, «Descartar cambios» vuelve a lo guardado sin salir, como la ficha de un usuario.
  function discard() {
    setDraftState(null);
    setValidation({});
    setFailure(undefined);
  }

  async function seeLatest() {
    const result = await role.refetch();
    if (result.data) setDraftState(draftFromRole(result.data));
    setFailure(undefined);
  }

  return <>
    <Page banner={<ConcurrencyBanner error={failure} isDirty={isDirty} onSeeNew={() => { void seeLatest(); }} onContinueEditing={() => setFailure(undefined)} />}
      icon={Shield}
      title={title}
      backTo={{ to: "/org/roles", label: t("roles:backToList") }}
      summary={summary}
      phoneSubtitle={summary}
      status={isSystemRole ? t("roles:system") : undefined}
      actions={editable ? <>
        {mode === "edit"
          ? <Button type="button" variant="outline" onClick={discard}>{t("roles:discard")}</Button>
          : <Button type="button" variant="outline" onClick={leave}>{t("roles:cancel")}</Button>}
        <Button type="button" disabled={saving || mode === "edit" && !isDirty} onClick={save}>{saving ? t("roles:saving") : mode === "create" ? t("roles:create") : t("roles:save")}</Button>
      </> : undefined}
    >
      <div className="flex flex-col gap-3.5">
        {failure instanceof ApiError && failure.code === "General.ConcurrencyConflict" ? null : <FormError message={actionErrorMessage(failure, t)} />}
        {permissions.isError ? <FormError message={apiErrorMessage(permissions.error, t)} /> : null}
        {/* Tablero M-Rol: en el teléfono los datos van sueltos sobre blanco, sin título a la vista. */}
        <Section title={t("roles:dataTitle")} phone="untitled">
          <div className="flex flex-col gap-3.5 p-4 lg:gap-3.5 lg:p-5 max-md:p-0">
            <div className="grid gap-3.5 lg:grid-cols-2 lg:gap-x-5">
              <div className="w-full">
                {editable ? <FormField label={t("roles:fields.name")} required error={validation.name}>
                  <Input value={draft.name} maxLength={60} autoComplete="off" onChange={(event) => changeDraft({ name: event.target.value })} />
                </FormField> : <div className="flex flex-col gap-1.5"><span className="text-[12.5px] font-semibold text-[var(--t2)] max-md:text-[13.5px]">{t("roles:fields.name")}</span><p className="min-h-9 text-[13px] text-[var(--t1)] max-md:min-h-0 max-md:text-[16px]">{role.data && isSystemRole ? displayRoleName(role.data, t) : draft.name}</p></div>}
              </div>
              <div className="w-full">
                {mode === "create" ? <FormField label={t("roles:fields.scope")} required error={validation.scope ?? validation.companyId}>
                  <Select value={valeEn} onValueChange={(value) => {
                    const companyId = value.startsWith("company:") ? value.slice("company:".length) : "";
                    const scope: RoleScope = companyId ? "SpecificCompany" : value as RoleScope;
                    // Entre empresas los permisos son los mismos; al pasar a o desde la organización se eligen de nuevo.
                    changeDraft({ scope, companyId, permissions: scope === draft.scope ? draft.permissions : [] });
                  }}>
                    <SelectTrigger className="w-full" aria-label={t("roles:fields.scope")}><SelectValue placeholder={t("roles:scope.choose")} /></SelectTrigger>
                    <SelectContent position="popper">
                      <SelectItem value="Organization" description={t("roles:scope.organizationDescription")}>{t("roles:scope.organization")}</SelectItem>
                      {draft.scope === "AnyCompany" ? <SelectItem value="AnyCompany" description={t("roles:scope.companyDescription")}>{t("roles:scope.company")}</SelectItem> : null}
                      {(companies.data?.items ?? []).filter((company: CompanyResponse) => company.status === "Active").map((company) => <SelectItem key={company.id} value={`company:${company.id}`}>{company.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField> : <div className="flex flex-col gap-1.5"><span className="text-[12.5px] font-semibold text-[var(--t2)] max-md:text-[13.5px]">{t("roles:fields.scope")}</span><p className="min-h-9 text-[13px] text-[var(--t1)] max-md:min-h-0 max-md:text-[16px]">{role.data ? valeEnText(role.data.scope) : ""}</p></div>}
              </div>
              <div className="w-full">
              {editable ? <FormField label={t("roles:fields.description")}>
                <Textarea value={draft.description} maxLength={500} className="min-h-[88px] max-md:min-h-[104px]" onChange={(event) => changeDraft({ description: event.target.value })} />
              </FormField> : <div className="flex flex-col gap-1.5"><span className="text-[12.5px] font-semibold text-[var(--t2)] max-md:text-[13.5px]">{t("roles:fields.description")}</span><p className="min-h-9 whitespace-pre-wrap text-[13px] text-[var(--t1)] max-md:min-h-0 max-md:text-[16px]">{role.data && isSystemRole ? displayRoleDescription(role.data, t) ?? t("roles:noDescription") : draft.description || t("roles:noDescription")}</p></div>}
            </div>
            </div>
          </div>
        </Section>

        <Section title={t("roles:permissionsTitle")} phone="inset" meta={draft.scope ? t("roles:permissionCount", { selected: selectedCount, total: availableCount }) : undefined}>
          {validation.permissions ? <p role="alert" className="mx-4 mt-3 rounded-[8px] border border-[var(--peligro)] bg-[var(--peligro-t)] px-3 py-2 text-[13px] text-[var(--peligro)]">{validation.permissions}</p> : null}
          {!draft.scope ? <p className="p-4 text-[13px] text-[var(--t2)]">{t("roles:scope.chooseForPermissions")}</p>
            : permissions.isPending ? <p role="status" className="p-4 text-[13px] text-[var(--t2)]">{t("common:states.loading")}</p>
              : <div className="[&>fieldset:last-child>:last-child]:border-b-0">
                {visibleGroups.map((group) => {
                  const codes = group.permissions.map((item) => item.code);
                  const selected = codes.filter((code) => draft.permissions.includes(code)).length;
                  const expanded = expandedAreas?.has(group.area) ?? selected > 0;
                  // Tableros Rol y M-Rol: cada área es una fila (40 en la compu, 52 en el teléfono) con la cuenta a la
                  // derecha, y cada permiso, una fila (40 y 50) con su casilla, sin descripción.
                  return <fieldset key={group.area} className="m-0 p-0">
                    <legend className="sr-only">{group.name}</legend>
                    <div data-slot="permission-area" className="flex min-h-10 items-center gap-2 border-b border-[var(--borde)] bg-[var(--s2)] pr-4 pl-2 text-[13px] font-semibold text-[var(--t1)] max-md:min-h-[52px] max-md:gap-3 max-md:bg-transparent max-md:pr-3.5 max-md:pl-3 max-md:text-[15.5px]">
                      <button type="button" aria-expanded={expanded} aria-label={t("roles:toggleArea", { name: group.name })} onClick={() => toggleArea(group.area)} className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-[var(--t2)] hover:bg-[var(--s3)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foco)] max-md:text-[var(--t3)]">
                        <ChevronRight aria-hidden="true" className={`size-4 transition-transform ${expanded ? "rotate-90" : ""}`} />
                      </button>
                      <label className="flex min-w-0 flex-1 items-center gap-2 max-md:gap-3">
                        <Checkbox checked={codes.length > 0 && selected === codes.length} disabled={!editable} onCheckedChange={(checked) => toggleGroup(codes, checked === true)} className={checkClass} />
                        <span className="min-w-0 flex-1 truncate">{group.name}</span>
                      </label>
                      <span className="shrink-0 font-medium text-[var(--t3)] tabular-nums max-md:text-[13px]">{t("roles:groupCount", { selected, total: codes.length })}</span>
                    </div>
                    {expanded ? group.permissions.map((permission) => <label key={permission.code} className="flex min-h-10 items-center gap-2.5 border-b border-[var(--borde)] pr-4 pl-[52px] text-[13px] font-medium text-[var(--t1)] max-md:min-h-[50px] max-md:gap-3 max-md:pr-3.5 max-md:pl-[46px] max-md:text-[15px] max-md:font-normal">
                      <Checkbox checked={draft.permissions.includes(permission.code)} disabled={!editable} onCheckedChange={(checked) => togglePermission(permission.code, checked === true)} className={checkClass} />
                      <span className="min-w-0 flex-1">{permission.name}</span>
                    </label>) : null}
                  </fieldset>;
                })}
              </div>}
        </Section>
      </div>
    </Page>
    <ConfirmDialog open={leaveConfirmationOpen || guard.isBlocked} onOpenChange={(open) => { setLeaveConfirmationOpen(open); if (!open) guard.stay(); }}
      title={t("roles:unsavedTitle")} description={t("roles:unsavedDescription")} confirmLabel={t("roles:leaveWithoutSaving")} cancelLabel={t("roles:continueEditing")} destructive
      onConfirm={() => { if (guard.isBlocked) guard.leave(); else { guard.allowNextNavigation(); void navigate("/org/roles"); } }} />
  </>;
}
