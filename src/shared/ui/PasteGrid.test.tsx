import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PasteGrid } from "./PasteGrid";

vi.mock("@/shared/format/useFormat", () => ({ useFormat: () => ({ isLoading: false, formatInteger: String }) }));

describe("PasteGrid", () => {
  // accesibilidad: el borde de la celda para pegar está siempre; el foco se ve aparte, con el halo de siempre.
  it("la celda para pegar muestra el foco con el halo, aunque no lleve outline", () => {
    render(<PasteGrid label="Pegá las filas" columns={[{ key: "code", label: "Código" }, { key: "text", label: "Texto" }]} rows={null} onPaste={vi.fn()} />);
    const target = screen.getByRole("textbox");
    expect(target).toHaveClass("outline-none", "focus-visible:ring-[3px]", "focus-visible:ring-[var(--foco-halo)]");
  });
});
