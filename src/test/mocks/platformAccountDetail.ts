import type { ApiSchemas } from "@/shared/api/types";

type Detail = ApiSchemas["PlatformAccountDetailResponse"];
type Event = ApiSchemas["PlatformAuditEventResponse"];
const personLastSignInAtUtc = "2026-09-27T19:40:00Z";
const operatorInvitedAtUtc = "2026-08-12T11:40:00Z";
const invitationCreatedAtUtc = "2026-09-27T20:35:00Z";
const states: Record<string, Detail["state"]> = { Activa: "Active", Suspendida: "Suspended", "Necesita recuperación": "NeedsRecovery", "Baja pedida": "PendingDeletion", "Baja iniciada por la plataforma": "PendingDeletion", Eliminada: "Deleted" };
const method = (id: string, maskedValue: string, verifiedAtUtc: string, isPrimary = false, managedByOrganizationName: string | null = null): Detail["loginMethods"][number] =>
  ({ id, type: "Email", maskedValue, isPrimary, verifiedAtUtc, managedByOrganizationName, canSignIn: true });
const membership = (tenantId: string, name: string, joinedAtUtc: string, roleName: string | null = null): Detail["organizations"][number] =>
  ({ tenantId, name, roleName, joinedAtUtc, status: "Active", tenantStatus: "Active", endedAtUtc: null });

