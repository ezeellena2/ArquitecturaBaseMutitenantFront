import { useMutation } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ArrowUpDown, Download, Plus, RotateCcw, Search, Wand2 } from "lucide-react";
import { Fragment, useId, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { apiErrorMessage, toastActionError } from "@/shared/api/errorMessage";
import { useRetryAfterOf } from "@/shared/api/useRetryAfterCountdown";
import { useFormat } from "@/shared/format/useFormat";
import type { AssistantProposalFieldReview } from "@/shared/assistant-actions";
import { saveBlobAs } from "@/shared/lib/saveFile";
import { cn } from "@/shared/lib/utils";
import { useHiddenColumns } from "@/shared/hooks/useHiddenColumns";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { Banner } from "@/shared/ui/Banner";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { ColumnsMenu } from "@/shared/ui/ColumnsMenu";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { EditableTable, type EditableColumn } from "@/shared/ui/EditableTable";
import { EmptyState } from "@/shared/ui/EmptyState";
import { EmptyValue } from "@/shared/ui/format/EmptyValue";
import { IconButton } from "@/shared/ui/IconButton";
import { PencilIcon, TrashIcon } from "@/shared/ui/icons";
import { InformativeTooltip } from "@/shared/ui/InformativeTooltip";
import { Input } from "@/shared/ui/input";
import { Pagination } from "@/shared/ui/Pagination";
import { RowActions, type RowAction } from "@/shared/ui/RowActions";
import { exportCatalog, fetchCatalogTemplate } from "../../api/catalogs";
import { useCatalogFieldSources } from "../../hooks/useCatalogFieldSources";
import { rowHasErrors, type CatalogEditor, type CatalogRowView, type ItemField, type RowError } from "../../hooks/useCatalogEditor";
import { fieldErrorKey } from "../../lib/catalogDraft";
import { fieldColumnsOf, isFixedSortColumn, sortKindOf, sortOrderKey, type CatalogFieldColumn } from "../../lib/catalogFields";
import { catalogLimits } from "../../lib/catalogLimits";
import { CatalogFieldsDialog } from "./CatalogFieldsDialog";
import { FieldValueControl, FieldValueText, LockedFieldValue } from "./CatalogCells";
import { OptionsDialog, type OptionsDialogOpening } from "./OptionsDialog";
import { SortDialog } from "./SortDialog";

async function saveResponse(response: Response, fallback: string) {
  const disposition = response.headers.get("content-disposition") ?? "";
  const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(disposition);
  const name = match ? decodeURIComponent(match[1] ?? match[2]) : fallback;
  saveBlobAs(await response.blob(), name);
}

/**
 * «Opciones» de un catálogo a mano (FRM-Catalogo y M-FRM-Catalogo): «+ Agregar opción», «Importar», «Exportar» y el ⋮ con
 * la plantilla, «Ordenar por…» y los códigos que faltan; abajo, «Buscar opción». En la compu, la tabla editable con la
 * selección, el Estado como casilla y ↑ ↓ ✎ 🗑 a la vista; «Restaurar» y «Reactivar», en el ⋮ de la fila (261). Con solo
 * `formcatalogs.read` o dado de baja, la tabla de lectura, con Exportar y la plantilla. Lo apagado dice por qué (116).
 * «Agregar opción» y ✎ abren el modal de opciones; si guardar encuentra un error, se abre en la primera con problemas (117).
 * Con una propuesta del asistente, `rowReview` marca «Revisá» en el texto de cada opción dudosa, con su motivo debajo
 * (FRM-Catalogo-Opciones-Propuesta).
 *
 * Desde la E13 (FRM-Catalogo-13 y M-FRM-Catalogo-13): «Agregar campos · N» abre «Campos de …» (quien solo lee ve «Campos»,
 * si hay), y cada campo es una columna después del código y antes del detalle, con el control de su tipo; «Columnas», la
 * pieza múltiple (262), las oculta, con lo elegido en la URL. La de un campo nuevo queda grisada hasta guardar, con su motivo.
 * Lo que el servidor rechazó de un campo (cambiar el tipo, una regla) se dice arriba de la tabla, con «Revisar», y cada opción
 * que no entra, en su celda: la pantalla no frena antes de mandar (lección 4).
 */
export function OptionsSection({ editor, editable, isNew, onImport, rowReview }: {
  editor: CatalogEditor;
  editable: boolean;
  isNew: boolean;
  onImport?: () => void;
  rowReview?: (row: CatalogRowView) => AssistantProposalFieldReview | undefined;
}) {
  const { t } = useTranslation(["forms", "common"]);
  const format = useFormat();
  const { phone } = useAppChrome();
  const titleId = useId();
  const [sortOpen, setSortOpen] = useState(false);
  const [sortTrigger, setSortTrigger] = useState<HTMLElement | null>(null);
  const [deleting, setDeleting] = useState<CatalogRowView | null>(null);
  const [dialog, setDialog] = useState<OptionsDialogOpening | null>(null);
  // «Campos de …», con el campo que se ve al abrir («Revisar» abre el que rechazó el servidor).
  const [fieldsDialog, setFieldsDialog] = useState<{ initialKey: string | null } | null>(null);
  const [errorRound, setErrorRound] = useState(editor.errorRound);
  const { saved, valueType, rows } = editor;
  const retryLimit = useRetryAfterOf(editor.items.error);
  const typed = valueType !== "Text";
  const fieldColumns = fieldColumnsOf(editor.fields, saved?.fields ?? []);
  const { hidden, setHidden } = useHiddenColumns();
  const shownColumns = fieldColumns.filter((column) => !hidden.includes(column.field.localKey));
  const sourceItem = useCatalogFieldSources(saved?.fields ?? [], rows);

  // Guardar encontró un error en las opciones: el modal se abre en la primera con problemas, y la lista las marca (117).
  if (editor.errorRound !== errorRound) {
    setErrorRound(editor.errorRound);
    const first = rows.find(rowHasErrors);
    if (editable && first) setDialog({ mode: "edit", key: first.key, snapshot: editor.takeSnapshot(), startOnList: true });
  }

  const openAdd = () => {
    const snapshot = editor.takeSnapshot();
    setDialog({ mode: "add", key: editor.add(), snapshot });
  };
  const openEdit = (key: string) => setDialog({ mode: "edit", key, snapshot: editor.takeSnapshot() });

  const importReason = isNew ? t("forms:catalog.reasons.saveFirst")
    : editor.full ? t("forms:catalog.reasons.full")
      : editor.isDirty ? t("forms:catalog.reasons.saveBeforeImport") : undefined;
  const sortReason = isNew ? t("forms:catalog.reasons.saveFirst") : editor.moves.length ? t("forms:catalog.reasons.discardMovesFirst") : undefined;
  const deleteReason = editor.moves.length || editor.sort ? t("forms:catalog.reasons.orderPending") : undefined;
  // «Ordenar por…» un campo (224): «Texto», «Código» o el nombre de un campo guardado, con el sentido de su tipo.
  const savedFields = editor.saved?.fields ?? [];
  const sortColumnLabel = (column: string | null | undefined) => !column ? "" : isFixedSortColumn(column)
    ? t(`forms:catalog.sort.columns.${column.toLowerCase() === "code" ? "Code" : "Text"}`) : savedFields.find((field) => field.id === column)?.name ?? column;
  const moveReason = editor.deletes.size ? t("forms:catalog.reasons.deletePending") : undefined;

  // Exportar y la plantilla: red, 5xx y 429 los avisa el MutationCache; un rechazo de negocio (sin permiso, el módulo
  // apagado), un aviso (errores).
  const download = useMutation({
    mutationFn: async (kind: "export" | "template") => {
      if (kind === "export" && saved) await saveResponse(await exportCatalog(saved.id), `${saved.name}.xlsx`);
      else await saveResponse(await fetchCatalogTemplate(valueType), `${t("forms:catalog.templateFile")}.xlsx`);
    },
    onError: (error) => toastActionError(error, t),
  });

  const moreActions: RowAction[] = [
    { label: t("forms:catalog.actions.template"), accessibleName: t("forms:catalog.actions.template"), icon: Download, onSelect: () => download.mutate("template") },
    { label: t("forms:catalog.actions.sort"), accessibleName: t("forms:catalog.actions.sort"), icon: ArrowUpDown, hidden: !editable, disabledReason: sortReason, onSelect: (trigger) => { setSortTrigger(trigger); setSortOpen(true); } },
    { label: t("forms:catalog.actions.generateCodes"), accessibleName: t("forms:catalog.actions.generateCodes"), icon: Wand2, hidden: !editable, onSelect: editor.generateMissingCodes },
  ];

  // «Agregar campos · N» cuenta los activos y se pone en rojo si el servidor rechazó uno; quien solo lee ve «Campos», si hay.
  const fieldCount = editor.fields.fields.length;
  const fieldsRejected = editor.fields.fields.some((field) => Object.values(field.errors ?? {}).some(Boolean));
  const fieldsButton = editable || fieldCount > 0
    ? <Button type="button" size="sm" variant="outline" onClick={() => setFieldsDialog({ initialKey: null })}
      aria-label={t(editable ? "forms:catalog.fieldsButton.addLabel" : "forms:catalog.fieldsButton.readLabel", { n: format.formatInteger(fieldCount) })}
      className={cn(fieldsRejected && "border-[var(--peligro)] text-[var(--peligro)]")}>
      {t(editable ? "forms:catalog.fieldsButton.add" : "forms:catalog.fieldsButton.read")}
      {fieldCount ? <span aria-hidden="true" className="rounded-full bg-[var(--s3)] px-1.5 text-[0.71875rem] font-semibold tabular-nums">{format.formatInteger(fieldCount)}</span> : null}
    </Button> : null;

  const header = <div className="flex flex-wrap items-center gap-2 border-b border-[var(--borde)] px-4 py-3 max-md:px-3.5">
    <h2 id={titleId} className="mr-auto text-[0.875rem] font-semibold text-[var(--t1)]">{t("forms:catalog.options")}</h2>
    {editable ? <>
      <Button type="button" size="sm" onClick={openAdd} disabledReason={editor.full ? t("forms:catalog.reasons.full") : undefined}>
        <Plus aria-hidden="true" className="size-4" />{t("forms:catalog.actions.add")}
      </Button>
      {fieldsButton}
      {phone ? null : <Button type="button" size="sm" variant="outline" onClick={onImport} disabledReason={importReason}>{t("forms:catalog.actions.import")}</Button>}
    </> : fieldsButton}
    <Button type="button" size="sm" variant="outline" onClick={() => download.mutate("export")} disabledReason={isNew ? t("forms:catalog.reasons.saveFirst") : undefined}>{t("forms:catalog.actions.export")}</Button>
    <RowActions label={t("forms:catalog.actions.more")} title={t("forms:catalog.options")} actions={moreActions} />
  </div>;

  // Lo que el servidor rechazó de un campo: «Zona» · Tipo: 1.097 opciones tienen un valor que no es un número entero.
  // «Revisar» abre «Campos de …» en ese campo (FRM-Catalogo-13, «Cambiar el tipo con errores»).
  const issue = editor.fieldIssue;
  const issueField = issue ? editor.fields.fields.find((field) => field.localKey === issue.localKey) : undefined;
  const issuePart = issue?.part && ["name", "key", "type"].includes(issue.part) ? t(`forms:catalog.fieldsDialog.labels.${issue.part}`)
    : issue?.part === "required" ? t("forms:catalog.fieldsDialog.labels.rules") : null;
  const fieldIssue = issue && issueField
    ? <Banner tone="danger" className="mx-4 mt-3" action={<Button type="button" size="sm" variant="outline" onClick={() => setFieldsDialog({ initialKey: issue.localKey })}>{t("forms:catalog.fieldIssue.review")}</Button>}>
      {issuePart ? t("forms:catalog.fieldIssue.withPart", { field: issueField.name, part: issuePart, message: issue.message })
        : t("forms:catalog.fieldIssue.plain", { field: issueField.name, message: issue.message })}
    </Banner> : null;

  const pending = <>
    {editor.moves.length ? <Banner role="status" tone="info" className="mx-4 mt-3" action={<Button type="button" size="sm" variant="outline" onClick={editor.discardMoves}>{t("forms:catalog.pending.discardMoves")}</Button>}>
      {t("forms:catalog.pending.moves", { count: editor.moves.length, n: format.formatInteger(editor.moves.length) })}
    </Banner> : null}
    {editor.sort ? <Banner role="status" tone="info" className="mx-4 mt-3" action={<Button type="button" size="sm" variant="outline" onClick={editor.cancelSort}>{t("forms:catalog.pending.cancelSort")}</Button>}>
      {t("forms:catalog.pending.sort", { column: sortColumnLabel(editor.sort.column), order: t(sortOrderKey(sortKindOf(editor.sort.column ?? "", savedFields), editor.sort.descending === true, true)) })}
    </Banner> : null}
    {fieldIssue}
  </>;

  const selection = editable && editor.selected.size ? <div className="mx-4 mt-3 flex flex-wrap items-center gap-2 text-[0.8125rem]">
    <span className="mr-auto font-semibold">{t("forms:catalog.selection.count", { count: editor.selected.size, n: format.formatInteger(editor.selected.size) })}</span>
    <Button type="button" size="sm" variant="outline" onClick={() => editor.setActive(editor.selected, false)}>{t("forms:catalog.selection.deactivate")}</Button>
    <Button type="button" size="sm" variant="outline" onClick={() => editor.setActive(editor.selected, true)}>{t("forms:catalog.selection.reactivate")}</Button>
    <Button type="button" size="sm" variant="link" onClick={editor.clearSelection}>{t("forms:catalog.selection.clear")}</Button>
  </div> : null;

  const searchBox = isNew ? null : <div className="relative min-w-0 max-w-[22rem] flex-1">
    <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-[var(--t3)]" />
    <Input type="search" aria-label={t("forms:catalog.search")} placeholder={t("forms:catalog.search")} value={editor.searchInput}
      onChange={(event) => editor.setSearchInput(event.target.value)} className="pl-8" />
  </div>;
  // «Columnas» al lado de la búsqueda, con una casilla por campo: las columnas fijas siempre se ven (262).
  const columnsMenu = fieldColumns.length ? <ColumnsMenu hidden={hidden} onHiddenChange={setHidden}
    columns={fieldColumns.map((column) => ({ id: column.field.localKey, label: column.field.name || t("forms:catalog.fieldsDialog.noName") }))} /> : null;
  const toolbar = searchBox || columnsMenu ? <div className="mx-4 my-3 flex flex-wrap items-center gap-2 max-md:mx-3.5">{searchBox}{columnsMenu}</div> : null;

  const label = (row: CatalogRowView) => row.draft.text.trim() || t("forms:catalog.newOption");
  // El error de una celda describe su campo (aria-describedby), como en FormField (accesibilidad).
  const errorId = (row: CatalogRowView, field: keyof RowError) => `${titleId}-${row.key}-${field}-error`;
  const fieldError = (row: CatalogRowView, field: keyof RowError) => row.errors[field]
    ? <span id={errorId(row, field)} role="alert" className="mt-1 block text-[0.75rem] text-[var(--peligro)]">{row.errors[field]}</span> : null;

  // El código y el detalle llevan el tope del contrato: al llegar, no se escribe más (269 y O13); el texto lo dice su contador.
  const maxLengths: Partial<Record<ItemField, number>> = { code: catalogLimits.itemCode, detail: catalogLimits.itemDetail };
  const cellInput = (row: CatalogRowView, field: Exclude<ItemField, never>, extra?: ReactNode, inputClassName?: string) => <div className="min-w-0 py-1.5">
    <div className="flex items-center gap-1.5">
      <Input value={row.draft[field]} aria-label={t(`forms:catalog.cells.${field}`, { option: label(row) })} aria-invalid={Boolean(row.errors[field]) || undefined}
        aria-describedby={row.errors[field] ? errorId(row, field) : undefined} disabled={row.pendingDelete} maxLength={maxLengths[field]}
        className={cn(field === "code" && "font-mono", field === "value" && "text-right tabular-nums", inputClassName)}
        onChange={(event) => editor.edit(row.key, { [field]: event.target.value })} />
      {extra}
    </div>
    {fieldError(row, field)}
  </div>;

  const rowMenu = (row: CatalogRowView): RowAction[] => [
    { label: t("forms:catalog.actions.restore"), accessibleName: t("forms:catalog.actions.restoreOption", { option: label(row) }), icon: RotateCcw, hidden: !row.pendingDelete, onSelect: () => editor.restore(row.key) },
    { label: t("forms:catalog.actions.reactivate"), accessibleName: t("forms:catalog.actions.reactivateOption", { option: label(row) }), icon: RotateCcw, hidden: row.pendingDelete || row.draft.isActive, onSelect: () => editor.edit(row.key, { isActive: true }) },
  ];

  const actions = (row: CatalogRowView) => {
    const moveDisabled = row.isNew ? t("forms:catalog.reasons.saveToMove") : moveReason;
    const menu = rowMenu(row);
    return <span className="inline-flex items-center justify-end gap-0.5">
      <IconButton label={t("forms:catalog.actions.up", { option: label(row) })} onClick={() => editor.move(row.key, "Up")}
        disabledReason={moveDisabled} disabled={!moveDisabled && !row.canMoveUp}><ArrowUp aria-hidden="true" className="size-4" /></IconButton>
      <IconButton label={t("forms:catalog.actions.down", { option: label(row) })} onClick={() => editor.move(row.key, "Down")}
        disabledReason={moveDisabled} disabled={!moveDisabled && !row.canMoveDown}><ArrowDown aria-hidden="true" className="size-4" /></IconButton>
      <IconButton label={t("forms:catalog.actions.edit", { option: label(row) })} onClick={() => openEdit(row.key)}><PencilIcon aria-hidden="true" className="size-4" /></IconButton>
      {row.pendingDelete ? null : row.isNew
        ? <IconButton label={t("forms:catalog.actions.removeNew", { option: label(row) })} onClick={() => editor.remove(row.key)}><TrashIcon aria-hidden="true" className="size-4" /></IconButton>
        : <IconButton label={t("forms:catalog.actions.delete", { option: label(row) })} disabledReason={deleteReason} onClick={() => setDeleting(row)}><TrashIcon aria-hidden="true" className="size-4" /></IconButton>}
      {menu.some((action) => !action.hidden) ? <RowActions label={t("forms:catalog.actions.rowMore", { option: label(row) })} title={label(row)} actions={menu} /> : null}
    </span>;
  };

  const status = (row: CatalogRowView) => row.pendingDelete
    ? <span className="text-[0.75rem] text-[var(--peligro)]">{t("forms:catalog.deleteOnSave")}</span>
    : <Checkbox checked={row.draft.isActive} aria-label={t("forms:catalog.cells.active", { option: label(row) })} onCheckedChange={(checked) => editor.edit(row.key, { isActive: checked === true })} />;

  // La columna de un campo: su control, o grisada hasta guardar el catálogo con su motivo, y debajo lo que rechazó el servidor.
  const lockedReason = t("forms:catalog.fieldValues.saveFirst");
  const fieldName = (column: CatalogFieldColumn) => column.field.name || t("forms:catalog.fieldsDialog.noName");
  const numericColumn = (column: CatalogFieldColumn) => column.field.type === "WholeNumber" || column.field.type === "DecimalNumber";
  const fieldHeader = (column: CatalogFieldColumn) => {
    if (column.editable) return <span className="break-words">{fieldName(column)}</span>;
    const reasonId = `${titleId}-${column.field.localKey}-locked`;
    return <>
      <InformativeTooltip text={lockedReason}>
        <span tabIndex={0} aria-disabled="true" aria-describedby={reasonId} className="cursor-not-allowed break-words text-[var(--t3)]">{fieldName(column)}</span>
      </InformativeTooltip>
      <span id={reasonId} hidden>{lockedReason}</span>
    </>;
  };
  const fieldCell = (row: CatalogRowView, column: CatalogFieldColumn) => {
    const cellLabel = t("forms:catalog.cells.field", { field: fieldName(column), option: label(row) });
    const errorKey = column.field.id ? fieldErrorKey(column.field.id) : null;
    const error = errorKey ? row.errors[errorKey] : undefined;
    const describedBy = errorKey && error ? errorId(row, errorKey) : undefined;
    const detail = column.detail;
    return <div className="min-w-0 py-1.5">
      {column.editable && detail
        ? <FieldValueControl field={detail} value={row.draft.fields?.[detail.id] ?? null} sourceItem={sourceItem} label={cellLabel} invalid={Boolean(error)}
          describedBy={describedBy} disabled={row.pendingDelete} onChange={(value) => editor.edit(row.key, { fields: { [detail.id]: value } })} />
        : <LockedFieldValue reason={lockedReason} label={cellLabel} describedBy={describedBy} />}
      {errorKey ? fieldError(row, errorKey) : null}
    </div>;
  };
  const fieldText = (row: CatalogRowView, column: CatalogFieldColumn) => column.detail
    ? <FieldValueText field={column.detail} value={row.draft.fields?.[column.detail.id] ?? null} sourceItem={sourceItem} /> : <EmptyValue />;
  const editableFieldColumns: EditableColumn<CatalogRowView>[] = shownColumns.map((column) => ({
    id: `field-${column.field.localKey}`, minWidth: "9rem", header: fieldHeader(column), type: numericColumn(column) ? "number" as const : undefined,
    cell: (row: CatalogRowView) => fieldCell(row, column),
  }));
  const readFieldColumns: EditableColumn<CatalogRowView>[] = shownColumns.map((column) => ({
    id: `field-${column.field.localKey}`, minWidth: "9rem", header: fieldName(column), type: numericColumn(column) ? "number" as const : undefined,
    cell: (row: CatalogRowView) => fieldText(row, column),
  }));

  const pageKeys = rows.filter((row) => !row.pendingDelete).map((row) => row.key);
  const allChosen = pageKeys.length > 0 && pageKeys.every((key) => editor.selected.has(key));
  const someChosen = pageKeys.some((key) => editor.selected.has(key));
  // Una nueva todavía no tiene número: «—» con EmptyValue, tenue y «Sin dato» para el lector (formatos).
  const number = (row: CatalogRowView) => row.number == null ? <EmptyValue /> : format.formatInteger(row.number);

  const editableColumns: EditableColumn<CatalogRowView>[] = [
    { id: "select", width: "2.75rem", pinned: "left",
      header: <Checkbox checked={allChosen ? true : someChosen ? "indeterminate" : false} aria-label={t("forms:catalog.selection.page")} onCheckedChange={(checked) => editor.selectPage(checked === true)} />,
      cell: (row) => row.pendingDelete ? null : <Checkbox checked={editor.selected.has(row.key)} aria-label={t("forms:catalog.selection.one", { option: label(row) })} onCheckedChange={() => editor.toggleSelected(row.key)} /> },
    { id: "number", width: "3.25rem", pinned: "left", type: "number", header: "#", cell: number },
    { id: "text", minWidth: "12rem", pinned: "left", header: t("forms:catalog.columns.text"),
      cell: (row) => {
        const doubt = rowReview?.(row);
        return <div>
          {cellInput(row, "text", <>
            {doubt?.adornment}
            <small className={cn("shrink-0 tabular-nums text-[var(--t3)]", row.draft.text.length > catalogLimits.itemText && "text-[var(--peligro)]")}>{`${format.formatInteger(row.draft.text.length)}/${format.formatInteger(catalogLimits.itemText)}`}</small>
          </>, doubt?.className)}
          {doubt?.warning ? <span role="status" className="-mt-1 mb-1 block text-[0.75rem] text-[var(--alerta)]">{doubt.warning}</span> : null}
          {row.textRepeated && !row.errors.text ? <span className="-mt-1 mb-1 block text-[0.75rem] text-[var(--alerta)]">{t("forms:catalog.warnings.textRepeated")}</span> : null}
          {fieldError(row, "row")}
        </div>;
      } },
    { id: "code", minWidth: "6rem", header: t("forms:catalog.columns.code"), cell: (row) => cellInput(row, "code") },
    ...(typed ? [{ id: "value", minWidth: "8rem", header: t("forms:catalog.columns.value"), type: valueType === "Date" ? undefined : "number" as const, cell: (row: CatalogRowView) => cellInput(row, "value") }] : []),
    ...editableFieldColumns,
    { id: "detail", minWidth: "12rem", header: t("forms:catalog.columns.detail"), cell: (row) => cellInput(row, "detail") },
    { id: "status", width: "6.5rem", header: t("forms:catalog.columns.status"), cell: status },
    { id: "actions", width: "11rem", pinned: "right", type: "actions", header: t("forms:catalog.columns.actions"), cell: actions },
  ];

  const readColumns: EditableColumn<CatalogRowView>[] = [
    { id: "number", width: "3.25rem", type: "number", header: "#", cell: number },
    { id: "text", minWidth: "12rem", header: t("forms:catalog.columns.text"), cell: (row) => <span className="break-words">{row.draft.text}</span> },
    { id: "code", minWidth: "6rem", header: t("forms:catalog.columns.code"), cell: (row) => <span className="font-mono">{row.draft.code}</span> },
    ...(typed ? [{ id: "value", minWidth: "8rem", header: t("forms:catalog.columns.value"), type: valueType === "Date" ? undefined : "number" as const, cell: (row: CatalogRowView) => row.draft.value }] : []),
    ...readFieldColumns,
    { id: "detail", minWidth: "12rem", header: t("forms:catalog.columns.detail"), cell: (row) => row.draft.detail.trim() ? <span className="break-words">{row.draft.detail}</span> : <EmptyValue /> },
    { id: "status", width: "6.5rem", header: t("forms:catalog.columns.status"), cell: (row) => t(row.draft.isActive ? "forms:catalog.status.active" : "forms:catalog.status.inactive") },
  ];

  const phoneList = <ul className="flex flex-col">
    {rows.map((row) => { const doubt = rowReview?.(row); return <li key={row.key} className="flex flex-col gap-1 border-b border-[var(--borde)] px-3.5 py-3 text-[0.90625rem]">
      <div className="flex items-start gap-2">
        <span className="w-6 shrink-0 text-[var(--t3)] tabular-nums">{number(row)}</span>
        <span className="min-w-0 flex-1 break-words font-medium">{row.draft.text || t("forms:catalog.newOption")}{doubt ? <span className="ml-2 align-[1px]">{doubt.adornment}</span> : null}</span>
        {editable ? actions(row) : null}
      </div>
      {doubt?.warning ? <span role="status" className="ml-8 text-[0.8125rem] text-[var(--alerta)]">{doubt.warning}</span> : null}
      <dl className="ml-8 grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 text-[0.8125rem]">
        <dt className="text-[var(--t3)]">{t("forms:catalog.columns.code")}</dt><dd className="font-mono">{row.draft.code || t("forms:catalog.noCode")}</dd>
        {typed ? <><dt className="text-[var(--t3)]">{t("forms:catalog.columns.value")}</dt><dd>{row.draft.value}</dd></> : null}
        {shownColumns.map((column) => <Fragment key={column.field.localKey}>
          <dt className="text-[var(--t3)]">{fieldName(column)}</dt><dd className="min-w-0">{fieldText(row, column)}</dd>
        </Fragment>)}
        {row.pendingDelete ? <><dt className="text-[var(--t3)]">{t("forms:catalog.columns.status")}</dt><dd className="text-[var(--peligro)]">{t("forms:catalog.deleteOnSave")}</dd></>
          : !row.draft.isActive ? <><dt className="text-[var(--t3)]">{t("forms:catalog.columns.status")}</dt><dd>{t("forms:catalog.status.inactive")}</dd></> : null}
      </dl>
      {fieldError(row, "row")}
    </li>; })}
  </ul>;

  const empty = rows.length === 0;
  const pageData = editor.items.data;
  // Las opciones que no cargaron se dicen una vez, en su lugar, con «Reintentar» (que espera la cuenta de un 429).
  const loadError = editor.items.isError
    ? <EmptyState framed={false} title={t("forms:catalog.itemsLoadError")} description={apiErrorMessage(editor.items.error, t)}
      action={<Button type="button" variant="outline" disabled={retryLimit.isRunning} onClick={() => { void editor.items.refetch(); }}>{retryLimit.label ?? t("common:actions.retry")}</Button>} />
    : null;
  return <section aria-labelledby={titleId} className="overflow-hidden rounded-lg border border-[var(--borde)] bg-[var(--superficie)] max-md:rounded-none max-md:border-x-0">
    {header}
    {pending}
    {selection}
    {toolbar}
    {loadError ?? (empty && !editor.items.isPending
      ? <p className="px-4 py-6 text-center text-[0.8125rem] text-[var(--t3)]">{editor.searching ? t("forms:catalog.noMatches") : t("forms:catalog.noOptions")}</p>
      : phone ? phoneList
        : <EditableTable columns={editable ? editableColumns : readColumns} rows={rows} rowKey={(row) => row.key} />)}
    {pageData && pageData.totalCount > 0 ? <Pagination page={pageData.page} pageSize={pageData.pageSize} totalCount={pageData.totalCount} totalPages={pageData.totalPages ?? 1}
      hasPrevious={pageData.hasPrevious ?? false} hasNext={pageData.hasNext ?? false} onPageChange={editor.setPage} onPageSizeChange={editor.setPageSize} /> : null}
    {dialog ? <OptionsDialog editor={editor} opening={dialog} sourceItem={sourceItem} onClose={() => setDialog(null)} /> : null}
    {fieldsDialog ? <CatalogFieldsDialog catalogId={saved?.id ?? null} catalogName={editor.name} value={editor.fields} removedKeys={editor.removedFieldKeys}
      presentation={saved?.presentation} readOnly={!editable} initialKey={fieldsDialog.initialKey} onDone={editor.setFields} onClose={() => setFieldsDialog(null)} /> : null}
    <SortDialog open={sortOpen} initial={editor.sort} fields={savedFields} returnFocusTo={sortTrigger} onOpenChange={setSortOpen} onSort={editor.setSort} />
    <ConfirmDialog open={deleting !== null} onOpenChange={(open) => { if (!open) setDeleting(null); }}
      title={t("forms:catalog.deleteDialog.title", { option: deleting ? label(deleting) : "" })} description={t("forms:catalog.deleteDialog.description")}
      confirmLabel={t("forms:catalog.deleteDialog.confirm")} destructive onConfirm={() => { if (deleting) editor.remove(deleting.key); setDeleting(null); }} />
  </section>;
}

