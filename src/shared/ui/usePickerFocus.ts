import { useLayoutEffect, useRef, type FocusEvent, type KeyboardEvent } from "react";
import { pickerOptionId } from "./pickerRows";

const TABBABLE = "a[href], button, input, select, textarea, [tabindex]";

const tabbables = (root: ParentNode) => [...root.querySelectorAll<HTMLElement>(TABBABLE)]
  .filter((element) => element.tabIndex >= 0 && !element.matches(":disabled") && !element.closest("[hidden], [inert]"));

/** Lo que alcanza Tab después del campo, adentro de su diálogo si tiene uno. */
function nextTabbable(from: HTMLElement | null): HTMLElement | null {
  if (!from) return null;
  const all = tabbables(from.closest("[role=dialog]") ?? document.body);
  const index = all.indexOf(from);
  return index < 0 ? null : all[index + 1] ?? null;
}

/** Desplaza solo la lista, nunca la página: al abrir, la elegida al centro; al recorrer, lo mínimo. */
function reveal(list: HTMLElement | null, option: HTMLElement | null, center: boolean) {
  if (!list || !option) return;
  const top = option.offsetTop, bottom = top + option.offsetHeight;
  if (center) list.scrollTop = top - (list.clientHeight - option.offsetHeight) / 2;
  else if (top < list.scrollTop) list.scrollTop = top;
  else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
}

interface PickerFocusInput {
  readonly uid: string;
  readonly open: boolean;
  /** La fila marcada. */
  readonly current: number;
  readonly searchable: boolean;
  /** Tab sale de la lista: la pieza se cierra. */
  readonly onTabOut: () => void;
}

/**
 * Adónde va el foco con la lista de una pieza para elegir (262): al abrirse, al buscador o a la lista, con la elegida al
 * centro y la marcada siempre a la vista; Tab sale desde el último control (Shift+Tab, desde el primero) y sigue, como desde
 * un select; y al cerrarse vuelve al botón, salvo que la elección lo haya llevado a otro lado.
 */
export function usePickerFocus({ uid, open, current, searchable, onTabOut }: PickerFocusInput) {
  const triggerRef = useRef<HTMLButtonElement>(null), listRef = useRef<HTMLUListElement>(null), searchRef = useRef<HTMLInputElement>(null);
  const leaving = useRef<"next" | "back" | null>(null), closing = useRef(false), elsewhere = useRef<HTMLElement | null>(null);

  // Al recorrer la lista, la marcada queda a la vista; al abrirla, la elegida va al centro (`focusList`).
  useLayoutEffect(() => {
    if (open && current >= 0) reveal(listRef.current, document.getElementById(pickerOptionId(uid, current)), false);
  }, [open, current, uid]);

  // El buscador puede llegar con la lista abierta, cuando su dueño sabe que son muchas: el foco pasa a él.
  useLayoutEffect(() => {
    if (open && searchable && document.activeElement === listRef.current) searchRef.current?.focus();
  }, [open, searchable]);

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

  return {
    triggerRef, listRef, searchRef,
    /** La lista empieza a cerrarse: desde ahora, el foco que sale de ella es de la elección. */
    closing: () => { closing.current = true; },
    /** Con la lista en la página: el foco al buscador o a la lista, y la elegida a la vista. */
    focusList: (event: Event) => {
      event.preventDefault();
      (searchRef.current ?? listRef.current)?.focus();
      const target = current >= 0 ? pickerOptionId(uid, current) : null;
      // Radix ubica la lista y le da su alto un cuadro después: la elegida se centra después de eso.
      requestAnimationFrame(() => requestAnimationFrame(() => reveal(listRef.current, target ? document.getElementById(target) : null, true)));
    },
    /** Mientras se cierra, la lista sigue un momento en la página, y la trampa de Radix trae de vuelta el foco que la
     *  elección manda afuera, como al campo que muestra con `autoFocus`: se guarda adónde fue para dárselo cuando la lista
     *  se va. */
    focusLeaves: (event: FocusEvent<HTMLElement>) => {
      const next = event.relatedTarget;
      if (closing.current && next instanceof HTMLElement && !event.currentTarget.contains(next)) elsewhere.current = next;
    },
    /** Tab sale de la lista desde su último control (Shift+Tab, desde el primero) y sigue, como desde un select. */
    leaveWithTab: (event: KeyboardEvent<HTMLElement>) => {
      if (event.key !== "Tab" || event.altKey || event.ctrlKey || event.metaKey) return;
      const inside = tabbables(event.currentTarget), focused = document.activeElement;
      const edge = event.shiftKey ? inside[0] : inside.at(-1);
      if (inside.length > 1 && focused !== edge && inside.some((element) => element === focused)) return;
      event.preventDefault();
      leaving.current = event.shiftKey ? "back" : "next";
      onTabOut();
    },
    /** La hoja del teléfono se cerró: el foco vuelve al botón o adonde lo llevó la elección. */
    sheetClosed: (event: Event) => {
      event.preventDefault();
      (focusTaken() ?? triggerRef.current)?.focus();
    },
    /** La lista se cerró: con Tab, el foco sigue al próximo control; si no, al botón (lo hace Radix) o adonde lo llevó la
     *  elección. */
    popoverClosed: (event: Event) => {
      const direction = leaving.current, taken = focusTaken();
      leaving.current = null;
      if (direction === "next") {
        event.preventDefault();
        (nextTabbable(triggerRef.current) ?? triggerRef.current)?.focus();
      } else if (taken) {
        event.preventDefault();
        taken.focus();
      }
    },
  };
}
