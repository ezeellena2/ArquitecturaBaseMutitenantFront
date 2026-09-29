import { renderHook, act } from "@testing-library/react";
import { MemoryRouter, useLocation, useNavigate } from "react-router";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { usePagination } from "./usePagination";

function wrapperFor(url: string, previousUrl?: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <MemoryRouter initialEntries={previousUrl ? [previousUrl, url] : [url]} initialIndex={previousUrl ? 1 : 0}>{children}</MemoryRouter>;
  };
}

type PageResult = { items: readonly unknown[]; totalCount: number };

function renderPagination(url: string, defaultSort?: string, previousUrl?: string) {
  return renderHook(
    ({ pageResult }: { pageResult?: PageResult }) => ({
      pagination: usePagination(pageResult, { defaultSort }),
      location: useLocation(),
      navigate: useNavigate(),
    }),
    { wrapper: wrapperFor(url, previousUrl), initialProps: { pageResult: undefined as PageResult | undefined } },
  );
}

describe("usePagination", () => {
  it("reads the state from the URL", () => {
    const { result } = renderPagination("/usuarios?page=2&sort=-email&search=ana");

    expect(result.current.pagination.query).toEqual({ page: 2, pageSize: 10, sort: "-email", search: "ana" });
  });

  it("resets to the first page when the search changes", () => {
    const { result } = renderPagination("/usuarios?page=2&sort=-email&search=ana");

    act(() => result.current.pagination.setSearch("beto"));

    expect(result.current.pagination.page).toBe(1);
    expect(result.current.pagination.search).toBe("beto");
    expect(result.current.location.search).toBe("?sort=-email&search=beto");
  });

  it("toggles ascending, descending and default sort", () => {
    const { result } = renderPagination("/usuarios?page=2", "name");

    expect(result.current.pagination.sort).toBe("name");
    expect(result.current.pagination.query.sort).toBe("name");

    act(() => result.current.pagination.toggleSort("email"));
    expect(result.current.pagination.sort).toBe("email");
    expect(result.current.pagination.page).toBe(1);

    act(() => result.current.pagination.toggleSort("email"));
    expect(result.current.pagination.sort).toBe("-email");

    act(() => result.current.pagination.toggleSort("email"));
    expect(result.current.pagination.sort).toBe("name");
    expect(result.current.location.search).toBe("");
  });

  it("alterna un orden predeterminado descendente hacia ascendente y de regreso", () => {
    const { result } = renderPagination("/usuarios?page=2", "-createdAtUtc");

    expect(result.current.pagination.sort).toBe("-createdAtUtc");
    act(() => result.current.pagination.toggleSort("createdAtUtc"));
    expect(result.current.pagination.sort).toBe("createdAtUtc");
    expect(result.current.location.search).toBe("?sort=createdAtUtc");

    act(() => result.current.pagination.toggleSort("createdAtUtc"));
    expect(result.current.pagination.sort).toBe("-createdAtUtc");
    expect(result.current.location.search).toBe("");
  });

  it.each([
    ["?page=0&pageSize=15", ""],
    ["?page=-2&pageSize=20.5", ""],
    ["?page=1.5&pageSize=abc", ""],
    ["?page=Infinity&pageSize=0", ""],
    ["?page=01&pageSize=020", "?pageSize=20"],
    ["?page=2.0&pageSize=20.0", "?page=2&pageSize=20"],
  ])("normaliza %s a %s con replace sin agregar historial", (query, expected) => {
    const { result } = renderPagination(`/usuarios${query}`, undefined, "/anterior");

    expect(result.current.pagination.page).toBe(expected.includes("page=2") ? 2 : 1);
    expect(result.current.pagination.pageSize).toBe(expected.includes("pageSize=20") ? 20 : 10);
    expect(result.current.location.search).toBe(expected);

    act(() => result.current.navigate(-1));
    expect(result.current.location.pathname).toBe("/anterior");
  });

  it("resets the page when size changes and omits the default size from the URL", () => {
    const { result } = renderPagination("/usuarios?page=3&pageSize=20");

    act(() => result.current.pagination.setPageSize(10));

    expect(result.current.pagination.page).toBe(1);
    expect(result.current.pagination.pageSize).toBe(10);
    expect(result.current.location.search).toBe("");

    act(() => result.current.pagination.setPageSize(50));
    expect(result.current.location.search).toBe("?pageSize=50");
  });

  it("replaces an out-of-range page with the last page when results are empty", () => {
    const { result, rerender } = renderPagination("/usuarios?page=9", undefined, "/anterior");

    expect(result.current.pagination.page).toBe(9);
    rerender({ pageResult: { items: [], totalCount: 25 } });

    expect(result.current.pagination.page).toBe(3);
    expect(result.current.location.search).toBe("?page=3");
    expect("correctPage" in result.current.pagination).toBe(false);

    act(() => result.current.navigate(-1));
    expect(result.current.location.pathname).toBe("/anterior");
  });

  it("keeps the current page when it contains results", () => {
    const { result, rerender } = renderPagination("/usuarios?page=2");

    rerender({ pageResult: { items: [{}], totalCount: 25 } });

    expect(result.current.pagination.page).toBe(2);
    expect(result.current.location.search).toBe("?page=2");
  });

  it("no salta de página cuando el listado completo está vacío", () => {
    const { result, rerender } = renderPagination("/usuarios?page=4");

    rerender({ pageResult: { items: [], totalCount: 0 } });

    expect(result.current.pagination.page).toBe(4);
  });
});
