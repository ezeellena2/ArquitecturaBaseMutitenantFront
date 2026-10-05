import { keepPreviousData, useInfiniteQuery, type QueryKey, type QueryMeta } from "@tanstack/react-query";
import { useMemo } from "react";

/// Una tanda, como `CursorResult` del back: el cursor de la siguiente puede no venir.
interface CursorPage<T> {
  readonly items: readonly T[];
  readonly nextCursor?: string | null;
  readonly hasMore: boolean;
}

interface CursorListOptions {
  /** Lo que la consulta le dice al manejo global de errores (`silent`, `blocksView`), como en `usePagedQuery`. */
  readonly meta?: QueryMeta;
}

/// La única forma de listar por cursor (paginado-y-listados.md): lo que solo crece, como la auditoría, de a tandas con el
/// cursor opaco del back, sin total ni número de página, para «Cargar más» (`LoadMore`). El cursor no vive en la URL:
/// quien lo llama pone sus filtros en `queryKey`, y al cambiarlos vuelve a la primera tanda conservando la lista
/// anterior mientras llega la nueva (`placeholderData: keepPreviousData`, como `usePagedQuery`).
export function useCursorList<T>(
  queryKey: QueryKey,
  fetchPage: (after: string | null) => Promise<CursorPage<T>>,
  { meta }: CursorListOptions = {},
) {
  const query = useInfiniteQuery({
    queryKey,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor ?? undefined : undefined,
    placeholderData: keepPreviousData,
    meta,
  });
  const items = useMemo(() => query.data?.pages.flatMap((page) => page.items) ?? [], [query.data]);

  return { ...query, items };
}
