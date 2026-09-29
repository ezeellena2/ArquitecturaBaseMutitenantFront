import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormError } from "./FormError";

describe("FormError", () => {
  it("muestra el mensaje de error del lienzo con ícono y sin borde", () => {
    render(<FormError message="El código no es válido." />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("El código no es válido.");
    expect(alert.querySelector("svg")).not.toBeNull();
    expect(alert).not.toHaveClass("border");
  });

  it("usa tono de aviso para una espera de reenvío", () => {
    render(<FormError message="Esperá un momento" tone="warning" />);
    expect(screen.getByRole("alert")).toHaveClass("bg-[var(--alerta-t)]");
  });
});
