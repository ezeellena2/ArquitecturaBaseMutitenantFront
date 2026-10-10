import { render, screen, within, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { http, HttpResponse } from "msw";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { AppProviders } from "@/app/providers";
import { routesForHost } from "@/app/routes";
import { moduleComposition } from "@/app/moduleComposition";
import { createQueryClient } from "@/shared/api/queryClient";
import type { AssistantConversationResponse, AssistantStateResponse, HomeResponse, MeResponse, PlatformTenantDetailResponse } from "@/shared/api/types";
import { currentUserQueryKey } from "@/auth/useCurrentUser";
import { server } from "@/test/mocks/server";
import { fixtureAuth } from "@/test/mocks/authContext";
import { businessE6Admin, consumerWithoutOrganizations, platformOperator } from "@/test/mocks/currentUsers";
import { meHandlerFor } from "@/test/mocks/handlers";
import { PublicSiteHostContext } from "@/tenancy/usePublicSite";
import { mainSiteHost } from "@/tenancy/publicSite";
import { asPhone } from "@/test/utils/phone";
import type { ModuleRegistration } from "@/shared/modules/types";
import { assistantRegistration } from "./registration";

const state: AssistantStateResponse = { configured: true, canConfigure: false, models: [], quickQueries: [], dailyLimit: 50, remainingMessages: 40,
  dailyResetAtUtc: "2026-10-11T00:00:00Z", noticeVersion: "v1", noticeAccepted: true, retentionDays: 30, maxAttachmentBytes: 10485760, maxAttachments: 5 };
const personal = { ...consumerWithoutOrganizations, features: ["assistant"] };
const business = { ...businessE6Admin, features: ["assistant"], effectivePermissions: { ...businessE6Admin.effectivePermissions, organization: [...businessE6Admin.effectivePermissions.organization, "assistant.use"] } };
const platform = { ...platformOperator, effectivePermissions: { ...platformOperator.effectivePermissions, platform: [...platformOperator.effectivePermissions.platform, "platform.assistant.use"] }, moduleCapabilities: [{ key: "assistant", available: true, canConfigure: false, canReadUsage: false }] };

function mount(path: string, me: MeResponse, modules: readonly ModuleRegistration[] = moduleComposition) {
  server.use(meHandlerFor(me));
  const client = createQueryClient({ queries: { retry: false }, mutations: { retry: false } });
  client.setQueryData(currentUserQueryKey, me);
  const auth = fixtureAuth(me.access === "platform" ? "platform-operator" : me.access === "business" ? "business-e6-admin" : "consumer-empty");
  const router = createMemoryRouter(routesForHost(mainSiteHost), { initialEntries: [path] });
  const result = render(<PublicSiteHostContext.Provider value={mainSiteHost}><AppProviders client={client} authContext={auth} modules={modules}><RouterProvider router={router} /></AppProviders></PublicSiteHostContext.Provider>);
  return { ...result, client, router, auth, user: userEvent.setup() };
}

let assistantRequests: string[];
beforeAll(async () => { await import("@/modules/assistant/pages/RegisteredAssistant"); await import("@/areas/platform/tenants/pages/OrganizationsPage"); await import("@/layouts/MorePage"); });
beforeEach(() => {
  assistantRequests = [];
  Element.prototype.scrollTo = vi.fn();
  server.use(http.get("/api/:scope/assistant", ({ request }) => { assistantRequests.push(request.url); return HttpResponse.json(state); }),
    http.get("/api/:scope/assistant/conversations", () => HttpResponse.json({ items: [], hasMore: false })),
    http.get("/api/platform/tenants/paged", () => HttpResponse.json({ items: [], page: 1, pageSize: 10, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false })),
    http.get("/api/platform/tenants/filter-counts", () => HttpResponse.json({ total: 0, statuses: [], sources: [] })));
});
afterEach(() => vi.unstubAllGlobals());

describe("composición real de accesos e inicios", () => {
  it.each(([404, 403] as const).flatMap((status) => [
    { path: "/", account: personal, status }, { path: "/org", account: business, status }, { path: "/plataforma", account: platform, status },
  ]))("$path State $status conserva Inicio del núcleo y revalida Me", async ({ path, account, status }) => {
    const app = mount(path, account);
    await screen.findByRole("textbox", { name: "Tu consulta" });
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    let reads = 0;
    server.use(http.get("/api/:scope/assistant", () => HttpResponse.json({ code: status === 404 ? "Http.NotFound" : "Http.Forbidden" }, { status })),
      http.get("/api/me", async () => { reads++; await gate; return HttpResponse.json({ ...account, features: [], moduleCapabilities: [] }); }));
    try {
      await act(async () => { await app.client.invalidateQueries({ queryKey: ["assistant", account.access, account.activeTenantId ?? null, account.id, "state"] }); });
      await waitFor(() => expect(reads).toBe(1));
      expect(screen.getAllByRole("heading", { name: "Inicio" })).toHaveLength(1);
      expect(screen.queryByRole("textbox", { name: "Tu consulta" })).not.toBeInTheDocument();
      expect(screen.queryByRole("heading", { name: /No encontramos esta página|No tenés permiso/u })).not.toBeInTheDocument();
    } finally { await act(async () => { release(); await gate; }); }
    await waitFor(() => expect(app.client.getQueryData<MeResponse>(currentUserQueryKey)?.features).toEqual([]));
    expect(reads).toBe(1);
    expect(app.client.getQueryCache().findAll({ queryKey: ["assistant"] })).toHaveLength(0);
  });
  it.each([["/", personal, null], ["/org", business, "Empresa A"], ["/plataforma", platform, "Plataforma"]] as const)("%s con módulo conserva la banda de Inicio en escritorio", async (path, me, summary) => {
    const app = mount(path, me);
    await screen.findByRole("textbox", { name: "Tu consulta" });
    const band = screen.getByRole("heading", { name: "Inicio" }).closest("header")!;
    expect(band).toBeVisible();
    if (summary) expect(within(band).getByText(summary)).toBeVisible();
    expect(await axe(app.container)).toHaveNoViolations();
  });
  it.each([["/asistente", personal], ["/org/asistente", business], ["/plataforma/asistente", platform]] as const)("%s apagado y desinstalado no consulta Assistant", async (path, me) => {
    for (const modules of [[], moduleComposition]) {
      const off = { ...me, features: [], moduleCapabilities: [] };
      const app = mount(path, off, modules);
      expect(await screen.findByRole("heading", { name: "No encontramos esta página" })).toBeVisible();
      expect(assistantRequests).toHaveLength(0);
      app.unmount();
    }
  });
  it.each([["/org/asistente", business], ["/plataforma/asistente", platform]] as const)("%s sin permiso muestra 403 antes de pedir State", async (path, me) => {
    mount(path, { ...me, effectivePermissions: { organization: [], platform: [], companies: {} } });
    expect(await screen.findByRole("heading", { name: "No tenés permiso para ver esta página" })).toBeVisible();
    expect(assistantRequests).toHaveLength(0);
  });
  it.each([1440, 768])("Personal a %i conserva el aviso con conversación abierta y desmonta al apagar módulo", async (width) => {
    vi.stubGlobal("innerWidth", width);
    const conversation: AssistantConversationResponse = { conversation: { id: "chat", title: "Consulta previa", version: 1, isSaved: false, createdAtUtc: "2026-10-10T12:00:00Z", lastActivityAtUtc: "2026-10-10T12:00:00Z" }, messages: { items: [], hasMore: false }, activeTurnId: null };
    server.use(http.get("/api/me/assistant/conversations", ({ request }) => HttpResponse.json({ items: new URL(request.url).searchParams.get("saved") === "false" ? [conversation.conversation] : [], hasMore: false })),
      http.get("/api/me/assistant/conversations/chat", () => HttpResponse.json(conversation)));
    const app = mount("/", { ...personal, needsPersonalLoginMethod: true });
    await screen.findByRole("textbox", { name: "Tu consulta" });
    const notice = screen.getByText("Agregá un correo personal o tu WhatsApp para no perder tu cuenta si dejás la empresa.");
    await app.user.click(await screen.findByRole("button", { name: "Consulta previa" }));
    expect(notice).toBeVisible();
    expect(await axe(app.container)).toHaveNoViolations();
    act(() => app.client.setQueryData(currentUserQueryKey, { ...personal, features: [] }));
    await waitFor(() => expect(screen.queryByRole("textbox", { name: "Tu consulta" })).not.toBeInTheDocument());
    expect(screen.getByRole("heading", { name: "Inicio" })).toBeVisible();
    expect(app.client.getQueryCache().findAll({ queryKey: ["assistant"] })).toHaveLength(0);
  });
  it("390: conserva billetera, Asistente segundo y herramientas de barra izquierda/derecha", async () => {
    asPhone();
    const app = mount("/org", business);
    await screen.findByText("Tus empresas");
    expect(assistantRequests).toHaveLength(0);
    const nav = screen.getByRole("navigation", { name: "Secciones" });
    expect(within(nav).getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual(["/org", "/org/asistente", "/mas"]);
    await app.user.click(within(nav).getByRole("link", { name: "Asistente" }));
    await screen.findByRole("textbox", { name: "Tu consulta" });
    const bar = screen.getByRole("heading", { name: "Asistente" }).closest("header")!;
    const history = within(bar).getByRole("button", { name: "Conversaciones" });
    const title = within(bar).getByRole("heading", { name: "Asistente" });
    const next = within(bar).getByRole("button", { name: "Nueva conversación" });
    expect(history.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(title.compareDocumentPosition(next) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    await app.user.click(history);
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    await app.user.keyboard("{Escape}");
    await waitFor(() => expect(history).toHaveFocus());
    expect(await axe(app.container)).toHaveNoViolations();
  });
  it("Plataforma abre Organizaciones con replace en el teléfono y conserva Recuperaciones en Más", async () => {
    asPhone();
    const app = mount("/plataforma", platform);
    await screen.findByRole("heading", { name: "Organizaciones" });
    expect(app.router.state.location.pathname).toBe("/plataforma/organizaciones");
    expect(app.router.state.historyAction).toBe("REPLACE");
    const nav = screen.getByRole("navigation", { name: "Secciones" });
    expect(within(nav).getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual(["/plataforma/organizaciones", "/plataforma/asistente", "/plataforma/cuentas", "/plataforma/mas"]);
    expect(within(nav).getByRole("link", { name: "Organizaciones" })).toHaveAttribute("aria-current", "page");
    expect(assistantRequests).toHaveLength(0);
    await app.user.click(within(nav).getByRole("link", { name: "Más" }));
    expect(await screen.findByRole("list", { name: "Gestión" })).toBeVisible();
    expect(within(screen.getByRole("list", { name: "Gestión" })).getByRole("link", { name: "Recuperaciones" })).toHaveAttribute("href", "/plataforma/recuperaciones");
    expect(screen.queryByRole("list", { name: "Secciones" })).not.toBeInTheDocument();
    expect(screen.queryByText("Perfiles")).not.toBeInTheDocument();
  });
  it.each([["/plataforma/mas", platform, "/plataforma"], ["/mas", business, "/org"]] as const)("%s distingue Administración y el grupo Asistente", async (path, account, prefix) => {
    asPhone();
    const me: MeResponse = { ...account, effectivePermissions: { ...account.effectivePermissions, organization: [...account.effectivePermissions.organization, "assistant.configure"] },
      moduleCapabilities: [{ key: "assistant", available: true, canConfigure: true, canReadUsage: true }] };
    const usage: ModuleRegistration = { id: "test-usage", routes: [{ access: me.access, path: `${prefix}/asistente/uso`, guard: () => "allowed", Page: () => null,
      navigation: { placement: "administration", labelKey: "assistant:limit.usage", icon: assistantRegistration.routes[0].navigation!.icon, section: { labelKey: "assistant:title", icon: assistantRegistration.routes[0].navigation!.icon } } }] };
    const app = mount(path, me, [...moduleComposition, usage]);
    const group = await screen.findByRole("list", { name: "Asistente" });
    expect(within(group).getByRole("link", { name: "Configuración" })).toHaveAttribute("href", `${prefix}/asistente/configuracion`);
    expect(within(group).getByRole("link", { name: "Ver uso" })).toHaveAttribute("href", `${prefix}/asistente/uso`);
    expect(within(screen.getByRole("list", { name: "Administración" })).getByRole("link", { name: "Configuración" })).toHaveAttribute("href", `${prefix}/configuracion`);
    expect(screen.queryByRole("list", { name: "Secciones" })).not.toBeInTheDocument();
    expect(within(screen.getByRole("navigation", { name: "Secciones" })).getAllByRole("link", { name: "Asistente" })).toHaveLength(1);
    expect(await axe(app.container)).toHaveNoViolations();
  });
  it("Plataforma móvil sin tenants.read abre la primera sección permitida del módulo", async () => {
    asPhone();
    const app = mount("/plataforma", { ...platform, effectivePermissions: { organization: [], companies: {}, platform: ["platform.assistant.use"] } });
    await screen.findByRole("textbox", { name: "Tu consulta" });
    expect(app.router.state.location.pathname).toBe("/plataforma/asistente");
    expect(app.router.state.historyAction).toBe("REPLACE");
    const nav = screen.getByRole("navigation", { name: "Secciones" });
    expect(within(nav).getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual(["/plataforma/asistente", "/plataforma/mas"]);
    expect(within(nav).getByRole("link", { name: "Asistente" })).toHaveAttribute("aria-current", "page");
  });
  it("sin assistant.use conserva organizaciones legacy y el alias listado funciona con registro vacío", async () => {
    const first = mount("/plataforma", platformOperator);
    await screen.findByRole("heading", { name: "Organizaciones" });
    expect(first.router.state.location.pathname).toBe("/plataforma");
    expect(assistantRequests).toHaveLength(0);
    first.unmount();
    const alias = mount("/plataforma/organizaciones", platformOperator, []);
    await screen.findByRole("heading", { name: "Organizaciones" });
    expect(alias.router.state.location.pathname).toBe("/plataforma/organizaciones");
    expect(assistantRequests).toHaveLength(0);
  });
  it("el alias listado conserva tenants.read aunque el operador tenga chat", async () => {
    mount("/plataforma/organizaciones", { ...platform, effectivePermissions: { organization: [], companies: {}, platform: ["platform.assistant.use"] } });
    expect(await screen.findByRole("heading", { name: "No tenés permiso para ver esta página" })).toBeVisible();
    expect(assistantRequests).toHaveLength(0);
  });
  it("la ficha conserva migas y retorno al listado separado cuando hay inicio de módulo", async () => {
    const organization: PlatformTenantDetailResponse = { id: "delta", name: "Grupo Delta", status: "Active", source: "SelfService", createdAtUtc: "2026-10-10T12:00:00Z", companyCount: 0, memberCount: 0, version: 1, owners: [] };
    server.use(http.get("/api/platform/tenants/delta", () => HttpResponse.json(organization)),
      http.get("/api/platform/tenants/delta/features", () => HttpResponse.json([])),
      http.get("/api/platform/tenants/delta/history", () => HttpResponse.json({ items: [], hasMore: false })));
    mount("/plataforma/organizaciones/delta", platform);
    await screen.findByRole("heading", { name: "Grupo Delta" });
    const links = screen.getAllByRole("link", { name: "Organizaciones" });
    expect(links.length).toBeGreaterThanOrEqual(2);
    expect(links.every((link) => link.getAttribute("href") === "/plataforma/organizaciones")).toBe(true);
    expect(assistantRequests).toHaveLength(0);
  });
  it("390 Personal conserva Inicio sin cargar chat y ofrece Asistente segundo", async () => {
    asPhone();
    mount("/", { ...personal, needsPersonalLoginMethod: true });
    expect(await screen.findByRole("heading", { name: "Inicio" })).toBeVisible();
    expect(screen.getByText("Agregá un correo personal o tu WhatsApp para no perder tu cuenta si dejás la empresa.")).toBeVisible();
    expect(within(screen.getByRole("navigation", { name: "Secciones" })).getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual(["/", "/asistente", "/mas"]);
    expect(assistantRequests).toHaveLength(0);
  });
  it("escritorio empresarial conserva tarjetas y Para resolver del GET home real", async () => {
    const home: HomeResponse = { organization: { users: { total: 11 }, roles: null, companies: null, publicPage: null, settings: null, audit: null }, companies: [], pending: [] };
    server.use(http.get("/api/home", () => HttpResponse.json(home)));
    mount("/org", business);
    await screen.findByRole("textbox", { name: "Tu consulta" });
    const cards = await screen.findByRole("navigation", { name: "Áreas de la organización" });
    expect(within(cards).getByRole("link", { name: /^Usuarios/ })).toHaveTextContent("11 usuarios");
    expect(screen.getByText("Nada para resolver")).toBeVisible();
    expect(within(screen.getByRole("complementary", { name: "Navegación principal" })).queryByRole("link", { name: "Asistente" })).not.toBeInTheDocument();
  });
  it.each(["Active", "Suspended"] as const)("el enlace personal a organización %s cambia sólo al click mediante profiles/select", async (status) => {
    const tenantId = "11111111-1111-4111-8111-111111111111";
    const me: MeResponse = { ...personal, organizations: [{ id: tenantId, name: "Beta S.R.L.", status, memberStatus: "Active", isSelectable: status === "Active" }] };
    const conversation: AssistantConversationResponse = { conversation: { id: "chat", title: "Mis organizaciones", version: 1, isSaved: false, createdAtUtc: "2026-10-10T12:00:00Z", lastActivityAtUtc: "2026-10-10T12:00:00Z" }, messages: { items: [{ id: "answer", role: "assistant", text: "Beta S.R.L.", status: "Complete", createdAtUtc: "2026-10-10T12:00:00Z", version: 1, attachments: [], links: [
      { routeKey: "personal.organizations", labelKey: "personal.organizations", parameters: { tenantId }, query: {} },
      { routeKey: "personal.organizations", labelKey: "personal.organizations", parameters: { tenantId: "22222222-2222-4222-8222-222222222222" }, query: {} },
      { routeKey: "personal.organizations", labelKey: "personal.organizations", parameters: {}, query: {} },
      { routeKey: "business.home", labelKey: "business.home", parameters: {}, query: {} },
    ] }], hasMore: false }, activeTurnId: null };
    server.use(http.get("/api/me/assistant/conversations", ({ request }) => HttpResponse.json({ items: new URL(request.url).searchParams.get("saved") === "false" ? [conversation.conversation] : [], hasMore: false })),
      http.get("/api/me/assistant/conversations/chat", () => HttpResponse.json(conversation)));
    const app = mount("/", me);
    let complete: (() => void) | undefined;
    const signedIn = new Promise<void>((resolve) => { complete = resolve; });
    const signinSilent = vi.fn(async () => { await signedIn; return app.auth.user ?? null; });
    app.auth.signinSilent = signinSilent;
    await app.user.click(await screen.findByRole("button", { name: "Mis organizaciones" }));
    const link = await screen.findByRole("button", { name: "Ver Beta S.R.L." });
    expect(screen.getAllByRole("button", { name: "Ver Beta S.R.L." })).toHaveLength(1);
    expect(signinSilent).not.toHaveBeenCalled();
    app.client.setQueryData(["private-before-switch"], "private");
    await app.user.click(link);
    expect(signinSilent).toHaveBeenCalledWith({ forceIframeAuth: true, extraQueryParams: { access: "business", tenant: tenantId } });
    expect(await screen.findByRole("heading", { name: "Cambiando a Beta S.R.L.…" })).toBeVisible();
    server.use(meHandlerFor({ ...me, access: "business", activeTenantId: tenantId, features: [] }));
    app.auth.user!.profile.access = "business";
    app.auth.user!.profile.tenant_id = tenantId;
    await act(async () => { complete!(); await signedIn; });
    await waitFor(() => expect(app.router.state.location.pathname).toBe("/org"));
    expect(app.client.getQueryData(["private-before-switch"])).toBeUndefined();
    expect(app.client.getQueryCache().findAll({ queryKey: ["assistant"] })).toHaveLength(0);
    expect(await screen.findByRole("heading", { name: status === "Suspended" ? /suspendida/i : "Inicio" })).toBeVisible();
  });
  it("un enlace de Uso sólo aparece al registrar su página, aunque Me ya otorgue read", async () => {
    const me = { ...platform, effectivePermissions: { ...platform.effectivePermissions, platform: [...platform.effectivePermissions.platform, "platform.assistant.read"] } };
    const detail: AssistantConversationResponse = { conversation: { id: "chat", title: "Consulta de uso", version: 1, isSaved: false, createdAtUtc: "2026-10-10T12:00:00Z", lastActivityAtUtc: "2026-10-10T12:00:00Z" }, activeTurnId: null,
      messages: { items: [{ id: "answer", role: "assistant", text: "Respuesta de uso", status: "Complete", createdAtUtc: "2026-10-10T12:00:00Z", version: 1, attachments: [], links: [{ routeKey: "platform.assistant.usage", labelKey: "platform.assistant.usage", parameters: {}, query: {} }] }], hasMore: false } };
    server.use(http.get("/api/platform/assistant/conversations", ({ request }) => HttpResponse.json({ items: new URL(request.url).searchParams.get("saved") === "false" ? [detail.conversation] : [], hasMore: false })),
      http.get("/api/platform/assistant/conversations/chat", () => HttpResponse.json(detail)));
    const app = mount("/plataforma", me);
    await app.user.click(await screen.findByRole("button", { name: "Consulta de uso" }));
    await screen.findByText("Respuesta de uso");
    expect(screen.queryByRole("link", { name: "Ver uso del asistente" })).not.toBeInTheDocument();
    app.unmount();
    const withUsage = mount("/plataforma", me, [...moduleComposition, { id: "test-usage", routes: [{ access: "platform", path: "/plataforma/asistente/uso", guard: () => "allowed", Page: () => null }] }]);
    await withUsage.user.click(await screen.findByRole("button", { name: "Consulta de uso" }));
    expect(await screen.findByRole("link", { name: "Ver uso del asistente" })).toHaveAttribute("href", "/plataforma/asistente/uso");
  });
});




