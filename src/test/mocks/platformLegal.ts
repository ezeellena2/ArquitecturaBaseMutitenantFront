import type { ApiSchemas } from "@/shared/api/types";

// v111: una versión publicada futura no reemplaza a la vigente.
// Las fechas civiles del dibujo se proyectan en UTC con la zona del operador (Buenos Aires).
export const platformLegalDocuments: ApiSchemas["PlatformLegalDocumentGroupResponse"][] = [
  { kind: "Terms", currentVersion: 2, currentEffectiveAtUtc: "2026-06-01T03:00:00Z", versions: [
    { id: "11111111-1111-4111-8111-111111111102", version: 2, effectiveAtUtc: "2026-06-01T03:00:00Z", isCurrent: true },
    { id: "11111111-1111-4111-8111-111111111101", version: 1, effectiveAtUtc: "2026-01-12T03:00:00Z", isCurrent: false },
  ] },
  { kind: "Privacy", currentVersion: 1, currentEffectiveAtUtc: "2026-01-12T03:00:00Z", versions: [
    { id: "22222222-2222-4222-8222-222222222202", version: 2, effectiveAtUtc: "2026-11-01T03:00:00Z", isCurrent: false },
    { id: "22222222-2222-4222-8222-222222222201", version: 1, effectiveAtUtc: "2026-01-12T03:00:00Z", isCurrent: true },
  ] },
];

export function platformLegalCaptureResponses() {
  const published: ApiSchemas["PublishedLegalDocumentResponse"] = { id: "11111111-1111-4111-8111-111111111103", version: 3 };
  return [
    { method: "GET", path: "/api/platform/legal-documents", status: 200, body: platformLegalDocuments },
    { method: "POST", path: "/api/platform/legal-documents", status: 201, body: published },
  ];
}
