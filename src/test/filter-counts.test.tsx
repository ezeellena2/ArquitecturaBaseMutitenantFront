import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, expect, it } from "vitest";
import { configureI18n, changeCulture } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";

beforeEach(async () => {
  await configureI18n(referenceDataFixture().cultures);
  await changeCulture("es-AR");
});

it.each([
  { route: "/org/roles", endpoint: "/api/roles", label: "Buscar por nombre o descripción", payload: { matching: { all: 0, organization: 0, company: 0 }, total: { all: 0, organization: 0, company: 0 }, anyCompany: 0, companies: {} } },
  { route: "/org/usuarios", endpoint: "/api/users", label: "Buscar por nombre o correo", payload: { all: 0, active: 0, pendingDeletion: 0, invited: 0, expired: 0, inactive: 0, companyAll: 0, withoutCompany: 0, companies: {} } },
])("$route hace un solo pedido de conteos por búsqueda con muchas empresas", async ({ route, endpoint, label, payload }) => {
  const user = userEvent.setup();
  const requests: URL[] = [];
  const listRequests: URL[] = [];
  server.use(
    http.get("/api/companies/paged", () => HttpResponse.json({
      items: Array.from({ length: 10 }, (_, index) => ({ id: `company-${index}`, name: `Empresa ${index}`, status: "Active" })),
      page: 1, pageSize: 10, totalCount: 101, totalPages: 11, hasPrevious: false, hasNext: true,
    })),
    http.get(`${endpoint}/paged`, ({ request }) => {
      listRequests.push(new URL(request.url));
      return HttpResponse.json({ items: [], page: 1, pageSize: 10, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false });
    }),
    http.get(`${endpoint}/filter-counts`, ({ request }) => {
      requests.push(new URL(request.url));
      return HttpResponse.json(payload);
    }),
  );
  renderRouteWithProviders(route, { as: "business-e6-admin" });
  const search = await screen.findByRole("searchbox", { name: label });
  await waitFor(() => expect(listRequests.length).toBeGreaterThan(0));
  await waitFor(() => expect(requests).toHaveLength(1));
  await user.type(search, "Delta");
  await waitFor(() => expect(listRequests.at(-1)?.searchParams.get("search")).toBe("Delta"));
  await waitFor(() => expect(requests.filter((url) => url.searchParams.get("search") === "Delta")).toHaveLength(1));
  expect(requests).toHaveLength(2);
  expect(requests.every((url) => !url.searchParams.has("companyId"))).toBe(true);
}, 15_000);
