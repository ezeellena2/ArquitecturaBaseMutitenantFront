import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FilterBar } from "./FilterBar";

describe("FilterBar", () => {
  it("places the full-width search before the filter pills on phones", () => {
    const { container } = render(
      <FilterBar
        label="Filtros"
        searchLabel="Buscar"
        searchValue=""
        onSearchChange={vi.fn()}
        filters={[{
          key: "status",
          label: "Estado",
          menuLabel: "Filtrar por estado",
          value: "all",
          active: false,
          options: [{ value: "all", label: "Todos" }],
          onChange: vi.fn(),
        }]}
        clearLabel="Limpiar"
        onClear={vi.fn()}
      />,
    );

    const bar = screen.getByRole("search", { name: "Filtros" });
    const search = screen.getByRole("searchbox", { name: "Buscar" });
    const searchContainer = search.parentElement;
    const filterTrigger = screen.getByRole("button", { name: "Todos" });

    expect(bar).toHaveClass("flex-col", "md:flex-row");
    expect(searchContainer).toHaveClass("w-full", "md:w-[300px]");
    expect(bar.firstElementChild).toBe(searchContainer);
    expect(container.querySelector('[data-slot="filter-pills"]')).toContainElement(filterTrigger);
  });

  it("keeps clear hidden until a search or a filter is active", async () => {
    const onClear = vi.fn();
    const { rerender } = render(
      <FilterBar label="Filtros" searchLabel="Buscar" searchValue="" onSearchChange={vi.fn()} filters={[]} clearLabel="Limpiar" onClear={onClear} />,
    );
    expect(screen.queryByRole("button", { name: "Limpiar" })).not.toBeInTheDocument();

    rerender(<FilterBar label="Filtros" searchLabel="Buscar" searchValue="abc" onSearchChange={vi.fn()} filters={[]} clearLabel="Limpiar" onClear={onClear} />);
    await userEvent.click(screen.getByRole("button", { name: "Limpiar" }));
    expect(onClear).toHaveBeenCalledOnce();
  });
});
