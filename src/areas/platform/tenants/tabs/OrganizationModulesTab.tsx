import { useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { usePermissions } from "@/auth/usePermissions";
import { ApiError } from "@/shared/api/ApiError";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import type { PlatformFeatureResponse, PlatformTenantDetailResponse } from "@/shared/api/types";
import { useFormat } from "@/shared/format/useFormat";
import { ReasonDialog } from "@/shared/platform/ReasonDialog";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { EnumText } from "@/shared/ui/format/EnumText";
import { BanIcon, CalendarIcon, PowerIcon } from "@/shared/ui/icons";
import { RowActions } from "@/shared/ui/RowActions";
import { StatusDot } from "@/shared/ui/StatusDot";
import { Surface } from "@/shared/ui/Surface";
import { ListRow } from "@/shared/ui/app/ListRow";
import { tenantFeaturesQueryKey, tenantsQueryRoot, updateTenantFeature } from "../api/tenants";
import { tenantReasonFormError } from "../errors";

export type OwnFeatureWrite = Pick<PlatformFeatureResponse, "version" | "enabled" | "source" | "expiresOn">;
type ModuleAction = "enable" | "extend" | "disable";
interface Confirmation { feature: PlatformFeatureResponse; action: ModuleAction; trigger: HTMLElement | null }

export function OrganizationModulesTab({ organization, query, writes, onWrite, onConflict }: {
  organization: PlatformTenantDetailResponse; query: UseQueryResult<PlatformFeatureResponse[]>; writes: ReadonlyMap<string, OwnFeatureWrite>;
  onWrite: (key: string, write: OwnFeatureWrite) => void; onConflict: (key: string) => void;
}) {
  const { t } = useTranslation(["platformTenants", "common"]);
  const { canPlatform } = usePermissions(); const client = useQueryClient(); const format = useFormat();
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const editable = canPlatform("platform.tenants.manage") && organization.status !== "Closed";
  const rows = (query.data ?? []).map((feature) => ({ ...feature, ...writes.get(feature.key) }));
  const state = (feature: PlatformFeatureResponse) => !feature.enabled ? "Off" : feature.source === "Trial" ? "Trial" : "On";
  const moduleName = (key: string) => t(`platformTenants:modules.${key}`, { defaultValue: key });
  const status = (row: PlatformFeatureResponse) => <StatusDot tone={state(row) === "Trial" ? "pending" : state(row) === "On" ? "success" : "neutral"} label={state(row) === "Trial" ? t("platformTenants:modules.trialUntil", { date: row.expiresOn ? format.formatDate(row.expiresOn) : format.formatEmpty() }) : <EnumText enum="PlatformModuleState" value={state(row)} />} />;
  const rowActions = (feature: PlatformFeatureResponse) => <RowActions label={t("platformTenants:rowActions", { name: moduleName(feature.key) })} title={moduleName(feature.key)} actions={[
    { label: t("platformTenants:modules.actions.enable"), accessibleName: t("platformTenants:modules.actions.enable"), icon: PowerIcon, hidden: !editable || state(feature) === "On", onSelect: (trigger) => setConfirmation({ feature, action: "enable", trigger }) },
    { label: t("platformTenants:modules.actions.extend"), accessibleName: t("platformTenants:modules.actions.extend"), icon: CalendarIcon, hidden: !editable || state(feature) !== "Trial", onSelect: (trigger) => setConfirmation({ feature, action: "extend", trigger }) },
    { label: t("platformTenants:modules.actions.disable"), accessibleName: t("platformTenants:modules.actions.disable"), icon: BanIcon, destructive: true, hidden: !editable || state(feature) === "Off", onSelect: (trigger) => setConfirmation({ feature, action: "disable", trigger }) },
  ]} />;
  const columns: Column<PlatformFeatureResponse>[] = [
    { id: "key", header: t("platformTenants:modules.module"), type: "text", mobile: "primary", value: (row) => moduleName(row.key) },
    { id: "state", header: t("platformTenants:columns.status"), type: "custom", mobile: "status", cell: status },
    { id: "source", header: t("platformTenants:modules.source"), type: "enum", enum: "TenantFeatureSource", value: (row) => row.source },
    { id: "actions", header: t("platformTenants:columns.actions"), type: "actions", cell: rowActions },
  ];
  return <>
    <Surface phoneFlush><DataTable columns={columns} rows={rows} rowKey={(row) => row.key} isLoading={query.isPending} isFetching={query.isFetching}
      mobileRow={(row) => <ListRow key={row.key} title={moduleName(row.key)} meta={status(row)} lines={[<EnumText key="source" enum="TenantFeatureSource" value={row.source} />]} trailing={rowActions(row)} />}
      error={query.error ? apiErrorMessage(query.error, t) : undefined} onRetry={() => { void query.refetch(); }} /></Surface>
    {confirmation ? <ModuleReasonDialog organization={organization} confirmation={confirmation} onClose={(conflicted) => {
      if (conflicted) onConflict(confirmation.feature.key); setConfirmation((current) => current === confirmation ? null : current);
    }} onSuccess={(write) => {
      onWrite(confirmation.feature.key, write);
      client.setQueryData<PlatformFeatureResponse[]>(tenantFeaturesQueryKey(organization.id), (data) => data?.map((row) => row.key === confirmation.feature.key ? { ...row, ...write } : row));
      toast.success(t(`platformTenants:modules.messages.${confirmation.action}`, { module: moduleName(confirmation.feature.key) })); void client.invalidateQueries({ queryKey: tenantsQueryRoot });
    }} /> : null}
  </>;
}

function ModuleReasonDialog({ organization, confirmation, onClose, onSuccess }: {
  organization: PlatformTenantDetailResponse; confirmation: Confirmation; onClose: (conflicted: boolean) => void; onSuccess: (write: OwnFeatureWrite) => void;
}) {
  const { t } = useTranslation("platformTenants"); const conflict = useRef(false);
  const active = useRef(true);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  const { feature, action } = confirmation;
  return <ReasonDialog title={t(`modules.confirm.${action}.title`, { module: t(`modules.${feature.key}`, { defaultValue: feature.key }) })} description={t(`modules.confirm.${action}.description`, { name: organization.name })}
    confirmLabel={t(`modules.actions.${action}`)} pendingLabel={t(`modules.confirm.${action}.pending`)} destructive={action === "disable"}
    date={action === "extend" ? { initialValue: feature.expiresOn } : undefined} returnFocusTo={confirmation.trigger} queryRoot={tenantsQueryRoot} onClose={() => onClose(conflict.current)}
    mutationFn={async (values) => {
      if (!active.current) throw new DOMException("", "AbortError");
      const change: OwnFeatureWrite = { version: feature.version, enabled: action !== "disable", source: action === "extend" ? "Trial" : "Manual", expiresOn: action === "extend" ? values.expiresOn : null };
      try { const response = await updateTenantFeature(organization.id, feature.key, { ...change, reason: values.reason }); if (!active.current) throw new DOMException("", "AbortError"); conflict.current = false; return { ...change, version: response.version }; }
      catch (error) { if (!active.current) throw new DOMException("", "AbortError"); if (error instanceof ApiError && error.code === "General.ConcurrencyConflict") conflict.current = true; throw tenantReasonFormError(error); }
    }} onSuccess={onSuccess} />;
}
