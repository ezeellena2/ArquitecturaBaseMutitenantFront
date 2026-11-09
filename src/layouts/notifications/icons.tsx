import type { ReactNode } from "react";

interface IconProps {
  className?: string;
}

// El trazo y la forma del set (`shared/ui/icons`): decorativos; el nombre lo pone el control que los lleva.
function Icon({ className, children }: IconProps & { children: ReactNode }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true" className={className}>{children}</svg>;
}

/** La campana de la barra de arriba (tableros Campana, Campana-Plat y M-Campana*: `.w-campana` y `.ap-campana`). */
export function BellIcon(props: IconProps) {
  return <Icon {...props}><path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15z" /><path d="M10 20.5a2 2 0 0 0 4 0" /></Icon>;
}

/** La versión nueva del sistema (`.cmp-ic.version`): la flecha que vuelve a cargar, hacia la izquierda. */
export function NewVersionIcon(props: IconProps) {
  return <Icon {...props}><path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" /><path d="M4.5 4.5v4h4" /></Icon>;
}
