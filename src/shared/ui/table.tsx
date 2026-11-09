import * as React from "react"
import { cn } from "cn"

/// `refreshing` («Criterio · Tablas», Cuando vuelve a leer): la tabla avisa que trabaja (`aria-busy`). Su encabezado corre
/// la línea y su cuerpo queda atenuado y fuera de alcance, cada uno con su `refreshing`.
function Table({ className, refreshing, ...props }: React.ComponentProps<"table"> & { refreshing?: boolean }) {
  return (
    <div
      data-slot="table-container"
      // «Criterio · Tablas» (137): la tabla cierra abajo con la línea de su última fila, salvo que toque el borde de su caja.
      className="relative w-full overflow-x-auto last:[&_tbody>tr:last-child]:border-b-0"
    >
      <table
        data-slot="table"
        aria-busy={refreshing || undefined}
        className={cn("w-full caption-bottom text-[0.8125rem]", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, refreshing, ...props }: React.ComponentProps<"thead"> & { refreshing?: boolean }) {
  return (
    <thead
      data-slot="table-header"
      data-refreshing={refreshing || undefined}
      className={cn("[&_tr]:border-b", refreshing && "tabla-relee", className)}
      {...props}
    />
  )
}

/// Mientras vuelve a leer, lo que estaba se ve atenuado y no se puede tocar ni enfocar (`inert`).
function TableBody({ className, refreshing, ...props }: React.ComponentProps<"tbody"> & { refreshing?: boolean }) {
  return (
    <tbody
      data-slot="table-body"
      inert={refreshing || undefined}
      className={cn(refreshing && "opacity-50", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t bg-[var(--s2)] font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b transition-colors even:bg-[var(--fila-alterna)] hover:bg-[var(--fila-hover)] has-aria-expanded:bg-[var(--fila-hover)] data-[state=selected]:bg-[var(--marca-t)]",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "min-h-10 bg-[var(--cab)] px-2 py-1 text-left align-middle font-semibold whitespace-normal text-[0.8125rem] text-[var(--t2)] [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-[0.8125rem] text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
