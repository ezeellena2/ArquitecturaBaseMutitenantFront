import type { TaxIdTypeReference } from "./referenceData";

/** D6: primer tipo habilitado de empresas del país de la organización, con el mismo orden ordinal que el backend. */
export function defaultCompanyTaxIdType(types: readonly TaxIdTypeReference[], countryCode: string | null | undefined): TaxIdTypeReference | undefined {
  return countryCode ? types.filter((type) => type.isEnabled && (type.appliesTo === "Company" || type.appliesTo === "Both")
    && type.countryCode.toUpperCase() === countryCode.toUpperCase())
    .sort((left, right) => (left.sortOrder ?? Number.MAX_SAFE_INTEGER) - (right.sortOrder ?? Number.MAX_SAFE_INTEGER)
      || (left.code < right.code ? -1 : left.code > right.code ? 1 : 0))[0] : undefined;
}

/** Un número sin cambios mantiene su tipo, incluso si ese tipo dejó de estar habilitado. */
export function companyTaxIdType(types: readonly TaxIdTypeReference[], defaultType: TaxIdTypeReference | undefined,
  stored: { type: string; number: string } | null | undefined, number: string): TaxIdTypeReference | undefined {
  return stored && stored.number === number ? types.find((type) => type.code === stored.type) : defaultType;
}
