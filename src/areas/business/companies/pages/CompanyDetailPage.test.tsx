import { act, screen, waitFor, within } from "@testing-library/react";
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
    rolesApi(() => HttpResponse.json({ version: 9 }));
    server.use(http.get("/api/companies/company-1/candidates/paged", () => HttpResponse.json({ items: [], page: 1, pageSize: 100, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false })));
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
    rolesApi(() => HttpResponse.json({ version: 9 }));
    server.use(http.get("/api/companies/company-1/candidates/paged", () => HttpResponse.json({ items: [], page: 1, pageSize: 100, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false })));
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

  // Bloque 6 (estados): cada estado de un miembro con el color del lienzo (tablero Empresa): activo en verde, la baja
  // pedida en ámbar y quitado de la empresa en gris; la invitación pendiente, en petróleo como en Usuarios.
  it("el estado de cada miembro va con el punto del color del lienzo", async () => {
    const pending = { ...member, memberId: "member-2", displayName: "Diego Ríos", state: "PendingDeletion" as const };
    const removed = { ...member, memberId: "member-3", displayName: "Marcos Giménez", membershipStatus: "Inactive" as const };
    const invited = { ...member, memberId: "member-4", displayName: "Paula Méndez", state: "Invited" as const };
    detailApi([member, pending, removed, invited]);
    renderRouteWithProviders("/org/empresas/company-1", { as: "business-e6-admin" });

    const members = await screen.findByRole("tabpanel");
    const dot = async (name: string, state: string) => {
      const row = (await within(members).findByText(name)).closest("tr")!;
      return within(row).getByText(state).parentElement!.querySelector("[data-slot='status-dot']");
    };
    expect(await dot("Lucía Fernández", "Activo")).toHaveClass("bg-[var(--punto-ok)]");
    expect(await dot("Diego Ríos", "Baja pedida")).toHaveClass("bg-[var(--punto-alerta)]");
    expect(await dot("Marcos Giménez", "Inactivo")).toHaveClass("bg-[var(--punto-apagado)]");
    expect(await dot("Paula Méndez", "Invitación pendiente")).toHaveClass("bg-[var(--marca)]");
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

  // B4 (decisiones 13 y 87): quien administra una empresa sin roles de la organización entra a la ficha de su empresa
  // con el permiso de esa empresa (`/api/me`, mapa por empresa) y ve sus miembros, sus roles y los filtros. Los roles
  // salen de la ruta de la empresa, no de `/api/roles/paged`, que pide `roles.read`.
  it("B4: un Administrador de empresa sin roles de la organización ve los miembros, los roles y los filtros de su empresa", async () => {
    const user = userEvent.setup();
    let organizationRoles = 0;
    detailApi([{ ...member, roles: [companyAdmin] }]);
    server.use(http.get("/api/roles/paged", () => { organizationRoles += 1; return HttpResponse.json({ code: "Authorization.Forbidden" }, { status: 403 }); }));
    renderRouteWithProviders("/org/empresas/company-1", { as: "business-company-admin" });

    expect(await screen.findByRole("heading", { level: 1, name: "Delta S.A." })).toBeVisible();
    const row = (await screen.findByText("Lucía Fernández")).closest("tr")!;
    expect(within(row).getByText("Administrador")).toBeVisible();
    expect(within(row).getByText("Activo")).toBeVisible();
    // Los menús de Radix se abren con el teclado: un clic en jsdom, después de otra prueba con clics, no siempre llega.
    screen.getByRole("button", { name: "Rol: todos" }).focus();
    await user.keyboard("{Enter}");
    expect((await screen.findAllByRole("menuitemradio")).map((option) => option.textContent)).toEqual(["Todos", "Sin roles", "Administrador", "Solo lectura"]);
    await user.keyboard("{Escape}");
    screen.getByRole("button", { name: "Estado: todos" }).focus();
    await user.keyboard("{Enter}");
    expect(await screen.findByRole("menuitemradio", { name: /^Baja pedida/ })).toBeVisible();
    await user.keyboard("{Escape}");
    expect(organizationRoles).toBe(0);
    // Lo de la organización no se ofrece: editar la empresa, la pestaña Roles (que lleva al editor de roles) ni la ficha
    // de Usuario, que piden permisos de la organización.
    expect(screen.queryByRole("button", { name: "Editar empresa" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: /Roles/ })).not.toBeInTheDocument();
    // Pestañas (decisión del 2026-10-05, 6d-4a): con un solo grupo, «Miembros», la ficha va sin la barra de pestañas.
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Miembro" })).toBeVisible();
    (await screen.findByRole("button", { name: "Acciones para Lucía Fernández" })).focus();
    await user.keyboard("{Enter}");
    expect(await screen.findByRole("menuitem", { name: "Cambiar roles" })).toBeVisible();
    expect(screen.queryByRole("menuitem", { name: "Ver usuario" })).not.toBeInTheDocument();
    await user.keyboard("{Escape}");
    // Vuelve al Inicio, de donde llegó («Tus empresas» o «Para resolver»): Empresas pide `companies.read`.
    expect(screen.getByRole("link", { name: "Volver al inicio" })).toHaveAttribute("href", "/org");
  });

  // B4: como «‹», la miga «Empresas» no lleva a Empresas, que pide `companies.read` y le mostraría «No tenés permiso»: va
  // como texto, sin enlace. Inicio sí es un enlace.
  it("B4: para el Administrador de empresa, la miga «Empresas» va sin enlace, como «‹»", async () => {
    detailApi([{ ...member, roles: [companyAdmin] }]);
    renderRouteWithProviders("/org/empresas/company-1", { as: "business-company-admin" });

    const crumbs = await screen.findByRole("navigation", { name: "Migas de pan" });
    await waitFor(() => expect(crumbs).toHaveTextContent(/^Inicio\/Empresas\/Delta S\.A\.$/));
    expect(within(crumbs).queryByRole("link", { name: "Empresas" })).not.toBeInTheDocument();
    expect(within(crumbs).getByRole("link", { name: "Inicio" })).toHaveAttribute("href", "/org");
  });

  it("B4: con otra empresa, el Administrador de empresa ve «No tenés permiso»", async () => {
    renderRouteWithProviders("/org/empresas/company-2", { as: "business-company-admin" });

    expect(await screen.findByRole("heading", { name: "No tenés permiso para ver esta página" })).toBeVisible();
  });

  // «Criterio · Botones»: «Guardar cambios» de «Editar empresa» no se apaga con el CUIT mal; no manda nada y el campo dice
  // qué corregir.
  it("con el CUIT mal, «Guardar cambios» de «Editar empresa» sigue activo y no manda nada", async () => {
    let puts = 0;
    detailApi([member]);
    server.use(http.put("/api/companies/company-1", () => { puts += 1; return HttpResponse.json({ version: 4 }); }));
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

  // «Criterio · Botones» (6d-4a): como en Configuración, Usuario, Mi cuenta y Roles, «Guardar cambios» de «Editar
  // empresa» se apaga sin cambios. Un cambio lo prende y volver a lo guardado lo apaga.
  it("«Editar empresa» sin cambios: «Guardar cambios» apagado; un cambio lo prende y volver a lo guardado lo apaga", async () => {
    detailApi([member]);
    const user = userEvent.setup();
    renderRouteWithProviders("/org/empresas/company-1", { as: "business-e6-admin" });
    await user.click(await screen.findByRole("button", { name: "Editar empresa" }));
    const dialog = await screen.findByRole("dialog", { name: "Editar empresa" });

    const save = within(dialog).getByRole("button", { name: "Guardar cambios" });
    expect(save).toBeDisabled();
    const name = within(dialog).getByRole("textbox", { name: "Nombre" });
    await user.type(name, " Norte");
    expect(save).toBeEnabled();
    await user.clear(name);
    await user.type(name, "Delta S.A.");
    expect(save).toBeDisabled();
  });

  // «Criterio · Botones» (6d-4a): «Roles de …» edita los roles de un miembro y su «Guardar cambios» se apaga sin cambios.
  // Sacar un rol y volver a ponerlo no cuenta como un cambio, como en la ficha de Usuario.
  it("«Roles de …» sin cambios: «Guardar cambios» apagado; sacar un rol y volver a ponerlo no cuenta", async () => {
    const user = userEvent.setup();
    detailApi([{ ...member, roles: [companyAdmin, ownRole] }]);
    renderRouteWithProviders("/org/empresas/company-1", { as: "business-e6-admin" });
    expect(await screen.findByText("Lucía Fernández")).toBeVisible();
    (await screen.findByRole("button", { name: "Acciones para Lucía Fernández" })).focus();
    await user.keyboard("{Enter}");
    await user.click(await screen.findByRole("menuitem", { name: "Cambiar roles" }));
    const dialog = await screen.findByRole("dialog", { name: "Roles de Lucía Fernández" });

    const save = within(dialog).getByRole("button", { name: "Guardar cambios" });
    expect(save).toBeDisabled();
    await user.click(within(dialog).getByRole("button", { name: "Roles en la empresa" }));
    await user.click(await screen.findByRole("menuitemcheckbox", { name: "Administrador" }));
    expect(save).toBeEnabled();
    await user.click(screen.getByRole("menuitemcheckbox", { name: "Administrador" }));
    await user.keyboard("{Escape}");
    expect(save).toBeDisabled();
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
    // Con `companies.read`, «Empresas» lleva a la lista.
    expect(within(screen.getByRole("navigation", { name: "Migas de pan" })).getByRole("link", { name: "Empresas" })).toHaveAttribute("href", "/org/empresas");
  });

  it("quitar pide confirmación (también con la baja pedida); volver a sumar es directo", async () => {
    const user = userEvent.setup();
    const pending = { ...member, memberId: "member-2", displayName: "Diego Ríos", email: "diego@example.com", state: "PendingDeletion" as const };
    const inactive = { ...member, memberId: "member-3", displayName: "Marcos Giménez", email: "marcos@example.com", membershipStatus: "Inactive" as const };
    const statusBodies: unknown[] = [];
    detailApi([member, pending, inactive]);
    server.use(http.put("/api/companies/company-1/members/:memberId/status", async ({ request }) => { statusBodies.push(await request.json()); return HttpResponse.json({ version: 9 }); }));
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
    // El «·» después del estado separa dos datos (6 de cada lado, gris tenue); el de adentro del dato es texto.
    await waitFor(() => expect(subline).toHaveTextContent(/^Activa·CUIT 30-71234567-1 · Buenos Aires \(GMT−3\)$/));
    expect(subline.querySelector("[data-slot=subline-separator]")).toHaveClass("mx-1.5", "text-[var(--t3)]");
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
        return HttpResponse.json({ version: 9 });
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

  // formularios.md y errores.md: lo que el back rechaza de un dato va debajo de ese dato, con el texto del back
  // (`errors.ts`): un rol que ya no existe va debajo de «Roles en la empresa», no en la franja.
  it("un rol que el back ya no encuentra va debajo de «Roles en la empresa»", async () => {
    const user = userEvent.setup();
    rolesApi(() => HttpResponse.json({ status: 404, code: "Roles.Role.NotFound", title: "No encontrado",
      detail: "No encontramos el rol." }, { status: 404 }));
    renderRouteWithProviders("/org/empresas/company-1", { as: "business-e6-admin" });
    const dialog = await openRolesDialog(user);
    await user.click(within(dialog).getByRole("button", { name: "Guardar cambios" }));

    const roles = within(dialog).getByRole("button", { name: "Roles en la empresa" });
    await waitFor(() => expect(roles).toHaveAccessibleDescription("No encontramos el rol."));
    expect(roles).toHaveAttribute("aria-invalid", "true");
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
      http.get("/api/companies/company-1/candidates/paged", () => HttpResponse.json({ items: [{ memberId: "member-2", displayName: "Tomás Acosta",
        maskedEmailAddress: "to•••@example.com" }], page: 1, pageSize: 100, totalCount: 1, totalPages: 1, hasPrevious: false, hasNext: false })),
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
      http.get("/api/companies/company-1/candidates/paged", () => HttpResponse.json({ items: [{ memberId: "member-2", displayName: "Tomás Acosta",
        maskedEmailAddress: "to•••@example.com" }], page: 1, pageSize: 100, totalCount: 1, totalPages: 1, hasPrevious: false, hasNext: false })),
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

  // formularios.md y errores.md: lo que el back rechaza de un dato va debajo de ese dato, con el texto del back
  // (`errors.ts`): si otra persona ya la sumó, lo dice «Usuario», no la franja.
  it("«Agregar miembro»: la persona que ya está en la empresa va debajo de «Usuario»", async () => {
    server.use(
      http.get("/api/companies/company-1", () => HttpResponse.json(company)),
      http.get("/api/companies/company-1/members/paged", () => HttpResponse.json({ items: [], page: 1, pageSize: 10, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false })),
      http.get("/api/companies/company-1/members/filter-counts", () => HttpResponse.json({ all: 0, active: 0, pendingDeletion: 0, inactive: 0, invited: 0 })),
      http.get("/api/companies/company-1/roles/paged", () => HttpResponse.json({ items: [companyAdmin], page: 1, pageSize: 100, totalCount: 1, totalPages: 1, hasPrevious: false, hasNext: false })),
      http.get("/api/companies/company-1/candidates/paged", () => HttpResponse.json({ items: [{ memberId: "member-2", displayName: "Tomás Acosta",
        maskedEmailAddress: "to•••@example.com" }], page: 1, pageSize: 100, totalCount: 1, totalPages: 1, hasPrevious: false, hasNext: false })),
      http.post("/api/companies/company-1/members", () => HttpResponse.json({ status: 409, code: "Companies.Membership.AlreadyExists",
        title: "Conflicto", detail: "Esta persona ya pertenece a la empresa." }, { status: 409 })),
    );

    const user = userEvent.setup();
    renderRouteWithProviders("/org/empresas/company-1", { as: "business-e6-admin" });
    await user.click(await screen.findByRole("button", { name: "Agregar miembro" }));
    const dialog = await screen.findByRole("dialog", { name: "Agregar miembro" });
    const member = within(dialog).getByRole("combobox", { name: "Usuario" });
    await user.click(member);
    await user.click(await screen.findByRole("option", { name: /Tomás Acosta/ }));
    await user.click(within(dialog).getByRole("button", { name: "Agregar miembro" }));

    await waitFor(() => expect(member).toHaveAccessibleDescription("Esta persona ya pertenece a la empresa."));
    expect(member).toHaveAttribute("aria-invalid", "true");
    expect(screen.getAllByRole("alert", { hidden: true })).toHaveLength(1);
  });

  // Como «Editar empresa» y «Roles de …»: el error de la franja de «Agregar miembro» se va al cambiar la persona o sus
  // roles; al volver a agregar, si el back lo rechaza otra vez, vuelve.
  it("«Agregar miembro»: el error de la franja se va al cambiar un campo", async () => {
    const candidate = (memberId: string, displayName: string, maskedEmailAddress: string) => ({ memberId, displayName, maskedEmailAddress });
    server.use(
      http.get("/api/companies/company-1", () => HttpResponse.json(company)),
      http.get("/api/companies/company-1/members/paged", () => HttpResponse.json({ items: [], page: 1, pageSize: 10, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false })),
      http.get("/api/companies/company-1/members/filter-counts", () => HttpResponse.json({ all: 0, active: 0, pendingDeletion: 0, inactive: 0, invited: 0 })),
      http.get("/api/companies/company-1/roles/paged", () => HttpResponse.json({ items: [companyAdmin], page: 1, pageSize: 100, totalCount: 1, totalPages: 1, hasPrevious: false, hasNext: false })),
      http.get("/api/companies/company-1/candidates/paged", () => HttpResponse.json({ items: [candidate("member-2", "Tomás Acosta", "to•••@example.com"),
        candidate("member-3", "Sofía Ruiz", "so•••@example.com")], page: 1, pageSize: 100, totalCount: 2, totalPages: 1, hasPrevious: false, hasNext: false })),
      http.post("/api/companies/company-1/members", () => HttpResponse.json({ status: 409, code: "Tenancy.Company.Inactive",
        title: "Conflicto", detail: "Activá la empresa antes de administrar sus miembros." }, { status: 409 })),
    );
    const user = userEvent.setup();
    renderRouteWithProviders("/org/empresas/company-1", { as: "business-e6-admin" });
    await user.click(await screen.findByRole("button", { name: "Agregar miembro" }));
    const dialog = await screen.findByRole("dialog", { name: "Agregar miembro" });
    const person = within(dialog).getByRole("combobox", { name: "Usuario" });
    await waitFor(() => expect(person).toBeEnabled());
    await user.click(person);
    await user.click(await screen.findByRole("option", { name: /Tomás Acosta/ }));
    await user.click(within(dialog).getByRole("button", { name: "Agregar miembro" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Activá la empresa antes de administrar sus miembros.");

    await user.click(within(dialog).getByRole("button", { name: "Roles en la empresa" }));
    await user.click(await screen.findByRole("menuitemcheckbox", { name: "Administrador" }));
    await user.keyboard("{Escape}");
    expect(within(dialog).queryByRole("alert")).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Agregar miembro" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Activá la empresa antes de administrar sus miembros.");
    await user.click(person);
    await user.click(await screen.findByRole("option", { name: /Sofía Ruiz/ }));
    expect(within(dialog).queryByRole("alert")).not.toBeInTheDocument();
  });

  // formularios.md: los errores de validación del back van a su campo (`applyApiErrorToForm`).
  it("«Editar empresa»: lo que el back no acepta del nombre va debajo del nombre", async () => {
    detailApi([member]);
    server.use(http.put("/api/companies/company-1", () => HttpResponse.json({ status: 400, code: "Validation.Failed", title: "Datos inválidos",
      detail: "Revisá los datos.", errors: { name: ["El nombre de la empresa es demasiado largo."] } }, { status: 400 })));
    const user = userEvent.setup();
    renderRouteWithProviders("/org/empresas/company-1", { as: "business-e6-admin" });
    await user.click(await screen.findByRole("button", { name: "Editar empresa" }));
    const dialog = await screen.findByRole("dialog", { name: "Editar empresa" });
    const name = within(dialog).getByRole("textbox", { name: "Nombre" });
    await user.type(name, " Norte");
    await user.click(within(dialog).getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => expect(name).toHaveAccessibleDescription("El nombre de la empresa es demasiado largo."));
    expect(screen.getAllByRole("alert", { hidden: true })).toHaveLength(1);
  });

  // Diseño, siguiendo formularios.md: en «Editar empresa», el CUIT repetido va debajo del CUIT, con el texto del back, y
  // no en la franja; el último administrador sí sigue en la franja (prueba de arriba).
  it("«Editar empresa»: el CUIT repetido va debajo del CUIT, con el texto del back y sin franja", async () => {
    detailApi([member]);
    server.use(http.put("/api/companies/company-1", () => HttpResponse.json({ status: 409, code: "Tenancy.Company.TaxIdAlreadyUsed",
      title: "Conflicto", detail: "Ya hay una empresa con esa identificación fiscal." }, { status: 409 })));
    const user = userEvent.setup();
    renderRouteWithProviders("/org/empresas/company-1", { as: "business-e6-admin" });
    await user.click(await screen.findByRole("button", { name: "Editar empresa" }));
    const dialog = await screen.findByRole("dialog", { name: "Editar empresa" });
    const cuit = within(dialog).getByRole("textbox", { name: "CUIT" });
    await user.click(cuit);
    await user.paste("30712345671");
    await user.click(within(dialog).getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => expect(cuit).toHaveAccessibleDescription("Ya hay una empresa con esa identificación fiscal."));
    expect(cuit).toHaveAttribute("aria-invalid", "true");
    expect(screen.getAllByRole("alert", { hidden: true })).toHaveLength(1);
  });

  // accesibilidad.md: un diálogo le devuelve el foco a lo que lo abrió. Los de la banda, al botón; los del ⋮ de una fila,
  // a ese ⋮, porque la opción se va con el menú.
  it("cada diálogo de la ficha le devuelve el foco a lo que lo abrió", async () => {
    const user = userEvent.setup();
    rolesApi(() => HttpResponse.json({ version: 9 }));
    server.use(http.get("/api/companies/company-1/candidates/paged", () => HttpResponse.json({ items: [], page: 1, pageSize: 100, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false })));
    renderRouteWithProviders("/org/empresas/company-1", { as: "business-e6-admin" });
    expect(await screen.findByText("Lucía Fernández")).toBeVisible();

    const add = screen.getByRole("button", { name: "Agregar miembro" });
    await user.click(add);
    await screen.findByRole("dialog", { name: "Agregar miembro" });
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(add).toHaveFocus());

    const edit = screen.getByRole("button", { name: "Editar empresa" });
    await user.click(edit);
    await user.click(within(await screen.findByRole("dialog", { name: "Editar empresa" })).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(edit).toHaveFocus());

    const rowActions = screen.getByRole("button", { name: "Acciones para Lucía Fernández" });
    rowActions.focus();
    await user.keyboard("{Enter}");
    await user.click(await screen.findByRole("menuitem", { name: "Cambiar roles" }));
    await user.click(within(await screen.findByRole("dialog", { name: "Roles de Lucía Fernández" })).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(rowActions).toHaveFocus());

    rowActions.focus();
    await user.keyboard("{Enter}");
    await user.click(await screen.findByRole("menuitem", { name: "Quitar de la empresa" }));
    await user.click(within(await screen.findByRole("dialog", { name: "¿Quitar a Lucía Fernández de la empresa?" })).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(rowActions).toHaveFocus());
  });

  // Cada diálogo se monta solo mientras está abierto y es dueño de su borrador: lo que quedó a medias al cancelar no
  // vuelve a aparecer.
  it("al cancelar «Editar empresa», lo escrito se descarta y vuelve a abrir con lo guardado", async () => {
    const user = userEvent.setup();
    detailApi([member]);
    renderRouteWithProviders("/org/empresas/company-1", { as: "business-e6-admin" });

    await user.click(await screen.findByRole("button", { name: "Editar empresa" }));
    const first = await screen.findByRole("dialog", { name: "Editar empresa" });
    await user.clear(within(first).getByRole("textbox", { name: "Nombre" }));
    await user.click(within(first).getByRole("button", { name: "Guardar cambios" }));
    expect(within(first).getByRole("textbox", { name: "Nombre" })).toHaveAccessibleDescription("Escribí el nombre de la empresa.");
    await user.click(within(first).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Editar empresa" }));
    const again = await screen.findByRole("dialog", { name: "Editar empresa" });
    expect(within(again).getByRole("textbox", { name: "Nombre" })).toHaveValue("Delta S.A.");
    expect(within(again).getByRole("textbox", { name: "Nombre" })).not.toHaveAccessibleDescription("Escribí el nombre de la empresa.");
  });

  // formularios.md (Ediciones simultáneas): «Editar empresa» manda la versión de la empresa de cuando se abrió. La ficha
  // le pasa su lectura viva, y una relectura de fondo con otra versión no la cambia: el back responde 409 en vez de pisar
  // lo que cambió otra persona.
  it("«Editar empresa» manda la versión de cuando se abrió, aunque llegue una relectura con otra", async () => {
    const user = userEvent.setup();
    detailApi([member]);
    let current = company;
    const sent: unknown[] = [];
    server.use(
      http.get("/api/companies/company-1", () => HttpResponse.json(current)),
      http.put("/api/companies/company-1", async ({ request }) => {
        const body = await request.json() as { version: number };
        sent.push(body);
        return body.version === current.version ? HttpResponse.json({ version: current.version + 1 })
          : HttpResponse.json({ status: 409, code: "General.ConcurrencyConflict", title: "Conflicto",
            detail: "Otra persona cambió esto. Revisá la versión más reciente antes de guardar." }, { status: 409 });
      }),
    );
    const { queryClient } = renderRouteWithProviders("/org/empresas/company-1", { as: "business-e6-admin" });
    await user.click(await screen.findByRole("button", { name: "Editar empresa" }));
    const dialog = await screen.findByRole("dialog", { name: "Editar empresa" });

    current = { ...company, name: "Delta Sur S.A.", version: 4 };
    await act(() => queryClient.invalidateQueries({ queryKey: ["companies", "detail", "company-1"] }));
    await waitFor(() => expect(screen.getByRole("heading", { level: 1, name: "Delta Sur S.A.", hidden: true })).toBeInTheDocument());
    const name = within(dialog).getByRole("textbox", { name: "Nombre" });
    expect(name).toHaveValue("Delta S.A.");
    await user.clear(name);
    await user.type(name, "Delta Norte S.A.");
    await user.click(within(dialog).getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => expect(sent).toEqual([expect.objectContaining({ name: "Delta Norte S.A.", version: 3 })]));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Otra persona cambió esto. Revisá la versión más reciente antes de guardar.");
  });
});
