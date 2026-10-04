import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Shield } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { toast } from "sonner";
import { useCurrentUser } from "@/auth/useCurrentUser";
import { useBreadcrumbLeaf } from "@/shared/hooks/useBreadcrumbLeaf";
import { useUnsavedChangesGuard } from "@/shared/hooks/useUnsavedChangesGuard";
import { ApiError } from "@/shared/api/ApiError";
import type { CompanyResponse, PermissionGroupResponse, RoleResponse, RoleScope } from "@/shared/api/types";
import { Button } from "@/shared/ui/button";
import { CheckboxField } from "@/shared/ui/CheckboxField";
import { ConcurrencyBanner } from "@/shared/ui/ConcurrencyBanner";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { FormError } from "@/shared/ui/FormError";
import { FormField } from "@/shared/ui/FormField";
import { Input } from "@/shared/ui/input";
import { Page } from "@/shared/ui/Page";
import { Section } from "@/shared/ui/Section";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { Checkbox } from "@/shared/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";
import { ForbiddenPage } from "@/shared/ui/ForbiddenPage";
import { fetchCompanyOptions, fetchPermissionGroups, fetchRole, permissionGroupsQueryKey, roleQueryKey, rolesQueryKeyRoot, createRole, updateRole } from "../api/roles";
import { displayRoleDescription, displayRoleName } from "../columns";

interface RoleDraft {
  name: string;
  description: string;
  scope: RoleScope | undefined;
  companyId: string;
  permissions: string[];
}

