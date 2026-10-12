import { useTranslation } from "react-i18next";
import type { AssistantBudgetProgressResponse, AssistantUsagePageResponse } from "@/shared/api/types";
import { defineStatusTones } from "@/shared/format/statusTones";
import { useFormat } from "@/shared/format/useFormat";
import { MoneyText } from "@/shared/ui/format/MoneyText";
import { NumberText } from "@/shared/ui/format/NumberText";
import { PercentText } from "@/shared/ui/format/PercentText";
import { StatusBadge } from "@/shared/ui/format/StatusBadge";
import { Surface } from "@/shared/ui/Surface";

const assistantBudgetTones = defineStatusTones("AssistantBudgetStatus", { WithinLimit: "neutral", NearLimit: "warning", LimitReached: "danger" });

export function BudgetProgress({ progress }: { progress: AssistantBudgetProgressResponse | null }) {
  const { t } = useTranslation("assistant"); const format = useFormat();
  if (!progress) return null;
  return <div className="flex flex-wrap items-center gap-2">
    {/* El navegador dibuja la fracción publicada; el texto conserva valores superiores a uno. */}
    <progress max={1} value={progress.fraction} aria-label={t("usage.progress")} aria-valuetext={format.formatPercent(progress.fraction)}
      className={`h-2 min-w-20 flex-1 overflow-hidden rounded-full appearance-none [&::-webkit-progress-bar]:bg-[var(--s2)] ${progress.status === "NearLimit" ? "[&::-webkit-progress-value]:bg-[var(--punto-alerta)] [&::-moz-progress-bar]:bg-[var(--punto-alerta)]" : progress.status === "LimitReached" ? "[&::-webkit-progress-value]:bg-[var(--peligro)] [&::-moz-progress-bar]:bg-[var(--peligro)]" : "[&::-webkit-progress-value]:bg-[var(--marca)] [&::-moz-progress-bar]:bg-[var(--marca)]"}`} />
    <PercentText value={progress.fraction} className="sr-only" />
    {progress.status !== "WithinLimit" ? <StatusBadge tones={assistantBudgetTones} value={progress.status} /> : null}
  </div>;
}

export function AssistantUsageSummary({ data, platform }: { data: AssistantUsagePageResponse; platform: boolean }) {
  const { t } = useTranslation("assistant");
  if (platform) return <div role="group" aria-label={t("usage.summary")} className="grid grid-cols-2 gap-3.5 max-md:px-5 max-md:py-4 md:grid-cols-3">
    <Surface className="flex flex-col gap-1 p-4"><span className="text-[var(--t2)]">{t("usage.platformCost")}</span><strong className="text-2xl"><MoneyText value={data.platformKeyCost} /></strong></Surface>
    <Surface className="flex flex-col gap-1 p-4"><span className="text-[var(--t2)]">{t("usage.queries")}</span><strong className="text-2xl"><NumberText value={data.totalQueries} /></strong></Surface>
    <Surface className="flex flex-col gap-1 p-4 max-md:hidden"><span className="text-[var(--t2)]">{t("usage.organizations")}</span><strong className="text-2xl"><NumberText value={data.organizationCount} /></strong></Surface>
  </div>;
  return <Surface role="group" aria-label={t("usage.summary")} className="max-md:mx-5 max-md:my-4"><div className="flex flex-col gap-3 p-4">
    {/* El resumen puede agregar ambas claves; no atribuye financiación ni una cuota global. */}
    <strong className="max-md:hidden">{t(data.budget == null ? "usage.cost" : "usage.monthlyBudget")}</strong>
    <div className="text-xl font-semibold"><MoneyText value={data.cost} />{data.budget != null ? <> {t("usage.of")} <MoneyText value={data.budget} /></> : null}</div>
    <BudgetProgress progress={data.budgetProgress} />
    <div className="flex flex-wrap gap-x-5 text-[var(--t2)]"><span><NumberText value={data.totalQueries} /> {t("usage.queriesNoun", { count: data.totalQueries })}</span><span><NumberText value={data.peopleCount} /> {t("usage.peopleNoun", { count: data.peopleCount })}</span></div>
  </div></Surface>;
}
