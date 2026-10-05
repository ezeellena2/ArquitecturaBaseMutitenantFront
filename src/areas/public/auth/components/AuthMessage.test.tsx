import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AuthMessage } from "./AuthMessage";

// La franja de los mensajes del ingreso y los registros (.msj de los tableros): la franja común (FormError), con la
// primera línea y, debajo, las que la completan.
describe("AuthMessage", () => {
  it("usa la franja común, con el texto y sus líneas de abajo", () => {
    render(<AuthMessage message={{ text: "El código no es válido.", details: ["Te quedan 3 intentos."] }} />);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("El código no es válido.Te quedan 3 intentos.");
    expect(alert).toHaveClass("bg-[var(--peligro-t)]", "text-[var(--peligro-tx)]");
    expect(screen.getByText("Te quedan 3 intentos.")).toHaveClass("block");
  });

  // Tablero Ingreso (.msj .sub2): la línea de abajo, a 2 del texto, en 13 y más clara.
  it("la segunda línea va debajo, en 13 y más clara", () => {
    render(<AuthMessage message={{ text: "El código no es válido.", details: ["Te quedan 3 intentos."] }} />);

    expect(screen.getByText("Te quedan 3 intentos.")).toHaveClass("block", "mt-0.5", "text-[13px]", "opacity-85");
    expect(screen.getByText("El código no es válido.")).not.toHaveClass("opacity-85");
  });

  it("la de atención es ámbar y sin mensaje no hay franja", () => {
    const { rerender } = render(<AuthMessage message={{ tone: "warning", text: "Esperá un momento antes de pedir otro código." }} />);
    expect(screen.getByRole("alert")).toHaveClass("bg-[var(--alerta-t)]", "text-[var(--alerta-tx)]");

    rerender(<AuthMessage message={null} />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
