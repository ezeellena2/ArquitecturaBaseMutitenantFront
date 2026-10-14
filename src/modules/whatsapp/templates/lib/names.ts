/**
 * El nombre que propone «Duplicar» (decisión del coordinador sobre CC17): el de la original con `_2` o, si ya termina en
 * `_N`, con el número siguiente, sin pasar el largo del nombre (se acorta lo de adelante). El back no sugiere nombres:
 * si igual está tomado, su `WhatsApp.Template.NameTaken` cae en el campo.
 */
export function duplicateName(name: string, maxLength: number): string {
  const numbered = /^(.*)_(\d+)$/.exec(name);
  const base = numbered ? numbered[1] : name;
  const suffix = `_${numbered ? Number(numbered[2]) + 1 : 2}`;
  return `${base.slice(0, Math.max(0, maxLength - suffix.length))}${suffix}`;
}
