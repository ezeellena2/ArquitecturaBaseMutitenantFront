import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeAll, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { SiteLayout } from "@/layouts/SiteLayout";
import { configureI18n } from "@/shared/i18n";
import { LandingPage } from "./LandingPage";

beforeAll(async () => {
  await configureI18n([
    { code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true },
    { code: "en-US", languageCode: "en", fallbackCulture: "es-AR", isEnabled: true, isDefault: false },
  ]);
});

function show() { return render(<MemoryRouter><SiteLayout><LandingPage /></SiteLayout></MemoryRouter>); }

describe("LandingPage", () => {
  it("respeta secciones, textos y orden del tablero de escritorio", async () => {
    const { container } = show();
    const main = screen.getByRole("main");
    const headings = within(main).getAllByRole("heading").map((heading) => heading.textContent);
    expect(headings).toEqual([
      "Para vos y para tu empresa.", "Dos lados separados", "Para personas", "Para empresas",
      "Tu empresa, en tres pasos", "Registrá tu empresa", "Sumá las otras empresas", "Invitá a tu equipo", "Probalo hoy",
    ]);
    expect(within(main).getByText("Como persona, creá tu cuenta con tu correo o tu WhatsApp. Si tenés una empresa o un grupo, registralo y sumá a tu equipo con sus roles.")).toBeVisible();
    expect(within(main).getByText("Lucía Fernández")).toBeVisible();
    expect(within(main).getByText("Grupo Delta")).toBeVisible();
    expect(within(main).getAllByRole("link", { name: "Crear mi cuenta" })).toHaveLength(3);
    expect(within(main).getAllByRole("link", { name: "Crear mi cuenta" })[0]).toHaveClass("min-h-10");
    expect(within(main).getAllByRole("link", { name: "Crear mi cuenta" })[2]).toHaveClass("min-h-10");
    expect(within(main).getAllByRole("link", { name: "Crear mi cuenta" })[0]).toHaveClass("after:-inset-y-0.5");
    expect(within(main).getByRole("heading", { name: "Registrá tu empresa" })).toBeVisible();
    expect(within(main).queryByRole("link", { name: "Registrá tu empresa" })).not.toBeInTheDocument();
    expect(within(main).getAllByText("Registrá tu empresa")).toHaveLength(1);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("lleva a la puerta empresarial y al registro personal; conserva el orden móvil a 390", async () => {
    const originalWidth = window.innerWidth;
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
    try {
      const { container } = show();
      for (const link of screen.getAllByRole("link", { name: "Ingresá como empresa" })) expect(link).toHaveAttribute("href", "/login/empresa");
      expect(within(screen.getByRole("main")).getAllByRole("link", { name: "Crear mi cuenta" })[0]).toHaveAttribute("href", "/registro");
      expect(screen.getByRole("navigation", { name: "Secciones" })).toHaveClass("hidden");
      expect(await axe(container)).toHaveNoViolations();
    } finally { Object.defineProperty(window, "innerWidth", { configurable: true, value: originalWidth }); }
  });
});
