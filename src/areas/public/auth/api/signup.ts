import { api } from "@/shared/api/httpClient";

export interface SignupRequest { readonly email: string; readonly acceptedTerms: true }
export interface SignupResponse { readonly resendAfterSeconds: number }
export interface VerifySignupRequest { readonly email: string; readonly code: string; readonly acceptedTerms: true }

export const requestSignup = (input: SignupRequest, key: string): Promise<SignupResponse> =>
  api.post<SignupResponse>("/api/auth/signup", input, { headers: { "Idempotency-Key": key } });

export const verifySignup = (input: VerifySignupRequest, key: string): Promise<void> =>
  api.post<void>("/api/auth/signup/verify", input, { headers: { "Idempotency-Key": key } });
