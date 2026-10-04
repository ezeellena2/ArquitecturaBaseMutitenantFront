import { useQuery } from "@tanstack/react-query";
import { useContext } from "react";
import { AuthContext } from "react-oidc-context";
import { api } from "@/shared/api/httpClient";
import type { MeResponse } from "@/shared/api/types";

export const currentUserQueryKey = ["current-user"] as const;
export const fetchCurrentUser = () => api.get<MeResponse>("/api/me");

export function useCurrentUser() {
  // FormatProvider también se renderiza aislado en campos y tests sin sesión.
  const auth = useContext(AuthContext);
  return useQuery({
    queryKey: currentUserQueryKey,
    queryFn: fetchCurrentUser,
    enabled: auth?.isAuthenticated === true,
    staleTime: 5 * 60_000,
    // La sesión entera depende de /api/me: su 403 reemplaza la pantalla, como el de la consulta principal.
    meta: { blocksView: true },
  });
}
