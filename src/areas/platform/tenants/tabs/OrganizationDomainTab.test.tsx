import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { server } from "@/test/mocks/server";
import { asPhone } from "@/test/utils/phone";
import { currentUserQueryKey } from "@/auth/useCurrentUser";
import { platformOperator } from "@/test/mocks/currentUsers";
import { tenantDomainsQueryKey } from "../api/tenants";
import { menuAction, openTab, problem, renderTabs, setupTabs, submitReason, testDomain, testOrganization } from "./testSupport";

beforeEach(async () => { vi.unstubAllGlobals(); await setupTabs(); });
describe("Dominio verificado de Organización", () => {
  it("pendiente con TXT; Verificar directa versionada e idempotente; axe", async () => {
    const user = userEvent.setup(); let body: unknown; let key: string | null = null;
    server.use(http.post("/api/platform/tenants/delta/domains/delta.ejemplo.com/verify", async ({ request }) => { body = await request.json(); key = request.headers.get("Idempotency-Key"); return HttpResponse.json({ version: 12 }); }));
    const { container } = renderTabs(); await openTab(user, "Dominio verificado"); expect(await screen.findByText("ab-verificacion=7f3c9a2e41b8d605")).toBeVisible(); expect(screen.getByText("Pendiente")).toBeVisible(); expect(await axe(container)).toHaveNoViolations();
    await menuAction(user, "delta.ejemplo.com", "Verificar"); expect(await screen.findByText("Verificamos delta.ejemplo.com.")).toBeVisible(); expect(body).toEqual({ version: 4, reason: "Verificar el dominio" }); expect(key).toBeTruthy(); expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("Quitar pide motivo y manda DELETE con versión sin clave", async () => {
    const user = userEvent.setup(); let body: unknown; let key: string | null = null;
    server.use(http.delete("/api/platform/tenants/delta/domains/delta.ejemplo.com", async ({ request }) => { body = await request.json(); key = request.headers.get("Idempotency-Key"); return new HttpResponse(null, { status: 204 }); }));
    renderTabs(); await openTab(user, "Dominio verificado"); await menuAction(user, "delta.ejemplo.com", "Quitar"); await submitReason(user, "Quitar");
    expect(await screen.findByText("Quitamos delta.ejemplo.com.")).toBeVisible(); expect(body).toEqual({ version: 4, reason: "Revisión" }); expect(key).toBeNull(); expect(await screen.findByText("Sin dominio de correo")).toBeVisible();
  });
  it("TxtNotFound se muestra en aviso rojo", async () => {
    const user = userEvent.setup(); server.use(http.post("/api/platform/tenants/delta/domains/delta.ejemplo.com/verify", () => problem("Settings.TenantDomain.TxtNotFound", "No encontramos el registro TXT de verificación en el DNS.")));
    renderTabs(); await openTab(user, "Dominio verificado"); await menuAction(user, "delta.ejemplo.com", "Verificar");
    expect(await screen.findByText("No encontramos el registro TXT de verificación en el DNS.")).toBeVisible(); expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("lecturas privadas recién al abrir pestaña, sin conteos anticipados", async () => {
    const user = userEvent.setup(); let domains = 0; let pages = 0;
    server.use(http.get("/api/platform/tenants/delta/domains", () => { domains++; return HttpResponse.json([testDomain]); }), http.get("/api/platform/tenants/delta/public-site", () => { pages++; return HttpResponse.json({ slug: "delta", name: "Grupo Delta", version: 0, isPublished: false }); }));
    renderTabs(); await screen.findByRole("heading", { name: "Grupo Delta" }); expect(domains).toBe(0); expect(pages).toBe(0); expect(screen.getByRole("tab", { name: "Dominio verificado" })).toBeVisible(); expect(screen.getByRole("tab", { name: "Página pública" })).toBeVisible();
    await openTab(user, "Dueños"); expect(domains).toBe(0); expect(pages).toBe(0); await openTab(user, "Dominio verificado"); await screen.findByText(testDomain.domain); expect(domains).toBe(1); expect(pages).toBe(0); expect(screen.getByRole("tab", { name: "Dominio verificado" })).toHaveTextContent(/^Dominio verificado$/); await openTab(user, "Página pública"); await screen.findByText("delta.localtest.me:5174"); expect(pages).toBe(1); expect(screen.getByRole("tab", { name: "Página pública" })).toHaveTextContent(/^Página pública$/);
  });
  it.each(["before", "foreign"] as const)("Verificar responde base para Quitar: %s GET", async (mode) => {
    const user = userEvent.setup(); let reads = 0; let body: unknown; const releases: (() => void)[] = [];
    server.use(http.get("/api/platform/tenants/delta/domains", async () => { if (++reads > 1 && mode === "before") await new Promise<void>((resolve) => { releases.push(resolve); }); return HttpResponse.json([{ ...testDomain, version: reads > 1 ? 80 : 4 }]); }), http.post("/api/platform/tenants/delta/domains/delta.ejemplo.com/verify", () => HttpResponse.json({ version: 20 })), http.delete("/api/platform/tenants/delta/domains/delta.ejemplo.com", async ({ request }) => { body = await request.json(); return new HttpResponse(null, { status: 204 }); }));
    const page = renderTabs(); await openTab(user, "Dominio verificado"); await menuAction(user, testDomain.domain, "Verificar"); await screen.findByText("Verificamos delta.ejemplo.com."); if (mode === "foreign") { await act(async () => { await page.queryClient.invalidateQueries({ queryKey: tenantDomainsQueryKey("delta") }); }); await openTab(user, "Dueños"); await openTab(user, "Dominio verificado"); }
    await menuAction(user, testDomain.domain, "Quitar"); await submitReason(user, "Quitar"); await screen.findByText("Quitamos delta.ejemplo.com."); expect(body).toEqual({ version: 20, reason: "Revisión" }); page.unmount(); releases.forEach((release) => release());
  });
  it("Verified no muestra TXT ni Verificar; sólo Quitar", async () => {
    server.use(http.get("/api/platform/tenants/delta/domains", () => HttpResponse.json([{ ...testDomain, status: "Verified", txtRecordName: null, txtRecordValue: null }]))); const user = userEvent.setup(); renderTabs(); await openTab(user, "Dominio verificado"); await screen.findByText("Verificado"); expect(screen.queryByText(testDomain.txtRecordValue!)).not.toBeInTheDocument(); await menuAction(user, testDomain.domain, "Quitar"); expect(screen.getByRole("dialog")).toHaveTextContent("Deja de contar como dominio de correo de Grupo Delta.");
  });
  it("sin dominio, carga y error con reintento", async () => {
    const user = userEvent.setup(); let reads = 0; server.use(http.get("/api/platform/tenants/delta/domains", () => ++reads === 1 ? problem("Test.Unavailable", "No pudimos leer dominios", 400) : HttpResponse.json([])));
    renderTabs(); await openTab(user, "Dominio verificado"); expect(await screen.findByText("No pudimos leer dominios")).toBeVisible(); await user.click(screen.getByRole("button", { name: "Reintentar" })); expect(await screen.findByText("Sin dominio de correo")).toBeVisible(); expect(screen.getByRole("tab", { name: "Dominio verificado" })).toHaveTextContent(/^Dominio verificado$/);
  });
  it.each(["Settings.TenantDomain.AlreadyVerified", "General.ConcurrencyConflict"])("Verificar %s avisa rojo y relee estado", async (code) => {
    const user = userEvent.setup(); let reads = 0; server.use(http.get("/api/platform/tenants/delta/domains", () => { reads++; return HttpResponse.json([testDomain]); }), http.post("/api/platform/tenants/delta/domains/delta.ejemplo.com/verify", () => problem(code, "El dominio cambió")));
    renderTabs(); await openTab(user, "Dominio verificado"); await menuAction(user, testDomain.domain, "Verificar"); expect(await screen.findByText("El dominio cambió")).toBeVisible(); await waitFor(() => expect(reads).toBeGreaterThan(1));
  });
  it("DnsUnavailable pasa por MutationCache una vez, sin franja", async () => {
    const user = userEvent.setup(); server.use(http.post("/api/platform/tenants/delta/domains/delta.ejemplo.com/verify", () => problem("Settings.TenantDomain.DnsUnavailable", "DNS no disponible", 503)));
    renderTabs(); await openTab(user, "Dominio verificado"); await menuAction(user, testDomain.domain, "Verificar"); expect(await screen.findByText("Algo salió mal. Probá de nuevo en un rato.")).toBeVisible(); expect(screen.getAllByText("Algo salió mal. Probá de nuevo en un rato.")).toHaveLength(1); expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("red Verificar conserva clave y éxito del reintento", async () => {
    const user = userEvent.setup(); const keys: (string | null)[] = []; server.use(http.post("/api/platform/tenants/delta/domains/delta.ejemplo.com/verify", ({ request }) => { keys.push(request.headers.get("Idempotency-Key")); return keys.length === 1 ? HttpResponse.error() : HttpResponse.json({ version: 20 }); }));
    renderTabs(); await openTab(user, "Dominio verificado"); await menuAction(user, testDomain.domain, "Verificar"); await user.click(await screen.findByRole("button", { name: "Reintentar" })); expect(await screen.findByText("Verificamos delta.ejemplo.com.")).toBeVisible(); expect(keys).toHaveLength(2); expect(keys[0]).toBe(keys[1]);
  });
  it("Retry A después de verificar B conserva clave, callbacks y base propia por dominio", async () => {
    const user = userEvent.setup(); const otherDomain = { ...testDomain, id: "domain-2", domain: "otro.ejemplo.com", txtRecordName: "otro.ejemplo.com", version: 8 };
    const requests: { domain: string; key: string | null; body: unknown }[] = []; let reads = 0; let removedBody: unknown;
    server.use(
      http.get("/api/platform/tenants/delta/domains", () => { reads++; return HttpResponse.json([testDomain, otherDomain].map((domain) => ({ ...domain, version: reads > 1 ? 80 : domain.version }))); }),
      http.post("/api/platform/tenants/delta/domains/:domain/verify", async ({ request, params }) => {
        const domain = String(params.domain); requests.push({ domain, key: request.headers.get("Idempotency-Key"), body: await request.json() });
        return domain === testDomain.domain && requests.filter((item) => item.domain === domain).length === 1 ? HttpResponse.error() : HttpResponse.json({ version: domain === testDomain.domain ? 200 : 100 });
      }),
      http.delete("/api/platform/tenants/delta/domains/delta.ejemplo.com", async ({ request }) => { removedBody = await request.json(); return new HttpResponse(null, { status: 204 }); }),
    );
    const page = renderTabs(); const cacheUpdates: unknown[] = [];
    const unsubscribe = page.queryClient.getQueryCache().subscribe((event) => { if (event.type === "updated") cacheUpdates.push(event.query.state.data); });
    await openTab(user, "Dominio verificado"); await menuAction(user, testDomain.domain, "Verificar"); const retryA = await screen.findByRole("button", { name: "Reintentar" });
    await menuAction(user, otherDomain.domain, "Verificar"); expect(await screen.findByText("Verificamos otro.ejemplo.com.")).toBeVisible(); await waitFor(() => expect(reads).toBeGreaterThan(1));
    await user.click(retryA); await waitFor(() => expect(requests).toHaveLength(3));
    expect(requests[0].key).toBeTruthy(); expect(requests[1].key).not.toBe(requests[0].key); expect(requests[2]).toEqual(requests[0]);
    expect(await screen.findByText("Verificamos delta.ejemplo.com.")).toBeVisible(); expect(screen.getAllByText("Verificado")).toHaveLength(2);
    expect(cacheUpdates).toContainEqual(expect.arrayContaining([expect.objectContaining({ domain: testDomain.domain, status: "Verified", version: 200, txtRecordName: null, txtRecordValue: null })]));
    await act(async () => { await page.queryClient.invalidateQueries({ queryKey: tenantDomainsQueryKey("delta") }); });
    await menuAction(user, testDomain.domain, "Quitar"); await submitReason(user, "Quitar"); await screen.findByText("Quitamos delta.ejemplo.com.");
    expect(removedBody).toEqual({ version: 200, reason: "Revisión" }); unsubscribe();
  });
  it("Retry del primer aviso A conserva sus efectos tras otro envío fallido del mismo dominio", async () => {
    const user = userEvent.setup(); const keys: (string | null)[] = []; let removedBody: unknown;
    server.use(
      http.post("/api/platform/tenants/delta/domains/delta.ejemplo.com/verify", ({ request }) => { keys.push(request.headers.get("Idempotency-Key")); return keys.length < 3 ? HttpResponse.error() : HttpResponse.json({ version: 200 }); }),
      http.delete("/api/platform/tenants/delta/domains/delta.ejemplo.com", async ({ request }) => { removedBody = await request.json(); return new HttpResponse(null, { status: 204 }); }),
    );
    renderTabs(); await openTab(user, "Dominio verificado"); await menuAction(user, testDomain.domain, "Verificar"); const retryA = await screen.findByRole("button", { name: "Reintentar" });
    await menuAction(user, testDomain.domain, "Verificar"); await waitFor(() => expect(screen.getAllByRole("button", { name: "Reintentar" })).toHaveLength(2)); await user.click(retryA);
    expect(await screen.findByText("Verificamos delta.ejemplo.com.")).toBeVisible(); expect(keys).toHaveLength(3); expect(keys[0]).toBeTruthy(); expect(keys).toEqual([keys[0], keys[0], keys[0]]);
    await menuAction(user, testDomain.domain, "Quitar"); await submitReason(user, "Quitar"); await screen.findByText("Quitamos delta.ejemplo.com."); expect(removedBody).toEqual({ version: 200, reason: "Revisión" });
  });
  it.each([false, true])("Request.InProgress reintenta en silencio y conserva gate/clave (observer retirado=%s)", async (detached) => {
    const user = userEvent.setup(); const keys: (string | null)[] = [];
    const firstAttempt = detached ? 3 : 1;
    server.use(http.post("/api/platform/tenants/delta/domains/delta.ejemplo.com/verify", ({ request }) => { keys.push(request.headers.get("Idempotency-Key")); return keys.length < firstAttempt ? HttpResponse.error() : keys.length === firstAttempt ? problem("Request.InProgress", "Verificación en curso.") : HttpResponse.json({ version: 200 }); }));
    renderTabs(); await openTab(user, "Dominio verificado"); let start: HTMLElement;
    if (detached) {
      await menuAction(user, testDomain.domain, "Verificar"); start = await screen.findByRole("button", { name: "Reintentar" }); await menuAction(user, testDomain.domain, "Verificar"); await waitFor(() => expect(screen.getAllByRole("button", { name: "Reintentar" })).toHaveLength(2));
    } else {
      const trigger = await screen.findByRole("button", { name: `Acciones de ${testDomain.domain}` }); trigger.focus(); await user.keyboard("{Enter}"); start = screen.getByRole("menuitem", { name: "Verificar" });
    }
    vi.useFakeTimers();
    try {
      await act(async () => { fireEvent.click(start); await vi.advanceTimersByTimeAsync(0); });
      expect(keys).toHaveLength(firstAttempt); expect(screen.queryByText("Verificación en curso.")).not.toBeInTheDocument(); expect(screen.queryByRole("button", { name: `Acciones de ${testDomain.domain}` })).not.toBeInTheDocument();
      await act(async () => { await vi.advanceTimersByTimeAsync(1_000); await vi.advanceTimersByTimeAsync(50); });
      expect(keys).toHaveLength(firstAttempt + 1); expect(keys[0]).toBeTruthy(); expect(new Set(keys).size).toBe(1); expect(screen.getByText("Verificamos delta.ejemplo.com.")).toBeVisible(); expect(screen.queryByText("Verificación en curso.")).not.toBeInTheDocument();
    } finally { vi.useRealTimers(); }
  });
  it.each([false, true])("agotamiento Request.InProgress avisa una vez tras 31 pedidos/30 esperas (observer retirado=%s)", async (detached) => {
    const user = userEvent.setup(); const keys: (string | null)[] = []; let pollingRequests = 0; let reads = 0;
    const networkFailures = detached ? 2 : 0;
    server.use(
      http.get("/api/platform/tenants/delta/domains", () => { reads++; return HttpResponse.json([testDomain]); }),
      http.post("/api/platform/tenants/delta/domains/delta.ejemplo.com/verify", ({ request }) => { keys.push(request.headers.get("Idempotency-Key")); if (keys.length <= networkFailures) return HttpResponse.error(); pollingRequests++; return problem("Request.InProgress", "La verificación sigue en curso."); }),
    );
    const page = renderTabs(); await openTab(user, "Dominio verificado"); let start: HTMLElement;
    if (detached) {
      await menuAction(user, testDomain.domain, "Verificar"); start = await screen.findByRole("button", { name: "Reintentar" }); await menuAction(user, testDomain.domain, "Verificar"); await waitFor(() => expect(screen.getAllByRole("button", { name: "Reintentar" })).toHaveLength(2));
    } else {
      const trigger = await screen.findByRole("button", { name: `Acciones de ${testDomain.domain}` }); trigger.focus(); await user.keyboard("{Enter}"); start = screen.getByRole("menuitem", { name: "Verificar" });
    }
    vi.useFakeTimers();
    try {
      await act(async () => { fireEvent.click(start); await vi.advanceTimersByTimeAsync(0); }); expect(pollingRequests).toBe(1);
      await act(async () => { await vi.advanceTimersByTimeAsync(29_000); });
      expect(pollingRequests).toBe(30); expect(screen.queryByText("La verificación sigue en curso.")).not.toBeInTheDocument(); expect(screen.queryByRole("button", { name: `Acciones de ${testDomain.domain}` })).not.toBeInTheDocument();
      await act(async () => { await vi.advanceTimersByTimeAsync(1_000); await vi.advanceTimersByTimeAsync(50); });
      expect(pollingRequests).toBe(31); expect(keys).toHaveLength(networkFailures + 31); expect(keys[0]).toBeTruthy(); expect(new Set(keys).size).toBe(1);
      expect(screen.getAllByText("La verificación sigue en curso.")).toHaveLength(1); expect(screen.getByRole("button", { name: `Acciones de ${testDomain.domain}` })).toBeVisible(); expect(reads).toBe(1); expect(page.queryClient.getQueryData(tenantDomainsQueryKey("delta"))).toEqual([testDomain]);
    } finally { vi.useRealTimers(); }
  });
  it.each(["Settings.TenantDomain.TxtNotFound", "General.ConcurrencyConflict"] as const)("Retry sin observer avisa rechazo terminal %s y relee sólo si hay conflicto", async (code) => {
    const user = userEvent.setup(); let requests = 0; let reads = 0;
    server.use(
      http.get("/api/platform/tenants/delta/domains", () => { reads++; return HttpResponse.json([testDomain]); }),
      http.post("/api/platform/tenants/delta/domains/delta.ejemplo.com/verify", () => ++requests < 3 ? HttpResponse.error() : problem(code, "La verificación fue rechazada.")),
    );
    renderTabs(); await openTab(user, "Dominio verificado"); await menuAction(user, testDomain.domain, "Verificar"); const retry = await screen.findByRole("button", { name: "Reintentar" });
    await menuAction(user, testDomain.domain, "Verificar"); await waitFor(() => expect(screen.getAllByRole("button", { name: "Reintentar" })).toHaveLength(2)); await user.click(retry);
    expect(await screen.findByText("La verificación fue rechazada.")).toBeVisible(); expect(screen.getAllByText("La verificación fue rechazada.")).toHaveLength(1); expect(requests).toBe(3);
    if (code === "General.ConcurrencyConflict") await waitFor(() => expect(reads).toBe(2)); else expect(reads).toBe(1);
  });
  it("Quitar 409 conserva motivo y franja hasta cerrar; relee", async () => {
    const user = userEvent.setup(); let reads = 0; server.use(http.get("/api/platform/tenants/delta/domains", () => { reads++; return HttpResponse.json([testDomain]); }), http.delete("/api/platform/tenants/delta/domains/delta.ejemplo.com", () => problem()));
    renderTabs(); await openTab(user, "Dominio verificado"); await menuAction(user, testDomain.domain, "Quitar"); await submitReason(user, "Quitar"); expect(await screen.findByText("Alguien cambió este dato.")).toBeVisible(); expect(screen.getByRole("textbox", { name: "Motivo" })).toHaveValue("Revisión"); await user.click(screen.getByRole("button", { name: "Cancelar" })); await waitFor(() => expect(reads).toBe(2));
  });
  it("Closed nunca tiene ⋮", async () => {
    server.use(http.get("/api/platform/tenants/delta", () => HttpResponse.json({ ...testOrganization, status: "Closed" }))); const user = userEvent.setup(); renderTabs(); await openTab(user, "Dominio verificado"); await screen.findByText(testDomain.domain); expect(screen.queryByRole("button", { name: /Acciones de/ })).not.toBeInTheDocument();
  });
  it("390 muestra dominio, estado y TXT en ListRow sin tabla; axe", async () => {
    asPhone(); const user = userEvent.setup(); const { container } = renderTabs(); await openTab(user, "Dominio verificado"); expect(await screen.findByText(testDomain.txtRecordValue!)).toBeVisible(); expect(screen.queryByRole("table")).not.toBeInTheDocument(); expect(await axe(container)).toHaveNoViolations(); await menuAction(user, testDomain.domain, "Quitar"); expect(screen.getByRole("dialog")).toHaveTextContent("¿Quitar delta.ejemplo.com?");
  });
  it("en-US usa textos y motivo fijo traducidos", async () => {
    const user = userEvent.setup(); let body: unknown; server.use(http.post("/api/platform/tenants/delta/domains/delta.ejemplo.com/verify", async ({ request }) => { body = await request.json(); return HttpResponse.json({ version: 20 }); })); const page = renderTabs(); await screen.findByRole("heading", { name: "Grupo Delta" }); await act(async () => { page.queryClient.setQueryData(currentUserQueryKey, { ...platformOperator, culture: "en-US" }); }); await openTab(user, "Verified domain"); await screen.findByText("Pending"); const trigger = screen.getByRole("button", { name: "Actions for delta.ejemplo.com" }); trigger.focus(); await user.keyboard("{Enter}"); await user.click(screen.getByRole("menuitem", { name: "Verify" })); expect(await screen.findByText("We verified delta.ejemplo.com.")).toBeVisible(); expect(body).toMatchObject({ reason: "Verify the domain" });
  });
  it("cancelar DELETE en vuelo abandona éxito tardío y siguiente formulario", async () => {
    const user = userEvent.setup(); let release: (() => void) | undefined; server.use(http.delete("/api/platform/tenants/delta/domains/delta.ejemplo.com", async () => { await new Promise<void>((resolve) => { release = resolve; }); return new HttpResponse(null, { status: 204 }); }));
    const page = renderTabs(); await openTab(user, "Dominio verificado"); await menuAction(user, testDomain.domain, "Quitar"); await submitReason(user, "Quitar"); await waitFor(() => expect(release).toBeDefined()); await user.click(screen.getByRole("button", { name: "Cancelar" })); await menuAction(user, testDomain.domain, "Quitar"); await act(async () => { release?.(); }); expect(screen.getByRole("dialog")).toBeVisible(); expect(screen.queryByText("Quitamos delta.ejemplo.com.")).not.toBeInTheDocument(); expect(page.queryClient.getQueryData(tenantDomainsQueryKey("delta"))).toEqual([testDomain]);
  });
  it("abandonar pestaña Verificar cancela retry viejo sin envío ni aviso de éxito", async () => {
    const user = userEvent.setup(); let calls = 0; server.use(http.post("/api/platform/tenants/delta/domains/delta.ejemplo.com/verify", () => { calls++; return calls === 1 ? HttpResponse.error() : HttpResponse.json({ version: 20 }); })); renderTabs(); await openTab(user, "Dominio verificado"); await menuAction(user, testDomain.domain, "Verificar"); const retry = await screen.findByRole("button", { name: "Reintentar" }); await openTab(user, "Dueños"); await act(async () => { fireEvent.click(retry); }); expect(calls).toBe(1); expect(screen.queryByText("Verificamos delta.ejemplo.com.")).not.toBeInTheDocument();
  });
  it("cambiar de ficha abandona retry Verificar viejo sin tocar otra organización", async () => {
    const user = userEvent.setup(); let calls = 0;
    server.use(
      http.post("/api/platform/tenants/delta/domains/delta.ejemplo.com/verify", () => { calls++; return calls === 1 ? HttpResponse.error() : HttpResponse.json({ version: 200 }); }),
      http.get("/api/platform/tenants/otra", () => HttpResponse.json({ ...testOrganization, id: "otra", name: "Otra organización" })),
      http.get("/api/platform/tenants/otra/history", () => HttpResponse.json({ items: [], hasMore: false })),
      http.get("/api/platform/tenants/otra/features", () => HttpResponse.json([])),
    );
    const page = renderTabs(); await openTab(user, "Dominio verificado"); await menuAction(user, testDomain.domain, "Verificar"); const retry = await screen.findByRole("button", { name: "Reintentar" });
    await act(async () => { await page.router.navigate("/plataforma/organizaciones/otra"); }); await screen.findByRole("heading", { name: "Otra organización" }); await act(async () => { fireEvent.click(retry); });
    expect(calls).toBe(1); expect(page.queryClient.getQueryData(tenantDomainsQueryKey("delta"))).toEqual([testDomain]); expect(page.queryClient.getQueryData(tenantDomainsQueryKey("otra"))).toBeUndefined(); expect(screen.queryByText("Verificamos delta.ejemplo.com.")).not.toBeInTheDocument();
  });
  it.each([["pestaña", "success"], ["pestaña", "error"], ["ficha", "success"], ["ficha", "error"]] as const)("Verificar abandona respuesta tardía al cambiar de %s: %s", async (destination, result) => {
    const user = userEvent.setup(); let release: (() => void) | undefined;
    server.use(
      http.post("/api/platform/tenants/delta/domains/delta.ejemplo.com/verify", async () => { await new Promise<void>((resolve) => { release = resolve; }); return result === "success" ? HttpResponse.json({ version: 200 }) : problem("Settings.TenantDomain.TxtNotFound", "TXT tardío"); }),
      http.get("/api/platform/tenants/otra", () => HttpResponse.json({ ...testOrganization, id: "otra", name: "Otra organización" })),
      http.get("/api/platform/tenants/otra/history", () => HttpResponse.json({ items: [], hasMore: false })),
      http.get("/api/platform/tenants/otra/features", () => HttpResponse.json([])),
    );
    const page = renderTabs(); await openTab(user, "Dominio verificado"); await menuAction(user, testDomain.domain, "Verificar"); await waitFor(() => expect(release).toBeDefined()); expect(screen.queryByRole("button", { name: `Acciones de ${testDomain.domain}` })).not.toBeInTheDocument();
    if (destination === "pestaña") await openTab(user, "Dueños");
    else { await act(async () => { await page.router.navigate("/plataforma/organizaciones/otra"); }); await screen.findByRole("heading", { name: "Otra organización" }); }
    await act(async () => { release?.(); }); await waitFor(() => expect(page.queryClient.getMutationCache().getAll().at(-1)?.state.error).toMatchObject({ name: "AbortError" }));
    expect(page.queryClient.getQueryData(tenantDomainsQueryKey("delta"))).toEqual([testDomain]); expect(page.queryClient.getQueryData(tenantDomainsQueryKey("otra"))).toBeUndefined(); expect(screen.queryByText("Verificamos delta.ejemplo.com.")).not.toBeInTheDocument(); expect(screen.queryByText("TXT tardío")).not.toBeInTheDocument();
  });
});
