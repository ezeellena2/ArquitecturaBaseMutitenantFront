import { pagedOptions } from "@/test/mocks/pagedOptions";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { configureI18n, changeCulture } from "@/shared/i18n";
import type { MeResponse, PlatformAuditEventResponse } from "@/shared/api/types";
import { referenceDataFixture, meHandlerFor } from "@/test/mocks/handlers";
import { platformOperator } from "@/test/mocks/currentUsers";
import { server } from "@/test/mocks/server";
import { asPhone } from "@/test/utils/phone";
import { currentUserQueryKey } from "@/auth/useCurrentUser";
import { routes } from "@/app/routes";
import { AppProviders } from "@/app/providers";
import { createMemoryRouter, RouterProvider } from "react-router";
import { createQueryClient } from "@/shared/api/queryClient";
import { fixtureAuth } from "@/test/mocks/authContext";

const event: PlatformAuditEventResponse = {
  id: "event-1", occurredAtUtc: "2026-09-26T20:30:00Z", type: "accounts", action: "AccountSuspended",
  summary: "Suspendió la cuenta", target: "Ana Gómez", targetTenantId: null, targetAccountId: "account-1",
  actor: "Laura Díaz", actorRole: "Operador", reason: "Denuncia de uso indebido.", ipAddress: "181.45.178.•••",
};
const page = (items: PlatformAuditEventResponse[] = [event], nextCursor: string | null = null) => ({ items, nextCursor, hasMore: nextCursor !== null });
const auditOnly = { ...platformOperator, effectivePermissions: { ...platformOperator.effectivePermissions, platform: ["platform.audit.read"] } };

beforeAll(async () => { await import("./SecurityAuditPage"); });
afterEach(() => vi.unstubAllGlobals());

beforeEach(async () => {
  await configureI18n(referenceDataFixture().cultures);
  await changeCulture("es-AR");
  server.use(http.get("/api/platform/audit", () => HttpResponse.json(page())),
    http.get("/api/platform/audit/organizations/paged", () => HttpResponse.json(pagedOptions([{ id: "org-1", name: "Grupo Delta" }]))));
});

function mount(path = "/plataforma/auditoria", account: MeResponse = auditOnly) {
  server.use(meHandlerFor(account));
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const queryClient = createQueryClient({ queries: { retry: false }, mutations: { retry: false } });
  return { router, queryClient, ...render(<AppProviders client={queryClient} authContext={fixtureAuth("platform-operator")}><RouterProvider router={router} /></AppProviders>) };
}

async function openMenu(user: ReturnType<typeof userEvent.setup>, name: string) {
  screen.getByRole("button", { name }).focus();
  await user.keyboard("{Enter}");
}

