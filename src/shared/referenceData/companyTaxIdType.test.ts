import { describe, expect, it } from "vitest";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { companyTaxIdType, defaultCompanyTaxIdType } from "./companyTaxIdType";

const type = referenceDataFixture().taxIdTypes[0];

describe("tipo empresarial D6", () => {
  it("ordena por SortOrder y después código ordinal, sin depender del nombre traducido", () => {
    const types = [
      { ...type, code: "AR-Z", name: "Primero", sortOrder: 1 },
      { ...type, code: "AR-A", name: "Último", sortOrder: 1 },
      { ...type, code: "AR-N", sortOrder: null },
      { ...type, code: "AR-D", isEnabled: false, sortOrder: 0 },
      { ...type, code: "AR-P", appliesTo: "Person", sortOrder: 0 },
    ];
    expect(defaultCompanyTaxIdType(types, "ar")?.code).toBe("AR-A");
    expect(defaultCompanyTaxIdType(types, "US")).toBeUndefined();
    expect(defaultCompanyTaxIdType(types, null)).toBeUndefined();
  });

  it("conserva un tipo guardado deshabilitado de otro país mientras el número sea el mismo", () => {
    const stored = { ...type, code: "AR-DNI", isEnabled: false };
    const original = { type: stored.code, number: "12345678" };
    expect(companyTaxIdType([stored], undefined, original, original.number)).toBe(stored);
    expect(companyTaxIdType([stored], type, original, "12345679")).toBe(type);
    expect(companyTaxIdType([stored], undefined, original, "12345679")).toBeUndefined();
  });
});
