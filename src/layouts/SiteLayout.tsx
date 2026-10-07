import { useRef, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { BrandMark } from "@/shared/ui/BrandMark";
import { MenuIcon } from "@/shared/ui/icons";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/shared/ui/Sheet";
import { cn } from "@/shared/lib/utils";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import { loginPathOf } from "@/tenancy/access";
import { mainSiteUrl } from "@/tenancy/publicSite";
import { PublicAccessMenu } from "@/tenancy/PublicAccessMenu";

export type SiteVariant = "landing" | "directory" | "storefront" | "legal";

interface SiteLayoutProps {
  children: ReactNode;
  variant?: SiteVariant;
  /** Solo el nombre público ya cargado: el marco no consulta ni deduce una organización de la sesión. */
  publicSiteName?: string | null;
}

function SectionLinks({ directory, onNavigate, mobile = false }: { directory: boolean; onNavigate?: () => void; mobile?: boolean }) {
  const { t } = useTranslation("site");
  const sections = [
    { key: "navigation.people", href: directory ? "/#personas" : "#personas", current: false },
    { key: "navigation.getStarted", href: directory ? "/#empezar" : "#empezar", current: false },
    { key: "navigation.businesses", href: directory ? "/empresas" : "#empresas", current: directory },
  ];
  return sections.map((section) => <a key={section.key} href={section.href} aria-current={section.current ? "page" : undefined} onClick={onNavigate}
    className={cn(mobile
      ? "flex min-h-[52px] items-center border-t border-[var(--borde)] px-5 text-[16px] font-medium text-[var(--t1)] no-underline"
      : "text-[var(--t2)] no-underline hover:text-[var(--t1)]",
    section.current ? "font-semibold text-[var(--marca-tx)]" : "", mobile && section.current ? "bg-[var(--marca-t)]" : "")}>
    {t(section.key)}
  </a>);
}

/** Landing-Movil y M-Directorio: desplegable web bajo el encabezado, sin velo ni barra inferior. */
function MobileSiteMenu({ directory }: { directory: boolean }) {
  const { t } = useTranslation("site");
  const [open, setOpen] = useState(false);
  const [top, setTop] = useState(61);
  const trigger = useRef<HTMLButtonElement>(null);

  function changeOpen(value: boolean) {
    if (value) {
      const header = trigger.current?.closest("header");
      setTop((header?.getBoundingClientRect().bottom || 61) + globalThis.scrollY);
    }
    setOpen(value);
  }

  return <Sheet open={open} onOpenChange={changeOpen} modal={false}>
    <SheetTrigger asChild>
      <button ref={trigger} type="button" aria-label={t("navigation.openMenu")}
        className="-mr-2 inline-flex size-10 items-center justify-center rounded-[10px] border-0 bg-transparent text-[var(--t1)] hover:bg-[var(--s3)] data-[state=open]:bg-[var(--s3)] focus-visible:outline-2 focus-visible:outline-[var(--foco)]">
        <MenuIcon strokeWidth={2} className="size-[22px]" />
      </button>
    </SheetTrigger>
    {/* Sheet no modal comparte Escape y el regreso de foco. El override copia .m-menu, que nace a 60 + su raya. */}
    <SheetContent showCloseButton={false} aria-describedby={undefined} style={{ top }}
      onInteractOutside={() => setOpen(false)}
      className="absolute bottom-auto left-0 max-h-[calc(100dvh-61px)] max-w-none rounded-none border-b border-[var(--borde)] shadow-[var(--sombra-menu)] data-[state=open]:animate-none data-[state=closed]:animate-none [&_[data-slot=dialog-handle]]:hidden">
      <SheetTitle className="sr-only">{t("navigation.label")}</SheetTitle>
      <nav aria-label={t("navigation.label")} className="flex flex-col">
        <SectionLinks directory={directory} mobile onNavigate={() => setOpen(false)} />
        <Link to={loginPathOf("business")} onClick={() => setOpen(false)}
          className="flex min-h-[52px] items-center border-t border-[var(--borde)] px-5 text-[16px] font-semibold text-[var(--marca-tx)] no-underline">
          {t("navigation.businessLogin")}
        </Link>
      </nav>
    </SheetContent>
  </Sheet>;
}

export function SiteLayout({ children, variant = "landing", publicSiteName = null }: SiteLayoutProps) {
  const { t } = useTranslation(["site", "storefront"]);
  const phone = useMediaQuery("(max-width: 767px)");
  const legal = variant === "legal";
  const storefront = variant === "storefront";
  const directory = variant === "directory";
  const loginClass = "inline-flex h-8 items-center rounded-[8px] border border-transparent bg-[linear-gradient(180deg,var(--marca)_0%,var(--marca-h)_100%)] px-3 text-[var(--lado-activo)] shadow-[0_1px_2px_var(--marca-sombra),inset_0_1px_0_var(--brillo)] hover:brightness-105 md:h-9 md:bg-none md:bg-transparent md:px-3.5 md:text-[var(--t2)] md:shadow-none md:hover:bg-[var(--s2)] md:hover:brightness-100";

  return <div className={cn("min-h-screen bg-[var(--lado-activo)] text-[var(--t1)]", variant !== "landing" ? "flex flex-col" : "", storefront || directory ? "min-h-dvh" : "")}>
    {storefront ? <header className="h-[53px] shrink-0 border-b border-[var(--borde)] md:h-[65px]">
      <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between gap-4 px-4 md:px-10">
        <a href={mainSiteUrl()} className="inline-flex shrink-0 items-center gap-2 text-[14px] font-semibold text-[var(--t2)] no-underline hover:text-[var(--t1)]">
          <BrandMark className="max-md:size-6 max-md:rounded-[7px] md:size-[22px] md:rounded-[6px]" />
          {t("brand")}
        </a>
        <PublicAccessMenu />
      </div>
    </header> : <header className="h-[61px] shrink-0 border-b border-[var(--borde)] md:h-[73px]">
      <div className="mx-auto flex h-full max-w-[1280px] items-center gap-0 px-4 md:gap-8 md:px-10">
        <Link to="/" className="inline-flex shrink-0 items-center gap-2.5 text-base font-bold tracking-[-0.01em] text-[var(--t1)] no-underline md:text-lg">
          <BrandMark />
          {t("brand")}
        </Link>
        {!legal && !phone ? <nav aria-label={t("navigation.label")} className="flex items-center gap-7 text-[15px] font-medium">
          <SectionLinks directory={directory} />
        </nav> : null}
        {/* Portada/directorio conservan estas puertas aunque haya sesión (decisión 8); legales conserva su marco. */}
        <div className="ml-auto flex items-center gap-2.5 text-[13px] font-semibold md:text-[14px]">
          {legal || !phone ? <Link to={loginPathOf("business")} aria-label={t("navigation.businessLogin")} className="inline-flex h-8 items-center rounded-[8px] border border-transparent px-3 text-[var(--t2)] hover:bg-[var(--s2)] md:h-9 md:px-3.5">
            <span className="hidden md:inline">{t("navigation.businessLogin")}</span><span className="md:hidden">{t("navigation.businesses")}</span>
          </Link> : null}
          <Link to="/login" className={cn(loginClass, !legal && phone ? "h-9" : "")}>{t("navigation.login")}</Link>
          {!legal && phone ? <MobileSiteMenu directory={directory} /> : null}
        </div>
      </div>
    </header>}
    <main className={cn(variant !== "landing" ? "flex-1" : "", storefront ? "flex min-h-0 flex-col" : "", directory ? "bg-[var(--fondo)]" : "")}>{children}</main>
    <footer className={cn("border-t border-[var(--borde)] text-[var(--t3)]",
      legal ? "py-4 text-[13px] max-md:leading-[1.6] md:py-6 md:text-sm"
        : storefront || directory ? "shrink-0 py-4 text-[13px] md:py-[22px] md:text-sm" : "py-7 text-sm")}>
      <div className={cn("mx-auto flex max-w-[1280px] flex-col px-4 md:flex-row md:justify-between md:px-10", variant === "landing" ? "gap-2" : "gap-1.5")}>
        <span>{storefront && publicSiteName ? t("storefront:footer.organization", { name: publicSiteName }) : t("footer.copyright")}</span>
        <span className="flex items-center gap-4 md:gap-5">
          {storefront ? <>
            <a href={mainSiteUrl("/terminos")} className="text-[var(--t2)] hover:underline">{t("footer.terms")}</a>
            <a href={mainSiteUrl("/privacidad")} className="text-[var(--t2)] hover:underline">{t("footer.privacy")}</a>
          </> : <>
            <Link to="/terminos" className="text-[var(--t2)] hover:underline">{t("footer.terms")}</Link>
            <Link to="/privacidad" className="text-[var(--t2)] hover:underline">{t("footer.privacy")}</Link>
          </>}
          {variant === "landing" ? <a href="#ayuda" className="text-[var(--t2)] hover:underline">{t("footer.help")}</a> : null}
        </span>
      </div>
    </footer>
  </div>;
}
