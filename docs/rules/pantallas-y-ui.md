# Pantallas y UI

**Regla:** **toda pantalla nueva se dibuja primero** en el [lienzo vigente](../design/lienzo/README.md), a 1440 y a 390, con las piezas reales de "Gestión de usuarios", y se programa recién cuando el usuario elige. **Mandan los ocho tableros «Criterio»** (Marco y pantallas, Botones, Formularios y campos, Tablas y listas, Diálogos, Menús y desplegables, Avisos y errores, y Decisiones por pantalla) y, para cada pantalla, **solo su tablero validado**: lo marcado «· por refinar» no manda. El tablero manda sobre cualquier descripción textual. Se arma solo con piezas de `shared/ui`. **Con sesión, el teléfono es una app.**

**El usuario ve cada pantalla antes y durante** (pedido del usuario, 2026-10-04):
1. **Antes de programarla:** se le muestra su tablero tal como va a quedar, a 1440 y a 390 y con sus estados (captura o el [recorrido del lienzo](../../scripts/recorrido-lienzo/recorrido.mjs)), y se programa recién con su visto bueno. Si no hay tablero o está «· por refinar», primero se dibuja.
2. **Mientras se programa:** en cada avance se le manda la captura lado a lado, tablero y app, a 1440 y a 390, para que la vea y corrija antes de cerrar la pantalla. No se junta todo para el final. Además, se le abre la [vista en vivo](../../scripts/recorrido-lienzo/vivo.mjs): una ventana con el tablero al lado de la app con datos de prueba, que se actualiza sola con cada cambio del código. Se elige la pantalla por su caso de captura (`node scripts/recorrido-lienzo/vivo.mjs etapa-6/usuarios-lista-escritorio`) o, si todavía no tiene caso, por tablero y ruta (`--tablero Directorio --ruta /empresas [--telefono]`).

## Cómo se hace
- Toda pantalla usa `Page`: una banda blanca de ancho completo (64 px de alto mínimo) con el ícono de la sección o «‹» (`backTo`), el título y, en la segunda línea, el resumen, el estado (punto y palabra) o «Cambios sin guardar»; a la derecha, hasta tres acciones, el resto en ⋮ y la principal al final. El regreso mide 28 × 28 px y el ⋮, 34 × 34. En el teléfono, `Page` arma la pantalla de la app ([responsive](responsive.md)).
- El cuerpo de `Page` conserva 24 px a los costados, 20 px arriba y abajo y 14 px entre cajas en la computadora.
- **Listado:** `FilterBar` en su propia tarjeta y, debajo, `Surface` > `DataTable` + `Pagination`. Nunca todo junto en una sola tarjeta. Las acciones de fila van en el ⋮ (`RowActions`): primero las comunes y, al final, separadas y en rojo, las de peligro; las opciones dependen del estado.
- **Ficha:** a ancho completo. **Una pestaña por cada grupo de datos, aunque tenga una sola fila** (como «Dominio verificado» en la ficha de una organización); también dos vistas del mismo contenido («Configuración» y «Recorrido» del bot). Van debajo de la banda, con la cantidad en gris al lado del nombre, y la acción de la banda cambia con la pestaña. **Las pestañas piden dos grupos o más:** una ficha con un solo grupo va sin la barra, como la de Empresa para su Administrador de empresa, que ve solo «Miembros» (decisión del usuario del 2026-10-05). Lo resuelve `Page` para toda ficha: recibe los grupos en `tabs` y arma la barra solo con dos o más.
- **Edición:** una caja por tema (`Section`); al editar, «Descartar cambios» (vuelve a lo guardado sin salir) y «Guardar cambios»; al crear, «Cancelar» y la acción. Solo «Guardar cambios» se apaga, si no hay cambios.
- Las tablas y listas llevan encabezado arena de 40 px, filas alternadas y el estado como punto de color y palabra, sin pastillas. **Una celda puede llevar una segunda línea gris que aclara la primera** (el correo debajo del nombre). El estado se conserva como texto accesible; el orden se anuncia con `aria-sort`.
- **Lista o tabla:** lo corto que vive dentro de una pantalla (hasta 10 elementos, sin filtros ni paginado) es una `List` en su caja, que se lee: cambiar una fila o sumar otra abre un diálogo chico. Si pueden ser más, es una tabla. Una tabla con encabezado de columnas para dos o tres datos es una lista.
- **Sin textos que explican:** el estado se dice una vez, arriba. Donde está la acción va solo un ⓘ (`InfoButton`); lo que no se puede usar queda apagado y abre lo mismo. El ⓘ abre el aviso importante (`ImportantNotice`), con el motivo y qué hacer.
- Botones: normal de 36 px, chico de 32, de ícono de 32 y grande de 44 (solo ingreso y registro). El principal, con el degradé de la marca en todas las pantallas, también en el teléfono («Criterio · Botones» y «Criterio · Decisiones», v107). Mientras guarda o manda, `Button` con `pending`: el aro de 14, opacidad 0,85 y lo que hace («Guardando…», o el texto del tablero: «Invitando…», «Agregando…», «Enviando…»; las acciones de peligro, «Quitando…», «Desvinculando…» y «Dando de baja…», nunca su propio texto: decisión del usuario del 2026-10-05); no se puede tocar y no se achica. Campos de 36 px (en el teléfono, 48, con radio 12 y letra de 16, como los M-* de la app); en el ingreso y el registro (`FormField variant="auth"`), 44 con radio 10 y letra de 15, también en el teléfono, como M-Ingreso y M-Registro. El texto común de páginas, filas y menús mide 13 px.
- Avisos: un error de campo queda debajo del control; lo que sigue pasando va en un cartel debajo de la banda; lo que salió bien, en un aviso verde que se cierra solo; un fallo directo, en un aviso rojo con ✕ que no se va solo. En el teléfono, lo pasajero va en una franja oscura abajo y lo que sigue, debajo de la barra.
- La confirmación irreversible no tiene ✕ y su acción usa un botón rojo lleno.
- Colores solo con los tokens de [tema.md](../architecture/tema.md), por nombre (`bg-[var(--fondo)]`, `text-[var(--t2)]`). Las variables de shadcn (`--primary`, `--ring`, `--destructive`…) son solo alias de esos tokens en `index.css`. Si falta un color, se agrega un token en `index.css` y en la tabla de tema.md.
- shadcn se genera con `npx shadcn@4.21.0 add` y se edita lo mínimo; las piezas propias van en PascalCase.
- En JSX, ternario en lugar de `&&`. El estado derivado se calcula en el render.
- La Administración es un segundo panel junto al menú lateral (token `--panel`); en el teléfono, un grupo de «Más». No se agregan enlaces del área hasta que su tablero esté aprobado.

