import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/test/mocks/server";
import { changeTenantState, createTenant, fetchTenant, fetchTenantCounts, fetchTenantHistory, fetchTenants, retryTenantProvisioning, tenantHistoryQueryKey, tenantQueryKey, tenantsQueryRoot } from "./tenants";

describe("API de Organizaciones", () => {
  it("detalle e historial usan el id escapado, cursor opaco, límite y raíz común", async () => {
    const urls: URL[] = [];
    server.use(http.get("/api/platform/tenants/org%2F1", ({ request }) => { urls.push(new URL(request.url)); return HttpResponse.json({ id: "org/1", owners: [] }); }), http.get("/api/platform/tenants/org%2F1/history", ({ request }) => { urls.push(new URL(request.url)); return HttpResponse.json({ items: [], hasMore: false }); }));
    expect(await fetchTenant("org/1")).toMatchObject({ id: "org/1", owners: [] }); await fetchTenantHistory("org/1", "opaque/&="); await fetchTenantHistory("org/1", null);
    expect(Object.fromEntries(urls[1].searchParams)).toEqual({ after: "opaque/&=", limit: "25" }); expect(Object.fromEntries(urls[2].searchParams)).toEqual({ limit: "25" });
    expect(tenantQueryKey("org/1")).toEqual([...tenantsQueryRoot, "detail", "org/1"]); expect(tenantHistoryQueryKey("org/1")).toEqual([...tenantsQueryRoot, "history", "org/1"]);
  });
  it("envía paginado, orden, búsqueda y filtros al contrato de Plataforma", async () => {
    const urls: URL[] = [];
    server.use(http.get("/api/platform/tenants/paged", ({ request }) => { urls.push(new URL(request.url)); return HttpResponse.json({ items: [], page: 2, pageSize: 50, totalCount: 0, totalPages: 0, hasPrevious: true, hasNext: false }); }), http.get("/api/platform/tenants/filter-counts", ({ request }) => { urls.push(new URL(request.url)); return HttpResponse.json({ total: 0, statuses: [], sources: [] }); }));
    await fetchTenants({ page: 2, pageSize: 50, sort: "name", search: "Grupo & Hijos", status: "PendingApproval", source: "Platform" });
    await fetchTenantCounts({ search: "Grupo & Hijos", status: "PendingApproval", source: "Platform" });
    expect(Object.fromEntries(urls[0].searchParams)).toEqual({ page: "2", pageSize: "50", sort: "name", search: "Grupo & Hijos", status: "PendingApproval", source: "Platform" });
    expect(Object.fromEntries(urls[1].searchParams)).toEqual({ search: "Grupo & Hijos", status: "PendingApproval", source: "Platform" });
  });
  it.each(["approve", "reject", "suspend", "reactivate", "close"] as const)("%s manda versión, motivo y clave recibida y devuelve la versión original", async (action) => {
    let body: unknown; let key: string | null = null;
    server.use(http.post(`/api/platform/tenants/org%2F1/${action}`, async ({ request }) => { body = await request.json(); key = request.headers.get("Idempotency-Key"); return HttpResponse.json({ version: 87 }); }));
    expect(await changeTenantState("org/1", action, { version: 45, reason: "Revisión" }, "stable-key")).toEqual({ version: 87 });
    expect(body).toEqual({ version: 45, reason: "Revisión" }); expect(key).toBe("stable-key");
  });
  it("reintentar alta manda sólo versión y crear conserva los cinco campos", async () => {
    const bodies: unknown[] = []; const keys: (string | null)[] = [];
    server.use(http.post("/api/platform/tenants/delta/retry-provisioning", async ({ request }) => { bodies.push(await request.json()); keys.push(request.headers.get("Idempotency-Key")); return HttpResponse.json({ version: 4 }); }), http.post("/api/platform/tenants", async ({ request }) => { bodies.push(await request.json()); keys.push(request.headers.get("Idempotency-Key")); return HttpResponse.json({ id: "delta", name: "Delta", slug: "delta", firstCompanyId: "company", invitationId: "invite" }, { status: 201 }); }));
    expect(await retryTenantProvisioning("delta", { version: 2 }, "retry-key")).toEqual({ version: 4 });
    const create = { name: "Delta", firstCompanyName: "Delta S.A.", ownerEmail: "lucia@example.com", culture: "es-AR", timeZoneId: "America/Argentina/Buenos_Aires" };
    expect(await createTenant(create, "create-key")).toMatchObject({ id: "delta", name: "Delta" });
    expect(bodies).toEqual([{ version: 2 }, create]); expect(keys).toEqual(["retry-key", "create-key"]);
  });
});
