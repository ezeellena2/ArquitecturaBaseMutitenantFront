import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { mergeUniqueById, usePagedAccumulation } from "./usePagedAccumulation";

interface TestItem {
  readonly id: string;
  readonly label: string;
}

interface TestPage {
  readonly items: readonly TestItem[];
  readonly hasNext: boolean;
}

function wrapperWithClient() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }
  return { client, Wrapper };
}

describe("mergeUniqueById", () => {
  it("deduplica elementos desplazados entre páginas conservando la versión de la página más reciente", () => {
    const merged = mergeUniqueById<TestItem>([
      [{ id: "3", label: "nuevo" }, { id: "2", label: "actualizado" }],
      [{ id: "2", label: "viejo" }, { id: "1", label: "primero" }],
    ]);
    expect(merged).toEqual([
      { id: "3", label: "nuevo" },
      { id: "2", label: "actualizado" },
      { id: "1", label: "primero" },
    ]);
  });
});

describe("usePagedAccumulation", () => {
  it("acumula páginas sucesivas sin tope en 100 y sin reemplazar las anteriores", async () => {
    const all: TestItem[] = Array.from({ length: 150 }, (_, index) => ({ id: `item-${index + 1}`, label: `Ítem ${index + 1}` }));
    const fetchPage = vi.fn(async (page: number, pageSize: number): Promise<TestPage> => {
      const start = (page - 1) * pageSize;
      return { items: all.slice(start, start + pageSize), hasNext: start + pageSize < all.length };
    });
    const { client, Wrapper } = wrapperWithClient();
    const { result } = renderHook(() => usePagedAccumulation({
      resetKey: "inbox",
      pageSize: 50,
      queryKey: (page, pageSize) => ["test-list", page, pageSize],
      queryFn: (page, pageSize) => fetchPage(page, pageSize),
      selectItems: (data) => data.items,
      hasNext: (data) => data.hasNext,
    }), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.items).toHaveLength(50));
    expect(result.current.hasMore).toBe(true);

    act(() => { result.current.loadMore(); });
    await waitFor(() => expect(result.current.items).toHaveLength(100));
    expect(result.current.hasMore).toBe(true);

    act(() => { result.current.loadMore(); });
    await waitFor(() => expect(result.current.items).toHaveLength(150));
    expect(result.current.hasMore).toBe(false);
    expect(result.current.items[0]?.id).toBe("item-1");
    expect(result.current.items[149]?.id).toBe("item-150");
    client.clear();
  });

  it("reinicia a una página cuando cambia resetKey y reintenta una página extra fallida sin saltar números", async () => {
    let failSecond = true;
    const fetchPage = vi.fn(async (key: string, page: number): Promise<TestPage> => {
      if (key === "a" && page === 2 && failSecond) {
        failSecond = false;
        throw new Error("fallo transitorio");
      }
      return { items: [{ id: `${key}-${page}`, label: `${key}-${page}` }], hasNext: page < 3 };
    });
    const { client, Wrapper } = wrapperWithClient();
    const hook = renderHook(({ key }) => usePagedAccumulation({
      resetKey: key,
      pageSize: 50,
      queryKey: (page) => ["test-retry", key, page],
      queryFn: (page) => fetchPage(key, page),
      selectItems: (data) => data.items,
      hasNext: (data) => data.hasNext,
    }), { wrapper: Wrapper, initialProps: { key: "a" } });

    await waitFor(() => expect(hook.result.current.items.map((item) => item.id)).toEqual(["a-1"]));
    act(() => { hook.result.current.loadMore(); });
    await waitFor(() => expect(fetchPage).toHaveBeenCalledWith("a", 2));
    // Al reintentar tras error en página 2, reintenta la página 2 sin saltar a la 3.
    await waitFor(() => expect(hook.result.current.isLoadingMore).toBe(false));
    act(() => { hook.result.current.loadMore(); });
    await waitFor(() => expect(hook.result.current.items.map((item) => item.id)).toEqual(["a-1", "a-2"]));

    hook.rerender({ key: "b" });
    await waitFor(() => expect(hook.result.current.items.map((item) => item.id)).toEqual(["b-1"]));
    expect(fetchPage).not.toHaveBeenCalledWith("b", 2);
    client.clear();
  });
});
