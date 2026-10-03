import { screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { axe } from "vitest-axe";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";

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

it("avisa que falta método propio y enlaza Mi cuenta desde Personal", async () => {
  renderRouteWithProviders("/", { as: "consumer-needs-personal-method" });
  expect(await screen.findByText("Agregá un correo personal o tu WhatsApp para no perder tu cuenta si dejás la empresa.")).toBeVisible();
  // El tablero abre Cuenta-Agregar en el Inicio; hace falta el diálogo compartido (nota para Codex).
  expect(screen.getByRole("link", { name: "Agregar" })).toHaveAttribute("href", "/cuenta");
});
