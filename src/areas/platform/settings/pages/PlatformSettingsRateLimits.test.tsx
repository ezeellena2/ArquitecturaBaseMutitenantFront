import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { changeCulture, configureI18n } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { platformSettingsFixture } from "@/test/mocks/platformSettings";
import { server } from "@/test/mocks/server";
import { asPhone } from "@/test/utils/phone";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";

// F4 (Etapa 9, tableros Config-Plat y M-Config-Plat): los doce límites de uso como una sección más de Configuración, con el
// mismo «Guardar cambios», motivo y versión; pedidos y «cada» con su unidad, de 1 a 1.000.000 y de 1 segundo a 24 horas.
let bodies: Record<string, unknown>[];
beforeAll(async () => { await import("./PlatformSettingsPage"); });
beforeEach(async () => {
  await configureI18n(referenceDataFixture().cultures); await changeCulture("es-AR"); bodies = [];
  server.use(http.get("/api/platform/settings", () => HttpResponse.json(platformSettingsFixture)),
    http.put("/api/platform/settings", async ({ request }) => { bodies.push(await request.json() as Record<string, unknown>); return HttpResponse.json({ version: 2 }); }));
});
const field = (name: string) => screen.getByRole("textbox", { name });
const type = (name: string, value: string) => fireEvent.change(field(name), { target: { value } });

// Límite de 15 s: desde F4 la pantalla tiene los doce límites de uso con sus campos; sola tarda unos 2 s por test y con
// toda la suite se acerca a los 5 s por defecto.
describe("Límites de uso", { timeout: 15_000 }, () => {
  it("muestra los doce perfiles agrupados con sus valores de arranque", async () => {
    const { container } = renderRouteWithProviders("/plataforma/configuracion", { as: "platform-operator" });
    const group = await screen.findByRole("group", { name: "Límites de uso" });
    expect(within(group).getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)).toEqual(["Para todo el servicio", "Ingreso", "Asistente", "WhatsApp"]);
    expect(within(group).getAllByRole("textbox", { name: /^Pedidos · / })).toHaveLength(12);
    expect(field("Pedidos · Por dirección IP")).toHaveValue("300");
    expect(field("Cada · Por dirección IP")).toHaveValue("1");
    expect(screen.getByRole("combobox", { name: "Unidad · Por dirección IP" })).toHaveTextContent("minuto");
    expect(field("Pedidos · Pedir un código")).toHaveValue("20");
    expect(field("Cada · Pedir un código")).toHaveValue("15");
    expect(screen.getByRole("combobox", { name: "Unidad · Pedir un código" })).toHaveTextContent("minutos");
    expect(field("Pedidos · Por organización")).toHaveValue("600");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("guardar manda los doce límites, con la ventana en segundos, la versión y el motivo", async () => {
    const user = userEvent.setup(); renderRouteWithProviders("/plataforma/configuracion", { as: "platform-operator" });
    await screen.findByRole("group", { name: "Límites de uso" });
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeDisabled();
    type("Pedidos · Consultas fijas", "30");
    type("Cada · Probar una clave nueva", "1");
    const unit = screen.getByRole("combobox", { name: "Unidad · Probar una clave nueva" }); unit.focus(); await user.keyboard("{Enter}");
    await user.click(await screen.findByRole("option", { name: "hora" }));
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    const dialog = await screen.findByRole("dialog", { name: "¿Guardar la configuración?" });
    fireEvent.change(within(dialog).getByRole("textbox", { name: "Motivo" }), { target: { value: "Más consultas fijas para la campaña de octubre." } });
    await user.click(within(dialog).getByRole("button", { name: "Guardar" }));
    expect(await screen.findByText("Guardamos la configuración.")).toBeVisible();
    expect(bodies).toHaveLength(1);
    expect(bodies[0]).toMatchObject({ version: 1, reason: "Más consultas fijas para la campaña de octubre.",
      rateLimits: { ...platformSettingsFixture.rateLimits, assistantQuickQuery: { permitLimit: 30, windowSeconds: 60 }, assistantNewKey: { permitLimit: 3, windowSeconds: 3600 } } });
  });

  it.each([
    ["es-AR", "Usá un número de 1 a 1.000.000.", "Usá un tiempo de 1 segundo a 24 horas."],
    ["en-US", "Use a number from 1 to 1,000,000.", "Use a time from 1 second to 24 hours."],
  ])("con %s, un límite fuera de rango se dice debajo y no se manda", async (culture, requests, every) => {
    await changeCulture(culture);
    const user = userEvent.setup(); renderRouteWithProviders("/plataforma/configuracion", { as: culture === "es-AR" ? "platform-operator" : "platform-operator-english" });
    await screen.findByRole("group", { name: culture === "es-AR" ? "Límites de uso" : "Usage limits" });
    const quick = culture === "es-AR" ? "Consultas fijas" : "Quick queries"; const key = culture === "es-AR" ? "Probar una clave nueva" : "Test a new key";
    type(`${culture === "es-AR" ? "Pedidos" : "Requests"} · ${quick}`, "0");
    type(`${culture === "es-AR" ? "Cada" : "Every"} · ${key}`, "1500");
    await user.click(screen.getByRole("button", { name: culture === "es-AR" ? "Guardar cambios" : "Save changes" }));
    expect(await screen.findByText(requests)).toBeVisible();
    expect(screen.getByText(every)).toBeVisible();
    expect(field(`${culture === "es-AR" ? "Pedidos" : "Requests"} · ${quick}`)).toHaveAttribute("aria-invalid", "true");
    expect(field(`${culture === "es-AR" ? "Pedidos" : "Requests"} · ${quick}`)).toHaveAccessibleDescription(requests);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(bodies).toHaveLength(0);
    type(`${culture === "es-AR" ? "Pedidos" : "Requests"} · ${quick}`, "30");
    await waitFor(() => expect(screen.queryByText(requests)).not.toBeInTheDocument());
  });

  it("390: cada perfil es una fila «N cada M unidad», con el nombre arriba", async () => {
    asPhone();
    renderRouteWithProviders("/plataforma/configuracion", { as: "platform-operator" });
    const group = await screen.findByRole("group", { name: "Límites de uso" });
    expect(within(group).getAllByText("cada")).toHaveLength(12);
    expect(within(group).getByText("Avisos de Meta")).toBeVisible();
    expect(field("Pedidos · Avisos de Meta")).toHaveValue("120");
  });
});
