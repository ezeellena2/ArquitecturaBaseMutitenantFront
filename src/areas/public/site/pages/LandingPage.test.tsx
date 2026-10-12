import type { PagedResultOfDirectoryEntryRow } from "@/shared/api/types";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { SiteLayout } from "@/layouts/SiteLayout";
import { changeCulture, configureI18n } from "@/shared/i18n";
import type { DirectoryEntryRow } from "@/shared/api/types";
import { publicSiteHost, publicSiteUrl } from "@/tenancy/publicSite";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { asPhone } from "@/test/utils/phone";
import { renderWithProviders } from "@/test/utils/renderWithProviders";
import { LandingPage } from "./LandingPage";

const companies: DirectoryEntryRow[] = [
  { slug: "compania-publica", name: "Compañía pública E2E", description: "Su descripción publicada.", logoUrl: null },
  { slug: "omega-publica", name: "Omega pública", description: "La segunda empresa publicada.", logoUrl: "/api/directory/omega-publica/logo" },
  { slug: "sigma-publicada", name: "Sigma publicada", description: null, logoUrl: null },
  { slug: "cuarta-publicada", name: "Cuarta publicada", description: "No entra en la vista previa.", logoUrl: null },
];

function directoryResponse(items: readonly DirectoryEntryRow[] = companies): PagedResultOfDirectoryEntryRow {
  return { items: [...items], page: 1, pageSize: 10, totalCount: items.length, totalPages: items.length === 0 ? 0 : 1, hasPrevious: false, hasNext: false };
}

beforeEach(async () => {
  await configureI18n(referenceDataFixture().cultures);
  await changeCulture("es-AR");
  server.use(http.get("/api/directory", () => HttpResponse.json(directoryResponse())));
});

function show() {
  const router = createMemoryRouter([
    { path: "/", element: <SiteLayout><LandingPage /></SiteLayout> },
    { path: "/empresas", element: <div /> },
  ]);
  return { router, ...renderWithProviders(<RouterProvider router={router} />) };
}

async function companySection() {
  const section = await screen.findByRole("region", { name: "Empresas en ArquitecturaBase" });
  await within(section).findByRole("link", { name: /^Compañía pública E2E/ });
  return section;
}

