import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./button";

describe("Button · Criterio v65", () => {
  it("matches the board's responsive standard and compact sizes with a solid primary color", () => {
    render(
      <>
        <Button>{"Guardar cambios"}</Button>
        <Button size="sm" variant="outline">{"Agregar"}</Button>
        <Button size="lg">{"Continuar"}</Button>
      </>,
    );

    const standard = screen.getByRole("button", { name: "Guardar cambios" });
    const compact = screen.getByRole("button", { name: "Agregar" });
    const large = screen.getByRole("button", { name: "Continuar" });

    expect(standard).toHaveClass("h-[34px]", "lg:h-9", "text-[13px]", "lg:text-[14px]", "bg-[var(--marca)]");
    expect(standard).not.toHaveClass("bg-linear-to-b");
    expect(compact).toHaveClass("h-7", "lg:h-8", "text-[12.5px]", "lg:text-[13px]");
    expect(large).toHaveClass("h-11");
  });

  it("keeps icon-only buttons at 32 px and accessible by name", () => {
    render(<Button size="icon" aria-label="Más acciones"><span aria-hidden="true">{"⋮"}</span></Button>);

    expect(screen.getByRole("button", { name: "Más acciones" })).toHaveClass("size-8");
  });
});
