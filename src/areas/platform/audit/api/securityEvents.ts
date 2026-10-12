import { api } from "@/shared/api/httpClient";
import type { PagedRequest, PagedResultOfPlatformAuditOrganizationResponse, PlatformAuditCursorResponse, PlatformAuditOrganizationResponse } from "@/shared/api/types";
import { optionPage, type ResourceOptions } from "@/shared/api/resourceOptions";
import { toSearch } from "@/shared/api/toSearch";

export interface SecurityEventsQuery {
  after?: string;
  limit?: number;
  period?: string;
  type?: string;
  tenantId?: string;
  accountId?: string;
  search?: string;
}

export const securityEventsQueryRoot = ["platform-audit"] as const;

function queryString(query: SecurityEventsQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  return params.toString();
}

export function fetchSecurityEvents(query: SecurityEventsQuery): Promise<PlatformAuditCursorResponse> {
  const search = queryString(query);
  return api.get<PlatformAuditCursorResponse>(`/api/platform/audit${search ? `?${search}` : ""}`);
}

type OrganizationOptionsFilters = Omit<SecurityEventsQuery, "after" | "limit" | "tenantId">;

export function fetchAuditOrganizations(filters: OrganizationOptionsFilters, page: PagedRequest = optionPage, signal?: AbortSignal): Promise<PagedResultOfPlatformAuditOrganizationResponse> {
  const { search: auditSearch, ...otherFilters } = filters;
  return api.get(`/api/platform/audit/organizations/paged?${toSearch({ ...otherFilters, auditSearch, ...page })}`, { signal });
}

export function auditOrganizationOptions(filters: OrganizationOptionsFilters): ResourceOptions<PlatformAuditOrganizationResponse> {
  return { queryKeyRoot: [...securityEventsQueryRoot, "organization-options", filters], lookupKeyRoot: [...securityEventsQueryRoot, "organization-options"],
    id: (organization) => organization.id, queryFn: (query, signal) => fetchAuditOrganizations(filters, query, signal) };
}
