import type { ReactNode } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";

export function SiteLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation("site");

  return <div className="min-h-screen bg-[var(--lado-activo)] text-[var(--t1)]">
    <header className="h-[60px] border-b border-[var(--borde)] md:h-[72px]">
      <div className="mx-auto flex h-full max-w-[1200px] items-center gap-8 px-4 md:px-10">
        <Link to="/" className="inline-flex shrink-0 items-center gap-2.5 text-base font-bold tracking-tight text-[var(--t1)] no-underline md:text-lg">
          <span aria-hidden="true" className="size-8 rounded-[9px] bg-gradient-to-br from-[var(--marca)] to-[var(--marca-2)]" />
          {t("brand")}
        </Link>
        <nav aria-label={t("navigation.label")} className="hidden items-center gap-7 text-[15px] font-medium md:flex">
          <a href="#personas" className="text-[var(--t2)] hover:text-[var(--t1)]">{t("navigation.people")}</a>
          <a href="#organizaciones" className="text-[var(--t2)] hover:text-[var(--t1)]">{t("navigation.businesses")}</a>
          <a href="#empezar" className="text-[var(--t2)] hover:text-[var(--t1)]">{t("navigation.getStarted")}</a>
        </nav>
        <div className="ml-auto flex items-center gap-2 text-[15px] font-semibold">
          <Link to="/login/empresa" aria-label={t("navigation.businessLogin")} className="inline-flex h-9 items-center rounded-[10px] px-3 text-[var(--t2)] hover:bg-[var(--s2)] md:h-10 md:px-[18px]">
            <span className="hidden md:inline">{t("navigation.businessLogin")}</span><span className="md:hidden">{t("navigation.businesses")}</span>
          </Link>
          <Link to="/login" className="inline-flex h-9 items-center rounded-[10px] px-3 text-[var(--t2)] hover:bg-[var(--s2)] md:h-10 md:px-[18px]">{t("navigation.login")}</Link>
        </div>
      </div>
    </header>
    <main>{children}</main>
    <footer className="border-t border-[var(--borde)] py-7 text-sm text-[var(--t3)]">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-2 px-4 md:flex-row md:justify-between md:px-10">
        <span>{t("footer.copyright")}</span>
        <span className="flex items-center gap-5">
          <Link to="/terminos" className="text-[var(--t2)] hover:underline">{t("footer.terms")}</Link>
          <Link to="/privacidad" className="text-[var(--t2)] hover:underline">{t("footer.privacy")}</Link>
          <span>{t("footer.help")}</span>
        </span>
      </div>
    </footer>
  </div>;
}
