import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { configureI18n } from "@/shared/i18n";
import { visualOperator } from "@/test/mocks/currentUsers";
import { PlatformLayout } from "./PlatformLayout";

vi.mock("@/auth/useCurrentUser", () => ({ useCurrentUser: () => ({ data: visualOperator }) }));
vi.mock("@/tenancy/AccessMenu", () => ({ AccessMenu: () => <button type="button">{"Cuenta"}</button> }));

beforeAll(async () => { await configureI18n([{ code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true }]); });

describe("PlatformLayout desktop", () => {
  it.each([
    ["/plataforma", "Gestión", "Organizaciones"],
    ["/plataforma/organizaciones/delta", "Gestión", "Organizaciones"],
    ["/plataforma/cuentas/ana", "Gestión", "Cuentas"],
    ["/plataforma/recuperaciones", "Gestión", "Recuperaciones"],
    ["/plataforma/auditoria", "Administración", "Auditoría"],
    ["/plataforma/legales/nueva", "Administración", "Documentos legales"],
    ["/plataforma/configuracion", "Administración", "Configuración"],
  ])("en %s abre sólo %s y marca %s", async (path, panelName, option) => {
    localStorage.clear();
    const { container } = render(<MemoryRouter initialEntries={[path]}><PlatformLayout><h1>{"Vista de prueba"}</h1></PlatformLayout></MemoryRouter>);
    const sidebar = screen.getByRole("complementary", { name: "Navegación principal" });
    expect(within(sidebar).getByText("Plataforma")).toBeVisible();
    expect(within(sidebar).getByText("Administración del servicio")).toBeVisible();
    const buttons = within(sidebar).getAllByRole("button", { name: /^(Gestión|Administración)$/ });
    expect(buttons.map((button) => button.getAttribute("aria-label"))).toEqual(["Gestión", "Administración"]);
    expect(buttons.every((button) => button.querySelector(".lucide-chevron-right"))).toBe(true);
    expect(buttons[1].parentElement).toHaveClass("mt-auto", "border-t");
    expect(screen.getByRole("navigation", { name: panelName })).toBeVisible();
    expect(screen.queryByRole("navigation", { name: panelName === "Gestión" ? "Administración" : "Gestión" })).not.toBeInTheDocument();
    expect(within(screen.getByRole("navigation", { name: panelName })).getByRole("link", { name: option })).toHaveAttribute("aria-current", "page");
    expect(screen.queryByText("WhatsApp")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Contraer menú" })).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("al alternar los paneles cierra el anterior y conserva una sola flecha", async () => {
    render(<MemoryRouter initialEntries={["/plataforma"]}><PlatformLayout><h1>{"Vista de prueba"}</h1></PlatformLayout></MemoryRouter>);
    await userEvent.click(screen.getByRole("button", { name: "Administración" }));
    expect(screen.getByRole("navigation", { name: "Administración" })).toBeVisible();
    expect(screen.queryByRole("navigation", { name: "Gestión" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Cerrar Administración" }));
    expect(screen.getByRole("button", { name: "Contraer menú" })).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Gestión" }));
    expect(screen.getByRole("button", { name: "Cerrar Gestión" })).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Gestión" }));
    expect(screen.queryByRole("navigation", { name: "Gestión" })).not.toBeInTheDocument();
  });

  it("al abrir Gestión desde Configuración no marca Organizaciones como pantalla actual", async () => {
    render(<MemoryRouter initialEntries={["/plataforma/configuracion"]}><PlatformLayout><h1>{"Vista de prueba"}</h1></PlatformLayout></MemoryRouter>);
    await userEvent.click(screen.getByRole("button", { name: "Gestión" }));
    const panel = screen.getByRole("navigation", { name: "Gestión" });
    expect(within(panel).getAllByRole("link").every((link) => !link.hasAttribute("aria-current"))).toBe(true);
  });
});
