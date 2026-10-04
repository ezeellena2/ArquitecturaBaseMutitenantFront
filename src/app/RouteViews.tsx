import { useAuth } from "react-oidc-context";
import { Outlet } from "react-router";
import { useIsRecoveringSession } from "@/auth/sessionRecoveryStatus";
import { useIsSigningOut } from "@/auth/signOutStatus";
import { SessionStatusPage } from "@/auth/SessionStatusPage";
import { ForbiddenPage } from "@/areas/public/errors/pages/ForbiddenPage";
import { NotFoundPage } from "@/areas/public/errors/pages/NotFoundPage";
import { LandingPage } from "@/areas/public/site/pages/LandingPage";
import { BusinessLayout } from "@/layouts/BusinessLayout";
import { SiteLayout } from "@/layouts/SiteLayout";
import { useCurrentUser } from "@/auth/useCurrentUser";
import { activeOrganization, homeOf, parseAccess } from "@/tenancy/access";

export function HomeRoute() {
  const auth = useAuth();
  const recovering = useIsRecoveringSession();
  const signingOut = useIsSigningOut();
  if (signingOut) return <SessionStatusPage status="closing" />;
  if ((recovering || auth.isLoading) && !auth.user) return <SessionStatusPage status="starting" />;
  if (!auth.isAuthenticated) return <SiteLayout><LandingPage /></SiteLayout>;
  return <Outlet />;
}

export function ForbiddenRoute() {
  const auth = useAuth();
  const { data: account } = useCurrentUser();
  const access = parseAccess(auth.user?.profile.access) ?? "consumer";
  const claimName = auth.user?.profile.organization_name;
  const organizationName = typeof claimName === "string" ? claimName : activeOrganization(account)?.name;
  const page = <ForbiddenPage organizationName={organizationName} homePath={homeOf(access)} />;
  return access === "business" ? <BusinessLayout>{page}</BusinessLayout>
    : <main className="min-h-dvh bg-[var(--fondo)]">{page}</main>;
}

export function NotFoundRoute() {
  const auth = useAuth();
  const access = parseAccess(auth.user?.profile.access) ?? "consumer";
  const page = <NotFoundPage homePath={homeOf(access)} />;
  return access === "business" ? <BusinessLayout>{page}</BusinessLayout>
    : <main className="min-h-dvh bg-[var(--fondo)]">{page}</main>;
}
