/** Inicial de las dos primeras palabras, en mayúscula: el logo o el avatar sin imagen de los tableros («GD»). */
export function initials(name: string | null | undefined, fallback = ""): string {
  return name?.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]!.toLocaleUpperCase()).join("") || fallback;
}
