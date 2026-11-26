import { useCallback, useRef, useState, type ReactElement, type ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

type Side = "top" | "right" | "bottom" | "left";

/// Lo que solo informa (211): el motivo de lo apagado y la (i). Además de con el mouse y con el foco, se abre con un clic,
/// un toque, Enter o Espacio, sin hacer la acción, y queda abierto hasta Escape, salir con el mouse, perder el foco o tocar
/// afuera. Igual en la compu y en el teléfono: ya no hay franja oscura ni hoja chica para esto.
///
/// Radix no abre un tooltip con un toque y lo cierra con el `pointerdown` y el clic de su disparador. Acá el estado es
/// propio: el clic lo abre, y `preventDefault` saltea esos cierres, que Radix compone después de los manejadores dados. El
/// disparador es el control (un botón, la opción de un menú) o el envoltorio de uno que no puede serlo (una casilla o una
/// opción de un grupo, que usan su propio `data-state`). Quien lo usa pone el motivo en la descripción accesible del
/// control; el tooltip es lo que se ve.
/// `align="start"` lo abre desde el comienzo del control y no centrado: el motivo de una casilla al borde de una tabla
/// (los permisos de un rol) se abre hacia adentro, como en el tablero Rol-Base2.
export function InformativeTooltip({ text, side = "top", align = "center", children }: { text: ReactNode; side?: Side; align?: "start" | "center" | "end"; children: ReactElement }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLElement | null>(null);
  const setTrigger = useCallback((node: HTMLElement | null) => { trigger.current = node; }, []);

  return (
    <TooltipProvider>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger
          asChild
          ref={setTrigger}
          onPointerDown={(event) => event.preventDefault()}
          onClick={(event) => {
            event.preventDefault();
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            // Un botón convierte la tecla en un clic; un envoltorio enfocable no, y Espacio desplazaría la página.
            if (!(event.currentTarget instanceof HTMLButtonElement)) event.preventDefault();
            setOpen(true);
          }}
        >
          {children}
        </TooltipTrigger>
        <TooltipContent
          side={side}
          align={align}
          collisionPadding={8}
          // Tocar otra vez el control no lo cierra: para Radix es tocar afuera del tooltip.
          onPointerDownOutside={(event) => {
            if (event.target instanceof Node && trigger.current?.contains(event.target)) event.preventDefault();
          }}
        >
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
