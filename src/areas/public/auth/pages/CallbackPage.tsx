import { useEffect, useRef } from "react";
import { useAuth } from "react-oidc-context";
import { useNavigate } from "react-router";
import { SessionStatusPage } from "@/auth/SessionStatusPage";
import { safeReturnUrl } from "../lib/returnUrl";

interface CallbackState { returnTo?: string }

export function CallbackPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const navigated = useRef(false);

  useEffect(() => {
    if (!auth.isAuthenticated || navigated.current) return;
    navigated.current = true;
    const state = auth.user?.state as CallbackState | undefined;
    navigate(safeReturnUrl(state?.returnTo ?? null, "/"), { replace: true });
  }, [auth.isAuthenticated, auth.user, navigate]);

  return auth.error
    ? <SessionStatusPage status="error" />
    : <SessionStatusPage status="starting" />;
}
