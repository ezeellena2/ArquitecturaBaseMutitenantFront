import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { AuthContext, type AuthContextProps } from "react-oidc-context";
import { MemoryRouter } from "react-router";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { http, HttpResponse } from "msw";
import { currentUserQueryKey } from "@/auth/useCurrentUser";
import { cancelSignOut } from "@/auth/signOutStatus";
import { configureI18n } from "@/shared/i18n";
import type { MeResponse } from "@/shared/api/types";
import { businessUser, consumerWithoutOrganizations, platformOperator, visualOperator } from "@/test/mocks/currentUsers";
import { AccessMenu } from "./AccessMenu";
import { server } from "@/test/mocks/server";
import { referenceDataFixture } from "@/test/mocks/handlers";

const switchAccess = vi.fn<({ access, tenantId }: { access: string; tenantId?: string }) => Promise<void>>();
const signoutRedirect = vi.fn(() => new Promise<void>(() => {}));
vi.mock("./useSwitchAccess", () => ({
  useSwitchAccess: () => ({ isSwitching: false, hasError: false, switchAccess }),
}));

beforeAll(async () => {
  await configureI18n([{ code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true }]);
});
afterEach(() => { switchAccess.mockReset(); signoutRedirect.mockClear(); cancelSignOut(); vi.unstubAllGlobals(); });

function setup(account: MeResponse, fetchAccount = false) {
  const client = new QueryClient();
  if (fetchAccount) server.use(http.get("/api/me", () => HttpResponse.json(account)));
  else client.setQueryData(currentUserQueryKey, account);
  const auth = { isAuthenticated: true, signoutRedirect } as unknown as AuthContextProps;
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter><AuthContext.Provider value={auth}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </AuthContext.Provider></MemoryRouter>
  );
  return { user: userEvent.setup(), client, ...render(<AccessMenu />, { wrapper }) };
}

