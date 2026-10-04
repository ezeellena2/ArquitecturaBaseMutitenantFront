import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Textarea } from "./textarea";

// «Criterio · Formularios» (.ctl.area) y los tableros con un cuadro de texto (Rol, Página pública, Cuenta-Baja): 84 de alto
// en la compu y 104 en el teléfono (.ap-cmp .ct.area); crece con lo escrito y no tiene el tirador para cambiarle el tamaño.
describe("Textarea", () => {
  it("mide 84 en la compu y 104 en el teléfono, crece con lo escrito y no tiene tirador", () => {
    render(<Textarea aria-label="Descripción" />);
    const box = screen.getByRole("textbox", { name: "Descripción" });
    expect(box).toHaveClass("min-h-[84px]", "max-md:min-h-[104px]", "field-sizing-content", "resize-none");
    expect(box).not.toHaveClass("min-h-16");
  });
});
