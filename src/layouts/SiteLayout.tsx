import type { ReactNode } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";

export function SiteLayout({ children, variant = "landing" }: { children: ReactNode; variant?: "landing" | "legal" }) {
  const { t } = useTranslation("site");

  return <div className={`min-h-screen bg-[var(--lado-activo)] text-[var(--t1)] ${variant === "legal" ? "flex flex-col" : ""}`}>
    <header className="h-[60px] border-b border-[var(--borde)] md:h-[72px]">
      <div className="mx-auto flex h-full max-w-[1280px] items-center gap-0 px-4 md:gap-8 md:px-10">
        <Link to="/" className="inline-flex shrink-0 items-center gap-2.5 text-base font-bold tracking-tight text-[var(--t1)] no-underline md:text-lg">
          <span aria-hidden="true" className="relative flex size-7 shrink-0 items-center justify-center rounded-[8px] bg-gradient-to-br from-[var(--marca)] to-[var(--marca-2)] shadow-[var(--shadow-card)] md:size-8 md:rounded-[9px]">
            <svg className="size-5 text-[var(--lado-activo)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
          </span>
          {t("brand")}
        </Link>
        {variant === "landing" && <nav aria-label={t("navigation.label")} className="hidden items-center gap-7 text-[15px] font-medium md:flex">
          <a href="#personas" className="text-[var(--t2)] hover:text-[var(--t1)]">{t("navigation.people")}</a>
          <a href="#organizaciones" className="text-[var(--t2)] hover:text-[var(--t1)]">{t("navigation.businesses")}</a>
          <a href="#empezar" className="text-[var(--t2)] hover:text-[var(--t1)]">{t("navigation.getStarted")}</a>
        </nav>}
        <div className="ml-auto flex items-center gap-1 text-[13px] font-semibold md:gap-2 md:text-[14px]">
          <Link to="/login/empresa" aria-label={t("navigation.businessLogin")} className="inline-flex h-9 items-center rounded-[8px] px-2 text-[var(--t2)] hover:bg-[var(--s2)] md:h-10 md:rounded-[10px] md:px-[18px]">
            <span className="hidden md:inline">{t("navigation.businessLogin")}</span><span className="md:hidden">{t("navigation.businesses")}</span>
          </Link>
          <Link to="/login" className="inline-flex h-9 items-center rounded-[8px] bg-[var(--marca)] px-3 text-[var(--lado-activo)] hover:bg-[var(--marca-h)] md:h-10 md:rounded-[10px] md:bg-transparent md:px-[18px] md:text-[var(--t2)] md:hover:bg-[var(--s2)]">{t("navigation.login")}</Link>
        </div>
      </div>
    </header>
    <main className={variant === "legal" ? "flex-1" : ""}>{children}</main>
    <footer className={`border-t border-[var(--borde)] text-sm text-[var(--t3)] ${variant === "legal" ? "py-5 md:py-6" : "py-7"}`}>
      <div className="mx-auto flex max-w-[1280px] flex-col gap-1.5 px-4 md:flex-row md:justify-between md:px-10">
        <span>{t("footer.copyright")}</span>
        <span className="flex items-center gap-5">
          <Link to="/terminos" className="text-[var(--t2)] hover:underline">{t("footer.terms")}</Link>
          <Link to="/privacidad" className="text-[var(--t2)] hover:underline">{t("footer.privacy")}</Link>
          {variant === "landing" && <span>{t("footer.help")}</span>}
        </span>
      </div>
    </footer>
  </div>;
}
