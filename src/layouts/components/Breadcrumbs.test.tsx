import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeAll, describe, expect, it } from "vitest";
import { configureI18n } from "@/shared/i18n";
import { businessNavigation } from "../navigation/business";
import { personalNavigation } from "../navigation/personal";
import { Breadcrumbs } from "./Breadcrumbs";

beforeAll(async () => {
  await configureI18n([{ code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true }]);
});

describe("Breadcrumbs", () => {
  it("ubica Inicio en el acceso activo sin una ruta ficticia", () => {
    render(<MemoryRouter initialEntries={["/org"]}><Breadcrumbs navigation={businessNavigation} /></MemoryRouter>);
    const navigation = screen.getByRole("navigation", { name: "Migas de pan" });
    expect(navigation).toHaveTextContent("Inicio");
    expect(screen.queryByRole("link", { name: "Inicio" })).not.toBeInTheDocument();
  });

  it("el lado Personal se queda en su propio inicio", () => {
    render(<MemoryRouter initialEntries={["/"]}><Breadcrumbs navigation={personalNavigation} /></MemoryRouter>);
    expect(screen.getByRole("navigation", { name: "Migas de pan" })).toHaveTextContent("Inicio");
  });
});
