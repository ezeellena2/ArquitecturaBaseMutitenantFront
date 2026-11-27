import { ArrowDown, ArrowUp, ArrowUpDown, Download, Plus, RotateCcw, Search, Wand2 } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import { useRetryAfterOf } from "@/shared/api/useRetryAfterCountdown";
import { useFormat } from "@/shared/format/useFormat";
import type { AssistantProposalFieldReview } from "@/shared/assistant-actions";
import { saveBlobAs } from "@/shared/lib/saveFile";
import { cn } from "@/shared/lib/utils";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { Banner } from "@/shared/ui/Banner";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { EditableTable, type EditableColumn } from "@/shared/ui/EditableTable";
import { EmptyState } from "@/shared/ui/EmptyState";
import { EmptyValue } from "@/shared/ui/format/EmptyValue";
import { IconButton } from "@/shared/ui/IconButton";
import { PencilIcon, TrashIcon } from "@/shared/ui/icons";
import { Input } from "@/shared/ui/input";
import { Pagination } from "@/shared/ui/Pagination";
import { RowActions, type RowAction } from "@/shared/ui/RowActions";
import { exportCatalog, fetchCatalogTemplate } from "../../api/catalogs";
import { rowHasErrors, type CatalogEditor, type CatalogRowView, type ItemField } from "../../hooks/useCatalogEditor";
import { catalogLimits } from "../../lib/catalogLimits";
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
  const [deleting, setDeleting] = useState<CatalogRowView | null>(null);
  const [dialog, setDialog] = useState<OptionsDialogOpening | null>(null);
  const [errorRound, setErrorRound] = useState(editor.errorRound);
  const { saved, valueType, rows } = editor;
  const retryLimit = useRetryAfterOf(editor.items.error);
  const typed = valueType !== "Text";

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
  const moveReason = editor.deletes.size ? t("forms:catalog.reasons.deletePending") : undefined;

  const download = async (kind: "export" | "template") => {
    if (kind === "export" && saved) await saveResponse(await exportCatalog(saved.id), `${saved.name}.xlsx`);
    else await saveResponse(await fetchCatalogTemplate(valueType), `${t("forms:catalog.templateFile")}.xlsx`);
  };

  const moreActions: RowAction[] = [
    { label: t("forms:catalog.actions.template"), accessibleName: t("forms:catalog.actions.template"), icon: Download, onSelect: () => { void download("template"); } },
    { label: t("forms:catalog.actions.sort"), accessibleName: t("forms:catalog.actions.sort"), icon: ArrowUpDown, hidden: !editable, disabledReason: sortReason, onSelect: () => setSortOpen(true) },
    { label: t("forms:catalog.actions.generateCodes"), accessibleName: t("forms:catalog.actions.generateCodes"), icon: Wand2, hidden: !editable, onSelect: editor.generateMissingCodes },
  ];

  const header = <div className="flex flex-wrap items-center gap-2 border-b border-[var(--borde)] px-4 py-3 max-md:px-3.5">
    <h2 id={titleId} className="mr-auto text-[0.875rem] font-semibold text-[var(--t1)]">{t("forms:catalog.options")}</h2>
    {editable ? <>
      <Button type="button" size="sm" onClick={openAdd} disabledReason={editor.full ? t("forms:catalog.reasons.full") : undefined}>
        <Plus aria-hidden="true" className="size-4" />{t("forms:catalog.actions.add")}
      </Button>
      {phone ? null : <Button type="button" size="sm" variant="outline" onClick={onImport} disabledReason={importReason}>{t("forms:catalog.actions.import")}</Button>}
    </> : null}
    <Button type="button" size="sm" variant="outline" onClick={() => { void download("export"); }} disabledReason={isNew ? t("forms:catalog.reasons.saveFirst") : undefined}>{t("forms:catalog.actions.export")}</Button>
    <RowActions label={t("forms:catalog.actions.more")} title={t("forms:catalog.options")} actions={moreActions} />
  </div>;

  const pending = <>
    {editor.moves.length ? <Banner role="status" tone="info" className="mx-4 mt-3" action={<Button type="button" size="sm" variant="outline" onClick={editor.discardMoves}>{t("forms:catalog.pending.discardMoves")}</Button>}>
      {t("forms:catalog.pending.moves", { count: editor.moves.length, n: format.formatInteger(editor.moves.length) })}
    </Banner> : null}
    {editor.sort ? <Banner role="status" tone="info" className="mx-4 mt-3" action={<Button type="button" size="sm" variant="outline" onClick={editor.cancelSort}>{t("forms:catalog.pending.cancelSort")}</Button>}>
      {t("forms:catalog.pending.sort", { column: t(`forms:catalog.sort.columns.${editor.sort.column}`), order: t(editor.sort.descending ? "forms:catalog.sort.descendingInSentence" : "forms:catalog.sort.ascendingInSentence") })}
    </Banner> : null}
  </>;

  const selection = editable && editor.selected.size ? <div className="mx-4 mt-3 flex flex-wrap items-center gap-2 text-[0.8125rem]">
    <span className="mr-auto font-semibold">{t("forms:catalog.selection.count", { count: editor.selected.size, n: format.formatInteger(editor.selected.size) })}</span>
    <Button type="button" size="sm" variant="outline" onClick={() => editor.setActive(editor.selected, false)}>{t("forms:catalog.selection.deactivate")}</Button>
    <Button type="button" size="sm" variant="outline" onClick={() => editor.setActive(editor.selected, true)}>{t("forms:catalog.selection.reactivate")}</Button>
    <Button type="button" size="sm" variant="link" onClick={editor.clearSelection}>{t("forms:catalog.selection.clear")}</Button>
  </div> : null;

  const searchBox = isNew ? null : <div className="relative mx-4 my-3 max-w-[22rem] max-md:mx-3.5">
    <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-[var(--t3)]" />
    <Input type="search" aria-label={t("forms:catalog.search")} placeholder={t("forms:catalog.search")} value={editor.searchInput}
      onChange={(event) => editor.setSearchInput(event.target.value)} className="pl-8" />
  </div>;

  const label = (row: CatalogRowView) => row.draft.text.trim() || t("forms:catalog.newOption");
  const fieldError = (row: CatalogRowView, field: ItemField | "row") => row.errors[field]
    ? <span role="alert" className="mt-1 block text-[0.75rem] text-[var(--peligro)]">{row.errors[field]}</span> : null;

  const cellInput = (row: CatalogRowView, field: Exclude<ItemField, never>, extra?: ReactNode, inputClassName?: string) => <div className="min-w-0 py-1.5">
    <div className="flex items-center gap-1.5">
      <Input value={row.draft[field]} aria-label={t(`forms:catalog.cells.${field}`, { option: label(row) })} aria-invalid={Boolean(row.errors[field]) || undefined}
        disabled={row.pendingDelete}
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

  const pageKeys = rows.filter((row) => !row.pendingDelete).map((row) => row.key);
  const allChosen = pageKeys.length > 0 && pageKeys.every((key) => editor.selected.has(key));
  const someChosen = pageKeys.some((key) => editor.selected.has(key));
  const number = (row: CatalogRowView) => row.number == null ? "—" : format.formatInteger(row.number);

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
            <small className={cn("shrink-0 tabular-nums text-[var(--t3)]", row.draft.text.length > catalogLimits.itemText && "text-[var(--peligro)]")}>{`${row.draft.text.length}/${catalogLimits.itemText}`}</small>
          </>, doubt?.className)}
          {doubt?.warning ? <span role="status" className="-mt-1 mb-1 block text-[0.75rem] text-[var(--alerta)]">{doubt.warning}</span> : null}
          {row.textRepeated && !row.errors.text ? <span className="-mt-1 mb-1 block text-[0.75rem] text-[var(--alerta)]">{t("forms:catalog.warnings.textRepeated")}</span> : null}
          {fieldError(row, "row")}
        </div>;
      } },
    { id: "code", minWidth: "6rem", header: t("forms:catalog.columns.code"), cell: (row) => cellInput(row, "code") },
    ...(typed ? [{ id: "value", minWidth: "8rem", header: t("forms:catalog.columns.value"), type: valueType === "Date" ? undefined : "number" as const, cell: (row: CatalogRowView) => cellInput(row, "value") }] : []),
    { id: "detail", minWidth: "12rem", header: t("forms:catalog.columns.detail"), cell: (row) => cellInput(row, "detail") },
    { id: "status", width: "6.5rem", header: t("forms:catalog.columns.status"), cell: status },
    { id: "actions", width: "11rem", pinned: "right", type: "actions", header: t("forms:catalog.columns.actions"), cell: actions },
  ];

  const readColumns: EditableColumn<CatalogRowView>[] = [
    { id: "number", width: "3.25rem", type: "number", header: "#", cell: number },
    { id: "text", minWidth: "12rem", header: t("forms:catalog.columns.text"), cell: (row) => <span className="break-words">{row.draft.text}</span> },
    { id: "code", minWidth: "6rem", header: t("forms:catalog.columns.code"), cell: (row) => <span className="font-mono">{row.draft.code}</span> },
    ...(typed ? [{ id: "value", minWidth: "8rem", header: t("forms:catalog.columns.value"), type: valueType === "Date" ? undefined : "number" as const, cell: (row: CatalogRowView) => row.draft.value }] : []),
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
    {searchBox}
    {loadError ?? (empty && !editor.items.isPending
      ? <p className="px-4 py-6 text-center text-[0.8125rem] text-[var(--t3)]">{editor.searching ? t("forms:catalog.noMatches") : t("forms:catalog.noOptions")}</p>
      : phone ? phoneList
        : <EditableTable columns={editable ? editableColumns : readColumns} rows={rows} rowKey={(row) => row.key} />)}
    {pageData && pageData.totalCount > 0 ? <Pagination page={pageData.page} pageSize={pageData.pageSize} totalCount={pageData.totalCount} totalPages={pageData.totalPages ?? 1}
      hasPrevious={pageData.hasPrevious ?? false} hasNext={pageData.hasNext ?? false} onPageChange={editor.setPage} onPageSizeChange={editor.setPageSize} /> : null}
    {dialog ? <OptionsDialog editor={editor} opening={dialog} onClose={() => setDialog(null)} /> : null}
    <SortDialog open={sortOpen} initial={editor.sort} onOpenChange={setSortOpen} onSort={editor.setSort} />
    <ConfirmDialog open={deleting !== null} onOpenChange={(open) => { if (!open) setDeleting(null); }}
      title={t("forms:catalog.deleteDialog.title", { option: deleting ? label(deleting) : "" })} description={t("forms:catalog.deleteDialog.description")}
      confirmLabel={t("forms:catalog.deleteDialog.confirm")} destructive onConfirm={() => { if (deleting) editor.remove(deleting.key); setDeleting(null); }} />
  </section>;
}

