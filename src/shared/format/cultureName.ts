export function nativeLanguageName(culture: string, language: string): string {
  const name = new Intl.DisplayNames([culture], { type: "language" }).of(language) ?? language;
  return name.charAt(0).toLocaleUpperCase(culture) + name.slice(1);
}
