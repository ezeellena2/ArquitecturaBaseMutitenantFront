import { useTranslation } from "react-i18next";
import type { CatalogFilters } from "../../hooks/useCatalogFilters";
import { CatalogListCard, CatalogListPhone } from "./CatalogPreviewPhone";
import { SamplePicker } from "./SamplePicker";

/**
 * «Así lo ve quien lo recibe» de un catálogo con filtros: solo la pieza «Persona» o «Cliente» (262) arriba y las opciones, que
 * se actualizan solas (§10, sin «Probar»). En la compu, al costado y sin caja, con el teléfono (FRM-Catalogo-Filtros); en el
 * teléfono, adentro de su diálogo (`bare`), en una tarjeta sin marco (M-FRM-Catalogo-Filtros).
 */
export function FiltersPreview({ filters, bare = false }: { filters: CatalogFilters; bare?: boolean }) {
  const { t } = useTranslation("forms");
  const list = { preview: filters.preview.data, updating: filters.preview.updating, error: filters.preview.error, onRetry: filters.preview.retry };
  return <section aria-label={t("forms:catalog.preview.title")} className="flex flex-col gap-3 self-start">
    <SamplePicker filters={filters} />
    {bare ? <CatalogListCard {...list} /> : <CatalogListPhone {...list} />}
  </section>;
}
