import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { configureI18n, changeCulture } from "@/shared/i18n";
import type { RoleResponse } from "@/shared/api/types";
import { server } from "@/test/mocks/server";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";
import { asPhone } from "@/test/utils/phone";

const role: RoleResponse = {
  id: "role-custom",
  name: "Solo lectura",
  description: "Ve los miembros. No cambia nada.",
  scope: "Organization",
  companyId: null,
  isSystemRole: false,
  userCount: 0,
  permissions: ["roles.read"],
  version: 4,
  createdAtUtc: "2026-09-27T12:00:00Z",
};

const permissionGroups = [
  { area: "roles", name: "Roles", permissions: [
    { code: "roles.read", name: "Ver roles", description: "Los roles y sus permisos." },
    { code: "roles.manage", name: "Administrar roles", description: "Crear, editar e inactivar roles." },
  ] },
  { area: "company", name: "Miembros de empresa", permissions: [
    { code: "company.members.read", name: "Ver miembros", description: "Miembros." },
    { code: "company.members.manage", name: "Administrar miembros", description: "Administrar miembros." },
  ] },
];

const companies = { items: [
  { id: "company-1", name: "Delta S.A.", taxId: null, timeZoneId: "America/Argentina/Buenos_Aires", status: "Active", memberCount: 1, version: 1, createdAtUtc: "2026-09-27T12:00:00Z" },
  { id: "company-2", name: "Delta Sur S.R.L.", taxId: null, timeZoneId: "America/Argentina/Buenos_Aires", status: "Active", memberCount: 1, version: 1, createdAtUtc: "2026-09-27T12:00:00Z" },
], page: 1, pageSize: 100, totalCount: 2, totalPages: 1, hasPrevious: false, hasNext: false };

beforeEach(async () => {
  await configureI18n(referenceDataFixture().cultures);
  await changeCulture("es-AR");
});

