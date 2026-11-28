import { describe, expect, it, vi } from "vitest";
import { catalogLimits } from "./catalogLimits";
import { catalogProposalFields } from "./proposal";

// El contrato con otros topes, como si el back los hubiera subido: la pantalla y la propuesta tienen que seguirlos (O13). Lo
// demás del contrato queda como está, así una pieza que lee otro tope al cargarse (los campos, desde la E13) sigue andando.
vi.mock("@/shared/api/generated/validation", async (importOriginal) => {
  const { validationConstraints } = await importOriginal<typeof import("@/shared/api/generated/validation")>();
  return {
    validationConstraints: {
      ...validationConstraints,
      FormCatalogItemHttpInput: { ...validationConstraints.FormCatalogItemHttpInput, code: { maxLength: 41 }, text: { maxLength: 31 }, detail: { maxLength: 301 } },
      UpdateFormCatalogHttpRequest: {
        ...validationConstraints.UpdateFormCatalogHttpRequest,
        name: { maxLength: 61 }, description: { maxLength: 302 }, items: { maxItems: 10_001 }, moves: { maxItems: 500 }, deleteItems: { maxItems: 501 },
      },
      FormCatalogPreviewResponse: { ...validationConstraints.FormCatalogPreviewResponse, options: { maxItems: 201 } },
    },
  };
});

describe("los topes de un catálogo salen del contrato", () => {
  it("el nombre, la descripción, cada campo de una opción, las opciones y la vista previa", () => {
    expect(catalogLimits).toEqual({ name: 61, description: 302, itemText: 31, itemCode: 41, itemDetail: 301, items: 10_001, deleteItems: 501, previewOptions: 201 });
  });

  it("la propuesta del asistente valida con los mismos topes que el PUT", () => {
    const [options] = catalogProposalFields("Text");
    expect(options.maxItems).toBe(501);
    expect(Object.fromEntries((options.itemFields ?? []).map((field) => [field.name, field.maxLength]))).toEqual({ code: 41, text: 31, detail: 301, active: undefined });
  });
});
