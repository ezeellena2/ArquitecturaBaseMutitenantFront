import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./button";

// Tablero «Criterio · Botones»: cuatro tipos (principal, secundario, peligro y enlace) y tres tamaños, más el de ícono.
describe("Button · Criterio · Botones", () => {
  // «Criterio · Botones» (.cb-pri): el principal es petróleo plano y, con el mouse encima, un tono más oscuro; sin degradé ni
  // sombra («Otros tamaños, colores, radios o sombras», en Prohibido).
  it("normal de 36 con texto de 14, chico de 32 con 13 y grande de 44 con 15; el principal plano, como el criterio", () => {
    render(
      <>
        <Button>{"Guardar cambios"}</Button>
        <Button size="sm" variant="outline">{"Agregar"}</Button>
        <Button size="lg">{"Continuar"}</Button>
      </>,
    );

    const standard = screen.getByRole("button", { name: "Guardar cambios" });
    expect(standard).toHaveClass("h-9", "text-[14px]", "bg-[var(--marca)]", "hover:bg-[var(--marca-h)]");
    expect(standard.className).not.toContain("gradient");
    expect(standard.className).not.toContain("shadow-[");
    expect(screen.getByRole("button", { name: "Agregar" })).toHaveClass("h-8", "text-[13px]", "border-[var(--borde2)]");
    expect(screen.getByRole("button", { name: "Continuar" })).toHaveClass("h-11", "text-[15px]");
  });

  it("peligro con borde en la pantalla y relleno solo en el diálogo que confirma; el enlace sin caja", () => {
    render(
      <>
        <Button variant="danger">{"Dar de baja"}</Button>
        <Button variant="destructive">{"Quitar"}</Button>
        <Button variant="link">{"Verificar"}</Button>
      </>,
    );

    expect(screen.getByRole("button", { name: "Dar de baja" })).toHaveClass("border-[var(--peligro-borde)]", "text-[var(--peligro)]", "bg-[var(--lado-activo)]");
    expect(screen.getByRole("button", { name: "Quitar" })).toHaveClass("bg-[var(--peligro)]", "text-[var(--lado-activo)]");
    expect(screen.getByRole("button", { name: "Verificar" })).toHaveClass("h-auto", "px-0", "text-[var(--marca-tx)]");
  });

  it("los de ícono miden 32 × 32, sin borde, y se nombran para el lector de pantalla", () => {
    render(<Button variant="icon" size="icon" aria-label="Más acciones"><span aria-hidden="true">{"⋮"}</span></Button>);

    expect(screen.getByRole("button", { name: "Más acciones" })).toHaveClass("size-8", "bg-transparent");
  });
});
