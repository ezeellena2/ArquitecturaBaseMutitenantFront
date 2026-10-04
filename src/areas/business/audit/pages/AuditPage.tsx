import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { ClipboardList } from "lucide-react";
import { Fragment, useState } from "react";
import { useTranslation } from "react-i18next";
import { useCurrentUser } from "@/auth/useCurrentUser";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { useFilters } from "@/shared/hooks/useFilters";
import { usePagination } from "@/shared/hooks/usePagination";
import { ApiError } from "@/shared/api/ApiError";
import type { Column } from "@/shared/ui/DataTable";
import { DataTable } from "@/shared/ui/DataTable";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
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
    { id: "occurredAtUtc", header: t("audit:columns.when"), type: "custom", mobile: "status", className: "w-[162px] max-md:w-[25%]", cell: (row) => <div className="whitespace-normal text-left"><DateText value={row.occurredAtUtc} kind="dateTime" className="whitespace-normal" /></div> },
    {
      id: "action", header: t("audit:columns.action"), type: "custom", mobile: "primary",
      // Tablero Auditoria-Org: tocar «Qué pasó» abre el detalle; sin el ojo.
      cell: (row) => <button type="button" aria-label={t("audit:openDetails", { action: row.actionText })}
        className="block w-full truncate text-left text-[var(--t1)] hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foco)]"
        onClick={() => setSelected(row)}>{row.actionText}</button>,
    },
    // Columnas del tablero: 140px, 2.4fr, 1.4fr y 1.2fr, más los márgenes de cada celda; «Qué pasó» se lleva el resto.
    { id: "where", header: t("audit:columns.where"), type: "text", className: "w-[23%]", value: (row) => row.whereText },
    { id: "actor", header: t("audit:columns.who"), type: "text", className: "w-[20%]", value: (row) => row.actorDisplayName ?? row.actorText },
  ];
  const periodValue = period;
  // Como el tablero: cualquier filtro distinto de «Últimos 30 días» sin búsqueda ni tema ni persona cuenta.
  const filtered = Boolean(category || actorId || pagination.search || filters.values.period && period !== "30");
  return <>
    <Page icon={ClipboardList} title={t("audit:title")}>
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
              // Sin filtro el botón dice «Tema: todos» y el menú ofrece «Todos», como el tablero.
              value: category ?? "", active: category !== undefined,
              onChange: (value) => filters.setFilter("category", value === "all" ? undefined : value),
              options: [{ value: "all", label: t("audit:filters.allCategories") }, ...auditCategories.map((value) => ({ value, label: t(`audit:categories.${value}`) }))],
            },
            {
              key: "actorId", label: t("audit:filters.actor"), menuLabel: t("audit:filters.actorMenu"),
              value: actorId ?? "", active: actorId !== undefined,
              onChange: (value) => filters.setFilter("actorId", value === "all" ? undefined : value),
              options: [{ value: "all", label: t("audit:filters.allActors") }, ...(actors.data ?? []).flatMap((actor) => actor.actorId ? [{ value: actor.actorId, label: actor.displayName ?? actor.actorText }] : [])],
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
            emptyTitle={filtered ? t("audit:emptyFiltered") : t("audit:empty")}
            emptyAction={filtered ? <Button type="button" variant="outline" onClick={filters.clear}>{t("common:actions.clearFilters")}</Button> : undefined}
          />
          <LoadMore hasMore={audit.hasNextPage} isLoading={audit.isFetchingNextPage} onLoadMore={() => { void audit.fetchNextPage(); }} />
        </Surface>
      </div>
    </Page>
    <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) setSelected(null); }}>
      <DialogContent className="md:max-w-[640px]">
        {/* Tablero Auditoria-Org: qué pasó; Quién (nombre · correo), Dónde y cada cambio «antes → después». */}
        <DialogHeader>
          <DialogTitle>{selected?.actionText ?? t("audit:details")}</DialogTitle>
        </DialogHeader>
        {selected ? <div className="px-5 pb-5 pt-4"><dl className="grid grid-cols-[170px_minmax(0,1fr)] overflow-hidden rounded-[10px] border border-[var(--borde)] text-[13.5px] leading-[1.45] text-[var(--t1)] [&>:nth-child(-n+2)]:border-t-0">
          <dt className="border-r border-t border-[var(--borde)] bg-[var(--s2)] px-3.5 py-2.5 font-medium text-[var(--t2)]">{t("audit:columns.who")}</dt>
          <dd className="min-w-0 break-words border-t border-[var(--borde)] px-3.5 py-2.5">{[selected.actorDisplayName ?? selected.actorText, selected.actorEmail].filter(Boolean).join(" · ")}</dd>
          <dt className="border-r border-t border-[var(--borde)] bg-[var(--s2)] px-3.5 py-2.5 font-medium text-[var(--t2)]">{t("audit:columns.where")}</dt>
          <dd className="min-w-0 break-words border-t border-[var(--borde)] px-3.5 py-2.5">{selected.whereText}</dd>
          {selected.changes.map((change) => <Fragment key={change.field}>
            <dt className="border-r border-t border-[var(--borde)] bg-[var(--s2)] px-3.5 py-2.5 font-medium text-[var(--t2)]">{change.field}</dt>
            <dd className="min-w-0 break-words border-t border-[var(--borde)] px-3.5 py-2.5">{change.oldValue ? <><span className="text-[var(--t3)] line-through">{change.oldValue}</span>{" → "}</> : null}{change.newValue ?? t("audit:noValue")}</dd>
          </Fragment>)}
        </dl></div> : null}
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  </>;
}