// Identidad y métodos del tablero v111. Los nombres de rol llegan traducidos por Application.
export function platformAccountDetailFixture({ state = "Activa", kind = "Persona" } = {}): Detail {
  const base: Detail = { id: "account-lucia", displayName: "Lucía Fernández", primaryEmail: "lucia.fer@gmail.com", kind: "Person", state: states[state] ?? "Active",
    createdAtUtc: "2026-01-12T11:40:00Z", deletedAtUtc: null, lastSignInAtUtc: personLastSignInAtUtc, lastSignInMethod: "Code", invitationExpiresAtUtc: null,
    hasPersonalSpace: true, deletion: null, lastStateChange: null, operatorPermissions: null, operatorVersion: null, soleOwnerOrganizations: ["Grupo Delta"],
    loginMethods: [method("method-managed", "lu•••@delta.ejemplo.com", "2026-01-12T11:40:00Z", false, "Grupo Delta"),
      { ...method("method-phone", "•••• 4521", "2026-02-03T14:47:00Z"), type: "Phone", canSignIn: false }, method("method-primary", "lu•••@gmail.com", "2026-05-10T17:20:00Z", true)],
    organizations: [membership("tenant-1", "Grupo Delta", "2026-01-12T11:40:00Z", "Dueño"), membership("tenant-beta", "Beta S.R.L.", "2026-02-03T14:47:00Z")],
  };
  if (kind.startsWith("Operador")) return { ...base, id: "account-laura", displayName: "Laura Díaz", primaryEmail: "laura.diaz@arquitecturabase.ejemplo.com", kind: "Operator", state: "Active",
    hasPersonalSpace: false, createdAtUtc: operatorInvitedAtUtc, lastSignInAtUtc: "2026-09-22T20:35:00Z",
    loginMethods: [method("method-laura", "la•••@arquitecturabase.ejemplo.com", operatorInvitedAtUtc, true)], organizations: [], soleOwnerOrganizations: [], operatorVersion: 1,
    operatorPermissions: ["platform.tenants.read", "platform.recoveries.manage"] };
  if (kind.startsWith("Invitación")) return { ...base, id: "account-julieta", displayName: null, primaryEmail: "julieta.molina@arquitecturabase.ejemplo.com", kind: "Operator",
    state: kind.endsWith("vencida") ? "InvitationExpired" : "Invited", invitationExpiresAtUtc: "2026-10-04T20:35:00Z", lastSignInAtUtc: null, lastSignInMethod: null,
    hasPersonalSpace: false, createdAtUtc: invitationCreatedAtUtc,
    loginMethods: [method("method-julieta", "ju•••@arquitecturabase.ejemplo.com", invitationCreatedAtUtc, true)], organizations: [], soleOwnerOrganizations: [], operatorVersion: 1,
    operatorPermissions: ["platform.tenants.read", "platform.accounts.read", "platform.audit.read"] };
  if (state === "Suspendida") return { ...base, lastStateChange: { atUtc: "2026-09-27T20:00:00Z", action: "Suspendió la cuenta", reason: "Denuncia de uso indebido." } };
  if (state === "Necesita recuperación") return { ...base, id: "account-pablo", displayName: "Pablo Ortiz", primaryEmail: "pablo@kappa.ejemplo.com", createdAtUtc: "2026-03-15T12:30:00Z", lastSignInAtUtc: "2026-09-19T21:12:00Z",
    loginMethods: [{ ...method("method-kappa", "pa•••@kappa.ejemplo.com", "2026-03-15T12:30:00Z", true, "Kappa S.R.L."), canSignIn: false }],
    organizations: [{ ...membership("tenant-kappa", "Kappa S.R.L.", "2026-03-15T12:30:00Z", "Dueño"), status: "Inactive", endedAtUtc: "2026-09-20T13:00:00Z" }], soleOwnerOrganizations: [] };
  if (base.state === "PendingDeletion") return { ...base, id: "account-diego", displayName: "Diego Ríos", primaryEmail: "diego.rios@delta.ejemplo.com", createdAtUtc: "2026-02-18T13:05:00Z", lastSignInAtUtc: "2026-09-27T12:12:00Z",
    deletion: { requestedAtUtc: state === "Baja iniciada por la plataforma" ? "2026-09-27T13:30:00Z" : "2026-09-27T12:15:00Z", scheduledForUtc: "2026-10-27T12:15:00Z", requestedByPlatform: state === "Baja iniciada por la plataforma" },
    loginMethods: [method("method-diego", "di•••@delta.ejemplo.com", "2026-02-18T13:05:00Z", true, "Grupo Delta")], organizations: [membership("tenant-1", "Grupo Delta", "2026-02-18T13:05:00Z")], soleOwnerOrganizations: [] };
  if (base.state === "Deleted") return { ...base, id: "account-deleted", displayName: "Cuenta eliminada", primaryEmail: null, createdAtUtc: "2026-03-04T19:22:00Z", deletedAtUtc: "2026-09-11T06:00:00Z",
    lastSignInAtUtc: "2026-08-12T21:36:00Z", hasPersonalSpace: false, loginMethods: [], organizations: [], soleOwnerOrganizations: [] };
  return base;
}

