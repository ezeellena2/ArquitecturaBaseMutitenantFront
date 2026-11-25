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

beforeAll(async () => { await import("./PlatformSettingsPage"); });
beforeEach(async () => {
  await configureI18n(referenceDataFixture().cultures); await changeCulture("es-AR");
  server.use(http.get("/api/platform/settings", () => HttpResponse.json(platformSettingsFixture)), http.put("/api/platform/settings", () => HttpResponse.json({ version: 2 })));
});
const change = (name: string, value: string) => { const input = screen.getByRole("textbox", { name }); fireEvent.change(input, { target: { value } }); fireEvent.blur(input); };
async function send(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
  const dialog = await screen.findByRole("dialog", { name: "¿Guardar la configuración?" });
  fireEvent.change(within(dialog).getByRole("textbox", { name: "Motivo" }), { target: { value: "Reglas en pantalla" } });
  await user.click(within(dialog).getByRole("button", { name: "Guardar" }));
}

// Tablero Config-Plat-Base2 (272 y 273): «Nombre y correos» con «Así llega» y «Privacidad y retención».
describe("Configuración de Plataforma: las reglas en pantalla", { timeout: 15_000 }, () => {
  it("muestra lo guardado con sus (i), sus unidades y el correo de un código; axe", async () => {
    const { container } = renderRouteWithProviders("/plataforma/configuracion", { as: "platform-operator" });
    expect(await screen.findByRole("textbox", { name: "Nombre de la aplicación" })).toHaveValue("ArquitecturaBase");
    expect(screen.getByRole("textbox", { name: "Nombre del remitente" })).toHaveValue("ArquitecturaBase");
    expect(screen.getByRole("textbox", { name: "Logo de los correos" })).toHaveValue("");
    expect(screen.getByRole("textbox", { name: "Logo de los correos" })).toHaveAttribute("placeholder", "https://");
    const privacy = screen.getByRole("region", { name: "Privacidad y retención" });
    expect(within(privacy).getByRole("textbox", { name: "Datos de los ingresos" })).toHaveValue("12"); expect(within(privacy).getByText("meses")).toBeVisible();
    expect(within(privacy).getByRole("textbox", { name: "Códigos y enlaces" })).toHaveValue("30");
    expect(within(privacy).getByRole("textbox", { name: "Invitaciones cerradas" })).toHaveValue("30"); expect(within(privacy).getAllByText("días")).toHaveLength(2);
    expect(screen.getByRole("textbox", { name: "Datos de los ingresos" })).toHaveAccessibleDescription("De 1 a 120 meses. Pasado el plazo se borra la dirección IP y el navegador de cada ingreso.");
    expect(screen.getByRole("textbox", { name: "Invitaciones cerradas" })).toHaveAccessibleDescription("De 7 a 3.650 días. Una invitación aceptada, revocada o vencida.");
    expect(screen.getByRole("textbox", { name: "Nombre de la aplicación" })).toHaveAccessibleDescription("Hasta 60 caracteres. Va en los correos, los mensajes del bot de WhatsApp y la pestaña del navegador.");
    const mail = screen.getByRole("group", { name: "Así llega el correo de un código" });
    expect(mail).toHaveTextContent("483920 es tu código de acceso a ArquitecturaBase"); expect(mail).toHaveTextContent("Usá este código para ingresar a ArquitecturaBase:");
    expect(await axe(container)).toHaveNoViolations();
  });
  it("«Así llega» cambia mientras se escribe, sin guardar", async () => {
    renderRouteWithProviders("/plataforma/configuracion", { as: "platform-operator" }); await screen.findByRole("textbox", { name: "Nombre de la aplicación" });
    change("Nombre de la aplicación", "Delta Apps"); change("Nombre del remitente", "Equipo de Delta Apps");
    const mail = screen.getByRole("group", { name: "Así llega el correo de un código" });
    expect(mail).toHaveTextContent("Equipo de Delta Apps"); expect(mail).toHaveTextContent("483920 es tu código de acceso a Delta Apps"); expect(mail).toHaveTextContent("Usá este código para ingresar a Delta Apps:");
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeEnabled();
  });
  it.each([["Datos de los ingresos", "121", "Tiene que ser de 1 a 120."], ["Códigos y enlaces", "0", "Tiene que ser de 1 a 3.650."], ["Invitaciones cerradas", "6", "Tiene que ser de 7 a 3.650."]])("%s fuera de rango (%s) no manda nada", async (label, value, message) => {
    let calls = 0; server.use(http.put("/api/platform/settings", () => { calls++; return HttpResponse.json({ version: 2 }); }));
    const user = userEvent.setup(); renderRouteWithProviders("/plataforma/configuracion", { as: "platform-operator" }); await screen.findByRole("textbox", { name: label });
    change(label, value); await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(await screen.findByText(message)).toBeVisible(); expect(screen.getByRole("textbox", { name: label })).toHaveAttribute("aria-invalid", "true");
    expect(calls).toBe(0); expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("el nombre vacío y un logo sin https:// no se mandan", async () => {
    let calls = 0; server.use(http.put("/api/platform/settings", () => { calls++; return HttpResponse.json({ version: 2 }); }));
    const user = userEvent.setup(); renderRouteWithProviders("/plataforma/configuracion", { as: "platform-operator" }); await screen.findByRole("textbox", { name: "Nombre de la aplicación" });
    change("Nombre de la aplicación", "  "); change("Logo de los correos", "http://logo.ejemplo.com/a.png"); await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(await screen.findByText("Escribí un nombre de hasta 60 caracteres.")).toBeVisible(); expect(screen.getByText("Usá una dirección que empiece con https://.")).toBeVisible(); expect(calls).toBe(0);
  });
  it("manda los plazos, el nombre, el remitente y el logo sin espacios", async () => {
    const requests: Record<string, unknown>[] = [];
    server.use(http.put("/api/platform/settings", async ({ request }) => { requests.push(await request.json() as Record<string, unknown>); return HttpResponse.json({ version: 2 }); }));
    const user = userEvent.setup(); renderRouteWithProviders("/plataforma/configuracion", { as: "platform-operator" }); await screen.findByRole("textbox", { name: "Nombre de la aplicación" });
    change("Nombre de la aplicación", " Delta Apps "); change("Nombre del remitente", "Equipo de Delta Apps"); change("Logo de los correos", " https://delta.ejemplo.com/logo.png ");
    change("Datos de los ingresos", "24"); change("Códigos y enlaces", "60"); change("Invitaciones cerradas", "7");
    await send(user); expect(await screen.findByText("Guardamos la configuración.")).toBeVisible();
    expect(requests[0]).toMatchObject({ appName: "Delta Apps", senderName: "Equipo de Delta Apps", emailLogoUrl: "https://delta.ejemplo.com/logo.png",
      loginAuditRetentionMonths: 24, loginCodeRetentionDays: 60, closedInvitationRetentionDays: 7, version: 1 });
  });
  it.each([["loginAuditRetentionMonths", "Datos de los ingresos"], ["appName", "Nombre de la aplicación"], ["emailLogoUrl", "Logo de los correos"]])("400 en %s queda debajo de su campo", async (field, label) => {
    server.use(http.put("/api/platform/settings", () => HttpResponse.json({ code: "Validation.Failed", detail: "Error general", errors: { [field]: ["Revisá este valor."] } }, { status: 400 })));
    const user = userEvent.setup(); renderRouteWithProviders("/plataforma/configuracion", { as: "platform-operator" }); await screen.findByRole("textbox", { name: label });
    change("Nombre del remitente", "Otro remitente"); await send(user);
    expect(await screen.findByText("Revisá este valor.")).toBeVisible(); expect(screen.getByRole("textbox", { name: label })).toHaveAttribute("aria-invalid", "true");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(); expect(screen.queryByText("Error general")).not.toBeInTheDocument();
  });
  it("409 conserva lo escrito en las secciones nuevas", async () => {
    server.use(http.put("/api/platform/settings", () => HttpResponse.json({ code: "General.ConcurrencyConflict" }, { status: 409 })));
    const user = userEvent.setup(); renderRouteWithProviders("/plataforma/configuracion", { as: "platform-operator" }); await screen.findByRole("textbox", { name: "Datos de los ingresos" });
    change("Datos de los ingresos", "36"); await send(user);
    expect(await screen.findByText("Otra persona cambió esto mientras lo editabas.")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Seguir editando" }));
    await waitFor(() => expect(screen.getByRole("textbox", { name: "Datos de los ingresos" })).toHaveValue("36"));
  });
  it("en el teléfono conserva las secciones y el correo; axe", async () => {
    const restore = asPhone(); try {
      const { container } = renderRouteWithProviders("/plataforma/configuracion", { as: "platform-operator" }); await screen.findByRole("textbox", { name: "Nombre de la aplicación" });
      expect(screen.getByRole("heading", { name: "Nombre y correos" })).toBeVisible(); expect(screen.getByRole("heading", { name: "Privacidad y retención" })).toBeVisible();
      expect(screen.getByRole("group", { name: "Así llega el correo de un código" })).toBeVisible(); expect(await axe(container)).toHaveNoViolations();
    } finally { restore(); }
  });
});
