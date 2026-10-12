import { useId } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { StatusDot } from "@/shared/ui/StatusDot";
import { Surface } from "@/shared/ui/Surface";
import { NumberText } from "@/shared/ui/format/NumberText";
import { validationConstraints } from "@/shared/api/generated/validation";
import { ArrowRight } from "lucide-react";
import { pendingTotal, type PendingRow, type PendingRowGroup } from "./pendingItems";

/**
 * Lienzo v120: cada tipo tiene su grupo, área y total real; el listado completo se abre sólo si excede la vista previa.
 */
export function ToResolve({ groups }: { groups: readonly PendingRowGroup[] }) {
  const { t } = useTranslation("home");
  const titleId = useId();
  const rows = groups.flatMap((group) => group.rows);
  const columns: Column<PendingRow>[] = [
    { id: "title", header: t("toResolve.pending"), type: "custom", mobile: "primary", className: "w-[48%]",
      cell: (row) => <span className="block truncate text-[var(--t1)]">{row.title}</span>, detail: (row) => row.detail },
    { id: "state", header: t("toResolve.state"), type: "custom", cell: (row) =>
      <StatusDot tone={row.tone} label={row.state} /> },
    { id: "since", header: t("toResolve.since"), type: "date", className: "w-[122px]", value: (row) => row.since },
    // Columnas del tablero: 1.6fr, 1fr, 110px y 96px, más los márgenes de cada celda. DataTable fija la de
    // acciones en 50 px; el ! la deja en la del tablero.
    { id: "action", header: t("toResolve.action"), type: "actions", className: "w-[118px]!", cell: (row) =>
      <Link to={row.to} className="text-[13px] font-semibold text-[var(--marca-tx)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foco)]">{row.action}</Link> },
  ];
  return <Surface className="overflow-hidden">
    <section aria-labelledby={titleId}>
      {/* Tablero Inicio-Org (.t-cab): 12 arriba y abajo y 16 a los lados. */}
      <div className="flex items-center gap-2 px-4 py-3">
        <h2 id={titleId} className="text-[15px] font-semibold text-[var(--t1)]">{t("toResolve.title")}</h2>
        <span className="text-[13px] font-semibold text-[var(--t3)]"><NumberText value={pendingTotal(groups)} /></span>
      </div>
      {rows.length === 0
        ? <div className="border-t border-[var(--borde)] px-4 py-5 text-center"><strong className="text-[14px] font-semibold text-[var(--t1)]">{t("toResolve.empty")}</strong></div>
        : <DataTable columns={columns} rows={rows} rowKey={(row) => row.key} rowGroups={groups.map((group) => ({
          key: group.key, rows: group.rows,
          header: <div className="flex items-center gap-2 text-[13.5px]"><strong className="font-semibold text-[var(--t1)]">{group.title}</strong>
            <span className="text-[var(--t3)]">{group.areaLabel}</span><span className="font-semibold text-[var(--t3)]"><NumberText value={group.totalCount} /></span></div>,
          footer: group.totalCount > validationConstraints.PendingGroup.items.maxItems ? <Link to={group.to} className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[var(--marca-tx)] hover:underline">{t("toResolve.viewAll")}<ArrowRight aria-hidden="true" className="size-3.5" /></Link> : undefined,
        }))} />}
    </section>
  </Surface>;
}
