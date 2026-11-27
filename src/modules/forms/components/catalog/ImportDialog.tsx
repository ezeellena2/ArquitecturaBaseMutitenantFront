import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { useId, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ApiError } from "@/shared/api/ApiError";
import { actionErrorMessage, isGenericApiError } from "@/shared/api/errorMessage";
import { pageSizes } from "@/shared/api/pageSizes";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { countOf } from "@/shared/format/countOf";
import { useFormat } from "@/shared/format/useFormat";
import { useRestoreFocusOnClose } from "@/shared/hooks/useRestoreFocusOnClose";
import { saveBlobAs } from "@/shared/lib/saveFile";
import { cn } from "@/shared/lib/utils";
import { Banner } from "@/shared/ui/Banner";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { DetailGrid } from "@/shared/ui/DetailGrid";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { IconButton } from "@/shared/ui/IconButton";
import { CloseIcon } from "@/shared/ui/icons";
import { InfoTip } from "@/shared/ui/InfoTip";
import { Label } from "@/shared/ui/label";
import { Pagination } from "@/shared/ui/Pagination";
import { PasteGrid, type PasteGridColumn } from "@/shared/ui/PasteGrid";
import { Picker } from "@/shared/ui/Picker";
import { Skeleton } from "@/shared/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { TabCount, Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { catalogQueryKey, catalogsQueryRoot, fetchCatalog, fetchCatalogTemplate, importCatalog, previewCatalogImport, type CatalogImportInput } from "../../api/catalogs";
import type { FormCatalogImportErrorRow, FormCatalogImportMode, FormCatalogImportPreviewResponse, FormCatalogResponse } from "../../api/types";
import { catalogErrorField, catalogFieldErrors, isCatalogConflict } from "../../errors";
import { displayValue, itemDetailMax, itemTextMax } from "../../hooks/useCatalogEditor";
import { ambiguousReadings, catalogImportColumns, importColumnOf, pastedCsv, readPaste, type CatalogImportColumn, type PastedSheet } from "../../lib/catalogImport";

type Source = "file" | "paste";
type ListTab = "errors" | "added" | "changed" | "deactivated";
const tabs: readonly ListTab[] = ["errors", "added", "changed", "deactivated"];

/** Lo que se revisa: el archivo elegido, o lo pegado como CSV, con su modo. Desde «Revisar», el origen no cambia. */
interface Subject {
  readonly file: File;
  /** El nombre que se ve en la revisión: el del archivo; lo pegado no tiene. */
  readonly fileName: string | null;
  readonly mode: NonNullable<FormCatalogImportMode>;
}

const sameApply = (previous: CatalogImportInput, next: CatalogImportInput) => previous.file === next.file && previous.sha256 === next.sha256
  && previous.version === next.version && previous.skipErrorRows === next.skipErrorRows && previous.confirmedDeactivations === next.confirmedDeactivations;

// Con más del 25 % de bajas, la revisión abre en «Bajas»; si no, en la primera lista que tiene algo.
function firstTab(preview: FormCatalogImportPreviewResponse): ListTab {
  if (preview.confirmDeactivations) return "deactivated";
  return tabs.find((tab) => listOf(preview, tab).totalCount > 0) ?? "errors";
}

function listOf(preview: FormCatalogImportPreviewResponse, tab: ListTab) {
  return tab === "errors" ? preview.errors : tab === "added" ? preview.added : tab === "changed" ? preview.changed : preview.deactivated;
}

async function saveResponse(response: Response, fallback: string) {
  const disposition = response.headers.get("content-disposition") ?? "";
  const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(disposition);
  saveBlobAs(await response.blob(), match ? decodeURIComponent(match[1] ?? match[2]) : fallback);
}

