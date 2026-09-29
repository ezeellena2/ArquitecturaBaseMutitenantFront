import { useState } from "react";
import { useAuth } from "react-oidc-context";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import type { AccessKind } from "@/auth/AccessRoute";
import { accessHome } from "./accessHome";
import { clearAccessError } from "@/shared/api/accessErrorStore";

export type SwitchTarget = { access: AccessKind; tenantId?: string };

export function useSwitchAccess() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isSwitching, setIsSwitching] = useState(false);
  const [hasError, setHasError] = useState(false);

  async function switchAccess(target: SwitchTarget): Promise<void> {
    setIsSwitching(true);
    setHasError(false);

    try {
      // Refresh tokens omit extraQueryParams, so switch via authorize in a silent iframe.
      const user = await auth.signinSilent({
        forceIframeAuth: true,
        extraQueryParams: {
          access: target.access,
          ...(target.tenantId ? { tenant: target.tenantId } : {}),
        },
      });
      if (!user) throw new Error("Silent sign-in returned no user");

      queryClient.clear();
      clearAccessError();
      navigate(accessHome(target.access), { replace: true });
    } catch {
      setHasError(true);
    } finally {
      setIsSwitching(false);
    }
  }

  return {
    isSwitching,
    hasError,
    switchAccess,
  };
}
