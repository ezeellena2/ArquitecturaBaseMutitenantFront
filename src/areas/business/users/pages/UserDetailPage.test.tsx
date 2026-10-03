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

beforeEach(async () => {
  await configureI18n(referenceDataFixture().cultures);
  await changeCulture("es-AR");
});

describe("UserDetailPage", () => {
  it("edita roles con la versión cargada y comunica conflictos de concurrencia", async () => {
    const user = userEvent.setup();
    let updateBody: unknown;
    let responseConflict = false;
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

    const { container } = renderRouteWithProviders("/org/usuarios/member-1", { as: "business-e6-admin" });
    expect(await screen.findByRole("heading", { name: "Lucía Fernández" })).toBeVisible();
    expect(await axe(container)).toHaveNoViolations();
    await user.click(screen.getByRole("button", { name: /roles de la organización/i }));
    await user.click(await screen.findByRole("menuitemcheckbox", { name: "Soporte" }));
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(updateBody).toEqual({ roleIds: ["role-owner", "role-support"], companies: [], version: 2 }));

    responseConflict = true;
    await user.click(screen.getByRole("button", { name: /roles de la organización/i }));
    await user.click(await screen.findByRole("menuitemcheckbox", { name: "Dueño" }));
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Otra persona cambió esto mientras lo editabas");
  }, 10_000);
});
