import { useId } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import type { HomeOrganizationSummary } from "@/shared/api/types";
import { areaIcons, areaPaths, type HomeArea, type PendingRow } from "./pendingItems";

const areas: readonly HomeArea[] = ["users", "roles", "companies", "publicPage", "settings", "audit"];

const toneCircle = { danger: "bg-[var(--peligro-t)] text-[var(--peligro)]", warning: "bg-[var(--alerta-t)] text-[var(--alerta)]" } as const;
const toneText = { danger: "text-[var(--peligro)]", warning: "text-[var(--alerta)]" } as const;
const tone = (row: PendingRow) => (row.tone === "danger" ? "danger" : "warning");

/**
 * Tablero M-Inicio-Org (C, app): cabecera de color con el saludo, atajos redondos con el globito de sus pendientes y
 * «Para resolver» en filas con ícono redondo del color de la urgencia y botón cápsula. No es la compu achicada.
 */
export function PhoneHome({ organization, rows, firstName, organizationName }: {
  organization: HomeOrganizationSummary;
  rows: readonly PendingRow[];
  firstName: string;
  organizationName: string;
}) {
  const { t } = useTranslation("home");
  const titleId = useId();
  const pendingByArea = new Map<HomeArea, number>();
  for (const row of rows) pendingByArea.set(row.area, (pendingByArea.get(row.area) ?? 0) + 1);

  return <div className="flex min-h-full flex-col">
    <div className="bg-[linear-gradient(160deg,var(--marca),var(--marca-tx))] px-5 pb-12 pt-3 text-[var(--primary-foreground)]">
      <span className="block text-[15px] opacity-80">{firstName ? t("greeting", { name: firstName }) : t("greetingUnnamed")}</span>
      <h1 className="mt-0.5 text-[28px] font-bold leading-tight tracking-[-0.02em]">{organizationName}</h1>
    </div>
    <div className="relative z-[1] -mt-[26px] flex flex-1 flex-col overflow-hidden rounded-t-[24px] bg-[var(--lado-activo)]">
      <nav aria-label={t("areas")} className="grid grid-cols-4 gap-y-4 px-2 pb-[18px] pt-[22px]">
        {areas.filter((area) => organization[area] != null).map((area) => {
          const Icon = areaIcons[area];
          const count = pendingByArea.get(area) ?? 0;
          const label = t(`cards.${area}.short`);
          return <Link key={area} to={areaPaths[area]} aria-label={count > 0 ? t("shortcutPending", { area: label, count }) : label}
            className="flex flex-col items-center gap-[7px] text-center text-[12.5px] font-medium text-[var(--t1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foco)]">
            <span className="relative inline-flex size-14 items-center justify-center rounded-full bg-[var(--marca-t)] text-[var(--marca-tx)]">
              <Icon aria-hidden="true" className="size-6" />
              {count > 0 ? <span aria-hidden="true" className="absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-[10px] bg-[var(--peligro)] px-1.5 text-[11.5px] font-bold text-[var(--primary-foreground)] shadow-[0_0_0_2px_var(--lado-activo)]">{count}</span> : null}
            </span>
            {label}
          </Link>;
        })}
      </nav>
      <div className="h-2 shrink-0 bg-[var(--s2)]" />
      <section aria-labelledby={titleId}>
        <div className="flex items-baseline gap-2 px-5 pb-1 pt-4">
          <h2 id={titleId} className="text-[18px] font-bold tracking-[-0.01em] text-[var(--t1)]">{t("toResolve.title")}</h2>
          <span className="text-[14px] font-semibold text-[var(--t3)]">{rows.length}</span>
        </div>
        {rows.length === 0
          ? <p className="px-5 py-4 text-[15px] font-semibold text-[var(--t1)]">{t("toResolve.empty")}</p>
          : <ul>
            {rows.map((row) => {
              const Icon = areaIcons[row.area];
              return <li key={row.key} className="relative flex items-center gap-3 py-2.5 pl-5 pr-4 before:absolute before:left-[72px] before:right-0 before:top-0 before:h-px before:bg-[var(--borde)] before:content-[''] first:before:hidden">
                <span aria-hidden="true" className={`inline-flex size-10 shrink-0 items-center justify-center rounded-full ${toneCircle[tone(row)]}`}><Icon className="size-5" /></span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-[15px] font-semibold text-[var(--t1)]">{row.title}</span>
                  <span className="truncate text-[13px] text-[var(--t3)]"><span className={`font-medium ${toneText[tone(row)]}`}>{row.phoneState}</span>{` · ${row.areaLabel}`}</span>
                </span>
                <Link to={row.to} className="inline-flex h-[34px] shrink-0 items-center rounded-[17px] bg-[var(--marca-t)] px-3.5 text-[14px] font-semibold text-[var(--marca-tx)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foco)]">{row.action}</Link>
              </li>;
            })}
          </ul>}
      </section>
    </div>
  </div>;
}
