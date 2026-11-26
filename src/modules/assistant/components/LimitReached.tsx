import { Trans, useTranslation } from "react-i18next";
import type { AssistantStateResponse } from "@/modules/assistant/api/types";
import { DateInTimeZoneText } from "@/shared/ui/format/DateInTimeZoneText";
import { NumberText } from "@/shared/ui/format/NumberText";
import { Banner } from "@/shared/ui/Banner";
import { InfoTip } from "@/shared/ui/InfoTip";
import { Button } from "@/shared/ui/button";

/**
 * El tope del asistente, que dice por qué corta (270 y 271, tableros Asistente-*-Base2). El del día es de la persona en
 * esa organización, también con la clave de la plataforma; fuera de una, de la persona. La hora de `dailyResetAtUtc` se
 * dice en la zona en que corta el cupo, `dailyResetTimeZoneId`: la de la organización («hora de Grupo Delta») o, fuera de
 * una, la del perfil. Es el cartel de atención de «Criterio · Avisos» (210): blanco, con el filo y el triángulo en ámbar, y
 * la (i) al final de su misma frase.
 */
export function LimitReached({ monthly, state, organizationName, inOrganization = false, onUsage }: LimitReachedTextProps & { state: AssistantStateResponse; onUsage?: () => void }) {
  const { t } = useTranslation("assistant");
  const sentence = <LimitReachedText monthly={monthly} state={state} organizationName={organizationName} inOrganization={inOrganization} />;
  return <Banner tone="warning" action={monthly && onUsage ? <Button variant="link" onClick={onUsage}>{t("limit.usage")}</Button> : undefined}>
    {sentence}
    {!monthly && inOrganization ? <InfoTip className="ml-1 align-middle" text={t("limit.dailyOrganizationHelp")} title={t("limit.dailyTitle")} /> : null}
  </Banner>;
}

type LimitReachedTextProps = { monthly: boolean; state: Pick<AssistantStateResponse, "dailyLimit" | "dailyResetAtUtc" | "dailyResetTimeZoneId">; organizationName?: string; inOrganization?: boolean };

/**
 * La frase del tope, la misma en el aviso que reemplaza la caja y en la subida que el back frena sin cupo (283): un solo
 * texto para el mismo cupo. El `detail` del 429 no lleva números ni la zona; esta frase los arma.
 */
export function LimitReachedText({ monthly, state, organizationName, inOrganization = false }: LimitReachedTextProps) {
  const { t } = useTranslation("assistant");
  const zone = state.dailyResetTimeZoneId;
  const organization = organizationName ?? t("limit.organization");
  if (monthly) return t("limit.monthly", { organization });
  const components = { count: <NumberText value={state.dailyLimit} />, date: <DateInTimeZoneText value={state.dailyResetAtUtc} timeZone={zone} />,
    time: <DateInTimeZoneText value={state.dailyResetAtUtc} timeZone={zone} kind="time" /> };
  return <Trans ns="assistant" i18nKey={inOrganization ? "limit.dailyOrganization" : "limit.daily"} values={{ organization }} components={components} />;
}
