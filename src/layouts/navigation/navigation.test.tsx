import { render, screen, within } from "@testing-library/react";
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
  organizations: [{ id: "empresa-a", name: "Empresa A" }], features: [],
  effectivePermissions: { organization: ["users.read", "roles.read", "companies.read", "settings.read", "publicpage.manage", "audit.read"], companies: {} },
} }) }));

beforeAll(async () => {
  await configureI18n([{ code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true }]);
});

describe("navegación por acceso en 3a", () => {
  it("Personal muestra Inicio y Mi cuenta cuando existe su ruta en 3b", () => {
    expect(personalNavigation.links.map((entry) => entry.path)).toEqual(["/", "/cuenta"]);
    expect(personalNavigation.administration).toBeNull();
    render(<MemoryRouter><PersonalLayout><h1>{"Inicio personal"}</h1></PersonalLayout></MemoryRouter>);
    expect(screen.getByRole("complementary", { name: "Navegación principal" })).toHaveClass("w-[232px]");
    expect(screen.getByRole("banner")).toHaveClass("h-[52px]");
    expect(screen.getByRole("link", { name: "Inicio" })).toHaveAttribute("href", "/");
    expect(screen.getByText("Tu perfil personal")).toBeVisible();
    expect(screen.getByRole("link", { name: "Mi cuenta" })).toHaveAttribute("href", "/cuenta");
    expect(screen.queryByText("Organizaciones")).not.toBeInTheDocument();
  });

  it("Empresa muestra las áreas E6 en el panel de administración, abierto en sus rutas", () => {
    expect(businessNavigation.links.map((entry) => entry.path)).toEqual(["/org"]);
    expect(businessNavigation.administration?.sections?.[0].links).toMatchObject([
      { labelKey: "navigation.users", path: "/org/usuarios", permission: "users.read" },
      { labelKey: "navigation.roles", path: "/org/roles", permission: "roles.read" },
    ]);
    expect(businessNavigation.administration?.links.map((entry) => entry.path)).toEqual([
      "/org/empresas", "/org/configuracion", "/org/pagina", "/org/auditoria",
    ]);
    render(<MemoryRouter initialEntries={["/org/roles"]}><BusinessLayout><h1>{"Inicio organización"}</h1></BusinessLayout></MemoryRouter>);
    expect(within(screen.getByRole("complementary", { name: "Navegación principal" })).getByRole("link", { name: "Inicio" })).toHaveAttribute("href", "/org");
    expect(screen.getByText("Empresa A")).toBeVisible();
    expect(screen.getByRole("navigation", { name: "Administración" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Gestión de usuarios" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "Roles y permisos" })).toHaveAttribute("href", "/org/roles");
    expect(screen.getByRole("link", { name: "Usuarios" })).toHaveAttribute("href", "/org/usuarios");
    expect(screen.getByRole("link", { name: "Empresas" })).toHaveAttribute("href", "/org/empresas");
    expect(screen.getByRole("link", { name: "Configuración" })).toHaveAttribute("href", "/org/configuracion");
    expect(screen.getByRole("link", { name: "Página pública" })).toHaveAttribute("href", "/org/pagina");
    expect(screen.getByRole("link", { name: "Auditoría" })).toHaveAttribute("href", "/org/auditoria");
  });

  it("Plataforma oculta los destinos de E9 hasta que existan sus rutas", () => {
    expect(platformNavigation.links).toEqual([]);
    render(<MemoryRouter><PlatformLayout><h1>{"Plataforma"}</h1></PlatformLayout></MemoryRouter>);
    expect(screen.getByRole("main")).toContainElement(screen.getByRole("heading", { name: "Plataforma" }));
    expect(screen.queryByText("Organizaciones")).not.toBeInTheDocument();
  });
});
