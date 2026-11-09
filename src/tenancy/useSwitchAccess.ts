import { useState } from "react";
import { useAuth } from "react-oidc-context";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { accessOfPath, homeOf, type Access } from "./access";
import { mainSiteUrl } from "./publicSite";
import { clearAccessError } from "@/shared/api/accessErrorStore";

/// `returnTo`: adónde ir después de entrar, como el link del otro acceso (F7). Solo vale una ruta propia de ese acceso;
/// cualquier otra cosa, un link ajeno incluido, lleva al inicio del acceso.
export type SwitchTarget = { access: Access; tenantId?: string; returnTo?: string };

function belongsTo(path: string, access: Access): boolean {
  return path.startsWith("/") && !path.startsWith("//") && !path.includes("\\") && accessOfPath(path.split(/[?#]/u)[0] ?? path) === access;
}

export function useSwitchAccess({ mainSite = false }: { mainSite?: boolean } = {}) {
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
      const destination = target.returnTo && belongsTo(target.returnTo, target.access) ? target.returnTo : homeOf(target.access);
      if (mainSite) globalThis.location.assign(mainSiteUrl(destination));
      else navigate(destination, { replace: true });
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
