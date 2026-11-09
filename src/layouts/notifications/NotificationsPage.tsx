import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useLocation } from "react-router";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { Page } from "@/shared/ui/Page";
import { NotificationList } from "./NotificationList";
import { isAppPath } from "./paths";
import { useNotifications } from "./useNotifications";

/** Adónde vuelve ‹: la pantalla desde la que se tocó la campana; si no se sabe, el Inicio. */
function returnPath(state: unknown): string | null {
  const from = typeof state === "object" && state !== null && "from" in state ? state.from : null;
  return typeof from === "string" && isAppPath(from) ? from : null;
}

/**
 * Tableros M-Campana, M-Campana-Plat y M-Campana-Personal: en el teléfono, la campana lleva a «Avisos», con ‹ y el nombre
 * del perfil debajo del título («Grupo Delta», «Plataforma», «Personal»). Se vuelve a leer al entrar. En la compu no
 * existe: la campana abre su lista en la barra de arriba, así que vuelve al Inicio, como «Más».
 */
export function NotificationsPage() {
  const { t } = useTranslation("notifications");
  const chrome = useAppChrome();
  const location = useLocation();
  const notifications = useNotifications({ refetchOnMount: "always" });
  const { hideActiveSection } = chrome;
  // M-Campana-Personal: «Avisos» no es una sección de la barra de abajo, y ninguna queda marcada.
  useEffect(() => {
    hideActiveSection?.(true);
    return () => hideActiveSection?.(false);
  }, [hideActiveSection]);

  const home = chrome.homePath ?? "/";
  if (!chrome.phone) return <Navigate to={home} replace />;
  return <Page title={t("title")} backTo={{ to: returnPath(location.state) ?? home, label: t("back") }} phoneBody="flush">
    <NotificationList variant="page" notifications={notifications} />
  </Page>;
}
