import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

export interface AvatarProps extends Omit<ComponentProps<"span">, "children"> {
  initials: string;
  label?: string;
  size?: "small" | "default" | "medium" | "large" | "nav" | "row" | "profile";
  /** Una invitación sin nombre (M-Usuarios, `.w-av.g`): «@» en gris, sin el degradé. */
  muted?: boolean;
  /** En vez de la inicial, un ícono: una invitación por teléfono lleva el teléfono (M-Usuarios). */
  icon?: ReactNode;
}

// «Criterio · Marco» (173): un cuadrado con la inicial, relleno de la marca y la letra blanca, sin círculo ni degradé, igual
// en la compu y en el teléfono; radio de 8 hasta 44 y de 12 más grande (en la compu, 3 como mucho, por la escala). En el marco de la compu (la barra de arriba y el pie del menú) mide 32 con la inicial de 12; en tu
// menú, 36 con 15; quien invita, 40 con 16. En el teléfono: «Más» en la barra de abajo, 26 con 12; una fila, 44 con 15; tu
// inicial arriba de «Más», 56 con 20.
const sizes = {
  small: "size-7 text-xs",
  default: "size-8 text-[0.75rem]",
  medium: "size-9 text-[0.9375rem]",
  large: "size-10 text-base",
  nav: "size-6.5 text-[0.75rem]",
  row: "size-11 text-[0.9375rem]",
  profile: "size-14 text-[1.25rem]",
} as const;

export function Avatar({
  initials,
  label,
  size = "default",
  muted = false,
  icon,
  className,
  ...props
}: AvatarProps) {
  return (
    <span
      data-slot="avatar"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn(
        "inline-flex shrink-0 items-center justify-center font-semibold",
        size === "profile" ? "rounded-[0.75rem]" : "rounded-[0.5rem]",
        muted ? "bg-[var(--s3)] text-[var(--t2)]" : "bg-[var(--marca)] text-[var(--superficie)]",
        sizes[size],
        className,
      )}
      {...props}
    >
      {icon ?? initials}
    </span>
  );
}
