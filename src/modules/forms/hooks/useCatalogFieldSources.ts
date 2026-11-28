import { keepPreviousData, useQueries } from "@tanstack/react-query";
import { catalogItemsQueryRoot, fetchCatalogItems } from "../api/catalogs";
import type { FormCatalogFieldDetail, FormCatalogItemRow } from "../api/types";
import type { ItemDraft } from "../lib/catalogDraft";

/** Las opciones que se nombran de una vez: `ids` del listado de opciones admite hasta 100 (`maxItems` del contrato, E13). */
const maxIds = 100;

/**
 * Las opciones de otro catálogo que son valor de un campo «De un catálogo» en las filas a la vista (111): se piden por su
 * identidad (`ids`), también las dadas de baja, una vez por catálogo fuente, para decir su texto y si está de baja. Un valor
 * guardado que apunta a una opción dada de baja se conserva y se ve así (lección 1).
 */
export function useCatalogFieldSources(fields: readonly FormCatalogFieldDetail[], rows: readonly { readonly draft: Pick<ItemDraft, "fields"> }[]) {
  const sources = fields.filter((field) => field.isActive && field.type === "Catalog" && field.sourceCatalogId);
  const queries = useQueries({
    queries: sources.map((field) => {
      const sourceId = field.sourceCatalogId!;
      const ids = [...new Set(rows.map((row) => row.draft.fields?.[field.id]).filter((value): value is string => typeof value === "string" && value !== ""))]
        .sort().slice(0, maxIds);
      return {
        queryKey: [...catalogItemsQueryRoot(sourceId), "named", ids] as const,
        queryFn: ({ signal }: { signal: AbortSignal }) => fetchCatalogItems(sourceId, { page: 1, pageSize: 100, status: "All", ids }, signal),
        enabled: ids.length > 0,
        staleTime: 30_000,
        placeholderData: keepPreviousData,
        meta: { silent: true },
      };
    }),
  });
  const known = new Map<string, FormCatalogItemRow>();
  for (const query of queries) for (const item of query.data?.items ?? []) known.set(item.id, item);
  return (itemId: string): FormCatalogItemRow | undefined => known.get(itemId);
}

export type CatalogSourceItem = ReturnType<typeof useCatalogFieldSources>;
