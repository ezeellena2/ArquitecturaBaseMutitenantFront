import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { configureI18n } from "@/shared/i18n";
import { renderWithProviders } from "@/test/utils/renderWithProviders";
import { AppChromeProvider } from "./app/AppChrome";
import { FilterBar, type FilterBarFilter } from "./FilterBar";

beforeAll(async () => {
  await configureI18n([
    { code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true },
    { code: "en-US", languageCode: "en", fallbackCulture: "es-AR", isEnabled: true, isDefault: false },
  ]);
});

const filter = (key: string, name: string, overrides: Partial<FilterBarFilter> = {}): FilterBarFilter => ({
  key, label: `${name}: todos`, menuLabel: `Filtrar por ${name.toLowerCase()}`, value: "", active: false, onChange: vi.fn(),
  options: [{ value: "all", label: "Todos" }, { value: "a", label: `${name} A` }, { value: "b", label: `${name} B` }],
  ...overrides,
});

describe("FilterBar", () => {
  it("pone el buscador antes de los filtros, en una fila, con el radio de un control", () => {
    const { container } = render(
      <FilterBar label="Filtros" searchLabel="Buscar" searchValue="" onSearchChange={vi.fn()}
        filters={[{ key: "status", label: "Estado", menuLabel: "Filtrar por estado", value: "all", active: false, options: [{ value: "all", label: "Todos" }], onChange: vi.fn() }]}
        clearLabel="Limpiar" onClear={vi.fn()} />,
    );

    const bar = screen.getByRole("search", { name: "Filtros" });
    const search = screen.getByRole("searchbox", { name: "Buscar" });
    const searchContainer = search.parentElement!;
    const filterTrigger = screen.getByRole("button", { name: "Todos" });
    // La caja de los filtros (.fb) lleva 10 arriba y abajo y 12 a los costados.
    expect(bar).toHaveClass("md:px-3", "md:py-2.5");
    expect(searchContainer.parentElement).toHaveClass("flex-col", "md:flex-row");
    expect(searchContainer.parentElement!.firstElementChild).toBe(searchContainer);
    // Lienzo v104: el buscador de 36 × 360, con el borde claro, la lupa de 16 a 12 del borde, el texto a 36 y letra de 13.
    expect(searchContainer).toHaveClass("w-full", "md:w-90");
    expect(search).toHaveClass("h-9", "pl-9", "text-[0.8125rem]", "rounded-[0.5rem]", "border-[var(--borde)]");
    // 173: los filtros, de 32, sin negrita y con el radio de un control, nunca en pastilla.
    expect(filterTrigger).toHaveClass("h-8", "font-normal", "rounded-[0.5rem]");
    expect(filterTrigger).not.toHaveClass("rounded-full");
    expect(container.querySelector('[data-slot="filter-pills"]')).toContainElement(filterTrigger);
  });

  it("dibuja la lupa y la flecha del tablero", () => {
    render(<FilterBar label="Filtros" searchLabel="Buscar" searchValue="" onSearchChange={vi.fn()} clearLabel="Limpiar" onClear={vi.fn()}
      filters={[{ key: "status", label: "Estado", menuLabel: "Filtrar por estado", value: "all", active: false, options: [{ value: "all", label: "Todos" }], onChange: vi.fn() }]} />);

    expect(screen.getByRole("searchbox", { name: "Buscar" }).parentElement?.querySelector("svg circle")).toHaveAttribute("r", "6.5");
    const chevron = screen.getByRole("button", { name: "Todos" }).querySelector("svg");
    expect(chevron?.querySelector("path")).toHaveAttribute("d", "m7 10 5 5 5-5");
    expect(chevron).toHaveAttribute("stroke-width", "2");
  });

  // Tableros de listas (.fb-limpiar): «Limpiar» va en gris de 13 y se oscurece con el mouse.
  it("«Limpiar» va en gris de 13 y aparece solo con algo aplicado", async () => {
    const onClear = vi.fn();
    const { rerender } = render(<FilterBar label="Filtros" searchLabel="Buscar" searchValue="" onSearchChange={vi.fn()} filters={[]} clearLabel="Limpiar" onClear={onClear} />);
    expect(screen.queryByRole("button", { name: "Limpiar" })).not.toBeInTheDocument();

    rerender(<FilterBar label="Filtros" searchLabel="Buscar" searchValue="abc" onSearchChange={vi.fn()} filters={[]} clearLabel="Limpiar" onClear={onClear} />);
    const clear = screen.getByRole("button", { name: "Limpiar" });
    expect(clear).toHaveClass("text-[0.8125rem]", "px-2", "py-1.5", "text-[var(--t3)]", "hover:text-[var(--t1)]", "hover:bg-[var(--s2)]");
    await userEvent.click(clear);
    expect(onClear).toHaveBeenCalledOnce();
  });

  // «Criterio · Elegir» (262): el filtro es la pieza para elegir con su botón: cerrado dice «Estado: todos» o la elegida;
  // abierta, «Todos» primero y separada, la elegida con su tilde a la izquierda, sin cantidades y del ancho de sus nombres.
  it("el filtro abre la pieza para elegir, con «Todos» primero, la elegida tildada y sin cantidades", async () => {
    const onChange = vi.fn();
    renderWithProviders(<FilterBar label="Filtros" searchLabel="Buscar" searchValue="" onSearchChange={vi.fn()} clearLabel="Limpiar" onClear={vi.fn()}
      filters={[filter("state", "Estado", { onChange })]} />);

    screen.getByRole("button", { name: "Estado: todos" }).focus();
    await userEvent.keyboard("{Enter}");
    const list = await screen.findByRole("listbox", { name: "Estado" });
    expect(list.closest("[data-return-focus-to]")).toHaveClass("w-max");
    const options = within(list).getAllByRole("option");
    expect(options.map((option) => option.textContent)).toEqual(["Todos", "Estado A", "Estado B"]);
    expect(options[0]).toHaveAttribute("aria-selected", "true");
    expect(options[0]!.querySelector("svg")).not.toBeNull();
    expect(options[1]!.querySelector("svg")).toBeNull();
    expect(options[1]).not.toHaveAttribute("aria-disabled");
    expect(list.querySelector("li[role=presentation]")).not.toBeNull();
    expect(list).not.toHaveTextContent(/\d/);
    await userEvent.click(options[1]!);
    expect(onChange).toHaveBeenCalledWith("a");
  });

  // «Criterio · Menús» (144): hasta tres filtros a la vista; lo demás en un solo «Filtros», con la cantidad de aplicados,
  // que se despliega como «Columnas» y aplica cada cambio; lo aplicado ahí va en chips con su × y «Limpiar todo».
  it("del cuarto en adelante van en «Filtros», con chips y «Limpiar todo»", async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    const provider = vi.fn();
    const channel = vi.fn();
    const { container } = renderWithProviders(<FilterBar label="Filtrar respuestas" searchLabel="Buscar" searchValue="" onSearchChange={vi.fn()} clearLabel="Limpiar" onClear={onClear}
      filters={[
        filter("company", "Empresa"), filter("channel", "Canal"), filter("state", "Estado"),
        filter("received", "Recibida"),
        filter("provider", "Proveedor", { value: "a", active: true, onChange: provider }),
        filter("version", "Versión", { onChange: channel }),
      ]} />);

    const row = container.querySelector('[data-slot="filter-pills"]')!;
    for (const name of ["Empresa: todos", "Canal: todos", "Estado: todos"]) expect(within(row as HTMLElement).getByRole("button", { name })).toBeVisible();
    expect(within(row as HTMLElement).queryByRole("button", { name: "Recibida: todos" })).not.toBeInTheDocument();
    expect(screen.queryByText("Más filtros")).not.toBeInTheDocument();
    const more = within(row as HTMLElement).getByRole("button", { name: /^Filtros/ });
    // La cantidad de aplicados, como texto y con el formato de la cultura (173).
    await waitFor(() => expect(more).toHaveTextContent("Filtros1"));

    const chip = container.querySelector('[data-slot="filter-chip"]')!;
    expect(chip).toHaveTextContent("Proveedor: Proveedor A");
    expect(chip).toHaveClass("rounded-[0.5rem]");
    await user.click(within(chip as HTMLElement).getByRole("button", { name: "Quitar Proveedor: Proveedor A" }));
    expect(provider).toHaveBeenCalledWith("all");
    await user.click(screen.getByRole("button", { name: "Limpiar todo" }));
    expect(onClear).toHaveBeenCalledOnce();

    await user.click(more);
    const panel = await screen.findByRole("dialog", { name: "Filtros" });
    const tabs = within(panel).getByRole("tablist", { name: "Filtros" });
    expect(within(tabs).getAllByRole("tab").map((tab) => tab.textContent)).toEqual(["Recibida", "Proveedor", "Versión"]);
    await user.click(within(tabs).getByRole("tab", { name: "Versión" }));
    // .r311-panel .izq: lo que se está eligiendo lleva el tinte, la barra de 3 y la letra en 600 (142).
    expect(within(tabs).getByRole("tab", { name: "Versión" })).toHaveClass("bg-[var(--marca-t)]", "font-semibold", "shadow-[inset_3px_0_0_var(--marca)]");
    expect(within(tabs).getByRole("tab", { name: "Recibida" })).not.toHaveClass("shadow-[inset_3px_0_0_var(--marca)]");
    // A la derecha, la pieza para elegir (262) con el nombre del filtro: elegir lo ya elegido no vuelve a filtrar.
    const version = within(panel).getByRole("button", { name: "Versión Todos" });
    expect(panel.querySelector('input[type="radio"]')).toBeNull();
    await user.click(version);
    expect(await screen.findByRole("option", { name: "Todos" })).toHaveAttribute("aria-selected", "true");
    await user.click(screen.getByRole("option", { name: "Todos" }));
    expect(channel).not.toHaveBeenCalled();
    await user.click(version);
    await user.click(await screen.findByRole("option", { name: "Versión B" }));
    expect(channel).toHaveBeenCalledWith("b");
    expect(screen.getByRole("dialog", { name: "Filtros" })).toBeVisible();
    expect(panel).not.toHaveTextContent("Aplicar");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("sin nada aplicado en «Filtros» no hay chips ni «Limpiar todo»", () => {
    const { container } = renderWithProviders(<FilterBar label="Filtrar" searchLabel="Buscar" searchValue="" onSearchChange={vi.fn()} clearLabel="Limpiar" onClear={vi.fn()}
      filters={[filter("a", "Uno"), filter("b", "Dos"), filter("c", "Tres"), filter("d", "Cuatro")]} />);

    expect(container.querySelector('[data-slot="filter-chips"]')).toBeNull();
    expect(screen.getByRole("button", { name: "Filtros" })).toHaveTextContent(/^Filtros$/);
  });
  // 264, «Criterio · Tablas · base 2»: «Ordenar por», último en la barra y separado de los filtros, dice el orden con
  // palabras y abre la pieza con «Columna» y «Orden»; el primer toque va en el sentido útil y «Limpiar todo» no lo toca.
  describe("«Ordenar por»", () => {
    const sortColumns = [
      { id: "name", header: "Cliente", type: "text", sortable: true },
      { id: "receivedAtUtc", header: "Recibida", type: "dateTime", sortable: true },
      { id: "quantity", header: "Cantidad", type: "quantity", sortable: true },
      { id: "assignee", header: "Atiende", type: "text" },
      { id: "actions", header: "Acciones", type: "actions", sortable: true },
    ];

    it("va último, separado de los filtros, y dice el orden con palabras", () => {
      const { container, rerender } = renderWithProviders(<FilterBar label="Filtros" searchLabel="Buscar" searchValue="" onSearchChange={vi.fn()} clearLabel="Limpiar" onClear={vi.fn()}
        filters={[filter("state", "Estado")]} sort={{ columns: sortColumns, value: "-receivedAtUtc", onChange: vi.fn() }} />);

      const pills = container.querySelector('[data-slot="filter-pills"]')!;
      const sortBy = screen.getByRole("button", { name: "Ordenar por: Recibida, más reciente primero" });
      expect(pills.lastElementChild).toBe(sortBy);
      expect(sortBy.previousElementSibling).toHaveAttribute("data-slot", "sort-separator");
      expect(sortBy).toHaveClass("ml-auto");

      // Sin orden elegido, o con el compuesto con que abre la lista, dice solo «Ordenar por».
      rerender(<FilterBar label="Filtros" searchLabel="Buscar" searchValue="" onSearchChange={vi.fn()} clearLabel="Limpiar" onClear={vi.fn()}
        filters={[filter("state", "Estado")]} sort={{ columns: sortColumns, value: undefined, onChange: vi.fn() }} />);
      expect(screen.getByRole("button", { name: "Ordenar por" })).toBeInTheDocument();
    });

    it("abre «Columna» y «Orden»: una columna nueva va en su sentido útil y «Orden» lo invierte", async () => {
      const onChange = vi.fn();
      const { container } = renderWithProviders(<FilterBar label="Filtros" searchLabel="Buscar" searchValue="" onSearchChange={vi.fn()} clearLabel="Limpiar" onClear={vi.fn()}
        filters={[]} sort={{ columns: sortColumns, value: "-receivedAtUtc", onChange }} />);

      await userEvent.click(screen.getByRole("button", { name: /^Ordenar por:/ }));
      const piece = await screen.findByRole("dialog", { name: "Ordenar por" });
      expect(within(piece).getByText("Columna")).toBeInTheDocument();
      expect(within(piece).getByText("Orden")).toBeInTheDocument();

      await userEvent.click(within(piece).getByRole("button", { name: /^Orden/ }));
      const orders = await screen.findByRole("listbox", { name: "Orden" });
      expect(within(orders).getAllByRole("option").map((option) => option.textContent)).toEqual(["Más reciente primero", "Más vieja primero"]);
      await userEvent.click(within(orders).getByRole("option", { name: "Más vieja primero" }));
      expect(onChange).toHaveBeenLastCalledWith("receivedAtUtc");

      await userEvent.click(within(piece).getByRole("button", { name: /^Columna/ }));
      const list = await screen.findByRole("listbox", { name: "Columna" });
      // Solo las columnas que ordenan; nunca Acciones.
      expect(within(list).getAllByRole("option").map((option) => option.textContent)).toEqual(["Cliente", "Recibida", "Cantidad"]);
      await userEvent.click(within(list).getByRole("option", { name: "Cantidad" }));
      expect(onChange).toHaveBeenLastCalledWith("-quantity");
      expect(onChange).toHaveBeenCalledTimes(2);
      expect(container.querySelector('[data-slot="sort-separator"]')).toBeNull();
    });

    it("«Limpiar todo» no cuenta el orden ni lo saca", async () => {
      const onClear = vi.fn(), onChange = vi.fn();
      renderWithProviders(<FilterBar label="Filtros" searchLabel="Buscar" searchValue="" onSearchChange={vi.fn()} clearLabel="Limpiar" onClear={onClear}
        filters={[filter("state", "Estado")]} sort={{ columns: sortColumns, value: "name", onChange }} />);
      expect(screen.queryByRole("button", { name: "Limpiar" })).toBeNull();
      expect(screen.getByRole("button", { name: "Ordenar por: Cliente, de la A a la Z" })).toBeInTheDocument();
    });

    it("en el teléfono ocupa el ancho, arriba de la lista, y abre la pieza a pantalla completa", async () => {
      renderWithProviders(<AppChromeProvider value={{ phone: true, parent: null, subtitle: null, hideBottomNav: () => {} }}>
        <FilterBar label="Filtros" searchLabel="Buscar" searchValue="" onSearchChange={vi.fn()} clearLabel="Limpiar" onClear={vi.fn()}
          filters={[filter("state", "Estado")]} sort={{ columns: sortColumns, value: "name", onChange: vi.fn() }} />
      </AppChromeProvider>);
      const sortBy = screen.getByRole("button", { name: "Ordenar por: Cliente, de la A a la Z" });
      expect(sortBy).toHaveClass("w-full", "h-11");
      await userEvent.click(sortBy);
      const screenPiece = await screen.findByRole("dialog", { name: "Ordenar por" });
      expect(screenPiece).toHaveAttribute("data-slot", "sort-screen");
      expect(within(screenPiece).getByText("Columna")).toBeInTheDocument();
      expect(within(screenPiece).getByRole("button", { name: "Listo" })).toBeInTheDocument();
    });
  });
});
