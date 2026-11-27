import type { ReactNode } from "react";

interface IconProps {
  className?: string;
  strokeWidth?: number;
}

function Icon({ className, strokeWidth = 1.75, children }: IconProps & { children: ReactNode }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true" className={className}>{children}</svg>;
}

/// «Gestión de formularios» del menú (FRM-Catalogos): la hoja con la esquina doblada y dos renglones.
export function FormsIcon(props: IconProps) {
  return <Icon {...props}>
    <path d="M14.5 3.5H7a1.5 1.5 0 0 0-1.5 1.5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V7.5z" />
    <path d="M14 3.5V8h4.5" />
    <path d="M9 12.5h6" />
    <path d="M9 16h4" />
  </Icon>;
}

/// «Catálogos» del panel Gestión de formularios (FRM-Catalogos): la lista con sus viñetas.
export function CatalogsIcon(props: IconProps) {
  return <Icon {...props}>
    <path d="M9 6.5h10.5M9 12h10.5M9 17.5h10.5" />
    <circle cx="4.8" cy="6.5" r="1.1" />
    <circle cx="4.8" cy="12" r="1.1" />
    <circle cx="4.8" cy="17.5" r="1.1" />
  </Icon>;
}
