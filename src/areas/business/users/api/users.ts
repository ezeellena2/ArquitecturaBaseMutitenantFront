import { toSearch } from "@/shared/api/toSearch";
import { api } from "@/shared/api/httpClient";
import type {
  ChangeOrganizationUserStatusRequest,
  InviteOrganizationUserRequest,
  OrganizationInvitationIssuedResponse,
  OrganizationUserFilterCountsResponse,
  OrganizationUserResponse,
  OrganizationUserState,
  PagedRequest,
  UpdateOrganizationUserRequest,
  VersionResponse,
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

export function updateUser(memberId: string, request: UpdateOrganizationUserRequest): Promise<VersionResponse> {
  return api.put<VersionResponse>(`/api/users/${encodeURIComponent(memberId)}`, request);
}

export function changeUserStatus(memberId: string, request: ChangeOrganizationUserStatusRequest): Promise<VersionResponse> {
  return api.put<VersionResponse>(`/api/users/${encodeURIComponent(memberId)}/status`, request);
}

export function removeUser(memberId: string, version: number): Promise<void> {
  return api.delete<void>(`/api/users/${encodeURIComponent(memberId)}?version=${version}`);
}
