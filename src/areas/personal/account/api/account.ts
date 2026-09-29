import { api } from "@/shared/api/httpClient";
import type { UpdateMeRequest } from "@/shared/api/types";

export function updateMe(request: UpdateMeRequest): Promise<void> {
  return api.put<void>("/api/me", request);
}
