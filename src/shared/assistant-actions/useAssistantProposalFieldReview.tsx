import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { AssistantProposalReviewMark } from "./AssistantProposalParts";

// Las dudas que tienen texto publicado; una clave desconocida deja solo la marca, nunca la clave a la vista.
const doubtTexts: Readonly<Record<string, string>> = {
  "Assistant.Action.Doubt.Similar": "assistantProposal.doubts.similar",
};

/** Lo que un campo con algo dudoso le pasa a su `FormField` (`warning`) y a su `Picker` (`adornment` y `className`). */
export interface AssistantProposalFieldReview {
  readonly warning?: string;
  readonly adornment: ReactNode;
  readonly className: string;
}

/**
 * El motivo de cada duda que tiene texto publicado («Hay más de una opción parecida.»), sin repetir. Lo usan el campo de
 * la pantalla y la tarjeta del hilo, así una duda nueva se escribe en un solo lugar.
 */
export function useAssistantProposalDoubtReasons() {
  const { t } = useTranslation();
  return (doubts: readonly (string | null | undefined)[]): string[] =>
    [...new Set(doubts.flatMap((key) => (key && doubtTexts[key] ? [t(doubtTexts[key])] : [])))];
}

/**
 * «Revisá» en un campo (.acc-duda): el borde ámbar, la marca adentro y el motivo debajo, como el error de un campo. Recibe
 * las dudas de lo que muestra el campo (de cada elemento elegido) y devuelve `undefined` si ninguna duda.
 */
export function useAssistantProposalFieldReview() {
  const reasonsOf = useAssistantProposalDoubtReasons();
  return (doubts: readonly (string | undefined)[]): AssistantProposalFieldReview | undefined => {
    if (!doubts.some(Boolean)) return undefined;
    const reasons = reasonsOf(doubts);
    return {
      warning: reasons.length ? reasons.join(" ") : undefined,
      adornment: <AssistantProposalReviewMark />,
      className: "border-[var(--punto-alerta)] shadow-[inset_0_0_0_1px_var(--punto-alerta)]",
    };
  };
}
