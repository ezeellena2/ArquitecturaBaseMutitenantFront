import { useId } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { StatusDot } from "@/shared/ui/StatusDot";
import { Surface } from "@/shared/ui/Surface";
import { dotAsText, type PendingRow } from "./pendingItems";

/** «Para resolver» en la compu (tableros Inicio-Org e Inicio-Miembro): Pendiente, Área, Estado, Desde y la acción. */
export function ToResolve({ rows }: { rows: readonly PendingRow[] }) {
  const { t } = useTranslation("home");
  const titleId = useId();
  const columns: Column<PendingRow>[] = [
    { id: "title", header: t("toResolve.pending"), type: "custom", mobile: "primary", cell: (row) =>
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-[var(--t1)]">{row.title}</span>
        {row.detail ? <span className="truncate text-xs text-[var(--t3)]">{row.detail}</span> : null}
      </span> },
    { id: "area", header: t("toResolve.area"), type: "text", className: "w-[19%]", value: (row) => row.areaLabel },
    { id: "state", header: t("toResolve.state"), type: "custom", className: "w-[24%]", cell: (row) =>
      <StatusDot tone={row.tone} label={row.state} className={dotAsText} /> },
    { id: "since", header: t("toResolve.since"), type: "date", className: "w-[110px]", value: (row) => row.since },
    // Columnas del tablero: 1.6fr, 0.8fr, 1fr, 110px y 96px. DataTable fija la de acciones en 5%; el ! la deja en 96px.
    { id: "action", header: t("toResolve.action"), type: "actions", className: "w-24!", cell: (row) =>
      <Link to={row.to} className="text-[13px] font-semibold text-[var(--marca-tx)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foco)]">{row.action}</Link> },
  ];
  return <Surface className="overflow-hidden">
    <section aria-labelledby={titleId}>
      <div className="flex items-center gap-2 px-4 py-3.5">
        <h2 id={titleId} className="text-[15px] font-semibold text-[var(--t1)]">{t("toResolve.title")}</h2>
        <span className="rounded-full bg-[var(--s3)] px-2 py-px text-xs font-semibold text-[var(--t2)]">{rows.length}</span>
      </div>
      {rows.length === 0
        ? <div className="border-t border-[var(--borde)] px-4 py-5 text-center"><strong className="text-[14px] font-semibold text-[var(--t1)]">{t("toResolve.empty")}</strong></div>
        : <DataTable columns={columns} rows={rows} rowKey={(row) => row.key} />}
    </section>
  </Surface>;
}
