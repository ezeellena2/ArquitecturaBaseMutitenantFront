import type { TFunction } from "i18next";
import { stdnum, type Validator } from "stdnum";
import type { TaxIdTypeReference } from "@/shared/referenceData/referenceData";

// Algoritmos conocidos; países, tipos, rótulos y máscaras pertenecen al catálogo.
const validators: Record<string, Validator> = {
  "ar-cuit-mod11": stdnum.AR.cuit,
  "ar-dni-length": stdnum.AR.dni,
};

export function taxIdMaxLength(type: TaxIdTypeReference): number {
  return Array.from(type.mask).filter((character) => character === "9").length;
}

export function isValidTaxId(type: TaxIdTypeReference | undefined, number: string): boolean {
  return Boolean(type?.isEnabled && number && validators[type.validatorKey]?.validate(number).isValid);
}

/** Mensaje de un número nuevo y opcional; el algoritmo distingue largo del resto de sus reglas. */
export function taxIdValidationMessage(t: TFunction, type: TaxIdTypeReference | undefined, number: string): string | undefined {
  if (number === "") return undefined;
  if (!type) return t("common:taxId.unavailable");
  const result = type?.isEnabled ? validators[type.validatorKey]?.validate(number) : undefined;
  if (result?.isValid) return undefined;
  const label = type.name;
  if (type && result?.error?.name === "InvalidLength") {
    const max = taxIdMaxLength(type);
    // DNI admite el primer dígito ausente; es una propiedad del algoritmo, no de un país elegido en la UI.
    return type.validatorKey === "ar-dni-length"
      ? t("common:taxId.lengthRange", { type: label, min: max - 1, max })
      : t("common:taxId.length", { type: label, count: max });
  }
  return t("common:taxId.invalid", { type: label });
}
