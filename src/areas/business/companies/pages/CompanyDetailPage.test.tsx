import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
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
  id: "role-company-admin", name: "Administrador", description: "Administra la empresa: sus miembros y sus roles.", scope: "AnyCompany" as const,
  companyId: null, isSystemRole: true, userCount: 1, permissions: ["company.members.read", "company.members.manage"],
  version: 1, createdAtUtc: "2026-09-27T12:00:00Z",
};

// La ruta carga la pantalla con lazyPage: se importa antes de las pruebas para que la primera no pague, dentro de su
// límite, la carga del módulo, que con la máquina cargada la pasaba de 5 s.
beforeAll(async () => { await import("./CompanyDetailPage"); });

beforeEach(async () => {
  await configureI18n(referenceDataFixture().cultures);
  await changeCulture("es-AR");
});

const ownRole = {
  ...companyAdmin, id: "role-reader", name: "Solo lectura", scope: "SpecificCompany" as const, companyId: "company-1",
  isSystemRole: false, userCount: 4, permissions: ["company.members.read"],
};

function detailApi(members: unknown[]) {
  server.use(
    http.get("/api/companies/company-1", () => HttpResponse.json(company)),
    http.get("/api/companies/company-1/members/paged", () => HttpResponse.json({ items: members, page: 1, pageSize: 10, totalCount: members.length, totalPages: 1, hasPrevious: false, hasNext: false })),
    http.get("/api/companies/company-1/members/filter-counts", () => HttpResponse.json({ all: members.length, active: 1, pendingDeletion: 1, inactive: 1, invited: 0 })),
    http.get("/api/companies/company-1/roles/paged", () => HttpResponse.json({ items: [companyAdmin, ownRole], page: 1, pageSize: 100, totalCount: 2, totalPages: 1, hasPrevious: false, hasNext: false })),
  );
}

// La ficha con Lucía y el rol Administrador; `put` responde el guardado de sus roles. Cuenta las lecturas de la ficha.
function rolesApi(put: () => Response) {
  const reads = { company: 0, members: 0 };
  server.use(
    http.get("/api/companies/company-1", () => { reads.company += 1; return HttpResponse.json(company); }),
    http.get("/api/companies/company-1/members/paged", () => { reads.members += 1; return HttpResponse.json({ items: [member], page: 1, pageSize: 10, totalCount: 1, totalPages: 1, hasPrevious: false, hasNext: false }); }),
    http.get("/api/companies/company-1/members/filter-counts", () => HttpResponse.json({ all: 1, active: 1, pendingDeletion: 0, inactive: 0, invited: 0 })),
    http.get("/api/companies/company-1/roles/paged", () => HttpResponse.json({ items: [companyAdmin], page: 1, pageSize: 100, totalCount: 1, totalPages: 1, hasPrevious: false, hasNext: false })),
    http.put("/api/companies/company-1/members/member-1/roles", put),
  );
  return reads;
}

async function openRolesDialog(user: ReturnType<typeof userEvent.setup>) {
  expect(await screen.findByText("Lucía Fernández")).toBeVisible();
  (await screen.findByRole("button", { name: "Acciones para Lucía Fernández" })).focus();
  await user.keyboard("{Enter}");
  await user.click(await screen.findByRole("menuitem", { name: "Cambiar roles" }));
  const dialog = await screen.findByRole("dialog", { name: "Roles de Lucía Fernández" });
  await user.click(within(dialog).getByRole("button", { name: "Roles en la empresa" }));
  // Tablero Empresa: cada rol del desplegable, con su descripción debajo.
  expect(await screen.findByRole("menuitemcheckbox", { name: "Administrador" })).toHaveAccessibleDescription("Administra la empresa: sus miembros y sus roles.");
  await user.click(screen.getByRole("menuitemcheckbox", { name: "Administrador" }));
  await user.keyboard("{Escape}");
  return dialog;
}

// «Criterio · Diálogos»: la franja va después del último campo y antes de «Cancelar».
function expectAboveButtons(dialog: HTMLElement, alert: HTMLElement, lastField: string) {
  const following = (from: Node, to: Node) => Boolean(from.compareDocumentPosition(to) & Node.DOCUMENT_POSITION_FOLLOWING);
  expect(following(within(dialog).getByRole("button", { name: lastField }), alert)).toBe(true);
  expect(following(alert, within(dialog).getByRole("button", { name: "Cancelar" }))).toBe(true);
}

