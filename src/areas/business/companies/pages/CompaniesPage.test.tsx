import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { configureI18n, changeCulture } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";

const company = {
  id: "company-1", name: "Delta S.A.", taxId: { country: "AR", type: "AR-CUIT", number: "30712345678" },
  timeZoneId: "America/Argentina/Buenos_Aires", status: "Active" as const, memberCount: 1,
  version: 3, createdAtUtc: "2026-09-27T12:00:00Z",
};

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
    expect(screen.getByRole("columnheader", { name: "CUIT" })).toBeVisible();
    expect(screen.getByText(/1 empresa/)).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Todos los estados" }));
    await user.click(await screen.findByRole("menuitemradio", { name: /Inactivas/ }));
    await waitFor(() => expect(requests.at(-1)?.searchParams.get("status")).toBe("Inactive"));
    expect(router.state.location.search).toContain("status=Inactive");
  }, 10_000);

  it("muestra 50 empresas cuando la URL pide una página de 50", async () => {
    const companies = Array.from({ length: 50 }, (_item, index) => ({ ...company, id: `company-${index + 1}`, name: `Empresa ${index + 1}` }));
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
    expect(container.querySelector("table")).toBeVisible();
  }, 10_000);

  it("crea una empresa con idempotencia y la zona del catálogo", async () => {
    let requestBody: unknown;
    let idempotencyKey: string | null = null;
    server.use(
      http.get("/api/companies/paged", () => HttpResponse.json({ items: [], page: 1, pageSize: 10, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false })),
      http.get("/api/companies/filter-counts", () => HttpResponse.json({ all: 0, active: 0, inactive: 0 })),
      http.post("/api/companies", async ({ request }) => {
        requestBody = await request.json();
        idempotencyKey = request.headers.get("Idempotency-Key");
        return HttpResponse.json("company-created", { status: 201 });
      }),
    );

    const user = userEvent.setup();
    renderRouteWithProviders("/org/empresas", { as: "business-e6-admin" });
    await user.click(await screen.findByRole("button", { name: "Crear empresa" }));
    await user.type(screen.getByRole("textbox", { name: "Nombre" }), "Empresa Nueva S.A.");
    await user.click(await screen.findByRole("combobox", { name: "Zona de negocio" }));
    await user.click(await screen.findByRole("option", { name: "Buenos Aires (GMT−3)" }));
    await user.click(screen.getAllByRole("button", { name: "Crear empresa" }).at(-1)!);

    await waitFor(() => expect(requestBody).toEqual({ name: "Empresa Nueva S.A.", taxIdType: null, taxIdNumber: null, timeZoneId: "America/Argentina/Buenos_Aires" }));
    expect(idempotencyKey).toMatch(/^[0-9a-f-]{36}$/i);
  }, 10_000);

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
    await user.click(await screen.findByRole("menuitem", { name: "Cambiar estado" }));
    await user.click(await screen.findByRole("button", { name: "Inactivar empresa" }));

    await waitFor(() => expect(requestBody).toEqual({ status: "Inactive", version: 3 }));
  }, 10_000);
});
