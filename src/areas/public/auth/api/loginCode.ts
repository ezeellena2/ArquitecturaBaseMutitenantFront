import { api } from "@/shared/api/httpClient";

export interface RequestLoginCodeResponse { readonly resendAfterSeconds: number }
export interface VerifyLoginCodeRequest { readonly email: string; readonly code: string; readonly returnUrl: string }
export interface VerifyLoginCodeResponse { readonly returnUrl: string }

export const requestLoginCode = (email: string, key: string): Promise<RequestLoginCodeResponse> =>
  api.post<RequestLoginCodeResponse>("/api/auth/login-code", { email }, { headers: { "Idempotency-Key": key } });

export const verifyLoginCode = (input: VerifyLoginCodeRequest, key: string): Promise<VerifyLoginCodeResponse> =>
  api.post<VerifyLoginCodeResponse>("/api/auth/login-code/verify", input, { headers: { "Idempotency-Key": key } });
