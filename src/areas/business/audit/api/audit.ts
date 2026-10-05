import { api } from "@/shared/api/httpClient";
import type { OrganizationAuditActorResponse, OrganizationAuditCursorResponse } from "@/shared/api/types";

/// «Quién» sin persona (tablero Auditoria-Org): el sistema y la plataforma no tienen id y se filtran por su tipo.
export const auditActorKinds = ["System", "PlatformOperator"] as const;
export type AuditActorKind = (typeof auditActorKinds)[number];

export interface AuditQuery {
  after?: string;
  limit?: number;
  period?: string;
  category?: string;
  /** Una persona; el back deja afuera lo que hicieron el sistema y la plataforma. */
  actorId?: string;
  actorKind?: AuditActorKind;
  search?: string;
}

export const auditQueryRoot = ["organization-audit"] as const;

function queryString(query: AuditQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  return params.toString();
}

export function fetchAudit(query: AuditQuery): Promise<OrganizationAuditCursorResponse> {
  const search = queryString(query);
  return api.get<OrganizationAuditCursorResponse>(`/api/organization/audit${search ? `?${search}` : ""}`);
}

export function fetchAuditActors(query: Omit<AuditQuery, "after" | "actorId" | "actorKind" | "limit">): Promise<OrganizationAuditActorResponse[]> {
  const search = queryString(query);
  return api.get<OrganizationAuditActorResponse[]>(`/api/organization/audit/actors${search ? `?${search}` : ""}`);
}
