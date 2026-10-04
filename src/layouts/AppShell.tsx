import { useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AuthContext } from "react-oidc-context";
import { Outlet, useLocation } from "react-router";
import { ForbiddenPage } from "@/areas/public/errors/pages/ForbiddenPage";
import { OrganizationUnavailablePage, type UnavailableCode } from "@/areas/public/errors/pages/OrganizationUnavailablePage";
import { clearAccessError, useAccessError } from "@/shared/api/accessErrorStore";
import { AppErrorBoundary } from "./AppErrorBoundary";
import { NewVersionBanner } from "./components/NewVersionBanner";
import { OfflineBanner } from "./components/OfflineBanner";
import { AppNoticesProvider } from "@/shared/ui/app/AppNotices";
import { BusinessLayout } from "./BusinessLayout";
import { useDeletionRequestedDate } from "@/auth/deletionRequestStatus";
import { DeletionRequestedPage } from "@/areas/personal/account/components/DeletionRequestedPage";

interface AppShellProps {
  children?: ReactNode;
  onReload?: () => void;
}

/// Armazón transversal de E1. Los estados del acceso y la organización se conectan en E3.
export function AppShell({ children, onReload = () => window.location.reload() }: AppShellProps) {
  const auth = useContext(AuthContext);
  const accessError = useAccessError();
  const deletionDate = useDeletionRequestedDate();
  const { pathname } = useLocation();
  const previousPathname = useRef(pathname);
  const [offline, setOffline] = useState(() => !navigator.onLine);
  const [newVersion, setNewVersion] = useState(false);
  // Tablero M-Avisos: en el teléfono, la barra de la pantalla reclama los avisos y los pone debajo de ella.
  const [hosts, setHosts] = useState(0);
  const claim = useCallback(() => {
    setHosts((count) => count + 1);
    return () => setHosts((count) => count - 1);
  }, []);

  useEffect(() => {
    if (previousPathname.current !== pathname) {
      previousPathname.current = pathname;
      clearAccessError();
    }
  }, [pathname]);

  useEffect(() => {
    const onOffline = () => setOffline(true);
    const onOnline = () => setOffline(false);
    const onPreloadError = () => {
      // Vite propaga el fallo de precarga; la persona decide cuándo recargar.
      setNewVersion(true);
    };

    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    window.addEventListener("vite:preloadError", onPreloadError);
    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("vite:preloadError", onPreloadError);
    };
  }, []);

  const notices = useMemo(() => ({
    notices: offline || newVersion ? <>
      {offline ? <OfflineBanner /> : null}
      {newVersion ? <NewVersionBanner onUpdate={onReload} /> : null}
    </> : null,
    claim,
  }), [offline, newVersion, onReload, claim]);

  const unavailableCodes: UnavailableCode[] = [
    "Tenancy.Tenant.Suspended", "Tenancy.Tenant.PendingApproval", "Tenancy.Tenant.Closed",
  ];
  const organizationName = accessError?.problem.organizationName;
  const tenantId = accessError?.problem.tenantId;
  const unavailable = accessError && unavailableCodes.includes(accessError.code as UnavailableCode)
    && typeof organizationName === "string" && typeof tenantId === "string";
  const content = deletionDate ? <DeletionRequestedPage date={deletionDate} /> : unavailable
    ? <OrganizationUnavailablePage code={accessError.code as UnavailableCode} organizationName={organizationName} organizationId={tenantId} />
    : accessError && accessError.code !== "Legal.AcceptanceRequired"
      ? auth?.user?.profile.access === "business"
        ? <BusinessLayout><ForbiddenPage organizationName={typeof organizationName === "string" ? organizationName : undefined} /></BusinessLayout>
        : <main className="min-h-dvh bg-[var(--fondo)]"><ForbiddenPage organizationName={typeof organizationName === "string" ? organizationName : undefined} homePath="/" /></main>
      : children ?? <Outlet />;

  return (
    <AppNoticesProvider value={notices}>
      <div className="flex min-h-screen flex-col">
        {hosts === 0 ? <div className="sticky top-0 z-50">{notices.notices}</div> : null}
        <div className="min-h-0 flex-1"><AppErrorBoundary onReload={onReload}>{content}</AppErrorBoundary></div>
      </div>
    </AppNoticesProvider>
  );
}
