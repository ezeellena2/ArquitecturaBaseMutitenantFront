import type { CultureReference, ReferenceData } from "@/shared/referenceData/referenceData";

/** Los patrones viven en Cultures; esta capa solo selecciona la fila efectiva. */
export function getCultureProfile(referenceData: ReferenceData, culture: string): CultureReference {
  const profile = referenceData.cultures.find((item) => item.code === culture);
  if (!profile) throw new Error(`La cultura ${culture} no está en los datos de referencia.`);
  return profile;
}

export function getDefaultCultureProfile(referenceData: ReferenceData): CultureReference {
  const defaults = referenceData.cultures.filter((item) => item.isEnabled && item.isDefault);
  if (defaults.length !== 1) throw new Error("Se necesita una sola cultura predeterminada habilitada.");
  return defaults[0];
}
