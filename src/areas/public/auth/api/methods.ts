import { api } from "@/shared/api/httpClient";
import type { LoginMethodsResponse } from "@/shared/api/types";

export const loginMethodsQueryKey = ["auth", "methods"] as const;

export function getLoginMethods(): Promise<LoginMethodsResponse> {
  return api.get<LoginMethodsResponse>("/api/auth/methods");
}
