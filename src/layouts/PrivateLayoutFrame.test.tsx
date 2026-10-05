import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { configureI18n } from "@/shared/i18n";
import { beginSignOut, cancelSignOut } from "@/auth/signOutStatus";
import { businessNavigation } from "./navigation/business";
import { personalNavigation } from "./navigation/personal";
import { platformNavigation } from "./navigation/platform";
import { platformPermissions } from "@/auth/usePermissions";
import { Page } from "@/shared/ui/Page";
import { PrivateLayoutFrame } from "./PrivateLayoutFrame";

const viewport = vi.hoisted(() => ({ mobile: false }));
const session = vi.hoisted(() => ({ permissions: [] as string[], platform: [] as string[] }));
vi.mock("@/shared/hooks/useMediaQuery", () => ({ useMediaQuery: () => viewport.mobile }));
vi.mock("@/auth/useCurrentUser", () => ({ useCurrentUser: () => ({ data: { displayName: "Ana", email: "ana@example.com", activeTenantId: "empresa-a", organizations: [{ id: "empresa-a", name: "Empresa A" }], features: [], effectivePermissions: { platform: session.platform, organization: session.permissions, companies: {} } } }) }));
vi.mock("@/tenancy/AccessMenu", () => ({ AccessMenu: () => <button type="button">{"Cuenta"}</button> }));

beforeAll(async () => {
  await configureI18n([{ code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true }]);
});
afterEach(() => { viewport.mobile = false; session.permissions = []; session.platform = []; cancelSignOut(); });

