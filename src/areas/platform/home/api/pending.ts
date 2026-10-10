import { api } from "@/shared/api/httpClient";
import { pageSizes } from "@/shared/api/pageSizes";
import type { ApiSchemas } from "@/shared/api/types";

export const platformPendingQueryKey = (userId: string | undefined, area: "organizations" | "recoveries") => ["platform-home", userId, "pending", area] as const;

/** El resumen conserva las páginas raw y el orden decidido por cada lectura. */
export async function fetchPendingOrganizations(signal: AbortSignal): Promise<ApiSchemas["PagedResultOfPlatformTenantResponse"][]> {
  const pages: ApiSchemas["PagedResultOfPlatformTenantResponse"][] = [];
  for (let page = 1; ; page++) {
    const query = new URLSearchParams({ status: "PendingApproval", sort: "-createdAtUtc", page: String(page), pageSize: String(pageSizes.at(-1)!) });
    const result = await api.get<ApiSchemas["PagedResultOfPlatformTenantResponse"]>(`/api/platform/tenants/paged?${query}`, { signal });
    signal.throwIfAborted();
    if (result.page !== page || result.hasNext && page >= (result.totalPages ?? 0)) throw new Error("Invalid pending organizations pagination");
    pages.push(result);
    if (!result.hasNext) return pages;
  }
}

export async function fetchPendingRecoveries(signal: AbortSignal): Promise<ApiSchemas["PagedResultOfPlatformRecoveryResponse"][]> {
  const pages: ApiSchemas["PagedResultOfPlatformRecoveryResponse"][] = [];
  for (let page = 1; ; page++) {
    const query = new URLSearchParams({ status: "Pending", sort: "-createdAt", page: String(page), pageSize: String(pageSizes.at(-1)!) });
    const result = await api.get<ApiSchemas["PagedResultOfPlatformRecoveryResponse"]>(`/api/platform/recoveries/paged?${query}`, { signal });
    signal.throwIfAborted();
    if (result.page !== page || result.hasNext && page >= (result.totalPages ?? 0)) throw new Error("Invalid pending recoveries pagination");
    pages.push(result);
    if (!result.hasNext) return pages;
  }
}
