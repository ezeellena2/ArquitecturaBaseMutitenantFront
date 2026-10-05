import { useId } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { StatusDot } from "@/shared/ui/StatusDot";
import { Surface } from "@/shared/ui/Surface";
import { type PendingRow } from "./pendingItems";

/**
 * «Para resolver» en la compu (tableros Inicio-Org e Inicio-Miembro): Pendiente, Área, Estado, Desde y la acción. En
 * Inicio-Miembro (`byCompany`), la segunda columna es la Empresa de cada fila, como la manda el back (ADR 0040).
 */
export function ToResolve({ rows, byCompany = false }: { rows: readonly PendingRow[]; byCompany?: boolean }) {
  const { t } = useTranslation("home");
  const titleId = useId();
  const columns: Column<PendingRow>[] = [
    { id: "title", header: t("toResolve.pending"), type: "custom", mobile: "primary", className: "w-[37%]",
      cell: (row) => <span className="block truncate text-[var(--t1)]">{row.title}</span>, detail: (row) => row.detail },
    byCompany
      ? { id: "company", header: t("toResolve.company"), type: "text", className: "w-[19%]", value: (row) => row.company }
      : { id: "area", header: t("toResolve.area"), type: "text", className: "w-[19%]", value: (row) => row.areaLabel },
    { id: "state", header: t("toResolve.state"), type: "custom", cell: (row) =>
      <StatusDot tone={row.tone} label={row.state} /> },
    { id: "since", header: t("toResolve.since"), type: "date", className: "w-[122px]", value: (row) => row.since },
    // Columnas del tablero: 1.6fr, 0.8fr, 1fr, 110px y 96px, más los márgenes de cada celda. DataTable fija la de
    // acciones en 50 px; el ! la deja en la del tablero.
    { id: "action", header: t("toResolve.action"), type: "actions", className: "w-[118px]!", cell: (row) =>
      <Link to={row.to} className="text-[13px] font-semibold text-[var(--marca-tx)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foco)]">{row.action}</Link> },
  ];
  return <Surface className="overflow-hidden">
    <section aria-labelledby={titleId}>
      {/* Tablero Inicio-Org (.t-cab): 12 arriba y abajo y 16 a los lados. */}
      <div className="flex items-center gap-2 px-4 py-3">
        <h2 id={titleId} className="text-[15px] font-semibold text-[var(--t1)]">{t("toResolve.title")}</h2>
        <span className="text-[13px] font-semibold text-[var(--t3)]">{rows.length}</span>
      </div>
      {rows.length === 0
        ? <div className="border-t border-[var(--borde)] px-4 py-5 text-center"><strong className="text-[14px] font-semibold text-[var(--t1)]">{t("toResolve.empty")}</strong></div>
        : <DataTable columns={columns} rows={rows} rowKey={(row) => row.key} />}
    </section>
  </Surface>;
}
