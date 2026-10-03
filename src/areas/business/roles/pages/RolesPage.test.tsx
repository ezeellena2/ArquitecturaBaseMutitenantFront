import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { configureI18n, changeCulture } from "@/shared/i18n";
import type { RoleResponse } from "@/shared/api/types";
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

const companyReader: RoleResponse = {
  ...owner,
  id: "role-company-reader",
  name: "Solo lectura",
  description: "Ve los miembros de la empresa.",
  scope: "SpecificCompany",
  companyId: "company-1",
  isSystemRole: false,
  userCount: 0,
  permissions: ["company.members.read"],
};

const companies = { items: [
  { id: "company-1", name: "Delta S.A.", taxId: null, timeZoneId: "America/Argentina/Buenos_Aires", status: "Active", memberCount: 1, version: 1, createdAtUtc: "2026-09-27T12:00:00Z" },
  { id: "company-2", name: "Delta Sur S.R.L.", taxId: null, timeZoneId: "America/Argentina/Buenos_Aires", status: "Active", memberCount: 1, version: 1, createdAtUtc: "2026-09-27T12:00:00Z" },
], page: 1, pageSize: 100, totalCount: 2, totalPages: 1, hasPrevious: false, hasNext: false };

beforeEach(async () => {
  await configureI18n(referenceDataFixture().cultures);
  await changeCulture("es-AR");
});

describe("RolesPage", () => {
  it("lista roles del backend y lleva búsqueda y «Vale en» a la URL y a la consulta", async () => {
    const user = userEvent.setup();
    const requests: URL[] = [];
    server.use(http.get("/api/companies/paged", () => HttpResponse.json(companies)), http.get("/api/roles/paged", ({ request }) => {
      const url = new URL(request.url);
      requests.push(url);
      const companyId = url.searchParams.get("companyId");
      const items = url.searchParams.get("scope") === "Organization" ? [owner]
        : companyId === "company-1" ? [companyAdmin, companyReader] : companyId ? [companyAdmin] : [owner, companyAdmin, companyReader];
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

    const { router } = renderRouteWithProviders("/org/roles", { as: "business-e6-admin" });

    expect(await screen.findByRole("heading", { level: 1, name: "Roles y permisos" })).toBeVisible();
    expect(await screen.findByRole("link", { name: "Dueño" })).toHaveAttribute("href", "/org/roles/role-owner");
    expect(screen.getByRole("link", { name: "Crear rol" })).toHaveAttribute("href", "/org/roles/new");
    expect(screen.getByRole("columnheader", { name: "Rol" })).toBeVisible();
    expect(screen.getByRole("columnheader", { name: "Vale en" })).toBeVisible();
    expect(screen.queryByRole("columnheader", { name: "Descripción" })).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Tipo" })).not.toBeInTheDocument();
    expect(screen.getAllByText("De sistema")).toHaveLength(2);
    // «Vale en» de un rol de una empresa es el nombre de la empresa.
    expect(await screen.findByRole("cell", { name: "Delta S.A." })).toBeVisible();

    await user.type(screen.getByRole("searchbox", { name: "Buscar por nombre o descripción" }), "Solo lectura");
    await waitFor(() => expect(requests.at(-1)?.searchParams.get("search")).toBe("Solo lectura"), { timeout: 3_000 });
    expect(router.state.location.search).toContain("search=Solo+lectura");

    // Tablero Roles: «Todos», «Toda la organización» y cada empresa por nombre; sin «Cada empresa».
    await user.click(screen.getByRole("button", { name: /Vale en: todos/ }));
    const options = await screen.findAllByRole("menuitemradio");
    expect(options.map((option) => option.textContent?.replace(/\d+$/, ""))).toEqual(["Todos", "Toda la organización", "Delta S.A.", "Delta Sur S.R.L."]);
    await user.click(screen.getByRole("menuitemradio", { name: /Delta S\.A\./ }));
    await waitFor(() => expect(requests.at(-1)?.searchParams.get("companyId")).toBe("company-1"));
    expect(requests.at(-1)?.searchParams.get("scope")).toBeNull();
    expect(router.state.location.search).toContain("vale=company-1");
  }, 10_000);

  it("el ⋮ de un rol propio lleva «Editar» e «Inactivar»; el de uno de sistema, «Ver permisos»", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("/api/companies/paged", () => HttpResponse.json(companies)),
      http.get("/api/roles/paged", () => HttpResponse.json({ items: [owner, companyReader], page: 1, pageSize: 10, totalCount: 2, totalPages: 1, hasPrevious: false, hasNext: false })),
    );
    renderRouteWithProviders("/org/roles", { as: "business-e6-admin" });

    (await screen.findByRole("button", { name: "Acciones para Solo lectura" })).focus();
    await user.keyboard("{Enter}");
    const own = await screen.findByRole("menu");
    expect(within(own).getAllByRole("menuitem").map((item) => item.textContent)).toEqual(["Editar", "Inactivar"]);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    screen.getByRole("button", { name: "Acciones para Dueño" }).focus();
    await user.keyboard("{Enter}");
    const system = await screen.findByRole("menu");
    expect(within(system).getAllByRole("menuitem").map((item) => item.textContent)).toEqual(["Ver permisos"]);
  });

  it("no consulta roles ni muestra la administración sin roles.read", async () => {
    let roleRequests = 0;
    server.use(http.get("/api/roles/paged", () => { roleRequests++; return HttpResponse.json({ items: [] }); }));

    renderRouteWithProviders("/org/roles", { as: "business-no-permissions" });

    expect(await screen.findByRole("heading", { name: "No tenés permiso para ver esta página" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Administración" })).not.toBeInTheDocument();
    expect(roleRequests).toBe(0);
  });
});
