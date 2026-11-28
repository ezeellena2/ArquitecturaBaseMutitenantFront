import { useMountedRef } from "@/shared/hooks/useMountedRef";
import { useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toastSuccess } from "@/shared/ui/sonner";
import { usePermissions } from "@/auth/usePermissions";
import { useCurrentUser } from "@/auth/useCurrentUser";
import { ApiError } from "@/shared/api/ApiError";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import type { PlatformFeatureResponse, PlatformTenantDetailResponse } from "@/shared/api/types";
import { useFormat } from "@/shared/format/useFormat";
import { usePagination } from "@/shared/hooks/usePagination";
import { ReasonDialog } from "@/shared/platform/ReasonDialog";
import { ModuleOrganizationUi } from "@/shared/modules/ModuleRegistry";
import type { ModuleOrganizationUi as OrganizationUi } from "@/shared/modules/types";
import { useModuleRegistry } from "@/shared/modules/useModules";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { EmptyValue } from "@/shared/ui/format/EmptyValue";
import { EnumText } from "@/shared/ui/format/EnumText";
import { BanIcon, CalendarIcon, PowerIcon } from "@/shared/ui/icons";
import { RowActions } from "@/shared/ui/RowActions";
import { StatusDot } from "@/shared/ui/StatusDot";
import { Surface } from "@/shared/ui/Surface";
import { sortRows } from "@/shared/ui/tableSort";
import { ListCard } from "@/shared/ui/app/ListRow";
import { tenantFeaturesQueryKey, tenantQueryKey, tenantsQueryRoot, updateTenantFeature } from "../api/tenants";
import { tenantReasonFormError } from "../errors";

export type OwnFeatureWrite = Pick<PlatformFeatureResponse, "version" | "enabled" | "source" | "expiresOn">;
type ModuleAction = "enable" | "extend" | "disable";
interface Confirmation { feature: PlatformFeatureResponse; action: ModuleAction; trigger: HTMLElement | null }

/// El circuito del estado de un módulo (264), en el orden de su enum.
const moduleStates = ["On", "Trial", "Off"] as const;

