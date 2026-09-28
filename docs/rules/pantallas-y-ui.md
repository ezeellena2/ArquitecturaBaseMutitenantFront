# Pantallas y UI

**Regla:** **toda pantalla nueva se dibuja primero** en el [lienzo versionado](../design/lienzo/README.md), con las piezas reales de "Gestión de usuarios", y se programa recién cuando el usuario elige. El tablero manda sobre cualquier descripción textual. Se arma solo con piezas de `shared/ui`.

## Cómo se hace
- Toda pantalla usa `Page`: una banda blanca de ancho completo (64 px de alto mínimo, como `.banda-pag` del lienzo) con el ícono de la sección o «‹» (`backTo`), el título, la línea de resumen y, a la derecha, las acciones. Las pestañas, si corresponden, van debajo de la banda.
- **Listado:** `FilterBar` en su propia tarjeta y, debajo, `Surface` > `DataTable` + `Pagination`. Nunca todo junto en una sola tarjeta. Las acciones de fila van siempre en el menú ⋮ (`RowActions`): primero las comunes y, al final y en rojo, las destructivas; las opciones dependen del estado.
- **Ficha:** a ancho completo. Pestañas **solo** con dos o más tablas grandes, debajo de la banda y con su conteo; la acción de la pestaña aparece en la banda solo con esa pestaña.
- Colores solo con los tokens de [tema.md](../architecture/tema.md), por nombre (`bg-[var(--fondo)]`, `text-[var(--t2)]`). Las variables de shadcn (`--primary`, `--ring`, `--destructive`…) son solo alias de esos tokens en `index.css`. Si falta un color, se agrega un token en `index.css` y en la tabla de tema.md.
- shadcn se genera con `npx shadcn@4.21.0 add` y se edita lo mínimo; las piezas propias van en PascalCase.
- En JSX, ternario en lugar de `&&`. El estado derivado se calcula en el render.

## Prohibido
- Inventar piezas visuales, columnas o acciones que no están en el tablero aprobado.
- Superficies a medio ancho, varias tarjetas sueltas o bandas grises con rótulos en mayúsculas.
- Pestañas para un solo dato.
- Colores sueltos (`#fff`, `text-gray-500`).
- Programar una pantalla sin tablero.

## Copiá de
- el tablero correspondiente de [`docs/design/lienzo/`](../design/lienzo/README.md) (v35); para la convención de código, `src/areas/business/roles/pages/RolesPage.tsx` (E4) y `docs/architecture/tema.md`

## Lo verifica
- La revisión del usuario sobre el tablero, antes de programar.
- Tests de pantalla (tests.md). `oxlint`.
- `theme-tokens.test.ts` (E0): los tokens de tema.md existen en `index.css`, ningún componente usa un color literal, y ninguna ficha ni componente usa una variable de color que no sea de tema.md (salvo los alias de shadcn en `index.css`).

## Detalle
[frontend.md §4, "UI y pantallas"](../architecture/frontend.md#ui-y-pantallas) · [tema.md](../architecture/tema.md)
