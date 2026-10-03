import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
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

describe("UserDetailPage", () => {
  it("edita roles con la versión cargada y comunica conflictos de concurrencia", async () => {
    const user = userEvent.setup();
    let updateBody: unknown;
    const responseConflict = true;
    server.use(
      http.get("/api/users/member-1", () => HttpResponse.json(member)),
      http.get("/api/roles/paged", ({ request }) => {
        const scope = new URL(request.url).searchParams.get("scope");
        const items = scope === "Organization" ? [
          { id: "role-owner", name: "Dueño", isSystemRole: true, scope: "Organization", companyId: null, description: null, userCount: 1, permissions: [], version: 1, createdAtUtc: "2026-09-27T12:00:00Z" },
          { id: "role-support", name: "Soporte", isSystemRole: false, scope: "Organization", companyId: null, description: null, userCount: 0, permissions: [], version: 1, createdAtUtc: "2026-09-27T12:00:00Z" },
        ] : [];
        return HttpResponse.json({ items, page: 1, pageSize: 100, totalCount: items.length, totalPages: 1, hasPrevious: false, hasNext: false });
      }),
      http.get("/api/companies/paged", () => HttpResponse.json({ items: [], page: 1, pageSize: 100, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false })),
      http.put("/api/users/member-1", async ({ request }) => {
        updateBody = await request.json();
        return responseConflict ? HttpResponse.json({ status: 409, code: "General.ConcurrencyConflict", title: "Conflicto", detail: "La ficha cambió." }, { status: 409 }) : new HttpResponse(null, { status: 204 });
      }),
    );

    const { container, unmount } = renderRouteWithProviders("/org/usuarios/member-1", { as: "business-e6-admin" });
    expect(await screen.findByRole("heading", { name: "Lucía Fernández" })).toBeVisible();
    expect(await axe(container)).toHaveNoViolations();
    const organizationRoles = screen.getByRole("button", { name: /roles de la organización/i });
    await waitFor(() => expect(organizationRoles).toHaveTextContent("Dueño"));
    await user.click(organizationRoles);
    await user.click(await screen.findByRole("menuitemcheckbox", { name: "Soporte" }));
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("menuitemcheckbox")).not.toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(updateBody).toEqual({ roleIds: ["role-owner", "role-support"], companies: [], version: 2 }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Otra persona cambió esto mientras lo editabas");
    unmount();
  }, 10_000);

  it("suma una empresa desde el diálogo y guarda la asignación al momento", async () => {
    const user = userEvent.setup();
    let updateBody: unknown;
    server.use(
      http.get("/api/users/member-1", () => HttpResponse.json(member)),
      http.get("/api/roles/paged", ({ request }) => {
        const scope = new URL(request.url).searchParams.get("scope");
        const items = scope === "Organization" ? member.roles : [{ ...companyRole, name: "Administrador", id: "role-company-manager" }];
        return HttpResponse.json({ items, page: 1, pageSize: 100, totalCount: items.length, totalPages: 1, hasPrevious: false, hasNext: false });
      }),
      http.get("/api/companies/paged", () => HttpResponse.json({ items: [company], page: 1, pageSize: 100, totalCount: 1, totalPages: 1, hasPrevious: false, hasNext: false })),
      http.put("/api/users/member-1", async ({ request }) => { updateBody = await request.json(); return new HttpResponse(null, { status: 204 }); }),
    );

    renderRouteWithProviders("/org/usuarios/member-1", { as: "business-e6-admin" });
    await screen.findByRole("heading", { name: "Lucía Fernández" });
    await user.click(await screen.findByRole("button", { name: "Sumar empresa" }));
    await user.click(await screen.findByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "Delta S.A." }));
    await user.click(screen.getByRole("button", { name: "Roles en la empresa" }));
    await user.click(await screen.findByRole("menuitemcheckbox", { name: "Administrador" }));
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Sumar empresa" }));

    await waitFor(() => expect(updateBody).toEqual({ roleIds: ["role-owner"], companies: [{ companyId: company.id, roleIds: ["role-company-manager"] }], version: 2 }));
  }, 10_000);
});
