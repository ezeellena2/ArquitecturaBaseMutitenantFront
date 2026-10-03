import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmptyState } from "./EmptyState";

describe("EmptyState · criterio compacto", () => {
  it("mantiene título, detalle y espacio dentro de la escala del lienzo", () => {
    const { container } = render(<EmptyState title="No hay resultados" description="Probá con otros filtros." />);
    const title = screen.getByRole("heading", { name: "No hay resultados" });
    const description = screen.getByText("Probá con otros filtros.");

    expect(container.firstElementChild).toHaveClass("rounded-[12px]", "p-8", "gap-2");
    expect(title).toHaveClass("text-[14px]");
    expect(description).toHaveClass("text-[13px]");
  });
});
