import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { asPhone } from "@/test/utils/phone";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";
import { AppProviders } from "@/app/providers";
import { routes } from "@/app/routes";
import { createQueryClient } from "@/shared/api/queryClient";
import type { MeResponse } from "@/shared/api/types";
import { fixtureAuth } from "@/test/mocks/authContext";
import { visualOperator } from "@/test/mocks/currentUsers";
import { meHandlerFor } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { cancelSignOut } from "@/auth/signOutStatus";

let restore: () => void = () => {};
beforeAll(async () => { await import("./MorePage"); });
beforeEach(() => { restore = asPhone(); });
afterEach(() => { restore(); cancelSignOut(); });

function renderPlatformMore(account: MeResponse = visualOperator, path = "/plataforma/mas") {
  server.use(meHandlerFor(account));
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const client = createQueryClient({ queries: { retry: false }, mutations: { retry: false } });
  const auth = fixtureAuth("visual-operator");
  return { router, auth, ...render(<AppProviders client={client} authContext={auth}><RouterProvider router={router} /></AppProviders>) };
}

// Tableros M-Mas-Personal y M-WA-Menu: «Más» junta quién sos, tus perfiles, Administración, Mi cuenta y Salir.
describe("Más en el teléfono", () => {
  it("en una organización muestra perfiles, Administración según permisos, Mi cuenta y Salir", async () => {
    const { container } = renderRouteWithProviders("/mas", { as: "business-e6-admin" });

    expect(await screen.findByRole("heading", { level: 1, name: "Más" })).toHaveClass("text-[24px]");
    const profiles = screen.getByRole("list", { name: "Perfiles" });
    expect(within(profiles).getByText("Personal")).toBeInTheDocument();
    expect(within(profiles).getByText("Empresa A")).toBeInTheDocument();
    const administration = screen.getByRole("list", { name: "Administración" });
    expect(within(administration).getByRole("link", { name: "Usuarios" })).toHaveAttribute("href", "/org/usuarios");
    // M-WA-Menu: en «Más», «Roles» a secas; la pantalla que abre sigue titulada «Roles y permisos».
    expect(within(administration).getByRole("link", { name: "Roles" })).toHaveAttribute("href", "/org/roles");
    expect(within(administration).getByRole("link", { name: "Auditoría" })).toHaveAttribute("href", "/org/auditoria");
    expect(screen.getByRole("link", { name: "Mi cuenta" })).toHaveAttribute("href", "/cuenta");
    expect(screen.getByRole("button", { name: "Salir" })).toBeVisible();
    expect(within(screen.getByRole("navigation", { name: "Secciones" })).getByRole("link", { name: "Más" })).toHaveAttribute("aria-current", "page");
    // Lienzo v104 (.ap-yo .w-av): tu inicial, de 56, con el degradé de la marca, como en la barra de abajo y en la compu.
    const [you, tab] = container.querySelectorAll("[data-slot='avatar']");
    expect(you).toHaveClass("size-14", "text-[20px]", "bg-linear-to-br", "from-[var(--marca)]", "to-[var(--marca-2)]");
    expect(tab).toHaveClass("size-[26px]", "bg-linear-to-br");
    // .ap-yo: el nombre y el correo con el interlineado normal, como el resto del teléfono.
    expect(you.nextElementSibling).toHaveClass("leading-[normal]");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("en el perfil personal no hay Administración", async () => {
    renderRouteWithProviders("/mas", { as: "consumer-with-organizations" });

    expect(await screen.findByRole("heading", { level: 1, name: "Más" })).toBeVisible();
    expect(screen.getByText("Personal", { selector: "[data-slot='app-bar'] span" })).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Administración" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Mi cuenta" })).toBeVisible();
  });

  it("en Plataforma muestra identidad, Administración, Mi cuenta y Salir, sin perfiles ni WhatsApp", async () => {
    const { container } = renderPlatformMore();
    expect(await screen.findByRole("heading", { name: "Más" })).toHaveClass("text-[24px]");
    expect(screen.getByText("Plataforma", { selector: "[data-slot='app-bar'] span" })).toBeVisible();
    expect(screen.getByText("Martín Sosa")).toBeVisible();
    expect(screen.getByText("martin.sosa@arquitecturabase.ejemplo.com")).toBeVisible();
    const administration = screen.getByRole("list", { name: "Administración" });
    expect(within(administration).getAllByRole("link").map((link) => [link.textContent, link.getAttribute("href")])).toEqual([
      ["Auditoría", "/plataforma/auditoria"], ["Documentos legales", "/plataforma/legales"], ["Configuración", "/plataforma/configuracion"],
    ]);
    expect(screen.queryByText("Perfiles")).not.toBeInTheDocument();
    expect(screen.queryByText("WhatsApp")).not.toBeInTheDocument();
    expect(screen.queryByText("Consultas")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Mi cuenta" })).toHaveAttribute("href", "/cuenta");
    expect(screen.getByRole("button", { name: "Salir" })).toBeVisible();
    expect(within(screen.getByRole("navigation", { name: "Secciones" })).getByRole("link", { name: "Más" })).toHaveAttribute("aria-current", "page");
    expect(await axe(container)).toHaveNoViolations();
  });

  it.each([
    ["platform.audit.read", "Auditoría"],
    ["platform.legal.manage", "Documentos legales"],
    ["platform.settings.manage", "Configuración"],
  ])("Administración muestra sólo %s aunque haya permisos de organización", async (permission, label) => {
    renderPlatformMore({ ...visualOperator, effectivePermissions: { platform: [permission], organization: ["audit.read", "settings.manage"], companies: {} } });
    const administration = await screen.findByRole("list", { name: "Administración" });
    expect(within(administration).getAllByRole("link").map((link) => link.textContent)).toEqual([label]);
  });

  it("sin permisos de Administración conserva Más, Mi cuenta y Salir", async () => {
    renderPlatformMore({ ...visualOperator, effectivePermissions: { platform: [], organization: [], companies: {} } });
    expect(await screen.findByRole("heading", { name: "Más" })).toBeVisible();
    expect(screen.queryByRole("list", { name: "Administración" })).not.toBeInTheDocument();
    expect(screen.queryByText("Perfiles")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Mi cuenta" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Salir" })).toBeVisible();
  });

  it("/mas del operador vuelve con replace a la ruta canónica de Plataforma", async () => {
    const { router } = renderPlatformMore(visualOperator, "/mas");
    expect(await screen.findByRole("heading", { name: "Más" })).toBeVisible();
    await waitFor(() => expect(router.state.location.pathname).toBe("/plataforma/mas"));
    expect(router.state.historyAction).toBe("REPLACE");
  });

  it("la ruta canónica de Más de Plataforma corrige un acceso personal hacia su inicio", async () => {
    const { router } = renderRouteWithProviders("/plataforma/mas", { as: "consumer-empty" });
    await waitFor(() => expect(router.state.location.pathname).toBe("/"));
    expect(router.state.historyAction).toBe("REPLACE");
    expect(screen.queryByRole("heading", { name: "Más" })).not.toBeInTheDocument();
  });

  it("en la compu Más vuelve al inicio de Plataforma", async () => {
    restore();
    const { router } = renderPlatformMore();
    await waitFor(() => expect(router.state.location.pathname).toBe("/plataforma"));
    expect(router.state.historyAction).toBe("REPLACE");
  });

  it("Salir utiliza el cierre común de sesión de Plataforma", async () => {
    const { auth } = renderPlatformMore();
    const signout = vi.spyOn(auth, "signoutRedirect");
    await userEvent.click(await screen.findByRole("button", { name: "Salir" }));
    await waitFor(() => expect(signout).toHaveBeenCalledOnce());
  });
});
