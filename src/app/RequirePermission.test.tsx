import { render, screen } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { configureI18n } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { RequirePermission } from "./RequirePermission";

const session = vi.hoisted(() => ({ organization: [] as string[], features: [] as string[], companies: {} as Record<string, string[]> }));
vi.mock("@/auth/useCurrentUser", () => ({ useCurrentUser: () => ({ data: {
  access: "business", features: session.features, effectivePermissions: { organization: session.organization, companies: session.companies },
} }) }));

beforeAll(async () => {
  await configureI18n(referenceDataFixture().cultures);
});

function open(path: string) {
  const router = createMemoryRouter([
    { element: <RequirePermission permission="audit.read" feature="reportes" />, children: [
      { path: "/org/reportes", element: <h1>{"Reportes"}</h1> },
    ] },
  ], { initialEntries: [path] });
  render(<RouterProvider router={router} />);
}

// La ficha de Empresa (B4): `companies.read` de la organización o, como alternativa, el permiso de empresa en la empresa de
// la ruta (`:companyId`).
function openCompany(path: string) {
  const router = createMemoryRouter([
    { element: <RequirePermission permission="companies.read" companyPermission="company.members.read" />, children: [
      { path: "/org/empresas/:companyId", element: <h1>{"Empresa"}</h1> },
    ] },
  ], { initialEntries: [path] });
  return render(<RouterProvider router={router} />);
}

describe("RequirePermission", () => {
  it("abre la pantalla con el módulo prendido y el permiso", async () => {
    session.features = ["reportes"];
    session.organization = ["audit.read"];
    open("/org/reportes");

    expect(await screen.findByRole("heading", { name: "Reportes" })).toBeVisible();
  });

  it("sin el permiso muestra «No tenés permiso» con el regreso al inicio del acceso", async () => {
    session.features = ["reportes"];
    session.organization = ["users.read"];
    open("/org/reportes");

    expect(await screen.findByRole("heading", { name: "No tenés permiso para ver esta página" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Ir al inicio" })).toHaveAttribute("href", "/org");
    expect(screen.queryByRole("heading", { name: "Reportes" })).not.toBeInTheDocument();
  });

  it("con el módulo apagado la ruta no existe, como el 404 del back", async () => {
    session.features = [];
    session.organization = ["audit.read"];
    open("/org/reportes");

    expect(await screen.findByRole("heading", { name: "No encontramos esta página" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Reportes" })).not.toBeInTheDocument();
  });

  it("con el permiso de empresa como alternativa, abre la ficha de su empresa y no la de otra", async () => {
    session.features = [];
    session.organization = [];
    session.companies = { "company-1": ["company.members.read", "company.members.manage"] };
    const own = openCompany("/org/empresas/company-1");

    expect(await screen.findByRole("heading", { name: "Empresa" })).toBeVisible();
    own.unmount();

    openCompany("/org/empresas/company-2");
    expect(await screen.findByRole("heading", { name: "No tenés permiso para ver esta página" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Empresa" })).not.toBeInTheDocument();
  });

  it("con el permiso de la organización abre la ficha de cualquier empresa", async () => {
    session.organization = ["companies.read"];
    session.companies = {};
    openCompany("/org/empresas/company-2");

    expect(await screen.findByRole("heading", { name: "Empresa" })).toBeVisible();
  });
});
