import { screen, waitFor, within } from "@testing-library/react";
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

  it("tablero Usuarios: confirmaciones y avisos con el nombre, en pasado", async () => {
    const user = userEvent.setup();
    const invited = { ...member, memberId: "member-2", userId: null, displayName: "", email: "sofia@example.com", state: "Invited" as const, roles: [], invitationId: "invitation-2" };
    server.use(
      http.get("/api/users/paged", () => HttpResponse.json({ items: [member, invited], page: 1, pageSize: 10, totalCount: 2, totalPages: 1, hasPrevious: false, hasNext: false })),
      http.get("/api/users/filter-counts", () => HttpResponse.json({ all: 2, active: 1, pendingDeletion: 0, invited: 1, expired: 0, inactive: 0 })),
      http.get("/api/companies/paged", () => HttpResponse.json({ items: [], page: 1, pageSize: 100, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false })),
      http.put("/api/users/member-1/status", () => new HttpResponse(null, { status: 204 })),
      http.delete("/api/users/invitations/invitation-2", () => new HttpResponse(null, { status: 204 })),
    );
    renderRouteWithProviders("/org/usuarios", { as: "business-e6-admin" });
    expect(await screen.findByRole("button", { name: "Invitar usuario" })).toBeVisible();

    const open = async (name: string) => { const trigger = await screen.findByRole("button", { name }); trigger.focus(); await user.keyboard("{Enter}"); };
    await open("Acciones de Lucía Fernández");
    await user.click(await screen.findByRole("menuitem", { name: "Deshabilitar" }));
    const disable = await screen.findByRole("dialog", { name: "¿Deshabilitar a Lucía Fernández?" });
    expect(disable).toHaveTextContent("Deja de entrar a Empresa A y a sus empresas. Su cuenta y su perfil personal siguen funcionando.");
    await user.click(within(disable).getByRole("button", { name: "Deshabilitar" }));
    expect(await screen.findByText("Deshabilitamos a Lucía Fernández.")).toBeVisible();

    await open("Acciones de sofia@example.com");
    await user.click(await screen.findByRole("menuitem", { name: "Revocar invitación" }));
    const revoke = await screen.findByRole("dialog", { name: "¿Revocar la invitación a sofia@example.com?" });
    expect(revoke).toHaveTextContent("El enlace deja de funcionar. Podés volver a invitarla cuando quieras.");
    await user.click(within(revoke).getByRole("button", { name: "Revocar" }));
    expect(await screen.findByText("Revocamos la invitación a sofia@example.com.")).toBeVisible();
  }, 15_000);

  it("tablero Usuarios, Invitar: una empresa con sus roles, todo opcional salvo el correo, e idempotente", async () => {
    const bodies: unknown[] = [];
    const keys: (string | null)[] = [];
    const companyAdminRole = { id: "role-company-admin", name: "Administrador", isSystemRole: true, scope: "AnyCompany" as const, companyId: null, description: null, userCount: 1, permissions: [], version: 1, createdAtUtc: "2026-09-27T12:00:00Z" };
    server.use(
      http.get("/api/users/paged", () => HttpResponse.json({ items: [member], page: 1, pageSize: 10, totalCount: 1, totalPages: 1, hasPrevious: false, hasNext: false })),
      http.get("/api/users/filter-counts", () => HttpResponse.json({ all: 1, active: 1, pendingDeletion: 0, invited: 0, expired: 0, inactive: 0 })),
      http.get("/api/roles/paged", ({ request }) => HttpResponse.json({ items: new URL(request.url).searchParams.get("scope") === "Company" ? [companyAdminRole] : [{ ...ownerRole, description: null, userCount: 1, permissions: [], version: 1, createdAtUtc: "2026-09-27T12:00:00Z" }], page: 1, pageSize: 100, totalCount: 1, totalPages: 1, hasPrevious: false, hasNext: false })),
      http.get("/api/companies/paged", () => HttpResponse.json({ items: [{ id: "company-1", name: "Delta S.A.", taxId: null, timeZoneId: "America/Argentina/Buenos_Aires", status: "Active", memberCount: 1, version: 1, createdAtUtc: "2026-09-27T12:00:00Z" }], page: 1, pageSize: 100, totalCount: 1, totalPages: 1, hasPrevious: false, hasNext: false })),
      http.post("/api/users/invitations", async ({ request }) => {
        bodies.push(await request.json());
        keys.push(request.headers.get("Idempotency-Key"));
        return HttpResponse.json("invitation-1", { status: 201 });
      }),
    );

    const user = userEvent.setup();
    const { container } = renderRouteWithProviders("/org/usuarios", { as: "business-e6-admin" });
    await user.click(await screen.findByRole("button", { name: "Invitar usuario" }));
    const dialog = await screen.findByRole("dialog", { name: "Invitar usuario" });
    expect(dialog).not.toHaveTextContent("Enviamos un enlace");
    expect(within(dialog).queryByRole("button", { name: /Sumar empresa/ })).not.toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Roles en la empresa" })).toBeDisabled();
    expect(await axe(container)).toHaveNoViolations();

    // Solo el correo alcanza.
    await user.type(within(dialog).getByRole("textbox", { name: "Correo" }), "nueva@example.com");
    await user.click(within(dialog).getByRole("button", { name: "Invitar" }));
    await waitFor(() => expect(bodies.at(-1)).toEqual({ email: "nueva@example.com", roleIds: [], companies: [] }));
    expect(await screen.findByText("Invitamos a nueva@example.com.")).toBeVisible();
    expect(keys.at(-1)).toMatch(/^[0-9a-f-]{36}$/i);

    // Con un rol de la organización y una empresa con su rol.
    await user.click(screen.getByRole("button", { name: "Invitar usuario" }));
    const again = await screen.findByRole("dialog", { name: "Invitar usuario" });
    await user.type(within(again).getByRole("textbox", { name: "Correo" }), "otra@example.com");
    await user.click(within(again).getByRole("button", { name: "Roles de la organización" }));
    await user.click(await screen.findByRole("menuitemcheckbox", { name: "Dueño" }));
    await user.keyboard("{Escape}");
    const company = within(again).getByRole("combobox", { name: "Empresa" });
    company.focus();
    await user.keyboard("{Enter}");
    await user.click(await screen.findByRole("option", { name: "Delta S.A." }));
    await user.click(within(again).getByRole("button", { name: "Roles en la empresa" }));
    await user.click(await screen.findByRole("menuitemcheckbox", { name: "Administrador" }));
    await user.keyboard("{Escape}");
    await user.click(within(again).getByRole("button", { name: "Invitar" }));
    await waitFor(() => expect(bodies.at(-1)).toEqual({ email: "otra@example.com", roleIds: ["role-owner"], companies: [{ companyId: "company-1", roleIds: ["role-company-admin"] }] }));
  }, 20_000);

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
