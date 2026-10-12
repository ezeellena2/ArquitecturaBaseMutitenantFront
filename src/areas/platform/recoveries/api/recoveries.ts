import { toSearch } from "@/shared/api/toSearch";
import { api } from "@/shared/api/httpClient";
import type { PagedResult } from "@/shared/api/pagedResult";
import type { AccountRecoveryStatus, PagedRequest, PlatformAccountActionRequest, PlatformRecoveryFilterCounts, PlatformRecoveryResponse, VersionResponse } from "@/shared/api/types";

export interface RecoveriesQuery extends PagedRequest { status?: AccountRecoveryStatus }
export type RecoveryCountsQuery = Pick<RecoveriesQuery, "search" | "status">;
export type RecoveryAction = "approve" | "reject";
export const recoveriesQueryRoot = ["platform-recoveries"] as const;
export const recoveriesQueryKey = (query: RecoveriesQuery) => [...recoveriesQueryRoot, "paged", query] as const;
export const recoveryCountsQueryKey = (query: RecoveryCountsQuery) => [...recoveriesQueryRoot, "counts", query] as const;
export function fetchRecoveries(query: RecoveriesQuery): Promise<PagedResult<PlatformRecoveryResponse>> { return api.get(`/api/platform/recoveries/paged${toSearch(query, true)}`); }
export function fetchRecoveryCounts(query: RecoveryCountsQuery): Promise<PlatformRecoveryFilterCounts> { return api.get(`/api/platform/recoveries/filter-counts${toSearch(query, true)}`); }
export function changeRecovery(id: string, action: RecoveryAction, request: PlatformAccountActionRequest, key: string): Promise<VersionResponse> {
  return api.post(`/api/platform/recoveries/${encodeURIComponent(id)}/${action}`, request, { headers: { "Idempotency-Key": key } });
}
