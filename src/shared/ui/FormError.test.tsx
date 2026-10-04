import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppChromeProvider } from "./app/AppChrome";
import { FormError } from "./FormError";

describe("FormError", () => {
  it("muestra el mensaje de error del lienzo con ícono y sin borde", () => {
    render(<FormError message="El código no es válido." />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("El código no es válido.");
    expect(alert.querySelector("svg")).not.toBeNull();
    expect(alert).not.toHaveClass("border");
  });

  // «Criterio · Formularios»: la franja de 13 en la compu y en las páginas públicas (M-Ingreso). En la app del teléfono,
  // la letra de los avisos del teléfono (M-Avisos: 14,5), como el cartel del 409.
  it("en la app del teléfono usa la letra de los avisos del teléfono", () => {
    const { unmount } = render(<FormError message="Tiene que quedar al menos un Dueño activo." />);
    expect(screen.getByRole("alert")).toHaveClass("text-[13px]");
    unmount();

    render(<AppChromeProvider value={{ phone: true, parent: null, subtitle: null, hideBottomNav: () => {} }}>
      <FormError message="Tiene que quedar al menos un Dueño activo." />
    </AppChromeProvider>);
    expect(screen.getByRole("alert")).toHaveClass("text-[14.5px]", "leading-[1.4]");
    expect(screen.getByRole("alert")).not.toHaveClass("text-[13px]");
  });

  it("usa tono de aviso para una espera de reenvío", () => {
    render(<FormError message="Esperá un momento" tone="warning" />);
    expect(screen.getByRole("alert")).toHaveClass("bg-[var(--alerta-t)]");
    expect(screen.getByRole("alert").querySelector("svg")).toHaveClass("text-[var(--alerta)]");
  });
});
