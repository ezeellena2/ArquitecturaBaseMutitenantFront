import { api } from "@/shared/api/httpClient";
import { accountPaths, methodPath } from "@/shared/api/accountContract";
import type { AccountLoginMethodsResponse, AddLoginMethodRequest, LoginMethodCodeResponse,
  VerifyLoginMethodRequest, GoogleChallengeResponse, GoogleSignupAntiforgeryResponse } from "@/shared/api/types";

export const accountMethodsQueryKey = ["account-login-methods"] as const;
export const fetchLoginMethods = () => api.get<AccountLoginMethodsResponse>(accountPaths.methods);
export const addLoginMethod = (request: AddLoginMethodRequest, key: string) =>
  api.post<LoginMethodCodeResponse>(accountPaths.methods, request, { headers: { "Idempotency-Key": key } });
export const addLoginEmail = addLoginMethod;
export const sendLoginMethodCode = (id: string, key: string) =>
  api.post<LoginMethodCodeResponse>(methodPath(accountPaths.methodCode, id), undefined, { headers: { "Idempotency-Key": key } });
export const verifyLoginMethod = (id: string, request: VerifyLoginMethodRequest, key: string) =>
  api.post<void>(methodPath(accountPaths.methodVerify, id), request, { headers: { "Idempotency-Key": key } });
export const removeLoginMethod = (id: string) => api.delete<void>(methodPath(accountPaths.method, id));
export const makeLoginMethodPrimary = (id: string) => api.put<void>(methodPath(accountPaths.methodPrimary, id));

export async function linkGoogle(): Promise<GoogleChallengeResponse> {
  const token = await api.get<GoogleSignupAntiforgeryResponse>("/api/auth/external/google/antiforgery");
  return api.post<GoogleChallengeResponse>(accountPaths.google, undefined, {
    headers: { RequestVerificationToken: token.requestToken },
  });
}
