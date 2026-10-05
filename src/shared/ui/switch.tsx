import * as React from "react"
import { cn } from "cn"
import { Switch as SwitchPrimitive } from "radix-ui"

function Switch({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        // Tablero Pagina-Org (.w-sw): en la compu, 36 por 20 con la perilla de 16 a 2 del borde; apagado, gris claro
        // (--borde2), como en el teléfono (M-Pagina-Org, 50 por 30).
        "peer group/switch inline-flex shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 data-[size=default]:h-5 data-[size=default]:w-9 data-[size=default]:px-px data-[size=sm]:h-3.5 data-[size=sm]:w-6 max-md:data-[size=default]:h-[30px] max-md:data-[size=default]:w-[50px] max-md:data-[size=default]:px-0.5 data-[state=checked]:bg-primary data-[state=unchecked]:bg-[var(--borde2)]",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block rounded-full bg-background shadow-sm ring-0 transition-transform group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3 max-md:group-data-[size=default]/switch:size-6 data-[state=checked]:translate-x-4 max-md:group-data-[size=default]/switch:data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0 dark:data-[state=checked]:bg-primary-foreground dark:data-[state=unchecked]:bg-foreground"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
