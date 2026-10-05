import { useMemo } from "react";
import { useReferenceData } from "@/shared/referenceData/useReferenceData";

/// El tipo CUIT del catálogo de referencia, como el registro de empresa: con él se revisa el CUIT de una empresa.
export function useCuitType() {
  const { data } = useReferenceData();
  return useMemo(() => data?.taxIdTypes
    .filter((type) => type.isEnabled && type.validatorKey === "ar-cuit-mod11"
      && type.countryCode === "AR" && (type.appliesTo === "Company" || type.appliesTo === "Both"))
    .sort((left, right) => (left.sortOrder ?? Number.MAX_SAFE_INTEGER) - (right.sortOrder ?? Number.MAX_SAFE_INTEGER))[0],
  [data]);
}
