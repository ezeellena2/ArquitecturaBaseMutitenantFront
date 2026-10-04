import type { ComponentProps } from "react";
import { cn } from "@/shared/lib/utils";
import { useAppChrome } from "./app/AppChrome";

/// La caja blanca de la compu. Con `phoneFlush`, en el teléfono no dibuja caja: la lista va de borde a borde.
export function Surface({ className, style, phoneFlush, ...props }: ComponentProps<"div"> & { phoneFlush?: boolean }) {
  const { phone } = useAppChrome();
  if (phone && phoneFlush) return <div {...props} />;
  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] border border-[var(--borde)] bg-[var(--lado-activo)]",
        className,
      )}
      style={{ boxShadow: "var(--shadow-card)", ...style }}
      {...props}
    />
  );
}
