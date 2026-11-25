import { Trans, useTranslation } from "react-i18next";
import type { AssistantStateResponse } from "@/modules/assistant/api/types";
import { DateInTimeZoneText } from "@/shared/ui/format/DateInTimeZoneText";
import { NumberText } from "@/shared/ui/format/NumberText";
import { InfoTip } from "@/shared/ui/InfoTip";
import { Button } from "@/shared/ui/button";

/**
 * El tope del asistente, que dice por qué corta (270 y 271, tableros Asistente-*-Base2). El del día es de la persona en
 * esa organización, también con la clave de la plataforma; fuera de una, de la persona. La hora de `dailyResetAtUtc` se
 * dice en la zona en que corta el cupo, `dailyResetTimeZoneId`: la de la organización («hora de Grupo Delta») o, fuera de
 * una, la del perfil.
 */
export function LimitReached({ monthly, state, organizationName, inOrganization = false, onUsage }: { monthly: boolean; state: AssistantStateResponse; organizationName?: string; inOrganization?: boolean; onUsage?: () => void }) {
  const { t } = useTranslation("assistant");
  const zone = state.dailyResetTimeZoneId;
  const components = { count: <NumberText value={state.dailyLimit} />, date: <DateInTimeZoneText value={state.dailyResetAtUtc} timeZone={zone} />,
    time: <DateInTimeZoneText value={state.dailyResetAtUtc} timeZone={zone} kind="time" /> };
  const organization = organizationName ?? t("limit.organization");
  return <div role="status" className="flex flex-wrap items-center gap-3 rounded-xl bg-[var(--alerta-t)] px-4 py-3 text-[var(--alerta-tx)]">
    {monthly ? <span>{t("limit.monthly", { organization })}</span>
      : inOrganization ? <span className="inline-flex flex-wrap items-center gap-1"><span><Trans ns="assistant" i18nKey="limit.dailyOrganization" values={{ organization }} components={components} /></span><InfoTip text={t("limit.dailyOrganizationHelp")} title={t("limit.dailyTitle")} /></span>
        : <span><Trans ns="assistant" i18nKey="limit.daily" components={components} /></span>}
    {monthly && onUsage ? <Button variant="link" onClick={onUsage}>{t("limit.usage")}</Button> : null}
  </div>;
}
