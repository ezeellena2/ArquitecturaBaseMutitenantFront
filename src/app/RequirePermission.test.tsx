import { render, screen } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { configureI18n } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { RequirePermission } from "./RequirePermission";

const session = vi.hoisted(() => ({ organization: [] as string[], features: [] as string[] }));
vi.mock("@/auth/useCurrentUser", () => ({ useCurrentUser: () => ({ data: {
  access: "business", features: session.features, effectivePermissions: { organization: session.organization, companies: {} },
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
});
