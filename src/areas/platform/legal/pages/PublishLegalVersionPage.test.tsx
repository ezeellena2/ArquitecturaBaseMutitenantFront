import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { changeCulture, configureI18n } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { platformOperator } from "@/test/mocks/currentUsers";
import { currentUserQueryKey } from "@/auth/useCurrentUser";
import { asPhone } from "@/test/utils/phone";
import { server } from "@/test/mocks/server";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";
beforeAll(async () => { await import("./PublishLegalVersionPage"); await import("./LegalDocumentsPage"); });

beforeEach(async () => {
  await configureI18n(referenceDataFixture().cultures); await changeCulture("es-AR");
  server.use(http.get("/api/platform/legal-documents", () => HttpResponse.json([{ kind: "Terms", currentVersion: 2, currentEffectiveAtUtc: "2026-06-01T03:00:00Z", versions: [{ id: "t2", version: 2, effectiveAtUtc: "2026-06-01T03:00:00Z", isCurrent: true }] }, { kind: "Privacy", currentVersion: 1, currentEffectiveAtUtc: "2026-01-12T03:00:00Z", versions: [{ id: "p8", version: 8, effectiveAtUtc: "2026-11-01T03:00:00Z", isCurrent: false }, { id: "p1", version: 1, effectiveAtUtc: "2026-01-12T03:00:00Z", isCurrent: true }] }])));
});
describe("Publicar documento legal", () => {
  it.each(["Cancelar", "Volver a Documentos legales"])("%s usa Cambios sin guardar y pregunta; Seguir editando conserva todo", async (action) => {
    const user = userEvent.setup(); const { router } = renderRouteWithProviders("/plataforma/legales/nueva", { as: "platform-operator" });
    const content = await screen.findByRole("textbox", { name: "En español" }); fireEvent.change(content, { target: { value: "Borrador" } });
    expect(screen.getByText("Cambios sin guardar")).toBeVisible(); expect(screen.queryByRole("button", { name: "Descartar cambios" })).not.toBeInTheDocument();
    await user.click(screen.getByRole(action === "Cancelar" ? "button" : "link", { name: action })); const dialog = await screen.findByRole("dialog", { name: "¿Salir sin guardar?" });
    await user.click(within(dialog).getByRole("button", { name: "Seguir editando" })); expect(content).toHaveValue("Borrador"); expect(router.state.location.pathname).toBe("/plataforma/legales/nueva");
    await user.click(screen.getByRole("button", { name: "Cancelar" })); await user.click(within(await screen.findByRole("dialog", { name: "¿Salir sin guardar?" })).getByRole("button", { name: "Salir sin guardar" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/plataforma/legales"));
  });
  it("cancelar sin cambios vuelve sin preguntar", async () => {
    const user = userEvent.setup(); const { router } = renderRouteWithProviders("/plataforma/legales/nueva", { as: "platform-operator" });
    await user.click(await screen.findByRole("button", { name: "Cancelar" })); await waitFor(() => expect(router.state.location.pathname).toBe("/plataforma/legales")); expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it.each([
    ["Legal.Publication.EffectiveDatePast", "La fecha no puede ser anterior a hoy.", { effectiveOn: ["La fecha no puede ser anterior a hoy."] }, "Vigente desde"],
    ["Validation.Failed", "Contenido inválido.", { "contents[0].text": ["El texto excede el límite del servidor."] }, "En español"],
    ["Validation.Failed", "Contenido inválido.", { "contents[1].text": ["Contenido requerido por servidor."] }, "En inglés"],
  ])("%s va sólo en %s: error de dato debajo y conserva borrador", async (code, detail, errors, field) => {
    const user = userEvent.setup(); server.use(http.post("/api/platform/legal-documents", () => HttpResponse.json({ code, detail, errors }, { status: 400 })));
    renderRouteWithProviders("/plataforma/legales/nueva", { as: "platform-operator" });
    fireEvent.change(await screen.findByRole("textbox", { name: "Vigente desde" }), { target: { value: "01/01/2026" } });
    fireEvent.change(screen.getByRole("textbox", { name: "En español" }), { target: { value: "Texto es" } }); fireEvent.change(screen.getByRole("textbox", { name: "En inglés" }), { target: { value: "Text en" } });
    await user.click(screen.getByRole("button", { name: "Publicar" })); await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Publicar" }));
    const message = Object.values(errors)[0][0]; expect(await screen.findByText(message)).toBeVisible(); expect(screen.getByRole("textbox", { name: field })).toHaveAccessibleDescription(message);
    expect(screen.getByRole("textbox", { name: "En español" })).toHaveValue("Texto es"); expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });
  it("EffectiveDatePast sin errors usa code para ubicar el detail en fecha", async () => {
    const user = userEvent.setup(); server.use(http.post("/api/platform/legal-documents", () => HttpResponse.json({ code: "Legal.Publication.EffectiveDatePast", detail: "Fecha anterior al día actual de tu zona." }, { status: 400 })));
    renderRouteWithProviders("/plataforma/legales/nueva", { as: "platform-operator" });
    fireEvent.change(await screen.findByRole("textbox", { name: "Vigente desde" }), { target: { value: "01/01/2026" } });
    fireEvent.change(screen.getByRole("textbox", { name: "En español" }), { target: { value: "Texto es" } }); fireEvent.change(screen.getByRole("textbox", { name: "En inglés" }), { target: { value: "Text en" } });
    await user.click(screen.getByRole("button", { name: "Publicar" })); await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Publicar" }));
    expect(await screen.findByText("Fecha anterior al día actual de tu zona.")).toBeVisible(); expect(screen.getByRole("textbox", { name: "Vigente desde" })).toHaveAccessibleDescription("Fecha anterior al día actual de tu zona.");
  });
  it.each(["Legal.Publication.CulturesMismatch", "Request.IdempotencyKeyReused", "Authorization.Forbidden"])("%s sin campo va en la franja, nunca por comparar texto", async (code) => {
    const user = userEvent.setup(); server.use(http.post("/api/platform/legal-documents", () => HttpResponse.json({ code, detail: "El servidor rechazó la publicación.", errors: code === "Legal.Publication.CulturesMismatch" ? { contents: ["Revisá los idiomas."] } : undefined }, { status: 400 })));
    renderRouteWithProviders("/plataforma/legales/nueva", { as: "platform-operator" });
    fireEvent.change(await screen.findByRole("textbox", { name: "Vigente desde" }), { target: { value: "01/11/2026" } });
    fireEvent.change(screen.getByRole("textbox", { name: "En español" }), { target: { value: "Texto es" } }); fireEvent.change(screen.getByRole("textbox", { name: "En inglés" }), { target: { value: "Text en" } });
    await user.click(screen.getByRole("button", { name: "Publicar" })); await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Publicar" }));
    expect(await screen.findByText("El servidor rechazó la publicación.")).toBeVisible(); expect(screen.getByRole("textbox", { name: "En español" })).not.toHaveAttribute("aria-invalid", "true");
  });
  it("catálogo habilitado exacto: omite deshabilitada y publica una cultura regional nueva", async () => {
    const reference = referenceDataFixture(); reference.cultures.push({ ...reference.cultures[1], code: "en-GB", countryCode: "GB", name: "English from API", isDefault: false }, { ...reference.cultures[0], code: "es-MX", name: "Deshabilitado", isEnabled: false, isDefault: false });
    server.use(http.get("/api/reference-data", () => HttpResponse.json(reference))); await configureI18n(reference.cultures);
    const user = userEvent.setup(); let sent: unknown; server.use(http.post("/api/platform/legal-documents", async ({ request }) => { sent = await request.json(); return HttpResponse.json({ id: "t3", version: 3 }, { status: 201 }); }));
    const { container } = renderRouteWithProviders("/plataforma/legales/nueva", { as: "platform-operator" }); await screen.findByRole("textbox", { name: "En español" });
    expect(screen.getAllByRole("textbox")).toHaveLength(4); expect(screen.queryByRole("textbox", { name: /Deshabilitado/ })).not.toBeInTheDocument(); expect(await axe(container)).toHaveNoViolations();
    fireEvent.change(screen.getByRole("textbox", { name: "Vigente desde" }), { target: { value: "01/11/2026" } }); fireEvent.change(screen.getByRole("textbox", { name: "En español" }), { target: { value: "Texto es" } });
    screen.getAllByRole("textbox", { name: "En inglés" }).forEach((input, index) => { fireEvent.change(input, { target: { value: `English ${index}` } }); });
    await user.click(screen.getByRole("button", { name: "Publicar" })); await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Publicar" })); await screen.findByText("Publicamos la versión 3 de Términos y condiciones.");
    expect(sent).toMatchObject({ contents: [{ culture: "es-AR", text: "Texto es" }, { culture: "en-US", text: "English 0" }, { culture: "en-GB", text: "English 1" }] });
  });
  it("en-US usa cultura efectiva en fecha civil, campos, confirmación y aviso", async () => {
    const user = userEvent.setup(); server.use(http.post("/api/platform/legal-documents", () => HttpResponse.json({ id: "t3", version: 3 }, { status: 201 })));
    const page = renderRouteWithProviders("/plataforma/legales/nueva", { as: "platform-operator" }); await screen.findByRole("textbox", { name: "En español" });
    await act(async () => { page.queryClient.setQueryData(currentUserQueryKey, { ...platformOperator, culture: "en-US" }); });
    fireEvent.change(await screen.findByRole("textbox", { name: "Effective since" }), { target: { value: "11/01/2026" } }); fireEvent.change(screen.getByRole("textbox", { name: "In Spanish" }), { target: { value: "Texto es" } }); fireEvent.change(screen.getByRole("textbox", { name: "In English" }), { target: { value: "Text en" } });
    await user.click(screen.getByRole("button", { name: "Publish" })); const confirmation = await screen.findByRole("alertdialog"); expect(confirmation).toHaveTextContent("Publish version 3 of Terms and conditions?"); expect(confirmation).toHaveTextContent("From 11/01/2026");
    await user.click(within(confirmation).getByRole("button", { name: "Publish" })); expect(await screen.findByText("Published version 3 of Terms and conditions.")).toBeVisible();
  });
  it("390 formulario y confirmación comunes, acciones fijas y axe", async () => {
    const restore = asPhone(); const user = userEvent.setup(); const { container } = renderRouteWithProviders("/plataforma/legales/nueva", { as: "platform-operator" });
    fireEvent.change(await screen.findByRole("textbox", { name: "Vigente desde" }), { target: { value: "01/11/2026" } }); fireEvent.change(screen.getByRole("textbox", { name: "En español" }), { target: { value: "Texto es" } }); fireEvent.change(screen.getByRole("textbox", { name: "En inglés" }), { target: { value: "Text en" } });
    expect(screen.getByRole("button", { name: "Publicar" }).closest("[data-slot=fixed-actions]")).not.toBeNull(); await user.click(screen.getByRole("button", { name: "Publicar" })); expect(await screen.findByRole("alertdialog")).toBeVisible(); expect(await axe(container)).toHaveNoViolations(); restore();
  });
  it("cambiar el borrador antes de terminar la validación abandona la confirmación anterior", async () => {
    renderRouteWithProviders("/plataforma/legales/nueva", { as: "platform-operator" });
    fireEvent.change(await screen.findByRole("textbox", { name: "Vigente desde" }), { target: { value: "01/11/2026" } });
    fireEvent.change(screen.getByRole("textbox", { name: "En español" }), { target: { value: "Texto es" } }); fireEvent.change(screen.getByRole("textbox", { name: "En inglés" }), { target: { value: "Text en" } });
    fireEvent.click(screen.getByRole("button", { name: "Publicar" })); fireEvent.change(screen.getByRole("textbox", { name: "En español" }), { target: { value: "Borrador nuevo" } });
    await waitFor(() => expect(screen.getByText("Cambios sin guardar")).toBeVisible());
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });
  it("editor propio, cartel bajo banda, Sections Versión/Contenido, máximo+1 y axe", async () => {
    const { container } = renderRouteWithProviders("/plataforma/legales/nueva?documento=Privacy", { as: "platform-operator" });
    expect(await screen.findByRole("heading", { name: "Publicar versión nueva", level: 1 })).toBeVisible();
    expect(await screen.findByText("Política de privacidad · versión 9")).toBeVisible();
    expect(screen.getByText("Al publicarla, todas las cuentas tienen que aceptarla de nuevo para seguir usando el servicio. Una versión publicada no se edita.")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Versión" })).toBeVisible(); expect(screen.getByRole("heading", { name: "Contenido" })).toBeVisible();
    expect(screen.getByRole("combobox", { name: "Documento" })).toHaveTextContent("Política de privacidad");
    expect(screen.getByRole("textbox", { name: "En español" })).toHaveAttribute("maxlength", "100000"); expect(screen.getByRole("textbox", { name: "En inglés" })).toBeVisible();
    expect(screen.getByRole("region", { name: "Contenido" }).firstElementChild?.nextElementSibling).toHaveClass("lg:grid-cols-2");
    expect(screen.getByRole("button", { name: "Publicar" })).toBeEnabled(); expect(await axe(container)).toHaveNoViolations();
  });
  it("valida todos los vacíos y fecha inválida con mensajes del tablero", async () => {
    const user = userEvent.setup(); renderRouteWithProviders("/plataforma/legales/nueva", { as: "platform-operator" });
    await user.click(await screen.findByRole("button", { name: "Publicar" }));
    expect(await screen.findByText("Escribí la fecha de vigencia.")).toBeVisible(); expect(screen.getByText("Escribí el contenido en español.")).toBeVisible(); expect(screen.getByText("Escribí el contenido en inglés.")).toBeVisible();
    fireEvent.change(screen.getByRole("textbox", { name: "Vigente desde" }), { target: { value: "35/15/2026" } });
    await user.click(screen.getByRole("button", { name: "Publicar" })); expect(await screen.findByText("Escribí la fecha como dd/mm/aaaa.")).toBeVisible(); expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("valida TextLimits.LegalDocument aun si el texto supera el maxlength del control", async () => {
    const user = userEvent.setup(); let calls = 0;
    server.use(http.post("/api/platform/legal-documents", () => { calls++; return HttpResponse.json({ id: "t3", version: 3 }, { status: 201 }); }));
    renderRouteWithProviders("/plataforma/legales/nueva", { as: "platform-operator" });
    fireEvent.change(await screen.findByRole("textbox", { name: "Vigente desde" }), { target: { value: "01/11/2026" } });
    fireEvent.change(screen.getByRole("textbox", { name: "En español" }), { target: { value: "x".repeat(100_001) } });
    fireEvent.change(screen.getByRole("textbox", { name: "En inglés" }), { target: { value: "Text en" } });
    await user.click(screen.getByRole("button", { name: "Publicar" }));
    expect(await screen.findByText("El contenido es demasiado largo.")).toBeVisible();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(); expect(calls).toBe(0);
  });
  it("Publicar confirma sin motivo, manda DateOnly/catalog/key y vuelve con versión real", async () => {
    const user = userEvent.setup(); let sent: unknown; let key: string | null = null;
    server.use(http.post("/api/platform/legal-documents", async ({ request }) => { sent = await request.json(); key = request.headers.get("Idempotency-Key"); return HttpResponse.json({ id: "p9", version: 11 }, { status: 201 }); }));
    const { router } = renderRouteWithProviders("/plataforma/legales/nueva?documento=Privacy", { as: "platform-operator" });
    fireEvent.change(await screen.findByRole("textbox", { name: "Vigente desde" }), { target: { value: "01/11/2026" } });
    fireEvent.change(screen.getByRole("textbox", { name: "En español" }), { target: { value: "Texto es" } }); fireEvent.change(screen.getByRole("textbox", { name: "En inglés" }), { target: { value: "Text en" } });
    await user.click(screen.getByRole("button", { name: "Publicar" })); const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText("¿Publicar la versión 9 de Política de privacidad?")).toBeVisible();
    expect(within(dialog).getByText("Desde el 01/11/2026, todas las cuentas tienen que aceptarla para seguir usando el servicio. Después no se puede editar.")).toBeVisible(); expect(within(dialog).queryByRole("textbox")).not.toBeInTheDocument(); expect(within(dialog).queryByRole("button", { name: "Cerrar" })).not.toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Publicar" }));
    expect(await screen.findByText("Publicamos la versión 11 de Política de privacidad.")).toBeVisible(); await waitFor(() => expect(router.state.location.pathname).toBe("/plataforma/legales"));
    expect(sent).toEqual({ kind: "Privacy", effectiveOn: "2026-11-01", contents: [{ culture: "es-AR", text: "Texto es" }, { culture: "en-US", text: "Text en" }] }); expect(key).toMatch(/^[0-9a-f-]{36}$/i);
  });
});
