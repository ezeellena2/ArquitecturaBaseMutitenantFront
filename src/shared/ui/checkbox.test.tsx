import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Checkbox } from "./checkbox";

// Tablero Rol (un rol de sistema): las casillas que no se pueden tocar van grises, como las bloqueadas del navegador, y no
// en el petróleo de la marca a media transparencia.
describe("Checkbox", () => {
  it("bloqueada va gris, sin transparencia, marcada o no", () => {
    render(<>
      <Checkbox checked disabled aria-label="Ver usuarios" />
      <Checkbox checked={false} disabled aria-label="Invitar usuarios" />
    </>);

    for (const name of ["Ver usuarios", "Invitar usuarios"]) {
      const box = screen.getByRole("checkbox", { name });
      expect(box).toBeDisabled();
      expect(box).toHaveClass("disabled:opacity-100", "disabled:border-[var(--borde2)]", "disabled:bg-[var(--s2)]",
        "disabled:data-[state=checked]:border-[var(--borde2)]", "disabled:data-[state=checked]:bg-[var(--borde2)]");
      expect(box).not.toHaveClass("disabled:opacity-50");
    }
  });
});
