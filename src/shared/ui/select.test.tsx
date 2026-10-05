import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

describe("SelectTrigger · Criterio v65", () => {
  it("uses regular field size and compact filter size responsively", () => {
    render(
      <>
        <Select value="value">
          <SelectTrigger aria-label="Tipo de dato"><SelectValue /></SelectTrigger>
        </Select>
        <Select value="10">
          <SelectTrigger size="sm" aria-label="Filas por página"><SelectValue /></SelectTrigger>
        </Select>
      </>,
    );

    const regular = screen.getByRole("combobox", { name: "Tipo de dato" });
    const compact = screen.getByRole("combobox", { name: "Filas por página" });
    expect(regular).toHaveClass("h-9", "text-[13px]");
    expect(regular).not.toHaveClass("lg:h-11", "text-sm");
    expect(compact).toHaveClass("h-8");
    expect(compact).not.toHaveClass("lg:h-9");
    // Tablero Usuario (.o-dd > button.ct[aria-expanded="true"]): abierto, el campo lleva el borde petróleo y el halo.
    expect(regular).toHaveClass("aria-expanded:border-[var(--marca)]", "aria-expanded:ring-[3px]", "aria-expanded:ring-[var(--foco-halo)]");
    // Tableros M-Configuracion, M-Cuenta y M-Usuario-Empresa (.in2 svg): en el teléfono, la flechita de 18 y casi negra.
    expect(regular.querySelector("svg")).toHaveClass("max-md:size-[18px]", "max-md:text-[var(--t1)]", "max-md:opacity-100");
  });
});

// «Criterio · Formularios», Desplegable (decisión del usuario del 2026-10-05): todo desplegable se abre debajo del campo y
// del mismo ancho, como los filtros y el ⋮ de una fila; nunca encima del campo con la opción elegida sobre él.
describe("SelectContent · Criterio · Formularios, Desplegable", () => {
  it("abre la lista debajo del campo, alineada a su izquierda y del ancho del campo", async () => {
    const user = userEvent.setup();
    render(
      <Select defaultValue="delta">
        <SelectTrigger aria-label="Usuario"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="delta">{"Delta S.A."}</SelectItem>
          <SelectItem value="beta">{"Beta S.R.L."}</SelectItem>
        </SelectContent>
      </Select>,
    );

    screen.getByRole("combobox", { name: "Usuario" }).focus();
    await user.keyboard("{Enter}");
    const list = await screen.findByRole("listbox");
    // Debajo y al costado del campo (el popper de Radix), no sobre él como la opción alineada.
    expect(list.closest("[data-radix-popper-content-wrapper]")).not.toBeNull();
    expect(list).toHaveAttribute("data-side", "bottom");
    expect(list).toHaveAttribute("data-align", "start");
    // Del mismo ancho que el campo: ni un mínimo propio ni el ancho de la opción más larga.
    expect(list).toHaveClass("w-(--radix-select-trigger-width)", "min-w-0");
    // Como los menús y las listas que se abren (.menu, .o-lst): 10 de radio, el borde de siempre y su sombra larga.
    expect(list).toHaveClass("rounded-[10px]", "border-[var(--borde)]", "shadow-[var(--sombra-menu)]");
  });

  // Tablero Usuario (.o-lst .op .n2 y .d): el nombre y su explicación con interlineado 1,35; la explicación en 12, gris
  // claro y de 300 como mucho, así la de «Deshabilitado» va en dos líneas.
  it("lleva la explicación debajo, en gris claro y de 300 como mucho", async () => {
    const user = userEvent.setup();
    render(
      <Select defaultValue="active">
        <SelectTrigger aria-label="Estado"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="active" description="Entra a la organización y a sus empresas.">{"Activo"}</SelectItem>
        </SelectContent>
      </Select>,
    );

    screen.getByRole("combobox", { name: "Estado" }).focus();
    await user.keyboard("{Enter}");
    const explanation = await screen.findByText("Entra a la organización y a sus empresas.");
    expect(explanation).toHaveClass("text-[12px]", "text-[var(--t3)]", "max-w-[300px]", "whitespace-normal");
    expect(explanation.parentElement).toHaveClass("leading-[1.35]");
  });
});
