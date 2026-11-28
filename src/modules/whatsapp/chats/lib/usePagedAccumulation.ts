import { useQueries, type QueryKey, type QueryMeta, type UseQueryOptions } from "@tanstack/react-query";
import { useState } from "react";
import type { PageSize } from "@/shared/api/pageSizes";

/** Tamaño fijo por página para acumular chats y mensajes sin tope en 100 (KAN-28). */
export const chatPageSize: PageSize = 50;

/**
 * Combina páginas ordenadas (de la 1 en adelante) quitando duplicados por `id`.
 * Si llegan mensajes o chats nuevos entre páginas y corren el desplazamiento, prevalece la primera aparición (página más reciente).
 */
export function mergeUniqueById<T extends { readonly id: string }>(pages: readonly (readonly T[])[]): T[] {
  const seen = new Set<string>();
  const merged: T[] = [];
  for (const items of pages) {
    for (const item of items) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      merged.push(item);
    }
  }
  return merged;
}

interface PagedAccumulationOptions<TData, TItem extends { readonly id: string }> {
  /** Identifica el conjunto actual (bandeja, filtros, búsqueda o conversación): si cambia, vuelve a 1 página. */
  readonly resetKey: string;
  readonly pageSize?: PageSize;
  readonly queryKey: (page: number, pageSize: PageSize) => QueryKey;
  readonly queryFn: (page: number, pageSize: PageSize, signal: AbortSignal) => Promise<TData>;
  readonly selectItems: (data: TData) => readonly TItem[];
  readonly hasNext: (data: TData) => boolean;
  readonly enabled?: boolean;
  readonly refetchInterval?: number | false;
  readonly refetchIntervalInBackground?: boolean;
  /** Solo la página 1 puede mostrar datos anteriores mientras cambian los filtros. */
  readonly placeholderData?: UseQueryOptions<TData, Error, TData, QueryKey>["placeholderData"];
  readonly meta?: QueryMeta;
}

/**
 * Acumula páginas numeradas (`1, 2, 3…`) sobre `useQueries` para bandejas e hilos de WhatsApp:
 * cada «Cargar más» / «Ver mensajes anteriores» suma la página siguiente sin reemplazar las anteriores ni cortar en 100.
 */
export function usePagedAccumulation<TData, TItem extends { readonly id: string }>({
  resetKey,
  pageSize = chatPageSize,
  queryKey,
  queryFn,
  selectItems,
  hasNext,
  enabled = true,
  refetchInterval,
  refetchIntervalInBackground = false,
  placeholderData,
  meta,
}: PagedAccumulationOptions<TData, TItem>) {
  const [loaded, setLoaded] = useState({ key: resetKey, pages: 1 });
  const pageCount = loaded.key === resetKey ? loaded.pages : 1;

  const queries = useQueries({
    queries: Array.from({ length: pageCount }, (_, index): UseQueryOptions<TData, Error, TData, QueryKey> => {
      const page = index + 1;
      return {
        queryKey: queryKey(page, pageSize),
        queryFn: ({ signal }) => queryFn(page, pageSize, signal),
        enabled,
        refetchInterval: page === 1 ? refetchInterval : false,
        refetchIntervalInBackground,
        placeholderData: page === 1 ? placeholderData : undefined,
        meta,
      };
    }),
  });

  const first = queries[0];
  const last = queries[pageCount - 1];
  const lastWithData = [...queries].reverse().find((query) => query.data !== undefined)?.data;
  const failedExtra = queries.slice(1).find((query) => query.isError);
  const items = mergeUniqueById(queries.map((query) => (query.data ? selectItems(query.data) : [])));
  const isLoadingMore = pageCount > 1 && ((last?.data === undefined && (last?.isFetching ?? false)) || (failedExtra?.isFetching ?? false));
  const hasMore = !(first?.isPlaceholderData ?? false) && lastWithData !== undefined && hasNext(lastWithData);

  function loadMore() {
    if (isLoadingMore) return;
    if (failedExtra) {
      void failedExtra.refetch();
      return;
    }
    if (hasMore) setLoaded({ key: resetKey, pages: pageCount + 1 });
  }

  return {
    firstPage: first?.data,
    firstPageUpdateCount: first?.dataUpdatedAt ?? 0,
    items,
    hasMore,
    isLoadingMore,
    isFetching: queries.some((query) => query.isFetching),
    isPlaceholderData: first?.isPlaceholderData ?? false,
    isError: first?.isError ?? false,
    error: first?.error,
    refetchFirst: () => first?.refetch(),
    loadMore,
  };
}
