import { toSearch } from "@/shared/api/toSearch";
import { api } from "@/shared/api/httpClient";
import type { PagedResult } from "@/shared/api/pagedResult";
import type {
  CreateRoleRequest,
  PagedRequest,
  PermissionGroupResponse,
  RoleResponse,
  RoleFilterCountsResponse,
  RoleScopeFilter,
  UpdateRoleRequest,
  VersionResponse,
} from "@/shared/api/types";

export type RolesQuery = PagedRequest & { scope?: RoleScopeFilter; companyId?: string };

export const rolesQueryKeyRoot = ["roles"] as const;
export const rolesQueryKey = (query: RolesQuery) => [...rolesQueryKeyRoot, query] as const;
export const roleCountsQueryKey = (search?: string) => [...rolesQueryKeyRoot, "filter-counts", search ?? ""] as const;
export const roleQueryKey = (roleId: string) => [...rolesQueryKeyRoot, "detail", roleId] as const;
export const permissionGroupsQueryKey = ["permissions"] as const;

export function fetchRoles(query: RolesQuery): Promise<PagedResult<RoleResponse>> {
  const search = toSearch(query);
  return api.get<PagedResult<RoleResponse>>(`/api/roles/paged${search ? `?${search}` : ""}`);
}

export function fetchRoleCounts(search?: string): Promise<RoleFilterCountsResponse> {
  const query = toSearch({ search });
  return api.get<RoleFilterCountsResponse>(`/api/roles/filter-counts${query ? `?${query}` : ""}`);
}

export function fetchRole(roleId: string): Promise<RoleResponse> {
  return api.get<RoleResponse>(`/api/roles/${encodeURIComponent(roleId)}`);
}

export function fetchPermissionGroups(): Promise<PermissionGroupResponse[]> {
  return api.get<PermissionGroupResponse[]>("/api/permissions");
}

export function createRole(request: CreateRoleRequest, idempotencyKey: string): Promise<string> {
  return api.post<string>("/api/roles", request, { headers: { "Idempotency-Key": idempotencyKey } });
}

export function updateRole(roleId: string, request: UpdateRoleRequest): Promise<VersionResponse> {
  return api.put<VersionResponse>(`/api/roles/${encodeURIComponent(roleId)}`, request);
}

export function deleteRole(roleId: string, version: number): Promise<void> {
  return api.delete<void>(`/api/roles/${encodeURIComponent(roleId)}`, { body: JSON.stringify({ version }) });
}
