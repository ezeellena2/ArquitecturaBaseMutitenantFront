import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { changeCulture, configureI18n } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";

beforeAll(async () => { await import("./LegalDocumentsPage"); await import("./PublishLegalVersionPage"); });
beforeEach(async () => {
  await configureI18n(referenceDataFixture().cultures); await changeCulture("es-AR");
  server.use(http.get("/api/platform/legal-documents", () => HttpResponse.json([{ kind: "Terms", currentVersion: null, currentEffectiveAtUtc: null, versions: [] }, { kind: "Privacy", currentVersion: null, currentEffectiveAtUtc: null, versions: [] }])));
});
afterEach(() => vi.useRealTimers());

async function editor(user: ReturnType<typeof userEvent.setup>) {
  const page = renderRouteWithProviders("/plataforma/legales", { as: "platform-operator" });
  await user.click(await screen.findByRole("link", { name: "Publicar versión nueva" }));
  fireEvent.change(await screen.findByRole("textbox", { name: "Vigente desde" }), { target: { value: "01/11/2026" } });
  fireEvent.change(screen.getByRole("textbox", { name: "En español" }), { target: { value: "Texto es" } });
  fireEvent.change(screen.getByRole("textbox", { name: "En inglés" }), { target: { value: "Text en" } });
  await user.click(screen.getByRole("button", { name: "Publicar" }));
  await screen.findByRole("alertdialog");
  return page;
}
async function back(page: ReturnType<typeof renderRouteWithProviders>) {
  await act(async () => { void page.router.navigate(-1); });
  const leave = await screen.findByRole("dialog", { name: "¿Salir sin guardar?" });
  expect([...screen.queryAllByRole("dialog", { hidden: true }), ...screen.queryAllByRole("alertdialog", { hidden: true })]).toHaveLength(1);
  return leave;
}
function expectDraft() {
  expect(screen.getByRole("textbox", { name: "Vigente desde" })).toHaveValue("01/11/2026");
  expect(screen.getByRole("textbox", { name: "En español" })).toHaveValue("Texto es");
  expect(screen.getByRole("textbox", { name: "En inglés" })).toHaveValue("Text en");
  expect(screen.getByText("Cambios sin guardar")).toBeVisible();
}

