import { QueryClient } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AuthContextProps } from "react-oidc-context";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { AppProviders } from "./providers";
import { routes } from "./routes";
import type { MeResponse } from "@/shared/api/types";
import { configureI18n } from "@/shared/i18n";
import { fixtureAuth } from "@/test/mocks/authContext";
import { businessUser, consumerWithOrganizations } from "@/test/mocks/currentUsers";
import { meHandlerFor } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { pickerName } from "@/test/picker";

beforeAll(async () => {
  await configureI18n([{ code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true }]);
});

function mount(path: string, as: "consumer-with-organizations" | "business-admin", me: MeResponse) {
  server.use(meHandlerFor(me));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const base = fixtureAuth(as);
  const signinSilent = vi.fn(async () => base.user);
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const view = render(<AppProviders client={client} authContext={{ ...base, signinSilent } as unknown as AuthContextProps}>
    <RouterProvider router={router} />
  </AppProviders>);
  return { ...view, router, signinSilent, user: userEvent.setup() };
}

const where = (router: ReturnType<typeof createMemoryRouter>) => `${router.state.location.pathname}${router.state.location.search}`;

// F7 (tableros Otro-Acceso y Otro-Acceso-Persona): un link del otro acceso dice de quién es y ofrece entrar con ese
// acceso; al entrar, abre el link.
describe("Otro acceso", () => {
  it("como persona, un link de su empresa dice de quién es y entra como empresa al link", async () => {
    const { container, router, signinSilent, user } = mount("/org/usuarios?state=Active", "consumer-with-organizations", consumerWithOrganizations);

    expect(await screen.findByRole("heading", { level: 1, name: "Este link es de Empresa A" })).toBeVisible();
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
    await user.click(screen.getByRole("button", { name: "Entrar como empresa" }));

    await waitFor(() => expect(signinSilent).toHaveBeenCalledWith(expect.objectContaining({ extraQueryParams: { access: "business", tenant: "empresa-a" } })));
    await waitFor(() => expect(where(router)).toBe("/org/usuarios?state=Active"));
  });

  it("con varias organizaciones, se elige con cuál se entra, con la elegida tildada", async () => {
    const [first] = consumerWithOrganizations.organizations;
    const me = { ...consumerWithOrganizations, organizations: [first, { ...first, id: "empresa-b", name: "Beta S.R.L.", roleName: "Vendedor" }] };
    const { signinSilent, user } = mount("/org/empresas", "consumer-with-organizations", me);

    expect(await screen.findByRole("heading", { level: 1, name: "Este link es de una empresa" })).toBeVisible();
    // 262: la organización se elige en la pieza, que dice la elegida.
    expect(screen.getByRole("button", { name: pickerName("Organización") })).toHaveAccessibleName(`Organización ${first.name}`);
    await user.click(screen.getByRole("button", { name: pickerName("Organización") }));
    expect(screen.getByRole("option", { name: first.name })).toHaveAttribute("aria-selected", "true");
    await user.click(screen.getByRole("option", { name: "Beta S.R.L." }));
    expect(screen.getByRole("button", { name: pickerName("Organización") })).toHaveAccessibleName("Organización Beta S.R.L.");
    await user.click(screen.getByRole("button", { name: "Entrar como empresa" }));

    await waitFor(() => expect(signinSilent).toHaveBeenCalledWith(expect.objectContaining({ extraQueryParams: { access: "business", tenant: "empresa-b" } })));
  });

  it("como empresa, un link del perfil personal entra como persona al link", async () => {
    const { router, signinSilent, user } = mount("/asistente", "business-admin", businessUser);

    expect(await screen.findByRole("heading", { level: 1, name: "Este link es de tu perfil personal" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Entrar como persona" }));

    await waitFor(() => expect(signinSilent).toHaveBeenCalledWith(expect.objectContaining({ extraQueryParams: { access: "consumer" } })));
    await waitFor(() => expect(where(router)).toBe("/asistente"));
  });

  // accesos-y-permisos.md: si la cuenta no tiene ese acceso, el link no existe para ella; va «No encontramos esta página»,
  // dentro del marco del acceso activo, y no se ofrece entrar.
  it.each<[string, string, MeResponse]>([
    ["un link de empresa sin organizaciones para elegir", "/org/usuarios", { ...consumerWithOrganizations, organizations: [] }],
    ["un link de Plataforma", "/plataforma/organizaciones", consumerWithOrganizations],
  ])("%s dice que no existe, sin ofrecer entrar", async (_, path, me) => {
    const { router, signinSilent } = mount(path, "consumer-with-organizations", me);

    expect(await screen.findByRole("heading", { name: "No encontramos esta página" })).toBeVisible();
    expect(screen.queryByText(/Este link es de/)).not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe(path);
    expect(signinSilent).not.toHaveBeenCalled();
  });

  // El inicio personal es el de siempre, no un link: quien está en su empresa sigue yendo al inicio de la empresa.
  it("el inicio personal no se ofrece: quien está en su empresa va a su inicio", async () => {
    const { router } = mount("/", "business-admin", businessUser);

    await waitFor(() => expect(router.state.location.pathname).toBe("/org"));
    expect(screen.queryByText(/Este link es de/)).not.toBeInTheDocument();
  });
});
