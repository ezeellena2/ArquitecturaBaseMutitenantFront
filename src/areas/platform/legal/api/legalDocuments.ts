import { api } from "@/shared/api/httpClient";
import type { PlatformLegalDocumentGroupResponse, PublishLegalDocumentRequest, PublishedLegalDocumentResponse } from "@/shared/api/types";

export const legalDocumentsQueryKey = ["platform", "legal-documents"] as const;
export function fetchLegalDocuments() { return api.get<PlatformLegalDocumentGroupResponse[]>("/api/platform/legal-documents"); }
export function publishLegalDocument(request: PublishLegalDocumentRequest, key: string) {
  return api.post<PublishedLegalDocumentResponse>("/api/platform/legal-documents", request, { headers: { "Idempotency-Key": key } });
}
