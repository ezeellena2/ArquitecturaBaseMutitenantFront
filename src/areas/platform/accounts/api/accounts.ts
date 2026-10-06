import { api } from "@/shared/api/httpClient";
import type { PagedResult } from "@/shared/api/pagedResult";
import type { PagedRequest, PlatformAccountDetailResponse, PlatformAccountFilterCounts, PlatformAccountKind, PlatformAccountReasonRequest, PlatformAccountResponse, PlatformAccountState } from "@/shared/api/types";

export interface AccountsQuery extends PagedRequest { state?: PlatformAccountState; kind?: PlatformAccountKind }
export type AccountCountsQuery = Pick<AccountsQuery, "search" | "state" | "kind">;
export type AccountAction = "suspend" | "reactivate" | "revoke-sessions" | "deletion";
export const accountsQueryRoot = ["platform-accounts"] as const;
export const accountsQueryKey = (query: AccountsQuery) => [...accountsQueryRoot, "paged", query] as const;
export const accountCountsQueryKey = (query: AccountCountsQuery) => [...accountsQueryRoot, "counts", query] as const;
export const accountQueryKey = (id: string) => [...accountsQueryRoot, "detail", id] as const;
function toSearch(query: AccountsQuery | AccountCountsQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  const search = params.toString(); return search ? `?${search}` : "";
}
export function fetchAccounts(query: AccountsQuery): Promise<PagedResult<PlatformAccountResponse>> { return api.get(`/api/platform/accounts/paged${toSearch(query)}`); }
export function fetchAccountCounts(query: AccountCountsQuery): Promise<PlatformAccountFilterCounts> { return api.get(`/api/platform/accounts/filter-counts${toSearch(query)}`); }
export function fetchAccount(id: string): Promise<PlatformAccountDetailResponse> { return api.get(`/api/platform/accounts/${encodeURIComponent(id)}`); }
export function changeAccount(id: string, action: AccountAction, request: PlatformAccountReasonRequest, key: string): Promise<void> {
  return api.post(`/api/platform/accounts/${encodeURIComponent(id)}/${action}`, request, { headers: { "Idempotency-Key": key } });
}
