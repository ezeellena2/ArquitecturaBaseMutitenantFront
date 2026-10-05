import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { configureI18n, changeCulture } from "@/shared/i18n";
import type { RoleResponse } from "@/shared/api/types";
import { server } from "@/test/mocks/server";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";

const owner: RoleResponse = {
  id: "role-owner",
  name: "TenantAdmin",
  description: "Tiene todos los permisos de la organización.",
  scope: "Organization",
  companyId: null,
  isSystemRole: true,
  userCount: 1,
  permissions: ["roles.read", "roles.manage"],
  version: 1,
  createdAtUtc: "2026-09-27T12:00:00Z",
};

const companyAdmin: RoleResponse = {
  ...owner,
  id: "role-company-admin",
  name: "CompanyAdmin",
  description: "Administra los miembros de cada empresa.",
  scope: "AnyCompany",
  permissions: ["company.members.read", "company.members.manage"],
};

const companyReader: RoleResponse = {
  ...owner,
  id: "role-company-reader",
  name: "Solo lectura",
  description: "Ve los miembros de la empresa.",
  scope: "SpecificCompany",
  companyId: "company-1",
  isSystemRole: false,
  userCount: 0,
  permissions: ["company.members.read"],
};

const companies = { items: [
  { id: "company-1", name: "Delta S.A.", taxId: null, timeZoneId: "America/Argentina/Buenos_Aires", status: "Active", memberCount: 1, version: 1, createdAtUtc: "2026-09-27T12:00:00Z" },
  { id: "company-2", name: "Delta Sur S.R.L.", taxId: null, timeZoneId: "America/Argentina/Buenos_Aires", status: "Active", memberCount: 1, version: 1, createdAtUtc: "2026-09-27T12:00:00Z" },
], page: 1, pageSize: 100, totalCount: 2, totalPages: 1, hasPrevious: false, hasNext: false };

beforeEach(async () => {
  await configureI18n(referenceDataFixture().cultures);
  await changeCulture("es-AR");
});

