import { useId, useLayoutEffect, useRef, useState, type FocusEvent, type KeyboardEvent, type ReactElement, type ReactNode, type RefObject } from "react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { useTranslation } from "react-i18next";
import type { RemoteOptions } from "@/shared/hooks/useResourceOptions";
import { summarizeChoices } from "@/shared/lib/summarizeChoices";
import { cn } from "@/shared/lib/utils";
import { ChevronRight } from "lucide-react";
import { useAppChrome } from "./app/AppChrome";
import { settingsItemClass } from "./app/SettingsGroup";
import { Button } from "./button";
import { Dialog, DialogContent, DialogTitle } from "./dialog";
import { ChevronDownIcon, CloseIcon } from "./icons";
import { InformativeTooltip } from "./InformativeTooltip";
import { PickerList } from "./PickerList";
import { pickerChoice, pickerList, SEARCH_FROM, type PickerChoice, type PickerOption, type PickerRow } from "./pickerRows";
import { usePickerFocus } from "./usePickerFocus";
import { usePickerKeyboard } from "./usePickerKeyboard";

export type { PickerOption } from "./pickerRows";

interface PickerBase {
  /** El nombre del campo: nombra el botón y la lista, y es el título de la lista en el teléfono. Adentro de un `FormField`
   * no hace falta: la pieza se nombra con su etiqueta (`<id>-label`). */
  label?: string;
  options: readonly PickerOption[];
  /** Lo que dice el campo, en gris, mientras no hay nada elegido («Sin zona», «Elegí un rol»). */
  placeholder?: string;
  /** «Todas», «Sin campo asignado»: la primera, separada por una línea, que no entra en una búsqueda. */
  first?: PickerOption;
  /** Las elegidas que pueden no estar entre las opciones porque llegaron en otra página del servidor: van primero. */
  selectedOptions?: readonly PickerOption[];
  /** El campo de un formulario, el botón de la barra de un listado o, en una ficha del teléfono, la fila con su nombre, lo
   * elegido en gris y la flecha (M-Usuario-Base2, `SettingsItem`); conserva su aspecto y abre la misma lista. */
  trigger?: "field" | "button" | "row";
  /** En la barra, el botón con lo elegido lleva el color de la marca. */
  active?: boolean;
  /** Lo que dice el botón de la barra, sea lo que sea lo elegido («Estado: activos»), y su nombre. */
  triggerLabel?: ReactNode;
  /** Cerrada, una sola elegida dice también su descripción en gris («Buenos Aires · hora de Argentina · GMT−3»). */
  describeChosen?: boolean;
  /** Cuántas son, con el nombre de lo que son («418 zonas»); por defecto, «38 opciones». */
  countLabel?: (count: number) => string;
  id?: string;
  className?: string;
  disabled?: boolean;
  /** Apagada, con su motivo en un tooltip (211): sigue en el Tab y no abre la lista. */
  disabledReason?: string;
  "aria-invalid"?: boolean | "true" | "false";
  "aria-describedby"?: string;
  /** Busca el servidor, sobre `useResourceOptions`: el dueño guarda lo que se escribe y trae lo que coincide. */
  remote?: RemoteOptions;
  /** Cuántas opciones tiene el servidor para esa búsqueda; por defecto, lo que dice `remote`. */
  total?: number;
  /** Cuántas trae «Mostrar N más»; por defecto, lo que dice `remote`. */
  pageSize?: number;
  /** Ofrece «Crear «X»» cuando lo buscado no está entre las opciones: al elegirla, ese texto queda como valor nuevo. */
  creatable?: boolean;
  /** El dueño pide al servidor solo con la lista abierta. */
  onOpenChange?: (open: boolean) => void;
  /** Como mucho estas: la lista dice «Hasta 5» y, al llegar, «Elegiste 5 de 5», y apaga las demás. */
  max?: number;
  /** En el campo, después de lo elegido y antes de la flecha: «Revisá» en lo que propone el asistente (tableros
   * *-Propuesta, .acc-rev). No entra en el nombre del botón; su motivo va en la descripción del campo. */
  adornment?: ReactNode;
}

export type PickerProps = PickerBase & (
  | { multiple?: false; value: string | null; onChange: (value: string) => void }
  | { multiple: true; value: readonly string[]; onChange: (value: string[]) => void }
);

