import { useTranslation } from "react-i18next";
import { ErrorPageFrame } from "./ErrorPageFrame";
import { SearchIcon } from "./icons";

/// «No encontramos esta página» (tableros Error-Org y M-Error-Org): una ruta que no existe, un módulo apagado o una ficha
/// que el back no encuentra (404, también un id de otra organización o de otro acceso). «Ir al inicio» lleva al inicio
/// del acceso de la sesión (homeOf en tenancy/access.ts).
export function NotFoundPage({ homePath, back, screen }: {
  homePath: string;
  /** En el teléfono, a dónde vuelve ‹ (una ficha, a su lista). */
  back?: { to: string; label: string };
  /** En el teléfono, el nombre de la pantalla en la barra («Usuario»). */
  screen?: string;
}) {
  const { t } = useTranslation("errors");
  return <ErrorPageFrame
    icon={<SearchIcon className="size-5" />}
    title={t("errorPage.notFound.title")}
    homePath={homePath}
    back={back}
    screen={screen}
  />;
}
