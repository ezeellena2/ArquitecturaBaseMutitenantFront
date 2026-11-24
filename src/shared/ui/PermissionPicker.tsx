import { useId, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/utils";
import { Checkbox } from "./checkbox";
import { CheckIcon, ChevronRightIcon } from "./icons";
import { InfoTip } from "./InfoTip";
import { InformativeTooltip } from "./InformativeTooltip";
import {
  areaHasUngrantable,
  areaHelp,
  areaStartsOpen,
  areaState,
  changePermission,
  includedBy,
  toggleArea,
  type PermissionAreaGroup,
  type PermissionChoiceItem,
} from "./permissionAreas";

interface PermissionPickerProps {
  /** Las áreas, cada una con sus permisos en el orden del catálogo. */
  readonly groups: readonly PermissionAreaGroup[];
  /** Lo que se permite: lo elegido con lo que incluye (`allowedPermissions`). */
  readonly picked: readonly string[];
  /** Lo guardado: un área con algo guardado arranca abierta, aunque después se le quite todo. */
  readonly saved?: readonly string[];
  readonly onChange?: (picked: string[]) => void;
  /** Se lee y no se cambia (260): el Dueño, un rol de sistema o la ficha de un operador, con tildes y sin casillas. */
  readonly readOnly?: boolean;
  /** Al leer, las áreas arrancan abiertas (la ficha de un operador); si no, cerradas, como el Dueño. */
  readonly openWhenRead?: boolean;
  /** El nombre de la tabla para el lector de pantalla («Permisos», «Permisos de plataforma»). */
  readonly label: string;
  /** Con su borde y su radio; adentro de una caja que ya los pone (el teléfono, `Section`), sin ellos. */
  readonly framed?: boolean;
  /** Lo que va debajo del encabezado, antes de las áreas: un aviso o «Elegí dónde vale». */
  readonly children?: ReactNode;
  /** Adentro de `FormField` (un diálogo): el id que ata su rótulo y la descripción con su error. */
  readonly id?: string;
  readonly "aria-describedby"?: string;
  /** El alto del marco, si va adentro de un diálogo (Cuentas-Base2: 470 y se desplaza). */
  readonly className?: string;
}

/// El clic solo muestra el motivo: Radix saltea el cambio de la casilla después de un `preventDefault` (211).
const showOnly = (event: { preventDefault: () => void }) => event.preventDefault();

// Tablero Rol-Base2 (.acc-cb): 16 en la compu; M-Rol-Base2, 22 con radio 6 y borde de 1,5. Marcada y apagada (lo incluido o
// lo que no se puede dar), en el verde claro de la marca. Va encima del nombre, que cubre la fila para tocarla entera: así el
// puntero sobre la casilla da en ella (su borde al pasar, y el clic de Playwright en el E2E real) y no en el nombre.
const checkClass = "relative z-[1] border-[var(--t2)] max-md:size-5.5 max-md:rounded-[0.375rem] max-md:border-[1.5px] max-md:border-[var(--borde2)]"
  + " aria-disabled:data-[state=checked]:border-[var(--casilla-incluida)] aria-disabled:data-[state=checked]:bg-[var(--casilla-incluida)]"
  + " aria-disabled:data-[state=indeterminate]:border-[var(--casilla-incluida)] aria-disabled:data-[state=indeterminate]:bg-[var(--casilla-incluida)]";

// Las zonas para tocar la flecha y la casilla del área, una al lado de la otra y sin pisarse: 24 en la compu (.fl y .zc) y
// 44 × 44 en el teléfono (M-Rol-Base2), con el dibujo en el centro de cada una.
const arrowZone = "inline-flex size-6 shrink-0 items-center justify-center rounded-[0.25rem] text-[var(--t2)] hover:bg-[var(--s3)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foco)] max-md:size-11";
const checkZone = "relative inline-flex size-6 shrink-0 items-center justify-center max-md:size-11";
// La banda del área (.acc-area): 40 de alto (44 en el teléfono), en el tono de sección, con la línea arriba.
const bandClass = "flex min-h-10 items-center gap-2.5 border-t border-[var(--borde)] bg-[var(--s2)] pr-3.5 pl-2 font-semibold max-md:min-h-11 max-md:gap-0 max-md:pl-0";
// Cada permiso (.acc-p): 36 de alto (44 en el teléfono); su casilla queda debajo de la del área y su nombre, debajo del nombre.
const permissionRow = "relative flex min-h-9 items-center gap-2.5 border-t border-[var(--borde)] pr-3.5 pl-[2.875rem] max-md:min-h-11 max-md:gap-2.75 max-md:pl-[3.4375rem]";

/// Los permisos de un rol en áreas plegables (260, RO3-D de ArquitecturaBase; tableros Rol-Base2, M-Rol-Base2,
/// Cuentas-Base2 y Cuenta-Plat-Base2): una tabla de una columna, «Permiso», con una banda por área (la flecha, su casilla
/// vacía, parcial o completa, el nombre y su (i)) y, abierta, una fila por permiso con su casilla y su nombre entero. Sin
/// buscador, filtros, cuentas ni descripciones a la vista: qué permite cada permiso va en la (i) del área, uno por renglón.
///
/// Lo incluido se ve marcado y apagado con su motivo («Lo incluye «Administrar usuarios».»), y lo que quien edita no puede
/// dar (`grantable`, 269 y 0061), apagado con el suyo, en lugar de esperar el 403. El selector solo guarda qué áreas abrió o
/// cerró la persona; lo elegido lo guarda la pantalla. Igual en los roles de la organización, en los de una empresa y en los
/// permisos de un operador de Plataforma.
export function PermissionPicker({ groups, picked, saved = [], onChange, readOnly = false, openWhenRead = false, label, framed = true, children, id,
  "aria-describedby": describedBy, className }: PermissionPickerProps): ReactNode {
  const { t } = useTranslation();
  // Las áreas que la persona abrió o cerró; las demás siguen a lo que tienen (`areaStartsOpen`).
  const [toggled, setToggled] = useState<Readonly<Record<string, boolean>>>({});
  // Al leer van solo las áreas con algo, y en cada una solo lo que tiene.
  const visible = readOnly ? groups.filter((group) => group.permissions.some((permission) => picked.includes(permission.code))) : groups;

  return <div className={cn("min-w-0", framed && "overflow-hidden rounded-[0.75rem] border border-[var(--borde)] bg-[var(--superficie)] max-md:rounded-[0.625rem]", className)}>
    <table id={id} aria-label={label} aria-describedby={describedBy} className="w-full border-collapse text-[0.8125rem] text-[var(--t1)] max-md:text-[0.9375rem]">
      <thead>
        <tr><th scope="col" className="bg-[var(--cab)] px-3.5 py-2 text-left font-semibold text-[var(--t2)]">{t("permissionPicker.permission")}</th></tr>
      </thead>
      {children ? <tbody><tr><td className="border-t border-[var(--borde)] p-0">{children}</td></tr></tbody> : null}
      {visible.map((group) => {
        // El Dueño tiene todo: sus áreas empiezan cerradas, y cada una se abre para leer sus permisos.
        const open = toggled[group.area] ?? (readOnly ? openWhenRead : areaStartsOpen(group, saved, picked));
        return <PermissionArea key={group.area} group={group} groups={groups} picked={picked} readOnly={readOnly} open={open}
          onToggle={() => setToggled((current) => ({ ...current, [group.area]: !open }))} onChange={onChange} />;
      })}
    </table>
  </div>;
}

interface AreaProps {
  readonly group: PermissionAreaGroup;
  readonly groups: readonly PermissionAreaGroup[];
  readonly picked: readonly string[];
  readonly readOnly: boolean;
  readonly open: boolean;
  readonly onToggle: () => void;
  readonly onChange?: (picked: string[]) => void;
}

/// Un área: su banda y, abierta, sus permisos; un grupo de filas nombrado por el área, para el lector de pantalla.
function PermissionArea({ group, groups, picked, readOnly, open, onToggle, onChange }: AreaProps): ReactNode {
  const { t } = useTranslation();
  const arrowId = useId();
  const nameId = useId();
  const permissions = readOnly ? group.permissions.filter((permission) => picked.includes(permission.code)) : group.permissions;

  return <tbody aria-labelledby={nameId}>
    <tr><td className="p-0">
      <div className={bandClass}>
        <button id={arrowId} type="button" aria-expanded={open} aria-label={t("permissionPicker.toggleArea", { name: group.name })} onClick={onToggle} className={arrowZone}>
          <ChevronRightIcon aria-hidden="true" className={cn("size-3.5 transition-transform motion-reduce:transition-none max-md:size-4", open && "rotate-90")} />
        </button>
        {readOnly ? null : <AreaCheckbox group={group} groups={groups} picked={picked} onChange={onChange} />}
        {/* El nombre también abre y cierra el área: es otra etiqueta de la flecha, que es la que está en el recorrido del teclado. */}
        <label id={nameId} htmlFor={arrowId} className="min-w-0 cursor-pointer py-2 wrap-break-word max-md:mr-1.5 max-md:ml-1">{group.name}</label>
        <InfoTip text={areaHelp(group)} title={group.name} />
      </div>
    </td></tr>
    {open ? permissions.map((permission) => readOnly
      ? <ReadPermission key={permission.code} permission={permission} />
      : <PermissionChoice key={permission.code} permission={permission} groups={groups} picked={picked} onChange={onChange} />) : null}
  </tbody>;
}

/// La casilla del área: vacía, parcial o completa; elige o quita el área entera, con lo que incluye. Si el área tiene algo
/// que quien edita no tiene, queda apagada con su motivo (269).
function AreaCheckbox({ group, groups, picked, onChange }: Omit<AreaProps, "readOnly" | "open" | "onToggle">): ReactNode {
  const { t } = useTranslation();
  const reasonId = useId();
  const state = areaState(group, picked);
  const off = areaHasUngrantable(group);
  const checkbox = <Checkbox aria-label={t("permissionPicker.allPermissions", { area: group.name })}
    checked={state === "full" ? true : state === "partial" ? "indeterminate" : false}
    aria-disabled={off || undefined} aria-describedby={off ? reasonId : undefined} onClick={off ? showOnly : undefined}
    onCheckedChange={() => { if (!off) onChange?.(toggleArea(groups, group, picked)); }} className={cn(checkClass, off && "pointer-events-none")} />;

  return <span className={checkZone}>
    {off ? <>
      <InformativeTooltip text={t("permissionPicker.areaNotHeld")}>
        <span data-slot="disabled-reason" className="inline-flex cursor-not-allowed after:absolute after:inset-0">{checkbox}</span>
      </InformativeTooltip>
      <span id={reasonId} hidden>{t("permissionPicker.areaNotHeld")}</span>
    </> : <label className="absolute inset-0 inline-flex cursor-pointer items-center justify-center">{checkbox}</label>}
  </span>;
}

/// Un permiso con su casilla y su nombre entero: tocar la fila lo marca. Lo incluido por otro marcado queda marcado y
/// apagado, con el motivo que nombra a todos los que lo incluyen; lo que quien edita no tiene, apagado con el suyo.
function PermissionChoice({ permission, groups, picked, onChange }: { permission: PermissionChoiceItem } & Omit<AreaProps, "group" | "readOnly" | "open" | "onToggle">): ReactNode {
  const { t } = useTranslation();
  const id = useId();
  const checked = picked.includes(permission.code);
  const includers = checked ? includedBy(groups, picked, permission.code) : [];
  const quoted = includers.map((name) => t("permissionPicker.quoted", { name }));
  const names = quoted.length > 1 ? t("fields.selectedList", { rest: quoted.slice(0, -1).join(", "), last: quoted.at(-1) }) : quoted[0];
  const reason = includers.length > 0 ? t("permissionPicker.includedBy", { count: includers.length, names })
    : permission.grantable === false ? t("permissionPicker.notHeld") : undefined;
  const checkbox = <Checkbox id={id} checked={checked} aria-disabled={reason ? true : undefined}
    aria-describedby={`${id}-description${reason ? ` ${id}-reason` : ""}`} onClick={reason ? showOnly : undefined}
    onCheckedChange={(value) => { if (!reason) onChange?.(changePermission(groups, picked, permission.code, value === true)); }}
    className={cn(checkClass, reason && "pointer-events-none")} />;

  return <tr><td className="p-0">
    <div className={cn(permissionRow, reason && "text-[var(--t3)]")}>
      {reason
        ? <InformativeTooltip text={reason}><span data-slot="disabled-reason" className="inline-flex cursor-not-allowed after:absolute after:inset-0">{checkbox}</span></InformativeTooltip>
        : checkbox}
      <label htmlFor={id} className={cn("min-w-0 py-2 wrap-break-word", !reason && "cursor-pointer after:absolute after:inset-0")}>{permission.name}</label>
      <span id={`${id}-description`} hidden>{permission.description}</span>
      {reason ? <span id={`${id}-reason`} hidden>{reason}</span> : null}
    </div>
  </td></tr>;
}

/// Un permiso que se lee: su tilde donde iría la casilla y su nombre.
function ReadPermission({ permission }: { permission: PermissionChoiceItem }): ReactNode {
  const { t } = useTranslation();
  return <tr><td className="p-0">
    <div className={cn(permissionRow, "max-md:pl-[3.4375rem]")}>
      <span role="img" aria-label={t("permissionPicker.granted")} className="inline-flex size-4 shrink-0 items-center justify-center text-[var(--marca-tx)] max-md:size-5.5">
        <CheckIcon className="size-3.5 max-md:size-4.5" />
      </span>
      <span className="min-w-0 py-2 wrap-break-word">{permission.name}</span>
    </div>
  </td></tr>;
}
