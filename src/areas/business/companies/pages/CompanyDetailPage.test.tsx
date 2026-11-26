import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { configureI18n, changeCulture } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";
import { companyQueryKey } from "../api/companies";
import { pickerName } from "@/test/picker";

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
    http.get("/api/companies/company-1/members/paged", ({ request }) => {
      const params = new URL(request.url).searchParams;
      const page = Number(params.get("page") ?? 1), pageSize = Number(params.get("pageSize") ?? 10);
      const totalPages = Math.ceil(members.length / pageSize);
      return HttpResponse.json({ items: members.slice((page - 1) * pageSize, page * pageSize), page, pageSize, totalCount: members.length, totalPages, hasPrevious: page > 1, hasNext: page < totalPages });
    }),
    http.get("/api/companies/company-1/members/filter-counts", () => HttpResponse.json({ all: members.length, active: 1, pendingDeletion: 1, inactive: 1, invited: 0 })),
    http.get("/api/companies/company-1/roles/paged", ({ request }) => { const items = new URL(request.url).searchParams.get("onlyOwn") === "true" ? [ownRole] : [companyAdmin, ownRole]; return HttpResponse.json({ items, page: 1, pageSize: 10, totalCount: items.length, totalPages: 1, hasPrevious: false, hasNext: false }); }),
  );
}

