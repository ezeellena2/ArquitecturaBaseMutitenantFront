import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { axe } from "vitest-axe";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";

it("mantiene el inicio personal vacío, navegación propia y accesibilidad sin contenido de negocio", async () => {
  const { container } = renderRouteWithProviders("/", { as: "consumer-empty" });
  expect(await screen.findByRole("link", { name: "Inicio" })).toHaveAttribute("aria-current", "page");
  expect(screen.getByRole("main")).toBeEmptyDOMElement();
  expect(screen.queryByRole("button", { name: "Administración" })).not.toBeInTheDocument();
  expect(await axe(container)).toHaveNoViolations();
});

it("avisa que falta método propio y enlaza Mi cuenta desde Personal", async () => {
  renderRouteWithProviders("/", { as: "consumer-needs-personal-method" });
  expect(await screen.findByText("Agregá un correo personal o tu WhatsApp para no perder tu cuenta si dejás la empresa.")).toBeVisible();
  expect(screen.getByRole("link", { name: "Agregar" })).toHaveAttribute("href", "/cuenta");
});
