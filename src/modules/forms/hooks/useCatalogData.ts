import { keepPreviousData, queryOptions, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { catalogItemsQueryKey, catalogQueryKey, fetchCatalog, fetchCatalogItems, type CatalogItemsQuery } from "../api/catalogs";

type PageSize = NonNullable<CatalogItemsQuery["pageSize"]>;

/** La ficha de un catálogo, la consulta principal de su editor: la comparten todos los que la leen en la pantalla. */
export const catalogQueryOptions = (id: string | undefined) => queryOptions({
  queryKey: catalogQueryKey(id ?? ""),
  queryFn: ({ signal }) => fetchCatalog(id!, signal),
  enabled: Boolean(id),
  meta: { blocksView: true, silent: true },
});

/**
 * Lo que el editor de un catálogo lee del servidor: la ficha, que es la consulta principal (su 403 bloquea la vista y la
 * pantalla muestra su 404 o su error, sin el aviso de abajo), y la página de opciones a la vista, con su búsqueda, que dice
 * su error en su lugar, con «Reintentar».
 */
export function useCatalogData(id: string | undefined) {
  const catalog = useQuery(catalogQueryOptions(id));
  const saved = catalog.data;

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput.trim());
  const itemsQuery: CatalogItemsQuery = useMemo(() => ({ page, pageSize, search: search || undefined, status: "All" }), [page, pageSize, search]);
  const items = useQuery({
    queryKey: catalogItemsQueryKey(id ?? "", itemsQuery),
    queryFn: ({ signal }) => fetchCatalogItems(id!, itemsQuery, signal),
    enabled: Boolean(id) && saved?.source === "Manual",
    // Una página tardía de otro catálogo se descarta: la clave lleva el id. Mientras llega la siguiente, la que se ve queda.
    placeholderData: (previous, previousQuery) => previousQuery?.queryKey[3] === id ? keepPreviousData(previous) : undefined,
    meta: { silent: true },
  });
  const pageRows = useMemo(() => items.data?.items ?? [], [items.data]);

  return {
    catalog,
    saved,
    items,
    itemsQuery,
    pageRows,
    page,
    setPage,
    pageSize,
    setPageSize: (size: number) => { setPageSize(size as PageSize); setPage(1); },
    searchInput,
    setSearchInput: (value: string) => { setSearchInput(value); setPage(1); },
    searching: Boolean(search),
  };
}

export type CatalogData = ReturnType<typeof useCatalogData>;
