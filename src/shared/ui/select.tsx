import * as React from "react"
import { cn } from "cn"
import { CheckIcon, ChevronDownIcon as ScrollDownIcon, ChevronUpIcon } from "lucide-react"
import { ChevronDownIcon } from "./icons"
import { Select as SelectPrimitive } from "radix-ui"

/// Lo que FormField le pasa a su control (rótulo, obligatorio, error): el Select de Radix no es un elemento, así que lo
/// recibe la raíz y lo lleva su botón, que es lo que lee el lector de pantalla.
type SelectFieldProps = Pick<React.ComponentProps<"button">, "id" | "aria-invalid" | "aria-describedby" | "aria-required">

const SelectFieldContext = React.createContext<SelectFieldProps>({})

function Select({
  id,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  "aria-required": ariaRequired,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root> & SelectFieldProps) {
  const field = React.useMemo<SelectFieldProps>(
    () => ({ id, "aria-invalid": ariaInvalid, "aria-describedby": ariaDescribedBy, "aria-required": ariaRequired }),
    [id, ariaInvalid, ariaDescribedBy, ariaRequired]
  )
  return (
    <SelectFieldContext.Provider value={field}>
      <SelectPrimitive.Root data-slot="select" {...props} />
    </SelectFieldContext.Provider>
  )
}

function SelectGroup({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />
}

function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: "sm" | "default"
}) {
  const heightClass = size === "sm" ? "h-8" : "h-9";
  const field = React.useContext(SelectFieldContext)

  return (
    <SelectPrimitive.Trigger
      {...field}
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "flex w-fit items-center justify-between gap-2 rounded-[8px] border border-[var(--borde2)] bg-[var(--lado-activo)] px-3 py-2 text-[13px] whitespace-nowrap shadow-none transition-[color,box-shadow] outline-none focus-visible:border-[var(--marca)] focus-visible:ring-[3px] focus-visible:ring-[var(--foco-halo)] aria-expanded:border-[var(--marca)] aria-expanded:ring-[3px] aria-expanded:ring-[var(--foco-halo)] max-md:h-12 max-md:rounded-[12px] max-md:px-3.5 max-md:text-[16px] disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-[placeholder]:text-[var(--t3)] *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
        heightClass,
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        {/* En el teléfono (tableros M-Configuracion, M-Cuenta y M-Usuario-Empresa, .in2 svg), la flechita de 18 y casi negra. */}
        <ChevronDownIcon strokeWidth={2} className="size-3.5 text-muted-foreground opacity-50 max-md:size-[18px] max-md:text-[var(--t1)] max-md:opacity-100" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

// «Criterio · Formularios», Desplegable (decisión del usuario del 2026-10-05): se abre debajo del campo y del mismo ancho,
// como los filtros y el ⋮ de una fila (Radix lo pone arriba si abajo no entra). Con 10 de radio, el borde de siempre y la
// sombra larga de los menús y las listas que se abren (.menu, .o-lst).
function SelectContent({
  className,
  children,
  position = "popper",
  align = "start",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        className={cn(
          "relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-[10px] border border-[var(--borde)] bg-[var(--lado-activo)] text-[var(--t1)] shadow-[var(--sombra-menu)] data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          position === "popper" &&
            "w-(--radix-select-trigger-width) min-w-0 data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className
        )}
        position={position}
        align={align}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            "p-1",
            position === "popper" &&
              "h-[var(--radix-select-trigger-height)] w-full min-w-0 scroll-my-1"
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn("px-2 py-1.5 text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

function SelectItem({
  className,
  children,
  description,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item> & { description?: string }) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex min-h-9 w-full cursor-default items-center gap-2 rounded-[8px] py-1 pr-8 pl-2 text-[13px] outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[15px] [&_svg:not([class*='text-'])]:text-muted-foreground *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className
      )}
      {...props}
    >
      <span
        data-slot="select-item-indicator"
        className="absolute right-2 flex size-3.5 items-center justify-center"
      >
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      {description ? <div className="flex flex-col">
        <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
        <span className="text-[12px] leading-[1.25] text-[var(--t2)]">{description}</span>
      </div> : <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>}
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("pointer-events-none -mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className
      )}
      {...props}
    >
      <ChevronUpIcon className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className
      )}
      {...props}
    >
      <ScrollDownIcon className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
