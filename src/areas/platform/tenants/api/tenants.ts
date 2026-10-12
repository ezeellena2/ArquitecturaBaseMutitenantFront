import { toSearch } from "@/shared/api/toSearch";
import { api } from "@/shared/api/httpClient";
import type { PagedResult } from "@/shared/api/pagedResult";
import type { CreatePlatformTenantRequest, CreatedPlatformTenantResponse, OrganizationDomainResponse, PagedRequest, PlatformFeatureResponse, PlatformPublicSiteResponse, PlatformTenantDetailResponse, PlatformTenantFilterCounts, PlatformTenantHistoryCursorResponse, PlatformTenantResponse, PlatformTenantRetryRequest, PlatformTenantStateRequest, TenantRegistrationSource, TenantStatus, UpdatePlatformFeatureRequest, VersionResponse } from "@/shared/api/types";

export interface TenantsQuery extends PagedRequest { status?: TenantStatus; source?: TenantRegistrationSource }
export type TenantCountsQuery = Pick<TenantsQuery, "search" | "status" | "source">;
export type TenantAction = "approve" | "reject" | "suspend" | "reactivate" | "close";
export const tenantsQueryRoot = ["platform-tenants"] as const;
export const tenantsQueryKey = (query: TenantsQuery) => [...tenantsQueryRoot, "paged", query] as const;
export const tenantCountsQueryKey = (query: TenantCountsQuery) => [...tenantsQueryRoot, "counts", query] as const;
export const tenantQueryKey = (id: string) => [...tenantsQueryRoot, "detail", id] as const;
export const tenantHistoryQueryKey = (id: string) => [...tenantsQueryRoot, "history", id] as const;
export const tenantFeaturesQueryKey = (id: string) => [...tenantsQueryRoot, "features", id] as const;
export const tenantDomainsQueryKey = (id: string) => [...tenantsQueryRoot, "domains", id] as const;
export const tenantPublicPageQueryKey = (id: string) => [...tenantsQueryRoot, "public-site", id] as const;

export function fetchTenantFeatures(id: string): Promise<PlatformFeatureResponse[]> {
  return api.get(`/api/platform/tenants/${encodeURIComponent(id)}/features`);
}
export function updateTenantFeature(id: string, key: string, request: UpdatePlatformFeatureRequest): Promise<VersionResponse> {
  return api.put(`/api/platform/tenants/${encodeURIComponent(id)}/features/${encodeURIComponent(key)}`, request);
}
export function fetchTenantDomains(id: string): Promise<OrganizationDomainResponse[]> {
  return api.get(`/api/platform/tenants/${encodeURIComponent(id)}/domains`);
}
export function verifyTenantDomain(id: string, domain: string, request: PlatformTenantStateRequest, key: string): Promise<VersionResponse> {
  return api.post(`/api/platform/tenants/${encodeURIComponent(id)}/domains/${encodeURIComponent(domain)}/verify`, request, { headers: { "Idempotency-Key": key } });
}
export function removeTenantDomain(id: string, domain: string, request: PlatformTenantStateRequest): Promise<void> {
  return api.delete(`/api/platform/tenants/${encodeURIComponent(id)}/domains/${encodeURIComponent(domain)}`, { body: JSON.stringify(request) });
}
export function fetchTenantPublicPage(id: string): Promise<PlatformPublicSiteResponse> {
  return api.get(`/api/platform/tenants/${encodeURIComponent(id)}/public-site`);
}
export type PublicPageAction = "unpublish" | "allow-publish";
export function changeTenantPublicPage(id: string, action: PublicPageAction, request: PlatformTenantStateRequest, key: string): Promise<VersionResponse> {
  return api.post(`/api/platform/tenants/${encodeURIComponent(id)}/public-site/${action}`, request, { headers: { "Idempotency-Key": key } });
}

export function fetchTenant(id: string): Promise<PlatformTenantDetailResponse> {
  return api.get<PlatformTenantDetailResponse>(`/api/platform/tenants/${encodeURIComponent(id)}`);
}
export function fetchTenantHistory(id: string, after: string | null, limit = 25): Promise<PlatformTenantHistoryCursorResponse> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (after !== null) params.set("after", after);
  return api.get<PlatformTenantHistoryCursorResponse>(`/api/platform/tenants/${encodeURIComponent(id)}/history?${params}`);
}

export function fetchTenants(query: TenantsQuery): Promise<PagedResult<PlatformTenantResponse>> {
  return api.get<PagedResult<PlatformTenantResponse>>(`/api/platform/tenants/paged${toSearch(query, true)}`);
}
export function fetchTenantCounts(query: TenantCountsQuery): Promise<PlatformTenantFilterCounts> {
  return api.get<PlatformTenantFilterCounts>(`/api/platform/tenants/filter-counts${toSearch(query, true)}`);
}
export function createTenant(request: CreatePlatformTenantRequest, idempotencyKey: string): Promise<CreatedPlatformTenantResponse> {
  return api.post<CreatedPlatformTenantResponse>("/api/platform/tenants", request, { headers: { "Idempotency-Key": idempotencyKey } });
}
export function changeTenantState(id: string, action: TenantAction, request: PlatformTenantStateRequest, idempotencyKey: string): Promise<VersionResponse> {
  return api.post<VersionResponse>(`/api/platform/tenants/${encodeURIComponent(id)}/${action}`, request, { headers: { "Idempotency-Key": idempotencyKey } });
}
export function retryTenantProvisioning(id: string, request: PlatformTenantRetryRequest, idempotencyKey: string): Promise<VersionResponse> {
  return api.post<VersionResponse>(`/api/platform/tenants/${encodeURIComponent(id)}/retry-provisioning`, request, { headers: { "Idempotency-Key": idempotencyKey } });
}
