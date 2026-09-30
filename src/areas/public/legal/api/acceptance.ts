import { api } from "@/shared/api/httpClient";
import { accountPaths } from "@/shared/api/accountContract";
import type { AcceptLegalRequest } from "@/shared/api/types";

export const acceptLegalDocuments = (request: AcceptLegalRequest, key: string) =>
  api.post<void>(accountPaths.acceptLegal, request, { headers: { "Idempotency-Key": key } });
