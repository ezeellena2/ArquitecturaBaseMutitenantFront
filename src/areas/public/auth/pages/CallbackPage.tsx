import { useEffect, useRef } from "react";
import { useAuth } from "react-oidc-context";
import { useNavigate } from "react-router";
import { SessionStatusPage } from "@/auth/SessionStatusPage";
import { AuthLayout } from "@/layouts/AuthLayout";
import { BusinessAccessResult } from "../components/BusinessAccessResult";
import { safeReturnUrl } from "../lib/returnUrl";

interface CallbackState { returnTo?: string }

function businessError(error: Error | undefined) {
  if (!error || !("error" in error) || error.error !== "access_denied" ||
    !("error_description" in error) || typeof error.error_description !== "string") return null;

  const [code, encodedName] = error.error_description.split("|", 2);
  if (code === "Tenancy.Access.NotMember") return { status: "noBusiness" as const };
  if (code !== "Tenancy.Member.Inactive" || !encodedName) return null;
  try {
    return { status: "inactive" as const, organizationName: decodeURIComponent(encodedName) };
  } catch {
    return null;
  }
}

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

  const deniedBusiness = businessError(auth.error);
  if (deniedBusiness) return <AuthLayout access="business">
    {deniedBusiness.status === "noBusiness" ? <BusinessAccessResult status="noBusiness" />
      : <BusinessAccessResult status="inactive" organizationName={deniedBusiness.organizationName} />}
  </AuthLayout>;

  return auth.error
    ? <SessionStatusPage status="error" />
    : <SessionStatusPage status="starting" />;
}
