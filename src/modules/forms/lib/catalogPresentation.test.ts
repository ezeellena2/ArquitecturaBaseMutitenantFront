import { describe, expect, it } from "vitest";
import { createFormatters } from "@/shared/format/formatters";
import { parseDecimalText } from "@/shared/format/parsers";
import type { FormatState } from "@/shared/format/useFormat";
import { referenceDataFixture } from "@/test/mocks/handlers";
import type { FormCatalogItemRow } from "../api/types";
import { buildPresentation, draftPlaceText, normalizePresentation, orderedPlaces, placeKeys, savedPlaceText, type PresentationSource } from "./catalogPresentation";

// Los números y el «Sí» los formatea y los lee shared/format, el de verdad; la fecha, una marca para ver que pasa por formatDate.
const referenceData = referenceDataFixture("es-AR");
const profile = referenceData.cultures.find((culture) => culture.code === "es-AR")!;
const esAR = {
  ...createFormatters({ referenceData, culture: "es-AR", timeZone: "UTC",
    translate: (key: string) => ({ "format:boolean.true": "Sí", "format:boolean.false": "No" } as Record<string, string>)[key] ?? key }),
  isLoading: false, formatDate: (value: string) => `fecha ${value}`, parseDecimalText: (input: string) => parseDecimalText(input, profile),
} as unknown as FormatState;

// Tablero FRM-Catalogo-13: «Proveedores», con CUIT (texto), Zona (de otro catálogo), Plazo (número), Alta (fecha) y Retiene IVA.
const source: PresentationSource = {
  valueType: "Text",
  fields: [{ id: "f-cuit", type: "Text" }, { id: "f-zona", type: "Catalog" }, { id: "f-plazo", type: "WholeNumber" },
    { id: "f-alta", type: "Date" }, { id: "f-iva", type: "YesNo" }],
  sourceItem: (itemId) => itemId === "z-cap" ? { text: "Capital" } : undefined,
};

const row = (overrides: Partial<FormCatalogItemRow> = {}): FormCatalogItemRow => ({
  id: "i-1", code: "ABR", text: "Abrasivos del Sur", detail: "Lijas y discos", value: null, position: 1, isActive: true,
  textRepeated: false, fields: { "f-cuit": "30-71234567-1", "f-zona": "z-cap", "f-plazo": "15000", "f-alta": "2026-03-15", "f-iva": false },
  presentationIssue: null, ...overrides,
});

describe("la presentación de un catálogo en WhatsApp (E13)", () => {
  it("los lugares van en el orden del catálogo: texto, código, el valor si es tipado, los campos y el detalle (285)", () => {
    expect(placeKeys(source)).toEqual(["text", "code", "field:f-cuit", "field:f-zona", "field:f-plazo", "field:f-alta", "field:f-iva", "detail"]);
    expect(placeKeys({ ...source, valueType: "DecimalNumber", fields: [] })).toEqual(["text", "code", "value", "detail"]);
    // Lo que elige la pieza se ordena como el catálogo, sin repetir y sin lo que ya no está.
    expect(orderedPlaces(["detail", "field:f-zona", "text", "field:f-viejo", "text"], placeKeys(source))).toEqual(["text", "field:f-zona", "detail"]);
  });

  it("se arma como el servidor: los lugares con contenido, unidos con « · », cada valor como se lee", () => {
    const built = buildPresentation({ title: ["text"], description: ["field:f-cuit", "field:f-zona", "field:f-plazo", "field:f-alta", "field:f-iva", "code"] },
      savedPlaceText(row(), source, esAR));
    expect(built).toEqual({ title: "Abrasivos del Sur", description: "30-71234567-1 · Capital · 15.000 · fecha 2026-03-15 · No · ABR", issue: null });
    // Lo vacío no deja un « · » de más: sin detalle ni zona.
    expect(buildPresentation({ title: ["text", "detail"], description: ["field:f-zona", "field:f-cuit"] },
      savedPlaceText(row({ detail: null, fields: { "f-cuit": "30-71234567-1" } }), source, esAR)))
      .toEqual({ title: "Abrasivos del Sur", description: "30-71234567-1", issue: null });
  });

  it("el valor de un catálogo tipado se lee con la región del idioma", () => {
    const typed: PresentationSource = { valueType: "DecimalNumber", fields: [] };
    expect(buildPresentation({ title: ["text", "value"], description: [] }, savedPlaceText(row({ text: "Chico", value: "2500.5" }), typed, esAR)).title)
      .toBe("Chico · 2.500,5");
  });

  it("un título de más de 30 o sin contenido, y una descripción de más de 300, no entran", () => {
    const long = "Aceros y perfiles laminados para estructuras";
    expect(buildPresentation({ title: ["detail"], description: [] }, savedPlaceText(row({ detail: long }), source, esAR)))
      .toEqual({ title: long, description: "", issue: "TitleTooLong" });
    expect(buildPresentation({ title: ["text"], description: [] }, savedPlaceText(row({ text: "x".repeat(30) }), source, esAR)).issue).toBeNull();
    expect(buildPresentation({ title: ["code"], description: [] }, savedPlaceText(row({ code: "" }), source, esAR)).issue).toBe("TitleEmpty");
    expect(buildPresentation({ title: ["text"], description: ["detail"] }, savedPlaceText(row({ detail: "d".repeat(301) }), source, esAR)).issue)
      .toBe("DescriptionTooLong");
  });

  it("en el borrador, lo escrito se lee como se guardaría; lo que no se puede leer, como está escrito", () => {
    const draft = { code: "ABR", text: "Abrasivos del Sur", detail: "", value: "", isActive: true,
      fields: { "f-cuit": "30-71234567-1", "f-zona": "z-cap", "f-plazo": "15000", "f-iva": true } };
    expect(buildPresentation({ title: ["text"], description: ["field:f-plazo", "field:f-zona", "field:f-iva"] }, draftPlaceText(draft, source, esAR)).description)
      .toBe("15.000 · Capital · Sí");
    expect(buildPresentation({ title: ["text"], description: ["field:f-plazo"] },
      draftPlaceText({ ...draft, fields: { "f-plazo": "1.500" } }, source, esAR)).description).toBe("1.500");
  });

  it("sin los campos que ya no están, y el título nunca vacío: vuelve al texto, como el servidor", () => {
    const keys = placeKeys({ ...source, fields: [{ id: "f-cuit" }] });
    expect(normalizePresentation({ title: ["field:f-zona"], description: ["field:f-cuit", "field:f-zona"] }, keys))
      .toEqual({ title: ["text"], description: ["field:f-cuit"] });
  });
});