function history(detail: Detail): ApiSchemas["CursorResultOfPlatformAuditEventResponse"] {
  const row = (id: string, occurredAtUtc: string, action: string, summary: string, reason: string | null = null): Event =>
    ({ id, occurredAtUtc, type: action === "SignIn" ? "signins" : action.startsWith("PlatformOperator") ? "operators" : action === "OrganizationMembershipEnded" ? "organizations" : "accounts", action, summary, target: detail.displayName ?? "ju•••@arquitecturabase.ejemplo.com", targetAccountId: detail.id,
      targetTenantId: null, actor: detail.displayName ?? "ju•••@arquitecturabase.ejemplo.com", actorRole: detail.kind === "Operator" ? "Operador" : "Persona", reason, ipAddress: null });
  // summary es texto humano del producer AuditTexts; action conserva la clave técnica.
  if (detail.state === "Invited" || detail.state === "InvitationExpired") return { items: [
    { ...row("invitation-history-1", invitationCreatedAtUtc, "PlatformOperatorInvited", "Invitó a un operador"), actor: "Martín Sosa", actorRole: "Operador" },
  ], nextCursor: null, hasMore: false };
  const rows = detail.kind === "Operator" ? [row("op-history-3", "2026-09-22T20:35:00Z", "SignIn", "Ingresó con un código por correo"),
    { ...row("op-history-2", "2026-08-22T17:20:00Z", "PlatformOperatorPermissionsChanged", "Cambió los permisos del operador"), actor: "Martín Sosa", actorRole: "Operador" },
    { ...row("op-history-1", operatorInvitedAtUtc, "PlatformOperatorInvited", "Invitó a un operador"), actor: "Martín Sosa", actorRole: "Operador" }]
    : [row("account-history-3", personLastSignInAtUtc, "SignIn", "Ingresó con un código por correo"),
      row("account-history-2", "2026-05-10T17:20:00Z", "LoginMethodChanged", "Cambió un método de ingreso"),
      row("account-history-1", "2026-02-03T14:47:00Z", "LoginMethodChanged", "Cambió un método de ingreso")];
  if (detail.state === "Deleted") return { items: [
    { ...row("deleted-history-3", "2026-09-11T06:00:00Z", "AccountDeleted", "Eliminó la cuenta"), actor: "Sistema", actorRole: "Automático" },
    row("deleted-history-2", "2026-08-12T21:40:00Z", "AccountDeletionRequested", "Pidió la baja de la cuenta"),
    row("deleted-history-1", "2026-08-12T21:36:00Z", "SignIn", "Ingresó con un código por correo"),
  ], nextCursor: null, hasMore: false };
  if (detail.state === "NeedsRecovery") return { items: [
    { ...row("recovery-history-3", "2026-09-20T13:00:00Z", "OrganizationMembershipEnded", "Terminó la membresía en la organización"), actor: "Sistema", actorRole: "Automático", targetTenantId: "tenant-kappa", target: "Kappa S.R.L." },
    row("recovery-history-2", "2026-09-19T21:12:00Z", "SignIn", "Ingresó con un código por correo"),
    row("recovery-history-1", "2026-03-15T12:30:00Z", "LoginMethodChanged", "Cambió un método de ingreso"),
  ], nextCursor: null, hasMore: false };
  if (detail.deletion) return { items: [
    { ...row("deletion-history-3", detail.deletion.requestedAtUtc, "AccountDeletionRequested", "Pidió la baja de la cuenta", detail.deletion.requestedByPlatform ? "Pedido legal recibido por correo." : "Ya no uso el servicio."),
      ...(detail.deletion.requestedByPlatform ? { actor: "Laura Díaz", actorRole: "Operador" } : {}) },
    row("deletion-history-2", "2026-09-27T12:12:00Z", "SignIn", "Ingresó con un código por correo"),
    row("deletion-history-1", "2026-02-18T13:05:00Z", "LoginMethodChanged", "Cambió un método de ingreso"),
  ], nextCursor: null, hasMore: false };
  if (detail.state === "Suspended" && detail.lastStateChange) rows.unshift({ ...row("suspended-history-4", detail.lastStateChange.atUtc, "AccountSuspended", "Suspendió la cuenta", detail.lastStateChange.reason ?? null), actor: "Laura Díaz", actorRole: "Operador" });
  return { items: rows, nextCursor: null, hasMore: false };
}

export function platformAccountDetailCaptureResponses(options: { state?: string; kind?: string; lastManager?: boolean } = {}) {
  const detail = platformAccountDetailFixture(options);
  return [
    { method: "GET", path: `/api/platform/accounts/${detail.id}`, status: 200, body: detail },
    { method: "GET", path: "/api/platform/audit", query: { accountId: detail.id, period: "all" }, status: 200, body: history(detail) },
    { method: "PUT", path: `/api/platform/accounts/${detail.id}/operator`, status: 200, body: { version: 2 } },
    { method: "DELETE", path: `/api/platform/accounts/${detail.id}/operator`, status: options.lastManager ? 409 : 204,
      ...(options.lastManager ? { body: { code: "Platform.Operator.LastManager", detail: "Tiene que quedar al menos un operador activo que pueda administrar operadores.", traceId: "capture" } } : {}) },
  ];
}
