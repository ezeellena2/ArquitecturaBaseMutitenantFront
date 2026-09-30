import { useEffect, useRef, useState } from "react";
import { useAuth } from "react-oidc-context";
import { Outlet, useLocation } from "react-router";
import { SessionRecoveryContext } from "./sessionRecoveryStatus";

export function SessionRecovery() {
  const auth = useAuth();
  const location = useLocation();
  const [isRecovering, setIsRecovering] = useState(() => !auth.user);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (!isRecovering || hasStarted.current) return;
    hasStarted.current = true;
    const access = location.pathname === "/org" || location.pathname.startsWith("/org/")
      ? "business"
      : location.pathname === "/plataforma" || location.pathname.startsWith("/plataforma/")
        ? "platform"
        : "consumer";
    void auth.signinSilent({ extraQueryParams: { access } })
      .catch(() => undefined)
      .finally(() => setIsRecovering(false));
  }, [auth, isRecovering, location.pathname]);

  return <SessionRecoveryContext.Provider value={isRecovering}><Outlet /></SessionRecoveryContext.Provider>;
}
