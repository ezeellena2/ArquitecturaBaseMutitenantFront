import { useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "react-oidc-context";
import { Outlet, useLocation } from "react-router";
import { SessionRecoveryContext } from "./sessionRecoveryStatus";
import { recoveryAccess } from "./recoveryAccess";
import { siteOfHost } from "@/tenancy/publicSite";
import { PublicSiteHostContext } from "@/tenancy/usePublicSite";

export function SessionRecovery() {
  const auth = useAuth();
  const location = useLocation();
  const host = useContext(PublicSiteHostContext) ?? globalThis.location.host;
  const [isRecovering, setIsRecovering] = useState(() => !auth.user);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (!isRecovering || hasStarted.current) return;
    hasStarted.current = true;
    const access = recoveryAccess(location.pathname, host);
    void auth.signinSilent({ ...(siteOfHost(host).kind === "storefront" ? { forceIframeAuth: true } : {}), extraQueryParams: { access } })
      .catch(() => undefined)
      .finally(() => setIsRecovering(false));
  }, [auth, host, isRecovering, location.pathname]);

  return <SessionRecoveryContext.Provider value={isRecovering}><Outlet /></SessionRecoveryContext.Provider>;
}
