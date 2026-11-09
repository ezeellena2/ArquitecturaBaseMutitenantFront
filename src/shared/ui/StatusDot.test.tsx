import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusDot } from "./StatusDot";

// Tablero «Criterio · Tablas»: el estado es un punto de color de 8 px y la palabra, sin fondo.
describe("StatusDot · Criterio · Tablas", () => {
  it("dibuja un punto de 8 y la palabra en el color del texto, sin pastilla", () => {
    render(<StatusDot tone="warning" label="Vencida" />);

    const state = screen.getByText("Vencida").parentElement!;
    expect(state).toHaveClass("inline-flex", "items-center", "text-[0.8125rem]", "text-[var(--t1)]");
    expect(state).not.toHaveClass("rounded-full", "px-2", "bg-[var(--alerta-t)]");
    expect(state.querySelector("[data-slot='status-dot']")).toHaveClass("size-2", "shrink-0", "rounded-full", "bg-[var(--punto-alerta)]");
  });

  // En una celda angosta («Invitación pendiente» a 390) la palabra baja de renglón: el texto largo se ve entero (174).
  it("no corta la palabra con «…» si no entra", () => {
    render(<StatusDot tone="pending" label="Invitación pendiente" />);

    expect(screen.getByText("Invitación pendiente")).toHaveClass("min-w-0");
    expect(screen.getByText("Invitación pendiente")).not.toHaveClass("truncate");
    expect(screen.getByText("Invitación pendiente").parentElement).toHaveClass("max-w-full");
  });
});
