import type { CatalogItemsQuery } from "../api/catalogs";
import type { FormCatalogItemRow, PagedResultOfFormCatalogItemRow } from "../api/types";

/** La página más grande que da el servidor. */
const pageSize = 100;
/** A lo sumo tantos pedidos a la vez: la cuota de la persona (120 por minuto) se comparte con el resto de la pantalla. */
const parallel = 4;

/**
 * Las opciones guardadas que toca una propuesta, por su id, sin leer las 10.000 de un catálogo ni pedir una vez por cada
 * opción (cuotas): busca por el texto de ahora que leyó el servidor, una vez por texto, salvo que recorrer el catálogo de a
 * 100 pida menos; en los dos casos, de a pocos pedidos y hasta encontrarlas todas.
 */
export async function findProposalTargets(targets: readonly { readonly itemId: string; readonly label: string }[], total: number,
  fetchPage: (query: CatalogItemsQuery) => Promise<PagedResultOfFormCatalogItemRow>): Promise<FormCatalogItemRow[]> {
  const ids = new Set(targets.map((target) => target.itemId));
  const labels = [...new Set(targets.map((target) => target.label))];
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const queries: CatalogItemsQuery[] = labels.length <= pages
    ? labels.map((label) => ({ page: 1, pageSize, search: label || undefined, status: "All" }))
    : Array.from({ length: pages }, (_, index) => ({ page: index + 1, pageSize, status: "All" }));
  const found = new Map<string, FormCatalogItemRow>();
  for (let start = 0; start < queries.length && found.size < ids.size; start += parallel) {
    const results = await Promise.all(queries.slice(start, start + parallel).map(fetchPage));
    for (const row of results.flatMap((result) => result.items)) if (ids.has(row.id)) found.set(row.id, row);
  }
  return [...found.values()];
}
