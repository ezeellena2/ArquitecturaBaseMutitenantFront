import type { ApiSchemas } from "@/shared/api/types";

// Estados y filas de Organizacion v111. Son respuestas de prueba, nunca catálogo productivo.
const states: Record<string, ApiSchemas["TenantStatus"]> = {
  "Espera aprobación": "PendingApproval", "Falló el alta": "Provisioning", Activa: "Active", Suspendida: "Suspended", Cerrada: "Closed",
};
const owner: ApiSchemas["PlatformTenantOwnerResponse"] = {
  id: "owner-1", displayName: "Lucía Fernández", email: "lucia.fernandez@delta.ejemplo.com", identityStatus: "Active", membershipStatus: "Active",
  lastSignInAtUtc: "2026-09-27T19:40:00Z", lastSignInMethod: "Code",
};
const requested: ApiSchemas["PlatformTenantHistoryResponse"] = {
  id: "history-1", occurredAtUtc: "2026-01-12T11:40:00Z", action: "Pidió crear la organización", actor: "Lucía Fernández", actorRole: "Persona", reason: null, summary: "{}",
};
const history: ApiSchemas["PlatformTenantHistoryResponse"][] = [
  { id: "history-4", occurredAtUtc: "2026-09-20T14:02:00Z", action: "Reactivó la organización", actor: "Martín Sosa", actorRole: "Operador", reason: "Regularizó el pago.", summary: JSON.stringify({ status: { before: "Suspended", after: "Active" } }) },
  { id: "history-3", occurredAtUtc: "2026-09-18T19:45:00Z", action: "Suspendió la organización", actor: "Martín Sosa", actorRole: "Operador", reason: "Dos meses sin pago.", summary: JSON.stringify({ status: { before: "Active", after: "Suspended" } }) },
  { id: "history-2", occurredAtUtc: "2026-01-12T12:03:00Z", action: "Aprobó la organización", actor: "Laura Díaz", actorRole: "Operador", reason: "Datos verificados con AFIP.", summary: JSON.stringify({ status: { before: "PendingApproval", after: "Active" } }) },
  requested,
];
const suspended: ApiSchemas["PlatformTenantHistoryResponse"] = {
  id: "history-5", occurredAtUtc: "2026-09-25T13:15:00Z", action: "Suspendió la organización", actor: "Martín Sosa", actorRole: "Operador", reason: "Dos meses sin pago.", summary: JSON.stringify({ status: { before: "Active", after: "Suspended" } }),
};
const closed: ApiSchemas["PlatformTenantHistoryResponse"] = {
  id: "history-6", occurredAtUtc: "2026-09-26T15:30:00Z", action: "Cerró la organización", actor: "Martín Sosa", actorRole: "Operador", reason: "Lo pidió la Dueña por escrito.", summary: JSON.stringify({ status: { before: "Suspended", after: "Closed" } }),
};

export function platformOrganizationCaptureResponses({ state = "Activa", owners = "Con su Dueño" } = {}) {
  const status = states[state] ?? "Active";
  const rows = status === "PendingApproval" || status === "Provisioning" ? [requested]
    : status === "Closed" ? [closed, suspended, ...history] : status === "Suspended" ? [suspended, ...history] : history;
  const last = status === "Closed" ? closed : status === "Suspended" ? suspended : status === "Active" ? history[0]! : null;
  const detail: ApiSchemas["PlatformTenantDetailResponse"] = {
    id: "tenant-1", name: "Grupo Delta", slug: "delta", status, source: "SelfService", createdAtUtc: "2026-01-12T11:40:00Z", version: 1,
    companyCount: status === "Provisioning" ? 0 : status === "PendingApproval" ? 1 : 3,
    memberCount: status === "Provisioning" ? 0 : status === "PendingApproval" ? 1 : 11,
    ownerName: owners === "Sin Dueño todavía" ? null : owner.displayName, ownerEmail: owner.email,
    owners: owners === "Sin Dueño todavía" ? [] : [{ ...owner,
      ...(owners === "Con el Dueño suspendido" ? { identityStatus: "Suspended" as const, lastSignInAtUtc: "2026-09-24T20:35:00Z" } : {}) }],
    lastStateChange: last ? { atUtc: last.occurredAtUtc, action: last.action, reason: last.reason } : null,
  };
  const page: ApiSchemas["CursorResultOfPlatformTenantHistoryResponse"] = { items: rows, nextCursor: null, hasMore: false };
  return [
    { method: "GET", path: "/api/platform/tenants/tenant-1", status: 200, body: detail },
    { method: "GET", path: "/api/platform/tenants/tenant-1/history", status: 200, body: page },
    ...["approve", "reject", "suspend", "reactivate", "close", "retry-provisioning"].map((action) => ({
      method: "POST", path: `/api/platform/tenants/tenant-1/${action}`, status: 200, body: { version: 2 },
    })),
  ];
}
