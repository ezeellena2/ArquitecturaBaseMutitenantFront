import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { configureI18n, changeCulture } from "@/shared/i18n";
import type { RoleResponse, RoleScopeFilter } from "@/shared/api/types";
import { server } from "@/test/mocks/server";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";

const owner: RoleResponse = {
  id: "role-owner",
  name: "TenantAdmin",
  description: "Tiene todos los permisos de la organización.",
  scope: "Organization",
  companyId: null,
  isSystemRole: true,
  userCount: 1,
  permissions: ["roles.read", "roles.manage"],
  version: 1,
  createdAtUtc: "2026-09-27T12:00:00Z",
};

const companyAdmin: RoleResponse = {
  ...owner,
  id: "role-company-admin",
  name: "CompanyAdmin",
  description: "Administra los miembros de cada empresa.",
  scope: "AnyCompany",
  permissions: ["company.members.read", "company.members.manage"],
};

beforeEach(async () => {
  await configureI18n(referenceDataFixture().cultures);
  await changeCulture("es-AR");
});

describe("RolesPage", () => {
  it("lista roles del backend y lleva búsqueda y alcance a la URL y a la consulta", async () => {
    const user = userEvent.setup();
    const requests: URL[] = [];
    server.use(http.get("/api/roles/paged", ({ request }) => {
      const url = new URL(request.url);
      requests.push(url);
      const scope = url.searchParams.get("scope") as RoleScopeFilter | null;
      const items = scope === "Company" ? [companyAdmin] : [owner, companyAdmin];
      return HttpResponse.json({
        items,
        page: 1,
        pageSize: 10,
        totalCount: items.length,
        totalPages: 1,
        hasPrevious: false,
        hasNext: false,
      });
    }));

    const { router } = renderRouteWithProviders("/org/roles", { as: "business-role-manager" });

    expect(await screen.findByRole("heading", { level: 1, name: "Roles y permisos" })).toBeVisible();
    expect(await screen.findByRole("link", { name: "Dueño" })).toHaveAttribute("href", "/org/roles/role-owner");
    expect(screen.getByRole("link", { name: "Crear rol" })).toHaveAttribute("href", "/org/roles/new");
    expect(screen.getByRole("columnheader", { name: "Rol" })).toBeVisible();

    await user.type(screen.getByRole("searchbox", { name: "Buscar por nombre o descripción" }), "Solo lectura");
    await waitFor(() => expect(requests.at(-1)?.searchParams.get("search")).toBe("Solo lectura"), { timeout: 3_000 });
    expect(router.state.location.search).toContain("search=Solo+lectura");

    await user.click(screen.getByRole("button", { name: /Vale en: todos/ }));
    await user.click(await screen.findByRole("menuitemradio", { name: /Cada empresa/ }));
    await waitFor(() => expect(requests.at(-1)?.searchParams.get("scope")).toBe("Company"));
    expect(router.state.location.search).toContain("scope=Company");
  }, 10_000);

  it("no consulta roles ni muestra la administración sin roles.read", async () => {
    let roleRequests = 0;
    server.use(http.get("/api/roles/paged", () => { roleRequests++; return HttpResponse.json({ items: [] }); }));

    renderRouteWithProviders("/org/roles", { as: "business-no-permissions" });

    expect(await screen.findByRole("heading", { name: "No tenés permiso para ver esta página" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Administración" })).not.toBeInTheDocument();
    expect(roleRequests).toBe(0);
  });
});
