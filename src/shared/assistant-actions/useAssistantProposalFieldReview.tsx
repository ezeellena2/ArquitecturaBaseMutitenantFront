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
 * «Revisá» en un campo (.acc-duda): el borde ámbar, la marca adentro y el motivo debajo, como el error de un campo. Recibe
 * las dudas de lo que muestra el campo (de cada elemento elegido) y devuelve `undefined` si ninguna duda.
 */
export function useAssistantProposalFieldReview() {
  const { t } = useTranslation();
  return (doubts: readonly (string | undefined)[]): AssistantProposalFieldReview | undefined => {
    const keys = doubts.filter((doubt): doubt is string => Boolean(doubt));
    if (keys.length === 0) return undefined;
    const reasons = [...new Set(keys.flatMap((key) => (doubtTexts[key] ? [t(doubtTexts[key])] : [])))];
    return {
      warning: reasons.length ? reasons.join(" ") : undefined,
      adornment: <AssistantProposalReviewMark />,
      className: "border-[var(--punto-alerta)] shadow-[inset_0_0_0_1px_var(--punto-alerta)]",
    };
  };
}
