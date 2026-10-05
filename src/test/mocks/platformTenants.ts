import type { ApiSchemas } from "@/shared/api/types";

// Datos literales de Organizaciones v111; el orden ilustrativo se conserva sólo en la captura.
export const platformTenantRows: ApiSchemas["PlatformTenantResponse"][] = [
  { id: "tenant-3", name: "Gamma S.A.", slug: "gamma", ownerName: "Julio Pérez", ownerEmail: "julio@gamma.ejemplo.com", companyCount: 1, memberCount: 1, createdAtUtc: "2026-09-27T15:00:00Z", source: "SelfService", status: "PendingApproval", version: 1 },
  { id: "tenant-4", name: "Épsilon S.R.L.", slug: "epsilon", ownerName: "Morena Paz", ownerEmail: "morena@epsilon.ejemplo.com", companyCount: 1, memberCount: 1, createdAtUtc: "2026-09-26T15:00:00Z", source: "SelfService", status: "PendingApproval", version: 1 },
  { id: "tenant-1", name: "Grupo Delta", slug: "delta", ownerName: "Lucía Fernández", ownerEmail: "lucia.fernandez@delta.ejemplo.com", companyCount: 3, memberCount: 11, createdAtUtc: "2026-01-12T15:00:00Z", source: "SelfService", status: "Active", version: 1 },
  { id: "tenant-5", name: "Omega S.A.", slug: "omega", ownerName: null, ownerEmail: "gerencia@omega.ejemplo.com", companyCount: 1, memberCount: 1, createdAtUtc: "2026-09-20T15:00:00Z", source: "Platform", status: "Active", version: 1 },
  { id: "tenant-2", name: "Beta S.R.L.", slug: "beta", ownerName: "Beto Ramírez", ownerEmail: "beto.ramirez@beta.ejemplo.com", companyCount: 1, memberCount: 6, createdAtUtc: "2026-02-03T15:00:00Z", source: "SelfService", status: "Suspended", version: 1 },
  { id: "tenant-6", name: "Sigma S.A.", slug: "sigma", ownerName: "Rosa Luna", ownerEmail: "rosa@sigma.ejemplo.com", companyCount: 0, memberCount: 0, createdAtUtc: "2026-09-27T15:00:00Z", source: "SelfService", status: "Provisioning", version: 1 },
  { id: "tenant-7", name: "Kappa S.R.L.", slug: "kappa", ownerName: "Pablo Ortiz", ownerEmail: "pablo@kappa.ejemplo.com", companyCount: 2, memberCount: 4, createdAtUtc: "2026-03-15T15:00:00Z", source: "Platform", status: "Closed", version: 1 },
];

export function platformTenantsPage(rows: readonly ApiSchemas["PlatformTenantResponse"][], pageSize = 10): ApiSchemas["PagedResultOfPlatformTenantResponse"] {
  return { items: rows.slice(0, pageSize), page: 1, pageSize, totalCount: rows.length, totalPages: Math.ceil(rows.length / pageSize), hasPrevious: false, hasNext: rows.length > pageSize };
}

export function platformTenantsCounts(rows: readonly ApiSchemas["PlatformTenantResponse"][]): ApiSchemas["PlatformTenantFilterCounts"] {
  return { total: rows.length,
    statuses: (["PendingApproval", "Active", "Suspended", "Provisioning", "Closed"] as const).map((status) => ({ status, count: rows.filter((row) => row.status === status).length })),
    sources: (["SelfService", "Platform"] as const).map((source) => ({ source, count: rows.filter((row) => row.source === source).length })),
  };
}

// Los 43 registros adicionales son exclusivamente datos para paginado; el tablero no los dibuja.
export function platformTenantsCaptureResponses({ many = false, conflict = false } = {}) {
  const rows = many ? [...platformTenantRows, ...Array.from({ length: 43 }, (_, index): ApiSchemas["PlatformTenantResponse"] => ({
    ...platformTenantRows[2]!, id: `tenant-test-${index + 8}`, name: `Organización de prueba ${index + 8}`, slug: `prueba-${index + 8}`,
  }))] : platformTenantRows;
  return [
    { method: "GET", path: "/api/platform/tenants/paged", query: { search: "sin coincidencias" }, status: 200, body: platformTenantsPage([]) },
    ...[50, 20, 10].map((pageSize) => ({ method: "GET", path: "/api/platform/tenants/paged", query: { pageSize: String(pageSize) }, status: 200, body: platformTenantsPage(rows, pageSize) })),
    { method: "GET", path: "/api/platform/tenants/paged", status: 200, body: platformTenantsPage(rows) },
    { method: "GET", path: "/api/platform/tenants/filter-counts", query: { search: "sin coincidencias" }, status: 200, body: platformTenantsCounts([]) },
    { method: "GET", path: "/api/platform/tenants/filter-counts", status: 200, body: platformTenantsCounts(rows) },
    { method: "POST", path: "/api/platform/tenants/tenant-1/suspend", status: conflict ? 409 : 200,
      body: conflict ? { code: "Tenancy.Tenant.InvalidTransition", detail: "La organización no puede pasar a ese estado.", traceId: "capture" } : { version: 2 } },
  ];
}
