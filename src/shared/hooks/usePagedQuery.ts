import { keepPreviousData, useQuery, type QueryKey, type QueryMeta } from "@tanstack/react-query";
import { useEffect } from "react";
import type { ResourceOptions } from "@/shared/api/resourceOptions";
import type { PaginationProps } from "@/shared/ui/Pagination";
import { useDebouncedValue } from "./useDebouncedValue";
import { useFilters } from "./useFilters";
import { usePagination, type PageQuery } from "./usePagination";

type PagedResponse = Awaited<ReturnType<ResourceOptions<unknown>["queryFn"]>>;

interface PagedQueryOptions<K extends string, TQuery, TPage extends PagedResponse> {
  /** Los filtros del listado que viven en la URL; una constante del módulo. */
  readonly filterKeys: readonly K[];
  readonly defaultSort?: string;
  readonly prefix?: string;
  /** Arma la consulta de la API con la página, el orden, la búsqueda (ya con el debounce) y los filtros de la URL. */
  readonly toQuery: (page: PageQuery, filters: Readonly<Record<K, string | undefined>>) => TQuery;
  readonly queryKey: (query: TQuery) => QueryKey;
  readonly queryFn: (query: TQuery) => Promise<TPage>;
  readonly enabled?: boolean;
  readonly staleTime?: number;
  readonly meta?: QueryMeta;
}

/// Un listado paginado por el back (paginado-y-listados.md): los filtros, la página, el orden y la búsqueda viven en la
/// URL; la búsqueda llega a la consulta con 300 ms de debounce; la consulta conserva la página anterior mientras llega
/// la nueva; si llega una página vacía con filas en otras (se borró la última fila de la última página), salta sola a
/// la última que tiene, con replace; y entrega las props de `Pagination`.
export function usePagedQuery<K extends string, TQuery, TPage extends PagedResponse>({
  filterKeys, defaultSort, prefix, toQuery, queryKey, queryFn, enabled, staleTime, meta,
}: PagedQueryOptions<K, TQuery, TPage>) {
  const filters = useFilters(filterKeys, prefix);
  const pagination = usePagination({ defaultSort, prefix });
  const search = useDebouncedValue(pagination.search ?? "");
  const query = toQuery({ page: pagination.page, pageSize: pagination.pageSize, sort: pagination.sort, search: search || undefined }, filters.values);
  const result = useQuery({ queryKey: queryKey(query), queryFn: () => queryFn(query), enabled, staleTime, placeholderData: keepPreviousData, meta });

  // Solo con la respuesta de esta página: la anterior, que se muestra mientras llega, no dice nada de esta.
  const settled = result.isPlaceholderData ? undefined : result.data;
  const itemCount = settled?.items.length;
  const totalCount = settled?.totalCount;
  const { page, pageSize, setPage } = pagination;
  useEffect(() => {
    if (itemCount !== 0 || totalCount === undefined || totalCount === 0) return;
    const lastPage = Math.max(1, Math.ceil(totalCount / pageSize));
    if (lastPage !== page) setPage(lastPage);
  }, [itemCount, totalCount, page, pageSize, setPage]);

  const data = result.data;
  const paginationProps: PaginationProps | undefined = data && data.page !== undefined && data.pageSize !== undefined
    && data.totalCount !== undefined && data.totalPages !== undefined && data.hasPrevious !== undefined && data.hasNext !== undefined ? {
    page: data.page, pageSize: data.pageSize, totalCount: data.totalCount, totalPages: data.totalPages,
    hasPrevious: data.hasPrevious, hasNext: data.hasNext,
    onPageChange: pagination.setPage, onPageSizeChange: pagination.setPageSize,
  } : undefined;

  return { filters, pagination, query, result, paginationProps };
}
