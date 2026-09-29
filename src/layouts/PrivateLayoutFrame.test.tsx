import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { configureI18n } from "@/shared/i18n";
import { beginSignOut, cancelSignOut } from "@/auth/signOutStatus";
import { businessNavigation } from "./navigation/business";
import { PrivateLayoutFrame } from "./PrivateLayoutFrame";

const viewport = vi.hoisted(() => ({ mobile: false }));
vi.mock("@/shared/hooks/useMediaQuery", () => ({ useMediaQuery: () => viewport.mobile }));
vi.mock("@/auth/useCurrentUser", () => ({ useCurrentUser: () => ({ data: { displayName: "Ana", email: "ana@example.com", activeTenantId: "empresa-a", organizations: [{ id: "empresa-a", name: "Empresa A" }] } }) }));
vi.mock("@/tenancy/AccessMenu", () => ({ AccessMenu: () => <button type="button">{"Cuenta"}</button> }));

beforeAll(async () => {
  await configureI18n([{ code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true }]);
});
afterEach(() => { viewport.mobile = false; cancelSignOut(); });

describe("PrivateLayoutFrame", () => {
  it("muestra el contexto de empresa sin enlaces de Administración de etapas futuras", () => {
    render(<MemoryRouter initialEntries={["/org"]}><PrivateLayoutFrame navigation={businessNavigation} scope="business"><h1>{"Inicio"}</h1></PrivateLayoutFrame></MemoryRouter>);
    expect(screen.getByText("Empresa A")).toBeVisible();
    expect(screen.getByText("Organización")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Administración" })).not.toBeInTheDocument();
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
