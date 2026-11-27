import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/utils";
import type { CatalogFilters } from "../../hooks/useCatalogFilters";
import { CatalogListPhone } from "./CatalogPreviewPhone";
import { SamplePicker } from "./SamplePicker";

/**
 * «Así lo ve quien lo recibe» de un catálogo con filtros: solo la pieza «Persona» o «Cliente» (262) arriba y el teléfono, que
 * se actualiza solo (§10, sin «Probar»). Al costado en la compu; en el teléfono, adentro de su diálogo (`bare`).
 */
export function FiltersPreview({ filters, bare = false }: { filters: CatalogFilters; bare?: boolean }) {
  const { t } = useTranslation("forms");
  return <section aria-label={t("forms:catalog.preview.title")}
    className={cn("flex flex-col gap-3", !bare && "self-start rounded-lg border border-[var(--borde)] bg-white p-4")}>
    <SamplePicker filters={filters} />
    <CatalogListPhone preview={filters.preview.data} updating={filters.preview.updating} />
  </section>;
}
