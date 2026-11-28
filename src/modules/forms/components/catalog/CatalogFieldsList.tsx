import { ArrowDown, ArrowUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useFormat } from "@/shared/format/useFormat";
import { cn } from "@/shared/lib/utils";
import { EmptyValue } from "@/shared/ui/format/EmptyValue";
import { IconButton } from "@/shared/ui/IconButton";
import { AlertTriangleIcon } from "@/shared/ui/icons";
import { useFieldName } from "../../hooks/useCatalogFieldsDialog";
import type { CatalogFieldDraft } from "../../lib/catalogFields";

/** El número de un campo guardado en la lista; uno nuevo todavía no tiene lugar. */
function FieldNumber({ field, list }: { field: CatalogFieldDraft; list: readonly CatalogFieldDraft[] }) {
  const format = useFormat();
  return field.id === null ? <EmptyValue /> : <>{format.formatInteger(list.indexOf(field) + 1)}</>;
}

function FieldNameText({ field }: { field: CatalogFieldDraft }) {
  const fieldName = useFieldName();
  return <span className={cn("min-w-0 break-words font-semibold", field.name.trim() ? "text-[var(--t1)]" : "text-[var(--t3)]")}>{fieldName(field)}</span>;
}

/** El triángulo de un campo que rechazó el servidor. */
function ErrorMark({ field }: { field: CatalogFieldDraft }) {
  const { t } = useTranslation("forms");
  if (!Object.values(field.errors ?? {}).some(Boolean)) return null;
  return <span title={t("forms:catalog.optionsDialog.hasError")} className="inline-flex shrink-0 text-[var(--peligro)]">
    <AlertTriangleIcon aria-hidden="true" className="size-3.5" />
    <span className="sr-only">{t("forms:catalog.optionsDialog.hasError")}</span>
  </span>;
}

function NewBadge({ field }: { field: CatalogFieldDraft }) {
  const { t } = useTranslation("forms");
  if (field.id !== null) return null;
  return <span className="rounded-[0.375rem] bg-[var(--alerta-t)] px-1.5 text-[0.71875rem] font-semibold text-[var(--alerta-tx)]">{t("forms:catalog.fieldsDialog.newBadge")}</span>;
}

/**
 * La lista de la izquierda del modal en la compu (263): número, nombre y tipo, cada uno en su columna; el elegido, marcado y con
 * ↑ ↓ si se puede editar.
 */
export function DesktopFieldsList({ list, selectedKey, readOnly, labelledBy, onSelect, onMove }: {
  list: readonly CatalogFieldDraft[];
  selectedKey: string | null;
  readOnly: boolean;
  labelledBy: string;
  onSelect: (key: string) => void;
  onMove: (step: -1 | 1) => void;
}) {
  const { t } = useTranslation("forms");
  const format = useFormat();
  const fieldName = useFieldName();
  return <ul aria-labelledby={labelledBy} className="min-h-0 flex-1 overflow-y-auto">
    {list.map((field, index) => {
      const on = field.localKey === selectedKey;
      return <li key={field.localKey} className={cn("grid grid-cols-[minmax(0,1fr)_2.625rem] items-center border-b border-[var(--borde)] pr-2", on && "bg-[var(--marca-t)] shadow-[inset_3px_0_0_var(--marca)]")}>
        <button type="button" aria-current={on ? "true" : undefined} onClick={() => onSelect(field.localKey)}
          className="grid min-h-13 w-full grid-cols-[1.25rem_minmax(0,1fr)_2.75rem_7.25rem] items-center gap-x-2.5 py-2 pl-3 text-left text-[0.84375rem] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--foco)]">
          <span className="text-center text-[0.8125rem] text-[var(--t3)] tabular-nums"><FieldNumber field={field} list={list} /></span>
          <span className="flex min-w-0 items-center gap-1.5"><FieldNameText field={field} /><ErrorMark field={field} /></span>
          <span><NewBadge field={field} /></span>
          <span className="text-[0.78125rem] leading-[1.3] text-[var(--t2)]">{format.formatEnum("FormCatalogFieldType", field.type)}</span>
        </button>
        {on && !readOnly ? <span className="inline-flex justify-self-end">
          <IconButton label={t("forms:catalog.fieldsDialog.up", { name: fieldName(field) })} disabled={index === 0} className="size-7" onClick={() => onMove(-1)}>
            <ArrowUp aria-hidden="true" className="size-4" />
          </IconButton>
          <IconButton label={t("forms:catalog.fieldsDialog.down", { name: fieldName(field) })} disabled={index === list.length - 1} className="size-7" onClick={() => onMove(1)}>
            <ArrowDown aria-hidden="true" className="size-4" />
          </IconButton>
        </span> : null}
      </li>;
    })}
  </ul>;
}

/** La lista del teléfono: cada campo con su número, su nombre y su tipo debajo; tocarlo abre el campo. */
export function PhoneFieldsList({ list, labelledBy, onSelect }: {
  list: readonly CatalogFieldDraft[];
  labelledBy: string;
  onSelect: (key: string) => void;
}) {
  const { t } = useTranslation("forms");
  const format = useFormat();
  return <ul aria-labelledby={labelledBy} className="border-t border-[var(--borde)]">
    {list.map((field) => <li key={field.localKey} className="border-b border-[var(--borde)]">
      <button type="button" onClick={() => onSelect(field.localKey)} className="flex w-full items-start gap-2 px-4 py-3 text-left text-[0.90625rem] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--foco)]">
        <span className="w-6 shrink-0 text-[var(--t3)] tabular-nums"><FieldNumber field={field} list={list} /></span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex items-center gap-1.5"><FieldNameText field={field} /><NewBadge field={field} /><ErrorMark field={field} /></span>
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 text-[0.8125rem]">
            <div className="contents"><dt className="text-[var(--t3)]">{t("forms:catalog.fieldsDialog.labels.type")}</dt><dd>{format.formatEnum("FormCatalogFieldType", field.type)}</dd></div>
          </dl>
        </span>
      </button>
    </li>)}
  </ul>;
}
