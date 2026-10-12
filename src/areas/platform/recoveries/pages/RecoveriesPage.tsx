import type { PagedResultOfPlatformRecoveryResponse } from "@/shared/api/types";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";
import { toast } from "sonner";
import { usePermissions } from "@/auth/usePermissions";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import type { AccountRecoveryStatus, PlatformRecoveryResponse } from "@/shared/api/types";
import { useFormat } from "@/shared/format/useFormat";
import { usePagedQuery } from "@/shared/hooks/usePagedQuery";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { Button } from "@/shared/ui/button";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { FilterBar } from "@/shared/ui/FilterBar";
import { EyeIcon, KeyIcon } from "@/shared/ui/icons";
import { Page } from "@/shared/ui/Page";
import { Pagination } from "@/shared/ui/Pagination";
import { RowActions } from "@/shared/ui/RowActions";
import { Surface } from "@/shared/ui/Surface";
import { fetchRecoveries, fetchRecoveryCounts, recoveriesQueryKey, recoveriesQueryRoot, recoveryCountsQueryKey, type RecoveriesQuery } from "../api/recoveries";
import { createRecoveryColumns, recoveryPhoneRow } from "../columns";
import { ReviewRecoveryDialog } from "../components/ReviewRecoveryDialog";

const filterKeys = ["status"] as const;
const statuses: readonly (AccountRecoveryStatus | undefined)[] = [undefined, "Pending", "Approved", "Rejected"];
interface Confirmation { recovery: PlatformRecoveryResponse; trigger: HTMLElement | null; route: string }
type OwnWrite = Pick<PlatformRecoveryResponse, "version" | "status" | "reason">;

