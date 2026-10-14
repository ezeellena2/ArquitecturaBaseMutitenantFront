import type { PhoneInputRequest } from "@/shared/api/types";
import { formatPhoneDraft } from "@/shared/phone/phoneInput";
import type { CountryReference } from "@/shared/referenceData/referenceData";

/// «Uno por renglón» (WA-Telefonos): cada renglón con algo escrito es un teléfono, tal cual lo cargó la persona.
export function phoneLines(text: string): string[] {
  return text.split(/\r?\n/).map((line) => line.trim()).filter((line) => line !== "");
}

/// Un archivo de texto o una planilla en CSV: un teléfono por fila, en la primera columna.
export function phoneLinesFromFile(content: string): string[] {
  return phoneLines(content).map((line) => line.split(/[;,\t]/)[0]?.replace(/^"|"$/g, "").trim() ?? "").filter((line) => line !== "");
}

/// Lo que espera la API de cada teléfono: país y número, como los emite `PhoneField` (telefonos.md). Un renglón con «+»
/// trae su país; los demás van con el país de la cultura. Quien decide si es válido es el back.
export function phoneInputs(lines: readonly string[], country: string, countries: readonly CountryReference[]): PhoneInputRequest[] {
  return lines.map((line) => {
    const draft = formatPhoneDraft(line, country, countries);
    return { country: draft.country, number: draft.number };
  });
}
