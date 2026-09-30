import { api } from "@/shared/api/httpClient";
import { accountPaths } from "@/shared/api/accountContract";
import type { PendingDeletionState, CancelAccountDeletionResponse } from "@/shared/api/types";

export const getPendingDeletion = () => api.post<PendingDeletionState>(accountPaths.pendingDeletion);
export const cancelAccountDeletion = (cancelTicket: string, key: string) =>
  api.post<CancelAccountDeletionResponse>(accountPaths.cancelDeletion, { cancelTicket }, { headers: { "Idempotency-Key": key } });
