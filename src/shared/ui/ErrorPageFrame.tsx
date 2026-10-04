import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { AppBar } from "./app/AppBar";
import { useAppChrome } from "./app/AppChrome";

export function ErrorPageFrame({ icon, title, homePath = "/org", onHomeClick }: {
  icon: ReactNode;
  title: string;
  homePath?: string;
  onHomeClick?: () => void;
}) {
  const { t } = useTranslation("errors");
  const chrome = useAppChrome();

  // Tablero M-Error-Org: en el teléfono la barra lleva ‹ y el nombre de la pantalla; el aviso va al medio, con
  // «Ir al inicio» redondeado, y la barra de abajo sigue.
  if (chrome.phone) {
    const Title = chrome.title ? "h2" : "h1";
    return <div className="flex min-h-full flex-col bg-[var(--lado-activo)] text-[var(--t1)]">
      {chrome.title ? <AppBar title={chrome.title} back={chrome.parent ?? undefined} subtitle={chrome.subtitle ?? undefined} /> : null}
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
        <span aria-hidden="true" className="inline-flex size-16 items-center justify-center rounded-full bg-[var(--s3)] text-[var(--t2)] [&_svg]:size-7">{icon}</span>
        <Title className="mt-1.5 text-[22px] font-bold leading-tight tracking-[-0.015em]">{title}</Title>
        <Link to={homePath} onClick={onHomeClick} className="mt-2.5 inline-flex h-12 items-center justify-center rounded-full bg-[var(--marca)] px-[26px] text-[15.5px] font-semibold text-[var(--lado-activo)] focus-visible:outline-2 focus-visible:outline-[var(--foco)]">
          {t("errorPage.home")}
        </Link>
      </div>
    </div>;
  }

  return <div className="flex min-h-full items-center justify-center px-5 py-12 text-[var(--t1)]">
    <div className="flex w-full max-w-[460px] flex-col items-center gap-4 text-center">
      <span aria-hidden="true" className="inline-flex size-16 items-center justify-center rounded-full bg-[var(--s3)] text-[var(--t2)]">{icon}</span>
      <h1 className="text-2xl font-bold tracking-[-0.02em]">{title}</h1>
      <Link to={homePath} onClick={onHomeClick} className="inline-flex min-h-11 items-center justify-center rounded-[10px] bg-[var(--marca)] px-[14px] text-[13px] font-semibold text-[var(--lado-activo)] hover:bg-[var(--marca-h)] focus-visible:outline-2 focus-visible:outline-[var(--foco)] md:min-h-[35px]">
        {t("errorPage.home")}
      </Link>
    </div>
  </div>;
}
