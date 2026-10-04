import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { configureI18n, changeCulture } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";
import { asPhone } from "@/test/utils/phone";

const settings = {
  name: "Grupo Delta", defaultCulture: "es-AR", defaultTimeZoneId: "America/Argentina/Buenos_Aires", defaultCurrency: "ARS", version: 12,
};
const verified = {
  id: "domain-1", domain: "delta.example.test", status: "Verified", txtRecordName: null, txtRecordValue: null,
  createdAtUtc: "2026-10-01T12:00:00Z", verifiedAtUtc: "2026-10-01T12:05:00Z", version: 4,
};
const pending = { ...verified, status: "Pending", txtRecordName: "delta.example.test", txtRecordValue: "ab-verificacion=7f3c9a2e", verifiedAtUtc: null };

beforeEach(async () => {
  await configureI18n(referenceDataFixture().cultures);
  await changeCulture("es-AR");
});

describe("SettingsPage", () => {
  // Tablero M-Configuracion: en el teléfono los datos son campos sueltos sobre blanco, sin título; el dominio va en una
  // tarjeta con «Agregar dominio» en texto, y «Descartar cambios» y «Guardar cambios» fijos abajo.
  it("en el teléfono son campos sueltos y el dominio en una tarjeta", async () => {
    const restore = asPhone();
    try {
      server.use(
        http.get("/api/organization/settings", () => HttpResponse.json(settings)),
        http.get("/api/organization/settings/domains", () => HttpResponse.json([verified])),
      );
      renderRouteWithProviders("/org/configuracion", { as: "business-e6-admin" });

      await screen.findByRole("textbox", { name: "Nombre de la organización" });
      expect(screen.getByRole("heading", { name: "Datos de la organización" })).toHaveClass("sr-only");
      const domains = screen.getByRole("region", { name: "Dominio de correo" });
      expect(within(domains).getByRole("button", { name: "Agregar dominio" })).toHaveClass("text-[var(--marca-tx)]");
      expect((await within(domains).findByText("delta.example.test")).closest("ul")!.parentElement).toHaveClass("rounded-[14px]");
      expect(screen.getByRole("button", { name: "Guardar cambios" }).parentElement).toHaveAttribute("data-slot", "fixed-actions");
    } finally {
      restore();
    }
  });

  // Tablero «Criterio · Formularios»: lo que no se edita se muestra como texto, nunca como un campo gris.
  it("sin permiso para cambiar, muestra los datos como texto y sin botones", async () => {
    server.use(
      http.get("/api/organization/settings", () => HttpResponse.json(settings)),
      http.get("/api/organization/settings/domains", () => HttpResponse.json([verified])),
    );

    renderRouteWithProviders("/org/configuracion", { as: "business-settings-reader" });
    const data = await screen.findByRole("region", { name: "Datos de la organización" });

    await waitFor(() => expect(within(data).getByText("Peso argentino (ARS)")).toBeVisible());
    expect(within(data).getByText("Grupo Delta")).toBeVisible();
    expect(within(data).getByText("Español (Argentina)")).toBeVisible();
    expect(within(data).getByText("Buenos Aires (GMT−3)")).toBeVisible();
    expect(within(data).queryByRole("textbox")).not.toBeInTheDocument();
    expect(within(data).queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Guardar cambios" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Agregar dominio" })).not.toBeInTheDocument();
  });

  it("guarda con versión y quita un dominio con el texto del tablero", async () => {
    let updateBody: unknown;
    let removeUrl: URL | undefined;
    server.use(
      http.get("/api/organization/settings", () => HttpResponse.json(settings)),
      http.get("/api/organization/settings/domains", () => HttpResponse.json([verified])),
      http.put("/api/organization/settings", async ({ request }) => { updateBody = await request.json(); return new HttpResponse(null, { status: 204 }); }),
      http.delete("/api/organization/settings/domains/:domainId", ({ request }) => { removeUrl = new URL(request.url); return new HttpResponse(null, { status: 204 }); }),
    );

    const { container } = renderRouteWithProviders("/org/configuracion", { as: "business-e6-admin" });
    const name = await screen.findByRole("textbox", { name: "Nombre de la organización" });
    expect(screen.getByRole("heading", { name: "Dominio de correo" })).toBeVisible();
    expect(await screen.findByText("delta.example.test")).toBeVisible();
    expect(screen.getByText("Verificado")).toBeVisible();
    // Tablero Configuracion: «Idioma y región predeterminados».
    expect(screen.getByText("Idioma y región predeterminados")).toBeVisible();
    expect(await axe(container)).toHaveNoViolations();

    const user = userEvent.setup();
    await user.clear(name);
    await user.type(name, "Grupo Delta Sur");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(updateBody).toEqual({ ...settings, name: "Grupo Delta Sur" }));
    expect(await screen.findByText("Guardamos la configuración.")).toBeVisible();

    screen.getByRole("button", { name: "Acciones de delta.example.test" }).focus();
    await user.keyboard("{Enter}");
    await user.click(await screen.findByRole("menuitem", { name: "Quitar" }));
    // Tablero Configuracion-Quitar (la cantidad de correos administrados llega cuando la API la exponga).
    const dialog = await screen.findByRole("dialog", { name: "¿Quitar delta.example.test?" });
    expect(dialog).toHaveTextContent("Los correos nuevos de delta.example.test ya no quedan administrados por Empresa A. Los que ya lo están siguen igual.");
    await user.click(within(dialog).getByRole("button", { name: "Quitar" }));
    await waitFor(() => expect(removeUrl?.searchParams.get("version")).toBe("4"));
  });

  it("agrega un dominio: «Siguiente» abre «Verificar» con el TXT, «Copiar» y «Comprobar»", async () => {
    const user = userEvent.setup();
    let registered: unknown;
    let verifications = 0;
    server.use(
      http.get("/api/organization/settings", () => HttpResponse.json(settings)),
      http.get("/api/organization/settings/domains", () => HttpResponse.json(registered ? [pending] : [])),
      http.post("/api/organization/settings/domains", async ({ request }) => { registered = await request.json(); return HttpResponse.json(pending, { status: 201 }); }),
      http.post("/api/organization/settings/domains/domain-1/verify", () => {
        verifications += 1;
        return verifications === 1
          ? HttpResponse.json({ status: 422, code: "Settings.TenantDomain.TxtNotFound", title: "No", detail: "No encontramos el registro TXT de verificación en el DNS." }, { status: 422 })
          : new HttpResponse(null, { status: 204 });
      }),
    );
    renderRouteWithProviders("/org/configuracion", { as: "business-e6-admin" });
    expect(await screen.findByText("Sin dominio")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Agregar dominio" }));
    const add = await screen.findByRole("dialog", { name: "Agregar dominio" });
    await user.type(within(add).getByRole("textbox", { name: "Dominio" }), "delta.example.test");
    await user.click(within(add).getByRole("button", { name: "Siguiente" }));
    await waitFor(() => expect(registered).toEqual({ domain: "delta.example.test" }));

    const verify = await screen.findByRole("dialog", { name: "Verificar delta.example.test" });
    expect(verify).toHaveTextContent("Registro TXT a cargar en el DNS de delta.example.test");
    expect(within(verify).getByText("ab-verificacion=7f3c9a2e")).toBeVisible();
    await user.click(within(verify).getByRole("button", { name: "Copiar" }));
    expect(await navigator.clipboard.readText()).toBe("ab-verificacion=7f3c9a2e");
    expect(within(verify).getByRole("button", { name: "Copiado" })).toBeVisible();

    await user.click(within(verify).getByRole("button", { name: "Comprobar" }));
    expect(await within(verify).findByRole("alert")).toHaveTextContent("No encontramos el registro TXT de verificación en el DNS.");
    await user.click(within(verify).getByRole("button", { name: "Comprobar" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Verificar delta.example.test" })).not.toBeInTheDocument());
    expect(await screen.findByText("Verificamos delta.example.test.")).toBeVisible();
  });

  it("en un dominio pendiente, «Verificar» abre el diálogo con el TXT y la fila no lo muestra", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("/api/organization/settings", () => HttpResponse.json(settings)),
      http.get("/api/organization/settings/domains", () => HttpResponse.json([pending])),
    );
    renderRouteWithProviders("/org/configuracion", { as: "business-e6-admin" });
    expect(await screen.findByText("delta.example.test")).toBeVisible();
    expect(screen.getByText("Pendiente")).toBeVisible();
    expect(screen.queryByText(/ab-verificacion/)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Verificar" }));
    const verify = await screen.findByRole("dialog", { name: "Verificar delta.example.test" });
    expect(within(verify).getByText("ab-verificacion=7f3c9a2e")).toBeVisible();
  });
  // Tablero Avisos («Guardado»): después de guardar, el formulario queda limpio, aunque la ficha que se vuelve a leer
  // todavía no traiga lo guardado (como en el arnés de capturas).
  it("después de guardar queda limpio con lo guardado", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("/api/organization/settings", () => HttpResponse.json(settings)),
      http.get("/api/organization/settings/domains", () => HttpResponse.json([verified])),
      http.put("/api/organization/settings", () => new HttpResponse(null, { status: 204 })),
    );
    renderRouteWithProviders("/org/configuracion", { as: "business-e6-admin" });

    const name = await screen.findByRole("textbox", { name: "Nombre de la organización" });
    await user.clear(name);
    await user.type(name, "Grupo Delta Sur");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(await screen.findAllByText("Guardamos la configuración.")).not.toHaveLength(0);
    await waitFor(() => expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeDisabled());
  });

  // B11 (tablero Avisos › «Salir sin guardar»): con el nombre cambiado, la banda dice «Cambios sin guardar» y un enlace
  // del menú pregunta antes de salir; «Seguir editando» se queda con lo escrito.
  it("con cambios, un enlace del menú pregunta «¿Salir sin guardar?»", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("/api/organization/settings", () => HttpResponse.json(settings)),
      http.get("/api/organization/settings/domains", () => HttpResponse.json([verified])),
    );
    const { router } = renderRouteWithProviders("/org/configuracion", { as: "business-e6-admin" });

    const name = await screen.findByRole("textbox", { name: "Nombre de la organización" });
    await user.clear(name);
    await user.type(name, "Grupo Delta Sur");
    await user.click(screen.getByRole("link", { name: "Empresas" }));
    const dialog = await screen.findByRole("dialog", { name: "¿Salir sin guardar?" });
    expect(dialog).toHaveTextContent("Se pierde lo que cambiaste acá.");
    expect(router.state.location.pathname).toBe("/org/configuracion");

    await user.click(within(dialog).getByRole("button", { name: "Seguir editando" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "¿Salir sin guardar?" })).not.toBeInTheDocument());
    expect(screen.getByRole("textbox", { name: "Nombre de la organización" })).toHaveValue("Grupo Delta Sur");

    await user.click(screen.getByRole("link", { name: "Empresas" }));
    await user.click(within(await screen.findByRole("dialog", { name: "¿Salir sin guardar?" })).getByRole("button", { name: "Salir sin guardar" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/org/empresas"));
  });

  // Tablero Configuracion: con cambios, la segunda línea de la banda dice solo «Cambios sin guardar».
  it("con cambios, la banda dice «Cambios sin guardar»", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("/api/organization/settings", () => HttpResponse.json(settings)),
      http.get("/api/organization/settings/domains", () => HttpResponse.json([verified])),
    );
    renderRouteWithProviders("/org/configuracion", { as: "business-e6-admin" });

    const name = await screen.findByRole("textbox", { name: "Nombre de la organización" });
    const subline = () => screen.getByRole("heading", { level: 1, name: "Configuración" }).parentElement!.querySelector("[data-slot='page-subline']");
    expect(subline()).toBeNull();
    await user.clear(name);
    await user.type(name, "Grupo Delta Sur");
    expect(subline()).toHaveTextContent(/^Cambios sin guardar$/);
    await user.click(screen.getByRole("button", { name: "Descartar cambios" }));
    expect(subline()).toBeNull();
  });
});
