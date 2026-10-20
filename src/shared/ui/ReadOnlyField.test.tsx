import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { ReadOnlyField } from "./ReadOnlyField";

// «Criterio · Formularios», A11 (v113): lo que no se puede cambiar va en el mismo campo que al editar, apagado: fondo y texto
// grises, como SearchSelect apagado. Nunca un rótulo con texto suelto.
describe("ReadOnlyField", () => {
  it("dibuja el campo apagado con su rótulo, y el desplegable apagado con su flechita gris", async () => {
    const { container } = render(<>
      <ReadOnlyField label="Nombre">{"Grupo Delta"}</ReadOnlyField>
      <ReadOnlyField control="select" label="Moneda">{"Peso argentino (ARS)"}</ReadOnlyField>
    </>);
    const name = screen.getByRole("group", { name: "Nombre" });
    const box = name.querySelector("[data-slot=read-only-field]");
    expect(box).toHaveClass("border-[var(--borde)]", "bg-[var(--s2)]", "text-[var(--t2)]", "h-9", "max-md:h-12");
    expect(box).toHaveTextContent("Grupo Delta");
    expect(box?.querySelector("svg")).toBeNull();
    const currency = screen.getByRole("group", { name: "Moneda" });
    expect(currency.querySelector("[data-slot=read-only-field] svg")).toHaveClass("text-[var(--t3)]");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("un texto largo conserva sus renglones; vacío, va en el gris de un campo vacío", () => {
    render(<ReadOnlyField long muted label="Descripción">{"Sin descripción"}</ReadOnlyField>);
    const box = screen.getByRole("group", { name: "Descripción" }).querySelector("[data-slot=read-only-field]");
    expect(box).toHaveClass("min-h-[84px]", "items-start");
    expect(within(box as HTMLElement).getByText("Sin descripción")).toHaveClass("text-[var(--t3)]", "whitespace-pre-wrap");
  });

  it("lleva adentro la moneda adelante y el enlace a la derecha, y el ⓘ junto al rótulo", async () => {
    const { container } = render(<>
      <ReadOnlyField label="Tope del mes" prefix="USD" info={<button type="button" aria-label="Lo fija la plataforma.">{"i"}</button>}>{"100,00"}</ReadOnlyField>
      <ReadOnlyField label="Clave de Anthropic" action={<button type="button">{"Cambiar"}</button>}>{"•••• 4F2a"}</ReadOnlyField>
    </>);
    const budget = screen.getByRole("group", { name: "Tope del mes" });
    expect(budget.querySelector("[data-slot=read-only-field]")).toHaveTextContent("USD100,00");
    expect(within(budget).getByRole("button", { name: "Lo fija la plataforma." }).closest("[data-slot=read-only-field]")).toBeNull();
    const key = screen.getByRole("group", { name: "Clave de Anthropic" });
    expect(within(key).getByRole("button", { name: "Cambiar" }).closest("[data-slot=read-only-field]")).not.toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });
});
