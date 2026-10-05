import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { configureI18n, changeCulture } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";

const member = {
  memberId: "member-1", userId: "user-1", displayName: "Lucía Fernández", email: "lucia@example.com",
  state: "Active" as const, hasManagedEmail: false,
  roles: [{ id: "role-owner", name: "Dueño", isSystemRole: true, scope: "Organization" as const, companyId: null }],
  companies: [], invitationId: null, invitationIssuedAtUtc: null, invitationExpiresAtUtc: null,
  version: 2, createdAtUtc: "2026-09-27T12:00:00Z",
};

const company = {
  id: "company-delta", name: "Delta S.A.", taxId: null, timeZoneId: "America/Argentina/Buenos_Aires",
  status: "Active" as const, memberCount: 1, version: 3, createdAtUtc: "2026-09-27T12:00:00Z",
};
const companyRole = {
  id: "role-company-reader", name: "Lector", isSystemRole: false, scope: "SpecificCompany" as const,
  companyId: company.id, description: null, userCount: 1, permissions: [], version: 1, createdAtUtc: "2026-09-27T12:00:00Z",
};

beforeEach(async () => {
  await configureI18n(referenceDataFixture().cultures);
  await changeCulture("es-AR");
});

describe("UserDetailPage company assignments", () => {
  // Límite de 10 s: abre el ⋮ y el diálogo, y elige los roles con user-event en el desplegable; con toda la suite tarda unos 3 s.
  it("guarda al momento los roles de empresa desde el diálogo", async () => {
    const user = userEvent.setup();
    let updateBody: unknown;
    const memberWithCompany = {
      ...member,
      companies: [{ companyId: company.id, companyName: company.name, status: "Active" as const, roles: [companyRole] }],
    };
    server.use(
      http.get("/api/users/member-1", () => HttpResponse.json(memberWithCompany)),
      http.get("/api/roles/paged", ({ request }) => {
        const scope = new URL(request.url).searchParams.get("scope");
        const items = scope === "Organization"
          ? [{ id: "role-owner", name: "Dueño", isSystemRole: true, scope: "Organization", companyId: null, description: null, userCount: 1, permissions: [], version: 1, createdAtUtc: "2026-09-27T12:00:00Z" }, { id: "role-support", name: "Soporte", isSystemRole: false, scope: "Organization", companyId: null, description: null, userCount: 0, permissions: [], version: 1, createdAtUtc: "2026-09-27T12:00:00Z" }]
          : [companyRole, { ...companyRole, id: "role-company-manager", name: "Compras", userCount: 0 }];
        return HttpResponse.json({ items, page: 1, pageSize: 100, totalCount: items.length, totalPages: 1, hasPrevious: false, hasNext: false });
      }),
      http.get("/api/companies/paged", () => HttpResponse.json({ items: [company], page: 1, pageSize: 100, totalCount: 1, totalPages: 1, hasPrevious: false, hasNext: false })),
      http.put("/api/users/member-1", async ({ request }) => { updateBody = await request.json(); return HttpResponse.json({ version: 2 }); }),
    );

    renderRouteWithProviders("/org/usuarios/member-1", { as: "business-e6-admin" });
    await screen.findByRole("heading", { name: "Lucía Fernández" });
    await screen.findByText("Lector");

    await user.click(screen.getByRole("button", { name: "Acciones de Delta S.A." }));
    await user.click(await screen.findByRole("menuitem", { name: "Cambiar roles" }));
    await user.click(screen.getByRole("button", { name: "Roles en la empresa" }));
    await user.click(await screen.findByRole("menuitemcheckbox", { name: "Compras" }));
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(updateBody).toEqual({ roleIds: ["role-owner"], companies: [{ companyId: company.id, roleIds: ["role-company-reader", "role-company-manager"] }], version: 2 }));
    // Tablero Usuario: la empresa se guarda al momento; «Guardar cambios» sigue a la vista, apagado.
    expect(await screen.findByText("Guardamos los roles en Delta S.A.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeDisabled();
  }, 10_000);
});
