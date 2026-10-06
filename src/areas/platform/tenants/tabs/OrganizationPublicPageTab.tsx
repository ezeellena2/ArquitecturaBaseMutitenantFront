import { useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { usePermissions } from "@/auth/usePermissions";
import { ApiError } from "@/shared/api/ApiError";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import type { PlatformPublicSiteResponse, PlatformTenantDetailResponse, VersionResponse } from "@/shared/api/types";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { publicPageStateTones } from "@/shared/format/statusTones";
import { ReasonDialog } from "@/shared/platform/ReasonDialog";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { BanIcon, CheckIcon } from "@/shared/ui/icons";
import { RowActions } from "@/shared/ui/RowActions";
import { Surface } from "@/shared/ui/Surface";
import { ListRow } from "@/shared/ui/app/ListRow";
import { DateText } from "@/shared/ui/format/DateText";
import { EmptyValue } from "@/shared/ui/format/EmptyValue";
import { StatusBadge } from "@/shared/ui/format/StatusBadge";
import { publicSiteHost } from "@/tenancy/publicSite";
import { changeTenantPublicPage, tenantPublicPageQueryKey, tenantsQueryRoot, type PublicPageAction } from "../api/tenants";
import { tenantReasonFormError } from "../errors";

type PageState = "Published" | "Draft" | "Blocked";
export interface OwnPublicPageWrite { version: number; state: PageState }
interface Confirmation { page: PlatformPublicSiteResponse; action: PublicPageAction; trigger: HTMLElement | null }
interface Operation { id: string; action: PublicPageAction; version: number; reason: string }
const stateOf = (page: PlatformPublicSiteResponse): PageState => page.publishBlockedAtUtc ? "Blocked" : page.isPublished ? "Published" : "Draft";
const tones = { ...publicPageStateTones, enum: "PlatformPublicPageState" };

export function OrganizationPublicPageTab({ organization, query, write, onWrite, onConflict }: {
  organization: PlatformTenantDetailResponse; query: UseQueryResult<PlatformPublicSiteResponse>; write?: OwnPublicPageWrite;
  onWrite: (write: OwnPublicPageWrite) => void; onConflict: () => void;
}) {
  const { t } = useTranslation(["platformTenants", "common"]); const { canPlatform } = usePermissions(); const client = useQueryClient();
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const editable = canPlatform("platform.tenants.manage") && organization.status !== "Closed";
  const rows = query.data ? [{ ...query.data, version: write?.version ?? query.data.version }] : [];
  const state = (page: PlatformPublicSiteResponse) => write?.state ?? stateOf(page);
  const address = (page: PlatformPublicSiteResponse) => page.slug ? publicSiteHost(page.slug) : null;
  // La fila lleva la base propia para la siguiente acción; los metadatos sólo pertenecen a una lectura de esa base.
  const reason = (page: PlatformPublicSiteResponse) => state(page) === "Blocked" && stateOf(page) === "Blocked"
    && (!write || query.data?.version === write.version) ? page.publishBlockedReason : null;
  const rowActions = (page: PlatformPublicSiteResponse) => <RowActions label={t("platformTenants:rowActions", { name: address(page) ?? page.name })} title={address(page) ?? page.name} actions={[
    { label: t("platformTenants:publicPage.actions.unpublish"), accessibleName: t("platformTenants:publicPage.actions.unpublish"), icon: BanIcon, destructive: true, hidden: !editable || state(page) !== "Published", onSelect: (trigger) => setConfirmation({ page, action: "unpublish", trigger }) },
    { label: t("platformTenants:publicPage.actions.allow-publish"), accessibleName: t("platformTenants:publicPage.actions.allow-publish"), icon: CheckIcon, hidden: !editable || state(page) !== "Blocked", onSelect: (trigger) => setConfirmation({ page, action: "allow-publish", trigger }) },
  ]} />;
  const columns: Column<PlatformPublicSiteResponse>[] = [
    { id: "slug", header: t("platformTenants:publicPage.address"), type: "text", mobile: "primary", value: address },
    { id: "state", header: t("platformTenants:columns.status"), type: "status", mobile: "status", tones, value: state },
    { id: "publishedAtUtc", header: t("platformTenants:publicPage.publishedOn"), type: "date", value: (page) => state(page) === "Published" ? page.publishedAtUtc : null },
    { id: "publishBlockedReason", header: t("platformTenants:detail.historyColumns.reason"), type: "text", value: reason },
    { id: "actions", header: t("platformTenants:columns.actions"), type: "actions", cell: rowActions },
  ];
  return <>
    <Surface phoneFlush><DataTable columns={columns} rows={rows} rowKey={(page) => page.slug ?? organization.id} isLoading={query.isPending} isFetching={query.isFetching}
      mobileRow={(page) => <ListRow key={page.slug ?? organization.id} title={address(page) || <EmptyValue />} meta={<StatusBadge tones={tones} value={state(page)} />}
        lines={[<DateText key="published" value={state(page) === "Published" ? page.publishedAtUtc : null} />, reason(page) || <EmptyValue key="reason" />]} trailing={rowActions(page)} />}
      error={query.error ? apiErrorMessage(query.error, t) : undefined} onRetry={() => { void query.refetch(); }} /></Surface>
    {confirmation ? <PublicPageReasonDialog organization={organization} confirmation={confirmation} onClose={(conflicted) => {
      if (conflicted) onConflict(); setConfirmation((current) => current === confirmation ? null : current);
    }} onSuccess={(response) => {
      const next: OwnPublicPageWrite = { version: response.version, state: confirmation.action === "unpublish" ? "Blocked" : "Draft" };
      onWrite(next);
      client.setQueryData<PlatformPublicSiteResponse>(tenantPublicPageQueryKey(organization.id), (page) => page ? { ...page, version: response.version, isPublished: false, publishBlockedAtUtc: null, publishBlockedReason: null } : page);
      toast.success(t(`platformTenants:publicPage.messages.${confirmation.action}`, { address: address(confirmation.page), name: organization.name })); void client.invalidateQueries({ queryKey: tenantsQueryRoot });
    }} /> : null}
  </>;
}

function PublicPageReasonDialog({ organization, confirmation, onClose, onSuccess }: {
  organization: PlatformTenantDetailResponse; confirmation: Confirmation; onClose: (conflicted: boolean) => void; onSuccess: (response: VersionResponse) => void;
}) {
  const { t } = useTranslation("platformTenants"); const conflict = useRef(false);
  const action = useIdempotentMutation((operation: Operation, key) => changeTenantPublicPage(operation.id, operation.action, { version: operation.version, reason: operation.reason }, key), {
    meta: { handlesError: true }, sameOperation: (previous, next) => previous.id === next.id && previous.action === next.action && previous.version === next.version && previous.reason === next.reason,
  });
  return <ReasonDialog title={t(`publicPage.confirm.${confirmation.action}.title`, { address: confirmation.page.slug ? publicSiteHost(confirmation.page.slug) : confirmation.page.name })}
    description={t(`publicPage.confirm.${confirmation.action}.description`, { name: organization.name })} confirmLabel={t(`publicPage.actions.${confirmation.action}`)} pendingLabel={t(`publicPage.confirm.${confirmation.action}.pending`)}
    destructive={confirmation.action === "unpublish"} returnFocusTo={confirmation.trigger} queryRoot={tenantsQueryRoot} onClose={() => onClose(conflict.current)}
    mutationFn={async (values) => {
      try { const response = await action.mutateAsync({ id: organization.id, action: confirmation.action, version: confirmation.page.version, reason: values.reason }); conflict.current = false; return response; }
      catch (error) { if (error instanceof ApiError && error.code === "General.ConcurrencyConflict") conflict.current = true; throw tenantReasonFormError(error); }
    }} onSuccess={onSuccess} />;
}
