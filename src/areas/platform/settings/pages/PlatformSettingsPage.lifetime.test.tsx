import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createMemoryRouter, RouterProvider } from "react-router";
import { StrictMode } from "react";
import { routes } from "@/app/routes";
import { currentUserQueryKey } from "@/auth/useCurrentUser";
import { changeCulture, configureI18n } from "@/shared/i18n";
import { platformOperator } from "@/test/mocks/currentUsers";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { platformSettingsFixture } from "@/test/mocks/platformSettings";
import { server } from "@/test/mocks/server";
import { renderWithProviders } from "@/test/utils/renderWithProviders";

beforeAll(async () => { await import("./PlatformSettingsPage"); });
beforeEach(async () => {
  await configureI18n(referenceDataFixture().cultures); await changeCulture("es-AR");
  server.use(http.get("/api/platform/settings", () => HttpResponse.json(platformSettingsFixture)),
    http.get("/api/platform/legal-documents", () => HttpResponse.json([])));
});
const change = (value: string) => fireEvent.change(screen.getByRole("textbox", { name: "Correo de ventas", hidden: true }), { target: { value } });
async function editor(strict = false) {
  const router = createMemoryRouter(routes, { initialEntries: ["/plataforma/legales", "/plataforma/configuracion"] });
  const app = <RouterProvider router={router} />;
  const page = { router, ...renderWithProviders(strict ? <StrictMode>{app}</StrictMode> : app, { as: "platform-operator" }) };
  await screen.findByRole("textbox", { name: "Correo de ventas" }); change("nuevo@ejemplo.com"); return page;
}
async function confirm(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
  const dialog = await screen.findByRole("dialog", { name: "¿Guardar la configuración?" });
  fireEvent.change(within(dialog).getByRole("textbox", { name: "Motivo" }), { target: { value: "Motivo A" } });
  await user.click(within(dialog).getByRole("button", { name: "Guardar" })); return dialog;
}
async function back(page: Awaited<ReturnType<typeof editor>>) {
  await act(async () => { void page.router.navigate(-1); });
  const dialog = await screen.findByRole("dialog", { name: "¿Salir sin guardar?" });
  expect([...screen.queryAllByRole("dialog", { hidden: true }), ...screen.queryAllByRole("alertdialog", { hidden: true })]).toHaveLength(1); return dialog;
}
async function finishMutation(page: Awaited<ReturnType<typeof editor>>, release?: () => void) {
  const mutation = page.queryClient.getMutationCache().getAll().at(-1);
  await act(async () => { release?.(); });
  await waitFor(() => expect(mutation?.state.status).toBe("error")); expect(mutation?.state.error).toMatchObject({ name: "AbortError" });
}

