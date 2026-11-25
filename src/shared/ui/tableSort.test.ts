import { describe, expect, it } from "vitest";
import type { TFunction } from "i18next";
import type { Column } from "./DataTable";
import { nextSort, sortByLabel, sortRows } from "./tableSort";

interface Row { id: string; name: string | null; quantity: number | null; receivedAtUtc: string | null; status: "Received" | "Approved" | "Voided" }

const rows: Row[] = [
  { id: "1", name: "Obra Centro", quantity: 500, receivedAtUtc: "2026-10-14T12:30:00Z", status: "Approved" },
  { id: "2", name: null, quantity: 75.5, receivedAtUtc: "2026-10-12T14:05:00Z", status: "Voided" },
  { id: "3", name: "Ferretería Rosales", quantity: null, receivedAtUtc: "2026-10-15T19:20:00Z", status: "Received" },
  { id: "4", name: "aceros", quantity: 1250, receivedAtUtc: null, status: "Approved" },
];

const columns: Column<Row>[] = [
  { id: "name", header: "Cliente", type: "text", value: (row) => row.name, mobile: "primary", sortable: true },
  { id: "quantity", header: "Cantidad", type: "quantity", value: (row) => row.quantity, sortable: true },
  { id: "receivedAtUtc", header: "Recibida", type: "dateTime", value: (row) => row.receivedAtUtc, sortable: true },
  { id: "status", header: "Estado", type: "status", tones: { enum: "Test", tones: { Received: "pending", Approved: "success", Voided: "neutral" } }, value: (row) => row.status, mobile: "status", sortable: true },
  { id: "note", header: "Nota", type: "text", value: () => null },
];

const ids = (list: readonly Row[]) => list.map((row) => row.id);

const texts: Record<string, string> = {
  "sort.by": "Ordenar por",
  "sort.date.descending": "más reciente primero",
  "sort.text.ascending": "de la A a la Z",
};
const t = ((key: string, values?: Record<string, string>) => key === "sort.byValue" ? `Ordenar por: ${values?.column}, ${values?.direction}` : texts[key] ?? key) as unknown as TFunction;

// 264: una tabla que llega entera ordena en el navegador con la misma pieza; lo vacío va al final en los dos sentidos.
describe("sortRows", () => {
  it("ordena el texto sin mayúsculas ni tildes y deja lo vacío al final en los dos sentidos", () => {
    expect(ids(sortRows(rows, columns, "name"))).toEqual(["4", "3", "1", "2"]);
    expect(ids(sortRows(rows, columns, "-name"))).toEqual(["1", "3", "4", "2"]);
  });

  it("ordena números y fechas, con lo vacío al final", () => {
    expect(ids(sortRows(rows, columns, "-quantity"))).toEqual(["4", "1", "2", "3"]);
    expect(ids(sortRows(rows, columns, "quantity"))).toEqual(["2", "1", "4", "3"]);
    expect(ids(sortRows(rows, columns, "-receivedAtUtc"))).toEqual(["3", "1", "2", "4"]);
  });

  it("un estado ordena por su circuito y, con el mismo valor, queda el orden en que llegó", () => {
    expect(ids(sortRows(rows, columns, "status"))).toEqual(["3", "1", "4", "2"]);
    expect(ids(sortRows(rows, columns, "-status"))).toEqual(["2", "1", "4", "3"]);
  });

  it("un tipo del contrato ordena por el orden en que lo declaró el back, como ApplySort, y no por su nombre", () => {
    // TenantFeatureSource se declara Plan, Manual, Trial: por el nombre saldría Manual, Plan, Trial.
    interface Feature { id: string; source: "Plan" | "Manual" | "Trial" | null }
    const features: Feature[] = [{ id: "a", source: "Trial" }, { id: "b", source: null }, { id: "c", source: "Manual" }, { id: "d", source: "Plan" }];
    const sourceColumns: Column<Feature>[] = [{ id: "source", header: "Origen", type: "enum", enum: "TenantFeatureSource", value: (row) => row.source, sortable: true }];
    const sorted = (sort: string) => sortRows(features, sourceColumns, sort).map((row) => row.id);
    expect(sorted("source")).toEqual(["d", "c", "a", "b"]);
    expect(sorted("-source")).toEqual(["a", "c", "d", "b"]);
  });

  it("sin orden, con uno que no es una columna o una columna que no ordena, deja las filas como llegaron", () => {
    expect(ids(sortRows(rows, columns, undefined))).toEqual(["1", "2", "3", "4"]);
    expect(ids(sortRows(rows, columns, "-unknown"))).toEqual(["1", "2", "3", "4"]);
    expect(ids(sortRows(rows, columns, "note"))).toEqual(["1", "2", "3", "4"]);
  });
});

describe("«Ordenar por»", () => {
  it("dice el orden con palabras, o solo «Ordenar por» si no es una columna", () => {
    expect(sortByLabel(t, columns, "-receivedAtUtc")).toBe("Ordenar por: Recibida, más reciente primero");
    expect(sortByLabel(t, columns, "name")).toBe("Ordenar por: Cliente, de la A a la Z");
    expect(sortByLabel(t, columns, undefined)).toBe("Ordenar por");
    expect(sortByLabel(t, columns, "-createdAtUtc")).toBe("Ordenar por");
  });

  it("el primer toque va en el sentido útil y el segundo lo invierte", () => {
    const [name, quantity, received, status] = columns as [Column<Row>, Column<Row>, Column<Row>, Column<Row>];
    expect(nextSort(name, undefined)).toBe("name");
    expect(nextSort(name, "name")).toBe("-name");
    expect(nextSort(quantity, "name")).toBe("-quantity");
    expect(nextSort(quantity, "-quantity")).toBe("quantity");
    expect(nextSort(received, undefined)).toBe("-receivedAtUtc");
    expect(nextSort(status, undefined)).toBe("status");
  });
});
