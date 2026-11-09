import { screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { configureI18n } from "@/shared/i18n";
import { AppChromeProvider } from "@/shared/ui/app/AppChrome";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { renderWithProviders } from "@/test/utils/renderWithProviders";
import { OtherAccessPage } from "./OtherAccessPage";

beforeAll(async () => { await configureI18n(referenceDataFixture().cultures); });

// Tableros M-Otro-Acceso y M-Otro-Acceso-Persona, como M-Error-Org: mientras se ve, la barra de abajo no marca ninguna
// sección (antes quedaba marcado «Más»).
describe("Otro acceso en el teléfono", () => {
  it("la barra de abajo no marca ninguna sección", async () => {
    const hideActiveSection = vi.fn();
    const { unmount } = renderWithProviders(<MemoryRouter>
      <AppChromeProvider value={{ phone: true, parent: null, subtitle: null, title: "Inicio", hideBottomNav: () => {}, hideActiveSection }}>
        <OtherAccessPage target="consumer" returnTo="/mensajes" organizations={[]} />
      </AppChromeProvider>
    </MemoryRouter>, { as: "business-admin" });

    expect(await screen.findByRole("heading", { level: 1, name: "Este link es de tu perfil personal" })).toBeVisible();
    expect(hideActiveSection).toHaveBeenLastCalledWith(true);
    unmount();
    expect(hideActiveSection).toHaveBeenLastCalledWith(false);
  });
});