describe("CompanyDetailPage", () => {
  it("tablero Empresa: banda, columnas, filtros y la pestaña Roles con los roles propios de la empresa", async () => {
    const user = userEvent.setup();
    detailApi([member]);
    const { container } = renderRouteWithProviders("/org/empresas/company-1", { as: "business-e6-admin" });

    const edit = await screen.findByRole("button", { name: "Editar empresa" });
    expect(edit.querySelector("svg")).toBeNull();
    expect(screen.getByRole("button", { name: "Agregar miembro" })).toBeVisible();
    for (const name of ["Miembro", "Roles en la empresa", "Estado"]) expect(await screen.findByRole("columnheader", { name })).toBeVisible();
    // «Criterio · Tablas» (lienzo v92): el correo va en la segunda línea gris, debajo del nombre.
    expect(screen.getByText("lucia@example.com")).toHaveAttribute("data-slot", "cell-detail");
    expect(screen.getByRole("button", { name: "Rol: todos" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Estado: todos" })).toBeVisible();
    expect(await axe(container)).toHaveNoViolations();

    await user.click(screen.getByRole("tab", { name: /Roles/ }));
    expect(await screen.findByRole("link", { name: "Crear rol" })).toHaveAttribute("href", "/org/roles/nuevo?scope=SpecificCompany&companyId=company-1");
    expect(screen.queryByRole("button", { name: "Agregar miembro" })).not.toBeInTheDocument();
    const roles = screen.getByRole("tabpanel");
    for (const name of ["Rol", "Usuarios", "Permisos"]) expect(within(roles).getByRole("columnheader", { name })).toBeVisible();
    expect(within(roles).queryByRole("columnheader", { name: "Vale en" })).not.toBeInTheDocument();
    expect(within(roles).getByRole("link", { name: "Solo lectura" })).toBeVisible();
    expect(within(roles).queryByText("Administrador")).not.toBeInTheDocument();
    // Tablero Empresa, pestaña Roles: el mismo pie que Miembros; con un solo rol, «1 de 1».
    expect(within(roles).getByText("1 de 1")).toBeVisible();
    expect(within(roles).getByText("Página 1 de 1")).toBeVisible();
    expect(within(roles).getByRole("combobox", { name: /por página/ })).toBeVisible();
    expect(await axe(container)).toHaveNoViolations();
  });

  // Tablero Empresa (v100) y «Criterio · Diálogos»: «Roles de …» y «Agregar miembro» van en el diálogo chico, sin bajada
  // debajo del título, y el campo de roles vacío dice «Sin roles»; «Editar empresa», en el normal.
  it("los diálogos de la ficha con el ancho, el encabezado y el campo vacío del tablero", async () => {
    const user = userEvent.setup();
    rolesApi(() => new HttpResponse(null, { status: 204 }));
    server.use(http.get("/api/users/paged", () => HttpResponse.json({ items: [], page: 1, pageSize: 100, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false })));
    renderRouteWithProviders("/org/empresas/company-1", { as: "business-e6-admin" });

    expect(await screen.findByText("Lucía Fernández")).toBeVisible();
    (await screen.findByRole("button", { name: "Acciones para Lucía Fernández" })).focus();
    await user.keyboard("{Enter}");
    await user.click(await screen.findByRole("menuitem", { name: "Cambiar roles" }));
    const roles = await screen.findByRole("dialog", { name: "Roles de Lucía Fernández" });
    expect(roles).toHaveClass("md:max-w-[420px]");
    expect(within(roles).queryByText("Delta S.A.")).not.toBeInTheDocument();
    expect(within(roles).getByRole("button", { name: "Roles en la empresa" })).toHaveTextContent("Sin roles");
    await user.click(within(roles).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Agregar miembro" }));
    const add = await screen.findByRole("dialog", { name: "Agregar miembro" });
    expect(add).toHaveClass("md:max-w-[420px]");
    expect(within(add).queryByText("Delta S.A.")).not.toBeInTheDocument();
    expect(within(add).getByRole("button", { name: "Roles en la empresa" })).toHaveTextContent("Sin roles");
    await user.click(within(add).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Editar empresa" }));
    expect(await screen.findByRole("dialog", { name: "Editar empresa" })).toHaveClass("md:max-w-[560px]");
  });

  // Tablero M-Empresa (v106): en el teléfono, «Roles de …», «Agregar miembro» y «Editar empresa» son hojas que suben
  // desde abajo con su alto, no a pantalla completa, con el cuerpo común de los diálogos.
  it("los diálogos de la ficha usan el cuerpo de los diálogos y en el teléfono suben desde abajo con su alto", async () => {
    const user = userEvent.setup();
    rolesApi(() => new HttpResponse(null, { status: 204 }));
    server.use(http.get("/api/users/paged", () => HttpResponse.json({ items: [], page: 1, pageSize: 100, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false })));
    renderRouteWithProviders("/org/empresas/company-1", { as: "business-e6-admin" });

    expect(await screen.findByText("Lucía Fernández")).toBeVisible();
    (await screen.findByRole("button", { name: "Acciones para Lucía Fernández" })).focus();
    await user.keyboard("{Enter}");
    await user.click(await screen.findByRole("menuitem", { name: "Cambiar roles" }));
    const roles = await screen.findByRole("dialog", { name: "Roles de Lucía Fernández" });
    expect(roles).toHaveClass("bottom-0", "rounded-t-[20px]");
    expect(roles).not.toHaveClass("min-h-[calc(100dvh-1rem)]");
    expect(within(roles).getByRole("button", { name: "Roles en la empresa" }).closest("[data-slot='dialog-body']")).not.toBeNull();
    await user.click(within(roles).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Agregar miembro" }));
    const add = await screen.findByRole("dialog", { name: "Agregar miembro" });
    expect(add).not.toHaveClass("min-h-[calc(100dvh-1rem)]");
    expect(within(add).getByRole("combobox", { name: "Usuario" }).closest("[data-slot='dialog-body']")).not.toBeNull();
    await user.click(within(add).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Editar empresa" }));
    const edit = await screen.findByRole("dialog", { name: "Editar empresa" });
    expect(edit).not.toHaveClass("min-h-[calc(100dvh-1rem)]");
    expect(within(edit).getByRole("textbox", { name: "Nombre" }).closest("[data-slot='dialog-body']")).not.toBeNull();
  });

  // B3: la tabla de miembros tiene las cuatro columnas del tablero Empresa, en su orden; las acciones, sin rótulo visible.
  it("los miembros van con Miembro, Roles en la empresa, Estado y Acciones, como el tablero", async () => {
    detailApi([member]);
    renderRouteWithProviders("/org/empresas/company-1", { as: "business-e6-admin" });

    const members = await screen.findByRole("tabpanel");
    await within(members).findByText("Lucía Fernández");
    expect(within(members).getAllByRole("columnheader").map((header) => header.textContent))
      .toEqual(["Miembro", "Roles en la empresa", "Estado", "Acciones"]);
  });

  // F1: el 403 bloquea la vista solo si viene de la consulta principal; el de los roles (una consulta secundaria)
  // deja la ficha y sus miembros a la vista.
  it("un 403 en una consulta secundaria no reemplaza la pantalla", async () => {
    detailApi([member]);
    server.use(http.get("/api/companies/company-1/roles/paged", () => HttpResponse.json({ code: "Authorization.Forbidden", detail: "No tenés permiso." }, { status: 403 })));
    renderRouteWithProviders("/org/empresas/company-1", { as: "business-e6-admin" });

    expect(await screen.findByRole("heading", { level: 1, name: "Delta S.A." })).toBeVisible();
    expect(await screen.findByText("Lucía Fernández")).toBeVisible();
    await waitFor(() => expect(screen.queryByRole("heading", { name: "No tenés permiso para ver esta página" })).not.toBeInTheDocument());
  });

  it("un 403 en la ficha muestra la pantalla sin permiso", async () => {
    server.use(http.get("/api/companies/company-1", () => HttpResponse.json({ code: "Authorization.Forbidden", detail: "No tenés permiso." }, { status: 403 })));
    renderRouteWithProviders("/org/empresas/company-1", { as: "business-e6-admin" });

    expect(await screen.findByRole("heading", { name: "No tenés permiso para ver esta página" })).toBeVisible();
  });

  // «Criterio · Botones»: «Guardar cambios» de «Editar empresa» no se apaga con el CUIT mal; no manda nada y el campo dice
  // qué corregir.
  it("con el CUIT mal, «Guardar cambios» de «Editar empresa» sigue activo y no manda nada", async () => {
    let puts = 0;
    detailApi([member]);
    server.use(http.put("/api/companies/company-1", () => { puts += 1; return new HttpResponse(null, { status: 204 }); }));
    const user = userEvent.setup();
    renderRouteWithProviders("/org/empresas/company-1", { as: "business-e6-admin" });
    await user.click(await screen.findByRole("button", { name: "Editar empresa" }));
    const dialog = await screen.findByRole("dialog", { name: "Editar empresa" });
    await user.click(within(dialog).getByRole("textbox", { name: "CUIT" }));
    await user.paste("307");
    // «Criterio · Formularios»: se revisa al tocar Guardar, no mientras se escribe.
    expect(within(dialog).queryByText("Revisá el CUIT: son 11 números.")).not.toBeInTheDocument();

    const save = within(dialog).getByRole("button", { name: "Guardar cambios" });
    expect(save).toBeEnabled();
    await user.click(save);
    expect(within(dialog).getByRole("textbox", { name: "CUIT" })).toHaveAccessibleDescription("Revisá el CUIT: son 11 números.");
    expect(puts).toBe(0);

    // Sin nombre: el campo dice qué falta, con el mensaje propio y no el del navegador.
    const name = within(dialog).getByRole("textbox", { name: "Nombre" });
    await user.clear(name);
    await user.click(save);
    expect(name).toHaveAccessibleDescription("Escribí el nombre de la empresa.");
    expect(puts).toBe(0);
  });

  // errores.md: un 404 en una ficha (también un id de otra organización) es «No encontramos esta página», como Error-Org.
  it("si la empresa no existe, dice que no encontramos la página y lleva al inicio", async () => {
    detailApi([member]);
    server.use(http.get("/api/companies/company-1", () => HttpResponse.json(
      { status: 404, code: "Tenancy.Company.NotFound", title: "No encontrado", detail: "No encontramos esa empresa." }, { status: 404 })));
    renderRouteWithProviders("/org/empresas/company-1", { as: "business-e6-admin" });

    expect(await screen.findByRole("heading", { name: "No encontramos esta página" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Ir al inicio" })).toHaveAttribute("href", "/org");
    expect(screen.queryByRole("button", { name: "Reintentar" })).not.toBeInTheDocument();
  });

  // «Criterio · Avisos» (Pantalla de error): si la ficha no carga, no se puede mostrar nada; «Reintentar» la vuelve a pedir.
  it("si la ficha no carga, dice que no se pudo abrir y «Reintentar» la vuelve a pedir", async () => {
    const user = userEvent.setup();
    detailApi([member]);
    let fail = true;
    server.use(http.get("/api/companies/company-1", () => fail
      ? HttpResponse.json({ status: 500, title: "Error", traceId: "00-abc-01" }, { status: 500 })
      : HttpResponse.json(company)));
    renderRouteWithProviders("/org/empresas/company-1", { as: "business-e6-admin" });

    expect(await screen.findByRole("heading", { name: "No pudimos abrir esta pantalla" })).toBeVisible();
    fail = false;
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Delta S.A." })).toBeVisible();
  });

  it("las migas siguen el camino hasta la empresa", async () => {
    detailApi([member]);
    renderRouteWithProviders("/org/empresas/company-1", { as: "business-e6-admin" });

    await waitFor(() => expect(screen.getByRole("navigation", { name: "Migas de pan" })).toHaveTextContent(/^Inicio\/Empresas\/Delta S\.A\.$/));
  });

  it("quitar pide confirmación (también con la baja pedida); volver a sumar es directo", async () => {
    const user = userEvent.setup();
    const pending = { ...member, memberId: "member-2", displayName: "Diego Ríos", email: "diego@example.com", state: "PendingDeletion" as const };
    const inactive = { ...member, memberId: "member-3", displayName: "Marcos Giménez", email: "marcos@example.com", membershipStatus: "Inactive" as const };
    const statusBodies: unknown[] = [];
    detailApi([member, pending, inactive]);
    server.use(http.put("/api/companies/company-1/members/:memberId/status", async ({ request }) => { statusBodies.push(await request.json()); return new HttpResponse(null, { status: 204 }); }));
    renderRouteWithProviders("/org/empresas/company-1", { as: "business-e6-admin" });
    const open = async (name: string) => { const trigger = await screen.findByRole("button", { name }); trigger.focus(); await user.keyboard("{Enter}"); };

    await open("Acciones para Diego Ríos");
    expect(await screen.findByRole("menuitem", { name: "Quitar de la empresa" })).toBeVisible();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());

    await open("Acciones para Lucía Fernández");
    await user.click(await screen.findByRole("menuitem", { name: "Quitar de la empresa" }));
    const confirm = await screen.findByRole("dialog", { name: "¿Quitar a Lucía Fernández de la empresa?" });
    expect(confirm).toHaveTextContent("Deja de entrar a Delta S.A. y pierde sus roles acá. Sigue en la organización y en sus otras empresas.");
    await user.click(within(confirm).getByRole("button", { name: "Quitar" }));
    expect(await screen.findByText("Quitamos a Lucía Fernández de la empresa.")).toBeVisible();

    await open("Acciones para Marcos Giménez");
    await user.click(await screen.findByRole("menuitem", { name: "Volver a sumar" }));
    expect(await screen.findByText("Volvimos a sumar a Marcos Giménez. Dale los roles de nuevo.")).toBeVisible();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(statusBodies).toEqual([{ status: "Inactive", version: 8 }, { status: "Active", version: 8 }]);
  });

  it("la banda dice el estado primero, el CUIT con su máscara y la zona por su nombre", async () => {
    server.use(
      http.get("/api/companies/company-1", () => HttpResponse.json({ ...company, taxId: { country: "AR", type: "AR-CUIT", number: "30712345671" } })),
      http.get("/api/companies/company-1/members/paged", () => HttpResponse.json({ items: [member], page: 1, pageSize: 10, totalCount: 1, totalPages: 1, hasPrevious: false, hasNext: false })),
      http.get("/api/companies/company-1/members/filter-counts", () => HttpResponse.json({ all: 1, active: 1, pendingDeletion: 0, inactive: 0, invited: 0 })),
      http.get("/api/companies/company-1/roles/paged", () => HttpResponse.json({ items: [companyAdmin], page: 1, pageSize: 100, totalCount: 1, totalPages: 1, hasPrevious: false, hasNext: false })),
    );
    renderRouteWithProviders("/org/empresas/company-1", { as: "business-e6-admin" });

    const heading = await screen.findByRole("heading", { level: 1, name: "Delta S.A." });
    const subline = heading.parentElement!.querySelector("[data-slot='page-subline']")!;
    // Tablero Empresa: «● Activa · CUIT 30-71234567-1 · Buenos Aires (GMT−3)».
    await waitFor(() => expect(subline).toHaveTextContent(/^Activa · CUIT 30-71234567-1 · Buenos Aires \(GMT−3\)$/));
    expect(subline.querySelector("[aria-hidden='true'].rounded-full")).toHaveClass("bg-[var(--punto-ok)]");
    expect(subline).not.toHaveTextContent("AR-CUIT");
    expect(subline).not.toHaveTextContent("America/Argentina");
  });

  it("guarda roles de empresa con la versión actual de la membresía", async () => {
    let requestBody: unknown;
    server.use(
      http.get("/api/companies/company-1", () => HttpResponse.json(company)),
      http.get("/api/companies/company-1/members/paged", () => HttpResponse.json({ items: [member], page: 1, pageSize: 10, totalCount: 1, totalPages: 1, hasPrevious: false, hasNext: false })),
      http.get("/api/companies/company-1/members/filter-counts", () => HttpResponse.json({ all: 1, active: 1, pendingDeletion: 0, inactive: 0, invited: 0 })),
      http.get("/api/companies/company-1/roles/paged", () => HttpResponse.json({ items: [companyAdmin], page: 1, pageSize: 100, totalCount: 1, totalPages: 1, hasPrevious: false, hasNext: false })),
      http.put("/api/companies/company-1/members/member-1/roles", async ({ request }) => {
        requestBody = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const user = userEvent.setup();
    renderRouteWithProviders("/org/empresas/company-1", { as: "business-e6-admin" });
    expect(await screen.findByRole("heading", { level: 1, name: "Delta S.A." })).toBeVisible();
    expect(await screen.findByText("Lucía Fernández")).toBeVisible();
    (await screen.findByRole("button", { name: "Acciones para Lucía Fernández" })).focus();
    await user.keyboard("{Enter}");
    await user.click(await screen.findByRole("menuitem", { name: "Cambiar roles" }));
    await user.click(screen.getByRole("button", { name: "Roles en la empresa" }));
    await user.click(await screen.findByRole("menuitemcheckbox", { name: "Administrador" }));
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => expect(requestBody).toEqual({ roleIds: ["role-company-admin"], version: 8 }));
  });

  // «Criterio · Diálogos» y lienzo v97 (diálogo de roles): el error general del diálogo, también el 409, va en su franja
  // arriba de los botones, una sola vez; la ficha no muestra además el cartel del 409.
  it("un 409 en el diálogo de roles sale una sola vez, en la franja del diálogo arriba de los botones", async () => {
    const user = userEvent.setup();
    rolesApi(() => HttpResponse.json({ status: 409, code: "General.ConcurrencyConflict", title: "Conflicto",
      detail: "Otra persona cambió esto. Revisá la versión más reciente antes de guardar." }, { status: 409 }));
    renderRouteWithProviders("/org/empresas/company-1", { as: "business-e6-admin" });
    const dialog = await openRolesDialog(user);
    await user.click(within(dialog).getByRole("button", { name: "Guardar cambios" }));

    const alert = await within(dialog).findByRole("alert");
    expect(alert).toHaveTextContent("Otra persona cambió esto. Revisá la versión más reciente antes de guardar.");
    expectAboveButtons(dialog, alert, "Roles en la empresa");
    expect(screen.getAllByRole("alert", { hidden: true })).toHaveLength(1);
    expect(screen.queryByText("Otra persona cambió esto mientras lo editabas.")).not.toBeInTheDocument();
  });

  // Tablero Empresa (v97): «Tiene que quedar al menos un administrador en la empresa.» en la franja con su ícono, no en
  // dos lugares. Es el texto que manda el back (95d853f): la app no tiene uno propio.
  it("la regla del último administrador va en una sola franja, arriba de los botones", async () => {
    const user = userEvent.setup();
    rolesApi(() => HttpResponse.json({ status: 409, code: "Companies.Membership.LastCompanyAdmin", title: "Conflicto",
      detail: "Tiene que quedar al menos un administrador en la empresa." }, { status: 409 }));
    renderRouteWithProviders("/org/empresas/company-1", { as: "business-e6-admin" });
    const dialog = await openRolesDialog(user);
    await user.click(within(dialog).getByRole("button", { name: "Guardar cambios" }));

    const alert = await within(dialog).findByRole("alert");
    expect(alert).toHaveTextContent("Tiene que quedar al menos un administrador en la empresa.");
    expect(alert.querySelector("svg")).not.toBeNull();
    expectAboveButtons(dialog, alert, "Roles en la empresa");
    expect(screen.getAllByRole("alert", { hidden: true })).toHaveLength(1);
  });

  // Después de un 409 en un diálogo, la ficha quedó vieja: al cerrarlo (Cancelar, ✕ o Escape) se vuelve a leer. La ficha
  // de Empresa no tiene cambios sin guardar propios: siempre se relee.
  it("al cerrar el diálogo después de un 409, la ficha se vuelve a leer", async () => {
    const user = userEvent.setup();
    const reads = rolesApi(() => HttpResponse.json({ status: 409, code: "General.ConcurrencyConflict", title: "Conflicto",
      detail: "Otra persona cambió esto. Revisá la versión más reciente antes de guardar." }, { status: 409 }));
    renderRouteWithProviders("/org/empresas/company-1", { as: "business-e6-admin" });
    const dialog = await openRolesDialog(user);
    await user.click(within(dialog).getByRole("button", { name: "Guardar cambios" }));
    await within(dialog).findByRole("alert");
    const before = { ...reads };

    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(reads.company).toBeGreaterThan(before.company));
    await waitFor(() => expect(reads.members).toBeGreaterThan(before.members));
    expect(screen.queryAllByRole("alert", { hidden: true })).toHaveLength(0);
  });

  // «Criterio · Botones» y tablero Empresa (v104): «Agregar miembro» nunca se apaga; sin usuario, el campo queda en rojo
  // con «Elegí un usuario.» y se limpia al elegir uno. Vacío, el campo dice «Elegí un usuario de la organización».
  it("«Agregar miembro» sin usuario marca el campo con «Elegí un usuario.» y se limpia al elegir uno", async () => {
    let posts = 0;
    server.use(
      http.get("/api/companies/company-1", () => HttpResponse.json(company)),
      http.get("/api/companies/company-1/members/paged", () => HttpResponse.json({ items: [], page: 1, pageSize: 10, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false })),
      http.get("/api/companies/company-1/members/filter-counts", () => HttpResponse.json({ all: 0, active: 0, pendingDeletion: 0, inactive: 0, invited: 0 })),
      http.get("/api/companies/company-1/roles/paged", () => HttpResponse.json({ items: [companyAdmin], page: 1, pageSize: 100, totalCount: 1, totalPages: 1, hasPrevious: false, hasNext: false })),
      http.get("/api/users/paged", () => HttpResponse.json({ items: [{
        memberId: "member-2", userId: "user-2", displayName: "Tomás Acosta", email: "tomas@example.com", state: "Active",
        hasManagedEmail: false, roles: [], companies: [], invitationId: null, invitationIssuedAtUtc: null, invitationExpiresAtUtc: null,
        version: 1, createdAtUtc: "2026-09-27T12:00:00Z",
      }], page: 1, pageSize: 100, totalCount: 1, totalPages: 1, hasPrevious: false, hasNext: false })),
      http.post("/api/companies/company-1/members", () => { posts += 1; return new HttpResponse(null, { status: 204 }); }),
    );

    const user = userEvent.setup();
    renderRouteWithProviders("/org/empresas/company-1", { as: "business-e6-admin" });
    await user.click(await screen.findByRole("button", { name: "Agregar miembro" }));
    const dialog = await screen.findByRole("dialog", { name: "Agregar miembro" });
    const member = within(dialog).getByRole("combobox", { name: "Usuario" });
    await waitFor(() => expect(member).toHaveTextContent("Elegí un usuario de la organización"));
    const add = within(dialog).getByRole("button", { name: "Agregar miembro" });
    expect(add).toBeEnabled();
    await user.click(add);

    expect(member).toHaveAttribute("aria-invalid", "true");
    expect(member).toHaveAccessibleDescription("Elegí un usuario.");
    expect(posts).toBe(0);

    await user.click(member);
    await user.click(await screen.findByRole("option", { name: /Tomás Acosta/ }));
    expect(within(dialog).queryByText("Elegí un usuario.")).not.toBeInTheDocument();
    expect(member).not.toHaveAttribute("aria-invalid");
  });

  it("agrega una persona existente con encabezado idempotente", async () => {
    let requestBody: unknown;
    let idempotencyKey: string | null = null;
    server.use(
      http.get("/api/companies/company-1", () => HttpResponse.json(company)),
      http.get("/api/companies/company-1/members/paged", () => HttpResponse.json({ items: [], page: 1, pageSize: 10, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false })),
      http.get("/api/companies/company-1/members/filter-counts", () => HttpResponse.json({ all: 0, active: 0, pendingDeletion: 0, inactive: 0, invited: 0 })),
      http.get("/api/companies/company-1/roles/paged", () => HttpResponse.json({ items: [companyAdmin], page: 1, pageSize: 100, totalCount: 1, totalPages: 1, hasPrevious: false, hasNext: false })),
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
  });
});
