import type { PagedResultOfPlatformAccountResponse } from "@/shared/api/types";
import { toSearch } from "@/shared/api/toSearch";
import { api } from "@/shared/api/httpClient";
import type { PagedRequest, PlatformAccountDetailResponse, PlatformAccountFilterCounts, PlatformAccountKind, PlatformAccountReasonRequest, PlatformAccountState, PlatformAuditCursorResponse } from "@/shared/api/types";

export interface AccountsQuery extends PagedRequest { state?: PlatformAccountState; kind?: PlatformAccountKind }
export type AccountCountsQuery = Pick<AccountsQuery, "search" | "state" | "kind">;
export type AccountAction = "suspend" | "reactivate" | "revoke-sessions" | "deletion";
export const accountsQueryRoot = ["platform-accounts"] as const;
export const accountsQueryKey = (query: AccountsQuery) => [...accountsQueryRoot, "paged", query] as const;
export const accountCountsQueryKey = (query: AccountCountsQuery) => [...accountsQueryRoot, "counts", query] as const;
export const accountQueryKey = (id: string) => [...accountsQueryRoot, "detail", id] as const;
export const accountHistoryQueryKey = (id: string) => [...accountsQueryRoot, "history", id] as const;
export function fetchAccountHistory(id: string, after: string | null): Promise<PlatformAuditCursorResponse> {
  const query = new URLSearchParams({ accountId: id, period: "all", limit: "50" });
  if (after) query.set("after", after);
  return api.get(`/api/platform/audit?${query}`);
}
export function fetchAccounts(query: AccountsQuery): Promise<PagedResultOfPlatformAccountResponse> { return api.get(`/api/platform/accounts/paged${toSearch(query, true)}`); }
export function fetchAccountCounts(query: AccountCountsQuery): Promise<PlatformAccountFilterCounts> { return api.get(`/api/platform/accounts/filter-counts${toSearch(query, true)}`); }
export function fetchAccount(id: string): Promise<PlatformAccountDetailResponse> { return api.get(`/api/platform/accounts/${encodeURIComponent(id)}`); }
export function changeAccount(id: string, action: AccountAction, request: PlatformAccountReasonRequest, key: string): Promise<void> {
  return api.post(`/api/platform/accounts/${encodeURIComponent(id)}/${action}`, request, { headers: { "Idempotency-Key": key } });
}
