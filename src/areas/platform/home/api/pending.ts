import { api } from "@/shared/api/httpClient";
import { validationConstraints } from "@/shared/api/generated/validation";
import type { ApiSchemas } from "@/shared/api/types";

export const platformPendingQueryKey = (userId: string | undefined, area: "organizations" | "recoveries") => ["platform-home", userId, "pending", area] as const;

/** Una sola vista previa con el total y el orden decididos por el servidor. */
export async function fetchPendingOrganizations(signal: AbortSignal): Promise<ApiSchemas["PagedResultOfPlatformTenantResponse"]> {
    const query = new URLSearchParams({ status: "PendingApproval", sort: "-createdAtUtc", page: "1", pageSize: String(validationConstraints.PendingGroup.items.maxItems) });
    const result = await api.get<ApiSchemas["PagedResultOfPlatformTenantResponse"]>(`/api/platform/tenants/paged?${query}`, { signal });
    signal.throwIfAborted();
    if (result.page !== 1 || result.hasNext && (result.totalPages ?? 0) <= 1) throw new Error("Invalid pending organizations pagination");
    return result;
}

export async function fetchPendingRecoveries(signal: AbortSignal): Promise<ApiSchemas["PagedResultOfPlatformRecoveryResponse"]> {
    const query = new URLSearchParams({ status: "Pending", sort: "-createdAt", page: "1", pageSize: String(validationConstraints.PendingGroup.items.maxItems) });
    const result = await api.get<ApiSchemas["PagedResultOfPlatformRecoveryResponse"]>(`/api/platform/recoveries/paged?${query}`, { signal });
    signal.throwIfAborted();
    if (result.page !== 1 || result.hasNext && (result.totalPages ?? 0) <= 1) throw new Error("Invalid pending recoveries pagination");
    return result;
}
