import { Trans, useTranslation } from "react-i18next";
import type { AssistantStateResponse } from "@/modules/assistant/api/types";
import { DateText } from "@/shared/ui/format/DateText";
import { NumberText } from "@/shared/ui/format/NumberText";
import { Button } from "@/shared/ui/button";

export function LimitReached({ monthly, state, organizationName, onUsage }: { monthly: boolean; state: AssistantStateResponse; organizationName?: string; onUsage?: () => void }) {
  const { t } = useTranslation("assistant");
  return <div role="status" className="flex flex-wrap items-center gap-3 rounded-xl bg-[var(--alerta-t)] px-4 py-3 text-[var(--alerta-tx)]">
    <span>{monthly ? t("limit.monthly", { organization: organizationName ?? t("limit.organization") }) : <Trans ns="assistant" i18nKey="limit.daily" components={{ count: <NumberText value={state.dailyLimit} />, reset: <DateText value={state.dailyResetAtUtc} kind="time" /> }} />}</span>
    {monthly && onUsage ? <Button variant="link" onClick={onUsage}>{t("limit.usage")}</Button> : null}
  </div>;
}
