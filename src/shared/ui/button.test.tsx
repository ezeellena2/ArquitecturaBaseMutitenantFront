import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { describe, expect, it, vi } from "vitest";
import { AppChromeProvider } from "./app/AppChrome";
import { Button } from "./button";

vi.mock("sonner", async (importOriginal) => ({ ...(await importOriginal<typeof import("sonner")>()), toast: vi.fn() }));

// Tablero «Criterio · Botones»: cuatro tipos (principal, secundario, peligro y enlace) y tres tamaños, más el de ícono.
describe("Button · Criterio · Botones", () => {
  // «Criterio · Botones» (173): el principal es sólido en la marca en todas las pantallas, también en el teléfono, sin
  // degradé ni sombra; con el mouse encima, en --marca-h.
  it("normal de 36 con texto de 14, chico de 32 con 13 y grande de 44 con 15; el principal, sólido en la marca", () => {
    render(
      <>
        <Button>{"Guardar cambios"}</Button>
        <Button size="sm" variant="outline">{"Agregar"}</Button>
        <Button size="lg">{"Continuar"}</Button>
      </>,
    );

    const standard = screen.getByRole("button", { name: "Guardar cambios" });
    // 173: el principal es sólido en la marca, sin degradé ni sombra, y pasa a --marca-h con el mouse.
    expect(standard).toHaveClass("h-9", "text-[0.875rem]", "bg-[var(--marca)]", "hover:bg-[var(--marca-h)]");
    expect(standard.className).not.toMatch(/gradient|shadow-/);
    expect(screen.getByRole("button", { name: "Agregar" })).toHaveClass("h-8", "text-[0.8125rem]", "border-[var(--borde2)]");
    expect(screen.getByRole("button", { name: "Continuar" })).toHaveClass("h-11", "text-[0.9375rem]");
  });

  it("peligro con borde en la pantalla y relleno solo en el diálogo que confirma; el enlace sin caja", () => {
    render(
      <>
        <Button variant="danger">{"Dar de baja"}</Button>
        <Button variant="destructive">{"Quitar"}</Button>
        <Button variant="link">{"Verificar"}</Button>
      </>,
    );

    expect(screen.getByRole("button", { name: "Dar de baja" })).toHaveClass("border-[var(--peligro-borde)]", "text-[var(--peligro)]", "bg-[var(--superficie)]");
    expect(screen.getByRole("button", { name: "Quitar" })).toHaveClass("bg-[var(--peligro)]", "text-[var(--superficie)]");
    expect(screen.getByRole("button", { name: "Verificar" })).toHaveClass("h-auto", "px-0", "text-[var(--marca-tx)]");
  });

  it("los de ícono miden 32 × 32, sin borde, y se nombran para el lector de pantalla", () => {
    render(<Button variant="icon" size="icon" aria-label="Más acciones"><span aria-hidden="true">{"⋮"}</span></Button>);

    expect(screen.getByRole("button", { name: "Más acciones" })).toHaveClass("size-8", "bg-transparent");
  });

  // «Criterio · Botones», Mientras trabaja (base de la 12): dice qué está haciendo y no se puede volver a tocar. El aro
  // blanco de 14 va antes del texto, con su color y sin atenuarse. Lo que decía el botón queda invisible y le guarda el
  // ancho: el botón no se achica mientras guarda.
  it("mientras guarda dice qué hace, con el aro de 14 y sin atenuarse, no se puede tocar y no se achica", () => {
    render(<Button pending>{"Guardar cambios"}</Button>);

    const button = screen.getByRole("button", { name: "Guardando…" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("data-pending", "true");
    expect(button).toHaveClass("disabled:opacity-100");
    expect(button).not.toHaveClass("disabled:opacity-85");
    expect(button).not.toHaveClass("disabled:opacity-50");
    const ring = button.querySelector("[data-slot='button-ring']");
    expect(ring).toHaveClass("size-3.5", "rounded-full", "border-2", "animate-spin", "motion-reduce:animate-none");
    expect(ring).toHaveAttribute("aria-hidden", "true");
    const saved = screen.getByText("Guardar cambios");
    expect(saved).toHaveClass("invisible");
    expect(saved).toHaveAttribute("aria-hidden", "true");
  });

  it("un botón de ícono cambia su dibujo por el aro y conserva su nombre", () => {
    render(<Button variant="icon" size="icon" aria-label="Más acciones" pending><span data-testid="dibujo" aria-hidden="true">{"⋮"}</span></Button>);

    const button = screen.getByRole("button", { name: "Más acciones" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button.querySelector("[data-slot='button-ring']")).not.toBeNull();
    expect(screen.queryByTestId("dibujo")).toBeNull();
    expect(button).not.toHaveTextContent("Guardando…");
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

  // «Criterio · Botones» (116): un botón apagado cuyo motivo no es obvio lo dice en su tooltip, sin texto al lado ni debajo;
  // sigue en el recorrido del teclado para que se lea, y tocarlo no hace nada.
  it("apagado con su motivo: lo dice en el tooltip y en su descripción, y no hace nada", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<Button disabledReason="Guardá los cambios antes de publicar." onClick={onClick}>{"Publicar"}</Button>);

    const button = screen.getByRole("button", { name: "Publicar" });
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).not.toBeDisabled();
    expect(button).toHaveClass("opacity-50");
    expect(button).toHaveAccessibleDescription("Guardá los cambios antes de publicar.");
    // Primero el mouse encima: el tooltip dice el motivo. Un clic de Radix lo cierra, así que va después.
    await user.hover(button);
    expect((await screen.findByRole("tooltip")).textContent).toContain("Guardá los cambios antes de publicar.");
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
    expect(toast).not.toHaveBeenCalled();
  });

  it("en el teléfono, tocar un botón apagado muestra su motivo en la franja oscura de abajo", async () => {
    render(<AppChromeProvider value={{ phone: true, parent: null, subtitle: null, hideBottomNav: () => {} }}>
      <Button disabledReason="Guardá los cambios antes de publicar.">{"Publicar"}</Button>
    </AppChromeProvider>);

    await userEvent.click(screen.getByRole("button", { name: "Publicar" }));
    expect(toast).toHaveBeenCalledWith("Guardá los cambios antes de publicar.");
  });
});
