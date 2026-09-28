import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";
import { useQueryUpdate } from "./useQueryUpdate";

export const defaultPageSize = 10;

interface PaginationOptions {
  readonly defaultSort?: string;
}

/// Página, orden y búsqueda viven en la URL: el listado se puede compartir y el botón atrás funciona.
export function usePagination({ defaultSort }: PaginationOptions = {}) {
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

  // El resultado llega después de armar la consulta con query. Si la página ya no existe,
  // se reemplaza en la URL por la última disponible, sin agregar una entrada al historial.
  const correctPage = useCallback(
    (items: readonly unknown[], totalCount: number) => {
      if (items.length > 0 || totalCount <= 0) return;

      const lastPage = Math.max(1, Math.ceil(totalCount / pageSize));
      if (page !== lastPage) setPage(lastPage);
    },
    [page, pageSize, setPage],
  );

  // Cambiar la búsqueda o el orden vuelve a la primera página: si no, se puede quedar en una página que ya no existe.
  const setSearch = useCallback((next: string) => update({ search: next, page: undefined }), [update]);

  const toggleSort = useCallback(
    (field: string) => update({ sort: sort === field ? `-${field}` : sort === `-${field}` ? undefined : field, page: undefined }),
    [sort, update],
  );

  const query = useMemo(() => ({ page, pageSize, sort, search }), [page, pageSize, sort, search]);

  return useMemo(
    () => ({ page, pageSize, sort, search, query, setPage, setPageSize, correctPage, setSearch, toggleSort }),
    [page, pageSize, sort, search, query, setPage, setPageSize, correctPage, setSearch, toggleSort],
  );
}
