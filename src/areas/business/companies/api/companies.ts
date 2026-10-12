import { companyRoleOptions, optionPage, type ResourceOptions } from "@/shared/api/resourceOptions";
import { toSearch } from "@/shared/api/toSearch";
import { api } from "@/shared/api/httpClient";
import type { PagedResult } from "@/shared/api/pagedResult";
import type {
  AddCompanyMemberRequest,
  ChangeCompanyMemberStatusRequest,
  ChangeCompanyStatusRequest,
  CompanyFilterCountsResponse,
  CompanyMemberFilterCountsResponse,
  CompanyMemberResponse,
  CompanyMemberState,
  CompanyResponse,
  CompanyStatus,
  CreateCompanyRequest,
  PagedRequest,
  RoleResponse,
  UpdateCompanyMemberRolesRequest,
  UpdateCompanyRequest,
  VersionResponse,
} from "@/shared/api/types";

export type CompaniesQuery = PagedRequest & { status?: CompanyStatus };
export type CompanyMembersQuery = PagedRequest & {
  state?: CompanyMemberState;
  roleId?: string;
  withoutRoles?: boolean;
};

export const companiesQueryRoot = ["companies"] as const;
export const companiesQueryKey = (query: CompaniesQuery) => [...companiesQueryRoot, query] as const;
export const companiesCountQueryKey = (search?: string) => [...companiesQueryRoot, "counts", search ?? ""] as const;
export const companyQueryKey = (companyId: string) => [...companiesQueryRoot, "detail", companyId] as const;
export const companyMembersQueryRoot = (companyId: string) => [...companiesQueryRoot, companyId, "members"] as const;
export const companyMembersQueryKey = (companyId: string, query: CompanyMembersQuery) => [...companyMembersQueryRoot(companyId), query] as const;
export const companyMembersCountQueryKey = (companyId: string, search?: string) => [...companyMembersQueryRoot(companyId), "counts", search ?? ""] as const;


export function fetchCompanies(query: CompaniesQuery): Promise<PagedResult<CompanyResponse>> {
  const search = toSearch(query);
  return api.get<PagedResult<CompanyResponse>>(`/api/companies/paged${search ? `?${search}` : ""}`);
}

export function fetchCompanyCounts(search?: string): Promise<CompanyFilterCountsResponse> {
  const query = toSearch({ search });
  return api.get<CompanyFilterCountsResponse>(`/api/companies/filter-counts${query ? `?${query}` : ""}`);
}

export function fetchCompany(companyId: string): Promise<CompanyResponse> {
  return api.get<CompanyResponse>(`/api/companies/${encodeURIComponent(companyId)}`);
}

export function createCompany(request: CreateCompanyRequest, idempotencyKey: string): Promise<string> {
  return api.post<string>("/api/companies", request, { headers: { "Idempotency-Key": idempotencyKey } });
}

export function updateCompany(companyId: string, request: UpdateCompanyRequest): Promise<VersionResponse> {
  return api.put<VersionResponse>(`/api/companies/${encodeURIComponent(companyId)}`, request);
}

export function changeCompanyStatus(companyId: string, request: ChangeCompanyStatusRequest): Promise<VersionResponse> {
  return api.put<VersionResponse>(`/api/companies/${encodeURIComponent(companyId)}/status`, request);
}

export function fetchCompanyMembers(companyId: string, query: CompanyMembersQuery): Promise<PagedResult<CompanyMemberResponse>> {
  const search = toSearch(query);
  return api.get<PagedResult<CompanyMemberResponse>>(`/api/companies/${encodeURIComponent(companyId)}/members/paged${search ? `?${search}` : ""}`);
}

export function fetchCompanyMemberCounts(companyId: string, search?: string): Promise<CompanyMemberFilterCountsResponse> {
  const query = toSearch({ search });
  return api.get<CompanyMemberFilterCountsResponse>(`/api/companies/${encodeURIComponent(companyId)}/members/filter-counts${query ? `?${query}` : ""}`);
}

export function addCompanyMember(companyId: string, request: AddCompanyMemberRequest, idempotencyKey: string): Promise<void> {
  return api.post<void>(`/api/companies/${encodeURIComponent(companyId)}/members`, request, { headers: { "Idempotency-Key": idempotencyKey } });
}

export function updateCompanyMemberRoles(companyId: string, memberId: string, request: UpdateCompanyMemberRolesRequest): Promise<VersionResponse> {
  return api.put<VersionResponse>(`/api/companies/${encodeURIComponent(companyId)}/members/${encodeURIComponent(memberId)}/roles`, request);
}

export function changeCompanyMemberStatus(companyId: string, memberId: string, request: ChangeCompanyMemberStatusRequest): Promise<VersionResponse> {
  return api.put<VersionResponse>(`/api/companies/${encodeURIComponent(companyId)}/members/${encodeURIComponent(memberId)}/status`, request);
}

/// Los roles que se asignan en una empresa, ya filtrados por el back: los de cualquier empresa y los propios. Quien ve sus
/// miembros los pide a la ruta de la empresa, que pide `company.members.read` (B4: el Administrador de empresa no tiene
/// `roles.read`); quien solo ve los roles de la organización, a `/api/roles/paged` con la empresa.
export function fetchAssignableCompanyRoles(companyId: string, canReadMembers: boolean, query: PagedRequest = optionPage): ReturnType<ResourceOptions<RoleResponse>["queryFn"]> {
  return companyRoleOptions(companyId, canReadMembers).queryFn(query);
}

/// Reenviar o revocar la invitación de un miembro desde su empresa (decisión 97), con `company.members.manage` de esa
/// empresa: reenviar manda la misma invitación (con su clave de idempotencia) y revocar la cancela entera.
export function resendCompanyInvitation(companyId: string, invitationId: string, idempotencyKey: string): Promise<string> {
  return api.post<string>(`/api/companies/${encodeURIComponent(companyId)}/invitations/${encodeURIComponent(invitationId)}/resend`, undefined,
    { headers: { "Idempotency-Key": idempotencyKey } });
}

export function revokeCompanyInvitation(companyId: string, invitationId: string): Promise<void> {
  return api.delete<void>(`/api/companies/${encodeURIComponent(companyId)}/invitations/${encodeURIComponent(invitationId)}`);
}
