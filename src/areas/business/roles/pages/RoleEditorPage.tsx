import { companyOptions as companyOptionResource, companyQuery } from "@/shared/api/resourceOptions";
import { useResourceOptions } from "@/shared/hooks/useResourceOptions";
import { validationConstraints } from "@/shared/api/generated/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { useEffect, useMemo, useRef, useState } from "react";
import { useController, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useFormat } from "@/shared/format/useFormat";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import { usePermissions } from "@/auth/usePermissions";
import { ApiError } from "@/shared/api/ApiError";
import { apiErrorMessage, isNotFoundError, isRateLimitError } from "@/shared/api/errorMessage";
import { useRetryAfterCountdown } from "@/shared/api/useRetryAfterCountdown";
import { applyApiErrorToForm } from "@/shared/api/formErrors";
import type { CreateRoleRequest, PermissionGroupResponse, RoleResponse, RoleScope, UpdateRoleRequest } from "@/shared/api/types";
import {
  AssistantProposalChangesSection, AssistantProposalMark, AssistantProposalReviewMark, assistantProposalAlreadySaved, useAssistantProposal,
  useAssistantProposalFieldReview, useDropAssistantProposal, useLoadAssistantProposalOnce, type AssistantProposalChangeItem, type AssistantProposalOption,
  type AssistantProposalValues,
} from "@/shared/assistant-actions";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { useResourceAction } from "@/shared/hooks/useResourceAction";
import { sameList } from "@/shared/lib/sameList";
import { useBreadcrumbLeaf } from "@/shared/hooks/useBreadcrumbLeaf";
import { useEditForm } from "@/shared/hooks/useEditForm";
import { useEditPage } from "@/shared/hooks/useEditPage";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { Banner } from "@/shared/ui/Banner";
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
  fetchPermissionGroups,
  fetchRole,
  permissionGroupsQueryKey,
  roleQueryKey,
  rolesQueryKeyRoot,
  updateRole,
} from "../api/roles";
import { createdRolePath } from "../assistantActions";
import { RoleScopeField } from "../components/RoleScopeField";
import { roleErrorField } from "../errors";
import { canonicalPermissions, groupsForScope } from "../lib/permissionPicker";
import { PermissionPicker } from "@/shared/ui/PermissionPicker";
import { allowedPermissions } from "@/shared/ui/permissionAreas";
import { countOf } from "@/shared/format/countOf";

const nameMaxLength = validationConstraints.CreateRoleHttpRequest.name.maxLength;
const descriptionMaxLength = validationConstraints.CreateRoleHttpRequest.description.maxLength;

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

/// Lo que el rol permite (260): lo guardado más lo que incluye, así el editor siembra, compara y guarda eso, y un rol viejo
/// sin lo incluido abre con todo, sin cambios sin guardar. Sin el catálogo (no cargó), lo guardado tal cual.
function rolePermissions(role: RoleResponse, groups: readonly PermissionGroupResponse[] | undefined): string[] {
  return groups ? allowedPermissions(groups, role.permissions) : canonicalPermissions(role.permissions);
}

function valuesFromRole(role: RoleResponse, groups: readonly PermissionGroupResponse[] | undefined): RoleForm {
  return { name: role.name, description: role.description ?? "", scope: role.scope, companyId: role.companyId ?? "", permissions: rolePermissions(role, groups) };
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
  const permissionGroups = useQuery({ ...permissionGroupsQuery, enabled: mode === "edit" || can("roles.manage") });
  const role = useQuery({
    queryKey: roleQueryKey(roleId ?? ""),
    queryFn: () => fetchRole(roleId!),
    enabled: mode === "edit" && Boolean(roleId),
    meta: { silent: true, blocksView: true },
  });
  useBreadcrumbLeaf(mode === "create" ? t("roles:createTitle") : role.data ? role.data.name : undefined);

  if (mode === "create") return <RoleEditor />;
  // El editor siembra con lo que el rol permite, con lo incluido del catálogo: espera a los dos.
  if (role.isPending || permissionGroups.isPending) return <Page title={t("roles:editorTitle")}><p role="status" className="p-4 text-[0.8125rem] text-[var(--t2)]">{t("common:states.loading")}</p></Page>;
  // «Criterio · Avisos» (Pantalla de error): el rol no cargó y no hay nada que mostrar; si no existe (404),
  // «No encontramos esta página» (errores.md).
  if (!role.data) return isNotFoundError(role.error)
    ? <NotFoundPage homePath={homeOf("business")} screen={t("roles:editorTitle")} back={{ to: "/org/roles", label: t("roles:backToList") }} />
    : <LoadErrorPage onRetry={() => { void role.refetch(); }} screen={t("roles:editorTitle")} back={{ to: "/org/roles", label: t("roles:backToList") }} />;
  return <RoleEditor key={role.data.id} role={role.data} groups={permissionGroups.data} reload={async () => (await role.refetch()).data} />;
}

