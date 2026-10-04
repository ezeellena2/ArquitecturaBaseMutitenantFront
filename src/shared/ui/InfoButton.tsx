import { Info } from "lucide-react";

/// El ⓘ que abre el detalle de algo que no se puede hacer (tablero «Criterio · Dialogos»: el aviso importante se
/// abre desde un ⓘ). En la pantalla queda solo el estado; el porqué va en el diálogo.
export function InfoButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button type="button" aria-label={label} title={label} onClick={onClick}
    className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-[var(--peligro)] hover:bg-[var(--peligro-t)] focus-visible:outline-2 focus-visible:outline-[var(--foco)]">
    <Info aria-hidden="true" className="size-4" />
  </button>;
}
