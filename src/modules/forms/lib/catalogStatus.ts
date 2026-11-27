import type { FormCatalogRow } from "../api/types";

/// El estado que se ve (§5): «De baja» si se dio de baja; si no, «Activo» o «No se puede usar», que el back calcula.
export type CatalogStatus = "Active" | "Inactive" | "Unusable";
export const catalogStatus = (catalog: Pick<FormCatalogRow, "isActive" | "usable">): CatalogStatus =>
  !catalog.isActive ? "Inactive" : catalog.usable ? "Active" : "Unusable";
