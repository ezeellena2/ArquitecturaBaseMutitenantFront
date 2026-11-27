import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { countOf } from "@/shared/format/countOf";
import { useFormat } from "@/shared/format/useFormat";
import { usePagedQuery } from "@/shared/hooks/usePagedQuery";
import type { ModuleContentProps } from "@/shared/modules/types";
import { Button } from "@/shared/ui/button";
import { DataTable } from "@/shared/ui/DataTable";
import { FilterBar } from "@/shared/ui/FilterBar";
import { Page, SublineSeparator } from "@/shared/ui/Page";
import { Pagination } from "@/shared/ui/Pagination";
import { Surface } from "@/shared/ui/Surface";
import { catalogFilterCountsQueryKey, catalogsQueryKey, fetchCatalogFilterCounts, fetchCatalogs, type CatalogsQuery } from "../api/catalogs";
import type { FormCatalogSource } from "../api/types";
import { catalogPhoneRow, createCatalogColumns } from "../columns";
import { catalogsPath } from "../registration";

const catalogFilterKeys = ["source", "status"] as const;
// Los filtros del tablero FRM-Catalogos, en su orden: todos primero y después cada origen o cada estado (262), sin cantidades.
const sources: readonly FormCatalogSource[] = ["Manual", "Members", "Contacts"];
const statuses = ["Active", "Inactive"] as const;
const allValue = "all";
const newCatalogPath = `${catalogsPath}/nuevo`;

/**
 * Catálogos (tableros FRM-Catalogos y M-FRM-Catalogos): la banda con cuántos hay y cuántos están activos, que cuenta
 * `filter-counts` sin la búsqueda ni los filtros; el buscador con «Origen» y «Estado» en la URL, «Ordenar por» último en la
 * barra, y la tabla paginada y ordenada por el back (264). «Nuevo catálogo» abre el editor, donde se eligen el origen y el
 * tipo (262), sin diálogo: en la compu en la banda y en el teléfono con el «+», los dos con «Administrar catálogos».
 */
export function CatalogsPage({ me }: ModuleContentProps) {
  const { t } = useTranslation(["forms", "common"]);
  const format = useFormat();
  const canManage = me.effectivePermissions.organization.includes("formcatalogs.manage");
  const { filters, pagination, query, result: catalogs, paginationProps } = usePagedQuery({
    filterKeys: catalogFilterKeys, defaultSort: "name",
    toQuery: (page, values): CatalogsQuery => ({ ...page,
      source: sources.find((source) => source === values.source),
      status: statuses.find((status) => status === values.status) }),
    queryKey: catalogsQueryKey, queryFn: fetchCatalogs, meta: { silent: true, blocksView: true },
  });
  const counts = useQuery({ queryKey: catalogFilterCountsQueryKey, queryFn: ({ signal }) => fetchCatalogFilterCounts(signal), meta: { silent: true } });
  const columns = createCatalogColumns(t);
  const filtered = Boolean(query.source || query.status || pagination.search);
  const totals = counts.data;
  // «7 catálogos · 6 activos» (262); sin ninguno, «Sin catálogos».
  const summary = totals ? totals.all === 0 ? t("forms:catalogs.summaryEmpty") : <>
    <span>{t("forms:catalogs.summaryTotal", countOf(format, totals.all))}</span><SublineSeparator />
    <span>{t("forms:catalogs.summaryActive", countOf(format, totals.active))}</span>
  </> : undefined;

  return <Page title={t("forms:nav.catalogs")} summary={summary} phoneBody="flush"
    fab={canManage ? { label: t("forms:catalogs.new"), to: newCatalogPath } : undefined}
    actions={canManage ? <Button asChild><Link to={newCatalogPath}><Plus aria-hidden="true" className="size-3.5" strokeWidth={2.25} />{t("forms:catalogs.new")}</Link></Button> : undefined}>
    <div className="flex flex-col gap-3 md:gap-3.5">
      <FilterBar sort={{ columns, value: pagination.sort, onChange: pagination.setSort }} screen={t("forms:nav.catalogs")}
        label={t("forms:catalogs.filters.label")} searchLabel={t("forms:catalogs.filters.search")}
        searchValue={pagination.search ?? ""} onSearchChange={pagination.setSearch}
        filters={[
          { key: "source", label: t("forms:catalogs.filters.source"), menuLabel: t("forms:catalogs.filters.sourceMenu"),
            value: query.source ?? "", active: query.source !== undefined,
            onChange: (value) => filters.setFilter("source", value === allValue ? undefined : value),
            options: [{ value: allValue, label: t("forms:catalogs.filters.allSources") },
              ...sources.map((source) => ({ value: source, label: format.formatEnum("FormCatalogSource", source) }))] },
          { key: "status", label: t("forms:catalogs.filters.status"), menuLabel: t("forms:catalogs.filters.statusMenu"),
            value: query.status ?? "", active: query.status !== undefined,
            onChange: (value) => filters.setFilter("status", value === allValue ? undefined : value),
            options: [{ value: allValue, label: t("forms:catalogs.filters.allStatuses") },
              { value: "Active", label: t("forms:catalogs.filters.active") }, { value: "Inactive", label: t("forms:catalogs.filters.inactive") }] },
        ]}
        clearLabel={t("common:actions.clearFilters")} onClear={filters.clear} />
      <Surface className="overflow-hidden" phoneFlush>
        <DataTable columns={columns} rows={catalogs.data?.items ?? []} rowKey={(catalog) => catalog.id} sort={pagination.sort} onSortChange={pagination.setSort}
          mobileRow={(catalog) => catalogPhoneRow(catalog, t)}
          isLoading={catalogs.isPending} isFetching={catalogs.isFetching}
          error={catalogs.error ? t("forms:catalogs.loadError") : undefined} onRetry={() => { void catalogs.refetch(); }}
          emptyTitle={filtered ? t("forms:catalogs.empty.filtered") : t("forms:catalogs.empty.all")}
          emptyAction={filtered ? <Button type="button" variant="outline" onClick={filters.clear}>{t("common:actions.clearFilters")}</Button> : undefined} />
        {paginationProps ? <Pagination {...paginationProps} /> : null}
      </Surface>
    </div>
  </Page>;
}
