import { act, fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { changeCulture, configureI18n } from "@/shared/i18n";
import type { PagedResult } from "@/shared/api/pagedResult";
import type { DirectoryEntryRow } from "@/shared/api/types";
import { publicSiteHost, publicSiteUrl } from "@/tenancy/publicSite";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { asPhone } from "@/test/utils/phone";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";

const companies: DirectoryEntryRow[] = Array.from({ length: 50 }, (_, index) => ({
  slug: `empresa-${index + 1}`, name: `Empresa ${index + 1}`, description: `Descripción pública ${index + 1}.`, logoUrl: null,
}));
const delta: DirectoryEntryRow = { slug: "grupo-delta", name: "Grupo Delta publicado", description: "Datos públicos de Delta.", logoUrl: null };
let requests: URL[];

function paged(items: readonly DirectoryEntryRow[], query: URLSearchParams): PagedResult<DirectoryEntryRow> {
  const page = Number(query.get("page") ?? 1);
  const pageSize = Number(query.get("pageSize") ?? 10);
  return {
    items: items.slice((page - 1) * pageSize, page * pageSize), page, pageSize, totalCount: items.length,
    totalPages: Math.ceil(items.length / pageSize), hasPrevious: page > 1, hasNext: page * pageSize < items.length,
  };
}

function respond(items: readonly DirectoryEntryRow[] = companies) {
  server.use(http.get("/api/directory", ({ request }) => {
    const url = new URL(request.url);
    requests.push(url);
    const search = url.searchParams.get("search") ?? "";
    const result = search === "Delta" ? [delta] : search ? [] : items;
    return HttpResponse.json(paged(result, url.searchParams));
  }));
}

beforeAll(async () => { await import("./DirectoryPage"); });
beforeEach(async () => {
  await configureI18n(referenceDataFixture().cultures);
  await changeCulture("es-AR");
  requests = [];
  respond();
});
afterEach(() => vi.useRealTimers());

describe("DirectoryPage", () => {
  it.each([1, 50])("consulta la primera página real de 10, con %i empresas, y conserva el marco público", async (total) => {
    respond(companies.slice(0, total));
    const { container } = renderRouteWithProviders("/empresas");
    const first = await screen.findByRole("link", { name: /^Empresa 1\b/ });
    const main = screen.getByRole("main");
    expect(within(main).getByRole("heading", { level: 1, name: "Empresas" })).toBeVisible();
    expect(within(main).getByRole("searchbox", { name: "Buscar por nombre" })).toBeVisible();
    const navigation = screen.getByRole("navigation", { name: "Secciones" });
    expect(within(navigation).getByRole("link", { name: "Personas" })).toHaveAttribute("href", "/#personas");
    expect(within(navigation).getByRole("link", { name: "Empresas" })).toHaveAttribute("aria-current", "page");
    expect(requests[0].searchParams.get("page")).toBe("1");
    expect(requests[0].searchParams.get("pageSize")).toBe("10");
    expect(requests[0].searchParams.get("search")).toBeNull();
    expect(within(main).getAllByRole("link")).toHaveLength(Math.min(total, 10));
    expect(first).toHaveAttribute("href", publicSiteUrl(companies[0].slug));
    expect(within(first).getByText(publicSiteHost(companies[0].slug))).toBeVisible();
    expect(screen.getByText(total === 1 ? "1 de 1" : "1–10 de 50")).toBeVisible();
    expect(screen.getByText(total === 1 ? "Página 1 de 1" : "Página 1 de 5")).toBeVisible();
    expect(screen.getByRole("combobox", { name: "Filas por página" })).toBeVisible();
    expect(screen.queryByRole("link", { name: "Ayuda" })).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("las flechas cambian la URL y piden otra página al backend sin acumular tarjetas", async () => {
    const user = userEvent.setup();
    const { router } = renderRouteWithProviders("/empresas");
    await screen.findByRole("link", { name: /^Empresa 1\b/ });
    await user.click(screen.getByRole("button", { name: "Página siguiente" }));
    expect(await screen.findByRole("link", { name: /^Empresa 11\b/ })).toBeVisible();
    expect(new URLSearchParams(router.state.location.search).get("page")).toBe("2");
    expect(requests.at(-1)?.searchParams.get("page")).toBe("2");
    expect(requests.at(-1)?.searchParams.get("pageSize")).toBe("10");
    expect(within(screen.getByRole("main")).getAllByRole("link")).toHaveLength(10);
    expect(screen.queryByRole("link", { name: /^Empresa 1\b/ })).not.toBeInTheDocument();
    expect(screen.getByText("11–20 de 50")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Página anterior" }));
    await screen.findByRole("link", { name: /^Empresa 1\b/ });
    expect(new URLSearchParams(router.state.location.search).get("page")).toBeNull();
  });

  it("la búsqueda vive en la URL, espera 300 ms para la API y vuelve a página 1 conservando parámetros ajenos", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { router } = renderRouteWithProviders("/empresas?page=2&otro=x");
    await screen.findByRole("link", { name: /^Empresa 11\b/ });
    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar por nombre" }), { target: { value: "Delta" } });
    const params = new URLSearchParams(router.state.location.search);
    expect(params.get("search")).toBe("Delta");
    expect(params.get("page")).toBeNull();
    expect(params.get("otro")).toBe("x");
    expect(requests.some((url) => url.searchParams.get("search") === "Delta")).toBe(false);
    await act(async () => { await vi.advanceTimersByTimeAsync(300); });
    expect(await screen.findByRole("link", { name: /^Grupo Delta publicado/ })).toBeVisible();
    const searchRequests = requests.filter((url) => url.searchParams.get("search") === "Delta");
    expect(searchRequests).toHaveLength(1);
    expect(searchRequests[0].searchParams.get("page")).toBe("1");
    expect(searchRequests[0].searchParams.get("pageSize")).toBe("10");
    expect(searchRequests[0].searchParams.get("otro")).toBeNull();
    expect(within(screen.getByRole("main")).getAllByRole("link")).toHaveLength(1);
  });

  it("sin coincidencias permite limpiar búsqueda y página; sin publicaciones conserva buscador sin paginado", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    respond([]);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { router } = renderRouteWithProviders("/empresas?search=sin-coincidencias&page=2&otro=x");
    expect(await screen.findByText("Ninguna empresa coincide con la búsqueda")).toBeVisible();
    expect(screen.queryByRole("navigation", { name: "Paginado" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Limpiar búsqueda" }));
    await act(async () => { await vi.advanceTimersByTimeAsync(300); });
    expect(await screen.findByText("Todavía no hay empresas publicadas")).toBeVisible();
    expect(new URLSearchParams(router.state.location.search).get("search")).toBeNull();
    expect(new URLSearchParams(router.state.location.search).get("page")).toBeNull();
    expect(new URLSearchParams(router.state.location.search).get("otro")).toBe("x");
    expect(screen.getByRole("searchbox", { name: "Buscar por nombre" })).toHaveValue("");
    expect(screen.queryByRole("button", { name: "Limpiar búsqueda" })).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Paginado" })).not.toBeInTheDocument();
  });

  it("el error usa el texto común y Reintentar conserva la consulta de página y búsqueda", async () => {
    let calls = 0;
    server.use(http.get("/api/directory", ({ request }) => {
      const url = new URL(request.url);
      requests.push(url);
      calls++;
      return calls === 1 ? HttpResponse.json({ status: 500, code: "Server.Unexpected", detail: "Technical directory failure", traceId: "directory-trace" }, { status: 500 }) : HttpResponse.json(paged([delta], url.searchParams));
    }));
    const user = userEvent.setup();
    renderRouteWithProviders("/empresas?search=Delta");
    expect(await screen.findByRole("alert")).toHaveTextContent("Algo salió mal. Probá de nuevo en un rato.");
    expect(screen.queryByText("Technical directory failure")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    await screen.findByRole("link", { name: /^Grupo Delta publicado/ });
    expect(calls).toBe(2);
    expect(requests[1].search).toBe(requests[0].search);
  });

  it("a 390 usa paginado web con rango, página y flechas; mantiene 10 por página", async () => {
    const undoPhone = asPhone();
    const originalWidth = window.innerWidth;
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
    try {
      const user = userEvent.setup();
      const { router, container } = renderRouteWithProviders("/empresas");
      await screen.findByRole("link", { name: /^Empresa 1\b/ });
      expect(screen.getByRole("button", { name: "Abrir el menú" })).toBeVisible();
      expect(screen.getByText("1–10 de 50")).toBeVisible();
      expect(screen.getByText("Página 1 de 5")).toBeVisible();
      expect(screen.queryByRole("combobox", { name: "Filas por página" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Cargar más" })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Página anterior" })).toBeDisabled();
      await user.click(screen.getByRole("button", { name: "Página siguiente" }));
      await screen.findByRole("link", { name: /^Empresa 11\b/ });
      expect(requests.at(-1)?.searchParams.get("pageSize")).toBe("10");
      expect(new URLSearchParams(router.state.location.search).get("page")).toBe("2");
      expect(new URLSearchParams(router.state.location.search).get("pageSize")).toBeNull();
      expect(screen.getByText("Página 2 de 5")).toBeVisible();
      expect(await axe(container)).toHaveNoViolations();
    } finally {
      undoPhone();
      Object.defineProperty(window, "innerWidth", { configurable: true, value: originalWidth });
    }
  });

  it("en inglés conserva los datos públicos y traduce buscador y paginado", async () => {
    await changeCulture("en-US");
    const { container } = renderRouteWithProviders("/empresas");
    await screen.findByRole("link", { name: /^Empresa 1\b/ });
    expect(screen.getByRole("heading", { level: 1, name: "Businesses" })).toBeVisible();
    expect(screen.getByRole("searchbox", { name: "Search by name" })).toBeVisible();
    expect(screen.getByText("1–10 of 50")).toBeVisible();
    expect(screen.getByText("Page 1 of 5")).toBeVisible();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("el directorio es público también con perfil personal y nunca monta en subdominio ni host desconocido", async () => {
    const main = renderRouteWithProviders("/empresas", { as: "consumer-with-organizations" });
    await screen.findByRole("link", { name: /^Empresa 1\b/ });
    expect(screen.getByRole("heading", { name: "Empresas" })).toBeVisible();
    expect(screen.queryByRole("complementary", { name: "Navegación principal" })).not.toBeInTheDocument();
    main.unmount();
    requests = [];
    for (const host of [publicSiteHost("grupo-delta"), "grupo-delta.localtest.me:5175"]) {
      const site = renderRouteWithProviders("/empresas", { host });
      expect(await screen.findByRole("heading", { name: "Esta página no está disponible" })).toBeVisible();
      expect(screen.queryByRole("searchbox", { name: "Buscar por nombre" })).not.toBeInTheDocument();
      expect(requests).toHaveLength(0);
      site.unmount();
    }
  });
});
