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
const status: Column<Row> = { id: "status", header: "Estado", type: "status", tones: { enum: "TestStatus", tones: { Active: "success" } }, value: (row) => row.status, mobile: "status" };
const areaColumns = import.meta.glob<Record<string, unknown>>("../../areas/**/columns.tsx", { eager: true });

function columnDefinitions(module: Record<string, unknown>): Column<unknown>[][] {
  return Object.entries(module).flatMap(([name, value]) => {
    if (Array.isArray(value) && value.length > 0
      && value.every((item) => item && typeof item === "object" && "id" in item && "value" in item)) {
      return [value as Column<unknown>[]];
    }
    if (name.startsWith("create") && name.endsWith("Columns") && typeof value === "function") {
      const factory = value as unknown as (t: (key: string, options?: unknown) => string) => Column<unknown>[];
      return [factory((key) => key)];
    }
    return [];
  });
}

describe("columnas móviles", () => {
  it("verifica las definiciones reales de columnas exportadas o creadas por las áreas", () => {
    for (const [file, module] of Object.entries(areaColumns)) {
      const definitions = columnDefinitions(module);
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
