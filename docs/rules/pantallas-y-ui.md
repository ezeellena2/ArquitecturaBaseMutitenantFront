# Pantallas y UI

**Regla:** **toda pantalla nueva se dibuja primero** en el lienzo del sistema visual, con las piezas reales de "Gestión de usuarios", y se programa recién cuando el usuario elige. Se arma solo con piezas de `shared/ui`.

## Cómo se hace
- Toda pantalla usa `Page`: una banda de 56 px con título, acciones, `backTo` y pestañas si corresponde.
- **Listado:** `Surface` > `FilterBar` + `DataTable` + `Pagination`. Las acciones de fila van en `RowActions`, con tooltip; son íconos, y un menú ⋮ si son muchas.
- **Ficha:** a ancho completo. Pestañas **solo** con dos o más tablas grandes, dentro de la cabecera; el botón principal cambia según la pestaña.
- Colores solo con tokens (`bg-[var(--color-surface)]`). Si falta un color, se agrega un token en `index.css`.
- shadcn se genera con `npx shadcn@4.21.0 add` y se edita lo mínimo; las piezas propias van en PascalCase.
- En JSX, ternario en lugar de `&&`. El estado derivado se calcula en el render.

## Prohibido
- Inventar piezas visuales, columnas o acciones que no están en el tablero aprobado.
- Superficies a medio ancho, varias tarjetas sueltas o bandas grises con rótulos en mayúsculas.
- Pestañas para un solo dato.
- Colores sueltos (`#fff`, `text-gray-500`).
- Programar una pantalla sin tablero.

## Copiá de
- `src/areas/business/roles/pages/RolesPage.tsx` (E4) · `docs/design/visual-baseline.md` · el tablero "Gestión de usuarios" del lienzo

## Lo verifica
- La revisión del usuario sobre el tablero, antes de programar.
- Tests de pantalla (tests.md). `oxlint`.

## Detalle
[frontend.md §4, "UI y pantallas"](../architecture/frontend.md#ui-y-pantallas)
