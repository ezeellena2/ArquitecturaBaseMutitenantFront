import { api } from "@/shared/api/httpClient";
import type { RequestLoginCodeRequest, RequestLoginCodeResponse, VerifyLoginCodeRequest, VerifyLoginCodeResponse } from "@/shared/api/types";

export const requestLoginCode = (input: string | RequestLoginCodeRequest, key: string): Promise<RequestLoginCodeResponse> =>
  api.post<RequestLoginCodeResponse>("/api/auth/login-code", typeof input === "string" ? { email: input } : input,
    { headers: { "Idempotency-Key": key } });

export const verifyLoginCode = (input: VerifyLoginCodeRequest, key: string): Promise<VerifyLoginCodeResponse> =>
  api.post<VerifyLoginCodeResponse>("/api/auth/login-code/verify", input, { headers: { "Idempotency-Key": key } });