export function RecoveriesPage() {
  const { t } = useTranslation(["platformRecoveries", "common"]); const format = useFormat(); const { phone } = useAppChrome(); const client = useQueryClient(); const location = useLocation();
  const { canPlatform } = usePermissions(); const canManage = canPlatform("platform.recoveries.manage");
  const { filters, pagination, query, result: recoveries, paginationProps } = usePagedQuery({ filterKeys, defaultSort: "-createdAt",
    toQuery: (page, values): RecoveriesQuery => ({ ...page, status: statuses.find((value) => value === values.status) }),
    queryKey: recoveriesQueryKey, queryFn: fetchRecoveries, meta: { silent: true, blocksView: true } });
  const countQuery = { search: query.search, status: query.status };
  const counts = useQuery({ queryKey: recoveryCountsQueryKey(countQuery), queryFn: () => fetchRecoveryCounts(countQuery), placeholderData: keepPreviousData, meta: { silent: true } });
  const globalCounts = useQuery({ queryKey: recoveryCountsQueryKey({}), queryFn: () => fetchRecoveryCounts({}), meta: { silent: true } });
  const [ownWrites, setOwnWrites] = useState(() => new Map<string, OwnWrite>());
  const rows = (recoveries.data?.items ?? []).map((recovery) => {
    const written = ownWrites.get(recovery.id);
    return written && !(recovery.status !== "Pending" && recovery.version >= written.version) ? { ...recovery, ...written } : recovery;
  });
  const route = location.pathname + location.search; const [dialogRoute, setDialogRoute] = useState(route); const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  if (dialogRoute !== route) { setDialogRoute(route); setConfirmation(null); }
  const currentTarget = rows.find((row) => row.id === confirmation?.recovery.id);
  const activeConfirmation = confirmation?.route === route && canManage && currentTarget && currentTarget.status === confirmation.recovery.status
    && currentTarget.accountId === confirmation.recovery.accountId && currentTarget.previousMethod === confirmation.recovery.previousMethod && currentTarget.newMethod === confirmation.recovery.newMethod
    && currentTarget.previousMethodType === confirmation.recovery.previousMethodType && currentTarget.newMethodType === confirmation.recovery.newMethodType ? confirmation : null;
  if (confirmation && !activeConfirmation) setConfirmation(null);
  const open = (recovery: PlatformRecoveryResponse, trigger: HTMLElement | null) => setConfirmation({ recovery, trigger, route });
  const rowName = (recovery: PlatformRecoveryResponse) => recovery.accountId ? recovery.accountName || format.formatDateTime(recovery.createdAtUtc) : t("platformRecoveries:noAccount");
  const rowActions = (recovery: PlatformRecoveryResponse) => canManage ? <RowActions label={t("platformRecoveries:rowActions", { name: rowName(recovery) })} title={rowName(recovery)} actions={[
    { label: t(recovery.status === "Pending" ? "platformRecoveries:actions.review" : "platformRecoveries:actions.detail"), accessibleName: t(recovery.status === "Pending" ? "platformRecoveries:actions.review" : "platformRecoveries:actions.detail"), icon: EyeIcon, onSelect: (trigger) => open(recovery, trigger) },
  ]} /> : null;
  const columns: Column<PlatformRecoveryResponse>[] = [...createRecoveryColumns(t), { id: "actions", header: t("platformRecoveries:columns.actions"), type: "actions", cell: rowActions }];
  const pending = globalCounts.data?.statuses.find((item) => item.status === "Pending")?.count ?? 0;
  const summary = globalCounts.data ? globalCounts.data.total === 0 ? t("platformRecoveries:summaryEmpty") : t("platformRecoveries:summary", {
    requests: t("platformRecoveries:requests", { count: globalCounts.data.total, total: format.formatInteger(globalCounts.data.total) }),
    pending: t("platformRecoveries:pending", { count: pending, total: format.formatInteger(pending) }),
  }) : undefined;
  const filtered = Boolean(pagination.search || query.status);
  return <>
    <Page icon={KeyIcon} title={t("platformRecoveries:title")} summary={summary} phoneSubtitle={t("platformRecoveries:platform")} phoneBody="flush">
      <div className="flex flex-col gap-3 md:gap-3.5">
        <FilterBar phoneTools="filter" label={t(phone ? "platformRecoveries:filters.phone" : "platformRecoveries:filters.label")} searchLabel={t("platformRecoveries:filters.search")} searchValue={pagination.search ?? ""} onSearchChange={pagination.setSearch} clearLabel={t("common:actions.clear")} onClear={filters.clear}
          filters={[{ key: "status", label: t("platformRecoveries:filters.status"), menuLabel: t("platformRecoveries:filters.statusMenu"), value: query.status ?? "", active: query.status !== undefined,
            onChange: (value) => filters.setFilter("status", value === "all" ? undefined : value), options: statuses.map((value) => ({ value: value ?? "all", label: t(`platformRecoveries:filters.statuses.${value ?? "all"}`),
              count: counts.data ? value ? counts.data.statuses.find((item) => item.status === value)?.count ?? 0 : counts.data.statuses.reduce((sum, item) => sum + item.count, 0) : undefined })) }]} />
        <Surface className="overflow-hidden" phoneFlush><DataTable columns={columns} rows={rows} rowKey={(recovery) => recovery.id} mobileRow={(recovery) => recoveryPhoneRow(recovery, t, rowActions(recovery), () => open(recovery, null))}
          isLoading={recoveries.isPending} isFetching={recoveries.isFetching} error={recoveries.error ? apiErrorMessage(recoveries.error, t) : undefined} onRetry={() => { void recoveries.refetch(); void counts.refetch(); void globalCounts.refetch(); }}
          emptyTitle={t(filtered ? "platformRecoveries:empty.filtered" : "platformRecoveries:empty.all")} emptyAction={filtered ? <Button variant="outline" onClick={filters.clear}>{t("platformRecoveries:empty.clear")}</Button> : undefined} sort={pagination.sort} onSortChange={pagination.toggleSort} />
          {paginationProps && paginationProps.totalCount > 0 ? <Pagination {...paginationProps} /> : null}</Surface>
      </div>
    </Page>
    {activeConfirmation ? <ReviewRecoveryDialog key={`${activeConfirmation.recovery.id}:${activeConfirmation.recovery.status}:${route}`} recovery={activeConfirmation.recovery} returnFocusTo={activeConfirmation.trigger} onClose={() => setConfirmation(null)} onResolved={(response, operation) => {
      const written: OwnWrite = { version: response.version, status: operation.action === "approve" ? "Approved" : "Rejected", reason: operation.reason };
      setOwnWrites((previous) => new Map(previous).set(operation.id, written));
      client.setQueriesData<PagedResultOfPlatformRecoveryResponse>({ queryKey: [...recoveriesQueryRoot, "paged"] }, (data) => data ? { ...data, items: data.items.map((row) => row.id === operation.id ? { ...row, ...written } : row) } : data);
      toast.success(t(operation.action === "approve" ? "platformRecoveries:messages.approved" : "platformRecoveries:messages.rejected", { method: activeConfirmation.recovery.newMethod, account: activeConfirmation.recovery.accountName || format.formatEmpty() }));
      void client.invalidateQueries({ queryKey: recoveriesQueryRoot });
    }} /> : null}
  </>;
}
