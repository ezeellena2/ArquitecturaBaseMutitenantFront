import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormError } from "./FormError";
import { ClockIcon } from "./icons";

describe("FormError", () => {
  it("muestra el mensaje de error del lienzo con ícono y sin borde", () => {
    render(<FormError message="El código no es válido." />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("El código no es válido.");
    expect(alert.querySelector("svg")).not.toBeNull();
    expect(alert).not.toHaveClass("border");
  });

  // «Criterio · Formularios» (.aviso-mal): en la compu, 13 con interlineado 1,5, padding 10/12, radio 8, ícono de 16 al
  // medio de la primera línea y el rojo de los avisos.
  it("en la compu tiene las medidas de la franja del criterio", () => {
    render(<FormError message="Tiene que quedar al menos un Dueño activo." />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveClass("text-[13px]", "leading-normal", "px-3", "py-2.5", "rounded-[8px]", "bg-[var(--peligro-t)]", "text-[var(--peligro-tx)]");
    expect(alert.querySelector("svg")).toHaveClass("size-4", "mt-0.5");
  });

  // Lienzo v100 (.aviso-mal.tel) y v104 (.msj de M-Ingreso, M-Registro, M-Registro-Empresa y M-Invitacion): en el
  // teléfono, la letra de los avisos del teléfono (14,5 con interlineado 1,4), padding 12/14, radio 12 y el ícono arriba
  // si el texto ocupa dos líneas. Vale igual en la app y en las páginas públicas, que no tienen el marco de la app.
  it("en el teléfono usa la letra y las medidas de los avisos del teléfono, también en las páginas públicas", () => {
    render(<FormError message="Tiene que quedar al menos un Dueño activo." />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveClass("max-md:text-[14.5px]", "max-md:leading-[1.4]", "max-md:px-3.5", "max-md:py-3", "max-md:rounded-xl", "items-start");
    expect(alert.querySelector("svg")).toHaveClass("size-4", "max-md:mt-px");
  });

  it("usa tono de aviso para una espera de reenvío", () => {
    render(<FormError message="Esperá un momento" tone="warning" />);
    expect(screen.getByRole("alert")).toHaveClass("bg-[var(--alerta-t)]", "text-[var(--alerta-tx)]");
  });
});

// Tableros Ingreso y M-Ingreso («Tu sesión venció», .msj.info): la misma franja en el petróleo de la información. Es algo
// que pasó y no algo para corregir: el lector de pantalla lo anuncia sin interrumpir. La pantalla elige el ícono.
describe("FormError con tono de información", () => {
  it("usa el petróleo de la información, se anuncia sin interrumpir y lleva el ícono que le pasan", () => {
    render(<FormError tone="info" icon={ClockIcon} message="Tu sesión venció. Ingresá de nuevo." />);

    const notice = screen.getByRole("status");
    expect(notice).toHaveTextContent("Tu sesión venció. Ingresá de nuevo.");
    expect(notice).toHaveClass("bg-[var(--marca-t)]", "text-[var(--marca-tx)]", "text-[13px]", "max-md:text-[14.5px]");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(notice.querySelector("svg circle")).toHaveAttribute("r", "8.5");
    expect(notice.querySelector("svg")).toHaveClass("size-4");
  });
});
