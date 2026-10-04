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

  // «Criterio · Formularios» (.aviso-mal): en la compu y en las páginas públicas, 13 con padding 10/12, radio 8, ícono
  // de 16 y el rojo de los avisos.
  it("en la compu tiene las medidas de la franja del criterio", () => {
    render(<FormError message="Tiene que quedar al menos un Dueño activo." />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveClass("text-[13px]", "px-3", "py-2.5", "rounded-[8px]", "bg-[var(--peligro-t)]", "text-[var(--peligro-tx)]");
    expect(alert.querySelector("svg")).toHaveClass("size-4");
  });

  // Lienzo v100 (.aviso-mal.tel): en la app del teléfono, la letra de los avisos del teléfono (14,5 con interlineado
  // 1,4), padding 12/14, radio 12 y el ícono arriba si el texto ocupa dos líneas.
  it("en la app del teléfono usa la letra y las medidas de los avisos del teléfono", () => {
    render(<AppChromeProvider value={{ phone: true, parent: null, subtitle: null, hideBottomNav: () => {} }}>
      <FormError message="Tiene que quedar al menos un Dueño activo." />
    </AppChromeProvider>);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveClass("text-[14.5px]", "leading-[1.4]", "px-3.5", "py-3", "rounded-xl", "items-start");
    expect(alert).not.toHaveClass("text-[13px]");
    expect(alert.querySelector("svg")).toHaveClass("size-4", "mt-px");
  });

  it("usa tono de aviso para una espera de reenvío", () => {
    render(<FormError message="Esperá un momento" tone="warning" />);
    expect(screen.getByRole("alert")).toHaveClass("bg-[var(--alerta-t)]", "text-[var(--alerta-tx)]");
  });
});
