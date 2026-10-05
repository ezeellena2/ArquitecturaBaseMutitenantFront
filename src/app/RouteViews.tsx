import { useAuth } from "react-oidc-context";
import { Navigate, Outlet } from "react-router";
import { useIsRecoveringSession } from "@/auth/sessionRecoveryStatus";
import { useIsSigningOut } from "@/auth/signOutStatus";
import { SessionStatusPage } from "@/auth/SessionStatusPage";
import { ForbiddenPage } from "@/areas/public/errors/pages/ForbiddenPage";
import { NotFoundPage } from "@/areas/public/errors/pages/NotFoundPage";
import { LandingPage } from "@/areas/public/site/pages/LandingPage";
import { BusinessLayout } from "@/layouts/BusinessLayout";
import { SiteLayout } from "@/layouts/SiteLayout";
import { useCurrentUser } from "@/auth/useCurrentUser";
import { usePermissions } from "@/auth/usePermissions";
import type { AppRoute } from "@/layouts/navigation/types";
import { canOpen } from "@/layouts/navigation/visible";
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

/// Organizaciones es el inicio; un operador sin ese permiso entra a la primera pantalla permitida disponible.
export function PlatformHomeRoute({ availableRoutes, pendingPages }: { availableRoutes: readonly AppRoute[]; pendingPages: boolean }) {
  const { data: me } = useCurrentUser();
  const permissions = usePermissions();
  if (!me) return null;
  const first = availableRoutes.find((route) => canOpen(route, permissions));
  if (!first) return <ForbiddenPage homePath={homeOf("platform")} />;
  // Antes de T21–T23 sólo existe el marco: se conserva su Outlet, sin navegar a una pantalla aún inexistente.
  return pendingPages || first.path === homeOf("platform") ? <Outlet /> : <Navigate to={first.path} replace />;
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