/** El texto de la etiqueta de su `FormField`, sin el asterisco de obligatorio. */
function labelText(id: string | undefined): string {
  const element = id ? document.getElementById(id) : null;
  if (!element) return "";
  const copy = element.cloneNode(true) as HTMLElement;
  copy.querySelectorAll("[aria-hidden='true']").forEach((node) => node.remove());
  return copy.textContent?.trim() ?? "";
}

/**
 * La única pieza para elegir una o varias opciones de una lista (262; copiada de ArquitecturaBaseFront, DS1-A y DS2-A).
 * Cerrada, un campo con su flecha que dice lo elegido, igual para una y para varias; en la barra de un listado, el botón
 * del filtro. Abierta, la lista con la línea gris debajo de cada nombre, la tilde a la izquierda de la elegida y, en
 * varias, una casilla, donde marcar no cierra. Con más de diez opciones, o si busca el servidor, el buscador va arriba,
 * adentro, con el foco y la cantidad debajo. En el teléfono la lista ocupa la pantalla, y varias se aplican con «Listo (N)».
 *
 * El botón se llama con el nombre y lo elegido («Roles de la organización Recursos humanos, Ventas») y abre un `listbox`
 * que las flechas recorren con `aria-activedescendant`: Enter elige (en varias, marca sin cerrar), Escape cierra y devuelve
 * el foco al botón, y Tab cierra y sigue. Sin buscador, una letra lleva a la primera opción que empieza así. Elegir la ya
 * elegida también avisa (`onChange`): quien reinicia algo con eso pone una guarda.
 *
 * Acá van el estado y la elección; lo que muestra la lista sale de `pickerList`, las teclas de `usePickerKeyboard`, el foco
 * de `usePickerFocus` y lo de adentro de la lista de `PickerList`.
 */
