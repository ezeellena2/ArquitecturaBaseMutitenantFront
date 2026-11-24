import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import type { OrganizationAssistantSettingsResponse, PlatformAssistantSettingsResponse } from "@/modules/assistant/api/types";
import { server } from "@/test/mocks/server";
import { asPhone } from "@/test/utils/phone";
import { businessManager, firstModel, mountSettings, organizationSettings, platformManager, platformSettings, settingsHandlers } from "./settingsTestSupport";

// Cada falla del proveedor en las dos configuraciones (0064 §6 y §7; Asistente-Config-Org, Plat-Asistente-Config y sus M-):
// en la clave, en el modelo o en la banda, según quién paga. El back manda solo la que arregla quien mira.
beforeAll(async () => { await import("./OrganizationAssistantSettingsPage"); await import("./PlatformAssistantSettingsPage"); await axe("<main></main>"); });
beforeEach(() => settingsHandlers());
afterEach(() => vi.unstubAllGlobals());
const ownKey = (patch: Partial<OrganizationAssistantSettingsResponse>): OrganizationAssistantSettingsResponse => ({ ...organizationSettings(), mode: "OwnKey", ...patch });
function organization(settings: OrganizationAssistantSettingsResponse) { settingsHandlers(settings); return mountSettings(businessManager); }
function platform(settings: PlatformAssistantSettingsResponse) { settingsHandlers(undefined, settings); return mountSettings(platformManager); }

describe("las fallas del proveedor en la configuración", () => {
  it.each([
    ["Assistant.Provider.CredentialRejected", "El proveedor rechazó la clave. Reemplazala."],
    ["Assistant.Provider.KeyUnreadable", "No pudimos leer la clave guardada: reemplazala."],
  ])("con su clave, %s va en la clave con «Reemplazar clave»", async (code, text) => {
    const app = organization(ownKey({ providerIssue: code }));
    const key = await screen.findByRole("group", { name: "Clave de Anthropic" });
    expect(screen.getByRole("alert")).toHaveTextContent(text);
    expect(within(key).queryByRole("button", { name: "Cambiar" })).not.toBeInTheDocument();
    expect(await axe(app.container)).toHaveNoViolations();
    await app.user.click(within(key).getByRole("button", { name: "Reemplazar clave" }));
    expect(await screen.findByLabelText(/Clave de Anthropic/u)).toHaveValue("");
    expect(screen.queryByText(text)).not.toBeInTheDocument();
  });

  it("con su clave, el modelo no aceptado va en el modelo hasta que se elige otro", async () => {
    organization(ownKey({ providerIssue: "Assistant.Provider.ModelRejected" }));
    const model = await screen.findByRole("combobox", { name: "Modelo" });
    expect(model).toHaveAccessibleDescription("El proveedor no aceptó el modelo configurado. Elegí otro.");
    expect(screen.queryByRole("status", { name: /cupo|conectarnos/u })).not.toBeInTheDocument();
  });

  it.each([
    ["Assistant.Provider.Limited", "La cuenta del proveedor llegó a su cupo o a su límite de uso. Revisalo en el proveedor."],
    ["Assistant.Provider.Unavailable", "No pudimos conectarnos con el proveedor. No se envió nada."],
  ])("con su clave, %s va en la banda, debajo del título", async (code, text) => {
    organization(ownKey({ providerIssue: code }));
    const band = await screen.findByText(text);
    expect(band.closest("[data-slot=page-subline]")).not.toBeNull();
    expect(band.closest("[role=status]")).not.toBeNull();
    expect(screen.getByRole("group", { name: "Clave de Anthropic" })).toHaveTextContent("•••• last");
  });

  it("con la clave de la plataforma, la organización ve que lo resuelve la plataforma", async () => {
    organization({ ...organizationSettings(), providerIssue: "Assistant.Provider.PlatformUnavailable" });
    expect(await screen.findByText("El asistente no está disponible por ahora. Lo está resolviendo la plataforma.")).toBeVisible();
  });

  it("un código que esta versión no conoce no se muestra", async () => {
    organization(ownKey({ providerIssue: "Assistant.Provider.SomethingNew" }));
    await screen.findByRole("group", { name: "Clave de Anthropic" });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Clave de Anthropic" })).toHaveTextContent("Cambiar");
  });

  it("con un proveedor desconocido, la conexión queda en pausa: se elige el proveedor, la clave y el modelo", async () => {
    const puts: unknown[] = [];
    server.use(http.put("/api/organization/assistant/settings", async ({ request }) => { puts.push(await request.json()); return HttpResponse.json({ version: 11 }); }));
    const app = organization(ownKey({ unsupportedProvider: true }));
    expect(await screen.findByText("La conexión quedó en pausa: esta versión no reconoce el proveedor guardado. Guardá para elegir uno y cargar la clave.")).toBeVisible();
    expect(screen.getByRole("combobox", { name: "Proveedor" })).toHaveTextContent("Elegí un proveedor");
    expect(screen.getByRole("combobox", { name: "Modelo" })).toHaveTextContent("Elegí un modelo");
    expect(screen.getByLabelText(/Clave de Anthropic/u)).toHaveValue("");
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Clave de Anthropic/u), { target: { value: "clave-nueva-de-prueba" } });
    await app.user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(await screen.findAllByText("Elegí un modelo activo permitido.")).not.toHaveLength(0);
    expect(puts).toHaveLength(0);
  });

  it.each([false, true])("en Plataforma, cada falla del operador en su lugar; teléfono %s", async (phone) => {
    if (phone) asPhone();
    platform({ ...platformSettings(), providerIssue: "Assistant.Provider.Unavailable" });
    const band = await screen.findByText("No pudimos conectarnos con el proveedor. No se envió nada.");
    expect(band.closest("[data-slot=page-subline]") === null).toBe(phone);
    await waitFor(() => expect(screen.getByRole("combobox", { name: "Modelo por defecto" })).toHaveTextContent(firstModel.name));
  });

  it("en Plataforma, la clave rechazada y el proveedor desconocido", async () => {
    const view = platform({ ...platformSettings(), providerIssue: "Assistant.Provider.CredentialRejected" });
    const key = await screen.findByRole("group", { name: "Clave de la plataforma" });
    expect(within(key).getByRole("button", { name: "Reemplazar clave" })).toBeVisible();
    expect(screen.getByRole("alert")).toHaveTextContent("El proveedor rechazó la clave. Reemplazala.");
    view.unmount();
    platform({ ...platformSettings(), unsupportedProvider: true });
    expect(await screen.findByText(/La conexión quedó en pausa/u)).toBeVisible();
    expect(screen.getByRole("combobox", { name: "Modelo por defecto" })).toHaveTextContent("Elegí un modelo");
    expect(screen.getByLabelText(/Clave de la plataforma/u)).toHaveValue("");
  });
});
