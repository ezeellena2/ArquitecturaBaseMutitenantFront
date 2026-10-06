import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { server } from "@/test/mocks/server";
import { asPhone } from "@/test/utils/phone";
import { platformOperator } from "@/test/mocks/currentUsers";
import { currentUserQueryKey } from "@/auth/useCurrentUser";
import { tenantFeaturesQueryKey } from "../api/tenants";
import { menuAction, openTab, problem, renderTabs, setupTabs, submitReason, TestFeatures, testOrganization } from "./testSupport";

beforeEach(async () => { vi.unstubAllGlobals(); await setupTabs(); });
describe("Módulos de Organización", () => {
  it("catálogo de prueba muestra estado, origen y acciones; axe", async () => {
    const user = userEvent.setup(); const { container } = renderTabs(); await openTab(user, "Módulos");
    expect(await screen.findByText("WhatsApp")).toBeVisible(); expect(screen.getByText("Prendido")).toBeVisible(); expect(screen.getByText("Plan")).toBeVisible();
    expect(screen.getByText("Prueba hasta 27/10/2026")).toBeVisible(); expect(screen.getByText("Prueba")).toBeVisible();
    for (const header of ["Módulo", "Estado", "Origen"]) expect(screen.getByRole("columnheader", { name: header })).toBeVisible();
    expect(await axe(container)).toHaveNoViolations();
  });
  it("Prender manda fuente Manual, sin fin, motivo y versión 0", async () => {
    const user = userEvent.setup(); let body: unknown; let key: string | null = null;
    server.use(http.put("/api/platform/tenants/delta/features/:feature", async ({ request }) => { body = await request.json(); key = request.headers.get("Idempotency-Key"); return HttpResponse.json({ version: 9 }); }));
    renderTabs(); await openTab(user, "Módulos"); await menuAction(user, "Módulo B", "Prender"); await submitReason(user, "Prender");
    expect(await screen.findByText("Prendimos Módulo B.")).toBeVisible(); expect(body).toEqual({ enabled: true, source: "Manual", expiresOn: null, reason: "Revisión", version: 0 }); expect(key).toBeNull();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
  it("Extender conserva Trial y manda Hasta civil con motivo", async () => {
    const user = userEvent.setup(); let body: unknown;
    server.use(http.put("/api/platform/tenants/delta/features/:feature", async ({ request }) => { body = await request.json(); return HttpResponse.json({ version: 9 }); }));
    renderTabs(); await openTab(user, "Módulos"); await menuAction(user, "Módulo B", "Extender prueba");
    const until = screen.getByRole("textbox", { name: "Hasta" }); await user.clear(until); await user.type(until, "30/10/2026"); await submitReason(user, "Extender prueba");
    expect(await screen.findByText("Extendimos la prueba de Módulo B.")).toBeVisible(); expect(body).toEqual({ enabled: true, source: "Trial", expiresOn: "2026-10-30", reason: "Revisión", version: 0 });
  });
  it("Apagar manda Manual sin fin y exige motivo", async () => {
    const user = userEvent.setup(); let body: unknown;
    server.use(http.put("/api/platform/tenants/delta/features/WhatsApp", async ({ request }) => { body = await request.json(); return HttpResponse.json({ version: 10 }); }));
    renderTabs(); await openTab(user, "Módulos"); await menuAction(user, "WhatsApp", "Apagar"); const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("button", { name: "Apagar" })).toHaveAttribute("data-variant", "destructive");
    await user.click(within(dialog).getByRole("button", { name: "Apagar" })); expect(await screen.findByText("Escribí el motivo.")).toBeVisible(); expect(body).toBeUndefined();
    await submitReason(user, "Apagar"); expect(await screen.findByText("Apagamos WhatsApp.")).toBeVisible(); expect(body).toEqual({ enabled: false, source: "Manual", expiresOn: null, reason: "Revisión", version: 3 });
  });
  it.each(["before", "foreign"] as const)("la próxima acción conserva versión propia y estado: %s GET", async (mode) => {
    const user = userEvent.setup(); const bodies: unknown[] = []; let reads = 0; const releases: (() => void)[] = [];
    server.use(http.get("/api/platform/tenants/delta/features", async () => {
      if (++reads > 1 && mode === "before") await new Promise<void>((resolve) => { releases.push(resolve); });
      return HttpResponse.json(reads > 1 ? TestFeatures.map((row) => ({ ...row, version: 88 })) : TestFeatures);
    }), http.put("/api/platform/tenants/delta/features/:feature", async ({ request }) => { bodies.push(await request.json()); return HttpResponse.json({ version: bodies.length === 1 ? 20 : 21 }); }));
    const page = renderTabs(); await openTab(user, "Módulos"); await menuAction(user, "Módulo B", "Prender"); await submitReason(user, "Prender"); await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    if (mode === "foreign") { await act(async () => { await page.queryClient.invalidateQueries({ queryKey: tenantFeaturesQueryKey("delta") }); }); await openTab(user, "Dueños"); await openTab(user, "Módulos"); }
    await menuAction(user, "Módulo B", "Apagar"); await submitReason(user, "Apagar"); expect(await screen.findByText("Apagamos Módulo B.")).toBeVisible(); expect(bodies[1]).toEqual({ enabled: false, source: "Manual", expiresOn: null, reason: "Revisión", version: 20 }); page.unmount(); releases.forEach((release) => release());
  });
  it("Extender conserva versión respondida para otro Extender y no pisa otro módulo", async () => {
    const user = userEvent.setup(); const bodies: unknown[] = [];
    server.use(http.put("/api/platform/tenants/delta/features/:feature", async ({ request }) => { bodies.push(await request.json()); return HttpResponse.json({ version: 20 + bodies.length }); }));
    renderTabs(); await openTab(user, "Módulos"); await menuAction(user, "Módulo B", "Extender prueba"); await submitReason(user, "Extender prueba"); await screen.findByText("Extendimos la prueba de Módulo B."); await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await menuAction(user, "Módulo B", "Extender prueba"); await submitReason(user, "Extender prueba"); await waitFor(() => expect(bodies).toHaveLength(2)); expect(bodies[1]).toMatchObject({ version: 21, expiresOn: "2026-10-27" }); await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await menuAction(user, "WhatsApp", "Apagar"); await submitReason(user, "Apagar"); await waitFor(() => expect(bodies).toHaveLength(3)); expect(bodies[2]).toMatchObject({ version: 3 });
  });
  it("sin módulos oculta la pestaña, catálogo sólo de prueba", async () => {
    server.use(http.get("/api/platform/tenants/delta/features", () => HttpResponse.json([]))); renderTabs(); await screen.findByRole("heading", { name: "Grupo Delta" });
    await waitFor(() => expect(screen.queryByRole("tab", { name: /^Módulos/ })).not.toBeInTheDocument());
  });
  it("con sólo read muestra estados sin acciones ni pestañas privadas ni GET privados", async () => {
    const user = userEvent.setup(); let privateReads = 0;
    server.use(http.get("/api/me", () => HttpResponse.json({ ...platformOperator, effectivePermissions: { ...platformOperator.effectivePermissions, platform: ["platform.tenants.read"] } })), http.get("/api/platform/tenants/delta/domains", () => { privateReads++; return HttpResponse.json([]); }), http.get("/api/platform/tenants/delta/public-site", () => { privateReads++; return HttpResponse.json({}); }));
    const page = renderTabs(); await openTab(user, "Módulos"); await act(async () => { page.queryClient.setQueryData(currentUserQueryKey, { ...platformOperator, effectivePermissions: { ...platformOperator.effectivePermissions, platform: ["platform.tenants.read"] } }); });
    expect(await screen.findByText("WhatsApp")).toBeVisible(); expect(screen.queryByRole("button", { name: /Acciones de WhatsApp/ })).not.toBeInTheDocument(); expect(screen.queryByRole("tab", { name: /Dominio verificado|Página pública/ })).not.toBeInTheDocument(); expect(privateReads).toBe(0);
  });
  it("organización Closed no tiene ⋮", async () => {
    server.use(http.get("/api/platform/tenants/delta", () => HttpResponse.json({ ...testOrganization, status: "Closed" }))); const user = userEvent.setup(); renderTabs(); await openTab(user, "Módulos"); await screen.findByText("WhatsApp"); expect(screen.queryByRole("button", { name: /Acciones de/ })).not.toBeInTheDocument();
  });
  it("390 muestra módulo, estado y origen en ListRow sin tabla; axe", async () => {
    asPhone(); const user = userEvent.setup(); const { container } = renderTabs(); await openTab(user, "Módulos"); expect(await screen.findByText("WhatsApp")).toBeVisible(); expect(screen.getByText("Plan")).toBeVisible(); expect(screen.getByText("Prueba")).toBeVisible(); expect(screen.queryByRole("table")).not.toBeInTheDocument();
    await menuAction(user, "Módulo B", "Extender prueba"); expect(screen.getByRole("textbox", { name: "Hasta" })).toBeRequired(); expect(await axe(container)).toHaveNoViolations();
  });
  it("en-US usa fecha civil del formato y textos traducidos", async () => {
    const user = userEvent.setup(); const page = renderTabs(); await screen.findByRole("heading", { name: "Grupo Delta" }); await act(async () => { page.queryClient.setQueryData(currentUserQueryKey, { ...platformOperator, culture: "en-US" }); }); await openTab(user, "Modules"); expect(await screen.findByText("Trial until 10/27/2026")).toBeVisible(); expect(screen.getByText("On")).toBeVisible(); expect(screen.getByText("Trial")).toBeVisible();
  });
  it("Until requerido, fecha inválida y ExpiryRequired del back debajo de Hasta", async () => {
    const user = userEvent.setup(); server.use(http.put("/api/platform/tenants/delta/features/:feature", () => problem("Features.Module.ExpiryRequired", "Escribí cuándo termina la prueba.", 400)));
    renderTabs(); await openTab(user, "Módulos"); await menuAction(user, "Módulo B", "Extender prueba"); const date = screen.getByRole("textbox", { name: "Hasta" }); fireEvent.change(date, { target: { value: "31/02/2026" } }); fireEvent.blur(date); await submitReason(user, "Extender prueba");
    expect(date).toHaveAccessibleDescription(expect.stringContaining("Escribí la fecha como dd/mm/aaaa.")); fireEvent.change(date, { target: { value: "30/10/2026" } }); await user.click(screen.getByRole("button", { name: "Extender prueba" }));
    await waitFor(() => expect(date).toHaveAccessibleDescription("Escribí cuándo termina la prueba.")); expect(screen.getByRole("textbox", { name: "Motivo" })).toHaveValue("Revisión");
  });
  it("409 conserva motivo/franja, cerrar descarta base y relee", async () => {
    const user = userEvent.setup(); const bodies: unknown[] = []; let reads = 0;
    server.use(http.get("/api/platform/tenants/delta/features", () => { reads++; return HttpResponse.json(TestFeatures.map((row) => ({ ...row, version: reads > 2 ? 40 : row.version }))); }), http.put("/api/platform/tenants/delta/features/:feature", async ({ request }) => { bodies.push(await request.json()); return bodies.length === 1 ? HttpResponse.json({ version: 20 }) : bodies.length === 2 ? problem() : HttpResponse.json({ version: 41 }); }));
    renderTabs(); await openTab(user, "Módulos"); await menuAction(user, "WhatsApp", "Apagar"); await submitReason(user, "Apagar"); await screen.findByText("Apagamos WhatsApp."); await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await menuAction(user, "WhatsApp", "Prender"); await submitReason(user, "Prender"); expect(await screen.findByText("Alguien cambió este dato.")).toBeVisible(); expect(screen.getByRole("textbox", { name: "Motivo" })).toHaveValue("Revisión"); await user.click(screen.getByRole("button", { name: "Cancelar" })); await waitFor(() => expect(reads).toBeGreaterThan(2));
    await menuAction(user, "WhatsApp", "Apagar"); await submitReason(user, "Apagar"); await waitFor(() => expect(bodies).toHaveLength(3)); expect(bodies[2]).toMatchObject({ version: 40 });
  });
  it("carga y error con reintento usan DataTable", async () => {
    const user = userEvent.setup(); let reads = 0;
    server.use(http.get("/api/platform/tenants/delta/features", () => ++reads === 1 ? problem("Test.Unavailable", "Falló el catálogo", 400) : HttpResponse.json(TestFeatures)));
    renderTabs(); await openTab(user, "Módulos"); expect(await screen.findByText("Falló el catálogo")).toBeVisible(); await user.click(screen.getByRole("button", { name: "Reintentar" })); expect(await screen.findByText("WhatsApp")).toBeVisible();
  });
  it("cancelar PUT en vuelo abandona éxito tardío y conserva siguiente formulario", async () => {
    const user = userEvent.setup(); let release: (() => void) | undefined;
    server.use(http.put("/api/platform/tenants/delta/features/WhatsApp", async () => { await new Promise<void>((resolve) => { release = resolve; }); return HttpResponse.json({ version: 20 }); }));
    const page = renderTabs(); await openTab(user, "Módulos"); await menuAction(user, "WhatsApp", "Apagar"); await submitReason(user, "Apagar"); await waitFor(() => expect(release).toBeDefined()); await user.click(screen.getByRole("button", { name: "Cancelar" })); await menuAction(user, "WhatsApp", "Apagar"); await act(async () => { release?.(); });
    expect(screen.getByRole("dialog")).toBeVisible(); expect(screen.queryByText("Apagamos WhatsApp.")).not.toBeInTheDocument(); expect(page.queryClient.getQueryData(tenantFeaturesQueryKey("delta"))).toEqual(TestFeatures);
  });
  it("un retry PUT de formulario cancelado no vuelve a enviar", async () => {
    const user = userEvent.setup(); let calls = 0; server.use(http.put("/api/platform/tenants/delta/features/WhatsApp", () => { calls++; return HttpResponse.error(); })); renderTabs(); await openTab(user, "Módulos"); await menuAction(user, "WhatsApp", "Apagar"); await submitReason(user, "Apagar"); const retry = await screen.findByRole("button", { name: "Reintentar" }); await user.click(screen.getByRole("button", { name: "Cancelar" })); await menuAction(user, "WhatsApp", "Apagar"); await act(async () => { fireEvent.click(retry); }); expect(calls).toBe(1); expect(screen.getByRole("dialog")).toBeVisible();
  });
  it.each([["features", "Módulos"], ["domains", "Dominio verificado"], ["public-site", "Página pública"]])("%s muestra carga común antes de la respuesta", async (path, tab) => {
    const user = userEvent.setup(); let release: (() => void) | undefined;
    server.use(http.get(`/api/platform/tenants/delta/${path}`, async () => { await new Promise<void>((resolve) => { release = resolve; }); return HttpResponse.json(path === "public-site" ? { slug: "delta", name: "Grupo Delta", version: 0, isPublished: false } : path === "features" ? TestFeatures : []); }));
    const page = renderTabs(); await openTab(user, tab); expect(await screen.findByRole("status")).toHaveTextContent("Cargando…"); await act(async () => { release?.(); }); await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument()); page.unmount();
  });
});
