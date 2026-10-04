import { api } from "@/shared/api/httpClient";
import type {
  ChangeOrganizationUserStatusRequest,
  InviteOrganizationUserRequest,
  OrganizationInvitationIssuedResponse,
  OrganizationUserFilterCountsResponse,
  OrganizationUserResponse,
  OrganizationUserState,
  PagedRequest,
  RoleResponse,
  RoleScopeFilter,
  UpdateOrganizationUserRequest,
  CompanyResponse,
} from "@/shared/api/types";
import type { PagedResult } from "@/shared/api/pagedResult";

export interface UsersQuery extends PagedRequest {
  state?: OrganizationUserState;
  companyId?: string;
  withoutCompany?: boolean;
}

export const usersQueryRoot = ["organization-users"] as const;
export const usersQueryKey = (query: UsersQuery) => [...usersQueryRoot, query] as const;
export const userQueryKey = (memberId: string) => [...usersQueryRoot, "detail", memberId] as const;
export const userCountsQueryKey = (query: Pick<UsersQuery, "search" | "companyId" | "withoutCompany">) => [...usersQueryRoot, "counts", query] as const;
export const userCompaniesQueryKey = ["organization-user-company-options"] as const;
export const userRolesQueryKey = (scope: RoleScopeFilter) => ["organization-user-role-options", scope] as const;

function toSearch<T extends object>(query: T): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query as Record<string, unknown>)) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  }
  return params.toString();
}

export function fetchUsers(query: UsersQuery): Promise<PagedResult<OrganizationUserResponse>> {
  const search = toSearch(query);
  return api.get<PagedResult<OrganizationUserResponse>>(`/api/users/paged${search ? `?${search}` : ""}`);
}

export function fetchUserCounts(query: Pick<UsersQuery, "search" | "companyId" | "withoutCompany">): Promise<OrganizationUserFilterCountsResponse> {
  const search = toSearch(query);
  return api.get<OrganizationUserFilterCountsResponse>(`/api/users/filter-counts${search ? `?${search}` : ""}`);
}

export function fetchUser(memberId: string): Promise<OrganizationUserResponse> {
  return api.get<OrganizationUserResponse>(`/api/users/${encodeURIComponent(memberId)}`);
}

export function inviteUser(request: InviteOrganizationUserRequest, idempotencyKey: string): Promise<OrganizationInvitationIssuedResponse> {
  return api.post<OrganizationInvitationIssuedResponse>("/api/users/invitations", request, { headers: { "Idempotency-Key": idempotencyKey } });
}

export function resendUserInvitation(invitationId: string, idempotencyKey: string): Promise<string> {
  return api.post<string>(`/api/users/invitations/${encodeURIComponent(invitationId)}/resend`, undefined,
    { headers: { "Idempotency-Key": idempotencyKey } });
}

export function revokeUserInvitation(invitationId: string): Promise<void> {
  return api.delete<void>(`/api/users/invitations/${encodeURIComponent(invitationId)}`);
}

export function updateUser(memberId: string, request: UpdateOrganizationUserRequest): Promise<void> {
  return api.put<void>(`/api/users/${encodeURIComponent(memberId)}`, request);
}

export function changeUserStatus(memberId: string, request: ChangeOrganizationUserStatusRequest): Promise<void> {
  return api.put<void>(`/api/users/${encodeURIComponent(memberId)}/status`, request);
}

export function removeUser(memberId: string, version: number): Promise<void> {
  return api.delete<void>(`/api/users/${encodeURIComponent(memberId)}?version=${version}`);
}

export function fetchCompanyOptions(): Promise<PagedResult<CompanyResponse>> {
  return api.get<PagedResult<CompanyResponse>>("/api/companies/paged?page=1&pageSize=100&sort=name");
}

export function fetchAssignableRoles(scope: RoleScopeFilter): Promise<PagedResult<RoleResponse>> {
  return api.get<PagedResult<RoleResponse>>(`/api/roles/paged?scope=${scope}&page=1&pageSize=100&sort=name`);
}
