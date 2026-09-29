import { useEffect, useState, type ReactNode } from "react";
import { Outlet } from "react-router";
import { ForbiddenPage } from "@/areas/public/errors/pages/ForbiddenPage";
import { OrganizationUnavailablePage, type UnavailableCode } from "@/areas/public/errors/pages/OrganizationUnavailablePage";
import { useAccessError } from "@/shared/api/accessErrorStore";
import { AppErrorBoundary } from "./AppErrorBoundary";
import { NewVersionBanner } from "./components/NewVersionBanner";
import { OfflineBanner } from "./components/OfflineBanner";

interface AppShellProps {
  children?: ReactNode;
  onReload?: () => void;
}

/// Armazón transversal de E1. Los estados del acceso y la organización se conectan en E3.
export function AppShell({ children, onReload = () => window.location.reload() }: AppShellProps) {
  const accessError = useAccessError();
  const [offline, setOffline] = useState(() => !navigator.onLine);
  const [newVersion, setNewVersion] = useState(false);

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

  const unavailableCodes: UnavailableCode[] = [
    "Tenancy.Tenant.Suspended", "Tenancy.Tenant.PendingApproval", "Tenancy.Tenant.Closed",
  ];
  const organizationName = accessError?.problem.organizationName;
  const tenantId = accessError?.problem.tenantId;
  const unavailable = accessError && unavailableCodes.includes(accessError.code as UnavailableCode)
    && typeof organizationName === "string" && typeof tenantId === "string";
  const content = unavailable
    ? <OrganizationUnavailablePage code={accessError.code as UnavailableCode} organizationName={organizationName} organizationId={tenantId} />
    : accessError
      ? <main className="min-h-dvh bg-[var(--fondo)]"><ForbiddenPage organizationName={typeof organizationName === "string" ? organizationName : undefined} /></main>
      : children ?? <Outlet />;

  return (
    <div className="flex min-h-screen flex-col">
      <div className="sticky top-0 z-50">
        {offline ? <OfflineBanner /> : null}
        {newVersion ? <NewVersionBanner onUpdate={onReload} /> : null}
      </div>
      <div className="min-h-0 flex-1"><AppErrorBoundary onReload={onReload}>{content}</AppErrorBoundary></div>
    </div>
  );
}
