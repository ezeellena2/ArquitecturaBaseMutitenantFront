import { api } from "@/shared/api/httpClient";
import type { GoogleSignupAntiforgeryResponse } from "@/shared/api/types";

export const googleSignupAntiforgeryQueryKey = ["auth", "google-signup-antiforgery"] as const;

export function getGoogleSignupAntiforgery(): Promise<GoogleSignupAntiforgeryResponse> {
  return api.get<GoogleSignupAntiforgeryResponse>("/api/auth/external/google/antiforgery");
}
