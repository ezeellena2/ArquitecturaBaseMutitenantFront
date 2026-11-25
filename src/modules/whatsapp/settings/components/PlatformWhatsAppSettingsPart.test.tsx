import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { changeCulture, configureI18n } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { platformSettingsFixture, platformWhatsAppSettingsFixture } from "@/test/mocks/platformSettings";
import { server } from "@/test/mocks/server";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";

const uruguay = { code: "UY", alpha3: "URY", numericCode: "858", callingCode: "598", defaultCurrencyCode: "ARS", defaultTimeZoneId: "America/Argentina/Buenos_Aires",
  name: "Uruguay", isEnabled: true, sortOrder: 2 };
const conflict = { type: "about:blank", title: "Conflicto", status: 409, code: "General.ConcurrencyConflict", traceId: "t" };

let sent: unknown[] = []; let core = 0;
beforeAll(async () => { await import("@/areas/platform/settings/pages/PlatformSettingsPage"); });
beforeEach(async () => {
  await configureI18n(referenceDataFixture().cultures); await changeCulture("es-AR");
  sent = []; core = 0;
  server.use(
    http.get("/api/reference-data", () => { const data = referenceDataFixture(); return HttpResponse.json({ ...data, countries: [...data.countries, uruguay] }); }),
    http.get("/api/platform/settings", () => HttpResponse.json(platformSettingsFixture)),
    http.put("/api/platform/settings", () => { core++; return HttpResponse.json({ version: 2 }); }),
    http.put("/api/platform/whatsapp/settings", async ({ request }) => { sent.push(await request.json()); return HttpResponse.json({ version: 2 }); }),
  );
});

async function open() {
  const view = renderRouteWithProviders("/plataforma/configuracion", { as: "platform-operator" });
  await screen.findByRole("textbox", { name: "Guardar los mensajes de los chats" });
  const section = screen.getByRole("region", { name: "WhatsApp" });
  return { ...view, section, user: userEvent.setup() };
}
async function pick(user: ReturnType<typeof userEvent.setup>, section: HTMLElement, country: string) {
  await user.click(within(section).getByRole("button", { name: /^Países que reciben códigos/ }));
  await user.click(within(await screen.findByRole("listbox", { name: "Países que reciben códigos" })).getByRole("option", { name: new RegExp(`^${country}`) }));
  await user.keyboard("{Escape}");
}

