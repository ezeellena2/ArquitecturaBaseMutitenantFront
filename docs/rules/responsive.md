# Diseño adaptable (computadora, tablet y teléfono)

**Regla:** toda pantalla funciona a **390 px** (teléfono), **768 px** (tablet) y **1440 px** (computadora). Las piezas de `shared/ui` se adaptan solas según lo que **declara** quien las usa: nadie dibuja una segunda versión a mano. **El perfil personal (B2C) se piensa primero para el teléfono.**

## Cómo se hace

| Pieza | ≥ 1024 (computadora) | 768–1023 (tablet) | < 768 (teléfono) |
|---|---|---|---|
| Menú lateral | fijo, colapsable | colapsado a íconos | cajón con ☰ |
| `DataTable` | tabla | tabla, sin las columnas `priority: "low"` | **lista de tarjetas** armada con `mobile` |
| `FilterBar` | barra | barra | botón "Filtros (2)", que abre un panel desde abajo (`Sheet`) |
| `Dialog` | centrado, 640 px | centrado | pantalla completa |
| Formulario | dos columnas | dos columnas | una columna |
| Acciones de `Page` | botones | botones | la principal visible y el resto en ⋮ |
| Pestañas | en la cabecera | en la cabecera | con desplazamiento horizontal |

- **Cada columna declara su papel en el teléfono:**
  ```tsx
  { id: "name", mobile: "title" },         // arriba, en negrita
  { id: "email", mobile: "subtitle" },     // debajo, en gris
  { id: "status", mobile: "badge" },       // a la derecha
  { id: "createdAtUtc", mobile: "meta" },  // abajo, chico
  { id: "roles", mobile: "hidden", priority: "low" }
  ```
  Las acciones de la fila van en el ⋮ de la tarjeta.
- **Tamaño tocable:** 44 × 44 px mínimo en el teléfono (ya lo trae `shared/ui`).
- **Cortes:** los de Tailwind (`md` = 768 y `lg` = 1024), sin cortes propios. `useMediaQuery` solo para cambiar de pieza (tabla o tarjetas), nunca para estilos.
- **Tableros:** cada pantalla nueva se dibuja en el lienzo **a 1440 y a 390** antes de programarse.

## Prohibido
- Anchos fijos en px en un contenedor de página.
- Scroll horizontal de la página: solo una tabla o unas pestañas pueden desplazarse dentro de su caja.
- Esconder una acción en el teléfono sin que quede en el ⋮.
- Un `DataTable` sin `mobile` declarado en sus columnas (el test lo marca).

## Copiá de
- `src/areas/business/users/columns.tsx` (E6) · los tableros de teléfono del lienzo (pendientes, antes de E4).

## Lo verifica
- `DataTable.test.tsx`: a 390 px renderiza tarjetas con title, subtitle y badge.
- `columns-mobile.test.ts`: toda definición de columnas declara `mobile` en al menos una columna `title`.
- Capturas a 390 y 1440 comparadas contra el tablero antes de cerrar la etapa.

## Detalle
[frontend.md §4, "Accesibilidad y diseño adaptable"](../architecture/frontend.md)
