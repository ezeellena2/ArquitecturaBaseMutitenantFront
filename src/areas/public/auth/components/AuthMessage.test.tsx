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

  it("la de atención es ámbar y sin mensaje no hay franja", () => {
    const { rerender } = render(<AuthMessage message={{ tone: "warning", text: "Esperá un momento antes de pedir otro código." }} />);
    expect(screen.getByRole("alert")).toHaveClass("bg-[var(--alerta-t)]", "text-[var(--alerta-tx)]");

    rerender(<AuthMessage message={null} />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
