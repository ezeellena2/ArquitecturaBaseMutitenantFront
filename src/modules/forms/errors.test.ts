import { describe, expect, it } from "vitest";
import { ApiError } from "@/shared/api/ApiError";
import { catalogErrorField, catalogFieldErrors, catalogInvalidRows, isCatalogConflict } from "./errors";

const rejected = (code: string, status = 409, errors?: Record<string, string[]>) => new ApiError(status, { status, code, detail: "Texto del back.", traceId: "t", errors });

describe("isCatalogConflict", () => {
  // Solo el 409 común pone el editor en conflicto (lado a lado, 138); los demás 409 dicen lo suyo donde van.
  it("marca conflicto solo con General.ConcurrencyConflict", () => {
    expect(isCatalogConflict(rejected("General.ConcurrencyConflict", 409, { version: ["Otra persona cambió esto."] }))).toBe(true);
  });

  it.each([
    "Forms.Catalog.WrongSource", "Forms.Catalog.TooManyItems", "Forms.Catalog.ItemInUse", "Forms.Catalog.MoveOutOfRange", "Forms.Catalog.Inactive",
    "Forms.CatalogImport.FileChanged", "Forms.CatalogImport.Busy", "Request.InProgress", "Forms.Catalog.SourceInUse",
  ])("el 409 %s no es un conflicto", (code) => {
    expect(isCatalogConflict(rejected(code))).toBe(false);
  });

  it("lo que no es del back no es un conflicto", () => {
    expect(isCatalogConflict(new Error("bug"))).toBe(false);
    expect(isCatalogConflict(ApiError.network())).toBe(false);
  });
});

describe("catalogErrorField", () => {
  // «Errores y sus textos» de la spec: cada código con su campo.
  it.each([
    ["Forms.Catalog.ItemNotFound", "row", 404],
    ["Forms.Catalog.ItemInUse", "row", 409],
    ["Forms.Catalog.DuplicateCode", "code", 400],
    ["Forms.Catalog.ValueRequired", "value", 400],
    ["Forms.Catalog.ValueInvalid", "value", 400],
    ["Forms.Catalog.ItemTextTooLong", "text", 400],
    ["Forms.Catalog.ItemDetailTooLong", "detail", 400],
    ["Forms.Catalog.FiltersInvalid", "condition", 400],
    ["Forms.Catalog.SampleRequired", "sample", 400],
    ["Forms.Catalog.SampleMemberNotFound", "sample", 400],
    ["Forms.Catalog.SampleContactNotFound", "sample", 400],
    ["Forms.CatalogImport.FileInvalid", "file", 400],
    // E13: la lista de campos, un campo del modal, el valor de un campo en una opción y «En WhatsApp».
    ["Forms.Catalog.TooManyFields", "fields", 400],
    ["Forms.Catalog.FieldKeyDuplicate", "field", 400],
    ["Forms.Catalog.FieldInvalid", "field", 400],
    ["Forms.Catalog.FieldRemovalNotConfirmed", "field", 400],
    ["Forms.Catalog.FieldTypeNotConvertible", "field", 400],
    ["Forms.Catalog.FieldValuesIncompatible", "field", 400],
    ["Forms.Catalog.FieldValuesMissing", "field", 400],
    ["Forms.Catalog.FieldValueInvalid", "fieldValue", 400],
    ["Forms.Catalog.FieldValueRequired", "fieldValue", 400],
    ["Forms.Catalog.FieldValueDuplicate", "fieldValue", 400],
    ["Forms.Catalog.PresentationInvalid", "presentation", 400],
  ] as const)("%s va en %s", (code, field, status) => {
    expect(catalogErrorField(rejected(code, status))).toBe(field);
  });

  it("lo que va en la franja no tiene campo", () => {
    for (const code of ["General.ConcurrencyConflict", "Forms.Catalog.Inactive", "Forms.Catalog.WrongSource", "Forms.Catalog.TooManyItems", "Forms.Catalog.MoveOutOfRange",
      "Forms.CatalogImport.ConfirmationRequired", "Forms.CatalogImport.Busy", "Forms.CatalogImport.FileChanged", "Forms.CatalogImport.TooManyAtOnce",
      "Forms.Catalog.SourceInUse"]) {
      expect(catalogErrorField(rejected(code)), code).toBeNull();
    }
    expect(catalogErrorField(new Error("bug"))).toBeNull();
  });
});

