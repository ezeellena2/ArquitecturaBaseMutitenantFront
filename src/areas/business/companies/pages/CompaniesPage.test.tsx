import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { configureI18n, changeCulture } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";

const company = {
  id: "company-1", name: "Delta S.A.", taxId: { country: "AR", type: "AR-CUIT", number: "30712345671" },
  timeZoneId: "America/Argentina/Buenos_Aires", status: "Active" as const, memberCount: 1,
  version: 3, createdAtUtc: "2026-09-27T12:00:00Z",
};

// La ruta carga la pantalla con lazyPage: se importa antes de las pruebas para que la primera no pague, dentro de su
// límite, la carga del módulo, que con la máquina cargada la pasaba de 5 s.
beforeAll(async () => { await import("./CompaniesPage"); });

beforeEach(async () => {
  await configureI18n(referenceDataFixture().cultures);
  await changeCulture("es-AR");
});

describe("CompaniesPage", () => {
  it("presenta una empresa, sus conteos y el filtro de estado del servidor", async () => {
    const user = userEvent.setup();
    const requests: URL[] = [];
    server.use(
      http.get("/api/companies/paged", ({ request }) => {
        requests.push(new URL(request.url));
        return HttpResponse.json({ items: [company], page: 1, pageSize: 10, totalCount: 1, totalPages: 1, hasPrevious: false, hasNext: false });
      }),
      http.get("/api/companies/filter-counts", () => HttpResponse.json({ all: 1, active: 1, inactive: 0 })),
    );

    const { router } = renderRouteWithProviders("/org/empresas", { as: "business-e6-admin" });

    expect(await screen.findByRole("heading", { level: 1, name: "Empresas" })).toBeVisible();
    expect(await screen.findByRole("link", { name: "Delta S.A." })).toHaveAttribute("href", "/org/empresas/company-1");
    // Tablero Empresas: el nombre en el color del texto y «Miembros» angosta, con el número a la derecha.
    expect(screen.getByRole("link", { name: "Delta S.A." })).toHaveClass("font-medium", "text-[var(--t1)]");
    expect(screen.getByRole("columnheader", { name: "Empresa" })).toHaveClass("w-[35%]");
    expect(screen.getByRole("columnheader", { name: "Miembros" })).toHaveClass("w-[112px]", "text-right");
    expect(screen.getByRole("columnheader", { name: "Estado" })).toHaveClass("w-[162px]");
    expect(screen.queryByRole("columnheader", { name: "CUIT" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("columnheader").map((header) => header.textContent))
      .toEqual(["Empresa", "Zona horaria", "Miembros", "Estado", "Acciones"]);
    expect(screen.getByText("CUIT 30-71234567-1")).toBeVisible();
    // «Criterio · Tablas» (lienzo v92): el CUIT va en la segunda línea gris, debajo del nombre, y la fila mide 52.
    expect(screen.getByText("CUIT 30-71234567-1").closest('[data-slot="cell-detail"]')).not.toBeNull();
    expect(screen.getAllByRole("row")[1]).toHaveClass("h-[52px]");
    // Tablero Empresas: «1 empresa · 1 activa» y el filtro «Estado: todas».
    expect(screen.getByText("1 empresa · 1 activa")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Estado: todas" }));
    expect((await screen.findAllByRole("menuitemradio")).map((option) => option.textContent?.replace(/\d+$/, ""))).toEqual(["Todas", "Activas", "Inactivas"]);
    await user.click(await screen.findByRole("menuitemradio", { name: /Inactivas/ }));
    await waitFor(() => expect(requests.at(-1)?.searchParams.get("status")).toBe("Inactive"));
    expect(router.state.location.search).toContain("status=Inactive");
  });

  it("muestra 50 empresas cuando la URL pide una página de 50", async () => {
    const companies = Array.from({ length: 50 }, (_item, index) => ({ ...company, id: `company-${index + 1}`, name: `Empresa ${index + 1}`, taxId: index === 49 ? null : company.taxId }));
    server.use(
      http.get("/api/companies/paged", ({ request }) => {
        const url = new URL(request.url);
        const pageSize = Number(url.searchParams.get("pageSize"));
        return HttpResponse.json({ items: companies.slice(0, pageSize), page: 1, pageSize, totalCount: 50, totalPages: Math.ceil(50 / pageSize), hasPrevious: false, hasNext: false });
      }),
      http.get("/api/companies/filter-counts", () => HttpResponse.json({ all: 50, active: 50, inactive: 0 })),
    );

    const { container } = renderRouteWithProviders("/org/empresas?pageSize=50", { as: "business-e6-admin" });
    expect(await screen.findByRole("link", { name: "Empresa 50" })).toHaveAttribute("href", "/org/empresas/company-50");
    expect(screen.getAllByRole("row")).toHaveLength(51);
    expect(screen.getByText(/50 empresas/)).toBeVisible();
    expect(screen.getByText("Sin CUIT")).toHaveAttribute("data-slot", "cell-detail");
    expect(container.querySelector("table")).toBeVisible();
  });

  it("crea una empresa como el tablero: Nombre y CUIT, y «Zona de negocio» con «La de la organización»", async () => {
    const bodies: unknown[] = [];
    const keys: (string | null)[] = [];
    server.use(
      http.get("/api/companies/paged", () => HttpResponse.json({ items: [], page: 1, pageSize: 10, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false })),
      http.get("/api/companies/filter-counts", () => HttpResponse.json({ all: 0, active: 0, inactive: 0 })),
      http.post("/api/companies", async ({ request }) => {
        bodies.push(await request.json());
        keys.push(request.headers.get("Idempotency-Key"));
        return HttpResponse.json("company-created", { status: 201 });
      }),
    );

    const user = userEvent.setup();
    renderRouteWithProviders("/org/empresas", { as: "business-e6-admin" });
    await user.click(await screen.findByRole("button", { name: "Crear empresa" }));
    const dialog = await screen.findByRole("dialog", { name: "Crear empresa" });
    expect(dialog).not.toHaveTextContent("Completá los datos");
    // En el teléfono, una hoja a todo el alto: el cuerpo de los diálogos ocupa lo que sobra y deja los botones abajo.
    expect(dialog).toHaveClass("min-h-[calc(100dvh-1rem)]");
    expect(within(dialog).getByRole("textbox", { name: "Nombre" }).closest("[data-slot='dialog-body']")).not.toBeNull();
    expect(within(dialog).getByRole("textbox", { name: "CUIT" })).toHaveAttribute("placeholder", "30-12345678-1");
    expect(within(dialog).getByRole("combobox", { name: "Zona de negocio" })).toHaveTextContent("La de la organización");

    // Solo el nombre: la zona queda la de la organización.
    await user.click(within(dialog).getByRole("textbox", { name: "Nombre" }));
    await user.paste("Empresa Nueva S.A.");
    await user.click(within(dialog).getByRole("button", { name: "Crear empresa" }));
    await waitFor(() => expect(bodies.at(-1)).toEqual({ name: "Empresa Nueva S.A.", taxIdType: null, taxIdNumber: null, timeZoneId: null }));
    expect(keys.at(-1)).toMatch(/^[0-9a-f-]{36}$/i);
    expect(await screen.findByText("Creamos Empresa Nueva S.A. Quedaste con el rol Administrador.")).toBeVisible();

    // Con CUIT: se guarda como tipo + número.
    await user.click(screen.getByRole("button", { name: "Crear empresa" }));
    const again = await screen.findByRole("dialog", { name: "Crear empresa" });
    await user.click(within(again).getByRole("textbox", { name: "Nombre" }));
    await user.paste("Delta Norte S.A.");
    await user.click(within(again).getByRole("textbox", { name: "CUIT" }));
    await user.paste("30-12345678-9");
    expect(await within(again).findByText("Revisá el CUIT: son 11 números.")).toBeVisible();
    await user.clear(within(again).getByRole("textbox", { name: "CUIT" }));
    await user.click(within(again).getByRole("textbox", { name: "CUIT" }));
    await user.paste("30712345671");
    await user.click(within(again).getByRole("button", { name: "Crear empresa" }));
    await waitFor(() => expect(bodies.at(-1)).toEqual({ name: "Delta Norte S.A.", taxIdType: "AR-CUIT", taxIdNumber: "30712345671", timeZoneId: null }));
  });

  // «Criterio · Botones»: «Crear empresa» no se apaga con el CUIT mal; no manda nada y el campo dice qué corregir.
  it("con el CUIT mal, «Crear empresa» sigue activo, no manda nada y el campo dice qué corregir", async () => {
    let posts = 0;
    server.use(
      http.get("/api/companies/paged", () => HttpResponse.json({ items: [], page: 1, pageSize: 10, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false })),
      http.get("/api/companies/filter-counts", () => HttpResponse.json({ all: 0, active: 0, inactive: 0 })),
      http.post("/api/companies", () => { posts += 1; return HttpResponse.json("company-created", { status: 201 }); }),
    );
    const user = userEvent.setup();
    renderRouteWithProviders("/org/empresas", { as: "business-e6-admin" });
    await user.click(await screen.findByRole("button", { name: "Crear empresa" }));
    const dialog = await screen.findByRole("dialog", { name: "Crear empresa" });
    await user.click(within(dialog).getByRole("textbox", { name: "Nombre" }));
    await user.paste("Delta Norte S.A.");
    await user.click(within(dialog).getByRole("textbox", { name: "CUIT" }));
    await user.paste("3071234567");

    const create = within(dialog).getByRole("button", { name: "Crear empresa" });
    expect(create).toBeEnabled();
    await user.click(create);
    expect(within(dialog).getByRole("textbox", { name: "CUIT" })).toHaveAccessibleDescription("Revisá el CUIT: son 11 números.");
    expect(posts).toBe(0);
  });

  // «Criterio · Diálogos» y «Criterio · Formularios»: el error general del diálogo va en la franja arriba de los botones,
  // no arriba de los campos.
  it("un error al crear va en la franja del diálogo, arriba de los botones", async () => {
    server.use(
      http.get("/api/companies/paged", () => HttpResponse.json({ items: [], page: 1, pageSize: 10, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false })),
      http.get("/api/companies/filter-counts", () => HttpResponse.json({ all: 0, active: 0, inactive: 0 })),
      http.post("/api/companies", () => HttpResponse.json({ status: 409, code: "Tenancy.Company.TaxIdAlreadyUsed", title: "Conflicto",
        detail: "Ya hay una empresa con esa identificación fiscal." }, { status: 409 })),
    );
    const user = userEvent.setup();
    renderRouteWithProviders("/org/empresas", { as: "business-e6-admin" });
    await user.click(await screen.findByRole("button", { name: "Crear empresa" }));
    const dialog = await screen.findByRole("dialog", { name: "Crear empresa" });
    await user.click(within(dialog).getByRole("textbox", { name: "Nombre" }));
    await user.paste("Delta Norte S.A.");
    await user.click(within(dialog).getByRole("textbox", { name: "CUIT" }));
    await user.paste("30712345671");
    await user.click(within(dialog).getByRole("button", { name: "Crear empresa" }));

    const alert = await within(dialog).findByRole("alert");
    expect(alert).toHaveTextContent("Ya hay una empresa con esa identificación fiscal.");
    const following = (from: Node, to: Node) => Boolean(from.compareDocumentPosition(to) & Node.DOCUMENT_POSITION_FOLLOWING);
    expect(following(within(dialog).getByRole("combobox", { name: "Zona de negocio" }), alert)).toBe(true);
    expect(following(alert, within(dialog).getByRole("button", { name: "Cancelar" }))).toBe(true);
    expect(screen.getAllByRole("alert", { hidden: true })).toHaveLength(1);
  });

  it("inactiva una empresa con su versión y confirmación", async () => {
    let requestBody: unknown;
    server.use(
      http.get("/api/companies/paged", () => HttpResponse.json({ items: [company], page: 1, pageSize: 10, totalCount: 1, totalPages: 1, hasPrevious: false, hasNext: false })),
      http.get("/api/companies/filter-counts", () => HttpResponse.json({ all: 1, active: 1, inactive: 0 })),
      http.put("/api/companies/company-1/status", async ({ request }) => {
        requestBody = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const user = userEvent.setup();
    renderRouteWithProviders("/org/empresas", { as: "business-e6-admin" });
    const rowActions = await screen.findByRole("button", { name: "Acciones para Delta S.A." });
    rowActions.focus();
    await user.keyboard("{Enter}");
    // Tablero Empresas: «Ver ficha», «Editar» y, después de la franja, «Inactivar» en rojo.
    expect((await screen.findAllByRole("menuitem")).map((item) => item.textContent)).toEqual(["Ver ficha", "Editar", "Inactivar"]);
    await user.click(await screen.findByRole("menuitem", { name: "Inactivar" }));
    const confirm = await screen.findByRole("dialog", { name: "¿Inactivar Delta S.A.?" });
    expect(confirm).toHaveTextContent("Nadie entra a esta empresa mientras esté inactiva. Sus datos y sus miembros se conservan.");
    await user.click(within(confirm).getByRole("button", { name: "Inactivar" }));

    await waitFor(() => expect(requestBody).toEqual({ status: "Inactive", version: 3 }));
    expect(await screen.findByText("Inactivamos Delta S.A.")).toBeVisible();
  });
});
