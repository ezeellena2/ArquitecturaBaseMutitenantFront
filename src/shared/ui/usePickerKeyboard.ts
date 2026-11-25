import { useRef, type KeyboardEvent } from "react";
import type { RemoteOptions } from "@/shared/hooks/useResourceOptions";
import { fold, type PickerRow } from "./pickerRows";

interface PickerKeyboardInput {
  readonly rows: readonly PickerRow[];
  /** La fila marcada. */
  readonly current: number;
  readonly searchable: boolean;
  readonly remote?: RemoteOptions;
  readonly setActive: (index: number) => void;
  readonly choose: (row: PickerRow | undefined, index: number) => void;
}

/**
 * Las teclas de la lista abierta (262), en el buscador o en la lista: las flechas recorren (abajo de la última, del servidor
 * trae más), Inicio y Fin van a las puntas si no hay buscador, Re Pág y Av Pág saltan diez, y Enter elige (en varias, marca
 * sin cerrar). Sin buscador, Espacio también elige y una letra lleva a la primera opción que empieza así; varias letras
 * seguidas, a la que empieza con todas.
 */
export function usePickerKeyboard({ rows, current, searchable, remote, setActive, choose }: PickerKeyboardInput) {
  const typed = useRef({ text: "", at: -Infinity });

  function jumpTo(key: string, time: number) {
    const text = time - typed.current.at < 500 ? typed.current.text + key : key;
    typed.current = { text, at: time };
    const target = fold(text), start = text.length === 1 ? current + 1 : Math.max(current, 0);
    for (let step = 0; step < rows.length; step++) {
      const index = (start + step) % rows.length;
      if (fold(rows[index]!.option.label).startsWith(target)) { setActive(index); return; }
    }
  }

  return function onListKeyDown(event: KeyboardEvent<HTMLElement>) {
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
  };
}
