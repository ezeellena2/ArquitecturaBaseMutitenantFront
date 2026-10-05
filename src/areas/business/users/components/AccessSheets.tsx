import { CheckIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";

// Tablero M-Usuario (v99): en el teléfono el estado y los roles de la organización son filas con › que abren una hoja
// para elegir. Las filas de la hoja (.ap-op) miden 52, con la letra de 16 y una línea fina entre ellas que no llega a
// los bordes (20 a cada lado, como el cuerpo de la hoja); la elegida va en petróleo. El estado se aplica y cierra al
// tocarlo; los roles se marcan de a uno y la hoja se cierra con «Listo» o con ✕.
const rowClass = "flex min-h-[52px] cursor-pointer items-center gap-3 border-b border-[var(--borde)] text-[16px] last:border-b-0 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[var(--foco)]";
const pickedClass = "font-medium text-[var(--marca-tx)]";

export function ChoiceSheet({ open, onOpenChange, title, done, children }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** «Listo»: el botón que cierra la hoja después de marcar varias opciones. */
  done?: { label: string; onClick: () => void };
  children: ReactNode;
}) {
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent aria-describedby={undefined}>
      <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
      <fieldset className="m-0 flex min-w-0 flex-col border-0 px-5 pt-2 pb-4">
        <legend className="sr-only">{title}</legend>
        {children}
      </fieldset>
      {done ? <DialogFooter><Button type="button" onClick={done.onClick}>{done.label}</Button></DialogFooter> : null}
    </DialogContent>
  </Dialog>;
}

/// Una opción de las que se elige una sola: el nombre y, si es la elegida, el tilde a la derecha (.ap-op .tilde). La
/// opción sigue siendo un radio para el teclado y el lector de pantalla, sin el círculo a la vista.
export function RadioRow({ name, label, checked, onChoose }: { name: string; label: string; checked: boolean; onChoose: () => void }) {
  return <label className={cn(rowClass, checked ? pickedClass : "text-[var(--t1)]")}>
    <input type="radio" name={name} checked={checked} onChange={onChoose} className="sr-only" />
    <span className="min-w-0 flex-1 truncate">{label}</span>
    {checked ? <CheckIcon aria-hidden="true" data-slot="tilde" strokeWidth={2.4} className="size-5 shrink-0" /> : null}
  </label>;
}

/// Una opción de las que se marcan varias: la casilla de 22 a la izquierda (.ap-chk) y el nombre.
export function CheckRow({ label, checked, onCheckedChange }: { label: string; checked: boolean; onCheckedChange: (checked: boolean) => void }) {
  return <label className={cn(rowClass, checked ? pickedClass : "text-[var(--t1)]")}>
    <Checkbox checked={checked} onCheckedChange={(next) => onCheckedChange(next === true)}
      className="size-[22px] rounded-[6px] border-[1.5px] border-[var(--borde2)] bg-[var(--lado-activo)] shadow-none data-[state=checked]:border-[var(--marca)] data-[state=checked]:bg-[var(--marca)] data-[state=checked]:text-[var(--lado-activo)]" />
    <span className="min-w-0 flex-1 truncate">{label}</span>
  </label>;
}
