import { Copy, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import { useFormat } from "@/shared/format/useFormat";
import { usePagedQuery } from "@/shared/hooks/usePagedQuery";
import type { ModuleContentProps } from "@/shared/modules/types";
import { Button } from "@/shared/ui/button";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { FilterBar } from "@/shared/ui/FilterBar";
import { BanIcon } from "@/shared/ui/icons";
import { Page, SublineSeparator } from "@/shared/ui/Page";
import { Pagination } from "@/shared/ui/Pagination";
import { RowActions } from "@/shared/ui/RowActions";
import { Surface } from "@/shared/ui/Surface";
import { BroadcastsIcon } from "../../components/icons";
import type { WhatsAppBroadcastResponse, WhatsAppBroadcastStatus } from "../../api/types";
import { broadcastsQueryKey, fetchBroadcasts, type BroadcastsQuery } from "../api/broadcasts";
import { broadcastPhoneRow, createBroadcastColumns, newBroadcastPath } from "../columns";
import { countOf } from "../../lib/values";
import { useBroadcastActions } from "../lib/useBroadcastActions";

const broadcastFilterKeys = ["status"] as const;
// Orden del filtro «Estado» del tablero WA-Difusiones: todos y después cada estado.
const statuses: readonly (WhatsAppBroadcastStatus | undefined)[] = [undefined, "Scheduled", "Sending", "Sent", "Cancelled"];
const allValue = "all";

/**
 * Difusiones (tableros WA-Difusiones y M-WA-Difusiones): la banda con cuántas hay y cuántas están programadas (CC07), el
 * buscador con el filtro «Estado» en la URL (CC16) y la tabla paginada por el back. Cada fila se duplica y, si está programada, se cancela.
 */
export function BroadcastsPage(_props: ModuleContentProps) {
  const { t } = useTranslation(["whatsapp", "common"]);
  const format = useFormat();
  const { filters, pagination, query, result: broadcasts, paginationProps } = usePagedQuery({
    filterKeys: broadcastFilterKeys,
    toQuery: (page, values): BroadcastsQuery => ({ ...page, status: statuses.find((status) => status !== undefined && status === values.status) }),
    queryKey: broadcastsQueryKey, queryFn: fetchBroadcasts, meta: { silent: true, blocksView: true },
  });
  const actions = useBroadcastActions();
  const data = broadcasts.data;
  const filtered = Boolean(query.status || pagination.search);

  const rowActions = (broadcast: WhatsAppBroadcastResponse) => <RowActions label={t("whatsapp:broadcasts.rowActions", { name: broadcast.name })} title={broadcast.name} actions={[
    { label: t("whatsapp:broadcasts.actions.duplicate"), accessibleName: t("whatsapp:broadcasts.actions.duplicate"), icon: Copy, onSelect: () => actions.duplicate(broadcast) },
    { label: t("whatsapp:broadcasts.actions.cancel"), accessibleName: t("whatsapp:broadcasts.actions.cancel"), icon: BanIcon, destructive: true,
      hidden: broadcast.status !== "Scheduled", onSelect: (trigger) => actions.askCancel(broadcast, trigger) },
  ]} />;
  const columns: Column<WhatsAppBroadcastResponse>[] = [
    ...createBroadcastColumns(t, format),
    { id: "actions", header: t("whatsapp:broadcasts.columns.actions"), type: "actions", cell: rowActions },
  ];
  // «3 difusiones · 1 programada»: sin programadas, solo cuántas hay (tablero WA-Difusiones, «Cancelada»).
  const summary = data ? <>
    <span>{t("whatsapp:broadcasts.summaryTotal", countOf(format, data.totalCount))}</span>
    {data.scheduled > 0 ? <><SublineSeparator /><span>{t("whatsapp:broadcasts.summaryScheduled", countOf(format, data.scheduled))}</span></> : null}
  </> : undefined;

  return <>
    <Page icon={BroadcastsIcon} title={t("whatsapp:broadcasts.title")} summary={summary} phoneBody="flush"
      fab={{ label: t("whatsapp:broadcasts.new"), to: newBroadcastPath }}
      actions={<Button asChild><Link to={newBroadcastPath}><Plus aria-hidden="true" className="size-3.5" strokeWidth={2.25} />{t("whatsapp:broadcasts.new")}</Link></Button>}>
      <div className="flex flex-col gap-3 md:gap-3.5">
        <FilterBar label={t("whatsapp:broadcasts.filters.label")} searchLabel={t("whatsapp:broadcasts.filters.search")}
          searchValue={pagination.search ?? ""} onSearchChange={pagination.setSearch}
          filters={[{ key: "status", label: t("whatsapp:broadcasts.filters.status"), menuLabel: t("whatsapp:broadcasts.filters.statusMenu"),
            value: query.status ?? "", active: query.status !== undefined, onChange: (value) => filters.setFilter("status", value === allValue ? undefined : value),
            options: statuses.map((status) => ({ value: status ?? allValue, label: status ? format.formatEnum("WhatsAppBroadcastStatus", status) : t("whatsapp:broadcasts.filters.allStatuses") })) }]}
          clearLabel={t("common:actions.clearFilters")} onClear={filters.clear} />
        <Surface className="overflow-hidden" phoneFlush>
          <DataTable columns={columns} rows={data?.items ?? []} rowKey={(broadcast) => broadcast.id}
            mobileRow={(broadcast) => broadcastPhoneRow(broadcast, t, format, rowActions(broadcast))}
            isLoading={broadcasts.isPending} isFetching={broadcasts.isFetching}
            error={broadcasts.error ? apiErrorMessage(broadcasts.error, t) : undefined} onRetry={() => { void broadcasts.refetch(); }}
            emptyTitle={filtered ? t("whatsapp:broadcasts.empty.filtered") : t("whatsapp:broadcasts.empty.all")}
            emptyAction={filtered ? <Button type="button" variant="outline" onClick={filters.clear}>{t("common:actions.clearFilters")}</Button> : undefined} />
          {paginationProps ? <Pagination {...paginationProps} /> : null}
        </Surface>
      </div>
    </Page>
    {actions.dialog}
  </>;
}
