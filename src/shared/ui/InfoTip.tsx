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
///
/// `standalone` es la (i) del estado en la banda (175, `.t10n-i`): no acompaña a un campo, así que se enfoca sola y la
/// frase es su nombre («El 18/09/2026, 16:45. Motivo: dos meses sin pago.»).
export function InfoTip({ id, text, title, className, standalone = false }: { id?: string; text: string; title: string; className?: string; standalone?: boolean }) {
  const { phone } = useAppChrome();
  const [open, setOpen] = useState(false);
  const icon = <Info aria-hidden="true" strokeWidth={2} className="size-3.5" />;
  const base = cn("relative inline-flex shrink-0 align-middle text-[var(--t3)]", standalone && "rounded-full focus-visible:outline-2 focus-visible:outline-[var(--foco)]", className);
  const description = standalone ? null : <span id={id} hidden>{text}</span>;
  // La (i) sola tiene nombre y foco; la de un campo es solo un dibujo y su texto describe al campo.
  const role = standalone ? { role: "img", tabIndex: 0, "aria-label": text } : { "aria-hidden": true as const };

  if (phone) {
    // Dentro de un rótulo, tocarla no tiene que pasarle el foco al campo.
    const show = (event: MouseEvent) => { event.preventDefault(); event.stopPropagation(); setOpen(true); };
    return <>
      {description}
      {/* El área que se toca llega a 44 × 44 sin mover nada (187). */}
      <span {...role} data-slot="info-tip" onClick={show} className={cn(base, "after:absolute after:-inset-3.75")}>{icon}</span>
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
        <TooltipTrigger asChild><span {...role} data-slot="info-tip" className={base}>{icon}</span></TooltipTrigger>
        <TooltipContent>{text}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </>;
}
