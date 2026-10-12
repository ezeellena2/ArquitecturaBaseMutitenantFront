import { api } from "./httpClient";
import { toSearch } from "./toSearch";
import type { PagedResult } from "./pagedResult";
import type { CompanyCandidateResponse, CompanyResponse, PagedRequest, RoleResponse, RoleScopeFilter } from "./types";

export const optionPage: PagedRequest = { page: 1, pageSize: 10, sort: "name" };

export interface ResourceOptions<T> {
  readonly queryKeyRoot: readonly unknown[];
  readonly queryFn: (query: PagedRequest, signal?: AbortSignal) => Promise<PagedResult<T>>;
  readonly id: (item: T) => string;
}

export function fetchCompanyOptions(query: PagedRequest = optionPage, signal?: AbortSignal): Promise<PagedResult<CompanyResponse>> {
  return api.get(`/api/companies/paged?${toSearch({ ...query, status: "Active" })}`, { signal });
}

export function fetchCompanyOption(companyId: string, signal?: AbortSignal): Promise<CompanyResponse> {
  return api.get(`/api/companies/${encodeURIComponent(companyId)}`, { signal });
}

export const companyOptions: ResourceOptions<CompanyResponse> = {
  queryKeyRoot: ["companies", "options"], queryFn: fetchCompanyOptions, id: (company) => company.id,
};

export function roleOptions(scope: RoleScopeFilter, companyId?: string): ResourceOptions<RoleResponse> {
  return {
    queryKeyRoot: ["roles", "options", { scope, companyId }], id: (role) => role.id,
    queryFn: (query, signal) => api.get(`/api/roles/paged?${toSearch({ ...query, scope, companyId })}`, { signal }),
  };
}

export function companyRoleOptions(companyId: string, canReadMembers: boolean): ResourceOptions<RoleResponse> {
  if (!canReadMembers) return roleOptions("Company", companyId);
  return {
    queryKeyRoot: ["roles", "options", "company", companyId], id: (role) => role.id,
    queryFn: (query, signal) => api.get(`/api/companies/${encodeURIComponent(companyId)}/roles/paged?${toSearch(query)}`, { signal }),
  };
}

export function companyCandidateOptions(companyId: string): ResourceOptions<CompanyCandidateResponse> {
  // Decisión 96: la ruta de la empresa conserva el correo enmascarado y busca únicamente por nombre.
  return {
    queryKeyRoot: ["organization-users", "options", "company-candidates", companyId], id: (member) => member.memberId,
    queryFn: (query, signal) => api.get(`/api/companies/${encodeURIComponent(companyId)}/candidates/paged?${toSearch({ ...query, sort: "displayName" })}`, { signal }),
  };
}