describe("Vida del guardado de Configuración", () => {
  it("cambiar motivo A→B→A antes de resolver validación abandona el envío original sin franja", async () => {
    let calls = 0; server.use(http.put("/api/platform/settings", () => { calls++; return HttpResponse.json({ version: 6 }); }));
    const user = userEvent.setup(); const page = await editor(); await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    const dialog = await screen.findByRole("dialog", { name: "¿Guardar la configuración?" }); const reason = within(dialog).getByRole("textbox", { name: "Motivo" });
    fireEvent.change(reason, { target: { value: "Motivo A" } }); fireEvent.click(within(dialog).getByRole("button", { name: "Guardar" })); fireEvent.change(reason, { target: { value: "Motivo B" } }); fireEvent.change(reason, { target: { value: "Motivo A" } });
    await waitFor(() => expect(page.queryClient.getMutationCache().getAll().at(-1)?.state.status).toBe("error"));
    expect(calls).toBe(0); expect(screen.getByRole("dialog")).toBe(dialog); expect(within(dialog).queryByRole("alert")).not.toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Guardar" })); expect(await screen.findByText("Guardamos la configuración.")).toBeVisible(); expect(calls).toBe(1);
  });
  it("StrictMode conserva un único HTTP por envío y guardas de callbacks en Retry de motivo corregido", async () => {
    let calls = 0; server.use(http.put("/api/platform/settings", () => { calls++; return calls === 1 ? HttpResponse.error() : HttpResponse.json({ version: 6 }); }));
    const user = userEvent.setup(); const page = await editor(true); const dialog = await confirm(user); const retry = await screen.findByRole("button", { name: "Reintentar" });
    const reason = within(dialog).getByRole("textbox", { name: "Motivo" }); reason.focus(); fireEvent.change(reason, { target: { value: "Corregido" } });
    await act(async () => { fireEvent.click(retry); }); await finishMutation(page); expect(calls).toBe(1); expect(within(dialog).queryByRole("alert")).not.toBeInTheDocument(); expect(document.activeElement).toBe(reason);
    await user.click(within(dialog).getByRole("button", { name: "Guardar" })); expect(await screen.findByText("Guardamos la configuración.")).toBeVisible(); expect(calls).toBe(2);
  });
  it("Retry nativo activo conserva campos, versión y motivo sin clave y termina igual", async () => {
    const requests: Record<string, unknown>[] = [];
    server.use(http.put("/api/platform/settings", async ({ request }) => { requests.push(await request.json() as Record<string, unknown>); expect(request.headers.get("Idempotency-Key")).toBeNull(); return requests.length === 1 ? HttpResponse.error() : HttpResponse.json({ version: 13 }); }));
    const user = userEvent.setup(); await editor(); await confirm(user); const retry = await screen.findByRole("button", { name: "Reintentar" });
    await act(async () => { fireEvent.click(retry); }); expect(await screen.findByText("Guardamos la configuración.")).toBeVisible(); expect(requests).toHaveLength(2); expect(requests[1]).toEqual(requests[0]);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(); expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeDisabled();
  });
  it.each(["cancelar", "editar", "descartar"])("%s abandona Retry A y volver A no revive el dueño anterior", async (action) => {
    let calls = 0; server.use(http.put("/api/platform/settings", () => { calls++; return calls === 1 ? HttpResponse.error() : HttpResponse.json({ version: 6 }); }));
    const user = userEvent.setup(); const page = await editor(); const oldDialog = await confirm(user); const oldRetry = await screen.findByRole("button", { name: "Reintentar" });
    if (action === "cancelar") await user.click(within(oldDialog).getByRole("button", { name: "Cancelar" }));
    else if (action === "editar") { change("otro@ejemplo.com"); change("nuevo@ejemplo.com"); }
    else { fireEvent.click(screen.getByRole("button", { name: "Descartar cambios", hidden: true })); change("nuevo@ejemplo.com"); }
    await user.click(screen.getByRole("button", { name: "Guardar cambios" })); const next = await screen.findByRole("dialog", { name: "¿Guardar la configuración?" });
    await act(async () => { fireEvent.click(oldRetry); }); await finishMutation(page); expect(calls).toBe(1); expect(screen.getByRole("dialog")).toBe(next);
    fireEvent.change(within(next).getByRole("textbox", { name: "Motivo" }), { target: { value: "Motivo nuevo" } });
    await user.click(within(next).getByRole("button", { name: "Guardar" })); expect(await screen.findByText("Guardamos la configuración.")).toBeVisible(); expect(calls).toBe(2);
  });
  it("editar motivo A→B→A conserva RHF y vuelve inerte Retry A", async () => {
    let calls = 0; const reasons: unknown[] = [];
    server.use(http.put("/api/platform/settings", async ({ request }) => { reasons.push((await request.json() as { reason: unknown }).reason); calls++; return calls === 1 ? HttpResponse.error() : HttpResponse.json({ version: 7 }); }));
    const user = userEvent.setup(); const page = await editor(); const dialog = await confirm(user); const oldRetry = await screen.findByRole("button", { name: "Reintentar" });
    const reason = within(dialog).getByRole("textbox", { name: "Motivo" }); reason.focus(); fireEvent.change(reason, { target: { value: "Motivo B" } }); fireEvent.change(reason, { target: { value: "Motivo A" } });
    await act(async () => { fireEvent.click(oldRetry); }); await finishMutation(page); expect(calls).toBe(1); expect(screen.getByRole("dialog")).toBe(dialog); expect(reason).toHaveValue("Motivo A");
    expect(within(dialog).queryByRole("alert")).not.toBeInTheDocument(); expect(screen.queryByText("Algo salió mal. Probá de nuevo en un rato.")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(reason); expect(within(dialog).getByRole("textbox", { name: "Motivo" })).toBe(reason);
    await user.click(within(dialog).getByRole("button", { name: "Guardar" })); expect(await screen.findByText("Guardamos la configuración.")).toBeVisible(); expect(calls).toBe(2); expect(reasons).toEqual(["Motivo A", "Motivo A"]);
  });
  it.each(["success", "network", "field"] as const)("respuesta %s tardía al cancelar no cambia ni cierra nueva confirmación", async (result) => {
    let release: (() => void) | undefined; let calls = 0;
    server.use(http.put("/api/platform/settings", async () => {
      calls++; if (calls > 1) return HttpResponse.json({ version: 5 });
      await new Promise<void>((resolve) => { release = resolve; });
      return result === "success" ? HttpResponse.json({ version: 37 }) : result === "network" ? HttpResponse.error() : HttpResponse.json({ code: "Validation.Failed", detail: "Viejo", errors: { salesEmail: ["Viejo"] } }, { status: 400 });
    }));
    const user = userEvent.setup(); const page = await editor(); const oldDialog = await confirm(user); await waitFor(() => expect(release).toBeDefined());
    await user.click(within(oldDialog).getByRole("button", { name: "Cancelar" })); change("otro@ejemplo.com"); await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    const next = await screen.findByRole("dialog", { name: "¿Guardar la configuración?" }); await finishMutation(page, release);
    expect(screen.getByRole("dialog")).toBe(next); expect(screen.queryByText("Guardamos la configuración.")).not.toBeInTheDocument(); expect(screen.queryByText("Viejo")).not.toBeInTheDocument(); expect(screen.queryByRole("button", { name: "Reintentar" })).not.toBeInTheDocument();
    fireEvent.change(within(next).getByRole("textbox", { name: "Motivo" }), { target: { value: "Actual" } }); await user.click(within(next).getByRole("button", { name: "Guardar" }));
    expect(await screen.findByText("Guardamos la configuración.")).toBeVisible(); expect(calls).toBe(2);
  });
  it.each(["Seguir editando", "Salir sin guardar"])("Atrás con confirmación: un solo diálogo; %s conserva o sale", async (action) => {
    let calls = 0; server.use(http.put("/api/platform/settings", () => { calls++; return HttpResponse.json({ version: 5 }); }));
    const user = userEvent.setup(); const page = await editor(); await user.click(screen.getByRole("button", { name: "Guardar cambios" })); await screen.findByRole("dialog", { name: "¿Guardar la configuración?" });
    await user.click(within(await back(page)).getByRole("button", { name: action }));
    if (action === "Salir sin guardar") await waitFor(() => expect(page.router.state.location.pathname).toBe("/plataforma/legales"));
    else { expect(screen.getByRole("textbox", { name: "Correo de ventas" })).toHaveValue("nuevo@ejemplo.com"); expect(screen.queryByRole("dialog", { hidden: true })).not.toBeInTheDocument(); await confirm(user); await screen.findByText("Guardamos la configuración."); }
    expect(calls).toBe(action === "Salir sin guardar" ? 0 : 1);
  });
  it.each(["success", "network", "field"] as const)("Atrás abandona HTTP %s antes de responder; continuar exige nueva confirmación", async (result) => {
    let release: (() => void) | undefined; const versions: unknown[] = [];
    server.use(http.put("/api/platform/settings", async ({ request }) => {
      versions.push((await request.json() as { version: unknown }).version); if (versions.length > 1) return HttpResponse.json({ version: 5 });
      await new Promise<void>((resolve) => { release = resolve; }); return result === "success" ? HttpResponse.json({ version: 37 }) : result === "network" ? HttpResponse.error() : HttpResponse.json({ code: "Validation.Failed", detail: "Anterior", errors: { salesEmail: ["Anterior"] } }, { status: 400 });
    }));
    const user = userEvent.setup(); const page = await editor(); await confirm(user); await waitFor(() => expect(release).toBeDefined());
    await user.click(within(await back(page)).getByRole("button", { name: "Seguir editando" })); expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Guardar cambios" })); const next = await screen.findByRole("dialog", { name: "¿Guardar la configuración?" });
    await finishMutation(page, release); expect(screen.getByRole("dialog")).toBe(next); expect(screen.queryByText("Anterior")).not.toBeInTheDocument(); expect(screen.queryByText("Guardamos la configuración.")).not.toBeInTheDocument();
    fireEvent.change(within(next).getByRole("textbox", { name: "Motivo" }), { target: { value: "Actual" } }); await user.click(within(next).getByRole("button", { name: "Guardar" })); await screen.findByText("Guardamos la configuración."); expect(versions).toEqual([1, 1]);
  });
  it.each(["success", "network", "field"] as const)("Salir abandona respuesta %s pendiente y conserva la ruta siguiente sin avisos", async (result) => {
    let release: (() => void) | undefined;
    server.use(http.put("/api/platform/settings", async () => { await new Promise<void>((resolve) => { release = resolve; }); return result === "success" ? HttpResponse.json({ version: 37 }) : result === "network" ? HttpResponse.error() : HttpResponse.json({ code: "Validation.Failed", detail: "Anterior", errors: { salesEmail: ["Anterior"] } }, { status: 400 }); }));
    const user = userEvent.setup(); const page = await editor(); await confirm(user); await waitFor(() => expect(release).toBeDefined());
    await user.click(within(await back(page)).getByRole("button", { name: "Salir sin guardar" })); await waitFor(() => expect(page.router.state.location.pathname).toBe("/plataforma/legales"));
    await finishMutation(page, release); expect(page.router.state.location.pathname).toBe("/plataforma/legales"); expect(screen.queryByText("Guardamos la configuración.")).not.toBeInTheDocument(); expect(screen.queryByText("Anterior")).not.toBeInTheDocument(); expect(screen.queryByRole("button", { name: "Reintentar" })).not.toBeInTheDocument();
  });
  it("Retry creado antes de Atrás consulta blocker vivo y queda inerte durante y después del bloqueo", async () => {
    let calls = 0; server.use(http.put("/api/platform/settings", () => { calls++; return HttpResponse.error(); }));
    const user = userEvent.setup(); const page = await editor(); await confirm(user); const retry = await screen.findByRole("button", { name: "Reintentar" });
    const leave = await back(page); await act(async () => { fireEvent.click(retry); }); await finishMutation(page); expect(calls).toBe(1); expect(screen.getByRole("dialog")).toBe(leave);
    await user.click(within(leave).getByRole("button", { name: "Seguir editando" })); await act(async () => { fireEvent.click(retry); }); expect(calls).toBe(1); expect(screen.getByRole("textbox", { name: "Correo de ventas" })).toHaveValue("nuevo@ejemplo.com");
  });
  it.each(["retry", "success", "network"] as const)("pérdida de permiso abandona %s sin HTTP ni efectos anteriores", async (result) => {
    let release: (() => void) | undefined; let calls = 0;
    server.use(http.put("/api/platform/settings", async () => { calls++; if (result === "retry") return HttpResponse.error(); await new Promise<void>((resolve) => { release = resolve; }); return result === "success" ? HttpResponse.json({ version: 37 }) : HttpResponse.error(); }));
    const user = userEvent.setup(); const page = await editor(); await confirm(user);
    const retry = result === "retry" ? await screen.findByRole("button", { name: "Reintentar" }) : undefined; if (!retry) await waitFor(() => expect(release).toBeDefined());
    await act(async () => { page.queryClient.setQueryData(currentUserQueryKey, { ...platformOperator, effectivePermissions: { ...platformOperator.effectivePermissions, platform: ["platform.legal.manage"] } }); });
    expect(await screen.findByRole("heading", { name: "No tenés permiso para ver esta página" })).toBeVisible();
    if (retry) await act(async () => { fireEvent.click(retry); }); await finishMutation(page, release);
    expect(calls).toBe(1); expect(screen.queryByText("Guardamos la configuración.")).not.toBeInTheDocument(); expect(screen.queryByRole("dialog", { hidden: true })).not.toBeInTheDocument();
  });
});
