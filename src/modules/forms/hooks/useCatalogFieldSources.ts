import { keepPreviousData, useQueries } from "@tanstack/react-query";
import { catalogItemsQueryRoot, fetchCatalogItems } from "../api/catalogs";
import type { FormCatalogFieldDetail, FormCatalogItemRow } from "../api/types";
import type { ItemDraft } from "../lib/catalogDraft";

/** Las opciones que se nombran de una vez: `ids` del listado de opciones admite hasta 100 (`maxItems` del contrato, E13). */
const maxIds = 100;

/**
 * Las opciones de otro catálogo que son valor de un campo «De un catálogo» en las filas a la vista (111): se piden por su
 * identidad (`ids`), también las dadas de baja, juntas por catálogo fuente y de a 100 (una propuesta del asistente puede traer
 * hasta 500 filas), para decir su texto y si está de baja. Un valor guardado que apunta a una opción dada de baja se conserva y
 * se ve así (lección 1).
 */
export function useCatalogFieldSources(fields: readonly FormCatalogFieldDetail[], rows: readonly { readonly draft: Pick<ItemDraft, "fields"> }[]) {
  const named = new Map<string, Set<string>>();
  for (const field of fields) {
    if (!field.isActive || field.type !== "Catalog" || !field.sourceCatalogId) continue;
    const ids = named.get(field.sourceCatalogId) ?? new Set<string>();
    for (const row of rows) {
      const value = row.draft.fields?.[field.id];
      if (typeof value === "string" && value !== "") ids.add(value);
    }
    named.set(field.sourceCatalogId, ids);
  }
  const batches = [...named].flatMap(([sourceId, ids]) => {
    const sorted = [...ids].sort();
    return Array.from({ length: Math.ceil(sorted.length / maxIds) }, (_, index) => ({ sourceId, ids: sorted.slice(index * maxIds, (index + 1) * maxIds) }));
  });
  const queries = useQueries({
    queries: batches.map(({ sourceId, ids }) => ({
      queryKey: [...catalogItemsQueryRoot(sourceId), "named", ids] as const,
      queryFn: ({ signal }: { signal: AbortSignal }) => fetchCatalogItems(sourceId, { page: 1, pageSize: maxIds, status: "All", ids }, signal),
      staleTime: 30_000,
      placeholderData: keepPreviousData,
      meta: { silent: true },
    })),
  });
  const known = new Map<string, FormCatalogItemRow>();
  for (const query of queries) for (const item of query.data?.items ?? []) known.set(item.id, item);
  return (itemId: string): FormCatalogItemRow | undefined => known.get(itemId);
}

export type CatalogSourceItem = ReturnType<typeof useCatalogFieldSources>;
