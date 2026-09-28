# Diseño adaptable (computadora, tablet y teléfono)

**Regla:** toda pantalla funciona a **390 px** (teléfono), **768 px** (tablet) y **1440 px** (computadora). Las piezas de `shared/ui` se adaptan solas según lo que **declara** quien las usa: nadie dibuja una segunda versión a mano. **El acceso B2C y las páginas públicas se piensan primero para el teléfono.** Las reglas visuales del teléfono son las de `frontend.md`, "UI y pantallas" › "Teléfono"; esta ficha dice cómo se declaran.

## Cómo se hace

| Pieza | ≥ 1024 (computadora) | 768–1023 (tablet) | < 768 (teléfono) |
|---|---|---|---|
| Menú lateral | fijo, colapsable | colapsado a íconos | se abre con ☰ por encima del contenido, con un velo |
| Barra superior | migas + menú de la cuenta | igual | ☰, la marca en el medio y el avatar, que abre el menú de la cuenta en una hoja desde abajo |
| `Page` | título, resumen y hasta 3 botones | igual | el resumen en una línea (con «…»), la acción principal con rótulo corto («+ Invitar») y el resto en ⋮ |
| `FilterBar` | buscador + pastillas en una fila | igual | buscador a lo ancho y las pastillas debajo |
| `DataTable` | todas las columnas | sin las `priority: "low"` | **solo las columnas `mobile`**: el dato principal, el estado y el ⋮. El resto se ve al entrar a la fila. **Nunca dos datos apilados en una celda** |
| `Dialog` | centrado, 560 px (420 para confirmar) | centrado | hoja desde abajo; si es un formulario, casi toda la altura, con los campos en una columna y los botones a lo ancho abajo |
| Pantalla de edición | «Cancelar» y «Guardar cambios» en la banda | igual | en una barra fija abajo |
| Pantallas públicas | dos mitades (formulario + panel de la marca) | igual | una columna, sin el panel |

- **Cada columna declara si se ve en el teléfono:**
  ```tsx
  { id: "name", mobile: "primary" },          // el dato principal: siempre visible
  { id: "status", mobile: "status" },         // el estado, a la derecha
  { id: "email", priority: "low" },           // se oculta en la tablet y en el teléfono
  { id: "createdAtUtc" }                      // sin `mobile`: se oculta en el teléfono
  ```
  El ⋮ de acciones está siempre. Cada tabla tiene **una** columna `primary`.
- **Tamaño tocable:** 44 × 44 px mínimo en el teléfono (ya lo trae `shared/ui`).
- **Cortes:** los de Tailwind (`md` = 768 y `lg` = 1024), sin cortes propios. `useMediaQuery` solo para cambiar de pieza (diálogo u hoja), nunca para estilos.
- **Tableros:** cada pantalla nueva se dibuja en el lienzo **a 1440 y a 390** antes de programarse.

## Prohibido
- Anchos fijos en px en un contenedor de página.
- Scroll horizontal de la página: solo pueden desplazarse unas pestañas, dentro de su caja.
- Apilar dos datos en una celda para que "entren" en el teléfono.
- Esconder una acción en el teléfono sin que quede en el ⋮.
- Un `DataTable` sin una columna `mobile: "primary"`.

## Copiá de
- `src/areas/business/users/columns.tsx` (E6) · los tableros de 390 px del [lienzo versionado](../design/lienzo/README.md).

## Lo verifica
- `DataTable.test.tsx` (E1): a 390 px renderiza solo las columnas `primary` y `status`, y el ⋮.
- `columns-mobile.test.ts` (E1): toda definición de columnas tiene exactamente una `primary`.
- Capturas a 390 y 1440 comparadas contra el tablero antes de cerrar la etapa.

## Detalle
[frontend.md §4, "UI y pantallas" › "Teléfono"](../architecture/frontend.md#ui-y-pantallas)
