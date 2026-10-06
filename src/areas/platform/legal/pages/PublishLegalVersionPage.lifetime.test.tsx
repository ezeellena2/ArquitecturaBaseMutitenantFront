import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { StrictMode } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { routes } from "@/app/routes";
import { currentUserQueryKey } from "@/auth/useCurrentUser";
import { changeCulture, configureI18n } from "@/shared/i18n";
import { platformOperator } from "@/test/mocks/currentUsers";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { renderRouteWithProviders, renderWithProviders } from "@/test/utils/renderWithProviders";

beforeAll(async () => { await import("./PublishLegalVersionPage"); await import("./LegalDocumentsPage"); });
beforeEach(async () => {
  await configureI18n(referenceDataFixture().cultures); await changeCulture("es-AR");
  server.use(http.get("/api/platform/legal-documents", () => HttpResponse.json([{ kind: "Terms", currentVersion: 2, currentEffectiveAtUtc: "2026-06-01T03:00:00Z", versions: [{ id: "t2", version: 2, effectiveAtUtc: "2026-06-01T03:00:00Z", isCurrent: true }] }, { kind: "Privacy", currentVersion: null, currentEffectiveAtUtc: null, versions: [] }])));
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
async function fill() {
  fireEvent.change(await screen.findByRole("textbox", { name: "Vigente desde" }), { target: { value: "01/11/2026" } });
  fireEvent.change(screen.getByRole("textbox", { name: "En español" }), { target: { value: "Texto es" } }); fireEvent.change(screen.getByRole("textbox", { name: "En inglés" }), { target: { value: "Text en" } });
}
async function ask(user: ReturnType<typeof userEvent.setup>) { await user.click(screen.getByRole("button", { name: "Publicar" })); return screen.findByRole("alertdialog"); }
async function send(user: ReturnType<typeof userEvent.setup>) { await user.click(within(await ask(user)).getByRole("button", { name: "Publicar" })); }

describe("vida y reintentos nativos de publicación", () => {
  it.each([false, true])("Retry conserva clave y recorrido de éxito sin depender del observer (%s)", async (detached) => {
    const user = userEvent.setup(); const keys: (string | null)[] = []; const succeedAt = detached ? 3 : 2;
    server.use(http.post("/api/platform/legal-documents", ({ request }) => { keys.push(request.headers.get("Idempotency-Key")); return keys.length < succeedAt ? HttpResponse.error() : HttpResponse.json({ id: "t37", version: 37 }, { status: 201 }); }));
    const page = renderRouteWithProviders("/plataforma/legales/nueva", { as: "platform-operator" }); await fill(); await send(user); const retry = await screen.findByRole("button", { name: "Reintentar" });
    if (detached) { await send(user); await waitFor(() => expect(screen.getAllByRole("button", { name: "Reintentar" })).toHaveLength(2)); }
    fireEvent.click(retry); expect(await screen.findByText("Publicamos la versión 37 de Términos y condiciones.")).toBeVisible(); await waitFor(() => expect(page.router.state.location.pathname).toBe("/plataforma/legales")); expect(keys).toHaveLength(succeedAt); expect(new Set(keys).size).toBe(1);
  });
  it("A→B→A abandona Retry viejos y ninguno contamina la clave del borrador A nuevo", async () => {
    const user = userEvent.setup(); const keys: (string | null)[] = [];
    server.use(http.post("/api/platform/legal-documents", ({ request }) => { keys.push(request.headers.get("Idempotency-Key")); return keys.length < 4 ? HttpResponse.error() : HttpResponse.json({ id: "t4", version: 4 }, { status: 201 }); }));
    renderRouteWithProviders("/plataforma/legales/nueva", { as: "platform-operator" }); await fill(); await send(user); const first = await screen.findByRole("button", { name: "Reintentar" });
    fireEvent.change(screen.getByRole("textbox", { name: "En español" }), { target: { value: "Borrador B" } }); await send(user); await waitFor(() => expect(screen.getAllByRole("button", { name: "Reintentar" })).toHaveLength(2)); const second = screen.getAllByRole("button", { name: "Reintentar" }).find((button) => button !== first)!;
    fireEvent.change(screen.getByRole("textbox", { name: "En español" }), { target: { value: "Texto es" } }); await send(user); await waitFor(() => expect(screen.getAllByRole("button", { name: "Reintentar" })).toHaveLength(3)); const current = screen.getAllByRole("button", { name: "Reintentar" }).find((button) => button !== first && button !== second)!;
    await act(async () => { fireEvent.click(first); fireEvent.click(second); }); expect(keys).toHaveLength(3); fireEvent.click(current); await screen.findByText("Publicamos la versión 4 de Términos y condiciones."); expect(keys).toHaveLength(4); expect(new Set(keys.slice(0, 3)).size).toBe(3); expect(keys[3]).toBe(keys[2]);
  });
  it("cambiar documento por selector abandona Retry anterior aunque vuelvan valores", async () => {
    const user = userEvent.setup(); let calls = 0;
    server.use(http.post("/api/platform/legal-documents", () => { calls++; return HttpResponse.error(); }));
    renderRouteWithProviders("/plataforma/legales/nueva", { as: "platform-operator" }); await fill(); await send(user); const retry = await screen.findByRole("button", { name: "Reintentar" });
    screen.getByRole("combobox", { name: "Documento" }).focus(); await user.keyboard("{Enter}"); await user.click(await screen.findByRole("option", { name: "Política de privacidad" }));
    screen.getByRole("combobox", { name: "Documento" }).focus(); await user.keyboard("{Enter}"); await user.click(await screen.findByRole("option", { name: "Términos y condiciones" })); await act(async () => { fireEvent.click(retry); }); expect(calls).toBe(1); expect(screen.getByRole("textbox", { name: "En español" })).toHaveValue("Texto es");
  });
  it("cancelar la confirmación abandona Retry aun con borrador idéntico", async () => {
    const user = userEvent.setup(); const keys: (string | null)[] = [];
    server.use(http.post("/api/platform/legal-documents", ({ request }) => { keys.push(request.headers.get("Idempotency-Key")); return HttpResponse.error(); }));
    renderRouteWithProviders("/plataforma/legales/nueva", { as: "platform-operator" }); await fill(); await send(user); const retry = await screen.findByRole("button", { name: "Reintentar" });
    await user.click(within(await ask(user)).getByRole("button", { name: "Cancelar" })); await act(async () => { fireEvent.click(retry); }); expect(keys).toHaveLength(1); await send(user); await waitFor(() => expect(keys).toHaveLength(2)); expect(keys[1]).not.toBe(keys[0]);
  });
  it.each(["success", "network", "server", "field"] as const)("cancelar elección deja respuesta tardía %s inerte y no cierra confirmación nueva", async (result) => {
    const user = userEvent.setup(); let release: (() => void) | undefined;
    server.use(http.post("/api/platform/legal-documents", async () => { await new Promise<void>((resolve) => { release = resolve; }); return result === "network" ? HttpResponse.error() : result === "server" ? HttpResponse.json({ traceId: "late" }, { status: 500 }) : result === "field" ? HttpResponse.json({ code: "Legal.Publication.EffectiveDatePast", detail: "Error tardío", errors: { effectiveOn: ["Error tardío"] } }, { status: 400 }) : HttpResponse.json({ id: "t37", version: 37 }, { status: 201 }); }));
    const page = renderRouteWithProviders("/plataforma/legales/nueva", { as: "platform-operator" }); await fill(); await send(user); await waitFor(() => expect(release).toBeDefined()); await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Cancelar" })); await ask(user);
    await act(async () => { release?.(); }); await waitFor(() => expect(page.queryClient.getMutationCache().getAll().at(-1)?.state.error).toMatchObject({ name: "AbortError" }));
    expect(screen.getByRole("alertdialog")).toBeVisible(); expect(page.router.state.location.pathname).toBe("/plataforma/legales/nueva"); expect(screen.queryByText("Publicamos la versión 37 de Términos y condiciones.")).not.toBeInTheDocument(); expect(screen.queryByText("Error tardío")).not.toBeInTheDocument(); expect(screen.queryByRole("button", { name: "Reintentar" })).not.toBeInTheDocument();
  });
  it.each(["route", "permission"] as const)("%s abandona recurso, formulario, confirmación y Retry", async (reason) => {
    const user = userEvent.setup(); let calls = 0; server.use(http.post("/api/platform/legal-documents", () => { calls++; return HttpResponse.error(); }));
    const page = renderRouteWithProviders("/plataforma/legales/nueva", { as: "platform-operator" }); await fill(); await send(user); const retry = await screen.findByRole("button", { name: "Reintentar" });
    if (reason === "route") { await act(async () => { void page.router.navigate("/plataforma/legales/nueva?documento=Privacy"); }); await screen.findByText("Política de privacidad · versión 1"); }
    else { await act(async () => { page.queryClient.setQueryData(currentUserQueryKey, { ...platformOperator, effectivePermissions: { ...platformOperator.effectivePermissions, platform: [] } }); }); await screen.findByRole("heading", { name: "No tenés permiso para ver esta página" }); }
    await act(async () => { fireEvent.click(retry); }); expect(calls).toBe(1); expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    if (reason === "route") expect(screen.getByRole("textbox", { name: "En español" })).toHaveValue("");
  });
  it.each([
    ["route", "success"], ["route", "field"], ["permission", "success"], ["permission", "field"],
  ] as const)("%s deja una respuesta pendiente %s inerte tras abandonar el recurso", async (reason, result) => {
    const user = userEvent.setup(); let release: (() => void) | undefined;
    server.use(http.post("/api/platform/legal-documents", async () => {
      await new Promise<void>((resolve) => { release = resolve; });
      return result === "success" ? HttpResponse.json({ id: "t37", version: 37 }, { status: 201 })
        : HttpResponse.json({ code: "Legal.Publication.EffectiveDatePast", detail: "Error de recurso anterior", errors: { effectiveOn: ["Error de recurso anterior"] } }, { status: 400 });
    }));
    const page = renderRouteWithProviders("/plataforma/legales/nueva", { as: "platform-operator" });
    await fill(); await send(user); await waitFor(() => expect(release).toBeDefined());
    if (reason === "route") {
      await act(async () => { void page.router.navigate("/plataforma/legales/nueva?documento=Privacy"); });
      await screen.findByText("Política de privacidad · versión 1");
    } else {
      await act(async () => { page.queryClient.setQueryData(currentUserQueryKey, { ...platformOperator, effectivePermissions: { ...platformOperator.effectivePermissions, platform: [] } }); });
      await screen.findByRole("heading", { name: "No tenés permiso para ver esta página" });
    }
    await act(async () => { release?.(); });
    await waitFor(() => expect(page.queryClient.getMutationCache().getAll().at(-1)?.state.error).toMatchObject({ name: "AbortError" }));
    expect(screen.queryByText("Error de recurso anterior")).not.toBeInTheDocument();
    expect(screen.queryByText("Publicamos la versión 37 de Términos y condiciones.")).not.toBeInTheDocument();
    if (reason === "route") {
      expect(page.router.state.location.search).toBe("?documento=Privacy");
      expect(screen.getByRole("textbox", { name: "En español" })).toHaveValue("");
    }
  });
  it.each([false, true])("InProgress termina una vez tras 31 pedidos y 30 esperas, observer retirado=%s", async (detached) => {
    const user = userEvent.setup(); const keys: (string | null)[] = []; const failures = detached ? 2 : 0; let polls = 0;
    server.use(http.post("/api/platform/legal-documents", ({ request }) => { keys.push(request.headers.get("Idempotency-Key")); if (keys.length <= failures) return HttpResponse.error(); polls++; return HttpResponse.json({ code: "Request.InProgress", detail: "La publicación sigue en curso." }, { status: 409 }); }));
    const page = renderRouteWithProviders("/plataforma/legales/nueva", { as: "platform-operator" }); await fill(); let start: HTMLElement;
    if (detached) { await send(user); start = await screen.findByRole("button", { name: "Reintentar" }); await send(user); await waitFor(() => expect(screen.getAllByRole("button", { name: "Reintentar" })).toHaveLength(2)); } else start = within(await ask(user)).getByRole("button", { name: "Publicar" });
    vi.useFakeTimers(); try {
      await act(async () => { fireEvent.click(start); await vi.advanceTimersByTimeAsync(0); }); expect(polls).toBe(1); expect(screen.getAllByRole("button", { name: /Publicando/ }).length).toBeGreaterThan(0);
      await act(async () => { await vi.advanceTimersByTimeAsync(29_000); }); expect(polls).toBe(30); expect(screen.queryByText("La publicación sigue en curso.")).not.toBeInTheDocument(); expect(page.queryClient.isMutating()).toBe(1);
      await act(async () => { await vi.advanceTimersByTimeAsync(1_050); }); expect(polls).toBe(31); expect(keys).toHaveLength(failures + 31); expect(new Set(keys).size).toBe(1); expect(screen.getAllByText("La publicación sigue en curso.")).toHaveLength(1); expect(page.queryClient.isMutating()).toBe(0);
    } finally { vi.useRealTimers(); }
  });
  it("cancelar la espera InProgress aborta dueño sin nuevos pedidos ni error final", async () => {
    const user = userEvent.setup(); let calls = 0; server.use(http.post("/api/platform/legal-documents", () => { calls++; return HttpResponse.json({ code: "Request.InProgress", detail: "En curso" }, { status: 409 }); }));
    const page = renderRouteWithProviders("/plataforma/legales/nueva", { as: "platform-operator" }); await fill(); const start = within(await ask(user)).getByRole("button", { name: "Publicar" }); vi.useFakeTimers();
    try { await act(async () => { fireEvent.click(start); await vi.advanceTimersByTimeAsync(0); }); expect(calls).toBe(1); await act(async () => { fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Cancelar" })); await vi.advanceTimersByTimeAsync(60_000); }); expect(calls).toBe(1); expect(page.queryClient.isMutating()).toBe(0); expect(screen.queryByText("En curso")).not.toBeInTheDocument(); } finally { vi.useRealTimers(); }
  });
  it("StrictMode monta un dueño definitivo y publica una sola vez", async () => {
    const user = userEvent.setup(); let calls = 0; server.use(http.post("/api/platform/legal-documents", () => { calls++; return HttpResponse.json({ id: "t3", version: 3 }, { status: 201 }); }));
    const router = createMemoryRouter(routes, { initialEntries: ["/plataforma/legales/nueva"] }); renderWithProviders(<StrictMode><RouterProvider router={router} /></StrictMode>, { as: "platform-operator" }); await fill(); await send(user); await screen.findByText("Publicamos la versión 3 de Términos y condiciones."); expect(calls).toBe(1);
  });
});
