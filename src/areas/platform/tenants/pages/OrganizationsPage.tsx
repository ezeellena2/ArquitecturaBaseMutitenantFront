import type { PagedResultOfPlatformTenantResponse } from "@/shared/api/types";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Power, RotateCw, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { usePermissions } from "@/auth/usePermissions";
import { apiErrorMessage, toastActionError } from "@/shared/api/errorMessage";
import type { PlatformTenantResponse, TenantRegistrationSource, TenantStatus, VersionResponse } from "@/shared/api/types";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { maskEmail } from "@/shared/format/personalData";
import { useFormat } from "@/shared/format/useFormat";
import { usePagedQuery } from "@/shared/hooks/usePagedQuery";
import { ReasonDialog } from "@/shared/platform/ReasonDialog";
import { Button } from "@/shared/ui/button";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { FilterBar } from "@/shared/ui/FilterBar";
import { BuildingIcon, CheckIcon, CloseIcon, EyeIcon } from "@/shared/ui/icons";
import { Page } from "@/shared/ui/Page";
import { Pagination } from "@/shared/ui/Pagination";
import { RowActions } from "@/shared/ui/RowActions";
import { Surface } from "@/shared/ui/Surface";
import { changeTenantState, fetchTenantCounts, fetchTenants, retryTenantProvisioning, tenantCountsQueryKey, tenantsQueryKey, tenantsQueryRoot, type TenantAction, type TenantsQuery } from "../api/tenants";
import { createOrganizationColumns, organizationPath, organizationPhoneRow } from "../columns";
import { CreateOrganizationDialog } from "../components/CreateOrganizationDialog";
import { isTenantStateConflict, tenantStateConflictCodes } from "../errors";

const filterKeys = ["status", "source"] as const;
const statuses: readonly (TenantStatus | undefined)[] = [undefined, "PendingApproval", "Active", "Suspended", "Provisioning", "Closed"];
const sources: readonly (TenantRegistrationSource | undefined)[] = [undefined, "SelfService", "Platform"];
const nextStatus: Record<TenantAction, TenantStatus> = { approve: "Active", reject: "Closed", suspend: "Suspended", reactivate: "Active", close: "Closed" };
interface StateOperation { id: string; action: TenantAction; version: number; reason: string }
interface OwnWrite { version: number; status: TenantStatus }
interface Confirmation { organization: PlatformTenantResponse; action: TenantAction; trigger: HTMLElement | null }

/** El adaptador vive lo mismo que el formulario: cancelar termina su recorrido y sus reintentos. */
function OrganizationStatusDialog({ confirmation, onClose, onSuccess }: {
  confirmation: Confirmation;
  onClose: (conflicted: boolean) => void;
  onSuccess: (response: VersionResponse) => void;
}) {
  const { t } = useTranslation("platformTenants");
  const conflict = useRef(false);
  // ReasonDialog es dueño del error y del reintento global; el adaptador conserva sólo su clave idempotente.
  const action = useIdempotentMutation((operation: StateOperation, key) => changeTenantState(operation.id, operation.action, { version: operation.version, reason: operation.reason }, key), {
    meta: { handlesError: true },
    sameOperation: (previous, next) => previous.id === next.id && previous.action === next.action && previous.version === next.version && previous.reason === next.reason,
  });
  return <ReasonDialog
    title={t(`confirm.${confirmation.action}.title`, { name: confirmation.organization.name })}
    description={t(`confirm.${confirmation.action}.description`, { owner: confirmation.organization.ownerName || confirmation.organization.ownerEmail || "", email: maskEmail(confirmation.organization.ownerEmail ?? "") })}
    confirmLabel={t(`actions.${confirmation.action}`)} pendingLabel={t(`confirm.${confirmation.action}.pending`)} destructive={["reject", "suspend", "close"].includes(confirmation.action)}
    queryRoot={tenantsQueryRoot} stateConflictCodes={tenantStateConflictCodes} returnFocusTo={confirmation.trigger}
    onClose={() => onClose(conflict.current)}
    mutationFn={async (values) => {
      try { return await action.mutateAsync({ id: confirmation.organization.id, action: confirmation.action, version: confirmation.organization.version, reason: values.reason }); }
      catch (error) { if (isTenantStateConflict(error)) conflict.current = true; throw error; }
    }}
    onSuccess={onSuccess}
  />;
}

