import { useAuth } from "react-oidc-context";
import { Navigate, Outlet, useLocation } from "react-router";
import { useIsRecoveringSession } from "./sessionRecoveryStatus";
import { rememberExpiredSessionNotice } from "./sessionExpiredNotice";
import { SessionStatusPage } from "./SessionStatusPage";

export function ProtectedRoute() {
  const auth = useAuth();
  const location = useLocation();
  const recovering = useIsRecoveringSession();

  if (recovering && !auth.isAuthenticated) return <SessionStatusPage status="starting" />;
  if (auth.isLoading && !auth.user) return null;
  if (!auth.isAuthenticated) {
    if (auth.user?.expired) rememberExpiredSessionNotice();
    const loginPath = location.pathname.startsWith("/org") ? "/login/empresa" : "/login";
    const returnUrl = location.pathname + location.search;
    return <Navigate to={`${loginPath}?${new URLSearchParams({ returnUrl })}`} replace />;
  }

  return <Outlet />;
}
