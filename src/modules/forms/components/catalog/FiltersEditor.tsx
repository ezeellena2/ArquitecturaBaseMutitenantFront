import { Pencil, Plus } from "lucide-react";
import { useState, type JSX } from "react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { useRetryAfterOf } from "@/shared/api/useRetryAfterCountdown";
import { useFormat } from "@/shared/format/useFormat";
import { useResourceOptions } from "@/shared/hooks/useResourceOptions";
import { useRestoreFocusOnClose } from "@/shared/hooks/useRestoreFocusOnClose";
import { cn } from "@/shared/lib/utils";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { Button } from "@/shared/ui/button";
import { CheckboxField } from "@/shared/ui/CheckboxField";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { FormField } from "@/shared/ui/FormField";
import { IconButton } from "@/shared/ui/IconButton";
import { CloseIcon, TrashIcon } from "@/shared/ui/icons";
import { Input } from "@/shared/ui/input";
import { Picker, type PickerOption } from "@/shared/ui/Picker";
import { RowActions } from "@/shared/ui/RowActions";
import { Section, SectionFields } from "@/shared/ui/Section";
import { contactTagOptions, memberCompanyOptions, memberRoleOptions } from "../../api/catalogs";
import type { FormCatalogSourceColumn } from "../../api/types";
import type { CatalogFilters, ConditionDraft } from "../../hooks/useCatalogFilters";

type T = TFunction;

const columnLabel = (t: T, column: string) => t([`forms:catalog.filters.columns.${column}`, column]);
const detailLabel = (t: T, column: string) => t([`forms:catalog.filters.detailColumns.${column}`, `forms:catalog.filters.columns.${column}`, column]);
// «tiene alguna de» con las etiquetas, «tiene alguno de» con los roles y las empresas.
const operatorLabel = (t: T, column: string, operator: string) => t([`forms:catalog.filters.operators.${column}.${operator}`, `forms:catalog.filters.operators.${operator}`, operator]);
const valuesLabel = (t: T, column: string) => t([`forms:catalog.filters.valueLabels.${column}`, "forms:catalog.filters.value"]);

function definitionOf(filters: CatalogFilters, column: string): FormCatalogSourceColumn | undefined {
  return filters.columns.find((candidate) => candidate.key === column);
}

/** Otra columna para una condición: su primera comparación y, en un sí o no, «Sí»; los valores elegidos no sirven en otra. */
type ColumnChange = Pick<ConditionDraft, "column" | "operator" | "values">;

/** Lo que se pierde al cambiar la columna: los valores que eligió la persona («Sí» de un sí o no viene solo). */
function lostValues(filters: CatalogFilters, condition: ConditionDraft): number {
  const type = definitionOf(filters, condition.column)?.type;
  return type === "Boolean" ? 0 : condition.values.filter((value) => value.trim() !== "").length;
}

/** «¿Cambiar a Empresa?» con lo que se va (162): ninguna elección se descarta en silencio. */
function useColumnQuestion(filters: CatalogFilters, condition: ConditionDraft, apply: (change: ColumnChange) => void) {
  const { t } = useTranslation("forms");
  const format = useFormat();
  const [pending, setPending] = useState<ColumnChange | null>(null);
  const lost = lostValues(filters, condition);
  return {
    pending,
    ask: (change: ColumnChange) => { if (lost > 0) setPending(change); else apply(change); },
    title: pending ? t("forms:catalog.filters.changeColumn.title", { column: columnLabel(t, pending.column) }) : "",
    description: t("forms:catalog.filters.changeColumn.values", { count: lost, n: format.formatInteger(lost) }),
    confirm: () => { if (pending) apply(pending); setPending(null); },
    cancel: () => setPending(null),
  };
}

