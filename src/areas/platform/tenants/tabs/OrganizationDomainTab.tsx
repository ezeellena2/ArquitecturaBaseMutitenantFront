import { useMountedRef } from "@/shared/hooks/useMountedRef";
import { useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { usePermissions } from "@/auth/usePermissions";
import { ApiError } from "@/shared/api/ApiError";
import { apiErrorMessage, toastActionError } from "@/shared/api/errorMessage";
import type { OrganizationDomainResponse, OrganizationDomainPageResponse, PlatformTenantDetailResponse } from "@/shared/api/types";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { useResourceAction } from "@/shared/hooks/useResourceAction";
import { tenantDomainStatusTones } from "@/shared/format/statusTones";
import { ReasonDialog } from "@/shared/platform/ReasonDialog";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { CircleCheckIcon, TrashIcon } from "@/shared/ui/icons";
import { RowActions } from "@/shared/ui/RowActions";
import { Pagination, type PaginationProps } from "@/shared/ui/Pagination";
import { Surface } from "@/shared/ui/Surface";
import { ListRow } from "@/shared/ui/app/ListRow";
import { EmptyValue } from "@/shared/ui/format/EmptyValue";
import { StatusBadge } from "@/shared/ui/format/StatusBadge";
import { removeTenantDomain, tenantDomainsQueryKey, tenantsQueryRoot, verifyTenantDomain } from "../api/tenants";

export type OwnDomainWrite = Pick<OrganizationDomainResponse, "version" | "status">;
interface Confirmation { domain: OrganizationDomainResponse; trigger: HTMLElement | null }
interface VerifyOperation { id: string; domain: string; version: number; reason: string }
const conflicts = ["Settings.TenantDomain.AlreadyVerified", "Settings.TenantDomain.NotFound"] as const;
function conflicted(error: unknown) { return error instanceof ApiError && (error.code === "General.ConcurrencyConflict" || error.status === 409 && conflicts.some((code) => error.code === code)); }

export function OrganizationDomainTab({ organization, query, paginationProps, writes, onWrite, onConflict }: {
  organization: PlatformTenantDetailResponse; query: UseQueryResult<OrganizationDomainPageResponse>; paginationProps?: PaginationProps; writes: ReadonlyMap<string, OwnDomainWrite>;
  onWrite: (domain: string, write: OwnDomainWrite) => void; onConflict: (domain: string) => void;
}) {
  const { t } = useTranslation(["platformTenants", "common"]); const { canPlatform } = usePermissions(); const client = useQueryClient();
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const editable = canPlatform("platform.tenants.manage") && organization.status !== "Closed";
  const rows = (query.data?.items ?? []).map((row) => ({ ...row, ...writes.get(row.domain) })).filter((row) => row.status !== "Removed");
  const rowActions = (domain: OrganizationDomainResponse) => <DomainActions key={domain.domain} organizationId={organization.id} domain={domain} editable={editable}
    onWrite={onWrite} onConflict={onConflict} onRemove={setConfirmation} />;
  const columns: Column<OrganizationDomainResponse>[] = [
    { id: "domain", header: t("platformTenants:domains.domain"), type: "text", mobile: "primary", value: (row) => row.domain },
    { id: "status", header: t("platformTenants:columns.status"), type: "status", mobile: "status", tones: tenantDomainStatusTones, value: (row) => row.status },
    { id: "txtRecordValue", header: t("platformTenants:domains.txt"), type: "text", value: (row) => row.status === "Pending" ? row.txtRecordValue : null },
    { id: "actions", header: t("platformTenants:columns.actions"), type: "actions", cell: rowActions },
  ];
  return <>
    <Surface phoneFlush><DataTable columns={columns} rows={rows} rowKey={(row) => row.id} isLoading={query.isPending} isFetching={query.isFetching}
      mobileRow={(row) => <ListRow key={row.id} title={row.domain} meta={<StatusBadge tones={tenantDomainStatusTones} value={row.status} />} lines={[row.status === "Pending" ? row.txtRecordValue || <EmptyValue key="txt" /> : <EmptyValue key="txt" />]} trailing={rowActions(row)} />}
      error={query.error ? apiErrorMessage(query.error, t) : undefined} onRetry={() => { void query.refetch(); }} emptyTitle={t("platformTenants:domains.empty")} />{paginationProps ? <Pagination {...paginationProps} /> : null}</Surface>
    {confirmation ? <DomainReasonDialog organization={organization} confirmation={confirmation} onClose={(stale) => {
      if (stale) onConflict(confirmation.domain.domain); setConfirmation((current) => current === confirmation ? null : current);
    }} onSuccess={() => {
      onWrite(confirmation.domain.domain, { version: confirmation.domain.version, status: "Removed" });
      client.setQueriesData<OrganizationDomainPageResponse>({ queryKey: tenantDomainsQueryKey(organization.id) }, (data) => data ? { ...data, items: data.items.filter((row) => row.domain !== confirmation.domain.domain) } : data);
      toast.success(t("platformTenants:domains.removed", { domain: confirmation.domain.domain })); void client.invalidateQueries({ queryKey: tenantsQueryRoot });
    }} /> : null}
  </>;
}

// Cada dominio conserva su clave y observer al releer las filas o verificar otro dominio.
function DomainActions({ organizationId, domain, editable, onWrite, onConflict, onRemove }: {
  organizationId: string; domain: OrganizationDomainResponse; editable: boolean;
  onWrite: (domain: string, write: OwnDomainWrite) => void; onConflict: (domain: string) => void; onRemove: (confirmation: Confirmation) => void;
}) {
  const { t } = useTranslation("platformTenants"); const client = useQueryClient();
  const action = useResourceAction<VerifyOperation>({
    matches: (meta) => meta?.tenantDomainVerification === true && meta.organizationId === organizationId && meta.domain === domain.domain,
    onError: (error) => {
    toastActionError(error, t); if (conflicted(error)) { onConflict(domain.domain); void client.invalidateQueries({ queryKey: tenantsQueryRoot }); }
    },
  });
  const verify = useIdempotentMutation(action.guarded((operation, key: string) => verifyTenantDomain(operation.id, operation.domain, { version: operation.version, reason: operation.reason }, key),
    (response, operation) => {
      // MutationCache puede ejecutar un retry después de que otro envío retiró su observer.
      onWrite(operation.domain, { version: response.version, status: "Verified" });
      client.setQueriesData<OrganizationDomainPageResponse>({ queryKey: tenantDomainsQueryKey(operation.id) }, (data) => data ? { ...data, items: data.items.map((item) => item.domain === operation.domain ? { ...item, version: response.version, status: "Verified", txtRecordName: null, txtRecordValue: null } : item) } : data);
      toast.success(t("domains.verified", { domain: operation.domain })); void client.invalidateQueries({ queryKey: tenantsQueryRoot });
    }), {
    meta: { tenantDomainVerification: true, organizationId, domain: domain.domain },
    sameOperation: (previous, next) => previous.id === next.id && previous.domain === next.domain && previous.version === next.version && previous.reason === next.reason,
  });
  const verifyDomain = () => verify.mutate({ id: organizationId, domain: domain.domain, version: domain.version, reason: t("domains.verifyReason") });
  const verifying = action.isPending;
  return <RowActions label={t("rowActions", { name: domain.domain })} title={domain.domain} actions={[
    { label: t("domains.verify"), accessibleName: t("domains.verify"), icon: CircleCheckIcon, hidden: !editable || domain.status !== "Pending" || verifying, onSelect: verifyDomain },
    { label: t("domains.remove"), accessibleName: t("domains.remove"), icon: TrashIcon, destructive: true, hidden: !editable || verifying, onSelect: (trigger) => onRemove({ domain, trigger }) },
  ]} />;
}

function DomainReasonDialog({ organization, confirmation, onClose, onSuccess }: {
  organization: PlatformTenantDetailResponse; confirmation: Confirmation; onClose: (conflicted: boolean) => void; onSuccess: () => void;
}) {
  const { t } = useTranslation("platformTenants"); const conflict = useRef(false);
  const active = useMountedRef();
  return <ReasonDialog title={t("domains.confirm.title", { domain: confirmation.domain.domain })} description={t("domains.confirm.description", { name: organization.name })}
    confirmLabel={t("domains.remove")} pendingLabel={t("domains.confirm.pending")} destructive returnFocusTo={confirmation.trigger} queryRoot={tenantsQueryRoot}
    stateConflictCodes={conflicts} onClose={() => onClose(conflict.current)} mutationFn={async (values) => {
      if (!active.current) throw new DOMException("", "AbortError");
      try { const response = await removeTenantDomain(organization.id, confirmation.domain.domain, { version: confirmation.domain.version, reason: values.reason }); if (!active.current) throw new DOMException("", "AbortError"); conflict.current = false; return response; }
      catch (error) { if (!active.current) throw new DOMException("", "AbortError"); if (conflicted(error)) conflict.current = true; throw error; }
    }} onSuccess={onSuccess} />;
}
