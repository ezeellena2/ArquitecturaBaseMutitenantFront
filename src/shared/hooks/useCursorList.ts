import { useInfiniteQuery, type QueryKey } from "@tanstack/react-query";
import { useMemo } from "react";

interface CursorPage<T> {
  readonly items: readonly T[];
  readonly nextCursor: string | null;
  readonly hasMore: boolean;
}

// El cursor opaco no vive en la URL. El caller incluye sus filtros en queryKey.
export function useCursorList<T>(
  queryKey: QueryKey,
  fetchPage: (after: string | null) => Promise<CursorPage<T>>,
) {
  const query = useInfiniteQuery({
    queryKey,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor ?? undefined : undefined,
  });
  const items = useMemo(() => query.data?.pages.flatMap((page) => page.items) ?? [], [query.data]);

  return { ...query, items };
}