/** Lo que dice una condición cerrada: «tiene alguno de» y «Supervisor, Jefe de obra». */
function conditionValuesText(filters: CatalogFilters, condition: ConditionDraft, t: T): string {
  const type = definitionOf(filters, condition.column)?.type ?? (condition.column === "active" ? "Boolean" : undefined);
  if (type === "Boolean" || condition.column === "active") return condition.values.map((value) => value === "true" ? t("forms:catalog.filters.yes") : t("forms:catalog.filters.no")).join(", ");
  if (condition.column === "role" || condition.column === "company") {
    return condition.values.map((id) => filters.names[id] ?? t(`forms:catalog.filters.missing.${condition.column}`)).join(", ");
  }
  return condition.values.join(", ");
}

/**
 * «Qué miembros entran» o «Qué contactos entran» (FRM-Catalogo-Filtros y FRM-Catalogo-Contactos, 55): el texto de cada
 * opción, el detalle y el orden; las condiciones unidas con «y», cada una con su columna, su comparación y sus valores en la
 * pieza (262), varios por su nombre, separados por coma y sin chips; y, en los miembros, «Sin incluir a quien lo recibe».
 * En el teléfono (M-FRM-Catalogo-Filtros): cada condición es una tarjeta con su ⋮, que se edita en «Editar condición», y el
 * resto va en «Otras opciones».
 */
export function FiltersEditor({ filters, editable }: { filters: CatalogFilters; editable: boolean }) {
  const { t } = useTranslation("forms");
  const { phone } = useAppChrome();
  // `trigger`: el ⋮ de la tarjeta, si se abrió desde su menú, que se va con él; el foco vuelve a ese botón al cerrar.
  const [editing, setEditing] = useState<{ condition: ConditionDraft; isNew: boolean; trigger?: HTMLElement | null } | null>(null);
  const title = t(`forms:catalog.filters.title.${filters.source}`);
  const columnsError = filters.columnsLoad.error !== undefined;
  const maxReason = columnsError ? t("forms:catalog.filters.columnsError")
    : filters.canAddCondition || !editable || filters.columns.length === 0 ? undefined : t("forms:catalog.filters.conditionsMax");
  const columnsFailure = columnsError && editable ? <ColumnsError filters={filters} /> : null;

  const conditions = filters.draft.conditions.map((condition, index) => phone
    ? <ConditionCard key={condition.key} filters={filters} condition={condition} editable={editable}
      onEdit={(trigger) => setEditing({ condition, isNew: false, trigger })} />
    : <ConditionRow key={condition.key} filters={filters} condition={condition} index={index} editable={editable} />);

  const settings = <SettingsFields filters={filters} editable={editable} phone={phone} />;

  if (phone) {
    return <>
      <Section title={title} action={editable ? {
        label: t("forms:catalog.filters.addCondition"), disabledReason: maxReason,
        onClick: () => { const condition = filters.newCondition(); if (condition) setEditing({ condition, isNew: true }); },
      } : undefined}>
        {columnsFailure ? <div className="px-4 py-3">{columnsFailure}</div> : null}
        <div className="flex flex-col divide-y divide-[var(--borde)]">{conditions}</div>
      </Section>
      <Section title={t("forms:catalog.filters.otherOptions")}>{settings}</Section>
      {editing ? <EditConditionDialog filters={filters} initial={editing.condition} returnFocusTo={editing.trigger} onClose={() => setEditing(null)}
        onDone={(condition) => {
          if (editing.isNew) filters.appendCondition(condition);
          else filters.updateCondition(condition.key, { column: condition.column, operator: condition.operator, values: condition.values });
          setEditing(null);
        }} /> : null}
    </>;
  }

  return <Section title={title}>
    <SectionFields className="grid gap-3.5">
      {settings}
      {conditions.length || editable ? <div className="flex flex-col gap-2.5">
        {columnsFailure}
        {conditions}
        {editable ? <Button type="button" variant="outline" className="self-start" disabled={!filters.canAddCondition} disabledReason={maxReason}
          onClick={filters.addCondition}><Plus aria-hidden="true" className="size-4" />{t("forms:catalog.filters.addCondition")}</Button> : null}
      </div> : null}
      {filters.source === "Members" ? <ExcludeRecipient filters={filters} editable={editable} /> : null}
    </SectionFields>
  </Section>;
}

