import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { configureI18n, changeCulture } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";
import { asPhone } from "@/test/utils/phone";

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
  // Tablero M-Usuarios: en el teléfono, filas de borde a borde con el círculo y el estado, y crear es un «+» flotante.
  it("en el teléfono es una lista con «+» para invitar", async () => {
    const restore = asPhone();
    try {
      server.use(
        http.get("/api/users/paged", () => HttpResponse.json({ items: [member], page: 1, pageSize: 10, totalCount: 1, totalPages: 1, hasPrevious: false, hasNext: false })),
        http.get("/api/users/filter-counts", () => HttpResponse.json({ all: 1, active: 1, pendingDeletion: 0, invited: 0, expired: 0, inactive: 0 })),
        http.get("/api/companies/paged", () => HttpResponse.json({ items: [], page: 1, pageSize: 100, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false })),
      );
      renderRouteWithProviders("/org/usuarios", { as: "business-e6-admin" });

      const row = await screen.findByRole("link", { name: /Lucía Fernández/ });
      expect(row).toHaveAttribute("href", "/org/usuarios/member-1");
      expect(screen.queryByRole("table")).not.toBeInTheDocument();
      expect(within(row.closest("li")!).getByText("Activo")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Invitar usuario" })).toHaveClass("fixed", "size-14");
      expect(screen.getByRole("link", { name: "Volver a Más" })).toHaveAttribute("href", "/mas");
    } finally {
      restore();
    }
  });

  // Lienzo v99 («Fecha corta»): en la lista del teléfono, cuándo vence va sin el año si es del año en curso; si no, completa.
  it("en el teléfono, la invitación del año en curso vence sin el año y la de otro año, con el año", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-01T15:00:00Z"));
    const restore = asPhone();
    try {
      const invitation = { ...member, userId: null, roles: [], state: "Invited" as const, invitationId: "invitation-1", invitationIssuedAtUtc: "2026-09-25T12:00:00Z" };
      server.use(
        http.get("/api/users/paged", () => HttpResponse.json({ items: [
          { ...invitation, memberId: "member-2", displayName: "Sofía Herrera", email: "sofia@example.com", invitationExpiresAtUtc: "2026-10-02T12:00:00Z" },
          { ...invitation, memberId: "member-3", displayName: "Valentina Ruiz", email: "valentina@example.com", invitationExpiresAtUtc: "2027-01-05T12:00:00Z" },
        ], page: 1, pageSize: 10, totalCount: 2, totalPages: 1, hasPrevious: false, hasNext: false })),
        http.get("/api/users/filter-counts", () => HttpResponse.json({ all: 2, active: 0, pendingDeletion: 0, invited: 2, expired: 0, inactive: 0 })),
        http.get("/api/companies/paged", () => HttpResponse.json({ items: [], page: 1, pageSize: 100, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false })),
      );
      renderRouteWithProviders("/org/usuarios", { as: "business-e6-admin" });

      const thisYear = (await screen.findByRole("link", { name: /Sofía Herrera/ })).closest("li")!;
      expect(within(thisYear).getByText("02/10")).toHaveAttribute("datetime", "2026-10-02T12:00:00Z");
      // Tablero M-Usuarios: después del punto, «vence» en minúscula.
      expect(thisYear).toHaveTextContent("Invitación pendiente · vence 02/10");
      const nextYear = screen.getByRole("link", { name: /Valentina Ruiz/ }).closest("li")!;
      expect(within(nextYear).getByText("05/01/2027")).toBeInTheDocument();
    } finally {
      restore();
      vi.useRealTimers();
    }
  });

  // Límite de 10 s: escribe la búsqueda con user-event y espera la consulta, que sale después de la pausa del buscador; con toda la suite tarda unos 3,5 s.
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
    // Tablero Usuarios: el nombre en el color del texto, no en verde, y las columnas con sus anchos.
    expect(screen.getByRole("link", { name: "Lucía Fernández" })).toHaveClass("font-medium", "text-[var(--t1)]");
    expect(screen.getByRole("link", { name: "Lucía Fernández" })).not.toHaveClass("text-[var(--marca-tx)]");
    expect(screen.getByRole("columnheader", { name: "Usuario" })).toHaveClass("w-[30%]");
    expect(screen.getByRole("columnheader", { name: "Rol en la organización" })).toHaveClass("w-[19%]");
    expect(screen.getByRole("columnheader", { name: "Estado" })).toHaveClass("w-[202px]");
    expect(screen.getByRole("columnheader", { name: "Usuario" })).toBeVisible();
    expect(screen.getByRole("columnheader", { name: "Rol en la organización" })).toBeVisible();
    expect(screen.getByRole("columnheader", { name: "Empresa" })).toBeVisible();
    expect(screen.queryByRole("columnheader", { name: "Correo" })).not.toBeInTheDocument();
    // Tableros de listas (.pagina, compacto): 14 entre la caja de los filtros y la tabla.
    expect(screen.getByRole("search").parentElement).toHaveClass("md:gap-3.5");
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
    const invited = { ...member, memberId: "member-2", userId: null, displayName: "Sofía Herrera", email: "sofia@example.com", state: "Invited" as const,
      roles: [], invitationId: "invitation-1", invitationIssuedAtUtc: "2026-09-25T12:00:00Z", invitationExpiresAtUtc: "2026-10-02T12:00:00Z" };
    server.use(
      http.get("/api/users/paged", ({ request }) => {
        requests.push(new URL(request.url));
        return HttpResponse.json({ items: [twoCompanies, invited], page: 1, pageSize: 10, totalCount: 2, totalPages: 1, hasPrevious: false, hasNext: false });
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
    // «Criterio · Tablas» (lienzo v92): la segunda línea gris de la tabla. El correo debajo del nombre, los roles de la
    // empresa debajo de la empresa y «Vence…» debajo del estado, bajo la palabra y no bajo el punto; todas las filas, de 52.
    const detail = (text: string | RegExp) => screen.getByText(text).closest('[data-slot="cell-detail"]');
    expect(detail("lucia@example.com")).not.toBeNull();
    expect(detail("Solo lectura")).not.toBeNull();
    const expires = detail(/^Vence/);
    expect(expires).toHaveTextContent("Vence 02/10/2026");
    expect(expires?.firstElementChild).toHaveClass("pl-3.5");
    expect(screen.getAllByRole("row").slice(1).every((row) => row.classList.contains("h-[52px]"))).toBe(true);

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
  });

  // Tablero Usuarios (v109): una invitación vencida dice «Venció …» debajo del estado, nunca «Vence» con una fecha pasada.
  it("tablero Usuarios: la invitación vencida dice «Venció» con su fecha", async () => {
    const expired = { ...member, memberId: "member-3", userId: null, displayName: "", email: "valentina@example.com", state: "Expired" as const,
      roles: [], invitationId: "invitation-3", invitationIssuedAtUtc: "2026-09-22T12:00:00Z", invitationExpiresAtUtc: "2026-09-29T12:00:00Z" };
    server.use(
      http.get("/api/users/paged", () => HttpResponse.json({ items: [expired], page: 1, pageSize: 10, totalCount: 1, totalPages: 1, hasPrevious: false, hasNext: false })),
      http.get("/api/users/filter-counts", () => HttpResponse.json({ all: 1, active: 0, pendingDeletion: 0, invited: 0, expired: 1, inactive: 0 })),
      http.get("/api/companies/paged", () => HttpResponse.json({ items: [], page: 1, pageSize: 100, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false })),
    );
    renderRouteWithProviders("/org/usuarios", { as: "business-e6-admin" });

    const state = await screen.findByText("Invitación vencida");
    const detail = state.closest("td")?.querySelector('[data-slot="cell-detail"]');
    expect(detail).toHaveTextContent(/^Venció 29\/09\/2026$/);
    expect(screen.queryByText(/^Vence /)).not.toBeInTheDocument();
  });

  it("tablero Usuarios: confirmaciones y avisos con el nombre, en pasado", async () => {
    const user = userEvent.setup();
    const invited = { ...member, memberId: "member-2", userId: null, displayName: "", email: "sofia@example.com", state: "Invited" as const, roles: [], invitationId: "invitation-2" };
    server.use(
      http.get("/api/users/paged", () => HttpResponse.json({ items: [member, invited], page: 1, pageSize: 10, totalCount: 2, totalPages: 1, hasPrevious: false, hasNext: false })),
      http.get("/api/users/filter-counts", () => HttpResponse.json({ all: 2, active: 1, pendingDeletion: 0, invited: 1, expired: 0, inactive: 0 })),
      http.get("/api/companies/paged", () => HttpResponse.json({ items: [], page: 1, pageSize: 100, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false })),
      http.put("/api/users/member-1/status", () => HttpResponse.json({ version: 2 })),
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
    // «Criterio · Menús» y tablero Usuarios (v109): «Revocar invitación» abajo, después de la franja, en rojo y con la ✕.
    const revokeOption = await screen.findByRole("menuitem", { name: "Revocar invitación" });
    expect(revokeOption).toHaveAttribute("data-variant", "destructive");
    expect(screen.getByRole("separator")).toBeInTheDocument();
    expect([...revokeOption.querySelectorAll("svg path")].map((item) => item.getAttribute("d"))).toEqual(["M7 7l10 10", "M17 7 7 17"]);
    await user.click(revokeOption);
    const revoke = await screen.findByRole("dialog", { name: "¿Revocar la invitación a sofia@example.com?" });
    expect(revoke).toHaveTextContent("El enlace deja de funcionar. Podés volver a invitarla cuando quieras.");
    await user.click(within(revoke).getByRole("button", { name: "Revocar" }));
    expect(await screen.findByText("Revocamos la invitación a sofia@example.com.")).toBeVisible();
  });

  // Límite de 20 s: invita dos veces, escribe los correos con user-event y elige roles y empresa en tres desplegables; con toda la suite tarda unos 6,5 s.
  it("tablero Usuarios, Invitar: una empresa con sus roles, todo opcional salvo el correo, e idempotente", async () => {
    const bodies: unknown[] = [];
    const keys: (string | null)[] = [];
    const companyAdminRole = { id: "role-company-admin", name: "Administrador", isSystemRole: true, scope: "AnyCompany" as const, companyId: null, description: "Administra la empresa: sus miembros y sus roles.", userCount: 1, permissions: [], version: 1, createdAtUtc: "2026-09-27T12:00:00Z" };
    server.use(
      http.get("/api/users/paged", () => HttpResponse.json({ items: [member], page: 1, pageSize: 10, totalCount: 1, totalPages: 1, hasPrevious: false, hasNext: false })),
      http.get("/api/users/filter-counts", () => HttpResponse.json({ all: 1, active: 1, pendingDeletion: 0, invited: 0, expired: 0, inactive: 0 })),
      http.get("/api/roles/paged", ({ request }) => HttpResponse.json({ items: new URL(request.url).searchParams.get("scope") === "Company" ? [companyAdminRole] : [{ ...ownerRole, description: null, userCount: 1, permissions: [], version: 1, createdAtUtc: "2026-09-27T12:00:00Z" }], page: 1, pageSize: 100, totalCount: 1, totalPages: 1, hasPrevious: false, hasNext: false })),
      http.get("/api/companies/paged", () => HttpResponse.json({ items: [{ id: "company-1", name: "Delta S.A.", taxId: null, timeZoneId: "America/Argentina/Buenos_Aires", status: "Active", memberCount: 1, version: 1, createdAtUtc: "2026-09-27T12:00:00Z" }], page: 1, pageSize: 100, totalCount: 1, totalPages: 1, hasPrevious: false, hasNext: false })),
      http.post("/api/users/invitations", async ({ request }) => {
        bodies.push(await request.json());
        keys.push(request.headers.get("Idempotency-Key"));
        return HttpResponse.json({ invitationId: "invitation-1", expiresAtUtc: "2026-10-10T15:00:00Z" }, { status: 201 });
      }),
    );

    const user = userEvent.setup();
    const { container } = renderRouteWithProviders("/org/usuarios", { as: "business-e6-admin" });
    await user.click(await screen.findByRole("button", { name: "Invitar usuario" }));
    const dialog = await screen.findByRole("dialog", { name: "Invitar usuario" });
    // Tablero M-Usuarios-Invitar: en el teléfono es una hoja de alto justo, no a todo el alto, con el cuerpo de los diálogos.
    expect(dialog).not.toHaveClass("min-h-[calc(100dvh-1rem)]");
    expect(within(dialog).getByRole("textbox", { name: "Correo" }).closest("[data-slot='dialog-body']")).not.toBeNull();
    expect(dialog).not.toHaveTextContent("Enviamos un enlace");
    expect(within(dialog).queryByRole("button", { name: /Sumar empresa/ })).not.toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Roles en la empresa" })).toBeDisabled();
    expect(await axe(container)).toHaveNoViolations();

    // Solo el correo alcanza.
    await user.type(within(dialog).getByRole("textbox", { name: "Correo" }), "nueva@example.com");
    await user.click(within(dialog).getByRole("button", { name: "Invitar" }));
    await waitFor(() => expect(bodies.at(-1)).toEqual({ email: "nueva@example.com", roleIds: [], companies: [] }));
    expect(await screen.findByText("Invitamos a nueva@example.com. La invitación vence el 10/10/2026.")).toBeVisible();
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
    // Tablero Usuarios: cada rol del desplegable, con su descripción debajo.
    expect(await screen.findByRole("menuitemcheckbox", { name: "Administrador" })).toHaveAccessibleDescription("Administra la empresa: sus miembros y sus roles.");
    await user.click(screen.getByRole("menuitemcheckbox", { name: "Administrador" }));
    await user.keyboard("{Escape}");
    await user.click(within(again).getByRole("button", { name: "Invitar" }));
    await waitFor(() => expect(bodies.at(-1)).toEqual({ email: "otra@example.com", roleIds: ["role-owner"], companies: [{ companyId: "company-1", roleIds: ["role-company-admin"] }] }));
  }, 20_000);

  // «Criterio · Diálogos» y «Criterio · Formularios»: el error general del diálogo va en la franja arriba de los botones,
  // no arriba de los campos.
  // Límite de 10 s: abre el diálogo y escribe el correo con user-event; con toda la suite tarda unos 2,2 s.
  it("un error al invitar va en la franja del diálogo, arriba de los botones", async () => {
    server.use(
      http.get("/api/users/paged", () => HttpResponse.json({ items: [member], page: 1, pageSize: 10, totalCount: 1, totalPages: 1, hasPrevious: false, hasNext: false })),
      http.get("/api/users/filter-counts", () => HttpResponse.json({ all: 1, active: 1, pendingDeletion: 0, invited: 0, expired: 0, inactive: 0 })),
      http.get("/api/roles/paged", () => HttpResponse.json({ items: [], page: 1, pageSize: 100, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false })),
      http.get("/api/companies/paged", () => HttpResponse.json({ items: [], page: 1, pageSize: 100, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false })),
      http.post("/api/users/invitations", () => HttpResponse.json({ status: 409, code: "Users.Invitation.UserInactive", title: "Conflicto",
        detail: "Esa persona tiene el acceso deshabilitado. Habilitala en vez de invitarla." }, { status: 409 })),
    );
    const user = userEvent.setup();
    renderRouteWithProviders("/org/usuarios", { as: "business-e6-admin" });
    await user.click(await screen.findByRole("button", { name: "Invitar usuario" }));
    const dialog = await screen.findByRole("dialog", { name: "Invitar usuario" });
    await user.type(within(dialog).getByRole("textbox", { name: "Correo" }), "marcos@example.com");
    await user.click(within(dialog).getByRole("button", { name: "Invitar" }));

    const alert = await within(dialog).findByRole("alert");
    expect(alert).toHaveTextContent("Esa persona tiene el acceso deshabilitado. Habilitala en vez de invitarla.");
    const following = (from: Node, to: Node) => Boolean(from.compareDocumentPosition(to) & Node.DOCUMENT_POSITION_FOLLOWING);
    expect(following(within(dialog).getByRole("combobox", { name: "Empresa" }), alert)).toBe(true);
    expect(following(alert, within(dialog).getByRole("button", { name: "Cancelar" }))).toBe(true);
  }, 10_000);

  // «Criterio · Botones»: «Invitar» no se apaga; sin correo, el campo dice qué corregir (no el aviso del navegador) y no se
  // manda nada. formularios.md (Diálogo): se monta al abrirse, así que al cerrarlo lo escrito se va con él.
  it("«Invitar» sin correo marca el campo y no manda nada; al cerrarlo, lo escrito se va", async () => {
    let posts = 0;
    server.use(
      http.get("/api/users/paged", () => HttpResponse.json({ items: [member], page: 1, pageSize: 10, totalCount: 1, totalPages: 1, hasPrevious: false, hasNext: false })),
      http.get("/api/users/filter-counts", () => HttpResponse.json({ all: 1, active: 1, pendingDeletion: 0, invited: 0, expired: 0, inactive: 0 })),
      http.get("/api/roles/paged", () => HttpResponse.json({ items: [], page: 1, pageSize: 100, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false })),
      http.get("/api/companies/paged", () => HttpResponse.json({ items: [], page: 1, pageSize: 100, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false })),
      http.post("/api/users/invitations", () => { posts += 1; return HttpResponse.json({ invitationId: "invitation-1", expiresAtUtc: "2026-10-10T15:00:00Z" }, { status: 201 }); }),
    );
    const user = userEvent.setup();
    renderRouteWithProviders("/org/usuarios", { as: "business-e6-admin" });
    const open = await screen.findByRole("button", { name: "Invitar usuario" });
    await user.click(open);
    const dialog = await screen.findByRole("dialog", { name: "Invitar usuario" });
    const invite = within(dialog).getByRole("button", { name: "Invitar" });
    expect(invite).toBeEnabled();
    await user.click(invite);

    const email = within(dialog).getByRole("textbox", { name: "Correo" });
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(email).toHaveAccessibleDescription("Ingresá un correo electrónico válido.");
    expect(posts).toBe(0);
    await user.type(email, "nueva@example.com");
    expect(within(dialog).queryByText("Ingresá un correo electrónico válido.")).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Invitar usuario" })).not.toBeInTheDocument());
    // En jsdom, después de cerrar un diálogo, Radix a veces ignora el clic del puntero: se abre con foco y Enter.
    open.focus();
    await user.keyboard("{Enter}");
    const again = await screen.findByRole("dialog", { name: "Invitar usuario" });
    expect(within(again).getByRole("textbox", { name: "Correo" })).toHaveValue("");
    expect(posts).toBe(0);
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
  });
});
