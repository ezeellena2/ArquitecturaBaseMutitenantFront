import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { Shield } from "lucide-react";
import { useMemo, useState } from "react";
import { useController, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import { usePermissions } from "@/auth/usePermissions";
import { ApiError } from "@/shared/api/ApiError";
import { apiErrorMessage, isNotFoundError } from "@/shared/api/errorMessage";
import { applyApiErrorToForm } from "@/shared/api/formErrors";
import type { CreateRoleRequest, RoleResponse, RoleScope, UpdateRoleRequest } from "@/shared/api/types";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { useBreadcrumbLeaf } from "@/shared/hooks/useBreadcrumbLeaf";
import { useEditPage } from "@/shared/hooks/useEditPage";
import { Button } from "@/shared/ui/button";
import { FormError } from "@/shared/ui/FormError";
import { FormField } from "@/shared/ui/FormField";
import { Input } from "@/shared/ui/input";
import { LoadErrorPage } from "@/shared/ui/LoadErrorPage";
import { NotFoundPage } from "@/shared/ui/NotFoundPage";
import { Page } from "@/shared/ui/Page";
import { ReadOnlyField } from "@/shared/ui/ReadOnlyField";
import { Section, SectionFields } from "@/shared/ui/Section";
import { Textarea } from "@/shared/ui/textarea";
import { homeOf } from "@/tenancy/access";
import {
  createRole,
  fetchCompanyOptions,
  fetchPermissionGroups,
  fetchRole,
  permissionGroupsQueryKey,
  roleCompanyOptionsQueryKey,
  roleQueryKey,
  rolesQueryKeyRoot,
  updateRole,
} from "../api/roles";
import { PermissionPicker } from "../components/PermissionPicker";
import { RoleScopeField } from "../components/RoleScopeField";
import { roleErrorField } from "../errors";
import { canonicalPermissions, groupsForScope, selectionCount } from "../lib/permissionPicker";
import { displayRoleDescription, displayRoleName } from "../lib/systemRoles";

const nameMaxLength = 60;
const descriptionMaxLength = 500;

/// Lo que se valida antes de mandar: cada dato que falta lo dice debajo de su campo («Criterio · Botones»).
function roleFormSchema(t: TFunction) {
  return z.object({
    name: z.string().trim().min(1, t("roles:validation.nameRequired")).max(nameMaxLength),
    description: z.string().trim().max(descriptionMaxLength),
    scope: z.enum(["Organization", "AnyCompany", "SpecificCompany"]).nullable().refine((scope) => scope !== null, t("roles:validation.scopeRequired")),
    companyId: z.string(),
    permissions: z.array(z.string()).min(1, t("roles:validation.permissionsRequired")),
  });
}

/// Lo que se escribe (sin «Vale en» al empezar) y lo que se manda (con «Vale en», el nombre sin espacios de más).
type RoleForm = z.input<ReturnType<typeof roleFormSchema>>;
type RoleFormValues = z.output<ReturnType<typeof roleFormSchema>>;

// Los errores de validación del back, en camelCase, a su campo.
const serverFields: Record<string, keyof RoleForm> = { name: "name", description: "description", scope: "scope", companyId: "scope", permissions: "permissions" };

// El catálogo de permisos: lo pide la página junto con el rol, no después, y lo usa el editor.
const permissionGroupsQuery = { queryKey: permissionGroupsQueryKey, queryFn: fetchPermissionGroups, meta: { silent: true } };

function valuesFromRole(role: RoleResponse): RoleForm {
  return { name: role.name, description: role.description ?? "", scope: role.scope, companyId: role.companyId ?? "", permissions: canonicalPermissions(role.permissions) };
}

/// Desde una empresa (su pestaña Roles) el rol nuevo llega con la empresa elegida. «Cada empresa» ya no se crea desde
/// acá (enmienda de las ADR 0012 y 0034): `?scope=AnyCompany` empieza sin elegir.
function valuesForNewRole(searchParams: URLSearchParams): RoleForm {
  const companyId = searchParams.get("companyId") ?? "";
  const linked = searchParams.get("scope") === "SpecificCompany" && companyId !== "";
  return { name: "", description: "", scope: linked ? "SpecificCompany" : null, companyId: linked ? companyId : "", permissions: [] };
}

export function RoleEditorPage({ mode }: { mode: "create" | "edit" }) {
  const { t } = useTranslation(["roles", "common"]);
  const { roleId } = useParams();
  const { can } = usePermissions();
  useQuery({ ...permissionGroupsQuery, enabled: mode === "edit" || can("roles.manage") });
  const role = useQuery({
    queryKey: roleQueryKey(roleId ?? ""),
    queryFn: () => fetchRole(roleId!),
    enabled: mode === "edit" && Boolean(roleId),
    meta: { silent: true, blocksView: true },
  });
  useBreadcrumbLeaf(mode === "create" ? t("roles:createTitle") : role.data ? displayRoleName(role.data, t) : undefined);

  if (mode === "create") return <RoleEditor />;
  if (role.isPending) return <Page icon={Shield} title={t("roles:editorTitle")}><p role="status" className="p-4 text-[13px] text-[var(--t2)]">{t("common:states.loading")}</p></Page>;
  // «Criterio · Avisos» (Pantalla de error): el rol no cargó y no hay nada que mostrar; si no existe (404),
  // «No encontramos esta página» (errores.md).
  if (!role.data) return isNotFoundError(role.error)
    ? <NotFoundPage homePath={homeOf("business")} screen={t("roles:editorTitle")} back={{ to: "/org/roles", label: t("roles:backToList") }} />
    : <LoadErrorPage onRetry={() => { void role.refetch(); }} screen={t("roles:editorTitle")} back={{ to: "/org/roles", label: t("roles:backToList") }} />;
  return <RoleEditor key={role.data.id} role={role.data} reload={async () => (await role.refetch()).data} />;
}

/// El editor de un rol (tableros Rol y M-Rol): datos sueltos (nombre, «Vale en», descripción) y «Permisos» en grupos
/// que se abren. Al editar, «Descartar cambios» vuelve a lo guardado sin salir; al crear, «Cancelar» vuelve a la lista
/// (lienzo v87). El 409, «Cambios sin guardar», la franja y «¿Salir sin guardar?» los pone `useEditPage`.
function RoleEditor({ role, reload }: { role?: RoleResponse; reload?: () => Promise<RoleResponse | undefined> }) {
  const { t } = useTranslation(["roles", "common"]);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const editable = can("roles.manage") && role?.isSystemRole !== true;
  const schema = useMemo(() => roleFormSchema(t), [t]);
  const form = useForm<RoleForm, unknown, RoleFormValues>({ resolver: zodResolver(schema), defaultValues: role ? valuesFromRole(role) : valuesForNewRole(searchParams) });
  const { errors } = form.formState;
  const scopeField = useController({ control: form.control, name: "scope" });
  const permissionsField = useController({ control: form.control, name: "permissions" });
  const companyId = useWatch({ control: form.control, name: "companyId" });
  const scope = scopeField.field.value;
  const permissions = permissionsField.field.value;
  const [failure, setFailure] = useState<unknown>();
  const isDirty = editable && form.formState.isDirty;
  const edit = useEditPage({
    isDirty,
    error: failure,
    onSeeNew: () => { void reload?.().then((fresh) => { if (fresh) form.reset(valuesFromRole(fresh)); setFailure(undefined); }); },
    onContinueEditing: () => setFailure(undefined),
  });

  const permissionGroups = useQuery({ ...permissionGroupsQuery, enabled: Boolean(role) || editable });
  const companies = useQuery({
    queryKey: roleCompanyOptionsQueryKey,
    queryFn: fetchCompanyOptions,
    enabled: can("companies.read") && (!role || role.scope === "SpecificCompany"),
    meta: { silent: true },
  });
  const companyOptions = companies.data?.items ?? [];
  const scopeGroups = useMemo(() => groupsForScope(permissionGroups.data ?? [], scope), [permissionGroups.data, scope]);
  const count = selectionCount(scopeGroups.flatMap((group) => group.permissions), permissions);

  // El alta usa una clave por formulario que se renueva después de un 4xx: corregido el nombre, el segundo envío no
  // choca con la respuesta guardada del primero (B2).
  const create = useIdempotentMutation((request: CreateRoleRequest, key) => createRole(request, key));
  const update = useMutation({ mutationFn: ({ id, request }: { id: string; request: UpdateRoleRequest }) => updateRole(id, request) });

  function rejected(error: unknown) {
    if (error instanceof ApiError && applyApiErrorToForm(error, form.setError, serverFields)) return;
    const field = roleErrorField(error);
    if (field && error instanceof ApiError) form.setError(field, { type: "server", message: error.detail ?? "" });
    else setFailure(error);
  }

  async function saved(id: string, values: RoleFormValues) {
    setFailure(undefined);
    toast.success(t(role ? "roles:updated" : "roles:created", { name: values.name }));
    if (role) form.reset(values);
    else {
      edit.allowNextNavigation();
      void navigate(`/org/roles/${encodeURIComponent(id)}`, { replace: true });
    }
    await queryClient.invalidateQueries({ queryKey: rolesQueryKeyRoot });
  }

  const submit = form.handleSubmit((values) => {
    setFailure(undefined);
    const request: CreateRoleRequest = {
      name: values.name,
      description: values.description || null,
      scope: values.scope,
      companyId: values.scope === "SpecificCompany" ? values.companyId : null,
      permissions: values.permissions,
    };
    if (role) update.mutate({ id: role.id, request: { ...request, version: role.version } }, { onSuccess: () => { void saved(role.id, values); }, onError: rejected });
    else create.mutate(request, { onSuccess: (id) => { void saved(id, values); }, onError: rejected });
  });

  // Entre empresas los permisos son los mismos; al pasar a o desde la organización se eligen de nuevo.
  function changeScope(next: { scope: RoleScope; companyId: string }) {
    if (next.scope !== scope) permissionsField.field.onChange([]);
    form.setValue("companyId", next.companyId, { shouldDirty: true });
    scopeField.field.onChange(next.scope);
  }

  function discard() {
    form.reset();
    setFailure(undefined);
  }

  const companyName = (id: string | null | undefined) => id ? companyOptions.find((company) => company.id === id)?.name : undefined;
  // «Vale en toda la organización» (lienzo v96): en la oración, el alcance va en minúscula.
  const scopeInSentence = (current: RoleResponse) => current.scope === "SpecificCompany"
    ? companyName(current.companyId) ?? t("roles:scopeInSentence.specificCompany")
    : t(current.scope === "Organization" ? "roles:scopeInSentence.organization" : "roles:scopeInSentence.company");
  const summary = role ? t("roles:scopeAndUsers", { scope: scopeInSentence(role), count: role.userCount }) : undefined;
  const title = role ? displayRoleName(role, t) : t("roles:createTitle");
  const saving = create.isPending || update.isPending;

  return <>
    <Page banner={edit.banner}
      icon={Shield}
      title={title}
      backTo={{ to: "/org/roles", label: t("roles:backToList") }}
      summary={summary}
      // Tablero Rol: «De sistema» o «Cambios sin guardar» antes de dónde vale; en el teléfono, con cambios, la barra lo dice.
      status={role?.isSystemRole ? t("roles:system") : edit.unsaved ?? undefined}
      phoneSubtitle={edit.unsaved ?? summary}
      actions={editable ? <>
        {role
          ? <Button type="button" variant="outline" onClick={discard}>{t("roles:discard")}</Button>
          : <Button type="button" variant="outline" onClick={() => { void navigate("/org/roles"); }}>{t("roles:cancel")}</Button>}
        {/* «Criterio · Botones»: «Crear rol» no se apaga; solo «Guardar cambios» sin cambios. */}
        <Button type="submit" form="role-editor" disabled={Boolean(role) && !isDirty} pending={saving}>{role ? t("roles:save") : t("roles:create")}</Button>
      </> : undefined}
    >
      <form id="role-editor" noValidate aria-label={title} onSubmit={(event) => { void submit(event); }} className="flex flex-col gap-3.5">
        {edit.formError}
        {permissionGroups.isError ? <FormError message={apiErrorMessage(permissionGroups.error, t)} /> : null}
        {/* Tablero Rol: nombre y «Vale en» en dos columnas a todo el ancho; la descripción ocupa las dos. En el teléfono
            (M-Rol), los datos van sueltos sobre blanco, sin título a la vista. */}
        <Section title={t("roles:dataTitle")} phone="untitled">
          <SectionFields className="grid gap-3.5 lg:grid-cols-2 lg:gap-x-5">
            <div className="min-w-0">
              {editable
                ? <FormField label={t("roles:fields.name")} required error={errors.name?.message}>
                  <Input {...form.register("name")} maxLength={nameMaxLength} autoComplete="off" />
                </FormField>
                : <ReadOnlyField label={t("roles:fields.name")}>{title}</ReadOnlyField>}
            </div>
            <div className="min-w-0">
              <RoleScopeField scope={scope} companyId={companyId} companies={companyOptions} onChange={changeScope} readOnly={Boolean(role)} error={errors.scope?.message} />
            </div>
            <div data-slot="role-description" className="min-w-0 lg:col-span-2">
              {editable
                ? <FormField label={t("roles:fields.description")} error={errors.description?.message}>
                  <Textarea {...form.register("description")} maxLength={descriptionMaxLength} />
                </FormField>
                : <ReadOnlyField long label={t("roles:fields.description")}>{(role ? displayRoleDescription(role, t) : null) ?? t("roles:noDescription")}</ReadOnlyField>}
            </div>
          </SectionFields>
        </Section>

        <Section title={t("roles:permissionsTitle")} phone="inset" meta={scope ? t("roles:permissionCount", count) : undefined}>
          {errors.permissions?.message ? <FormError className="mx-4 mt-3 max-md:mx-3.5" message={errors.permissions.message} /> : null}
          {!scope ? <p className="p-4 text-[13px] text-[var(--t3)] max-md:px-4 max-md:py-3.5 max-md:text-[14.5px] max-md:text-[var(--t2)]">{t("roles:scope.chooseForPermissions")}</p>
            : permissionGroups.isPending ? <p role="status" className="p-4 text-[13px] text-[var(--t2)]">{t("common:states.loading")}</p>
              : <PermissionPicker key={scope} groups={scopeGroups} value={permissions} onChange={permissionsField.field.onChange} readOnly={!editable} />}
        </Section>
      </form>
    </Page>
    {edit.leaveDialog}
  </>;
}
