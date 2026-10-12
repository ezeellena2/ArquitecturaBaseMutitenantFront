import { toSearch } from "@/shared/api/toSearch";
import { api } from "@/shared/api/httpClient";
import type { OrganizationDomainPageResponse, PagedRequest, OrganizationDomainResponse, OrganizationSettingsResponse, RegisterOrganizationDomainRequest, UpdateOrganizationSettingsRequest, VersionResponse } from "@/shared/api/types";

export const organizationSettingsKey = ["organization-settings"] as const;
export const organizationDomainsKey = ["organization-domains"] as const;

export function fetchOrganizationSettings(): Promise<OrganizationSettingsResponse> {
  return api.get<OrganizationSettingsResponse>("/api/organization/settings");
}

export function updateOrganizationSettings(request: UpdateOrganizationSettingsRequest): Promise<VersionResponse> {
  return api.put<VersionResponse>("/api/organization/settings", request);
}

export const organizationDomainsPageKey = (query: PagedRequest) => [...organizationDomainsKey, "paged", query] as const;
export function fetchOrganizationDomainsPage(query: PagedRequest): Promise<OrganizationDomainPageResponse> {
  return api.get(`/api/organization/settings/domains/paged?${toSearch(query)}`);
}

export function fetchOrganizationDomains(): Promise<OrganizationDomainResponse[]> {
  return api.get<OrganizationDomainResponse[]>("/api/organization/settings/domains");
}

export function registerOrganizationDomain(request: RegisterOrganizationDomainRequest, idempotencyKey: string): Promise<OrganizationDomainResponse> {
  return api.post<OrganizationDomainResponse>("/api/organization/settings/domains", request, { headers: { "Idempotency-Key": idempotencyKey } });
}

export function verifyOrganizationDomain(domainId: string): Promise<void> {
  return api.post<void>(`/api/organization/settings/domains/${encodeURIComponent(domainId)}/verify`);
}

export function removeOrganizationDomain(domainId: string, version: number): Promise<void> {
  return api.delete<void>(`/api/organization/settings/domains/${encodeURIComponent(domainId)}?version=${version}`);
}
