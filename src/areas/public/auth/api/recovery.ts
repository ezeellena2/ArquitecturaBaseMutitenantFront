import { api } from "@/shared/api/httpClient";
import type { PreviewAccountRecoveryRequest, RequestLoginCodeResponse, RequestRecoveryCodeRequest, SubmitAccountRecoveryRequest, VerifyRecoveryCodeRequest } from "@/shared/api/types";

export const previewAccountRecovery = (input: PreviewAccountRecoveryRequest): Promise<void> =>
  api.post<void>("/api/account-recovery/preview", input);

export const requestRecoveryCode = (input: RequestRecoveryCodeRequest, key: string): Promise<RequestLoginCodeResponse> =>
  api.post<RequestLoginCodeResponse>("/api/account-recovery/code", input, { headers: { "Idempotency-Key": key } });

export const verifyRecoveryCode = (input: VerifyRecoveryCodeRequest, key: string): Promise<void> =>
  api.post<void>("/api/account-recovery/verify", input, { headers: { "Idempotency-Key": key } });

export const submitAccountRecovery = (input: SubmitAccountRecoveryRequest, key: string): Promise<void> =>
  api.post<void>("/api/account-recovery", input, { headers: { "Idempotency-Key": key } });
