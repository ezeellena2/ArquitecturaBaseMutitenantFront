import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { RouterProvider, createMemoryRouter } from "react-router";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppProviders } from "@/app/providers";
import { routes } from "@/app/routes";
import { createQueryClient } from "@/shared/api/queryClient";
import { changeCulture, configureI18n } from "@/shared/i18n";
import { fixtureAuth } from "@/test/mocks/authContext";
import { consumerWithoutOrganizations } from "@/test/mocks/currentUsers";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";

beforeEach(async () => {
  await configureI18n(referenceDataFixture().cultures);
  await changeCulture("es-AR");
});

afterEach(() => { vi.restoreAllMocks(); });

// Como renderRouteWithProviders, pero con el /api/me de la prueba: el de `as` respondería primero.
function renderWithSession(path: string) {
  const client = createQueryClient({ queries: { retry: false }, mutations: { retry: false } });
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  return render(<AppProviders client={client} authContext={fixtureAuth("consumer-empty")}><RouterProvider router={router} /></AppProviders>);
}

describe("LegalAcceptanceGate", () => {
  // «Criterio · Avisos»: el mismo error nunca va en dos lugares. Si /api/me falla no se puede mostrar nada: la
  // «Pantalla de error» con «Reintentar», sin el aviso rojo de abajo. «Reintentar» lo vuelve a pedir.
  it("si falla /api/me, sale la pantalla de error con «Reintentar» y nada más", async () => {
    const user = userEvent.setup();
    const errorToast = vi.spyOn(toast, "error");
    let fail = true;
    server.use(http.get("/api/me", () => fail
      ? HttpResponse.json({ status: 500, title: "Error", traceId: "00-abc-01" }, { status: 500, headers: { "Content-Type": "application/problem+json" } })
      : HttpResponse.json(consumerWithoutOrganizations)));
    renderWithSession("/cuenta");

    expect(await screen.findByRole("heading", { name: "No pudimos abrir esta pantalla" })).toBeVisible();
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(errorToast).not.toHaveBeenCalled();

    fail = false;
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByRole("heading", { name: "Mi cuenta" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "No pudimos abrir esta pantalla" })).not.toBeInTheDocument();
  });
});
