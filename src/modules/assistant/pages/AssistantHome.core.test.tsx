import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { RouterProvider, createMemoryRouter } from "react-router";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { AppProviders } from "@/app/providers";
import { routes } from "@/app/routes";
import { createQueryClient } from "@/shared/api/queryClient";
import type { AssistantStateResponse, HomeResponse, MeResponse } from "@/shared/api/types";
import { changeCulture, configureI18n } from "@/shared/i18n";
import { fixtureAuth } from "@/test/mocks/authContext";
import { businessE6Admin } from "@/test/mocks/currentUsers";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";

const me: MeResponse = { ...businessE6Admin, features: ["assistant"], effectivePermissions: {
  ...businessE6Admin.effectivePermissions, organization: [...businessE6Admin.effectivePermissions.organization, "assistant.use"],
} };
const home: HomeResponse = { organization: { users: { total: 2 }, roles: { total: 1 }, companies: { total: 1 },
  publicPage: { state: "Draft" }, settings: { domain: null }, audit: { lastChangeAtUtc: null } }, companies: [],
  pending: [{ area: "publicPage", kind: "publicPageDraft", subject: null, urgent: false, sinceUtc: null, dueAtUtc: null, targetId: null }] };
const state: AssistantStateResponse = { configured: false, canConfigure: false, models: [], quickQueries: [], dailyLimit: 50,
  dailyResetAtUtc: "2026-10-10T21:00:00Z", remainingMessages: 50, noticeVersion: "v1", noticeAccepted: false,
  retentionDays: 30, maxAttachmentBytes: 10_485_760, maxAttachments: 5, monthlyBudgetProgress: null };

beforeAll(async () => { await import("@/areas/business/home/pages/BusinessHomePage"); await import("./RegisteredAssistant"); });
beforeEach(async () => { await configureI18n(referenceDataFixture().cultures); await changeCulture("es-AR"); });

function renderHome(coreStatus = 200) {
  let homeCalls = 0;
  let meReads = 0;
  const client = createQueryClient({ queries: { retry: false }, mutations: { retry: false } });
  const router = createMemoryRouter(routes, { initialEntries: ["/org"] });
  server.use(http.get("/api/me", () => { meReads++; return HttpResponse.json(me); }),
    http.get("/api/home", () => { homeCalls++; return HttpResponse.json(coreStatus === 200 ? home : { code: "Authorization.PermissionDenied" }, { status: coreStatus }); }),
    http.get("/api/organization/assistant/conversations", () => HttpResponse.json({ items: [], hasMore: false })));
  const view = <AppProviders client={client} authContext={fixtureAuth("business-admin")}><RouterProvider router={router} /></AppProviders>;
  // El proveedor y las rutas son los reales; sólo HTTP pasa por MSW.
  return { ...render(view), router, homeCalls: () => homeCalls, meReads: () => meReads };
}

async function expectCore() {
  const areas = await screen.findByRole("navigation", { name: "Áreas de la organización" });
  expect(within(areas).getByRole("link", { name: /^Usuarios/ })).toHaveAttribute("href", "/org/usuarios");
  expect(within(areas).getByRole("link", { name: /^Auditoría/ })).toHaveAttribute("href", "/org/auditoria");
  const pending = screen.getByRole("region", { name: "Para resolver" });
  expect(within(pending).getByText("Borrador", { exact: true })).toBeVisible();
  expect(within(pending).getByRole("link", { name: "Ver" })).toHaveAttribute("href", "/org/pagina");
  return areas;
}

describe("Inicio Empresa conserva el núcleo con el módulo opcional", () => {
  it.each([500, 501])("State %s muestra error y reintento local sin ocultar áreas ni pendientes", async (status) => {
    let calls = 0;
    server.use(http.get("/api/organization/assistant", () => ++calls === 1
      ? HttpResponse.json({ code: "General.PrivateFailure", detail: "provider secret", traceId: "private-trace" }, { status })
      : HttpResponse.json(state)));
    const app = renderHome();
    await screen.findByRole("heading", { name: "No pudimos abrir esta pantalla" });
    await expectCore();
    expect(screen.queryByRole("heading", { name: "El asistente todavía no está configurado" })).not.toBeInTheDocument();
    expect(screen.queryByText(/provider secret|private-trace/)).not.toBeInTheDocument();
    await userEvent.setup().click(within(screen.getByRole("region", { name: "Asistente" })).getByRole("button", { name: "Reintentar" }));
    await waitFor(() => expect(calls).toBe(2));
    await waitFor(() => expect(screen.queryByRole("heading", { name: "No pudimos abrir esta pantalla" })).not.toBeInTheDocument());
    expect(app.homeCalls()).toBe(1);
    const areas = await expectCore();
    await userEvent.setup().click(within(areas).getByRole("link", { name: /^Usuarios/ }));
    await waitFor(() => expect(app.router.state.location.pathname).toBe("/org/usuarios"));
  });
  it("State pendiente conserva las acciones del núcleo antes de recibir configuración", async () => {
    let release!: () => void;
    const pending = new Promise<void>((resolve) => { release = resolve; });
    server.use(http.get("/api/organization/assistant", async () => { await pending; return HttpResponse.json(state); }));
    renderHome();
    try {
      await expectCore();
      expect(within(screen.getByRole("region", { name: "Asistente" })).getByRole("status")).toHaveTextContent("Cargando");
    } finally { await act(async () => { release(); await pending; }); }
    await expectCore();
  });
  it.each([403, 404])("State revocado %s vuelve al núcleo y relee Me", async (status) => {
    server.use(http.get("/api/organization/assistant", () => HttpResponse.json({ code: "Assistant.Unavailable" }, { status })));
    const app = renderHome();
    await expectCore();
    await waitFor(() => expect(app.meReads()).toBeGreaterThan(1));
    expect(screen.queryByRole("heading", { name: "No pudimos abrir esta pantalla" })).not.toBeInTheDocument();
  });
  it("el rechazo de la consulta principal del núcleo sigue bloqueando el acceso", async () => {
    server.use(http.get("/api/organization/assistant", () => HttpResponse.json(state)));
    renderHome(403);
    await screen.findByRole("heading", { name: "No tenés permiso para ver esta página" });
    expect(screen.queryByRole("navigation", { name: "Áreas de la organización" })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Para resolver" })).not.toBeInTheDocument();
  });
});
