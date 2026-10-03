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

    await user.click(screen.getByRole("button", { name: "Estado: todos" }));
    await user.click(await screen.findByRole("menuitemradio", { name: /Deshabilitados/ }));
    await waitFor(() => expect(requests.at(-1)?.searchParams.get("state")).toBe("Inactive"));
    expect(router.state.location.search).toContain("state=Inactive");
  }, 10_000);

  it("tablero Usuarios: Empresa «y N más», filtros «Estado» y «Empresa» con «Sin empresa» y conteos, e invitaciones pendientes y vencidas", async () => {
    const user = userEvent.setup();
    const requests: URL[] = [];
    const counts = (all: number) => ({ all, active: all - 5 > 0 ? all - 5 : all, pendingDeletion: 1, invited: 2, expired: 1, inactive: 1 });
    const companies = [
      { id: "company-1", name: "Delta S.A.", taxId: null, timeZoneId: "America/Argentina/Buenos_Aires", status: "Active", memberCount: 5, version: 1, createdAtUtc: "2026-09-27T12:00:00Z" },
      { id: "company-2", name: "Delta Sur S.R.L.", taxId: null, timeZoneId: "America/Argentina/Buenos_Aires", status: "Active", memberCount: 2, version: 1, createdAtUtc: "2026-09-27T12:00:00Z" },
    ];
    const twoCompanies = { ...member, companies: [
      { companyId: "company-1", companyName: "Delta S.A.", status: "Active", roles: [{ id: "role-reader", name: "Solo lectura", isSystemRole: false, scope: "SpecificCompany", companyId: "company-1" }] },
      { companyId: "company-2", companyName: "Delta Sur S.R.L.", status: "Active", roles: [] },
    ] };
    server.use(
      http.get("/api/users/paged", ({ request }) => {
        requests.push(new URL(request.url));
        return HttpResponse.json({ items: [twoCompanies], page: 1, pageSize: 10, totalCount: 1, totalPages: 1, hasPrevious: false, hasNext: false });
      }),
      http.get("/api/users/filter-counts", ({ request }) => {
        const url = new URL(request.url);
        return HttpResponse.json(url.searchParams.get("withoutCompany") === "true" ? counts(2)
          : url.searchParams.get("companyId") === "company-1" ? counts(5)
            : url.searchParams.get("companyId") === "company-2" ? counts(3) : counts(11));
      }),
      http.get("/api/companies/paged", () => HttpResponse.json({ items: companies, page: 1, pageSize: 100, totalCount: 2, totalPages: 1, hasPrevious: false, hasNext: false })),
    );
    const { router } = renderRouteWithProviders("/org/usuarios", { as: "business-e6-admin" });

    const heading = await screen.findByRole("heading", { level: 1, name: "Usuarios" });
    // «N invitaciones» cuenta las pendientes y las vencidas.
    await waitFor(() => expect(heading.parentElement).toHaveTextContent("11 usuarios · 6 activos · 3 invitaciones"));
    const company = await screen.findByText("Delta S.A. y 1 más");
    expect(company.parentElement).toHaveTextContent("Delta S.A. y 1 másSolo lectura");
    expect(screen.queryByText("Delta Sur S.R.L.")).not.toBeInTheDocument();

    screen.getByRole("button", { name: "Estado: todos" }).focus();
    await user.keyboard("{Enter}");
    expect((await screen.findAllByRole("menuitemradio")).map((option) => option.textContent))
      .toEqual(["Todos11", "Activos6", "Invitación pendiente2", "Invitación vencida1", "Deshabilitados1", "Baja pedida1"]);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());

    const companyFilter = screen.getByRole("button", { name: "Empresa: todas" });
    companyFilter.focus();
    await user.keyboard("{Enter}");
    await waitFor(async () => expect((await screen.findAllByRole("menuitemradio")).map((option) => option.textContent))
      .toEqual(["Todas11", "Delta S.A.5", "Delta Sur S.R.L.3", "Sin empresa2"]));
    await user.click(screen.getByRole("menuitemradio", { name: /Sin empresa/ }));
    await waitFor(() => expect(requests.at(-1)?.searchParams.get("withoutCompany")).toBe("true"));
    expect(requests.at(-1)?.searchParams.get("companyId")).toBeNull();
    expect(router.state.location.search).toContain("companyId=none");
  }, 15_000);

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
