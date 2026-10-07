import { useTranslation } from "react-i18next";
import { SiteLayout } from "@/layouts/SiteLayout";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { FormError } from "@/shared/ui/FormError";
import { PublicPageCard, publicPageBackdropClass } from "@/shared/ui/PublicPageCard";
import { loginPathOf } from "@/tenancy/access";
import { mainSiteUrl } from "@/tenancy/publicSite";
import { usePublicSite } from "@/tenancy/usePublicSite";
import { StorefrontUnavailablePage } from "./StorefrontUnavailablePage";

/** Pagina-Publica y M-Pagina-Publica: la misma tarjeta de la vista previa, con los datos publicados del host. */
export function PublicPage() {
  const { t } = useTranslation("common");
  const site = usePublicSite();
  if (site.isUnavailable) return <StorefrontUnavailablePage />;

  const page = site.data;
  return <SiteLayout variant="storefront" publicSiteName={page?.name}>
    <section className={cn("flex flex-1 flex-col items-center justify-center gap-4 px-6 py-12 max-md:px-4 max-md:py-5", publicPageBackdropClass)}>
      {site.isError ? <div className="flex w-full max-w-[560px] flex-col items-start gap-4">
        <FormError message={apiErrorMessage(site.error, t)} className="w-full" />
        <Button type="button" className="max-md:h-12" onClick={() => { void site.refetch(); }}>{t("actions.retry")}</Button>
      </div> : null}
      {page ? <PublicPageCard page={{
        name: page.name, description: page.description, logoDataUri: page.logoUrl,
        address: page.address, contactPhone: page.phone, contactEmail: page.email, website: page.website,
      }} links signInHref={mainSiteUrl(loginPathOf("consumer"))} />
        : site.isError ? null : <p role="status" className="text-[13px] text-[var(--t2)]">{t("states.loading")}</p>}
    </section>
  </SiteLayout>;
}
