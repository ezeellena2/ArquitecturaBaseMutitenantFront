import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { changeCulture, configureI18n } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";
import { legalDocumentsQueryKey } from "../api/legalDocuments";

const documents = [{ kind: "Terms", currentVersion: 2, currentEffectiveAtUtc: "2026-06-01T03:00:00Z", versions: [{ id: "t2", version: 2, effectiveAtUtc: "2026-06-01T03:00:00Z", isCurrent: true }] }, { kind: "Privacy", currentVersion: null, currentEffectiveAtUtc: null, versions: [] }];
beforeAll(async () => { await import("./LegalDocumentsPage"); await import("./PublishLegalVersionPage"); });
beforeEach(async () => {
  await configureI18n(referenceDataFixture().cultures); await changeCulture("es-AR");
  server.use(http.get("/api/platform/legal-documents", () => HttpResponse.json(documents)));
});

async function fill() {
  fireEvent.change(await screen.findByRole("textbox", { name: "Vigente desde" }), { target: { value: "01/11/2026" } });
  fireEvent.change(screen.getByRole("textbox", { name: "En español" }), { target: { value: "Borrador es" } });
  fireEvent.change(screen.getByRole("textbox", { name: "En inglés" }), { target: { value: "Draft en" } });
}
async function failedRefetch(page: ReturnType<typeof renderRouteWithProviders>) {
  server.use(http.get("/api/platform/legal-documents", () => HttpResponse.error()));
  vi.useFakeTimers();
  try {
    await act(async () => {
      await page.queryClient.refetchQueries({ queryKey: legalDocumentsQueryKey });
      await vi.advanceTimersByTimeAsync(0);
    });
  } finally { vi.useRealTimers(); }
  expect(page.queryClient.getQueryState(legalDocumentsQueryKey)?.status).toBe("error");
}
async function retryRefetch(page: ReturnType<typeof renderRouteWithProviders>) {
  server.use(http.get("/api/platform/legal-documents", () => HttpResponse.json(documents)));
  vi.useFakeTimers();
  try {
    await act(async () => {
      await page.queryClient.refetchQueries({ queryKey: legalDocumentsQueryKey });
      await vi.advanceTimersByTimeAsync(0);
    });
  } finally { vi.useRealTimers(); }
  expect(page.queryClient.getQueryState(legalDocumentsQueryKey)?.status).toBe("success");
}

describe("relectura legal con datos en caché", () => {
  it("lista permanece visible tras falla de fondo y reintento de lectura", async () => {
    const page = renderRouteWithProviders("/plataforma/legales", { as: "platform-operator" });
    await screen.findByText("2 documentos · 1 versiones publicadas");
    const list = screen.getByRole("list", { name: "Documentos legales" });
    await failedRefetch(page);
    expect(screen.getByRole("list", { name: "Documentos legales" })).toBe(list);
    expect(screen.getByText("Versión 2 · vigente desde 01/06/2026")).toBeVisible();
    expect(screen.queryByRole("heading", { name: "No pudimos abrir esta pantalla" })).not.toBeInTheDocument();
    await retryRefetch(page);
    expect(screen.getByRole("list", { name: "Documentos legales" })).toBe(list);
  });
  it("editor sucio conserva RHF, fecha, contenidos y salida sucia al fallar/reintentar lectura", async () => {
    const user = userEvent.setup();
    const page = renderRouteWithProviders("/plataforma/legales/nueva", { as: "platform-operator" });
    await fill();
    const date = screen.getByRole("textbox", { name: "Vigente desde" });
    const content = screen.getByRole("textbox", { name: "En español" });
    await failedRefetch(page);
    expect(screen.getByRole("textbox", { name: "En español" })).toBe(content);
    expect(content).toHaveValue("Borrador es"); expect(date).toHaveValue("01/11/2026");
    expect(screen.getByRole("textbox", { name: "En inglés" })).toHaveValue("Draft en");
    expect(screen.getByText("Cambios sin guardar")).toBeVisible();
    await retryRefetch(page);
    expect(screen.getByRole("textbox", { name: "En español" })).toBe(content);
    expect(content).toHaveValue("Borrador es"); expect(date).toHaveValue("01/11/2026");
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(await screen.findByRole("dialog", { name: "¿Salir sin guardar?" })).toBeVisible();
  });
  it("Retry de publicación vigente sigue dueño/clave tras error de relectura y recuperación", async () => {
    const user = userEvent.setup(); const keys: (string | null)[] = [];
    server.use(http.post("/api/platform/legal-documents", ({ request }) => {
      keys.push(request.headers.get("Idempotency-Key"));
      return keys.length === 1 ? HttpResponse.error() : HttpResponse.json({ id: "t7", version: 7 }, { status: 201 });
    }));
    const page = renderRouteWithProviders("/plataforma/legales/nueva", { as: "platform-operator" });
    await fill(); await user.click(screen.getByRole("button", { name: "Publicar" }));
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Publicar" }));
    const retry = await screen.findByRole("button", { name: "Reintentar" });
    await failedRefetch(page);
    expect(screen.getByRole("textbox", { name: "En español" })).toHaveValue("Borrador es");
    await retryRefetch(page);
    fireEvent.click(retry);
    expect(await screen.findByText("Publicamos la versión 7 de Términos y condiciones.")).toBeVisible();
    await waitFor(() => expect(page.router.state.location.pathname).toBe("/plataforma/legales"));
    expect(keys).toHaveLength(2); expect(keys[1]).toBe(keys[0]);
  });
  it("publicación pendiente conserva confirmación/dueño y éxito después de relectura fallida", async () => {
    const user = userEvent.setup(); let release: (() => void) | undefined; let calls = 0;
    server.use(http.post("/api/platform/legal-documents", async () => {
      calls++; await new Promise<void>((resolve) => { release = resolve; });
      return HttpResponse.json({ id: "t8", version: 8 }, { status: 201 });
    }));
    const page = renderRouteWithProviders("/plataforma/legales/nueva", { as: "platform-operator" });
    await fill(); await user.click(screen.getByRole("button", { name: "Publicar" }));
    const confirmation = await screen.findByRole("alertdialog");
    await user.click(within(confirmation).getByRole("button", { name: "Publicar" }));
    await waitFor(() => expect(release).toBeDefined());
    await failedRefetch(page);
    expect(screen.getByRole("alertdialog")).toBe(confirmation);
    expect(within(confirmation).getByRole("button", { name: "Publicando…" })).toBeDisabled();
    await retryRefetch(page);
    await act(async () => { release?.(); });
    expect(await screen.findByText("Publicamos la versión 8 de Términos y condiciones.")).toBeVisible();
    expect(calls).toBe(1); await waitFor(() => expect(page.router.state.location.pathname).toBe("/plataforma/legales"));
  });
});
