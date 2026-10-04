import { api } from "@/shared/api/httpClient";
import type { HomeResponse } from "@/shared/api/types";

export const homeQueryKey = ["organization-home"] as const;

/** ADR 0040: tarjetas de las áreas o «Tus empresas», y «Para resolver», en un solo pedido. */
export function fetchHome(): Promise<HomeResponse> {
  return api.get<HomeResponse>("/api/home");
}