describe("Atrás desde confirmación legal", () => {
  it("Seguir editando muestra un solo diálogo de salida y conserva el borrador sin reabrir confirmación", async () => {
    const user = userEvent.setup(); const page = await editor(user);
    await user.click(within(await back(page)).getByRole("button", { name: "Seguir editando" }));
    expectDraft(); expect(screen.queryByRole("alertdialog", { hidden: true })).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog", { hidden: true })).not.toBeInTheDocument();
    expect(page.router.state.location.pathname).toBe("/plataforma/legales/nueva");
    await user.click(screen.getByRole("button", { name: "Publicar" }));
    expect(await screen.findByRole("alertdialog")).toBeVisible();
  });
  it("Salir sin guardar completa Atrás al listado con un único diálogo", async () => {
    const user = userEvent.setup(); const page = await editor(user);
    await user.click(within(await back(page)).getByRole("button", { name: "Salir sin guardar" }));
    await waitFor(() => expect(page.router.state.location.pathname).toBe("/plataforma/legales"));
    expect(screen.queryByRole("alertdialog", { hidden: true })).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog", { hidden: true })).not.toBeInTheDocument();
  });
  it.each(["success", "network", "field"] as const)("pendiente %s se abandona al preguntar salida; Seguir editando conserva texto y nueva vida", async (result) => {
    const user = userEvent.setup(); const keys: (string | null)[] = []; let release: (() => void) | undefined;
    server.use(http.post("/api/platform/legal-documents", async ({ request }) => {
      keys.push(request.headers.get("Idempotency-Key"));
      if (keys.length > 1) return HttpResponse.json({ id: "new", version: 4 }, { status: 201 });
      await new Promise<void>((resolve) => { release = resolve; });
      return result === "success" ? HttpResponse.json({ id: "old", version: 37 }, { status: 201 }) : result === "network" ? HttpResponse.error()
        : HttpResponse.json({ code: "Legal.Publication.EffectiveDatePast", detail: "Respuesta anterior", errors: { effectiveOn: ["Respuesta anterior"] } }, { status: 400 });
    }));
    const page = await editor(user);
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Publicar" }));
    await waitFor(() => expect(release).toBeDefined());
    await user.click(within(await back(page)).getByRole("button", { name: "Seguir editando" }));
    expectDraft(); expect(screen.getByRole("button", { name: "Publicar" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Publicar" }));
    const next = await screen.findByRole("alertdialog");
    await act(async () => { release?.(); });
    await waitFor(() => expect(page.queryClient.getMutationCache().getAll().at(-1)?.state.error).toMatchObject({ name: "AbortError" }));
    expect(screen.getByRole("alertdialog")).toBe(next); expect(screen.queryByText("Respuesta anterior")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reintentar" })).not.toBeInTheDocument();
    expect(screen.queryByText("Publicamos la versión 37 de Términos y condiciones.")).not.toBeInTheDocument();
    await user.click(within(next).getByRole("button", { name: "Publicar" }));
    expect(await screen.findByText("Publicamos la versión 4 de Términos y condiciones.")).toBeVisible();
    expect(keys).toHaveLength(2); expect(keys[1]).not.toBe(keys[0]);
  });
  it("pendiente se abandona al Salir y un éxito anterior no avisa ni cambia el listado", async () => {
    const user = userEvent.setup(); let release: (() => void) | undefined;
    server.use(http.post("/api/platform/legal-documents", async () => {
      await new Promise<void>((resolve) => { release = resolve; });
      return HttpResponse.json({ id: "old", version: 37 }, { status: 201 });
    }));
    const page = await editor(user);
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Publicar" }));
    await waitFor(() => expect(release).toBeDefined());
    await user.click(within(await back(page)).getByRole("button", { name: "Salir sin guardar" }));
    await waitFor(() => expect(page.router.state.location.pathname).toBe("/plataforma/legales"));
    await act(async () => { release?.(); });
    await waitFor(() => expect(page.queryClient.getMutationCache().getAll().at(-1)?.state.error).toMatchObject({ name: "AbortError" }));
    expect(screen.queryByText("Publicamos la versión 37 de Términos y condiciones.")).not.toBeInTheDocument();
  });
  it("Retry anterior a Atrás queda inerte y confirmar otra vez usa un dueño/clave nuevos", async () => {
    const user = userEvent.setup(); const keys: (string | null)[] = [];
    server.use(http.post("/api/platform/legal-documents", ({ request }) => {
      keys.push(request.headers.get("Idempotency-Key"));
      return keys.length === 1 ? HttpResponse.error() : HttpResponse.json({ id: "new", version: 4 }, { status: 201 });
    }));
    const page = await editor(user);
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Publicar" }));
    const oldRetry = await screen.findByRole("button", { name: "Reintentar" });
    await user.click(screen.getByRole("button", { name: "Publicar" })); await screen.findByRole("alertdialog");
    await user.click(within(await back(page)).getByRole("button", { name: "Seguir editando" }));
    await act(async () => { fireEvent.click(oldRetry); }); expect(keys).toHaveLength(1); expectDraft();
    await user.click(screen.getByRole("button", { name: "Publicar" }));
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Publicar" }));
    await screen.findByText("Publicamos la versión 4 de Términos y condiciones.");
    expect(keys).toHaveLength(2); expect(keys[1]).not.toBe(keys[0]);
  });
  it("Atrás cancela la espera InProgress y Seguir editando conserva borrador sin más pedidos", async () => {
    const user = userEvent.setup(); let calls = 0;
    server.use(http.post("/api/platform/legal-documents", () => { calls++; return HttpResponse.json({ code: "Request.InProgress", detail: "En curso" }, { status: 409 }); }));
    const page = await editor(user); const start = within(screen.getByRole("alertdialog")).getByRole("button", { name: "Publicar" });
    vi.useFakeTimers();
    try {
      await act(async () => { fireEvent.click(start); await vi.advanceTimersByTimeAsync(0); });
      expect(calls).toBe(1);
      await act(async () => { void page.router.navigate(-1); await vi.advanceTimersByTimeAsync(0); });
      const leave = screen.getByRole("dialog", { name: "¿Salir sin guardar?" });
      expect(screen.queryByRole("alertdialog", { hidden: true })).not.toBeInTheDocument();
      await act(async () => { fireEvent.click(within(leave).getByRole("button", { name: "Seguir editando" })); await vi.advanceTimersByTimeAsync(60_000); });
      expect(calls).toBe(1); expect(page.queryClient.isMutating()).toBe(0); expectDraft();
      expect(screen.queryByText("En curso")).not.toBeInTheDocument();
    } finally { vi.useRealTimers(); }
  });
});
