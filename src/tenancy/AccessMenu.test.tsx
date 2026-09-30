import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { AuthContext, type AuthContextProps } from "react-oidc-context";
import { MemoryRouter } from "react-router";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { currentUserQueryKey } from "@/auth/useCurrentUser";
import { cancelSignOut } from "@/auth/signOutStatus";
import { configureI18n } from "@/shared/i18n";
import type { MeResponse } from "@/shared/api/types";
import { businessUser, consumerWithoutOrganizations, platformOperator } from "@/test/mocks/currentUsers";
import { AccessMenu } from "./AccessMenu";

const switchAccess = vi.fn<({ access, tenantId }: { access: string; tenantId?: string }) => Promise<void>>();
const signoutRedirect = vi.fn(() => new Promise<void>(() => {}));
vi.mock("./useSwitchAccess", () => ({
  useSwitchAccess: () => ({ isSwitching: false, hasError: false, switchAccess }),
}));

beforeAll(async () => {
  await configureI18n([{ code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true }]);
});
afterEach(() => { switchAccess.mockReset(); signoutRedirect.mockClear(); cancelSignOut(); vi.unstubAllGlobals(); });

function setup(account: MeResponse) {
  const client = new QueryClient();
  client.setQueryData(currentUserQueryKey, account);
  const auth = { isAuthenticated: true, signoutRedirect } as unknown as AuthContextProps;
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter><AuthContext.Provider value={auth}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </AuthContext.Provider></MemoryRouter>
  );
  return { user: userEvent.setup(), client, ...render(<AccessMenu />, { wrapper }) };
}

describe("AccessMenu", () => {
  it("muestra perfiles reales, marca el activo y cambia a otra organización", async () => {
    const { user } = setup({
      ...businessUser,
      organizations: [
        { id: "empresa-a", name: "Empresa A", roleName: "Dueño", status: "Active", memberStatus: "Active", isSelectable: true },
        { id: "empresa-b", name: "Empresa B", roleName: "Miembro", status: "Active", memberStatus: "Active", isSelectable: true },
      ],
    });

    await user.click(screen.getByRole("button", { name: "Ana, Empresa A" }));
    const menu = screen.getByRole("menu", { name: "Ana, Empresa A" });
    expect(within(menu).getByText("Perfiles")).toBeVisible();
    expect(within(menu).getByText("Tu perfil personal")).toBeVisible();
    expect(within(menu).getByRole("menuitemradio", { name: /Empresa A.*Dueño/ })).toHaveAttribute("aria-checked", "true");
    expect(within(menu).getByRole("menuitemradio", { name: /Empresa B.*Miembro/ })).toHaveAttribute("aria-checked", "false");
    expect(within(menu).queryByRole("menuitem", { name: "Mi cuenta" })).not.toBeInTheDocument();
    expect(within(menu).getByRole("menuitem", { name: "Salir" })).toBeVisible();

    await user.click(within(menu).getByRole("menuitemradio", { name: /Empresa B.*Miembro/ }));
    expect(switchAccess).toHaveBeenCalledWith({ access: "business", tenantId: "empresa-b" });
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
  });

  it("en Personal sin organizaciones no ofrece empresa ni crearla; usa correo si falta nombre", async () => {
    const { user } = setup({ ...consumerWithoutOrganizations, displayName: null });

    screen.getByRole("button", { name: "ana@example.test, Personal" }).focus();
    await user.keyboard("{Enter}");
    const menu = screen.getByRole("menu", { name: "ana@example.test, Personal" });
    expect(within(menu).getByRole("menuitemradio", { name: /Personal.*Tu perfil personal/ })).toHaveAttribute("aria-checked", "true");
    expect(within(menu).queryByText(/Registrá tu empresa/)).not.toBeInTheDocument();
    expect(within(menu).queryByRole("menuitemradio", { name: /Empresa/ })).not.toBeInTheDocument();
    expect(await axe(document.body, { rules: { region: { enabled: false } } })).toHaveNoViolations();
  });

  it("permite elegir Personal desde Empresa aunque el espacio todavía no exista", async () => {
    const { user } = setup({ ...businessUser, hasPersonalSpace: false });

    screen.getByRole("button", { name: "Ana, Empresa A" }).focus();
    await user.keyboard("{Enter}");
    const personal = within(await screen.findByRole("menu")).getByRole("menuitemradio", { name: /Personal.*Tu perfil personal/ });
    await user.click(personal);

    expect(switchAccess).toHaveBeenCalledWith({ access: "consumer" });
  });

  it("no ofrece Personal a un operador sin espacio propio", async () => {
    const { user } = setup({ ...platformOperator, hasPersonalSpace: false });

    const trigger = screen.getByRole("button", { name: /Ana/ });
    trigger.focus();
    await user.keyboard("{Enter}");

    expect(within(await screen.findByRole("menu")).queryByRole("menuitemradio", { name: /Personal/ }))
      .not.toBeInTheDocument();
  });

  it("muestra una organización suspendida, pero no deja elegirla", async () => {
    const { user } = setup({
      ...businessUser,
      organizations: [
        ...businessUser.organizations,
        { id: "beta", name: "Beta S.R.L.", roleName: "Miembro", status: "Suspended", memberStatus: "Active", isSelectable: false },
      ],
    });
    screen.getByRole("button", { name: "Ana, Empresa A" }).focus();
    await user.keyboard("{Enter}");

    const suspended = screen.getByRole("menuitem", { name: /Beta S.R.L..*Suspendida/ });
    expect(suspended).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText("Suspendida")).toBeVisible();
    await user.click(suspended);
    expect(switchAccess).not.toHaveBeenCalled();
  });

  it("mantiene visible una membresía inactiva sin permitir entrar a ella", async () => {
    const { user } = setup({
      ...businessUser,
      organizations: [
        ...businessUser.organizations,
        { id: "gamma", name: "Gamma S.A.", roleName: null, status: "Active", memberStatus: "Inactive", isSelectable: false },
      ],
    });
    screen.getByRole("button", { name: "Ana, Empresa A" }).focus();
    await user.keyboard("{Enter}");

    const inactive = screen.getByRole("menuitem", { name: /Gamma S.A./ });
    expect(inactive).toHaveAttribute("aria-disabled", "true");
    await user.click(inactive);
    expect(switchAccess).not.toHaveBeenCalled();
  });

  it("en teléfono abre la hoja de perfiles desde el avatar", async () => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query === "(max-width: 767px)", media: query,
      addEventListener: () => {}, removeEventListener: () => {},
    }));
    const { user } = setup(businessUser);

    await user.click(screen.getByRole("button", { name: "Tu cuenta y tus perfiles" }));
    const sheet = screen.getByRole("dialog", { name: "Menú de Ana" });
    expect(within(sheet).getByText("Perfiles")).toBeVisible();
    expect(within(sheet).getByText("Empresa A")).toBeVisible();
  });

  it("Salir borra los datos del perfil y redirige al cierre OIDC", async () => {
    const { user, client } = setup(businessUser);
    screen.getByRole("button", { name: "Ana, Empresa A" }).focus();
    await user.keyboard("{Enter}");
    await user.click(screen.getByRole("menuitem", { name: "Salir" }));
    expect(signoutRedirect).toHaveBeenCalledOnce();
    expect(client.getQueryData(currentUserQueryKey)).toBeUndefined();
  });
});
