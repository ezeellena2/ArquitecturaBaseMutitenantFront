import { ArrowRight, ChevronRight } from "lucide-react";
import { useId } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import type { HomeCompanyCard, HomeOrganizationSummary } from "@/shared/api/types";
import { initials } from "@/shared/lib/initials";
import { validationConstraints } from "@/shared/api/generated/validation";
import { NumberText } from "@/shared/ui/format/NumberText";
import { companyDetail } from "./companyDetail";
import { areaIcons, areaPaths, pendingTotal, type HomeArea, type PendingRow, type PendingRowGroup } from "./pendingItems";
import type { ModuleCardRow } from "./HomeCards";

const areas: readonly HomeArea[] = ["users", "roles", "companies", "publicPage", "settings", "audit"];

const toneCircle = { danger: "bg-[var(--peligro-t)] text-[var(--peligro)]", warning: "bg-[var(--alerta-t)] text-[var(--alerta)]" } as const;
const toneText = { danger: "text-[var(--peligro)]", warning: "text-[var(--alerta)]" } as const;
const tone = (row: PendingRow) => (row.tone === "danger" ? "danger" : "warning");

// Las filas de la billetera (.c-p): 10 arriba y abajo, 20 a la izquierda y 16 a la derecha, con el ícono de 40 y una
// línea fina entre filas que arranca en el texto (72).
const rowClass = "relative flex items-center gap-3 py-2.5 pl-5 pr-4";
const rowLine = "before:absolute before:left-[72px] before:right-0 before:top-0 before:h-px before:bg-[var(--borde)] before:content-[''] first:before:hidden";
const titleRow = "flex items-baseline gap-2 px-5 pb-1 pt-4";
const titleClass = "text-[18px] leading-[normal] font-bold tracking-[-0.01em] text-[var(--t1)]";

/**
 * Tableros M-Inicio-Org y M-Inicio-Miembro (C, app): cabecera de color con el saludo y la organización. Con permisos
 * de la organización, atajos redondos con el globito de sus pendientes y «Para resolver» en filas con ícono redondo del
 * color de la urgencia y botón cápsula. Con roles solo en empresas, «Tus empresas» en filas y, si administra alguna, su
 * «Para resolver». No es la compu achicada.
 */
export function PhoneHome({ organization, moduleCards = [], companies, groups, firstName, organizationName }: {
  organization: HomeOrganizationSummary | null;
  /** Los atajos de los módulos (M-Inicio-Org: «WhatsApp»), después de los del núcleo. */
  moduleCards?: readonly ModuleCardRow[];
  companies: readonly HomeCompanyCard[];
  groups: readonly PendingRowGroup[];
  firstName: string;
  organizationName: string;
}) {
  const { t } = useTranslation("home");

  return <div className="flex min-h-full flex-col">
    {/* .c-top y .c-hola: 10 arriba y 46 abajo (la tarjeta blanca sube 26 sobre ellos), el saludo con la altura normal de
        su letra y el nombre con interlineado 1,15. */}
    <div className="bg-[linear-gradient(160deg,var(--marca),var(--marca-tx))] px-5 pt-2.5 pb-[46px] text-[var(--primary-foreground)]">
      <span className="block text-[15px] leading-[normal] opacity-80">{firstName ? t("greeting", { name: firstName }) : t("greetingUnnamed")}</span>
      <h1 className="mt-0.5 text-[28px] leading-[1.15] font-bold tracking-[-0.02em]">{organizationName}</h1>
    </div>
    <div className="relative z-[1] -mt-[26px] flex flex-1 flex-col overflow-hidden rounded-t-[24px] bg-[var(--lado-activo)]">
      {organization ? <>
        <Shortcuts organization={organization} moduleCards={moduleCards} groups={groups} />
        <div className="h-2 shrink-0 bg-[var(--s2)]" />
        <ToResolveRows groups={groups} />
      </> : <>
        <YourCompanies companies={companies} />
        {/* M-Inicio-Miembro («Administra su empresa»): la franja gris, 8 debajo de las empresas, y su «Para resolver». */}
        {groups.length > 0 ? <>
          <div className="mt-2 h-2 shrink-0 bg-[var(--s2)]" />
          <ToResolveRows groups={groups} />
        </> : null}
      </>}
    </div>
  </div>;
}

