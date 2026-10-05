import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { configureI18n, changeCulture } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";
import { userQueryKey } from "../api/users";
import { asPhone } from "@/test/utils/phone";

const ownerRole = { id: "role-owner", name: "Dueño", isSystemRole: true, scope: "Organization" as const, companyId: null };
const member = {
  memberId: "member-1", userId: "user-1" as string | null, displayName: "Lucía Fernández", email: "lucia@example.com",
  state: "Active" as const, hasManagedEmail: false, roles: [ownerRole],
  companies: [] as Array<{ companyId: string; companyName: string; status: "Active" | "Inactive"; roles: typeof ownerRole[] }>,
  invitationId: null as string | null, invitationIssuedAtUtc: null as string | null, invitationExpiresAtUtc: null as string | null,
  version: 2, createdAtUtc: "2026-09-27T12:00:00Z", deletionScheduledForUtc: null as string | null,
};
const company = {
  id: "company-delta", name: "Delta S.A.", taxId: null, timeZoneId: "America/Argentina/Buenos_Aires",
  status: "Active" as const, memberCount: 1, version: 3, createdAtUtc: "2026-09-27T12:00:00Z",
};
const role = (id: string, name: string, scope: "Organization" | "AnyCompany" | "SpecificCompany") => ({
  id, name, isSystemRole: false, scope, companyId: scope === "SpecificCompany" ? company.id : null, description: null,
  userCount: 0, permissions: [], version: 1, createdAtUtc: "2026-09-27T12:00:00Z",
});
const page = <T,>(items: T[]) => ({ items, page: 1, pageSize: 100, totalCount: items.length, totalPages: 1, hasPrevious: false, hasNext: false });

function api(user: typeof member, writes: { put?: unknown[]; deleted?: string[] } = {}) {
  server.use(
    http.get("/api/users/member-1", () => HttpResponse.json(user)),
    http.get("/api/roles/paged", ({ request }) => HttpResponse.json(page(new URL(request.url).searchParams.get("scope") === "Organization"
      ? [{ ...role("role-owner", "Dueño", "Organization"), isSystemRole: true }, { ...role("role-support", "Soporte", "Organization"), description: "Atiende las consultas." }]
      : [{ ...role("role-company-manager", "Administrador", "AnyCompany"), description: "Administra la empresa: sus miembros y sus roles." }]))),
    http.get("/api/companies/paged", () => HttpResponse.json(page([company]))),
    http.put("/api/users/member-1", async ({ request }) => { writes.put?.push(await request.json()); return new HttpResponse(null, { status: 204 }); }),
    http.delete("/api/users/member-1", ({ request }) => { writes.deleted?.push(new URL(request.url).search); return new HttpResponse(null, { status: 204 }); }),
    http.delete("/api/users/invitations/inv-1", () => { writes.deleted?.push("invitation"); return new HttpResponse(null, { status: 204 }); }),
  );
}

// En jsdom, después de cerrar un diálogo, Radix a veces ignora el clic del puntero (en Chrome abre igual):
// los menús y desplegables se abren con foco y Enter, como en Page.test y RowActions.test.
async function open(user: ReturnType<typeof userEvent.setup>, element: HTMLElement) {
  element.focus();
  await user.keyboard("{Enter}");
}

function subline(name: string) {
  return screen.getByRole("heading", { level: 1, name }).parentElement!.querySelector("[data-slot='page-subline']")!;
}

// La ficha de Lucía con un 409 de concurrencia al guardar sus empresas. Cuenta las lecturas de la ficha.
function conflictOnCompanies() {
  const reads = { user: 0 };
  api(member);
  server.use(
    http.get("/api/users/member-1", () => { reads.user += 1; return HttpResponse.json(member); }),
    http.put("/api/users/member-1", () => HttpResponse.json({ status: 409, code: "General.ConcurrencyConflict", title: "Conflicto",
      detail: "Otra persona cambió esto. Revisá la versión más reciente antes de guardar." }, { status: 409 })),
  );
  return reads;
}

// Como el back (concurrencia.md): guarda solo con la versión vigente, si no responde 409, y cada escritura sube la
// versión y deja las empresas que llegaron. `current` es lo que tiene el servidor: la prueba lo cambia para simular a
// otra persona. `writes` junta lo que llegó.
function versionedApi(initial: typeof member) {
  const backend = { current: initial, writes: [] as Array<{ version: number; roleIds: string[]; companies: Array<{ companyId: string; roleIds: string[] }> }> };
  api(initial);
  server.use(
    http.get("/api/users/member-1", () => HttpResponse.json(backend.current)),
    http.get("/api/roles/paged", ({ request }) => HttpResponse.json(page(new URL(request.url).searchParams.get("scope") === "Organization"
      ? [{ ...role("role-owner", "Dueño", "Organization"), isSystemRole: true }, role("role-support", "Soporte", "Organization")]
      : [role("role-company-manager", "Administrador", "AnyCompany"), role("role-seller", "Vendedor", "AnyCompany")]))),
    http.put("/api/users/member-1", async ({ request }) => {
      const body = await request.json() as (typeof backend.writes)[number];
      backend.writes.push(body);
      if (body.version !== backend.current.version) return HttpResponse.json({ status: 409, code: "General.ConcurrencyConflict", title: "Conflicto",
        detail: "Otra persona cambió esto. Revisá la versión más reciente antes de guardar." }, { status: 409 });
      backend.current = { ...backend.current, version: backend.current.version + 1, companies: body.companies.map((assignment) => ({
        companyId: assignment.companyId, companyName: company.name, status: "Active" as const, roles: [] })) };
      return new HttpResponse(null, { status: 204 });
    }),
  );
  return backend;
}

