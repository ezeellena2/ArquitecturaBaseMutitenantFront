import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { configureI18n } from "@/shared/i18n";
import { asPhone } from "@/test/utils/phone";
import { renderWithProviders } from "@/test/utils/renderWithProviders";
import { SiteLayout } from "./SiteLayout";

beforeEach(async () => {
  await configureI18n([{ code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true }]);
});

afterEach(() => vi.unstubAllGlobals());

describe("SiteLayout", () => {
  it("tiene marca, navegación pública, puertas de ingreso y enlaces legales", async () => {
    const { container } = render(<MemoryRouter><SiteLayout><h1>{"Portada"}</h1></SiteLayout></MemoryRouter>);

    expect(screen.getByRole("link", { name: "ArquitecturaBase" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "ArquitecturaBase" }).querySelector(".brand-mark")).not.toBeNull();
    // La marca, con el espaciado del tablero (.lp-marca, -0.01em).
    expect(screen.getByRole("link", { name: "ArquitecturaBase" })).toHaveClass("tracking-[-0.01em]");
    expect(screen.getByRole("navigation", { name: "Secciones" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Personas" })).toHaveAttribute("href", "#personas");
    expect(screen.getByRole("link", { name: "Empresas" })).toHaveAttribute("href", "#empresas");
    expect(within(screen.getByRole("navigation", { name: "Secciones" })).getAllByRole("link").map((link) => link.textContent)).toEqual(["Personas", "Cómo empezar", "Empresas"]);
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

    expect(screen.getByRole("banner")).toHaveClass("h-[61px]", "md:h-[73px]");
    const business = screen.getByRole("link", { name: "Ingresá como empresa" });
    const login = screen.getByRole("link", { name: "Ingresar" });
    expect(business.parentElement).toHaveClass("gap-2.5");
    expect(business.parentElement).not.toHaveClass("md:gap-2");
    // Tablero Legal (.lp-der .b): en la compu, dos botones de 36, con borde transparente, 14 a los costados y 8 de radio.
    for (const link of [business, login]) {
      expect(link).toHaveClass("h-8", "rounded-[8px]", "border", "border-transparent", "px-3", "md:h-9", "md:px-3.5");
      expect(link).not.toHaveClass("md:h-10", "md:border-0", "md:px-[18px]", "md:rounded-[10px]");
    }
    // Tablero Legal (.lp-marca): el logo de la compu mide 28, como en el teléfono.
    expect(screen.getByRole("link", { name: "ArquitecturaBase" }).querySelector(".brand-mark")).not.toHaveClass("md:size-8");
    expect(login).toHaveClass("bg-[linear-gradient(180deg,var(--marca)_0%,var(--marca-h)_100%)]", "shadow-[0_1px_2px_var(--marca-sombra),inset_0_1px_0_var(--brillo)]",
      "md:bg-none", "md:shadow-none");
    expect(screen.getByRole("contentinfo")).toHaveClass("py-4", "max-md:leading-[1.6]", "md:py-6");
    expect(screen.getByRole("link", { name: "Privacidad" }).parentElement).toHaveClass("gap-4", "md:gap-5");
  });
});

describe("navegación del marco público E7", () => {
  it.each(["landing", "directory"] as const)("el encabezado %s es el mismo con sesión o sin ella", async (variant) => {
    const ui = <MemoryRouter><SiteLayout variant={variant}><h1>{"Sitio público"}</h1></SiteLayout></MemoryRouter>;
    const anonymous = renderWithProviders(ui);
    const header = screen.getByRole("banner").innerHTML;
    anonymous.unmount();

    const authenticated = renderWithProviders(ui, { as: "consumer-with-organizations" });
    await waitFor(() => expect(authenticated.queryClient.getQueryData(["current-user"])).toMatchObject({ displayName: "Ana" }));
    expect(screen.getByRole("banner").innerHTML).toBe(header);
    expect(screen.queryByRole("button", { name: /Ana/ })).not.toBeInTheDocument();
    expect(await axe(authenticated.container)).toHaveNoViolations();
  });

  it("el directorio lleva a las secciones de la portada y marca Empresas como ruta actual", async () => {
    const { container } = render(<MemoryRouter><SiteLayout variant="directory"><h1>{"Empresas"}</h1></SiteLayout></MemoryRouter>);
    const nav = screen.getByRole("navigation", { name: "Secciones" });
    expect(within(nav).getAllByRole("link").map((link) => [link.textContent, link.getAttribute("href")])).toEqual([
      ["Personas", "/#personas"], ["Cómo empezar", "/#empezar"], ["Empresas", "/empresas"],
    ]);
    expect(within(nav).getByRole("link", { name: "Empresas" })).toHaveAttribute("aria-current", "page");
    expect(screen.queryByText("Ayuda")).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("el desplegable web móvil sigue el orden, marca Empresas y cierra con Escape devolviendo el foco", async () => {
    asPhone();
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={["/empresas"]}><SiteLayout variant="directory"><h1>{"Empresas"}</h1></SiteLayout></MemoryRouter>);
    expect(screen.getByRole("link", { name: "Ingresar" })).toHaveAttribute("href", "/login");
    expect(screen.queryByRole("link", { name: "Ingresá como empresa" })).not.toBeInTheDocument();

    const trigger = screen.getByRole("button", { name: "Abrir el menú" });
    trigger.focus();
    await user.keyboard("{Enter}");
    const dialog = await screen.findByRole("dialog", { name: "Secciones" });
    expect(within(dialog).getAllByRole("link").map((link) => link.textContent)).toEqual(["Personas", "Cómo empezar", "Empresas", "Ingresá como empresa"]);
    expect(within(dialog).getByRole("link", { name: "Empresas" })).toHaveAttribute("aria-current", "page");
    expect(within(dialog).getByRole("link", { name: "Ingresá como empresa" })).toHaveAttribute("href", "/login/empresa");
    expect(dialog).not.toHaveAttribute("aria-modal", "true");
    expect(document.querySelector("[data-slot='dialog-overlay']")).toBeNull();
    expect(document.querySelector("[data-slot='bottom-nav']")).toBeNull();
    expect(await axe(dialog)).toHaveNoViolations();

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("al seguir una sección del desplegable de la portada lo cierra", async () => {
    asPhone();
    const user = userEvent.setup();
    render(<MemoryRouter><SiteLayout><h1>{"Portada"}</h1></SiteLayout></MemoryRouter>);
    await user.click(screen.getByRole("button", { name: "Abrir el menú" }));
    const dialog = await screen.findByRole("dialog", { name: "Secciones" });
    const companies = within(dialog).getByRole("link", { name: "Empresas" });
    expect(companies).toHaveAttribute("href", "#empresas");
    await user.click(companies);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("el subdominio sin sesión muestra solo la marca y legales del dominio principal", async () => {
    asPhone();
    const { container } = renderWithProviders(<MemoryRouter><SiteLayout variant="storefront"><h1>{"Página pública"}</h1></SiteLayout></MemoryRouter>);
    expect(screen.getByRole("link", { name: "ArquitecturaBase" })).toHaveAttribute("href", "https://localtest.me:5174/");
    expect(screen.getByRole("link", { name: "Términos" })).toHaveAttribute("href", "https://localtest.me:5174/terminos");
    expect(screen.getByRole("link", { name: "Privacidad" })).toHaveAttribute("href", "https://localtest.me:5174/privacidad");
    expect(screen.queryByRole("button", { name: "Abrir el menú" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Tu cuenta" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Ingresar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Ingresá como empresa" })).not.toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toHaveTextContent("© 2026 ArquitecturaBase");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("el menú de escritorio toma la identidad global, sin confundirla con la organización publicada", async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(<MemoryRouter><SiteLayout variant="storefront" publicSiteName="Otra organización"><h1>{"Página pública"}</h1></SiteLayout></MemoryRouter>, { as: "consumer-with-organizations" });
    const trigger = await screen.findByRole("button", { name: "Ana, Personal" });
    trigger.focus();
    await user.keyboard("{Enter}");
    const menu = await screen.findByRole("menu");
    expect(menu).toHaveAttribute("aria-label", "Menú de Ana");
    expect(within(menu).getByText("ana@example.test")).toBeVisible();
    expect(within(menu).getByText("Empresa A")).toBeVisible();
    expect(within(menu).queryByText("Otra organización")).not.toBeInTheDocument();
    expect(await axe(menu)).toHaveNoViolations();
    await user.keyboard("{Escape}");
    expect(screen.getByRole("contentinfo")).toHaveTextContent("© 2026 Otra organización · en ArquitecturaBase");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("en el subdominio móvil la cuenta abre una hoja inferior, sin administración ni barra de la app", async () => {
    asPhone();
    const user = userEvent.setup();
    renderWithProviders(<MemoryRouter><SiteLayout variant="storefront" publicSiteName="Otra organización"><h1>{"Página pública"}</h1></SiteLayout></MemoryRouter>, { as: "consumer-with-organizations" });
    const trigger = await screen.findByRole("button", { name: "Tu cuenta" });
    trigger.focus();
    await user.keyboard("{Enter}");
    const dialog = await screen.findByRole("dialog", { name: "Menú de Ana" });
    expect(document.querySelector("[data-slot='dialog-overlay']")).not.toBeNull();
    expect(within(dialog).getByText("ana@example.test")).toBeVisible();
    expect(within(dialog).getByRole("button", { name: /Personal/, pressed: true })).toBeVisible();
    expect(within(dialog).getByRole("button", { name: "Empresa A" })).toBeVisible();
    expect(within(dialog).getByRole("link", { name: "Mi cuenta" })).toBeVisible();
    expect(within(dialog).getByRole("button", { name: "Salir" })).toBeVisible();
    expect(within(dialog).queryByText("Otra organización")).not.toBeInTheDocument();
    expect(within(dialog).queryByText("Administración")).not.toBeInTheDocument();
    expect(document.querySelector("[data-slot='bottom-nav']")).toBeNull();
    expect(await axe(dialog)).toHaveNoViolations();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it("el pie público traduce el nombre de la organización sin tomarlo de la sesión", async () => {
    const { container } = renderWithProviders(<MemoryRouter><SiteLayout variant="storefront" publicSiteName="Public organization"><h1>{"Public page"}</h1></SiteLayout></MemoryRouter>, { as: "consumer-english-profile" });
    expect(await screen.findByText("© 2026 Public organization · on ArquitecturaBase")).toBeVisible();
    expect(screen.getByRole("link", { name: "Terms" })).toHaveAttribute("href", "https://localtest.me:5174/terminos");
    expect(screen.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "https://localtest.me:5174/privacidad");
    expect(await axe(container)).toHaveNoViolations();
  });
});
