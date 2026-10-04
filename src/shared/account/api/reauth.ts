import { api } from "@/shared/api/httpClient";
import { accountPaths } from "@/shared/api/accountContract";
import type { RequestReauthRequest, VerifyReauthRequest, ReauthCodeResponse, ReauthResponse } from "@/shared/api/types";

export const requestReauth = (request: RequestReauthRequest, key: string) =>
  api.post<ReauthCodeResponse>(accountPaths.reauth, request, { headers: { "Idempotency-Key": key } });
export const verifyReauth = (request: VerifyReauthRequest, key: string) =>
  api.post<ReauthResponse>(accountPaths.reauthVerify, request, { headers: { "Idempotency-Key": key } });
