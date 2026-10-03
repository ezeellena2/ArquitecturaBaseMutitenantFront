import { api } from "@/shared/api/httpClient";
import type { PagedResult } from "@/shared/api/pagedResult";
import type {
  CreateRoleRequest,
  CompanyResponse,
  PagedRequest,
  PermissionGroupResponse,
  RoleResponse,
  RoleScopeFilter,
  UpdateRoleRequest,
} from "@/shared/api/types";

export type RolesQuery = PagedRequest & { scope?: RoleScopeFilter };

export const rolesQueryKeyRoot = ["roles"] as const;
export const rolesQueryKey = (query: RolesQuery) => [...rolesQueryKeyRoot, query] as const;
export const roleQueryKey = (roleId: string) => [...rolesQueryKeyRoot, "detail", roleId] as const;
export const permissionGroupsQueryKey = ["permissions"] as const;

function toSearch(query: RolesQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  }
  return params.toString();
}

export function fetchRoles(query: RolesQuery): Promise<PagedResult<RoleResponse>> {
  const search = toSearch(query);
  return api.get<PagedResult<RoleResponse>>(`/api/roles/paged${search ? `?${search}` : ""}`);
}

export function fetchRole(roleId: string): Promise<RoleResponse> {
  return api.get<RoleResponse>(`/api/roles/${encodeURIComponent(roleId)}`);
}

export function fetchPermissionGroups(): Promise<PermissionGroupResponse[]> {
  return api.get<PermissionGroupResponse[]>("/api/permissions");
}

export function fetchCompanyOptions(): Promise<PagedResult<CompanyResponse>> {
  return api.get<PagedResult<CompanyResponse>>("/api/companies/paged?page=1&pageSize=100&sort=name");
}

export function createRole(request: CreateRoleRequest, idempotencyKey: string): Promise<string> {
  return api.post<string>("/api/roles", request, { headers: { "Idempotency-Key": idempotencyKey } });
}

export function updateRole(roleId: string, request: UpdateRoleRequest): Promise<void> {
  return api.put<void>(`/api/roles/${encodeURIComponent(roleId)}`, request);
}

export function deleteRole(roleId: string, version: number): Promise<void> {
  return api.delete<void>(`/api/roles/${encodeURIComponent(roleId)}`, { body: JSON.stringify({ version }) });
}
