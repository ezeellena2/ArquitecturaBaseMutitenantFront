import type { ApiSchemas } from "@/shared/api/types";

type Account = ApiSchemas["PlatformAccountResponse"];
const person = { kind: "Person", hasPersonalSpace: true, invitationExpiresAtUtc: null } as const;
const operator = { kind: "Operator", hasPersonalSpace: false, invitationExpiresAtUtc: null } as const;

// Filas literales de Cuentas v111. Los operadores usan el método real Code de E5, sin inventar MFA.
export const platformAccountRows: Account[] = [
  { ...person, id: "account-lucia", displayName: "Lucía Fernández", primaryEmail: "lucia.fernandez@delta.ejemplo.com", state: "Active", organizationCount: 2, lastSignInAtUtc: "2026-09-27T19:40:00Z", lastSignInMethod: "Code" },
  { ...person, id: "account-beto", displayName: "Beto Ramírez", primaryEmail: "beto.ramirez@beta.ejemplo.com", state: "Active", organizationCount: 1, lastSignInAtUtc: "2026-09-26T15:00:00Z", lastSignInMethod: "Google" },
  { ...person, id: "account-ana", displayName: "Ana Gómez", primaryEmail: "ana.gomez@gmail.com", state: "Suspended", organizationCount: 0, lastSignInAtUtc: "2026-09-18T15:00:00Z", lastSignInMethod: "WhatsAppCode" },
  { ...person, id: "account-mariana", displayName: null, primaryEmail: "mariana.lopez@gmail.com", state: "Active", organizationCount: 0, lastSignInAtUtc: "2026-09-27T12:35:00Z", lastSignInMethod: "Code" },
  { ...person, id: "account-julio", displayName: "Julio Pérez", primaryEmail: "julio@gamma.ejemplo.com", state: "Active", organizationCount: 1, lastSignInAtUtc: "2026-09-27T11:35:00Z", lastSignInMethod: "Code" },
  { ...person, id: "account-pablo", displayName: "Pablo Ortiz", primaryEmail: "pablo@kappa.ejemplo.com", state: "NeedsRecovery", organizationCount: 0, lastSignInAtUtc: "2026-09-19T15:00:00Z", lastSignInMethod: "Code" },
  { ...person, id: "account-diego", displayName: "Diego Ríos", primaryEmail: "diego.rios@delta.ejemplo.com", state: "PendingDeletion", organizationCount: 1, lastSignInAtUtc: "2026-09-27T12:00:00Z", lastSignInMethod: "Code" },
  { ...person, id: "account-deleted", displayName: "Cuenta eliminada", primaryEmail: null, state: "Deleted", hasPersonalSpace: false, organizationCount: 0, lastSignInAtUtc: "2026-08-12T15:00:00Z", lastSignInMethod: "WhatsAppCode" },
  { ...operator, id: "martin-sosa", displayName: "Martín Sosa", primaryEmail: "martin.sosa@arquitecturabase.ejemplo.com", state: "Active", organizationCount: 0, lastSignInAtUtc: "2026-09-27T19:55:00Z", lastSignInMethod: "Code" },
  { ...operator, id: "account-laura", displayName: "Laura Díaz", primaryEmail: "laura.diaz@arquitecturabase.ejemplo.com", state: "Active", organizationCount: 0, lastSignInAtUtc: "2026-09-22T20:35:00Z", lastSignInMethod: "Code" },
  { ...operator, id: "account-julieta", displayName: null, primaryEmail: "julieta.molina@arquitecturabase.ejemplo.com", state: "Invited", organizationCount: 0, lastSignInAtUtc: null, lastSignInMethod: null, invitationExpiresAtUtc: "2026-10-04T20:35:00Z" },
];

const mobileIds = new Set(["account-lucia", "account-beto", "account-ana", "account-mariana", "account-pablo", "account-diego", "martin-sosa", "account-julieta"]);
function accountPage(rows: readonly Account[], page = 1, pageSize = 10): ApiSchemas["PagedResultOfPlatformAccountResponse"] {
  const totalPages = Math.ceil(rows.length / pageSize);
  return { items: rows.slice((page - 1) * pageSize, page * pageSize), page, pageSize, totalCount: rows.length, totalPages, hasPrevious: page > 1, hasNext: page < totalPages };
}

function accountCounts(rows: readonly Account[]): ApiSchemas["PlatformAccountFilterCounts"] {
  return { total: rows.length,
    states: (["Active", "Invited", "InvitationExpired", "Suspended", "NeedsRecovery", "PendingDeletion", "Deleted"] as const).map((state) => ({ state, count: rows.filter((row) => row.state === state).length })),
    kinds: (["Person", "Operator"] as const).map((kind) => ({ kind, count: rows.filter((row) => row.kind === kind).length })),
  };
}

// La lista sólo lee esta ficha para decidir el bloqueo de baja; no se inventa evidencia histórica.
function deletionDetail(row: Account): ApiSchemas["PlatformAccountDetailResponse"] {
  return { id: row.id, displayName: row.displayName, kind: row.kind, state: row.state, createdAtUtc: null, deletedAtUtc: null,
    lastStateChange: null, lastSignInAtUtc: row.lastSignInAtUtc, lastSignInMethod: row.lastSignInMethod, invitationExpiresAtUtc: row.invitationExpiresAtUtc,
    hasPersonalSpace: row.hasPersonalSpace, deletion: null, loginMethods: [], organizations: [],
    soleOwnerOrganizations: row.id === "account-lucia" ? ["Grupo Delta"] : [], operatorPermissions: null, operatorVersion: null };
}

export function platformAccountsCaptureResponses({ invitationError, mobile = false, includeAll = false }: { invitationError?: "InvitationExists" | "AccountExists"; mobile?: boolean; includeAll?: boolean } = {}) {
  // M-Cuentas dibuja ocho filas. Los menús de Julio y Laura usan la referencia base declarada y las once filas.
  const rows = mobile && !includeAll ? platformAccountRows.filter((row) => mobileIds.has(row.id)) : platformAccountRows;
  return [
    { method: "GET", path: "/api/platform/accounts/paged", query: { page: "2" }, status: 200, body: accountPage(rows, 2) },
    { method: "GET", path: "/api/platform/accounts/paged", query: { pageSize: "20" }, status: 200, body: accountPage(rows, 1, 20) },
    { method: "GET", path: "/api/platform/accounts/paged", status: 200, body: accountPage(rows) },
    { method: "GET", path: "/api/platform/accounts/filter-counts", status: 200, body: accountCounts(rows) },
    ...platformAccountRows.map((row) => ({ method: "GET", path: `/api/platform/accounts/${row.id}`, status: 200, body: deletionDetail(row) })),
    { method: "POST", path: "/api/platform/operators/invitations", status: invitationError ? 409 : 201,
      body: invitationError ? { code: `Platform.Operator.${invitationError}`, traceId: "capture" } : { id: "new-operator", expiresAtUtc: "2026-10-04T20:35:00Z" } },
  ];
}
