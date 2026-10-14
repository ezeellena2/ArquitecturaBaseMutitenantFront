import { act, screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { changeCulture } from "@/shared/i18n";
import type { AssistantUsagePageResponse, AssistantUsageRowResponse } from "@/modules/assistant/api/types";
import { currentUserQueryKey } from "@/auth/useCurrentUser";
import { server } from "@/test/mocks/server";
import { asPhone } from "@/test/utils/phone";
import { businessManager, mountSettings, platformManager, settingsHandlers } from "../settings/settingsTestSupport";

beforeAll(async () => { await import("./OrganizationAssistantUsagePage"); await import("./PlatformAssistantUsagePage"); });
beforeEach(() => settingsHandlers());
afterEach(async () => { vi.unstubAllGlobals(); await act(async () => { await changeCulture("es-AR"); }); });
const orgPath = "/org/asistente/uso?month=2026-10";
const platPath = "/plataforma/asistente/uso?month=2026-10";
function row(overrides: Partial<AssistantUsageRowResponse> = {}): AssistantUsageRowResponse {
  return { kind: "day", day: "2026-10-07", displayName: "", queries: 212, inputTokens: 2457600000, outputTokens: 10, cacheReadTokens: 5, cacheWriteTokens: 2,
    cost: { amount: 6.1, currency: "USD" }, peopleCount: 8, fundingMode: null, dailyUsage: null, budgetProgress: null, ...overrides };
}
function page(items = [row()], overrides: Partial<AssistantUsagePageResponse> = {}): AssistantUsagePageResponse {
  return { month: "2026-10", cost: { amount: 77.125, currency: "USD" }, budget: { amount: 100, currency: "USD" }, totalQueries: 1284, peopleCount: 9,
    organizationCount: null, budgetProgress: { fraction: 0.77125, status: "WithinLimit" },
    rows: { items, page: 1, pageSize: 10, totalCount: items.length, totalPages: 1, hasPrevious: false, hasNext: false }, ...overrides };
}
function orgHandler(data = page()) { server.use(http.get("/api/organization/assistant/usage", () => HttpResponse.json(data))); }

describe("Uso Business: contrato agregado sin permiso de chat", () => {
  it("Por día muestra personas del servidor y dinero central, sin pedir State/Settings", async () => {
    let otherReads = 0;
    server.use(http.get("/api/organization/assistant", () => { otherReads++; return HttpResponse.json({}, { status: 501 }); }),
      http.get("/api/organization/assistant/settings", () => { otherReads++; return HttpResponse.json({}, { status: 501 }); }));
    orgHandler(); mountSettings(businessManager, orgPath);
    expect(await screen.findByRole("columnheader", { name: "Personas" })).toBeVisible();
    const day = within(screen.getByRole("table")).getAllByRole("row")[1];
    expect(day).toHaveTextContent("07/10/2026"); expect(within(day).getAllByRole("cell")[2]).toHaveTextContent("8"); expect(day).toHaveTextContent("USD 6,10");
    const summary = screen.getByRole("group", { name: "Resumen de uso" });
    expect(summary).toHaveTextContent("USD 77,13 de USD 100,00"); expect(summary).toHaveTextContent("1.284 consultas"); expect(summary).toHaveTextContent("9 personas");
    expect(within(summary).queryByText("Con la clave de la plataforma")).not.toBeInTheDocument();
    expect(within(summary).queryByText(/50 consultas por persona por día/)).not.toBeInTheDocument();
    expect(within(summary).queryByRole("button")).not.toBeInTheDocument();
    expect(otherReads).toBe(0); expect(screen.queryByRole("textbox", { name: "Tu consulta" })).not.toBeInTheDocument();
    expect(await axe(screen.getByRole("main"))).toHaveNoViolations();
  });
  it("en-US conserva dinero y mes del formato central", async () => {
    await changeCulture("en-US"); orgHandler(); mountSettings({ ...businessManager, culture: "en-US" }, orgPath);
    expect(await screen.findByRole("columnheader", { name: "People" })).toBeVisible();
    expect(screen.getByRole("combobox", { name: "Month" })).toHaveTextContent("October 2026");
    expect(screen.getByText(/USD\s6\.10/)).toBeVisible();
  });
  it("sin presupuesto aplicable conserva costo y conteos sin inventar un tope", async () => {
    orgHandler(page(undefined, { budget: null, budgetProgress: null })); mountSettings(businessManager, orgPath);
    const summary = await screen.findByRole("group", { name: "Resumen de uso" });
    expect(summary).toHaveTextContent("Costo"); expect(summary).toHaveTextContent("USD 77,13");
    expect(summary).toHaveTextContent("1.284 consultas"); expect(summary).toHaveTextContent("9 personas");
    expect(within(summary).queryByText("Tope del mes")).not.toBeInTheDocument();
    expect(within(summary).queryByRole("progressbar")).not.toBeInTheDocument();
  });
  it("el mes histórico no toma financiación ni cuota de Settings/State actuales", async () => {
    let otherReads = 0;
    server.use(http.get("/api/organization/assistant", () => { otherReads++; return HttpResponse.json({}, { status: 403 }); }),
      http.get("/api/organization/assistant/settings", () => { otherReads++; return HttpResponse.json({}, { status: 403 }); }));
    orgHandler(page([row({ kind: "person", day: null, personId: "person-a", displayName: "Lucía Test", dailyLimit: null, dailyUsage: null })], { month: "2026-09" }));
    mountSettings(businessManager, "/org/asistente/uso?month=2026-09&groupBy=person");
    const person = within(await screen.findByRole("table")).getAllByRole("row")[1];
    expect(within(person).getAllByRole("cell")[1]).toHaveTextContent("—");
    const summary = screen.getByRole("group", { name: "Resumen de uso" });
    expect(within(summary).queryByText("Con la clave de la plataforma")).not.toBeInTheDocument();
    expect(within(summary).queryByText(/consultas por persona por día/)).not.toBeInTheDocument();
    expect(otherReads).toBe(0);
  });
  it.each([["NearLimit", 0.1, "Cerca del tope"], ["LimitReached", 0.2, "Llegó al tope"]] as const)("usa status %s incluso si la fracción contradice el umbral", async (status, fraction, text) => {
    orgHandler(page(undefined, { budgetProgress: { fraction, status } })); mountSettings(businessManager, orgPath);
    expect(await screen.findByText(text)).toBeVisible();
    expect(screen.getByRole("progressbar", { name: "Uso del tope mensual" })).toHaveAttribute("value", String(fraction));
  });
  it("fracción superior a1 conserva su texto; null no se convierte en cero", async () => {
    orgHandler(page(undefined, { budgetProgress: { fraction: 1.25, status: "LimitReached" } }));
    const app = mountSettings(businessManager, orgPath);
    expect(await screen.findByText(/125\s?%/)).toBeVisible();
    orgHandler(page(undefined, { budgetProgress: null, budget: null }));
    await act(() => app.client.invalidateQueries({ queryKey: ["assistant"] }));
    await waitFor(() => expect(screen.queryByRole("progressbar")).not.toBeInTheDocument());
    expect(screen.queryByText(/^0\s?%$/)).not.toBeInTheDocument();
  });
  it("cambiar a Por persona reinicia página y sólo usa dailyUsage publicado", async () => {
    const urls: URL[] = [];
    server.use(http.get("/api/organization/assistant/usage", ({ request }) => {
      const url = new URL(request.url); urls.push(url);
      return HttpResponse.json(url.searchParams.get("groupBy") === "person" ? page([row({ kind: "person", day: null, personId: "person-a", displayName: "Lucía Test", peopleCount: null,
        dailyUsage: { dayUtc: "2026-10-11", resetAtUtc: "2026-10-12T00:00:00Z", scope: "PlatformKey", queries: 7, limit: 50, limitReached: true } })]) : page());
    }));
    const app = mountSettings(businessManager, orgPath + "&page=3");
    await screen.findByRole("columnheader", { name: "Día" });
    await app.user.click(screen.getByRole("button", { name: "Por persona" }));
    expect(await screen.findByText("Lucía Test")).toBeVisible();
    const person = within(screen.getByRole("table")).getAllByRole("row")[1];
    expect(within(person).getAllByRole("cell")[1]).toHaveTextContent("7 de 50 · Llegó al tope");
    expect(urls.at(-1)?.searchParams.get("page")).toBe("1"); expect(urls.at(-1)?.searchParams.get("groupBy")).toBe("person");
    expect(urls.at(-1)?.searchParams.has("userId")).toBe(false);
  });
  it("MonthField cambia el mes y reinicia la página sin límites de historia inventados", async () => {
    const urls: URL[] = [];
    server.use(http.get("/api/organization/assistant/usage", ({ request }) => { const url = new URL(request.url); urls.push(url); return HttpResponse.json(page()); }));
    const app = mountSettings(businessManager, orgPath + "&page=2");
    await screen.findByRole("table");
    await app.user.click(screen.getByRole("combobox", { name: "Mes" }));
    await app.user.click(screen.getByRole("option", { name: "Septiembre" }));
    await waitFor(() => expect(urls.at(-1)?.searchParams.get("month")).toBe("2026-09"));
    expect(urls.at(-1)?.searchParams.get("page")).toBe("1");
  });
  it("un mes inválido no alcanza la API", async () => {
    let reads = 0; server.use(http.get("/api/organization/assistant/usage", () => { reads++; return HttpResponse.json(page()); }));
    mountSettings(businessManager, "/org/asistente/uso?month=invalid");
    expect(await screen.findByRole("combobox", { name: "Mes" })).toHaveAttribute("aria-invalid", "true"); expect(reads).toBe(0);
  });
  it("la página fuera de rango usa totalPages publicado, sin calcularlo desde el total", async () => {
    const pages: string[] = [];
    server.use(http.get("/api/organization/assistant/usage", ({ request }) => {
      const requested = new URL(request.url).searchParams.get("page") ?? "1"; pages.push(requested);
      return HttpResponse.json(page(requested === "6" ? [] : [row()], { rows: { items: requested === "6" ? [] : [row()], page: Number(requested), pageSize: 10, totalCount: 10000, totalPages: 3, hasPrevious: true, hasNext: false } }));
    }));
    mountSettings(businessManager, orgPath + "&page=6");
    await waitFor(() => expect(pages).toEqual(["6", "3"]));
    expect(await screen.findByRole("table")).toBeVisible();
  });
  it("al cambiar persona no muestra su resumen ni filas anteriores durante la nueva lectura", async () => {
    let reads = 0;
    let release: (data: AssistantUsagePageResponse) => void = () => {};
    const pending = new Promise<AssistantUsagePageResponse>((resolve) => { release = resolve; });
    const previous = page([row({ kind: "person", personId: "old-person", displayName: "Persona anterior" })]);
    const next = page([row({ kind: "person", personId: "new-person", displayName: "Persona actual" })], { cost: { amount: 2, currency: "USD" } });
    server.use(http.get("/api/organization/assistant/usage", async () => HttpResponse.json(++reads === 1 ? previous : await pending)));
    const app = mountSettings(businessManager, orgPath + "&groupBy=person");
    try {
      await screen.findByText("Persona anterior");
      await act(async () => { app.client.setQueryData(currentUserQueryKey, { ...businessManager, id: "new-actor" }); });
      await waitFor(() => expect(reads).toBe(2));
      expect(screen.queryByText("Persona anterior")).not.toBeInTheDocument();
      expect(screen.queryByRole("group", { name: "Resumen de uso" })).not.toBeInTheDocument();
      await act(async () => { release(next); });
      expect(await screen.findByText("Persona actual")).toBeVisible();
    } finally { release(next); }
  });
  it.each(["off", "forbidden"] as const)("%s se resuelve antes de llamar Uso", async (state) => {
    let reads = 0; server.use(http.get("/api/organization/assistant/usage", () => { reads++; return HttpResponse.json(page()); }));
    const me = state === "off" ? { ...businessManager, features: [] } : { ...businessManager, effectivePermissions: { ...businessManager.effectivePermissions, organization: [] } };
    mountSettings(me, orgPath);
    expect(await screen.findByText(state === "off" ? "No encontramos esta página" : "No tenés permiso para ver esta página")).toBeVisible(); expect(reads).toBe(0);
  });
  it("390px Por persona conserva el mes anterior sin convertir cuota ausente en cero", async () => {
    asPhone(); orgHandler(page([row({ kind: "person", day: null, personId: "person-a", displayName: "Lucía Test", peopleCount: null, dailyUsage: null })], { month: "2026-09" }));
    mountSettings(businessManager, "/org/asistente/uso?month=2026-09&groupBy=person");
    expect(await screen.findByText("Lucía Test")).toBeVisible(); expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByText("0 de 50")).not.toBeInTheDocument(); expect(await axe(screen.getByRole("main"))).toHaveNoViolations();
  });
  it("rechazo HTTP403 de Uso conserva la pantalla de permiso, nunca mes vacío", async () => {
    server.use(http.get("/api/organization/assistant/usage", () => HttpResponse.json({ code: "Authorization.Forbidden" }, { status: 403 })));
    mountSettings(businessManager, orgPath);
    expect(await screen.findByText("No tenés permiso para ver esta página")).toBeVisible(); expect(screen.queryByText("Sin uso este mes")).not.toBeInTheDocument();
  });
  it("Sin uso este mes no revela conversaciones ni inventa datos", async () => {
    orgHandler(page([], { totalQueries: 0, peopleCount: 0, cost: { amount: 0, currency: "USD" }, budgetProgress: null }));
    mountSettings(businessManager, orgPath);
    expect(await screen.findByText("Sin uso este mes")).toBeVisible(); expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Resumen de uso" })).toHaveTextContent("USD 0,00 de USD 100,00");
    expect(screen.queryByRole("group", { name: "Uso por día o persona" })).not.toBeInTheDocument();
  });
  it("501 muestra error reintentable; una respuesta válida posterior reemplaza el error", async () => {
    let reads = 0;
    server.use(http.get("/api/organization/assistant/usage", () => ++reads === 1 ? HttpResponse.json({ code: "General.Contract.NotImplemented" }, { status: 501 }) : HttpResponse.json(page())));
    const app = mountSettings(businessManager, orgPath);
    expect(await screen.findByText("No pudimos abrir esta pantalla")).toBeVisible(); expect(screen.queryByText("Sin uso este mes")).not.toBeInTheDocument();
    await app.user.click(screen.getByRole("button", { name: "Reintentar" })); await screen.findByRole("table"); expect(reads).toBe(2);
  });
});

