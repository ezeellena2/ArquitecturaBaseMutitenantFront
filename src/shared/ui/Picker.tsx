import { Fragment, useId, useLayoutEffect, useRef, useState, type FocusEvent, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import { CheckIcon } from "lucide-react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { useTranslation } from "react-i18next";
import type { RemoteOptions } from "@/shared/hooks/useResourceOptions";
import { summarizeChoices } from "@/shared/lib/summarizeChoices";
import { cn } from "@/shared/lib/utils";
import { useAppChrome } from "./app/AppChrome";
import { Button } from "./button";
import { Dialog, DialogContent, DialogTitle } from "./dialog";
import { ChevronDownIcon, CloseIcon, SearchIcon } from "./icons";
import { InformativeTooltip } from "./InformativeTooltip";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

/** Una opción de la lista. */
export interface PickerOption {
  value: string;
  label: string;
  /** La línea gris debajo del nombre, que distingue dos parecidas («Invita y edita personas y roles.»). */
  description?: ReactNode;
  /** Apagada, con su motivo (211): no se elige ni se quita, y el motivo se abre en un tooltip y es su descripción. */
  disabledReason?: string | null;
  /** Una línea antes de ella abre un grupo. */
  separated?: boolean;
  /** Más palabras por las que la encuentra el buscador: el identificador de una zona, el código o el prefijo de un país. */
  keywords?: string;
  /** Un dibujo antes del nombre, como la bandera de un país. */
  icon?: ReactNode;
  /** A la derecha, en gris, como el prefijo de un país. */
  trailing?: string;
  /** Lo que dice el campo cerrado cuando es la elegida, si no es su nombre («AR +54»); el lector oye el nombre. */
  short?: ReactNode;
}

interface PickerBase {
  /** El nombre del campo: nombra el botón y la lista, y es el título de la lista en el teléfono. */
  label: string;
  options: readonly PickerOption[];
  /** Lo que dice el campo, en gris, mientras no hay nada elegido («Sin zona», «Elegí un rol»). */
  placeholder?: string;
  /** «Todas», «Sin campo asignado»: la primera, separada por una línea, que no entra en una búsqueda. */
  first?: PickerOption;
  /** Las elegidas que pueden no estar entre las opciones porque llegaron en otra página del servidor: van primero. */
  selectedOptions?: readonly PickerOption[];
  /** El campo de un formulario, o el botón de la barra de un listado, que conserva su aspecto y abre la misma lista. */
  trigger?: "field" | "button";
  /** En la barra, el botón con lo elegido lleva el color de la marca. */
  active?: boolean;
  /** Lo que dice el botón de la barra, sea lo que sea lo elegido («Estado: activos»). */
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
  /** Cuántas opciones tiene el servidor para esa búsqueda. */
  total?: number;
  /** Cuántas trae «Mostrar N más». */
  pageSize?: number;
  /** Ofrece «Crear «X»» cuando lo buscado no está entre las opciones: al elegirla, ese texto queda como valor nuevo. */
  creatable?: boolean;
  /** El dueño pide al servidor solo con la lista abierta. */
  onOpenChange?: (open: boolean) => void;
  /** Como mucho estas: la lista dice «Hasta 5» y, al llegar, «Elegiste 5 de 5», y apaga las demás. */
  max?: number;
}

export type PickerProps = PickerBase & (
  | { multiple?: false; value: string | null; onChange: (value: string) => void }
  | { multiple: true; value: readonly string[]; onChange: (value: string[]) => void }
);

interface Row { option: PickerOption; selected: boolean; disabled: boolean; reason: string | null; separated: boolean }

/** Con más opciones que estas, la lista trae su buscador. */
const SEARCH_FROM = 10;
const TABBABLE = "a[href], button, input, select, textarea, [tabindex]";
/** Un botón adentro de la lista deja el foco en el buscador o en la lista: lo que se escribe después sigue buscando. */
const keepFocus = { onMouseDown: (event: MouseEvent) => event.preventDefault() };

const fold = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase();

/** Qué tan bien responde una opción a lo buscado, sin tildes: primero los nombres que empiezan así, después una palabra del
 * nombre, después en cualquier parte del nombre y, al final, la línea gris o las otras palabras. -1 no responde. */
function rank(option: PickerOption, needle: string): number {
  const label = fold(option.label);
  if (label.startsWith(needle)) return 0;
  if (label.split(/[\s/-]+/).some((word) => word.startsWith(needle))) return 1;
  if (label.includes(needle)) return 2;
  const description = typeof option.description === "string" ? option.description : "";
  return fold([description, option.keywords, option.value, option.trailing].filter(Boolean).join(" ")).includes(needle) ? 3 : -1;
}

/** Desplaza solo la lista, nunca la página: al abrir, la elegida al centro; al recorrer, lo mínimo. */
function reveal(list: HTMLElement | null, option: HTMLElement | null, center: boolean) {
  if (!list || !option) return;
  const top = option.offsetTop, bottom = top + option.offsetHeight;
  if (center) list.scrollTop = top - (list.clientHeight - option.offsetHeight) / 2;
  else if (top < list.scrollTop) list.scrollTop = top;
  else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
}

const tabbables = (root: ParentNode) => [...root.querySelectorAll<HTMLElement>(TABBABLE)]
  .filter((element) => element.tabIndex >= 0 && !element.matches(":disabled") && !element.closest("[hidden], [inert]"));

/** Lo que alcanza Tab después del campo, adentro de su diálogo si tiene uno. */
function nextTabbable(from: HTMLElement | null): HTMLElement | null {
  if (!from) return null;
  const all = tabbables(from.closest("[role=dialog]") ?? document.body);
  const index = all.indexOf(from);
  return index < 0 ? null : all[index + 1] ?? null;
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
 */
export function Picker(props: PickerProps) {
  const { t } = useTranslation();
  const { phone } = useAppChrome();
  const uid = useId();
  const triggerRef = useRef<HTMLButtonElement>(null), listRef = useRef<HTMLUListElement>(null), searchRef = useRef<HTMLInputElement>(null);
  const leaving = useRef<"next" | "back" | null>(null), typed = useRef({ text: "", at: -Infinity });
  const closing = useRef(false), elsewhere = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState("");
  const [active, setActive] = useState(-1);
  // En el teléfono, varias se marcan sobre una copia que «Listo» aplica y la ✕ descarta.
  const [picked, setPicked] = useState<readonly string[]>([]);

  const multiple = props.multiple === true;
  const values: readonly string[] = props.multiple ? props.value : props.value === null || props.value === "" ? [] : [props.value];
  const staged = phone && multiple && open;
  const chosen = new Set(staged ? picked : values);
  const remote = props.remote;
  const searchable = remote !== undefined || props.creatable === true || props.options.length > SEARCH_FROM;
  const search = remote ? remote.search : localSearch;
  const searching = search.trim() !== "";
  const full = multiple && props.max !== undefined && chosen.size >= props.max;
  const known = [...(props.selectedOptions ?? [])];
  // Lo creado acá todavía no es una opción: se muestra con su texto.
  if (props.creatable) for (const item of values) if (![...known, ...props.options].some((option) => option.value === item)) known.push({ value: item, label: item });
  const others = known.filter((option) => !props.options.some((item) => item.value === option.value));
  const needle = fold(search.trim());
  const shown = remote || !searching ? props.options : props.options.map((option, index) => ({ option, index, rank: rank(option, needle) }))
    .filter((item) => item.rank >= 0).sort((a, b) => a.rank - b.rank || a.index - b.index).map((item) => item.option);
  // Se ofrece crear solo con la búsqueda ya respondida y si no hay una igual: así no se duplica una que existe.
  const typedText = search.trim();
  const same = (text: string) => text.localeCompare(typedText, undefined, { sensitivity: "accent" }) === 0;
  const create: PickerOption | null = props.creatable && typedText !== "" && !remote?.loading && !remote?.error
    && ![...props.options, ...known].some((option) => same(option.value) || same(option.label))
    ? { value: typedText, label: t("fields.createOption", { value: typedText }) } : null;

  const rows: Row[] = [];
  const push = (option: PickerOption, separated: boolean) => {
    const selected = chosen.has(option.value);
    const reason = option.disabledReason ?? (full && !selected ? t("picker.chosenOf", { count: chosen.size, max: props.max }) : null);
    rows.push({ option, separated: rows.length > 0 && separated, selected, disabled: reason !== null, reason });
  };
  if (props.first && !searching) push(props.first, false);
  if (!searching) others.filter((option) => chosen.has(option.value)).forEach((option, index) => push(option, index === 0));
  shown.forEach((option, index) => push(option, index === 0 || !!option.separated));
  if (create) push(create, true);
  const current = rows.length === 0 ? -1 : active < 0 ? 0 : Math.min(active, rows.length - 1);
  const optionId = (index: number) => `${uid}-option-${index}`;

  // Lo que dice el campo cerrado: las elegidas en el orden de la lista, o lo que invita a elegir mientras no hay ninguna.
  const order = [...(props.first ? [props.first] : []), ...others, ...props.options];
  const picks = order.filter((option) => values.includes(option.value));
  const empty = picks.length === 0 || (!multiple && props.first !== undefined && props.value === props.first.value);
  const single = !multiple && !empty ? picks[0] : undefined;
  const detail = props.describeChosen && typeof single?.description === "string" ? single.description : null;
  const spoken = empty ? props.placeholder ?? props.first?.label ?? "" : [picks.map((option) => option.label).join(", "), detail].filter(Boolean).join(" · ");

  // Al recorrer la lista, la marcada queda a la vista; al abrirla, la elegida va al centro (`focusList`).
  useLayoutEffect(() => {
    if (open && current >= 0) reveal(listRef.current, document.getElementById(`${uid}-option-${current}`), false);
  }, [open, current, uid]);

  // El buscador puede llegar con la lista abierta, cuando su dueño sabe que son muchas: el foco pasa a él.
  useLayoutEffect(() => {
    if (open && searchable && document.activeElement === listRef.current) searchRef.current?.focus();
  }, [open, searchable]);

  // Con la lista en la página: el foco al buscador o a la lista, y la elegida a la vista.
  function focusList(event: Event) {
    event.preventDefault();
    (searchRef.current ?? listRef.current)?.focus();
    const target = current >= 0 ? optionId(current) : null;
    // Radix ubica la lista y le da su alto un cuadro después: la elegida se centra después de eso.
    requestAnimationFrame(() => requestAnimationFrame(() => reveal(listRef.current, target ? document.getElementById(target) : null, true)));
  }

  function show() {
    if (props.disabled || props.disabledReason !== undefined) return;
    const index = rows.findIndex((row) => row.selected);
    setActive(index >= 0 ? index : rows.findIndex((row) => !row.disabled));
    setPicked(values);
    setOpen(true);
    props.onOpenChange?.(true);
  }

  function hide() {
    closing.current = true;
    setOpen(false);
    setLocalSearch("");
    if (remote && remote.search) remote.onSearch("");
    props.onOpenChange?.(false);
  }

  function choose(row: Row | undefined, index: number) {
    if (!row) return;
    if (row.disabled) { setActive(index); return; }
    const value = row.option.value;
    if (!props.multiple) { props.onChange(value); hide(); return; }
    const base = staged ? picked : props.value;
    const next = base.includes(value) ? base.filter((item) => item !== value) : [...base, value];
    if (staged) setPicked(next); else props.onChange(next);
    if (row.option === create) { setLocalSearch(""); remote?.onSearch(""); }
  }

  function done() {
    if (props.multiple) props.onChange([...picked]);
    hide();
  }

  // Mientras se cierra, la lista sigue un momento en la página, y la trampa de Radix trae de vuelta el foco que la elección
  // manda afuera, como al campo que muestra con `autoFocus`: se guarda adónde fue para dárselo cuando la lista se va.
  function focusLeaves(event: FocusEvent<HTMLElement>) {
    const next = event.relatedTarget;
    if (closing.current && next instanceof HTMLElement && !event.currentTarget.contains(next)) elsewhere.current = next;
  }

  // Al cerrarse, el foco vuelve al botón, salvo que la elección lo haya llevado a otro lado: al campo que mostró, o a una
  // confirmación que abrió. Radix pregunta con la lista ya fuera de la página: lo conectado que no es el botón ni la página
  // está afuera de ella.
  function focusTaken() {
    const kept = elsewhere.current;
    closing.current = false;
    elsewhere.current = null;
    return [document.activeElement, kept].find((element): element is HTMLElement =>
      element instanceof HTMLElement && element.isConnected && element !== document.body && element !== triggerRef.current) ?? null;
  }

  function jumpTo(key: string, time: number) {
    const text = time - typed.current.at < 500 ? typed.current.text + key : key;
    typed.current = { text, at: time };
    const target = fold(text), start = text.length === 1 ? current + 1 : Math.max(current, 0);
    for (let step = 0; step < rows.length; step++) {
      const index = (start + step) % rows.length;
      if (fold(rows[index]!.option.label).startsWith(target)) { setActive(index); return; }
    }
  }

  function onListKeyDown(event: KeyboardEvent<HTMLElement>) {
    const last = rows.length - 1;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (current < last) setActive(current + 1);
      else if (remote?.hasMore && !remote.loading) remote.onLoadMore();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive(Math.max(0, current - 1));
    } else if ((event.key === "Home" || event.key === "End") && !searchable) {
      event.preventDefault();
      setActive(event.key === "Home" ? 0 : last);
    } else if (event.key === "PageDown" || event.key === "PageUp") {
      event.preventDefault();
      setActive(Math.min(last, Math.max(0, current + (event.key === "PageDown" ? 10 : -10))));
    } else if (event.key === "Enter" || (event.key === " " && !searchable)) {
      // Enter en el buscador nunca manda el formulario de afuera.
      event.preventDefault();
      choose(rows[current], current);
    } else if (!searchable && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      jumpTo(event.key, event.timeStamp);
    }
  }

  // Tab sale de la lista desde su último control (Shift+Tab, desde el primero) y sigue, como desde un select.
  function leaveWithTab(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== "Tab" || event.altKey || event.ctrlKey || event.metaKey) return;
    const inside = tabbables(event.currentTarget), focused = document.activeElement;
    const edge = event.shiftKey ? inside[0] : inside.at(-1);
    if (inside.length > 1 && focused !== edge && inside.some((element) => element === focused)) return;
    event.preventDefault();
    leaving.current = event.shiftKey ? "back" : "next";
    hide();
  }

  const nameId = `${uid}-name`, valueId = `${uid}-value`, reasonId = `${uid}-reason`, listboxId = `${uid}-listbox`, triggerId = props.id ?? `${uid}-trigger`;
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
    "aria-labelledby": `${nameId} ${valueId}`,
    "aria-invalid": props["aria-invalid"],
    "aria-describedby": describedBy,
    "aria-busy": remote?.loading || undefined,
    onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => {
      if ((event.key === "ArrowDown" || event.key === "ArrowUp") && !open && !off) { event.preventDefault(); show(); }
    },
    onClick: phone ? show : undefined,
  };
  const words = <><span id={nameId} hidden>{props.label}</span><span id={valueId} hidden>{spoken}</span></>;
  const arrow = <ChevronDownIcon aria-hidden="true" strokeWidth={2}
    className="size-3.5 shrink-0 text-[var(--t2)] group-disabled:text-[var(--t3)] group-aria-disabled:text-[var(--t3)] max-md:size-4.5 max-md:text-[var(--t1)]" />;
  const button = props.trigger === "button"
    // «Criterio · Elegir»: en la barra de un listado, el filtro conserva su botón; con algo elegido, en el color de la marca.
    ? <Button {...triggerProps} variant="outline" className={cn("group h-8 gap-1.5 rounded-[0.5rem] px-3 text-[0.8125rem] shadow-none",
      props.active ? "border-[var(--marca)] bg-[var(--marca-t)] font-medium text-[var(--marca-tx)]" : "border-[var(--borde)] bg-[var(--superficie)] font-normal text-[var(--t2)]",
      props.className)}>
      {words}<span aria-hidden="true" className="truncate">{props.triggerLabel ?? single?.short ?? spoken}</span>
      <ChevronDownIcon aria-hidden="true" strokeWidth={2} className="size-3.5 shrink-0" />
    </Button>
    // «Criterio · Elegir», Cerrada: un campo con su flecha fina; en el teléfono, de 48 con letra de 16 (sin el zoom de iOS).
    : <button {...triggerProps} className={cn(
      "group flex h-9 w-full min-w-0 items-center gap-2 rounded-[0.5rem] border border-[var(--borde2)] bg-[var(--superficie)] px-3 text-left text-[0.8125rem] text-[var(--t1)] outline-none max-md:h-12 max-md:rounded-[0.75rem] max-md:px-3.5 max-md:text-[1rem]",
      "focus-visible:border-[var(--marca)] focus-visible:ring-[3px] focus-visible:ring-[var(--foco-halo)] aria-expanded:border-[var(--marca)] aria-expanded:ring-[3px] aria-expanded:ring-[var(--foco-halo)] aria-invalid:border-destructive",
      "disabled:cursor-default disabled:border-[var(--borde)] disabled:bg-[var(--s2)] disabled:text-[var(--t2)] aria-disabled:cursor-not-allowed aria-disabled:border-[var(--borde)] aria-disabled:bg-[var(--s2)] aria-disabled:text-[var(--t3)]",
      props.className)}>
      {words}
      {single?.icon && !single.short ? <span aria-hidden="true" className="flex shrink-0">{single.icon}</span> : null}
      {empty ? <span aria-hidden="true" className="min-w-0 flex-1 truncate text-[var(--t3)]">{spoken}</span>
        : multiple ? <ChoiceSummary labels={picks.map((option) => option.label)} />
          : <span aria-hidden="true" className="min-w-0 flex-1 truncate">
            {single?.short ?? single?.label}{detail ? <span className="text-[var(--t3)]">{` · ${detail}`}</span> : null}
          </span>}
      {arrow}
    </button>;
  const trigger = off ? <>
    <InformativeTooltip text={props.disabledReason}>{button}</InformativeTooltip>
    <span id={reasonId} hidden>{props.disabledReason}</span>
  </> : button;

  // La cantidad habla de las opciones: del servidor, sin ninguna, la lista dice por qué en su lugar (sin «0 opciones»).
  const countOf = (count: number) => props.countLabel?.(count) ?? t("picker.count", { count });
  const countText = remote ? shown.length > 0 && !remote.loading && props.total !== undefined ? countOf(props.total) : null
    : searchable ? (searching ? (shown.length > 0 ? countOf(shown.length) : null) : countOf(props.options.length)) : null;
  const limitText = multiple && props.max !== undefined
    ? full ? t("picker.chosenOf", { count: chosen.size, max: props.max }) : t("picker.upTo", { count: props.max }) : null;
  const searchBox = searchable
    ? <div className="relative">
      <SearchIcon aria-hidden="true" className={cn("pointer-events-none absolute top-1/2 -translate-y-1/2 text-[var(--t3)]", phone ? "left-3 size-5" : "left-2.5 size-4")} />
      <input ref={searchRef} type="search" role="combobox" aria-expanded="true" aria-controls={listboxId} aria-autocomplete="list"
        aria-activedescendant={current >= 0 ? optionId(current) : undefined} aria-label={t("picker.search", { label: props.label })}
        placeholder={t("actions.search")} autoComplete="off" spellCheck={false} value={search}
        onChange={(event) => { setActive(0); if (remote) remote.onSearch(event.target.value); else setLocalSearch(event.target.value); }}
        onKeyDown={onListKeyDown}
        // En el teléfono, de 44 con letra de 16: tocarlo no agranda la pantalla en iOS.
        className={cn("w-full border border-[var(--borde2)] bg-[var(--superficie)] pr-3 text-[var(--t1)] outline-none placeholder:text-[var(--t3)] focus-visible:border-[var(--marca)] focus-visible:ring-1 focus-visible:ring-[var(--marca)]",
          phone ? "h-11 rounded-[0.625rem] pl-10 text-[1rem]" : "h-8.5 rounded-[0.375rem] pl-8 text-[0.8125rem]")} />
    </div> : null;
  const countRow = countText !== null || limitText !== null
    ? <div className={cn("flex items-center justify-between gap-3 text-[var(--t2)]", phone ? "pt-2 text-[0.8125rem]" : "px-1.5 pt-1.5 text-[0.78125rem]")}>
      <span role="status">{countText}</span>{limitText ? <span role="status" className="shrink-0">{limitText}</span> : null}
    </div> : null;
  const header = searchBox || countRow
    ? <div className={cn("border-b border-[var(--borde)]", phone ? "px-4 pt-2.5 pb-2" : "p-1.5")}>{searchBox}{countRow}</div> : null;
  const options = <ul ref={listRef} id={listboxId} role="listbox" aria-label={props.label} aria-multiselectable={multiple || undefined}
    tabIndex={searchable ? undefined : -1} aria-activedescendant={!searchable && current >= 0 ? optionId(current) : undefined}
    onKeyDown={searchable ? undefined : onListKeyDown}
    className={cn("relative min-h-0 flex-1 overflow-y-auto outline-none [scrollbar-width:thin]", phone ? "" : "max-h-80 p-1", rows.length === 0 && "hidden")}>
    {rows.map((row, index) => <Fragment key={`${row.option === create ? "create:" : ""}${row.option.value}`}>
      {row.separated ? <li role="presentation" className={phone ? "h-px bg-[var(--borde2)]" : "-mx-1 my-1 h-px bg-[var(--borde2)]"} /> : null}
      <OptionRow row={row} id={optionId(index)} active={index === current && open} multiple={multiple} touch={phone}
        position={remote && props.total !== undefined ? { index: index + 1, size: rows.length - shown.length + props.total } : undefined}
        onHover={() => { if (index !== current) setActive(index); }} onChoose={() => choose(row, index)} />
    </Fragment>)}
  </ul>;
  // El estado habla de las opciones: «Todas» o una elegida de otra página no esconden que buscan o que fallaron.
  const state = shown.length > 0 || create ? null
    : remote?.loading ? <p role="status" className={cn("text-[var(--t2)]", phone ? "px-4 py-4 text-[0.9375rem]" : "px-3 py-2.5")}>{t("picker.searching")}</p>
      : remote?.error ? <div className={cn("flex flex-wrap items-center justify-between gap-2 text-[var(--t1)]", phone ? "px-4 py-4 text-[0.9375rem]" : "px-3 py-2")}>
        <span>{t("picker.failed")}</span>
        <Button type="button" variant="link" {...keepFocus} onClick={remote.onRetry}>{t("actions.retry")}</Button>
      </div>
        : <p role="status" className={cn("text-[var(--t2)]", phone ? "px-4 py-4 text-[0.9375rem]" : "px-3 py-2.5")}>
          {searching ? t("picker.noMatches", { search: search.trim() }) : t("picker.empty")}
        </p>;
  const more = remote?.hasMore
    ? <button type="button" {...keepFocus} onClick={remote.onLoadMore} disabled={remote.loading}
      className={cn("block w-full border-t border-[var(--borde)] text-left font-semibold text-[var(--marca-tx)] outline-none hover:bg-[var(--s2)] focus-visible:bg-[var(--s2)] disabled:text-[var(--t3)]",
        phone ? "min-h-14 px-4 text-[0.9375rem]" : "min-h-9 px-3 text-[0.8125rem]")}>
      {remote.loading ? t("states.loading") : t("picker.more", { count: props.pageSize ?? 50 })}
    </button> : null;

  if (phone) return <>
    {trigger}
    <Dialog open={open} onOpenChange={(next) => { if (!next) hide(); }}>
      {/* «Criterio · Elegir», En el teléfono: a pantalla completa, con el nombre del campo, la ✕, el buscador si son más de
          diez y renglones de 56. El botón no es el disparador propio del diálogo: el foco vuelve a él al cerrarse. */}
      <DialogContent showCloseButton={false} aria-describedby={undefined} onOpenAutoFocus={focusList} data-return-focus-to={triggerId}
        onBlur={focusLeaves} onCloseAutoFocus={(event) => { event.preventDefault(); (focusTaken() ?? triggerRef.current)?.focus(); }}
        className="max-md:inset-0 max-md:flex max-md:h-dvh max-md:max-h-none max-md:flex-col max-md:rounded-none [&>[data-slot=dialog-handle]]:hidden">
        <header className="flex min-h-14 shrink-0 items-center gap-2 border-b border-[var(--borde)] pt-[env(safe-area-inset-top)] pr-2 pl-4">
          <DialogTitle className="min-w-0 flex-1 truncate text-[1.125rem] font-bold text-[var(--t1)]">{props.label}</DialogTitle>
          <button type="button" aria-label={t("actions.close")} title={t("actions.close")} onClick={hide}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-[var(--t1)] focus-visible:outline-2 focus-visible:outline-[var(--foco)]">
            <CloseIcon className="size-5.5" />
          </button>
        </header>
        {header}
        {options}
        {state}
        {more}
        {multiple ? <footer className="shrink-0 border-t border-[var(--borde)] px-4 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <Button type="button" className="h-12 w-full" onClick={done}>{t("picker.done", { count: picked.length })}</Button>
        </footer> : null}
      </DialogContent>
    </Dialog>
  </>;

  return <PopoverPrimitive.Root modal open={open} onOpenChange={(next) => { if (next) show(); else hide(); }}>
    <PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
    <PopoverPrimitive.Portal>
      {/* `data-return-focus-to`: una confirmación que abre una elección se abre mientras la lista se cierra, con el foco
          adentro de ella; el atributo le dice que devuelva el foco al botón (useRestoreFocusOnClose). */}
      <PopoverPrimitive.Content aria-label={props.label} align="start" sideOffset={4} collisionPadding={8} onKeyDown={leaveWithTab} onOpenAutoFocus={focusList} data-return-focus-to={triggerId}
        onBlur={focusLeaves} onCloseAutoFocus={(event) => {
          const direction = leaving.current, taken = focusTaken();
          leaving.current = null;
          if (direction === "next") {
            event.preventDefault();
            (nextTabbable(triggerRef.current) ?? triggerRef.current)?.focus();
          } else if (taken) {
            event.preventDefault();
            taken.focus();
          }
        }}
        // La lista de un campo mide lo que el campo; la de un botón de la barra, lo que sus nombres, hasta un tope.
        className={cn("z-50 flex max-h-[min(28rem,var(--radix-popover-content-available-height))] flex-col overflow-hidden rounded-[0.625rem] border border-[var(--borde2)] bg-[var(--superficie)] text-[0.8125rem] text-[var(--t1)] shadow-[var(--sombra-menu)] outline-none",
          props.trigger === "button" ? "w-max max-w-90 min-w-50" : "w-(--radix-popover-trigger-width) min-w-50")}>
        {header}
        {options}
        {state}
        {more}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  </PopoverPrimitive.Root>;
}

