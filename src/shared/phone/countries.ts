import { getCountryCallingCode, type CountryCode } from "libphonenumber-js";
import type { CountryReference } from "@/shared/referenceData/referenceData";

function searchable(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "").trim().toLowerCase();
}

function validCallingCode(country: CountryReference): boolean {
  if (!country.callingCode) return false;

  let libraryCode: string;
  try {
    libraryCode = getCountryCallingCode(country.code as CountryCode);
  } catch {
    throw new Error(`El prefijo telefónico de ${country.code} no existe en libphonenumber-js.`);
  }
  if (libraryCode !== country.callingCode) {
    throw new Error(`El prefijo telefónico de ${country.code} difiere del catálogo.`);
  }
  return true;
}

/** Opciones de teléfono del catálogo traducido; no se conserva ningún país en código. */
export function phoneCountryOptions(
  countries: readonly CountryReference[],
  search = "",
  allowedCountries?: readonly string[],
): CountryReference[] {
  const query = searchable(search);
  const allowed = allowedCountries ? new Set(allowedCountries) : null;

  return countries
    .filter((country) => country.isEnabled && (!allowed || allowed.has(country.code)) && validCallingCode(country))
    .filter((country) => !query
      || searchable(country.name).includes(query)
      || searchable(country.code).includes(query)
      || `+${country.callingCode}`.includes(query)
      || country.callingCode?.includes(query))
    .sort((left, right) =>
      (left.sortOrder ?? Number.POSITIVE_INFINITY) - (right.sortOrder ?? Number.POSITIVE_INFINITY)
      || left.name.localeCompare(right.name)
      || left.code.localeCompare(right.code));
}
