import { useCursorList } from "@/shared/hooks/useCursorList";
import { fetchTenantHistory, tenantHistoryQueryKey } from "../api/tenants";

export function useOrganizationHistory(id: string) {
  return useCursorList(tenantHistoryQueryKey(id), (after) => fetchTenantHistory(id, after), { meta: { silent: true } });
}
