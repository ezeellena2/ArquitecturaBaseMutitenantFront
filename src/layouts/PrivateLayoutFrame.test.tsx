import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { configureI18n } from "@/shared/i18n";
import { beginSignOut, cancelSignOut } from "@/auth/signOutStatus";
import { businessNavigation } from "./navigation/business";
import { PrivateLayoutFrame } from "./PrivateLayoutFrame";

const viewport = vi.hoisted(() => ({ mobile: false }));
const session = vi.hoisted(() => ({ permissions: [] as string[] }));
vi.mock("@/shared/hooks/useMediaQuery", () => ({ useMediaQuery: () => viewport.mobile }));
vi.mock("@/auth/useCurrentUser", () => ({ useCurrentUser: () => ({ data: { displayName: "Ana", email: "ana@example.com", activeTenantId: "empresa-a", organizations: [{ id: "empresa-a", name: "Empresa A" }], permissions: session.permissions } }) }));
vi.mock("@/tenancy/AccessMenu", () => ({ AccessMenu: () => <button type="button">{"Cuenta"}</button> }));

beforeAll(async () => {
  await configureI18n([{ code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true }]);
});
afterEach(() => { viewport.mobile = false; session.permissions = []; cancelSignOut(); });

describe("PrivateLayoutFrame", () => {
  it("muestra el contexto de empresa sin enlaces de Administración de etapas futuras", () => {
    render(<MemoryRouter initialEntries={["/org"]}><PrivateLayoutFrame navigation={businessNavigation} scope="business"><h1>{"Inicio"}</h1></PrivateLayoutFrame></MemoryRouter>);
    expect(screen.getByRole("banner")).toHaveClass("h-[52px]");
    expect(screen.getByRole("complementary", { name: "Navegación principal" })).toHaveClass("w-[232px]");
    expect(screen.getByRole("main")).toHaveClass("bg-[var(--fondo)]");
    expect(screen.getByText("Empresa A")).toBeVisible();
    expect(screen.getByText("Organización")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Administración" })).not.toBeInTheDocument();
  });

  // Tablero Usuarios: en una pantalla de Administración el panel ya está abierto; en Inicio, cerrado.
  it("abre el panel en las rutas de Administración y lo cierra al volver a Inicio", async () => {
    session.permissions = ["users.read", "audit.read"];
    render(<MemoryRouter initialEntries={["/org/usuarios/abc"]}><PrivateLayoutFrame navigation={businessNavigation} scope="business"><h1>{"Usuario"}</h1></PrivateLayoutFrame></MemoryRouter>);
    expect(screen.getByRole("navigation", { name: "Administración" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Administración" })).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(screen.getByRole("button", { name: "Cerrar Administración" }));
    expect(screen.queryByRole("navigation", { name: "Administración" })).not.toBeInTheDocument();
    await userEvent.click(within(screen.getByRole("complementary", { name: "Navegación principal" })).getByRole("link", { name: "Inicio" }));
    await userEvent.click(screen.getByRole("button", { name: "Administración" }));
    await userEvent.click(screen.getByRole("link", { name: "Auditoría" }));
    expect(screen.getByRole("navigation", { name: "Administración" })).toBeVisible();
  });

  it("en Inicio arranca con el panel cerrado", () => {
    session.permissions = ["users.read"];
    render(<MemoryRouter initialEntries={["/org"]}><PrivateLayoutFrame navigation={businessNavigation} scope="business"><h1>{"Inicio"}</h1></PrivateLayoutFrame></MemoryRouter>);
    expect(screen.queryByRole("navigation", { name: "Administración" })).not.toBeInTheDocument();
  });

  it("el botón de la barra abre el cajón móvil y lo cierra sin segundo panel", async () => {
    viewport.mobile = true;
    render(<MemoryRouter initialEntries={["/org"]}><PrivateLayoutFrame navigation={businessNavigation}><h1>{"Inicio"}</h1></PrivateLayoutFrame></MemoryRouter>);
    await userEvent.click(screen.getByRole("button", { name: "Abrir o contraer navegación" }));
    expect(screen.getByRole("dialog", { name: "Navegación principal" })).toBeVisible();
    expect(screen.queryByRole("navigation", { name: "Administración" })).not.toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Navegación principal" })).not.toBeInTheDocument();
  });

  it("durante el cierre reemplaza el layout para no mostrar datos de sesión vacíos", () => {
    render(<MemoryRouter><PrivateLayoutFrame navigation={businessNavigation}><h1>{"Inicio"}</h1></PrivateLayoutFrame></MemoryRouter>);
    act(() => beginSignOut());
    expect(screen.getByRole("heading", { name: "Cerrando sesión…" })).toBeVisible();
    expect(screen.queryByRole("complementary", { name: "Navegación principal" })).not.toBeInTheDocument();
  });
});
