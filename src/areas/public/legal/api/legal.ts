import { api } from "@/shared/api/httpClient";
import type { LegalDocumentResponse } from "@/shared/api/types";

export type LegalKind = "terms" | "privacy";

export const legalDocumentQueryKey = (kind: LegalKind, culture: string) => ["legal", kind, culture] as const;

export function getLegalDocument(kind: LegalKind): Promise<LegalDocumentResponse> {
  return api.get<LegalDocumentResponse>(`/api/legal/${kind}`);
}