// Tablero Config-Plat-Base2 (270 y 272): la sección «WhatsApp» que el módulo suma antes de «Límites de uso».
describe("Configuración de Plataforma: WhatsApp", { timeout: 15_000 }, () => {
  it("muestra los países y los plazos con sus (i), antes de «Límites de uso»; axe", async () => {
    const { container, section } = await open();
    expect(within(section).getByRole("button", { name: /^Países que reciben códigos/ })).toHaveTextContent("Argentina");
    expect(within(section).getByRole("textbox", { name: "Guardar los mensajes de los chats" })).toHaveValue("90");
    expect(within(section).getByRole("textbox", { name: "Guardar los mensajes de los chats" })).toHaveAccessibleDescription("De 1 a 3.650 días. Los chats del número de Plataforma.");
    expect(within(section).getByRole("textbox", { name: "Máximo para las organizaciones" })).toHaveValue("3.650");
    expect(within(section).getByRole("textbox", { name: "Máximo para las organizaciones" })).toHaveAccessibleDescription("De 1 a 3.650 días. Ninguna organización guarda los mensajes de sus chats más que esto.");
    const regions = screen.getAllByRole("region").map((region) => region.getAttribute("aria-label") ?? region.textContent?.slice(0, 20));
    expect(regions.findIndex((name) => name?.startsWith("WhatsApp"))).toBeGreaterThan(regions.findIndex((name) => name?.startsWith("Privacidad")));
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeDisabled();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("al sumar un país avisa su costo y se guarda sin motivo, con su versión", async () => {
    const { section, user } = await open();
    await pick(user, section, "Uruguay");
    expect(within(section).getByRole("status")).toHaveTextContent("Los códigos a números de Uruguay se pagan con la tarifa de Meta para ese país.");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(sent).toEqual([{ ...platformWhatsAppSettingsFixture, allowedCountries: ["AR", "UY"], version: 1 }]));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(); expect(core).toBe(0);
    expect(await screen.findByText("Guardamos la configuración.")).toBeInTheDocument();
  });

  it("sin países dice «Sin países» y no guarda", async () => {
    const { section, user } = await open();
    await pick(user, section, "Argentina");
    expect(within(section).getByRole("button", { name: /^Países que reciben códigos/ })).toHaveTextContent("Sin países");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(await within(section).findByText("Elegí al menos un país.")).toBeInTheDocument();
    expect(sent).toEqual([]);
  });

  it("con el núcleo y la sección, primero el motivo y el núcleo, después la sección", async () => {
    const { section, user } = await open();
    const days = within(section).getByRole("textbox", { name: "Guardar los mensajes de los chats" });
    fireEvent.change(days, { target: { value: "120" } }); fireEvent.blur(days);
    const name = screen.getByRole("textbox", { name: "Nombre de la aplicación" });
    fireEvent.change(name, { target: { value: "Delta" } }); fireEvent.blur(name);
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    const dialog = await screen.findByRole("dialog", { name: "¿Guardar la configuración?" });
    fireEvent.change(within(dialog).getByRole("textbox", { name: "Motivo" }), { target: { value: "Plazos" } });
    await user.click(within(dialog).getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(sent).toEqual([{ ...platformWhatsAppSettingsFixture, chatRetentionDays: 120, version: 1 }]));
    expect(core).toBe(1);
  });

  it("un plazo fuera de rango que marca el back queda en su campo", async () => {
    server.use(http.put("/api/platform/whatsapp/settings", () => HttpResponse.json({ type: "about:blank", title: "Datos inválidos", status: 400, code: "Validation.Failed", traceId: "t",
      errors: { maxOrganizationChatRetentionDays: ["Tiene que ser de 1 a 3.650."] } }, { status: 400 })));
    const { section, user } = await open();
    const max = within(section).getByRole("textbox", { name: "Máximo para las organizaciones" });
    fireEvent.change(max, { target: { value: "365" } }); fireEvent.blur(max);
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(await within(section).findByText("Tiene que ser de 1 a 3.650.")).toBeInTheDocument();
  });

  it("si otra persona la cambió, el cartel de siempre y «Ver lo nuevo» relee la sección", async () => {
    server.use(http.put("/api/platform/whatsapp/settings", () => HttpResponse.json(conflict, { status: 409 })));
    const { section, user } = await open();
    const days = within(section).getByRole("textbox", { name: "Guardar los mensajes de los chats" });
    fireEvent.change(days, { target: { value: "30" } }); fireEvent.blur(days);
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(await screen.findByText("Otra persona cambió esto mientras lo editabas.")).toBeInTheDocument();
    server.use(http.get("/api/platform/whatsapp/settings", () => HttpResponse.json({ ...platformWhatsAppSettingsFixture, chatRetentionDays: 60, version: 3 })));
    await user.click(screen.getByRole("button", { name: "Ver lo nuevo" }));
    // Con lo editado sin guardar, «Ver lo nuevo» pregunta antes, como en el núcleo.
    await user.click(within(await screen.findByRole("dialog", { name: "¿Salir sin guardar?" })).getByRole("button", { name: "Salir sin guardar" }));
    await waitFor(() => expect(screen.getByRole("textbox", { name: "Guardar los mensajes de los chats" })).toHaveValue("60"));
    expect(screen.queryByText("Otra persona cambió esto mientras lo editabas.")).not.toBeInTheDocument();
  });
});
