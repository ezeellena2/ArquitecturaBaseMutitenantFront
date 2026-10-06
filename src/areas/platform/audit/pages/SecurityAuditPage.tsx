import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { PlatformAuditEventResponse } from "@/shared/api/types";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import { useCursorList } from "@/shared/hooks/useCursorList";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { useFilters } from "@/shared/hooks/useFilters";
import { usePagination } from "@/shared/hooks/usePagination";
import { ClipboardIcon } from "@/shared/ui/icons";
import { Button } from "@/shared/ui/button";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { DetailGrid } from "@/shared/ui/DetailGrid";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { FilterBar } from "@/shared/ui/FilterBar";
import { LoadMore } from "@/shared/ui/LoadMore";
import { Page } from "@/shared/ui/Page";
import { Surface } from "@/shared/ui/Surface";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { ListRow } from "@/shared/ui/app/ListRow";
import { DateText } from "@/shared/ui/format/DateText";
import { EmptyValue } from "@/shared/ui/format/EmptyValue";
import { fetchAuditOrganizations, fetchSecurityEvents, securityEventsQueryRoot } from "../api/securityEvents";

const auditFilterKeys = ["period", "type", "tenantId", "accountId"] as const;
const eventTypes = ["signins", "organizations", "accounts", "operators", "settings"] as const;

export function SecurityAuditPage() {
  const { t } = useTranslation(["platformAudit", "common"]);
  const filters = useFilters(auditFilterKeys);
  // El listado es por cursor; usePagination aporta sólo la búsqueda en la URL.
  const pagination = usePagination();
  const search = useDebouncedValue(pagination.search ?? "");
  const period = filters.values.period ?? "30";
  const type = filters.values.type;
  const tenantId = filters.values.tenantId;
  const accountId = filters.values.accountId;
  const baseQuery = { period, type, tenantId, accountId, search: search || undefined };
  const audit = useCursorList([...securityEventsQueryRoot, baseQuery],
    (after) => fetchSecurityEvents({ ...baseQuery, after: after ?? undefined, limit: 25 }),
    { meta: { silent: true, blocksView: true } });
  // Las opciones cruzan los otros filtros y nunca su propio tenantId, cursor o límite.
  const organizationQuery = { period, type, accountId, search: search || undefined };
  const organizations = useQuery({
    queryKey: [...securityEventsQueryRoot, "organizations", organizationQuery],
    queryFn: () => fetchAuditOrganizations(organizationQuery),
    meta: { silent: true },
  });
  const scope = JSON.stringify({ period, type, tenantId, accountId, search: pagination.search });
  const [selection, setSelection] = useState<{ scope: string; event: PlatformAuditEventResponse } | null>(null);
  // La selección pertenece a los filtros que la abrieron, incluso durante el debounce.
  if (selection && selection.scope !== scope) setSelection(null);
  const selected = selection?.scope === scope ? selection.event : null;
  const select = (event: PlatformAuditEventResponse) => setSelection({ scope, event });
  const { phone } = useAppChrome();
  const filtered = Boolean(type || tenantId || accountId || pagination.search || period !== "30");

  const columns: Column<PlatformAuditEventResponse>[] = [
    // Fecha copiada de AuditPage; las otras columnas usan la distribución común de DataTable.
    { id: "occurredAtUtc", header: t("columns.when"), type: "custom", mobile: "status", className: "w-[162px] max-md:w-[25%]",
      cell: (row) => <div className="whitespace-normal text-left"><DateText value={row.occurredAtUtc} kind="dateTime" className="whitespace-normal" /></div> },
    { id: "summary", header: t("columns.summary"), type: "custom", mobile: "primary",
      cell: (row) => <button type="button" aria-label={t("openDetails", { summary: row.summary })}
        className="block w-full truncate text-left text-[var(--t1)] hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foco)]"
        onClick={() => select(row)}>{row.summary}</button> },
    { id: "target", header: t("columns.target"), type: "text", value: (row) => row.target },
    { id: "actor", header: t("columns.actor"), type: "text", value: (row) => row.actor },
    { id: "reason", header: t("columns.reason"), type: "text", value: (row) => row.reason },
  ];

  return <>
    <Page icon={ClipboardIcon} title={t("title")} phoneBody="flush">
      <div className="flex flex-col gap-3 md:gap-3.5">
        <FilterBar phoneTools="filter" label={t("filters.label")} searchLabel={t("filters.search")}
          searchValue={pagination.search ?? ""} onSearchChange={pagination.setSearch}
          filters={[
            { key: "period", label: t("filters.period"), menuLabel: t("filters.periodMenu"), value: period,
              active: period !== "30", onChange: (value) => filters.setFilter("period", value === "30" ? undefined : value),
              options: [{ value: "0", label: t("period.today") }, { value: "7", label: t("period.days7") },
                { value: "30", label: t("period.days30") }, { value: "all", label: t("period.all") }] },
            { key: "type", label: t("filters.type"), menuLabel: t("filters.typeMenu"), value: type ?? "", active: type !== undefined,
              onChange: (value) => filters.setFilter("type", value === "all" ? undefined : value),
              options: [{ value: "all", label: t("filters.allTypes") }, ...eventTypes.map((value) => ({ value, label: t(`types.${value}`) }))] },
            { key: "organization", label: t("filters.organization"), menuLabel: t("filters.organizationMenu"), value: tenantId ?? "", active: tenantId !== undefined,
              onChange: (value) => filters.setFilter("tenantId", value === "all" ? undefined : value),
              options: [{ value: "all", label: t("filters.allOrganizations") }, ...(organizations.data ?? []).map((organization) => ({ value: organization.id, label: organization.name }))] },
          ]} clearLabel={t("common:actions.clear")} onClear={filters.clear} />
        <Surface className="overflow-hidden" phoneFlush>
          <DataTable columns={columns} rows={audit.items} rowKey={(row) => row.id}
            mobileRow={(row) => <ListRow key={row.id} wrapTitle title={row.summary} onClick={() => select(row)}
              meta={<DateText value={row.occurredAtUtc} kind="shortDateTime" />}
              lines={[[row.target, row.actor].filter(Boolean).join(" · "), ...(row.reason ? [row.reason] : [])]} />}
            isLoading={audit.isPending} isFetching={audit.isFetching}
            error={audit.error ? apiErrorMessage(audit.error, t) : undefined} onRetry={() => { void audit.refetch(); }}
            emptyTitle={filtered ? t("emptyFiltered") : t("empty")}
            emptyAction={filtered ? <Button type="button" variant="outline" onClick={filters.clear}>{t("common:actions.clearFilters")}</Button> : undefined} />
          <LoadMore hasMore={audit.hasNextPage} isLoading={audit.isFetchingNextPage} onLoadMore={() => { void audit.fetchNextPage(); }} />
        </Surface>
      </div>
    </Page>
    <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) setSelection(null); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>{selected?.summary ?? t("details")}</DialogTitle></DialogHeader>
        {selected ? <DetailGrid phone={phone} items={[
          { key: "when", label: t("columns.when"), value: <DateText value={selected.occurredAtUtc} kind="dateTime" /> },
          { key: "target", label: t("columns.target"), value: selected.target },
          { key: "actor", label: t("columns.actor"), value: [selected.actor, selected.actorRole].filter(Boolean).join(" · ") },
          { key: "reason", label: t("columns.reason"), value: selected.reason ?? <EmptyValue /> },
          { key: "ip", label: t("columns.ip"), value: selected.ipAddress ?? <EmptyValue /> },
        ]} /> : null}
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  </>;
}
