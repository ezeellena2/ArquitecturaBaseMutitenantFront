import type { ApiSchemas } from "@/shared/api/types";

type Recovery = ApiSchemas["PlatformRecoveryResponse"];

// Recuperaciones v111. El correo nuevo es el canal disponible hasta E8 (decisión 8).
// La API entrega ambos métodos tapados; el arnés tampoco necesita sus valores completos.
export const platformRecoveries: Recovery[] = [
  { id: "r1", createdAtUtc: "2026-09-27T13:20:00Z", accountId: "account-pablo", accountName: "Pablo Ortiz", previousMethodType: "Email", previousMethod: "pa•••@kappa.ejemplo.com", newMethodType: "Email", newMethod: "pa•••@gmail.com", status: "Pending", decidedAtUtc: null, decidedBy: null, reason: null, version: 1 },
  { id: "r2", createdAtUtc: "2026-09-26T21:05:00Z", accountId: null, accountName: null, previousMethodType: "Email", previousMethod: "ma•••@omega.ejemplo.com", newMethodType: "Email", newMethod: "ma•••@gmail.com", status: "Pending", decidedAtUtc: null, decidedBy: null, reason: null, version: 1 },
  { id: "r3", createdAtUtc: "2026-09-22T12:40:00Z", accountId: "account-rosa", accountName: "Rosa Luna", previousMethodType: "Email", previousMethod: "ro•••@sigma.ejemplo.com", newMethodType: "Email", newMethod: "ro•••@gmail.com", status: "Approved", decidedAtUtc: "2026-09-22T14:00:00Z", decidedBy: "Laura Díaz", reason: "Confirmó sus datos por videollamada.", version: 2 },
  { id: "r4", createdAtUtc: "2026-09-15T16:12:00Z", accountId: "account-carla", accountName: "Carla Núñez", previousMethodType: "Phone", previousMethod: "•••• 2204", newMethodType: "Email", newMethod: "ca•••@gmail.com", status: "Rejected", decidedAtUtc: "2026-09-15T18:00:00Z", decidedBy: "Martín Sosa", reason: "No pudo confirmar que la cuenta es suya.", version: 2 },
];

export function platformRecoveriesCaptureResponses({ empty = false }: { empty?: boolean } = {}) {
  const rows = empty ? [] : platformRecoveries;
  const statuses = (["Pending", "Approved", "Rejected"] as const).map((status) => ({ status, count: rows.filter((row) => row.status === status).length }));
  const paged = (items: Recovery[]): ApiSchemas["PagedResultOfPlatformRecoveryResponse"] => ({ items, page: 1, pageSize: 10, totalCount: items.length, totalPages: items.length ? 1 : 0, hasPrevious: false, hasNext: false });
  return [
    ...statuses.flatMap(({ status }) => {
      const items = rows.filter((row) => row.status === status);
      return [
        { method: "GET", path: "/api/platform/recoveries/paged", query: { status }, status: 200, body: paged(items) },
        { method: "GET", path: "/api/platform/recoveries/filter-counts", query: { status }, status: 200, body: { total: items.length, statuses } },
      ];
    }),
    { method: "GET", path: "/api/platform/recoveries/paged", status: 200, body: paged(rows) },
    { method: "GET", path: "/api/platform/recoveries/filter-counts", status: 200, body: { total: rows.length, statuses } },
    ...rows.flatMap((row) => (["approve", "reject"] as const).map((action) => {
      const code = row.status !== "Pending" ? "AlreadyResolved" : action === "approve" && !row.accountId ? "NoAccount" : null;
      return { method: "POST", path: `/api/platform/recoveries/${row.id}/${action}`, status: code ? 409 : 200,
        body: code ? { code: `Platform.AccountRecovery.${code}`, traceId: "capture" } : { version: row.version + 1 } };
    })),
  ];
}
