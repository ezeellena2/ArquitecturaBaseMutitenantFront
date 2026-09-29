import { useAuth } from "react-oidc-context";
import { Navigate } from "react-router";
import { useIsRecoveringSession } from "@/auth/sessionRecoveryStatus";
import { SessionStatusPage } from "@/auth/SessionStatusPage";
import { ForbiddenPage } from "@/areas/public/errors/pages/ForbiddenPage";
import { NotFoundPage } from "@/areas/public/errors/pages/NotFoundPage";
import { LandingPage } from "@/areas/public/site/pages/LandingPage";
import { PersonalHomePage } from "@/areas/personal/home/pages/PersonalHomePage";
import { PersonalLayout } from "@/layouts/PersonalLayout";
import { BusinessLayout } from "@/layouts/BusinessLayout";
import { SiteLayout } from "@/layouts/SiteLayout";
import { useCurrentUser } from "@/auth/useCurrentUser";

export function HomeRoute() {
  const auth = useAuth();
  const recovering = useIsRecoveringSession();
  if (recovering || auth.isLoading) return <SessionStatusPage status="starting" />;
  if (!auth.isAuthenticated) return <SiteLayout><LandingPage /></SiteLayout>;
  const access = auth.user?.profile.access;
  if (access === "business") return <Navigate to="/org" replace />;
  if (access === "platform") return <Navigate to="/plataforma" replace />;
  if (access !== "consumer") return <Navigate to="/sin-permiso" replace />;
  return <PersonalLayout><PersonalHomePage /></PersonalLayout>;
}

export function ForbiddenRoute() {
  const auth = useAuth();
  const { data: account } = useCurrentUser();
  const claimName = auth.user?.profile.organization_name;
  const organizationName = typeof claimName === "string" ? claimName
    : account?.organizations.find((item) => item.id === account.activeTenantId)?.name;
  const page = <ForbiddenPage organizationName={organizationName} homePath={auth.user?.profile.access === "business" ? "/org" : "/"} />;
  return auth.user?.profile.access === "business" ? <BusinessLayout>{page}</BusinessLayout>
    : <main className="min-h-dvh bg-[var(--fondo)]">{page}</main>;
}

export function NotFoundRoute() {
  const auth = useAuth();
  const homePath = auth.user?.profile.access === "business" ? "/org" : "/";
  const page = <NotFoundPage homePath={homePath} />;
  return auth.user?.profile.access === "business" ? <BusinessLayout>{page}</BusinessLayout>
    : <main className="min-h-dvh bg-[var(--fondo)]">{page}</main>;
}
