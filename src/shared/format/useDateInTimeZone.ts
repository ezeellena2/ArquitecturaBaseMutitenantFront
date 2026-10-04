import { useTranslation } from "react-i18next";
import { useReferenceData } from "@/shared/referenceData/useReferenceData";
import { useEffectiveCulture } from "@/shared/i18n";
import { createFormatters } from "./formatters";
import { getDefaultCultureProfile } from "./cultureProfiles";

/** Una prueba anónima de cuenta trae su zona; no se usa la zona por defecto del navegador. */
export function useDateInTimeZone(value: string, timeZone: string) {
  const { data } = useReferenceData();
  const { t } = useTranslation(["common", "format", "enums"]);
  const effective = useEffectiveCulture();
  if (!data) return null;
  const culture = effective ?? getDefaultCultureProfile(data).code;
  return createFormatters({ referenceData: data, culture, timeZone, translate: (key, options) => t(key, options) }).formatDate(value);
}
