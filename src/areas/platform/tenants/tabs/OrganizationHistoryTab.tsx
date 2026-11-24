import { useTranslation } from "react-i18next";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import { ListCard } from "@/shared/ui/app/ListRow";
import { DataTable } from "@/shared/ui/DataTable";
import { DateText } from "@/shared/ui/format/DateText";
import { EmptyValue } from "@/shared/ui/format/EmptyValue";
import { LoadMore } from "@/shared/ui/LoadMore";
import { Surface } from "@/shared/ui/Surface";
import { createOrganizationHistoryColumns } from "../columns";
import { useOrganizationHistory } from "./useOrganizationHistory";

export function OrganizationHistoryTab({ id }: { id: string }) {
  const { t } = useTranslation(["platformTenants", "common"]);
  const history = useOrganizationHistory(id);
  return <Surface className="overflow-hidden" phoneFlush>
    <DataTable columns={createOrganizationHistoryColumns(t)} rows={history.items} rowKey={(row) => row.id}
      // 263: en el teléfono cada evento es una tarjeta con la fecha y hora, quién y, si lo hay, el motivo, cada dato con el
      // nombre de su columna (como M-Auditoria-Plat en M-Filas-Base2).
      mobileRow={(row) => <ListCard key={row.id} title={row.action} fields={[
        { label: t("platformTenants:detail.historyColumns.when"), value: <DateText value={row.occurredAtUtc} kind="dateTime" />, wide: true },
        { label: t("platformTenants:detail.historyColumns.who"), value: row.actor || <EmptyValue /> },
        ...(row.reason ? [{ label: t("platformTenants:detail.historyColumns.reason"), value: row.reason, wide: true }] : []),
      ]} />}
      isLoading={history.isPending} isFetching={history.isFetching} error={history.error ? apiErrorMessage(history.error, t) : undefined}
      onRetry={() => { void history.refetch(); }} emptyTitle={t("platformTenants:detail.historyEmpty")} />
    <LoadMore hasMore={history.hasNextPage} isLoading={history.isFetchingNextPage} onLoadMore={() => { void history.fetchNextPage(); }} />
  </Surface>;
}
