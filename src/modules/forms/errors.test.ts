import { describe, expect, it } from "vitest";
import { ApiError } from "@/shared/api/ApiError";
import { catalogErrorField, catalogFieldErrors, isCatalogConflict } from "./errors";

const rejected = (code: string, status = 409, errors?: Record<string, string[]>) => new ApiError(status, { status, code, detail: "Texto del back.", traceId: "t", errors });

describe("isCatalogConflict", () => {
  // Solo el 409 común pone el editor en conflicto (lado a lado, 138); los demás 409 dicen lo suyo donde van.
  it("marca conflicto solo con General.ConcurrencyConflict", () => {
    expect(isCatalogConflict(rejected("General.ConcurrencyConflict", 409, { version: ["Otra persona cambió esto."] }))).toBe(true);
  });

  it.each([
    "Forms.Catalog.WrongSource", "Forms.Catalog.TooManyItems", "Forms.Catalog.ItemInUse", "Forms.Catalog.MoveOutOfRange", "Forms.Catalog.Inactive",
    "Forms.CatalogImport.FileChanged", "Forms.CatalogImport.Busy", "Request.InProgress",
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
  ] as const)("%s va en %s", (code, field, status) => {
    expect(catalogErrorField(rejected(code, status))).toBe(field);
  });

  it("lo que va en la franja no tiene campo", () => {
    for (const code of ["General.ConcurrencyConflict", "Forms.Catalog.Inactive", "Forms.Catalog.WrongSource", "Forms.Catalog.TooManyItems", "Forms.Catalog.MoveOutOfRange",
      "Forms.CatalogImport.ConfirmationRequired", "Forms.CatalogImport.Busy", "Forms.CatalogImport.FileChanged", "Forms.CatalogImport.TooManyAtOnce"]) {
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

  it("sin errores por campo, o con una clave que el editor no tiene, no devuelve nada de eso", () => {
    expect(catalogFieldErrors(rejected("Forms.Catalog.TooManyItems"))).toEqual([]);
    expect(catalogFieldErrors(rejected("Validation.Failed", 400, { "items[x].code": ["?"], other: ["?"] }))).toEqual([]);
    expect(catalogFieldErrors(new Error("bug"))).toEqual([]);
  });
});
