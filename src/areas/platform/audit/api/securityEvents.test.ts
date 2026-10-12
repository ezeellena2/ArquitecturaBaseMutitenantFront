import { pagedOptions } from "@/test/mocks/pagedOptions";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/test/mocks/server";
import { fetchSecurityEvents, fetchAuditOrganizations, securityEventsQueryRoot } from "./securityEvents";

describe("Contrato HTTP de Auditoría de Plataforma", () => {
  it("manda filtros y cursor opaco sin convertirlo, con límite 25", async () => {
    let params: URLSearchParams | undefined;
    server.use(http.get("/api/platform/audit", ({ request }) => {
      params = new URL(request.url).searchParams;
      return HttpResponse.json({ items: [], nextCursor: "AQopaque/+==", hasMore: true });
    }));
    expect(await fetchSecurityEvents({ period: "7", type: "accounts", tenantId: "org-1", accountId: "account-1", search: "Ana & Hijos", after: "AQopaque/+==", limit: 25 }))
      .toEqual({ items: [], nextCursor: "AQopaque/+==", hasMore: true });
    expect(Object.fromEntries(params!)).toEqual({ period: "7", type: "accounts", tenantId: "org-1", accountId: "account-1", search: "Ana & Hijos", after: "AQopaque/+==", limit: "25" });
    expect(securityEventsQueryRoot).toEqual(["platform-audit"]);
  });

  it("las organizaciones conservan filtros cruzados y omiten filtro propio, cursor y límite", async () => {
    let params: URLSearchParams | undefined;
    server.use(http.get("/api/platform/audit/organizations/paged", ({ request }) => {
      params = new URL(request.url).searchParams;
      return HttpResponse.json(pagedOptions([{ id: "org-1", name: "Grupo Delta" }]));
    }));
    expect(await fetchAuditOrganizations({ period: "all", type: "organizations", search: "Grupo Delta", accountId: "account-1" })).toEqual(pagedOptions([{ id: "org-1", name: "Grupo Delta" }]));
    expect(Object.fromEntries(params!)).toEqual({ period: "all", type: "organizations", auditSearch: "Grupo Delta", accountId: "account-1", page: "1", pageSize: "10", sort: "name" });
  });

  it("sin búsqueda ni filtros opcionales no manda valores vacíos", async () => {
    let params: URLSearchParams | undefined;
    server.use(http.get("/api/platform/audit", ({ request }) => { params = new URL(request.url).searchParams; return HttpResponse.json({ items: [], hasMore: false }); }));
    await fetchSecurityEvents({ period: "30", search: "", type: undefined, after: undefined, limit: 25 });
    expect(Object.fromEntries(params!)).toEqual({ period: "30", limit: "25" });
  });
});
