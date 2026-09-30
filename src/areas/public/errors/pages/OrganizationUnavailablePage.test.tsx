import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { cancelSignOut } from "@/auth/signOutStatus";
import { configureI18n } from "@/shared/i18n";
import { OrganizationUnavailablePage } from "./OrganizationUnavailablePage";

const switchAccess = vi.fn(() => Promise.resolve());
const signoutRedirect = vi.fn(() => new Promise<void>(() => {}));
vi.mock("@/auth/useCurrentUser", () => ({ useCurrentUser: () => ({ data: {
  displayName: "Ana", email: "ana@example.test", hasPersonalSpace: true, activeTenantId: "beta",
  organizations: [
    { id: "beta", name: "Beta S.R.L.", roleName: null, status: "Suspended", memberStatus: "Active", isSelectable: false },
    { id: "delta", name: "Grupo Delta", roleName: "Dueño", status: "Active", memberStatus: "Active", isSelectable: true },
    { id: "gamma", name: "Gamma S.A.", roleName: null, status: "Active", memberStatus: "Inactive", isSelectable: false },
  ],
} }) }));
vi.mock("@/tenancy/useSwitchAccess", () => ({ useSwitchAccess: () => ({ isSwitching: false, hasError: false, switchAccess }) }));
vi.mock("react-oidc-context", async () => ({ ...await vi.importActual<typeof import("react-oidc-context")>("react-oidc-context"), useAuth: () => ({ signoutRedirect }) }));

beforeAll(async () => { await configureI18n([{ code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true }]); });
afterEach(() => { switchAccess.mockClear(); signoutRedirect.mockClear(); cancelSignOut(); });

function setup(code: "Tenancy.Tenant.Suspended" | "Tenancy.Tenant.PendingApproval" | "Tenancy.Tenant.Closed", organizationName = "Beta S.R.L.", organizationId = "beta") {
  const client = new QueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter><QueryClientProvider client={client}>{children}</QueryClientProvider></MemoryRouter>;
  return { user: userEvent.setup(), client, ...render(<OrganizationUnavailablePage code={code} organizationName={organizationName} organizationId={organizationId} />, { wrapper }) };
}

describe("OrganizationUnavailablePage", () => {
  it("suspendida: reproduce Perfil-Suspendido y ofrece solo perfiles disponibles", async () => {
    const { container, user } = setup("Tenancy.Tenant.Suspended");
    expect(container.querySelector(".brand-mark > span")).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Beta S.R.L. está suspendida" })).toBeVisible();
    expect(screen.getByText("Nadie de la organización puede entrar por ahora. Tus otros perfiles siguen funcionando.")).toBeVisible();
    expect(screen.getByText("Elegí otro perfil")).toBeVisible();
    expect(screen.queryByRole("button", { name: /Beta S.R.L./ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Gamma S.A./ })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Personal.*Tu perfil personal/ }));
    expect(switchAccess).toHaveBeenCalledWith({ access: "consumer" });
    expect(await axe(container)).toHaveNoViolations();
  });

  it("espera aprobación: muestra el texto propio y omite la organización revisada", async () => {
    const { container } = setup("Tenancy.Tenant.PendingApproval", "Grupo Delta", "delta");
    expect(screen.getByRole("heading", { name: "Estamos revisando Grupo Delta" })).toBeVisible();
    expect(screen.getByText("Te avisamos por correo cuando esté aprobada.")).toBeVisible();
    expect(screen.getByRole("button", { name: /Personal.*Tu perfil personal/ })).toBeVisible();
    expect(screen.queryByRole("button", { name: /Grupo Delta/ })).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("cerrada: permite salir y limpia la caché antes del cierre OIDC", async () => {
    const { container, user, client } = setup("Tenancy.Tenant.Closed");
    client.setQueryData(["current-user"], { id: "ana" });
    expect(screen.getByRole("heading", { name: "Beta S.R.L. está cerrada" })).toBeVisible();
    expect(screen.getByText("La organización ya no está disponible. Tus otros perfiles siguen funcionando.")).toBeVisible();
    expect(await axe(container)).toHaveNoViolations();
    await user.click(screen.getByRole("button", { name: "Salir" }));
    expect(signoutRedirect).toHaveBeenCalledOnce();
    expect(client.getQueryData(["current-user"])).toBeUndefined();
  });
});
