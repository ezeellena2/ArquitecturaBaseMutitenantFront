import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { currentUserQueryKey } from "@/auth/useCurrentUser";
import { changeCulture, configureI18n } from "@/shared/i18n";
import { platformOperator } from "@/test/mocks/currentUsers";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { platformSettingsFixture } from "@/test/mocks/platformSettings";
import { server } from "@/test/mocks/server";
import { asPhone } from "@/test/utils/phone";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";

const key = ["platform", "settings"];
beforeAll(async () => { await import("./PlatformSettingsPage"); });
beforeEach(async () => {
  await configureI18n(referenceDataFixture().cultures); await changeCulture("es-AR");
  server.use(http.get("/api/platform/settings", () => HttpResponse.json(platformSettingsFixture)), http.put("/api/platform/settings", () => HttpResponse.json({ version: 2 })));
});
const change = (name: string, value: string) => { const input = screen.getByRole("textbox", { name }); fireEvent.change(input, { target: { value } }); if (name === "Organizaciones propias por persona" || name === "Organizations owned per person") fireEvent.blur(input); };
async function confirmation(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
  return screen.findByRole("dialog", { name: "¿Guardar la configuración?" });
}
async function send(user: ReturnType<typeof userEvent.setup>) {
  const dialog = await confirmation(user); fireEvent.change(within(dialog).getByRole("textbox", { name: "Motivo" }), { target: { value: " Revisamos el registro. " } });
  await user.click(within(dialog).getByRole("button", { name: "Guardar" }));
}