// Tablero M-Rol (.ap-chk): la casilla del teléfono mide 22, con borde de 1,5.
const phoneCheckClass = "size-[22px]! rounded-[6px]! border-[1.5px]! border-[var(--borde2)]! data-[state=checked]:border-[var(--marca)]!";

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
  const { phone } = useAppChrome();
  const { data: currentUser } = useCurrentUser();
  const canRead = currentUser?.permissions?.includes("roles.read") === true;
  const canManage = currentUser?.permissions?.includes("roles.manage") === true;
  const role = useQuery({
    queryKey: roleQueryKey(roleId ?? ""),
    queryFn: () => fetchRole(roleId!),
    enabled: canRead && mode === "edit" && Boolean(roleId),
    meta: { silent: true },
  });
  const requestedScope = searchParams.get("scope");
  const requestedCompanyId = searchParams.get("companyId") ?? "";
  const initialCreateDraft: RoleDraft = requestedScope === "SpecificCompany"
    ? { ...emptyDraft, scope: "SpecificCompany", companyId: requestedCompanyId }
    : requestedScope === "AnyCompany" ? { ...emptyDraft, scope: "AnyCompany" } : emptyDraft;
  const permissions = useQuery({
    queryKey: permissionGroupsQueryKey,
    queryFn: fetchPermissionGroups,
    enabled: canRead && (mode === "edit" || canManage),
    meta: { silent: true },
  });
  const [draftState, setDraftState] = useState<RoleDraft | null>(() => mode === "create" ? initialCreateDraft : null);
  const [expandedAreas, setExpandedAreas] = useState<Set<string> | null>(null);
  const draft = draftState ?? (role.data ? draftFromRole(role.data) : emptyDraft);
  const original = role.data ? draftFromRole(role.data) : emptyDraft;
  const companies = useQuery({
    queryKey: ["role-company-options"],
    queryFn: fetchCompanyOptions,
    enabled: currentUser?.permissions?.includes("companies.read") === true && (mode === "create" || draft.scope === "SpecificCompany"),
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
  const idempotencyKey = useMemo(() => crypto.randomUUID(), []);
  const visibleGroups = useMemo(() => groupsForScope(permissions.data ?? [], draft.scope), [permissions.data, draft.scope]);
  const selectedCount = visibleGroups.reduce((total, group) => total + group.permissions.filter((item) => draft.permissions.includes(item.code)).length, 0);
  const availableCount = visibleGroups.reduce((total, group) => total + group.permissions.length, 0);

  useBreadcrumbLeaf(mode === "create" ? t("roles:createTitle") : role.data ? displayRoleName(role.data, t) : undefined);

  const save = useMutation({
    mutationFn: async () => {
      if (draft.name.trim() === "") {
        setValidation((current) => ({ ...current, name: t("roles:validation.nameRequired") }));
        throw new Error("validation");
      }
      if (!draft.scope) {
        setValidation((current) => ({ ...current, scope: t("roles:validation.scopeRequired") }));
        throw new Error("validation");
      }
      if (draft.scope === "SpecificCompany" && !draft.companyId) {
        setValidation((current) => ({ ...current, companyId: t("roles:validation.companyRequired") }));
        throw new Error("validation");
      }
      if (draft.permissions.length === 0) {
        setValidation((current) => ({ ...current, permissions: t("roles:validation.permissionsRequired") }));
        throw new Error("validation");
      }

      const request = {
        name: draft.name.trim(),
        description: draft.description.trim() || null,
        scope: draft.scope,
        // The selected-company catalog arrives in E6; edits preserve an existing company id.
        companyId: draft.scope === "SpecificCompany" ? draft.companyId : null,
        permissions: draft.permissions,
      };
      if (mode === "create") return { id: await createRole(request, idempotencyKey) };
      await updateRole(roleId!, { ...request, version: role.data!.version });
      return { id: roleId! };
    },
    onSuccess: async ({ id }) => {
      setFailure(undefined);
      setValidation({});
      toast.success(t(mode === "create" ? "roles:created" : "roles:updated", { name: draft.name.trim() }));
      await queryClient.invalidateQueries({ queryKey: rolesQueryKeyRoot });
      if (mode === "create") {
        await queryClient.invalidateQueries({ queryKey: roleQueryKey(id) });
        guard.allowNextNavigation();
        void navigate(`/org/roles/${encodeURIComponent(id)}`, { replace: true });
      } else {
        await queryClient.invalidateQueries({ queryKey: roleQueryKey(id) });
        setDraftState(draft);
      }
    },
    onError: (error) => { if (!(error instanceof Error && error.message === "validation")) setFailure(error); },
  });

  const summary = mode === "edit" && role.data ? t("roles:scopeAndUsers", { scope: valeEnText(role.data.scope), count: role.data.userCount }) : undefined;
  const title = mode === "create" ? t("roles:createTitle") : role.data ? displayRoleName(role.data, t) : t("roles:editorTitle");

  if (!canRead || mode === "create" && !canManage) return <ForbiddenPage homePath="/org" />;
  if (mode === "edit" && role.isPending) return <Page icon={Shield} title={t("roles:editorTitle")}><p role="status" className="p-4 text-[13px] text-[var(--t2)]">{t("common:states.loading")}</p></Page>;
  if (mode === "edit" && role.isError) return <Page icon={Shield} title={t("roles:editorTitle")} backTo={{ to: "/org/roles", label: t("roles:backToList") }}><div className="p-4"><FormError message={role.error instanceof ApiError ? role.error.detail ?? t("common:states.error") : t("common:states.error")} /><Button type="button" onClick={() => { void role.refetch(); }}>{t("common:actions.retry")}</Button></div></Page>;

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
        <Button type="button" disabled={save.isPending || mode === "edit" && !isDirty} onClick={() => save.mutate()}>{save.isPending ? t("roles:saving") : mode === "create" ? t("roles:create") : t("roles:save")}</Button>
      </> : undefined}
    >
      <div className="flex flex-col gap-3.5">
        {failure && !(failure instanceof ApiError && failure.code === "General.ConcurrencyConflict")
          ? <FormError message={failure instanceof ApiError ? failure.detail ?? t("common:states.error") : t("common:states.error")} /> : null}
        {permissions.isError ? <FormError message={permissions.error instanceof ApiError ? permissions.error.detail ?? t("common:states.error") : t("common:states.error")} /> : null}
        {/* Tablero M-Rol: en el teléfono los datos van sueltos sobre blanco, sin título a la vista. */}
        <Section title={t("roles:dataTitle")} phone="untitled">
          <div className="flex flex-col gap-3.5 p-4 lg:gap-3.5 lg:p-5 max-md:p-0">
            <div className="grid gap-3.5 lg:grid-cols-2 lg:gap-x-5">
              <div className="w-full">
                {editable ? <FormField label={t("roles:fields.name")} required error={validation.name}>
                  <Input value={draft.name} maxLength={60} autoComplete="off" onChange={(event) => changeDraft({ name: event.target.value })} />
                </FormField> : <div className="flex flex-col gap-1.5"><span className="text-[12px] font-semibold text-[var(--t2)] max-md:text-[13.5px]">{t("roles:fields.name")}</span><p className="min-h-9 text-[13px] text-[var(--t1)] max-md:min-h-0 max-md:text-[16px]">{role.data && isSystemRole ? displayRoleName(role.data, t) : draft.name}</p></div>}
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
                </FormField> : <div className="flex flex-col gap-1.5"><span className="text-[12px] font-semibold text-[var(--t2)] max-md:text-[13.5px]">{t("roles:fields.scope")}</span><p className="min-h-9 text-[13px] text-[var(--t1)] max-md:min-h-0 max-md:text-[16px]">{role.data ? valeEnText(role.data.scope) : ""}</p></div>}
              </div>
              <div className="w-full">
              {editable ? <FormField label={t("roles:fields.description")}>
                <Textarea value={draft.description} maxLength={500} className="min-h-[88px] resize-y max-md:min-h-[104px]" onChange={(event) => changeDraft({ description: event.target.value })} />
              </FormField> : <div className="flex flex-col gap-1.5"><span className="text-[12px] font-semibold text-[var(--t2)] max-md:text-[13.5px]">{t("roles:fields.description")}</span><p className="min-h-9 whitespace-pre-wrap text-[13px] text-[var(--t1)] max-md:min-h-0 max-md:text-[16px]">{role.data && isSystemRole ? displayRoleDescription(role.data, t) ?? t("roles:noDescription") : draft.description || t("roles:noDescription")}</p></div>}
            </div>
            </div>
          </div>
        </Section>

        <Section title={t("roles:permissionsTitle")} phone="inset" meta={draft.scope ? t("roles:permissionCount", { selected: selectedCount, total: availableCount }) : undefined}>
          {validation.permissions ? <p role="alert" className="mx-4 mt-3 rounded-[8px] border border-[var(--peligro)] bg-[var(--peligro-t)] px-3 py-2 text-[13px] text-[var(--peligro)]">{validation.permissions}</p> : null}
          {!draft.scope ? <p className="p-4 text-[13px] text-[var(--t2)]">{t("roles:scope.chooseForPermissions")}</p>
            : permissions.isPending ? <p role="status" className="p-4 text-[13px] text-[var(--t2)]">{t("common:states.loading")}</p>
              : <div className="divide-y divide-[var(--borde)]">
                {visibleGroups.map((group) => {
                  const codes = group.permissions.map((item) => item.code);
                  const selected = codes.filter((code) => draft.permissions.includes(code)).length;
                  const expanded = expandedAreas?.has(group.area) ?? selected > 0;
                  const toggle = <button type="button" aria-expanded={expanded} aria-label={t("roles:toggleArea", { name: group.name })} onClick={() => toggleArea(group.area)} className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-[var(--t2)] hover:bg-[var(--s2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foco)] max-md:text-[var(--t3)]">
                    <ChevronRight aria-hidden="true" className={`size-4 transition-transform ${expanded ? "rotate-90" : ""}`} />
                  </button>;
                  // Tablero M-Rol: en el teléfono el área es una fila de 52 con la cuenta a la derecha y cada permiso,
                  // una fila de 50 con la casilla de 22.
                  if (phone) return <fieldset key={group.area} className="m-0 p-0">
                    <legend className="sr-only">{group.name}</legend>
                    <div className="flex min-h-[52px] items-center gap-3 pr-3.5 pl-3 text-[15.5px] font-semibold text-[var(--t1)]">
                      {toggle}
                      <label className="flex min-w-0 flex-1 items-center gap-3">
                        <Checkbox checked={codes.length > 0 && selected === codes.length} disabled={!editable} onCheckedChange={(checked) => toggleGroup(codes, checked === true)} className={phoneCheckClass} />
                        <span className="min-w-0 flex-1 truncate">{group.name}</span>
                      </label>
                      <span className="shrink-0 text-[13px] font-medium text-[var(--t3)]">{t("roles:groupCount", { selected, total: codes.length })}</span>
                    </div>
                    {expanded ? group.permissions.map((permission) => <label key={permission.code} className="flex min-h-[50px] items-center gap-3 border-t border-[var(--borde)] pr-3.5 pl-[46px] text-[15px] text-[var(--t1)]">
                      <Checkbox checked={draft.permissions.includes(permission.code)} disabled={!editable} onCheckedChange={(checked) => togglePermission(permission.code, checked === true)} className={phoneCheckClass} />
                      <span className="min-w-0 flex-1">{permission.name}</span>
                    </label>) : null}
                  </fieldset>;
                  return <fieldset key={group.area} className="p-3 lg:p-4">
                    <legend className="sr-only">{group.name}</legend>
                    <div className="flex items-center gap-2">
                      {toggle}
                      <CheckboxField label={group.name} checked={codes.length > 0 && selected === codes.length}
                        onCheckedChange={(checked) => toggleGroup(codes, checked)} disabled={!editable}
                        description={t("roles:groupCount", { selected, total: codes.length })} />
                    </div>
                    {expanded ? <div className="mt-1 grid gap-1 lg:ml-9">
                      {group.permissions.map((permission) => <CheckboxField key={permission.code} label={permission.name}
                        checked={draft.permissions.includes(permission.code)} onCheckedChange={(checked) => togglePermission(permission.code, checked)} disabled={!editable} />)}
                    </div> : null}
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
