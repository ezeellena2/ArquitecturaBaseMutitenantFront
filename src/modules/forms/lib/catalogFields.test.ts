import { describe, expect, it } from "vitest";
import {
  fieldInPresentation, fieldUsingKey, freeKey, keyFromName, newFieldDraft, sameFieldsDraft, sortAfterFields, sortKindOf, sortOrderKey, typedKey,
  type CatalogFieldDraft,
} from "./catalogFields";

const field = (id: string | null, key: string, name = key): CatalogFieldDraft => ({ ...newFieldDraft(), localKey: id ?? `local-${key}`, id, key, name });

describe("catalogFields", () => {
  it("la clave nace del nombre como en el servidor: minúsculas, sin acentos, con _ y hasta 40", () => {
    expect(keyFromName("Plazo de pago")).toBe("plazo_de_pago");
    expect(keyFromName("  Código  ")).toBe("codigo");
    expect(keyFromName("2024 · Ventas")).toBe("campo_2024_ventas");
    expect(keyFromName("¿?")).toBe("campo");
    expect(keyFromName("a".repeat(50))).toHaveLength(40);
  });

  it("una clave que choca con un lugar de la presentación o con una quitada suma un número", () => {
    expect(freeKey("text", [])).toBe("text_2");
    expect(freeKey("zona", ["zona", "zona_2"])).toBe("zona_3");
    expect(freeKey("cuit", [])).toBe("cuit");
    expect(freeKey("a".repeat(40), ["a".repeat(40)])).toBe(`${"a".repeat(38)}_2`);
  });

  it("lo que se escribe en la clave queda en minúsculas, números y _", () => {
    expect(typedKey("Mi Clave-1")).toBe("miclave1");
  });

  it("dos claves chocan sin mirar mayúsculas", () => {
    const fields = [field("f-cuit", "CUIT"), field(null, "cuit", "Cuit")];
    expect(fieldUsingKey(fields, fields[1]!)?.name).toBe("CUIT");
    expect(fieldUsingKey(fields, field(null, "zona"))).toBeUndefined();
  });

  it("un campo está en «En WhatsApp» si es un lugar del título o de la descripción", () => {
    expect(fieldInPresentation({ title: ["text"], description: ["field:f-zona"] }, "f-zona")).toBe(true);
    expect(fieldInPresentation({ title: ["text"], description: ["detail"] }, "f-zona")).toBe(false);
    expect(fieldInPresentation(null, "f-zona")).toBe(false);
  });

  it("quitar el campo del orden pendiente lo cancela; «Texto», «Código» u otro campo lo conservan (224)", () => {
    const fields = [field("f-cuit", "cuit")];
    expect(sortAfterFields({ column: "f-plazo", descending: true }, fields)).toBeNull();
    expect(sortAfterFields({ column: "f-cuit", descending: true }, fields)).toEqual({ column: "f-cuit", descending: true });
    expect(sortAfterFields({ column: "Code", descending: false }, [])).toEqual({ column: "Code", descending: false });
    expect(sortAfterFields(null, fields)).toBeNull();
  });

  it("el sentido del orden se dice según el tipo de la columna", () => {
    const fields = [{ id: "f-n", type: "DecimalNumber" as const }, { id: "f-d", type: "Date" as const }, { id: "f-s", type: "YesNo" as const }, { id: "f-c", type: "Catalog" as const }];
    expect(sortKindOf("Text", fields)).toBe("text");
    expect(sortKindOf("f-n", fields)).toBe("number");
    expect(sortKindOf("f-d", fields)).toBe("date");
    expect(sortKindOf("f-s", fields)).toBe("yesNo");
    expect(sortKindOf("f-c", fields)).toBe("text");
    expect(sortOrderKey("text", true, true)).toBe("forms:catalog.sort.descendingInSentence");
    expect(sortOrderKey("date", false)).toBe("forms:catalog.sort.byKind.date.ascending");
  });

  it("«Listo» sin cambios no deja el catálogo con cambios", () => {
    const a = { fields: [field("f-cuit", "cuit")], confirmedRemovals: [] };
    expect(sameFieldsDraft(a, { fields: [{ ...a.fields[0]!, errors: { key: "x" } }], confirmedRemovals: [] })).toBe(true);
    expect(sameFieldsDraft(a, { fields: [{ ...a.fields[0]!, name: "CUIT" }], confirmedRemovals: [] })).toBe(false);
  });
});