function Shortcuts({ organization, moduleCards, groups }: { organization: HomeOrganizationSummary; moduleCards: readonly ModuleCardRow[]; groups: readonly PendingRowGroup[] }) {
  const { t } = useTranslation("home");
  const pendingByArea = new Map<string, number>();
  for (const group of groups) pendingByArea.set(group.area, (pendingByArea.get(group.area) ?? 0) + group.totalCount);
  const shortcuts = [
    ...areas.filter((area) => organization[area] != null).map((area) => ({ key: area, Icon: areaIcons[area], to: areaPaths[area], label: t(`cards.${area}.short`) })),
    ...moduleCards.map(({ card }) => ({ key: card.key, Icon: card.icon, to: card.to, label: t(card.shortKey) })),
  ];

  return <nav aria-label={t("areas")} className="grid grid-cols-4 gap-y-4 px-2 pb-[18px] pt-[22px]">
    {shortcuts.map(({ key: area, Icon, to, label }) => {
      const count = pendingByArea.get(area) ?? 0;
      return <Link key={area} to={to} aria-label={count > 0 ? t("shortcutPending", { area: label, count }) : label}
        className="flex flex-col items-center gap-[7px] text-center text-[12.5px] leading-[normal] font-medium text-[var(--t1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foco)]">
        <span className="relative inline-flex size-14 items-center justify-center rounded-full bg-[var(--marca-t)] text-[var(--marca-tx)]">
          <Icon aria-hidden="true" className="size-6" />
          {count > 0 ? <span aria-hidden="true" className="absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-[10px] bg-[var(--peligro)] px-1.5 text-[11.5px] font-bold text-[var(--primary-foreground)] shadow-[0_0_0_2px_var(--lado-activo)]"><NumberText value={count} /></span> : null}
        </span>
        {label}
      </Link>;
    })}
  </nav>;
}

/** M-Inicio-Miembro: «Tus empresas», una fila por empresa con sus iniciales, «rol · miembros» y ›. */
function YourCompanies({ companies }: { companies: readonly HomeCompanyCard[] }) {
  const { t } = useTranslation("home");
  const titleId = useId();

  return <section aria-labelledby={titleId}>
    <div className={titleRow}><h2 id={titleId} className={titleClass}>{t("yourCompanies")}</h2></div>
    <ul>
      {companies.map((company) => <li key={company.companyId} className={`relative ${rowLine}`}>
        <Link to={`/org/empresas/${company.companyId}`} className={`${rowClass} focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--foco)]`}>
          <span aria-hidden="true" className="inline-flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-[var(--marca-t)] text-[14px] font-bold text-[var(--marca-tx)]">{initials(company.name)}</span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5 leading-[normal]">
            <span className="truncate text-[15px] font-semibold text-[var(--t1)]">{company.name}</span>
            <span className="truncate text-[13px] text-[var(--t3)]">{companyDetail(company, t)}</span>
          </span>
          <ChevronRight aria-hidden="true" className="size-[18px] shrink-0 text-[var(--t3)]" />
        </Link>
      </li>)}
    </ul>
  </section>;
}

/** M-Inicio-Org y M-Inicio-Miembro: «Para resolver», con la cantidad, en filas con ícono redondo y botón cápsula. */
function ToResolveRows({ groups }: { groups: readonly PendingRowGroup[] }) {
  const { t } = useTranslation("home");
  const titleId = useId();

  return <section aria-labelledby={titleId}>
    <div className={titleRow}>
      <h2 id={titleId} className={titleClass}>{t("toResolve.title")}</h2>
      <span className="text-[14px] font-semibold text-[var(--t3)]"><NumberText value={pendingTotal(groups)} /></span>
    </div>
    {groups.length === 0
      ? <p className="px-5 py-4 text-[15px] font-semibold text-[var(--t1)]">{t("toResolve.empty")}</p>
      : groups.map((group) => <div key={group.key}>
        <div className="flex items-baseline gap-1.5 px-5 pb-0.5 pt-3.5 text-[13px] text-[var(--t3)]">
          <strong className="font-semibold text-[var(--t2)]">{group.title}</strong><span>{`· ${group.areaLabel}`}</span>
          <span className="ml-auto font-semibold"><NumberText value={group.totalCount} /></span>
        </div>
        <ul>{group.rows.map((row) => {
          const Icon = row.icon;
          return <li key={row.key} className={`${rowClass} ${rowLine}`}>
            <span aria-hidden="true" className={`inline-flex size-10 shrink-0 items-center justify-center rounded-full ${toneCircle[tone(row)]}`}><Icon className="size-5" /></span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5 leading-[normal]">
              <span className="truncate text-[15px] font-semibold text-[var(--t1)]">{row.title}</span>
              <span className={`truncate text-[13px] font-medium ${toneText[tone(row)]}`}>{row.phoneState}</span>
            </span>
            <Link to={row.to} className="inline-flex h-[34px] shrink-0 items-center rounded-[17px] bg-[var(--marca-t)] px-3.5 text-[14px] font-semibold text-[var(--marca-tx)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foco)]">{row.action}</Link>
          </li>;
        })}
        </ul>
        {group.totalCount > validationConstraints.PendingGroup.items.maxItems ? <Link to={group.to} className="ml-[72px] mb-1.5 mt-0.5 inline-flex items-center gap-1.5 py-2 text-[15px] font-semibold text-[var(--marca-tx)]">{t("toResolve.viewAll")}<ArrowRight aria-hidden="true" className="size-3.5" /></Link> : null}
      </div>)}
  </section>;
}
