import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormError } from "./FormError";
import { ClockIcon } from "./icons";

describe("FormError", () => {
  it("muestra el mensaje de error del lienzo con su ícono", () => {
    render(<FormError message="El código no es válido." />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("El código no es válido.");
    expect(alert.querySelector("svg")).not.toBeNull();
  });

  // «Criterio · Formularios» (.aviso-mal): en la compu, 13 con interlineado 1,5, padding 10/12, radio 8 y el ícono de 16
  // al medio de la primera línea.
  it("en la compu tiene las medidas de la franja del criterio", () => {
    render(<FormError message="Tiene que quedar al menos un Dueño activo." />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveClass("text-[0.8125rem]", "leading-normal", "px-3", "py-2.5", "rounded-[0.5rem]");
    expect(alert.querySelector("svg")).toHaveClass("size-4", "mt-0.5");
    // .aviso-mal y .msj: el ícono con trazo 2, como el de los tableros.
    expect(alert.querySelector("svg")).toHaveAttribute("stroke-width", "2");
  });

  // Lienzo v100 (.aviso-mal.tel) y v104 (.msj de M-Ingreso, M-Registro, M-Registro-Empresa y M-Invitacion): en el
  // teléfono, la letra de los avisos del teléfono (14,5 con interlineado 1,4), padding 12/14, radio 12 y el ícono arriba
  // si el texto ocupa dos líneas. Vale igual en la app y en las páginas públicas, que no tienen el marco de la app.
  it("en el teléfono usa la letra y las medidas de los avisos del teléfono, también en las páginas públicas", () => {
    render(<FormError message="Tiene que quedar al menos un Dueño activo." />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveClass("max-md:text-[0.90625rem]", "max-md:leading-[1.4]", "max-md:px-3.5", "max-md:py-3", "max-md:rounded-xl", "items-start");
    expect(alert.querySelector("svg")).toHaveClass("size-4", "max-md:mt-px");
  });

  // 210 («Criterio · Avisos», Avisos según el tipo): la franja de error de un formulario es blanca, con la tinta de
  // siempre y el borde de las cajas; el tipo va en el filo de 3 a la izquierda y en el ícono, del mismo color.
  it.each([
    ["danger", "--peligro", "m14.5 9.5-5 5"],
    ["warning", "--alerta", "M12 10v4"],
  ] as const)("la de %s es blanca, con el filo y el ícono de su tipo", (tone, color, mark) => {
    render(<FormError message="Esperá un momento" tone={tone} />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveClass("bg-[var(--superficie)]", "text-[var(--t1)]", "border", "border-[var(--borde)]", "border-l-[3px]", `border-l-[var(${color})]`);
    expect(alert.className).not.toMatch(/bg-\[var\(--(?:marca|alerta|peligro)-t\)\]/);
    const icon = alert.querySelector("svg")!;
    expect(icon).toHaveClass(`text-[var(${color})]`);
    expect([...icon.querySelectorAll("path")].map((path) => path.getAttribute("d"))).toContain(mark);
  });
});

// Tableros Ingreso y M-Ingreso («Tu sesión venció», .msj.info): la misma franja, de información. Es algo que pasó y no
// algo para corregir: el lector de pantalla lo anuncia sin interrumpir. La pantalla elige el ícono.
describe("FormError con tono de información", () => {
  it("lleva el filo y el ícono grises de la información (210), se anuncia sin interrumpir y usa el ícono que le pasan", () => {
    render(<FormError tone="info" icon={ClockIcon} message="Tu sesión venció. Ingresá de nuevo." />);

    const notice = screen.getByRole("status");
    expect(notice).toHaveTextContent("Tu sesión venció. Ingresá de nuevo.");
    expect(notice).toHaveClass("bg-[var(--superficie)]", "text-[var(--t1)]", "border-l-[3px]", "border-l-[var(--t2)]", "text-[0.8125rem]", "max-md:text-[0.90625rem]");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(notice.querySelector("svg circle")).toHaveAttribute("r", "8.5");
    expect(notice.querySelector("svg")).toHaveClass("size-4", "text-[var(--t2)]");
  });
});
