import { api } from "@/shared/api/httpClient";
import type { RequestLoginCodeResponse, VerifyLoginCodeRequest, VerifyLoginCodeResponse } from "@/shared/api/types";

export const requestLoginCode = (email: string, key: string): Promise<RequestLoginCodeResponse> =>
  api.post<RequestLoginCodeResponse>("/api/auth/login-code", { email }, { headers: { "Idempotency-Key": key } });

export const verifyLoginCode = (input: VerifyLoginCodeRequest, key: string): Promise<VerifyLoginCodeResponse> =>
  api.post<VerifyLoginCodeResponse>("/api/auth/login-code/verify", input, { headers: { "Idempotency-Key": key } });
