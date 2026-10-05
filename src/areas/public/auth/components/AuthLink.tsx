import type { ReactNode } from "react";
import { Link, type LinkProps } from "react-router";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

/// Un enlace de texto del ingreso y los registros (.lnk de los tableros): la variante link de Button, en `--marca-tx`,
/// con la letra del renglón que lo lleva («¿No tenés cuenta? Creá una», «Acepto los Términos…»).
export function AuthLink({ className, ...props }: LinkProps) {
  return <Button asChild variant="link" className={cn("text-[length:inherit]", className)}><Link {...props} /></Button>;
}

/// Un renglón de enlaces del ingreso y los registros (.fila-links de los tableros): el texto y el enlace, centrados y a 6
/// entre sí, en 13 y el gris del texto secundario. «¿No tenés cuenta? Creá una».
export function AuthLinkRow({ children }: { children: ReactNode }) {
  return <div className="flex justify-center gap-1.5 text-[13px] text-[var(--t2)]">{children}</div>;
}