/** «Texto de cada opción» (siempre el nombre), «Detalle» y «Orden»: en la compu, tres en fila; en el teléfono, sus filas. */
function SettingsFields({ filters, editable, phone }: { filters: CatalogFilters; editable: boolean; phone: boolean }) {
  const { t } = useTranslation("forms");
  const { draft } = filters;
  const known = (keys: readonly (string | null | undefined)[], has: (column: FormCatalogSourceColumn) => boolean) =>
    [...new Set([...filters.columns.filter(has).map((column) => column.key), ...keys.filter((key): key is string => Boolean(key))])];
  const detailOptions: PickerOption[] = known([draft.detail], (column) => column.canDetail).map((key) => ({ value: key, label: detailLabel(t, key) }));
  const sortColumns = known([draft.sort?.column], (column) => column.canSort);
  const sortOptions: PickerOption[] = sortColumns.flatMap((key) => [false, true].map((descending) => ({
    value: `${key}:${descending ? "desc" : "asc"}`,
    label: t(descending ? "forms:catalog.filters.sortDescending" : "forms:catalog.filters.sortAscending", { column: detailLabel(t, key) }),
  })));
  const trigger = phone ? "row" as const : "field" as const;
  const disabled = !editable;
  const fields: { label: string; picker: JSX.Element }[] = [
    // Siempre el nombre: no se elige, así que va apagado, como todo lo que no se edita (A11).
    { label: t("forms:catalog.filters.optionText"), picker: <Picker trigger={trigger} label={phone ? t("forms:catalog.filters.optionText") : undefined} disabled
      value="name" options={[{ value: "name", label: detailLabel(t, "name") }]} onChange={() => undefined} /> },
    { label: t("forms:catalog.filters.detail"), picker: <Picker trigger={trigger} label={phone ? t("forms:catalog.filters.detail") : undefined} disabled={disabled}
      value={draft.detail ?? ""} first={{ value: "", label: t("forms:catalog.filters.noDetail") }} options={detailOptions}
      onChange={(detail) => filters.setDetail(detail || null)} /> },
    { label: t("forms:catalog.filters.sort"), picker: <Picker trigger={trigger} label={phone ? t("forms:catalog.filters.sort") : undefined} disabled={disabled}
      value={draft.sort ? `${draft.sort.column}:${draft.sort.descending ? "desc" : "asc"}` : null} options={sortOptions}
      onChange={(value) => { const [column, direction] = value.split(":"); filters.setSort({ column: column!, descending: direction === "desc" }); }} /> },
  ];
  if (phone) {
    return <div className="flex flex-col divide-y divide-[var(--borde)]">
      {fields.map((field) => <div key={field.label}>{field.picker}</div>)}
      {filters.source === "Members" ? <div className="px-4 py-3"><ExcludeRecipient filters={filters} editable={editable} /></div> : null}
    </div>;
  }
  // Esta rama es solo de la compu y la tablet (desde md): tres en fila, sin otro corte (responsive).
  return <div className="grid grid-cols-3 gap-3.5">
    {fields.map((field) => <FormField key={field.label} label={field.label}>{field.picker}</FormField>)}
  </div>;
}

/** «Sin incluir a quien lo recibe»: una casilla, porque es un sí o no suelto (262), con su (i), que la describe. */
function ExcludeRecipient({ filters, editable }: { filters: CatalogFilters; editable: boolean }) {
  const { t } = useTranslation("forms");
  return <CheckboxField label={t("forms:catalog.filters.excludeRecipient")} help={t("forms:catalog.filters.excludeRecipientHelp")}
    checked={filters.draft.excludeRecipient} disabled={!editable} onCheckedChange={filters.setExcludeRecipient} />;
}

