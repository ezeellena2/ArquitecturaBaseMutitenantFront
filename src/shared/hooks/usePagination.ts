import { useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router";
import { useQueryUpdate } from "./useQueryUpdate";

export const defaultPageSize = 10;

interface PaginationOptions {
  readonly defaultSort?: string;
}

interface PaginationResult {
  readonly items: readonly unknown[];
  readonly totalCount: number;
}

/// Página, orden y búsqueda viven en la URL: el listado se puede compartir y el botón atrás funciona.
export function usePagination(result?: PaginationResult, { defaultSort }: PaginationOptions = {}) {
  const [params] = useSearchParams();

  const page = Number(params.get("page") ?? 1);
  const pageSize = Number(params.get("pageSize") ?? defaultPageSize);
  const sort = params.get("sort") ?? defaultSort;
  const search = params.get("search") ?? undefined;

  const update = useQueryUpdate();

  const setPage = useCallback((next: number) => update({ page: next === 1 ? undefined : String(next) }), [update]);

  // El tamaño por omisión no ensucia la URL, y al cambiarlo se vuelve al principio del listado.
  const setPageSize = useCallback(
    (next: number) => update({ pageSize: next === defaultPageSize ? undefined : String(next), page: undefined }),
    [update],
  );

  // El resultado llega después de consultar. Una página fuera de rango se reemplaza sin
  // agregar historial; useQueryUpdate hace todas las escrituras con replace: true.
  const itemCount = result?.items.length;
  const totalCount = result?.totalCount;
  useEffect(() => {
    if (itemCount !== 0 || totalCount === undefined || totalCount <= 0) return;
    const lastPage = Math.max(1, Math.ceil(totalCount / pageSize));
    if (page !== lastPage) update({ page: lastPage === 1 ? undefined : String(lastPage) });
  }, [itemCount, totalCount, page, pageSize, update]);

  // Cambiar la búsqueda o el orden vuelve a la primera página: si no, se puede quedar en una página que ya no existe.
  const setSearch = useCallback((next: string) => update({ search: next, page: undefined }), [update]);

  const toggleSort = useCallback(
    (field: string) => update({ sort: sort === field ? `-${field}` : sort === `-${field}` ? undefined : field, page: undefined }),
    [sort, update],
  );

  const query = useMemo(() => ({ page, pageSize, sort, search }), [page, pageSize, sort, search]);

  return useMemo(
    () => ({ page, pageSize, sort, search, query, setPage, setPageSize, setSearch, toggleSort }),
    [page, pageSize, sort, search, query, setPage, setPageSize, setSearch, toggleSort],
  );
}
