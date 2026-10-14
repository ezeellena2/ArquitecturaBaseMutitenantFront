import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { permissionsOf } from "@/auth/usePermissions";
import { configureI18n } from "@/shared/i18n";
import type { ModuleRegistration, ModuleRouteNavigation } from "@/shared/modules/types";
import { AppAccountsIcon, HomeIcon, ShieldCheckIcon } from "@/shared/ui/icons";
import { businessE6Admin, consumerWithoutOrganizations, platformOperator } from "@/test/mocks/currentUsers";
import { PrivateLayoutFrame } from "../PrivateLayoutFrame";
import { businessNavigation } from "./business";
import { personalNavigation } from "./personal";
import { platformNavigationWithHome } from "./platform";
import { composeNavigation } from "./useNavigation";

const viewport = vi.hoisted(() => ({ mobile: false }));
vi.mock("@/shared/hooks/useMediaQuery", () => ({ useMediaQuery: () => viewport.mobile }));
vi.mock("@/auth/useCurrentUser", () => ({ useCurrentUser: () => ({ data: businessE6Admin }) }));
vi.mock("@/tenancy/AccessMenu", () => ({ AccessMenu: () => <button type="button">{"Cuenta"}</button> }));
// La cantidad sale de NumberText, que espera el catálogo: acá basta el número tal cual.
vi.mock("@/shared/ui/format/NumberText", () => ({ NumberText: ({ value }: { value: number }) => <>{String(value)}</> }));
beforeAll(async () => {
  await configureI18n([{ code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true }]);
});
afterEach(() => { viewport.mobile = false; });

const Two = ({ children }: { children: (count: number) => ReactNode }) => children(2);
const panel = { labelKey: "Atención", icon: ShieldCheckIcon, Badge: Two };
const route = (access: "business" | "platform" | "consumer", path: string, navigation: ModuleRouteNavigation) =>
  ({ access, path, guard: () => "allowed" as const, Page: () => null, navigation });
// Un módulo de uso diario como WhatsApp: su panel (dos opciones en la barra y una en Más), su Administración, una opción
// de menú en Plataforma y otra en el perfil personal. Y uno solo del teléfono, como el Asistente.
const daily: ModuleRegistration = { id: "daily", routes: [
  route("business", "/org/a/chats", { placement: "panel", panel, phone: true, labelKey: "Chats", icon: HomeIcon, phoneIcon: AppAccountsIcon, Badge: Two }),
  route("business", "/org/a/contactos", { placement: "panel", panel, phone: true, labelKey: "Contactos", icon: HomeIcon }),
  route("business", "/org/a/difusiones", { placement: "panel", panel, labelKey: "Difusiones", icon: HomeIcon }),
  route("business", "/org/a/numeros", { placement: "administration", section: { labelKey: "Atención", icon: ShieldCheckIcon }, labelKey: "Números", icon: HomeIcon }),
  route("platform", "/plataforma/a", { placement: "menu", labelKey: "Atención", phoneLabelKey: "Consultas", icon: HomeIcon, Badge: Two }),
  route("consumer", "/mensajes", { placement: "menu", labelKey: "Mensajes", icon: HomeIcon }),
] };
const phoneOnly: ModuleRegistration = { id: "phone-only", routes: [
  route("business", "/org/b", { placement: "phone", labelKey: "Ayudante", icon: HomeIcon }),
  route("platform", "/plataforma/b", { placement: "phone", labelKey: "Ayudante", icon: HomeIcon }),
  route("consumer", "/b", { placement: "phone", labelKey: "Ayudante", icon: HomeIcon }),
] };
const modules = [daily, phoneOnly];
const paths = (sections: readonly { link: { path: string } }[] | undefined) => sections?.map((section) => section.link.path);

describe("paneles y menús de los módulos", () => {
  it("la barra del teléfono lleva el Inicio, lo solo del teléfono, el núcleo y al final lo del módulo (M-WA-Chats, M-Mas-Plat, M-WA-Mensajes)", () => {
    const business = composeNavigation(businessNavigation, "business", businessE6Admin, permissionsOf(businessE6Admin), modules);
    expect(paths(business.bottomSections)).toEqual(["/org", "/org/b", "/org/a/chats", "/org/a/contactos"]);
    expect(business.bottomSections?.[2]?.icon).toBe(AppAccountsIcon);
    const platform = composeNavigation(platformNavigationWithHome, "platform", platformOperator, permissionsOf(platformOperator), modules);
    expect(paths(platform.bottomSections)).toEqual(["/plataforma/organizaciones", "/plataforma/b", "/plataforma/cuentas", "/plataforma/a"]);
    const personal = composeNavigation(personalNavigation, "consumer", consumerWithoutOrganizations, permissionsOf(consumerWithoutOrganizations), modules);
    expect(paths(personal.bottomSections)).toEqual(["/", "/b", "/mensajes"]);
  });

  it("en la compu el panel del módulo va después de las opciones y las de menú, después del Inicio (WA-Mensajes, Plat-WA-Chats)", () => {
    const business = composeNavigation(businessNavigation, "business", businessE6Admin, permissionsOf(businessE6Admin), modules);
    expect(business.panels?.map((entry) => [entry.labelKey, entry.links.map((link) => link.path)])).toEqual([["Atención", ["/org/a/chats", "/org/a/contactos", "/org/a/difusiones"]]]);
    expect(business.administration?.sections?.find((section) => section.labelKey === "Atención")?.links.map((link) => link.path)).toEqual(["/org/a/numeros"]);
    const personal = composeNavigation(personalNavigation, "consumer", consumerWithoutOrganizations, permissionsOf(consumerWithoutOrganizations), modules);
    expect(personal.links.map((link) => link.path)).toEqual(["/", "/mensajes", "/cuenta"]);
    const platform = composeNavigation(platformNavigationWithHome, "platform", platformOperator, permissionsOf(platformOperator), modules);
    expect(platform.links.map((link) => link.path)).toEqual(["/plataforma", "/plataforma/a"]);
  });

  it("el panel abre con su ítem, lleva el contador y marca su opción; las migas lo nombran (WA-Chats)", async () => {
    const navigation = composeNavigation(businessNavigation, "business", businessE6Admin, permissionsOf(businessE6Admin), modules);
    render(<MemoryRouter initialEntries={["/org/a/chats"]}><PrivateLayoutFrame navigation={navigation} scope="business"><h1>{"Chats"}</h1></PrivateLayoutFrame></MemoryRouter>);
    const panelNav = screen.getByRole("navigation", { name: "Atención" });
    expect(within(panelNav).getByRole("link", { name: "Chats 2" })).toHaveAttribute("aria-current", "page");
    const item = screen.getByRole("button", { name: "Atención 2" });
    expect(item).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("navigation", { name: "Migas de pan" })).toHaveTextContent("Inicio/Atención/Chats");
    await userEvent.click(item);
    expect(screen.queryByRole("navigation", { name: "Atención" })).not.toBeInTheDocument();
  });

  it("en el teléfono el contador va en la sección de la barra (M-WA-Chats)", async () => {
    viewport.mobile = true;
    const navigation = composeNavigation(businessNavigation, "business", businessE6Admin, permissionsOf(businessE6Admin), modules);
    render(<MemoryRouter initialEntries={["/org/a/chats"]}><PrivateLayoutFrame navigation={navigation} scope="business"><h1>{"Chats"}</h1></PrivateLayoutFrame></MemoryRouter>);
    const chats = await within(await screen.findByRole("navigation", { name: "Secciones" })).findByRole("link", { name: "Chats 2" });
    expect(chats).toHaveAttribute("aria-current", "page");
  });
});
