import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmptyState } from "./EmptyState";

describe("EmptyState · criterio compacto", () => {
  it("mantiene título, detalle y espacio dentro de la escala del lienzo", () => {
    const { container } = render(<EmptyState title="No hay resultados" description="Probá con otros filtros." />);
    // Tableros de listas (.vacio strong) y axe (heading-order): el título va en negrita, sin ser un encabezado que salte
    // del título de la pantalla a un tercer nivel.
    const title = screen.getByText("No hay resultados");
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    const description = screen.getByText("Probá con otros filtros.");

    expect(container.firstElementChild).toHaveClass("rounded-[12px]", "p-8", "gap-2");
    expect(title).toHaveClass("text-[14px]");
    expect(description).toHaveClass("text-[13px]");
  });
});
