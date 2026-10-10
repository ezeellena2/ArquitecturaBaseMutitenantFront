import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { currentUserQueryKey } from "@/auth/useCurrentUser";
import type { UpdateOrganizationAssistantSettingsRequest } from "@/shared/api/types";
import { server } from "@/test/mocks/server";
import { asPhone } from "@/test/utils/phone";
import { assistantSettingsKey } from "../api/settings";
import { businessManager, firstModel, mountSettings, organizationSettings, platformManager, secondModel, settingsHandlers } from "./settingsTestSupport";

beforeAll(async () => { await import("./OrganizationAssistantSettingsPage"); await import("./PlatformAssistantSettingsPage"); });
beforeEach(() => { settingsHandlers(); });
afterEach(() => vi.unstubAllGlobals());
const scope = { access: "business" as const, tenantId: businessManager.activeTenantId ?? null, userId: businessManager.id };
const secret = "test-private-key-never-cache";
async function ownKey(app: ReturnType<typeof mountSettings>) {
  await app.user.click(await screen.findByRole("radio", { name: "La nuestra" }));
  await app.user.click(screen.getByRole("button", { name: "Cambiar" }));
  fireEvent.change(await screen.findByLabelText(/Clave de Anthropic/), { target: { value: secret } });
}
function publicCaches(app: ReturnType<typeof mountSettings>) {
  return JSON.stringify({ queries: app.client.getQueryCache().getAll().map((q) => q.state), mutations: app.client.getMutationCache().getAll().map((m) => ({ state: m.state, meta: m.meta })) });
}
async function savedMutation(app: ReturnType<typeof mountSettings>) {
  await waitFor(() => expect(app.client.getMutationCache().getAll().at(-1)?.state.status).toBe("error"));
  return app.client.getMutationCache().getAll().at(-1)!;
}

