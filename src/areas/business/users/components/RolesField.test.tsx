import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RolesField } from "./RolesField";

describe("RolesField", () => {
  // Tableros Usuario y M-Usuario-Empresa: «Todos» va a la derecha del rótulo, en la misma línea. En la compu, con la letra
  // del rótulo (12,5) y en 500; en el teléfono, en 14 con la casilla de 20 y radio 6, a 8 del texto.
  it("pone «Todos» a la derecha del rótulo, con la medida de cada tablero", () => {
    render(<RolesField label="Roles en la empresa" allLabel="Todos" options={[{ value: "role-a", label: "Solo lectura" }]}
      value={[]} onChange={() => {}} placeholder="Ninguno" />);

    const all = screen.getByRole("checkbox", { name: "Todos" });
    const label = all.closest("label")!;
    const row = label.parentElement!;
    expect(row).toHaveClass("justify-between");
    expect(row.firstElementChild).toHaveTextContent("Roles en la empresa");
    expect(row.lastElementChild).toBe(label);
    expect(label).toHaveClass("gap-1.5", "text-[12.5px]", "font-medium", "text-[var(--t2)]", "max-md:gap-2", "max-md:text-[14px]");
    expect(all).toHaveClass("max-md:size-5", "max-md:rounded-[6px]", "max-md:border-[1.5px]");
  });
});
