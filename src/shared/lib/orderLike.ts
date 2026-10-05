/// Lo elegido, en el orden de lo guardado: lo que ya estaba conserva su lugar y lo nuevo va al final, en el orden en que
/// se eligió. Así, sacar un rol y volver a ponerlo no cuenta como un cambio y «Guardar cambios» sigue apagado (la ficha de
/// Usuario, «Roles en …» y «Roles de …»).
export function orderLike(saved: readonly (string | undefined)[] | undefined, chosen: readonly string[]): string[] {
  const kept = (saved ?? []).filter((id): id is string => id !== undefined && chosen.includes(id));
  return [...kept, ...chosen.filter((id) => !kept.includes(id))];
}
