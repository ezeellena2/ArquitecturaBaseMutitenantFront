import { useTranslation } from "react-i18next";
import { SiteLayout } from "@/layouts/SiteLayout";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { BanIcon } from "@/shared/ui/icons";
import { publicPageBackdropClass } from "@/shared/ui/PublicPageCard";
import { mainSiteUrl } from "@/tenancy/publicSite";

/** Estado uniforme de Pagina-Publica, incluso ante una ruta o un host desconocidos; no revela el motivo. */
export function StorefrontUnavailablePage() {
  const { t } = useTranslation("storefront");
  return <SiteLayout variant="storefront">
    <section className={cn("flex flex-1 items-center justify-center px-6 py-12 text-[var(--t1)] max-md:px-4 max-md:py-5", publicPageBackdropClass)}>
      <div className="flex w-full max-w-[560px] flex-col items-center gap-4 rounded-[20px] border border-[var(--borde)] bg-[var(--lado-activo)] p-8 text-center shadow-[var(--sombra-tarjeta)] max-md:rounded-[18px] max-md:px-[18px] max-md:pt-6 max-md:pb-5 max-md:shadow-[var(--sombra-tarjeta-movil)]">
        <span aria-hidden="true" className="inline-flex size-14 items-center justify-center rounded-full bg-[var(--s3)] text-[var(--t2)]"><BanIcon className="size-6" /></span>
        <h1 className="m-0 text-[24px] leading-[1.25] font-bold tracking-[-0.02em] max-md:text-[22px]">{t("unavailable.title")}</h1>
        <Button asChild variant="outline" size="lg"><a href={mainSiteUrl()}>{t("unavailable.mainSite")}</a></Button>
      </div>
    </section>
  </SiteLayout>;
}
