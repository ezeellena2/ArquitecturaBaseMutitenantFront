import { CircleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { SettingsItem } from "@/shared/ui/app/SettingsGroup";
import { EmptyValue } from "@/shared/ui/format/EmptyValue";
import { SparkleIcon } from "@/shared/ui/icons";
import { Section } from "@/shared/ui/Section";

// Las piezas que comparten las pantallas que abren una propuesta del asistente (ADR 0068 §9; tableros *-Propuesta):
// «Propuesta del asistente» junto al título, «Revisá» con su motivo en lo dudoso y «Lo que cambia».

/** «Propuesta del asistente», junto al título de la pantalla, del diálogo o de la confirmación (.acc-prop). */
export function AssistantProposalMark() {
  const { t } = useTranslation();
  return <span className="inline-flex items-center gap-1.25 whitespace-nowrap text-[0.8125rem] font-medium text-[var(--marca-tx)]">
    <SparkleIcon className="size-3.5 shrink-0" />{t("assistantProposal.mark")}
  </span>;
}

/** «Revisá» (.acc-rev): la marca de lo dudoso, en un campo o junto a un nombre. */
export function AssistantProposalReviewMark() {
  const { t } = useTranslation();
  return <span className="inline-flex h-5 items-center gap-1 whitespace-nowrap rounded-[0.1875rem] bg-[var(--alerta-t)] px-1.5 text-[0.71875rem] font-semibold text-[var(--alerta-tx)]">
    <CircleAlert className="size-3" aria-hidden="true" />{t("assistantProposal.review")}
  </span>;
}

export interface AssistantProposalChangeItem {
  readonly key: string;
  readonly label: string;
  /** Con duda: lleva «Revisá». */
  readonly review?: boolean;
}

export interface AssistantProposalChangeRow {
  readonly key: string;
  /** «Dónde», en la tabla de la compu («Organización», «Delta S.A.»); sin él, la tabla va sin esa columna (Rol-Propuesta). */
  readonly where?: string;
  /** «Dónde» con duda (la empresa propuesta): lleva «Revisá». */
  readonly whereReview?: boolean;
  /** Lo mismo dentro de la frase del teléfono: «Se suma en la organización». */
  readonly whereIn?: string;
  readonly added: readonly AssistantProposalChangeItem[];
  /** Lo que cambia sin sumarse ni quitarse («Detalle de Venta nueva»); con él, la tabla suma «Cambia» (FRM-Catalogo-Opciones-Propuesta). */
  readonly changed?: readonly AssistantProposalChangeItem[];
  readonly removed: readonly AssistantProposalChangeItem[];
}

function Names({ items }: { items: readonly AssistantProposalChangeItem[] }) {
  if (items.length === 0) return <EmptyValue />;
  return <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
    {items.map((item, index) => <span key={item.key} className="inline-flex items-center gap-2">
      <span>{item.label}{index < items.length - 1 ? "," : null}</span>
      {item.review ? <AssistantProposalReviewMark /> : null}
    </span>)}
  </span>;
}

/**
 * «Lo que cambia» (Usuario-Propuesta y Rol-Propuesta, .acc-cambia): lo que se suma y lo que se quita sobre lo guardado y,
 * si la pantalla lo da, lo que cambia («Cambia», FRM-Catalogo-Opciones-Propuesta). En la compu, una tabla en su caja; en el
 * teléfono (M-*-Propuesta), un renglón por cada uno que tiene algo. Sin cambios no se muestra.
 */
export function AssistantProposalChangesSection({ rows }: { rows: readonly AssistantProposalChangeRow[] }) {
  const { t } = useTranslation();
  const { phone } = useAppChrome();
  const shown = rows.filter((row) => row.added.length > 0 || (row.changed?.length ?? 0) > 0 || row.removed.length > 0);
  if (shown.length === 0) return null;
  const title = t("assistantProposal.changes.title");
  if (phone) return <Section title={title}>
    <ul className="m-0 list-none p-0">
      {shown.flatMap((row) => [
        row.added.length ? <SettingsItem key={`${row.key}:added`} title={row.whereIn ? t("assistantProposal.changes.addedIn", { where: row.whereIn }) : t("assistantProposal.changes.added")}
          detail={<Names items={row.added} />} /> : null,
        row.changed?.length ? <SettingsItem key={`${row.key}:changed`} title={t("assistantProposal.changes.changed")} detail={<Names items={row.changed} />} /> : null,
        row.removed.length ? <SettingsItem key={`${row.key}:removed`} title={row.whereIn ? t("assistantProposal.changes.removedIn", { where: row.whereIn }) : t("assistantProposal.changes.removed")}
          detail={<Names items={row.removed} />} /> : null,
      ])}
    </ul>
  </Section>;
  const where = shown.some((row) => row.where !== undefined);
  const changed = shown.some((row) => row.changed !== undefined);
  // .acc-tabla: 220 para «Dónde» y el resto en partes iguales; la cabecera arena, con las líneas de las tablas.
  const columns = where
    ? changed ? "grid-cols-[13.75rem_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]" : "grid-cols-[13.75rem_minmax(0,1fr)_minmax(0,1fr)]"
    : changed ? "grid-cols-3" : "grid-cols-2";
  const cell = "min-w-0 px-3.5 py-2.25 [overflow-wrap:anywhere] [&+&]:shadow-[inset_1px_0_0_var(--borde)]";
  return <Section title={title}>
    <div role="table" aria-label={title} className="text-[0.875rem]">
      <div role="row" className={`grid ${columns} bg-[var(--cab)] font-semibold text-[var(--t2)]`}>
        {where ? <span role="columnheader" className={cell}>{t("assistantProposal.changes.where")}</span> : null}
        <span role="columnheader" className={cell}>{t("assistantProposal.changes.added")}</span>
        {changed ? <span role="columnheader" className={cell}>{t("assistantProposal.changes.changed")}</span> : null}
        <span role="columnheader" className={cell}>{t("assistantProposal.changes.removed")}</span>
      </div>
      {shown.map((row) => <div key={row.key} role="row" className={`grid ${columns} border-t border-[var(--borde)]`}>
        {where ? <span role="cell" className={cell}>
          {row.whereReview ? <span className="inline-flex flex-wrap items-center gap-2">{row.where}<AssistantProposalReviewMark /></span> : row.where}
        </span> : null}
        <span role="cell" className={cell}><Names items={row.added} /></span>
        {changed ? <span role="cell" className={cell}><Names items={row.changed ?? []} /></span> : null}
        <span role="cell" className={cell}><Names items={row.removed} /></span>
      </div>)}
    </div>
  </Section>;
}
