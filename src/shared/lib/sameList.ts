/** Dos listas con los mismos valores en el mismo orden; `null` y ausente valen como vacía. Para `sameOperation`. */
export function sameList<T>(previous: readonly T[] | null | undefined, next: readonly T[] | null | undefined): boolean {
  const before = previous ?? []; const after = next ?? [];
  return before.length === after.length && before.every((item, index) => item === after[index]);
}
