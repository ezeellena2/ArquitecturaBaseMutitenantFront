import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { OrganizationAssistantUsageQuery } from "@/shared/api/types";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import { useFormat } from "@/shared/format/useFormat";
import { useFilters } from "@/shared/hooks/useFilters";
import { usePagination } from "@/shared/hooks/usePagination";
import type { ModuleContentProps } from "@/shared/modules/types";
import { LoadErrorPage } from "@/shared/ui/LoadErrorPage";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Page } from "@/shared/ui/Page";
import { Pagination } from "@/shared/ui/Pagination";
import { Surface } from "@/shared/ui/Surface";
import { MonthField } from "@/shared/ui/fields/MonthField";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { assistantUsageQueryKey, fetchAssistantUsage } from "../api/usage";
import { AssistantUsageRows } from "./AssistantUsageRows";
import { AssistantUsageSummary } from "./AssistantUsageSummary";

const filterKeys = ["month", "groupBy"] as const;

/** El resumen y sus filas pertenecen a una única respuesta mensual, también al cambiar mes/página. */
export function AssistantUsagePage({ me }: ModuleContentProps) {
  const { t } = useTranslation("assistant"); const format = useFormat();
  const filters = useFilters(filterKeys); const pagination = usePagination();
  const platform = me.access === "platform";
  const group = filters.values.groupBy === "person" ? "person" : "day";
  const rawMonth = filters.values.month ?? (format.isLoading ? "" : format.getCurrentMonth());
  let month: string | null = null;
  try { month = format.parseMonth(rawMonth); } catch { /* El selector central muestra el período inválido. */ }
  const scope = { access: me.access, tenantId: me.activeTenantId ?? null, userId: me.id };
  const request: OrganizationAssistantUsageQuery = { month: month ?? "", page: pagination.page, pageSize: pagination.pageSize,
    ...(platform ? {} : { groupBy: group }) };
  const query = useQuery({ queryKey: assistantUsageQueryKey(scope, request), queryFn: ({ signal }) => fetchAssistantUsage(scope, request, signal),
    enabled: !format.isLoading && month !== null, placeholderData: keepPreviousData, meta: { silent: true, blocksView: true } });
  const previousGroup = query.isPlaceholderData && !platform && query.data?.rows.items.some((row) => row.kind !== group);
  const data = month === null || previousGroup ? undefined : query.data;
  const rows = data?.rows;
  const { page: currentPage, setPage } = pagination;
  const hasRows = rows !== undefined && rows.totalCount > 0;
  const error = query.isError ? apiErrorMessage(query.error, t) : undefined;
  const retry = () => { void query.refetch(); };
  // Copia la corrección de usePagedQuery usando los metadatos publicados del listado anidado.
  useEffect(() => {
    if (!query.isPlaceholderData && rows?.items.length === 0 && rows.totalCount > 0 && rows.totalPages && rows.totalPages !== currentPage) setPage(rows.totalPages);
  }, [query.isPlaceholderData, rows, currentPage, setPage]);
  if (!data && query.isError && month !== null) return <LoadErrorPage screen={t("usage.title")} onRetry={() => { void query.refetch(); }} />;
  const list = data ? <>
    {!platform || hasRows ? <AssistantUsageSummary data={data} platform={platform} /> : null}
    {!hasRows && !query.isError ? <Surface phoneFlush><EmptyState title={t("usage.empty")} framed={false} /></Surface>
      : platform ? <AssistantUsageRows rows={data.rows.items} platform group={group} fetching={query.isFetching} error={error} retry={retry} />
      : <Tabs value={group} onValueChange={(value) => filters.setFilter("groupBy", value === "person" ? "person" : undefined)}>
        <TabsList aria-label={t("usage.grouping")} className="max-md:px-5"><TabsTrigger value="day">{t("usage.byDay")}</TabsTrigger><TabsTrigger value="person">{t("usage.byPerson")}</TabsTrigger></TabsList>
        <TabsContent value={group}><AssistantUsageRows rows={data.rows.items} platform={false} group={group} fetching={query.isFetching} error={error} retry={retry} /></TabsContent>
      </Tabs>}
    {hasRows && rows?.totalPages !== undefined && rows.hasPrevious !== undefined && rows.hasNext !== undefined ? <Pagination page={rows.page} pageSize={rows.pageSize}
      totalCount={rows.totalCount} totalPages={rows.totalPages} hasPrevious={rows.hasPrevious} hasNext={rows.hasNext}
      onPageChange={pagination.setPage} onPageSizeChange={pagination.setPageSize} /> : null}
  </> : month !== null ? <p role="status" className="max-md:px-5">{t("loading")}</p> : null;
  return <Page icon={Sparkles} title={t("usage.title")} summary={data ? format.formatMonth(data.month) : undefined} phoneBody="flush"
    phoneSubtitle={data ? `${t("title")} · ${format.formatMonth(data.month)}` : t("title")}
    actions={<MonthField value={rawMonth || null} aria-label={t("usage.month")} onChange={(value) => filters.setFilter("month", value ?? undefined)} />}>
    <div className="flex flex-col gap-3.5">{list}</div>
  </Page>;
}