/**
 * Lo que propone el asistente para un rol (roles.create@1 y roles.edit@1), con la forma del editor: al crear, lo propuesto;
 * al cambiar, aplicado sobre lo guardado (el nombre, la descripción y lo que el rol permite ahora). Cada permiso lleva el
 * nombre de la propuesta, por si el catálogo no lo nombra.
 */
interface RoleProposal {
  readonly name: string;
  readonly description: string;
  readonly scope: RoleScope | null;
  readonly company?: { readonly id: string; readonly label: string };
  readonly permissions: readonly AssistantProposalOption[];
}

/** Un texto propuesto: sin él, vacío; algo que no es texto no entra. */
function proposedText(field: AssistantProposalValues["fields"][string] | undefined): string | undefined {
  if (field === undefined || field.value === null) return "";
  return typeof field.value === "string" ? field.value : undefined;
}

/**
 * Lo que el editor no puede mostrar no abre la propuesta: «Cada empresa» (ya no se crea desde acá), una empresa sin «Una
 * empresa específica» o al revés. Que cada permiso esté en el catálogo de su alcance lo mira el editor, que lo tiene.
 */
function toRoleProposal(values: AssistantProposalValues): RoleProposal | undefined {
  const name = proposedText(values.fields.name);
  const description = proposedText(values.fields.description);
  const proposedScope = values.fields.scope?.value;
  const scope: RoleScope | null = proposedScope === "Organization" || proposedScope === "SpecificCompany" ? proposedScope : null;
  const company = values.fields.company;
  const companyId = typeof company?.value === "string" ? company.value : "";
  if (name === undefined || description === undefined || (proposedScope !== undefined && scope === null)) return undefined;
  if ((scope === "SpecificCompany") !== (companyId !== "")) return undefined;
  return { name, description, scope, company: companyId ? { id: companyId, label: company?.label ?? "" } : undefined, permissions: values.lists.permissions ?? [] };
}

/** Repetir el alta con lo mismo conserva la clave; cambiar cualquier dato es otra operación (R05). */
function sameRoleRequest(previous: CreateRoleRequest, next: CreateRoleRequest) {
  return previous.name === next.name && previous.description === next.description && previous.scope === next.scope
    && previous.companyId === next.companyId && sameList(previous.permissions, next.permissions);
}

