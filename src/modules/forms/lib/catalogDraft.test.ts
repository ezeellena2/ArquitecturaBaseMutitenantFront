import { describe, expect, it } from "vitest";
import { createFormatters } from "@/shared/format/formatters";
import type { FormatState } from "@/shared/format/useFormat";
import { referenceDataFixture } from "@/test/mocks/handlers";
import type { FormCatalogItemRow } from "../api/types";
import { catalogRows, cleanEdits, type CatalogDraftState } from "./catalogDraft";

const format = {
  ...createFormatters({ referenceData: referenceDataFixture("es-AR"), culture: "es-AR", timeZone: "UTC", translate: (key: string) => key }),
  isLoading: false, parseDecimalText: (input: string) => input.replace(",", "."),
} as unknown as FormatState;
const t = (key: string, options?: Record<string, unknown>) => options?.n !== undefined ? `${key}:${String(options.n)}` : key;
const saved = (id: string, position: number, text: string, code: string): FormCatalogItemRow =>
  ({ id, position, text, code, detail: null, value: "1", isActive: true, textRepeated: false, fields: {} });
const empty: CatalogDraftState = { edits: {}, added: [], deletes: new Set(), moves: [], positions: {}, sort: null, serverErrors: {} };
const rows = (state: CatalogDraftState, showErrors: boolean) =>
  catalogRows({ pageRows: [saved("i-1", 1, "Uno", "UNO"), saved("i-2", 2, "Dos", "DOS")], extraRows: [], state, valueType: "WholeNumber", showErrors, format, t });

describe("las filas del borrador de un catálogo", () => {
  it("antes de intentar guardar, una opción nueva sin valor no se ve en rojo, pero igual frena el guardado", () => {
    const state = { ...empty, added: [{ localId: "local-1", code: "", text: "", detail: "", value: "", isActive: true }] };
    const [, , fresh] = rows(state, false);
    expect(fresh.errors).toEqual({});
    expect(fresh.problems.value).toBe("forms:catalog.errors.valueRequired");
    expect(rows(state, true)[2].errors.value).toBe("forms:catalog.errors.valueRequired");
  });

  it("el error del servidor se ve siempre, y el código repetido o largo, después de intentar", () => {
    const state = { ...empty, edits: { "i-2": { code: "UNO" } }, serverErrors: { "i-1": { text: "Ya existe." } } };
    expect(rows(state, false)[0].errors).toEqual({ text: "Ya existe." });
    expect(rows(state, true)[1].errors.code).toBe("forms:catalog.errors.duplicateCode:1");
    // La guardada que ya tenía el código no se marca: el repetido es de la que lo escribió.
    expect(rows(state, true)[0].problems.code).toBeUndefined();
    const long = { ...empty, edits: { "i-1": { code: "X".repeat(41) } } };
    expect(rows(long, true)[0].errors.code).toBe("forms:catalog.errors.codeTooLong:40");
  });

  it("lo que vuelve a lo guardado deja de ser un cambio", () => {
    expect(cleanEdits({ text: "Uno", code: "U1" }, { text: "Uno", code: "UNO", detail: "", value: "1", isActive: true })).toEqual({ code: "U1" });
  });
});
