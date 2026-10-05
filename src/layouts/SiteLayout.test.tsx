import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeAll, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { configureI18n } from "@/shared/i18n";
import { SiteLayout } from "./SiteLayout";

beforeAll(async () => {
  await configureI18n([{ code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true }]);
});

describe("SiteLayout", () => {
  it("tiene marca, navegación pública, puertas de ingreso y enlaces legales", async () => {
    const { container } = render(<MemoryRouter><SiteLayout><h1>{"Portada"}</h1></SiteLayout></MemoryRouter>);

    expect(screen.getByRole("link", { name: "ArquitecturaBase" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "ArquitecturaBase" }).querySelector(".brand-mark")).not.toBeNull();
    // La marca, con el espaciado del tablero (.lp-marca, -0.01em).
    expect(screen.getByRole("link", { name: "ArquitecturaBase" })).toHaveClass("tracking-[-0.01em]");
    expect(screen.getByRole("navigation", { name: "Secciones" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Personas" })).toHaveAttribute("href", "#personas");
    expect(screen.getByRole("link", { name: "Empresas" })).toHaveAttribute("href", "#organizaciones");
    expect(screen.getByRole("link", { name: "Ingresá como empresa" })).toHaveAttribute("href", "/login/empresa");
    expect(screen.getByRole("link", { name: "Ingresar" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("main")).toContainElement(screen.getByRole("heading", { name: "Portada" }));
    expect(screen.getByRole("link", { name: "Términos" })).toHaveAttribute("href", "/terminos");
    expect(screen.getByRole("link", { name: "Privacidad" })).toHaveAttribute("href", "/privacidad");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("en legales deja sólo marca, ingresos y enlaces legales del tablero", () => {
    render(<MemoryRouter><SiteLayout variant="legal"><h1>{"Términos y condiciones"}</h1></SiteLayout></MemoryRouter>);

    expect(screen.getByRole("link", { name: "ArquitecturaBase" })).toHaveAttribute("href", "/");
    expect(screen.queryByRole("navigation", { name: "Secciones" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ingresá como empresa" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Ingresar" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Términos" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Privacidad" })).toBeVisible();
    expect(screen.queryByText("Ayuda")).not.toBeInTheDocument();
  });

  // Tablero M-Legal (.pp.m): en el teléfono, la cabecera de 60 más su raya; «Empresas» y «Ingresar» son botones chicos
  // de 32 con 12 a los costados, a 10 entre sí, e «Ingresar» lleva el degradé y la sombra del principal. El pie, con 16
  // arriba y abajo, renglones de 1,6 y 16 entre los enlaces.
  it("en el teléfono, la cabecera y el pie de los legales van como el tablero", () => {
    render(<MemoryRouter><SiteLayout variant="legal"><h1>{"Términos y condiciones"}</h1></SiteLayout></MemoryRouter>);

    expect(screen.getByRole("banner")).toHaveClass("h-[61px]", "md:h-[72px]");
    const business = screen.getByRole("link", { name: "Ingresá como empresa" });
    const login = screen.getByRole("link", { name: "Ingresar" });
    expect(business.parentElement).toHaveClass("gap-2.5", "md:gap-2");
    for (const link of [business, login]) expect(link).toHaveClass("h-8", "border", "border-transparent", "px-3", "md:h-10", "md:border-0");
    expect(login).toHaveClass("bg-[linear-gradient(180deg,var(--marca)_0%,var(--marca-h)_100%)]", "shadow-[0_1px_2px_var(--marca-sombra),inset_0_1px_0_var(--brillo)]",
      "md:bg-none", "md:shadow-none");
    expect(screen.getByRole("contentinfo")).toHaveClass("py-4", "max-md:leading-[1.6]", "md:py-6");
    expect(screen.getByRole("link", { name: "Privacidad" }).parentElement).toHaveClass("gap-4", "md:gap-5");
  });
});
