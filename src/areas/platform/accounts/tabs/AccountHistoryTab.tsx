import { useTranslation } from "react-i18next";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import type { PlatformAuditEventResponse } from "@/shared/api/types";
import { useCursorList } from "@/shared/hooks/useCursorList";
import { ListRow } from "@/shared/ui/app/ListRow";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { DateText } from "@/shared/ui/format/DateText";
import { EmptyValue } from "@/shared/ui/format/EmptyValue";
import { LoadMore } from "@/shared/ui/LoadMore";
import { Surface } from "@/shared/ui/Surface";
import { accountHistoryQueryKey, fetchAccountHistory } from "../api/accounts";

export function AccountHistoryTab({ id }: { id: string }) {
  const { t } = useTranslation(["platformAccounts", "common"]);
  const history = useCursorList(accountHistoryQueryKey(id), (after) => fetchAccountHistory(id, after), { meta: { silent: true } });
  const columns: Column<PlatformAuditEventResponse>[] = [
    { id: "occurredAtUtc", header: t("platformAccounts:detail.historyColumns.when"), type: "dateTime", value: (row) => row.occurredAtUtc },
    { id: "summary", header: t("platformAccounts:detail.historyColumns.what"), type: "text", mobile: "primary", value: (row) => row.summary },
    { id: "actor", header: t("platformAccounts:detail.historyColumns.who"), type: "text", value: (row) => row.actor },
    { id: "reason", header: t("platformAccounts:detail.historyColumns.reason"), type: "text", value: (row) => row.reason },
  ];
  return <Surface className="overflow-hidden" phoneFlush>
    <DataTable columns={columns} rows={history.items} rowKey={(row) => row.id}
      mobileRow={(row) => <ListRow key={row.id} wrapTitle title={row.summary} meta={<DateText value={row.occurredAtUtc} kind="shortDateTime" />} lines={[row.actor, row.reason || <EmptyValue key="reason" />]} />}
      isLoading={history.isPending} isFetching={history.isFetching} error={history.error ? apiErrorMessage(history.error, t) : undefined}
      onRetry={() => { void history.refetch(); }} emptyTitle={t("platformAccounts:detail.historyEmpty")} />
    <LoadMore hasMore={history.hasNextPage} isLoading={history.isFetchingNextPage} onLoadMore={() => { void history.fetchNextPage(); }} />
  </Surface>;
}
