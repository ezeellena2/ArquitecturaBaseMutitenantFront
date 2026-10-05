import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { renderWithProviders } from "@/test/utils/renderWithProviders";
import { AppChromeProvider } from "./app/AppChrome";
import { FormField } from "./FormField";
import { SearchSelect, type SearchSelectOption } from "./SearchSelect";

const few: SearchSelectOption[] = [
  { value: "es-AR", label: "Español (Argentina)", description: "27/09/2026 14:35 · 1.234,50" },
  { value: "en-US", label: "English (United States)", description: "09/27/2026 2:35 PM · 1,234.50" },
];
const many: SearchSelectOption[] = Array.from({ length: 12 }, (_, index) => ({
  value: `zone-${index}`, label: index === 7 ? "Córdoba (GMT−3)" : `Zona ${index + 1}`, keywords: index === 7 ? "America/Argentina/Cordoba" : undefined,
}));

function Harness({ options, initial = "" }: { options: SearchSelectOption[]; initial?: string }) {
  const [value, setValue] = useState(initial);
  return <>
    <FormField label="Idioma y región">
      <SearchSelect options={options} value={value} onChange={setValue} placeholder="Elegí uno" searchLabel="Buscar" />
    </FormField>
    <output data-testid="value">{value}</output>
  </>;
}

// Tablero M-Cuenta-Agregar («País»): en el teléfono la lista es una hoja desde abajo con el rótulo del campo como título,
// la ✕ y filas de 52 con letra de 16; la elegida, en petróleo con el tilde, sin fondo.
describe("SearchSelect en el teléfono", () => {
  const phone = { phone: true, parent: null, subtitle: null, hideBottomNav: () => {} };

  it("abre una hoja con el título del campo y elige tocando una fila", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppChromeProvider value={phone}><Harness options={few} initial="es-AR" /></AppChromeProvider>);

    await user.click(screen.getByRole("combobox", { name: "Idioma y región" }));
    const sheet = await screen.findByRole("dialog", { name: "Idioma y región" });
    expect(within(sheet).getByRole("button", { name: "Cerrar" })).toBeVisible();
    const chosen = within(sheet).getByRole("option", { name: /^Español \(Argentina\)/ });
    expect(chosen).toHaveClass("min-h-[52px]", "gap-3", "text-[16px]", "font-medium", "text-[var(--marca-tx)]");
    expect(chosen).not.toHaveClass("bg-[var(--marca-t)]");
    expect(within(sheet).queryByRole("searchbox")).not.toBeInTheDocument();

    await user.click(within(sheet).getByRole("option", { name: /^English/ }));
    expect(screen.getByTestId("value")).toHaveTextContent("en-US");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("con más de 10 opciones suma el buscador en la hoja", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppChromeProvider value={phone}><Harness options={many} /></AppChromeProvider>);

    await user.click(screen.getByRole("combobox", { name: "Idioma y región" }));
    const sheet = await screen.findByRole("dialog", { name: "Idioma y región" });
    await user.type(within(sheet).getByRole("searchbox", { name: "Buscar" }), "cordoba");
    expect(within(sheet).getAllByRole("option").map((option) => option.textContent)).toEqual(["Córdoba (GMT−3)"]);
  });
});

// Tablero «Criterio · Formularios»: un solo control por dato. El desplegable elige una opción y, con más de 10,
// suma un buscador arriba, adentro de la lista.
describe("SearchSelect · Criterio · Formularios", () => {
  it("con pocas opciones abre la lista sin buscador, marca la elegida y elige con el teclado", async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(<Harness options={few} initial="es-AR" />);

    const control = screen.getByRole("combobox", { name: "Idioma y región" });
    expect(control).toHaveTextContent("Español (Argentina)");
    expect(control).toHaveClass("h-9", "rounded-[8px]", "border-[var(--borde2)]");
    // En el teléfono (.in2 svg), la flechita de 18 y casi negra.
    expect(control.querySelector("svg")).toHaveClass("max-md:size-[18px]", "max-md:text-[var(--t1)]");
    // Tablero Usuario (.o-dd > button.ct[aria-expanded="true"]): abierto, el campo lleva el borde petróleo y el halo.
    expect(control).toHaveClass("aria-expanded:border-[var(--marca)]", "aria-expanded:ring-[3px]", "aria-expanded:ring-[var(--foco-halo)]");
    control.focus();
    await user.keyboard("{ArrowDown}");

    const list = await screen.findByRole("listbox");
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
    // «Criterio · Formularios», Desplegable (2026-10-05): debajo del campo, alineada a su izquierda y de su mismo ancho.
    const popover = list.closest("[data-side]");
    expect(popover).toHaveAttribute("data-side", "bottom");
    expect(popover).toHaveAttribute("data-align", "start");
    expect(popover).toHaveClass("w-(--radix-popover-trigger-width)", "min-w-0");
    expect(within(list).getByRole("option", { name: /^Español \(Argentina\)/ })).toHaveAttribute("aria-selected", "true");
    // Tableros (.op): 10 px entre el ícono, el nombre y lo que va a la derecha.
    expect(within(list).getByRole("option", { name: /^Español \(Argentina\)/ })).toHaveClass("gap-2.5");
    // Criterio · Formularios: la elegida, además del fondo petróleo claro, va en semi-negrita.
    expect(within(list).getByRole("option", { name: /^Español \(Argentina\)/ })).toHaveClass("font-medium");
    expect(within(list).getByRole("option", { name: /^English/ })).not.toHaveClass("font-medium");
    expect(within(list).getByText("09/27/2026 2:35 PM · 1,234.50")).toHaveClass("text-[12px]", "text-[var(--t3)]");
    await user.keyboard("{ArrowDown}{Enter}");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByTestId("value")).toHaveTextContent("en-US");
    expect(control).toHaveFocus();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("con más de 10 opciones suma el buscador arriba y filtra sin tildes ni mayúsculas", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness options={many} />);

    const control = screen.getByRole("combobox", { name: "Idioma y región" });
    expect(control).toHaveTextContent("Elegí uno");
    expect(control.querySelector("span")).toHaveClass("text-[var(--t3)]");
    await user.click(control);

    const search = await screen.findByRole("searchbox", { name: "Buscar" });
    expect(search).toHaveFocus();
    await user.type(search, "cordoba");
    expect(screen.getAllByRole("option")).toHaveLength(1);
    await user.keyboard("{Enter}");
    expect(screen.getByTestId("value")).toHaveTextContent("zone-7");

    await user.click(control);
    await user.type(await screen.findByRole("searchbox", { name: "Buscar" }), "Marte");
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
    expect(screen.getByText("Ninguna opción coincide.")).toBeVisible();
  });

  it("elige con el mouse y cierra", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness options={few} />);

    await user.click(screen.getByRole("combobox", { name: "Idioma y región" }));
    await user.click(await screen.findByRole("option", { name: /^English/ }));

    expect(screen.getByTestId("value")).toHaveTextContent("en-US");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});
