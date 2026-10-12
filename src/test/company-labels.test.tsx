import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeEach, expect, it } from "vitest";
import { configureI18n, changeCulture } from "@/shared/i18n";
import { referenceDataFixture } from "./mocks/handlers";
import { server } from "./mocks/server";
import { renderRouteWithProviders } from "./utils/renderWithProviders";

const role = { id: "role-1", name: "Compras", description: null, scope: "SpecificCompany", companyId: "company-101",
  companyName: "Empresa fuera de las opciones", isSystemRole: false, userCount: 0, permissions: [], version: 1, createdAtUtc: "2026-10-12T12:00:00Z" };
const page = (items: unknown[]) => ({ items, page: 1, pageSize: 10, totalCount: items.length, totalPages: items.length ? 1 : 0, hasPrevious: false, hasNext: false });

beforeEach(async () => { await configureI18n(referenceDataFixture().cultures); await changeCulture("es-AR"); });

it.each(["/org/roles", "/org/roles/role-1"])("%s usa el nombre del contrato aunque la empresa no esté en la página de opciones", async (route) => {
  let details = 0;
  server.use(
    http.get("/api/companies/paged", () => HttpResponse.json(page([]))),
    http.get("/api/companies/:id", () => { details++; return HttpResponse.json({ name: "Nombre incorrecto" }); }),
    http.get("/api/roles/paged", () => HttpResponse.json(page([role]))),
    http.get("/api/roles/role-1", () => HttpResponse.json(role)),
    http.get("/api/roles/filter-counts", () => HttpResponse.json({ matching: { all: 1, organization: 0, company: 1 }, total: { all: 1, organization: 0, company: 1 }, anyCompany: 0, companies: { "company-101": 1 } })),
    http.get("/api/permissions", () => HttpResponse.json([])),
  );
  renderRouteWithProviders(route, { as: "business-e6-admin" });
  await waitFor(() => expect(screen.getAllByText(role.companyName).length).toBeGreaterThan(0));
  expect(details).toBe(0);
});

it("Usuarios conserva el nombre y el estado de una empresa fuera de las opciones sin releerla", async () => {
  let details = 0;
  server.use(
    http.get("/api/companies/paged", () => HttpResponse.json(page([]))),
    http.get("/api/companies/:id", () => { details++; return HttpResponse.json({ name: "Nombre incorrecto" }); }),
    http.get("/api/roles/paged", () => HttpResponse.json(page([]))),
    http.get("/api/users/member-1", () => HttpResponse.json({ memberId: "member-1", userId: "user-1", displayName: "Ana", email: "ana@example.com",
      state: "Active", hasManagedEmail: false, roles: [], companies: [{ companyId: role.companyId, companyName: role.companyName, companyStatus: "Inactive", status: "Active", roles: [] }],
      invitationId: null, invitationIssuedAtUtc: null, invitationExpiresAtUtc: null, version: 1, createdAtUtc: role.createdAtUtc })),
  );
  renderRouteWithProviders("/org/usuarios/member-1", { as: "business-e6-admin" });
  expect(await screen.findByText(role.companyName)).toBeVisible();
  expect(screen.queryByRole("button", { name: `Acciones de ${role.companyName}` })).not.toBeInTheDocument();
  expect(details).toBe(0);
});
