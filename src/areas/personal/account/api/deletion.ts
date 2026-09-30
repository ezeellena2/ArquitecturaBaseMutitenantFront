import { api } from "@/shared/api/httpClient";
import { accountPaths } from "@/shared/api/accountContract";
import type { RequestAccountDeletionRequest, AccountDeletionResponse } from "@/shared/api/types";

export const requestAccountDeletion = (request: RequestAccountDeletionRequest, key: string) =>
  api.post<AccountDeletionResponse>(accountPaths.deletion, request, { headers: { "Idempotency-Key": key } });
