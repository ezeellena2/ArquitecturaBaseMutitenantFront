import { useTranslation } from "react-i18next";
import { ErrorPageFrame } from "./ErrorPageFrame";
import { AlertCircleIcon } from "./icons";

/// La «Pantalla de error» de «Criterio · Avisos» (M-Error-Org, «No se pudo abrir»): cuando no se puede mostrar nada de
/// la pantalla porque no cargó lo que la arma (la ficha, la configuración, /api/me). Al centro, el ícono de alerta en
/// su círculo, «No pudimos abrir esta pantalla» y «Reintentar», que lo vuelve a pedir. Sin el texto del error: lo que
/// pasó se dice en el título.
export function LoadErrorPage({ onRetry, back, screen, standalone }: {
  onRetry: () => void;
  /** En el teléfono, a dónde vuelve ‹ (una ficha, a su lista). */
  back?: { to: string; label: string };
  /** En el teléfono, el nombre de la pantalla en la barra («Usuario»). */
  screen?: string;
  /** Fuera del marco de la app: toda la pantalla y, en un teléfono, la forma de la app sin barra. */
  standalone?: boolean;
}) {
  const { t } = useTranslation("errors");
  return <ErrorPageFrame
    icon={<AlertCircleIcon className="size-5 text-[var(--peligro)]" />}
    title={t("loadFailed")}
    onRetry={onRetry}
    back={back}
    screen={screen}
    standalone={standalone}
  />;
}
