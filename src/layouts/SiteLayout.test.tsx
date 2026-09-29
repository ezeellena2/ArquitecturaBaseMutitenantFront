import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeAll, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { configureI18n } from "@/shared/i18n";
import { SiteLayout } from "./SiteLayout";

beforeAll(async () => {
  await configureI18n([{ code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true }]);
});

describe("SiteLayout", () => {
  it("tiene marca, navegación pública, puertas de ingreso y enlaces legales", async () => {
    const { container } = render(<MemoryRouter><SiteLayout><h1>{"Portada"}</h1></SiteLayout></MemoryRouter>);

    expect(screen.getByRole("link", { name: "ArquitecturaBase" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("navigation", { name: "Secciones" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Personas" })).toHaveAttribute("href", "#personas");
    expect(screen.getByRole("link", { name: "Empresas" })).toHaveAttribute("href", "#organizaciones");
    expect(screen.getByRole("link", { name: "Ingresá como empresa" })).toHaveAttribute("href", "/login/empresa");
    expect(screen.getByRole("link", { name: "Ingresar" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("main")).toContainElement(screen.getByRole("heading", { name: "Portada" }));
    expect(screen.getByRole("link", { name: "Términos" })).toHaveAttribute("href", "/terminos");
    expect(screen.getByRole("link", { name: "Privacidad" })).toHaveAttribute("href", "/privacidad");
    expect(await axe(container)).toHaveNoViolations();
  });
});