export function OrganizationModulesTab({ organization, query, writes, onWrite, onConflict, moduleWrites, onModuleWrite, onModuleConflict }: {
  organization: PlatformTenantDetailResponse; query: UseQueryResult<PlatformFeatureResponse[]>; writes: ReadonlyMap<string, OwnFeatureWrite>;
  onWrite: (key: string, write: OwnFeatureWrite) => void; onConflict: (key: string) => void;
  moduleWrites: ReadonlyMap<string, unknown>; onModuleWrite: (key: string, write: unknown) => void; onModuleConflict: (key: string) => void;
}) {
  const { t } = useTranslation(["platformTenants", "common"]);
  const { canPlatform } = usePermissions(); const client = useQueryClient(); const format = useFormat();
  // Los módulos llegan enteros: ordenan en el navegador, con el orden en la dirección (264).
  const { sort, setSort } = usePagination({ prefix: "modulos." });
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [dialogOwner, setDialogOwner] = useState<string | null>(null);
  const [contributions, setContributions] = useState<ReadonlyMap<string, OrganizationUi>>(() => new Map());
  const registry = useModuleRegistry();
  const { data: me } = useCurrentUser();
  const moduleWriteKey = useCallback((key: string) => JSON.stringify([me?.access, me?.id, me?.activeTenantId ?? null, key]), [me?.access, me?.id, me?.activeTenantId]);
  const editable = canPlatform("platform.tenants.manage") && organization.status !== "Closed";
  const rows = useMemo(() => (query.data ?? []).map((feature) => ({ ...feature, ...writes.get(feature.key) })), [query.data, writes]);
  const onContribution = useCallback((key: string, ui: OrganizationUi | null) => {
    setContributions((current) => {
      if (ui ? current.get(key) === ui : !current.has(key)) return current;
      const next = new Map(current); if (ui) next.set(key, ui); else next.delete(key); return next;
    });
  }, []);
  // Publicar UI no vuelve a renderizar sus owners. Cada fila conserva su propio lifetime.
  const moduleUi = useMemo(() => rows.map((feature) => <ModuleOrganizationUi key={feature.key} moduleId={feature.key} organization={organization} feature={feature}
    isCurrent={() => {
      const currentOrganization = client.getQueryData<PlatformTenantDetailResponse>(tenantQueryKey(organization.id));
      const currentFeature = client.getQueryData<PlatformFeatureResponse[]>(tenantFeaturesQueryKey(organization.id))?.find((row) => row.key === feature.key);
      return currentOrganization?.id === organization.id && currentOrganization.status !== "Closed" && organization.status !== "Closed"
        && !!currentFeature && (writes.get(feature.key)?.enabled ?? currentFeature.enabled);
    }}
    ownWrite={moduleWrites.get(moduleWriteKey(feature.key))} onWrite={(write) => { onModuleWrite(moduleWriteKey(feature.key), write); void client.invalidateQueries({ queryKey: tenantsQueryRoot }); }} onConflict={() => onModuleConflict(moduleWriteKey(feature.key))}
    dialogOpen={dialogOwner === feature.key} onOpenDialog={() => { setConfirmation(null); setDialogOwner(feature.key); }} onCloseDialog={() => setDialogOwner((owner) => owner === feature.key ? null : owner)}>
    {(ui) => <ModuleUiContribution moduleId={feature.key} ui={ui} onChange={onContribution} />}
  </ModuleOrganizationUi>), [rows, organization, client, writes, moduleWrites, moduleWriteKey, onModuleWrite, onModuleConflict, dialogOwner, onContribution]);
  const state = (feature: PlatformFeatureResponse) => !feature.enabled ? "Off" : feature.source === "Trial" ? "Trial" : "On";
  const moduleName = (key: string) => {
    const registered = registry.find((module) => module.id === key);
    const nameKey = registered?.organizationUi?.nameKey ?? registered?.nameKey;
    return nameKey ? t(nameKey, { defaultValue: key }) : t(`platformTenants:modules.${key}`, { defaultValue: key });
  };
  const status = (row: PlatformFeatureResponse) => <StatusDot tone={state(row) === "Trial" ? "pending" : state(row) === "On" ? "success" : "neutral"} label={state(row) === "Trial" ? t("platformTenants:modules.trialUntil", { date: row.expiresOn ? format.formatDate(row.expiresOn) : format.formatEmpty() }) : <EnumText enum="PlatformModuleState" value={state(row)} />} />;
  function openGeneric(value: Confirmation) { setDialogOwner(null); setConfirmation(value); }
  const rowActions = (feature: PlatformFeatureResponse) => <RowActions label={t("platformTenants:rowActions", { name: moduleName(feature.key) })} title={moduleName(feature.key)} actions={[
    { label: t("platformTenants:modules.actions.enable"), accessibleName: t("platformTenants:modules.actions.enable"), icon: PowerIcon, hidden: !editable || state(feature) === "On", onSelect: (trigger) => openGeneric({ feature, action: "enable", trigger }) },
    { label: t("platformTenants:modules.actions.extend"), accessibleName: t("platformTenants:modules.actions.extend"), icon: CalendarIcon, hidden: !editable || state(feature) !== "Trial", onSelect: (trigger) => openGeneric({ feature, action: "extend", trigger }) },
    ...(contributions.get(feature.key)?.actions ?? []),
    { label: t("platformTenants:modules.actions.disable"), accessibleName: t("platformTenants:modules.actions.disable"), icon: BanIcon, destructive: true, hidden: !editable || state(feature) === "Off", onSelect: (trigger) => openGeneric({ feature, action: "disable", trigger }) },
  ]} />;
  const columns: Column<PlatformFeatureResponse>[] = [
    // Tablero Organizacion (Módulos, base de la 12): lo que aporta cada módulo va en su columna, «Detalle».
    { id: "key", sortable: true, header: t("platformTenants:modules.module"), type: "text", mobile: "primary", value: (row) => moduleName(row.key) },
    { id: "detail", header: t("platformTenants:modules.detail"), type: "custom", cell: (row) => contributions.get(row.key)?.description ?? <EmptyValue /> },
    { id: "state", sortable: true, sortAs: "status", sortValue: (row) => moduleStates.indexOf(state(row)), header: t("platformTenants:columns.status"), type: "custom", mobile: "status", cell: status },
    { id: "source", sortable: true, header: t("platformTenants:modules.source"), type: "enum", enum: "TenantFeatureSource", value: (row) => row.source },
    { id: "actions", header: t("platformTenants:columns.actions"), type: "actions", cell: rowActions },
  ];
  return <>
    <Surface phoneFlush><DataTable columns={columns} rows={sortRows(rows, columns, sort)} rowKey={(row) => row.key} isLoading={query.isPending} isFetching={query.isFetching}
      sort={sort} onSortChange={setSort}
      // 263: en el teléfono cada módulo es una tarjeta con el estado, el origen y, si el módulo lo aporta, su detalle, cada dato
      // con el nombre de su columna.
      mobileRow={(row) => <ListCard key={row.key} title={moduleName(row.key)} fields={[
        { label: t("platformTenants:columns.status"), value: status(row) },
        { label: t("platformTenants:modules.source"), value: <EnumText enum="TenantFeatureSource" value={row.source} /> },
        ...(contributions.get(row.key)?.description ? [{ label: t("platformTenants:modules.detail"), value: contributions.get(row.key)?.description, wide: true }] : []),
      ]} trailing={rowActions(row)} />}
      error={query.error ? apiErrorMessage(query.error, t) : undefined} onRetry={() => { void query.refetch(); }} /></Surface>
    {moduleUi}
    {confirmation ? <ModuleReasonDialog organization={organization} moduleLabel={moduleName(confirmation.feature.key)} confirmation={confirmation} onClose={(conflicted) => {
      if (conflicted) onConflict(confirmation.feature.key); setConfirmation((current) => current === confirmation ? null : current);
    }} onSuccess={(write) => {
      onWrite(confirmation.feature.key, write);
      client.setQueryData<PlatformFeatureResponse[]>(tenantFeaturesQueryKey(organization.id), (data) => data?.map((row) => row.key === confirmation.feature.key ? { ...row, ...write } : row));
      toastSuccess(t(`platformTenants:modules.messages.${confirmation.action}`, { module: moduleName(confirmation.feature.key) })); void client.invalidateQueries({ queryKey: tenantsQueryRoot });
    }} /> : null}
  </>;
}