/** Una condición en la compu: «Si» o «Y», la columna, la comparación, los valores y quitarla; debajo, solo su error. */
function ConditionRow({ filters, condition, index, editable }: { filters: CatalogFilters; condition: ConditionDraft; index: number; editable: boolean }) {
  const { t } = useTranslation("forms");
  const error = conditionError(filters, condition, t);
  const question = useColumnQuestion(filters, condition, (change) => filters.updateCondition(condition.key, change));
  return <div className="flex flex-col gap-1">
    <div className="grid grid-cols-[2rem_repeat(3,minmax(0,1fr))_2rem] items-center gap-2">
      <span className="text-[0.8125rem] text-[var(--t3)]">{index === 0 ? t("forms:catalog.filters.if") : t("forms:catalog.filters.and")}</span>
      <ConditionFields filters={filters} condition={condition} editable={editable} invalid={Boolean(error)}
        onChange={(patch) => filters.updateCondition(condition.key, patch)} onColumnChange={question.ask} />
      {editable ? <IconButton label={t("forms:catalog.filters.removeCondition")} className="size-8 border border-[var(--borde)]"
        onClick={() => filters.removeCondition(condition.key)}><CloseIcon className="size-4" /></IconButton> : <span />}
    </div>
    {error ? <p role="alert" className="pl-10 text-[0.78125rem] text-[var(--peligro)]">{error}</p> : null}
    <ConfirmDialog open={question.pending !== null} onOpenChange={(open) => { if (!open) question.cancel(); }} title={question.title}
      description={question.description} confirmLabel={t("forms:catalog.filters.changeColumn.confirm")} onConfirm={question.confirm} />
  </div>;
}

/** Las columnas de «Miembros» no se pudieron leer: lo dice en su lugar, con «Reintentar» (que espera la cuenta de un 429). */
function ColumnsError({ filters }: { filters: CatalogFilters }) {
  const { t } = useTranslation(["forms", "common"]);
  const limit = useRetryAfterOf(filters.columnsLoad.error);
  return <p role="alert" className="flex flex-wrap items-center gap-x-2 text-[0.8125rem] text-[var(--peligro)]">
    {t("forms:catalog.filters.columnsError")}
    <Button type="button" size="sm" variant="link" disabled={limit.isRunning} onClick={filters.columnsLoad.retry}>{limit.label ?? t("common:actions.retry")}</Button>
  </p>;
}

function conditionError(filters: CatalogFilters, condition: ConditionDraft, t: T): string | undefined {
  if (filters.missingValues(condition).length) return t(`forms:catalog.filters.missingError.${condition.column}`);
  return filters.conditionErrors[condition.key];
}

/** Una condición en el teléfono: la columna, y su comparación y su valor; al tocarla, «Editar condición». */
function ConditionCard({ filters, condition, editable, onEdit }: { filters: CatalogFilters; condition: ConditionDraft; editable: boolean; onEdit: (trigger?: HTMLElement | null) => void }) {
  const { t } = useTranslation("forms");
  const error = conditionError(filters, condition, t);
  const name = columnLabel(t, condition.column);
  const body = <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
    <span className="font-medium">{name}</span>
    <span className="flex flex-wrap gap-x-3 text-[0.8125rem]">
      <span><span className="text-[var(--t3)]">{t("forms:catalog.filters.operator")} </span>{operatorLabel(t, condition.column, condition.operator)}</span>
      <span className={cn(error && "text-[var(--peligro)]")}><span className="text-[var(--t3)]">{t("forms:catalog.filters.value")} </span>{conditionValuesText(filters, condition, t)}</span>
    </span>
    {error ? <span role="alert" className="text-[0.78125rem] text-[var(--peligro)]">{error}</span> : null}
  </span>;
  if (!editable) return <div className="flex items-center gap-2 px-4 py-3">{body}</div>;
  return <div className="flex items-center gap-2 px-4 py-3">
    <button type="button" className="flex min-w-0 flex-1" onClick={() => onEdit()}>{body}</button>
    <RowActions label={t("forms:catalog.filters.conditionMore", { column: name })} title={t("forms:catalog.filters.conditionTitle", { column: name })} actions={[
      { label: t("forms:catalog.filters.edit"), accessibleName: t("forms:catalog.filters.edit"), icon: Pencil, onSelect: onEdit },
      { label: t("forms:catalog.filters.removeCondition"), accessibleName: t("forms:catalog.filters.removeCondition"), icon: TrashIcon, destructive: true,
        onSelect: () => filters.removeCondition(condition.key) },
    ]} />
  </div>;
}