/** La franja de color arena con el nombre de una parte del diálogo (.imp-cab). */
function Band({ id, children, aside }: { id?: string; children: ReactNode; aside?: ReactNode }) {
  return <div className="flex min-h-10 items-center justify-between gap-3 bg-[var(--cab)] px-5 text-[0.8125rem] font-semibold text-[var(--t2)]">
    <h3 id={id} className="inline-flex items-center gap-1">{children}</h3>
    {aside}
  </div>;
}

/** Un renglón del origen (.imp-f): el rótulo con su (i) a la izquierda y el campo a la derecha, con su error debajo. */
function OriginRow({ labelId, htmlFor, label, help, error, errorId, children }: {
  labelId: string; htmlFor?: string; label: string; help: string; error?: string; errorId: string; children: ReactNode;
}) {
  return <div className="grid min-h-12 grid-cols-[6.875rem_minmax(0,1fr)] items-center gap-x-3 border-t border-[var(--borde)] px-5 py-1.5">
    <span className="inline-flex items-center gap-1">
      <Label id={labelId} htmlFor={htmlFor} className="text-[0.8125rem] font-semibold text-[var(--t2)]">{label}</Label>
      <InfoTip text={help} title={label} />
    </span>
    <div className="min-w-0">{children}</div>
    {error ? <p id={errorId} role="alert" className="col-start-2 -mt-0.5 text-[0.78125rem] text-[var(--peligro)]">{error}</p> : null}
  </div>;
}

/** Una zona del diálogo (.imp-z); mientras aplica, la revisión queda atenuada y fuera de alcance. */
function Zone({ dimmed = false, children }: { dimmed?: boolean; children: ReactNode }) {
  return <div inert={dimmed || undefined} className={cn("flex flex-col gap-2.5 border-t border-[var(--borde)] px-5 py-3", dimmed && "opacity-55")}>{children}</div>;
}

const headLine = "[&:not(:first-child)]:shadow-[inset_1px_0_0_var(--borde-cab)]";
const cellLine = "[&:not(:first-child)]:shadow-[inset_1px_0_0_var(--borde)]";
const head = cn("h-8.5 px-3 text-[0.78125rem]", headLine);
const cell = cn("px-3 py-2 whitespace-normal break-words", cellLine);
const numberHead = cn(head, "w-16 text-right");
const numberCell = cn(cell, "text-right tabular-nums");
const codeText = "font-mono text-[0.78125rem] text-[var(--t2)]";

/** Una lista de la revisión, con la línea entre columnas (137), dentro de su caja. */
function ReviewTable({ label, refreshing, children }: { label: string; refreshing: boolean; children: ReactNode }) {
  return <div className="overflow-hidden rounded-[0.625rem] border border-[var(--borde)]">
    <Table aria-label={label} refreshing={refreshing} className="table-fixed">{children}</Table>
  </div>;
}

/**
 * «Importar opciones» de un catálogo a mano (FRM-Catalogo-Importar, 120): un solo diálogo, de arriba abajo. «Origen» con
 * «Desde» en la pieza (262): subir un XLSX o un CSV, que reemplaza, o pegar desde Excel en la grilla, que agrega. «Revisar»
 * muestra debajo la «Revisión», sin guardar: el archivo, la hoja, las filas leídas y las que no cambian, y Errores, Altas,
 * Cambios (lado a lado, 138) y Bajas por fila y columna, de a páginas. «Antes de aplicar» pide confirmar las bajas o aplicar
 * sin las filas con errores cuando el back lo pide (C7). Aplicar manda el mismo archivo con su SHA-256 y su versión; si otra
 * persona guardó, «Revisar de nuevo», y con otra importación en curso, solo «Cerrar». No va en el teléfono.
 */
