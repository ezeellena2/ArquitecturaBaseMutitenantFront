import { Download } from "lucide-react";
import { useId, useRef, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { countOf } from "@/shared/format/countOf";
import { useFormat } from "@/shared/format/useFormat";
import { Button } from "@/shared/ui/button";
import { InfoTip } from "@/shared/ui/InfoTip";
import { Label } from "@/shared/ui/label";
import { PasteGrid, type PasteGridColumn } from "@/shared/ui/PasteGrid";
import { Picker } from "@/shared/ui/Picker";
import type { FormCatalogValueType } from "../../api/types";
import type { CatalogImport, ImportSource } from "../../hooks/useCatalogImport";
import type { CatalogImportColumn } from "../../lib/catalogImport";
import { ImportBand, ImportZone } from "./ImportParts";

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

/**
 * «Origen» de importar opciones (FRM-Catalogo-Importar): «Desde» en la pieza (262), y debajo el archivo (XLSX o CSV, que
 * reemplaza) o la grilla para pegar desde Excel (que agrega). Desde «Revisar», el origen no cambia.
 */
export function ImportOrigin({ imp, valueType, columnLabel }: {
  imp: CatalogImport;
  valueType: FormCatalogValueType;
  columnLabel: (column: CatalogImportColumn) => string;
}) {
  const { t } = useTranslation(["forms", "common"]);
  const format = useFormat();
  const id = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const { sheet, originError, locked } = imp;
  const lockedReason = locked ? t("forms:catalog.import.originLocked") : undefined;
  const fromId = `${id}-from`, fileId = `${id}-file`, originErrorId = `${id}-origin-error`, pasteNoteId = `${id}-paste-note`;

  const template = <Button type="button" size="sm" variant="link" onClick={imp.downloadTemplate}>
    <Download aria-hidden="true" className="size-3.5" />{t("forms:catalog.import.template")}
  </Button>;

  const fromRow = <OriginRow labelId={`${fromId}-label`} htmlFor={fromId} label={t("forms:catalog.import.from")} help={t("forms:catalog.import.fromHelp")} errorId={originErrorId}>
    <Picker id={fromId} className="md:max-w-85" value={imp.source} disabledReason={lockedReason}
      onChange={(next) => imp.chooseSource(next as ImportSource)}
      options={[{ value: "file", label: t("forms:catalog.import.sources.file") }, { value: "paste", label: t("forms:catalog.import.sources.paste") }]} />
  </OriginRow>;

  const fileRow = <OriginRow labelId={`${fileId}-label`} htmlFor={fileId} label={t("forms:catalog.import.file")} help={t("forms:catalog.import.fileHelp")}
    error={originError} errorId={originErrorId}>
    <input ref={fileInput} id={fileId} type="file" accept=".xlsx,.csv" hidden aria-invalid={originError ? true : undefined} aria-describedby={originError ? originErrorId : undefined}
      onChange={(event) => { const chosen = event.target.files?.[0] ?? null; event.target.value = ""; if (chosen) imp.chooseFile(chosen); }} />
    <span className="flex items-center justify-between gap-3">
      {imp.file ? <b className="min-w-0 font-semibold break-words">{imp.file.name}</b> : <span className="text-[var(--t3)]">{t("forms:catalog.import.noFile")}</span>}
      <Button type="button" size="sm" variant="outline" disabledReason={lockedReason} aria-describedby={originError ? originErrorId : undefined}
        onClick={() => fileInput.current?.click()}>
        {t(imp.file ? "forms:catalog.import.change" : "forms:catalog.import.choose")}
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
      numeric: column.column === "value" && valueType !== "Text" && valueType !== "Date",
    }))
    : imp.columns.map((column) => ({ key: column, label: columnLabel(column) }));
  const foreign = sheetColumns.filter((column) => column.invalid);
  const pasteZone = <ImportZone>
    <PasteGrid label={t("forms:catalog.import.pasted")} columns={sheetColumns} rows={sheet?.rows ?? null} disabled={locked}
      invalid={Boolean(originError)} describedBy={originError ? originErrorId : sheet ? pasteNoteId : undefined} onPaste={imp.paste} />
    {originError || sheet ? <div className="flex items-center justify-between gap-3 text-[0.8125rem] text-[var(--t2)]">
      {originError ? <p id={originErrorId} role="alert" className="text-[0.78125rem] text-[var(--peligro)]">{originError}</p>
        : <div id={pasteNoteId} className="flex flex-col gap-0.5">
          {foreign.length ? foreign.map((column) => <p key={column.key} className="text-[0.78125rem] text-[var(--peligro)]">{t("forms:catalog.import.foreignColumn", { column: column.label })}</p>)
            : <p>{t("forms:catalog.import.pastedRows", countOf(format, sheet?.rows.length ?? 0))}</p>}
        </div>}
      {sheet ? <Button type="button" size="sm" variant="link" disabledReason={lockedReason} onClick={imp.clearSheet}>{t("forms:catalog.import.clear")}</Button> : null}
    </div> : null}
  </ImportZone>;

  return <>
    <ImportBand aside={template}>{t("forms:catalog.import.origin")}</ImportBand>
    {fromRow}
    {imp.source === "file" ? fileRow : pasteZone}
  </>;
}
