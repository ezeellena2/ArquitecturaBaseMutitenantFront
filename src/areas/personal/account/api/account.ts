import { api } from "@/shared/api/httpClient";
import type { MeResponse, UpdateMeRequest } from "@/shared/api/types";

export function updateMe(request: UpdateMeRequest): Promise<MeResponse> {
  return api.put<MeResponse>("/api/me", request);
}
