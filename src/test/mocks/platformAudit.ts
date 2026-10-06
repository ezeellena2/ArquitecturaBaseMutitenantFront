import type { ApiSchemas } from "@/shared/api/types";

// Los ejemplos de v111 usan los resúmenes y máscaras que produce la API (E5, decisión 24).
// Los ingresos no tienen IP ni destino de organización. Una tanda con más datos trae 25 filas.
const martin = "b0000000-0000-4000-8000-000000000001";
const delta = "d0000000-0000-4000-8000-000000000001";
const sigma = "d0000000-0000-4000-8000-000000000002";
const signIn = { type: "signins", action: "SignIn", summary: "Ingresó con un código por correo", target: "Martín Sosa",
  targetTenantId: null, targetAccountId: martin, actor: "Martín Sosa", actorRole: "Operador", reason: null, ipAddress: null };

export const platformAuditEvents: ApiSchemas["PlatformAuditEventResponse"][] = [
  { ...signIn, id: "a0000000-0000-4000-8000-000000000001", occurredAtUtc: "2026-09-27T13:55:00Z" },
  { id: "a0000000-0000-4000-8000-000000000002", occurredAtUtc: "2026-09-27T13:20:00Z", type: "signins", action: "SignInFailed",
    summary: "No pudo ingresar: El código no es válido.", target: "ma•••@gmail.com", targetTenantId: null,
    targetAccountId: "b0000000-0000-4000-8000-000000000002", actor: "ma•••@gmail.com", actorRole: "Persona", reason: null, ipAddress: null },
  { id: "a0000000-0000-4000-8000-000000000003", occurredAtUtc: "2026-09-27T12:55:00Z", type: "organizations", action: "OrganizationProvisioningRetried",
    summary: "Reintentó el alta de la organización", target: "Sigma S.A.", targetTenantId: sigma, targetAccountId: null,
    actor: "Martín Sosa", actorRole: "Operador", reason: "Reintento del alta.", ipAddress: "181.45.178.•••" },
  { id: "a0000000-0000-4000-8000-000000000004", occurredAtUtc: "2026-09-26T20:30:00Z", type: "accounts", action: "AccountSuspended",
    summary: "Suspendió la cuenta", target: "Ana Gómez", targetTenantId: null, targetAccountId: "b0000000-0000-4000-8000-000000000004",
    actor: "Laura Díaz", actorRole: "Operador", reason: "Denuncia de uso indebido.", ipAddress: "181.45.178.•••" },
  { id: "a0000000-0000-4000-8000-000000000005", occurredAtUtc: "2026-09-22T15:00:00Z", type: "settings", action: "PlatformSettingsChanged",
    summary: "Cambió la configuración de la plataforma", target: "Plataforma", targetTenantId: null, targetAccountId: null,
    actor: "Martín Sosa", actorRole: "Operador", reason: "Muchas altas de prueba.", ipAddress: "181.45.178.•••" },
  { id: "a0000000-0000-4000-8000-000000000006", occurredAtUtc: "2026-09-20T14:02:00Z", type: "organizations", action: "OrganizationReactivated",
    summary: "Reactivó la organización", target: "Grupo Delta", targetTenantId: delta, targetAccountId: null,
    actor: "Martín Sosa", actorRole: "Operador", reason: "Regularizó el pago.", ipAddress: "181.45.178.•••" },
  ...Array.from({ length: 19 }, (_, index) => ({ ...signIn,
    id: `a0000000-0000-4000-8000-${String(1001 + index).padStart(12, "0")}`,
    occurredAtUtc: `2026-09-19T14:00:${String(19 - index).padStart(2, "0")}Z` })),
];

// CursorCodec: versión1, ticks UTC de la última fila y Guid en bytes .NET; no es un cursor inventado de la UI.
const nextCursor = "AQjfFlZMHwaAAAAAoAAAAECAAAAAAAAQGQ";
const organizations: ApiSchemas["PlatformAuditOrganizationResponse"][] = [{ id: delta, name: "Grupo Delta" }, { id: sigma, name: "Sigma S.A." }];

export function platformAuditCaptureResponses() {
  const page: ApiSchemas["CursorResultOfPlatformAuditEventResponse"] = { items: platformAuditEvents, nextCursor, hasMore: true };
  const filtered: ApiSchemas["CursorResultOfPlatformAuditEventResponse"] = { items: [platformAuditEvents[5]], nextCursor: null, hasMore: false };
  const next: ApiSchemas["CursorResultOfPlatformAuditEventResponse"] = { items: [{ ...signIn,
    id: "a0000000-0000-4000-8000-000000001020", occurredAtUtc: "2026-09-18T14:00:00Z" }], nextCursor: null, hasMore: false };
  return [
    { method: "GET", path: "/api/platform/audit", query: { search: "Grupo Delta" }, status: 200, body: filtered },
    { method: "GET", path: "/api/platform/audit", query: { tenantId: delta }, status: 200, body: filtered },
    { method: "GET", path: "/api/platform/audit", query: { after: nextCursor }, status: 200, body: next },
    { method: "GET", path: "/api/platform/audit", status: 200, body: page },
    { method: "GET", path: "/api/platform/audit/organizations", query: { search: "Grupo Delta" }, status: 200, body: [organizations[0]] },
    { method: "GET", path: "/api/platform/audit/organizations", status: 200, body: organizations },
  ];
}
