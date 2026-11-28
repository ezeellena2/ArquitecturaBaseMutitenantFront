import type { FormatState } from "@/shared/format/useFormat";
import type { FormCatalogFieldDetail, FormCatalogValueType } from "../api/types";

/** Las columnas fijas de un catálogo a mano que se pegan o se importan. */
export type CatalogImportColumn = "code" | "text" | "detail" | "value";

/** Un campo activo del catálogo (E13): su columna se reconoce por su nombre o por su clave, y viaja con la clave. */
export type CatalogImportField = Pick<FormCatalogFieldDetail, "id" | "key" | "name" | "type">;

/** Una columna de la grilla: una fija o la de un campo activo. */
export type ImportGridColumn = CatalogImportColumn | CatalogImportField;

export const isFieldColumn = (column: ImportGridColumn | null): column is CatalogImportField => typeof column === "object" && column !== null;

/** La clave de una columna de la grilla, para React: la fija por su nombre, un campo por su identidad. */
export const gridColumnKey = (column: ImportGridColumn) => isFieldColumn(column) ? `field-${column.id}` : column;

/**
 * Las columnas que se pegan o se importan, en el orden de la plantilla y de la exportación del servidor: el código, el texto, en
 * un catálogo tipado el valor, una por cada campo activo en el orden del catálogo (antes del detalle, como en la tabla de
 * opciones) y el detalle.
 */
export function catalogImportColumns(valueType: FormCatalogValueType, fields: readonly FormCatalogFieldDetail[] = []): ImportGridColumn[] {
  const active = fields.filter((field) => field.isActive).map(({ id, key, name, type }): CatalogImportField => ({ id, key, name, type }));
  return valueType === "Text" ? ["code", "text", ...active, "detail"] : ["code", "text", "value", ...active, "detail"];
}

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

const namesFixed = (normalized: string, column: CatalogImportColumn) =>
  headerNames[column].includes(normalized) || (column === "value" && typedValue.test(normalized));

/** Las columnas que puede nombrar un encabezado, de la más a la menos probable: una fija, un campo por su nombre y un campo por
 *  su clave. */
function columnsNamedBy(header: string, columns: readonly ImportGridColumn[]): ImportGridColumn[] {
  const normalized = normalizeHeader(header);
  if (!normalized) return [];
  const fields = columns.filter(isFieldColumn);
  return [
    ...columns.filter((column): column is CatalogImportColumn => !isFieldColumn(column) && namesFixed(normalized, column)),
    ...fields.filter((field) => normalizeHeader(field.name) === normalized),
    ...fields.filter((field) => field.key === normalized),
  ];
}

/** La columna fija que nombra una fila de la revisión (`column`): la clave del back, o su encabezado. */
export function importColumnOf(column: string | null | undefined): CatalogImportColumn | null {
  const normalized = column ? normalizeHeader(column) : "";
  return normalized ? (["code", "text", "detail", "value"] as const).find((fixed) => namesFixed(normalized, fixed)) ?? null : null;
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

/** Una columna de la grilla: una del catálogo o de uno de sus campos (`column`) o una que no es del catálogo (`column` null),
 *  con la columna pegada que la llena (`source`, -1 si no se pegó). */
export interface PastedColumn {
  readonly column: ImportGridColumn | null;
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
 * Con encabezados, como los lee el servidor: uno que es exactamente la clave de un campo es ese campo (así lo manda lo pegado);
 * los demás toman la primera columna que nombran y que ninguno anterior tomó, y si no queda ninguna, son ajenos. Un encabezado
 * que dice las dos cosas sigue el orden de la plantilla: el código, el texto y el valor van antes de los campos, y el detalle,
 * después; por eso un campo «Detalle» toma el primero de dos encabezados «Detalle», y la columna del detalle, el segundo.
 */
function headedColumns(headers: readonly string[], columns: readonly ImportGridColumn[]): (ImportGridColumn | null)[] {
  const taken = new Set<ImportGridColumn>();
  const named = headers.map((header): ImportGridColumn | null => {
    const field = columns.filter(isFieldColumn).find((item) => item.key === header.trim() && !taken.has(item));
    if (field) taken.add(field);
    return field ?? null;
  });
  const namesDetail = headers.map((header) => namesFixed(normalizeHeader(header), "detail"));
  return named.map((keyed, index) => {
    if (keyed) return keyed;
    const candidates = columnsNamedBy(headers[index], columns);
    const fieldFirst = namesDetail[index] && namesDetail.slice(index + 1).some(Boolean);
    const ordered = fieldFirst ? [...candidates.filter(isFieldColumn), ...candidates.filter((candidate) => !isFieldColumn(candidate))] : candidates;
    const column = ordered.find((candidate) => !taken.has(candidate)) ?? null;
    if (column) taken.add(column);
    return column;
  });
}

/**
 * Lo pegado en la grilla (FRM-Catalogo-Importar): si la primera fila nombra alguna columna del catálogo (una fija, o un campo
 * por su nombre o por su clave), son los encabezados, cada columna va a su lugar y esa fila no se importa; si no, las filas van
 * en el orden de la plantilla. Una columna que no es del catálogo queda al final. Las filas vacías no cuentan. Sin filas, `null`.
 */
export function readPaste(text: string, columns: readonly ImportGridColumn[]): PastedSheet | null {
  const rows = pastedRows(text);
  if (!rows.length) return null;
  const headed = rows[0].some((cell) => columnsNamedBy(cell, columns).length > 0);
  const named = headed ? headedColumns(rows[0], columns) : [];
  const width = Math.max(...rows.map((cells) => cells.length));
  const pasted = Array.from({ length: width }, (_, index) => headed
    ? { column: named[index] ?? null, header: rows[0][index]?.trim() || null }
    : { column: columns[index] ?? null, header: null });
  const sheetColumns: PastedColumn[] = columns.map((column) => {
    const source = pasted.findIndex((value) => value.column === column);
    return { column, header: null, position: source + 1, source };
  });
  pasted.forEach((value, index) => {
    if (value.column === null) sheetColumns.push({ column: null, header: value.header, position: index + 1, source: index });
  });
  return { columns: sheetColumns, rows: headed ? rows.slice(1) : rows };
}

const csvCell = (value: string) => `"${value.replaceAll('"', '""')}"`;

/** El CSV que se revisa (C7): solo las columnas del catálogo que se pegaron, con el encabezado que lee el back (la de un campo,
 *  su clave). Una columna que no se pegó no va, así conserva lo guardado. */
export function pastedCsv(sheet: PastedSheet): string {
  const imported = sheet.columns.filter((column): column is PastedColumn & { column: ImportGridColumn } => column.column !== null && column.source >= 0);
  const header = (column: ImportGridColumn) => isFieldColumn(column) ? column.key : serverHeaders[column];
  const lines = [imported.map((column) => csvCell(header(column.column))),
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
