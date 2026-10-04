import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import type { HomeResponse } from "@/shared/api/types";
import { changeCulture, configureI18n } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";

// Datos del tablero Inicio-Org (lienzo v77), con «hoy» el 03/10/2026.
const organization: NonNullable<HomeResponse["organization"]> = {
  users: { total: 11 }, roles: { total: 7 }, companies: { total: 3 }, publicPage: { state: "Published" },
  settings: { domain: "delta.ejemplo.com" }, audit: { lastChangeAtUtc: "2026-10-03T13:42:00Z" },
};
const pending: HomeResponse["pending"] = [
  { area: "users", kind: "invitationExpired", subject: "carla.bianchi@delta.ejemplo.com", urgent: false,
    sinceUtc: "2026-09-25T15:00:00Z", dueAtUtc: null, targetId: "member-carla" },
  { area: "users", kind: "deletionRequested", subject: "Diego Ríos", urgent: false,
    sinceUtc: "2026-09-27T15:00:00Z", dueAtUtc: "2026-10-27T15:00:00Z", targetId: "member-diego" },
  { area: "settings", kind: "domainUnverified", subject: "delta.ejemplo.com", urgent: false,
    sinceUtc: "2026-10-01T15:00:00Z", dueAtUtc: null, targetId: "domain-1" },
  // Un módulo que el front todavía no conoce no muestra una fila sin texto.
  { area: "whatsapp", kind: "paymentMissing", subject: "+54 9 351 555-0200", urgent: true,
    sinceUtc: "2026-10-02T15:00:00Z", dueAtUtc: null, targetId: null },
];

function serveHome(body: HomeResponse) {
  server.use(http.get("/api/home", () => HttpResponse.json(body)));
}

function phone(on: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: on && query === "(max-width: 767px)", media: query,
    addEventListener: () => {}, removeEventListener: () => {},
  }));
}

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-03T18:00:00Z"));
  await configureI18n(referenceDataFixture().cultures);
  await changeCulture("es-AR");
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("BusinessHomePage", () => {
  it("tablero Inicio-Org: cada área con su dato real y «Para resolver» con el enlace que lo resuelve", async () => {
    serveHome({ organization, companies: [], pending });
    const { container } = renderRouteWithProviders("/org", { as: "visual-owner" });

    expect(await screen.findByRole("heading", { level: 1, name: "Inicio" })).toBeVisible();
    const areas = await screen.findByRole("navigation", { name: "Áreas de la organización" });
    const card = (name: string) => within(areas).getByRole("link", { name: new RegExp(`^${name}`) });
    expect(card("Usuarios")).toHaveAttribute("href", "/org/usuarios");
    expect(card("Usuarios")).toHaveTextContent("11 usuarios");
    expect(card("Roles y permisos")).toHaveAttribute("href", "/org/roles");
    expect(card("Roles y permisos")).toHaveTextContent("7 roles");
    expect(card("Empresas")).toHaveTextContent("3 empresas");
    expect(card("Página pública")).toHaveAttribute("href", "/org/pagina");
    expect(card("Página pública")).toHaveTextContent("Publicada");
    expect(card("Configuración")).toHaveTextContent("delta.ejemplo.com");
    expect(card("Auditoría")).toHaveTextContent("Último cambio hoy, 10:42");

    const toResolve = screen.getByRole("region", { name: "Para resolver" });
    expect(within(toResolve).getByText("3")).toBeVisible();
    expect(toResolve).not.toHaveTextContent("+54 9 351 555-0200");
    const invitation = within(toResolve).getByText("carla.bianchi@delta.ejemplo.com").closest("tr")!;
    expect(invitation).toHaveTextContent("Invitación");
    expect(invitation).toHaveTextContent("Usuarios");
    expect(invitation).toHaveTextContent("Vencida");
    expect(invitation).toHaveTextContent("25/09/2026");
    expect(within(invitation).getByRole("link", { name: "Reenviar" })).toHaveAttribute("href", "/org/usuarios?state=Expired");
    const deletion = within(toResolve).getByText("Diego Ríos").closest("tr")!;
    expect(deletion).toHaveTextContent("Se elimina el 27/10/2026");
    expect(deletion).toHaveTextContent("Baja pedida");
    expect(within(deletion).getByRole("link", { name: "Ver" })).toHaveAttribute("href", "/org/usuarios/member-diego");
    const domain = within(toResolve).getByText("Dominio de correo").closest("tr")!;
    expect(domain).toHaveTextContent("Configuración");
    expect(domain).toHaveTextContent("Pendiente");
    expect(within(domain).getByRole("link", { name: "Verificar" })).toHaveAttribute("href", "/org/configuracion");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("sin pendientes dice «Nada para resolver»", async () => {
    serveHome({ organization, companies: [], pending: [] });
    renderRouteWithProviders("/org", { as: "visual-owner" });

    const toResolve = await screen.findByRole("region", { name: "Para resolver" });
    expect(within(toResolve).getByText("Nada para resolver")).toBeVisible();
    expect(within(toResolve).getByText("0")).toBeVisible();
    expect(within(toResolve).queryByRole("table")).not.toBeInTheDocument();
  });

  it("tablero Inicio-Miembro: «Tus empresas» y, si no puede resolver nada, sin tabla", async () => {
    serveHome({ organization: null, companies: [{ companyId: "company-dn", name: "Delta Norte S.A.", roles: ["Solo lectura"], memberCount: 3 }], pending: [] });
    const { container } = renderRouteWithProviders("/org", { as: "visual-error-org" });

    expect(await screen.findByRole("heading", { level: 2, name: "Tus empresas" })).toBeVisible();
    const company = screen.getByRole("link", { name: /Delta Norte S\.A\./ });
    expect(company).toHaveAttribute("href", "/org/empresas/company-dn");
    expect(company).toHaveTextContent("DN");
    expect(company).toHaveTextContent("Solo lectura · 3 miembros");
    expect(screen.queryByRole("region", { name: "Para resolver" })).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Áreas de la organización" })).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("tablero M-Inicio-Org: en el teléfono, saludo, atajos con sus pendientes y filas con botón", async () => {
    phone(true);
    serveHome({ organization, companies: [], pending });
    const { container } = renderRouteWithProviders("/org", { as: "visual-owner" });

    expect(await screen.findByText("Hola, Lucía")).toBeVisible();
    expect(screen.getByRole("heading", { level: 1, name: "Grupo Delta" })).toBeVisible();
    const shortcuts = screen.getByRole("navigation", { name: "Áreas de la organización" });
    const users = within(shortcuts).getByRole("link", { name: /^Usuarios/ });
    expect(users).toHaveAttribute("href", "/org/usuarios");
    expect(within(users).getByText("2")).toBeVisible();
    expect(within(within(shortcuts).getByRole("link", { name: /^Configuración/ })).getByText("1")).toBeVisible();
    expect(within(within(shortcuts).getByRole("link", { name: /^Roles/ })).queryByText(/\d/)).not.toBeInTheDocument();

    const toResolve = screen.getByRole("region", { name: "Para resolver" });
    const invitation = within(toResolve).getByText("carla.bianchi@delta.ejemplo.com").closest("li")!;
    expect(invitation).toHaveTextContent("Invitación vencida · Usuarios");
    expect(within(invitation).getByRole("link", { name: "Reenviar" })).toHaveAttribute("href", "/org/usuarios?state=Expired");
    expect(within(toResolve).getByText("Dominio de correo").closest("li")).toHaveTextContent("Pendiente · Configuración");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});
