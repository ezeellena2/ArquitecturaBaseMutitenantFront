/// Quita marcas diacríticas (tildes y signos combinantes) mediante descomposición Unicode NFD.
export function stripDiacritics(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "");
}

/// Pliega un texto para búsquedas y comparaciones sin distinguir tildes ni mayúsculas.
export function foldText(value: string, locale?: string): string {
  return stripDiacritics(value).toLocaleLowerCase(locale);
}

/// Pone en mayúscula la primera letra del texto respetando la cultura cuando se indica.
export function capitalize(value: string, locale?: string): string {
  return value ? value.charAt(0).toLocaleUpperCase(locale) + value.slice(1) : value;
}
