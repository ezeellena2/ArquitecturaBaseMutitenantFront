import type { ComponentProps } from "react";
import { cn } from "@/shared/lib/utils";
import { useAppChrome } from "./app/AppChrome";

/// La caja blanca de la compu, con su borde y sin sombra (173). Con `phoneFlush`, en el teléfono no dibuja caja: la lista va
/// de borde a borde.
export function Surface({ className, phoneFlush, ...props }: ComponentProps<"div"> & { phoneFlush?: boolean }) {
  const { phone } = useAppChrome();
  if (phone && phoneFlush) return <div {...props} />;
  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] border border-[var(--borde)] bg-[var(--superficie)]",
        className,
      )}
      {...props}
    />
  );
}
