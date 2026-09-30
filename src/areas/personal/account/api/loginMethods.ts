import { api } from "@/shared/api/httpClient";
import { accountPaths, methodPath } from "@/shared/api/accountContract";
import type { AccountLoginMethodsResponse, AddLoginEmailRequest, ChangeLoginMethodRequest, LoginMethodCodeResponse,
  VerifyLoginMethodRequest, GoogleChallengeResponse, GoogleSignupAntiforgeryResponse } from "@/shared/api/types";

export const accountMethodsQueryKey = ["account-login-methods"] as const;
export const fetchLoginMethods = () => api.get<AccountLoginMethodsResponse>(accountPaths.methods);
export const addLoginEmail = (request: AddLoginEmailRequest, key: string) =>
  api.post<LoginMethodCodeResponse>(accountPaths.methods, request, { headers: { "Idempotency-Key": key } });
export const sendLoginMethodCode = (id: string, key: string) =>
  api.post<LoginMethodCodeResponse>(methodPath(accountPaths.methodCode, id), undefined, { headers: { "Idempotency-Key": key } });
export const verifyLoginMethod = (id: string, request: VerifyLoginMethodRequest, key: string) =>
  api.post<void>(methodPath(accountPaths.methodVerify, id), request, { headers: { "Idempotency-Key": key } });
export const removeLoginMethod = (id: string, request: ChangeLoginMethodRequest) =>
  api.delete<void>(methodPath(accountPaths.method, id), { body: JSON.stringify(request) });
export const makeLoginMethodPrimary = (id: string, request: ChangeLoginMethodRequest) =>
  api.put<void>(methodPath(accountPaths.methodPrimary, id), request);

export async function linkGoogle(): Promise<GoogleChallengeResponse> {
  const token = await api.get<GoogleSignupAntiforgeryResponse>("/api/auth/external/google/antiforgery");
  return api.post<GoogleChallengeResponse>(accountPaths.google, undefined, {
    headers: { "Content-Type": "application/x-www-form-urlencoded", RequestVerificationToken: token.requestToken },
  });
}
