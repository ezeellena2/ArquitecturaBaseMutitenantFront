import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"
import { useTranslation } from "react-i18next"

// Tablero «Criterio · Botones»: cuatro tipos y tres tamaños, iguales en todas las pantallas. El de ícono (⋮, ✕, ☰)
// mide 32 × 32 y siempre lleva nombre para el lector de pantalla.
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-[8px] border border-transparent font-semibold whitespace-nowrap transition-[background-color,border-color,filter] outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--foco-halo)] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Principal: la acción que hace avanzar; una sola por pantalla o diálogo, la última a la derecha. Petróleo plano y,
        // con el mouse encima, un tono más oscuro (.cb-pri del criterio).
        default: "bg-[var(--marca)] text-[var(--lado-activo)] hover:bg-[var(--marca-h)]",
        // Secundario: todas las demás acciones.
        outline: "border-[var(--borde2)] bg-[var(--lado-activo)] text-[var(--t1)] hover:bg-[var(--s2)]",
        // Peligro: con borde en la pantalla.
        danger: "border-[var(--peligro-borde)] bg-[var(--lado-activo)] text-[var(--peligro)] hover:bg-[var(--peligro-t)]",
        // Peligro relleno: solo en el diálogo que confirma algo que no se deshace.
        destructive: "border-[var(--peligro)] bg-[var(--peligro)] text-[var(--lado-activo)] hover:brightness-95",
        // Enlace: una acción chica dentro de una fila o de un texto; nunca la principal.
        link: "bg-transparent text-[var(--marca-tx)] underline-offset-[3px] hover:underline",
        // Solo para los botones de ícono.
        icon: "bg-transparent text-[var(--t2)] hover:bg-[var(--s2)] hover:text-[var(--t1)]",
      },
      size: {
        default: "h-9 px-3.5 text-[14px]",
        sm: "h-8 px-3 text-[13px] [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 rounded-[10px] px-[18px] text-[15px]",
        icon: "size-8 p-0",
      },
    },
    compoundVariants: [
      { variant: "link", class: "h-auto border-0 px-0" },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  pending = false,
  pendingLabel,
  disabled,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    /** «Criterio · Botones», Guardando: mientras espera la respuesta de lo que guarda o manda. No se puede tocar. */
    pending?: boolean
    /** Lo que dice mientras tanto: «Guardando…» si no se pasa; «Invitando…», «Enviando…» o el del tablero, si no. */
    pendingLabel?: React.ReactNode
  }) {
  const Comp = asChild ? Slot.Root : "button"
  const working = pending && !asChild

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      data-pending={working || undefined}
      // Guardando va con opacidad de 0,85, no con la de un botón apagado (0,5).
      className={cn(buttonVariants({ variant, size, className }), working && "disabled:opacity-85")}
      disabled={working || disabled}
      {...props}
    >
      {working ? <PendingContent label={pendingLabel}>{children}</PendingContent> : children}
    </Comp>
  )
}

/// El botón mientras guarda: el aro de 14 (de 2 de trazo, en el color del texto: blanco en el principal) y lo que está
/// haciendo. Lo que decía queda debajo, invisible, y le guarda el ancho: si «Guardando…» es más corto, el botón no se
/// achica; si es más largo, crece lo justo.
function PendingContent({ label, children }: { label: React.ReactNode | undefined; children: React.ReactNode }) {
  const { t } = useTranslation()

  return (
    <span className="grid place-items-center">
      <span aria-hidden="true" className="invisible col-start-1 row-start-1 inline-flex items-center gap-1.5">{children}</span>
      <span className="col-start-1 row-start-1 inline-flex items-center gap-1.5">
        <span data-slot="button-ring" aria-hidden="true" className="size-3.5 shrink-0 animate-spin rounded-full border-2 border-current/40 border-t-current motion-reduce:animate-none" />
        {label ?? t("states.saving")}
      </span>
    </span>
  )
}

export { Button, buttonVariants }
