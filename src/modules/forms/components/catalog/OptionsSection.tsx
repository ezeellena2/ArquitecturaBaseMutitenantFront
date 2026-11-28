import { ArrowDown, ArrowUp, Plus, RotateCcw, Search } from "lucide-react";
import { Fragment, useId, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import { useRetryAfterOf } from "@/shared/api/useRetryAfterCountdown";
import { useFormat } from "@/shared/format/useFormat";
import type { AssistantProposalFieldReview } from "@/shared/assistant-actions";
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
import { StatusDot } from "@/shared/ui/StatusDot";
import { useCatalogFieldSources } from "../../hooks/useCatalogFieldSources";
import { rowHasErrors, type CatalogEditor, type CatalogRowView, type ItemField, type RowError } from "../../hooks/useCatalogEditor";
import type { OptionsActions } from "../../hooks/useOptionsActions";
import { fieldErrorKey } from "../../lib/catalogDraft";
import { fieldColumnsOf, isFixedSortColumn, sortKindOf, sortOrderKey, type CatalogFieldColumn } from "../../lib/catalogFields";
import { catalogLimits } from "../../lib/catalogLimits";
import { CatalogFieldsDialog } from "./CatalogFieldsDialog";
import { FieldValueControl, FieldValueText, LockedFieldValue } from "./CatalogCells";
import { OptionsDialog, type OptionsDialogOpening } from "./OptionsDialog";

/**
 * «Opciones» de un catálogo a mano (FRM-Catalogo y M-FRM-Catalogo). En la compu, la caja con el encabezado arena: «+ Agregar
 * opción», «Importar» y «Exportar» de contorno y el ⋮ con la plantilla, «Ordenar por…» y los códigos que faltan; debajo,
 * «Buscar opción», la franja de las elegidas y la tabla editable, con la selección, el Estado como casilla y ↑ ↓ ✎ 🗑 a la
 * vista; «Restaurar» y «Reactivar», en el ⋮ de la fila (261). En el teléfono, el título gris con «Agregar opción» y «Agregar
 * campos · N» debajo, dos botones iguales, y la lista en una tarjeta; lo demás va en el ⋮ de la banda (`useOptionsActions`). Con solo `formcatalogs.read` o dado de
 * baja, la tabla de lectura. Un movimiento o un orden pendiente es una franja suelta, arriba de la caja. Lo apagado dice por
 * qué (116). «Agregar opción» y ✎ abren el modal de opciones; si guardar encuentra un error, se abre en la primera con
 * problemas (117). Con una propuesta del asistente, `rowReview` marca «Revisá» adentro del texto de cada opción dudosa, con su
 * motivo debajo (FRM-Catalogo-Opciones-Propuesta).
 *
 * Desde la E13 (FRM-Catalogo-13 y M-FRM-Catalogo-13): «Agregar campos · N» abre «Campos de …» (quien solo lee ve «Campos»,
 * si hay), y cada campo es una columna después del código y antes del detalle, con el control de su tipo; «Columnas», la
 * pieza múltiple (262), las oculta, con lo elegido en la URL. La de un campo nuevo queda grisada hasta guardar, con su motivo.
 * Lo que el servidor rechazó de un campo (cambiar el tipo, una regla) se dice arriba de la tabla, con «Revisar», y cada opción
 * que no entra, en su celda: la pantalla no frena antes de mandar (lección 4).
 */
export function OptionsSection({ editor, editable, isNew, actions, onImport, rowReview }: {
  editor: CatalogEditor;
  editable: boolean;
  isNew: boolean;
  actions: OptionsActions;
  onImport?: () => void;
  rowReview?: (row: CatalogRowView) => AssistantProposalFieldReview | undefined;
}) {
  const { t } = useTranslation(["forms", "common"]);
  const format = useFormat();
  const { phone } = useAppChrome();
  const titleId = useId();
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
  const deleteReason = editor.moves.length || editor.sort ? t("forms:catalog.reasons.orderPending") : undefined;
  // «Ordenar por…» un campo (224): «Texto», «Código» o el nombre de un campo guardado, con el sentido de su tipo.
  const savedFields = editor.saved?.fields ?? [];
  const sortColumnLabel = (column: string | null | undefined) => !column ? "" : isFixedSortColumn(column)
    ? t(`forms:catalog.sort.columns.${column.toLowerCase() === "code" ? "Code" : "Text"}`) : savedFields.find((field) => field.id === column)?.name ?? column;
  // Con un borrado o un orden pendiente, ↑ ↓ quedan apagados en todas las filas (FRM-Catalogo-Ordenar, «Orden pendiente»).
  const moveReason = editor.deletes.size ? t("forms:catalog.reasons.deletePending") : editor.sort ? t("forms:catalog.reasons.sortPending") : undefined;
  const fullReason = editor.full ? t("forms:catalog.reasons.full") : undefined;

  // «+ Agregar campos · N» (FRM-Catalogo-13, .k-cont) cuenta los activos, y si el servidor rechazó uno, el número va en rojo;
  // quien solo lee ve «Campos», si hay. En el teléfono, sin el «+», como «Agregar opción» a su lado (M-FRM-Catalogo-13).
  const fieldCount = editor.fields.fields.length;
  const fieldsRejected = editor.fields.fields.some((field) => Object.values(field.errors ?? {}).some(Boolean));
  const phoneButton = "h-11 px-3.5 text-[0.875rem] font-semibold";
  const fieldsButton = editable || fieldCount > 0
    ? <Button type="button" size="sm" variant="outline" onClick={() => setFieldsDialog({ initialKey: null })} className={cn(phone && phoneButton)}
      aria-label={t(editable ? "forms:catalog.fieldsButton.addLabel" : "forms:catalog.fieldsButton.readLabel", { n: format.formatInteger(fieldCount) })}>
      {editable && !phone ? <Plus aria-hidden="true" className="size-4" /> : null}
      {t(editable ? "forms:catalog.fieldsButton.add" : "forms:catalog.fieldsButton.read")}
      {fieldCount ? <span aria-hidden="true" data-rejected={fieldsRejected || undefined}
        className={cn("rounded-full px-1.5 text-[0.71875rem] font-semibold tabular-nums", fieldsRejected ? "bg-[var(--peligro-t)] text-[var(--peligro)]" : "bg-[var(--s3)] text-[var(--t2)]")}>
        {format.formatInteger(fieldCount)}</span> : null}
    </Button> : null;

  const header = phone
    // M-FRM-Catalogo-13: el título gris y, debajo, «Agregar opción» y «Agregar campos · N», dos botones iguales; lo demás va
    // en el ⋮ de la banda.
    ? <div className="mt-1.5 mb-2.5 flex flex-col gap-2 leading-[normal]">
      <h2 id={titleId} className="px-1 text-[0.84375rem] font-semibold text-[var(--t2)]">{t("forms:catalog.options")}</h2>
      {editable || fieldsButton ? <div className="flex flex-wrap gap-2">
        {editable ? <Button type="button" size="sm" variant="outline" onClick={openAdd} disabledReason={fullReason} className={phoneButton}>{t("forms:catalog.actions.add")}</Button> : null}
        {fieldsButton}
      </div> : null}
    </div>
    // FRM-Catalogo: el encabezado arena de las cajas, como «El catálogo»; el único botón principal es «Guardar cambios».
    : <header className="flex min-h-10 flex-wrap items-center gap-1.5 border-b border-[var(--borde-cab)] bg-[var(--cab)] py-1 pr-1 pl-4">
      <h2 id={titleId} className="mr-auto text-[0.8125rem] font-semibold text-[var(--t1)]">{t("forms:catalog.options")}</h2>
      {editable ? <>
        <Button type="button" size="sm" variant="outline" onClick={openAdd} disabledReason={fullReason}>
          <Plus aria-hidden="true" className="size-4" />{t("forms:catalog.actions.add")}
        </Button>
        {fieldsButton}
        <Button type="button" size="sm" variant="outline" onClick={onImport} disabledReason={importReason}>{t("forms:catalog.actions.import")}</Button>
      </> : fieldsButton}
      <Button type="button" size="sm" variant="outline" onClick={actions.exportCatalog} disabledReason={actions.exportAction.disabledReason}>{t("forms:catalog.actions.export")}</Button>
      <RowActions label={t("forms:catalog.actions.more")} title={t("forms:catalog.options")} actions={actions.more} />
    </header>;

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

  // Un movimiento o un orden pendiente (FRM-Catalogo y FRM-Catalogo-Ordenar, .k-aviso-f): una franja suelta, blanca y sin
  // ícono, entre «El catálogo» y «Opciones», con su acción a la derecha.
  const strip = (text: string, action: ReactNode) => <div role="status"
    className="flex items-center justify-between gap-3 rounded-[0.75rem] border border-[var(--borde)] bg-[var(--superficie)] px-4 py-3 text-[0.875rem] text-[var(--t1)] max-md:rounded-[0.875rem] max-md:px-3.5 max-md:text-[0.9375rem]">
    <span className="min-w-0">{text}</span>
    <span className="shrink-0">{action}</span>
  </div>;
  const pending = <>
    {editor.moves.length ? strip(t("forms:catalog.pending.moves", { count: editor.moves.length, n: format.formatInteger(editor.moves.length) }),
      <Button type="button" size="sm" variant="outline" onClick={editor.discardMoves}>{t("forms:catalog.pending.discardMoves")}</Button>) : null}
    {editor.sort ? strip(t("forms:catalog.pending.sort", { column: sortColumnLabel(editor.sort.column), order: t(sortOrderKey(sortKindOf(editor.sort.column ?? "", savedFields), editor.sort.descending === true, true)) }),
      <Button type="button" size="sm" variant="outline" onClick={editor.cancelSort}>{t("forms:catalog.pending.cancelSort")}</Button>) : null}
  </>;

  // FRM-Catalogo, «Varias elegidas» (.k-sel): debajo del buscador, pegada a la tabla, con el tinte de la marca a lo ancho.
  const selection = editable && editor.selected.size ? <div className="flex flex-wrap items-center gap-2.5 border-t border-[var(--borde)] bg-[var(--marca-t)] px-4 py-2 text-[0.84375rem] font-semibold text-[var(--marca-tx)]">
    <span className="mr-auto">{t("forms:catalog.selection.count", { count: editor.selected.size, n: format.formatInteger(editor.selected.size) })}</span>
    <Button type="button" size="sm" variant="outline" onClick={() => editor.setActive(editor.selected, false)}>{t("forms:catalog.selection.deactivate")}</Button>
    <Button type="button" size="sm" variant="outline" onClick={() => editor.setActive(editor.selected, true)}>{t("forms:catalog.selection.reactivate")}</Button>
    <Button type="button" size="sm" variant="link" onClick={editor.clearSelection}>{t("forms:catalog.selection.clear")}</Button>
  </div> : null;

  // Sin opciones guardadas no hay qué buscar (FRM-Catalogo, «Sin opciones»): queda solo «Todavía no hay opciones.».
  const searchable = !isNew && ((saved?.itemCounts.total ?? 0) > 0 || editor.searching);
  const searchBox = searchable ? <div className="relative min-w-0 max-w-[22rem] flex-1 max-md:max-w-none">
    <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-[var(--t3)] max-md:left-3.5" />
    {/* El campo del teléfono lleva 14 de relleno (input): la lupa va a 14 y el texto, después de ella. */}
    <Input type="search" aria-label={t("forms:catalog.search")} placeholder={t("forms:catalog.search")} value={editor.searchInput}
      onChange={(event) => editor.setSearchInput(event.target.value)} className="pl-8 max-md:pl-10" />
  </div> : null;
  // «Columnas» al lado de la búsqueda, con una casilla por campo: las columnas fijas siempre se ven (262). En el teléfono
  // (M-FRM-Catalogo-13, .k-coltel), a todo el ancho debajo de los botones, con la flecha a la derecha, y la búsqueda debajo.
  const columnsMenu = fieldColumns.length ? <ColumnsMenu hidden={hidden} onHiddenChange={setHidden}
    className={phone ? "h-11 w-full justify-between rounded-[0.625rem] border-[var(--borde2)] px-3.5 text-[0.875rem] text-[var(--t1)]" : undefined}
    columns={fieldColumns.map((column) => ({ id: column.field.localKey, label: column.field.name || t("forms:catalog.fieldsDialog.noName") }))} /> : null;
  const toolbar = !searchBox && !columnsMenu ? null : phone
    ? <div className="mb-3 flex flex-col gap-2.5">{columnsMenu}{searchBox}</div>
    : <div className="mx-4 my-3 flex flex-wrap items-center gap-2">{searchBox}{columnsMenu}</div>;

  const label = (row: CatalogRowView) => row.draft.text.trim() || t("forms:catalog.newOption");
  // El error de una celda describe su campo (aria-describedby), como en FormField (accesibilidad).
  const errorId = (row: CatalogRowView, field: keyof RowError) => `${titleId}-${row.key}-${field}-error`;
  const fieldError = (row: CatalogRowView, field: keyof RowError) => row.errors[field]
    ? <span id={errorId(row, field)} role="alert" className="mt-1 block text-[0.75rem] text-[var(--peligro)]">{row.errors[field]}</span> : null;
  // Una opción de baja o por borrar se ve atenuada (FRM-Catalogo, tr.baja .k-in).
  const muted = (row: CatalogRowView) => row.pendingDelete || !row.draft.isActive;

  // El código y el detalle llevan el tope del contrato: al llegar, no se escribe más (269 y O13); el texto lo dice su contador.
  const maxLengths: Partial<Record<ItemField, number>> = { code: catalogLimits.itemCode, detail: catalogLimits.itemDetail };
  // `inside`: lo que va adentro del campo, a la derecha (el contador y «Revisá»), como .k-in del lienzo; `room`, lo que mide.
  const cellInput = (row: CatalogRowView, field: ItemField, inside?: ReactNode, inputClassName?: string, room?: string) => <div className="min-w-0 py-1.5">
    <div className="relative">
      <Input value={row.draft[field]} aria-label={t(`forms:catalog.cells.${field}`, { option: label(row) })} aria-invalid={Boolean(row.errors[field]) || undefined}
        aria-describedby={row.errors[field] ? errorId(row, field) : undefined} disabled={row.pendingDelete} maxLength={maxLengths[field]}
        className={cn(field === "code" && "font-mono", field === "value" && "text-right tabular-nums", muted(row) && "text-[var(--t3)]", room, inputClassName)}
        onChange={(event) => editor.edit(row.key, { [field]: event.target.value })} />
      {inside ? <span className="absolute inset-y-0 right-2.5 flex items-center gap-1.5">{inside}</span> : null}
    </div>
    {fieldError(row, field)}
  </div>;

  const rowMenu = (row: CatalogRowView): RowAction[] => [
    { label: t("forms:catalog.actions.restore"), accessibleName: t("forms:catalog.actions.restoreOption", { option: label(row) }), icon: RotateCcw, hidden: !row.pendingDelete, onSelect: () => editor.restore(row.key) },
    { label: t("forms:catalog.actions.reactivate"), accessibleName: t("forms:catalog.actions.reactivateOption", { option: label(row) }), icon: RotateCcw, hidden: row.pendingDelete || row.draft.isActive, onSelect: () => editor.edit(row.key, { isActive: true }) },
  ];

  const menuOf = (row: CatalogRowView) => {
    const menu = rowMenu(row);
    return menu.some((action) => !action.hidden) ? <RowActions label={t("forms:catalog.actions.rowMore", { option: label(row) })} title={label(row)} actions={menu} /> : null;
  };

  // Una por borrar (FRM-Catalogo, «Se borra al guardar»): en Acciones, solo «Se borra al guardar» en rojo y el ⋮ con «Restaurar».
  const actionsOf = (row: CatalogRowView, compact = false) => {
    if (row.pendingDelete) {
      return <span className="inline-flex items-center justify-end gap-1.5">
        {phone ? null : <span className="text-[0.75rem] text-[var(--peligro)]">{t("forms:catalog.deleteOnSave")}</span>}
        {menuOf(row)}
      </span>;
    }
    const moveDisabled = row.isNew ? t("forms:catalog.reasons.saveToMove") : moveReason;
    const size = compact ? "size-7" : undefined;
    return <span className="inline-flex items-center justify-end gap-0.5">
      <IconButton label={t("forms:catalog.actions.up", { option: label(row) })} onClick={() => editor.move(row.key, "Up")} className={size}
        disabledReason={moveDisabled} disabled={!moveDisabled && !row.canMoveUp}><ArrowUp aria-hidden="true" className="size-4" /></IconButton>
      <IconButton label={t("forms:catalog.actions.down", { option: label(row) })} onClick={() => editor.move(row.key, "Down")} className={size}
        disabledReason={moveDisabled} disabled={!moveDisabled && !row.canMoveDown}><ArrowDown aria-hidden="true" className="size-4" /></IconButton>
      <IconButton label={t("forms:catalog.actions.edit", { option: label(row) })} onClick={() => openEdit(row.key)} className={size}><PencilIcon aria-hidden="true" className="size-4" /></IconButton>
      {row.isNew
        ? <IconButton label={t("forms:catalog.actions.removeNew", { option: label(row) })} onClick={() => editor.remove(row.key)} className={size}><TrashIcon aria-hidden="true" className="size-4" /></IconButton>
        : <IconButton label={t("forms:catalog.actions.delete", { option: label(row) })} disabledReason={deleteReason} onClick={() => setDeleting(row)} className={size}><TrashIcon aria-hidden="true" className="size-4" /></IconButton>}
      {menuOf(row)}
    </span>;
  };

  // Una por borrar conserva su casilla de Estado, apagada (FRM-Catalogo, «Se borra al guardar»).
  const status = (row: CatalogRowView) => <Checkbox checked={row.draft.isActive} disabled={row.pendingDelete}
    aria-label={t("forms:catalog.cells.active", { option: label(row) })} onCheckedChange={(checked) => editor.edit(row.key, { isActive: checked === true })} />;
  const statusDot = (row: CatalogRowView) => row.pendingDelete
    ? <StatusDot tone="danger" label={t("forms:catalog.deleteOnSave")} />
    : <StatusDot tone={row.draft.isActive ? "success" : "neutral"} label={t(row.draft.isActive ? "forms:catalog.status.active" : "forms:catalog.status.inactive")} />;

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
  const counter = (row: CatalogRowView) => <small className={cn("shrink-0 text-[0.71875rem] tabular-nums text-[var(--t3)]", row.draft.text.length > catalogLimits.itemText && "text-[var(--peligro)]")}>
    {`${format.formatInteger(row.draft.text.length)}/${format.formatInteger(catalogLimits.itemText)}`}
  </small>;

  const editableColumns: EditableColumn<CatalogRowView>[] = [
    { id: "select", width: "2.75rem", pinned: "left",
      header: <Checkbox checked={allChosen ? true : someChosen ? "indeterminate" : false} aria-label={t("forms:catalog.selection.page")} onCheckedChange={(checked) => editor.selectPage(checked === true)} />,
      cell: (row) => <Checkbox checked={!row.pendingDelete && editor.selected.has(row.key)} disabled={row.pendingDelete} aria-label={t("forms:catalog.selection.one", { option: label(row) })} onCheckedChange={() => editor.toggleSelected(row.key)} /> },
    { id: "number", width: "3.25rem", pinned: "left", type: "number", header: "#", cell: number },
    { id: "text", minWidth: "12rem", pinned: "left", header: t("forms:catalog.columns.text"),
      cell: (row) => {
        const doubt = rowReview?.(row);
        return <div>
          {cellInput(row, "text", <>{doubt?.adornment}{counter(row)}</>, doubt?.className, doubt ? "pr-[7.5rem]" : "pr-12")}
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
    { id: "actions", width: "11rem", pinned: "right", type: "actions", header: t("forms:catalog.columns.actions"), cell: (row) => actionsOf(row) },
  ];

  const readText = (row: CatalogRowView, content: ReactNode) => <span className={cn("break-words", muted(row) && "text-[var(--t3)]")}>{content}</span>;
  const readColumns: EditableColumn<CatalogRowView>[] = [
    { id: "number", width: "3.25rem", type: "number", header: "#", cell: number },
    { id: "text", minWidth: "12rem", header: t("forms:catalog.columns.text"), cell: (row) => readText(row, row.draft.text) },
    { id: "code", minWidth: "6rem", header: t("forms:catalog.columns.code"), cell: (row) => <span className={cn("font-mono", muted(row) && "text-[var(--t3)]")}>{row.draft.code}</span> },
    ...(typed ? [{ id: "value", minWidth: "8rem", header: t("forms:catalog.columns.value"), type: valueType === "Date" ? undefined : "number" as const, cell: (row: CatalogRowView) => readText(row, row.draft.value) }] : []),
    ...readFieldColumns,
    { id: "detail", minWidth: "12rem", header: t("forms:catalog.columns.detail"), cell: (row) => row.draft.detail.trim() ? readText(row, row.draft.detail) : <EmptyValue /> },
    // FRM-Catalogo, «De baja»: el Estado con su punto, verde o gris.
    { id: "status", width: "6.5rem", header: t("forms:catalog.columns.status"), cell: statusDot },
  ];

  // M-FRM-Catalogo: cada opción con su número en un círculo y, debajo, «Código» y su valor (y el Estado de una de baja o por
  // borrar) en columnas, el rótulo arriba del valor; todas en una tarjeta. Una por borrar lleva solo el ⋮.
  const datum = (key: string, name: ReactNode, value: ReactNode) => <div key={key} className="min-w-0">
    <dt className="text-[var(--t3)]">{name}</dt><dd className="break-words">{value}</dd>
  </div>;
  const phoneList = <ul className="overflow-hidden rounded-[0.875rem] bg-[var(--superficie)] shadow-[0_0_0_1px_var(--borde)]">
    {rows.map((row) => { const doubt = rowReview?.(row); return <li key={row.key} className="flex flex-col gap-1.5 border-t border-[var(--borde)] py-3 pr-2 pl-3.5 first:border-t-0">
      <div className="flex items-center gap-3">
        <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--s3)] text-[0.75rem] font-semibold text-[var(--t2)] tabular-nums">{number(row)}</span>
        <span className={cn("min-w-0 flex-1 text-[0.9375rem] font-medium", muted(row) && "text-[var(--t3)]")}>{row.draft.text || t("forms:catalog.newOption")}{doubt ? <span className="ml-2 align-[1px]">{doubt.adornment}</span> : null}</span>
        {editable ? actionsOf(row, true) : null}
      </div>
      {doubt?.warning ? <span role="status" className="ml-9 text-[0.8125rem] text-[var(--alerta)]">{doubt.warning}</span> : null}
      <dl className="ml-9 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[0.8125rem] leading-snug">
        {datum("code", t("forms:catalog.columns.code"), row.draft.code || t("forms:catalog.noCode"))}
        {typed ? datum("value", t("forms:catalog.columns.value"), row.draft.value) : null}
        {shownColumns.map((column) => <Fragment key={column.field.localKey}>{datum(column.field.localKey, fieldName(column), fieldText(row, column))}</Fragment>)}
        {muted(row) ? datum("status", t("forms:catalog.columns.status"), statusDot(row)) : null}
      </dl>
      {fieldError(row, "row")}
    </li>; })}
  </ul>;

  const empty = rows.length === 0;
  const pageData = editor.items.data;
  // Lo que se ve en la página y no viene de ella (las nuevas, las de una propuesta) también se cuenta en el pie.
  const shownTotal = pageData ? pageData.totalCount + Math.max(0, rows.length - pageData.items.length) : 0;
  // Las opciones que no cargaron se dicen una vez, en su lugar, con «Reintentar» (que espera la cuenta de un 429).
  const loadError = editor.items.isError
    ? <EmptyState framed={false} title={t("forms:catalog.itemsLoadError")} description={apiErrorMessage(editor.items.error, t)}
      action={<Button type="button" variant="outline" disabled={retryLimit.isRunning} onClick={() => { void editor.items.refetch(); }}>{retryLimit.label ?? t("common:actions.retry")}</Button>} />
    : null;
  // `isLoading` y no `isPending`: la consulta de un catálogo nuevo está apagada y nunca deja de estar pendiente.
  const emptyText = editor.searching ? t("forms:catalog.noMatches") : t("forms:catalog.noOptions");
  const body = loadError ?? (empty && !editor.items.isLoading
    ? phone
      ? <p className="rounded-[0.875rem] bg-[var(--superficie)] px-4 py-6 text-center text-[0.9375rem] font-semibold text-[var(--t1)] shadow-[0_0_0_1px_var(--borde)]">{emptyText}</p>
      : <p className="px-4 py-6 text-center text-[0.8125rem] text-[var(--t2)]">{emptyText}</p>
    : phone ? phoneList
      : <EditableTable columns={editable ? editableColumns : readColumns} rows={rows} rowKey={(row) => row.key} />);
  const pagination = pageData && shownTotal > 0 ? <Pagination page={pageData.page} pageSize={pageData.pageSize} totalCount={shownTotal} totalPages={pageData.totalPages ?? 1}
    hasPrevious={pageData.hasPrevious ?? false} hasNext={pageData.hasNext ?? false} onPageChange={editor.setPage} onPageSizeChange={editor.setPageSize} /> : null;
  const dialogs = <>
    {dialog ? <OptionsDialog editor={editor} opening={dialog} sourceItem={sourceItem} onClose={() => setDialog(null)} /> : null}
    {fieldsDialog ? <CatalogFieldsDialog catalogId={saved?.id ?? null} catalogName={editor.name} value={editor.fields} removedKeys={editor.removedFieldKeys}
      presentation={editor.presentation} readOnly={!editable} initialKey={fieldsDialog.initialKey} onDone={editor.setFields} onClose={() => setFieldsDialog(null)} /> : null}
    {actions.sortDialog}
    <ConfirmDialog open={deleting !== null} onOpenChange={(open) => { if (!open) setDeleting(null); }}
      title={t("forms:catalog.deleteDialog.title", { option: deleting ? label(deleting) : "" })} description={t("forms:catalog.deleteDialog.description")}
      confirmLabel={t("forms:catalog.deleteDialog.confirm")} destructive onConfirm={() => { if (deleting) editor.remove(deleting.key); setDeleting(null); }} />
  </>;

  if (phone) {
    return <>
      {pending}
      <section aria-labelledby={titleId} className="flex flex-col">
        {header}
        {fieldIssue}
        {toolbar}
        {body}
        {pagination}
      </section>
      {dialogs}
    </>;
  }
  return <>
    {pending}
    <section aria-labelledby={titleId} className="overflow-hidden rounded-[0.75rem] border border-[var(--borde)] bg-[var(--superficie)]">
      {header}
      {fieldIssue}
      {toolbar}
      {selection}
      {body}
      {pagination}
    </section>
    {dialogs}
  </>;
}