describe("RolesPage", () => {
  it("lista roles del backend y lleva búsqueda y «Vale en» a la URL y a la consulta", async () => {
    const user = userEvent.setup();
    const requests: URL[] = [];
    server.use(http.get("/api/companies/paged", () => HttpResponse.json(companies)), http.get("/api/roles/paged", ({ request }) => {
      const url = new URL(request.url);
      requests.push(url);
      const companyId = url.searchParams.get("companyId");
      const items = url.searchParams.get("scope") === "Organization" ? [owner]
        : companyId === "company-1" ? [companyAdmin, companyReader] : companyId ? [companyAdmin] : [owner, companyAdmin, companyReader];
      return HttpResponse.json({
        items,
        page: 1,
        pageSize: 10,
        totalCount: items.length,
        totalPages: 1,
        hasPrevious: false,
        hasNext: false,
      });
    }));

    const { router } = renderRouteWithProviders("/org/roles", { as: "business-e6-admin" });

    expect(await screen.findByRole("heading", { level: 1, name: "Roles y permisos" })).toBeVisible();
    expect(await screen.findByRole("link", { name: "Dueño" })).toHaveAttribute("href", "/org/roles/role-owner");
    expect(screen.getByRole("link", { name: "Crear rol" })).toHaveAttribute("href", "/org/roles/new");
    expect(screen.getByRole("columnheader", { name: "Rol" })).toBeVisible();
    expect(screen.getByRole("columnheader", { name: "Vale en" })).toBeVisible();
    // Tablero Roles: el nombre en el color del texto, «Vale en» a la izquierda y los números en columnas angostas.
    expect(screen.getByRole("link", { name: "Dueño" })).toHaveClass("font-medium", "text-[var(--t1)]");
    expect(screen.getByRole("columnheader", { name: "Rol" })).toHaveClass("w-[39%]");
    expect(screen.getByRole("columnheader", { name: "Vale en" })).not.toHaveClass("text-right");
    expect(screen.getByRole("columnheader", { name: "Usuarios" })).toHaveClass("w-[112px]", "text-right");
    expect(screen.getByRole("columnheader", { name: "Permisos" })).toHaveClass("w-[112px]", "text-right");
    expect(screen.queryByRole("columnheader", { name: "Descripción" })).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Tipo" })).not.toBeInTheDocument();
    expect(screen.getAllByText("De sistema")).toHaveLength(2);
    // «Criterio · Tablas» (lienzo v92): «De sistema» va en la segunda línea gris, debajo del nombre.
    for (const system of screen.getAllByText("De sistema")) expect(system).toHaveAttribute("data-slot", "cell-detail");
    // Tableros de listas (.pagina, compacto): 14 entre la caja de los filtros y la tabla.
    expect(screen.getByRole("search").parentElement).toHaveClass("md:gap-3.5");
    // «Vale en» de un rol de una empresa es el nombre de la empresa.
    expect(await screen.findByRole("cell", { name: "Delta S.A." })).toBeVisible();

    await user.type(screen.getByRole("searchbox", { name: "Buscar por nombre o descripción" }), "Solo lectura");
    await waitFor(() => expect(requests.at(-1)?.searchParams.get("search")).toBe("Solo lectura"), { timeout: 3_000 });
    expect(router.state.location.search).toContain("search=Solo+lectura");

    // Tablero Roles: «Todos», «Toda la organización» y cada empresa por nombre; sin «Cada empresa».
    await user.click(screen.getByRole("button", { name: /Vale en: todos/ }));
    const options = await screen.findAllByRole("menuitemradio");
    expect(options.map((option) => option.textContent?.replace(/\d+$/, ""))).toEqual(["Todos", "Toda la organización", "Delta S.A.", "Delta Sur S.R.L."]);
    await user.click(screen.getByRole("menuitemradio", { name: /Delta S\.A\./ }));
    await waitFor(() => expect(requests.at(-1)?.searchParams.get("companyId")).toBe("company-1"));
    expect(requests.at(-1)?.searchParams.get("scope")).toBeNull();
    expect(router.state.location.search).toContain("vale=company-1");
  }, 10_000);

  it("el ⋮ de un rol propio lleva «Editar» e «Inactivar»; el de uno de sistema, «Ver permisos»", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("/api/companies/paged", () => HttpResponse.json(companies)),
      http.get("/api/roles/paged", () => HttpResponse.json({ items: [owner, companyReader], page: 1, pageSize: 10, totalCount: 2, totalPages: 1, hasPrevious: false, hasNext: false })),
    );
    renderRouteWithProviders("/org/roles", { as: "business-e6-admin" });

    (await screen.findByRole("button", { name: "Acciones para Solo lectura" })).focus();
    await user.keyboard("{Enter}");
    const own = await screen.findByRole("menu");
    expect(within(own).getAllByRole("menuitem").map((item) => item.textContent)).toEqual(["Editar", "Inactivar"]);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    screen.getByRole("button", { name: "Acciones para Dueño" }).focus();
    await user.keyboard("{Enter}");
    const system = await screen.findByRole("menu");
    expect(within(system).getAllByRole("menuitem").map((item) => item.textContent)).toEqual(["Ver permisos"]);
  });

  it("tablero Roles: «No se puede inactivar: 1 usuario tiene el rol …» y «¿Inactivar el rol …?»", async () => {
    const user = userEvent.setup();
    const inUse = { ...companyReader, id: "role-in-use", name: "Auditor", userCount: 1 };
    server.use(
      http.get("/api/companies/paged", () => HttpResponse.json(companies)),
      http.get("/api/roles/paged", () => HttpResponse.json({ items: [inUse, companyReader], page: 1, pageSize: 10, totalCount: 2, totalPages: 1, hasPrevious: false, hasNext: false })),
    );
    renderRouteWithProviders("/org/roles", { as: "business-e6-admin" });
    const open = async (name: string) => { const trigger = await screen.findByRole("button", { name }); trigger.focus(); await user.keyboard("{Enter}"); };

    await open("Acciones para Auditor");
    await user.click(await screen.findByRole("menuitem", { name: "Inactivar" }));
    expect(await screen.findByText("No se puede inactivar: 1 usuario tiene el rol Auditor. Quitáselo primero.")).toBeVisible();

    await open("Acciones para Solo lectura");
    await user.click(await screen.findByRole("menuitem", { name: "Inactivar" }));
    const confirm = await screen.findByRole("dialog", { name: "¿Inactivar el rol Solo lectura?" });
    expect(confirm).toHaveTextContent("Deja de aparecer para asignar. Nadie lo tiene, así que no le cambia nada a ningún usuario.");
  });

  // B6: si se inactiva el único rol de la última página, la lista vuelve a la anterior en vez de quedar vacía.
  it("al inactivar el único rol de la última página, vuelve a la anterior", async () => {
    const user = userEvent.setup();
    const firstPage = Array.from({ length: 10 }, (_item, index) => ({ ...companyReader, id: `role-${index + 1}`, name: `Rol ${String(index + 1).padStart(2, "0")}` }));
    const last = { ...companyReader, id: "role-last", name: "Último rol" };
    let removed = false;
    server.use(
      http.get("/api/roles/paged", ({ request }) => {
        const all = removed ? firstPage : [...firstPage, last];
        const page = Number(new URL(request.url).searchParams.get("page") ?? "1");
        const items = all.slice((page - 1) * 10, page * 10);
        return HttpResponse.json({ items, page, pageSize: 10, totalCount: all.length, totalPages: Math.ceil(all.length / 10), hasPrevious: page > 1, hasNext: page * 10 < all.length });
      }),
      http.delete("/api/roles/role-last", () => { removed = true; return new HttpResponse(null, { status: 204 }); }),
    );
    const { router } = renderRouteWithProviders("/org/roles?page=2", { as: "business-role-manager" });

    (await screen.findByRole("button", { name: "Acciones para Último rol" })).focus();
    await user.keyboard("{Enter}");
    await user.click(await screen.findByRole("menuitem", { name: "Inactivar" }));
    const confirm = await screen.findByRole("dialog", { name: "¿Inactivar el rol Último rol?" });
    await user.click(within(confirm).getByRole("button", { name: "Inactivar" }));

    expect(await screen.findByRole("link", { name: "Rol 01" })).toBeVisible();
    await waitFor(() => expect(router.state.location.search).toBe(""));
  }, 10_000);

  it("con filtros y sin resultados: «Ningún rol coincide con los filtros» y «Limpiar filtros»", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("/api/companies/paged", () => HttpResponse.json(companies)),
      http.get("/api/roles/paged", () => HttpResponse.json({ items: [], page: 1, pageSize: 10, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false })),
    );
    const { router } = renderRouteWithProviders("/org/roles?search=zzz", { as: "business-e6-admin" });
    expect(await screen.findByText("Ningún rol coincide con los filtros")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    await waitFor(() => expect(router.state.location.search).not.toContain("search="));
  });

  it("no consulta roles ni muestra la administración sin roles.read", async () => {
    let roleRequests = 0;
    server.use(http.get("/api/roles/paged", () => { roleRequests++; return HttpResponse.json({ items: [] }); }));

    renderRouteWithProviders("/org/roles", { as: "business-no-permissions" });

    expect(await screen.findByRole("heading", { name: "No tenés permiso para ver esta página" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Administración" })).not.toBeInTheDocument();
    expect(roleRequests).toBe(0);
  });
});
