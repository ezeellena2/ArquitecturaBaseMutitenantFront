import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { configureI18n } from "@/shared/i18n";
import { PersonalLayout } from "../PersonalLayout";
import { BusinessLayout } from "../BusinessLayout";
import { PlatformLayout } from "../PlatformLayout";
import { personalNavigation } from "./personal";
import { businessNavigation } from "./business";
import { platformNavigation } from "./platform";

vi.mock("@/tenancy/AccessMenu", () => ({ AccessMenu: () => <button type="button">{"Cuenta"}</button> }));
vi.mock("@/auth/useCurrentUser", () => ({ useCurrentUser: () => ({ data: {
  displayName: "Ana", email: "ana@example.com", activeTenantId: "empresa-a",
  organizations: [{ id: "empresa-a", name: "Empresa A" }],
} }) }));

beforeAll(async () => {
  await configureI18n([{ code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true }]);
});

describe("navegación por acceso en 3a", () => {
  it("Personal muestra Inicio sin rutas futuras ni organizaciones", () => {
    expect(personalNavigation.links.map((entry) => entry.labelKey)).toEqual(["navigation.dashboard"]);
    expect(personalNavigation.links.map((entry) => entry.to)).toEqual(["/"]);
    expect(personalNavigation.administration).toBeNull();
    render(<MemoryRouter><PersonalLayout><h1>{"Inicio personal"}</h1></PersonalLayout></MemoryRouter>);
    expect(screen.getByRole("complementary", { name: "Navegación principal" })).toHaveClass("w-[232px]");
    expect(screen.getByRole("banner")).toHaveClass("h-[52px]");
    expect(screen.getByRole("link", { name: "Inicio" })).toHaveAttribute("href", "/");
    expect(screen.getByText("Tu perfil personal")).toBeVisible();
    expect(screen.queryByText("Mi cuenta")).not.toBeInTheDocument();
    expect(screen.queryByText("Organizaciones")).not.toBeInTheDocument();
  });

  it("Empresa muestra Inicio y oculta Administración hasta que existan sus destinos", () => {
    expect(businessNavigation.links.map((entry) => entry.to)).toEqual(["/org"]);
    expect(businessNavigation.administration).toBeNull();
    render(<MemoryRouter initialEntries={["/org"]}><BusinessLayout><h1>{"Inicio organización"}</h1></BusinessLayout></MemoryRouter>);
    expect(screen.getByRole("link", { name: "Inicio" })).toHaveAttribute("href", "/org");
    expect(screen.getByText("Empresa A")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Administración" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Usuarios" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Roles y permisos" })).not.toBeInTheDocument();
  });

  it("Plataforma oculta los destinos de E9 hasta que existan sus rutas", () => {
    expect(platformNavigation.links).toEqual([]);
    render(<MemoryRouter><PlatformLayout><h1>{"Plataforma"}</h1></PlatformLayout></MemoryRouter>);
    expect(screen.getByRole("main")).toContainElement(screen.getByRole("heading", { name: "Plataforma" }));
    expect(screen.queryByText("Organizaciones")).not.toBeInTheDocument();
  });
});