/** «Editar condición» del teléfono: la columna, la comparación y el valor en la pieza; «Listo» aplica y «Cancelar» no. */
function EditConditionDialog({ filters, initial, returnFocusTo, onClose, onDone }: {
  filters: CatalogFilters; initial: ConditionDraft; returnFocusTo?: HTMLElement | null; onClose: () => void; onDone: (condition: ConditionDraft) => void;
}) {
  const { t } = useTranslation(["forms", "common"]);
  const [condition, setCondition] = useState(initial);
  const change = (patch: Partial<Omit<ConditionDraft, "key">>) => setCondition((current) => ({ ...current, ...patch }));
  const question = useColumnQuestion(filters, condition, change);
  // Abierto desde el ⋮ de una tarjeta, al cerrar el foco vuelve a ese botón y no cae en <body> (formularios).
  const restoreFocus = useRestoreFocusOnClose(true, returnFocusTo);
  // La pregunta va en el mismo diálogo, nunca un diálogo sobre otro (formularios).
  return <Dialog open onOpenChange={(open) => { if (open) return; if (question.pending) question.cancel(); else onClose(); }}>
    {question.pending ? <DialogContent size="sm" role="alertdialog" onCloseAutoFocus={restoreFocus}>
      <DialogHeader><DialogTitle>{question.title}</DialogTitle></DialogHeader>
      <DialogBody><DialogDescription>{question.description}</DialogDescription></DialogBody>
      <DialogFooter>
        <Button type="button" variant="outline" autoFocus onClick={question.cancel}>{t("common:actions.cancel")}</Button>
        <Button type="button" onClick={question.confirm}>{t("forms:catalog.filters.changeColumn.confirm")}</Button>
      </DialogFooter>
    </DialogContent> : <DialogContent aria-describedby={undefined} onCloseAutoFocus={restoreFocus}>
      <DialogHeader><DialogTitle>{t("forms:catalog.filters.editTitle")}</DialogTitle></DialogHeader>
      <DialogBody className="grid gap-3.5">
        <ConditionFields filters={filters} condition={condition} editable labeled invalid={false} onChange={change} onColumnChange={question.ask} />
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>{t("common:actions.cancel")}</Button>
        <Button type="button" onClick={() => onDone(condition)}>{t("forms:catalog.filters.done")}</Button>
      </DialogFooter>
    </DialogContent>}
  </Dialog>;
}

/** La columna, la comparación y los valores de una condición, en la pieza (262); con `labeled`, cada uno con su rótulo. */
function ConditionFields({ filters, condition, editable, invalid, labeled = false, onChange, onColumnChange }: {
  filters: CatalogFilters; condition: ConditionDraft; editable: boolean; invalid: boolean; labeled?: boolean;
  onChange: (patch: Partial<Omit<ConditionDraft, "key">>) => void;
  /** Otra columna: quien la usa pregunta antes si se pierden valores elegidos. */
  onColumnChange: (change: ColumnChange) => void;
}) {
  const { t } = useTranslation("forms");
  const column = definitionOf(filters, condition.column);
  const columnOptions = [...new Set([...filters.columns.filter((candidate) => candidate.operators.length > 0).map((candidate) => candidate.key), condition.column])]
    .map((key) => ({ value: key, label: columnLabel(t, key) }));
  const operatorOptions = [...new Set([...(column?.operators ?? []), condition.operator])]
    .map((operator) => ({ value: operator, label: operatorLabel(t, condition.column, operator) }));
  const columnPicker = <Picker label={labeled ? undefined : t("forms:catalog.filters.column")} disabled={!editable} value={condition.column} options={columnOptions}
    onChange={(key) => {
      if (key === condition.column) return;
      const next = definitionOf(filters, key);
      if (next) onColumnChange({ column: key, operator: next.operators[0] ?? "", values: next.type === "Boolean" ? ["true"] : [] });
    }} />;
  const operatorPicker = <Picker label={labeled ? undefined : t("forms:catalog.filters.operator")} disabled={!editable} value={condition.operator} options={operatorOptions}
    onChange={(operator) => onChange({ operator })} />;
  const values = <ConditionValues filters={filters} condition={condition} type={column?.type} editable={editable} invalid={invalid} labeled={labeled}
    onChange={(next) => onChange({ values: next })} />;
  if (!labeled) return <>{columnPicker}{operatorPicker}{values}</>;
  return <>
    <FormField label={t("forms:catalog.filters.column")}>{columnPicker}</FormField>
    <FormField label={t("forms:catalog.filters.operator")}>{operatorPicker}</FormField>
    <FormField label={t("forms:catalog.filters.value")}>{values}</FormField>
  </>;
}

