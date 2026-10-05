import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./button";

// Tablero «Criterio · Botones»: cuatro tipos (principal, secundario, peligro y enlace) y tres tamaños, más el de ícono.
describe("Button · Criterio · Botones", () => {
  // «Criterio · Botones» y «Criterio · Decisiones» (lienzo v107, 04/10/2026): el principal lleva el degradé de la marca en
  // todas las pantallas, también en el teléfono, con su sombra; con el mouse encima, un poco más claro.
  it("normal de 36 con texto de 14, chico de 32 con 13 y grande de 44 con 15; el principal con el degradé de la marca", () => {
    render(
      <>
        <Button>{"Guardar cambios"}</Button>
        <Button size="sm" variant="outline">{"Agregar"}</Button>
        <Button size="lg">{"Continuar"}</Button>
      </>,
    );

    const standard = screen.getByRole("button", { name: "Guardar cambios" });
    expect(standard).toHaveClass("h-9", "text-[14px]", "bg-[linear-gradient(180deg,var(--marca)_0%,var(--marca-h)_100%)]", "hover:brightness-105");
    expect(standard).toHaveClass("shadow-[0_1px_2px_var(--marca-sombra),inset_0_1px_0_var(--brillo)]");
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

  // «Criterio · Botones», Guardando: dice qué está haciendo y no se puede volver a tocar. El aro blanco de 14 va antes del
  // texto, con la opacidad de 0,85 (no la de un botón apagado). Lo que decía el botón queda invisible y le guarda el
  // ancho: el botón no se achica mientras guarda.
  it("mientras guarda dice qué hace, con el aro de 14 y opacidad 0,85, no se puede tocar y no se achica", () => {
    render(<Button pending>{"Guardar cambios"}</Button>);

    const button = screen.getByRole("button", { name: "Guardando…" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("data-pending", "true");
    expect(button).toHaveClass("disabled:opacity-85");
    expect(button).not.toHaveClass("disabled:opacity-50");
    const ring = button.querySelector("[data-slot='button-ring']");
    expect(ring).toHaveClass("size-3.5", "rounded-full", "border-2", "animate-spin", "motion-reduce:animate-none");
    expect(ring).toHaveAttribute("aria-hidden", "true");
    const saved = screen.getByText("Guardar cambios");
    expect(saved).toHaveClass("invisible");
    expect(saved).toHaveAttribute("aria-hidden", "true");
  });

  it("dice lo que hace cada botón: invitar, agregar, enviar", () => {
    render(<Button pending pendingLabel="Invitando…">{"Invitar"}</Button>);

    expect(screen.getByRole("button", { name: "Invitando…" })).toBeDisabled();
  });

  it("fuera de ese estado no lleva el aro ni guarda otro texto", () => {
    render(<Button>{"Guardar cambios"}</Button>);

    const button = screen.getByRole("button", { name: "Guardar cambios" });
    expect(button).toBeEnabled();
    expect(button).not.toHaveAttribute("data-pending");
    expect(button.querySelector("[data-slot='button-ring']")).toBeNull();
  });
});
