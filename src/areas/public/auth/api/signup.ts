import { api } from "@/shared/api/httpClient";
import type { SignupRequest, SignupResponse, VerifySignupRequest } from "@/shared/api/types";

export const requestSignup = (input: SignupRequest, key: string): Promise<SignupResponse> =>
  api.post<SignupResponse>("/api/auth/signup", input, { headers: { "Idempotency-Key": key } });

export const verifySignup = (input: VerifySignupRequest, key: string): Promise<void> =>
  api.post<void>("/api/auth/signup/verify", input, { headers: { "Idempotency-Key": key } });