/** Una opción: la tilde o la casilla a la izquierda, el nombre y su línea gris debajo. Apagada, su motivo se abre en un
 * tooltip mientras es la marcada (con el mouse encima, con las flechas o al tocarla) y es su descripción. */
function OptionRow({ row, id, active, multiple, touch, position, onHover, onChoose }: {
  row: Row; id: string; active: boolean; multiple: boolean; touch: boolean; position?: { index: number; size: number };
  onHover: () => void; onChoose: () => void;
}) {
  const { label, description, icon, trailing } = row.option;
  const describedBy = [description ? `${id}-description` : null, row.reason ? `${id}-reason` : null].filter(Boolean).join(" ");
  const item = <li role="option" id={id} aria-labelledby={`${id}-label${trailing ? ` ${id}-trailing` : ""}`} aria-describedby={describedBy || undefined}
    aria-selected={row.selected} aria-disabled={row.disabled || undefined} aria-posinset={position?.index} aria-setsize={position?.size}
    data-active={active || undefined}
    // El foco queda en el buscador o en la lista: un clic solo elige.
    onMouseDown={(event) => event.preventDefault()} onMouseMove={onHover} onClick={onChoose}
    className={cn("flex cursor-default items-start text-[var(--t1)] select-none data-[active]:bg-[var(--marca-t)] aria-disabled:text-[var(--t3)]",
      touch ? "min-h-14 items-center gap-3 border-b border-[var(--borde)] px-4 py-2 text-[1rem]" : "min-h-9 gap-2.5 rounded-[0.375rem] px-2.5 py-1.5 leading-[1.35]")}>
    {multiple
      ? <span aria-hidden="true" className={cn("flex shrink-0 items-center justify-center rounded-[0.25rem] border-[1.5px] border-[var(--borde2)] bg-[var(--superficie)] text-[var(--superficie)]",
        touch ? "size-5.5" : "mt-px size-4",
        row.selected && "border-[var(--marca)] bg-[var(--marca)]", row.disabled && !row.selected && "border-[var(--borde)] bg-[var(--s3)]")}>
        {row.selected ? <CheckIcon strokeWidth={3} className={touch ? "size-4" : "size-3"} /> : null}
      </span>
      : <span aria-hidden="true" className={cn("flex shrink-0 items-center justify-center text-[var(--marca-tx)]", touch ? "size-5.5" : "mt-px size-4")}>
        {row.selected ? <CheckIcon strokeWidth={2.25} className={touch ? "size-5" : "size-3.5"} /> : null}
      </span>}
    {icon ? <span aria-hidden="true" className={cn("flex shrink-0", touch ? "" : "mt-0.5")}>{icon}</span> : null}
    <span className="flex min-w-0 flex-1 flex-col">
      <span id={`${id}-label`} className="[overflow-wrap:anywhere]">{label}</span>
      {description ? <span id={`${id}-description`} className={cn("[overflow-wrap:anywhere]", row.disabled ? "text-[var(--t3)]" : "text-[var(--t2)]", touch ? "text-[0.8125rem]" : "text-[0.75rem]")}>{description}</span> : null}
    </span>
    {/* El espacio separa el nombre del prefijo también para los lectores de pantalla («Argentina +54»). */}
    {trailing ? <>{" "}<span id={`${id}-trailing`} className="ml-auto shrink-0 text-[var(--t2)]">{trailing}</span></> : null}
    {row.reason ? <span id={`${id}-reason`} hidden>{row.reason}</span> : null}
  </li>;
  if (!row.reason) return item;
  return <TooltipProvider>
    <Tooltip open={active}>
      <TooltipTrigger asChild>{item}</TooltipTrigger>
      <TooltipContent side="top" align="start" collisionPadding={8}>{row.reason}</TooltipContent>
    </Tooltip>
  </TooltipProvider>;
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
