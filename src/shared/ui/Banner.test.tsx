import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Banner } from "./Banner";

describe("Banner", () => {
  it("describes a condition that is still true as a status, with its action", () => {
    render(<Banner action={<button type="button">{"Agregar correo"}</button>}>{"Falta el correo."}</Banner>);

    const banner = screen.getByRole("status");
    expect(banner).toHaveTextContent("Falta el correo.");
    expect(banner).toContainElement(screen.getByRole("button", { name: "Agregar correo" }));
  });

  // «Criterio · Avisos» (.cartel) y tableros Inicio-Personal y Usuario (.w-cartel): 44 de alto como mínimo, padding
  // 6/8/6/14, radio 10 y letra de 13.
  it("has the measures of the board's notice", () => {
    render(<Banner tone="warning">{"Pidió la baja de su cuenta."}</Banner>);

    const banner = screen.getByRole("status");
    expect(banner).toHaveClass("min-h-11", "rounded-[0.625rem]", "py-1.5", "pr-2", "pl-3.5", "text-[0.8125rem]");
    expect(banner.querySelector("svg")).toHaveClass("size-4.5");
    // Los carteles del lienzo (.cartel, .w-cartel) dibujan su ícono con trazo 2.
    expect(banner.querySelector("svg")).toHaveAttribute("stroke-width", "2");
  });

  // 210 («Criterio · Avisos», Avisos según el tipo): el fondo nunca dice el tipo. El cartel es blanco, con la tinta de
  // siempre y el borde de las cajas; el tipo va en el filo de 3 a la izquierda y en el ícono, del mismo color:
  // información en gris con (i), atención en ámbar con triángulo y error en rojo con octógono.
  it.each([
    ["info", "status", "--t2", "M12 11v5"],
    ["warning", "status", "--alerta", "M12 10v4"],
    ["danger", "alert", "--peligro", "m14.5 9.5-5 5"],
  ] as const)("el de %s es blanco, con el filo y el ícono de su tipo", (tone, role, color, mark) => {
    render(<Banner tone={tone}>{"Aviso."}</Banner>);

    const banner = screen.getByRole(role);
    expect(banner).toHaveClass("bg-[var(--superficie)]", "text-[var(--t1)]", "border", "border-[var(--borde)]", "border-l-[3px]", `border-l-[var(${color})]`);
    expect(banner.className).not.toMatch(/bg-\[var\(--(?:marca|alerta|peligro)-t\)\]|text-\[var\(--(?:marca|alerta|peligro)-tx\)\]/);
    const icon = banner.querySelector("svg")!;
    expect(icon).toHaveClass(`text-[var(${color})]`);
    expect([...icon.querySelectorAll("path")].map((path) => path.getAttribute("d"))).toContain(mark);
  });

  it("is an alert when it is an error", () => {
    render(<Banner tone="danger">{"Este número ya es de otra cuenta."}</Banner>);

    expect(screen.getByRole("alert")).toHaveTextContent("Este número ya es de otra cuenta.");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("describes a risk as a status, not as an error", () => {
    // Una advertencia no es algo que haya que corregir para seguir: el lector la anuncia sin interrumpir.
    render(<Banner tone="warning">{"Es su único medio de ingreso."}</Banner>);

    expect(screen.getByRole("status")).toHaveTextContent("Es su único medio de ingreso.");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("keeps its icon away from a screen reader", () => {
    const { container } = render(<Banner>{"Falta el correo."}</Banner>);

    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });
});