describe("LandingPage", () => {
  it("respeta secciones, textos y orden del tablero de escritorio", async () => {
    const { container } = show();
    await companySection();
    const main = screen.getByRole("main");
    const headings = within(main).getAllByRole("heading").map((heading) => heading.textContent);
    expect(headings).toEqual([
      "Para vos y para tu empresa.", "Dos lados separados", "Para personas", "Para empresas",
      "Empresas en ArquitecturaBase", "Tu empresa, en tres pasos", "Registrá tu empresa", "Sumá las otras empresas", "Invitá a tu equipo", "Probalo hoy",
    ]);
    expect(within(main).getByText("Como persona, creá tu cuenta con tu correo o tu WhatsApp. Si tenés una empresa o un grupo, registralo y sumá a tu equipo con sus roles.")).toBeVisible();
    expect(within(main).getByText("Lucía Fernández")).toBeVisible();
    expect(within(main).getByText("Grupo Delta")).toBeVisible();
    expect(within(main).getAllByRole("link", { name: "Crear mi cuenta" })).toHaveLength(3);
    expect(within(main).getAllByRole("link", { name: "Crear mi cuenta" })[0]).toHaveClass("min-h-10");
    expect(within(main).getAllByRole("link", { name: "Crear mi cuenta" })[2]).toHaveClass("min-h-10");
    expect(within(main).getAllByRole("link", { name: "Crear mi cuenta" })[0]).toHaveClass("after:-inset-y-0.5");
    expect(within(main).getByRole("heading", { name: "Registrá tu empresa" })).toBeVisible();
    // Como el tablero Landing: en la portada después de «Crear mi cuenta», en «Para empresas» antes de
    // «Ingresá como empresa» y en el cierre primero.
    const register = within(main).getAllByRole("link", { name: "Registrá tu empresa" });
    const create = within(main).getAllByRole("link", { name: "Crear mi cuenta" });
    expect(register).toHaveLength(3);
    for (const link of register) expect(link).toHaveAttribute("href", "/registro/empresa");
    const follows = (first: Element, second: Element) => Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING);
    expect(follows(create[0], register[0])).toBe(true);
    expect(follows(register[1], within(main).getByRole("link", { name: "Ingresá como empresa" }))).toBe(true);
    expect(follows(register[2], create[2])).toBe(true);
    expect(screen.queryByText("Para personas y para empresas")).not.toBeInTheDocument();
    expect(within(screen.getByRole("navigation", { name: "Secciones" })).getByRole("link", { name: "Empresas" })).toHaveAttribute("href", "#empresas");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("lleva a la puerta empresarial y al registro personal; conserva el orden móvil a 390", async () => {
    const undoPhone = asPhone();
    const originalWidth = window.innerWidth;
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
    try {
      const { container } = show();
      const section = await companySection();
      for (const link of screen.getAllByRole("link", { name: "Ingresá como empresa" })) expect(link).toHaveAttribute("href", "/login/empresa");
      expect(within(screen.getByRole("main")).getAllByRole("link", { name: "Crear mi cuenta" })[0]).toHaveAttribute("href", "/registro");
      expect(screen.queryByRole("navigation", { name: "Secciones" })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Abrir el menú" })).toBeVisible();
      expect(within(section).getByRole("searchbox", { name: "Buscar una empresa" })).toBeVisible();
      expect(within(section).getAllByRole("link")).toHaveLength(4);
      expect(await axe(container)).toHaveNoViolations();
    } finally {
      undoPhone();
      Object.defineProperty(window, "innerWidth", { configurable: true, value: originalWidth });
    }
  });

  it("pide 1/10 y muestra solo las primeras tres proyecciones públicas en el orden del backend", async () => {
    const requests: URL[] = [];
    server.use(http.get("/api/directory", ({ request }) => {
      requests.push(new URL(request.url));
      return HttpResponse.json(directoryResponse());
    }));
    show();
    const section = await companySection();
    expect(requests).toHaveLength(1);
    expect([...requests[0].searchParams.entries()]).toEqual([["page", "1"], ["pageSize", "10"]]);
    const links = within(section).getAllByRole("link");
    expect(links.slice(0, 3).map((link) => link.getAttribute("href"))).toEqual(companies.slice(0, 3).map((company) => publicSiteUrl(company.slug)));
    for (const company of companies.slice(0, 3)) {
      const link = within(section).getByRole("link", { name: new RegExp(`^${company.name}`) });
      expect(link).toHaveAttribute("href", publicSiteUrl(company.slug));
      expect(link).not.toHaveAttribute("target");
      expect(within(link).getByText(publicSiteHost(company.slug))).toBeVisible();
    }
    const first = within(section).getByRole("link", { name: /^Compañía pública E2E/ });
    expect(within(first).getByText("CP")).toBeVisible();
    expect(within(first).getByText("Su descripción publicada.")).toBeVisible();
    const logo = within(section).getByRole("link", { name: /^Omega pública/ }).querySelector("img");
    expect(logo).toHaveAttribute("src", companies[1].logoUrl);
    expect(logo).toHaveAttribute("alt", "");
    expect(within(section).queryByText("Cuarta publicada")).not.toBeInTheDocument();
    expect(within(section).getByRole("link", { name: "Ver todas las empresas" })).toHaveAttribute("href", "/empresas");
  });

  it.each(["con empresas", "sin empresas"])("Enter navega con la búsqueda codificada, %s, sin filtrar la vista previa", async (state) => {
    const user = userEvent.setup();
    const requests: URL[] = [];
    server.use(http.get("/api/directory", ({ request }) => {
      requests.push(new URL(request.url));
      return HttpResponse.json(directoryResponse(state === "con empresas" ? companies : []));
    }));
    const { router } = show();
    if (state === "con empresas") await companySection();
    else await screen.findByText("Todavía no hay empresas publicadas");
    const search = screen.getByRole("searchbox", { name: "Buscar una empresa" });
    await user.click(search);
    await user.paste("  Compañía & Delta  ");
    expect(requests).toHaveLength(1);
    await user.keyboard("{Enter}");
    await waitFor(() => expect(router.state.location.pathname).toBe("/empresas"));
    expect(new URLSearchParams(router.state.location.search).get("search")).toBe("Compañía & Delta");
    expect(requests).toHaveLength(1);
  });

  it("con directorio vacío conserva el buscador y omite ver todas", async () => {
    server.use(http.get("/api/directory", () => HttpResponse.json(directoryResponse([]))));
    show();
    expect(await screen.findByText("Todavía no hay empresas publicadas")).toBeVisible();
    expect(screen.getByRole("searchbox", { name: "Buscar una empresa" })).toBeVisible();
    const section = screen.getByRole("region", { name: "Empresas en ArquitecturaBase" });
    expect(within(section).queryByRole("link")).not.toBeInTheDocument();
  });

  it("traduce el error genérico sin exponer su detail técnico y reintenta la misma consulta", async () => {
    const user = userEvent.setup();
    let calls = 0;
    server.use(http.get("/api/directory", () => {
      calls++;
      return calls === 1 ? HttpResponse.json({ status: 500, code: "Server.Unexpected", detail: "Technical directory failure", traceId: "directory-trace" }, { status: 500 }) : HttpResponse.json(directoryResponse());
    }));
    show();
    expect(await screen.findByRole("alert")).toHaveTextContent("Algo salió mal. Probá de nuevo en un rato.");
    expect(screen.queryByText("Technical directory failure")).not.toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: "Buscar una empresa" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    await companySection();
    expect(calls).toBe(2);
  });

  it("muestra empresas, buscador y navegación en inglés con los mismos datos públicos", async () => {
    await changeCulture("en-US");
    const { container } = show();
    const section = await screen.findByRole("region", { name: "Businesses on ArquitecturaBase" });
    expect(await within(section).findByRole("link", { name: /^Compañía pública E2E/ })).toBeVisible();
    expect(within(section).getByRole("searchbox", { name: "Search for a business" })).toBeVisible();
    expect(within(section).getByRole("link", { name: "View all businesses" })).toHaveAttribute("href", "/empresas");
    expect(screen.queryByText("For people and businesses")).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});
