import { beforeEach, describe, expect, it } from "vitest";
import i18n, { changeCulture, configureI18n } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { isValidTaxId, taxIdMaxLength, taxIdValidationMessage } from "./taxIdValidation";

const cuit = referenceDataFixture().taxIdTypes[0];
const dni = { ...cuit, code: "AR-DNI", label: "DNI", name: "DNI", mask: "99999999", validatorKey: "ar-dni-length" };

beforeEach(async () => {
  await configureI18n(referenceDataFixture().cultures);
  await changeCulture("es-AR");
});

describe("validación fiscal por catálogo y algoritmo", () => {
  it("usa el nombre traducido del catálogo para el mensaje", () => {
    expect(taxIdValidationMessage(i18n.t, { ...cuit, name: "CUIT de empresa" }, "33333333333"))
      .toBe("Ese CUIT de empresa no es válido: revisá los números.");
  });
  it("CUIT y CUIL distinguen once dígitos de los números inválidos, y el dato opcional vacío pasa", () => {
    for (const type of [cuit, { ...cuit, code: "AR-CUIL", label: "CUIL", name: "CUIL" }]) {
      expect(taxIdValidationMessage(i18n.t, type, "3333333333")).toBe(`Revisá el ${type.label}: son 11 números.`);
      expect(taxIdValidationMessage(i18n.t, type, "33333333333")).toBe(`Ese ${type.label} no es válido: revisá los números.`);
      expect(taxIdValidationMessage(i18n.t, type, "33333333339")).toBeUndefined();
      expect(taxIdValidationMessage(i18n.t, type, "")).toBeUndefined();
    }
    expect(isValidTaxId({ ...cuit, isEnabled: false }, "33333333339")).toBe(false);
  });

  it("deriva el límite de la máscara y respeta las dos longitudes del algoritmo DNI", () => {
    expect(taxIdMaxLength(dni)).toBe(8);
    expect(taxIdValidationMessage(i18n.t, dni, "123456")).toBe("Revisá el DNI: son entre 7 y 8 números.");
    expect(isValidTaxId(dni, "1234567")).toBe(true);
    expect(isValidTaxId(dni, "12345678")).toBe(true);
    expect(taxIdValidationMessage(i18n.t, dni, "12345678")).toBeUndefined();
  });

  it("usa los mismos placeholders y causas en inglés", async () => {
    await changeCulture("en-US");
    expect(taxIdValidationMessage(i18n.t, cuit, "3333333333")).toBe("Check the CUIT: it has 11 digits.");
    expect(taxIdValidationMessage(i18n.t, cuit, "33333333333")).toBe("That CUIT is invalid: check the numbers.");
    expect(taxIdValidationMessage(i18n.t, dni, "123456")).toBe("Check the DNI: it has between 7 and 8 digits.");
    expect(taxIdValidationMessage(i18n.t, { ...cuit, validatorKey: "unavailable" }, "33333333339"))
      .toBe("That CUIT is invalid: check the numbers.");
  });
});
