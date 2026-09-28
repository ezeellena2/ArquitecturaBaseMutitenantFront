import { AsYouType, isValidPhoneNumber, parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";
import type { CountryReference } from "@/shared/referenceData/referenceData";

export interface PhoneDraftResult {
  country: string;
  number: string;
  isValid: boolean;
}

/** Adaptador de entrada: la API recibe país y número nacional, no E.164 armado por el front. */
export function formatPhoneDraft(
  raw: string,
  country: string,
  availableCountries: readonly CountryReference[],
): PhoneDraftResult {
  if (raw.trimStart().startsWith("+")) {
    const international = new AsYouType();
    international.input(raw);
    const detected = international.getCountry();
    if (detected && availableCountries.some((item) => item.code === detected)) {
      const parsed = parsePhoneNumberFromString(raw);
      if (parsed) {
        return { country: detected, number: parsed.formatNational(), isValid: parsed.isValid() };
      }
    }
    return { country, number: international.getNumber()?.formatInternational() ?? raw, isValid: false };
  }

  const number = new AsYouType(country as CountryCode).input(raw);
  return { country, number, isValid: country !== "" && isValidPhoneNumber(number, country as CountryCode) };
}
