import { useTranslation } from "react-i18next";
import { useReferenceData } from "@/shared/referenceData/useReferenceData";
import { useEffectiveCulture } from "@/shared/i18n";
import { createFormatters } from "./formatters";
import { getDefaultCultureProfile } from "./cultureProfiles";

/** Una fecha (o su hora) en la zona que trae el contrato, no en la del perfil: una prueba anónima de cuenta o el corte del
 *  cupo de la IA en la zona de la organización (271). Nunca la zona por defecto del navegador. */
export function useDateInTimeZone(value: string, timeZone: string, kind: "date" | "time" = "date") {
  const { data } = useReferenceData();
  const { t } = useTranslation(["common", "format", "enums"]);
  const effective = useEffectiveCulture();
  if (!data) return null;
  const culture = effective ?? getDefaultCultureProfile(data).code;
  const format = createFormatters({ referenceData: data, culture, timeZone, translate: (key, options) => t(key, options) });
  return kind === "time" ? format.formatTime(value) : format.formatDate(value);
}
