import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
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

    renderRouteWithProviders("/org/roles/new", { as: "business-role-manager" });

    const name = await screen.findByRole("textbox", { name: "Nombre" });
    expect(name).toHaveAttribute("maxlength", "60");
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

    renderRouteWithProviders("/org/roles/new", { as: "business-role-manager" });

    const name = await screen.findByRole("textbox", { name: "Nombre" });
    await user.type(name, "Operaciones");
    await user.click(screen.getByRole("combobox", { name: "Vale en" }));
    await user.click(await screen.findByRole("option", { name: "Toda la organización" }));
    await user.click(await screen.findByRole("button", { name: "Abrir o cerrar Roles" }));
    await user.click(await screen.findByRole("checkbox", { name: "Ver roles" }));
    await user.click(screen.getAllByRole("button", { name: "Crear rol" })[0]);

    expect(await screen.findByText("Ya existe un rol con ese nombre.")).toBeVisible();
    await user.type(name, " Sur");
    await user.click(screen.getAllByRole("button", { name: "Crear rol" })[0]);

    expect(await screen.findByRole("heading", { name: "Operaciones Sur" })).toBeVisible();
    expect(sent.map((request) => request.name)).toEqual(["Operaciones", "Operaciones Sur"]);
    expect(sent[0]?.key).toMatch(/^[0-9a-f-]{36}$/i);
    expect(sent[1]?.key).toMatch(/^[0-9a-f-]{36}$/i);
    expect(sent[1]?.key).not.toBe(sent[0]?.key);
  }, 10_000);

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

    renderRouteWithProviders("/org/roles/new?scope=SpecificCompany&companyId=company-1", { as: "business-e6-admin" });
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
  }, 10_000);

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
        return bodies.length === 1 ? HttpResponse.error() : new HttpResponse(null, { status: 204 });
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
  }, 10_000);

  it("muestra los roles de sistema en solo lectura", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("/api/roles/role-owner", () => HttpResponse.json({ ...role, id: "role-owner", name: "TenantAdmin", isSystemRole: true, permissions: ["roles.read", "roles.manage", "company.members.read", "company.members.manage"] })),
      http.get("/api/permissions", () => HttpResponse.json(permissionGroups)),
    );

    renderRouteWithProviders("/org/roles/role-owner", { as: "business-role-manager" });

    expect(await screen.findByRole("heading", { name: "Dueño" })).toBeVisible();
    expect(screen.queryByRole("textbox", { name: "Nombre" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Guardar cambios" })).not.toBeInTheDocument();
    expect(screen.getByText("Ver roles")).toBeVisible();
    expect(screen.queryByText("Los roles y sus permisos.")).not.toBeInTheDocument();
    expect(screen.getByText("2 de 2 elegidos")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Abrir o cerrar Roles" }));
    expect(screen.queryByText("Ver roles")).not.toBeInTheDocument();
    expect(screen.queryByText("Ver miembros")).not.toBeInTheDocument();
  });

  it("oculta la creación si solo tiene permiso para leer roles", async () => {
    renderRouteWithProviders("/org/roles/new", { as: "business-admin" });

    expect(await screen.findByRole("heading", { name: "No tenés permiso para ver esta página" })).toBeVisible();
  });

  // «Criterio · Avisos» (Pantalla de error): si el rol no carga, no se puede mostrar nada; «Reintentar» lo vuelve a pedir.
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
    // El aviso de red de otra prueba puede seguir abajo con su propio «Reintentar»: el de la pantalla va en el cuerpo.
    await user.click(within(screen.getByRole("main")).getByRole("button", { name: "Reintentar" }));
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

    const area = await screen.findByRole("checkbox", { name: "Roles" });
    const row = area.closest("[data-slot='permission-area']")!;
    expect(row).toHaveClass("min-h-10", "border-b");
    expect(row).toHaveTextContent("1 de 2");
    const permission = screen.getByRole("checkbox", { name: "Ver roles" }).closest("label")!;
    expect(permission).toHaveClass("min-h-10", "pl-[52px]");
    expect(screen.queryByText("Los roles y sus permisos.")).not.toBeInTheDocument();
  });

  it("al crear, la acción de salida es «Cancelar»", async () => {
    server.use(http.get("/api/permissions", () => HttpResponse.json(permissionGroups)));
    renderRouteWithProviders("/org/roles/new", { as: "business-role-manager" });

    expect(await screen.findByRole("button", { name: "Cancelar" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Descartar cambios" })).not.toBeInTheDocument();
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
      renderRouteWithProviders("/org/roles/role-custom", { as: "business-role-manager" });

      await screen.findByRole("textbox", { name: "Nombre" });
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
});
