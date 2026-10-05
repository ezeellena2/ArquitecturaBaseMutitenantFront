import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { axe } from "vitest-axe";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";
import { asPhone } from "@/test/utils/phone";

it("mantiene el inicio personal con su banda «Inicio», navegación propia y accesibilidad sin contenido de negocio", async () => {
  const { container } = renderRouteWithProviders("/", { as: "consumer-empty" });
  expect(await screen.findByRole("link", { name: "Inicio" })).toHaveAttribute("aria-current", "page");
  // Tablero Inicio-Personal: la banda «Inicio» y nada más.
  const main = screen.getByRole("main");
  expect(within(main).getByRole("heading", { level: 1, name: "Inicio" })).toBeVisible();
  expect(main).toHaveTextContent(/^Inicio$/);
  expect(screen.queryByRole("button", { name: "Administración" })).not.toBeInTheDocument();
  expect(await axe(container)).toHaveNoViolations();
});

// Tablero Inicio-Personal: «Agregar» abre Cuenta-Agregar ahí mismo, sin ir a Mi cuenta (punto 1.12).
it("avisa que falta método propio y «Agregar» abre el diálogo en el Inicio", async () => {
  const { router } = renderRouteWithProviders("/", { as: "consumer-needs-personal-method" });
  expect(await screen.findByText("Agregá un correo personal o tu WhatsApp para no perder tu cuenta si dejás la empresa.")).toBeVisible();
  await userEvent.click(screen.getByRole("button", { name: "Agregar" }));

  expect(await screen.findByRole("dialog", { name: "Agregar correo" })).toBeVisible();
  expect(router.state.location.pathname).toBe("/");
});

// Tablero M-Inicio-Personal: en el teléfono el aviso es una tarjeta petróleo clara con «Agregar» como botón principal.
it("en el teléfono el aviso es una tarjeta con «Agregar» principal", async () => {
  const restore = asPhone();
  try {
    renderRouteWithProviders("/", { as: "consumer-needs-personal-method" });
    const text = await screen.findByText("Agregá un correo personal o tu WhatsApp para no perder tu cuenta si dejás la empresa.");
    expect(text.parentElement).toHaveClass("rounded-[16px]", "bg-[var(--marca-t)]");
    expect(text).toHaveClass("text-[15px]", "text-[var(--sugerencia-tx)]");
    expect(screen.getByRole("button", { name: "Agregar" })).toHaveAttribute("data-variant", "default");
  } finally {
    restore();
  }
});
