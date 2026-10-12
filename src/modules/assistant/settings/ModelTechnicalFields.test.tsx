import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import type { UpdateAssistantModelRequest } from "@/modules/assistant/api/types";
import { server } from "@/test/mocks/server";
import { asPhone } from "@/test/utils/phone";
import { firstModel, mountSettings, platformManager, settingsHandlers } from "./settingsTestSupport";

beforeAll(async () => {
  await import("./PlatformAssistantSettingsPage");
  // Precarga el motor antes del primer recorrido; la auditoría del diálogo
  // completo conserva sus mismas aserciones en escritorio y teléfono.
  await axe("<main></main>");
});
beforeEach(() => settingsHandlers());
afterEach(() => vi.unstubAllGlobals());
const catalogPath = "/plataforma/asistente/configuracion?tab=catalog";
async function openEditor() {
  const app = mountSettings(platformManager, catalogPath);
  (await screen.findByRole("button", { name: `Acciones de ${firstModel.name}` })).focus();
  await app.user.keyboard("{Enter}");
  await app.user.click(await screen.findByRole("menuitem", { name: `Editar ${firstModel.name}` }));
  return { app, dialog: await screen.findByRole("dialog", { name: "Editar modelo" }) };
}
function write(group: HTMLElement, name: string, value: string) {
  const field = within(group).getByRole("textbox", { name });
  fireEvent.change(field, { target: { value } }); fireEvent.blur(field);
}
const completeTier = { inputTokensThreshold: 100000, inputPricePerMillion: { amount: 0.5, currency: "USD" }, outputPricePerMillion: { amount: 1, currency: "USD" },
  cacheReadPricePerMillion: { amount: 0.1, currency: "USD" }, cacheWrite5MinutesPricePerMillion: { amount: 0.6, currency: "USD" }, cacheWrite1HourPricePerMillion: { amount: 0.8, currency: "USD" } };
