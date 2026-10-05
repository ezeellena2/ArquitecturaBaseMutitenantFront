import * as React from "react"
import { cn } from "cn"
import { Tabs as TabsPrimitive } from "radix-ui"

// Tablero «Criterio · Marco», Pestañas: una por cada grupo de datos de una ficha, o dos vistas del mismo contenido; con
// un solo grupo, no hay barra. `Page` las arma con los grupos de `tabs`, para toda ficha.
// En la compu abren el contenido de la página, debajo de la banda (tablero Empresa);
// en el teléfono, en su banda blanca. Alineadas a la izquierda con 28 de separación y 44 de alto; la elegida, en
// petróleo y subrayada; la cantidad, en gris al lado.

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

// En el teléfono las pestañas se reparten el ancho, como M-Empresa (.ap-tabs): 48 más el subrayado de 2,5.
function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn("inline-flex h-11 w-full items-center justify-start gap-7 bg-transparent p-0 text-[14px] max-md:grid max-md:h-[50.5px] max-md:auto-cols-fr max-md:grid-flow-col max-md:gap-0", className)}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        // Tablero M-Empresa (.ap-tabs span): en el teléfono, de 15 y en semibold también la que no está elegida, con el texto
        // centrado en los 48 de arriba del subrayado de 2,5.
        "inline-flex h-11 items-center gap-1.5 px-0 text-[14px] font-medium max-md:h-[50.5px] max-md:justify-center max-md:pb-[2.5px] max-md:text-[15px] max-md:font-semibold whitespace-nowrap text-[var(--t2)] outline-none transition-colors hover:text-[var(--t1)] focus-visible:ring-[3px] focus-visible:ring-[var(--foco-halo)] disabled:pointer-events-none disabled:opacity-50",
        "data-[state=active]:font-semibold data-[state=active]:text-[var(--marca-tx)] data-[state=active]:shadow-[inset_0_-2px_0_var(--marca)] max-md:data-[state=active]:shadow-[inset_0_-2.5px_0_var(--marca)]",
        className
      )}
      {...props}
    />
  )
}

/** La cantidad de una pestaña: en gris, al lado del nombre, sin etiqueta. */
function TabCount({ children }: { children: React.ReactNode }) {
  // El espacio separa el número del nombre para el lector de pantalla («Miembros 6»); en pantalla lo separa el gap.
  return <>{" "}<span data-slot="tab-count" className="font-normal text-[var(--t3)] max-md:font-medium">{children}</span></>
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabCount, TabsContent }