describe("Configuración de Plataforma", () => {
  it("guarda desde una dirección con barra final, sin comparar la ruta a mano", async () => {
    const user = userEvent.setup(); renderRouteWithProviders("/plataforma/configuracion/", { as: "platform-operator" });
    await screen.findByRole("textbox", { name: "Correo de ventas" });
    change("Correo de ventas", "nuevo@ejemplo.com");
    await send(user);
    expect(await screen.findByText("Guardamos la configuración.")).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Correo de ventas" })).toHaveValue("nuevo@ejemplo.com");
  });
  it("lo guardado, cinco campos, dos Sections, Guardar apagado, descarte y axe", async () => {
    const user = userEvent.setup(); const { container } = renderRouteWithProviders("/plataforma/configuracion", { as: "platform-operator" });
    expect(await screen.findByRole("textbox", { name: "Correo de ventas" })).toHaveValue("ventas@ejemplo.com");
    expect(screen.getByRole("textbox", { name: "Correo de soporte" })).toHaveValue("soporte@ejemplo.com");
    expect(screen.getByRole("textbox", { name: "Organizaciones propias por persona" })).toHaveValue("3");
    expect(screen.getByRole("combobox", { name: "Registro de personas" })).toHaveTextContent("Abierto");
    expect(screen.getByRole("combobox", { name: "Alta de organizaciones" })).toHaveTextContent("Requiere aprobación");
    expect(screen.getByRole("region", { name: "Registro y altas" })).toBeVisible(); expect(screen.getByRole("region", { name: "Contacto" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeDisabled(); expect(screen.getByRole("button", { name: "Descartar cambios" })).toBeEnabled();
    expect(screen.queryByText(/gracia/i)).not.toBeInTheDocument(); expect(await axe(container)).toHaveNoViolations();
    change("Correo de ventas", "nuevo@ejemplo.com"); expect(screen.getByText("Cambios sin guardar")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Descartar cambios" })); expect(screen.getByRole("textbox", { name: "Correo de ventas" })).toHaveValue("ventas@ejemplo.com"); expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeDisabled();
  });
  it("opciones con explicaciones exactas del tablero", async () => {
    const user = userEvent.setup(); renderRouteWithProviders("/plataforma/configuracion", { as: "platform-operator" });
    const consumer = await screen.findByRole("combobox", { name: "Registro de personas" }); consumer.focus(); await user.keyboard("{Enter}");
    expect(screen.getByRole("option", { name: /Abierto/ })).toHaveTextContent("Cualquiera crea su cuenta con su correo o su WhatsApp.");
    expect(screen.getByRole("option", { name: /Cerrado/ })).toHaveTextContent("Solo entran las personas invitadas a una organización.");
    await user.click(screen.getByRole("option", { name: /Cerrado/ })); screen.getByRole("combobox", { name: "Alta de organizaciones" }).focus(); await user.keyboard("{Enter}");
    expect(screen.getByRole("option", { name: /Abierta/ })).toHaveTextContent("La organización queda activa al crearla.");
    expect(screen.getByRole("option", { name: /Requiere aprobación/ })).toHaveTextContent("Queda esperando hasta que un operador la aprueba.");
    expect(screen.getByRole("option", { name: /Cerrada/ })).toHaveTextContent("Solo la plataforma crea organizaciones.");
  });
  it.each(["0", "51", "1,5", ""])("rango entero %s y correos inválidos: errores de fuente sin HTTP", async (value) => {
    let calls = 0; server.use(http.put("/api/platform/settings", () => { calls++; return HttpResponse.json({ version: 2 }); }));
    const user = userEvent.setup(); renderRouteWithProviders("/plataforma/configuracion", { as: "platform-operator" }); await screen.findByRole("textbox", { name: "Correo de ventas" });
    change("Organizaciones propias por persona", value); change("Correo de ventas", "sin-correo"); change("Correo de soporte", "");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(await screen.findByText("Usá un número de 1 a 50.")).toBeVisible(); expect(screen.getAllByText("Ingresá un correo válido.")).toHaveLength(2); expect(calls).toBe(0); expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    change("Organizaciones propias por persona", "4"); change("Correo de ventas", "nuevo@ejemplo.com"); change("Correo de soporte", "ayuda@ejemplo.com");
    await waitFor(() => expect(screen.queryByText("Usá un número de 1 a 50.")).not.toBeInTheDocument()); expect(screen.queryByText("Ingresá un correo válido.")).not.toBeInTheDocument();
  });
  it.each(["1", "50"])("límite %s pide motivo, manda los campos, los doce límites, version y reason, y conserva respuesta antes GET viejo", async (value) => {
    const requests: Record<string, unknown>[] = []; let getRelease: (() => void) | undefined; let reads = 0;
    server.use(http.get("/api/platform/settings", async () => { reads++; if (reads === 2) await new Promise<void>((resolve) => { getRelease = resolve; }); return HttpResponse.json(platformSettingsFixture); }),
      http.put("/api/platform/settings", async ({ request }) => { requests.push(await request.json() as Record<string, unknown>); expect(request.headers.get("Idempotency-Key")).toBeNull(); return HttpResponse.json({ version: requests.length + 16 }); }));
    const user = userEvent.setup(); const page = renderRouteWithProviders("/plataforma/configuracion", { as: "platform-operator" }); await screen.findByRole("textbox", { name: "Correo de ventas" });
    change("Organizaciones propias por persona", value); change("Correo de ventas", " NUEVO@EJEMPLO.COM ");
    const dialog = await confirmation(user); expect(dialog).toHaveTextContent("Cambia cómo entran las personas y las organizaciones nuevas, y los límites de uso. Lo que ya existe no cambia.");
    await user.click(within(dialog).getByRole("button", { name: "Guardar" })); expect(await screen.findByText("Escribí el motivo.")).toBeVisible(); expect(requests).toHaveLength(0);
    fireEvent.change(within(dialog).getByRole("textbox", { name: "Motivo" }), { target: { value: " Revisamos el registro. " } }); await user.click(within(dialog).getByRole("button", { name: "Guardar" }));
    expect(await screen.findByText("Guardamos la configuración.")).toBeVisible(); expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(requests[0]).toEqual({ consumerSignup: "Open", businessSignup: "RequiresApproval", maxOwnedOrganizations: Number(value), salesEmail: "nuevo@ejemplo.com", supportEmail: "soporte@ejemplo.com", rateLimits: platformSettingsFixture.rateLimits, version: 1, reason: "Revisamos el registro." });
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeDisabled(); await waitFor(() => expect(getRelease).toBeDefined());
    change("Correo de soporte", "ayuda@ejemplo.com"); await send(user); await waitFor(() => expect(requests).toHaveLength(2)); expect(requests[1].version).toBe(17);
    await act(async () => { getRelease?.(); }); await waitFor(() => expect(page.queryClient.isFetching({ queryKey: key })).toBe(0));
    change("Correo de soporte", "otro@ejemplo.com"); await send(user); await waitFor(() => expect(requests).toHaveLength(3)); expect(requests[2].version).toBe(18);
    await act(async () => { getRelease?.(); });
  });
  it("409 cierra motivo, ambas acciones, continuar conserva borrador y Ver lo nuevo resetea con lectura válida", async () => {
    let conflict = true; let fresh = false; const requests: Record<string, unknown>[] = [];
    server.use(http.get("/api/platform/settings", () => HttpResponse.json(fresh ? { ...platformSettingsFixture, maxOwnedOrganizations: 7, version: 8 } : platformSettingsFixture)),
      http.put("/api/platform/settings", async ({ request }) => { requests.push(await request.json() as Record<string, unknown>); return conflict ? HttpResponse.json({ code: "General.ConcurrencyConflict" }, { status: 409 }) : HttpResponse.json({ version: 9 }); }));
    const user = userEvent.setup(); renderRouteWithProviders("/plataforma/configuracion", { as: "platform-operator" }); await screen.findByRole("textbox", { name: "Correo de ventas" }); change("Organizaciones propias por persona", "4"); await send(user);
    expect(await screen.findByText("Otra persona cambió esto mientras lo editabas.")).toBeVisible(); expect(screen.queryByRole("dialog", { name: "¿Guardar la configuración?" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Seguir editando" })); expect(screen.getByRole("textbox", { name: "Organizaciones propias por persona" })).toHaveValue("4");
    await send(user); await screen.findByText("Otra persona cambió esto mientras lo editabas."); fresh = true; await user.click(screen.getByRole("button", { name: "Ver lo nuevo" }));
    await user.click(within(await screen.findByRole("dialog", { name: "¿Salir sin guardar?" })).getByRole("button", { name: "Salir sin guardar" }));
    await waitFor(() => expect(screen.getByRole("textbox", { name: "Organizaciones propias por persona" })).toHaveValue("7")); expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeDisabled();
    conflict = false; change("Organizaciones propias por persona", "6"); await send(user); await waitFor(() => expect(requests).toHaveLength(3)); expect(requests[2].version).toBe(8);
  });
  it("GET cacheado fallido conserva el formulario, borrador y motivo", async () => {
    const user = userEvent.setup(); const page = renderRouteWithProviders("/plataforma/configuracion", { as: "platform-operator" }); await screen.findByRole("textbox", { name: "Correo de ventas" });
    change("Correo de ventas", "nuevo@ejemplo.com"); const dialog = await confirmation(user); fireEvent.change(within(dialog).getByRole("textbox", { name: "Motivo" }), { target: { value: "Conservar este motivo" } });
    server.use(http.get("/api/platform/settings", () => HttpResponse.error())); await act(async () => { await page.queryClient.invalidateQueries({ queryKey: key }); });
    expect(screen.getByRole("dialog")).toBe(dialog); expect(within(dialog).getByRole("textbox", { name: "Motivo" })).toHaveValue("Conservar este motivo");
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" })); expect(screen.getByRole("textbox", { name: "Correo de ventas" })).toHaveValue("nuevo@ejemplo.com");
  });
  it("en-US conserva mensajes, confirmación y aviso traducidos", async () => {
    const user = userEvent.setup(); const page = renderRouteWithProviders("/plataforma/configuracion", { as: "platform-operator" }); await screen.findByRole("textbox", { name: "Correo de ventas" });
    await act(async () => { page.queryClient.setQueryData(currentUserQueryKey, { ...platformOperator, culture: "en-US" }); });
    await screen.findByRole("textbox", { name: "Organizations owned per person" }); change("Organizations owned per person", "51"); change("Sales email", "mal"); await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("Use a number from 1 to 50.")).toBeVisible(); expect(screen.getByText("Enter a valid email.")).toBeVisible();
    change("Organizations owned per person", "4"); change("Sales email", "sales@example.com"); await user.click(screen.getByRole("button", { name: "Save changes" }));
    const dialog = await screen.findByRole("dialog", { name: "Save the settings?" }); fireEvent.change(within(dialog).getByRole("textbox", { name: "Reason" }), { target: { value: "Reviewed" } }); await user.click(within(dialog).getByRole("button", { name: "Save" })); expect(await screen.findByText("Settings saved.")).toBeVisible();
  });
  it.each([["maxOwnedOrganizations", "Organizaciones propias por persona"], ["salesEmail", "Correo de ventas"], ["supportEmail", "Correo de soporte"]])("400 %s cierra motivo y queda debajo del campo conservando borrador", async (field, label) => {
    server.use(http.put("/api/platform/settings", () => HttpResponse.json({ code: "Validation.Failed", detail: "Error general", errors: { [field]: ["Este campo es obligatorio."] } }, { status: 400 })));
    const user = userEvent.setup(); renderRouteWithProviders("/plataforma/configuracion", { as: "platform-operator" }); await screen.findByRole("textbox", { name: "Correo de ventas" }); change("Correo de ventas", "nuevo@ejemplo.com"); await send(user);
    expect(await screen.findByText("Este campo es obligatorio.")).toBeVisible(); expect(screen.getByRole("textbox", { name: label })).toHaveAttribute("aria-invalid", "true"); expect(screen.queryByRole("dialog")).not.toBeInTheDocument(); expect(screen.getByRole("textbox", { name: "Correo de ventas" })).toHaveValue("nuevo@ejemplo.com"); expect(screen.queryByText("Error general")).not.toBeInTheDocument();
  });
  it("400 reason queda en el motivo actual con foco/formulario y sin cambiar los campos", async () => {
    server.use(http.put("/api/platform/settings", () => HttpResponse.json({ code: "Validation.Failed", detail: "Error general", errors: { reason: ["Motivo requerido por servidor."] } }, { status: 400 })));
    const user = userEvent.setup(); renderRouteWithProviders("/plataforma/configuracion", { as: "platform-operator" }); await screen.findByRole("textbox", { name: "Correo de ventas" }); change("Correo de ventas", "nuevo@ejemplo.com"); await send(user);
    const dialog = screen.getByRole("dialog"); expect(await within(dialog).findByText("Motivo requerido por servidor.")).toBeVisible(); expect(within(dialog).getByRole("textbox", { name: "Motivo" })).toHaveAttribute("aria-invalid", "true"); expect(screen.queryByText("Error general")).not.toBeInTheDocument();
  });
  it("Descartar después de escritura propia no restaura versión ni campos de un GET viejo", async () => {
    const requests: Record<string, unknown>[] = [];
    server.use(http.put("/api/platform/settings", async ({ request }) => { requests.push(await request.json() as Record<string, unknown>); return HttpResponse.json({ version: 19 }); }));
    const user = userEvent.setup(); const page = renderRouteWithProviders("/plataforma/configuracion", { as: "platform-operator" }); await screen.findByRole("textbox", { name: "Correo de ventas" }); change("Correo de ventas", "nuevo@ejemplo.com"); await send(user); await screen.findByText("Guardamos la configuración.");
    await waitFor(() => expect(page.queryClient.isFetching({ queryKey: key })).toBe(0)); change("Correo de ventas", "descartar@ejemplo.com"); await user.click(screen.getByRole("button", { name: "Descartar cambios" }));
    expect(screen.getByRole("textbox", { name: "Correo de ventas" })).toHaveValue("nuevo@ejemplo.com"); expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeDisabled();
    change("Correo de soporte", "ayuda@ejemplo.com"); await send(user); await waitFor(() => expect(requests).toHaveLength(2)); expect(requests[1].version).toBe(19); expect(requests[1].salesEmail).toBe("nuevo@ejemplo.com");
  });
  it.each([20, 7])("Descartar después de escritura propia usa GET distinto con token opaco %s sólo al elegirlo", async (remoteVersion) => {
    const requests: Record<string, unknown>[] = [];
    server.use(http.put("/api/platform/settings", async ({ request }) => { requests.push(await request.json() as Record<string, unknown>); return HttpResponse.json({ version: requests.length === 1 ? 19 : 21 }); }));
    const user = userEvent.setup(); const page = renderRouteWithProviders("/plataforma/configuracion", { as: "platform-operator" }); await screen.findByRole("textbox", { name: "Correo de ventas" });
    change("Correo de ventas", "propio@ejemplo.com"); await send(user); await screen.findByText("Guardamos la configuración."); await waitFor(() => expect(page.queryClient.isFetching({ queryKey: key })).toBe(0));
    change("Correo de ventas", "borrador@ejemplo.com"); const remote = { ...platformSettingsFixture, maxOwnedOrganizations: 8, salesEmail: "remoto@ejemplo.com", supportEmail: "remoto-soporte@ejemplo.com", version: remoteVersion };
    server.use(http.get("/api/platform/settings", () => HttpResponse.json(remote))); await act(async () => { await page.queryClient.invalidateQueries({ queryKey: key }); });
    expect(page.queryClient.getQueryData(key)).toEqual(remote); expect(screen.getByRole("textbox", { name: "Correo de ventas" })).toHaveValue("borrador@ejemplo.com"); expect(screen.getByRole("textbox", { name: "Correo de soporte" })).toHaveValue("soporte@ejemplo.com");
    await user.click(screen.getByRole("button", { name: "Descartar cambios" })); expect(screen.getByRole("textbox", { name: "Correo de ventas" })).toHaveValue("remoto@ejemplo.com"); expect(screen.getByRole("textbox", { name: "Correo de soporte" })).toHaveValue("remoto-soporte@ejemplo.com"); expect(screen.getByRole("textbox", { name: "Organizaciones propias por persona" })).toHaveValue("8"); expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeDisabled();
    change("Correo de soporte", "edicion@ejemplo.com"); await send(user); await waitFor(() => expect(requests).toHaveLength(2)); expect(requests[1].version).toBe(remoteVersion); expect(requests[1].salesEmail).toBe("remoto@ejemplo.com");
  });
  it("Descartar sin escritura propia toma última lectura sin pisar borrador ni versión automáticamente", async () => {
    const requests: Record<string, unknown>[] = [];
    server.use(http.put("/api/platform/settings", async ({ request }) => { requests.push(await request.json() as Record<string, unknown>); return requests.length === 1 ? HttpResponse.json({ code: "General.ConcurrencyConflict" }, { status: 409 }) : HttpResponse.json({ version: 9 }); }));
    const user = userEvent.setup(); const page = renderRouteWithProviders("/plataforma/configuracion", { as: "platform-operator" }); await screen.findByRole("textbox", { name: "Correo de ventas" }); change("Correo de ventas", "borrador@ejemplo.com");
    server.use(http.get("/api/platform/settings", () => HttpResponse.json({ ...platformSettingsFixture, salesEmail: "remoto@ejemplo.com", version: 8 }))); await act(async () => { await page.queryClient.invalidateQueries({ queryKey: key }); });
    expect(screen.getByRole("textbox", { name: "Correo de ventas" })).toHaveValue("borrador@ejemplo.com"); await send(user); await screen.findByText("Otra persona cambió esto mientras lo editabas."); expect(requests[0].version).toBe(1);
    await user.click(screen.getByRole("button", { name: "Descartar cambios" })); expect(screen.getByRole("textbox", { name: "Correo de ventas" })).toHaveValue("remoto@ejemplo.com"); expect(screen.queryByText("Otra persona cambió esto mientras lo editabas.")).not.toBeInTheDocument();
    change("Correo de soporte", "edicion@ejemplo.com"); await send(user); await waitFor(() => expect(requests).toHaveLength(2)); expect(requests[1].version).toBe(8);
  });
  it("Descartar tras varias escrituras propias y misma lectura previa conserva la última respuesta", async () => {
    const requests: Record<string, unknown>[] = [];
    server.use(http.put("/api/platform/settings", async ({ request }) => { requests.push(await request.json() as Record<string, unknown>); return HttpResponse.json({ version: requests.length === 1 ? 19 : 21 }); }));
    const user = userEvent.setup(); const page = renderRouteWithProviders("/plataforma/configuracion", { as: "platform-operator" }); await screen.findByRole("textbox", { name: "Correo de ventas" }); change("Correo de ventas", "primero@ejemplo.com"); await send(user); await screen.findByText("Guardamos la configuración."); await waitFor(() => expect(page.queryClient.isFetching({ queryKey: key })).toBe(0));
    change("Correo de soporte", "segundo@ejemplo.com"); await send(user); await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument()); await waitFor(() => expect(page.queryClient.isFetching({ queryKey: key })).toBe(0)); expect(requests[1].version).toBe(19);
    change("Correo de ventas", "descartar@ejemplo.com"); await user.click(screen.getByRole("button", { name: "Descartar cambios" })); expect(screen.getByRole("textbox", { name: "Correo de ventas" })).toHaveValue("primero@ejemplo.com"); expect(screen.getByRole("textbox", { name: "Correo de soporte" })).toHaveValue("segundo@ejemplo.com");
    change("Correo de soporte", "tercero@ejemplo.com"); await send(user); await waitFor(() => expect(requests).toHaveLength(3)); expect(requests[2].version).toBe(21); expect(requests[2].salesEmail).toBe("primero@ejemplo.com");
  });
  it.each(["network", "changed"])("Ver lo nuevo %s conserva borrador si no hay relectura válida de la misma vida", async (result) => {
    server.use(http.put("/api/platform/settings", () => HttpResponse.json({ code: "General.ConcurrencyConflict" }, { status: 409 })));
    const user = userEvent.setup(); renderRouteWithProviders("/plataforma/configuracion", { as: "platform-operator" }); await screen.findByRole("textbox", { name: "Correo de ventas" }); change("Correo de ventas", "nuevo@ejemplo.com"); await send(user); await screen.findByRole("button", { name: "Ver lo nuevo" });
    let release: (() => void) | undefined;
    server.use(http.get("/api/platform/settings", async () => { await new Promise<void>((resolve) => { release = resolve; }); return result === "network" ? HttpResponse.error() : HttpResponse.json({ ...platformSettingsFixture, salesEmail: "remoto@ejemplo.com", version: 33 }); }));
    await user.click(screen.getByRole("button", { name: "Ver lo nuevo" })); await user.click(within(await screen.findByRole("dialog", { name: "¿Salir sin guardar?" })).getByRole("button", { name: "Salir sin guardar" }));
    await waitFor(() => expect(release).toBeDefined()); if (result === "changed") change("Correo de ventas", "durante@ejemplo.com");
    await act(async () => { release?.(); });
    if (result === "network") expect(await screen.findByText("No pudimos conectarnos. Revisá tu conexión.")).toBeVisible();
    await waitFor(() => expect(screen.getByRole("textbox", { name: "Correo de ventas" })).toHaveValue(result === "network" ? "nuevo@ejemplo.com" : "durante@ejemplo.com")); expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeEnabled();
  });
  it("390 conserva grupos, Administración, campos comunes y acciones FixedActions; axe", async () => {
    const restore = asPhone(); try {
      const { container } = renderRouteWithProviders("/plataforma/configuracion", { as: "platform-operator" }); await screen.findByRole("textbox", { name: "Correo de ventas" });
      expect(screen.getByRole("link", { name: "Volver" })).toHaveAttribute("href", "/plataforma/mas");
      expect(screen.getByRole("heading", { name: "Registro y altas" })).toBeVisible(); expect(screen.getByRole("heading", { name: "Contacto" })).toBeVisible(); expect(screen.getByText("Administración", { exact: true })).toBeVisible();
      expect(screen.getByRole("button", { name: "Guardar cambios" }).closest("[data-slot=fixed-actions]")).not.toBeNull(); expect(screen.getByRole("button", { name: "Descartar cambios" }).closest("[data-slot=fixed-actions]")).not.toBeNull(); expect(await axe(container)).toHaveNoViolations();
      change("Correo de ventas", "nuevo@ejemplo.com"); expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeEnabled(); expect(screen.getByText("Administración", { exact: true })).toBeVisible();
    } finally { restore(); }
  });
});
