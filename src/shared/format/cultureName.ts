import { capitalize } from "@/shared/lib/text";

export function nativeLanguageName(culture: string, language: string): string {
  const name = new Intl.DisplayNames([culture], { type: "language" }).of(language) ?? language;
  return capitalize(name, culture);
}

/// El nombre de una cultura en su propia lengua, con la región («English (United States)», «Español (Argentina)»),
/// como el desplegable del tablero Cuenta y el pie del ingreso. Las culturas siguen viniendo de Cultures; si el
/// navegador no conoce el código, queda el nombre que trae la API.
export function nativeCultureName(code: string, fallback: string): string {
  try {
    const name = new Intl.DisplayNames([code], { type: "language", languageDisplay: "standard" }).of(code);
    return name ? capitalize(name, code) : fallback;
  } catch {
    return fallback;
  }
}