async function addCompanyWithConflict(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole("button", { name: "Sumar empresa" }));
  const dialog = await screen.findByRole("dialog", { name: "Sumar empresa" });
  await open(user, within(dialog).getByRole("combobox", { name: "Empresa" }));
  await user.click(await screen.findByRole("option", { name: "Delta S.A." }));
  await user.click(within(dialog).getByRole("button", { name: "Sumar" }));
  await within(dialog).findByRole("alert");
  return dialog;
}

// La ruta carga la pantalla con lazyPage: se importa antes de las pruebas para que la primera no pague, dentro de su
// límite, la carga del módulo, que con la máquina cargada la pasaba de 5 s.
beforeAll(async () => { await import("./UserDetailPage"); });

beforeEach(async () => {
  await configureI18n(referenceDataFixture().cultures);
  await changeCulture("es-AR");
});

describe("UserDetailPage (tablero Usuario)", () => {
  // Tablero M-Usuario: en el teléfono el correo va debajo del nombre; el estado y los roles son filas con › que abren
  // una hoja para elegir, y las empresas, una tarjeta con «Sumar empresa» en texto.
  it("en el teléfono el estado y los roles se eligen en una hoja", async () => {
    const restore = asPhone();
    try {
      const user = userEvent.setup();
      api({ ...member, roles: [] });
      renderRouteWithProviders("/org/usuarios/member-1", { as: "business-e6-admin" });

      const bar = (await screen.findByRole("heading", { level: 1, name: "Lucía Fernández" })).closest("header")!;
      expect(bar).toHaveTextContent("lucia@example.com");
      const access = screen.getByRole("region", { name: "Acceso a la organización" });
      const rolesRow = await within(access).findByRole("button", { name: /Roles de la organización/ });
      expect(rolesRow).toHaveTextContent("Ninguno");

      // Tablero M-Usuario (v99, «Elegir el estado»): cada estado en una fila, sin descripción; el elegido va en petróleo
      // y con tilde, sin el círculo de la opción, y elegir otro cierra la hoja.
      await user.click(within(access).getByRole("button", { name: /Estado/ }));
      const stateSheet = await screen.findByRole("dialog", { name: "Estado" });
      const active = within(stateSheet).getByRole("radio", { name: "Activo" });
      expect(active).toBeChecked();
      expect(active).toHaveClass("sr-only");
      expect(active.closest("label")).toHaveClass("min-h-[52px]", "text-[16px]", "font-medium", "text-[var(--marca-tx)]");
      expect(active.closest("label")!.querySelector("[data-slot='tilde']")).not.toBeNull();
      expect(within(stateSheet).getByRole("radio", { name: "Deshabilitado" }).closest("label")!.querySelector("[data-slot='tilde']")).toBeNull();
      expect(stateSheet).not.toHaveTextContent("Entra a la organización");
      await user.click(within(stateSheet).getByRole("radio", { name: "Deshabilitado" }));
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      expect(within(access).getByRole("button", { name: /Estado/ })).toHaveTextContent("Deshabilitado");
      // Como Configuración en el teléfono (tablero M-Avisos): con cambios, la barra dice «Cambios sin guardar».
      expect(bar).toHaveTextContent("Cambios sin guardar");
      expect(bar).not.toHaveTextContent("lucia@example.com");

      // Tablero M-Usuario (v99, «Elegir los roles»): la casilla a la izquierda de cada rol, sin «Todos», y «Listo» cierra
      // la hoja. Lo elegido queda en la ficha hasta guardar.
      await user.click(rolesRow);
      const rolesSheet = await screen.findByRole("dialog", { name: "Roles de la organización" });
      expect(within(rolesSheet).queryByRole("checkbox", { name: "Todos" })).not.toBeInTheDocument();
      const support = within(rolesSheet).getByRole("checkbox", { name: "Soporte" });
      expect(support).toHaveClass("size-[22px]", "rounded-[6px]");
      expect(support.compareDocumentPosition(within(rolesSheet).getByText("Soporte")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      await user.click(support);
      expect(support).toBeChecked();
      expect(support.closest("label")).toHaveClass("text-[var(--marca-tx)]");
      await user.click(within(rolesSheet).getByRole("button", { name: "Listo" }));
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      expect(rolesRow).toHaveTextContent("Soporte");
      expect(bar).toHaveTextContent("Cambios sin guardar");

      const companies = screen.getByRole("region", { name: "Empresas" });
      expect(within(companies).getByRole("button", { name: "Sumar empresa" })).toHaveClass("text-[var(--marca-tx)]");
      expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeEnabled();
    } finally {
      restore();
    }
  // Límite de 10 s: es la primera prueba del archivo y recorre las dos hojas del teléfono; con la máquina cargada pasaba
  // los 5 s.
  }, 10_000);

  it("muestra el estado en la banda, el ⋮ y «Guardar cambios» apagado sin cambios", async () => {
    api(member);
    const { container } = renderRouteWithProviders("/org/usuarios/member-1", { as: "business-e6-admin" });

    expect(await screen.findByRole("heading", { level: 1, name: "Lucía Fernández" })).toBeVisible();
    await waitFor(() => expect(subline("Lucía Fernández")).toHaveTextContent(/^Activo · lucia@example\.com · desde el 27\/09\/2026$/));
    expect(screen.getByRole("button", { name: "Más acciones" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Descartar cambios" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Deshabilitar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Quitar de la organización" })).not.toBeInTheDocument();
    const access = screen.getByRole("region", { name: "Acceso a la organización" });
    expect(within(access).getByRole("combobox", { name: "Estado" })).toHaveTextContent("Activo");
    expect(within(access).getByRole("button", { name: "Roles de la organización" })).toBeVisible();
    expect(within(access).getByRole("checkbox", { name: "Todos" })).not.toBeChecked();
    expect(within(access).queryByText("lucia@example.com")).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  // Límite de 10 s: revisa con axe la ficha entera, que con la máquina cargada pasaba los 5 s.
  }, 10_000);

  // Tablero Usuario (el desplegable de roles abierto): cada rol con su casilla y, debajo, su descripción; también los
  // roles de una empresa en «Sumar empresa».
  it("el desplegable de roles de la compu muestra la descripción de cada rol", async () => {
    const user = userEvent.setup();
    api(member);
    renderRouteWithProviders("/org/usuarios/member-1", { as: "business-e6-admin" });
    await screen.findByRole("heading", { level: 1, name: "Lucía Fernández" });

    await open(user, await screen.findByRole("button", { name: "Roles de la organización" }));
    expect(await screen.findByRole("menuitemcheckbox", { name: "Soporte" })).toHaveAccessibleDescription("Atiende las consultas.");
    expect(screen.getByRole("menuitemcheckbox", { name: "Dueño" })).not.toHaveAccessibleDescription();
    await user.keyboard("{Escape}");

    await user.click(screen.getByRole("button", { name: "Sumar empresa" }));
    const dialog = await screen.findByRole("dialog", { name: "Sumar empresa" });
    await open(user, within(dialog).getByRole("combobox", { name: "Empresa" }));
    await user.click(await screen.findByRole("option", { name: "Delta S.A." }));
    await open(user, within(dialog).getByRole("button", { name: "Roles en la empresa" }));
    expect(await screen.findByRole("menuitemcheckbox", { name: "Administrador" })).toHaveAccessibleDescription("Administra la empresa: sus miembros y sus roles.");
  });

  it("las migas siguen el camino hasta la persona", async () => {
    api(member);
    renderRouteWithProviders("/org/usuarios/member-1", { as: "business-e6-admin" });

    await waitFor(() => expect(screen.getByRole("navigation", { name: "Migas de pan" })).toHaveTextContent("Inicio/Gestión de usuarios/Usuarios/Lucía Fernández"));
  });

  // errores.md: un 404 en una ficha (también un id de otra organización) es «No encontramos esta página», como Error-Org.
  it("si la persona no existe, dice que no encontramos la página y lleva al inicio", async () => {
    api(member);
    server.use(http.get("/api/users/member-1", () => HttpResponse.json(
      { status: 404, code: "Tenancy.Member.NotFound", title: "No encontrado", detail: "No encontramos a esa persona." }, { status: 404 })));
    renderRouteWithProviders("/org/usuarios/member-1", { as: "business-e6-admin" });

    expect(await screen.findByRole("heading", { name: "No encontramos esta página" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Ir al inicio" })).toHaveAttribute("href", "/org");
    expect(screen.queryByRole("button", { name: "Reintentar" })).not.toBeInTheDocument();
  });

  // «Criterio · Avisos» (Pantalla de error): si la ficha no carga, no se puede mostrar nada; «Reintentar» la vuelve a pedir.
  it("si la ficha no carga, dice que no se pudo abrir y «Reintentar» la vuelve a pedir", async () => {
    const user = userEvent.setup();
    api(member);
    let fail = true;
    server.use(http.get("/api/users/member-1", () => fail
      ? HttpResponse.json({ status: 500, title: "Error", traceId: "00-abc-01" }, { status: 500 })
      : HttpResponse.json(member)));
    renderRouteWithProviders("/org/usuarios/member-1", { as: "business-e6-admin" });

    expect(await screen.findByRole("heading", { name: "No pudimos abrir esta pantalla" })).toBeVisible();
    fail = false;
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Lucía Fernández" })).toBeVisible();
  });

  it("deshabilita desde Estado: confirma y guarda estado y roles en un solo pedido", async () => {
    const user = userEvent.setup();
    const put: unknown[] = [];
    api(member, { put });
    renderRouteWithProviders("/org/usuarios/member-1", { as: "business-e6-admin" });
    await screen.findByRole("heading", { level: 1, name: "Lucía Fernández" });

    await open(user, screen.getByRole("combobox", { name: "Estado" }));
    await user.click(await screen.findByRole("option", { name: /Deshabilitado/ }));
    expect(subline("Lucía Fernández")).toHaveTextContent(/^Deshabilitado · Cambios sin guardar · lucia@example\.com/);
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    const dialog = await screen.findByRole("dialog", { name: "¿Deshabilitar a Lucía Fernández?" });
    expect(dialog).toHaveTextContent("Deja de entrar a Empresa A y a sus empresas. Su cuenta y su perfil personal siguen funcionando.");
    await user.click(within(dialog).getByRole("button", { name: "Deshabilitar y guardar" }));
    await waitFor(() => expect(put).toEqual([{ isActive: false, roleIds: ["role-owner"], companies: [], version: 2 }]));
    expect(await screen.findByText("Guardamos los cambios de Lucía Fernández.")).toBeVisible();
  });

  it("«Descartar cambios» vuelve a lo guardado", async () => {
    const user = userEvent.setup();
    api(member);
    renderRouteWithProviders("/org/usuarios/member-1", { as: "business-e6-admin" });
    await screen.findByRole("heading", { level: 1, name: "Lucía Fernández" });

    await open(user, screen.getByRole("combobox", { name: "Estado" }));
    await user.click(await screen.findByRole("option", { name: /Deshabilitado/ }));
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Descartar cambios" }));
    expect(screen.getByRole("combobox", { name: "Estado" })).toHaveTextContent("Activo");
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeDisabled();
  });

  it("quita de la organización desde el ⋮, con el aviso de sus correos administrados", async () => {
    const user = userEvent.setup();
    const deleted: string[] = [];
    api({ ...member, hasManagedEmail: true, email: "lucia@delta.ejemplo.com" }, { deleted });
    renderRouteWithProviders("/org/usuarios/member-1", { as: "business-e6-admin" });
    await screen.findByRole("heading", { level: 1, name: "Lucía Fernández" });

    await open(user, screen.getByRole("button", { name: "Más acciones" }));
    await user.click(await screen.findByRole("menuitem", { name: "Quitar de la organización" }));
    const dialog = await screen.findByRole("dialog", { name: "¿Quitar a Lucía Fernández de Empresa A?" });
    expect(dialog).toHaveTextContent("Deja de entrar a Empresa A y a sus empresas, y pierde sus roles. Sus correos de delta.ejemplo.com dejan de servirle para ingresar; se lo avisamos por sus otros métodos de ingreso. Su cuenta y su perfil personal siguen funcionando.");
    await user.click(within(dialog).getByRole("button", { name: "Quitar" }));
    await waitFor(() => expect(deleted).toEqual(["?version=2"]));
    expect(await screen.findByText("Quitamos a Lucía Fernández de Empresa A.")).toBeVisible();
  });

  it("invitación: estado fijo, vencimiento en la banda y ⋮ con Reenviar y Revocar", async () => {
    const user = userEvent.setup();
    const deleted: string[] = [];
    api({ ...member, userId: null, displayName: "", email: "sofia@example.com", state: "Invited" as never,
      roles: [], invitationId: "inv-1", invitationIssuedAtUtc: "2026-09-25T12:00:00Z", invitationExpiresAtUtc: "2026-10-02T12:00:00Z" }, { deleted });
    renderRouteWithProviders("/org/usuarios/member-1", { as: "business-e6-admin" });

    expect(await screen.findByRole("heading", { level: 1, name: "sofia@example.com" })).toBeVisible();
    await waitFor(() => expect(subline("sofia@example.com")).toHaveTextContent(/^Invitación pendiente · sofia@example\.com · vence el 02\/10\/2026$/));
    const access = screen.getByRole("region", { name: "Acceso a la organización" });
    expect(within(access).queryByRole("combobox", { name: "Estado" })).not.toBeInTheDocument();
    expect(within(access).getByText("Invitación pendiente")).toBeVisible();

    await open(user, screen.getByRole("button", { name: "Más acciones" }));
    expect((await screen.findAllByRole("menuitem")).map((item) => item.textContent)).toEqual(["Reenviar invitación", "Revocar invitación"]);
    await user.click(screen.getByRole("menuitem", { name: "Revocar invitación" }));
    const dialog = await screen.findByRole("dialog", { name: "¿Revocar la invitación a sofia@example.com?" });
    expect(dialog).toHaveTextContent("El enlace deja de funcionar. Podés volver a invitarla cuando quieras.");
    await user.click(within(dialog).getByRole("button", { name: "Revocar" }));
    await waitFor(() => expect(deleted).toEqual(["invitation"]));
    expect(await screen.findByText("Revocamos la invitación a sofia@example.com.")).toBeVisible();
  });

  it("baja pedida: cartel con la fecha, «Quitar de la organización» a la vista y nada editable", async () => {
    api({ ...member, state: "PendingDeletion" as never, deletionScheduledForUtc: "2026-10-27T15:00:00Z",
      companies: [{ companyId: company.id, companyName: company.name, status: "Active", roles: [] }] });
    renderRouteWithProviders("/org/usuarios/member-1", { as: "business-e6-admin" });

    await screen.findByRole("heading", { level: 1, name: "Lucía Fernández" });
    expect((await screen.findByText(/Pidió la baja de su cuenta/)).closest("[role=status]")).toHaveTextContent("Pidió la baja de su cuenta. Se elimina el 27/10/2026.");
    expect(screen.getByRole("button", { name: "Quitar de la organización" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Guardar cambios" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Descartar cambios" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Más acciones" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Roles de la organización" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sumar empresa" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Acciones de Delta S.A." })).not.toBeInTheDocument();
  });

  // «Criterio · Botones» y tablero Usuario (v104): «Sumar» nunca se apaga; sin empresa, el campo queda en rojo con
  // «Elegí una empresa.» y se limpia al elegir una.
  it("«Sumar» sin empresa marca el campo con «Elegí una empresa.» y se limpia al elegir una", async () => {
    const user = userEvent.setup();
    const writes = { put: [] as unknown[] };
    api(member, writes);
    renderRouteWithProviders("/org/usuarios/member-1", { as: "business-e6-admin" });

    await user.click(await screen.findByRole("button", { name: "Sumar empresa" }));
    const dialog = await screen.findByRole("dialog", { name: "Sumar empresa" });
    const add = within(dialog).getByRole("button", { name: "Sumar" });
    expect(add).toBeEnabled();
    await user.click(add);

    const company = within(dialog).getByRole("combobox", { name: "Empresa" });
    expect(company).toHaveAttribute("aria-invalid", "true");
    expect(company).toHaveAccessibleDescription("Elegí una empresa.");
    expect(writes.put).toHaveLength(0);

    await open(user, company);
    await user.click(await screen.findByRole("option", { name: "Delta S.A." }));
    expect(within(dialog).queryByText("Elegí una empresa.")).not.toBeInTheDocument();
    expect(company).not.toHaveAttribute("aria-invalid");
  });

  it("suma una empresa desde el diálogo y la guarda al momento", async () => {
    const user = userEvent.setup();
    const put: unknown[] = [];
    api(member, { put });
    renderRouteWithProviders("/org/usuarios/member-1", { as: "business-e6-admin" });
    await screen.findByRole("heading", { level: 1, name: "Lucía Fernández" });
    expect(screen.getByText("No está en ninguna empresa.")).toBeVisible();

    await user.click(await screen.findByRole("button", { name: "Sumar empresa" }));
    const dialog = await screen.findByRole("dialog", { name: "Sumar empresa" });
    // Tablero Usuario (v100): «Empresa» es obligatoria, con asterisco; «Roles en la empresa» es opcional, sin asterisco,
    // y aparece al elegir la empresa. El cuerpo es el de los diálogos (en el teléfono, el de la hoja de M-Usuario-Empresa).
    const labels = () => [...dialog.querySelectorAll("label")].map((label) => label.textContent);
    const companyField = within(dialog).getByRole("combobox", { name: "Empresa" });
    expect(labels()).toContain("Empresa *");
    expect(companyField.closest("[data-slot='dialog-body']")).not.toBeNull();
    expect(within(dialog).queryByRole("button", { name: "Roles en la empresa" })).not.toBeInTheDocument();
    await open(user, companyField);
    await user.click(await screen.findByRole("option", { name: "Delta S.A." }));
    expect(within(dialog).getByRole("button", { name: "Roles en la empresa" })).toBeVisible();
    expect(labels()).toContain("Roles en la empresa");
    await open(user, within(dialog).getByRole("button", { name: "Roles en la empresa" }));
    await user.click(await screen.findByRole("menuitemcheckbox", { name: "Administrador" }));
    await user.keyboard("{Escape}");
    await user.click(within(dialog).getByRole("button", { name: "Sumar" }));

    await waitFor(() => expect(put).toEqual([{ roleIds: ["role-owner"], companies: [{ companyId: company.id, roleIds: ["role-company-manager"] }], version: 2 }]));
    expect(await screen.findByText("Sumamos a Lucía Fernández a Delta S.A.")).toBeVisible();
  });

  it("cada empresa es una fila con sus roles y el ⋮ «Cambiar roles» y «Quitar de la empresa»", async () => {
    const user = userEvent.setup();
    const put: unknown[] = [];
    api({ ...member, companies: [{ companyId: company.id, companyName: company.name, status: "Active",
      roles: [{ id: "role-company-manager", name: "Administrador", isSystemRole: false, scope: "AnyCompany" as never, companyId: null }] }] }, { put });
    renderRouteWithProviders("/org/usuarios/member-1", { as: "business-e6-admin" });
    await screen.findByRole("heading", { level: 1, name: "Lucía Fernández" });

    const companies = screen.getByRole("region", { name: "Empresas" });
    expect(within(companies).getByText("Delta S.A.")).toBeVisible();
    expect(within(companies).getByText("Administrador")).toBeVisible();
    await open(user, within(companies).getByRole("button", { name: "Acciones de Delta S.A." }));
    expect((await screen.findAllByRole("menuitem")).map((item) => item.textContent)).toEqual(["Cambiar roles", "Quitar de la empresa"]);
    await user.click(screen.getByRole("menuitem", { name: "Quitar de la empresa" }));
    await waitFor(() => expect(put).toEqual([{ roleIds: ["role-owner"], companies: [], version: 2 }]));
    expect(await screen.findByText("Quitamos a Lucía Fernández de Delta S.A.")).toBeVisible();
  });

  // accesibilidad.md: la opción del ⋮ se va con el menú; el diálogo que abre le devuelve el foco al ⋮ de la fila.
  it("«Cambiar roles» del ⋮ le devuelve el foco al ⋮ de la fila al cerrarse", async () => {
    const user = userEvent.setup();
    api({ ...member, companies: [{ companyId: company.id, companyName: company.name, status: "Active", roles: [] }] });
    renderRouteWithProviders("/org/usuarios/member-1", { as: "business-e6-admin" });
    await screen.findByRole("heading", { level: 1, name: "Lucía Fernández" });

    const actions = within(screen.getByRole("region", { name: "Empresas" })).getByRole("button", { name: "Acciones de Delta S.A." });
    await open(user, actions);
    await user.click(await screen.findByRole("menuitem", { name: "Cambiar roles" }));
    const dialog = await screen.findByRole("dialog", { name: "Roles en Delta S.A." });
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(actions).toHaveFocus());
  });

  // Sacar un rol y volver a ponerlo deja lo guardado: no hay «Cambios sin guardar» ni nada para guardar.
  it("sacar un rol y volver a ponerlo no cuenta como un cambio", async () => {
    const user = userEvent.setup();
    api({ ...member, roles: [ownerRole, { ...ownerRole, id: "role-support", name: "Soporte", isSystemRole: false }] });
    renderRouteWithProviders("/org/usuarios/member-1", { as: "business-e6-admin" });
    await screen.findByRole("heading", { level: 1, name: "Lucía Fernández" });

    await open(user, screen.getByRole("button", { name: "Roles de la organización" }));
    await user.click(await screen.findByRole("menuitemcheckbox", { name: "Dueño" }));
    await user.keyboard("{Escape}");
    expect(subline("Lucía Fernández")).toHaveTextContent(/Cambios sin guardar/);
    await open(user, screen.getByRole("button", { name: "Roles de la organización" }));
    await user.click(await screen.findByRole("menuitemcheckbox", { name: "Dueño" }));
    await user.keyboard("{Escape}");
    expect(subline("Lucía Fernández")).not.toHaveTextContent(/Cambios sin guardar/);
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeDisabled();
  });

  it("muestra en la franja el error del último Dueño y el conflicto de concurrencia", async () => {
    const user = userEvent.setup();
    api(member);
    server.use(http.put("/api/users/member-1", () => HttpResponse.json(
      { status: 409, code: "Tenancy.Member.LastTenantAdmin", title: "Conflicto", detail: "Tiene que quedar al menos un Dueño activo." }, { status: 409 })));
    renderRouteWithProviders("/org/usuarios/member-1", { as: "business-e6-admin" });
    await screen.findByRole("heading", { level: 1, name: "Lucía Fernández" });

    await open(user, screen.getByRole("button", { name: "Roles de la organización" }));
    await user.click(await screen.findByRole("menuitemcheckbox", { name: "Dueño" }));
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(await screen.findByText("Tiene que quedar al menos un Dueño activo.")).toBeVisible();

    server.use(http.put("/api/users/member-1", () => HttpResponse.json(
      { status: 409, code: "General.ConcurrencyConflict", title: "Conflicto", detail: "La ficha cambió." }, { status: 409 })));
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(await screen.findByText(/Otra persona cambió esto mientras lo editabas/)).toBeVisible();
  });

  // Tablero M-Usuario (v106, «Error al guardar»): en el teléfono, el error de guardado, con el texto del back, va en la
  // banda roja pegada debajo de la barra, y la barra sigue diciendo «Cambios sin guardar».
  it("en el teléfono, el error al guardar va en la banda debajo de la barra", async () => {
    const restore = asPhone();
    try {
      const user = userEvent.setup();
      api(member);
      server.use(http.put("/api/users/member-1", () => HttpResponse.json(
        { status: 409, code: "Tenancy.Member.LastTenantAdmin", title: "Conflicto", detail: "Tiene que quedar al menos un Dueño activo." }, { status: 409 })));
      renderRouteWithProviders("/org/usuarios/member-1", { as: "business-e6-admin" });

      const bar = (await screen.findByRole("heading", { level: 1, name: "Lucía Fernández" })).closest("header")!;
      await user.click(await screen.findByRole("button", { name: /Roles de la organización/ }));
      const sheet = await screen.findByRole("dialog", { name: "Roles de la organización" });
      await user.click(within(sheet).getByRole("checkbox", { name: "Dueño" }));
      await user.click(within(sheet).getByRole("button", { name: "Listo" }));
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

      const band = await screen.findByRole("alert");
      expect(band).toHaveTextContent("Tiene que quedar al menos un Dueño activo.");
      expect(bar.nextElementSibling).toBe(band);
      expect(band).not.toHaveClass("rounded-xl");
      expect(bar).toHaveTextContent("Cambios sin guardar");
    } finally {
      restore();
    }
  });

  // Tablero Usuario («Lucía (vos)»): el back dice lo mismo por cualquier camino (decisión 29); si la última Dueña se
  // saca el rol ella misma, la franja le dice qué hacer.
  it("si la última Dueña se saca el rol, la franja le dice que se lo dé a otra persona antes", async () => {
    const user = userEvent.setup();
    api({ ...member, userId: "ana" });
    server.use(http.put("/api/users/member-1", () => HttpResponse.json(
      { status: 409, code: "Tenancy.Member.LastTenantAdmin", title: "Conflicto", detail: "Tiene que quedar al menos un Dueño activo." }, { status: 409 })));
    renderRouteWithProviders("/org/usuarios/member-1", { as: "business-e6-admin" });
    await screen.findByRole("heading", { level: 1, name: "Lucía Fernández" });

    await open(user, screen.getByRole("button", { name: "Roles de la organización" }));
    await user.click(await screen.findByRole("menuitemcheckbox", { name: "Dueño" }));
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Tiene que quedar al menos un Dueño. Dale el rol a otra persona antes de quitártelo.");
    expect(screen.queryByText("Tiene que quedar al menos un Dueño activo.")).not.toBeInTheDocument();
  });

  // Tablero Usuario («Lucía (vos)»): si la última Dueña se quita de la organización, la franja de la ficha (no el aviso de
  // abajo) le dice que antes le dé el rol a otra persona.
  it("si la última Dueña sale de la organización, la franja le dice que se lo dé a otra persona antes", async () => {
    const user = userEvent.setup();
    api({ ...member, userId: "ana" });
    server.use(http.delete("/api/users/member-1", () => HttpResponse.json(
      { status: 409, code: "Tenancy.Member.LastTenantAdmin", title: "Conflicto", detail: "Tiene que quedar al menos un Dueño activo." }, { status: 409 })));
    renderRouteWithProviders("/org/usuarios/member-1", { as: "business-e6-admin" });
    await screen.findByRole("heading", { level: 1, name: "Lucía Fernández" });

    await open(user, screen.getByRole("button", { name: "Más acciones" }));
    await user.click(await screen.findByRole("menuitem", { name: "Quitar de la organización" }));
    const dialog = await screen.findByRole("dialog", { name: "¿Quitar a Lucía Fernández de Empresa A?" });
    await user.click(within(dialog).getByRole("button", { name: "Quitar" }));

    const leaving = "Tiene que quedar al menos un Dueño. Dale el rol a otra persona antes de salir de la organización.";
    expect(await within(screen.getByRole("main")).findByRole("alert")).toHaveTextContent(leaving);
    expect(within(screen.getByRole("region", { name: /^Notificaciones/ })).queryByText(leaving)).not.toBeInTheDocument();
    expect(screen.queryByText("Tiene que quedar al menos un Dueño activo.")).not.toBeInTheDocument();
  });

  // Tableros Usuario y Avisos: con cambios, un enlace del menú pregunta «¿Salir sin guardar?».
  it("con cambios, salir por el menú pregunta «¿Salir sin guardar?»", async () => {
    const user = userEvent.setup();
    api(member);
    const { router } = renderRouteWithProviders("/org/usuarios/member-1", { as: "business-e6-admin" });
    await screen.findByRole("heading", { level: 1, name: "Lucía Fernández" });

    await open(user, screen.getByRole("button", { name: "Roles de la organización" }));
    await user.click(await screen.findByRole("menuitemcheckbox", { name: "Soporte" }));
    await user.keyboard("{Escape}");
    expect(subline("Lucía Fernández")).toHaveTextContent(/^Activo · Cambios sin guardar · lucia@example\.com/);

    await user.click(screen.getByRole("link", { name: "Empresas" }));
    expect(await screen.findByRole("dialog", { name: "¿Salir sin guardar?" })).toBeVisible();
    expect(router.state.location.pathname).toBe("/org/usuarios/member-1");
  });

  // Después de un 409 en un diálogo, la ficha quedó vieja: al cerrarlo se vuelve a leer, salvo que haya cambios sin guardar
  // (esos se conservan y el próximo «Guardar cambios» muestra el cartel del 409 con «Ver lo nuevo»).
  it("después de un 409 en el diálogo, al cerrarlo sin cambios la ficha se vuelve a leer", async () => {
    const user = userEvent.setup();
    const reads = conflictOnCompanies();
    renderRouteWithProviders("/org/usuarios/member-1", { as: "business-e6-admin" });
    await screen.findByRole("heading", { level: 1, name: "Lucía Fernández" });

    const dialog = await addCompanyWithConflict(user);
    const before = reads.user;
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Sumar empresa" })).not.toBeInTheDocument());
    await waitFor(() => expect(reads.user).toBeGreaterThan(before));
  });

  it("después de un 409 en el diálogo, con cambios sin guardar, cerrarlo no relee la ficha y conserva lo elegido", async () => {
    const user = userEvent.setup();
    const reads = conflictOnCompanies();
    renderRouteWithProviders("/org/usuarios/member-1", { as: "business-e6-admin" });
    await screen.findByRole("heading", { level: 1, name: "Lucía Fernández" });
    await open(user, screen.getByRole("button", { name: "Roles de la organización" }));
    await user.click(await screen.findByRole("menuitemcheckbox", { name: "Soporte" }));
    await user.keyboard("{Escape}");

    const dialog = await addCompanyWithConflict(user);
    const before = reads.user;
    await user.keyboard("{Escape}");
    await waitFor(() => expect(within(document.body).queryByRole("dialog", { name: "Sumar empresa" })).not.toBeInTheDocument());
    expect(dialog).not.toBeInTheDocument();
    expect(subline("Lucía Fernández")).toHaveTextContent(/Cambios sin guardar/);
    expect(reads.user).toBe(before);
  });

  // «Criterio · Diálogos»: el error general de un diálogo va arriba de sus botones; el 409 también, una sola vez y sin el
  // cartel de la ficha. Al cerrar el diálogo, no queda nada.
  it("un 409 al sumar una empresa va en la franja del diálogo, arriba de los botones, y en ningún otro lado", async () => {
    const user = userEvent.setup();
    api(member);
    server.use(http.put("/api/users/member-1", () => HttpResponse.json({ status: 409, code: "General.ConcurrencyConflict", title: "Conflicto",
      detail: "Otra persona cambió esto. Revisá la versión más reciente antes de guardar." }, { status: 409 })));
    renderRouteWithProviders("/org/usuarios/member-1", { as: "business-e6-admin" });
    await screen.findByRole("heading", { level: 1, name: "Lucía Fernández" });

    await user.click(await screen.findByRole("button", { name: "Sumar empresa" }));
    const dialog = await screen.findByRole("dialog", { name: "Sumar empresa" });
    // «Criterio · Diálogos»: dos campos, el diálogo chico de 420 px.
    expect(dialog).toHaveClass("md:max-w-[420px]");
    await open(user, within(dialog).getByRole("combobox", { name: "Empresa" }));
    await user.click(await screen.findByRole("option", { name: "Delta S.A." }));
    await user.click(within(dialog).getByRole("button", { name: "Sumar" }));

    const alert = await within(dialog).findByRole("alert");
    expect(alert).toHaveTextContent("Otra persona cambió esto. Revisá la versión más reciente antes de guardar.");
    expect(alert.compareDocumentPosition(within(dialog).getByRole("button", { name: "Cancelar" })) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getAllByRole("alert", { hidden: true })).toHaveLength(1);
    expect(screen.queryByText("Otra persona cambió esto mientras lo editabas.")).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Sumar empresa" })).not.toBeInTheDocument());
    expect(screen.queryAllByRole("alert", { hidden: true })).toHaveLength(0);
  });

  // concurrencia.md (E7): la relectura de fondo trae los roles que sumó otra persona, pero la ficha sigue con lo que se
  // empezó a editar; el guardado manda la versión de eso y sale el 409 en vez de sacarle el rol nuevo.
  it("una relectura de fondo no cambia la versión que manda «Guardar cambios»: sale el 409 y no pisa lo de la otra persona", async () => {
    const user = userEvent.setup();
    const backend = versionedApi(member);
    const { queryClient } = renderRouteWithProviders("/org/usuarios/member-1", { as: "business-e6-admin" });
    await screen.findByRole("heading", { level: 1, name: "Lucía Fernández" });

    backend.current = { ...member, roles: [ownerRole, { ...ownerRole, id: "role-support", name: "Soporte", isSystemRole: false }], version: 3 };
    await act(() => queryClient.invalidateQueries({ queryKey: userQueryKey("member-1") }));
    await open(user, screen.getByRole("combobox", { name: "Estado" }));
    await user.click(await screen.findByRole("option", { name: /Deshabilitado/ }));
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Deshabilitar y guardar" }));

    expect(await screen.findByText("Otra persona cambió esto mientras lo editabas.")).toBeVisible();
    expect(backend.writes).toEqual([{ isActive: false, roleIds: ["role-owner"], companies: [], version: 2 }]);
  });

  // concurrencia.md (E7): «Cambiar roles» de una empresa arranca con lo que había al abrirlo; si mientras tanto otra
  // persona le cambió esos roles, guardar da 409 en el diálogo en vez de pisarlos.
  it("«Cambiar roles» de una empresa manda la versión de cuando se abrió", async () => {
    const user = userEvent.setup();
    const withDelta = { ...member, companies: [{ companyId: company.id, companyName: company.name, status: "Active" as const, roles: [] as typeof ownerRole[] }] };
    const backend = versionedApi(withDelta);
    const { queryClient } = renderRouteWithProviders("/org/usuarios/member-1", { as: "business-e6-admin" });
    await screen.findByRole("heading", { level: 1, name: "Lucía Fernández" });
    await open(user, within(screen.getByRole("region", { name: "Empresas" })).getByRole("button", { name: "Acciones de Delta S.A." }));
    await user.click(await screen.findByRole("menuitem", { name: "Cambiar roles" }));
    const dialog = await screen.findByRole("dialog", { name: "Roles en Delta S.A." });

    const administrator = { ...ownerRole, id: "role-company-manager", name: "Administrador", isSystemRole: false };
    backend.current = { ...withDelta, companies: [{ ...withDelta.companies[0], roles: [administrator] }], version: 3 };
    await act(() => queryClient.invalidateQueries({ queryKey: userQueryKey("member-1") }));
    await open(user, within(dialog).getByRole("button", { name: "Roles en la empresa" }));
    await user.click(await screen.findByRole("menuitemcheckbox", { name: "Vendedor" }));
    await user.keyboard("{Escape}");
    await user.click(within(dialog).getByRole("button", { name: "Guardar" }));

    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Otra persona cambió esto. Revisá la versión más reciente antes de guardar.");
    expect(backend.writes).toEqual([{ roleIds: ["role-owner"], companies: [{ companyId: company.id, roleIds: ["role-seller"] }], version: 2 }]);
  });

  // Lo que se guarda al momento sobre la misma persona (sumar una empresa) parte de lo que se está editando: su relectura
  // pasa a ser la base, el acceso a medio editar se conserva y «Guardar cambios» no choca con la escritura propia.
  it("sumar una empresa con el acceso a medio editar no hace chocar después a «Guardar cambios»", async () => {
    const user = userEvent.setup();
    const backend = versionedApi(member);
    renderRouteWithProviders("/org/usuarios/member-1", { as: "business-e6-admin" });
    await screen.findByRole("heading", { level: 1, name: "Lucía Fernández" });
    await open(user, screen.getByRole("button", { name: "Roles de la organización" }));
    await user.click(await screen.findByRole("menuitemcheckbox", { name: "Soporte" }));
    await user.keyboard("{Escape}");

    await user.click(screen.getByRole("button", { name: "Sumar empresa" }));
    const dialog = await screen.findByRole("dialog", { name: "Sumar empresa" });
    await open(user, within(dialog).getByRole("combobox", { name: "Empresa" }));
    await user.click(await screen.findByRole("option", { name: "Delta S.A." }));
    await user.click(within(dialog).getByRole("button", { name: "Sumar" }));
    expect(await screen.findByText("Sumamos a Lucía Fernández a Delta S.A.")).toBeVisible();
    await waitFor(() => expect(within(screen.getByRole("region", { name: "Empresas" })).getByText("Delta S.A.")).toBeVisible());
    expect(subline("Lucía Fernández")).toHaveTextContent(/Cambios sin guardar/);
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(await screen.findByText("Guardamos los cambios de Lucía Fernández.")).toBeVisible();
    expect(backend.writes.map((write) => write.version)).toEqual([2, 3]);
    expect(backend.writes[1]).toMatchObject({ roleIds: ["role-owner", "role-support"], companies: [{ companyId: company.id, roleIds: [] }] });
    expect(screen.queryByText("Otra persona cambió esto mientras lo editabas.")).not.toBeInTheDocument();
  });
});
