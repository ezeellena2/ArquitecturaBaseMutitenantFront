import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { ResourceOptions } from "@/shared/api/resourceOptions";
import { useFormat } from "@/shared/format/useFormat";
import { useResourceOptions } from "@/shared/hooks/useResourceOptions";
import { Picker } from "@/shared/ui/Picker";
import { catalogsQueryRoot, fetchCatalogs } from "../../api/catalogs";
import type { FormCatalogRow } from "../../api/types";

/** Los catálogos a mano activos de la organización, de a páginas y con la búsqueda en el servidor: el listado de la E12. */
const manualCatalogOptions: ResourceOptions<FormCatalogRow> = {
  queryKeyRoot: [...catalogsQueryRoot, "combo", "manual-active"], id: (catalog) => catalog.id,
  queryFn: (query, signal) => fetchCatalogs({ ...query, source: "Manual", status: "Active" }, signal),
};

/**
 * La pieza para elegir un catálogo a mano activo (111 y 262), aparte del módulo y sin nada de quien la usa (lección 5).
 * Cerrada dice solo el catálogo elegido («Zonas»); abierta, los primeros del listado de la E12 (`source=manual`,
 * `status=active`), cada uno con su cantidad de opciones en gris, y como vienen del servidor, el buscador va adentro de la
 * lista, con el foco. `except` apaga uno con su motivo, como el catálogo que se está editando.
 */
export function CatalogCombo({ value, valueName, onChange, except, id, invalid, describedBy }: {
  value: string | null;
  /** El nombre del elegido, que puede no estar entre los primeros: cerrado se lee igual. */
  valueName: string | null;
  onChange: (catalog: { id: string; name: string }) => void;
  except?: { id: string; reason: string };
  id?: string;
  invalid?: boolean;
  describedBy?: string;
}) {
  const { t } = useTranslation("forms");
  const format = useFormat();
  // Pide al servidor recién con la lista abierta: cerrada, el nombre del elegido ya llega con el campo.
  const [opened, setOpened] = useState(false);
  const query = useResourceOptions(manualCatalogOptions, opened);
  const names = new Map(query.knownItems.map((catalog) => [catalog.id, catalog.name]));
  const options = query.items.map((catalog) => ({
    value: catalog.id, label: catalog.name,
    description: catalog.optionsCount == null ? undefined : t("forms:catalog.combo.options", { count: catalog.optionsCount, n: format.formatInteger(catalog.optionsCount) }),
    disabledReason: catalog.id === except?.id ? except.reason : undefined,
  }));
  return <Picker id={id} remote={query.remote} options={options} value={value}
    selectedOptions={value ? [{ value, label: valueName ?? names.get(value) ?? "" }] : []}
    placeholder={t("forms:catalog.combo.placeholder")} aria-invalid={invalid || undefined} aria-describedby={describedBy}
    countLabel={(count) => t("forms:catalog.combo.count", { count, n: format.formatInteger(count) })}
    noMatchesLabel={(search) => t("forms:catalog.combo.noMatches", { search })} onOpenChange={(open) => { if (open) setOpened(true); }}
    onChange={(next) => { if (next !== value) onChange({ id: next, name: names.get(next) ?? "" }); }} />;
}