/// El editor de un rol (tableros Rol y M-Rol): datos sueltos (nombre, «Vale en», descripción) y «Permisos» en grupos
/// que se abren. Al editar, «Descartar cambios» vuelve a lo guardado sin salir; al crear, «Cancelar» vuelve a la lista
/// (lienzo v87). La versión que manda el guardado la lleva `useEditForm`; el 409, la franja y «¿Salir sin guardar?» los
/// pone `useEditPage`.
function RoleEditor({ role, groups, reload }: { role?: RoleResponse; groups?: readonly PermissionGroupResponse[]; reload?: () => Promise<RoleResponse | undefined> }) {
  const { t } = useTranslation(["roles", "common"]);
  const format = useFormat();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const { phone } = useAppChrome();
  const editable = can("roles.manage") && role?.isSystemRole !== true;
  const schema = useMemo(() => roleFormSchema(t), [t]);
  const { form, version, resetTo, wrote } = useEditForm<RoleResponse | undefined, RoleForm, RoleFormValues>({
    read: role, toValues: (read) => read ? valuesFromRole(read, groups) : valuesForNewRole(searchParams), resolver: zodResolver(schema),
  });
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
    onSeeNew: () => { void reload?.().then((fresh) => { if (fresh) resetTo(fresh); setFailure(undefined); }); },
    onContinueEditing: () => setFailure(undefined),
  });

  const permissionGroups = useQuery({ ...permissionGroupsQuery, enabled: Boolean(role) || editable });
  const scopeGroups = useMemo(() => groupsForScope(permissionGroups.data ?? [], scope), [permissionGroups.data, scope]);
  // Lo guardado del rol: un área con algo guardado arranca abierta, aunque después se le quite todo.
  const savedPermissions = useMemo(() => role ? rolePermissions(role, groups) : [], [role, groups]);

  // Rol-Propuesta y su M- (ADR 0068 §9): con `?proposal=<id>`, lo que propone el asistente, cargado y sin guardar. Al
  // cambiar, sobre lo guardado; los permisos, con lo que incluyen (260), que el selector muestra marcado y apagado.
  const catalog = permissionGroups.data;
  const permissionLabel = (code: string) => catalog?.flatMap((group) => group.permissions).find((permission) => permission.code === code)?.name;
  const proposalBase = useMemo<AssistantProposalValues | undefined>(() => role && {
    fields: { name: { value: role.name }, description: { value: role.description ?? "" } },
    lists: { permissions: savedPermissions.map((code) => ({ id: code, label: code })) },
    rows: {},
  }, [role, savedPermissions]);
  const createProposal = useAssistantProposal("roles.create@1", toRoleProposal);
  const editProposal = useAssistantProposal("roles.edit@1", toRoleProposal, proposalBase);
  const review = useAssistantProposalFieldReview();
  // Cada permiso propuesto tiene que estar en el catálogo de su alcance: si no, el editor no lo puede mostrar.
  const fitsCatalog = (proposedScope: RoleScope | null, codes: readonly string[]) => {
    if (!catalog) return false;
    const offered = new Set(groupsForScope(catalog, proposedScope).flatMap((group) => group.permissions.map((permission) => permission.code)));
    return codes.every((code) => offered.has(code));
  };
  const proposing = !editable ? undefined
    : !role ? createProposal.status === "ready" && fitsCatalog(createProposal.formValues.scope, createProposal.formValues.permissions.map((permission) => permission.id))
      ? createProposal : undefined
      // Al cambiar, la propuesta es de este rol, y lo que suma está en el catálogo de dónde vale.
      : editProposal.status === "ready" && editProposal.proposal.target?.id === role.id
        && fitsCatalog(role.scope, editProposal.formValues.permissions.map((permission) => permission.id).filter((code) => !savedPermissions.includes(code)))
        ? editProposal : undefined;
  // Lo propuesto entra una vez en lo que se edita, sin guardar; desde ahí, la persona lo cambia como siempre.
  const proposalLoaded = useLoadAssistantProposalOnce(catalog ? proposing : undefined, ({ formValues: proposed }) => {
    if (!catalog) return;
    const dirty = { shouldDirty: true } as const;
    form.setValue("name", proposed.name, dirty);
    form.setValue("description", proposed.description, dirty);
    if (!role) {
      form.setValue("scope", proposed.scope, dirty);
      form.setValue("companyId", proposed.company?.id ?? "", dirty);
    }
    form.setValue("permissions", allowedPermissions(catalog, proposed.permissions.map((permission) => permission.id)), dirty);
  });
  // Sin `?proposal` el editor vuelve a ser el de siempre: descartar no la vuelve a cargar.
  const dropProposal = useDropAssistantProposal();

  const companies = useResourceOptions(companyOptionResource, can("companies.read") && (!role || role.scope === "SpecificCompany"));
  // La empresa propuesta, con el nombre de la propuesta: no se busca por id.
  const proposedCompany = !role ? proposing?.formValues.company : undefined;
  const selectedCompany = useQuery({ ...companyQuery(companyId), enabled: can("companies.read") && Boolean(companyId) && !role?.companyName && Boolean(companies.data)
    && !companies.knownItems.some((item) => item.id === companyId) && proposedCompany?.id !== companyId });
  const knownCompanies = [...companies.knownItems, ...(selectedCompany.data ? [selectedCompany.data] : []),
    ...(proposedCompany ? [{ id: proposedCompany.id, name: proposedCompany.label }] : []),
    ...(role?.companyId && role.companyName ? [{ id: role.companyId, name: role.companyName }] : [])];
  const companyOptions = companies.data?.items ?? [];

  // P2 (E9): al llegar a un límite, el aviso va arriba del formulario, lo escrito queda y «Guardar» cuenta hasta poder
  // tocarse de nuevo, a mano.
  const limit = useRetryAfterCountdown();
  function rejected(error: unknown) {
    if (isRateLimitError(error)) { limit.startFromError(error); setFailure(error); return; }
    if (error instanceof ApiError && applyApiErrorToForm(error, form.setError, serverFields)) return;
    const field = roleErrorField(error);
    if (field && error instanceof ApiError) form.setError(field, { type: "server", message: error.detail ?? "" });
    else setFailure(error);
  }

  // El alta usa una clave por formulario que se renueva después de un 4xx (B2). Si la respuesta se pierde, corregir el rol
  // es otra operación con otra clave y repetir lo mismo conserva la suya (R05). El aviso y la navegación salen del
  // intento original, también desde «Reintentar».
  const createAction = useResourceAction<CreateRoleRequest>({ onError: rejected });
  const create = useIdempotentMutation(createAction.guarded((request, key: string) => createRole(request, key),
    (id, request) => { void created(id, request); }), { meta: { ...createAction.meta, handlesRateLimit: true }, sameOperation: sameRoleRequest });
  const update = useMutation({ meta: { handlesRateLimit: true }, mutationFn: ({ id, request }: { id: string; request: UpdateRoleRequest }) => updateRole(id, request) });
  // Con la propuesta, la clave la da la propuesta (`attempts`) y, después del 2xx, la tarjeta pasa a aplicada. Si otra
  // pestaña ya la guardó, «Ya se guardó» y lleva al rol creado.
  const createSend = !role && proposing ? proposing.send : undefined;
  const createProposed = useMutation({
    meta: { handlesRateLimit: true },
    mutationFn: ({ request, save }: { request: CreateRoleRequest; save: NonNullable<typeof createSend> }) => save((key) => createRole(request, key)),
    onSuccess: (id, { request }) => { void created(id, request); },
    onError: (error) => {
      const saved = assistantProposalAlreadySaved(error);
      if (saved) leaveToSaved(saved.location);
      else rejected(error);
    },
  });

  async function created(id: string, request: CreateRoleRequest) {
    setFailure(undefined);
    toast.success(t("roles:created", { name: request.name }));
    edit.allowNextNavigation();
    void navigate(`/org/roles/${encodeURIComponent(id)}`, { replace: true });
    await queryClient.invalidateQueries({ queryKey: rolesQueryKeyRoot });
  }

  // «Ya se guardó» (otra pestaña guardó la propuesta): lleva a lo creado, una vez.
  const leftToSaved = useRef(false);
  function leaveToSaved(location: string | null | undefined) {
    if (leftToSaved.current) return;
    leftToSaved.current = true;
    toast.success(t("common:assistantProposal.alreadySaved"));
    edit.allowNextNavigation();
    void navigate(createdRolePath(location), { replace: true });
  }
  // La propuesta cargada pasó a aplicada sin que este editor la guardara: la guardó otra pestaña.
  useEffect(() => {
    if (role || createProposal.status !== "applied" || !proposalLoaded(createProposal.proposalId)) return;
    if (createProposed.isPending || createProposed.isSuccess) return;
    leaveToSaved(createProposal.proposal.appliedLocation);
  });

  // Al editar, la ficha queda limpia con lo guardado y la base es la versión que respondió el guardado (`useEditForm`).
  async function saved(id: string, values: RoleFormValues, write: { sent: number; saved: number }) {
    setFailure(undefined);
    toast.success(t("roles:updated", { name: values.name }));
    form.reset(values);
    await queryClient.invalidateQueries({ queryKey: rolesQueryKeyRoot });
    wrote(write.sent, write.saved, queryClient.getQueryData<RoleResponse>(roleQueryKey(id)));
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
    // Con un rol, el editor arrancó con su lectura: `version` es la de esa lectura.
    if (role) {
      const sent = version!;
      // Con la propuesta, la tarjeta pasa a aplicada con la versión que respondió el guardado.
      const applied = proposing;
      update.mutate({ id: role.id, request: { ...request, version: sent } }, {
        onSuccess: (result) => {
          if (applied) void applied.markApplied(result.version);
          void saved(role.id, values, { sent, saved: result.version });
        },
        onError: rejected,
      });
    }
    else if (createSend) createProposed.mutate({ request, save: createSend });
    else create.mutate(request);
  });

  // Entre empresas los permisos son los mismos; al pasar a o desde la organización se eligen de nuevo.
  function changeScope(next: { scope: RoleScope; companyId: string }) {
    if (next.scope !== scope) permissionsField.field.onChange([]);
    form.setValue("companyId", next.companyId, { shouldDirty: true });
    scopeField.field.onChange(next.scope);
  }

  // «Descartar cambios» vuelve a la última lectura de lo guardado, con su versión; también descarta la propuesta.
  function discard() {
    if (role) resetTo(role);
    else form.reset();
    setFailure(undefined);
    if (proposing) dropProposal();
  }

  const companyName = (id: string | null | undefined) => id ? knownCompanies.find((company) => company.id === id)?.name : undefined;
  // «Vale en toda la organización» (lienzo v96): en la oración, el alcance va en minúscula.
  const scopeInSentence = (current: RoleResponse) => current.scope === "SpecificCompany"
    ? current.companyName ?? companyName(current.companyId) ?? t("roles:scopeInSentence.specificCompany")
    : t(current.scope === "Organization" ? "roles:scopeInSentence.organization" : "roles:scopeInSentence.company");
  const summary = role ? t("roles:scopeAndUsers", { scope: scopeInSentence(role), ...countOf(format, role.userCount) }) : undefined;
  const title = role ? role.name : t("roles:createTitle");
  const saving = create.isPending || update.isPending || createProposed.isPending;
  // «Revisá» en lo que sigue como lo propuso el asistente con duda: dónde vale y la empresa, y cada permiso.
  const scopeReview = proposing && !role && scope === proposing.formValues.scope && companyId === (proposing.formValues.company?.id ?? "")
    ? review([proposing.doubtOf("scope"), proposing.doubtOf("company")]) : undefined;
  const permissionAside = proposing
    ? (code: string) => permissions.includes(code) && proposing.doubtOf("permissions", code) ? <AssistantProposalReviewMark /> : null : undefined;
  // «Lo que cambia» (al cambiar un rol), sobre lo guardado y con lo que se va a mandar: lo propuesto y lo que la persona
  // cambie después. Sin la columna «Dónde» (Rol-Propuesta).
  const changeItem = (code: string): AssistantProposalChangeItem => ({ key: code,
    label: permissionLabel(code) ?? proposing?.formValues.permissions.find((permission) => permission.id === code)?.label ?? code,
    review: Boolean(proposing?.doubtOf("permissions", code)) });
  const changeRows = proposing && role ? [{ key: "permissions",
    added: permissions.filter((code) => !savedPermissions.includes(code)).map(changeItem),
    removed: savedPermissions.filter((code) => !permissions.includes(code)).map(changeItem) }] : [];
  const changedSinceProposal = proposing && role && proposing.proposal.baseVersion != null && proposing.proposal.baseVersion !== role.version;
  // P2: en la compu, arriba del formulario (Rol); en el teléfono, abajo, sobre los botones fijos (M-Rol).
  const limitNotice = limit.isRunning && isRateLimitError(failure) ? <Banner tone="warning" role="alert">{apiErrorMessage(failure, t)}</Banner> : null;
  // Tableros Rol-Base2 y M-Rol-Base2 (260): en la compu, la tabla «Permiso» sola, debajo de los datos; en el teléfono, con
  // «Permisos» arriba. Lo que falta elegir, la carga y el error van debajo de su encabezado.
  const permissionsLoading = Boolean(scope) && permissionGroups.isPending;
  const permissionsNotice = errors.permissions?.message || !scope || permissionsLoading ? <>
    {/* Tablero Rol (.w-cartel.o-prob, con 12 y 16 de margen): en la compu, el cartel de problema; en el teléfono, la franja. */}
    {errors.permissions?.message ? phone ? <FormError className="mx-3.5 mt-3" message={errors.permissions.message} />
      : <Banner tone="danger" className="mx-4 my-3">{errors.permissions.message}</Banner> : null}
    {!scope ? <p className="p-4 text-[0.8125rem] text-[var(--t3)] max-md:px-4 max-md:py-3.5 max-md:text-[0.90625rem] max-md:text-[var(--t2)]">{t("roles:scope.chooseForPermissions")}</p>
      : permissionsLoading ? <p role="status" className="p-4 text-[0.8125rem] text-[var(--t2)]">{t("common:states.loading")}</p> : null}
  </> : null;
  // El Dueño y todo rol de sistema que no se cambia se leen con tildes y con sus áreas cerradas; un rol que quien mira no
  // puede cambiar, con tildes y abiertas las áreas que tienen algo.
  const permissionPicker = <PermissionPicker key={scope ?? ""} label={t("roles:permissionsTitle")} framed={!phone} permissionAside={permissionAside}
    groups={permissionsLoading ? [] : scopeGroups} picked={permissions} saved={savedPermissions} onChange={permissionsField.field.onChange}
    readOnly={!editable} openWhenRead={role?.isSystemRole !== true}>{permissionsNotice}</PermissionPicker>;

  return <>
    <Page banner={edit.banner}
      title={title}
      titleAside={proposing ? <AssistantProposalMark /> : undefined}
      backTo={{ to: "/org/roles", label: t("roles:backToList") }}
      summary={summary}
      // Tablero Rol: «De sistema» antes de dónde vale; la banda nunca dice «Cambios sin guardar» (base de la 12).
      status={role?.isSystemRole ? t("roles:system") : undefined}
      // Rol-Base2 y M-Rol-Base2 («Ver el rol Dueño», 260): por qué no se cambia, en la (i) del título.
      help={role?.isSystemRole && role.scope === "Organization" ? t("roles:ownerHelp") : undefined}
      phoneSubtitle={summary}
      actionsNotice={phone ? limitNotice : undefined}
      actions={editable ? <>
        {role
          ? <Button type="button" variant="outline" onClick={discard}>{t("roles:discard")}</Button>
          : <Button type="button" variant="outline" onClick={() => { void navigate("/org/roles"); }}>{t("roles:cancel")}</Button>}
        {/* «Criterio · Botones»: «Crear rol» no se apaga; solo «Guardar cambios» sin cambios. */}
        <Button type="submit" form="role-editor" disabled={Boolean(role) && !isDirty || limit.isRunning} pending={saving}>{limit.label ?? (role ? t("roles:save") : t("roles:create"))}</Button>
      </> : undefined}
    >
      <form id="role-editor" noValidate aria-label={title} onSubmit={(event) => { void submit(event); }} className="flex flex-col gap-3.5">
        {edit.formError}
        {phone ? null : limitNotice}
        {permissionGroups.isError ? <FormError message={apiErrorMessage(permissionGroups.error, t)} /> : null}
        {/* Rol-Propuesta y su M-: si el rol cambió desde que el asistente preparó la propuesta, lo dice arriba; «Lo que
            cambia» ya va sobre lo de ahora. */}
        {changedSinceProposal ? <Banner tone="warning" className="max-md:mx-4 max-md:mt-4">{t("roles:proposal.changedSince", { name: role.name })}</Banner> : null}
        {changeRows.length ? <AssistantProposalChangesSection rows={changeRows} /> : null}
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
              <RoleScopeField scope={scope} companyId={companyId} companies={companyOptions} remote={companies.remote} knownCompanies={knownCompanies} onChange={changeScope} readOnly={Boolean(role)} error={errors.scope?.message} review={scopeReview} />
            </div>
            <div data-slot="role-description" className="min-w-0 lg:col-span-2">
              {editable
                ? <FormField label={t("roles:fields.description")} error={errors.description?.message}>
                  <Textarea {...form.register("description")} maxLength={descriptionMaxLength} />
                </FormField>
                : <ReadOnlyField long label={t("roles:fields.description")} muted={!role?.description}>{(role ? role.description : null) || t("roles:noDescription")}</ReadOnlyField>}
            </div>
          </SectionFields>
        </Section>

        {phone ? <Section title={t("roles:permissionsTitle")} phone="inset">{permissionPicker}</Section> : permissionPicker}
      </form>
    </Page>
    {edit.leaveDialog}
  </>;
}
