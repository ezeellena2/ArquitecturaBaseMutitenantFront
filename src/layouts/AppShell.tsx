import { useEffect, useState, type ReactNode } from "react";
import { NewVersionBanner } from "./components/NewVersionBanner";
import { OfflineBanner } from "./components/OfflineBanner";

interface AppShellProps {
  children: ReactNode;
  onReload?: () => void;
}

/// Armazón transversal de E1. Los estados del acceso y la organización se conectan en E3.
export function AppShell({ children, onReload = () => window.location.reload() }: AppShellProps) {
  const [offline, setOffline] = useState(() => !navigator.onLine);
  const [newVersion, setNewVersion] = useState(false);

  useEffect(() => {
    const onOffline = () => setOffline(true);
    const onOnline = () => setOffline(false);
    const onPreloadError = (event: VitePreloadErrorEvent) => {
      // Vite rechaza un chunk viejo tras un despliegue. Su comportamiento por defecto deja el error sin manejar;
      // el usuario elige cuándo recargar para no perder un formulario abierto.
      event.preventDefault();
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

  return (
    <div className="flex min-h-screen flex-col">
      <div className="sticky top-0 z-50">
        {offline ? <OfflineBanner /> : null}
        {newVersion ? <NewVersionBanner onUpdate={onReload} /> : null}
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