describe("SecurityAuditPage", () => {
  it("busca la organización 101 dentro del filtro y conserva la búsqueda del historial", async () => {
    const requests: URL[] = [];
    const organization = { id: "org-101", name: "Organización 101" };
    server.use(http.get("/api/platform/audit/organizations/paged", ({ request }) => {
      const url = new URL(request.url); requests.push(url);
      return HttpResponse.json(url.searchParams.get("search") === "101" ? pagedOptions([organization])
        : { ...pagedOptions(Array.from({ length: 10 }, (_, index) => ({ id: `org-${index + 1}`, name: `Organización ${index + 1}` }))), totalCount: 101, totalPages: 11, hasNext: true });
    }));
    const user = userEvent.setup();
    const { router } = mount("/plataforma/auditoria?search=historial");
    await screen.findByText("Suspendió la cuenta");
    await openMenu(user, "Organización: todas");
    await screen.findByRole("menuitemradio", { name: "Organización 1" });
    const input = screen.getByRole("searchbox", { name: "Filtrar por organización" });
    act(() => input.focus());
    vi.useFakeTimers();
    fireEvent.change(input, { target: { value: "101" } });
    await act(async () => { await vi.advanceTimersByTimeAsync(300); });
    vi.useRealTimers();
    await user.click(await screen.findByRole("menuitemradio", { name: "Organización 101" }));
    expect(router.state.location.search).toContain("tenantId=org-101");
    expect(router.state.location.search).toContain("search=historial");
    expect(requests.at(-1)?.searchParams.get("auditSearch")).toBe("historial");
    expect(requests.at(-1)?.searchParams.get("pageSize")).toBe("10");
  });

  it("sólo audit.read carga la lista con período 30, cinco columnas y filtros sin cantidades", async () => {
    const urls: URL[] = [];
    server.use(http.get("/api/platform/audit", ({ request }) => { urls.push(new URL(request.url)); return HttpResponse.json(page()); }));
    const { container } = mount();
    expect(await screen.findByRole("button", { name: "Ver el detalle: Suspendió la cuenta" })).toBeVisible();
    expect(screen.getAllByRole("columnheader").map((header) => header.textContent)).toEqual(["Fecha y hora", "Qué pasó", "Sobre", "Quién", "Motivo"]);
    expect(screen.getByRole("button", { name: "Últimos 30 días" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Tipo: todos" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Organización: todas" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Limpiar" })).not.toBeInTheDocument();
    expect(screen.queryByText("AccountSuspended")).not.toBeInTheDocument();
    expect(Object.fromEntries(urls[0].searchParams)).toEqual({ period: "30", limit: "25" });
    expect(await axe(container)).toHaveNoViolations();
  });

  it("el detalle conserva fecha en el cuerpo, actor y rol, motivo e IP y se cierra", async () => {
    const user = userEvent.setup();
    mount();
    await user.click(await screen.findByRole("button", { name: "Ver el detalle: Suspendió la cuenta" }));
    const dialog = await screen.findByRole("dialog", { name: "Suspendió la cuenta" });
    expect(dialog).toHaveClass("md:max-w-[560px]");
    expect(dialog).toHaveTextContent("Fecha y hora26/09/2026 17:30");
    expect(dialog).toHaveTextContent("SobreAna Gómez");
    expect(dialog).toHaveTextContent("QuiénLaura Díaz · Operador");
    expect(dialog).toHaveTextContent("MotivoDenuncia de uso indebido.");
    expect(dialog).toHaveTextContent("Dirección IP181.45.178.•••");
    await user.click(within(dialog).getAllByRole("button", { name: "Cerrar" }).at(-1)!);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("cargar más lleva el cursor opaco y los mismos filtros, con páginas propias de opciones", async () => {
    const user = userEvent.setup();
    const requests: URLSearchParams[] = []; const options: URLSearchParams[] = [];
    server.use(http.get("/api/platform/audit", ({ request }) => {
      const params = new URL(request.url).searchParams; requests.push(params);
      return HttpResponse.json(params.has("after") ? page([{ ...event, id: "event-2", summary: "Reactivó la cuenta" }]) : page([event], "AQopaque/+=="));
    }), http.get("/api/platform/audit/organizations/paged", ({ request }) => { options.push(new URL(request.url).searchParams); return HttpResponse.json(pagedOptions([{ id: "org-1", name: "Grupo Delta" }])); }));
    mount("/plataforma/auditoria?period=7&type=accounts&tenantId=org-1&accountId=account-1&search=Ana");
    await user.click(await screen.findByRole("button", { name: "Cargar más" }));
    expect(await screen.findByText("Reactivó la cuenta")).toBeVisible();
    expect(screen.getByText("Suspendió la cuenta")).toBeVisible();
    expect(Object.fromEntries(requests.at(-1)!)).toEqual({ period: "7", type: "accounts", tenantId: "org-1", accountId: "account-1", search: "Ana", after: "AQopaque/+==", limit: "25" });
    expect(Object.fromEntries(options[0])).toEqual({ period: "7", type: "accounts", accountId: "account-1", auditSearch: "Ana", page: "1", pageSize: "10", sort: "name" });
    expect(screen.queryByRole("button", { name: "Cargar más" })).not.toBeInTheDocument();
  });

  it("filtra por organización, tipo y Todo; limpiar vuelve al default", async () => {
    const user = userEvent.setup(); const requests: URLSearchParams[] = [];
    server.use(http.get("/api/platform/audit", ({ request }) => { requests.push(new URL(request.url).searchParams); return HttpResponse.json(page()); }));
    const { router } = mount();
    await screen.findByText("Suspendió la cuenta");
    await openMenu(user, "Organización: todas");
    await user.click(await screen.findByRole("menuitemradio", { name: "Grupo Delta" }));
    await waitFor(() => expect(router.state.location.search).toContain("tenantId=org-1"));
    await openMenu(user, "Tipo: todos");
    expect(screen.getAllByRole("menuitemradio").map((item) => item.textContent)).toEqual(["Todos", "Ingresos", "Organizaciones", "Cuentas", "Operadores", "Configuración"]);
    await user.click(screen.getByRole("menuitemradio", { name: "Cuentas" }));
    await openMenu(user, "Últimos 30 días");
    await user.click(screen.getByRole("menuitemradio", { name: "Todo" }));
    await waitFor(() => expect(requests.at(-1)?.get("period")).toBe("all"));
    await openMenu(user, "Todo");
    expect(screen.getByRole("menuitemradio", { name: "Todo" })).toHaveAttribute("aria-checked", "true");
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Limpiar" }));
    await waitFor(() => expect(router.state.location.search).toBe(""));
    expect(screen.getByRole("button", { name: "Últimos 30 días" })).toBeVisible();
  });

  it("sin coincidencias permite limpiar filtros", async () => {
    const user = userEvent.setup();
    server.use(http.get("/api/platform/audit", () => HttpResponse.json(page([]))));
    const { router } = mount("/plataforma/auditoria?type=settings&search=sinresultado");
    expect(await screen.findByText("Nada coincide con los filtros")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    await waitFor(() => expect(router.state.location.search).toBe(""));
    expect(await screen.findByText("No hay movimientos para mostrar")).toBeVisible();
  });

  it("un 403 principal reemplaza la página; el selector secundario no la bloquea", async () => {
    server.use(http.get("/api/platform/audit/organizations/paged", () => HttpResponse.json({ code: "Authorization.Forbidden", detail: "Sin permiso para las opciones." }, { status: 403 })));
    const view = mount();
    expect(await screen.findByText("Suspendió la cuenta")).toBeVisible();
    view.unmount();
    server.use(http.get("/api/platform/audit", () => HttpResponse.json({ code: "Authorization.Forbidden", detail: "Sin permiso." }, { status: 403 })));
    mount();
    expect(await screen.findByRole("heading", { name: "No tenés permiso para ver esta página" })).toBeVisible();
  });

  it("sin audit.read la ruta no consulta auditoría ni sus organizaciones", async () => {
    let requests = 0;
    server.use(http.get("/api/platform/audit", () => { requests++; return HttpResponse.json(page()); }),
      http.get("/api/platform/audit/organizations/paged", () => { requests++; return HttpResponse.json(pagedOptions([])); }));
    mount("/plataforma/auditoria", { ...auditOnly, effectivePermissions: { ...auditOnly.effectivePermissions, platform: ["platform.accounts.read"] } });
    expect(await screen.findByRole("heading", { name: "No tenés permiso para ver esta página" })).toBeVisible();
    expect(requests).toBe(0);
  });

  it("la búsqueda cambia la consulta y descarta un detalle del filtro anterior", async () => {
    const user = userEvent.setup(); const requests: URLSearchParams[] = [];
    server.use(http.get("/api/platform/audit", ({ request }) => { requests.push(new URL(request.url).searchParams); return HttpResponse.json(page()); }));
    const { router } = mount();
    await user.click(await screen.findByRole("button", { name: "Ver el detalle: Suspendió la cuenta" }));
    await router.navigate("/plataforma/auditoria?search=Grupo%20Delta");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(requests.at(-1)?.get("search")).toBe("Grupo Delta"));
    await user.clear(screen.getByRole("searchbox", { name: "Buscar en la auditoría" }));
    await user.type(screen.getByRole("searchbox", { name: "Buscar en la auditoría" }), "Ana");
    await waitFor(() => expect(requests.at(-1)?.get("search")).toBe("Ana"));
  });

  it("390 usa título envuelto, fecha corta, motivo y hoja común con vacíos", async () => {
    asPhone(); const user = userEvent.setup();
    server.use(http.get("/api/platform/audit", () => HttpResponse.json(page([{ ...event, reason: null, ipAddress: null }]))));
    const { container } = mount();
    const title = await screen.findByText("Suspendió la cuenta");
    const row = title.closest("li")!;
    expect(row).toHaveTextContent("26/09 17:30");
    expect(row).toHaveTextContent("Ana Gómez · Laura Díaz");
    expect(title).not.toHaveClass("truncate");
    expect(screen.getByText("Administración")).toBeVisible();
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
    await user.click(title);
    const dialog = await screen.findByRole("dialog", { name: "Suspendió la cuenta" });
    expect(dialog).toHaveClass("bottom-0", "rounded-t-[20px]");
    expect(dialog).toHaveTextContent("Fecha y hora26/09/2026 17:30");
    expect(within(dialog).getAllByRole("img", { name: "Sin dato" })).toHaveLength(2);
    expect(await axe(dialog)).toHaveNoViolations();
    await user.click(within(dialog).getAllByRole("button", { name: "Cerrar" }).at(-1)!);
    await user.click(screen.getByRole("button", { name: "Filtrar la auditoría" }));
    const filters = await screen.findByRole("dialog", { name: "Filtrar la auditoría" });
    await user.click(within(filters).getByRole("radio", { name: "Grupo Delta" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("en-US usa los textos y fechas de la cultura efectiva", async () => {
    const user = userEvent.setup(); const view = mount();
    await screen.findByText("Suspendió la cuenta");
    await act(async () => { view.queryClient.setQueryData(currentUserQueryKey, { ...auditOnly, culture: "en-US" }); });
    await user.click(await screen.findByRole("button", { name: "View details: Suspendió la cuenta" }));
    const dialog = await screen.findByRole("dialog", { name: "Suspendió la cuenta" });
    expect(dialog).toHaveTextContent("Date and time09/26/2026 5:30 PM");
    expect(dialog).toHaveTextContent("AboutAna Gómez");
    expect(dialog).toHaveTextContent("IP address181.45.178.•••");
  });

  it("una relectura fallida muestra Reintentar, conserva caché y recupera las filas", async () => {
    const user = userEvent.setup(); let reads = 0;
    server.use(http.get("/api/platform/audit", () => ++reads === 2
      ? HttpResponse.json({ code: "General.Unexpected", traceId: "trace-test" }, { status: 500 }) : HttpResponse.json(page())));
    const view = mount();
    await screen.findByText("Suspendió la cuenta");
    const [key, cached] = view.queryClient.getQueriesData({ queryKey: ["platform-audit"] }).find(([key]) => key[1] !== "organizations")!;
    await act(async () => { await view.queryClient.invalidateQueries({ queryKey: key, exact: true }); });
    expect(await screen.findByRole("button", { name: "Reintentar" })).toBeVisible();
    expect(view.queryClient.getQueryData(key)).toEqual(cached);
    expect(screen.queryByText("trace-test")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText("Suspendió la cuenta")).toBeVisible();
    expect(reads).toBe(3);
  });

  it("perder audit.read desmonta el detalle y recuperarlo no revive la selección", async () => {
    const user = userEvent.setup(); const view = mount();
    await user.click(await screen.findByRole("button", { name: "Ver el detalle: Suspendió la cuenta" }));
    expect(await screen.findByRole("dialog", { name: "Suspendió la cuenta" })).toBeVisible();
    await act(async () => { view.queryClient.setQueryData(currentUserQueryKey, { ...auditOnly, effectivePermissions: { ...auditOnly.effectivePermissions, platform: [] } }); });
    expect(await screen.findByRole("heading", { name: "No tenés permiso para ver esta página" })).toBeVisible();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await act(async () => { view.queryClient.setQueryData(currentUserQueryKey, auditOnly); });
    expect(await screen.findByText("Suspendió la cuenta")).toBeVisible();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
