import { Plus } from "lucide-react";
import { Link } from "react-router";

// Tableros M-* (.ap-fab): crear algo nuevo es un «+» de 56 abajo a la derecha, encima de la barra de abajo.
const fabClass = "fixed right-4 bottom-[calc(84px+env(safe-area-inset-bottom))] z-30 inline-flex size-14 items-center justify-center rounded-2xl bg-[var(--marca)] text-[var(--lado-activo)] shadow-[var(--sombra-fab)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foco)]";

export function Fab({ label, onClick, to }: { label: string; onClick?: () => void; to?: string }) {
  const icon = <Plus size={26} strokeWidth={2} aria-hidden="true" />;
  return to
    ? <Link to={to} aria-label={label} title={label} className={fabClass}>{icon}</Link>
    : <button type="button" aria-label={label} title={label} onClick={onClick} className={fabClass}>{icon}</button>;
}
