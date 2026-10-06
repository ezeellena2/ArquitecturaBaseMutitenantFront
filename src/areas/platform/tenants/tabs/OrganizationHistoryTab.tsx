import { useTranslation } from "react-i18next";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import { ListRow } from "@/shared/ui/app/ListRow";
import { DataTable } from "@/shared/ui/DataTable";
import { DateText } from "@/shared/ui/format/DateText";
import { LoadMore } from "@/shared/ui/LoadMore";
import { Surface } from "@/shared/ui/Surface";
import { createOrganizationHistoryColumns } from "../columns";
import { useOrganizationHistory } from "./useOrganizationHistory";

export function OrganizationHistoryTab({ id }: { id: string }) {
  const { t } = useTranslation(["platformTenants", "common"]);
  const history = useOrganizationHistory(id);
  return <Surface className="overflow-hidden" phoneFlush>
    <DataTable columns={createOrganizationHistoryColumns(t)} rows={history.items} rowKey={(row) => row.id}
      mobileRow={(row) => <ListRow key={row.id} wrapTitle title={row.action} meta={<DateText value={row.occurredAtUtc} kind="shortDateTime" />}
        lines={[[row.actor, row.reason].filter(Boolean).join(" · ")]} />}
      isLoading={history.isPending} isFetching={history.isFetching} error={history.error ? apiErrorMessage(history.error, t) : undefined}
      onRetry={() => { void history.refetch(); }} emptyTitle={t("platformTenants:detail.historyEmpty")} />
    <LoadMore hasMore={history.hasNextPage} isLoading={history.isFetchingNextPage} onLoadMore={() => { void history.fetchNextPage(); }} />
  </Surface>;
}