function readWithTier() {
  server.use(http.get("/api/platform/assistant/models", () => HttpResponse.json({ items: [{ ...firstModel, technical: { ...firstModel.technical, longContext: completeTier } }], page: 1, pageSize: 100, totalCount: 1 })));
}
describe("metadatos editables del catálogo", () => {
  it.each([false, true])("precarga datos publicados, conserva versión y envía técnico sin revisión sintetizada (390px %s)", async (phone) => {
    if (phone) asPhone();
    let body: UpdateAssistantModelRequest | undefined;
    server.use(http.put(`/api/platform/assistant/models/${firstModel.id}`, async ({ request }) => {
      body = await request.json() as UpdateAssistantModelRequest; return HttpResponse.json({ version: 4 });
    }));
    const { app, dialog } = await openEditor();
    const advanced = within(dialog).getByRole("button", { name: "Avanzado: datos técnicos" });
    expect(advanced).toHaveAttribute("aria-expanded", "false");
    expect(within(dialog).queryByRole("textbox", { name: "Contexto (tokens)" })).not.toBeInTheDocument();
    await app.user.click(advanced);
    for (const name of ["Texto", "Herramientas", "Imágenes en los adjuntos", "PDF en los adjuntos", "Pensamiento adaptativo", "Bajo", "Medio", "Alto"])
      expect(within(dialog).getByRole("checkbox", { name })).toBeChecked();
    expect(within(dialog).getByRole("textbox", { name: "Contexto (tokens)" })).toHaveValue("200.000");
    expect(within(dialog).getByRole("textbox", { name: "Salida máxima (tokens)" })).toHaveValue("4.096");
    const cache = within(dialog).getByRole("group", { name: "Caché · por millón de tokens" });
    expect(within(cache).getByRole("textbox", { name: "Lectura de caché" })).toHaveValue("0,010000");
    expect(within(cache).getByRole("textbox", { name: "Escritura de 5 minutos" })).toHaveValue("0,150000");
    expect(within(cache).getByRole("textbox", { name: "Escritura de 1 hora" })).toHaveValue("0,250000");
    expect(await axe(dialog)).toHaveNoViolations();
    write(dialog, "Nombre", "Modelo editado");
    await app.user.click(within(dialog).getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(body).toBeDefined());
    expect(body?.technical).toEqual(firstModel.technical);
    expect(body?.version).toBe(firstModel.version);
    expect(body).not.toHaveProperty("technicalRevision");
  });
  it("datos legacy quedan vacíos y el intento de guardar abre Avanzado sin escribir", async () => {
    let writes = 0;
    server.use(http.get("/api/platform/assistant/models", () => HttpResponse.json({ items: [{ ...firstModel, technical: null, technicalRevision: null }], page: 1, pageSize: 100, totalCount: 1 })),
      http.put(`/api/platform/assistant/models/${firstModel.id}`, () => { writes++; return HttpResponse.json({ version: 4 }); }));
    const { app, dialog } = await openEditor();
    write(dialog, "Nombre", "Herencia explícita");
    await app.user.click(within(dialog).getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(within(dialog).getByRole("button", { name: "Avanzado: datos técnicos" })).toHaveAttribute("aria-expanded", "true"));
    expect(within(dialog).getByRole("textbox", { name: "Contexto (tokens)" })).toHaveValue("");
    expect(within(dialog).getByRole("textbox", { name: "Salida máxima (tokens)" })).toHaveValue("");
    expect(await within(dialog).findByText("Elegí al menos un esfuerzo.")).toBeVisible();
    expect(writes).toBe(0);
  });
  it("el tramo largo parcial y los límites incoherentes no alcanzan HTTP", async () => {
    let writes = 0;
    server.use(http.put(`/api/platform/assistant/models/${firstModel.id}`, () => { writes++; return HttpResponse.json({ version: 4 }); }));
    const { app, dialog } = await openEditor();
    await app.user.click(within(dialog).getByRole("button", { name: "Avanzado: datos técnicos" }));
    write(dialog, "Salida máxima (tokens)", "2147483647");
    await app.user.click(within(dialog).getByRole("button", { name: "Guardar cambios" }));
    expect(await within(dialog).findByText("La salida máxima no puede superar el contexto.")).toBeVisible();
    expect(writes).toBe(0);
    write(dialog, "Salida máxima (tokens)", "2048");
    const tier = within(dialog).getByRole("group", { name: "Contexto largo Opcional" });
    write(tier, "Entrada por millón", "0,2");
    await app.user.click(within(dialog).getByRole("button", { name: "Guardar cambios" }));
    await within(tier).findAllByText("Ingresá una tarifa mayor que cero en USD.");
    expect(within(tier).getAllByText("Ingresá una tarifa mayor que cero en USD.")).not.toHaveLength(0);
    expect(writes).toBe(0);
  });
  it("un error anidado del servidor abre el grupo y queda en su campo", async () => {
    server.use(http.put(`/api/platform/assistant/models/${firstModel.id}`, () => HttpResponse.json({ code: "General.ValidationError", detail: "Revisá los datos.",
      errors: { "technical.cacheReadPricePerMillion": ["Tarifa rechazada por el servicio."] } }, { status: 400 })));
    const { app, dialog } = await openEditor();
    write(dialog, "Nombre", "Cambio validado");
    await app.user.click(within(dialog).getByRole("button", { name: "Guardar cambios" }));
    expect(await within(dialog).findByText("Tarifa rechazada por el servicio.")).toBeVisible();
    expect(within(dialog).getByRole("button", { name: "Avanzado: datos técnicos" })).toHaveAttribute("aria-expanded", "true");
    const cache = within(dialog).getByRole("group", { name: "Caché · por millón de tokens" });
    expect(within(cache).getByRole("textbox", { name: "Lectura de caché" })).toHaveAccessibleDescription("Tarifa rechazada por el servicio.");
    expect(within(dialog).queryByText("Revisá los datos.")).not.toBeInTheDocument();
    expect(await axe(dialog)).toHaveNoViolations();
  });
  it("un borrador opcional inválido permite validar, sobrevive al plegado y no se confunde con tramo vacío", async () => {
    let writes = 0;
    server.use(http.put(`/api/platform/assistant/models/${firstModel.id}`, () => { writes++; return HttpResponse.json({ version: 4 }); }));
    const { app, dialog } = await openEditor();
    const advanced = within(dialog).getByRole("button", { name: "Avanzado: datos técnicos" });
    await app.user.click(advanced);
    const tier = within(dialog).getByRole("group", { name: "Contexto largo Opcional" });
    write(tier, "Lectura de caché", "0,1234567");
    const save = within(dialog).getByRole("button", { name: "Guardar cambios" });
    expect(save).toBeEnabled();
    await app.user.click(advanced); await app.user.click(save);
    await waitFor(() => expect(advanced).toHaveAttribute("aria-expanded", "true"));
    expect(within(tier).getByRole("textbox", { name: "Lectura de caché" })).toHaveValue("0,1234567");
    expect(await within(tier).findByText("Ingresá una tarifa mayor que cero en USD.")).toBeVisible();
    expect(writes).toBe(0);
    write(tier, "Lectura de caché", "");
    expect(save).toBeDisabled();
  });
  it("precarga los seis valores de contexto largo y al vaciarlos envía null", async () => {
    readWithTier(); let body: UpdateAssistantModelRequest | undefined;
    server.use(http.put(`/api/platform/assistant/models/${firstModel.id}`, async ({ request }) => { body = await request.json() as UpdateAssistantModelRequest; return HttpResponse.json({ version: 4 }); }));
    const { app, dialog } = await openEditor();
    await app.user.click(within(dialog).getByRole("button", { name: "Avanzado: datos técnicos" }));
    const tier = within(dialog).getByRole("group", { name: "Contexto largo Opcional" });
    expect(within(tier).getByRole("textbox", { name: "Desde (tokens)" })).toHaveValue("100.000");
    expect(within(tier).getByRole("textbox", { name: "Lectura de caché" })).toHaveValue("0,100000");
    for (const name of ["Desde (tokens)", "Entrada por millón", "Salida por millón", "Lectura de caché", "Escritura de 5 minutos", "Escritura de 1 hora"]) write(tier, name, "");
    await app.user.click(within(dialog).getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(body?.technical.longContext).toBeNull()); expect(body?.version).toBe(firstModel.version);
  });
  it("el error profundo del contrato va a su tarifa y un campo desconocido conserva FormError", async () => {
    readWithTier();
    server.use(http.put(`/api/platform/assistant/models/${firstModel.id}`, () => HttpResponse.json({ code: "General.ValidationError", detail: "Error general del catálogo.",
      errors: { "technical.longContext.cacheReadPricePerMillion.amount": ["Tarifa larga rechazada."], "technical.futureField": ["Dato sin campo."] } }, { status: 400 })));
    const { app, dialog } = await openEditor(); write(dialog, "Nombre", "Cambio profundo");
    await app.user.click(within(dialog).getByRole("button", { name: "Guardar cambios" }));
    expect(await within(dialog).findByText("Error general del catálogo.")).toBeVisible();
    const tier = within(dialog).getByRole("group", { name: "Contexto largo Opcional" });
    expect(within(tier).getByRole("textbox", { name: "Lectura de caché" })).toHaveAccessibleDescription("Tarifa larga rechazada.");
    expect(within(dialog).getByRole("button", { name: "Avanzado: datos técnicos" })).toHaveAttribute("aria-expanded", "true");
  });
});
