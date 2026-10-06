import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/test/mocks/server";
import { changeTenantPublicPage, changeTenantState, createTenant, fetchTenant, fetchTenantCounts, fetchTenantDomains, fetchTenantFeatures, fetchTenantHistory, fetchTenantPublicPage, fetchTenants, removeTenantDomain, retryTenantProvisioning, tenantDomainsQueryKey, tenantFeaturesQueryKey, tenantHistoryQueryKey, tenantPublicPageQueryKey, tenantQueryKey, tenantsQueryRoot, updateTenantFeature, verifyTenantDomain } from "./tenants";

describe("API de Organizaciones", () => {
  it("subrecursos usan ids/claves opacos escapados y raíz de Query", async () => {
    server.use(http.get("/api/platform/tenants/org%2F1/features", () => HttpResponse.json([])), http.get("/api/platform/tenants/org%2F1/domains", () => HttpResponse.json([])), http.get("/api/platform/tenants/org%2F1/public-site", () => HttpResponse.json({ slug: null, name: "Organización", isPublished: false, version: 0 })));
    expect(await fetchTenantFeatures("org/1")).toEqual([]); expect(await fetchTenantDomains("org/1")).toEqual([]); expect(await fetchTenantPublicPage("org/1")).toMatchObject({ version: 0 });
    expect(tenantFeaturesQueryKey("org/1")).toEqual([...tenantsQueryRoot, "features", "org/1"]); expect(tenantDomainsQueryKey("org/1")).toEqual([...tenantsQueryRoot, "domains", "org/1"]); expect(tenantPublicPageQueryKey("org/1")).toEqual([...tenantsQueryRoot, "public-site", "org/1"]);
  });
  it("PUT y DELETE mandan el cuerpo/version, sin Idempotency-Key", async () => {
    const bodies: unknown[] = []; const keys: (string | null)[] = [];
    server.use(http.put("/api/platform/tenants/org%2F1/features/module%2Fkey", async ({ request }) => { bodies.push(await request.json()); keys.push(request.headers.get("Idempotency-Key")); return HttpResponse.json({ version: 90 }); }), http.delete("/api/platform/tenants/org%2F1/domains/example.com", async ({ request }) => { bodies.push(await request.json()); keys.push(request.headers.get("Idempotency-Key")); return new HttpResponse(null, { status: 204 }); }));
    const feature = { enabled: true, source: "Trial" as const, expiresOn: "2026-10-30", version: 0, reason: "Prueba" };
    expect(await updateTenantFeature("org/1", "module/key", feature)).toEqual({ version: 90 }); expect(await removeTenantDomain("org/1", "example.com", { version: 90, reason: "Quitar" })).toBeUndefined();
    expect(bodies).toEqual([feature, { version: 90, reason: "Quitar" }]); expect(keys).toEqual([null, null]);
  });
  it.each(["unpublish", "allow-publish"] as const)("página %s manda motivo/version y clave recibida", async (action) => {
    let body: unknown; let key: string | null = null; server.use(http.post(`/api/platform/tenants/org%2F1/public-site/${action}`, async ({ request }) => { body = await request.json(); key = request.headers.get("Idempotency-Key"); return HttpResponse.json({ version: 90 }); }));
    expect(await changeTenantPublicPage("org/1", action, { version: 89, reason: "Revisión" }, "page-key")).toEqual({ version: 90 }); expect(body).toEqual({ version: 89, reason: "Revisión" }); expect(key).toBe("page-key");
  });
  it("Verificar manda dominio normalizado real, motivo/version y clave recibida", async () => {
    let body: unknown; let key: string | null = null; server.use(http.post("/api/platform/tenants/org%2F1/domains/example.com/verify", async ({ request }) => { body = await request.json(); key = request.headers.get("Idempotency-Key"); return HttpResponse.json({ version: 90 }); }));
    expect(await verifyTenantDomain("org/1", "example.com", { version: 89, reason: "Verificar el dominio" }, "verify-key")).toEqual({ version: 90 }); expect(body).toEqual({ version: 89, reason: "Verificar el dominio" }); expect(key).toBe("verify-key");
  });
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
