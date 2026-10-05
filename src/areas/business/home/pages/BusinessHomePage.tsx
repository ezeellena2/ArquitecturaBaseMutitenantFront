import { useQuery } from "@tanstack/react-query";
import { House } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCurrentUser } from "@/auth/useCurrentUser";
import { useFormat } from "@/shared/format/useFormat";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import { Page } from "@/shared/ui/Page";
import { fetchHome, homeQueryKey } from "../api/home";
import { AreaCards, CompanyCards } from "../components/HomeCards";
import { PhoneHome } from "../components/PhoneHome";
import { describePending, type PendingRow } from "../components/pendingItems";
import { ToResolve } from "../components/ToResolve";
import { activeOrganization } from "@/tenancy/access";

/**
 * Inicio de la organización (ADR 0040). La API decide qué ve cada persona: con permisos de la organización, las
 * tarjetas de sus áreas (Inicio-Org); si no, «Tus empresas» (Inicio-Miembro). Debajo, «Para resolver».
 */
export function BusinessHomePage() {
  const { t } = useTranslation(["home", "common"]);
  const format = useFormat();
  const { data: currentUser } = useCurrentUser();
  const phone = useMediaQuery("(max-width: 767px)");
  const home = useQuery({ queryKey: homeQueryKey, queryFn: fetchHome, meta: { blocksView: true } });
  const organizationName = activeOrganization(currentUser)?.name ?? "";
  const rows = (home.data?.pending ?? [])
    .map((item, index) => describePending(item, index, t, format.formatDate))
    .filter((row): row is PendingRow => row !== null);
  const organization = home.data?.organization;

  // Tableros M-Inicio-Org y M-Inicio-Miembro: en el teléfono, los dos inicios son la billetera.
  if (phone && home.data) {
    return <PhoneHome organization={organization ?? null} companies={home.data.companies} rows={rows} organizationName={organizationName}
      firstName={currentUser?.displayName?.trim().split(/\s+/)[0] ?? ""} />;
  }
  return <Page icon={House} title={t("common:home.title")} summary={organizationName}>
    {organization ? <>
      <AreaCards organization={organization} />
      <ToResolve rows={rows} />
    </> : null}
    {home.data && !organization ? <>
      <h2 className="mb-[-6px] mt-1 text-[15px] font-semibold text-[var(--t1)]">{t("home:yourCompanies")}</h2>
      <CompanyCards companies={home.data.companies} />
      {rows.length > 0 ? <ToResolve rows={rows} /> : null}
    </> : null}
  </Page>;
}
