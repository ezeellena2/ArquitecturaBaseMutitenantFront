/// Un permiso del selector: su nombre, qué permite (la (i) del área), lo que incluye (260) y si quien edita lo puede dar
/// (269). En la organización y en una empresa sale tal cual de `GET /api/permissions`; en Plataforma lo arma
/// `platformPermissionGroups` con los nombres del front y `includes` y `grantable` de `GET /api/platform/permissions`.
export interface PermissionChoiceItem {
  readonly code: string;
  readonly name: string;
  readonly description: string;
  readonly includes: readonly string[];
  readonly grantable: boolean;
}

/// Un área del selector, con sus permisos en el orden del catálogo.
export interface PermissionAreaGroup {
  readonly area: string;
  readonly name: string;
  readonly permissions: readonly PermissionChoiceItem[];
}

// Ordenada y sin repetidos: así lo elegido se compara con lo guardado aunque se marque en otro orden.
export const canonicalPermissions = (codes: Iterable<string>): string[] => [...new Set(codes)].sort();

const allPermissions = (groups: readonly PermissionAreaGroup[]) => groups.flatMap((group) => group.permissions);

/// Lo que un rol permite de verdad (260): lo elegido más lo que incluye cada permiso, en cadena («Administrar usuarios»
/// incluye «Ver usuarios»). Qué incluye cada uno lo manda el back (`includes`); el front no lo repite. Ordenado y sin
/// repetidos, como lo siembra, lo compara y lo guarda el editor; un código que el catálogo no nombra queda como está.
export function allowedPermissions(groups: readonly PermissionAreaGroup[], picked: readonly string[]): string[] {
  const includes = new Map(allPermissions(groups).map((permission) => [permission.code, permission.includes] as const));
  const allowed = [...new Set(picked)];
  const codes = new Set(allowed);
  // La lista crece mientras se recorre: lo incluido también suma lo suyo.
  for (let index = 0; index < allowed.length; index++) {
    for (const code of includes.get(allowed[index]) ?? []) {
      if (!codes.has(code)) {
        codes.add(code);
        allowed.push(code);
      }
    }
  }
  return canonicalPermissions(allowed);
}

/// Quién incluye a un permiso marcado: los nombres de los marcados que lo incluyen, en el orden del catálogo. Mientras
/// alguno lo incluye, su casilla queda marcada y apagada con ese motivo.
export function includedBy(groups: readonly PermissionAreaGroup[], picked: readonly string[], code: string): string[] {
  const pickedCodes = new Set(picked);
  return allPermissions(groups)
    .filter((permission) => permission.code !== code && pickedCodes.has(permission.code) && permission.includes.includes(code))
    .map((permission) => permission.name);
}

/// Marcar un permiso suma lo que incluye; desmarcarlo saca solo ese, y lo que incluía queda marcado y vuelve a poder tocarse.
export function changePermission(groups: readonly PermissionAreaGroup[], picked: readonly string[], code: string, checked: boolean): string[] {
  return checked ? allowedPermissions(groups, [...picked, code]) : canonicalPermissions(picked.filter((item) => item !== code));
}

/// La casilla del área: vacía, parcial o completa.
export function areaState(group: PermissionAreaGroup, picked: readonly string[]): "empty" | "partial" | "full" {
  const count = group.permissions.filter((permission) => picked.includes(permission.code)).length;
  return count === 0 ? "empty" : count === group.permissions.length ? "full" : "partial";
}

/// Elegir o quitar el área entera: completa, la vacía; si no, suma lo que falta y lo que eso incluye.
export function toggleArea(groups: readonly PermissionAreaGroup[], group: PermissionAreaGroup, picked: readonly string[]): string[] {
  const codes = group.permissions.map((permission) => permission.code);
  return areaState(group, picked) === "full"
    ? allowedPermissions(groups, picked.filter((code) => !codes.includes(code)))
    : allowedPermissions(groups, [...picked, ...codes]);
}

/// Si quien edita no puede dar o quitar todo lo del área (269 y 0061): su casilla queda apagada con su motivo.
export function areaHasUngrantable(group: PermissionAreaGroup): boolean {
  return group.permissions.some((permission) => permission.grantable === false);
}

/// Si un área arranca abierta (260): la que tiene algo en lo guardado o en lo elegido. Un rol nuevo arranca con todas
/// cerradas, y cuando la persona abre o cierra un área, manda lo que eligió.
export function areaStartsOpen(group: PermissionAreaGroup, saved: readonly string[], picked: readonly string[]): boolean {
  return group.permissions.some((permission) => saved.includes(permission.code) || picked.includes(permission.code));
}

/// La (i) del área: qué permite cada uno de sus permisos, uno por renglón.
export function areaHelp(group: PermissionAreaGroup): string {
  return group.permissions.map((permission) => `${permission.name} — ${permission.description}`).join("\n");
}
