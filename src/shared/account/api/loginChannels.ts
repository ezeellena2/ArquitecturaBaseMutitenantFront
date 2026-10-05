import { api } from "@/shared/api/httpClient";
import type { LoginMethodsResponse } from "@/shared/api/types";

/// Los canales con los que se puede entrar (`GET /api/auth/methods`): el núcleo trae el correo; Google, si está
/// configurado, y el módulo de WhatsApp suma «whatsapp». Los usan el ingreso y Mi cuenta.
export const loginMethodsQueryKey = ["auth", "methods"] as const;

export function getLoginMethods(): Promise<LoginMethodsResponse> {
  return api.get<LoginMethodsResponse>("/api/auth/methods");
}
