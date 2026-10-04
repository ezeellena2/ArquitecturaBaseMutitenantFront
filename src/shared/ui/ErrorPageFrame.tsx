import { useEffect, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { AppBar } from "./app/AppBar";
import { Button } from "./button";
import { useAppChrome } from "./app/AppChrome";

/// La salida de la pantalla de error: «Ir al inicio» (sin permiso, no encontrada) o «Reintentar» (no se pudo abrir).
type ErrorPageAction =
  | { homePath: string; onHomeClick?: () => void; onRetry?: never }
  | { onRetry: () => void; homePath?: never; onHomeClick?: never };

/// «Ir al inicio» lleva al inicio del acceso de la sesión: quien la usa lo sabe (homeOf en tenancy/access.ts).
/// «Reintentar» vuelve a pedir lo que no cargó; ese aviso aparece después de un pedido que falló y se anuncia.
export function ErrorPageFrame({ icon, title, back, screen, ...action }: {
  icon: ReactNode;
  title: string;
  /** En el teléfono, a dónde vuelve ‹ si no es el del marco (una ficha vuelve a su lista). */
  back?: { to: string; label: string };
  /** En el teléfono, el nombre de la pantalla en la barra si no es el del marco («Usuario»). */
  screen?: string;
} & ErrorPageAction) {
  const { t } = useTranslation(["errors", "common"]);
  const chrome = useAppChrome();
  const { hideActiveSection } = chrome;
  // Tablero M-Error-Org: la barra de abajo no marca ninguna sección mientras se ve el aviso.
  useEffect(() => {
    hideActiveSection?.(true);
    return () => hideActiveSection?.(false);
  }, [hideActiveSection]);
  const retry = action.onRetry;
  const announce = (heading: ReactNode) => retry ? <div role="alert">{heading}</div> : heading;

  // Tablero M-Error-Org: en el teléfono la barra lleva ‹ y el nombre de la pantalla; el aviso va al medio, con el botón
  // redondeado («Ir al inicio», o «Reintentar» como secundario en «No se pudo abrir»), y la barra de abajo sigue.
  if (chrome.phone) {
    const barTitle = screen ?? chrome.title;
    const Title = barTitle ? "h2" : "h1";
    const pill = "mt-2.5 inline-flex h-12 items-center justify-center rounded-full px-[26px] text-[15.5px] font-semibold focus-visible:outline-2 focus-visible:outline-[var(--foco)]";
    return <div className="flex min-h-full flex-col bg-[var(--lado-activo)] text-[var(--t1)]">
      {barTitle ? <AppBar title={barTitle} back={back ?? chrome.parent ?? undefined} subtitle={chrome.subtitle ?? undefined} /> : null}
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
        <span aria-hidden="true" className="inline-flex size-16 items-center justify-center rounded-full bg-[var(--s3)] text-[var(--t2)] [&_svg]:size-7">{icon}</span>
        {announce(<Title className="mt-1.5 text-[22px] font-bold leading-tight tracking-[-0.015em]">{title}</Title>)}
        {retry
          ? <button type="button" onClick={retry} className={`${pill} border border-[var(--borde2)] bg-[var(--lado-activo)] text-[var(--t1)]`}>{t("common:actions.retry")}</button>
          : <Link to={action.homePath} onClick={action.onHomeClick} className={`${pill} bg-[var(--marca)] text-[var(--lado-activo)]`}>{t("errorPage.home")}</Link>}
      </div>
    </div>;
  }

  return <div className="flex min-h-full items-center justify-center px-5 py-12 text-[var(--t1)]">
    <div className="flex w-full max-w-[460px] flex-col items-center gap-4 text-center">
      <span aria-hidden="true" className="inline-flex size-16 items-center justify-center rounded-full bg-[var(--s3)] text-[var(--t2)]">{icon}</span>
      {announce(<h1 className="text-2xl font-bold tracking-[-0.02em]">{title}</h1>)}
      {/* Tablero Error-Org y «Criterio · Botones»: el botón principal de siempre, de 36 y letra de 14; «Reintentar», el
          secundario («Criterio · Avisos», Pantalla de error). */}
      {retry
        ? <Button type="button" variant="outline" onClick={retry}>{t("common:actions.retry")}</Button>
        : <Button asChild><Link to={action.homePath} onClick={action.onHomeClick}>{t("errorPage.home")}</Link></Button>}
    </div>
  </div>;
}
