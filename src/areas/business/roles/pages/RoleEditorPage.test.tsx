import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { configureI18n, changeCulture } from "@/shared/i18n";
import type { RoleResponse } from "@/shared/api/types";
import { server } from "@/test/mocks/server";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";

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
    await user.click(await screen.findByRole("checkbox", { name: "Ver roles" }));
    await user.click(screen.getAllByRole("button", { name: "Crear rol" })[0]);

    expect(createBody).toMatchObject({ name: "Operaciones", scope: "Organization", companyId: null, permissions: ["roles.read"] });
    expect(await screen.findByRole("heading", { name: "Operaciones" })).toBeVisible();
  }, 10_000);

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

    expect(await screen.findByText("Otra persona cambió esto mientras lo editabas")).toBeVisible();
    expect(name).toHaveValue("Nombre del borrador");
    expect(updateBody).toMatchObject({ name: "Nombre del borrador", version: 4 });

    await user.click(screen.getByRole("button", { name: "Ver lo nuevo" }));
    await user.click(await screen.findByRole("button", { name: "Salir sin guardar" }));
    await waitFor(() => expect(name).toHaveValue("Nombre actualizado"));
    expect(reads).toBe(2);
  }, 10_000);

  it("muestra los roles de sistema en solo lectura", async () => {
    server.use(
      http.get("/api/roles/role-owner", () => HttpResponse.json({ ...role, id: "role-owner", name: "TenantAdmin", isSystemRole: true, permissions: ["roles.read", "roles.manage", "company.members.read", "company.members.manage"] })),
      http.get("/api/permissions", () => HttpResponse.json(permissionGroups)),
    );

    renderRouteWithProviders("/org/roles/role-owner", { as: "business-role-manager" });

    expect(await screen.findByRole("heading", { name: "Dueño" })).toBeVisible();
    expect(screen.queryByRole("textbox", { name: "Nombre" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Guardar cambios" })).not.toBeInTheDocument();
    expect(screen.getByText("Ver roles")).toBeVisible();
    expect(screen.getByText("2 de 2 elegidos")).toBeVisible();
    expect(screen.queryByText("Ver miembros")).not.toBeInTheDocument();
  });

  it("oculta la creación si solo tiene permiso para leer roles", async () => {
    renderRouteWithProviders("/org/roles/new", { as: "business-admin" });

    expect(await screen.findByRole("heading", { name: "No tenés permiso para ver esta página" })).toBeVisible();
  });
});
