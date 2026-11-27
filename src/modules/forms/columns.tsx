import type { TFunction } from "i18next";
import type { ReactNode } from "react";
import { Link } from "react-router";
import type { Column } from "@/shared/ui/DataTable";
import { ListCard } from "@/shared/ui/app/ListRow";
import { NumberText } from "@/shared/ui/format/NumberText";
import type { FormCatalogRow } from "./api/types";
import { CatalogStatusText, SourceText, ValueTypeText } from "./components/catalog/CatalogCells";
import { catalogsPath } from "./registration";

/** El editor de un catálogo guardado. */
export const catalogPath = (id: string) => `${catalogsPath}/${encodeURIComponent(id)}`;

/// Las columnas del listado (FRM-Catalogos, sin «Lo usan», que llega con los formularios). Todas ordenan en el back (264),
/// con las claves de su `SortMap`: el texto de la A a la Z y las opciones de mayor a menor al primer toque; el origen, el
/// tipo y el estado, por su orden.
export function createCatalogColumns(t: TFunction): Column<FormCatalogRow>[] {
  return [
    { id: "name", header: t("forms:catalogs.columns.name"), type: "custom", mobile: "primary", sortable: true, className: "w-[30%]",
      cell: (catalog) => <Link className="font-medium text-[var(--t1)] hover:underline" to={catalogPath(catalog.id)}>{catalog.name}</Link> },
    { id: "source", header: t("forms:catalogs.columns.source"), type: "custom", sortable: true, sortAs: "status", cell: (catalog) => <SourceText catalog={catalog} /> },
    { id: "valueType", header: t("forms:catalogs.columns.valueType"), type: "custom", sortable: true, sortAs: "status", cell: (catalog) => <ValueTypeText catalog={catalog} /> },
    { id: "optionsCount", header: t("forms:catalogs.columns.options"), type: "integer", sortable: true, className: "w-28", value: (catalog) => catalog.optionsCount },
    { id: "status", header: t("forms:catalogs.columns.status"), type: "custom", sortable: true, sortAs: "status", cell: (catalog) => <CatalogStatusText catalog={catalog} /> },
  ];
}

/// M-FRM-Catalogos (263): en el teléfono cada catálogo es una tarjeta con de dónde salen, las opciones y el estado, cada
/// dato con su nombre; el tipo de valor no va.
export function catalogPhoneRow(catalog: FormCatalogRow, t: TFunction): ReactNode {
  return <ListCard key={catalog.id} to={catalogPath(catalog.id)} title={catalog.name} fields={[
    { label: t("forms:catalogs.columns.source"), value: <SourceText catalog={catalog} /> },
    { label: t("forms:catalogs.columns.options"), value: <NumberText value={catalog.optionsCount ?? null} /> },
    { label: t("forms:catalogs.columns.status"), value: <CatalogStatusText catalog={catalog} /> },
  ]} />;
}
