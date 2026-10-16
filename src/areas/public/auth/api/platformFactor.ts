import { api } from "@/shared/api/httpClient";
import type { CompletePlatformFactorResponse, PlatformFactorChallengeResponse, VerifyPlatformFactorRequest, VerifyPlatformFactorResponse } from "@/shared/api/types";

// El segundo factor del operador (E9). Lo autentica la cookie del desafío pendiente, nunca un token: las tres van solo
// con la cookie. Ni el secreto ni los códigos se guardan en el navegador: la respuesta vive en la memoria de la consulta.
const base = "/api/auth/platform-factor";

/** La consulta del desafío: nunca se cachea entre pantallas ni se vuelve a pedir sola. */
export const platformFactorQueryKey = ["auth", "platform-factor"] as const;

export const fetchPlatformFactor = (signal?: AbortSignal): Promise<PlatformFactorChallengeResponse> =>
  api.getCookie<PlatformFactorChallengeResponse>(base, { signal, cache: "no-store" });

export const verifyPlatformFactor = (input: VerifyPlatformFactorRequest, key: string): Promise<VerifyPlatformFactorResponse> =>
  api.postCookie<VerifyPlatformFactorResponse>(`${base}/verify`, input, { headers: { "Idempotency-Key": key } });

export const completePlatformFactor = (key: string): Promise<CompletePlatformFactorResponse> =>
  api.postCookie<CompletePlatformFactorResponse>(`${base}/complete`, { savedRecoveryCodes: true }, { headers: { "Idempotency-Key": key } });
