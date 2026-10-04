import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusDot } from "./StatusDot";

// Tablero «Criterio · Tablas»: el estado es un punto de color de 8 px y la palabra, sin fondo.
describe("StatusDot · Criterio · Tablas", () => {
  it("dibuja un punto de 8 y la palabra en el color del texto, sin pastilla", () => {
    render(<StatusDot tone="warning" label="Vencida" />);

    const state = screen.getByText("Vencida");
    expect(state).toHaveClass("inline-flex", "items-center", "text-[13px]", "text-[var(--t1)]");
    expect(state).not.toHaveClass("rounded-full", "px-2", "bg-[var(--alerta-t)]");
    expect(state.querySelector("[data-slot='status-dot']")).toHaveClass("size-2", "shrink-0", "rounded-full", "bg-[var(--alerta)]");
  });
});
