import type { ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";

// Tablero M-Usuario: en el teléfono el estado y los roles de la organización son filas con › que abren una hoja para
// elegir. Las filas de la hoja son las de la hoja de filtros de M-Usuarios: 54 de alto, la letra de 16 y la marca a
// la derecha. El estado se aplica y cierra al tocarlo; los roles se marcan de a uno y la hoja se cierra con ✕.
const rowClass = "flex min-h-[54px] items-center gap-3 border-t border-[var(--borde)] px-5 py-2 text-[16px] text-[var(--t1)] first-of-type:border-t-0";

function OptionText({ label, description }: { label: string; description?: string }) {
  return <span className="flex min-w-0 flex-1 flex-col gap-px">
    <span className="truncate">{label}</span>
    {description ? <span className="text-[13px] text-[var(--t3)]">{description}</span> : null}
  </span>;
}

export function ChoiceSheet({ open, onOpenChange, title, children }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
}) {
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
      <fieldset className="m-0 flex flex-col border-0 p-0 pt-1 pb-2">
        <legend className="sr-only">{title}</legend>
        {children}
      </fieldset>
    </DialogContent>
  </Dialog>;
}

export function RadioRow({ name, label, description, checked, onChoose }: {
  name: string; label: string; description?: string; checked: boolean; onChoose: () => void;
}) {
  return <label className={rowClass}>
    <OptionText label={label} description={description} />
    <input type="radio" name={name} checked={checked} onChange={onChoose} className="size-5 shrink-0 accent-[var(--marca)]" />
  </label>;
}

export function CheckRow({ label, checked, onCheckedChange }: { label: string; checked: boolean; onCheckedChange: (checked: boolean) => void }) {
  return <label className={rowClass}>
    <OptionText label={label} />
    <input type="checkbox" checked={checked} onChange={(event) => onCheckedChange(event.target.checked)} className="size-5 shrink-0 accent-[var(--marca)]" />
  </label>;
}
