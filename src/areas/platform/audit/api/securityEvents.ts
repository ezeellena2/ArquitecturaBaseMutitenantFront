import { api } from "@/shared/api/httpClient";
import type { PlatformAuditCursorResponse, PlatformAuditOrganizationResponse } from "@/shared/api/types";

export interface SecurityEventsQuery {
  after?: string;
  limit?: number;
  period?: string;
  type?: string;
  tenantId?: string;
  accountId?: string;
  search?: string;
}

export const securityEventsQueryRoot = ["platform-audit"] as const;

function queryString(query: SecurityEventsQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  return params.toString();
}

export function fetchSecurityEvents(query: SecurityEventsQuery): Promise<PlatformAuditCursorResponse> {
  const search = queryString(query);
  return api.get<PlatformAuditCursorResponse>(`/api/platform/audit${search ? `?${search}` : ""}`);
}

export function fetchAuditOrganizations(query: Omit<SecurityEventsQuery, "after" | "limit" | "tenantId">): Promise<PlatformAuditOrganizationResponse[]> {
  const search = queryString(query);
  return api.get<PlatformAuditOrganizationResponse[]>(`/api/platform/audit/organizations${search ? `?${search}` : ""}`);
}
