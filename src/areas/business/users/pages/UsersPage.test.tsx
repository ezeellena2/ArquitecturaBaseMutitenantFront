import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { configureI18n, changeCulture } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";

const ownerRole = {
  id: "role-owner", name: "Dueño", isSystemRole: true, scope: "Organization" as const, companyId: null,
};

const member = {
  memberId: "member-1", userId: "user-1", displayName: "Lucía Fernández", email: "lucia@example.com",
  state: "Active" as const, hasManagedEmail: true, roles: [ownerRole], companies: [], invitationId: null,
  invitationIssuedAtUtc: null, invitationExpiresAtUtc: null, version: 2, createdAtUtc: "2026-09-27T12:00:00Z",
};

beforeEach(async () => {
  await configureI18n(referenceDataFixture().cultures);
  await changeCulture("es-AR");
});

describe("UsersPage", () => {
  it("muestra conteos y resultados, y mantiene búsqueda y estado en la URL", async () => {
    const user = userEvent.setup();
    const requests: URL[] = [];
    server.use(
      http.get("/api/users/paged", ({ request }) => {
        requests.push(new URL(request.url));
        return HttpResponse.json({ items: [member], page: 1, pageSize: 10, totalCount: 1, totalPages: 1, hasPrevious: false, hasNext: false });
      }),
      http.get("/api/users/filter-counts", () => HttpResponse.json({ all: 1, active: 1, pendingDeletion: 0, invited: 0, expired: 0, inactive: 0 })),
      http.get("/api/companies/paged", () => HttpResponse.json({ items: [], page: 1, pageSize: 100, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false })),
    );

    const { container, router } = renderRouteWithProviders("/org/usuarios", { as: "business-e6-admin" });

    expect(await screen.findByRole("heading", { level: 1, name: "Usuarios" })).toBeVisible();
    expect(await screen.findByRole("link", { name: "Lucía Fernández" })).toHaveAttribute("href", "/org/usuarios/member-1");
    expect(screen.getByRole("columnheader", { name: "Usuario" })).toBeVisible();
    expect(screen.getByRole("columnheader", { name: "Rol en la organización" })).toBeVisible();
    expect(screen.getByRole("columnheader", { name: "Empresa" })).toBeVisible();
    expect(screen.queryByRole("columnheader", { name: "Correo" })).not.toBeInTheDocument();
    expect(screen.getByText("lucia@example.com")).toBeVisible();
    expect(await axe(container)).toHaveNoViolations();

    await user.type(screen.getByRole("searchbox", { name: "Buscar por nombre o correo" }), "Lucía");
    await waitFor(() => expect(requests.at(-1)?.searchParams.get("search")).toBe("Lucía"), { timeout: 3_000 });
    expect(router.state.location.search).toContain("search=Luc%C3%ADa");

    await user.click(screen.getByRole("button", { name: "Todos los estados" }));
    await user.click(await screen.findByRole("menuitemradio", { name: /Deshabilitado/ }));
    await waitFor(() => expect(requests.at(-1)?.searchParams.get("state")).toBe("Inactive"));
    expect(router.state.location.search).toContain("state=Inactive");
  }, 10_000);

  it("invita con correo y roles usando una clave idempotente", async () => {
    let body: unknown;
    let idempotencyKey: string | null = null;
    server.use(
      http.get("/api/users/paged", () => HttpResponse.json({ items: [member], page: 1, pageSize: 10, totalCount: 1, totalPages: 1, hasPrevious: false, hasNext: false })),
      http.get("/api/users/filter-counts", () => HttpResponse.json({ all: 1, active: 1, pendingDeletion: 0, invited: 0, expired: 0, inactive: 0 })),
      http.get("/api/roles/paged", () => HttpResponse.json({ items: [{ ...ownerRole, description: null, userCount: 1, permissions: [], version: 1, createdAtUtc: "2026-09-27T12:00:00Z" }], page: 1, pageSize: 100, totalCount: 1, totalPages: 1, hasPrevious: false, hasNext: false })),
      http.get("/api/companies/paged", () => HttpResponse.json({ items: [], page: 1, pageSize: 100, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false })),
      http.post("/api/users/invitations", async ({ request }) => {
        body = await request.json();
        idempotencyKey = request.headers.get("Idempotency-Key");
        return HttpResponse.json("invitation-1");
      }),
    );

    const user = userEvent.setup();
    const { container } = renderRouteWithProviders("/org/usuarios", { as: "business-e6-admin" });
    await user.click(await screen.findByRole("button", { name: "Invitar" }));
    expect(await axe(container)).toHaveNoViolations();
    await user.type(screen.getByRole("textbox", { name: "Correo" }), "nueva@example.com");
    await user.click(screen.getByRole("button", { name: "Roles de la organización" }));
    await user.click(await screen.findByRole("menuitemcheckbox", { name: "Dueño" }));
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Enviar invitación" }));

    await waitFor(() => expect(body).toEqual({ email: "nueva@example.com", roleIds: ["role-owner"], companies: [] }));
    expect(idempotencyKey).toBeTruthy();
  }, 10_000);

  it("pagina una organización con 50 usuarios sin cargar más de una página", async () => {
    const items = Array.from({ length: 10 }, (_item, index) => ({
      ...member,
      memberId: `member-${index + 1}`,
      userId: `user-${index + 1}`,
      displayName: `Persona ${index + 1}`,
    }));
    server.use(
      http.get("/api/users/paged", () => HttpResponse.json({ items, page: 1, pageSize: 10, totalCount: 50, totalPages: 5, hasPrevious: false, hasNext: true })),
      http.get("/api/users/filter-counts", () => HttpResponse.json({ all: 50, active: 50, pendingDeletion: 0, invited: 0, expired: 0, inactive: 0 })),
      http.get("/api/companies/paged", () => HttpResponse.json({ items: [], page: 1, pageSize: 100, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false })),
    );

    const { container } = renderRouteWithProviders("/org/usuarios", { as: "business-e6-admin" });
    expect(await screen.findByText("Persona 10")).toBeVisible();
    expect(screen.getAllByRole("row")).toHaveLength(11);
    expect(screen.getByText(/50 usuarios/)).toBeVisible();
    expect(await axe(container)).toHaveNoViolations();
  }, 10_000);
});
