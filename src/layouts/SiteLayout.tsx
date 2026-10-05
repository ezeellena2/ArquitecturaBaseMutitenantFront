import type { ReactNode } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { BrandMark } from "@/shared/ui/BrandMark";
import { loginPathOf } from "@/tenancy/access";

export function SiteLayout({ children, variant = "landing" }: { children: ReactNode; variant?: "landing" | "legal" }) {
  const { t } = useTranslation("site");

  return <div className={`min-h-screen bg-[var(--lado-activo)] text-[var(--t1)] ${variant === "legal" ? "flex flex-col" : ""}`}>
    {/* Tableros M-Legal y Landing-Movil (.pp.m .lp-nav, .lpm .lp-nav): 60 más la raya de abajo. */}
    <header className="h-[61px] border-b border-[var(--borde)] md:h-[72px]">
      <div className="mx-auto flex h-full max-w-[1280px] items-center gap-0 px-4 md:gap-8 md:px-10">
        <Link to="/" className="inline-flex shrink-0 items-center gap-2.5 text-base font-bold tracking-[-0.01em] text-[var(--t1)] no-underline md:text-lg">
          <BrandMark className="md:size-8 md:rounded-[9px]" />
          {t("brand")}
        </Link>
        {variant === "landing" && <nav aria-label={t("navigation.label")} className="hidden items-center gap-7 text-[15px] font-medium md:flex">
          <a href="#personas" className="text-[var(--t2)] hover:text-[var(--t1)]">{t("navigation.people")}</a>
          <a href="#organizaciones" className="text-[var(--t2)] hover:text-[var(--t1)]">{t("navigation.businesses")}</a>
          <a href="#empezar" className="text-[var(--t2)] hover:text-[var(--t1)]">{t("navigation.getStarted")}</a>
        </nav>}
        {/* M-Legal (.lp-der, .b-sm): en el teléfono, dos botones chicos de 32 a 10 entre sí; «Ingresar» es el principal, con
            el degradé y la sombra de la marca. En la compu, dos enlaces de 40. */}
        <div className="ml-auto flex items-center gap-2.5 text-[13px] font-semibold md:gap-2 md:text-[14px]">
          <Link to={loginPathOf("business")} aria-label={t("navigation.businessLogin")} className="inline-flex h-8 items-center rounded-[8px] border border-transparent px-3 text-[var(--t2)] hover:bg-[var(--s2)] md:h-10 md:rounded-[10px] md:border-0 md:px-[18px]">
            <span className="hidden md:inline">{t("navigation.businessLogin")}</span><span className="md:hidden">{t("navigation.businesses")}</span>
          </Link>
          <Link to="/login" className="inline-flex h-8 items-center rounded-[8px] border border-transparent bg-[linear-gradient(180deg,var(--marca)_0%,var(--marca-h)_100%)] px-3 text-[var(--lado-activo)] shadow-[0_1px_2px_var(--marca-sombra),inset_0_1px_0_var(--brillo)] hover:brightness-105 md:h-10 md:rounded-[10px] md:border-0 md:bg-none md:bg-transparent md:px-[18px] md:text-[var(--t2)] md:shadow-none md:hover:bg-[var(--s2)] md:hover:brightness-100">{t("navigation.login")}</Link>
        </div>
      </div>
    </header>
    <main className={variant === "legal" ? "flex-1" : ""}>{children}</main>
    {/* Tableros Landing y Legal: el pie en 14; en el teléfono de los textos legales (M-Legal, .pp.m .lp-pie), en 13, con 16
        arriba y abajo y renglones de 1,6. */}
    <footer className={`border-t border-[var(--borde)] text-[var(--t3)] ${variant === "legal" ? "py-4 text-[13px] max-md:leading-[1.6] md:py-6 md:text-sm" : "py-7 text-sm"}`}>
      <div className="mx-auto flex max-w-[1280px] flex-col gap-1.5 px-4 md:flex-row md:justify-between md:px-10">
        <span>{t("footer.copyright")}</span>
        <span className="flex items-center gap-4 md:gap-5">
          <Link to="/terminos" className="text-[var(--t2)] hover:underline">{t("footer.terms")}</Link>
          <Link to="/privacidad" className="text-[var(--t2)] hover:underline">{t("footer.privacy")}</Link>
          {variant === "landing" && <span>{t("footer.help")}</span>}
        </span>
      </div>
    </footer>
  </div>;
}