function ModuleUiContribution({ moduleId, ui, onChange }: { moduleId: string; ui: OrganizationUi; onChange: (key: string, ui: OrganizationUi | null) => void }) {
  useLayoutEffect(() => { onChange(moduleId, ui); return () => onChange(moduleId, null); }, [moduleId, ui, onChange]);
  return ui.dialog ?? null;
}

function ModuleReasonDialog({ organization, moduleLabel, confirmation, onClose, onSuccess }: {
  organization: PlatformTenantDetailResponse; moduleLabel: string; confirmation: Confirmation; onClose: (conflicted: boolean) => void; onSuccess: (write: OwnFeatureWrite) => void;
}) {
  const { t } = useTranslation("platformTenants"); const conflict = useRef(false);
  const active = useMountedRef();
  const { feature, action } = confirmation;
  return <ReasonDialog title={t(`modules.confirm.${action}.title`, { module: moduleLabel })} description={t(`modules.confirm.${action}.description`, { name: organization.name })}
    confirmLabel={t(`modules.actions.${action}`)} pendingLabel={t(`modules.confirm.${action}.pending`)} destructive={action === "disable"}
    date={action === "extend" ? { initialValue: feature.expiresOn } : undefined} returnFocusTo={confirmation.trigger} queryRoot={tenantsQueryRoot} onClose={() => onClose(conflict.current)}
    mutationFn={async (values) => {
      if (!active.current) throw new DOMException("", "AbortError");
      const change: OwnFeatureWrite = { version: feature.version, enabled: action !== "disable", source: action === "extend" ? "Trial" : "Manual", expiresOn: action === "extend" ? values.expiresOn : null };
      try { const response = await updateTenantFeature(organization.id, feature.key, { ...change, reason: values.reason }); if (!active.current) throw new DOMException("", "AbortError"); conflict.current = false; return { ...change, version: response.version }; }
      catch (error) { if (!active.current) throw new DOMException("", "AbortError"); if (error instanceof ApiError && error.code === "General.ConcurrencyConflict") conflict.current = true; throw tenantReasonFormError(error); }
    }} onSuccess={onSuccess} />;
}
