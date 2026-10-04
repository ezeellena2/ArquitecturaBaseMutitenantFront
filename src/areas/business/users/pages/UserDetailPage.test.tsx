import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { configureI18n, changeCulture } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";
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
      ? [{ ...role("role-owner", "Dueño", "Organization"), isSystemRole: true }, role("role-support", "Soporte", "Organization")]
      : [role("role-company-manager", "Administrador", "AnyCompany")]))),
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

async function addCompanyWithConflict(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole("button", { name: "Sumar empresa" }));
  const dialog = await screen.findByRole("dialog", { name: "Sumar empresa" });
  await open(user, within(dialog).getByRole("combobox", { name: "Empresa" }));
  await user.click(await screen.findByRole("option", { name: "Delta S.A." }));
  await user.click(within(dialog).getByRole("button", { name: "Sumar" }));
  await within(dialog).findByRole("alert");
  return dialog;
}

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

      await user.click(within(access).getByRole("button", { name: /Estado/ }));
      const stateSheet = await screen.findByRole("dialog", { name: "Estado" });
      expect(within(stateSheet).getByRole("radio", { name: /Activo/ })).toBeChecked();
      await user.click(within(stateSheet).getByRole("radio", { name: /Deshabilitado/ }));
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      expect(within(access).getByRole("button", { name: /Estado/ })).toHaveTextContent("Deshabilitado");
      // Como Configuración en el teléfono (tablero M-Avisos): con cambios, la barra dice «Cambios sin guardar».
      expect(bar).toHaveTextContent("Cambios sin guardar");
      expect(bar).not.toHaveTextContent("lucia@example.com");

      await user.click(rolesRow);
      const rolesSheet = await screen.findByRole("dialog", { name: "Roles de la organización" });
      await user.click(within(rolesSheet).getByRole("checkbox", { name: "Soporte" }));
      await user.click(within(rolesSheet).getByRole("button", { name: "Cerrar" }));
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      expect(rolesRow).toHaveTextContent("Soporte");

      const companies = screen.getByRole("region", { name: "Empresas" });
      expect(within(companies).getByRole("button", { name: "Sumar empresa" })).toHaveClass("text-[var(--marca-tx)]");
      expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeEnabled();
    } finally {
      restore();
    }
  });

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
  });

  it("las migas siguen el camino hasta la persona", async () => {
    api(member);
    renderRouteWithProviders("/org/usuarios/member-1", { as: "business-e6-admin" });

    await waitFor(() => expect(screen.getByRole("navigation", { name: "Migas de pan" })).toHaveTextContent("Inicio/Gestión de usuarios/Usuarios/Lucía Fernández"));
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
  }, 10_000);

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
  }, 10_000);

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
  }, 10_000);

  // Tablero Usuario: si la última Dueña se quita de la organización, el aviso le dice que antes le dé el rol a otra persona.
  it("si la última Dueña sale de la organización, el aviso le dice que se lo dé a otra persona antes", async () => {
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

    expect(await screen.findByText("Tiene que quedar al menos un Dueño. Dale el rol a otra persona antes de salir de la organización.")).toBeVisible();
    expect(screen.queryByText("Tiene que quedar al menos un Dueño activo.")).not.toBeInTheDocument();
  }, 10_000);

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
  }, 10_000);

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
  }, 10_000);

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
  }, 10_000);

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
  }, 10_000);
});