## Prohibido
- Inventar piezas visuales, columnas o acciones que no están en el tablero aprobado.
- Superficies a medio ancho, todo en una sola tarjeta o bandas grises con rótulos en mayúsculas.
- Una pestaña «Resumen» con rótulos y valores: los datos van en la banda.
- Párrafos o líneas que explican en la pantalla: van detrás de un ⓘ.
- El mismo estado en dos lugares: arriba y otra vez en la fila.
- La web achicada en el teléfono (la marca arriba, la banda con ícono, cajas con cabecera arena o el ☰ con sesión) o una versión aparte hecha a mano.
- Colores sueltos (`#fff`, `text-gray-500`).
- Programar una pantalla sin tablero.

## Copiá de
- el tablero correspondiente de [`docs/design/lienzo/`](../design/lienzo/README.md) (solo los tableros validados); para la convención de código, `src/areas/business/roles/pages/RolesPage.tsx` y `RoleEditorPage.tsx` (E4), `src/shared/ui/Page.tsx`, `Section.tsx` y `docs/architecture/tema.md`

## Lo verifica
- La revisión del usuario sobre el tablero, antes de programar, y sobre las capturas lado a lado de cada avance.
- Tests de pantalla (tests.md), con su caso «en el teléfono …» (`asPhone()`). `oxlint`.
- `Page.test.tsx` (E7): con un solo grupo, la ficha va sin la barra de pestañas, en la compu y en el teléfono; con dos, la barra abre el contenido y cambia de grupo. `tabs.test.tsx` (E7): la barra del tablero Empresa. `CompanyDetailPage.test.tsx` (E7): el Administrador de empresa ve la ficha de su empresa sin pestañas.
- `button.test.tsx` (E7): el principal con el degradé y el estado «Guardando» (aro, 0,85, no se achica). `AuthCodeStep.test.tsx` y `EmailCodeForm.test.tsx` (E7): «Verificando…» y «Enviando…» mientras esperan. `ChangeLoginMethodDialog.test.tsx` (E7): «Quitando…» y «Desvinculando…», y `AccountDeletionDialog.test.tsx` (E7): «Dando de baja…», con el aro mientras esperan. `FormField.test.tsx` (E7): el campo del ingreso y el registro, de 44 también en el teléfono.
- `theme-tokens.test.ts` (E0): los tokens de tema.md existen en `index.css`, ningún componente usa un color literal, y ninguna ficha ni componente usa una variable de color que no sea de tema.md (salvo los alias de shadcn en `index.css`).
- Las capturas a 1440 y 390 contra el tablero, al cerrar la etapa.

## Detalle
[frontend.md §4, "UI y pantallas"](../architecture/frontend.md#ui-y-pantallas) · [tema.md](../architecture/tema.md) · [responsive](responsive.md) · tableros `Criterio-Marco`, `Criterio-Botones`, `Criterio-Formularios`, `Criterio-Tablas`, `Criterio-Dialogos`, `Criterio-Menus`, `Criterio-Avisos` y `Criterio-Decisiones`.