describe("configuración real de gestión", () => {
  it.each([businessManager, platformManager])("$access: la clave no es un campo de contraseña ni ofrece autocompletar", async (me) => {
    const app = mountSettings(me, me.access === "platform" ? "/plataforma/asistente/configuracion" : "/org/asistente/configuracion");
    if (me.access === "business") await app.user.click(await screen.findByRole("radio", { name: "La nuestra" }));
    await app.user.click(await screen.findByRole("button", { name: "Cambiar" }));
    const input = screen.getByLabelText(me.access === "platform" ? /Clave de la plataforma/ : /Clave de Anthropic/);
    expect(input).toHaveAttribute("type", "text");
    expect(input).toHaveClass("[-webkit-text-security:disc]");
    expect(input).toHaveAttribute("autocomplete", "off");
    for (const attribute of ["data-1p-ignore", "data-lpignore", "data-bwignore"]) expect(input).toHaveAttribute(attribute, "true");
    expect(input).toHaveAttribute("spellcheck", "false");
  });
  it("guardar una clave no remonta el formulario y conserva sólo el sufijo confirmado", async () => {
    server.use(http.put("/api/organization/assistant/settings", () => HttpResponse.json({ version: 11 })));
    const app = mountSettings();
    await ownKey(app);
    const form = screen.getByRole("form", { name: "Configuración" });
    await app.user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeDisabled());
    expect(screen.getByRole("form", { name: "Configuración" })).toBe(form);
    expect(screen.queryByLabelText(/Clave de Anthropic/)).not.toBeInTheDocument();
    expect(publicCaches(app)).not.toContain(secret);
  });
  it("gestiona sin chat.use; modelos por modo desde CC01, sin State ni catálogo de chat", async () => {
    let stateRequests = 0;
    server.use(http.get("/api/organization/assistant", () => { stateRequests++; return HttpResponse.json({}); }));
    const app = mountSettings();
    (await screen.findByRole("combobox", { name: "Modelo" })).focus(); await app.user.keyboard("{Enter}");
    expect(screen.getByRole("option", { name: firstModel.name })).toBeVisible();
    expect(screen.queryByRole("option", { name: secondModel.name })).not.toBeInTheDocument();
    await app.user.keyboard("{Escape}");
    await app.user.click(screen.getByRole("radio", { name: "La nuestra" }));
    screen.getByRole("combobox", { name: "Modelo" }).focus(); await app.user.keyboard("{Enter}");
    expect(screen.getByRole("option", { name: secondModel.name })).toBeVisible();
    expect(stateRequests).toBe(0);
    await app.user.keyboard("{Escape}"); await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
  });
  it.each([false, true])("GET confirmado restaura presupuesto canónico sin pisar edición posterior=%s", async (editingAgain) => {
    const initial = { ...organizationSettings(), mode: "OwnKey" as const };
    settingsHandlers(initial);
    const sent: UpdateOrganizationAssistantSettingsRequest[] = [];
    let releaseRead!: () => void;
    const heldRead = new Promise<void>((resolve) => { releaseRead = resolve; });
    server.use(http.get("/api/organization/assistant/settings", async () => {
      if (sent.length) await heldRead;
      return HttpResponse.json({ ...initial, version: sent.length ? 11 : 10 });
    }), http.put("/api/organization/assistant/settings", async ({ request }) => {
      sent.push(await request.json() as UpdateOrganizationAssistantSettingsRequest);
      return HttpResponse.json({ version: sent.length === 1 ? 11 : 12 });
    }));
    const app = mountSettings();
    await waitFor(() => expect(screen.getByRole("textbox", { name: "Tope del mes" })).toHaveValue("100,00"));
    fireEvent.change(screen.getByRole("textbox", { name: "Tope del mes" }), { target: { value: "" } });
    await app.user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeDisabled());
    expect(sent[0]).toMatchObject({ monthlyBudget: null, version: 10 });
    if (editingAgain) {
      fireEvent.change(screen.getByRole("textbox", { name: "Tope del mes" }), { target: { value: "150" } });
      await app.user.click(screen.getByRole("button", { name: "Cambiar" }));
      fireEvent.change(screen.getByLabelText(/Clave de Anthropic/), { target: { value: secret } });
    }
    await act(async () => { releaseRead(); });
    await waitFor(() => expect(app.client.getQueryData<{ version: number }>(assistantSettingsKey(scope))?.version).toBe(11));
    await waitFor(() => expect(screen.getByRole("textbox", { name: "Tope del mes" })).toHaveValue(editingAgain ? "150" : "100,00"));
    expect(publicCaches(app)).not.toContain(secret);
    if (editingAgain) {
      expect(screen.getByLabelText(/Clave de Anthropic/)).toHaveValue(secret);
      await app.user.click(screen.getByRole("button", { name: "Guardar cambios" }));
      await waitFor(() => expect(sent).toHaveLength(2));
      expect(sent[1]).toMatchObject({ version: 11, monthlyBudget: { amount: 150, currency: "USD" }, keyAction: "replace", apiKey: secret });
    } else {
      await app.user.click(screen.getByRole("button", { name: "Descartar cambios" }));
      expect(screen.getByRole("textbox", { name: "Tope del mes" })).toHaveValue("100,00");
      fireEvent.change(screen.getByRole("textbox", { name: "Tope del mes" }), { target: { value: "125" } });
      await app.user.click(screen.getByRole("button", { name: "Guardar cambios" }));
      await waitFor(() => expect(sent).toHaveLength(2));
      expect(sent[1]).toMatchObject({ version: 11, monthlyBudget: { amount: 125, currency: "USD" }, keyAction: "keep" });
    }
  });
  it("PlatformKey omite topes; la versión propia precede un GET ajeno y el siguiente guardado recibe 409", async () => {
    const sent: UpdateOrganizationAssistantSettingsRequest[] = [];
    const settings = organizationSettings(); settings.platformKeyModels.push(secondModel); settingsHandlers(settings);
    server.use(http.put("/api/organization/assistant/settings", async ({ request }) => { sent.push(await request.json() as UpdateOrganizationAssistantSettingsRequest); return sent.length === 1 ? HttpResponse.json({ version: 11 }) : HttpResponse.json({ code: "General.ConcurrencyConflict" }, { status: 409 }); }));
    const app = mountSettings();
    (await screen.findByRole("combobox", { name: "Modelo" })).focus(); await app.user.keyboard("{Enter}");
    await app.user.click(await screen.findByRole("option", { name: secondModel.name }));
    await app.user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(sent).toHaveLength(1));
    expect(sent[0]).toMatchObject({ version: 10, mode: "PlatformKey", keyAction: "keep", effort: "medium" });
    expect(sent[0]).not.toHaveProperty("dailyMessageLimit"); expect(sent[0]).not.toHaveProperty("monthlyBudget"); expect(sent[0]).not.toHaveProperty("apiKey");
    await waitFor(() => expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeDisabled());
    act(() => app.client.setQueryData(assistantSettingsKey(scope), { ...settings, version: 12 }));
    screen.getByRole("combobox", { name: "Modelo" }).focus(); await app.user.keyboard("{Enter}"); await app.user.click(screen.getByRole("option", { name: firstModel.name }));
    await app.user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(await screen.findByText("Otra persona cambió esto mientras lo editabas.")).toBeVisible();
    expect(sent[1].version).toBe(11);
    await app.user.click(screen.getByRole("button", { name: "Ver lo nuevo" }));
    const confirm = await screen.findByRole("dialog"); await app.user.click(within(confirm).getByRole("button", { name: "Salir sin guardar" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeDisabled());
  });
  it.each(["network", "server"])("la clave sólo cruza HTTP tras %s: Retry nativo conserva cuerpo, versión y clave idempotente", async (failure) => {
    const wire: Array<{ body: UpdateOrganizationAssistantSettingsRequest; key: string | null }> = [];
    server.use(http.put("/api/organization/assistant/settings", async ({ request }) => { wire.push({ body: await request.json() as UpdateOrganizationAssistantSettingsRequest, key: request.headers.get("Idempotency-Key") }); return wire.length === 1 ? failure === "network" ? HttpResponse.error() : HttpResponse.json({ code: "General.UnexpectedError" }, { status: 503 }) : HttpResponse.json({ version: 11 }); }));
    const app = mountSettings(); await ownKey(app);
    expect(publicCaches(app)).not.toContain(secret);
    await app.user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    const mutation = await savedMutation(app);
    expect(typeof mutation.state.variables).toBe("string"); expect(publicCaches(app)).not.toContain(secret);
    expect(screen.getByLabelText(/Clave de Anthropic/)).toHaveValue("");
    act(() => { app.client.setQueryData(["unrelated-list"], { value: true }); app.client.removeQueries({ queryKey: ["unrelated-list"] }); });
    await act(() => mutation.execute(mutation.state.variables));
    expect(wire).toHaveLength(2); expect(wire[1]).toEqual(wire[0]);
    expect(wire[0].body).toMatchObject({ apiKey: secret, keyAction: "replace", version: 10, mode: "OwnKey" });
    expect(wire[0].key).toBeTruthy(); expect(publicCaches(app)).not.toContain(secret);
    await act(async () => { await expect(mutation.execute(mutation.state.variables)).rejects.toMatchObject({ name: "AbortError" }); });
    expect(wire).toHaveLength(2);
  });
  it("Request.InProgress espera con envío bloqueado y reutiliza cuerpo privado y key", async () => {
    const wire: Array<{ body: UpdateOrganizationAssistantSettingsRequest; key: string | null }> = [];
    server.use(http.put("/api/organization/assistant/settings", async ({ request }) => {
      wire.push({ body: await request.json() as UpdateOrganizationAssistantSettingsRequest, key: request.headers.get("Idempotency-Key") });
      return wire.length === 1 ? HttpResponse.json({ code: "Request.InProgress" }, { status: 409, headers: { "Retry-After": "1" } }) : HttpResponse.json({ version: 11 });
    }));
    const app = mountSettings(); await ownKey(app); await app.user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(wire).toHaveLength(1));
    expect(screen.getByRole("button", { name: "Guardando…" })).toBeDisabled(); expect(publicCaches(app)).not.toContain(secret);
    await waitFor(() => expect(wire).toHaveLength(2)); expect(wire[1]).toEqual(wire[0]); expect(publicCaches(app)).not.toContain(secret);
  });
  it("OwnKey revocado conserva selección y permite elegir PlatformKey explícitamente", async () => {
    const settings = { ...organizationSettings(), mode: "OwnKey" as const, modelId: secondModel.id, allowOwnKey: false, ownKeyModels: [] }; settingsHandlers(settings);
    let body: UpdateOrganizationAssistantSettingsRequest | undefined;
    server.use(http.put("/api/organization/assistant/settings", async ({ request }) => { body = await request.json() as UpdateOrganizationAssistantSettingsRequest; return HttpResponse.json({ version: 11 }); }));
    const app = mountSettings();
    expect(await screen.findByRole("radio", { name: "La nuestra" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "La nuestra" })).toBeDisabled();
    expect(screen.getByRole("combobox", { name: "Modelo" })).toHaveTextContent(secondModel.id);
    await app.user.click(screen.getByRole("radio", { name: "La de la plataforma" }));
    screen.getByRole("combobox", { name: "Modelo" }).focus(); await app.user.keyboard("{Enter}"); await app.user.click(await screen.findByRole("option", { name: firstModel.name }));
    await app.user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(body).toBeDefined()); expect(body).toMatchObject({ mode: "PlatformKey", modelId: firstModel.id, keyAction: "keep" });
    expect(body).not.toHaveProperty("dailyMessageLimit"); expect(body).not.toHaveProperty("monthlyBudget");
  });
  it("una política revocada borra también una clave todavía no enviada", async () => {
    const app = mountSettings(); await ownKey(app);
    act(() => app.client.setQueryData(assistantSettingsKey(scope), { ...organizationSettings(), hasAlertRecipient: false }));
    expect(screen.getByLabelText(/Clave de Anthropic/)).toHaveValue(""); expect(publicCaches(app)).not.toContain(secret);
  });
  it("presupuesto opcional inválido no se convierte en null y descartar limpia el borrador del campo", async () => {
    settingsHandlers({ ...organizationSettings(), mode: "OwnKey" });
    let requests = 0; server.use(http.put("/api/organization/assistant/settings", () => { requests++; return HttpResponse.json({ version: 11 }); }));
    const app = mountSettings();
    const budget = await screen.findByRole("textbox", { name: "Tope del mes" });
    await waitFor(() => expect(budget).toBeEnabled());
    fireEvent.change(budget, { target: { value: "0,123" } }); fireEvent.blur(budget);
    await app.user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeEnabled());
    expect(requests).toBe(0);
    await app.user.click(screen.getByRole("button", { name: "Descartar cambios" }));
    expect(screen.getByRole("textbox", { name: "Tope del mes" })).toHaveValue("100,00");
  });
  it("respuesta retenida de otra organización no pisa borrador/versión ni invalida el nuevo scope", async () => {
    let release: (() => void) | undefined; let started = false;
    server.use(http.put("/api/organization/assistant/settings", async () => { started = true; await new Promise<void>((resolve) => { release = resolve; }); return HttpResponse.json({ version: 99 }); }));
    const app = mountSettings(); await ownKey(app); await app.user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(started).toBe(true));
    const fresh = { ...organizationSettings(), mode: "OwnKey" as const, version: 30 };
    server.use(http.get("/api/organization/assistant/settings", () => HttpResponse.json(fresh)));
    const invalidate = vi.spyOn(app.client, "invalidateQueries");
    act(() => app.client.setQueryData(currentUserQueryKey, { ...businessManager, activeTenantId: "new-organization" }));
    const daily = await screen.findByRole("textbox", { name: "Consultas por persona por día" }); fireEvent.change(daily, { target: { value: "77" } });
    await act(async () => { release?.(); });
    expect(daily).toHaveValue("77"); expect(invalidate).not.toHaveBeenCalled(); expect(publicCaches(app)).not.toContain(secret);
  });
  it.each(["edit", "discard", "unmount", "cacheclear", "mutationclear", "revoke", "blocked"] as const)("%s revoca Retry y borra la clave", async (action) => {
    let requests = 0;
    server.use(http.put("/api/organization/assistant/settings", () => { requests++; return HttpResponse.error(); }));
    const app = mountSettings(); await ownKey(app); await app.user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    const mutation = await savedMutation(app);
    if (action === "edit") fireEvent.change(screen.getByRole("textbox", { name: "Consultas por persona por día" }), { target: { value: "75" } });
    if (action === "discard") await app.user.click(screen.getByRole("button", { name: "Descartar cambios" }));
    if (action === "unmount") app.unmount();
    if (action === "cacheclear") act(() => app.client.clear());
    if (action === "mutationclear") act(() => app.client.getMutationCache().clear());
    if (action === "revoke") act(() => app.client.setQueryData(currentUserQueryKey, { ...businessManager, features: [] }));
    if (action === "blocked") { await act(() => app.router.navigate("/cuenta")); expect(await screen.findByRole("dialog", { name: "¿Salir sin guardar?" })).toBeVisible(); }
    await act(async () => { await expect(mutation.execute(mutation.state.variables)).rejects.toMatchObject({ name: "AbortError" }); });
    expect(requests).toBe(1); expect(publicCaches(app)).not.toContain(secret);
  });
  it("KeyRejected limpia secreto, mantiene error y permite escribir una clave nueva", async () => {
    const requests: UpdateOrganizationAssistantSettingsRequest[] = [];
    server.use(http.put("/api/organization/assistant/settings", async ({ request }) => { requests.push(await request.json() as UpdateOrganizationAssistantSettingsRequest); return requests.length === 1 ? HttpResponse.json({ code: "Assistant.Settings.KeyRejected" }, { status: 400 }) : HttpResponse.json({ version: 11 }); }));
    const app = mountSettings(); await ownKey(app); await app.user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(await screen.findByText("Anthropic rechazó la clave.")).toBeVisible(); expect(screen.getByLabelText(/Clave de Anthropic/)).toHaveValue("");
    expect(publicCaches(app)).not.toContain(secret);
    fireEvent.change(screen.getByLabelText(/Clave de Anthropic/), { target: { value: "another-private-key" } }); await app.user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(requests).toHaveLength(2)); expect(requests[1].apiKey).toBe("another-private-key");
  });
  it.each([
    ["Assistant.Model.NotAllowed", "Modelo", "Elegí un modelo activo permitido."],
    ["Validation.Failed", "Consultas por persona por día", "Tope rechazado por servidor"],
    ["Assistant.Settings.AlertRecipientRequired", "Clave", businessManager.organizations.find((row) => row.id === businessManager.activeTenantId)!.name],
  ])("%s conserva error de campo y revoca el Retry terminal", async (code, label, message) => {
    let calls = 0;
    server.use(http.put("/api/organization/assistant/settings", () => { calls++; return HttpResponse.json({ code, ...(code === "Validation.Failed" ? { errors: { dailyMessageLimit: [message] } } : {}) }, { status: 400 }); }));
    const app = mountSettings(); await ownKey(app); await app.user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    const mutation = await savedMutation(app);
    expect(screen.getByRole("alert")).toHaveTextContent(message);
    if (label === "Clave") expect(screen.getByRole("link", { name: "Agregar o verificar un correo" })).toHaveAttribute("href", "/cuenta");
    if (label !== "Clave") expect(screen.getByRole(label === "Modelo" ? "combobox" : "textbox", { name: label })).toHaveAttribute("aria-invalid", "true");
    expect(publicCaches(app)).not.toContain(secret);
    await act(async () => { await expect(mutation.execute(mutation.state.variables)).rejects.toMatchObject({ name: "AbortError" }); }); expect(calls).toBe(1);
  });
  it("sin destinatario muestra el nombre real, bloquea OwnKey y enlaza a Mi cuenta existente", async () => {
    const settings = organizationSettings(); settings.hasAlertRecipient = false; settingsHandlers(settings);
    const app = mountSettings(); await app.user.click(await screen.findByRole("radio", { name: "La nuestra" }));
    expect(screen.getByRole("link", { name: "Agregar o verificar un correo" })).toHaveAttribute("href", "/cuenta");
    expect(screen.getByRole("alert")).toHaveTextContent(businessManager.organizations.find((row) => row.id === businessManager.activeTenantId)!.name);
    await app.user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(app.client.getMutationCache().getAll()).toHaveLength(0);
  });
  it("390: configuración accesible con guardas de gestión independientes", async () => {
    asPhone(); const app = mountSettings(platformManager);
    await screen.findByRole("combobox", { name: "Modelo por defecto" });
    expect(await axe(app.container)).toHaveNoViolations();
  });
  it.each(["off", "forbidden", "unregistered"] as const)("%s no carga ConfigAPI", async (kind) => {
    let calls = 0; server.use(http.get("/api/organization/assistant/settings", () => { calls++; return HttpResponse.json(organizationSettings()); }));
    const me = kind === "off" ? { ...businessManager, features: [] } : kind === "forbidden" ? { ...businessManager, effectivePermissions: { organization: [], platform: [], companies: {} } } : businessManager;
    mountSettings(me, undefined, kind === "unregistered" ? [] : undefined);
    expect(await screen.findByRole("heading", { name: kind === "forbidden" ? "No tenés permiso para ver esta página" : "No encontramos esta página" })).toBeVisible(); expect(calls).toBe(0);
  });
});
