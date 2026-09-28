import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { useCursorList } from "./useCursorList";

function wrapperWithClient() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }
  return { client, Wrapper };
}

describe("useCursorList", () => {
  it("carga páginas por cursor opaco, sin total ni número de página", async () => {
    const fetchPage = vi.fn(async (after: string | null) => after === null
      ? { items: [{ id: "nuevo" }], nextCursor: "cursor-opaco", hasMore: true }
      : { items: [{ id: "viejo" }], nextCursor: null, hasMore: false });
    const { client, Wrapper } = wrapperWithClient();
    const { result } = renderHook(() => useCursorList(["actividad"], fetchPage), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.items).toEqual([{ id: "nuevo" }]));
    expect(result.current.hasNextPage).toBe(true);
    await act(async () => { await result.current.fetchNextPage(); });

    expect(fetchPage.mock.calls.map(([after]) => after)).toEqual([null, "cursor-opaco"]);
    await waitFor(() => expect(result.current.items).toEqual([{ id: "nuevo" }, { id: "viejo" }]));
    expect(result.current.hasNextPage).toBe(false);
    expect("totalCount" in result.current).toBe(false);
    expect("page" in result.current).toBe(false);
    client.clear();
  });

  it("reinicia el cursor cuando cambia la clave de filtros", async () => {
    const fetchPage = vi.fn(async (_after: string | null) => ({ items: [{ id: "fila" }], nextCursor: null, hasMore: false }));
    const { client, Wrapper } = wrapperWithClient();
    const { result, rerender } = renderHook(
      ({ filter }: { filter: string }) => useCursorList(["actividad", filter], fetchPage),
      { wrapper: Wrapper, initialProps: { filter: "todos" } },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    rerender({ filter: "errores" });
    await waitFor(() => expect(fetchPage).toHaveBeenCalledTimes(2));
    expect(fetchPage.mock.calls.map(([after]) => after)).toEqual([null, null]);
    client.clear();
  });
});
