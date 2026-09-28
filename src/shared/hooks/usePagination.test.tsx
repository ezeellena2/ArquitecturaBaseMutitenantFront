import { renderHook, act } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { usePagination } from "./usePagination";

function wrapperFor(url: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>;
  };
}

function renderPagination(url: string, defaultSort?: string) {
  return renderHook(
    () => ({ pagination: usePagination({ defaultSort }), location: useLocation() }),
    { wrapper: wrapperFor(url) },
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
    const { result } = renderPagination("/usuarios?page=9");

    act(() => result.current.pagination.correctPage([], 25));

    expect(result.current.pagination.page).toBe(3);
    expect(result.current.location.search).toBe("?page=3");
  });

  it("keeps the current page when it contains results", () => {
    const { result } = renderPagination("/usuarios?page=2");

    act(() => result.current.pagination.correctPage([{}], 25));

    expect(result.current.pagination.page).toBe(2);
    expect(result.current.location.search).toBe("?page=2");
  });
});
