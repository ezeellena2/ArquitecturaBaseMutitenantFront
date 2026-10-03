import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { configureI18n, changeCulture } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";

beforeEach(async () => {
  await configureI18n(referenceDataFixture().cultures);
  await changeCulture("es-AR");
});

describe("SettingsPage", () => {
  it("guarda con versión y explica que los correos existentes siguen protegidos al quitar un dominio", async () => {
    let updateBody: unknown;
    let removeUrl: URL | undefined;
    server.use(
      http.get("/api/organization/settings", () => HttpResponse.json({
        name: "Grupo Delta", defaultCulture: "es-AR", defaultTimeZoneId: "America/Argentina/Buenos_Aires", defaultCurrency: "ARS", version: 12,
      })),
      http.get("/api/organization/settings/domains", () => HttpResponse.json([{
        id: "domain-1", domain: "delta.example.test", status: "Verified", txtRecordName: null, txtRecordValue: null,
        createdAtUtc: "2026-10-01T12:00:00Z", verifiedAtUtc: "2026-10-01T12:05:00Z", version: 4,
      }])),
      http.put("/api/organization/settings", async ({ request }) => { updateBody = await request.json(); return new HttpResponse(null, { status: 204 }); }),
      http.delete("/api/organization/settings/domains/:domainId", ({ request }) => { removeUrl = new URL(request.url); return new HttpResponse(null, { status: 204 }); }),
    );

    const { container } = renderRouteWithProviders("/org/configuracion", { as: "business-e6-admin" });
    const name = await screen.findByRole("textbox", { name: "Nombre de la organización" });
    expect(await screen.findByText("delta.example.test")).toBeVisible();
    expect(await axe(container)).toHaveNoViolations();

    const user = userEvent.setup();
    await user.clear(name);
    await user.type(name, "Grupo Delta Sur");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(updateBody).toEqual({
      name: "Grupo Delta Sur", defaultCulture: "es-AR", defaultTimeZoneId: "America/Argentina/Buenos_Aires", defaultCurrency: "ARS", version: 12,
    }));

    await user.click(screen.getByRole("button", { name: "Acciones de delta.example.test" }));
    await user.click(await screen.findByRole("menuitem", { name: "Quitar" }));
    expect(screen.getByText(/Los correos que ya están vinculados seguirán protegidos/)).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Quitar" }));
    await waitFor(() => expect(removeUrl?.searchParams.get("version")).toBe("4"));
  });
});
