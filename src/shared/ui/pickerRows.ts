import type { TFunction } from "i18next";
import type { ReactNode } from "react";
import type { RemoteOptions } from "@/shared/hooks/useResourceOptions";

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

/** Una fila de la lista abierta: la opción, si está elegida y, apagada, por qué. */
export interface PickerRow {
  readonly option: PickerOption;
  readonly selected: boolean;
  readonly disabled: boolean;
  readonly reason: string | null;
  readonly separated: boolean;
}

/** Con más opciones que estas, la lista trae su buscador. */
export const SEARCH_FROM = 10;

export const fold = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase();

/** El id de la fila `index` de la lista de una pieza: lo nombra `aria-activedescendant`. */
export const pickerOptionId = (uid: string, index: number) => `${uid}-option-${index}`;

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

export interface PickerListInput {
  readonly options: readonly PickerOption[];
  readonly first?: PickerOption;
  readonly selectedOptions?: readonly PickerOption[];
  readonly creatable?: boolean;
  readonly max?: number;
  readonly multiple: boolean;
  /** Lo elegido, como lo tiene el dueño. */
  readonly values: readonly string[];
  /** Lo que se ve marcado: lo elegido o, en el teléfono con varias, la copia que aplica «Listo». */
  readonly chosen: ReadonlySet<string>;
  readonly search: string;
  readonly remote?: Pick<RemoteOptions, "loading" | "error">;
}

/** Lo que muestra la lista abierta para lo que hay elegido y lo que se busca. */
export interface PickerList {
  readonly rows: readonly PickerRow[];
  /** Las opciones que responden a la búsqueda, en el orden en que responden. */
  readonly shown: readonly PickerOption[];
  /** Las elegidas que no están entre las opciones: de otra página del servidor, o creadas acá. */
  readonly others: readonly PickerOption[];
  /** «Crear «X»», si lo buscado no está. */
  readonly create: PickerOption | null;
  readonly searching: boolean;
  /** Ya se eligieron todas las que se pueden. */
  readonly full: boolean;
}

/** Las filas de la lista: «Sin …» (`first`) primero, las elegidas de otra página, las que responden a la búsqueda y, al
 * final, «Crear «X»». Con el tope alcanzado, las no elegidas quedan apagadas con «Elegiste N de N». */
export function pickerList(input: PickerListInput, t: TFunction): PickerList {
  const { options, first, multiple, values, chosen, search, remote } = input;
  const searching = search.trim() !== "";
  const full = multiple && input.max !== undefined && chosen.size >= input.max;
  const known = [...(input.selectedOptions ?? [])];
  // Lo creado acá todavía no es una opción: se muestra con su texto. «Sin …» (`first`) no es algo creado.
  if (input.creatable) for (const item of values) if (item !== first?.value && ![...known, ...options].some((option) => option.value === item)) known.push({ value: item, label: item });
  const others = known.filter((option) => !options.some((item) => item.value === option.value));
  const needle = fold(search.trim());
  const shown = remote || !searching ? options : options.map((option, index) => ({ option, index, rank: rank(option, needle) }))
    .filter((item) => item.rank >= 0).sort((a, b) => a.rank - b.rank || a.index - b.index).map((item) => item.option);
  // Se ofrece crear solo con la búsqueda ya respondida y si no hay una igual: así no se duplica una que existe.
  const typedText = search.trim();
  const same = (text: string) => text.localeCompare(typedText, undefined, { sensitivity: "accent" }) === 0;
  const create: PickerOption | null = input.creatable && typedText !== "" && !remote?.loading && !remote?.error
    && ![...options, ...known].some((option) => same(option.value) || same(option.label))
    ? { value: typedText, label: t("fields.createOption", { value: typedText }) } : null;

  const rows: PickerRow[] = [];
  const push = (option: PickerOption, separated: boolean) => {
    const selected = chosen.has(option.value);
    const reason = option.disabledReason ?? (full && !selected ? t("picker.chosenOf", { count: chosen.size, max: input.max }) : null);
    rows.push({ option, separated: rows.length > 0 && separated, selected, disabled: reason !== null, reason });
  };
  if (first && !searching) push(first, false);
  if (!searching) others.filter((option) => chosen.has(option.value)).forEach((option, index) => push(option, index === 0));
  shown.forEach((option, index) => push(option, index === 0 || !!option.separated));
  if (create) push(create, true);
  return { rows, shown, others, create, searching, full };
}

export interface PickerChoiceInput {
  readonly options: readonly PickerOption[];
  readonly first?: PickerOption;
  readonly others: readonly PickerOption[];
  readonly values: readonly string[];
  readonly multiple: boolean;
  readonly placeholder?: string;
  readonly describeChosen?: boolean;
}

/** Lo que dice el campo cerrado. */
export interface PickerChoice {
  /** Las elegidas en el orden de la lista. */
  readonly picks: readonly PickerOption[];
  /** Nada elegido, o «Sin …» (`first`): el campo invita a elegir. */
  readonly empty: boolean;
  readonly single?: PickerOption;
  /** La línea gris de la única elegida, con `describeChosen`. */
  readonly detail: string | null;
  /** Lo que oye el lector: lo elegido, o lo que invita a elegir. */
  readonly spoken: string;
}

/** Lo que dice el campo cerrado: las elegidas en el orden de la lista, o lo que invita a elegir mientras no hay ninguna. */
export function pickerChoice({ options, first, others, values, multiple, placeholder, describeChosen }: PickerChoiceInput): PickerChoice {
  const order = [...(first ? [first] : []), ...others, ...options];
  const picks = order.filter((option) => values.includes(option.value));
  const empty = picks.length === 0 || (!multiple && first !== undefined && values[0] === first.value);
  const single = !multiple && !empty ? picks[0] : undefined;
  const detail = describeChosen && typeof single?.description === "string" ? single.description : null;
  const spoken = empty ? placeholder ?? first?.label ?? "" : [picks.map((option) => option.label).join(", "), detail].filter(Boolean).join(" · ");
  return { picks, empty, single, detail, spoken };
}