describe("AccessMenu", () => {
  it.each([
    [consumerWithoutOrganizations, "es-AR", "Sin dato", "Personal"],
    [businessUser, "es-AR", "Sin dato", "Empresa A"],
    [consumerWithoutOrganizations, "en-US", "No data", "Personal"],
    [businessUser, "en-US", "No data", "Empresa A"],
  ] as const)("sin nombre ni correo principal muestra el vacío accesible en %s / %s", async (account, culture, label, activeName) => {
    await configureI18n(referenceDataFixture().cultures, culture);
    const requests: string[] = [];
    const record = ({ request }: { request: Request }) => { requests.push(new URL(request.url).pathname); };
    server.events.on("request:start", record);
    try {
      // /api/me no expone Phone: una cuenta con ese método principal trae ambos datos nulos.
      const { user } = setup({ ...account, displayName: null, email: null }, true);
      const trigger = await screen.findByRole("button", { name: `${label}, ${activeName}` });
      expect(within(trigger).getByText(label)).toBeVisible();
      expect(trigger.querySelector("[data-slot='avatar']")).toBeEmptyDOMElement();
      trigger.focus();
      await user.keyboard("{Enter}");
      const menu = screen.getByRole("menu", { name: `${label}, ${activeName}` });
      expect(menu).toHaveAttribute("aria-label", culture === "es-AR" ? `Menú de ${label}` : `${label}'s menu`);
      expect(within(menu).getByText(label)).toBeVisible();
      expect(menu.querySelector("[data-slot='avatar']")).toBeEmptyDOMElement();
      expect(within(menu).getAllByRole("menuitemradio")).toHaveLength(account.access === "consumer" ? 1 : 2);
      expect(requests).toEqual(["/api/me"]);
      expect(await axe(document.body, { rules: { region: { enabled: false } } })).toHaveNoViolations();
    } finally { server.events.removeListener("request:start", record); }
  });

  it("en Empresa mantiene el correo principal como nombre y su inicial si falta el nombre", async () => {
    await configureI18n(referenceDataFixture().cultures, "es-AR");
    const { user } = setup({ ...businessUser, displayName: null }, true);
    const trigger = await screen.findByRole("button", { name: "ana@example.test, Empresa A" });
    expect(trigger.querySelector("[data-slot='avatar']")).toHaveTextContent("A");
    trigger.focus();
    await user.keyboard("{Enter}");
    expect(screen.queryByText("Sin dato")).not.toBeInTheDocument();
    expect(within(screen.getByRole("menu")).getAllByText("ana@example.test")).toHaveLength(2);
  });

  it("en Plataforma muestra el contexto bajo el nombre y sólo Mi cuenta y Salir", async () => {
    const { user } = setup(visualOperator);
    const trigger = screen.getByRole("button", { name: "Martín Sosa, Plataforma" });
    expect(within(trigger).getByText("Plataforma")).toBeVisible();
    trigger.focus();
    await user.keyboard("{Enter}");
    const menu = await screen.findByRole("menu");
    expect(within(menu).getByText("martin.sosa@arquitecturabase.ejemplo.com")).toBeVisible();
    expect(within(menu).queryByText("Perfiles")).not.toBeInTheDocument();
    expect(within(menu).queryByRole("menuitemradio")).not.toBeInTheDocument();
    expect(within(menu).getByRole("menuitem", { name: "Mi cuenta" })).toHaveAttribute("href", "/cuenta");
    expect(within(menu).getByRole("menuitem", { name: "Salir" })).toBeVisible();
    expect(await axe(document.body, { rules: { region: { enabled: false } } })).toHaveNoViolations();
    await user.click(within(menu).getByRole("menuitem", { name: "Salir" }));
    expect(signoutRedirect).toHaveBeenCalledOnce();
  });
  it("muestra perfiles reales, marca el activo y cambia a otra organización", async () => {
    const { user } = setup({
      ...businessUser,
      organizations: [
        { id: "empresa-a", name: "Empresa A", roleName: "Dueño", status: "Active", memberStatus: "Active", isSelectable: true },
        { id: "empresa-b", name: "Empresa B", roleName: "Miembro", status: "Active", memberStatus: "Active", isSelectable: true },
      ],
    });

    screen.getByRole("button", { name: "Ana, Empresa A" }).focus();
    await user.keyboard("{Enter}");
    const menu = screen.getByRole("menu", { name: "Ana, Empresa A" });
    expect(within(menu).getByText("Perfiles")).toBeVisible();
    expect(within(menu).getByText("Tu perfil personal")).toBeVisible();
    expect(within(menu).getByRole("menuitemradio", { name: /Empresa A.*Dueño/ })).toHaveAttribute("aria-checked", "true");
    expect(within(menu).getByRole("menuitemradio", { name: /Empresa B.*Miembro/ })).toHaveAttribute("aria-checked", "false");
    expect(within(menu).getByRole("menuitem", { name: "Mi cuenta" })).toHaveAttribute("href", "/cuenta");
    expect(within(menu).getByRole("menuitem", { name: "Salir" })).toBeVisible();

    await user.click(within(menu).getByRole("menuitemradio", { name: /Empresa B.*Miembro/ }));
    expect(switchAccess).toHaveBeenCalledWith({ access: "business", tenantId: "empresa-b" });
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
  });

  it("iguala las filas compactas, el texto del perfil activo y el ícono Salir del lienzo", async () => {
    const { user } = setup({
      ...businessUser,
      organizations: [{ ...businessUser.organizations[0], roleName: "Dueño" }],
    });
    screen.getByRole("button", { name: "Ana, Empresa A" }).focus();
    await user.keyboard("{Enter}");
    const menu = await screen.findByRole("menu", { name: "Ana, Empresa A" });
    const active = within(menu).getByRole("menuitemradio", { name: /Empresa A.*Dueño/ });
    expect(active).toHaveClass("min-h-11", "gap-2.5", "px-2.5", "rounded-[6px]", "text-[var(--marca-tx)]");
    // Tablero Cuenta (.w-mn-it, .w-mn-ico) y «Criterio · Menús»: la fila activa con esquinas de 6 y el ícono del perfil
    // de 28 con esquinas de 8, no la píldora ni el círculo de --radius-lg; el nombre en 13 y el rol en 12,5.
    expect(within(active).getByText("Empresa A")).toHaveClass("text-[13px]");
    expect(within(active).getByText("Empresa A")).not.toHaveClass("font-medium");
    expect(within(active).getByText("Dueño")).toHaveClass("text-[12.5px]");
    expect(active.querySelector("[aria-hidden='true']")).toHaveClass("size-7", "rounded-[8px]");
    const signOutIcon = within(menu).getByRole("menuitem", { name: "Salir" }).querySelector("svg");
    expect(Array.from(signOutIcon?.querySelectorAll("path") ?? [], (path) => path.getAttribute("d"))).toEqual([
      "M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4",
      "M10 16l-4-4 4-4",
      "M6 12h10",
    ]);
    // «Criterio · Menús» (el menú de la cuenta) y tableros Inicio-Org e Inicio-Personal: los íconos de «Mi cuenta» y
    // «Salir», en el gris claro de los íconos de un menú.
    expect(signOutIcon).toHaveClass("text-[var(--t3)]");
    expect(within(menu).getByRole("menuitem", { name: "Mi cuenta" }).querySelector("svg")).toHaveClass("text-[var(--t3)]");
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

  it("muestra el motivo en la segunda línea y abre el detalle al elegir una organización suspendida", async () => {
    const { user } = setup({
      ...businessUser,
      organizations: [
        ...businessUser.organizations,
        { id: "beta", name: "Beta S.R.L.", roleName: "Miembro", status: "Suspended", memberStatus: "Active", isSelectable: false },
      ],
    });
    screen.getByRole("button", { name: "Ana, Empresa A" }).focus();
    await user.keyboard("{Enter}");

    const suspended = screen.getByRole("menuitemradio", { name: /Beta S.R.L..*Suspendida/ });
    expect(suspended).toHaveAttribute("aria-disabled", "true");
    expect(within(suspended).getByText("Suspendida")).toBeVisible();
    await user.click(suspended);
    expect(switchAccess).toHaveBeenCalledWith({ access: "business", tenantId: "beta" });
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

    const inactive = screen.getByRole("menuitemradio", { name: /Gamma S.A..*Membresía inactiva/ });
    expect(inactive).toHaveAttribute("aria-disabled", "true");
    await user.click(inactive);
    expect(switchAccess).toHaveBeenCalledWith({ access: "business", tenantId: "gamma" });
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
