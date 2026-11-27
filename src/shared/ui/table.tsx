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
        // `group/fila`: una columna fija (`pinned`) repite el fondo de su fila con los mismos estados, así no se ve a través.
        "group/fila border-b transition-colors even:bg-[var(--fila-alterna)] hover:bg-[var(--fila-hover)] has-aria-expanded:bg-[var(--fila-hover)] data-[state=selected]:bg-[var(--marca-t)]",
        className
      )}
      {...props}
    />
  )
}

/// «Criterio · Tablas» (137): una columna fija al desplazar a lo ancho. Queda pegada a su lado, corrida lo que ocupan las
/// fijas que tiene antes de ese lado (`offset`, por ejemplo «3rem» o «0rem»), por encima de las que pasan debajo y con el fondo
/// de su fila sobre la superficie de la caja. La línea entre columnas la pone la tabla que la usa (`EditableTable`, E12).
type TablePinned = { side: "left" | "right"; offset: string }

/// El fondo de una fija: la superficie de la caja y, encima, el de su fila (`TableRow`, colores opacos del tema), en el mismo orden.
const pinnedCellBackground = "sticky z-2 bg-[var(--superficie)] group-even/fila:bg-[var(--fila-alterna)] group-hover/fila:bg-[var(--fila-hover)] group-has-aria-expanded/fila:bg-[var(--fila-hover)] group-data-[state=selected]/fila:bg-[var(--marca-t)]"

function pinnedStyle(pinned: TablePinned | undefined, style: React.CSSProperties | undefined): React.CSSProperties | undefined {
  return pinned ? { ...style, [pinned.side]: pinned.offset } : style
}

function TableHead({ className, pinned, style, ...props }: React.ComponentProps<"th"> & { pinned?: TablePinned }) {
  return (
    <th
      data-slot="table-head"
      data-pinned={pinned?.side}
      style={pinnedStyle(pinned, style)}
      className={cn(
        "min-h-10 bg-[var(--cab)] px-2 py-1 text-left align-middle font-semibold whitespace-normal text-[0.8125rem] text-[var(--t2)] [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        pinned && "sticky z-3",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, pinned, style, ...props }: React.ComponentProps<"td"> & { pinned?: TablePinned }) {
  return (
    <td
      data-slot="table-cell"
      data-pinned={pinned?.side}
      style={pinnedStyle(pinned, style)}
      className={cn(
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        pinned && pinnedCellBackground,
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
export type { TablePinned }
