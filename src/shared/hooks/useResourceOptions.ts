import { matchQuery, useQueries, useQueryClient } from "@tanstack/react-query";
import { useState, useSyncExternalStore } from "react";
import { optionPage, type ResourceOptions } from "@/shared/api/resourceOptions";
import { useDebouncedValue } from "./useDebouncedValue";

export interface RemoteOptions {
  readonly search: string;
  readonly onSearch: (value: string) => void;
  readonly hasMore: boolean;
  readonly loading: boolean;
  readonly error: unknown;
  readonly onLoadMore: () => void;
  readonly onRetry: () => void;
}

/** Páginas de opciones en QueryCache: buscar y cargar más nunca descarga ni filtra todo el recurso. */
export function useResourceOptions<T>(resource: ResourceOptions<T>, enabled = true) {
  const client = useQueryClient();
  const cache = client.getQueryCache();
  const lookupKey = resource.lookupKeyRoot ?? resource.queryKeyRoot;
  // Otro selector puede haber encontrado lo elegido en una búsqueda distinta: su etiqueta también se actualiza aquí.
  useSyncExternalStore((notify) => cache.subscribe((event) => {
    if ((event.type === "removed" || event.type === "updated" && (event.action.type === "success" || event.action.type === "error"))
      && matchQuery({ queryKey: lookupKey }, event.query)) notify();
  }), () => cache.findAll({ queryKey: lookupKey })
    .filter((query) => query.state.data !== undefined || query.state.error !== null)
    .map((query) => `${query.queryHash}:${query.state.dataUpdateCount}:${query.state.errorUpdateCount}`).join("|"));
  const [search, setSearch] = useState("");
  const term = useDebouncedValue(search.trim());
  const [loaded, setLoaded] = useState({ term: "", pages: 1 });
  const pageCount = loaded.term === term ? loaded.pages : 1;
  const forPage = (page: number, searchTerm = term) => {
    const query = { ...optionPage, page, search: searchTerm || undefined };
    return { queryKey: [...resource.queryKeyRoot, query], queryFn: ({ signal }: { signal: AbortSignal }) => resource.queryFn(query, signal),
      enabled, staleTime: 30_000, meta: { silent: true } };
  };
  const pages = useQueries({ queries: Array.from({ length: pageCount }, (_, index) => forPage(index + 1)) });
  const items = pages.flatMap((page) => page.data?.items ?? []);
  const known = new Map<string, T>();
  for (const [, page] of client.getQueriesData<Awaited<ReturnType<ResourceOptions<T>["queryFn"]>>>({ queryKey: lookupKey })) {
    for (const item of page?.items ?? []) known.set(resource.id(item), item);
  }
  for (const item of items) known.set(resource.id(item), item);
  const error = pages.find((page) => page.isError)?.error;
  const isFetching = pages.some((page) => page.isFetching);
  const last = [...pages].reverse().find((page) => page.data)?.data;
  const remote: RemoteOptions = {
    search, onSearch: (value) => { setSearch(value); setLoaded({ term: value.trim(), pages: 1 }); },
    hasMore: !error && (last?.hasNext ?? false), loading: isFetching || search.trim() !== term, error,
    onLoadMore: () => { if (!error && !isFetching && last?.hasNext) setLoaded({ term, pages: pageCount + 1 }); },
    onRetry: () => { for (const page of pages) if (page.isError) void page.refetch(); },
  };

  /** «Todos» conserva su significado: se leen todas las páginas sólo cuando la persona lo solicita. */
  async function allItems(): Promise<T[]> {
    const result: T[] = [];
    for (let page = 1; ; page++) {
      const response = await client.fetchQuery(forPage(page, ""));
      result.push(...response.items);
      if (!response.hasNext) return result;
    }
  }

  const allCount = client.getQueryData<Awaited<ReturnType<ResourceOptions<T>["queryFn"]>>>(forPage(1, "").queryKey)?.totalCount;
  return { data: pages[0]?.data ? { ...pages[0].data, items } : undefined, items, knownItems: [...known.values()], remote, allItems, allCount,
    isPending: pages[0]?.isPending ?? false, isFetching, isError: Boolean(error), error,
    refetch: () => Promise.all(pages.map((page) => page.refetch())) };
}
