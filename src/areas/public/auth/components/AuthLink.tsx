import { Link, type LinkProps } from "react-router";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

/// Un enlace de texto del ingreso y los registros (.lnk de los tableros): la variante link de Button, en `--marca-tx`,
/// con la letra del renglón que lo lleva («¿No tenés cuenta? Creá una», «Acepto los Términos…»).
export function AuthLink({ className, ...props }: LinkProps) {
  return <Button asChild variant="link" className={cn("text-[length:inherit]", className)}><Link {...props} /></Button>;
}
