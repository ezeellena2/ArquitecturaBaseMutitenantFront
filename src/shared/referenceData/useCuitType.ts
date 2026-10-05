import { useMemo } from "react";
import type { TaxIdTypeReference } from "./referenceData";
import { useReferenceData } from "./useReferenceData";

/// El tipo CUIT del catálogo de referencia, habilitado y para empresas: con él se revisa el CUIT de una empresa en el
/// registro de empresa y en «Crear empresa» y «Editar empresa». Mientras carga el catálogo, no hay.
export function useCuitType(): TaxIdTypeReference | undefined {
  const { data } = useReferenceData();
  return useMemo(() => data?.taxIdTypes
    .filter((type) => type.isEnabled && type.validatorKey === "ar-cuit-mod11"
      && type.countryCode === "AR" && (type.appliesTo === "Company" || type.appliesTo === "Both"))
    .sort((left, right) => (left.sortOrder ?? Number.MAX_SAFE_INTEGER) - (right.sortOrder ?? Number.MAX_SAFE_INTEGER))[0],
  [data]);
}
