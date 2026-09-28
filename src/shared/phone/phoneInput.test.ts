import { describe, expect, it } from "vitest";
import type { CountryReference } from "@/shared/referenceData/referenceData";
import { formatPhoneDraft } from "./phoneInput";

const countries = [
  { code: "AR", callingCode: "54", isEnabled: true },
  { code: "UY", callingCode: "598", isEnabled: true },
] as CountryReference[];

describe("formatPhoneDraft", () => {
  it("aplica AsYouType al número nacional sin emitir E.164", () => {
    expect(formatPhoneDraft("1123456789", "AR", countries))
      .toEqual({ country: "AR", number: "11 2345-6789", isValid: true });
  });

  it("detecta el país al pegar el prefijo internacional y conserva un número nacional legible", () => {
    const draft = formatPhoneDraft("+598 94 123 456", "AR", countries);
    expect(draft.country).toBe("UY");
    expect(draft.number).toContain("94 123 456");
    expect(draft.number).not.toContain("+598");
    expect(draft.isValid).toBe(true);
  });

  it("marca incompleto un número mientras se escribe", () => {
    expect(formatPhoneDraft("11 2", "AR", countries)).toMatchObject({ country: "AR", isValid: false });
  });
});
