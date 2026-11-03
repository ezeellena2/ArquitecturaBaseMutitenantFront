import * as React from "react"
import { cn } from "cn"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-21 w-full resize-none rounded-[0.5rem] border border-[var(--borde2)] bg-[var(--lado-activo)] px-3 py-2 text-[0.8125rem] max-md:min-h-26 max-md:rounded-[0.75rem] max-md:px-3.5 max-md:py-3 max-md:text-[1rem] shadow-none transition-[color,box-shadow] outline-none placeholder:text-[var(--t3)] focus-visible:border-[var(--marca)] focus-visible:ring-[3px] focus-visible:ring-[var(--foco-halo)] disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
