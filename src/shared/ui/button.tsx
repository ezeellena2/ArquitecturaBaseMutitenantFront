import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-[8px] text-[13px] font-semibold whitespace-nowrap transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-[var(--foco-halo)] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 lg:text-[14px]",
  {
    variants: {
      variant: {
        default: "bg-[var(--marca)] text-[var(--lado-activo)] hover:bg-[var(--marca-h)]",
        destructive:
          "bg-[var(--peligro)] text-[var(--lado-activo)] hover:bg-[var(--peligro)]/90 focus-visible:ring-destructive/20",
        outline:
          "border border-[var(--borde2)] bg-[var(--lado-activo)] text-[var(--t1)] hover:bg-[var(--s2)]",
        outlineSurface:
          "border bg-[var(--lado-activo)] shadow-xs hover:bg-[var(--s2)] hover:text-[var(--t1)]",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-[34px] rounded-[8px] px-[14px] py-0 gap-1.5 lg:h-9 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1.5 rounded-[7px] px-2.5 text-[12.5px] has-[>svg]:px-2 [&_svg:not([class*='size-'])]:size-3 lg:h-8 lg:rounded-[8px] lg:px-3 lg:text-[13px] lg:has-[>svg]:px-2.5",
        lg: "h-11 rounded-[10px] px-[18px] text-[15px] has-[>svg]:px-4",
        icon: "size-8 rounded-[8px] p-0",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-[8px] p-0",
        "icon-lg": "size-10",
      },
    },
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
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
