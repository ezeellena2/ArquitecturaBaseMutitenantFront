# Diseño adaptable (computadora, tablet y teléfono)

**Regla:** toda pantalla funciona a **390 px** (teléfono), **768 px** (tablet) y **1440 px** (computadora). **Con sesión, el teléfono es una app** (tableros M-* y «Criterio · Marco y pantallas»), no la web achicada. Las piezas de `shared/ui` arman la app solas según lo que **declara** quien las usa: nadie dibuja una segunda versión a mano. **El acceso B2C y las páginas públicas se piensan primero para el teléfono.** Las reglas visuales del teléfono están en `frontend.md`, «UI y pantallas» › «Teléfono»; esta ficha dice cómo se declaran.

## Cómo se hace

| Pieza | ≥ 1024 (computadora) | 768–1023 (tablet) | < 768 (teléfono) |
|---|---|---|---|
| Menú lateral y barra de arriba | menú fijo y colapsable; migas y tu menú | menú colapsado a íconos | no hay: arriba va la barra de la app con el título (`AppBar`) y abajo, la barra con «Inicio» y «Más» (`BottomNav`); «Más» (`/mas`) reúne perfiles, Administración, Mi cuenta y Salir |
| `Page` | ícono, título, segunda línea y hasta 3 botones | igual | título en la barra, con «‹» si es interna y el camino o el estado debajo (`phoneSubtitle`); el ⋮ en la barra; crear es un «+» flotante (`fab`); guardar va fijo abajo; el cuerpo, con margen, de borde a borde o gris (`phoneBody`) |
| `FilterBar` | buscador y filtros en su tarjeta | igual | la lupa y el filtro son íconos de la barra; el filtro abre una hoja con las opciones y su conteo |
| `DataTable` | todas las columnas | sin las `priority: "low"` | la fila de lista de la pantalla (`mobileRow`, con `ListRow`): de borde a borde, hasta tres líneas, el ⋮ solo si hay acciones; el paginado es «Cargar más» |
| `Section` | caja con el título en el encabezado arena | igual | el título gris arriba y una tarjeta blanca (`card`), la tarjeta dentro de una página con margen (`inset`) o los campos sueltos (`untitled`) |
| `Dialog` | centrado, 560 px (420 para confirmar; 640 la vista previa de la Página pública) | centrado | hoja desde abajo, con manija y botones de 48 a lo ancho; la confirmación, sin ✕ |
| Pantalla de edición | al editar, «Descartar cambios» y «Guardar cambios» en la banda; al crear, «Cancelar» y la acción | igual | los mismos botones, fijos abajo (`FixedActions`) |
| Avisos | abajo a la derecha; los carteles debajo de la banda | igual | lo pasajero, en una franja oscura abajo; lo que sigue, en una banda debajo de la barra |
| Pantallas públicas | dos mitades (formulario + panel de la marca) | igual | una columna, sin el panel; el sitio público, web con ☰ (la página de una organización, sin ☰) |

- **Cada listado declara su fila del teléfono** con `mobileRow`, y cada columna, si se ve cuando no hay fila propia:
  ```tsx
  <DataTable columns={columns} rows={rows} rowKey={(row) => row.id}
    mobileRow={(user) => userPhoneRow(user, t, <RowActions … />)} />

  { id: "name", mobile: "primary" },          // el dato principal: siempre visible
  { id: "status", mobile: "status" },         // el estado, a la derecha
  { id: "email", priority: "low" },           // se oculta en la tablet
  ```
  Cada tabla tiene **una** columna `primary`. En la fila del teléfono, el ⋮ va solo si la fila tiene acciones; si no, se toca la fila.
- **Lo que aclara un dato va en su segunda línea**, en la computadora y en el teléfono: el correo debajo del nombre, el rol debajo de la empresa. Dos datos sin relación nunca van juntos.
- **Tamaños:** en la computadora, botón normal de 36 px, chico de 32 y campo de 36; en el teléfono, campos de 48 con letra de 16 y botones de 44 a 50. Ingreso y registro usan botones grandes de 44. El tablero manda si este resumen difiere.
- **Cortes:** los de Tailwind (`md` = 768 y `lg` = 1024), sin cortes propios. `useMediaQuery("(max-width: 767px)")` solo en el marco (`PrivateLayoutFrame`, que cuenta en `AppChrome` si es un teléfono) y en las pantallas fuera del marco; las demás piezas leen `useAppChrome()` o usan clases `max-md:`.
- **Tableros:** cada pantalla nueva se dibuja en el lienzo **a 1440 y a 390** antes de programarse.

## Prohibido
- La web achicada en el teléfono: la marca arriba, la banda con ícono y resumen, cajas con cabecera arena o el ☰ (con sesión).
- Una versión aparte de la pantalla para el teléfono, hecha a mano.
- Anchos fijos en px en un contenedor de página.
- Scroll de costado: solo pueden desplazarse unas pestañas, dentro de su caja.
- Esconder una acción en el teléfono sin que quede en el ⋮, en la barra o abajo.
- Un `DataTable` sin una columna `mobile: "primary"`.

## Copiá de
- `src/areas/business/users/pages/UsersPage.tsx` y `users/columns.tsx` (`userPhoneRow`) · `src/shared/ui/Page.tsx` · los tableros M-* del [lienzo vigente](../design/lienzo/README.md).

## Lo verifica
- `src/shared/ui/app/lists.test.tsx` (E5): la tabla es una lista de filas en el teléfono, los filtros son íconos con su hoja y el paginado es «Cargar más».
- `src/shared/ui/app/app.test.tsx` (E5): la barra, la barra de abajo, el «+», los botones fijos y los grupos.
- `columns-mobile.test.ts` (E1): toda definición de columnas tiene exactamente una `primary`.
- Los tests «en el teléfono …» de cada pantalla (con `asPhone()`), el recorrido del teléfono del E2E real y las capturas a 390 y 1440 contra el tablero antes de cerrar la etapa.

## Detalle
[frontend.md §4, «UI y pantallas» › «Teléfono»](../architecture/frontend.md#ui-y-pantallas)
