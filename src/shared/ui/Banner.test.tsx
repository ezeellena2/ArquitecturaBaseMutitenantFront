import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Banner } from "./Banner";

describe("Banner", () => {
  it("describes a condition that is still true as a status, with its action", () => {
    render(<Banner action={<button type="button">{"Agregar correo"}</button>}>{"Falta el correo."}</Banner>);

    const banner = screen.getByRole("status");
    expect(banner).toHaveTextContent("Falta el correo.");
    expect(banner).toHaveClass("bg-[var(--marca-t)]", "text-[var(--marca-tx)]");
    // Agregado de la revisión de capturas: el cartel va sin borde, como en «Criterio · Avisos».
    expect(banner).not.toHaveClass("border");
    expect(banner).toContainElement(screen.getByRole("button", { name: "Agregar correo" }));
  });

  // «Criterio · Avisos» (.cartel) y tableros Inicio-Personal y Usuario (.w-cartel): 44 de alto como mínimo, padding
  // 6/8/6/14, radio 10 y letra de 13; el texto, en el color del aviso (el ámbar, en --alerta-tx).
  it("has the measures of the board's notice and its text in the notice's color", () => {
    render(<Banner tone="warning">{"Pidió la baja de su cuenta."}</Banner>);

    const banner = screen.getByRole("status");
    expect(banner).toHaveClass("min-h-11", "rounded-[10px]", "py-1.5", "pr-2", "pl-3.5", "text-[13px]", "text-[var(--alerta-tx)]");
    expect(banner.querySelector("svg")).toHaveClass("size-[18px]");
  });

  it("is an alert when it is an error", () => {
    render(<Banner tone="danger">{"Este número ya es de otra cuenta."}</Banner>);

    expect(screen.getByRole("alert")).toHaveTextContent("Este número ya es de otra cuenta.");
    expect(screen.getByRole("alert")).toHaveClass("bg-[var(--peligro-t)]", "text-[var(--peligro-tx)]");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("describes a risk as a status, not as an error", () => {
    // Una advertencia no es algo que haya que corregir para seguir: el lector la anuncia sin interrumpir.
    render(<Banner tone="warning">{"Es su único medio de ingreso."}</Banner>);

    expect(screen.getByRole("status")).toHaveTextContent("Es su único medio de ingreso.");
    expect(screen.getByRole("status")).toHaveClass("bg-[var(--alerta-t)]");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("keeps its icon away from a screen reader", () => {
    const { container } = render(<Banner>{"Falta el correo."}</Banner>);

    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });
});
