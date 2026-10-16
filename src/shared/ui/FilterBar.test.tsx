import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FilterBar } from "./FilterBar";

// La cantidad pasa por NumberText; acá basta un formato que la deje igual.
vi.mock("@/shared/format/useFormat", () => ({ useFormat: () => ({ isLoading: false, formatInteger: (value: number) => String(value) }) }));

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

  // Tableros de listas (.fb-limpiar: Usuarios, Roles, Empresas, Auditoría y «Criterio · Tablas»): «Limpiar» va en gris de
  // 13, con 6 y 8 de relleno (la regla que sigue a la de 14), y se oscurece con el mouse, sin el petróleo de un enlace.
  // Tableros Usuarios, Roles y Empresas (.fb-bus, .fb-sel): la lupa y la flecha del filtro son las del lienzo.
  it("dibuja la lupa y la flecha del tablero", () => {
    render(<FilterBar label="Filtros" searchLabel="Buscar" searchValue="" onSearchChange={vi.fn()} clearLabel="Limpiar" onClear={vi.fn()}
      filters={[{ key: "status", label: "Estado", menuLabel: "Filtrar por estado", value: "all", active: false, options: [{ value: "all", label: "Todos" }], onChange: vi.fn() }]} />);

    expect(screen.getByRole("searchbox", { name: "Buscar" }).parentElement?.querySelector("svg circle")).toHaveAttribute("r", "6.5");
    const chevron = screen.getByRole("button", { name: "Todos" }).querySelector("svg");
    expect(chevron?.querySelector("path")).toHaveAttribute("d", "m7 10 5 5 5-5");
    expect(chevron).toHaveAttribute("stroke-width", "2");
  });

  it("«Limpiar» va en gris de 13, como los tableros", () => {
    render(<FilterBar label="Filtros" searchLabel="Buscar" searchValue="zzz" onSearchChange={vi.fn()} filters={[]} clearLabel="Limpiar" onClear={vi.fn()} />);

    const clear = screen.getByRole("button", { name: "Limpiar" });
    expect(clear).toHaveClass("text-[13px]", "px-2", "py-1.5", "text-[var(--t3)]", "hover:text-[var(--t1)]", "hover:bg-[var(--s2)]");
    expect(clear).not.toHaveClass("text-[var(--marca-tx)]");
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

  // Tablero Usuarios (filtro abierto, lienzo v107): el menú del filtro no lleva líneas entre opciones (esas son del ⋮,
  // «Criterio · Menús»); tiene 4 de relleno y cada opción, de 34 con radio 8, se resalta adentro en gris claro; la elegida
  // va en petróleo claro con 500 y el conteo, en 12 gris a 16 del texto.
  it("el menú del filtro va sin líneas entre opciones y con el resaltado del tablero", async () => {
    render(
      <FilterBar label="Filtros" searchLabel="Buscar" searchValue="" onSearchChange={vi.fn()} clearLabel="Limpiar" onClear={vi.fn()}
        filters={[{
          key: "state", label: "Estado: todos", menuLabel: "Filtrar por estado", value: "", active: false, onChange: vi.fn(),
          options: [{ value: "all", label: "Todos", count: 3 }, { value: "Active", label: "Activos", count: 2 }],
        }]} />,
    );

    screen.getByRole("button", { name: "Estado: todos" }).focus();
    await userEvent.keyboard("{Enter}");
    const menu = await screen.findByRole("menu");
    // «Criterio · Menús» (Medidas): un menú mide de 220 a 320 de ancho.
    expect(menu).toHaveClass("p-1", "min-w-[220px]");
    for (const name of [/^Todos/, /^Activos/]) {
      const option = screen.getByRole("menuitemradio", { name });
      expect(option).not.toHaveClass("border-t");
      expect(option).toHaveClass("min-h-[34px]", "rounded-[8px]", "px-2.5", "py-1.5", "gap-2", "focus:bg-[var(--s2)]");
    }
    const all = screen.getByRole("menuitemradio", { name: /^Todos/ });
    expect(all).toHaveClass("data-[state=checked]:bg-[var(--marca-t)]", "data-[state=checked]:font-medium");
    expect(within(all).getByText("3").parentElement).toHaveClass("ml-auto", "pl-4", "text-xs", "text-[var(--t3)]", "tabular-nums");
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