// La ficha con Lucía y el rol Administrador; `put` responde el guardado de sus roles. Cuenta las lecturas de la ficha.
function rolesApi(put: () => Response) {
  const reads = { company: 0, members: 0 };
  server.use(
    http.get("/api/companies/company-1", () => { reads.company += 1; return HttpResponse.json(company); }),
    http.get("/api/companies/company-1/members/paged", () => { reads.members += 1; return HttpResponse.json({ items: [member], page: 1, pageSize: 10, totalCount: 1, totalPages: 1, hasPrevious: false, hasNext: false }); }),
    http.get("/api/companies/company-1/members/filter-counts", () => HttpResponse.json({ all: 1, active: 1, pendingDeletion: 0, inactive: 0, invited: 0 })),
    http.get("/api/companies/company-1/roles/paged", ({ request }) => { const items = new URL(request.url).searchParams.get("onlyOwn") === "true" ? [] : [companyAdmin]; return HttpResponse.json({ items, page: 1, pageSize: 10, totalCount: items.length, totalPages: 1, hasPrevious: false, hasNext: false }); }),
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
  await user.click(within(dialog).getByRole("button", { name: /^Roles en la empresa( |$)/ }));
  // Tablero Empresa: cada rol del desplegable, con su descripción debajo.
  expect(await screen.findByRole("option", { name: "Administrador" })).toHaveAccessibleDescription("Administra la empresa: sus miembros y sus roles.");
  await user.click(screen.getByRole("option", { name: "Administrador" }));
  await user.keyboard("{Escape}");
  return dialog;
}

// «Criterio · Diálogos»: la franja va después del último campo y antes de «Cancelar».
function expectAboveButtons(dialog: HTMLElement, alert: HTMLElement, lastField: RegExp) {
  const following = (from: Node, to: Node) => Boolean(from.compareDocumentPosition(to) & Node.DOCUMENT_POSITION_FOLLOWING);
  expect(following(within(dialog).getByRole("button", { name: lastField }), alert)).toBe(true);
  expect(following(alert, within(dialog).getByRole("button", { name: "Cancelar" }))).toBe(true);
}

describe("CompanyDetailPage", () => {
  it("pide roles propios paginados al servidor y conserva el total de la pestaña", async () => {
    const user = userEvent.setup(); detailApi([member]);
    const own = Array.from({ length: 12 }, (_, index) => ({ ...ownRole, id: `role-${index}`, name: `Rol propio ${index}` }));
    const requests: URL[] = [];
    server.use(http.get("/api/companies/company-1/roles/paged", ({ request }) => {
      const url = new URL(request.url); requests.push(url);
      const page = Number(url.searchParams.get("page") ?? 1);
      const rows = url.searchParams.get("onlyOwn") === "true" ? own : [companyAdmin, ...own];
      return HttpResponse.json({ items: rows.slice((page - 1) * 10, page * 10), page, pageSize: 10, totalCount: rows.length, totalPages: 2, hasPrevious: page > 1, hasNext: page < 2 });
    }));
    renderRouteWithProviders("/org/empresas/company-1", { as: "business-e6-admin" });
    const rolesTab = await screen.findByRole("tab", { name: /^Roles/ });
    await waitFor(() => expect(rolesTab).toHaveTextContent("12"));
    await user.click(rolesTab);
    expect(await screen.findByRole("link", { name: own[0].name })).toBeVisible();
    expect(screen.queryByRole("link", { name: companyAdmin.name })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: own[11].name })).not.toBeInTheDocument();
    await user.click(within(screen.getByRole("tabpanel")).getByRole("button", { name: "Página siguiente" }));
    expect(await screen.findByRole("link", { name: own[11].name })).toBeVisible();
    expect(requests.filter((url) => url.searchParams.get("onlyOwn") === "true").map((url) => url.searchParams.get("page"))).toEqual(["1", "2"]);
    await user.click(screen.getByRole("tab", { name: /^Miembros/ }));
    expect(await screen.findByText("Lucía Fernández")).toBeVisible();
    await user.click(screen.getByRole("tab", { name: /^Roles/ }));
    expect(await screen.findByRole("link", { name: own[11].name })).toBeVisible();
  });
  it("tablero Empresa: banda, columnas y filtros accesibles de Miembros", async () => {
    detailApi([member]);
    const { container } = renderRouteWithProviders("/org/empresas/company-1", { as: "business-e6-admin" });

    const edit = await screen.findByRole("button", { name: "Editar empresa" });
    expect(edit.querySelector("svg")).toBeNull();
    expect(screen.getByRole("button", { name: "Agregar miembro" })).toBeVisible();
    for (const name of ["Miembro", "Roles en la empresa", "Estado"]) expect(await screen.findByRole("columnheader", { name })).toBeVisible();
    // Tablero Empresa (base de la 12): un dato por celda; el correo va en su columna.
    expect(screen.getByRole("columnheader", { name: "Miembro" })).toHaveClass("w-[24%]");
    expect(screen.getByText("lucia@example.com").closest("td")).not.toBeNull();
    expect(document.querySelector('[data-slot="cell-detail"]')).toBeNull();
    expect(screen.getByRole("button", { name: "Rol: todos" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Estado: todos" })).toBeVisible();
    expect(await axe(container)).toHaveNoViolations();
  });
  it("tablero Empresa: pestaña Roles accesible con los roles propios de la empresa", async () => {
    const user = userEvent.setup();
    detailApi([member]);
    const { container } = renderRouteWithProviders("/org/empresas/company-1", { as: "business-e6-admin" });
    await screen.findByRole("button", { name: "Editar empresa" });
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
    expect(within(roles).getByRole("button", { name: pickerName("Filas por página") })).toBeVisible();
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
    expect(roles).toHaveClass("md:max-w-105");
    expect(within(roles).queryByText("Delta S.A.")).not.toBeInTheDocument();
    expect(within(roles).getByRole("button", { name: /^Roles en la empresa( |$)/ })).toHaveTextContent("Sin roles");
    await user.click(within(roles).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Agregar miembro" }));
    const add = await screen.findByRole("dialog", { name: "Agregar miembro" });
    expect(add).toHaveClass("md:max-w-105");
    expect(within(add).queryByText("Delta S.A.")).not.toBeInTheDocument();
    expect(within(add).getByRole("button", { name: /^Roles en la empresa( |$)/ })).toHaveTextContent("Sin roles");
    await user.click(within(add).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Editar empresa" }));
    expect(await screen.findByRole("dialog", { name: "Editar empresa" })).toHaveClass("md:max-w-140");
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
    expect(roles).toHaveClass("bottom-0", "rounded-t-[1.25rem]");
    expect(roles).not.toHaveClass("min-h-[calc(100dvh-1rem)]");
    expect(within(roles).getByRole("button", { name: /^Roles en la empresa( |$)/ }).closest("[data-slot='dialog-body']")).not.toBeNull();
    await user.click(within(roles).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Agregar miembro" }));
    const add = await screen.findByRole("dialog", { name: "Agregar miembro" });
    expect(add).not.toHaveClass("min-h-[calc(100dvh-1rem)]");
    expect(within(add).getByRole("button", { name: /^Usuario( |$)/ }).closest("[data-slot='dialog-body']")).not.toBeNull();
    await user.click(within(add).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Editar empresa" }));
    const edit = await screen.findByRole("dialog", { name: "Editar empresa" });
    expect(edit).not.toHaveClass("min-h-[calc(100dvh-1rem)]");
    expect(within(edit).getByRole("textbox", { name: "Nombre" }).closest("[data-slot='dialog-body']")).not.toBeNull();
  });

  // Bloque 6 (estados): cada estado de un miembro con el color del lienzo (tablero Empresa): activo en verde, la baja
  // pedida en ámbar y quitado de la empresa en gris; la invitación pendiente, en celeste como en Usuarios.
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
    expect(await dot("Diego Ríos", "Por borrar")).toHaveClass("bg-[var(--punto-alerta)]");
    expect(await dot("Marcos Giménez", "De baja")).toHaveClass("bg-[var(--punto-apagado)]");
    expect(await dot("Paula Méndez", "Invitación pendiente")).toHaveClass("bg-[var(--punto-pendiente)]");
  });

  // Tablero Empresa (base de la 12): la tabla de miembros tiene las columnas del tablero, en su orden; las acciones, sin
  // rótulo visible.
  // Empresa-Base2 (0066 §4): «Entrega» va después del estado.
  it("los miembros van con Miembro, Correo, Roles en la empresa, Estado, Entrega, Vence y Acciones, como el tablero", async () => {
    detailApi([member]);
    renderRouteWithProviders("/org/empresas/company-1", { as: "business-e6-admin" });

    const members = await screen.findByRole("tabpanel");
    await within(members).findByText("Lucía Fernández");
    expect(within(members).getAllByRole("columnheader").map((header) => header.textContent))
      .toEqual(["Miembro↑", "Correo", "Roles en la empresa", "Estado", "Entrega", "Vence", "Acciones"]);
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
    // Los miembros y los roles se piden a la par de la ficha: responden, así ningún pedido queda sin respuesta.
    detailApi([]);
    server.use(http.get("/api/companies/company-1", () => HttpResponse.json({ code: "Authorization.Forbidden", detail: "No tenés permiso." }, { status: 403 })));
    renderRouteWithProviders("/org/empresas/company-1", { as: "business-e6-admin" });

    expect(await screen.findByRole("heading", { name: "No tenés permiso para ver esta página" })).toBeVisible();
  });

  // B4 (decisiones 13 y 87): quien administra una empresa sin roles de la organización entra a la ficha de su empresa
  // con el permiso de esa empresa (`/api/me`, mapa por empresa) y ve sus miembros, sus roles y los filtros. Los roles
  // salen de la ruta de la empresa, no de `/api/roles/paged`, que pide `roles.read`.
  // F9 (base de la 12): sin el permiso para ver los miembros de la empresa, la pestaña «Miembros» no aparece y la ficha
  // abre en «Roles».
  it("sin el permiso de los miembros, la pestaña Miembros no aparece y abre en Roles", async () => {
    detailApi([member]);
    renderRouteWithProviders("/org/empresas/company-1", { as: "business-companies-reader" });

    expect(await screen.findByRole("heading", { level: 1, name: "Delta S.A." })).toBeVisible();
    // Con una sola pestaña a la vista, su contenido va sin la barra de pestañas («Criterio · Marco»).
    await waitFor(() => expect(screen.queryByRole("tab", { name: /^Miembros/ })).not.toBeInTheDocument());
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(screen.queryByText("Lucía Fernández")).not.toBeInTheDocument();
  });

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
    expect((await screen.findAllByRole("option")).map((option) => option.textContent)).toEqual(["Todos", "Sin roles", "Administrador", "Solo lectura"]);
    await user.keyboard("{Escape}");
    screen.getByRole("button", { name: "Estado: todos" }).focus();
    await user.keyboard("{Enter}");
    expect(await screen.findByRole("option", { name: /^Por borrar/ })).toBeVisible();
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
    await user.click(within(dialog).getByRole("button", { name: /^Roles en la empresa( |$)/ }));
    await user.click(await screen.findByRole("option", { name: "Administrador" }));
    expect(save).toBeEnabled();
    await user.click(screen.getByRole("option", { name: "Administrador" }));
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
    expect(await screen.findByRole("menuitem", { name: "Dar de baja" })).toBeVisible();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());

    await open("Acciones para Lucía Fernández");
    await user.click(await screen.findByRole("menuitem", { name: "Dar de baja" }));
    const confirm = await screen.findByRole("dialog", { name: "¿Dar de baja a Lucía Fernández en la empresa?" });
    expect(confirm).toHaveTextContent("Deja de entrar a Delta S.A. y pierde sus roles acá. Sigue en la organización y en sus otras empresas.");
    await user.click(within(confirm).getByRole("button", { name: "Dar de baja" }));
    expect(await screen.findByText("Dimos de baja a Lucía Fernández en la empresa.")).toBeVisible();

    await open("Acciones para Marcos Giménez");
    await user.click(await screen.findByRole("menuitem", { name: "Reactivar" }));
    expect(await screen.findByText("Reactivamos a Marcos Giménez. Dale los roles de nuevo.")).toBeVisible();
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
    await user.click(screen.getByRole("button", { name: /^Roles en la empresa( |$)/ }));
    await user.click(await screen.findByRole("option", { name: "Administrador" }));
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
    expectAboveButtons(dialog, alert, /^Roles en la empresa( |$)/);
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
    expectAboveButtons(dialog, alert, /^Roles en la empresa( |$)/);
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

    const roles = within(dialog).getByRole("button", { name: /^Roles en la empresa( |$)/ });
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
    const member = within(dialog).getByRole("button", { name: /^Usuario( |$)/ });
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

  // ADR 0063 §7, como Mi cuenta: el tope del correo dice su texto en la franja y la espera en horas y minutos en «Agregar
  // miembro», que se apaga mientras cuenta, sin el aviso de abajo y sin agregar.
  it("agregar miembro con el tope del correo dice su texto y la espera en horas en el botón, sin agregar", async () => {
    let posts = 0;
    const detail = "Por ahora no se pueden mandar más correos, y no se guardó nada. Probá de nuevo más tarde.";
    server.use(
      http.get("/api/companies/company-1", () => HttpResponse.json(company)),
      http.get("/api/companies/company-1/members/paged", () => HttpResponse.json({ items: [], page: 1, pageSize: 10, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false })),
      http.get("/api/companies/company-1/members/filter-counts", () => HttpResponse.json({ all: 0, active: 0, pendingDeletion: 0, inactive: 0, invited: 0 })),
      http.get("/api/companies/company-1/roles/paged", () => HttpResponse.json({ items: [companyAdmin], page: 1, pageSize: 100, totalCount: 1, totalPages: 1, hasPrevious: false, hasNext: false })),
      http.get("/api/companies/company-1/candidates/paged", () => HttpResponse.json({ items: [{ memberId: "member-2", displayName: "Tomás Acosta",
        maskedEmailAddress: "to•••@example.com" }], page: 1, pageSize: 100, totalCount: 1, totalPages: 1, hasPrevious: false, hasNext: false })),
      http.post("/api/companies/company-1/members", () => { posts += 1; return HttpResponse.json({ status: 429, code: "Messaging.Email.DailyLimit", detail, retryAfter: 82345 },
        { status: 429, headers: { "Retry-After": "82345" } }); }),
    );

    const user = userEvent.setup();
    renderRouteWithProviders("/org/empresas/company-1", { as: "business-e6-admin" });
    await user.click(await screen.findByRole("button", { name: "Agregar miembro" }));
    const dialog = await screen.findByRole("dialog", { name: "Agregar miembro" });
    await user.click(within(dialog).getByRole("button", { name: /^Usuario( |$)/ }));
    await user.click(await screen.findByRole("option", { name: /Tomás Acosta/ }));
    await user.click(within(dialog).getByRole("button", { name: "Agregar miembro" }));

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(detail);
    expect(within(dialog).getByRole("button", { name: "Reintentá en 22 h 53 min" })).toBeDisabled();
    expect(document.querySelector("[data-sonner-toast]")).toBeNull();
    expect(posts).toBe(1);
  });

  // R05 (datos-y-api): si la respuesta se pierde, repetir lo mismo conserva la clave y corregir un dato es otra operación
  // con otra clave; el aviso es el del intento que salió bien.
  it("agregar miembro: respuesta perdida, reintento idéntico con la misma clave y corrección con otra", async () => {
    const sent: Array<{ key: string | null; memberId: unknown }> = [];
    server.use(
      http.get("/api/companies/company-1", () => HttpResponse.json(company)),
      http.get("/api/companies/company-1/members/paged", () => HttpResponse.json({ items: [], page: 1, pageSize: 10, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false })),
      http.get("/api/companies/company-1/members/filter-counts", () => HttpResponse.json({ all: 0, active: 0, pendingDeletion: 0, inactive: 0, invited: 0 })),
      http.get("/api/companies/company-1/roles/paged", () => HttpResponse.json({ items: [companyAdmin], page: 1, pageSize: 100, totalCount: 1, totalPages: 1, hasPrevious: false, hasNext: false })),
      http.get("/api/companies/company-1/candidates/paged", () => HttpResponse.json({ items: [
        { memberId: "member-2", displayName: "Tomás Acosta", maskedEmailAddress: "to•••@example.com" },
        { memberId: "member-3", displayName: "Sofía Herrera", maskedEmailAddress: "so•••@example.com" },
      ], page: 1, pageSize: 100, totalCount: 2, totalPages: 1, hasPrevious: false, hasNext: false })),
      http.post("/api/companies/company-1/members", async ({ request }) => {
        const body = await request.json() as { memberId?: unknown };
        sent.push({ key: request.headers.get("Idempotency-Key"), memberId: body.memberId });
        return sent.length < 3 ? HttpResponse.error() : new HttpResponse(null, { status: 204 });
      }),
    );
    const user = userEvent.setup();
    renderRouteWithProviders("/org/empresas/company-1", { as: "business-e6-admin" });
    await user.click(await screen.findByRole("button", { name: "Agregar miembro" }));
    const dialog = await screen.findByRole("dialog", { name: "Agregar miembro" });
    const choose = async (name: RegExp) => { await user.click(within(dialog).getByRole("button", { name: /^Usuario( |$)/ })); await user.click(await screen.findByRole("option", { name })); };
    const add = () => user.click(within(dialog).getByRole("button", { name: "Agregar miembro" }));
    await choose(/Tomás Acosta/);
    await add();
    await waitFor(() => expect(sent).toHaveLength(1));
    await waitFor(() => expect(within(dialog).getByRole("button", { name: "Agregar miembro" })).toBeEnabled());
    await add();
    await waitFor(() => expect(sent).toHaveLength(2));
    await waitFor(() => expect(within(dialog).getByRole("button", { name: "Agregar miembro" })).toBeEnabled());
    await choose(/Sofía Herrera/);
    await add();

    expect(await screen.findByText("Agregamos a Sofía Herrera a la empresa.")).toBeVisible();
    expect(sent.map((call) => call.memberId)).toEqual(["member-2", "member-2", "member-3"]);
    expect(sent[1].key).toBe(sent[0].key);
    expect(sent[2].key).not.toBe(sent[0].key);
  }, 10_000);

  // R01 (formularios, concurrencia): «Dar de baja» manda el estado y la versión de cuando se abrió la confirmación. Si con la
  // confirmación abierta llega una relectura (otra persona la inactivó), no manda la acción inversa con la versión nueva:
  // manda la de apertura y el back responde 409.
  it("una relectura con «¿Dar de baja …?» abierta manda la versión de apertura y recibe el 409", async () => {
    let current: Omit<typeof company, "status"> & { status: "Active" | "Inactive" } = company;
    const bodies: unknown[] = [];
    server.use(
      http.get("/api/companies/company-1", () => HttpResponse.json(current)),
      http.get("/api/companies/company-1/members/paged", () => HttpResponse.json({ items: [], page: 1, pageSize: 10, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false })),
      http.get("/api/companies/company-1/members/filter-counts", () => HttpResponse.json({ all: 0, active: 0, pendingDeletion: 0, inactive: 0, invited: 0 })),
      http.get("/api/companies/company-1/roles/paged", () => HttpResponse.json({ items: [], page: 1, pageSize: 100, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false })),
      http.put("/api/companies/company-1/status", async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json({ code: "General.ConcurrencyConflict", detail: "Otra persona cambió esta empresa." }, { status: 409 });
      }),
    );
    const user = userEvent.setup();
    const { queryClient } = renderRouteWithProviders("/org/empresas/company-1", { as: "business-e6-admin" });
    (await screen.findByRole("button", { name: "Más acciones" })).focus();
    await user.keyboard("{Enter}");
    // Tablero Empresa: «Dar de baja» con su ícono gris, como pide «Criterio · Menús».
    expect((await screen.findByRole("menuitem", { name: "Dar de baja" })).querySelector("svg")).not.toBeNull();
    await user.click(await screen.findByRole("menuitem", { name: "Dar de baja" }));
    const confirm = await screen.findByRole("dialog", { name: `¿Dar de baja ${company.name}?` });

    current = { ...company, status: "Inactive", version: company.version + 1 };
    await act(async () => { await queryClient.invalidateQueries(); });
    await waitFor(() => expect(queryClient.getQueryData<typeof company>(companyQueryKey("company-1"))?.version).toBe(company.version + 1));
    await user.click(within(confirm).getByRole("button", { name: "Dar de baja" }));

    await waitFor(() => expect(bodies).toEqual([{ status: "Inactive", version: company.version }]));
    expect(await screen.findByText("Otra persona cambió esta empresa.")).toBeVisible();
  });

  // 115: «Reactivar» del ⋮ de la banda va directo a la red; mientras espera, el ⋮ cambia su dibujo por el aro y no se abre.
  it("«Reactivar» la empresa desde el ⋮ de la banda muestra que trabaja hasta la respuesta", async () => {
    let release: (() => void) | undefined;
    detailApi([]);
    server.use(http.get("/api/companies/company-1", () => HttpResponse.json({ ...company, status: "Inactive" })),
      http.put("/api/companies/company-1/status", async () => { await new Promise<void>((resolve) => { release = resolve; }); return HttpResponse.json({ version: 4 }); }));
    const user = userEvent.setup();
    renderRouteWithProviders("/org/empresas/company-1", { as: "business-e6-admin" });
    const more = await screen.findByRole("button", { name: "Más acciones" });
    more.focus(); await user.keyboard("{Enter}");
    await user.click(await screen.findByRole("menuitem", { name: "Reactivar" }));
    await waitFor(() => expect(release).toBeDefined());
    expect(more).toHaveAttribute("aria-busy", "true");
    more.focus(); await user.keyboard("{Enter}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    release?.();
    await waitFor(() => expect(more).not.toHaveAttribute("aria-busy"));
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
    await user.click(await screen.findByRole("button", { name: /^Usuario( |$)/ }));
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
    const member = within(dialog).getByRole("button", { name: /^Usuario( |$)/ });
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
    const person = within(dialog).getByRole("button", { name: /^Usuario( |$)/ });
    await waitFor(() => expect(person).toBeEnabled());
    await user.click(person);
    await user.click(await screen.findByRole("option", { name: /Tomás Acosta/ }));
    await user.click(within(dialog).getByRole("button", { name: "Agregar miembro" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Activá la empresa antes de administrar sus miembros.");

    await user.click(within(dialog).getByRole("button", { name: /^Roles en la empresa( |$)/ }));
    await user.click(await screen.findByRole("option", { name: "Administrador" }));
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
    await user.click(await screen.findByRole("menuitem", { name: "Dar de baja" }));
    await user.click(within(await screen.findByRole("dialog", { name: "¿Dar de baja a Lucía Fernández en la empresa?" })).getByRole("button", { name: "Cancelar" }));
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