export function Picker(props: PickerProps) {
  const { t } = useTranslation();
  const { phone } = useAppChrome();
  const uid = useId();
  const fieldLabelId = props.id ? `${props.id}-label` : undefined;
  const [open, setOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState("");
  const [active, setActive] = useState(-1);
  const [title, setTitle] = useState(props.label ?? "");
  // En el teléfono, varias se marcan sobre una copia que «Listo» aplica y la ✕ descarta.
  const [picked, setPicked] = useState<readonly string[]>([]);

  const multiple = props.multiple === true;
  const values: readonly string[] = props.multiple ? props.value : props.value === null || props.value === "" ? [] : [props.value];
  const staged = phone && multiple && open;
  const chosen = new Set(staged ? picked : values);
  const remote = props.remote;
  const searchable = remote !== undefined || props.creatable === true || props.options.length > SEARCH_FROM;
  const search = remote ? remote.search : localSearch;
  const list = pickerList({ options: props.options, first: props.first, selectedOptions: props.selectedOptions, creatable: props.creatable,
    max: props.max, multiple, values, chosen, search, remote }, t);
  const { rows } = list;
  const current = rows.length === 0 ? -1 : active < 0 ? 0 : Math.min(active, rows.length - 1);
  const choice = pickerChoice({ options: props.options, first: props.first, others: list.others, values, multiple,
    placeholder: props.placeholder, describeChosen: props.describeChosen });
  const focus = usePickerFocus({ uid, open, current, searchable, onTabOut: () => hide() });
  const onListKeyDown = usePickerKeyboard({ rows, current, searchable, remote, setActive, choose });

  function show() {
    if (props.disabled || props.disabledReason !== undefined) return;
    const index = rows.findIndex((row) => row.selected);
    setActive(index >= 0 ? index : rows.findIndex((row) => !row.disabled));
    setPicked(values);
    setTitle(props.label ?? labelText(fieldLabelId));
    setOpen(true);
    props.onOpenChange?.(true);
  }

  function hide() {
    focus.closing();
    setOpen(false);
    setLocalSearch("");
    if (remote && remote.search) remote.onSearch("");
    props.onOpenChange?.(false);
  }

  function choose(row: PickerRow | undefined, index: number) {
    if (!row) return;
    if (row.disabled) { setActive(index); return; }
    const value = row.option.value;
    if (!props.multiple) { props.onChange(value); hide(); return; }
    const base = staged ? picked : props.value;
    const next = base.includes(value) ? base.filter((item) => item !== value) : [...base, value];
    if (staged) setPicked(next); else props.onChange(next);
    if (row.option === list.create) { setLocalSearch(""); remote?.onSearch(""); }
  }

  function done() {
    if (props.multiple) props.onChange([...picked]);
    hide();
  }

  const nameId = props.label !== undefined || !fieldLabelId ? `${uid}-name` : fieldLabelId, valueId = `${uid}-value`, listboxId = `${uid}-listbox`, triggerId = props.id ?? `${uid}-trigger`;
  const trigger = pickerTrigger({ props, choice, multiple, open, phone, uid, nameId, valueId, listboxId, triggerId, triggerRef: focus.triggerRef,
    loading: remote?.loading, show });
  const content = <PickerList uid={uid} listboxId={listboxId} nameId={nameId} title={title} list={list} multiple={multiple} searchable={searchable}
    search={search} open={open} current={current} phone={phone} optionCount={props.options.length} chosenCount={chosen.size} max={props.max}
    total={props.total ?? remote?.total} pageSize={props.pageSize} countLabel={props.countLabel} remote={remote}
    listRef={focus.listRef} searchRef={focus.searchRef} onListKeyDown={onListKeyDown}
    onSearch={(text) => { setActive(0); if (remote) remote.onSearch(text); else setLocalSearch(text); }}
    onHover={(index) => { if (index !== current) setActive(index); }} onChoose={choose} />;
  // El nombre y lo elegido van afuera del botón: lo nombran sin sumarse a su texto.
  const words = <>{nameId === fieldLabelId ? null : <span id={nameId} hidden>{props.label}</span>}<span id={valueId} hidden>{choice.spoken}</span></>;

  if (phone) return <>
    {words}
    {trigger}
    <PickerSheet open={open} title={title} triggerId={triggerId} multiple={multiple} pickedCount={picked.length} onClose={hide} onDone={done}
      onOpenAutoFocus={focus.focusList} onBlur={focus.focusLeaves} onCloseAutoFocus={focus.sheetClosed}>{content}</PickerSheet>
  </>;
  return <>{words}<PopoverPrimitive.Root modal open={open} onOpenChange={(next) => { if (next) show(); else hide(); }}>
    <PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
    <PopoverPrimitive.Portal>
      {/* `data-return-focus-to`: una confirmación que abre una elección se abre mientras la lista se cierra, con el foco
          adentro de ella; el atributo le dice que devuelva el foco al botón (useRestoreFocusOnClose). */}
      <PopoverPrimitive.Content aria-labelledby={nameId} align="start" sideOffset={4} collisionPadding={8} onKeyDown={focus.leaveWithTab}
        onOpenAutoFocus={focus.focusList} data-return-focus-to={triggerId} onBlur={focus.focusLeaves} onCloseAutoFocus={focus.popoverClosed}
        // La lista de un campo mide lo que el campo; la de un botón de la barra, lo que sus nombres, hasta un tope.
        className={cn("z-50 flex max-h-[min(28rem,var(--radix-popover-content-available-height))] flex-col overflow-hidden rounded-[0.625rem] border border-[var(--borde2)] bg-[var(--superficie)] text-[0.8125rem] text-[var(--t1)] shadow-[var(--sombra-menu)] outline-none",
          props.trigger === "button" ? "w-max max-w-90 min-w-50" : "w-(--radix-popover-trigger-width) min-w-50")}>
        {content}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  </PopoverPrimitive.Root></>;
}

interface PickerTriggerInput {
  readonly props: PickerProps;
  readonly choice: PickerChoice;
  readonly multiple: boolean;
  readonly open: boolean;
  readonly phone: boolean;
  readonly uid: string;
  readonly nameId: string;
  readonly valueId: string;
  readonly listboxId: string;
  readonly triggerId: string;
  readonly triggerRef: RefObject<HTMLButtonElement | null>;
  readonly loading?: boolean;
  readonly show: () => void;
}

/** Lo que se ve con la lista cerrada: el campo con su flecha o, en la barra de un listado, el botón del filtro; apagada con
 * su motivo, adentro de su tooltip. Es un elemento y no un componente: la lista de escritorio lo usa como su disparador. */
function pickerTrigger({ props, choice, multiple, open, phone, uid, nameId, valueId, listboxId, triggerId, triggerRef, loading, show }: PickerTriggerInput): ReactElement {
  const { picks, empty, single, detail, spoken } = choice;
  const reasonId = `${uid}-reason`;
  const off = props.disabledReason !== undefined;
  const describedBy = [props["aria-describedby"], off ? reasonId : undefined].filter(Boolean).join(" ") || undefined;
  const triggerProps = {
    ref: triggerRef,
    id: triggerId,
    type: "button" as const,
    disabled: props.disabled && !off,
    "aria-disabled": off || undefined,
    "aria-haspopup": phone ? "dialog" as const : "listbox" as const,
    "aria-expanded": open,
    "aria-controls": open && !phone ? listboxId : undefined,
    // El botón de la barra que dice lo suyo («Estado: activos») se llama con eso.
    "aria-labelledby": props.triggerLabel !== undefined ? undefined : `${nameId} ${valueId}`,
    "aria-invalid": props["aria-invalid"],
    "aria-describedby": describedBy,
    "aria-busy": loading || undefined,
    onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => {
      if ((event.key === "ArrowDown" || event.key === "ArrowUp") && !open && !off) { event.preventDefault(); show(); }
    },
    onClick: phone ? show : undefined,
  };
  const arrow = <ChevronDownIcon aria-hidden="true" strokeWidth={2}
    className="size-3.5 shrink-0 text-[var(--t2)] group-disabled:text-[var(--t3)] group-aria-disabled:text-[var(--t3)] max-md:size-4.5 max-md:text-[var(--t1)]" />;
  const button = props.trigger === "row"
    // M-Usuario-Base2: la fila de una ficha del teléfono, como `SettingsItem`: el nombre, lo elegido en gris y la flecha.
    ? <button {...triggerProps} className={cn(settingsItemClass, "w-full text-left outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--foco-halo)] aria-disabled:opacity-55", props.className)}>
      <span className="flex min-w-0 flex-1 flex-col gap-px leading-tight">
        <span aria-hidden="true" className="text-[0.96875rem] font-medium [overflow-wrap:anywhere]">{props.label}</span>
        <span aria-hidden="true" className="flex min-w-0 text-[0.8125rem] text-[var(--t3)]">
          {empty ? <span className="min-w-0 flex-1 truncate">{spoken}</span>
            : multiple ? <ChoiceSummary labels={picks.map((option) => option.label)} /> : <span className="min-w-0 flex-1 truncate">{single?.short ?? single?.label}</span>}
        </span>
      </span>
      <ChevronRight aria-hidden="true" className="size-4.5 shrink-0 text-[var(--t3)]" />
    </button>
    : props.trigger === "button"
    // «Criterio · Elegir»: en la barra de un listado, el filtro conserva su botón; con algo elegido, en el color de la marca.
    ? <Button {...triggerProps} variant="outline" className={cn("group h-8 gap-1.5 rounded-[0.5rem] px-3 text-[0.8125rem] shadow-none",
      props.active ? "border-[var(--marca)] bg-[var(--marca-t)] font-medium text-[var(--marca-tx)]" : "border-[var(--borde)] bg-[var(--superficie)] font-normal text-[var(--t2)]",
      props.className)}>
      {props.triggerLabel !== undefined ? <span className="truncate">{props.triggerLabel}</span>
        : <span aria-hidden="true" className="truncate">{single?.short ?? spoken}</span>}
      <ChevronDownIcon aria-hidden="true" strokeWidth={2} className="size-3.5 shrink-0" />
    </Button>
    // «Criterio · Elegir», Cerrada: un campo con su flecha fina; en el teléfono, de 48 con letra de 16 (sin el zoom de iOS).
    : <button {...triggerProps} className={cn(
      "group flex h-9 w-full min-w-0 items-center gap-2 rounded-[0.5rem] border border-[var(--borde2)] bg-[var(--superficie)] px-3 text-left text-[0.8125rem] text-[var(--t1)] outline-none max-md:h-12 max-md:rounded-[0.75rem] max-md:px-3.5 max-md:text-[1rem]",
      "focus-visible:border-[var(--marca)] focus-visible:ring-[3px] focus-visible:ring-[var(--foco-halo)] aria-expanded:border-[var(--marca)] aria-expanded:ring-[3px] aria-expanded:ring-[var(--foco-halo)] aria-invalid:border-destructive",
      "disabled:cursor-default disabled:border-[var(--borde)] disabled:bg-[var(--s2)] disabled:text-[var(--t2)] aria-disabled:cursor-not-allowed aria-disabled:border-[var(--borde)] aria-disabled:bg-[var(--s2)] aria-disabled:text-[var(--t3)]",
      props.className)}>
      {single?.icon && !single.short ? <span aria-hidden="true" className="flex shrink-0">{single.icon}</span> : null}
      {empty ? <span aria-hidden="true" className="min-w-0 flex-1 truncate text-[var(--t3)]">{spoken}</span>
        : multiple ? <ChoiceSummary labels={picks.map((option) => option.label)} />
          : <span aria-hidden="true" className="min-w-0 flex-1 truncate">
            {single?.short ?? single?.label}{detail ? <span className="text-[var(--t3)]">{` · ${detail}`}</span> : null}
          </span>}
      {props.adornment ? <span aria-hidden="true" className="flex shrink-0">{props.adornment}</span> : null}
      {arrow}
    </button>;
  return off ? <>
    <InformativeTooltip text={props.disabledReason}>{button}</InformativeTooltip>
    <span id={reasonId} hidden>{props.disabledReason}</span>
  </> : button;
}

/** «Criterio · Elegir», En el teléfono: la lista a pantalla completa, con el nombre del campo, la ✕, el buscador si son más
 * de diez y renglones de 56; varias se aplican con «Listo (N)». El botón no es el disparador propio del diálogo: el foco
 * vuelve a él al cerrarse. */
function PickerSheet({ open, title, triggerId, multiple, pickedCount, onClose, onDone, onOpenAutoFocus, onBlur, onCloseAutoFocus, children }: {
  open: boolean; title: string; triggerId: string; multiple: boolean; pickedCount: number; onClose: () => void; onDone: () => void;
  onOpenAutoFocus: (event: Event) => void; onBlur: (event: FocusEvent<HTMLElement>) => void; onCloseAutoFocus: (event: Event) => void; children: ReactNode;
}) {
  const { t } = useTranslation();
  return <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
    <DialogContent showCloseButton={false} aria-describedby={undefined} onOpenAutoFocus={onOpenAutoFocus} data-return-focus-to={triggerId}
      onBlur={onBlur} onCloseAutoFocus={onCloseAutoFocus}
      className="max-md:inset-0 max-md:flex max-md:h-dvh max-md:max-h-none max-md:flex-col max-md:rounded-none [&>[data-slot=dialog-handle]]:hidden">
      <header className="flex min-h-14 shrink-0 items-center gap-2 border-b border-[var(--borde)] pt-[env(safe-area-inset-top)] pr-2 pl-4">
        <DialogTitle className="min-w-0 flex-1 truncate text-[1.125rem] font-bold text-[var(--t1)]">{title}</DialogTitle>
        <button type="button" aria-label={t("actions.close")} title={t("actions.close")} onClick={onClose}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-[var(--t1)] focus-visible:outline-2 focus-visible:outline-[var(--foco)]">
          <CloseIcon className="size-5.5" />
        </button>
      </header>
      {children}
      {multiple ? <footer className="shrink-0 border-t border-[var(--borde)] px-4 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <Button type="button" className="h-12 w-full" onClick={onDone}>{t("picker.done", { count: pickedCount })}</Button>
      </footer> : null}
    </DialogContent>
  </Dialog>;
}

/** Varias, por su nombre: las que entran en el campo y «y N más» por el resto; el campo nunca crece. Mide su propio ancho,
 * otra vez cuando ese ancho cambia. */
function ChoiceSummary({ labels }: { labels: readonly string[] }) {
  const { t } = useTranslation();
  const box = useRef<HTMLSpanElement>(null), probe = useRef<HTMLSpanElement>(null);
  const key = labels.join("\n");
  const [summary, setSummary] = useState<{ key: string; names: string; more: string | null } | null>(null);
  useLayoutEffect(() => {
    const container = box.current, measure = probe.current, list = key.split("\n");
    if (!container || !measure) return;
    const update = () => {
      const width = container.clientWidth;
      // Sin ancho medido (jsdom, o todavía sin pintar) entran todas.
      const next = summarizeChoices(list, (text) => { measure.textContent = text; return width === 0 || measure.getBoundingClientRect().width <= width; },
        (count) => t("picker.andMore", { count }));
      setSummary((previous) => previous?.key === key && previous.names === next.names && previous.more === next.more ? previous : { key, ...next });
    };
    update();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(update);
    observer.observe(container);
    return () => observer.disconnect();
  }, [key, t]);
  const shown = summary?.key === key ? summary : { names: labels.join(", "), more: null };
  return <span ref={box} aria-hidden="true" className="relative flex min-w-0 flex-1 overflow-hidden">
    <span className="truncate">{shown.names}</span>
    {shown.more ? <span className="shrink-0 whitespace-pre">{` ${shown.more}`}</span> : null}
    <span ref={probe} className="invisible absolute top-0 left-0 whitespace-pre" />
  </span>;
}
