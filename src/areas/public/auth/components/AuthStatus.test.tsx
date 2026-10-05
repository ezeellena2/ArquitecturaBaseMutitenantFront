import { render, screen, within } from "@testing-library/react";
import { Check } from "lucide-react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Button } from "@/shared/ui/button";
import { ClockIcon } from "@/shared/ui/icons";
import { AuthStatus } from "./AuthStatus";

// La pantalla de estado del ingreso, los registros y la invitación (tableros Ingreso, Registro, Registro-Empresa e
// Invitacion): el círculo de 52, el título de 24 y su bajada centrados, y los botones de 44 uno debajo del otro.
describe("AuthStatus", () => {
  it("arma el círculo, el título, la bajada y los botones como los tableros", async () => {
    const { container } = render(<AuthStatus icon={ClockIcon} tone="warning" title="Recibimos el pedido" detail="Te avisamos por correo."
      actions={<><Button size="lg">{"Volver al inicio"}</Button><Button size="lg" variant="outline">{"Salir"}</Button></>} />);

    const circle = container.querySelector("span[aria-hidden='true']");
    expect(circle).toHaveClass("size-[52px]", "self-center", "rounded-full", "bg-[var(--alerta-t)]", "text-[var(--alerta)]");
    // El reloj del set (shared/ui/icons), de 20 con trazo 1,75.
    expect(circle?.querySelector("svg")).toHaveClass("size-5");
    expect(circle?.querySelector("svg")).toHaveAttribute("stroke-width", "1.75");
    const title = screen.getByRole("heading", { level: 1, name: "Recibimos el pedido" });
    expect(title).toHaveClass("text-[24px]", "leading-[1.2]", "font-bold", "tracking-[-0.02em]");
    expect(title.parentElement).toHaveClass("text-center");
    expect(screen.getByText("Te avisamos por correo.")).toHaveClass("mt-1.5", "text-sm", "leading-normal", "text-[var(--t2)]");
    const actions = screen.getByRole("button", { name: "Volver al inicio" }).parentElement!;
    expect(actions).toHaveClass("flex", "flex-col", "gap-2.5");
    expect(within(actions).getAllByRole("button").map((button) => button.textContent)).toEqual(["Volver al inicio", "Salir"]);
    expect(container.firstElementChild).toHaveClass("flex", "flex-col", "gap-[22px]");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("pone lo de en medio entre el título y los botones, y el tilde grande de la invitación", () => {
    const { container } = render(<AuthStatus icon={Check} tone="ok" largeIcon title="Te sumaste a Grupo Delta"
      actions={<Button size="lg">{"Entrar"}</Button>}><p>{"El cartel"}</p></AuthStatus>);

    const icon = container.querySelector("span[aria-hidden='true'] svg");
    expect(icon).toHaveAttribute("width", "22");
    expect(icon).toHaveAttribute("stroke-width", "2");
    const column = container.firstElementChild!;
    expect([...column.children].map((child) => child.textContent)).toEqual(["", "Te sumaste a Grupo Delta", "El cartel", "Entrar"]);
  });

  it.each([
    ["neutral", "bg-[var(--s3)]", "text-[var(--t2)]"],
    ["ok", "bg-[var(--ok-t)]", "text-[var(--ok)]"],
    ["brand", "bg-[var(--marca-t)]", "text-[var(--marca-tx)]"],
    ["danger", "bg-[var(--peligro-t)]", "text-[var(--peligro)]"],
  ] as const)("el círculo %s lleva el fondo suave y el ícono en el color del estado", (tone, background, color) => {
    const { container } = render(<AuthStatus icon={ClockIcon} tone={tone} title="Estado" />);
    expect(container.querySelector("span[aria-hidden='true']")).toHaveClass(background, color);
  });
});
