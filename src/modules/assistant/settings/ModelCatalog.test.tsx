import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import type { AssistantModelPriceResponse, CreateAssistantModelRequest, UpdateAssistantModelRequest, UpdatePlatformAssistantSettingsRequest } from "@/shared/api/types";
import { server } from "@/test/mocks/server";
import { asPhone } from "@/test/utils/phone";
import { assistantSettingsKey } from "../api/settings";
import { firstModel, mountSettings, platformManager, platformSettings, secondModel, settingsHandlers } from "./settingsTestSupport";

beforeAll(async () => { await import("./PlatformAssistantSettingsPage"); });
beforeEach(() => settingsHandlers());
afterEach(() => vi.unstubAllGlobals());
const catalogPath = "/plataforma/asistente/configuracion?tab=catalog";
describe("catálogo y configuración de plataforma", () => {
  it("muestra cantidad y encabezados del catálogo sin filtros ajenos al tablero", async () => {
    const queries: URL[] = [];
    server.use(http.get("/api/platform/assistant/models", ({ request }) => {
      const query = new URL(request.url); queries.push(query);
      return HttpResponse.json({ items: [firstModel, { ...secondModel, isActive: false }], page: Number(query.searchParams.get("page")), pageSize: Number(query.searchParams.get("pageSize")), totalCount: 2 });
    }));
    mountSettings(platformManager, catalogPath + "&active=true&search=hidden");
    expect(await screen.findByRole("tab", { name: "Catálogo de modelos 2" })).toBeVisible();
    await screen.findByText(secondModel.name);
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Estado" })).not.toBeInTheDocument();
    for (const name of ["Modelo", "Proveedor", "ID", "Entrada por millón", "Salida por millón", "Estado", "Acciones"]) expect(screen.getByRole("columnheader", { name })).toBeVisible();
    expect(screen.getByText("Inactivo")).toBeVisible();
    expect(queries.every((url) => !url.searchParams.has("active") && !url.searchParams.has("search"))).toBe(true);
  });
  // Cuatro escrituras y tres GET retenidos forman una sola carrera de versiones; no se divide el recorrido.
  // Página precargada y suite aislada: el caso sigue superando 5 s bajo carga de la puerta paralela.
  it.each([[20, 21, 22, 23, 24, 25], [900, 50, 40, 30, 20, 10]])("GET intercalado conserva escritura propia y adopta lectura nueva sólo al descartar (tokens %j)", async (...tokens) => {
    const [initial, first, second, third, fresh, fourth] = tokens;
    let reads = 0; let releaseFirstGet!: () => void; let releaseSecondPut!: () => void; let releaseLastGet!: () => void;
    const firstGet = new Promise<void>((resolve) => { releaseFirstGet = resolve; });
    const secondPut = new Promise<void>((resolve) => { releaseSecondPut = resolve; });
    const lastGet = new Promise<void>((resolve) => { releaseLastGet = resolve; });
    const bodies: UpdatePlatformAssistantSettingsRequest[] = [];
    server.use(http.get("/api/platform/assistant/settings", async () => {
      const read = ++reads;
      if (read === 2) { await firstGet; return HttpResponse.json({ ...platformSettings(), dailyMessageLimit: 75, version: first }); }
      if (read > 2) { await lastGet; return HttpResponse.json({ ...platformSettings(), dailyMessageLimit: 100, version: fresh }); }
      return HttpResponse.json({ ...platformSettings(), version: initial });
    }), http.put("/api/platform/assistant/settings", async ({ request }) => {
      bodies.push(await request.json() as UpdatePlatformAssistantSettingsRequest); const write = bodies.length;
      if (write === 2) await secondPut;
      return HttpResponse.json({ version: [first, second, third, fourth][write - 1] });
    }));
    const app = mountSettings(platformManager);
    const key = assistantSettingsKey({ access: "platform", tenantId: platformManager.activeTenantId ?? null, userId: platformManager.id });
    try {
      await waitFor(() => expect(screen.getByRole("combobox", { name: "Modelo por defecto" })).toHaveTextContent(firstModel.name));
      fireEvent.change(screen.getByRole("textbox", { name: "Consultas por persona por día" }), { target: { value: "75" } });
      await app.user.click(screen.getByRole("button", { name: "Guardar cambios" })); await waitFor(() => expect(reads).toBe(2));
      await waitFor(() => expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeDisabled());
      fireEvent.change(screen.getByRole("textbox", { name: "Consultas por persona por día" }), { target: { value: "80" } });
      await app.user.click(screen.getByRole("button", { name: "Guardar cambios" })); await waitFor(() => expect(bodies).toHaveLength(2));
      await act(async () => releaseFirstGet()); await waitFor(() => expect(app.client.getQueryData<{ version: number }>(key)?.version).toBe(first));
      await act(async () => releaseSecondPut()); await waitFor(() => expect(reads).toBe(3));
      await waitFor(() => expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeDisabled());
      await app.user.click(screen.getByRole("button", { name: "Descartar cambios" }));
      expect(screen.getByRole("textbox", { name: "Consultas por persona por día" })).toHaveValue("80");
      fireEvent.change(screen.getByRole("textbox", { name: "Consultas por persona por día" }), { target: { value: "90" } });
      await app.user.click(screen.getByRole("button", { name: "Guardar cambios" })); await waitFor(() => expect(bodies).toHaveLength(3));
      expect(bodies[2].version).toBe(second); await waitFor(() => expect(reads).toBe(4));
      await act(async () => releaseLastGet()); await waitFor(() => expect(app.client.getQueryData<{ version: number }>(key)?.version).toBe(fresh));
      expect(screen.getByRole("textbox", { name: "Consultas por persona por día" })).toHaveValue("90");
      await app.user.click(screen.getByRole("button", { name: "Descartar cambios" }));
      expect(screen.getByRole("textbox", { name: "Consultas por persona por día" })).toHaveValue("100");
      fireEvent.change(screen.getByRole("textbox", { name: "Consultas por persona por día" }), { target: { value: "110" } });
      await app.user.click(screen.getByRole("button", { name: "Guardar cambios" })); await waitFor(() => expect(bodies).toHaveLength(4)); expect(bodies[3].version).toBe(fresh);
    } finally { app.unmount(); releaseFirstGet(); releaseSecondPut(); releaseLastGet(); }
  }, 10_000);
  it("descartes repetidos conservan valor y versión propios mientras el GET sigue retenido", async () => {
    let reads = 0; let release: (() => void) | undefined;
    const held = new Promise<void>((resolve) => { release = resolve; });
    const bodies: UpdatePlatformAssistantSettingsRequest[] = [];
    server.use(http.get("/api/platform/assistant/settings", async () => { reads++; if (reads > 1) await held; return HttpResponse.json(platformSettings()); }),
      http.put("/api/platform/assistant/settings", async ({ request }) => { bodies.push(await request.json() as UpdatePlatformAssistantSettingsRequest); return HttpResponse.json({ version: 20 + bodies.length }); }));
    const app = mountSettings(platformManager);
    try {
      await waitFor(() => expect(screen.getByRole("combobox", { name: "Modelo por defecto" })).toHaveTextContent(firstModel.name));
      fireEvent.change(screen.getByRole("textbox", { name: "Consultas por persona por día" }), { target: { value: "75" } });
      await app.user.click(screen.getByRole("button", { name: "Guardar cambios" }));
      await waitFor(() => expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeDisabled()); await waitFor(() => expect(reads).toBe(2));
      await app.user.click(screen.getByRole("button", { name: "Descartar cambios" }));
      expect(screen.getByRole("textbox", { name: "Consultas por persona por día" })).toHaveValue("75");
      fireEvent.change(screen.getByRole("textbox", { name: "Consultas por persona por día" }), { target: { value: "80" } });
      await app.user.click(screen.getByRole("button", { name: "Descartar cambios" }));
      expect(screen.getByRole("textbox", { name: "Consultas por persona por día" })).toHaveValue("75");
      fireEvent.change(screen.getByRole("textbox", { name: "Consultas por persona por día" }), { target: { value: "90" } });
      await app.user.click(screen.getByRole("button", { name: "Guardar cambios" })); await waitFor(() => expect(bodies).toHaveLength(2));
      expect(bodies[1]).toMatchObject({ version: 21, dailyMessageLimit: 90, keyAction: "keep" });
    } finally { app.unmount(); release?.(); }
  });
  it("dos escrituras replace→keep retienen hasKey confirmado y versión con GET retenido", async () => {
    let reads = 0; let release: (() => void) | undefined;
    const held = new Promise<void>((resolve) => { release = resolve; });
    const bodies: UpdatePlatformAssistantSettingsRequest[] = [];
    server.use(http.get("/api/platform/assistant/settings", async () => { reads++; if (reads > 1) await held; return HttpResponse.json({ ...platformSettings(), hasKey: false, maskedKeySuffix: null }); }),
      http.put("/api/platform/assistant/settings", async ({ request }) => { bodies.push(await request.json() as UpdatePlatformAssistantSettingsRequest); return HttpResponse.json({ version: 20 + bodies.length }); }));
    const app = mountSettings(platformManager);
    try {
      await waitFor(() => expect(screen.getByRole("combobox", { name: "Modelo por defecto" })).toHaveTextContent(firstModel.name));
      fireEvent.change(screen.getByLabelText(/Clave de la plataforma/), { target: { value: "private-double-write-key" } });
      await app.user.click(screen.getByRole("button", { name: "Guardar cambios" }));
      await waitFor(() => expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeDisabled()); await waitFor(() => expect(reads).toBe(2));
      expect(screen.queryByText("Sin configurar")).not.toBeInTheDocument(); expect(screen.getByRole("button", { name: "Cambiar" })).toBeVisible();
      fireEvent.change(screen.getByRole("textbox", { name: "Consultas por persona por día" }), { target: { value: "80" } });
      await app.user.click(screen.getByRole("button", { name: "Guardar cambios" })); await waitFor(() => expect(bodies).toHaveLength(2));
      await waitFor(() => expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeDisabled());
      expect(bodies[0]).toMatchObject({ version: 20, keyAction: "replace", apiKey: "private-double-write-key" });
      expect(bodies[1]).toMatchObject({ version: 21, keyAction: "keep" }); expect(bodies[1]).not.toHaveProperty("apiKey");
      expect(screen.queryByText("Sin configurar")).not.toBeInTheDocument(); expect(screen.getByRole("button", { name: "Cambiar" })).toBeVisible();
      await app.user.click(screen.getByRole("button", { name: "Descartar cambios" }));
      expect(screen.queryByText("Sin configurar")).not.toBeInTheDocument();
      expect(JSON.stringify({ queries: app.client.getQueryCache().getAll().map((query) => query.state), mutations: app.client.getMutationCache().getAll().map((mutation) => ({ state: mutation.state, meta: mutation.meta })) })).not.toContain("private-double-write-key");
    } finally { app.unmount(); release?.(); }
  });
  it("modelos permitidos describen tarifas de API con la presentación monetaria central", async () => {
    const app = mountSettings(platformManager);
    await waitFor(() => expect(screen.getByRole("combobox", { name: "Modelo por defecto" })).toHaveTextContent(firstModel.name));
    screen.getByRole("button", { name: "Modelos que pueden elegir las organizaciones" }).focus(); await app.user.keyboard("{Enter}");
    const option = await screen.findByRole("menuitemcheckbox", { name: firstModel.name });
    expect(option).toHaveAccessibleDescription("Entrada USD 0,13 · salida USD 1,00 por millón de tokens");
    await app.user.keyboard("{Escape}");
  });
  it("sin clave muestra Sin configurar y da prioridad al aviso de cambios", async () => {
    settingsHandlers(undefined, { ...platformSettings(), hasKey: false, maskedKeySuffix: null });
    const app = mountSettings(platformManager);
    await screen.findByLabelText(/Clave de la plataforma/);
    expect(screen.getByText("Sin configurar")).toBeVisible();
    fireEvent.change(screen.getByRole("textbox", { name: "Consultas por persona por día" }), { target: { value: "75" } });
    expect(screen.getByText("Cambios sin guardar")).toBeVisible(); expect(screen.queryByText("Sin configurar")).not.toBeInTheDocument();
    await app.user.click(screen.getByRole("button", { name: "Descartar cambios" })); expect(screen.getByText("Sin configurar")).toBeVisible();
  });
  it("esfuerzo expone tres radios visibles, admite flechas y guarda la elección", async () => {
    let body: UpdatePlatformAssistantSettingsRequest | undefined;
    server.use(http.put("/api/platform/assistant/settings", async ({ request }) => { body = await request.json() as UpdatePlatformAssistantSettingsRequest; return HttpResponse.json({ version: 21 }); }));
    const app = mountSettings(platformManager);
    const group = await screen.findByRole("radiogroup", { name: "Esfuerzo" });
    expect(within(group).getAllByRole("radio")).toHaveLength(3);
    const medium = within(group).getByRole("radio", { name: "Medio" }); expect(medium).toBeChecked();
    act(() => medium.focus()); await app.user.keyboard("{ArrowRight>}");
    await waitFor(() => expect(within(group).getByRole("radio", { name: "Alto" })).toBeChecked()); await app.user.keyboard("{/ArrowRight}");
    await app.user.click(screen.getByRole("button", { name: "Guardar cambios" })); await waitFor(() => expect(body?.effort).toBe("high"));
  });
  it("carga todas las páginas para la selección y guarda modelo/esfuerzo/ids del catálogo", async () => {
    const settings = platformSettings(); settings.defaultModelId = secondModel.id; settings.allowedModelIds = [secondModel.id]; settingsHandlers(undefined, settings);
    const pages: number[] = []; let body: UpdatePlatformAssistantSettingsRequest | undefined;
    const firstPage: AssistantModelPriceResponse[] = Array.from({ length: 100 }, (_, index) => ({ ...firstModel, id: `10000000-0000-4000-8000-${String(index).padStart(12, "0")}`, name: `Modelo ${index}` }));
    server.use(http.get("/api/platform/assistant/models", ({ request }) => { const page = Number(new URL(request.url).searchParams.get("page")); pages.push(page); return HttpResponse.json({ items: page === 1 ? firstPage : [secondModel], page, pageSize: 100, totalCount: 101 }); }),
      http.put("/api/platform/assistant/settings", async ({ request }) => { body = await request.json() as UpdatePlatformAssistantSettingsRequest; return HttpResponse.json({ version: 21 }); }));
    const app = mountSettings(platformManager);
    await waitFor(() => expect(screen.getByRole("combobox", { name: "Modelo por defecto" })).toHaveTextContent(secondModel.name));
    expect(pages).toEqual([1, 2]);
    fireEvent.change(screen.getByRole("textbox", { name: "Consultas por persona por día" }), { target: { value: "51" } });
    await app.user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(body).toBeDefined());
    expect(body).toMatchObject({ defaultModelId: secondModel.id, allowedModelIds: [secondModel.id], effort: "medium", version: 20, dailyMessageLimit: 51, monthlyOrganizationBudget: { amount: 100, currency: "USD" }, keyAction: "keep" });
  });
  it("la selección persistida inactiva queda visible y no se sustituye al guardar", async () => {
    server.use(http.get("/api/platform/assistant/models", () => HttpResponse.json({ items: [{ ...firstModel, isActive: false }, secondModel], page: 1, pageSize: 100, totalCount: 2 })));
    const app = mountSettings(platformManager);
    await waitFor(() => expect(screen.getByRole("combobox", { name: "Modelo por defecto" })).toHaveTextContent(`${firstModel.name} · No disponible`));
    fireEvent.change(screen.getByRole("textbox", { name: "Consultas por persona por día" }), { target: { value: "51" } });
    await app.user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(await screen.findAllByText("Elegí un modelo activo permitido.")).not.toHaveLength(0);
    expect(app.client.getMutationCache().getAll()).toHaveLength(0);
  });
  it("crea con tarifas0.125/0.123456 intactas tras blur, rechaza7decimales y conserva key en Retry", async () => {
    const wire: Array<{ body: CreateAssistantModelRequest; key: string | null }> = [];
    server.use(http.post("/api/platform/assistant/models", async ({ request }) => { wire.push({ body: await request.json() as CreateAssistantModelRequest, key: request.headers.get("Idempotency-Key") }); return wire.length === 1 ? HttpResponse.error() : HttpResponse.json({ id: "new", version: 1 }); }));
    const app = mountSettings(platformManager, catalogPath);
    const add = await screen.findByRole("button", { name: "Agregar modelo" }); await app.user.click(add);
    const dialog = await screen.findByRole("dialog", { name: "Agregar modelo" });
    expect(within(dialog).getByRole("button", { name: "Agregar modelo" })).toBeEnabled();
    fireEvent.change(within(dialog).getByRole("textbox", { name: "Nombre" }), { target: { value: "Nuevo modelo" } });
    fireEvent.change(within(dialog).getByRole("textbox", { name: "ID" }), { target: { value: "new-model" } });
    const input = within(dialog).getByRole("textbox", { name: "Precio de entrada por millón" });
    const output = within(dialog).getByRole("textbox", { name: "Precio de salida por millón" });
    await waitFor(() => expect(input).toBeEnabled());
    fireEvent.change(input, { target: { value: "0,125" } }); fireEvent.blur(input); expect(input).toHaveValue("0,125000");
    fireEvent.change(output, { target: { value: "0,1234567" } }); fireEvent.blur(output);
    await app.user.click(within(dialog).getByRole("button", { name: "Agregar modelo" })); expect(wire).toHaveLength(0);
    fireEvent.change(output, { target: { value: "0,123456" } }); fireEvent.blur(output); expect(output).toHaveValue("0,123456");
    await app.user.click(within(dialog).getByRole("button", { name: "Agregar modelo" }));
    await waitFor(() => expect(app.client.getMutationCache().getAll().at(-1)?.state.status).toBe("error"));
    const mutation = app.client.getMutationCache().getAll().at(-1)!;
    await act(() => mutation.execute(mutation.state.variables));
    expect(wire[1]).toEqual(wire[0]); expect(wire[0].key).toBeTruthy();
    expect(wire[0].body).toMatchObject({ inputPricePerMillion: { amount: 0.125, currency: "USD" }, outputPricePerMillion: { amount: 0.123456, currency: "USD" }, provider: "Anthropic", isActive: true });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument()); expect(add).toHaveFocus();
  });
  it("editar usa versión de apertura y cerrar abandona Retry; catálogo conserva presentación MinorUnits", async () => {
    const wire: UpdateAssistantModelRequest[] = [];
    server.use(http.put(`/api/platform/assistant/models/${firstModel.id}`, async ({ request }) => { wire.push(await request.json() as UpdateAssistantModelRequest); return HttpResponse.error(); }));
    const app = mountSettings(platformManager, catalogPath);
    (await screen.findByRole("button", { name: `Acciones de ${firstModel.name}` })).focus(); await app.user.keyboard("{Enter}");
    await app.user.click(await screen.findByRole("menuitem", { name: `Editar ${firstModel.name}` }));
    const dialog = await screen.findByRole("dialog", { name: "Editar modelo" });
    const price = within(dialog).getByRole("textbox", { name: "Precio de entrada por millón" }); expect(price).toHaveValue("0,125000");
    fireEvent.change(within(dialog).getByRole("textbox", { name: "Nombre" }), { target: { value: "Editado" } });
    await app.user.click(within(dialog).getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(wire).toHaveLength(1)); expect(wire[0].version).toBe(firstModel.version);
    await waitFor(() => expect(app.client.getMutationCache().getAll().at(-1)?.state.status).toBe("error")); const mutation = app.client.getMutationCache().getAll().at(-1)!;
    await app.user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    await act(async () => { await expect(mutation.execute(mutation.state.variables)).rejects.toMatchObject({ name: "AbortError" }); }); expect(wire).toHaveLength(1);
    expect(screen.getAllByText("USD 0,13")).not.toHaveLength(0);
  });
  it("cambiar de grupo cancela el Retry del diálogo de modelos con la señal del editor", async () => {
    let requests = 0;
    server.use(http.put(`/api/platform/assistant/models/${firstModel.id}`, () => { requests++; return HttpResponse.error(); }));
    const app = mountSettings(platformManager, catalogPath);
    (await screen.findByRole("button", { name: `Acciones de ${firstModel.name}` })).focus(); await app.user.keyboard("{Enter}");
    await app.user.click(await screen.findByRole("menuitem", { name: `Editar ${firstModel.name}` }));
    const dialog = await screen.findByRole("dialog", { name: "Editar modelo" });
    fireEvent.change(within(dialog).getByRole("textbox", { name: "Nombre" }), { target: { value: "Cambio privado del diálogo" } });
    await app.user.click(within(dialog).getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(app.client.getMutationCache().getAll().at(-1)?.state.status).toBe("error"));
    const mutation = app.client.getMutationCache().getAll().at(-1)!;
    await act(() => app.router.navigate("?tab=general"));
    await act(async () => { await expect(mutation.execute(mutation.state.variables)).rejects.toMatchObject({ name: "AbortError" }); });
    expect(requests).toBe(1);
    expect(app.router.state.location.search).toBe("?tab=general");
    await app.user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
  });
  it("editar se apaga sólo sin cambios y anuncia el guardado HTTP pendiente sin duplicarlo", async () => {
    const wire: UpdateAssistantModelRequest[] = [];
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    server.use(http.put(`/api/platform/assistant/models/${firstModel.id}`, async ({ request }) => {
      wire.push(await request.json() as UpdateAssistantModelRequest);
      await gate;
      return HttpResponse.json({ version: 4 });
    }));
    const app = mountSettings(platformManager, catalogPath);
    (await screen.findByRole("button", { name: `Acciones de ${firstModel.name}` })).focus();
    await app.user.keyboard("{Enter}");
    await app.user.click(await screen.findByRole("menuitem", { name: `Editar ${firstModel.name}` }));
    const dialog = await screen.findByRole("dialog", { name: "Editar modelo" });
    const name = within(dialog).getByRole("textbox", { name: "Nombre" });
    const save = within(dialog).getByRole("button", { name: "Guardar cambios" });
    expect(save).toBeDisabled();
    fireEvent.change(name, { target: { value: "Nombre nuevo" } });
    expect(save).toBeEnabled();
    fireEvent.change(name, { target: { value: firstModel.name } });
    expect(save).toBeDisabled();
    fireEvent.change(name, { target: { value: "Nombre nuevo" } });
    await app.user.click(save);
    try {
      await waitFor(() => expect(wire).toHaveLength(1));
      const saving = within(dialog).getByRole("button", { name: "Guardando…" });
      expect(saving).toBeDisabled();
      await app.user.click(saving);
      expect(wire).toHaveLength(1);
      expect(name).toHaveValue("Nombre nuevo");
    } finally {
      await act(async () => { release(); await gate; });
    }
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
  it("la pestaña vive en URL y protege el borrador antes de abandonarlo", async () => {
    const app = mountSettings(platformManager);
    fireEvent.change(await screen.findByRole("textbox", { name: "Consultas por persona por día" }), { target: { value: "77" } });
    await app.user.click(screen.getByRole("tab", { name: /^Catálogo de modelos/ }));
    const dialog = await screen.findByRole("dialog", { name: "¿Salir sin guardar?" });
    expect(app.router.state.location.search).toBe(""); await app.user.click(within(dialog).getByRole("button", { name: "Salir sin guardar" }));
    await waitFor(() => expect(app.router.state.location.search).toBe("?tab=catalog"));
    await app.user.click(screen.getByRole("tab", { name: "General" }));
    expect(await screen.findByRole("textbox", { name: "Consultas por persona por día" })).toHaveValue("50");
  });
  it("390: una sola hoja de edición, foco al cerrar y axe", async () => {
    asPhone(); const app = mountSettings(platformManager, catalogPath);
    const actions = await screen.findByRole("button", { name: `Acciones de ${firstModel.name}` }); await app.user.click(actions);
    await app.user.click(await screen.findByRole("menuitem", { name: `Editar ${firstModel.name}` }));
    const dialog = await screen.findByRole("dialog", { name: "Editar modelo" }); expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(await axe(dialog)).toHaveNoViolations();
    await app.user.click(within(dialog).getByRole("button", { name: "Cancelar" })); await waitFor(() => expect(actions).toHaveFocus());
  });
});
