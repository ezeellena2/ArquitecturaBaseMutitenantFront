import type { FormatState } from "@/shared/format/useFormat";
import type { FormCatalogValueType } from "../api/types";

/** Las columnas de un catálogo a mano que se pegan o se importan, en el orden de la plantilla. */
export type CatalogImportColumn = "code" | "text" | "detail" | "value";

export const catalogImportColumns = (valueType: FormCatalogValueType): CatalogImportColumn[] =>
  valueType === "Text" ? ["code", "text", "detail"] : ["code", "text", "detail", "value"];

// Lo que el back lee como encabezado del CSV de lo pegado, sea cual sea el idioma de la pantalla.
const serverHeaders: Readonly<Record<CatalogImportColumn, string>> = { code: "Code", text: "Text", detail: "Detail", value: "Value" };
// Cómo se llama cada columna en una planilla, en español y en inglés, sin tildes ni mayúsculas.
const headerNames: Readonly<Record<CatalogImportColumn, readonly string[]>> = {
  code: ["codigo", "code"], text: ["texto", "text"], detail: ["detalle", "detail"], value: ["valor", "value"],
};
// La plantilla y la exportación dicen el tipo del valor: «Valor (entero)», «Value (date)».
const typedValue = /^(valor|value) \(/;

/** Como se compara un encabezado: sin tildes, en minúsculas y con un espacio entre palabras. */
export const normalizeHeader = (text: string) =>
  text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().split(/\s+/).filter(Boolean).join(" ");

function columnOf(header: string, columns: readonly CatalogImportColumn[]): CatalogImportColumn | null {
  const normalized = normalizeHeader(header);
  if (!normalized) return null;
  return columns.find((column) => headerNames[column].includes(normalized) || (column === "value" && typedValue.test(normalized))) ?? null;
}

/** La columna que nombra una fila de la revisión (`column`): la clave del back, o su encabezado. */
export function importColumnOf(column: string | null | undefined): CatalogImportColumn | null {
  return column ? columnOf(column, ["code", "text", "detail", "value"]) : null;
}

// Excel pone entre comillas una celda con tabulaciones, saltos de línea o comillas: se conserva lo de adentro.
function pastedRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = "", state: "start" | "plain" | "quoted" | "closed" = "start";
  const cell = () => { row.push(field); field = ""; state = "start"; };
  const line = () => { cell(); rows.push(row); row = []; };
  for (let index = 0; index < text.length; index++) {
    const character = text[index];
    if (state === "quoted") {
      if (character !== '"') field += character;
      else if (text[index + 1] === '"') { field += '"'; index++; }
      else state = "closed";
      continue;
    }
    if (character === "\t") cell();
    else if (character === "\r" || character === "\n") { if (character === "\r" && text[index + 1] === "\n") index++; line(); }
    else if (character === '"' && state === "start") state = "quoted";
    else { field += character; state = "plain"; }
  }
  if (row.length || field.length || state !== "start") line();
  return rows.filter((cells) => cells.some((value) => value.trim()));
}

/** Una columna de la grilla: una del catálogo (`column`) o una que no es del catálogo (`column` null), con la columna pegada
 *  que la llena (`source`, -1 si no se pegó). */
export interface PastedColumn {
  readonly column: CatalogImportColumn | null;
  /** El encabezado pegado de una ajena; sin encabezados, su número. */
  readonly header: string | null;
  readonly position: number;
  readonly source: number;
}

export interface PastedSheet {
  /** Las del catálogo en el orden de la plantilla, y después las ajenas, al final. */
  readonly columns: readonly PastedColumn[];
  /** Las filas de datos: si lo pegado traía encabezados, sin esa fila. */
  readonly rows: readonly (readonly string[])[];
}

/**
 * Lo pegado en la grilla (FRM-Catalogo-Importar): si la primera fila nombra alguna columna del catálogo, son los encabezados,
 * cada columna va a su lugar y esa fila no se importa; si no, las filas van en el orden de la plantilla. Una columna que no es
 * del catálogo queda al final. Las filas vacías no cuentan. Sin filas, `null`.
 */
export function readPaste(text: string, columns: readonly CatalogImportColumn[]): PastedSheet | null {
  const rows = pastedRows(text);
  if (!rows.length) return null;
  const first = rows[0].map((cell) => columnOf(cell, columns));
  const headed = first.some(Boolean);
  const width = Math.max(...rows.map((cells) => cells.length));
  const pasted = Array.from({ length: width }, (_, index) => headed
    ? { column: first[index] ?? null, header: rows[0][index]?.trim() || null }
    : { column: columns[index] ?? null, header: null });
  const used = new Set<number>();
  const sheetColumns: PastedColumn[] = columns.map((column) => {
    const source = pasted.findIndex((value, index) => value.column === column && !used.has(index));
    if (source >= 0) used.add(source);
    return { column, header: null, position: source + 1, source };
  });
  pasted.forEach((value, index) => {
    if (!used.has(index)) sheetColumns.push({ column: null, header: value.header, position: index + 1, source: index });
  });
  return { columns: sheetColumns, rows: headed ? rows.slice(1) : rows };
}

const csvCell = (value: string) => `"${value.replaceAll('"', '""')}"`;

/** El CSV que se revisa (C7): solo las columnas del catálogo que se pegaron, con el encabezado que lee el back. Una columna
 *  que no se pegó no va, así conserva lo guardado. */
export function pastedCsv(sheet: PastedSheet): string {
  const imported = sheet.columns.filter((column): column is PastedColumn & { column: CatalogImportColumn } => column.column !== null && column.source >= 0);
  const lines = [imported.map((column) => csvCell(serverHeaders[column.column])),
    ...sheet.rows.map((cells) => imported.map((column) => csvCell(cells[column.source] ?? "")))];
  return lines.map((cells) => cells.join(",")).join("\r\n");
}

const iso = (year: string, month: string, day: string) => `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;

/**
 * Las dos formas de escribir sin dudas lo que se lee de dos (C9): «1.500» es 1500 o 1,5 con la cultura de la pantalla, y
 * «3/4/2026» es el 3 de abril o el 4 de marzo, en ISO. `null` si el valor no tiene ninguna de esas formas.
 */
export function ambiguousReadings(value: string, format: FormatState): readonly [string, string] | null {
  const trimmed = value.trim();
  const number = /^(-?\d{1,3})[.,](\d{3})$/.exec(trimmed);
  if (number) {
    const [, whole, fraction] = number;
    const decimals = fraction.replace(/0+$/, "");
    const decimal = decimals ? format.formatDecimal(Number(`${whole}.${decimals}`), decimals.length) : format.formatInteger(Number(whole));
    return [`${whole}${fraction}`, decimal];
  }
  const date = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(trimmed);
  return date ? [iso(date[3], date[2], date[1]), iso(date[3], date[1], date[2])] : null;
}
