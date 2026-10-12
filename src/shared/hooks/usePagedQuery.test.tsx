import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter, useLocation, useNavigate } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ResourceOptions } from "@/shared/api/resourceOptions";
import { usePagedQuery } from "./usePagedQuery";

type Row = { id: string };
type ListQuery = { page: number; pageSize: number; sort?: string; search?: string; status?: string };

function paged(items: Row[], page: number, totalCount: number): Awaited<ReturnType<ResourceOptions<Row>["queryFn"]>> {
  return { items, page, pageSize: 10, totalCount, totalPages: Math.ceil(totalCount / 10), hasPrevious: page > 1, hasNext: page * 10 < totalCount };
}

function renderList(url: string, fetchPage: (query: ListQuery) => Promise<Awaited<ReturnType<ResourceOptions<Row>["queryFn"]>>>, previousUrl?: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={previousUrl ? [previousUrl, url] : [url]} initialIndex={previousUrl ? 1 : 0}>{children}</MemoryRouter>
    </QueryClientProvider>;
  }
  const hook = renderHook(() => ({
    list: usePagedQuery({
      filterKeys: ["status"] as const,
      defaultSort: "name",
      toQuery: (page, filters): ListQuery => ({ ...page, status: filters.status === "Active" ? "Active" : undefined }),
      queryKey: (query) => ["lista", query],
      queryFn: fetchPage,
    }),
    location: useLocation(),
    navigate: useNavigate(),
  }), { wrapper: Wrapper });
  return { ...hook, client };
}

afterEach(() => vi.useRealTimers());

describe("usePagedQuery", () => {
  it("lleva la URL a la consulta: página, tamaño, orden, búsqueda y filtros", async () => {
    const fetchPage = vi.fn(async (query: ListQuery) => paged([{ id: "uno" }], query.page, 11));
    const { result } = renderList("/lista?page=2&pageSize=20&sort=-name&search=ana&status=Active&otro=x", fetchPage);

    await waitFor(() => expect(result.current.list.result.data?.items).toEqual([{ id: "uno" }]));
    expect(fetchPage).toHaveBeenCalledWith({ page: 2, pageSize: 20, sort: "-name", search: "ana", status: "Active" });
    expect(result.current.list.query).toEqual({ page: 2, pageSize: 20, sort: "-name", search: "ana", status: "Active" });
    expect(result.current.list.filters.values.status).toBe("Active");
  });

  it("la búsqueda llega a la consulta 300 ms después de dejar de escribir y vuelve a la página 1", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const fetchPage = vi.fn(async (query: ListQuery) => paged([{ id: query.search ?? "todos" }], query.page, 1));
    const { result } = renderList("/lista?page=3", fetchPage);
    await waitFor(() => expect(fetchPage).toHaveBeenCalledTimes(1));

    act(() => result.current.list.pagination.setSearch("ana"));
    expect(result.current.location.search).toBe("?search=ana");
    expect(result.current.list.query.search).toBeUndefined();
    await act(async () => { await vi.advanceTimersByTimeAsync(300); });

    await waitFor(() => expect(fetchPage).toHaveBeenLastCalledWith({ page: 1, pageSize: 10, sort: "name", search: "ana", status: undefined }));
  });

  // B6: borrar el único ítem de la última página deja la página vacía; la lista vuelve a la última que tiene filas.
  it("corrige una página fuera de rango a la última, sin dejar una entrada en el historial", async () => {
    const fetchPage = vi.fn(async (query: ListQuery) => query.page === 9 ? paged([], 9, 25) : paged([{ id: "fila" }], query.page, 25));
    const { result } = renderList("/lista?page=9", fetchPage, "/anterior");

    await waitFor(() => expect(result.current.location.search).toBe("?page=3"));
    await waitFor(() => expect(result.current.list.result.data?.items).toEqual([{ id: "fila" }]));
    act(() => result.current.navigate(-1));
    expect(result.current.location.pathname).toBe("/anterior");
  });

  it("no cambia de página si la página trae filas o si la lista entera está vacía", async () => {
    const withRows = renderList("/lista?page=2", async () => paged([{ id: "fila" }], 2, 25));
    await waitFor(() => expect(withRows.result.current.list.result.isSuccess).toBe(true));
    expect(withRows.result.current.location.search).toBe("?page=2");
    withRows.unmount();

    const empty = renderList("/lista?page=4", async () => paged([], 4, 0));
    await waitFor(() => expect(empty.result.current.list.result.isSuccess).toBe(true));
    expect(empty.result.current.location.search).toBe("?page=4");
  });

  it("arma las props de Pagination desde el resultado y cambia de página en la URL", async () => {
    const { result } = renderList("/lista", async (query) => paged([{ id: `p${query.page}` }], query.page, 25));
    expect(result.current.list.paginationProps).toBeUndefined();

    await waitFor(() => expect(result.current.list.paginationProps).toMatchObject({ page: 1, pageSize: 10, totalCount: 25, totalPages: 3, hasPrevious: false, hasNext: true }));
    act(() => result.current.list.paginationProps!.onPageChange(2));
    expect(result.current.location.search).toBe("?page=2");
    act(() => result.current.list.paginationProps!.onPageSizeChange(20));
    expect(result.current.location.search).toBe("?pageSize=20");
  });
});
