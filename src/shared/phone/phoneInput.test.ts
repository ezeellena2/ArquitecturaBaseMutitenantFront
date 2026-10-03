import { describe, expect, it } from "vitest";
import type { CountryReference } from "@/shared/referenceData/referenceData";
import { formatPhoneDraft, phoneDraftFromE164 } from "./phoneInput";

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

describe("phoneDraftFromE164", () => {
  it("separa un teléfono guardado en país y número nacional para editarlo", () => {
    expect(phoneDraftFromE164("+541143215678")).toEqual({ country: "AR", number: "011 4321-5678" });
  });

  it("sin teléfono no hay borrador y uno irreconocible queda tal cual", () => {
    expect(phoneDraftFromE164(null)).toBeNull();
    expect(phoneDraftFromE164("")).toBeNull();
    expect(phoneDraftFromE164("12")).toEqual({ country: "", number: "12" });
  });
});
