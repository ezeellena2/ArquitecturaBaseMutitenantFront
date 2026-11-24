import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { configureI18n, changeCulture } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";
import { asPhone, cardData } from "@/test/utils/phone";

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
  // 115: «Reactivar» del ⋮ va directo a la red; mientras espera, el ⋮ de la fila cambia su dibujo por el aro y no se abre.
  it("«Reactivar» del ⋮ muestra que trabaja hasta la respuesta", async () => {
    let release: (() => void) | undefined;
    server.use(
      http.get("/api/users/paged", () => HttpResponse.json({ items: [{ ...member, state: "Inactive" }], page: 1, pageSize: 10, totalCount: 1, totalPages: 1, hasPrevious: false, hasNext: false })),
      http.get("/api/users/filter-counts", () => HttpResponse.json({ all: 1, active: 0, pendingDeletion: 0, invited: 0, expired: 0, inactive: 1 })),
      http.get("/api/companies/paged", () => HttpResponse.json({ items: [], page: 1, pageSize: 100, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false })),
      http.put("/api/users/member-1/status", async () => { await new Promise<void>((resolve) => { release = resolve; }); return HttpResponse.json({ version: 3 }); }),
    );
    const user = userEvent.setup();
    renderRouteWithProviders("/org/usuarios", { as: "business-e6-admin" });
    const trigger = await screen.findByRole("button", { name: "Acciones de Lucía Fernández" });
    trigger.focus(); await user.keyboard("{Enter}");
    await user.click(await screen.findByRole("menuitem", { name: "Reactivar" }));
    await waitFor(() => expect(release).toBeDefined());
    expect(trigger).toHaveAttribute("aria-busy", "true");
    trigger.focus(); await user.keyboard("{Enter}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    release?.();
    await waitFor(() => expect(trigger).not.toHaveAttribute("aria-busy"));
  });

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
  // M-Usuarios-Base2 (263): la invitación es una tarjeta con su estado, su entrega, su empresa y hasta cuándo vale, cada dato
  // nombrado.
  it("en el teléfono, la invitación es una tarjeta que dice hasta cuándo vale, con la fecha completa", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-01T15:00:00Z"));
    const restore = asPhone();
    try {
      const invitation = { ...member, userId: null, roles: [], state: "Invited" as const, invitationId: "invitation-1", invitationIssuedAtUtc: "2026-09-25T12:00:00Z" };
      server.use(
        http.get("/api/users/paged", () => HttpResponse.json({ items: [
          { ...invitation, memberId: "member-2", displayName: "Sofía Herrera", email: "sofia@example.com", invitationExpiresAtUtc: "2026-10-02T12:00:00Z", invitationDelivery: "Uncertain" },
          { ...invitation, memberId: "member-3", displayName: "Valentina Ruiz", email: "valentina@example.com", invitationExpiresAtUtc: "2027-01-05T12:00:00Z" },
        ], page: 1, pageSize: 10, totalCount: 2, totalPages: 1, hasPrevious: false, hasNext: false })),
        http.get("/api/users/filter-counts", () => HttpResponse.json({ all: 2, active: 0, pendingDeletion: 0, invited: 2, expired: 0, inactive: 0 })),
        http.get("/api/companies/paged", () => HttpResponse.json({ items: [], page: 1, pageSize: 100, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false })),
      );
      renderRouteWithProviders("/org/usuarios", { as: "business-e6-admin" });

      const thisYear = (await screen.findByRole("link", { name: /Sofía Herrera/ })).closest("li")!;
      // formatos.md (base de la 12): la fecha va completa, con su año, también la del año en curso.
      expect(within(thisYear).getByText("02/10/2026, 09:00")).toHaveAttribute("datetime", "2026-10-02T12:00:00Z");
      // M-Usuarios-Base2 (0066 §4): la entrega va segunda, sin su (i), que no se toca dentro de la tarjeta: la dice la ficha.
      expect(cardData(thisYear)).toEqual([["Estado", "Invitación pendiente"], ["Entrega", "Sin confirmar"], ["Empresa", "—"], ["Vence", "02/10/2026, 09:00"]]);
      expect(within(thisYear).queryByRole("button", { name: /^Más información/ })).not.toBeInTheDocument();
      expect(thisYear.textContent).not.toContain("·");
      const nextYear = screen.getByRole("link", { name: /Valentina Ruiz/ }).closest("li")!;
      expect(within(nextYear).getByText("05/01/2027, 09:00")).toBeInTheDocument();
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
    // Tablero Usuarios (base de la 12): un dato por celda, con el correo y «Vence» en sus columnas.
    expect(screen.getByRole("columnheader", { name: "Usuario" })).toHaveClass("w-[20%]");
    expect(screen.getByRole("columnheader", { name: "Correo" })).toHaveClass("w-[22%]");
    expect(screen.getByRole("columnheader", { name: "Rol en la organización" })).toHaveClass("w-[15%]");
    expect(screen.getByRole("columnheader", { name: "Estado" })).toHaveClass("w-40.5");
    expect(screen.getByRole("columnheader", { name: "Vence" })).toHaveClass("w-30");
    expect(screen.getByRole("columnheader", { name: "Usuario" })).toBeVisible();
    expect(screen.getByRole("columnheader", { name: "Rol en la organización" })).toBeVisible();
    expect(screen.getByRole("columnheader", { name: "Empresa" })).toBeVisible();
    expect(screen.getByRole("columnheader", { name: "Correo" })).toBeVisible();
    // Tableros de listas (.pagina, compacto): 14 entre la caja de los filtros y la tabla.
    expect(screen.getByRole("search").parentElement).toHaveClass("md:gap-3.5");
    expect(screen.getByText("lucia@example.com")).toBeVisible();
    expect(await axe(container)).toHaveNoViolations();

    await user.type(screen.getByRole("searchbox", { name: "Buscar por nombre o correo" }), "Lucía");
    await waitFor(() => expect(requests.at(-1)?.searchParams.get("search")).toBe("Lucía"), { timeout: 3_000 });
    expect(router.state.location.search).toContain("search=Luc%C3%ADa");

    await user.click(screen.getByRole("button", { name: "Estado: todos" }));
    await user.click(await screen.findByRole("option", { name: /Dados de baja/ }));
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
        return HttpResponse.json({ ...(url.searchParams.get("withoutCompany") === "true" ? counts(2)
          : url.searchParams.get("companyId") === "company-1" ? counts(5)
            : url.searchParams.get("companyId") === "company-2" ? counts(3) : counts(11)), companyAll: 11, withoutCompany: 2, companies: { "company-1": 5, "company-2": 3 } });
      }),
      http.get("/api/companies/paged", () => HttpResponse.json({ items: companies, page: 1, pageSize: 100, totalCount: 2, totalPages: 1, hasPrevious: false, hasNext: false })),
    );
    const { router } = renderRouteWithProviders("/org/usuarios", { as: "business-e6-admin" });

    const heading = await screen.findByRole("heading", { level: 1, name: "Usuarios" });
    // «N invitaciones» cuenta las pendientes y las vencidas.
    await waitFor(() => expect(heading.parentElement).toHaveTextContent("11 usuarios · 6 activos · 3 invitaciones"));
    const company = await screen.findByText("Delta S.A. y 1 más");
    // Tablero Usuarios (base de la 12): un dato por celda. La empresa sin sus roles debajo, el correo en «Correo» y hasta
    // cuándo vale una invitación en «Vence»; las filas, de 40 como mínimo.
    expect(company.closest("td")).toHaveTextContent(/^Delta S\.A\. y 1 más$/);
    expect(screen.queryByText("Delta Sur S.R.L.")).not.toBeInTheDocument();
    expect(screen.queryByText("Solo lectura")).not.toBeInTheDocument();
    expect(screen.getAllByText("lucia@example.com").some((cell) => cell.closest("td"))).toBe(true);
    expect(screen.getAllByRole("cell").some((cell) => cell.textContent === "02/10/2026")).toBe(true);
    expect(document.querySelector('[data-slot="cell-detail"]')).toBeNull();
    expect(screen.getAllByRole("row").slice(1).every((row) => row.classList.contains("h-10"))).toBe(true);

    screen.getByRole("button", { name: "Estado: todos" }).focus();
    await user.keyboard("{Enter}");
    // 143: las opciones de un filtro no dicen cuántas filas traen.
    expect((await screen.findAllByRole("option")).map((option) => option.textContent))
      .toEqual(["Todos", "Activos", "Invitación pendiente", "Invitación vencida", "Dados de baja", "Por borrar"]);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());

    const companyFilter = screen.getByRole("button", { name: "Empresa: todas" });
    companyFilter.focus();
    await user.keyboard("{Enter}");
    await waitFor(async () => expect((await screen.findAllByRole("option")).map((option) => option.textContent))
      .toEqual(["Todas", "Delta S.A.", "Delta Sur S.R.L.", "Sin empresa"]));
    await user.click(screen.getByRole("option", { name: /Sin empresa/ }));
    await waitFor(() => expect(requests.at(-1)?.searchParams.get("withoutCompany")).toBe("true"));
    expect(requests.at(-1)?.searchParams.get("companyId")).toBeNull();
    expect(router.state.location.search).toContain("companyId=none");
  });

  // Tablero Usuarios (base de la 12): una invitación vencida dice «Invitación vencida» y su fecha va en «Vence».
  it("tablero Usuarios: la invitación vencida dice su estado y la fecha va en «Vence»", async () => {
    const expired = { ...member, memberId: "member-3", userId: null, displayName: "", email: "valentina@example.com", state: "Expired" as const,
      roles: [], invitationId: "invitation-3", invitationIssuedAtUtc: "2026-09-22T12:00:00Z", invitationExpiresAtUtc: "2026-09-29T12:00:00Z" };
    server.use(
      http.get("/api/users/paged", () => HttpResponse.json({ items: [expired], page: 1, pageSize: 10, totalCount: 1, totalPages: 1, hasPrevious: false, hasNext: false })),
      http.get("/api/users/filter-counts", () => HttpResponse.json({ all: 1, active: 0, pendingDeletion: 0, invited: 0, expired: 1, inactive: 0 })),
      http.get("/api/companies/paged", () => HttpResponse.json({ items: [], page: 1, pageSize: 100, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false })),
    );
    renderRouteWithProviders("/org/usuarios", { as: "business-e6-admin" });

    const state = await screen.findByText("Invitación vencida");
    // La fecha va en «Vence», la columna que sigue a «Entrega» (Usuarios-Base2).
    expect(state.closest("tr")!.querySelectorAll("td")[6]).toHaveTextContent(/^29\/09\/2026$/);
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
    await user.click(await screen.findByRole("menuitem", { name: "Dar de baja" }));
    const disable = await screen.findByRole("dialog", { name: "¿Dar de baja a Lucía Fernández?" });
    expect(disable).toHaveTextContent("Deja de entrar a Empresa A y a sus empresas. Su cuenta y su perfil personal siguen funcionando.");
    await user.click(within(disable).getByRole("button", { name: "Dar de baja" }));
    expect(await screen.findByText("Dimos de baja a Lucía Fernández.")).toBeVisible();

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

  // CC25 (E11): una invitación por teléfono no trae correo; se nombra por el número invitado, en la fila y al revocarla.
  it("una invitación por teléfono se nombra por el número, en la fila y al revocarla", async () => {
    const user = userEvent.setup();
    const invited = { ...member, memberId: "member-4", userId: null, displayName: "", email: null, phone: "+5493515550200", state: "Invited" as const, roles: [], invitationId: "invitation-4" };
    server.use(
      http.get("/api/users/paged", () => HttpResponse.json({ items: [member, invited], page: 1, pageSize: 10, totalCount: 2, totalPages: 1, hasPrevious: false, hasNext: false })),
      http.get("/api/users/filter-counts", () => HttpResponse.json({ all: 2, active: 1, pendingDeletion: 0, invited: 1, expired: 0, inactive: 0 })),
      http.get("/api/companies/paged", () => HttpResponse.json({ items: [], page: 1, pageSize: 100, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false })),
      http.delete("/api/users/invitations/invitation-4", () => new HttpResponse(null, { status: 204 })),
    );
    renderRouteWithProviders("/org/usuarios", { as: "business-e6-admin" });
    expect(await screen.findByRole("link", { name: /555-0200/ })).toHaveAttribute("href", "/org/usuarios/member-4");
    const trigger = await screen.findByRole("button", { name: /^Acciones de .*555-0200$/ });
    trigger.focus();
    await user.keyboard("{Enter}");
    await user.click(await screen.findByRole("menuitem", { name: "Revocar invitación" }));
    const revoke = await screen.findByRole("dialog", { name: /^¿Revocar la invitación a .*555-0200\?$/ });
    await user.click(within(revoke).getByRole("button", { name: "Revocar" }));
    expect(await screen.findByText(/^Revocamos la invitación a .*555-0200\.$/)).toBeVisible();
  });

  // Tablero Usuarios-Base2 (0066 §4): «Entrega», después del estado, dice cómo salió cada invitación, con su porqué en la
  // (i) según el canal; la enviada va sin (i) y quien no tiene invitación pendiente, con la raya.
  it("tablero Usuarios-Base2: «Entrega» dice cómo salió cada invitación, con su porqué en la (i)", async () => {
    const invitation = { ...member, userId: null, roles: [], state: "Invited" as const, invitationIssuedAtUtc: "2026-09-25T12:00:00Z", invitationExpiresAtUtc: "2027-10-02T12:00:00Z" };
    server.use(
      http.get("/api/users/paged", () => HttpResponse.json({ items: [
        { ...member, invitationDelivery: null },
        { ...invitation, memberId: "member-2", displayName: "Sofía Herrera", email: "sofia@example.com", invitationId: "inv-2", invitationDelivery: "Uncertain" },
        { ...invitation, memberId: "member-3", displayName: "", email: null, phone: "+5493515550200", invitationId: "inv-3", invitationDelivery: "Failed" },
        { ...invitation, memberId: "member-4", displayName: "Ana Gómez", email: "ana@example.com", invitationId: "inv-4", invitationDelivery: "Sent" },
        { ...invitation, memberId: "member-5", displayName: "Beto Ruiz", email: "beto@example.com", invitationId: "inv-5", invitationDelivery: "Pending" },
      ], page: 1, pageSize: 10, totalCount: 5, totalPages: 1, hasPrevious: false, hasNext: false })),
      http.get("/api/users/filter-counts", () => HttpResponse.json({ all: 5, active: 1, pendingDeletion: 0, invited: 4, expired: 0, inactive: 0 })),
      http.get("/api/companies/paged", () => HttpResponse.json({ items: [], page: 1, pageSize: 100, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false })),
    );
    const { container } = renderRouteWithProviders("/org/usuarios", { as: "business-e6-admin" });

    const sofia = (await screen.findByRole("link", { name: "Sofía Herrera" })).closest("tr")!;
    const headers = screen.getAllByRole("columnheader").map((header) => header.textContent);
    expect(headers.indexOf("Entrega")).toBe(headers.indexOf("Estado") + 1);
    expect(within(sofia).getByText("Sin confirmar")).toBeVisible();
    expect(within(sofia).getByRole("button", { name: "Más información sobre Sin confirmar" }))
      .toHaveAccessibleDescription("No sabemos si llegó: el servidor de correo no confirmó el envío. Revisá con la persona antes de reenviarla.");
    const byPhone = screen.getByRole("link", { name: /555-0200/ }).closest("tr")!;
    expect(within(byPhone).getByRole("button", { name: "Más información sobre No se pudo enviar" }))
      .toHaveAccessibleDescription("WhatsApp no pudo entregarla a ese número.");
    const ana = screen.getByRole("link", { name: "Ana Gómez" }).closest("tr")!;
    expect(within(ana).getByText("Enviada")).toBeVisible();
    expect(within(ana).queryByRole("button", { name: /^Más información/ })).not.toBeInTheDocument();
    expect(within(screen.getByRole("link", { name: "Beto Ruiz" }).closest("tr")!).getByRole("button", { name: "Más información sobre Pendiente" }))
      .toHaveAccessibleDescription("Está en la cola: sale en unos minutos.");
    const lucia = screen.getByRole("link", { name: "Lucía Fernández" }).closest("tr")!;
    expect(within(lucia).getAllByRole("cell")[headers.indexOf("Entrega")]).toHaveTextContent("—");
    expect(await axe(container)).toHaveNoViolations();
  });

  // Tablero Usuarios-Base2, «Reenviar una invitación sin confirmar» (0066 §4): no sabemos si le llegó la anterior, así que
  // reenviar pide revisar con la persona antes; «Cancelar» no manda nada y la confirmación espera la respuesta.
  it("reenviar una invitación sin confirmar pide revisar con la persona antes", async () => {
    const user = userEvent.setup();
    const invitation = { ...member, userId: null, roles: [], state: "Invited" as const, invitationIssuedAtUtc: "2026-09-25T12:00:00Z", invitationExpiresAtUtc: "2027-10-02T12:00:00Z" };
    const sent: string[] = [];
    let release: (() => void) | undefined;
    server.use(
      http.get("/api/users/paged", () => HttpResponse.json({ items: [
        { ...invitation, memberId: "member-2", displayName: "Sofía Herrera", email: "sofia@example.com", invitationId: "inv-2", invitationDelivery: "Uncertain" },
        { ...invitation, memberId: "member-3", displayName: "", email: null, phone: "+5493515550200", invitationId: "inv-3", invitationDelivery: "Uncertain" },
      ], page: 1, pageSize: 10, totalCount: 2, totalPages: 1, hasPrevious: false, hasNext: false })),
      http.get("/api/users/filter-counts", () => HttpResponse.json({ all: 2, active: 0, pendingDeletion: 0, invited: 2, expired: 0, inactive: 0 })),
      http.get("/api/companies/paged", () => HttpResponse.json({ items: [], page: 1, pageSize: 100, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false })),
      http.post("/api/users/invitations/:invitationId/resend", async ({ params }) => {
        sent.push(String(params.invitationId));
        await new Promise<void>((resolve) => { release = resolve; });
        return HttpResponse.json("inv-new");
      }),
    );
    renderRouteWithProviders("/org/usuarios", { as: "business-e6-admin" });
    const resend = async (name: string | RegExp) => {
      const trigger = await screen.findByRole("button", { name }); trigger.focus(); await user.keyboard("{Enter}");
      await user.click(await screen.findByRole("menuitem", { name: "Reenviar invitación" }));
    };

    await resend(/^Acciones de .*555-0200$/);
    const byPhone = await screen.findByRole("dialog", { name: /^¿Reenviar la invitación a .*555-0200\?$/ });
    expect(byPhone).toHaveTextContent("No sabemos si le llegó la anterior: WhatsApp no confirmó el envío. Revisá con la persona antes de reenviarla, así no le llegan dos.");
    await user.click(within(byPhone).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(sent).toEqual([]);

    await resend("Acciones de Sofía Herrera");
    const dialog = await screen.findByRole("dialog", { name: "¿Reenviar la invitación a Sofía Herrera?" });
    expect(dialog).toHaveTextContent("No sabemos si le llegó la anterior: el servidor de correo no confirmó el envío. Revisá con Sofía Herrera antes de reenviarla, así no le llegan dos.");
    await user.click(within(dialog).getByRole("button", { name: "Reenviar" }));
    await waitFor(() => expect(sent).toEqual(["inv-2"]));
    expect(within(dialog).getByRole("button", { name: "Cancelar" })).toBeDisabled();
    release?.();
    expect(await screen.findByText("Reenviamos la invitación a sofia@example.com.")).toBeVisible();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  // Límite de 20 s: invita dos veces, escribe los correos con user-event y elige roles y empresa en tres desplegables; con toda la suite tarda unos 6,5 s.
  // R05 (datos-y-api): si la respuesta se pierde, repetir lo mismo conserva la clave y corregir un dato es otra operación
  // con otra clave; el aviso es el del intento que salió bien.
  it("invitar: respuesta perdida, reintento idéntico con la misma clave y corrección con otra", async () => {
    const sent: Array<{ key: string | null; email: unknown }> = [];
    server.use(
      http.get("/api/users/paged", () => HttpResponse.json({ items: [member], page: 1, pageSize: 10, totalCount: 1, totalPages: 1, hasPrevious: false, hasNext: false })),
      http.get("/api/users/filter-counts", () => HttpResponse.json({ all: 1, active: 1, pendingDeletion: 0, invited: 0, expired: 0, inactive: 0 })),
      http.get("/api/companies/paged", () => HttpResponse.json({ items: [], page: 1, pageSize: 100, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false })),
      http.post("/api/users/invitations", async ({ request }) => {
        const body = await request.json() as { email?: unknown };
        sent.push({ key: request.headers.get("Idempotency-Key"), email: body.email });
        return sent.length < 3 ? HttpResponse.error() : HttpResponse.json({ invitationId: "invitation-1", expiresAtUtc: "2026-10-10T15:00:00Z" }, { status: 201 });
      }),
    );
    const user = userEvent.setup();
    renderRouteWithProviders("/org/usuarios", { as: "business-e6-admin" });
    await user.click(await screen.findByRole("button", { name: "Invitar usuario" }));
    const dialog = await screen.findByRole("dialog", { name: "Invitar usuario" });
    const email = within(dialog).getByRole("textbox", { name: "Correo" });
    await user.type(email, "nueva@example.com");
    const invite = () => user.click(within(dialog).getByRole("button", { name: "Invitar" }));
    await invite();
    await waitFor(() => expect(sent).toHaveLength(1));
    await waitFor(() => expect(within(dialog).getByRole("button", { name: "Invitar" })).toBeEnabled());
    await invite();
    await waitFor(() => expect(sent).toHaveLength(2));
    await waitFor(() => expect(within(dialog).getByRole("button", { name: "Invitar" })).toBeEnabled());
    await user.clear(email);
    await user.type(email, "otra@example.com");
    await invite();

    expect(await screen.findByText("Invitamos a otra@example.com. La invitación vence el 10/10/2026.")).toBeVisible();
    expect(sent.map((call) => call.email)).toEqual(["nueva@example.com", "nueva@example.com", "otra@example.com"]);
    expect(sent[1].key).toBe(sent[0].key);
    expect(sent[2].key).not.toBe(sent[0].key);
  }, 10_000);

  // 269 y 0061 (Usuarios-Base2, «Invitar usuario: lo que no podés dar»): el rol que quien invita no puede dar va apagado con
  // su motivo, en lugar de esperar el 403; los demás se eligen.
  it("al invitar, un rol que quien invita no puede dar queda apagado con su motivo", async () => {
    const role = (id: string, name: string, grantable: boolean) => ({ id, name, description: null, isSystemRole: false, scope: "Organization" as const, companyId: null, grantable, userCount: 0, permissions: [], version: 1, createdAtUtc: "2026-09-27T12:00:00Z" });
    server.use(
      http.get("/api/users/paged", () => HttpResponse.json({ items: [member], page: 1, pageSize: 10, totalCount: 1, totalPages: 1, hasPrevious: false, hasNext: false })),
      http.get("/api/users/filter-counts", () => HttpResponse.json({ all: 1, active: 1, pendingDeletion: 0, invited: 0, expired: 0, inactive: 0 })),
      http.get("/api/roles/paged", () => HttpResponse.json({ items: [role("role-owner", "Dueño", false), role("role-sales", "Ventas", true)], page: 1, pageSize: 100, totalCount: 2, totalPages: 1, hasPrevious: false, hasNext: false })),
      http.get("/api/companies/paged", () => HttpResponse.json({ items: [], page: 1, pageSize: 100, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false })),
    );
    const user = userEvent.setup();
    renderRouteWithProviders("/org/usuarios", { as: "business-e6-admin" });
    await user.click(await screen.findByRole("button", { name: "Invitar usuario" }));
    const dialog = await screen.findByRole("dialog", { name: "Invitar usuario" });

    within(dialog).getByRole("button", { name: "Roles de la organización" }).focus();
    await user.keyboard("{Enter}");
    const owner = await screen.findByRole("menuitemcheckbox", { name: "Dueño" });
    expect(owner).toHaveAttribute("aria-disabled", "true");
    expect(owner).toHaveAccessibleDescription("Tiene permisos que no tenés.");
    await user.click(owner);
    expect(owner).toHaveAttribute("aria-checked", "false");
    await user.click(screen.getByRole("menuitemcheckbox", { name: "Ventas" }));
    expect(screen.getByRole("menuitemcheckbox", { name: "Ventas" })).toHaveAttribute("aria-checked", "true");
  });

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
    expect(within(dialog).queryByRole("button", { name: /Agregar empresa/ })).not.toBeInTheDocument();
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

  // R04 (datos-y-api): cada invitación reenvía con su propia clave. Si el reenvío de A se corta, reenviar B no usa la clave
  // de A (el servidor la rechazaría con 422) y reintentar A después vuelve a mandar la de A.
  it("reenviar A y B, y reintentar A después de B: cada una con su clave y sin 422", async () => {
    const user = userEvent.setup();
    const invitation = { ...member, userId: null, roles: [], state: "Invited" as const, invitationIssuedAtUtc: "2026-09-25T12:00:00Z", invitationExpiresAtUtc: "2027-10-02T12:00:00Z" };
    const owners = new Map<string, string>(); const sent: { invitationId: string; key: string }[] = [];
    server.use(
      http.get("/api/users/paged", () => HttpResponse.json({ items: [
        { ...invitation, memberId: "member-a", displayName: "Ana Gómez", email: "ana@example.com", invitationId: "inv-a" },
        { ...invitation, memberId: "member-b", displayName: "Beto Ruiz", email: "beto@example.com", invitationId: "inv-b" },
      ], page: 1, pageSize: 10, totalCount: 2, totalPages: 1, hasPrevious: false, hasNext: false })),
      http.get("/api/users/filter-counts", () => HttpResponse.json({ all: 2, active: 0, pendingDeletion: 0, invited: 2, expired: 0, inactive: 0 })),
      http.get("/api/companies/paged", () => HttpResponse.json({ items: [], page: 1, pageSize: 100, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false })),
      http.post("/api/users/invitations/:invitationId/resend", ({ params, request }) => {
        const invitationId = String(params.invitationId); const key = request.headers.get("Idempotency-Key") ?? "";
        sent.push({ invitationId, key });
        if (owners.has(key) && owners.get(key) !== invitationId) return HttpResponse.json({ code: "Request.IdempotencyKeyReused" }, { status: 422 });
        owners.set(key, invitationId);
        return sent.length === 1 ? HttpResponse.error() : HttpResponse.json("inv-new");
      }),
    );
    renderRouteWithProviders("/org/usuarios", { as: "business-e6-admin" });
    const resend = async (name: string) => {
      const trigger = await screen.findByRole("button", { name: `Acciones de ${name}` }); trigger.focus(); await user.keyboard("{Enter}");
      await user.click(await screen.findByRole("menuitem", { name: "Reenviar invitación" }));
    };

    await resend("Ana Gómez");
    await waitFor(() => expect(sent).toHaveLength(1));
    await resend("Beto Ruiz");
    expect(await screen.findByText("Reenviamos la invitación a beto@example.com.")).toBeVisible();
    await resend("Ana Gómez");
    expect(await screen.findByText("Reenviamos la invitación a ana@example.com.")).toBeVisible();
    expect(sent.map((call) => call.invitationId)).toEqual(["inv-a", "inv-b", "inv-a"]);
    expect(sent[2].key).toBe(sent[0].key);
    expect(sent[1].key).not.toBe(sent[0].key);
  });

  // P2 (E9, tableros Usuarios y M-Usuarios «Demasiados pedidos»): una lectura que choca con un límite muestra el estado de
  // error de la lista y «Reintentar» cuenta; no se vuelve a pedir sola.
  it("la lista que no carga por un límite dice por qué y «Reintentar» espera la cuenta", async () => {
    const user = userEvent.setup();
    let reads = 0;
    server.use(
      http.get("/api/users/paged", () => { reads++; return reads === 1 ? HttpResponse.json({ code: "Security.RateLimit.Exceeded", detail: "texto del back", retryAfter: 1 }, { status: 429, headers: { "Retry-After": "1" } }) : HttpResponse.json({ items: [member], page: 1, pageSize: 10, totalCount: 1, totalPages: 1, hasPrevious: false, hasNext: false }); }),
      http.get("/api/users/filter-counts", () => HttpResponse.json({ all: 1, active: 1, pendingDeletion: 0, invited: 0, expired: 0, inactive: 0 })),
      http.get("/api/companies/paged", () => HttpResponse.json({ items: [], page: 1, pageSize: 100, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false })),
    );
    renderRouteWithProviders("/org/usuarios", { as: "business-e6-admin" });
    expect(await screen.findByText("No pudimos cargar los usuarios.")).toBeVisible();
    expect(screen.getByText("Hiciste muchos pedidos seguidos. Esperá un momento.")).toBeVisible();
    expect(await screen.findByRole("button", { name: "Reintentá en 0:01" })).toBeDisabled();
    await new Promise((resolve) => setTimeout(resolve, 1500));
    expect(reads).toBe(1);
    const retry = await screen.findByRole("button", { name: "Reintentar" }, { timeout: 3000 });
    await user.click(retry);
    expect(await screen.findByText("Lucía Fernández")).toBeVisible();
    expect(reads).toBe(2);
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
