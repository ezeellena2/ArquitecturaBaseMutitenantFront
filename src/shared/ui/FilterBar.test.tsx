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
    // La caja de los filtros (.fb) lleva 10 arriba y abajo y 12 a los costados: con el buscador de 36 mide 58.
    expect(bar).toHaveClass("md:px-3", "md:py-2.5");
    expect(bar).not.toHaveClass("md:p-3");
    // Lienzo v104 (tableros Usuarios, Roles, Empresas, Empresa y Auditoría): el buscador de 36 × 360, con el borde claro, la
    // lupa de 16 a 12 del borde, el texto a 36 y letra de 13; los filtros, de 32 y sin negrita.
    expect(searchContainer).toHaveClass("w-full", "md:w-[360px]");
    expect(search).toHaveClass("h-9", "pl-9", "text-[13px]", "rounded-[8px]", "border-[var(--borde)]");
    expect(search).not.toHaveClass("h-8", "pl-8");
    expect(searchContainer?.querySelector("svg")).toHaveClass("left-3", "size-4");
    expect(filterTrigger).toHaveClass("h-8", "font-normal");
    expect(filterTrigger).not.toHaveClass("lg:h-9", "min-h-11");
    expect(bar.firstElementChild).toBe(searchContainer);
    expect(container.querySelector('[data-slot="filter-pills"]')).toContainElement(filterTrigger);
  });

  // Tablero Roles: sin filtro, el botón dice «Vale en: todos» y el menú tiene «Todos» marcado.
  it("sin filtro muestra su propio texto y marca la opción «Todos»", async () => {
    render(
      <FilterBar label="Filtros" searchLabel="Buscar" searchValue="" onSearchChange={vi.fn()} clearLabel="Limpiar" onClear={vi.fn()}
        filters={[{
          key: "vale", label: "Vale en: todos", menuLabel: "Filtrar por dónde vale", value: "", active: false, onChange: vi.fn(),
          options: [{ value: "all", label: "Todos" }, { value: "Organization", label: "Toda la organización" }],
        }]} />,
    );

    const trigger = screen.getByRole("button", { name: "Vale en: todos" });
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    const all = await screen.findByRole("menuitemradio", { name: "Todos" });
    expect(all).toHaveAttribute("aria-checked", "true");
    // Tablero Usuarios (filtro abierto): la opción elegida va en petróleo claro, sin el punto de radio.
    expect(all).toHaveClass("data-[state=checked]:bg-[var(--marca-t)]", "data-[state=checked]:text-[var(--marca-tx)]");
    expect(all.querySelector("svg")).toBeNull();
    expect(screen.getByRole("menuitemradio", { name: "Toda la organización" })).toHaveAttribute("aria-checked", "false");
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
