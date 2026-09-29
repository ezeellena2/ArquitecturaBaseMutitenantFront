import { useQuery } from "@tanstack/react-query";
import { useContext } from "react";
import { AuthContext } from "react-oidc-context";
import { api } from "@/shared/api/httpClient";
import type { MeResponse } from "@/shared/api/types";

export const currentUserQueryKey = ["current-user"] as const;

export function useCurrentUser() {
  // FormatProvider también se renderiza aislado en campos y tests sin sesión.
  const auth = useContext(AuthContext);
  return useQuery({
    queryKey: currentUserQueryKey,
    queryFn: () => api.get<MeResponse>("/api/me"),
    enabled: auth?.isAuthenticated === true,
    staleTime: 5 * 60_000,
  });
}
