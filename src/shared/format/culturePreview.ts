import type { ReferenceData } from "@/shared/referenceData/referenceData";
import { createFormatters } from "./formatters";

/** Ejemplo fijo del lienzo: muestra patrones del catálogo sin alterar la cultura de la sesión. */
export function culturePreview(referenceData: ReferenceData, culture: string): string {
  const format = createFormatters({ referenceData, culture, timeZone: "UTC", translate: (key) => key });
  return `${format.formatDateTime("2026-09-27T14:35:00Z")} · ${format.formatDecimal(1234.5, 2)}`;
}
