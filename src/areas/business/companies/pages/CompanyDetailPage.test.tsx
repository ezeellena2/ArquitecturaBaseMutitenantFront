import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { configureI18n, changeCulture } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";

const company = {
  id: "company-1", name: "Delta S.A.", taxId: null, timeZoneId: "America/Argentina/Buenos_Aires",
  status: "Active" as const, memberCount: 1, version: 3, createdAtUtc: "2026-09-27T12:00:00Z",
};
const member = {
  memberId: "member-1", userId: "user-1", displayName: "Lucía Fernández", email: "lucia@example.com",
  state: "Active" as const, membershipStatus: "Active" as const, roles: [], version: 8,
  createdAtUtc: "2026-09-27T12:00:00Z",
};
const companyAdmin = {
  id: "role-company-admin", name: "Administrador", description: null, scope: "AnyCompany" as const,
  companyId: null, isSystemRole: true, userCount: 1, permissions: ["company.members.read", "company.members.manage"],
  version: 1, createdAtUtc: "2026-09-27T12:00:00Z",
};

beforeEach(async () => {
  await configureI18n(referenceDataFixture().cultures);
  await changeCulture("es-AR");
});

describe("CompanyDetailPage", () => {
  it("guarda roles de empresa con la versión actual de la membresía", async () => {
    let requestBody: unknown;
    server.use(
      http.get("/api/companies/company-1", () => HttpResponse.json(company)),
      http.get("/api/companies/company-1/members/paged", () => HttpResponse.json({ items: [member], page: 1, pageSize: 10, totalCount: 1, totalPages: 1, hasPrevious: false, hasNext: false })),
      http.get("/api/companies/company-1/members/filter-counts", () => HttpResponse.json({ all: 1, active: 1, pendingDeletion: 0, inactive: 0, invited: 0 })),
      http.get("/api/roles/paged", () => HttpResponse.json({ items: [companyAdmin], page: 1, pageSize: 100, totalCount: 1, totalPages: 1, hasPrevious: false, hasNext: false })),
      http.put("/api/companies/company-1/members/member-1/roles", async ({ request }) => {
        requestBody = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const user = userEvent.setup();
    renderRouteWithProviders("/org/empresas/company-1", { as: "business-e6-admin" });
    expect(await screen.findByRole("heading", { level: 1, name: "Delta S.A." })).toBeVisible();
    expect(await screen.findByText("Lucía Fernández")).toBeVisible();
    await user.click(await screen.findByRole("button", { name: "Acciones para Lucía Fernández" }));
    await user.click(await screen.findByRole("menuitem", { name: "Cambiar roles" }));
    await user.click(screen.getByRole("button", { name: "Roles en la empresa" }));
    await user.click(await screen.findByRole("menuitemcheckbox", { name: "Administrador" }));
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => expect(requestBody).toEqual({ roleIds: ["role-company-admin"], version: 8 }));
  }, 10_000);

  it("agrega una persona existente con encabezado idempotente", async () => {
    let requestBody: unknown;
    let idempotencyKey: string | null = null;
    server.use(
      http.get("/api/companies/company-1", () => HttpResponse.json(company)),
      http.get("/api/companies/company-1/members/paged", () => HttpResponse.json({ items: [], page: 1, pageSize: 10, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false })),
      http.get("/api/companies/company-1/members/filter-counts", () => HttpResponse.json({ all: 0, active: 0, pendingDeletion: 0, inactive: 0, invited: 0 })),
      http.get("/api/roles/paged", () => HttpResponse.json({ items: [companyAdmin], page: 1, pageSize: 100, totalCount: 1, totalPages: 1, hasPrevious: false, hasNext: false })),
      http.get("/api/users/paged", () => HttpResponse.json({ items: [{
        memberId: "member-2", userId: "user-2", displayName: "Tomás Acosta", email: "tomas@example.com", state: "Active",
        hasManagedEmail: false, roles: [], companies: [], invitationId: null, invitationIssuedAtUtc: null, invitationExpiresAtUtc: null,
        version: 1, createdAtUtc: "2026-09-27T12:00:00Z",
      }], page: 1, pageSize: 100, totalCount: 1, totalPages: 1, hasPrevious: false, hasNext: false })),
      http.post("/api/companies/company-1/members", async ({ request }) => {
        requestBody = await request.json();
        idempotencyKey = request.headers.get("Idempotency-Key");
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const user = userEvent.setup();
    renderRouteWithProviders("/org/empresas/company-1", { as: "business-e6-admin" });
    await user.click(await screen.findByRole("button", { name: "Agregar miembro" }).then((buttons) => buttons));
    await user.click(await screen.findByRole("combobox", { name: "Usuario" }));
    await user.click(await screen.findByRole("option", { name: /Tomás Acosta/ }));
    await user.click(screen.getAllByRole("button", { name: "Agregar miembro" }).at(-1)!);

    await waitFor(() => expect(requestBody).toEqual({ memberId: "member-2", roleIds: [] }));
    expect(idempotencyKey).toMatch(/^[0-9a-f-]{36}$/i);
  }, 10_000);
});
