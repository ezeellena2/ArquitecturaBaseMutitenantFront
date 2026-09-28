import type { ComponentProps } from "react";
import { cn } from "@/shared/lib/utils";

export interface AvatarProps extends Omit<ComponentProps<"span">, "children"> {
  initials: string;
  label?: string;
  size?: "small" | "default" | "large";
}

const sizes = {
  small: "size-7 text-xs",
  default: "size-8 text-sm",
  large: "size-10 text-base",
} as const;

export function Avatar({
  initials,
  label,
  size = "default",
  className,
  ...props
}: AvatarProps) {
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-linear-to-br from-[var(--marca)] to-[var(--marca-2)] font-semibold text-[var(--lado-activo)]",
        sizes[size],
        className,
      )}
      {...props}
    >
      {initials}
    </span>
  );
}
