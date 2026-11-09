import { Info } from "lucide-react";
import { useState, type MouseEvent } from "react";
import { cn } from "@/shared/lib/utils";
import { useAppChrome } from "./app/AppChrome";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "./Sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

/// La (i) de una ayuda («Criterio · Formularios», `.i-ay`; 116): gris, de 14, junto al rótulo de un campo, al título de
/// una caja o de una página, o al final de una opción. En la compu, el texto sale en su tooltip al pasar el mouse; en el
/// teléfono, tocarla abre una hoja chica con el texto, con `title` de título (el rótulo que acompaña).
///
/// El texto es la descripción accesible de lo que acompaña: quien la usa pone `id` en su `aria-describedby` y el lector
/// lo lee al llegar al campo. Va escondido (`hidden`), así no se suma al nombre de un rótulo que lo contiene. La (i) no
/// toma el foco: no se lo roba al campo cuando se abre un diálogo.
export function InfoTip({ id, text, title, className }: { id: string; text: string; title: string; className?: string }) {
  const { phone } = useAppChrome();
  const [open, setOpen] = useState(false);
  const icon = <Info aria-hidden="true" strokeWidth={2} className="size-3.5" />;
  const base = cn("relative inline-flex shrink-0 align-middle text-[var(--t3)]", className);
  const description = <span id={id} hidden>{text}</span>;

  if (phone) {
    // Dentro de un rótulo, tocarla no tiene que pasarle el foco al campo.
    const show = (event: MouseEvent) => { event.preventDefault(); event.stopPropagation(); setOpen(true); };
    return <>
      {description}
      {/* El área que se toca llega a 44 × 44 sin mover nada (187). */}
      <span aria-hidden="true" data-slot="info-tip" onClick={show} className={cn(base, "after:absolute after:-inset-3.75")}>{icon}</span>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent size="sm">
          <SheetHeader><SheetTitle>{title}</SheetTitle></SheetHeader>
          <SheetDescription className="px-5 pb-[calc(2.125rem+env(safe-area-inset-bottom))] text-[0.9375rem] leading-[1.45] text-[var(--t1)]">{text}</SheetDescription>
        </SheetContent>
      </Sheet>
    </>;
  }

  return <>
    {description}
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild><span aria-hidden="true" data-slot="info-tip" className={base}>{icon}</span></TooltipTrigger>
        <TooltipContent>{text}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </>;
}
