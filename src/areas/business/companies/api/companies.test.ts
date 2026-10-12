import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/test/mocks/server";
import { fetchAssignableCompanyRoles } from "./companies";

const anyCompany = { id: "role-admin", name: "Administrador", scope: "AnyCompany", companyId: null };
const page = (items: unknown[]) => ({ items, page: 1, pageSize: 100, totalCount: items.length, totalPages: 1, hasPrevious: false, hasNext: false });

describe("roles que se asignan en una empresa", () => {
  // B4: el Administrador de empresa no tiene `roles.read`; la ruta de la empresa pide `company.members.read` y el back
  // ya filtra los roles de cualquier empresa y los propios.
  it("quien ve los miembros los pide a la ruta de la empresa, sin filtrar nada en el cliente", async () => {
    const queries: string[] = [];
    server.use(http.get("/api/companies/company-1/roles/paged", ({ request }) => {
      queries.push(new URL(request.url).search);
      return HttpResponse.json(page([anyCompany]));
    }));

    await expect(fetchAssignableCompanyRoles("company-1", true)).resolves.toEqual(page([anyCompany]));
    expect(queries).toEqual(["?page=1&pageSize=10&sort=name"]);
  });

  it("quien solo ve los roles de la organización los pide con la empresa, y el back filtra", async () => {
    const queries: string[] = [];
    server.use(http.get("/api/roles/paged", ({ request }) => {
      queries.push(new URL(request.url).search);
      return HttpResponse.json(page([anyCompany]));
    }));

    await expect(fetchAssignableCompanyRoles("company-1", false)).resolves.toEqual(page([anyCompany]));
    expect(queries).toEqual(["?page=1&pageSize=10&sort=name&scope=Company&companyId=company-1"]);
  });
});
