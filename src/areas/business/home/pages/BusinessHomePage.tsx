import { useQuery } from "@tanstack/react-query";
import { HomeIcon } from "@/shared/ui/icons";
import { useTranslation } from "react-i18next";
import { useCurrentUser } from "@/auth/useCurrentUser";
import { useFormat } from "@/shared/format/useFormat";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import { Page } from "@/shared/ui/Page";
import { ModuleHome } from "@/shared/modules/ModuleRegistry";
import { fetchHome, homeQueryKey } from "../api/home";
import { AreaCards, CompanyCards } from "../components/HomeCards";
import { PhoneHome } from "../components/PhoneHome";
import { describePendingGroups } from "../components/pendingItems";
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
  const home = useQuery({ queryKey: homeQueryKey, queryFn: ({ signal }) => fetchHome(signal), meta: { blocksView: true } });
  const organizationName = activeOrganization(currentUser)?.name ?? "";
  const groups = describePendingGroups(home.data, t, format.formatDate);
  const organization = home.data?.organization;

  // Tableros M-Inicio-Org y M-Inicio-Miembro: en el teléfono, los dos inicios son la billetera.
  if (phone && home.data) {
    return <PhoneHome organization={organization ?? null} companies={home.data.companies} groups={groups} organizationName={organizationName}
      firstName={currentUser?.displayName?.trim().split(/\s+/)[0] ?? ""} />;
  }
  // Tableros Inicio-Org e Inicio-Miembro (.ini): los bloques del inicio van a 20 uno del otro.
  const content = <>
    {organization ? <div className="flex flex-col gap-5">
      <AreaCards organization={organization} />
      <ToResolve groups={groups} />
    </div> : null}
    {home.data && !organization ? <div className="flex flex-col gap-5">
      <h2 className="mb-[-6px] mt-1 text-[15px] font-semibold text-[var(--t1)]">{t("home:yourCompanies")}</h2>
      <CompanyCards companies={home.data.companies} />
      {groups.length > 0 ? <ToResolve groups={groups} /> : null}
    </div> : null}
  </>;
  const original = <Page icon={HomeIcon} title={t("common:home.title")} summary={organizationName}>{content}</Page>;
  const moduleContent = organization ? <div className="flex flex-col gap-5"><ToResolve groups={groups} /><AreaCards organization={organization} /></div> : content;
  return phone ? original : <ModuleHome access="business" fallback={original}>{moduleContent}</ModuleHome>;
}
