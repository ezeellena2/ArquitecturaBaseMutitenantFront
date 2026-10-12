import { act, screen, waitFor, within } from "@testing-library/react";
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
  it("al cambiar de acceso cancela la lectura tardía y retira grupos de la sesión anterior", async () => {
    let receivedSignal: AbortSignal | undefined;
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    server.use(http.get("/api/home", async ({ request }) => {
      receivedSignal = request.signal; await gate;
      return HttpResponse.json({ organization, companies: [], pending: [pending[0]!] });
    }));
    const app = renderRouteWithProviders("/org", { as: "visual-owner" });
    await waitFor(() => expect(receivedSignal).toBeDefined());
    act(() => { app.queryClient.clear(); });
    expect(receivedSignal?.aborted).toBe(true);
    await act(async () => { release(); await gate; });
    expect(screen.queryByText("carla.bianchi@delta.ejemplo.com")).not.toBeInTheDocument();
    expect(app.queryClient.getQueryCache().findAll({ queryKey: ["organization-home"] }).some((query) => query.state.data !== undefined)).toBe(false);
  });
  it("legacy null conserva el total y acota cada tipo a diez filas", async () => {
    const items = Array.from({ length: 1000 }, (_, index) => ({ ...pending[0]!, subject: `Legacy ${index}` }));
    serveHome({ organization, companies: [], pending: items, pendingGroups: null });
    renderRouteWithProviders("/org", { as: "visual-owner" });
    const block = await screen.findByRole("region", { name: "Para resolver" });
    expect(within(block).getAllByText("1.000")).toHaveLength(2);
    expect(within(block).getAllByText(/^Legacy \d+$/)).toHaveLength(10);
    expect(within(block).getByRole("link", { name: "Ver todos" })).toHaveAttribute("href", "/org/usuarios?state=Expired");
  });
  it("el miembro en teléfono mantiene grupos por empresa con sus totales y enlaces filtrados", async () => {
    phone(true);
    const companies = [{ companyId: "company-a", name: "Empresa A", roles: ["Administrador"], memberCount: 3 },
      { companyId: "company-b", name: "Empresa B", roles: ["Administrador"], memberCount: 2 }];
    serveHome({ organization: null, companies, pending: [], pendingGroups: companies.map((company) => ({
      area: "users", kind: "invitationExpired", companyId: company.companyId, companyName: company.name, totalCount: 1000,
      items: Array.from({ length: 10 }, (_, index) => ({ ...pending[0]!, subject: `${company.name} invitación ${index}` })),
    })) });
    renderRouteWithProviders("/org", { as: "visual-error-org" });
    const block = await screen.findByRole("region", { name: "Para resolver" });
    expect(within(block).getByText("2.000")).toBeVisible();
    expect(within(block).getAllByText("1.000")).toHaveLength(2);
    expect(within(block).getAllByText("Invitaciones vencidas")).toHaveLength(2);
    expect(within(block).getAllByRole("link", { name: "Ver todos" }).map((link) => link.getAttribute("href")))
      .toEqual(["/org/empresas/company-a?state=Expired", "/org/empresas/company-b?state=Expired"]);
    expect(within(block).getAllByRole("listitem")).toHaveLength(20);
    expect(within(block).getAllByRole("link", { name: "Reenviar" })[0]).toHaveAttribute("href", "/org/empresas/company-a");
    expect(within(block).getAllByRole("listitem")[0]).not.toHaveTextContent("· Empresa A");
  });
  it.each([false, true])("total real y diez filas por grupo con mil pendientes, teléfono %s", async (onPhone) => {
    phone(onPhone);
    const items = Array.from({ length: 10 }, (_, index) => ({ ...pending[0]!, subject: `Invitada ${index}`, targetId: `member-${index}` }));
    serveHome({ organization, companies: [], pending: [], pendingGroups: [
      { area: "users", kind: "invitationExpired", totalCount: 1000, items },
      { area: "users", kind: "deletionRequested", totalCount: 10, items: Array.from({ length: 10 }, (_, index) => ({ ...pending[1]!, subject: `Baja ${index}` })) },
      { area: "unknown", kind: "unknown", totalCount: 999, items: [{ ...pending[0]!, kind: "unknown", subject: "No mostrar" }] },
    ] });
    renderRouteWithProviders("/org", { as: "visual-owner" });
    const block = await screen.findByRole("region", { name: "Para resolver" });
    expect(within(block).getByText("1.010")).toBeVisible();
    expect(within(block).getByText("1.000")).toBeVisible();
    expect(within(block).getByText("Invitaciones vencidas")).toBeVisible();
    expect(within(block).getByText("Bajas pedidas")).toBeVisible();
    expect(within(block).getAllByRole("link", { name: "Ver todos" })).toHaveLength(1);
    expect(within(block).getByRole("link", { name: "Ver todos" })).toHaveAttribute("href", "/org/usuarios?state=Expired");
    expect(within(block).getAllByText(/^Invitada \d+$/)).toHaveLength(10);
    expect(within(block).getAllByText(/^Baja \d+$/)).toHaveLength(10);
    expect(block).not.toHaveTextContent("No mostrar");
    if (onPhone) {
      expect(within(screen.getByRole("navigation", { name: "Áreas de la organización" })).getByRole("link", { name: "Usuarios, 1010 para resolver" })).toBeVisible();
      expect(within(block).getByText("Invitada 0").closest("li")).not.toHaveTextContent("Usuarios");
    } else expect(within(block).getAllByRole("columnheader").map((header) => header.textContent)).toEqual(["Pendiente", "Estado", "Desde", "Acción"]);
  });
  // Relevamiento de la consolidación (N17): con un cambio de otro día, «Último cambio 01/10/2026 10:42» no entraba en la
  // tarjeta y la hora se cortaba. Hoy y ayer llevan la hora; otro día, la fecha sola.
  it("la tarjeta Auditoría dice la fecha sola si el último cambio no es de hoy ni de ayer", async () => {
    serveHome({ organization: { ...organization, audit: { lastChangeAtUtc: "2026-10-01T13:42:00Z" } }, companies: [], pending });
    renderRouteWithProviders("/org", { as: "visual-owner" });

    const areas = await screen.findByRole("navigation", { name: "Áreas de la organización" });
    const audit = within(areas).getByRole("link", { name: /^Auditoría/ });
    expect(audit).toHaveTextContent("Último cambio 01/10/2026");
    expect(audit).not.toHaveTextContent("10:42");
  });

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
    // El punto del tono que registra el Inicio para el estado de la página (statusTones), como la Página pública.
    expect(card("Página pública").querySelector("[data-slot='status-dot']")).toHaveClass("bg-[var(--punto-ok)]");
    expect(card("Configuración")).toHaveTextContent("delta.ejemplo.com");
    expect(card("Auditoría")).toHaveTextContent("Último cambio hoy, 10:42");

    const toResolve = screen.getByRole("region", { name: "Para resolver" });
    expect(within(toResolve).getByText("3")).toBeVisible();
    expect(toResolve).not.toHaveTextContent("+54 9 351 555-0200");
    // Tablero Inicio-Org (.ini y .t-cab): los bloques del inicio van a 20 uno del otro, y el encabezado de «Para resolver»
    // lleva 12 arriba y abajo.
    expect(areas.parentElement).toHaveClass("gap-5");
    expect(within(toResolve).getByRole("heading", { name: "Para resolver" }).parentElement).toHaveClass("py-3");
    const invitation = within(toResolve).getByText("carla.bianchi@delta.ejemplo.com").closest("tr")!;
    expect(invitation).toHaveTextContent("Invitación");
    // «Criterio · Tablas» (lienzo v92): lo que aclara el pendiente va en la segunda línea gris de la tabla.
    expect(within(invitation).getByText("Invitación")).toHaveAttribute("data-slot", "cell-detail");
    expect(invitation).not.toHaveTextContent("Usuarios");
    expect(invitation).toHaveTextContent("Vencida");
    expect(invitation).toHaveTextContent("25/09/2026");
    expect(within(invitation).getByRole("link", { name: "Reenviar" })).toHaveAttribute("href", "/org/usuarios?state=Expired");
    const deletion = within(toResolve).getByText("Diego Ríos").closest("tr")!;
    expect(deletion).toHaveTextContent("Se elimina el 27/10/2026");
    expect(deletion).toHaveTextContent("Baja pedida");
    expect(within(deletion).getByRole("link", { name: "Ver" })).toHaveAttribute("href", "/org/usuarios/member-diego");
    const domain = within(toResolve).getByText("Dominio de correo").closest("tr")!;
    expect(domain).not.toHaveTextContent("Configuración");
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
    // M-Inicio-Org (.c-top, .c-hola): la cabecera con 10 arriba y 46 abajo, el saludo con la altura normal de su letra y el
    // nombre con interlineado 1,15.
    expect(screen.getByText("Hola, Lucía")).toHaveClass("leading-[normal]");
    expect(screen.getByRole("heading", { level: 1, name: "Grupo Delta" })).toHaveClass("leading-[1.15]");
    expect(screen.getByRole("heading", { level: 1, name: "Grupo Delta" }).parentElement).toHaveClass("pt-2.5", "pb-[46px]");
    const shortcuts = screen.getByRole("navigation", { name: "Áreas de la organización" });
    // .c-atajos a, .c-tit y .c-p: los rótulos de los atajos, el título y las dos líneas de cada fila con la altura normal
    // de su letra (las filas, de 60).
    expect(within(shortcuts).getByRole("link", { name: /^Roles/ })).toHaveClass("leading-[normal]");
    expect(screen.getByRole("heading", { level: 2, name: "Para resolver" })).toHaveClass("leading-[normal]");
    expect(screen.getByText("carla.bianchi@delta.ejemplo.com").parentElement).toHaveClass("leading-[normal]");
    const users = within(shortcuts).getByRole("link", { name: /^Usuarios/ });
    expect(users).toHaveAttribute("href", "/org/usuarios");
    expect(within(users).getByText("2")).toBeVisible();
    expect(within(within(shortcuts).getByRole("link", { name: /^Configuración/ })).getByText("1")).toBeVisible();
    expect(within(within(shortcuts).getByRole("link", { name: /^Roles/ })).queryByText(/\d/)).not.toBeInTheDocument();

    const toResolve = screen.getByRole("region", { name: "Para resolver" });
    const invitation = within(toResolve).getByText("carla.bianchi@delta.ejemplo.com").closest("li")!;
    expect(invitation).toHaveTextContent("Invitación vencida");
    expect(invitation).not.toHaveTextContent("Usuarios");
    expect(within(invitation).getByRole("link", { name: "Reenviar" })).toHaveAttribute("href", "/org/usuarios?state=Expired");
    expect(within(toResolve).getByText("Dominio de correo").closest("li")).toHaveTextContent("Pendiente");
    expect(within(toResolve).getByText("Dominio de correo").closest("li")).not.toHaveTextContent("Configuración");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  // Tablero M-Inicio-Miembro (v106, «Solo lectura»): la billetera de M-Inicio-Org, con la cabecera de color, «Hola, …» y
  // la organización; abajo, «Tus empresas» en filas (las iniciales en un cuadrado de 40, el nombre y «rol · miembros»,
  // con ›). Sin atajos ni «Para resolver» si no puede resolver nada.
  it("tablero M-Inicio-Miembro: en el teléfono, la billetera con «Tus empresas» en filas", async () => {
    phone(true);
    serveHome({ organization: null, companies: [{ companyId: "company-dn", name: "Delta Norte S.A.", roles: ["Solo lectura"], memberCount: 3 }], pending: [] });
    const { container } = renderRouteWithProviders("/org", { as: "visual-error-org" });

    expect(await screen.findByText("Hola, Valentina")).toBeVisible();
    expect(screen.getByRole("heading", { level: 1, name: "Grupo Delta" })).toBeVisible();
    expect(screen.queryByRole("heading", { level: 1, name: "Inicio" })).not.toBeInTheDocument();
    const companies = screen.getByRole("region", { name: "Tus empresas" });
    expect(within(companies).getByRole("heading", { level: 2, name: "Tus empresas" })).toHaveClass("text-[18px]", "font-bold");
    const company = within(companies).getByRole("link", { name: /Delta Norte S\.A\./ });
    expect(company).toHaveAttribute("href", "/org/empresas/company-dn");
    expect(company).toHaveClass("py-2.5", "pl-5", "pr-4");
    expect(company.closest("li")).not.toBeNull();
    expect(within(company).getByText("DN")).toHaveClass("size-10", "rounded-[10px]", "text-[14px]", "font-bold");
    expect(within(company).getByText("Delta Norte S.A.")).toHaveClass("text-[15px]", "font-semibold");
    expect(within(company).getByText("Solo lectura · 3 miembros")).toHaveClass("text-[13px]", "text-[var(--t3)]");
    expect(screen.queryByRole("region", { name: "Para resolver" })).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Áreas de la organización" })).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  // Tablero M-Inicio-Miembro (v106, «Administra su empresa»): si administra su empresa, debajo de «Tus empresas» va su
  // «Para resolver», con las filas de M-Inicio-Org. B4 (ADR 0040): la fila dice la empresa que manda el back y
  // «Reenviar» lleva a la ficha de esa empresa (decisión 87).
  it("tablero M-Inicio-Miembro: si administra su empresa, abajo su «Para resolver» con la empresa", async () => {
    phone(true);
    serveHome({ organization: null, companies: [{ companyId: "company-dn", name: "Delta Norte S.A.", roles: ["Administrador"], memberCount: 3 }],
      pending: [expiredInCompany] });
    renderRouteWithProviders("/org", { as: "visual-error-org" });

    const companies = await screen.findByRole("region", { name: "Tus empresas" });
    expect(within(companies).getByRole("link", { name: /Delta Norte S\.A\./ })).toHaveTextContent("Administrador · 3 miembros");
    const toResolve = screen.getByRole("region", { name: "Para resolver" });
    expect(within(toResolve).getAllByText("1")).toHaveLength(2);
    const invitation = within(toResolve).getByText("martin.paz@delta.ejemplo.com").closest("li")!;
    expect(invitation).toHaveTextContent("Invitación vencida");
    expect(invitation).not.toHaveTextContent("Delta Norte S.A.");
    expect(within(invitation).getByRole("link", { name: "Reenviar" })).toHaveAttribute("href", "/org/empresas/company-dn");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  // Tablero Inicio-Miembro («Administra su empresa»): «Para resolver» lleva la columna Empresa en lugar de Área, con la
  // empresa de la fila (ADR 0040), y «Reenviar» abre la ficha de esa empresa.
  it("tablero Inicio-Miembro: si administra su empresa, «Para resolver» con la columna Empresa y «Reenviar» a su ficha", async () => {
    serveHome({ organization: null, companies: [{ companyId: "company-dn", name: "Delta Norte S.A.", roles: ["Administrador"], memberCount: 3 }],
      pending: [expiredInCompany] });
    const { container } = renderRouteWithProviders("/org", { as: "visual-error-org" });

    const toResolve = await screen.findByRole("region", { name: "Para resolver" });
    expect(within(toResolve).getAllByRole("columnheader").map((header) => header.textContent))
      .toEqual(["Pendiente", "Estado", "Desde", "Acción"]);
    const invitation = within(toResolve).getByText("martin.paz@delta.ejemplo.com").closest("tr")!;
    expect(within(toResolve).getByText("Delta Norte S.A.")).toBeVisible();
    expect(invitation).not.toHaveTextContent("Delta Norte S.A.");
    expect(invitation).not.toHaveTextContent("Usuarios");
    expect(invitation).toHaveTextContent("Vencida");
    expect(within(invitation).getByRole("link", { name: "Reenviar" })).toHaveAttribute("href", "/org/empresas/company-dn");
    expect(await axe(container)).toHaveNoViolations();
  });
});

// La invitación vencida de una empresa que administra (B4, decisión 86): el back la manda con la empresa.
const expiredInCompany: HomeResponse["pending"][number] = { area: "users", kind: "invitationExpired", subject: "martin.paz@delta.ejemplo.com",
  urgent: false, sinceUtc: "2026-09-25T15:00:00Z", dueAtUtc: null, targetId: "member-martin", companyId: "company-dn", companyName: "Delta Norte S.A." };
