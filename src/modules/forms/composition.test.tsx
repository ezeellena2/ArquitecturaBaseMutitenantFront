import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { axe } from "vitest-axe";
import { AppProviders } from "@/app/providers";
import { routesForHost } from "@/app/routes";
import { moduleComposition } from "@/app/moduleComposition";
import { currentUserQueryKey } from "@/auth/useCurrentUser";
import { createQueryClient } from "@/shared/api/queryClient";
import type { MeResponse } from "@/shared/api/types";
import type { ModuleRegistration } from "@/shared/modules/types";
import { mainSiteHost } from "@/tenancy/publicSite";
import { PublicSiteHostContext } from "@/tenancy/usePublicSite";
import { fixtureAuth } from "@/test/mocks/authContext";
import { businessE6Admin } from "@/test/mocks/currentUsers";
import { meHandlerFor } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { asPhone } from "@/test/utils/phone";

const member = (...permissions: string[]): MeResponse => ({ ...businessE6Admin, features: ["forms"],
  effectivePermissions: { ...businessE6Admin.effectivePermissions, organization: [...businessE6Admin.effectivePermissions.organization, ...permissions] } });
const reader = member("formcatalogs.read");
const manager = member("formcatalogs.read", "formcatalogs.manage");

function mount(path: string, me: MeResponse, modules: readonly ModuleRegistration[] = moduleComposition) {
  server.use(meHandlerFor(me));
  const client = createQueryClient({ queries: { retry: false }, mutations: { retry: false } });
  client.setQueryData(currentUserQueryKey, me);
  const router = createMemoryRouter(routesForHost(mainSiteHost), { initialEntries: [path] });
  const result = render(<PublicSiteHostContext.Provider value={mainSiteHost}>
    <AppProviders client={client} authContext={fixtureAuth("business-e6-admin")} modules={modules}><RouterProvider router={router} /></AppProviders>
  </PublicSiteHostContext.Provider>);
  return { ...result, router, user: userEvent.setup() };
}

beforeAll(async () => { await import("./pages/CatalogsPage"); await import("./pages/CatalogEditorPage"); await import("@/layouts/MorePage"); });
beforeEach(() => server.use(
  http.get("/api/organization/forms/catalogs", () => HttpResponse.json({ items: [], page: 1, pageSize: 10, totalCount: 0, totalPages: 1, hasPrevious: false, hasNext: false })),
  http.get("/api/organization/forms/catalogs/filter-counts", () => HttpResponse.json({ all: 0, active: 0 })),
));

describe("composición real de Formularios", () => {
  it("en la compu, «Gestión de formularios» abre su panel con solo «Catálogos»", async () => {
    const app = mount("/org/formularios/catalogos", reader);
    expect(await screen.findByRole("heading", { name: "Catálogos", level: 1 })).toBeVisible();
    const menu = screen.getByRole("navigation", { name: "General" });
    expect(within(menu).getByRole("button", { name: "Gestión de formularios" })).toBeVisible();
    const catalogs = screen.getByRole("link", { name: "Catálogos" });
    expect(catalogs).toHaveAttribute("href", "/org/formularios/catalogos");
    expect(catalogs).toHaveAttribute("aria-current", "page");
    expect(await axe(app.container)).toHaveNoViolations();
  });

  it.each(["/org/formularios/catalogos", "/org/formularios/catalogos/nuevo", "/org/formularios/catalogos/c-1"])("%s apagado o desinstalado es un 404", async (path) => {
    for (const modules of [moduleComposition, []]) {
      const app = mount(path, { ...manager, features: modules.length ? [] : ["forms"] }, modules);
      expect(await screen.findByRole("heading", { name: "No encontramos esta página" })).toBeVisible();
      app.unmount();
    }
  });

  it.each([
    ["/org/formularios/catalogos", member()], ["/org/formularios/catalogos/c-1", member()], ["/org/formularios/catalogos/nuevo", reader],
  ] as const)("%s sin su permiso muestra el 403", async (path, me) => {
    mount(path, me);
    expect(await screen.findByRole("heading", { name: "No tenés permiso para ver esta página" })).toBeVisible();
  });

  it.each([["/org/formularios/catalogos/nuevo", manager, "Nuevo catálogo"], ["/org/formularios/catalogos/c-1", reader, "Motivos de visita"]] as const)("%s abre el editor", async (path, me, title) => {
    server.use(
      http.get("/api/organization/forms/catalogs/c-1", () => HttpResponse.json({ id: "c-1", name: "Motivos de visita", source: "Manual", valueType: "Text", isActive: true, usable: true,
        canManage: false, itemCounts: { total: 0, active: 0 }, modifiedAtUtc: "2026-11-20T13:00:00Z", version: 1 })),
      http.get("/api/organization/forms/catalogs/c-1/items", () => HttpResponse.json({ items: [], page: 1, pageSize: 10, totalCount: 0, totalPages: 1, hasPrevious: false, hasNext: false })),
    );
    mount(path, me);
    expect(await screen.findByRole("heading", { name: title, level: 1 })).toBeVisible();
  });

  it("en el teléfono, Más tiene el grupo «Gestión de formularios» con «Catálogos»", async () => {
    asPhone();
    const app = mount("/mas", reader);
    const group = await screen.findByRole("list", { name: "Gestión de formularios" });
    expect(within(group).getAllByRole("link").map((link) => [link.textContent, link.getAttribute("href")])).toEqual([["Catálogos", "/org/formularios/catalogos"]]);
    expect(within(screen.getByRole("navigation", { name: "Secciones" })).queryByRole("link", { name: "Catálogos" })).not.toBeInTheDocument();
    expect(await axe(app.container)).toHaveNoViolations();
  });
});
