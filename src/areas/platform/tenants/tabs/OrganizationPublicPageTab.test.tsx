import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { server } from "@/test/mocks/server";
import { asPhone } from "@/test/utils/phone";
import { currentUserQueryKey } from "@/auth/useCurrentUser";
import { platformOperator } from "@/test/mocks/currentUsers";
import { tenantPublicPageQueryKey, tenantQueryKey } from "../api/tenants";
import { menuAction, openTab, problem, renderTabs, setupTabs, submitReason, testPublicPage, testOrganization } from "./testSupport";

beforeEach(async () => { vi.unstubAllGlobals(); await setupTabs(); });
describe("Página pública de Organización", () => {
  it("dirección, estado, fecha real y motivo vacío; Ver página oculta hasta E7; axe", async () => {
    const user = userEvent.setup(); const { container } = renderTabs(); await openTab(user, "Página pública");
    expect(await screen.findByText("delta.localtest.me:5174")).toBeVisible(); expect(screen.getByText("Publicada")).toBeVisible(); expect(screen.getByText("15/02/2026")).toBeVisible(); expect(await axe(container)).toHaveNoViolations();
    await menuAction(user, "delta.localtest.me:5174", "Despublicar"); expect(screen.queryByRole("menuitem", { name: "Ver página" })).not.toBeInTheDocument(); expect(screen.getByText(/Les avisamos a sus Dueños/)).toBeVisible();
  });
  it("Despublicar manda motivo, versión de página y clave", async () => {
    const user = userEvent.setup(); let body: unknown; let key: string | null = null;
    server.use(http.post("/api/platform/tenants/delta/public-site/unpublish", async ({ request }) => { body = await request.json(); key = request.headers.get("Idempotency-Key"); return HttpResponse.json({ version: 10 }); }));
    renderTabs(); await openTab(user, "Página pública"); await menuAction(user, "delta.localtest.me:5174", "Despublicar"); await submitReason(user, "Despublicar");
    expect(await screen.findByText("Despublicamos delta.localtest.me:5174.")).toBeVisible(); expect(body).toEqual({ version: 5, reason: "Revisión" }); expect(key).toBeTruthy(); expect(screen.queryByText("15/02/2026")).not.toBeInTheDocument();
  });
  it("bloqueada muestra motivo y Permitir publicar pide motivo", async () => {
    const user = userEvent.setup(); let body: unknown;
    server.use(http.get("/api/platform/tenants/delta/public-site", () => HttpResponse.json({ ...testPublicPage, isPublished: false, publishBlockedAtUtc: "2026-09-25T11:40:00Z", publishBlockedReason: "Contenido prohibido" })), http.post("/api/platform/tenants/delta/public-site/allow-publish", async ({ request }) => { body = await request.json(); return HttpResponse.json({ version: 10 }); }));
    renderTabs(); await openTab(user, "Página pública"); expect(await screen.findByText("Contenido prohibido")).toBeVisible(); await menuAction(user, "delta.localtest.me:5174", "Permitir publicar"); await submitReason(user, "Permitir publicar");
    expect(await screen.findByText("Grupo Delta ya puede publicar su página.")).toBeVisible(); expect(body).toEqual({ version: 5, reason: "Revisión" });
  });
  it.each(["before", "foreign"] as const)("Despublicar responde base para Permitir: %s GET", async (mode) => {
    const user = userEvent.setup(); let reads = 0; let body: unknown; const releases: (() => void)[] = [];
    server.use(http.get("/api/platform/tenants/delta/public-site", async () => { if (++reads > 1 && mode === "before") await new Promise<void>((resolve) => { releases.push(resolve); }); return HttpResponse.json({ ...testPublicPage, version: reads > 1 ? 80 : 5 }); }), http.post("/api/platform/tenants/delta/public-site/unpublish", () => HttpResponse.json({ version: 20 })), http.post("/api/platform/tenants/delta/public-site/allow-publish", async ({ request }) => { body = await request.json(); return HttpResponse.json({ version: 21 }); }));
    const page = renderTabs(); await openTab(user, "Página pública"); await menuAction(user, "delta.localtest.me:5174", "Despublicar"); await submitReason(user, "Despublicar"); await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument()); if (mode === "foreign") { await act(async () => { await page.queryClient.invalidateQueries({ queryKey: tenantPublicPageQueryKey("delta") }); }); await openTab(user, "Dueños"); await openTab(user, "Página pública"); }
    await menuAction(user, "delta.localtest.me:5174", "Permitir publicar"); await submitReason(user, "Permitir publicar"); expect(await screen.findByText("Grupo Delta ya puede publicar su página.")).toBeVisible(); expect(body).toEqual({ version: 20, reason: "Revisión" }); expect(screen.queryByRole("button", { name: "Acciones de delta.localtest.me:5174" })).not.toBeInTheDocument(); page.unmount(); releases.forEach((release) => release());
  });
  it.each([[80, false], [20, true]] as const)("motivo de GET Blocked versión %s sólo se muestra con base propia compatible", async (version, compatible) => {
    const user = userEvent.setup(); let saved = false; let body: unknown;
    server.use(http.get("/api/platform/tenants/delta/public-site", () => HttpResponse.json(saved ? { ...testPublicPage, version, isPublished: false, publishBlockedAtUtc: "2026-10-05T20:00:00Z", publishBlockedReason: "Motivo de la lectura" } : testPublicPage)),
      http.post("/api/platform/tenants/delta/public-site/unpublish", () => { saved = true; return HttpResponse.json({ version: 20 }); }),
      http.post("/api/platform/tenants/delta/public-site/allow-publish", async ({ request }) => { body = await request.json(); return HttpResponse.json({ version: 21 }); }));
    const page = renderTabs(); await openTab(user, "Página pública"); await menuAction(user, "delta.localtest.me:5174", "Despublicar"); await submitReason(user, "Despublicar");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(page.queryClient.getQueryData(tenantPublicPageQueryKey("delta"))).toMatchObject({ version, publishBlockedReason: "Motivo de la lectura" }));
    expect(Boolean(screen.queryByText("Motivo de la lectura"))).toBe(compatible);
    if (!compatible) expect(screen.getAllByRole("img", { name: "Sin dato" }).length).toBeGreaterThan(1);
    await menuAction(user, "delta.localtest.me:5174", "Permitir publicar"); await submitReason(user, "Permitir publicar");
    expect(await screen.findByText("Grupo Delta ya puede publicar su página.")).toBeVisible(); expect(body).toEqual({ version: 20, reason: "Revisión" });
  });
  it("Draft sin evidencia muestra vacíos y nunca ⋮ ni Ver página", async () => {
    server.use(http.get("/api/platform/tenants/delta/public-site", () => HttpResponse.json({ ...testPublicPage, isPublished: false, version: 0 }))); const user = userEvent.setup(); renderTabs(); await openTab(user, "Página pública"); expect(await screen.findByText("Borrador")).toBeVisible(); expect(screen.queryByText("15/02/2026")).not.toBeInTheDocument(); expect(screen.queryByRole("button", { name: "Acciones de delta.localtest.me:5174" })).not.toBeInTheDocument(); expect(screen.queryByText("Ver página")).not.toBeInTheDocument();
  });
  it("slug null no inventa dirección; fecha null usa vacío", async () => {
    server.use(http.get("/api/platform/tenants/delta/public-site", () => HttpResponse.json({ ...testPublicPage, slug: null, publishedAtUtc: null }))); const user = userEvent.setup(); renderTabs(); await openTab(user, "Página pública"); expect(await screen.findByText("Publicada")).toBeVisible(); expect(screen.queryByText("delta.localtest.me:5174")).not.toBeInTheDocument(); expect(screen.getAllByRole("img", { name: "Sin dato" }).length).toBeGreaterThan(1);
  });
  it("409 conserva motivo, franja y base hasta cerrar y releer", async () => {
    const user = userEvent.setup(); let reads = 0; server.use(http.get("/api/platform/tenants/delta/public-site", () => { reads++; return HttpResponse.json(testPublicPage); }), http.post("/api/platform/tenants/delta/public-site/unpublish", () => problem())); renderTabs(); await openTab(user, "Página pública"); await menuAction(user, "delta.localtest.me:5174", "Despublicar"); await submitReason(user, "Despublicar"); expect(await screen.findByText("Alguien cambió este dato.")).toBeVisible(); expect(screen.getByRole("textbox", { name: "Motivo" })).toHaveValue("Revisión"); await user.click(screen.getByRole("button", { name: "Cancelar" })); await waitFor(() => expect(reads).toBe(2));
  });
  it("BlockReasonRequired debajo de Motivo sin duplicar franja", async () => {
    const user = userEvent.setup(); server.use(http.post("/api/platform/tenants/delta/public-site/unpublish", () => problem("PublicSite.PublicPage.BlockReasonRequired", "El bloqueo de moderación necesita un motivo.", 400))); renderTabs(); await openTab(user, "Página pública"); await menuAction(user, "delta.localtest.me:5174", "Despublicar"); await submitReason(user, "Despublicar"); await waitFor(() => expect(screen.getByRole("textbox", { name: "Motivo" })).toHaveAccessibleDescription("El bloqueo de moderación necesita un motivo.")); expect(screen.getAllByText("El bloqueo de moderación necesita un motivo.")).toHaveLength(1);
  });
  it("red conserva clave, motivo y éxito del reintento", async () => {
    const user = userEvent.setup(); const keys: (string | null)[] = []; server.use(http.post("/api/platform/tenants/delta/public-site/unpublish", ({ request }) => { keys.push(request.headers.get("Idempotency-Key")); return keys.length === 1 ? HttpResponse.error() : HttpResponse.json({ version: 20 }); })); renderTabs(); await openTab(user, "Página pública"); await menuAction(user, "delta.localtest.me:5174", "Despublicar"); await submitReason(user, "Despublicar"); expect(screen.getByRole("textbox", { name: "Motivo" })).toHaveValue("Revisión"); fireEvent.click(await screen.findByRole("button", { name: "Reintentar" })); expect(await screen.findByText("Despublicamos delta.localtest.me:5174.")).toBeVisible(); expect(keys[0]).toBe(keys[1]); expect(keys).toHaveLength(2);
  });
  it("cancelar y reabrir renueva clave; el aviso viejo no envía ni cierra otro", async () => {
    const user = userEvent.setup(); const keys: (string | null)[] = []; server.use(http.post("/api/platform/tenants/delta/public-site/unpublish", ({ request }) => { keys.push(request.headers.get("Idempotency-Key")); return HttpResponse.error(); })); renderTabs(); await openTab(user, "Página pública"); await menuAction(user, "delta.localtest.me:5174", "Despublicar"); await submitReason(user, "Despublicar"); const retry = await screen.findByRole("button", { name: "Reintentar" }); await user.click(screen.getByRole("button", { name: "Cancelar" })); await menuAction(user, "delta.localtest.me:5174", "Despublicar"); await submitReason(user, "Despublicar", "Otra revisión"); await waitFor(() => expect(keys).toHaveLength(2)); await act(async () => { fireEvent.click(retry); }); expect(keys).toHaveLength(2); expect(keys[0]).not.toBe(keys[1]); expect(screen.getByRole("textbox", { name: "Motivo" })).toHaveValue("Otra revisión");
  });
  it("corregir motivo tras red renueva clave del cuerpo completo", async () => {
    const user = userEvent.setup(); const keys: (string | null)[] = []; server.use(http.post("/api/platform/tenants/delta/public-site/unpublish", ({ request }) => { keys.push(request.headers.get("Idempotency-Key")); return keys.length === 1 ? HttpResponse.error() : HttpResponse.json({ version: 20 }); })); renderTabs(); await openTab(user, "Página pública"); await menuAction(user, "delta.localtest.me:5174", "Despublicar"); await submitReason(user, "Despublicar"); await screen.findByRole("button", { name: "Reintentar" }); await user.clear(screen.getByRole("textbox", { name: "Motivo" })); await user.type(screen.getByRole("textbox", { name: "Motivo" }), "Otra revisión"); await user.click(screen.getByRole("button", { name: "Despublicar" })); await screen.findByText("Despublicamos delta.localtest.me:5174."); expect(keys).toHaveLength(2); expect(keys[0]).not.toBe(keys[1]);
  });
  it("navegar a ficha cacheada abandona formulario y respuesta vieja", async () => {
    const user = userEvent.setup(); let release: (() => void) | undefined;
    server.use(http.post("/api/platform/tenants/delta/public-site/unpublish", async () => { await new Promise<void>((resolve) => { release = resolve; }); return HttpResponse.json({ version: 20 }); }), http.get("/api/platform/tenants/omega", () => HttpResponse.json({ ...testOrganization, id: "omega", name: "Grupo Omega", version: 42 })), http.get("/api/platform/tenants/omega/features", () => HttpResponse.json([])), http.get("/api/platform/tenants/omega/history", () => HttpResponse.json({ items: [], hasMore: false })));
    const page = renderTabs(); await openTab(user, "Página pública"); page.queryClient.setQueryData(tenantQueryKey("omega"), { ...testOrganization, id: "omega", name: "Grupo Omega", version: 42 }); await menuAction(user, "delta.localtest.me:5174", "Despublicar"); await submitReason(user, "Despublicar"); await waitFor(() => expect(release).toBeDefined()); await act(async () => { await page.router.navigate("/plataforma/organizaciones/omega"); }); expect(await screen.findByRole("heading", { name: "Grupo Omega" })).toBeVisible(); expect(screen.queryByRole("dialog")).not.toBeInTheDocument(); await act(async () => { release?.(); }); expect(page.queryClient.getQueryData(tenantQueryKey("omega"))).toMatchObject({ version: 42 }); expect(screen.queryByText("Despublicamos delta.localtest.me:5174.")).not.toBeInTheDocument();
  });
  it("Closed nunca tiene ⋮", async () => {
    server.use(http.get("/api/platform/tenants/delta", () => HttpResponse.json({ ...testOrganization, status: "Closed" }))); const user = userEvent.setup(); renderTabs(); await openTab(user, "Página pública"); await screen.findByText("Publicada"); expect(screen.queryByRole("button", { name: /Acciones de/ })).not.toBeInTheDocument();
  });
  it("390 muestra página, estado y motivo en ListRow sin tabla; axe", async () => {
    asPhone(); server.use(http.get("/api/platform/tenants/delta/public-site", () => HttpResponse.json({ ...testPublicPage, isPublished: false, publishBlockedAtUtc: "2026-09-25T11:40:00Z", publishBlockedReason: "Contenido prohibido" }))); const user = userEvent.setup(); const { container } = renderTabs(); await openTab(user, "Página pública"); expect(await screen.findByText("Contenido prohibido")).toBeVisible(); expect(screen.queryByRole("table")).not.toBeInTheDocument(); expect(await axe(container)).toHaveNoViolations(); await menuAction(user, "delta.localtest.me:5174", "Permitir publicar"); expect(screen.getByRole("dialog")).toHaveTextContent("¿Permitir publicar delta.localtest.me:5174?");
  });
  it("en-US fecha y textos", async () => {
    const user = userEvent.setup(); const page = renderTabs(); await screen.findByRole("heading", { name: "Grupo Delta" }); await act(async () => { page.queryClient.setQueryData(currentUserQueryKey, { ...platformOperator, culture: "en-US" }); }); await openTab(user, "Public page"); expect(await screen.findByText("Published")).toBeVisible(); expect(screen.getByText("02/15/2026")).toBeVisible(); expect(screen.getByRole("columnheader", { name: "Published on" })).toBeVisible();
  });
  it("error de lectura con reintento", async () => {
    const user = userEvent.setup(); let reads = 0; server.use(http.get("/api/platform/tenants/delta/public-site", () => ++reads === 1 ? problem("Test.Unavailable", "No pudimos leer la página", 400) : HttpResponse.json(testPublicPage))); renderTabs(); await openTab(user, "Página pública"); expect(await screen.findByText("No pudimos leer la página")).toBeVisible(); await user.click(screen.getByRole("button", { name: "Reintentar" })); expect(await screen.findByText("delta.localtest.me:5174")).toBeVisible();
  });
});
