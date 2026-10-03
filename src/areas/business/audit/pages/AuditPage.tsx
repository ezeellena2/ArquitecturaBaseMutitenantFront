import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { ScrollText } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useCurrentUser } from "@/auth/useCurrentUser";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { useFilters } from "@/shared/hooks/useFilters";
import { usePagination } from "@/shared/hooks/usePagination";
import { ApiError } from "@/shared/api/ApiError";
import type { Column } from "@/shared/ui/DataTable";
import { DataTable } from "@/shared/ui/DataTable";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { FilterBar } from "@/shared/ui/FilterBar";
import { LoadMore } from "@/shared/ui/LoadMore";
import { Page } from "@/shared/ui/Page";
import { Surface } from "@/shared/ui/Surface";
import { ForbiddenPage } from "@/shared/ui/ForbiddenPage";
import { DateText } from "@/shared/ui/format/DateText";
import type { OrganizationAuditEntryResponse } from "@/shared/api/types";
import { auditQueryRoot, fetchAudit, fetchAuditActors } from "../api/audit";

const auditFilterKeys = ["period", "category", "actorId"] as const;
const auditCategories = ["users", "roles", "companies", "settings", "organization"] as const;

export function AuditPage() {
  const { t } = useTranslation(["audit", "common"]);
  const { data: currentUser } = useCurrentUser();
  const canRead = currentUser?.permissions?.includes("audit.read") === true;
  const filters = useFilters(auditFilterKeys);
  const pagination = usePagination(undefined);
  const search = useDebouncedValue(pagination.search ?? "");
  const period = filters.values.period ?? "30";
  const category = filters.values.category;
  const actorId = filters.values.actorId;
  const baseQuery = { period, category, actorId, search: search || undefined };

  const audit = useInfiniteQuery({
    queryKey: [...auditQueryRoot, baseQuery],
    queryFn: ({ pageParam }) => fetchAudit({ ...baseQuery, after: pageParam, limit: 25 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor ?? undefined : undefined,
    enabled: canRead,
    placeholderData: keepPreviousData,
    meta: { silent: true },
  });
  const actors = useQuery({
    queryKey: [...auditQueryRoot, "actors", { period, category, search: search || undefined }],
    queryFn: () => fetchAuditActors({ period, category, search: search || undefined }),
    enabled: canRead,
    meta: { silent: true },
  });
  const [selected, setSelected] = useState<OrganizationAuditEntryResponse | null>(null);

  if (!canRead) return <ForbiddenPage homePath="/org" />;

  const rows = audit.data?.pages.flatMap((page) => page.items) ?? [];
  const columns: Column<OrganizationAuditEntryResponse>[] = [
    { id: "occurredAtUtc", header: t("audit:columns.when"), type: "dateTime", value: (row) => row.occurredAtUtc },
    {
      id: "action", header: t("audit:columns.action"), type: "custom", mobile: "primary",
      cell: (row) => <button type="button" aria-label={t("audit:openDetails", { action: row.actionText })}
        className="text-left text-[var(--t1)] hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foco)]"
        onClick={() => setSelected(row)}>{row.actionText}</button>,
    },
    { id: "where", header: t("audit:columns.where"), type: "text", value: (row) => row.whereText, mobile: "status" },
    { id: "actor", header: t("audit:columns.who"), type: "text", value: (row) => row.actorDisplayName ?? row.actorText, mobile: "status" },
  ];
  const periodValue = period;
  return <>
    <Page icon={ScrollText} title={t("audit:title")} summary={t("audit:summary")}>
      <div className="flex flex-col gap-3">
        <FilterBar
          label={t("audit:filters.label")}
          searchLabel={t("audit:filters.search")}
          searchValue={pagination.search ?? ""}
          onSearchChange={pagination.setSearch}
          filters={[
            {
              key: "period", label: t("audit:filters.period"), menuLabel: t("audit:filters.periodMenu"),
              value: periodValue, active: filters.values.period !== undefined && periodValue !== "30",
              onChange: (value) => filters.setFilter("period", value === "30" ? undefined : value),
              options: [
                { value: "0", label: t("audit:period.today") },
                { value: "7", label: t("audit:period.days7") },
                { value: "30", label: t("audit:period.days30") },
                { value: "all", label: t("audit:period.all") },
              ],
            },
            {
              key: "category", label: t("audit:filters.category"), menuLabel: t("audit:filters.categoryMenu"),
              value: category ?? "all", active: category !== undefined,
              onChange: (value) => filters.setFilter("category", value === "all" ? undefined : value),
              options: [{ value: "all", label: t("audit:filters.category") }, ...auditCategories.map((value) => ({ value, label: t(`audit:categories.${value}`) }))],
            },
            {
              key: "actorId", label: t("audit:filters.actor"), menuLabel: t("audit:filters.actorMenu"),
              value: actorId ?? "all", active: actorId !== undefined,
              onChange: (value) => filters.setFilter("actorId", value === "all" ? undefined : value),
              options: [{ value: "all", label: t("audit:filters.actor") }, ...(actors.data ?? []).flatMap((actor) => actor.actorId ? [{ value: actor.actorId, label: actor.displayName ?? actor.actorText }] : [])],
            },
          ]}
          clearLabel={t("common:actions.clear")}
          onClear={filters.clear}
        />
        <Surface className="overflow-hidden">
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(row) => row.id}
            isLoading={audit.isPending}
            isFetching={audit.isFetching}
            error={audit.error ? audit.error instanceof ApiError ? audit.error.detail ?? t("common:states.error") : t("common:states.error") : undefined}
            onRetry={() => { void audit.refetch(); }}
            emptyTitle={t("audit:empty")}
          />
          <LoadMore hasMore={audit.hasNextPage} isLoading={audit.isFetchingNextPage} onLoadMore={() => { void audit.fetchNextPage(); }} />
        </Surface>
      </div>
    </Page>
    <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) setSelected(null); }}>
      <DialogContent className="md:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>{selected?.actionText ?? t("audit:details")}</DialogTitle>
          <DialogDescription>{selected ? t("audit:detailSummary", { actor: selected.actorDisplayName ?? selected.actorText, entity: selected.entityText }) : ""}</DialogDescription>
        </DialogHeader>
        {selected ? <div className="flex flex-col gap-3 px-5 pb-5">
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div><dt className="font-semibold text-[var(--t2)]">{t("audit:columns.when")}</dt><dd><DateText value={selected.occurredAtUtc} kind="dateTime" /></dd></div>
            <div><dt className="font-semibold text-[var(--t2)]">{t("audit:columns.about")}</dt><dd>{selected.entityText}</dd></div>
            <div><dt className="font-semibold text-[var(--t2)]">{t("audit:columns.where")}</dt><dd>{selected.whereText}</dd></div>
            {selected.affectedDisplayName ? <div><dt className="font-semibold text-[var(--t2)]">{t("audit:columns.affected")}</dt><dd>{selected.affectedDisplayName}</dd></div> : null}
            <div><dt className="font-semibold text-[var(--t2)]">{t("audit:columns.who")}</dt><dd>{selected.actorDisplayName ?? selected.actorText}</dd></div>
          </dl>
          {selected.changes.length ? <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--borde)]">
            {selected.changes.map((change) => <div key={change.field} className="grid gap-2 border-b border-[var(--borde)] p-3 last:border-b-0 sm:grid-cols-[1fr_1fr_1fr]">
              <span className="font-semibold text-[var(--t1)]">{change.field}</span>
              <span className="text-[var(--t2)]">{change.oldValue ?? t("audit:noValue")}</span>
              <span className="text-[var(--t1)]">{change.newValue ?? t("audit:noValue")}</span>
            </div>)}
          </div> : <p className="text-sm text-[var(--t2)]">{t("audit:noChanges")}</p>}
        </div> : null}
      </DialogContent>
    </Dialog>
  </>;
}
