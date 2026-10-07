import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";

describe("frontera pública por host", () => {
  it("una ruta ajena en un subdominio solo muestra No disponible y el regreso al dominio principal", async () => {
    const { container } = renderRouteWithProviders("/org", { host: "grupo-delta.localtest.me:5174", as: "business-admin" });
    expect(await screen.findByRole("heading", { name: "Esta página no está disponible" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Ir a ArquitecturaBase" })).toHaveAttribute("href", "https://localtest.me:5174/");
    expect(screen.queryByRole("complementary", { name: "Navegación principal" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Abrir el menú" })).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});
