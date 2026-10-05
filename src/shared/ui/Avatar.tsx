import type { ComponentProps } from "react";
import { cn } from "@/shared/lib/utils";

export interface AvatarProps extends Omit<ComponentProps<"span">, "children"> {
  initials: string;
  label?: string;
  size?: "small" | "default" | "medium" | "large" | "nav" | "row" | "profile";
  /** Una invitación sin nombre (M-Usuarios, `.w-av.g`): «@» en gris, sin el degradé. */
  muted?: boolean;
}

// Tableros Usuarios e Invitación: el círculo con el degradado de la marca (tema.md, `--marca-2`), igual en la compu y en el
// teléfono (lienzo v104). En el marco de la compu (la barra de arriba y el pie del menú) mide 32 con la inicial de 12; en tu
// menú, 36 con 15; quien invita, 40 con 16. En el teléfono: «Más» en la barra de abajo, 26 con 12; una fila, 44 con 15; tu
// inicial arriba de «Más», 56 con 20.
const sizes = {
  small: "size-7 text-xs",
  default: "size-8 text-[12px]",
  medium: "size-9 text-[15px]",
  large: "size-10 text-base",
  nav: "size-[26px] text-[12px]",
  row: "size-11 text-[15px]",
  profile: "size-14 text-[20px]",
} as const;

export function Avatar({
  initials,
  label,
  size = "default",
  muted = false,
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
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold",
        muted ? "bg-[var(--s3)] text-[var(--t2)]" : "bg-linear-to-br from-[var(--marca)] to-[var(--marca-2)] text-[var(--lado-activo)]",
        sizes[size],
        className,
      )}
      {...props}
    >
      {initials}
    </span>
  );
}
