import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";

it("avisa que falta método propio y enlaza Mi cuenta desde Personal", async () => {
  renderRouteWithProviders("/", { as: "consumer-needs-personal-method" });
  expect(await screen.findByText("Agregá un correo personal o tu WhatsApp para no perder tu cuenta si dejás la empresa.")).toBeVisible();
  expect(screen.getByRole("link", { name: "Agregar" })).toHaveAttribute("href", "/cuenta");
});
