import { useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router";
import { defaultPageSize, isPageSize } from "@/shared/api/pageSizes";
import { useQueryUpdate } from "./useQueryUpdate";

function positiveInteger(value: string | null, fallback: number): number {
  if (value === null) return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 1 ? parsed : fallback;
}

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

  const rawPage = params.get("page");
  const rawPageSize = params.get("pageSize");
  const page = positiveInteger(rawPage, 1);
  const requestedSize = positiveInteger(rawPageSize, defaultPageSize);
  const pageSize = isPageSize(requestedSize) ? requestedSize : defaultPageSize;
  const sort = params.get("sort") ?? defaultSort;
  const search = params.get("search") ?? undefined;

  const update = useQueryUpdate();

  const setPage = useCallback((next: number) => update({ page: next === 1 ? undefined : String(next) }), [update]);

  // El tamaño por omisión no ensucia la URL, y al cambiarlo se vuelve al principio del listado.
  const setPageSize = useCallback(
    (next: number) => update({ pageSize: next === defaultPageSize ? undefined : String(next), page: undefined }),
    [update],
  );

  // Canoniza la URL y corrige una página vacía en una sola escritura con replace.
  // Dos llamadas a useQueryUpdate en el mismo tick no se acumulan.
  const itemCount = result?.items.length;
  const totalCount = result?.totalCount;
  useEffect(() => {
    const lastPage = itemCount === 0 && totalCount !== undefined && totalCount > 0
      ? Math.max(1, Math.ceil(totalCount / pageSize)) : page;
    const canonicalPage = lastPage === 1 ? null : String(lastPage);
    const canonicalSize = pageSize === defaultPageSize ? null : String(pageSize);
    const changes: Record<string, string | undefined> = {};
    if (rawPage !== canonicalPage) changes.page = canonicalPage ?? undefined;
    if (rawPageSize !== canonicalSize) changes.pageSize = canonicalSize ?? undefined;
    if (Object.keys(changes).length > 0) update(changes);
  }, [itemCount, totalCount, page, pageSize, rawPage, rawPageSize, update]);

  // Cambiar la búsqueda o el orden vuelve a la primera página: si no, se puede quedar en una página que ya no existe.
  const setSearch = useCallback((next: string) => update({ search: next, page: undefined }), [update]);

  const toggleSort = useCallback(
    (field: string) => {
      const next = sort === field ? `-${field}`
        : sort === `-${field}` ? (defaultSort === `-${field}` ? field : undefined)
          : field;
      update({ sort: next === defaultSort ? undefined : next, page: undefined });
    },
    [sort, defaultSort, update],
  );

  const query = useMemo(() => ({ page, pageSize, sort, search }), [page, pageSize, sort, search]);

  return useMemo(
    () => ({ page, pageSize, sort, search, query, setPage, setPageSize, setSearch, toggleSort }),
    [page, pageSize, sort, search, query, setPage, setPageSize, setSearch, toggleSort],
  );
}
