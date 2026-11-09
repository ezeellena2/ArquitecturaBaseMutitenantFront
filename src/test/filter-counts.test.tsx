import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse, type JsonBodyType } from "msw";
import { beforeEach, expect, it } from "vitest";
import { configureI18n, changeCulture } from "@/shared/i18n";
import type { CurrentUserFixture } from "@/test/mocks/currentUsers";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { accountCounts } from "@/test/mocks/platformAccounts";
import { platformTenantsCounts } from "@/test/mocks/platformTenants";
import { server } from "@/test/mocks/server";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";

beforeEach(async () => {
  await configureI18n(referenceDataFixture().cultures);
  await changeCulture("es-AR");
});

const emptyPage = { items: [], page: 1, pageSize: 10, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false };

// Los filtros no llevan cantidades (143): de los conteos, cada lista lee solo el resumen de todo lo suyo. Se piden una vez,
// sin la búsqueda ni los filtros, y buscar vuelve a pedir la lista, no los conteos.
it.each<{ route: string; as: CurrentUserFixture; endpoint: string; label: string; payload: JsonBodyType }>([
  { route: "/org/roles", as: "business-e6-admin", endpoint: "/api/roles", label: "Buscar por nombre o descripción", payload: { matching: { all: 0, organization: 0, company: 0 }, total: { all: 0, organization: 0, company: 0 }, anyCompany: 0, companies: {} } },
  { route: "/org/usuarios", as: "business-e6-admin", endpoint: "/api/users", label: "Buscar por nombre o correo", payload: { all: 0, active: 0, pendingDeletion: 0, invited: 0, expired: 0, inactive: 0, companyAll: 0, withoutCompany: 0, companies: {} } },
  { route: "/plataforma/cuentas", as: "platform-operator", endpoint: "/api/platform/accounts", label: "Buscar por nombre, correo o teléfono", payload: accountCounts([]) },
  { route: "/plataforma/organizaciones", as: "platform-operator", endpoint: "/api/platform/tenants", label: "Buscar por nombre o correo", payload: platformTenantsCounts([]) },
  { route: "/plataforma/recuperaciones", as: "platform-operator", endpoint: "/api/platform/recoveries", label: "Buscar por cuenta, correo o teléfono", payload: { total: 0, statuses: [] } },
])("$route pide los conteos una sola vez, sin la búsqueda", async ({ route, as, endpoint, label, payload }) => {
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
      return HttpResponse.json(emptyPage);
    }),
    http.get(`${endpoint}/filter-counts`, ({ request }) => {
      requests.push(new URL(request.url));
      return HttpResponse.json(payload);
    }),
  );
  renderRouteWithProviders(route, { as });
  const search = await screen.findByRole("searchbox", { name: label });
  await waitFor(() => expect(listRequests.length).toBeGreaterThan(0));
  await waitFor(() => expect(requests).toHaveLength(1));
  await user.type(search, "Delta");
  await waitFor(() => expect(listRequests.at(-1)?.searchParams.get("search")).toBe("Delta"));
  expect(listRequests.filter((url) => url.searchParams.get("search") === "Delta")).toHaveLength(1);
  expect(listRequests.every((url) => !url.searchParams.has("companyId"))).toBe(true);
  expect(requests).toHaveLength(1);
  expect(requests[0].search).toBe("");
}, 15_000);