interface ValuesProps {
  filters: CatalogFilters;
  condition: ConditionDraft;
  type: FormCatalogSourceColumn["type"] | undefined;
  editable: boolean;
  invalid: boolean;
  labeled: boolean;
  onChange: (values: string[]) => void;
}

/** Los valores: varios roles, empresas o etiquetas del servidor, buscados adentro de la lista; sí o no; o un texto. */
function ConditionValues(props: ValuesProps) {
  const { t } = useTranslation("forms");
  const { condition, editable, invalid, labeled, onChange } = props;
  if (condition.column === "role" || condition.column === "company") return <ReferenceValues {...props} />;
  if (condition.column === "tags") return <TagValues {...props} />;
  const label = labeled ? undefined : valuesLabel(t, condition.column);
  if (props.type === "Boolean" || condition.column === "active") {
    return <Picker label={label} disabled={!editable} aria-invalid={invalid} value={condition.values[0] ?? null}
      options={[{ value: "true", label: t("forms:catalog.filters.yes") }, { value: "false", label: t("forms:catalog.filters.no") }]}
      onChange={(value) => onChange([value])} />;
  }
  return <Input aria-label={label} disabled={!editable} aria-invalid={invalid || undefined} value={condition.values[0] ?? ""} autoComplete="off"
    onChange={(event) => onChange(event.target.value ? [event.target.value] : [])} />;
}

/** Roles o empresas de la organización, por su id; uno que ya no existe se ve como «Rol no disponible», en rojo. */
function ReferenceValues({ filters, condition, editable, invalid, labeled, onChange }: ValuesProps) {
  const { t } = useTranslation("forms");
  const [open, setOpen] = useState(false);
  const query = useResourceOptions(condition.column === "role" ? memberRoleOptions : memberCompanyOptions, open && editable);
  const missing = filters.missingValues(condition);
  return <Picker multiple label={labeled ? undefined : valuesLabel(t, condition.column)} disabled={!editable} aria-invalid={invalid || missing.length > 0}
    className={cn(missing.length > 0 && "text-[var(--peligro)]")}
    value={condition.values} remote={query.remote} onOpenChange={setOpen}
    options={query.items.map((reference) => ({ value: reference.id, label: reference.name }))}
    selectedOptions={condition.values.map((id) => ({ value: id, label: filters.names[id] ?? t(`forms:catalog.filters.missing.${condition.column}`) }))}
    placeholder={t(`forms:catalog.filters.placeholders.${condition.column}`)}
    onChange={(values) => {
      filters.learn(query.knownItems.filter((reference) => values.includes(reference.id)));
      onChange(values);
    }} />;
}

/** Las etiquetas que usan los contactos de la organización: viajan como texto. */
function TagValues({ condition, editable, invalid, labeled, onChange }: ValuesProps) {
  const { t } = useTranslation("forms");
  const [open, setOpen] = useState(false);
  const query = useResourceOptions(contactTagOptions, open && editable);
  return <Picker multiple label={labeled ? undefined : valuesLabel(t, condition.column)} disabled={!editable} aria-invalid={invalid}
    value={condition.values} remote={query.remote} onOpenChange={setOpen}
    options={query.items.map((tag) => ({ value: tag.name, label: tag.name }))}
    selectedOptions={condition.values.map((tag) => ({ value: tag, label: tag }))}
    placeholder={t("forms:catalog.filters.placeholders.tags")}
    onChange={onChange} />;
}
