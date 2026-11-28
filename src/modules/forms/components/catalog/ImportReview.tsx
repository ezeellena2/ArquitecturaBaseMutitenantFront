import { Fragment, useId, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { pageSizes } from "@/shared/api/pageSizes";
import { useFormat } from "@/shared/format/useFormat";
import { cn } from "@/shared/lib/utils";
import { Banner } from "@/shared/ui/Banner";
import { DetailGrid } from "@/shared/ui/DetailGrid";
import { loadingBlock } from "@/shared/ui/PageLoading";
import { Pagination } from "@/shared/ui/Pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { TabCount, Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import type { FormCatalogImportErrorRow, FormCatalogValueType } from "../../api/types";
import { importListOf, importListTabs, type CatalogImport, type ImportListTab } from "../../hooks/useCatalogImport";
import { ambiguousReadings, importColumnOf } from "../../lib/catalogImport";
import { catalogLimits } from "../../lib/catalogLimits";
import { displayValue } from "../../lib/catalogValues";
import { ImportBand, ImportZone } from "./ImportParts";

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
 * La «Revisión» de importar opciones (FRM-Catalogo-Importar, 120), sin guardar: el archivo, la hoja, las filas leídas y las
 * que no cambian, y Errores, Altas, Cambios (lado a lado, 138) y Bajas por fila y columna, de a páginas. Las cuatro listas
 * son los grupos de datos de lo leído, en pestañas como dibuja el tablero (pantallas-y-ui, la excepción de la E12).
 */
export function ImportReview({ imp, valueType }: { imp: CatalogImport; valueType: FormCatalogValueType }) {
  const { t } = useTranslation(["forms", "common"]);
  const format = useFormat();
  const id = useId();
  const { review, subject, refreshing, reviewing, failureText } = imp;
  if (!subject || !(reviewing || review || failureText)) return null;

  const issueText = (row: FormCatalogImportErrorRow): string => {
    switch (row.code) {
      case "Forms.Catalog.DuplicateCode":
        return row.otherRow != null ? t("forms:catalog.import.issues.repeated", { row: format.formatInteger(row.otherRow) }) : t("forms:catalog.import.issues.repeatedPlain");
      // El servidor usa el mismo código para el código y el texto: el tope sale de la columna de la fila.
      case "Forms.Catalog.ItemTextTooLong":
        return t("forms:catalog.import.issues.tooLong", { n: format.formatInteger(importColumnOf(row.column) === "code" ? catalogLimits.itemCode : catalogLimits.itemText) });
      case "Forms.Catalog.ItemDetailTooLong": return t("forms:catalog.import.issues.tooLong", { n: format.formatInteger(catalogLimits.itemDetail) });
      case "Forms.CatalogImport.CellRequired": return t("forms:catalog.import.issues.required");
      case "Forms.Catalog.ValueRequired": return t("forms:catalog.errors.valueRequired");
      case "Forms.Catalog.ValueInvalid":
        return valueType === "Text" ? t("forms:catalog.import.issues.other") : t(`forms:catalog.errors.valueInvalid.${valueType}`);
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
    return importColumnOf(column) === "value" ? displayValue(value, valueType, format) : value;
  };

  const empty = (key: ImportListTab, span: number) => <TableRow><TableCell colSpan={span} className={cn(cell, "text-[var(--t3)]")}>{t(`forms:catalog.import.empty.${key}`)}</TableCell></TableRow>;
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
          return <TableRow key={`${row.row}-${row.code}-${row.column}-${index}`} className="even:bg-transparent hover:bg-transparent">
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
  } satisfies Record<ImportListTab, ReactNode> : null;

  return <>
    <ImportBand id={`${id}-revision`}>{t("forms:catalog.import.revision")}</ImportBand>
    <ImportZone dimmed={imp.applying}>
      {failureText ? <Banner tone="danger" role="alert">{failureText}</Banner> : null}
      {/* FRM-Catalogo-Importar, «Revisando»: en gris, la forma de lo que viene (los datos del archivo, las pestañas y la tabla). */}
      {reviewing ? <div aria-hidden="true" data-slot="import-reviewing" className="flex flex-col gap-3">
        <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] overflow-hidden rounded-[0.5rem] border border-[var(--borde)]">
          {["w-3/5", "w-2/5", "w-1/3", "w-1/4"].map((width) => <Fragment key={width}>
            <span className="border-b border-[var(--borde)] bg-[var(--s2)] px-3 py-3 last:border-b-0"><span className={cn(loadingBlock, "h-2.5 w-14")} /></span>
            <span className="border-b border-[var(--borde)] px-3 py-3"><span className={cn(loadingBlock, "h-2.5", width)} /></span>
          </Fragment>)}
        </div>
        <div className="flex gap-4 border-b border-[var(--borde)] pb-2.5">
          {["w-14", "w-10", "w-14", "w-12"].map((width, index) => <span key={index} className={cn(loadingBlock, "h-2.5", width)} />)}
        </div>
        <div className="overflow-hidden rounded-[0.5rem] border border-[var(--borde)]">
          <div className="h-8 bg-[var(--cab)]" />
          {["w-2/5", "w-1/3"].map((width) => <div key={width} className="flex items-center gap-4 border-t border-[var(--borde)] px-3 py-3">
            <span className={cn(loadingBlock, "h-2.5 w-6")} /><span className={cn(loadingBlock, "h-2.5 w-16")} /><span className={cn(loadingBlock, "h-2.5", width)} />
          </div>)}
        </div>
      </div> : null}
      {review && lists ? <>
        <div className="-mx-5 -mt-4 -mb-5"><DetailGrid items={[
          ...(subject.fileName ? [{ key: "file", label: t("forms:catalog.import.file"), value: subject.fileName }] : []),
          ...(review.sheetName ? [{ key: "sheet", label: t("forms:catalog.import.sheet"), value: review.sheetName }] : []),
          { key: "read", label: t("forms:catalog.import.rowsRead"), value: format.formatInteger(review.rowsRead) },
          { key: "unchanged", label: t("forms:catalog.import.unchanged"), value: format.formatInteger(review.unchanged) },
        ]} /></div>
        <Tabs value={imp.tab} onValueChange={(next) => imp.chooseTab(next as ImportListTab)} className="gap-2.5">
          <TabsList aria-label={t("forms:catalog.import.lists")} className="h-9 gap-1 border-b border-[var(--borde)]">
            {importListTabs.map((key) => <TabsTrigger key={key} value={key} className="h-9 px-3 text-[0.8125rem]">
              {t(`forms:catalog.import.tabs.${key}`)}<TabCount>{importListOf(review, key).totalCount}</TabCount>
            </TabsTrigger>)}
          </TabsList>
          {importListTabs.map((key) => {
            const list = importListOf(review, key);
            const totalPages = list.totalPages ?? Math.max(1, Math.ceil(list.totalCount / list.pageSize));
            return <TabsContent key={key} value={key} className="flex flex-col gap-2">
              {lists[key]}
              {list.totalCount > pageSizes[0] ? <Pagination page={list.page} pageSize={list.pageSize} totalCount={list.totalCount} totalPages={totalPages}
                hasPrevious={list.hasPrevious ?? list.page > 1} hasNext={list.hasNext ?? list.page < totalPages}
                onPageChange={(page) => imp.changePage(page, list.pageSize)} onPageSizeChange={(pageSize) => imp.changePage(1, pageSize)} /> : null}
            </TabsContent>;
          })}
        </Tabs>
      </> : null}
    </ImportZone>
  </>;
}