describe("catalogFieldErrors", () => {
  // El índice es el de la lista que se mandó (`items`, `deleteItems`, `moves` o `conditions`), no el de la tabla.
  it("lee la lista, el índice y la columna de cada clave, con el texto del back", () => {
    const error = rejected("Validation.Failed", 400, {
      "items[3].code": ["Ya está en la opción 2."], "deleteItems[0]": ["Esa opción no es de este catálogo."], "moves[1]": ["Esa opción no es de este catálogo."],
      "conditions[2]": ["Revisá esta condición."], sampleMemberId: ["Elegí una persona."], name: ["Escribí el nombre."], file: [],
    });
    expect(catalogFieldErrors(error)).toEqual([
      { list: "items", index: 3, field: "code", message: "Ya está en la opción 2." },
      { list: "deleteItems", index: 0, field: "row", message: "Esa opción no es de este catálogo." },
      { list: "moves", index: 1, field: "row", message: "Esa opción no es de este catálogo." },
      { list: "conditions", index: 2, field: "condition", message: "Revisá esta condición." },
      { list: null, index: null, field: "sample", message: "Elegí una persona." },
      { list: null, index: null, field: "name", message: "Escribí el nombre." },
    ]);
  });

  // Desde la B3 el back nombra los campos con puntos, como manda validacion.md y como los arma FluentValidation.
  it("lee igual las claves con puntos: items.3.code, deleteItems.0, moves.1 y conditions.2", () => {
    const error = rejected("Validation.Failed", 400, {
      "items.3.code": ["Ya está en la opción 2."], "items.4": ["Está repetido en el pedido."], "deleteItems.0": ["Esa opción no es de este catálogo."],
      "moves.1": ["Esa opción no es de este catálogo."], "conditions.2": ["Revisá esta condición."],
    });
    expect(catalogFieldErrors(error)).toEqual([
      { list: "items", index: 3, field: "code", message: "Ya está en la opción 2." },
      { list: "items", index: 4, field: "row", message: "Está repetido en el pedido." },
      { list: "deleteItems", index: 0, field: "row", message: "Esa opción no es de este catálogo." },
      { list: "moves", index: 1, field: "row", message: "Esa opción no es de este catálogo." },
      { list: "conditions", index: 2, field: "condition", message: "Revisá esta condición." },
    ]);
  });

  // E13: `fields` (el tope), `fields.{i}` con su parte (`key`, `type`, `required`…), `items.{i}.fields.{id del campo}` y
  // `presentation`. El índice de `fields` es el de la lista de campos que se mandó.
  it("lee los campos, su parte, el valor de un campo en una opción y la presentación", () => {
    const field = "0b6f3c5e-8a1d-4f2b-9c3e-5d7a1b2c3d4e";
    const error = rejected("Validation.Failed", 400, {
      fields: ["Llegó a 20 campos, el máximo de un catálogo."], "fields.1.key": ["Ya la usa «CUIT»."], "fields[2]": ["Revisá el tipo, las reglas o el catálogo de este campo."],
      "fields.0.type": ["1.097 opciones tienen un valor que no es un número entero."], "fields.3.required": ["2 opciones activas no tienen valor."],
      [`items.4.fields.${field}`]: ["Ya lo tiene la opción 2."], [`items[5].fields.${field}`]: ["Completá este dato."], presentation: ["Revisá qué va en el título y en la descripción."],
      "presentation.title": ["Revisá qué va en el título y en la descripción."],
    });
    expect(catalogFieldErrors(error)).toEqual([
      { list: null, index: null, field: "fields", message: "Llegó a 20 campos, el máximo de un catálogo." },
      { list: "fields", index: 1, field: "field", part: "key", message: "Ya la usa «CUIT»." },
      { list: "fields", index: 2, field: "field", message: "Revisá el tipo, las reglas o el catálogo de este campo." },
      { list: "fields", index: 0, field: "field", part: "type", message: "1.097 opciones tienen un valor que no es un número entero." },
      { list: "fields", index: 3, field: "field", part: "required", message: "2 opciones activas no tienen valor." },
      { list: "items", index: 4, field: "fieldValue", fieldId: field, message: "Ya lo tiene la opción 2." },
      { list: "items", index: 5, field: "fieldValue", fieldId: field, message: "Completá este dato." },
      { list: null, index: null, field: "presentation", message: "Revisá qué va en el título y en la descripción." },
      { list: null, index: null, field: "presentation", message: "Revisá qué va en el título y en la descripción." },
    ]);
    // Sin la parte, no hay `part`; sin el campo, no hay `fieldId`.
    expect(catalogFieldErrors(error)[2]).not.toHaveProperty("part");
    expect(catalogFieldErrors(error)[0]).not.toHaveProperty("fieldId");
  });

  it("sin errores por campo, o con una clave que el editor no tiene, no devuelve nada de eso", () => {
    expect(catalogFieldErrors(rejected("Forms.Catalog.TooManyItems"))).toEqual([]);
    expect(catalogFieldErrors(rejected("Validation.Failed", 400, { "items[x].code": ["?"], other: ["?"] }))).toEqual([]);
    expect(catalogFieldErrors(new Error("bug"))).toEqual([]);
  });
});

// E13: cambiar el tipo o una regla de un campo con valores que no la cumplen trae `invalidCount` y hasta 50 `invalidRows`.
describe("catalogInvalidRows", () => {
  const row = { position: 3, itemId: "1c7e4d6f-9b2e-4a3c-8d4f-6e8b2c3d4e5f", text: "Norte", reason: "invalid" } as const;

  it("lee la cantidad y las filas, con su posición, la opción, el texto y el motivo", () => {
    const error = new ApiError(400, { status: 400, code: "Forms.Catalog.FieldTypeNotConvertible", traceId: "t", invalidCount: 1097, invalidRows: [row] });
    expect(catalogInvalidRows(error)).toEqual({ count: 1097, rows: [row] });
  });

  it("sin filas, o con otro error, no hay nada que mostrar", () => {
    expect(catalogInvalidRows(rejected("Forms.Catalog.FieldValuesMissing", 400))).toBeNull();
    expect(catalogInvalidRows(new ApiError(400, { status: 400, code: "Forms.Catalog.FieldValuesIncompatible", traceId: "t", invalidCount: null, invalidRows: null }))).toBeNull();
    expect(catalogInvalidRows(new Error("bug"))).toBeNull();
  });

  it("sin la cantidad, cuenta las filas que llegaron", () => {
    const error = new ApiError(400, { status: 400, code: "Forms.Catalog.FieldValuesIncompatible", traceId: "t", invalidRows: [row, { ...row, position: 4, reason: "range" }] });
    expect(catalogInvalidRows(error)?.count).toBe(2);
  });
});
