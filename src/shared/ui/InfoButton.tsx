import { Info } from "lucide-react";
import { cn } from "@/shared/lib/utils";

const tones = {
  danger: "text-[var(--peligro)] hover:bg-[var(--peligro-t)]",
  // La ventana de 24 h del chat (WA-Chats-24h, `.o-i`): en el ámbar del aviso.
  warning: "text-[var(--alerta)] hover:bg-[var(--alerta-t)]",
  // En una línea de estado (WA-Chats, `.e11-est .o-i`): el color de esa línea, gris para «Número desconectado».
  inherit: "text-inherit hover:bg-[var(--s3)]",
} as const;

/// El ⓘ que abre el detalle de algo que no se puede hacer (tablero «Criterio · Dialogos»: el aviso importante se
/// abre desde un ⓘ). En la pantalla queda solo el estado; el porqué va en el diálogo. Rojo, salvo que el tablero lo
/// pinte del color de su aviso.
export function InfoButton({ label, onClick, tone = "danger" }: { label: string; onClick: () => void; tone?: keyof typeof tones }) {
  return <button type="button" aria-label={label} title={label} onClick={onClick}
    className={cn("inline-flex size-6 shrink-0 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-[var(--foco)]", tones[tone])}>
    <Info aria-hidden="true" className="size-4" />
  </button>;
}
