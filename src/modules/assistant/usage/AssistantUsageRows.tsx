import { useTranslation } from "react-i18next";
import type { AssistantUsageRowResponse } from "@/shared/api/types";
import type { Column } from "@/shared/ui/DataTable";
import { DataTable } from "@/shared/ui/DataTable";
import { ListRow } from "@/shared/ui/app/ListRow";
import { DateText } from "@/shared/ui/format/DateText";
import { EmptyValue } from "@/shared/ui/format/EmptyValue";
import { EnumText } from "@/shared/ui/format/EnumText";
import { MoneyText } from "@/shared/ui/format/MoneyText";
import { NumberText } from "@/shared/ui/format/NumberText";
import { Surface } from "@/shared/ui/Surface";
import { BudgetProgress } from "./AssistantUsageSummary";

function TodayUsage({ row }: { row: AssistantUsageRowResponse }) {
  const { t } = useTranslation("assistant"); const daily = row.dailyUsage;
  return daily ? <span><NumberText value={daily.queries} /> {t("usage.of")} <NumberText value={daily.limit} />{daily.limitReached ? <>{" · "}{t("usage.limitReached")}</> : null}</span> : <EmptyValue />;
}

function RowBudget({ row }: { row: AssistantUsageRowResponse }) {
  const { t } = useTranslation("assistant");
  if (row.monthlyBudget == null) return <EmptyValue />;
  return <div className="flex flex-col gap-1"><span>{t(row.fundingMode === "OwnKey" ? "usage.ownBudget" : "usage.of")} <MoneyText value={row.monthlyBudget} /></span><BudgetProgress progress={row.budgetProgress} /></div>;
}

/** Dos filas de una organización con distintas claves son dos filas históricas, sin sumar ni fusionar. */
function usageRowKey(row: AssistantUsageRowResponse): string {
  return JSON.stringify([row.kind, row.organizationId, row.personId, row.day, row.fundingMode]);
}

export function AssistantUsageRows({ rows, platform, group, fetching, error, retry }: { rows: readonly AssistantUsageRowResponse[]; platform: boolean; group: "day" | "person"; fetching: boolean; error?: string; retry: () => void }) {
  const { t } = useTranslation("assistant");
  const columns: Column<AssistantUsageRowResponse>[] = platform ? [
    { id: "displayName", header: t("usage.organization"), type: "text", value: (row) => row.displayName, mobile: "primary" },
    { id: "fundingMode", header: t("usage.key"), type: "enum", enum: "AssistantMode", value: (row) => row.fundingMode },
    { id: "queries", header: t("usage.queries"), type: "integer", value: (row) => row.queries },
    { id: "cost", header: t("usage.cost"), type: "custom", className: "text-right tabular-nums", cell: (row) => <MoneyText value={row.cost} className={row.fundingMode === "OwnKey" ? "text-[var(--t3)]" : undefined} /> },
    { id: "monthlyBudget", header: t("usage.monthlyBudget"), type: "custom", cell: (row) => <RowBudget row={row} /> },
  ] : group === "day" ? [
    { id: "day", header: t("usage.day"), type: "date", value: (row) => row.day, mobile: "primary" },
    { id: "queries", header: t("usage.queries"), type: "integer", value: (row) => row.queries },
    { id: "peopleCount", header: t("usage.people"), type: "integer", value: (row) => row.peopleCount },
    { id: "cost", header: t("usage.cost"), type: "money", value: (row) => row.cost },
  ] : [
    { id: "displayName", header: t("usage.person"), type: "text", value: (row) => row.displayName, mobile: "primary" },
    { id: "dailyUsage", header: t("usage.todayQueries"), type: "custom", cell: (row) => <TodayUsage row={row} /> },
    { id: "queries", header: t("usage.monthQueries"), type: "integer", value: (row) => row.queries },
    { id: "cost", header: t("usage.monthCost"), type: "money", value: (row) => row.cost },
  ];
  return <Surface phoneFlush><DataTable columns={columns} rows={rows} rowKey={usageRowKey} isFetching={fetching} emptyTitle={t("usage.empty")} error={error} onRetry={retry}
    mobileRow={(row) => <ListRow title={row.kind === "day" ? <DateText value={row.day} kind="shortDate" /> : row.displayName}
      lines={[platform ? <><NumberText value={row.queries} /> {t("usage.queriesNoun", { count: row.queries })}{" · "}<EnumText enum="AssistantMode" value={row.fundingMode} />{row.fundingMode === "OwnKey" && row.monthlyBudget ? <>{" · "}{t("usage.ownBudget")} <MoneyText value={row.monthlyBudget} /></> : null}</>
        : group === "day" ? <><NumberText value={row.queries} /> {t("usage.queriesNoun", { count: row.queries })}{" · "}<NumberText value={row.peopleCount} /> {t("usage.peopleNoun", { count: row.peopleCount ?? undefined })}</>
          : <>{t("usage.today")} <TodayUsage row={row} />{" · "}<NumberText value={row.queries} /> {t("usage.inMonth")}</>]}
      wrapLines trailing={<MoneyText value={row.cost} className={`pr-3 text-[14px] ${platform && row.fundingMode === "OwnKey" ? "text-[var(--t3)]" : ""}`} />} />} />
  </Surface>;
}
