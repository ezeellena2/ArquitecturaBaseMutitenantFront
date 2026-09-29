import { createElement } from "react";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DataTable, type Column } from "./DataTable";

vi.mock("@/shared/format/useFormat", () => ({
  useFormat: () => ({ isLoading: false, formatEnum: () => "Activo", formatEmpty: () => "—" }),
}));
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

interface Row { id: string; name: string; status: string }

const primary: Column<Row> = { id: "name", header: "Nombre", type: "text", value: (row) => row.name, mobile: "primary" };
const status: Column<Row> = { id: "status", header: "Estado", type: "status", enum: "TestStatus", value: (row) => row.status, mobile: "status" };
const areaColumns = import.meta.glob<Record<string, unknown>>("../../areas/**/columns.tsx", { eager: true });

describe("columnas móviles", () => {
  it("verifica las definiciones reales cuando las áreas publiquen columns.tsx en E4", () => {
    for (const [file, module] of Object.entries(areaColumns)) {
      const definitions = Object.values(module).filter((value): value is Column<unknown>[] =>
        Array.isArray(value) && value.length > 0
        && value.every((item) => item && typeof item === "object" && "id" in item && "value" in item));
      expect(definitions.length, file).toBeGreaterThan(0);
      for (const columns of definitions) {
        expect(columns.filter((column) => column.mobile === "primary"), file).toHaveLength(1);
      }
    }
  });

  it("exige exactamente un dato principal por definición", () => {
    const row = { id: "1", name: "Ana", status: "Active" };
    const table = (columns: Column<Row>[]) => render(createElement(DataTable<Row>, { columns, rows: [row], rowKey: (item) => item.id }));
    expect(() => table([primary, status])).not.toThrow();
    expect(() => table([status])).toThrow(/primary/);
    expect(() => table([primary, primary])).toThrow(/primary/);
  });
});
