import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { configureI18n, changeCulture } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";

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
    expect(await axe(container)).toHaveNoViolations();

    const user = userEvent.setup();
    await user.clear(name);
    await user.type(name, "Grupo Delta Sur");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(updateBody).toEqual({ ...settings, name: "Grupo Delta Sur" }));

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
});
