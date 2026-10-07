import { useContext, useEffect, useRef } from "react";
import { useAuth } from "react-oidc-context";
import { useNavigate } from "react-router";
import { SessionStatusPage } from "@/auth/SessionStatusPage";
import { AuthLayout } from "@/layouts/AuthLayout";
import { BusinessAccessResult } from "../components/BusinessAccessResult";
import { PlatformAccessResult } from "../components/PlatformAccessResult";
import { accessOfPath, homeOf, loginPathOf } from "@/tenancy/access";
import { safeReturnUrl } from "../lib/returnUrl";
import { mainSiteUrl, siteOfHost } from "@/tenancy/publicSite";
import { PublicSiteHostContext } from "@/tenancy/usePublicSite";

interface CallbackState { returnTo?: string }

function accessError(error: Error | undefined) {
  if (!error || !("error" in error) || error.error !== "access_denied" ||
    !("error_description" in error) || typeof error.error_description !== "string") return null;

  const [code, encodedName] = error.error_description.split("|", 2);
  if (code === "Tenancy.Access.PlatformOnly") {
    // ErrorResponse.state es el userState recuperado por OIDC. El código del error no contiene la puerta.
    const state = "state" in error ? error.state as CallbackState | undefined : undefined;
    const returnTo = safeReturnUrl(state?.returnTo ?? null, "/");
    return { status: "platformOnly" as const, access: accessOfPath(returnTo.split(/[?#]/u)[0] ?? returnTo) === "business" ? "business" as const : "consumer" as const };
  }
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
  const host = useContext(PublicSiteHostContext) ?? globalThis.location.host;
  const storefront = siteOfHost(host).kind === "storefront";

  useEffect(() => {
    if (!auth.isAuthenticated || navigated.current) return;
    navigated.current = true;
    const state = auth.user?.state as CallbackState | undefined;
    navigate(safeReturnUrl(state?.returnTo ?? null, "/"), { replace: true });
  }, [auth.isAuthenticated, auth.user, navigate]);

  const deniedBusiness = accessError(auth.error);
  if (deniedBusiness?.status === "platformOnly") return <AuthLayout access={deniedBusiness.access}>
    <PlatformAccessResult access={deniedBusiness.access} platformHref={storefront ? mainSiteUrl(homeOf("platform")) : undefined}
      onSignedOut={() => { void navigate(storefront ? "/" : loginPathOf(deniedBusiness.access), { replace: true }); }} />
  </AuthLayout>;
  if (deniedBusiness) return <AuthLayout access="business">
    {deniedBusiness.status === "noBusiness" ? <BusinessAccessResult status="noBusiness" />
      : <BusinessAccessResult status="inactive" organizationName={deniedBusiness.organizationName} />}
  </AuthLayout>;

  // El retorno viene del estado validado por OIDC, nunca de los parámetros del callback.
  const state = auth.error && "state" in auth.error ? auth.error.state as CallbackState | undefined : undefined;
  const returnTo = state ? safeReturnUrl(state.returnTo ?? null, "/") : undefined;
  const retryDoor = loginPathOf(accessOfPath(returnTo?.split(/[?#]/u)[0] ?? "/") ?? "consumer");
  const retryQuery = new URLSearchParams({ prompt: "login", ...(returnTo ? { returnUrl: returnTo } : {}) });

  return auth.error
    ? <SessionStatusPage status="error" loginPath={`${retryDoor}?${retryQuery}`} onRetry={storefront ? () => {
      void auth.signinRedirect({ extraQueryParams: { access: "consumer", prompt: "login" }, state: { returnTo: returnTo ?? "/" } });
    } : undefined} />
    : <SessionStatusPage status="starting" />;
}
