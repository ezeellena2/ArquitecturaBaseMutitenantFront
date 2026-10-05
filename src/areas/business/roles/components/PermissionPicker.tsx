import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { PermissionGroupResponse } from "@/shared/api/types";
import { Checkbox } from "@/shared/ui/checkbox";
import { isAreaExpanded, selectionCount, withGroup, withPermission } from "../lib/permissionPicker";

interface PermissionPickerProps {
  /** Los grupos del alcance del rol (`groupsForScope`). */
  readonly groups: readonly PermissionGroupResponse[];
  readonly value: readonly string[];
  readonly onChange: (next: string[]) => void;
  /** Un rol de sistema o sin permiso para cambiarlo: las casillas se ven, bloqueadas. */
  readonly readOnly?: boolean;
}

// La casilla: en la compu, la de siempre con borde visible (bloqueada, gris, como el tablero Rol); en el teléfono (tablero
// M-Rol, .ap-chk), de 22 con borde de 1,5, y bloqueada (.fijo, un rol de sistema, v108) gris también: blanca con su borde o,
// marcada, en `--casilla-fija`, sin transparencia.
const checkClass = "border-[var(--t2)] max-md:size-[22px]! max-md:rounded-[6px]! max-md:border-[1.5px]! max-md:border-[var(--borde2)]! max-md:enabled:data-[state=checked]:border-[var(--marca)]!"
  + " max-md:disabled:opacity-100! max-md:disabled:bg-[var(--lado-activo)]! max-md:disabled:data-[state=checked]:bg-[var(--casilla-fija)]! max-md:disabled:data-[state=checked]:border-[var(--casilla-fija)]!";

/// «Permisos» de un rol («Criterio · Formularios»: la única lista con grupos que se abren y se cierran). Tableros Rol y
/// M-Rol: cada área es una fila (40 en la compu, 52 en el teléfono) con la flecha, la casilla de todos, el nombre (que
/// también la abre o la cierra) y la cuenta a la derecha; cada permiso, una fila (40 y 50) con su casilla, sin
/// descripción. Al entrar están abiertos los grupos que tienen algo marcado.
export function PermissionPicker({ groups, value, onChange, readOnly = false }: PermissionPickerProps) {
  const { t } = useTranslation("roles");
  // Lo que la persona abrió o cerró a mano; el resto sigue a lo marcado. Cambiar «Vale en» monta otro (su `key`).
  const [toggled, setToggled] = useState<Record<string, boolean>>({});

  return <div className="[&>fieldset:last-child>:last-child]:border-b-0">
    {groups.map((group) => {
      const codes = group.permissions.map((permission) => permission.code);
      const count = selectionCount(group.permissions, value);
      const expanded = isAreaExpanded(toggled, group, value);
      const toggleArea = () => setToggled((current) => ({ ...current, [group.area]: !expanded }));
      return <fieldset key={group.area} className="m-0 p-0">
        <legend className="sr-only">{group.name}</legend>
        <div data-slot="permission-area" className="flex min-h-10 items-center gap-2 border-b border-[var(--borde)] bg-[var(--s2)] pr-4 pl-2 text-[13px] font-semibold text-[var(--t1)] max-md:min-h-[52px] max-md:gap-3 max-md:bg-transparent max-md:pr-3.5 max-md:pl-3 max-md:text-[15.5px]">
          <button type="button" aria-expanded={expanded} aria-label={t("roles:toggleArea", { name: group.name })} onClick={toggleArea} className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-[var(--t2)] hover:bg-[var(--s3)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foco)] max-md:text-[var(--t3)]">
            <ChevronRight aria-hidden="true" className={`size-4 transition-transform motion-reduce:transition-none ${expanded ? "rotate-90" : ""}`} />
          </button>
          <Checkbox aria-label={t("roles:allPermissions", { area: group.name })} checked={codes.length > 0 && count.selected === codes.length} disabled={readOnly}
            onCheckedChange={(checked) => onChange(withGroup(value, codes, checked === true))} className={checkClass} />
          {/* El nombre también abre o cierra el grupo; la flecha es la que se alcanza con el teclado. */}
          <button type="button" tabIndex={-1} aria-expanded={expanded} onClick={toggleArea} className="ml-1 min-w-0 truncate text-left font-semibold max-md:ml-0">{group.name}</button>
          <span className="ml-auto shrink-0 font-medium text-[var(--t3)] tabular-nums max-md:text-[13px]">{t("roles:groupCount", count)}</span>
        </div>
        {expanded ? group.permissions.map((permission) => <label key={permission.code} className="flex min-h-10 items-center gap-2.5 border-b border-[var(--borde)] pr-4 pl-[52px] text-[13px] font-medium text-[var(--t1)] max-md:min-h-[50px] max-md:gap-3 max-md:pr-3.5 max-md:pl-[46px] max-md:text-[15px] max-md:font-normal">
          <Checkbox checked={value.includes(permission.code)} disabled={readOnly} onCheckedChange={(checked) => onChange(withPermission(value, permission.code, checked === true))} className={checkClass} />
          <span className="min-w-0 flex-1">{permission.name}</span>
        </label>) : null}
      </fieldset>;
    })}
  </div>;
}
