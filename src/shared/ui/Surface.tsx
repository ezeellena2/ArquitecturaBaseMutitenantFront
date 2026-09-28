import type { ComponentProps } from "react";
import { cn } from "@/shared/lib/utils";

export function Surface({ className, style, ...props }: ComponentProps<"div">) {
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