describe("Uso Platform y teléfono", () => {
  const reader = { ...platformManager, moduleCapabilities: [{ key: "assistant", available: false, canConfigure: false, canReadUsage: true }],
    effectivePermissions: { ...platformManager.effectivePermissions, platform: ["platform.assistant.read"] } };
  function platformData() {
    const organization = row({ kind: "organization", day: null, organizationId: "organization-a", displayName: "Grupo Prueba", fundingMode: "PlatformKey", peopleCount: null,
      monthlyBudget: { amount: 100, currency: "USD" }, budgetProgress: { fraction: 0.06, status: "WithinLimit" } });
    return page([organization, { ...organization, fundingMode: "OwnKey", cost: { amount: 44.2, currency: "USD" }, monthlyBudget: { amount: 300, currency: "USD" }, budgetProgress: { fraction: 0.2, status: "NearLimit" } },
      row({ kind: "personal", day: null, displayName: "Personas", fundingMode: "PlatformKey", peopleCount: null }),
      row({ kind: "operator", day: null, displayName: "Operadores", fundingMode: "PlatformKey", peopleCount: null })],
    { platformKeyCost: { amount: 68.2, currency: "USD" }, organizationCount: 1, budgetProgress: null });
  }
  it("read sin chat/config ve dos financiaciones históricas y categorías; el resumen no suma sus costos", async () => {
    server.use(http.get("/api/platform/assistant/usage", () => HttpResponse.json(platformData())));
    mountSettings(reader, platPath);
    expect(await screen.findByText("USD 68,20")).toBeVisible(); expect(screen.getAllByText("Grupo Prueba")).toHaveLength(2);
    expect(screen.getByText("Personas")).toBeVisible(); expect(screen.getByText("Operadores")).toBeVisible();
    expect(await axe(screen.getByRole("main"))).toHaveNoViolations();
  });
  it("390px conserva lista sin links a conversaciones ni tabla", async () => {
    asPhone(); server.use(http.get("/api/platform/assistant/usage", () => HttpResponse.json(platformData())));
    mountSettings(reader, platPath);
    expect(await screen.findByText("USD 68,20")).toBeVisible(); expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getAllByText("Grupo Prueba")).toHaveLength(2); expect(screen.queryByRole("link", { name: "Grupo Prueba" })).not.toBeInTheDocument();
    expect(await axe(screen.getByRole("main"))).toHaveNoViolations();
  });
  it("costo de plataforma ausente queda sin dato y no toma el costo combinado", async () => {
    server.use(http.get("/api/platform/assistant/usage", () => HttpResponse.json({ ...platformData(), platformKeyCost: null })));
    mountSettings(reader, platPath);
    const summary = await screen.findByRole("group", { name: "Resumen de uso" });
    expect(within(summary).getByText("—")).toBeVisible(); expect(within(summary).queryByText("USD 77,13")).not.toBeInTheDocument();
  });
});
