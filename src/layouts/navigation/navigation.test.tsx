import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { configureI18n } from "@/shared/i18n";
import { PersonalLayout } from "../PersonalLayout";
import { BusinessLayout } from "../BusinessLayout";
import { PlatformLayout } from "../PlatformLayout";
import { personalNavigation } from "./personal";
import { businessNavigation } from "./business";
import { platformNavigation } from "./platform";
import { PrivateLayoutFrame } from "../PrivateLayoutFrame";
import { asPhone } from "@/test/utils/phone";
import { HomeIcon } from "@/shared/ui/icons";
import type { NavigationConfig } from "./types";

const session = vi.hoisted(() => ({ features: [] as string[] }));

vi.mock("@/tenancy/AccessMenu", () => ({ AccessMenu: () => <button type="button">{"Cuenta"}</button> }));
vi.mock("@/auth/useCurrentUser", () => ({ useCurrentUser: () => ({ data: {
  displayName: "Ana", email: "ana@example.com", activeTenantId: "empresa-a",
  organizations: [{ id: "empresa-a", name: "Empresa A" }], features: session.features,
  effectivePermissions: { platform: [], organization: ["users.read", "roles.read", "companies.read", "settings.read", "publicpage.manage", "audit.read"], companies: {} },
} }) }));

beforeAll(async () => {
  await configureI18n([{ code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true }]);
});
afterEach(() => { session.features = []; vi.unstubAllGlobals(); });

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

  it("Plataforma oculta ambos paneles si el operador no tiene permisos", () => {
    expect(platformNavigation.links).toEqual([]);
    render(<MemoryRouter><PlatformLayout><h1>{"Plataforma"}</h1></PlatformLayout></MemoryRouter>);
    expect(screen.getByRole("main")).toContainElement(screen.getByRole("heading", { name: "Plataforma" }));
    expect(screen.queryByText("Organizaciones")).not.toBeInTheDocument();
  });
});

describe("los íconos del menú", () => {
  it("son los del tablero, a 18 px, en el marco y en el panel de Administración", async () => {
    const icons = await import("@/shared/ui/icons");
    expect(personalNavigation.links.map((entry) => entry.icon)).toEqual([icons.HomeIcon, icons.UserIcon]);
    expect(businessNavigation.links.map((entry) => entry.icon)).toEqual([icons.HomeIcon]);
    expect(businessNavigation.administration?.icon).toBe(icons.ShieldCheckIcon);
    expect(businessNavigation.administration?.sections?.[0].icon).toBe(icons.UsersIcon);
    expect(businessNavigation.administration?.sections?.[0].links.map((entry) => entry.icon)).toEqual([icons.UsersIcon, icons.KeyIcon]);
    expect(businessNavigation.administration?.links.map((entry) => entry.icon)).toEqual([
      icons.BuildingIcon, icons.SlidersHorizontalIcon, icons.GlobeIcon, icons.ClipboardIcon,
    ]);

    render(<MemoryRouter initialEntries={["/org/empresas"]}><BusinessLayout><h1>{"Empresas"}</h1></BusinessLayout></MemoryRouter>);
    expect(within(screen.getByRole("complementary", { name: "Navegación principal" })).getByRole("link", { name: "Inicio" }).querySelector("svg")).toHaveClass("size-[18px]");
    expect(screen.getByRole("link", { name: "Empresas" }).querySelector("svg")).toHaveClass("size-[18px]");
  });
});

describe("módulos personales declarados con una entrada", () => {
  const module = { path: "/modulo-prueba", feature: "modulo-prueba", labelKey: "navigation.audit", icon: HomeIcon };
  const navigation: NavigationConfig = { ...personalNavigation, links: [...personalNavigation.links, module] };
  function renderNavigation(source = navigation, path = "/") {
    return render(<MemoryRouter initialEntries={[path]}><PrivateLayoutFrame navigation={source} scope="personal"><h1>{"Módulo de prueba"}</h1></PrivateLayoutFrame></MemoryRouter>);
  }

  it.each([false, true])("el menú muestra el módulo sólo si está habilitado: %s", (enabled) => {
    session.features = enabled ? [module.feature] : [];
    renderNavigation();
    const menu = within(screen.getByRole("complementary", { name: "Navegación principal" }));
    expect(Boolean(menu.queryByRole("link", { name: "Auditoría" }))).toBe(enabled);
    expect(menu.getByRole("link", { name: "Inicio" })).toHaveAttribute("href", "/");
    expect(menu.getByRole("link", { name: "Mi cuenta" })).toHaveAttribute("href", "/cuenta");
  });

  it.each([false, true])("la barra móvil usa el mismo módulo habilitado: %s", (enabled) => {
    asPhone();
    session.features = enabled ? [module.feature] : [];
    renderNavigation(navigation, enabled ? `${module.path}/detalle` : "/");
    const bar = within(screen.getByRole("navigation", { name: "Secciones" }));
    expect(Boolean(bar.queryByRole("link", { name: "Auditoría" }))).toBe(enabled);
    expect(bar.getByRole("link", { name: enabled ? "Auditoría" : "Inicio" })).toHaveAttribute("aria-current", "page");
    expect(bar.getByRole("link", { name: "Más" })).toHaveAttribute("href", "/mas");
    expect(bar.queryByRole("link", { name: "Mi cuenta" })).not.toBeInTheDocument();
  });

  it("limita la barra a cuatro secciones y Más; un módulo restante marca Más", () => {
    asPhone();
    const modules = Array.from({ length: 5 }, (_, index) => ({ ...module, path: `/modulo-prueba-${index}`, feature: `modulo-prueba-${index}` }));
    session.features = modules.map((entry) => entry.feature);
    renderNavigation({ ...personalNavigation, links: [...personalNavigation.links, ...modules] }, modules[4].path);
    const bar = within(screen.getByRole("navigation", { name: "Secciones" }));
    expect(bar.getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual(["/", ...modules.slice(0, 3).map((entry) => entry.path), "/mas"]);
    expect(bar.getByRole("link", { name: "Más" })).toHaveAttribute("aria-current", "page");
  });
});
