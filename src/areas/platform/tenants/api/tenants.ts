import { api } from "@/shared/api/httpClient";
import type { PagedResult } from "@/shared/api/pagedResult";
import type { CreatePlatformTenantRequest, CreatedPlatformTenantResponse, PagedRequest, PlatformTenantDetailResponse, PlatformTenantFilterCounts, PlatformTenantHistoryCursorResponse, PlatformTenantResponse, PlatformTenantRetryRequest, PlatformTenantStateRequest, TenantRegistrationSource, TenantStatus, VersionResponse } from "@/shared/api/types";

export interface TenantsQuery extends PagedRequest { status?: TenantStatus; source?: TenantRegistrationSource }
export type TenantCountsQuery = Pick<TenantsQuery, "search" | "status" | "source">;
export type TenantAction = "approve" | "reject" | "suspend" | "reactivate" | "close";
export const tenantsQueryRoot = ["platform-tenants"] as const;
export const tenantsQueryKey = (query: TenantsQuery) => [...tenantsQueryRoot, "paged", query] as const;
export const tenantCountsQueryKey = (query: TenantCountsQuery) => [...tenantsQueryRoot, "counts", query] as const;
export const tenantQueryKey = (id: string) => [...tenantsQueryRoot, "detail", id] as const;
export const tenantHistoryQueryKey = (id: string) => [...tenantsQueryRoot, "history", id] as const;

export function fetchTenant(id: string): Promise<PlatformTenantDetailResponse> {
  return api.get<PlatformTenantDetailResponse>(`/api/platform/tenants/${encodeURIComponent(id)}`);
}
export function fetchTenantHistory(id: string, after: string | null, limit = 25): Promise<PlatformTenantHistoryCursorResponse> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (after !== null) params.set("after", after);
  return api.get<PlatformTenantHistoryCursorResponse>(`/api/platform/tenants/${encodeURIComponent(id)}/history?${params}`);
}

function toSearch(query: TenantsQuery | TenantCountsQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  const search = params.toString();
  return search ? `?${search}` : "";
}
export function fetchTenants(query: TenantsQuery): Promise<PagedResult<PlatformTenantResponse>> {
  return api.get<PagedResult<PlatformTenantResponse>>(`/api/platform/tenants/paged${toSearch(query)}`);
}
export function fetchTenantCounts(query: TenantCountsQuery): Promise<PlatformTenantFilterCounts> {
  return api.get<PlatformTenantFilterCounts>(`/api/platform/tenants/filter-counts${toSearch(query)}`);
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
