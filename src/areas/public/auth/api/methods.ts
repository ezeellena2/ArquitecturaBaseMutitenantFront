import { api } from "@/shared/api/httpClient";

// Hasta que la tarea de contracts regenere el OpenAPI con las rutas de E3a.
export interface LoginMethodsResponse {
  readonly channels: readonly { readonly key: string; readonly countries: readonly string[] }[];
}

export const loginMethodsQueryKey = ["auth", "methods"] as const;

export function getLoginMethods(): Promise<LoginMethodsResponse> {
  return api.get<LoginMethodsResponse>("/api/auth/methods");
}
