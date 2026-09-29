import { useEffect, useRef, useState } from "react";
import { useAuth } from "react-oidc-context";
import { Outlet } from "react-router";
import { SessionRecoveryContext } from "./sessionRecoveryStatus";

export function SessionRecovery() {
  const auth = useAuth();
  const [isRecovering, setIsRecovering] = useState(() => !auth.user);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (!isRecovering || hasStarted.current) return;
    hasStarted.current = true;
    void auth.signinSilent()
      .catch(() => undefined)
      .finally(() => setIsRecovering(false));
  }, [auth, isRecovering]);

  return <SessionRecoveryContext.Provider value={isRecovering}><Outlet /></SessionRecoveryContext.Provider>;
}
