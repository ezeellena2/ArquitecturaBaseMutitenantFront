import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { configureI18n, changeCulture } from "@/shared/i18n";
import { consumerWithoutOrganizations } from "@/test/mocks/currentUsers";
import { server } from "@/test/mocks/server";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";
import { referenceDataFixture } from "@/test/mocks/handlers";

beforeEach(async () => { await configureI18n(referenceDataFixture().cultures); await changeCulture("es-AR"); });

describe("Mi cuenta", () => {
  it("guarda el idioma con versión y actualiza los textos sin cambiar de acceso", async () => {
    const user = userEvent.setup();
    let submitted: unknown;
    server.use(http.put("/api/me", async ({ request }) => {
      submitted = await request.json();
      server.use(http.get("/api/me", () => HttpResponse.json({ ...consumerWithoutOrganizations, culture: "en-US", version: 43 })));
      return new HttpResponse(null, { status: 204 });
    }));
    const { router, container } = renderRouteWithProviders("/cuenta", { as: "consumer-empty" });
    expect(await screen.findByRole("heading", { name: "Mi cuenta" })).toBeVisible();
    await user.click(screen.getByRole("combobox", { name: "Idioma y región" }));
    await user.click(await screen.findByRole("option", { name: "Inglés (Estados Unidos)" }));
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(submitted).toMatchObject({ culture: "en-US", version: 42 }));
    expect(await screen.findByRole("heading", { name: "My account" })).toBeVisible();
    expect(router.state.location.pathname).toBe("/cuenta");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("conserva el draft cuando otro guardado devuelve 409 y permite descartarlo", async () => {
    const user = userEvent.setup();
    server.use(http.put("/api/me", () => HttpResponse.json({ code: "General.ConcurrencyConflict" }, { status: 409 })));
    renderRouteWithProviders("/cuenta", { as: "consumer-empty" });
    const name = await screen.findByRole("textbox", { name: "Nombre y apellido" });
    await user.clear(name);
    await user.type(name, "Nombre nuevo");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(await screen.findByRole("button", { name: "Ver lo nuevo" })).toBeVisible();
    expect(name).toHaveValue("Nombre nuevo");
    await user.click(screen.getByRole("button", { name: "Descartar cambios" }));
    expect(name).toHaveValue("Ana");
  });
});

