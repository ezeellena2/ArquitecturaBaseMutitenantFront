import { useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { AuthContext } from "react-oidc-context";
import { Outlet, useLocation } from "react-router";
import { toast } from "sonner";
import { takeArrivalNotice, type ArrivalNotice } from "@/auth/arrivalNotice";
import { authCallbackPath } from "@/auth/authConfig";
import { ForbiddenPage } from "@/areas/public/errors/pages/ForbiddenPage";
import { OrganizationUnavailablePage } from "@/areas/public/errors/pages/OrganizationUnavailablePage";
import { clearAccessError, useAccessError } from "@/shared/api/accessErrorStore";
import { AppErrorBoundary } from "./AppErrorBoundary";
import { OfflineBanner } from "./components/OfflineBanner";
import { NewVersionProvider, type NewVersion } from "./notifications/newVersion";
import { AppNoticesProvider } from "@/shared/ui/app/AppNotices";
import { nowUtc } from "@/shared/time/serverClock";
import { BusinessLayout } from "./BusinessLayout";
import { useDeletionRequestedDate } from "@/auth/deletionRequestStatus";
import { DeletionRequestedPage } from "@/areas/personal/account/components/DeletionRequestedPage";
import { homeOf, isUnavailableCode, parseAccess } from "@/tenancy/access";

interface AppShellProps {
  children?: ReactNode;
  onReload?: () => void;
}

const reloadPage = () => window.location.reload();

/** El texto de un aviso de llegada se traduce al mostrarse: si la cultura de la cuenta llega después, cambia con ella. */
function ArrivalNoticeText({ notice }: { notice: ArrivalNotice }) {
  const { t } = useTranslation();
  return t(notice);
}

/// Armazón transversal de E1. Los estados del acceso y la organización se conectan en E3.
export function AppShell({ children, onReload = reloadPage }: AppShellProps) {
  const auth = useContext(AuthContext);
  const accessError = useAccessError();
  const deletionDate = useDeletionRequestedDate();
  const { pathname } = useLocation();
  const previousPathname = useRef(pathname);
  const [offline, setOffline] = useState(() => !navigator.onLine);
  const [newVersionAt, setNewVersionAt] = useState<string | null>(null);
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

  // El aviso que la pantalla anterior guardó antes de salir de la app (arrivalNotice) se muestra una sola vez, al llegar
  // a destino. En el callback del ingreso todavía no, porque esa pantalla sigue de largo.
  useEffect(() => {
    if (pathname === authCallbackPath) return;
    const notice = takeArrivalNotice();
    if (notice) toast.success(<ArrivalNoticeText notice={notice} />);
  }, [pathname]);

  useEffect(() => {
    const onOffline = () => setOffline(true);
    const onOnline = () => setOffline(false);
    const onPreloadError = () => {
      // Vite propaga el fallo de precarga. La versión nueva se avisa en la campana, sin franja, y la persona decide
      // cuándo recargar: al abrir el aviso.
      setNewVersionAt((detected) => detected ?? nowUtc());
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

  const notices = useMemo(() => ({ notices: offline ? <OfflineBanner /> : null, claim }), [offline, claim]);
  const newVersion = useMemo<NewVersion | null>(() => newVersionAt ? { detectedAtUtc: newVersionAt, reload: onReload } : null,
    [newVersionAt, onReload]);

  const access = parseAccess(auth?.user?.profile.access) ?? "consumer";
  const code = accessError?.code;
  const organizationName = accessError?.problem.organizationName;
  const tenantId = accessError?.problem.tenantId;
  const content = deletionDate ? <DeletionRequestedPage date={deletionDate} />
    : isUnavailableCode(code) && typeof organizationName === "string" && typeof tenantId === "string"
      ? <OrganizationUnavailablePage code={code} organizationName={organizationName} organizationId={tenantId} />
      : accessError && code !== "Legal.AcceptanceRequired"
        ? access === "business"
          ? <BusinessLayout><ForbiddenPage organizationName={typeof organizationName === "string" ? organizationName : undefined} homePath={homeOf(access)} /></BusinessLayout>
          : <main className="min-h-dvh bg-[var(--fondo)]"><ForbiddenPage organizationName={typeof organizationName === "string" ? organizationName : undefined} homePath={homeOf(access)} /></main>
        : children ?? <Outlet />;

  return (
    <NewVersionProvider value={newVersion}>
      <AppNoticesProvider value={notices}>
        <div className="flex min-h-screen flex-col">
          {hosts === 0 ? <div className="sticky top-0 z-50">{notices.notices}</div> : null}
          <div className="min-h-0 flex-1"><AppErrorBoundary onReload={onReload}>{content}</AppErrorBoundary></div>
        </div>
      </AppNoticesProvider>
    </NewVersionProvider>
  );
}
