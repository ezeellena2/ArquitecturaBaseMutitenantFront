import { render, screen } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { RouterProvider, createMemoryRouter } from "react-router";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppProviders } from "@/app/providers";
import { routes } from "@/app/routes";
import { createQueryClient } from "@/shared/api/queryClient";
import { changeCulture, configureI18n } from "@/shared/i18n";
import { fixtureAuth } from "@/test/mocks/authContext";
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
  // «Criterio · Avisos»: el mismo error nunca va en dos lugares. Si /api/me falla, la pantalla lo dice con «Reintentar»
  // y no sale además el aviso rojo de abajo.
  it("si falla /api/me, sale un solo aviso, con «Reintentar»", async () => {
    const errorToast = vi.spyOn(toast, "error");
    server.use(http.get("/api/me", () => HttpResponse.json(
      { status: 500, title: "Error", traceId: "00-abc-01" }, { status: 500, headers: { "Content-Type": "application/problem+json" } })));
    renderWithSession("/cuenta");

    expect(await screen.findByRole("button", { name: "Reintentar" })).toBeVisible();
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(screen.getByRole("alert")).toHaveTextContent("Algo salió mal. Probá de nuevo en un rato.");
    expect(errorToast).not.toHaveBeenCalled();
  });
});