export function ImportDialog({ catalog, onClose, onCatalogChanged }: {
  catalog: FormCatalogResponse;
  onClose: () => void;
  /** El catálogo cambió (se importó, u otra persona lo guardó): el editor vuelve a leerlo, con su versión. */
  onCatalogChanged: () => void;
}) {
  const { t } = useTranslation(["forms", "common"]);
  const format = useFormat();
  const queryClient = useQueryClient();
  const restoreFocus = useRestoreFocusOnClose();
  const id = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const columns = catalogImportColumns(catalog.valueType);

  const [source, setSource] = useState<Source>("file");
  const [file, setFile] = useState<File | null>(null);
  const [sheet, setSheet] = useState<PastedSheet | null>(null);
  const [originError, setOriginError] = useState<string>();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [version, setVersion] = useState(catalog.version);
  const [review, setReview] = useState<FormCatalogImportPreviewResponse | null>(null);
  const [tab, setTab] = useState<ListTab>("errors");
  const [confirmDeactivations, setConfirmDeactivations] = useState(false);
  const [confirmErrors, setConfirmErrors] = useState(false);
  const [failure, setFailure] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  const stale = useRef(false);

  const downloadTemplate = useMutation({ mutationFn: async () => saveResponse(await fetchCatalogTemplate(catalog.valueType), `${t("forms:catalog.templateFile")}.xlsx`) });
  const preview = useMutation({ mutationFn: (input: Parameters<typeof previewCatalogImport>[1]) => previewCatalogImport(catalog.id, input) });
  const apply = useIdempotentMutation((input: CatalogImportInput, key) => importCatalog(catalog.id, input, key), { sameOperation: sameApply });
  const applying = apply.isPending;
  const conflict = isCatalogConflict(failure) || (failure instanceof ApiError && failure.code === "Forms.CatalogImport.FileChanged");

  function rejected(error: unknown) {
    if (catalogErrorField(error) === "file") {
      // El archivo no se pudo leer: se puede elegir otro.
      setOriginError(catalogFieldErrors(error).find((item) => item.field === "file")?.message ?? (error as ApiError).detail ?? "");
      setSubject(null);
      setReview(null);
      return;
    }
    if (isCatalogConflict(error)) stale.current = true;
    if (error instanceof ApiError && error.code === "Forms.CatalogImport.Busy") setBusy(true);
    // Sin conexión, 5xx y 429 ya los avisó el MutationCache.
    if (!isGenericApiError(error)) setFailure(error);
  }

  function run(next: Subject, nextVersion: number, page: number, pageSize: number, first: boolean) {
    setFailure(undefined);
    preview.mutate({ file: next.file, mode: next.mode, version: nextVersion, page, pageSize }, {
      onSuccess: (response) => {
        setReview(response);
        if (first) {
          setTab(firstTab(response));
          setConfirmDeactivations(false);
          setConfirmErrors(false);
        }
      },
      onError: rejected,
    });
  }

  function submitReview() {
    setOriginError(undefined);
    if (source === "file") {
      if (!file) { setOriginError(t("forms:catalog.import.fileRequired")); return; }
      const next: Subject = { file, fileName: file.name, mode: "Replace" };
      setSubject(next);
      run(next, version, 1, pageSizes[0], true);
      return;
    }
    if (!sheet?.rows.length) { setOriginError(t("forms:catalog.import.pasteRequired")); return; }
    const csv = new File([pastedCsv(sheet)], t("forms:catalog.import.pastedFileName"), { type: "text/csv" });
    const next: Subject = { file: csv, fileName: null, mode: "Append" };
    setSubject(next);
    run(next, version, 1, pageSizes[0], true);
  }

  /** «Revisar de nuevo»: con la versión de ahora, el mismo archivo o lo mismo pegado. */
  async function reviewAgain() {
    if (!subject) return;
    setFailure(undefined);
    try {
      const fresh = await queryClient.fetchQuery({ queryKey: catalogQueryKey(catalog.id), queryFn: ({ signal }) => fetchCatalog(catalog.id, signal), staleTime: 0 });
      setVersion(fresh.version);
      run(subject, fresh.version, 1, review?.errors.pageSize ?? pageSizes[0], true);
    } catch (error) {
      rejected(error);
    }
  }

  function changePage(page: number, pageSize: number) {
    if (subject) run(subject, version, page, pageSize, false);
  }

  function chooseTab(next: ListTab) {
    setTab(next);
    if (review && review.errors.page !== 1) changePage(1, review.errors.pageSize);
  }

  function submitApply() {
    if (!subject || !review) return;
    setFailure(undefined);
    apply.mutate({
      file: subject.file, mode: subject.mode, version: review.version, sha256: review.sha256,
      skipErrorRows: review.errors.totalCount > 0,
      confirmedDeactivations: review.confirmDeactivations && confirmDeactivations ? review.deactivated.totalCount : 0,
    }, {
      onSuccess: () => {
        toast.success(t("forms:catalog.import.imported"));
        void queryClient.invalidateQueries({ queryKey: catalogsQueryRoot });
        onCatalogChanged();
        onClose();
      },
      onError: rejected,
    });
  }

  function close() {
    if (applying) return;
    if (stale.current) onCatalogChanged();
    onClose();
  }

  function paste(text: string) {
    const read = readPaste(text, columns);
    setSheet(read);
    if (read?.rows.length) setOriginError(undefined);
  }

  const locked = subject !== null;
  const lockedReason = locked ? t("forms:catalog.import.originLocked") : undefined;
  const reviewing = preview.isPending && review === null;
  const columnLabel = (column: CatalogImportColumn) => column === "value" && catalog.valueType !== "Text"
    ? t(`forms:catalog.optionsDialog.value.${catalog.valueType}`) : t(`forms:catalog.columns.${column}`);
  const fromId = `${id}-from`, fileId = `${id}-file`, originErrorId = `${id}-origin-error`, pasteNoteId = `${id}-paste-note`;

  const template = <Button type="button" size="sm" variant="link" onClick={() => downloadTemplate.mutate()}>
    <Download aria-hidden="true" className="size-3.5" />{t("forms:catalog.import.template")}
  </Button>;

  const fromRow = <OriginRow labelId={`${fromId}-label`} htmlFor={fromId} label={t("forms:catalog.import.from")} help={t("forms:catalog.import.fromHelp")} errorId={originErrorId}>
    <Picker id={fromId} className="md:max-w-85" value={source} disabledReason={lockedReason}
      onChange={(next) => { if (next !== source) { setSource(next as Source); setOriginError(undefined); } }}
      options={[{ value: "file", label: t("forms:catalog.import.sources.file") }, { value: "paste", label: t("forms:catalog.import.sources.paste") }]} />
  </OriginRow>;

  const fileRow = <OriginRow labelId={`${fileId}-label`} htmlFor={fileId} label={t("forms:catalog.import.file")} help={t("forms:catalog.import.fileHelp")}
    error={originError} errorId={originErrorId}>
    <input ref={fileInput} id={fileId} type="file" accept=".xlsx,.csv" hidden aria-invalid={originError ? true : undefined} aria-describedby={originError ? originErrorId : undefined}
      onChange={(event) => { const chosen = event.target.files?.[0] ?? null; event.target.value = ""; if (chosen) { setFile(chosen); setOriginError(undefined); } }} />
    <span className="flex items-center justify-between gap-3">
      {file ? <b className="min-w-0 font-semibold break-words">{file.name}</b> : <span className="text-[var(--t3)]">{t("forms:catalog.import.noFile")}</span>}
      <Button type="button" size="sm" variant="outline" disabledReason={lockedReason} aria-describedby={originError ? originErrorId : undefined}
        onClick={() => fileInput.current?.click()}>
        {t(file ? "forms:catalog.import.change" : "forms:catalog.import.choose")}
      </Button>
    </span>
  </OriginRow>;

  const sheetColumns: PasteGridColumn[] = sheet
    ? sheet.columns.map((column) => ({
      key: column.column ?? `other-${column.position}`,
      label: column.column ? columnLabel(column.column) : column.header ?? t("forms:catalog.import.unnamedColumn", { n: format.formatInteger(column.position) }),
      cell: column.source >= 0 ? column.source : undefined,
      invalid: column.column === null,
      mono: column.column === "code",
      numeric: column.column === "value" && catalog.valueType !== "Text" && catalog.valueType !== "Date",
    }))
    : columns.map((column) => ({ key: column, label: columnLabel(column) }));
  const foreign = sheetColumns.filter((column) => column.invalid);
  const pasteZone = <Zone>
    <PasteGrid label={t("forms:catalog.import.pasted")} columns={sheetColumns} rows={sheet?.rows ?? null} disabled={locked}
      invalid={Boolean(originError)} describedBy={originError ? originErrorId : sheet ? pasteNoteId : undefined} onPaste={paste} />
    {originError || sheet ? <div className="flex items-center justify-between gap-3 text-[0.8125rem] text-[var(--t2)]">
      {originError ? <p id={originErrorId} role="alert" className="text-[0.78125rem] text-[var(--peligro)]">{originError}</p>
        : <div id={pasteNoteId} className="flex flex-col gap-0.5">
          {foreign.length ? foreign.map((column) => <p key={column.key} className="text-[0.78125rem] text-[var(--peligro)]">{t("forms:catalog.import.foreignColumn", { column: column.label })}</p>)
            : <p>{t("forms:catalog.import.pastedRows", countOf(format, sheet?.rows.length ?? 0))}</p>}
        </div>}
      {sheet ? <Button type="button" size="sm" variant="link" disabledReason={lockedReason} onClick={() => setSheet(null)}>{t("forms:catalog.import.clear")}</Button> : null}
    </div> : null}
  </Zone>;

  const issueText = (row: FormCatalogImportErrorRow): string => {
    switch (row.code) {
      case "Forms.Catalog.DuplicateCode":
        return row.otherRow != null ? t("forms:catalog.import.issues.repeated", { row: format.formatInteger(row.otherRow) }) : t("forms:catalog.import.issues.repeatedPlain");
      case "Forms.Catalog.ItemTextTooLong": return t("forms:catalog.import.issues.tooLong", { n: format.formatInteger(itemTextMax) });
      case "Forms.Catalog.ItemDetailTooLong": return t("forms:catalog.import.issues.tooLong", { n: format.formatInteger(itemDetailMax) });
      case "Forms.CatalogImport.CellRequired": return t("forms:catalog.import.issues.required");
      case "Forms.Catalog.ValueRequired": return t("forms:catalog.errors.valueRequired");
      case "Forms.Catalog.ValueInvalid":
        return catalog.valueType === "Text" ? t("forms:catalog.import.issues.other") : t(`forms:catalog.errors.valueInvalid.${catalog.valueType}`);
      case "Forms.CatalogImport.ValueAmbiguous": {
        const value = row.value ?? "";
        const readings = ambiguousReadings(value, format);
        return readings ? t("forms:catalog.import.issues.ambiguous", { value, a: readings[0], b: readings[1] }) : t("forms:catalog.import.issues.ambiguousPlain", { value });
      }
      default: return t("forms:catalog.import.issues.other");
    }
  };
  const columnText = (column: string | null | undefined) => {
    const known = importColumnOf(column);
    return known ? t(`forms:catalog.columns.${known}`) : column || format.formatEmpty();
  };
  const changeText = (column: string, value: string | null | undefined) => {
    if (value == null || value === "") return <span className="text-[var(--t3)]">{format.formatEmpty()}</span>;
    return importColumnOf(column) === "value" ? displayValue(value, catalog.valueType, format) : value;
  };

  const refreshing = preview.isPending && review !== null;
  const empty = (key: ListTab, span: number) => <TableRow><TableCell colSpan={span} className={cn(cell, "text-[var(--t3)]")}>{t(`forms:catalog.import.empty.${key}`)}</TableCell></TableRow>;
  const lists = review ? {
    errors: <ReviewTable label={t("forms:catalog.import.tabs.errors")} refreshing={refreshing}>
      <TableHeader><TableRow className="border-b-[var(--borde-cab)]">
        <TableHead className={numberHead}>{t("forms:catalog.import.row")}</TableHead>
        <TableHead className={cn(head, "w-32")}>{t("forms:catalog.import.column")}</TableHead>
        <TableHead className={head}>{t("forms:catalog.import.issue")}</TableHead>
      </TableRow></TableHeader>
      <TableBody refreshing={refreshing}>
        {review.errors.items.length ? review.errors.items.map((row, index) => <TableRow key={`${row.row}-${row.column ?? ""}-${index}`}>
          <TableCell className={numberCell}>{format.formatInteger(row.row)}</TableCell>
          <TableCell className={cell}>{columnText(row.column)}</TableCell>
          <TableCell className={cell}>{issueText(row)}</TableCell>
        </TableRow>) : empty("errors", 3)}
      </TableBody>
    </ReviewTable>,
    added: <ReviewTable label={t("forms:catalog.import.tabs.added")} refreshing={refreshing}>
      <TableHeader><TableRow className="border-b-[var(--borde-cab)]">
        <TableHead className={cn(head, "w-40")}>{t("forms:catalog.columns.code")}</TableHead>
        <TableHead className={head}>{t("forms:catalog.columns.text")}</TableHead>
      </TableRow></TableHeader>
      <TableBody refreshing={refreshing}>
        {review.added.items.length ? review.added.items.map((row) => <TableRow key={`${row.row}-${row.code}`}>
          <TableCell className={cn(cell, codeText)}>{row.code}</TableCell>
          <TableCell className={cell}>{row.text}</TableCell>
        </TableRow>) : empty("added", 2)}
      </TableBody>
    </ReviewTable>,
    // Lado a lado (138): la fila y el código una vez, y de cada columna que cambió, lo de antes y lo de después.
    changed: <ReviewTable label={t("forms:catalog.import.tabs.changed")} refreshing={refreshing}>
      <TableHeader><TableRow className="border-b-[var(--borde-cab)]">
        <TableHead className={numberHead}>{t("forms:catalog.import.row")}</TableHead>
        <TableHead className={cn(head, "w-28")}>{t("forms:catalog.columns.code")}</TableHead>
        <TableHead className={cn(head, "w-25")}>{t("forms:catalog.import.column")}</TableHead>
        <TableHead className={head}>{t("forms:catalog.import.before")}</TableHead>
        <TableHead className={head}>{t("forms:catalog.import.after")}</TableHead>
      </TableRow></TableHeader>
      <TableBody refreshing={refreshing}>
        {review.changed.items.length ? review.changed.items.map((row, index, items) => {
          const starts = index === 0 || items[index - 1].row !== row.row || items[index - 1].code !== row.code;
          let span = 1;
          while (starts && index + span < items.length && items[index + span].row === row.row && items[index + span].code === row.code) span++;
          return <TableRow key={`${row.row}-${row.code}-${row.column}-${index}`} className="even:[--fila-fondo:transparent] hover:[--fila-fondo:transparent]">
            {starts ? <>
              <TableCell rowSpan={span} className={cn(numberCell, "align-top shadow-none")}>{format.formatInteger(row.row)}</TableCell>
              <TableCell rowSpan={span} className={cn(cell, codeText, "align-top")}>{row.code}</TableCell>
            </> : null}
            <TableCell className={cn(cell, "shadow-[inset_1px_0_0_var(--borde)] text-[var(--t2)]")}>{columnText(row.column)}</TableCell>
            <TableCell className={cell}>{changeText(row.column, row.before)}</TableCell>
            <TableCell className={cell}>{changeText(row.column, row.after)}</TableCell>
          </TableRow>;
        }) : empty("changed", 5)}
      </TableBody>
    </ReviewTable>,
    deactivated: <ReviewTable label={t("forms:catalog.import.tabs.deactivated")} refreshing={refreshing}>
      <TableHeader><TableRow className="border-b-[var(--borde-cab)]">
        <TableHead className={cn(head, "w-40")}>{t("forms:catalog.columns.code")}</TableHead>
        <TableHead className={head}>{t("forms:catalog.columns.text")}</TableHead>
      </TableRow></TableHeader>
      <TableBody refreshing={refreshing}>
        {review.deactivated.items.length ? review.deactivated.items.map((row) => <TableRow key={row.code}>
          <TableCell className={cn(cell, codeText)}>{row.code}</TableCell>
          <TableCell className={cell}>{row.text}</TableCell>
        </TableRow>) : empty("deactivated", 2)}
      </TableBody>
    </ReviewTable>,
  } satisfies Record<ListTab, ReactNode> : null;

  const failureText = failure === undefined ? null : isCatalogConflict(failure) ? t("forms:catalog.import.conflict") : actionErrorMessage(failure, t);
  const revision = subject && (reviewing || review || failureText) ? <>
    <Band id={`${id}-revision`}>{t("forms:catalog.import.revision")}</Band>
    <Zone dimmed={applying}>
      {failureText ? <Banner tone="danger" role="alert">{failureText}</Banner> : null}
      {reviewing ? <div aria-hidden="true" className="flex flex-col gap-2.5">
        {["w-3/5", "w-2/5", "w-1/2", "w-1/3"].map((width) => <Skeleton key={width} className={cn("h-3.5", width)} />)}
        <Skeleton className="h-8 w-full" />
        {["w-full", "w-11/12"].map((width) => <Skeleton key={width} className={cn("h-3.5", width)} />)}
      </div> : null}
      {review && lists ? <>
        <div className="-mx-5 -mt-4 -mb-5"><DetailGrid items={[
          ...(subject.fileName ? [{ key: "file", label: t("forms:catalog.import.file"), value: subject.fileName }] : []),
          ...(review.sheetName ? [{ key: "sheet", label: t("forms:catalog.import.sheet"), value: review.sheetName }] : []),
          { key: "read", label: t("forms:catalog.import.rowsRead"), value: format.formatInteger(review.rowsRead) },
          { key: "unchanged", label: t("forms:catalog.import.unchanged"), value: format.formatInteger(review.unchanged) },
        ]} /></div>
        <Tabs value={tab} onValueChange={(next) => chooseTab(next as ListTab)} className="gap-2.5">
          <TabsList aria-label={t("forms:catalog.import.lists")} className="h-9 gap-1 border-b border-[var(--borde)]">
            {tabs.map((key) => <TabsTrigger key={key} value={key} className="h-9 px-3 text-[0.8125rem]">
              {t(`forms:catalog.import.tabs.${key}`)}<TabCount>{listOf(review, key).totalCount}</TabCount>
            </TabsTrigger>)}
          </TabsList>
          {tabs.map((key) => {
            const list = listOf(review, key);
            const totalPages = list.totalPages ?? Math.max(1, Math.ceil(list.totalCount / list.pageSize));
            return <TabsContent key={key} value={key} className="flex flex-col gap-2">
              {lists[key]}
              {list.totalCount > pageSizes[0] ? <Pagination page={list.page} pageSize={list.pageSize} totalCount={list.totalCount} totalPages={totalPages}
                hasPrevious={list.hasPrevious ?? list.page > 1} hasNext={list.hasNext ?? list.page < totalPages}
                onPageChange={(page) => changePage(page, list.pageSize)} onPageSizeChange={(pageSize) => changePage(1, pageSize)} /> : null}
            </TabsContent>;
          })}
        </Tabs>
      </> : null}
    </Zone>
  </> : null;

  const askDeactivations = review?.confirmDeactivations ?? false;
  const askErrors = review?.confirmErrors ?? false;
  const percent = (share: number) => format.formatPercent(Math.round(share * 100) / 100);
  const confirmation = (key: string, checked: boolean, onChange: (checked: boolean) => void, text: string, share: number) =>
    <div className="flex items-start gap-2.5 text-[0.84375rem]">
      <Checkbox id={`${id}-${key}`} checked={checked} disabled={applying} className="mt-0.5" onCheckedChange={(value) => onChange(value === true)} />
      <Label htmlFor={`${id}-${key}`} className="inline font-normal leading-normal"><b className="font-semibold">{text}</b>{" "}{t("forms:catalog.import.share", { percent: percent(share) })}</Label>
    </div>;
  const beforeApplying = review && !conflict && !busy && (askDeactivations || askErrors) ? <>
    <Band>{t("forms:catalog.import.beforeApplying")}</Band>
    <Zone dimmed={applying}>
      {askDeactivations ? confirmation("deactivations", confirmDeactivations, setConfirmDeactivations,
        t("forms:catalog.import.confirmDeactivations", countOf(format, review.deactivated.totalCount)), review.deactivationShare) : null}
      {askErrors ? confirmation("errors", confirmErrors, setConfirmErrors,
        t("forms:catalog.import.confirmErrors", countOf(format, review.errors.totalCount)), review.errorShare) : null}
    </Zone>
  </> : null;

  const applyReason = askDeactivations && !confirmDeactivations ? t("forms:catalog.import.confirmDeactivationsFirst")
    : askErrors && !confirmErrors ? t("forms:catalog.import.confirmErrorsFirst") : undefined;
  const waitReason = applying ? t("forms:catalog.import.waitApplying") : undefined;
  const footer = busy
    ? <Button type="button" variant="outline" onClick={close}>{t("common:actions.close")}</Button>
    : <>
      <Button type="button" variant="outline" disabledReason={waitReason} onClick={close}>{t("common:actions.cancel")}</Button>
      {conflict ? <Button type="button" pending={preview.isPending} pendingLabel={t("forms:catalog.import.reviewing")} onClick={() => { void reviewAgain(); }}>{t("forms:catalog.import.reviewAgain")}</Button>
        : review ? <Button type="button" pending={applying} pendingLabel={t("forms:catalog.import.applying")} disabledReason={refreshing ? undefined : applyReason}
          disabled={refreshing} onClick={submitApply}>
          {review.errors.totalCount > 0 ? t("forms:catalog.import.applySkipping", countOf(format, review.errors.totalCount)) : t("forms:catalog.import.apply")}
        </Button>
          : <Button type="button" pending={preview.isPending} pendingLabel={t("forms:catalog.import.reviewing")} onClick={submitReview}>{t("forms:catalog.import.review")}</Button>}
    </>;

  return <Dialog open onOpenChange={(open) => { if (!open) close(); }}>
    <DialogContent aria-describedby={undefined} showCloseButton={!applying} className="md:max-w-190" onCloseAutoFocus={restoreFocus}
      onEscapeKeyDown={(event) => { if (applying) event.preventDefault(); }}>
      <DialogHeader><DialogTitle>{t("forms:catalog.import.title", { name: catalog.name })}</DialogTitle></DialogHeader>
      {applying ? <IconButton label={t("common:actions.close")} disabledReason={waitReason} className="absolute top-2 right-2"><CloseIcon strokeWidth={2} className="size-4" /></IconButton> : null}
      <div className="max-h-[37.5rem] min-h-0 overflow-y-auto">
        <Band aside={template}>{t("forms:catalog.import.origin")}</Band>
        {fromRow}
        {source === "file" ? fileRow : pasteZone}
        {revision}
        {beforeApplying}
      </div>
      <DialogFooter>{footer}</DialogFooter>
    </DialogContent>
  </Dialog>;
}

