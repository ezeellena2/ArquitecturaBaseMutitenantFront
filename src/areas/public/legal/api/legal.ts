import { api } from "@/shared/api/httpClient";

export type LegalKind = "terms" | "privacy";

// Contrato E3a hasta regenerar schema.d.ts al cerrar la API.
export interface LegalDocumentResponse {
  readonly id: string;
  readonly kind: string;
  readonly version: number;
  readonly effectiveAtUtc: string;
  readonly culture: string;
  readonly text: string;
}

export const legalDocumentQueryKey = (kind: LegalKind, culture: string) => ["legal", kind, culture] as const;

export function getLegalDocument(kind: LegalKind): Promise<LegalDocumentResponse> {
  return api.get<LegalDocumentResponse>(`/api/legal/${kind}`);
}