export function OrganizationsPage() {
  const { t } = useTranslation(["platformTenants", "common"]);
  const format = useFormat();
  const { canPlatform } = usePermissions();
  const canRead = canPlatform("platform.tenants.read");
  const canManage = canPlatform("platform.tenants.manage");
  const client = useQueryClient();
  const navigate = useNavigate();
  const { filters, pagination, query, result: organizations, paginationProps } = usePagedQuery({
    filterKeys, defaultSort: "name", enabled: canRead,
    toQuery: (page, values): TenantsQuery => ({ ...page, status: statuses.find((value) => value === values.status), source: sources.find((value) => value === values.source) }),
    queryKey: tenantsQueryKey, queryFn: fetchTenants, meta: { silent: true, blocksView: true },
  });
  const countQuery = { search: query.search, status: query.status, source: query.source };
  const counts = useQuery({ queryKey: tenantCountsQueryKey(countQuery), queryFn: () => fetchTenantCounts(countQuery), enabled: canRead, placeholderData: keepPreviousData, meta: { silent: true } });
  const globalCounts = useQuery({ queryKey: tenantCountsQueryKey({}), queryFn: () => fetchTenantCounts({}), enabled: canRead, meta: { silent: true } });
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  // Sólo coordinación de escrituras propias, nunca una copia del listado: los datos siguen en TanStack Query.
  const [ownWrites, setOwnWrites] = useState(() => new Map<string, OwnWrite>());
  const effective = (organization: PlatformTenantResponse): PlatformTenantResponse => {
    const written = ownWrites.get(organization.id);
    return written ? { ...organization, ...written } : organization;
  };
  const invalidate = async () => client.invalidateQueries({ queryKey: tenantsQueryRoot });
  function wrote(id: string, version: number, status: TenantStatus) {
    setOwnWrites((previous) => new Map(previous).set(id, { version, status }));
    client.setQueriesData<PagedResultOfPlatformTenantResponse>({ queryKey: [...tenantsQueryRoot, "paged"] }, (data) => data ? { ...data, items: data.items.map((item) => item.id === id ? { ...item, version, status } : item) } : data);
  }
  const retry = useIdempotentMutation((organization: PlatformTenantResponse, key) => retryTenantProvisioning(organization.id, { version: organization.version }, key), {
    sameOperation: (previous, next) => previous.id === next.id && previous.version === next.version,
  });
  const openConfirmation = (organization: PlatformTenantResponse, action: TenantAction, trigger: HTMLElement | null) => { setConfirmation({ organization, action, trigger }); };
  const rowActions = (organization: PlatformTenantResponse) => <RowActions label={t("platformTenants:rowActions", { name: organization.name })} title={organization.name} actions={[
    { label: t("platformTenants:actions.view"), accessibleName: t("platformTenants:actions.view"), icon: EyeIcon, onSelect: () => { void navigate(organizationPath(organization.id)); } },
    { label: t("platformTenants:actions.approve"), accessibleName: t("platformTenants:actions.approve"), icon: CheckIcon, hidden: !canManage || organization.status !== "PendingApproval", onSelect: (trigger) => openConfirmation(organization, "approve", trigger) },
    { label: t("platformTenants:actions.retry"), accessibleName: t("platformTenants:actions.retry"), icon: RotateCw, hidden: !canManage || organization.status !== "Provisioning", onSelect: () => retry.mutate(organization, { onSuccess: (response) => { wrote(organization.id, response.version, "Active"); toast.success(t("platformTenants:messages.retried", { name: organization.name })); void invalidate(); }, onError: (error) => toastActionError(error, t) }) },
    { label: t("platformTenants:actions.reactivate"), accessibleName: t("platformTenants:actions.reactivate"), icon: Power, hidden: !canManage || organization.status !== "Suspended", onSelect: (trigger) => openConfirmation(organization, "reactivate", trigger) },
    { label: t("platformTenants:actions.reject"), accessibleName: t("platformTenants:actions.reject"), icon: CloseIcon, destructive: true, hidden: !canManage || organization.status !== "PendingApproval", onSelect: (trigger) => openConfirmation(organization, "reject", trigger) },
    { label: t("platformTenants:actions.suspend"), accessibleName: t("platformTenants:actions.suspend"), icon: Power, destructive: true, hidden: !canManage || organization.status !== "Active", onSelect: (trigger) => openConfirmation(organization, "suspend", trigger) },
    { label: t("platformTenants:actions.close"), accessibleName: t("platformTenants:actions.close"), icon: Trash2, destructive: true, hidden: !canManage || organization.status !== "Suspended", onSelect: (trigger) => openConfirmation(organization, "close", trigger) },
  ]} />;
  const columns: Column<PlatformTenantResponse>[] = [...createOrganizationColumns(t), { id: "actions", header: t("platformTenants:columns.actions"), type: "actions", cell: rowActions }];
  const pending = globalCounts.data?.statuses.find((item) => item.status === "PendingApproval")?.count ?? 0;
  const summary = globalCounts.data ? t("platformTenants:summary", { total: format.formatInteger(globalCounts.data.total), pending: format.formatInteger(pending), count: pending }) : undefined;
  const filtered = Boolean(query.status || query.source || pagination.search);
  return <>
    <Page icon={BuildingIcon} title={t("platformTenants:title")} summary={summary} phoneSubtitle={t("platformTenants:platform")} phoneBody="flush"
      fab={canManage ? { label: t("platformTenants:create.title"), onClick: () => setCreateOpen(true) } : undefined}
      actions={canManage ? <Button onClick={() => setCreateOpen(true)}><Plus aria-hidden="true" className="size-3.5" strokeWidth={2.25} />{t("platformTenants:create.title")}</Button> : undefined}>
      <div className="flex flex-col gap-3 md:gap-3.5">
        <FilterBar label={t("platformTenants:filters.label")} searchLabel={t("platformTenants:filters.search")} searchValue={pagination.search ?? ""} onSearchChange={pagination.setSearch}
          filters={[
            { key: "status", label: t("platformTenants:filters.status"), menuLabel: t("platformTenants:filters.statusMenu"), value: query.status ?? "", active: query.status !== undefined, onChange: (value) => filters.setFilter("status", value === "all" ? undefined : value), options: statuses.map((value) => ({ value: value ?? "all", label: t(`platformTenants:filters.statuses.${value ?? "all"}`), count: counts.data ? value ? counts.data.statuses.find((item) => item.status === value)?.count ?? 0 : counts.data.statuses.reduce((sum, item) => sum + item.count, 0) : undefined })) },
            { key: "source", label: t("platformTenants:filters.source"), menuLabel: t("platformTenants:filters.sourceMenu"), value: query.source ?? "", active: query.source !== undefined, onChange: (value) => filters.setFilter("source", value === "all" ? undefined : value), options: sources.map((value) => ({ value: value ?? "all", label: t(`platformTenants:filters.sources.${value ?? "all"}`), count: counts.data ? value ? counts.data.sources.find((item) => item.source === value)?.count ?? 0 : counts.data.sources.reduce((sum, item) => sum + item.count, 0) : undefined })) },
          ]} clearLabel={t("common:actions.clear")} onClear={filters.clear} />
        <Surface className="overflow-hidden" phoneFlush>
          <DataTable columns={columns} rows={(organizations.data?.items ?? []).map(effective)} mobileRow={(organization) => organizationPhoneRow(organization, t, rowActions(organization))} rowKey={(organization) => organization.id}
            isLoading={organizations.isPending} isFetching={organizations.isFetching} error={organizations.error ? apiErrorMessage(organizations.error, t) : undefined}
            onRetry={() => { void organizations.refetch(); void counts.refetch(); void globalCounts.refetch(); }} emptyTitle={t(filtered ? "platformTenants:empty.filtered" : "platformTenants:empty.all")}
            emptyAction={filtered ? <Button variant="outline" onClick={filters.clear}>{t("platformTenants:empty.clear")}</Button> : undefined} sort={pagination.sort} onSortChange={pagination.toggleSort} />
          {paginationProps ? <Pagination {...paginationProps} /> : null}
        </Surface>
      </div>
    </Page>
    {createOpen ? <CreateOrganizationDialog onClose={() => setCreateOpen(false)} onCreated={invalidate} /> : null}
    {confirmation ? <OrganizationStatusDialog confirmation={confirmation}
      onClose={(conflicted) => { if (conflicted) setOwnWrites((previous) => { const next = new Map(previous); next.delete(confirmation.organization.id); return next; }); setConfirmation((current) => current === confirmation ? null : current); }}
      onSuccess={(response) => { wrote(confirmation.organization.id, response.version, nextStatus[confirmation.action]); toast.success(t(`platformTenants:messages.${confirmation.action}`, { name: confirmation.organization.name, email: maskEmail(confirmation.organization.ownerEmail ?? "") })); void invalidate(); }} /> : null}
  </>;
}
