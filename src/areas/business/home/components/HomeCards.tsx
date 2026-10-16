import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import type { HomeCompanyCard, HomeOrganizationSummary } from "@/shared/api/types";
import { publicPageStateTones } from "@/shared/format/statusTones";
import { useFormat } from "@/shared/format/useFormat";
import { countOf } from "@/shared/format/countOf";
import { initials } from "@/shared/lib/initials";
import { StatusBadge } from "@/shared/ui/format/StatusBadge";
import { companyDetail } from "./companyDetail";
import { areaIcons, areaPaths, type HomeArea } from "./pendingItems";
import type { ModuleHomeCard } from "@/shared/modules/types";

/** La tarjeta de un módulo que mandó el back (`moduleCards`, CC08) con su total. */
export interface ModuleCardRow { card: ModuleHomeCard; total: number }

function Card({ to, icon, title, detail }: { to: string; icon: ReactNode; title: string; detail: ReactNode }) {
  return <Link to={to} style={{ boxShadow: "var(--shadow-card)" }}
    className="flex min-w-0 items-center gap-3 rounded-[14px] border border-[var(--borde)] bg-[var(--lado-activo)] p-4 text-[var(--t1)] hover:border-[var(--borde2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foco)]">
    <span aria-hidden="true" className="inline-flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--marca-t)] text-[12.5px] font-bold text-[var(--marca-tx)]">{icon}</span>
    <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
      <span className="text-[14px] font-semibold">{title}</span>
      <span className="truncate text-[12.5px] text-[var(--t3)]">{detail}</span>
    </span>
    <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-[var(--t3)]" />
  </Link>;
}

const grid = "grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4";

/** Tablero Inicio-Org: una tarjeta por área que la API devolvió, cada una con su dato real. */
export function AreaCards({ organization, moduleCards = [] }: { organization: HomeOrganizationSummary; moduleCards?: readonly ModuleCardRow[] }) {
  const { t } = useTranslation("home");
  const format = useFormat();
  const details: [HomeArea, ReactNode][] = [];
  if (organization.users) details.push(["users", t("cards.users.count", countOf(format, organization.users.total))]);
  if (organization.roles) details.push(["roles", t("cards.roles.count", countOf(format, organization.roles.total))]);
  if (organization.companies) details.push(["companies", t("cards.companies.count", countOf(format, organization.companies.total))]);
  if (organization.publicPage) {
    details.push(["publicPage", <StatusBadge key="page" tones={publicPageStateTones} value={organization.publicPage.state} />]);
  }
  if (organization.settings) details.push(["settings", organization.settings.domain ?? t("cards.settings.noDomain")]);
  if (organization.audit) {
    const last = organization.audit.lastChangeAtUtc;
    details.push(["audit", last ? t("cards.audit.lastChange", { when: format.formatCalendar(last) }) : t("cards.audit.noChanges")]);
  }
  return <nav aria-label={t("areas")} className={grid}>
    {details.map(([area, detail]) => {
      const Icon = areaIcons[area];
      return <Card key={area} to={areaPaths[area]} icon={<Icon className="size-[18px]" />} title={t(`cards.${area}.title`)} detail={detail} />;
    })}
    {/* Inicio-Org: después de las del núcleo, las de los módulos («WhatsApp · 2 números»). */}
    {moduleCards.map(({ card, total }) => <Card key={card.key} to={card.to} icon={<card.icon className="size-[18px]" />} title={t(card.titleKey)}
      detail={t(card.detailKey, { count: total })} />)}
  </nav>;
}

/** Tablero Inicio-Miembro: las empresas donde la persona tiene roles. */
export function CompanyCards({ companies }: { companies: readonly HomeCompanyCard[] }) {
  const { t } = useTranslation("home");
  const format = useFormat();
  return <div className={grid}>
    {companies.map((company) => <Card key={company.companyId} to={`/org/empresas/${company.companyId}`} icon={initials(company.name)}
      title={company.name} detail={companyDetail(company, t, format)} />)}
  </div>;
}