describe("RoleEditorPage", () => {
  // Límite de 10 s: escribe el nombre y la descripción con user-event y marca permisos; con toda la suite tarda unos 4 s.
  it("crea un rol organizacional con una escritura idempotente y los permisos elegidos", async () => {
    const user = userEvent.setup();
    let createBody: unknown;
    const created = { ...role, id: "role-created", name: "Operaciones", description: "Consulta los roles." };
    server.use(
      http.get("/api/permissions", () => HttpResponse.json(permissionGroups)),
      http.post("/api/roles", async ({ request }) => {
        createBody = await request.json();
        expect(request.headers.get("Idempotency-Key")).toMatch(/^[0-9a-f-]{36}$/i);
        return HttpResponse.json(created.id, { status: 201 });
      }),
      http.get("/api/roles/role-created", () => HttpResponse.json(created)),
    );

    const { container } = renderRouteWithProviders("/org/roles/nuevo", { as: "business-role-manager" });

    const name = await screen.findByRole("textbox", { name: "Nombre" });
    expect(name).toHaveAttribute("maxlength", "60");
    expect(await axe(container)).toHaveNoViolations();
    await user.type(name, "Operaciones");
    await user.type(screen.getByRole("textbox", { name: "Descripción" }), "Consulta los roles.");
    await user.click(screen.getByRole("combobox", { name: "Vale en" }));
    await user.click(await screen.findByRole("option", { name: "Toda la organización" }));
    await user.click(await screen.findByRole("button", { name: "Abrir o cerrar Roles" }));
    await user.click(await screen.findByRole("checkbox", { name: "Ver roles" }));
    await user.click(screen.getAllByRole("button", { name: "Crear rol" })[0]);

    expect(createBody).toMatchObject({ name: "Operaciones", scope: "Organization", companyId: null, permissions: ["roles.read"] });
    expect(await screen.findByRole("heading", { name: "Operaciones" })).toBeVisible();
  }, 10_000);

  // B2: el back guarda la respuesta de cada clave; con la misma clave y otro cuerpo daría 422 hasta recargar.
  // Límite de 10 s: escribe con user-event y guarda dos veces; con toda la suite tarda unos 2,6 s.
  it("después de un nombre repetido, corregirlo y crear de nuevo manda otra clave y crea el rol", async () => {
    const user = userEvent.setup();
    const sent: Array<{ key: string | null; name: unknown }> = [];
    const created = { ...role, id: "role-created", name: "Operaciones Sur" };
    server.use(
      http.get("/api/permissions", () => HttpResponse.json(permissionGroups)),
      http.post("/api/roles", async ({ request }) => {
        const body = await request.json() as { name?: unknown };
        sent.push({ key: request.headers.get("Idempotency-Key"), name: body.name });
        return sent.length === 1
          ? HttpResponse.json({ code: "Roles.Role.AlreadyExists", detail: "Ya existe un rol con ese nombre." }, { status: 409 })
          : HttpResponse.json(created.id, { status: 201 });
      }),
      http.get("/api/roles/role-created", () => HttpResponse.json(created)),
    );

    renderRouteWithProviders("/org/roles/nuevo", { as: "business-role-manager" });

    const name = await screen.findByRole("textbox", { name: "Nombre" });
    await user.type(name, "Operaciones");
    await user.click(screen.getByRole("combobox", { name: "Vale en" }));
    await user.click(await screen.findByRole("option", { name: "Toda la organización" }));
    await user.click(await screen.findByRole("button", { name: "Abrir o cerrar Roles" }));
    await user.click(await screen.findByRole("checkbox", { name: "Ver roles" }));
    await user.click(screen.getAllByRole("button", { name: "Crear rol" })[0]);

    // Tablero Rol: el nombre repetido se dice debajo del nombre, con el texto del back, y no en la franja de arriba.
    expect(await screen.findByText("Ya existe un rol con ese nombre.")).toBeVisible();
    expect(name).toHaveAttribute("aria-invalid", "true");
    expect(name).toHaveAccessibleDescription("Ya existe un rol con ese nombre.");
    expect(screen.getAllByText("Ya existe un rol con ese nombre.")).toHaveLength(1);
    await user.type(name, " Sur");
    expect(screen.queryByText("Ya existe un rol con ese nombre.")).not.toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Crear rol" })[0]);

    expect(await screen.findByRole("heading", { name: "Operaciones Sur" })).toBeVisible();
    expect(sent.map((request) => request.name)).toEqual(["Operaciones", "Operaciones Sur"]);
    expect(sent[0]?.key).toMatch(/^[0-9a-f-]{36}$/i);
    expect(sent[1]?.key).toMatch(/^[0-9a-f-]{36}$/i);
    expect(sent[1]?.key).not.toBe(sent[0]?.key);
  }, 10_000);

  // Límite de 10 s: escribe con user-event y elige la empresa en el desplegable; con toda la suite tarda unos 2 s.
  it("«Vale en» ofrece toda la organización o cada empresa por nombre, y crea el rol de la empresa elegida", async () => {
    const user = userEvent.setup();
    let createBody: unknown;
    const created: RoleResponse = { ...role, id: "role-company", name: "Administración Delta", scope: "SpecificCompany", companyId: "company-2", permissions: ["company.members.read"] };
    server.use(
      http.get("/api/companies/paged", () => HttpResponse.json(companies)),
      http.get("/api/permissions", () => HttpResponse.json(permissionGroups)),
      http.post("/api/roles", async ({ request }) => {
        createBody = await request.json();
        return HttpResponse.json(created.id, { status: 201 });
      }),
      http.get("/api/roles/role-company", () => HttpResponse.json(created)),
    );

    renderRouteWithProviders("/org/roles/nuevo?scope=SpecificCompany&companyId=company-1", { as: "business-e6-admin" });
    await user.type(await screen.findByRole("textbox", { name: "Nombre" }), "Administración Delta");
    // Desde una empresa llega elegida; sin un campo «Empresa» aparte.
    const valeEn = screen.getByRole("combobox", { name: "Vale en" });
    await waitFor(() => expect(valeEn).toHaveTextContent("Delta S.A."));
    expect(screen.queryByRole("combobox", { name: "Empresa" })).not.toBeInTheDocument();
    valeEn.focus();
    await user.keyboard("{Enter}");
    expect((await screen.findAllByRole("option")).map((option) => option.textContent))
      .toEqual(["Toda la organizaciónPermisos sobre usuarios, roles, empresas y configuración.", "Delta S.A.", "Delta Sur S.R.L."]);
    await user.click(screen.getByRole("option", { name: "Delta Sur S.R.L." }));
    await user.click(await screen.findByRole("button", { name: "Abrir o cerrar Miembros de empresa" }));
    await user.click(await screen.findByRole("checkbox", { name: "Ver miembros" }));
    await user.click(screen.getAllByRole("button", { name: "Crear rol" })[0]);

    await waitFor(() => expect(createBody).toMatchObject({ name: "Administración Delta", scope: "SpecificCompany", companyId: "company-2", permissions: ["company.members.read"] }));
  }, 10_000);

  it("un rol de una empresa dice «Vale en» con el nombre de la empresa", async () => {
    server.use(
      http.get("/api/companies/paged", () => HttpResponse.json(companies)),
      http.get("/api/permissions", () => HttpResponse.json(permissionGroups)),
      http.get("/api/roles/role-company", () => HttpResponse.json({ ...role, id: "role-company", scope: "SpecificCompany", companyId: "company-1", userCount: 4, permissions: ["company.members.read"] })),
    );
    renderRouteWithProviders("/org/roles/role-company", { as: "business-e6-admin" });

    const heading = await screen.findByRole("heading", { level: 1, name: "Solo lectura" });
    await waitFor(() => expect(heading.parentElement).toHaveTextContent("Vale en Delta S.A. · 4 usuarios lo tienen"));
    expect(screen.queryByText("Una empresa específica")).not.toBeInTheDocument();
    expect(screen.queryByText("Empresa")).not.toBeInTheDocument();
  });

  it("manda la versión y conserva el borrador ante un 409 hasta que la persona vea lo nuevo", async () => {
    const user = userEvent.setup();
    let reads = 0;
    let updateBody: unknown;
    server.use(
      http.get("/api/roles/role-custom", () => {
        reads++;
        return HttpResponse.json(reads === 1 ? role : { ...role, name: "Nombre actualizado", version: 5 });
      }),
      http.get("/api/permissions", () => HttpResponse.json(permissionGroups)),
      http.put("/api/roles/role-custom", async ({ request }) => {
        updateBody = await request.json();
        return HttpResponse.json({ code: "General.ConcurrencyConflict", detail: "Otra persona cambió este rol." }, { status: 409 });
      }),
    );

    renderRouteWithProviders("/org/roles/role-custom", { as: "business-role-manager" });

    const name = await screen.findByRole("textbox", { name: "Nombre" });
    await user.clear(name);
    await user.type(name, "Nombre del borrador");
    await user.click(screen.getAllByRole("button", { name: "Guardar cambios" })[0]);

    expect(await screen.findByText("Otra persona cambió esto mientras lo editabas.")).toBeVisible();
    expect(name).toHaveValue("Nombre del borrador");
    expect(updateBody).toMatchObject({ name: "Nombre del borrador", version: 4 });

    await user.click(screen.getByRole("button", { name: "Ver lo nuevo" }));
    await user.click(await screen.findByRole("button", { name: "Salir sin guardar" }));
    await waitFor(() => expect(name).toHaveValue("Nombre actualizado"));
    expect(reads).toBe(2);
  });

  // B7 + D2 (plan de la consolidación; back 600405a): un rol con personas asignadas no cambia dónde vale. El editor no lo
  // ofrece («Vale en» es solo lectura al editar y el guardado manda el mismo alcance); si el back responde el 409
  // `Roles.Role.ScopeChangeHasUsers`, la franja lo dice con el texto del back y lo escrito queda.
  it("con personas asignadas, el 409 de cambiar dónde vale sale en la franja con el texto del back", async () => {
    const user = userEvent.setup();
    let updateBody: unknown;
    const assigned = { ...role, userCount: 4 };
    server.use(
      http.get("/api/roles/role-custom", () => HttpResponse.json(assigned)),
      http.get("/api/permissions", () => HttpResponse.json(permissionGroups)),
      http.put("/api/roles/role-custom", async ({ request }) => {
        updateBody = await request.json();
        return HttpResponse.json({ status: 409, code: "Roles.Role.ScopeChangeHasUsers",
          detail: "El rol tiene usuarios asignados. Reasignalos antes de cambiar dónde vale.", userCount: 4 }, { status: 409 });
      }),
    );
    renderRouteWithProviders("/org/roles/role-custom", { as: "business-role-manager" });

    const name = await screen.findByRole("textbox", { name: "Nombre" });
    expect(screen.queryByRole("combobox", { name: "Vale en" })).not.toBeInTheDocument();
    await user.clear(name);
    await user.type(name, "Solo lectura de la organización");
    await user.click(screen.getAllByRole("button", { name: "Guardar cambios" })[0]);

    expect(await screen.findByText("El rol tiene usuarios asignados. Reasignalos antes de cambiar dónde vale.")).toBeVisible();
    expect(updateBody).toMatchObject({ scope: "Organization", companyId: null, version: 4 });
    expect(name).toHaveValue("Solo lectura de la organización");
  });

  // concurrencia.md (E7): la relectura de fondo (volver a la pestaña) trae lo que cambió otra persona, pero el formulario
  // sigue con lo que la persona empezó a editar; el guardado manda la versión de eso y el back responde 409 en vez de
  // pisar el cambio de la otra persona.
  it("una relectura de fondo no cambia la versión que manda el guardado: sale el 409 y no pisa lo de la otra persona", async () => {
    const user = userEvent.setup();
    let current = role;
    const sent: Array<{ version: number }> = [];
    server.use(
      http.get("/api/permissions", () => HttpResponse.json(permissionGroups)),
      http.get("/api/roles/role-custom", () => HttpResponse.json(current)),
      http.put("/api/roles/role-custom", async ({ request }) => {
        const body = await request.json() as { version: number };
        sent.push(body);
        return body.version === current.version ? HttpResponse.json({ version: current.version + 1 })
          : HttpResponse.json({ code: "General.ConcurrencyConflict", detail: "Otra persona cambió este rol." }, { status: 409 });
      }),
    );
    const { queryClient } = renderRouteWithProviders("/org/roles/role-custom", { as: "business-role-manager" });
    const name = await screen.findByRole("textbox", { name: "Nombre" });

    current = { ...role, description: "Lo cambió otra persona.", version: 5 };
    await act(() => queryClient.invalidateQueries({ queryKey: ["roles"] }));
    expect(screen.getByRole("textbox", { name: "Descripción" })).toHaveValue("Ve los miembros. No cambia nada.");
    await user.clear(name);
    await user.type(name, "Nombre del borrador");
    await user.click(screen.getAllByRole("button", { name: "Guardar cambios" })[0]);

    expect(await screen.findByText("Otra persona cambió esto mientras lo editabas.")).toBeVisible();
    expect(sent).toEqual([expect.objectContaining({ name: "Nombre del borrador", version: 4 })]);
  });

  // concurrencia.md (E7): después de guardar, la base es la versión que respondió el guardado. Si otra persona guardó
  // justo después, la relectura trae su cambio con otra versión: no pasa a ser la base, el próximo guardado da 409 y la
  // persona elige con «Ver lo nuevo».
  it("después de guardar, el próximo guardado manda la versión que respondió el guardado, no la de la relectura", async () => {
    const user = userEvent.setup();
    let current = role;
    const sent: Array<{ version: number }> = [];
    server.use(
      http.get("/api/permissions", () => HttpResponse.json(permissionGroups)),
      http.get("/api/roles/role-custom", () => HttpResponse.json(current)),
      http.put("/api/roles/role-custom", async ({ request }) => {
        const body = await request.json() as { name: string; version: number };
        sent.push(body);
        if (body.version !== current.version) {
          return HttpResponse.json({ code: "General.ConcurrencyConflict", detail: "Otra persona cambió este rol." }, { status: 409 });
        }
        // Otra persona guarda justo después: la relectura ya trae su cambio, con otra versión.
        current = { ...role, name: body.name, description: "Lo cambió otra persona.", version: current.version + 2 };
        return HttpResponse.json({ version: role.version + 1 });
      }),
    );
    renderRouteWithProviders("/org/roles/role-custom", { as: "business-role-manager" });
    const name = await screen.findByRole("textbox", { name: "Nombre" });
    await user.clear(name);
    await user.type(name, "Nombre guardado");
    await user.click(screen.getAllByRole("button", { name: "Guardar cambios" })[0]);
    expect(await screen.findByText("Guardamos el rol Nombre guardado.")).toBeVisible();

    await user.type(name, " otra vez");
    await user.click(screen.getAllByRole("button", { name: "Guardar cambios" })[0]);

    expect(await screen.findByText("Otra persona cambió esto mientras lo editabas.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Ver lo nuevo" })).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Descripción" })).toHaveValue("Ve los miembros. No cambia nada.");
    expect(sent.map((body) => body.version)).toEqual([4, 5]);
  });

  // B12 (Criterio · Avisos): si se corta la red al guardar, un solo aviso dice qué pasó y «Reintentar» vuelve a
  // guardar lo mismo; la franja del formulario no repite el error.
  it("si se corta la red al guardar, avisa «No pudimos conectarnos» con «Reintentar»", async () => {
    const user = userEvent.setup();
    const bodies: unknown[] = [];
    server.use(
      http.get("/api/roles/role-custom", () => HttpResponse.json(role)),
      http.get("/api/permissions", () => HttpResponse.json(permissionGroups)),
      http.put("/api/roles/role-custom", async ({ request }) => {
        bodies.push(await request.json());
        return bodies.length === 1 ? HttpResponse.error() : HttpResponse.json({ version: 5 });
      }),
    );
    renderRouteWithProviders("/org/roles/role-custom", { as: "business-role-manager" });

    const name = await screen.findByRole("textbox", { name: "Nombre" });
    await user.clear(name);
    await user.type(name, "Solo consulta");
    await user.click(screen.getAllByRole("button", { name: "Guardar cambios" })[0]);

    expect(await screen.findByText("No pudimos conectarnos. Revisá tu conexión.")).toBeVisible();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(await screen.findByText("Guardamos el rol Solo consulta.")).toBeVisible();
    expect(bodies).toHaveLength(2);
    expect(bodies[1]).toEqual(bodies[0]);
  });

  it("muestra los roles de sistema en solo lectura", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("/api/roles/role-owner", () => HttpResponse.json({ ...role, id: "role-owner", name: "TenantAdmin", isSystemRole: true, permissions: ["roles.read", "roles.manage", "company.members.read", "company.members.manage"] })),
      http.get("/api/permissions", () => HttpResponse.json(permissionGroups)),
    );

    renderRouteWithProviders("/org/roles/role-owner", { as: "business-role-manager" });

    expect(await screen.findByRole("heading", { name: "Dueño" })).toBeVisible();
    expect(await screen.findByText("Ver roles")).toBeVisible();
    expect(screen.queryByRole("textbox", { name: "Nombre" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Guardar cambios" })).not.toBeInTheDocument();
    expect(screen.getByText("Ver roles")).toBeVisible();
    expect(screen.queryByText("Los roles y sus permisos.")).not.toBeInTheDocument();
    expect(screen.getByText("2 de 2 elegidos")).toBeVisible();
    // Tablero Rol: las casillas de un rol de sistema, bloqueadas y grises. En el teléfono, M-Rol (v108, «Ver el rol Dueño»,
    // .ap-chk.on.fijo): también grises, las marcadas en `--casilla-fija` y sin transparencia.
    const locked = screen.getByRole("checkbox", { name: "Ver roles" });
    expect(locked).toBeDisabled();
    expect(locked).toHaveClass("disabled:data-[state=checked]:bg-[var(--borde2)]", "max-md:enabled:data-[state=checked]:border-[var(--marca)]!");
    expect(locked).toHaveClass("max-md:disabled:data-[state=checked]:bg-[var(--casilla-fija)]!", "max-md:disabled:data-[state=checked]:border-[var(--casilla-fija)]!", "max-md:disabled:opacity-100!");
    expect(locked).not.toHaveClass("max-md:disabled:data-[state=checked]:bg-[var(--marca)]!", "max-md:disabled:opacity-55!");
    expect(screen.getByRole("checkbox", { name: "Todos los permisos de Roles" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Abrir o cerrar Roles" }));
    expect(screen.queryByText("Ver roles")).not.toBeInTheDocument();
    expect(screen.queryByText("Ver miembros")).not.toBeInTheDocument();
  });

  it("oculta la creación si solo tiene permiso para leer roles", async () => {
    renderRouteWithProviders("/org/roles/nuevo", { as: "business-admin" });

    expect(await screen.findByRole("heading", { name: "No tenés permiso para ver esta página" })).toBeVisible();
  });

  // «Criterio · Avisos» (Pantalla de error): si el rol no carga, no se puede mostrar nada; «Reintentar» lo vuelve a pedir.
  // errores.md: un 404 en una ficha (también un id de otra organización) es «No encontramos esta página», como Error-Org.
  it("si el rol no existe, dice que no encontramos la página y lleva al inicio", async () => {
    server.use(
      http.get("/api/permissions", () => HttpResponse.json(permissionGroups)),
      http.get("/api/roles/role-custom", () => HttpResponse.json(
        { status: 404, code: "Roles.Role.NotFound", title: "No encontrado", detail: "No encontramos ese rol." }, { status: 404 })),
    );
    renderRouteWithProviders("/org/roles/role-custom", { as: "business-role-manager" });

    expect(await screen.findByRole("heading", { name: "No encontramos esta página" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Ir al inicio" })).toHaveAttribute("href", "/org");
    expect(screen.queryByRole("button", { name: "Reintentar" })).not.toBeInTheDocument();
  });

  it("si el rol no carga, dice que no se pudo abrir y «Reintentar» lo vuelve a pedir", async () => {
    const user = userEvent.setup();
    let fail = true;
    server.use(
      http.get("/api/permissions", () => HttpResponse.json(permissionGroups)),
      http.get("/api/roles/role-custom", () => fail
        ? HttpResponse.json({ status: 500, title: "Error", traceId: "00-abc-01" }, { status: 500 })
        : HttpResponse.json(role)),
    );
    renderRouteWithProviders("/org/roles/role-custom", { as: "business-role-manager" });

    expect(await screen.findByRole("heading", { name: "No pudimos abrir esta pantalla" })).toBeVisible();
    fail = false;
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByRole("textbox", { name: "Nombre" })).toHaveValue("Solo lectura");
  });

  // Lienzo v87: al editar, «Descartar cambios» vuelve a lo guardado sin salir de la pantalla, como en la ficha de un
  // usuario; al crear, «Cancelar» vuelve a la lista.
  it("al editar, «Descartar cambios» vuelve a lo guardado sin salir", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("/api/permissions", () => HttpResponse.json(permissionGroups)),
      http.get("/api/roles/role-custom", () => HttpResponse.json(role)),
    );
    renderRouteWithProviders("/org/roles/role-custom", { as: "business-role-manager" });

    const name = await screen.findByRole("textbox", { name: "Nombre" });
    await user.clear(name);
    await user.type(name, "Otro nombre");
    expect(screen.queryByRole("button", { name: "Cancelar" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Descartar cambios" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Nombre" })).toHaveValue("Solo lectura");
    expect(screen.getByRole("heading", { level: 1, name: "Solo lectura" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeDisabled();
  });

  // Tablero Rol: cada área es una fila de 40 con la cuenta a la derecha; cada permiso, una fila de 40, sin descripción.
  it("en la compu el árbol de permisos tiene filas de 40 con la cuenta a la derecha", async () => {
    server.use(
      http.get("/api/permissions", () => HttpResponse.json(permissionGroups)),
      http.get("/api/roles/role-custom", () => HttpResponse.json(role)),
    );
    renderRouteWithProviders("/org/roles/role-custom", { as: "business-role-manager" });

    const area = await screen.findByRole("checkbox", { name: "Todos los permisos de Roles" });
    const row = area.closest<HTMLElement>("[data-slot='permission-area']")!;
    expect(row).toHaveClass("min-h-10", "border-b");
    expect(row).toHaveTextContent("1 de 2");
    // «1 de 2» a la derecha de su banda.
    expect(within(row).getByText("1 de 2")).toHaveClass("ml-auto");
    const permission = screen.getByRole("checkbox", { name: "Ver roles" }).closest("label")!;
    expect(permission).toHaveClass("min-h-10", "pl-[52px]");
    expect(screen.queryByText("Los roles y sus permisos.")).not.toBeInTheDocument();
    // Tablero Rol (.o-gnom): el nombre del área también la cierra y la abre.
    const user = userEvent.setup();
    await user.click(within(row).getByRole("button", { name: "Roles" }));
    expect(screen.queryByRole("checkbox", { name: "Ver roles" })).not.toBeInTheDocument();
    await user.click(within(row).getByRole("button", { name: "Roles" }));
    expect(screen.getByRole("checkbox", { name: "Ver roles" })).toBeChecked();
  });

  // Tablero Rol (v87 y v96): al crear, «Cancelar»; «Vale en» sin asterisco y «Descripción» a todo el ancho de la caja.
  it("al crear, la acción de salida es «Cancelar», «Vale en» no lleva asterisco y la descripción ocupa las dos columnas", async () => {
    server.use(http.get("/api/permissions", () => HttpResponse.json(permissionGroups)));
    renderRouteWithProviders("/org/roles/nuevo", { as: "business-role-manager" });

    expect(await screen.findByRole("button", { name: "Cancelar" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Descartar cambios" })).not.toBeInTheDocument();
    const valeEn = screen.getByRole("combobox", { name: "Vale en" });
    expect(valeEn).not.toHaveAttribute("aria-required");
    expect(document.querySelector(`label[for="${valeEn.id}"]`)).toHaveTextContent(/^Vale en$/);
    expect(screen.getByRole("textbox", { name: "Nombre" })).toHaveAttribute("aria-required", "true");
    expect(screen.getByRole("textbox", { name: "Descripción" }).closest("[data-slot='role-description']")).toHaveClass("lg:col-span-2");
    // Tableros Rol (.o-vacio) y M-Rol (.ap-sin-vale): sin «Vale en», los permisos dicen qué falta, en gris claro de 13 y,
    // en el teléfono, de 14,5.
    expect(screen.getByText("Elegí dónde vale el rol para ver sus permisos.")).toHaveClass("text-[13px]", "text-[var(--t3)]", "max-md:text-[14.5px]", "max-md:text-[var(--t2)]");
    // Tablero Rol: la caja de «Descripción» crece con el texto y no tiene el tirador para cambiarle el tamaño.
    const description = screen.getByRole("textbox", { name: "Descripción" });
    expect(description).toHaveClass("resize-none");
    expect(description).not.toHaveClass("resize-y");
  });

  // Tablero M-Rol: en el teléfono los campos van sueltos, «Vale en» como texto, «Permisos» con la cuenta a la derecha
  // y los botones fijos abajo.
  it("en el teléfono los campos van sueltos y los botones fijos abajo", async () => {
    const restore = asPhone();
    try {
      server.use(
        http.get("/api/permissions", () => HttpResponse.json(permissionGroups)),
        http.get("/api/roles/role-custom", () => HttpResponse.json(role)),
      );
      const { container } = renderRouteWithProviders("/org/roles/role-custom", { as: "business-role-manager" });

      await screen.findByRole("textbox", { name: "Nombre" });
      // Tablero M-Rol: «Vale en» se lee como texto, de 16 debajo de su rótulo de 13,5.
      expect(screen.getByText("Toda la organización")).toHaveClass("max-md:text-[16px]", "max-md:leading-[normal]");
      expect(screen.getByText("Vale en")).toHaveClass("max-md:text-[13.5px]");
      expect(await axe(container)).toHaveNoViolations();
      expect(screen.getByRole("heading", { level: 1, name: "Solo lectura" }).closest("header")).toHaveTextContent("Vale en toda la organización · 0 usuarios lo tienen");
      expect(screen.getByRole("heading", { name: "Datos del rol" })).toHaveClass("sr-only");
      expect(screen.getByRole("heading", { level: 2, name: "Permisos" })).toHaveClass("text-[13.5px]");
      expect(screen.getByText("1 de 2 elegidos")).toHaveClass("text-[13.5px]");
      const fixed = screen.getByRole("button", { name: "Guardar cambios" }).parentElement!;
      expect(fixed).toHaveAttribute("data-slot", "fixed-actions");
      expect(screen.getAllByRole("button", { name: "Descartar cambios" })).toHaveLength(1);
    } finally {
      restore();
    }
  });

  // «Criterio · Botones»: un botón no se apaga porque falta algo. Al tocarlo, cada dato que falta lo dice debajo, no se
  // manda nada, y el error se va al completarlo.
  // Límite de 10 s: escribe con user-event y corre axe; con toda la suite tarda unos 3 s.
  it("«Crear rol» no se apaga: sin datos, cada campo dice qué falta y no manda nada", async () => {
    const user = userEvent.setup();
    let posts = 0;
    server.use(
      http.get("/api/permissions", () => HttpResponse.json(permissionGroups)),
      http.post("/api/roles", () => { posts++; return HttpResponse.json("role-x", { status: 201 }); }),
    );
    const { container } = renderRouteWithProviders("/org/roles/nuevo", { as: "business-role-manager" });

    const create = (await screen.findAllByRole("button", { name: "Crear rol" }))[0];
    expect(create).toBeEnabled();
    await user.click(create);

    const name = screen.getByRole("textbox", { name: "Nombre" });
    expect(await screen.findByText("Escribí el nombre del rol.")).toBeVisible();
    expect(name).toHaveAccessibleDescription("Escribí el nombre del rol.");
    expect(screen.getByRole("combobox", { name: "Vale en" })).toHaveAccessibleDescription("Elegí dónde vale el rol.");
    expect(screen.getByText("Elegí al menos un permiso.")).toBeVisible();
    // Tablero Rol (.w-cartel.o-prob, con 12 y 16 de margen): en la compu, el error de los permisos va en el cartel de
    // problema, de 44 con el ícono de 18.
    const permissionsError = screen.getByText("Elegí al menos un permiso.").closest("[role=alert]");
    expect(permissionsError).toHaveClass("min-h-11", "rounded-[10px]", "mx-4", "my-3");
    expect(permissionsError?.querySelector("svg")).toHaveClass("size-[18px]");
    expect(posts).toBe(0);
    expect(await axe(container)).toHaveNoViolations();

    await user.type(name, "Operaciones");
    expect(screen.queryByText("Escribí el nombre del rol.")).not.toBeInTheDocument();
    await user.click(screen.getByRole("combobox", { name: "Vale en" }));
    await user.click(await screen.findByRole("option", { name: "Toda la organización" }));
    expect(screen.queryByText("Elegí dónde vale el rol.")).not.toBeInTheDocument();
    await user.click(await screen.findByRole("checkbox", { name: "Todos los permisos de Roles" }));
    expect(screen.queryByText("Elegí al menos un permiso.")).not.toBeInTheDocument();
  }, 10_000);

  // Enmienda de las ADR 0012 y 0034: «Cada empresa» queda para la API; el editor no crea esos roles, aunque lo pida la URL.
  it("no ofrece «Cada empresa», aunque la URL lo pida", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("/api/companies/paged", () => HttpResponse.json(companies)),
      http.get("/api/permissions", () => HttpResponse.json(permissionGroups)),
    );
    renderRouteWithProviders("/org/roles/nuevo?scope=AnyCompany", { as: "business-e6-admin" });

    const valeEn = await screen.findByRole("combobox", { name: "Vale en" });
    expect(valeEn).toHaveTextContent("Elegí dónde vale");
    expect(screen.getByText("Elegí dónde vale el rol para ver sus permisos.")).toBeVisible();
    // accesibilidad.md: los desplegables se abren con el teclado. Las empresas pueden llegar después de abrirlo.
    valeEn.focus();
    await user.keyboard("{Enter}");
    await screen.findByRole("option", { name: "Delta S.A." }, { timeout: 3_000 });
    expect(screen.queryByRole("option", { name: /Cada empresa/ })).not.toBeInTheDocument();
  });

  // Tableros Rol y Avisos: con cambios, «Cambios sin guardar» en la banda; al irse, «¿Salir sin guardar?» con los textos
  // de todas las fichas (useEditPage).
  it("con cambios dice «Cambios sin guardar» y pregunta antes de salir", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("/api/permissions", () => HttpResponse.json(permissionGroups)),
      http.get("/api/roles/role-custom", () => HttpResponse.json(role)),
    );
    const { router } = renderRouteWithProviders("/org/roles/role-custom", { as: "business-role-manager" });

    const name = await screen.findByRole("textbox", { name: "Nombre" });
    const band = screen.getByRole("heading", { level: 1, name: "Solo lectura" }).parentElement!;
    expect(band).not.toHaveTextContent("Cambios sin guardar");
    await user.type(name, " y algo más");
    expect(band).toHaveTextContent("Cambios sin guardar·Vale en toda la organización · 0 usuarios lo tienen");

    await user.click(screen.getByRole("link", { name: "Volver a Roles y permisos" }));
    const leave = await screen.findByRole("dialog", { name: "¿Salir sin guardar?" });
    expect(leave).toHaveTextContent("Se pierde lo que cambiaste acá.");
    await user.click(within(leave).getByRole("button", { name: "Seguir editando" }));
    expect(name).toHaveValue("Solo lectura y algo más");
    expect(router.state.location.pathname).toBe("/org/roles/role-custom");
  });
});