describe("PrivateLayoutFrame", () => {
  it("muestra el contexto de empresa sin enlaces de Administración de etapas futuras", () => {
    render(<MemoryRouter initialEntries={["/org"]}><PrivateLayoutFrame navigation={businessNavigation} scope="business"><h1>{"Inicio"}</h1></PrivateLayoutFrame></MemoryRouter>);
    expect(screen.getByRole("banner")).toHaveClass("h-[52px]");
    expect(screen.getByRole("complementary", { name: "Navegación principal" })).toHaveClass("w-[232px]");
    expect(screen.getByRole("main")).toHaveClass("bg-[var(--fondo)]");
    expect(screen.getByText("Empresa A")).toBeVisible();
    expect(screen.getByText("Organización")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Administración" })).not.toBeInTheDocument();
  });

  // Tablero Usuarios: en una pantalla de Administración el panel ya está abierto; en Inicio, cerrado.
  it("abre el panel en las rutas de Administración y lo cierra al volver a Inicio", async () => {
    session.permissions = ["users.read", "audit.read"];
    render(<MemoryRouter initialEntries={["/org/usuarios/abc"]}><PrivateLayoutFrame navigation={businessNavigation} scope="business"><h1>{"Usuario"}</h1></PrivateLayoutFrame></MemoryRouter>);
    expect(screen.getByRole("navigation", { name: "Administración" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Administración" })).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(screen.getByRole("button", { name: "Cerrar Administración" }));
    expect(screen.queryByRole("navigation", { name: "Administración" })).not.toBeInTheDocument();
    await userEvent.click(within(screen.getByRole("complementary", { name: "Navegación principal" })).getByRole("link", { name: "Inicio" }));
    await userEvent.click(screen.getByRole("button", { name: "Administración" }));
    await userEvent.click(screen.getByRole("link", { name: "Auditoría" }));
    expect(screen.getByRole("navigation", { name: "Administración" })).toBeVisible();
  });

  // «Criterio · Marco» y «Criterio · Menús» (lienzo v104): la barra lleva las migas y tu menú, nada más. Sin ☰, también
  // en la organización: el menú se achica solo con la flecha redonda de 28 en su borde.
  it.each([
    ["Personal", "/", personalNavigation, "personal"],
    ["la organización", "/org", businessNavigation, "business"],
  ] as const)("en %s la barra no lleva ☰ y el menú se contrae con la flecha del borde", (_, path, navigation, scope) => {
    render(<MemoryRouter initialEntries={[path]}><PrivateLayoutFrame navigation={navigation} scope={scope}><h1>{"Inicio"}</h1></PrivateLayoutFrame></MemoryRouter>);
    expect(screen.queryByRole("button", { name: "Abrir o contraer navegación" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Contraer menú" })).toHaveClass("size-7", "rounded-full");
  });

  // Tablero Usuarios: con el panel de Administración abierto, su flecha lo cierra; la del menú no se ve, y tampoco hay ☰.
  it("con el panel de Administración abierto no hay ☰ ni la flecha del menú, solo la del panel", () => {
    session.permissions = ["users.read"];
    render(<MemoryRouter initialEntries={["/org/usuarios"]}><PrivateLayoutFrame navigation={businessNavigation} scope="business"><h1>{"Usuarios"}</h1></PrivateLayoutFrame></MemoryRouter>);
    expect(screen.queryByRole("button", { name: "Abrir o contraer navegación" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Contraer menú" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cerrar Administración" })).toHaveClass("size-7", "rounded-full");
  });

  // Lienzo v107 («Criterio · Decisiones», flecha para achicar el menú; `.w-plegar` de los tableros): va en el borde del
  // último panel, el de Administración si está abierta y si no el menú, también en Personal. Es la misma en los dos
  // lugares: blanca, redonda, de 28, con borde arena, la flecha de 18 y a 64 de arriba.
  it.each([
    ["Personal", "/", personalNavigation, "personal", [], "Contraer menú", "Navegación principal"],
    ["la organización", "/org", businessNavigation, "business", ["users.read"], "Contraer menú", "Navegación principal"],
    ["la organización con Administración abierta", "/org/usuarios", businessNavigation, "business", ["users.read"], "Cerrar Administración", "Administración"],
  ] as const)("en %s, la flecha va en el borde del último panel", (_, path, navigation, scope, permissions, name, panel) => {
    localStorage.clear();
    session.permissions = [...permissions];
    render(<MemoryRouter initialEntries={[path]}><PrivateLayoutFrame navigation={navigation} scope={scope}><h1>{"Inicio"}</h1></PrivateLayoutFrame></MemoryRouter>);
    const arrows = screen.getAllByRole("button", { name: /^(Contraer menú|Expandir menú|Cerrar Administración)$/ });
    expect(arrows).toHaveLength(1);
    const [arrow] = arrows;
    expect(arrow).toHaveAccessibleName(name);
    expect(arrow.closest("aside, nav")).toHaveAccessibleName(panel);
    expect(arrow).toHaveClass("absolute", "-right-3.5", "top-16", "size-7", "rounded-full", "border-[var(--borde2)]", "bg-[var(--lado-activo)]",
      "text-[var(--t1)]", "hover:text-[var(--marca)]");
    expect(arrow.querySelector("svg")).toHaveAttribute("width", "18");
  });

  it("en Inicio arranca con el panel cerrado", () => {
    session.permissions = ["users.read"];
    render(<MemoryRouter initialEntries={["/org"]}><PrivateLayoutFrame navigation={businessNavigation} scope="business"><h1>{"Inicio"}</h1></PrivateLayoutFrame></MemoryRouter>);
    expect(screen.queryByRole("navigation", { name: "Administración" })).not.toBeInTheDocument();
  });

  // Tableros M-* («Criterio · Marco»): el teléfono es una app. Nada de ☰, marca ni cajón; abajo, Inicio y «Más».
  it("en el teléfono es una app: sin barra de la compu, con Inicio y «Más» abajo", () => {
    viewport.mobile = true;
    render(<MemoryRouter initialEntries={["/org"]}><PrivateLayoutFrame navigation={businessNavigation} scope="business"><h1>{"Inicio"}</h1></PrivateLayoutFrame></MemoryRouter>);

    expect(screen.queryByRole("button", { name: "Abrir o contraer navegación" })).not.toBeInTheDocument();
    expect(screen.queryByRole("complementary", { name: "Navegación principal" })).not.toBeInTheDocument();
    const sections = screen.getByRole("navigation", { name: "Secciones" });
    expect(within(sections).getByRole("link", { name: "Inicio" })).toHaveAttribute("aria-current", "page");
    // Tableros M-* (.ap-nav): la casita de Inicio es el techo y las paredes, sin puerta.
    expect(within(sections).getByRole("link", { name: "Inicio" }).querySelector('path[d="M4 11.5 12 5l8 6.5"]')).not.toBeNull();
    expect(within(sections).getByRole("link", { name: "Más" })).toHaveAttribute("href", "/mas");
    expect(within(sections).getByText("A")).toBeInTheDocument();
  });

  it("en el teléfono, una pantalla de Administración vuelve a «Más» y la marca abajo", () => {
    viewport.mobile = true;
    session.permissions = ["users.read"];
    render(<MemoryRouter initialEntries={["/org/usuarios"]}><PrivateLayoutFrame navigation={businessNavigation} scope="business">
      <Page title="Usuarios"><p>{"lista"}</p></Page>
    </PrivateLayoutFrame></MemoryRouter>);

    expect(screen.getByRole("heading", { level: 1, name: "Usuarios" })).toHaveClass("text-[20px]");
    expect(screen.getByRole("link", { name: "Volver a Más" })).toHaveAttribute("href", "/mas");
    expect(screen.getByText("Administración")).toBeInTheDocument();
    expect(within(screen.getByRole("navigation", { name: "Secciones" })).getByRole("link", { name: "Más" })).toHaveAttribute("aria-current", "page");
  });

  it.each([
    ["/plataforma", "Organizaciones"],
    ["/plataforma/organizaciones/delta", "Organizaciones"],
    ["/plataforma/cuentas", "Cuentas"],
    ["/plataforma/cuentas/ana", "Cuentas"],
    ["/plataforma/recuperaciones", "Recuperaciones"],
    ["/plataforma/mas", "Más"],
    ["/plataforma/auditoria", "Más"],
    ["/plataforma/legales/nueva", "Más"],
    ["/plataforma/configuracion", "Más"],
    ["/cuenta", "Más"],
  ])("en Plataforma, %s marca %s en las cuatro secciones inferiores", async (path, current) => {
    viewport.mobile = true;
    session.platform = [...platformPermissions];
    const { container } = render(<MemoryRouter initialEntries={[path]}><PrivateLayoutFrame navigation={platformNavigation} scope="platform">
      <Page title="Vista de prueba"><p>{"contenido"}</p></Page>
    </PrivateLayoutFrame></MemoryRouter>);
    const links = within(screen.getByRole("navigation", { name: "Secciones" })).getAllByRole("link");
    expect(links).toHaveLength(4);
    ["Organizaciones", "Cuentas", "Recuperaciones", "Más"].forEach((label, index) => expect(links[index]).toHaveAccessibleName(label));
    const selected = links.filter((link) => link.getAttribute("aria-current") === "page");
    expect(selected).toHaveLength(1);
    expect(selected[0]).toHaveAccessibleName(current);
    expect(links.at(-1)).toHaveAttribute("href", "/plataforma/mas");
    if (current === "Organizaciones" || current === "Cuentas" || current === "Recuperaciones") {
      expect(screen.queryByRole("link", { name: "Volver a Más" })).not.toBeInTheDocument();
    }
    expect(screen.queryByText("Consultas")).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it.each([
    ["platform.tenants.read", "Organizaciones"],
    ["platform.accounts.read", "Cuentas"],
    ["platform.recoveries.manage", "Recuperaciones"],
    ["platform.accounts.manage", null],
    ["platform.operators.manage", null],
  ])("la barra de Plataforma con %s muestra sólo su sección y Más", (permission, section) => {
    viewport.mobile = true;
    session.platform = [permission];
    session.permissions = ["users.read", "audit.read"];
    render(<MemoryRouter initialEntries={["/plataforma/mas"]}><PrivateLayoutFrame navigation={platformNavigation} scope="platform">
      <h1>{"Más"}</h1>
    </PrivateLayoutFrame></MemoryRouter>);
    const links = within(screen.getByRole("navigation", { name: "Secciones" })).getAllByRole("link");
    const labels = section ? [section, "Más"] : ["Más"];
    expect(links).toHaveLength(labels.length);
    labels.forEach((label, index) => expect(links[index]).toHaveAccessibleName(label));
  });

  it("las secciones principales de Plataforma llevan el título grande y Plataforma debajo", () => {
    viewport.mobile = true;
    session.platform = ["platform.accounts.read"];
    render(<MemoryRouter initialEntries={["/plataforma/cuentas"]}><PrivateLayoutFrame navigation={platformNavigation} scope="platform">
      <Page title="Cuentas"><p>{"lista"}</p></Page>
    </PrivateLayoutFrame></MemoryRouter>);
    expect(screen.getByRole("heading", { name: "Cuentas" })).toHaveClass("text-[24px]");
    expect(screen.getByText("Plataforma")).toBeVisible();
    expect(screen.queryByRole("link", { name: "Volver a Más" })).not.toBeInTheDocument();
  });

  it("Administración de Plataforma vuelve a Más y muestra el grupo debajo del título", () => {
    viewport.mobile = true;
    session.platform = ["platform.settings.manage"];
    render(<MemoryRouter initialEntries={["/plataforma/configuracion"]}><PrivateLayoutFrame navigation={platformNavigation} scope="platform">
      <Page title="Configuración"><p>{"ajustes"}</p></Page>
    </PrivateLayoutFrame></MemoryRouter>);
    expect(screen.getByRole("heading", { name: "Configuración" })).toHaveClass("text-[20px]");
    expect(screen.getByRole("link", { name: "Volver a Más" })).toHaveAttribute("href", "/plataforma/mas");
    expect(screen.getByText("Administración")).toBeVisible();
  });

  // Tablero M-Empresa («Administra solo la empresa», v108): quien administra solo su empresa llega a la ficha desde su
  // Inicio y vuelve a él con ‹; la barra de abajo marca Inicio y no «Más».
  it("en el teléfono, una pantalla cuyo ‹ vuelve al Inicio marca Inicio abajo", () => {
    viewport.mobile = true;
    render(<MemoryRouter initialEntries={["/org/empresas/company-1"]}><PrivateLayoutFrame navigation={businessNavigation} scope="business">
      <Page title="Delta S.A." backTo={{ to: "/org", label: "Volver al inicio" }}><p>{"miembros"}</p></Page>
    </PrivateLayoutFrame></MemoryRouter>);

    const sections = screen.getByRole("navigation", { name: "Secciones" });
    expect(within(sections).getByRole("link", { name: "Inicio" })).toHaveAttribute("aria-current", "page");
    expect(within(sections).getByRole("link", { name: "Más" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: "Volver al inicio" })).toHaveAttribute("href", "/org");
  });

  it("durante el cierre reemplaza el layout para no mostrar datos de sesión vacíos", () => {
    render(<MemoryRouter><PrivateLayoutFrame navigation={businessNavigation}><h1>{"Inicio"}</h1></PrivateLayoutFrame></MemoryRouter>);
    act(() => beginSignOut());
    expect(screen.getByRole("heading", { name: "Cerrando sesión…" })).toBeVisible();
    expect(screen.queryByRole("complementary", { name: "Navegación principal" })).not.toBeInTheDocument();
  });
});
