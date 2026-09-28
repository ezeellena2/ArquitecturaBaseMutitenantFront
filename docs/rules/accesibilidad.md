# Accesibilidad

**Regla:** toda pantalla cumple WCAG 2.2 AA. Cada test de pantalla corre **axe** y falla con cualquier violación. Lo que axe no ve (teclado, foco, contraste real) lo cubren las piezas de `shared/ui` y la revisión antes de cerrar cada etapa.

## Cómo se hace
- **En cada test de pantalla**, al final del caso de carga:
  ```ts
  import { axe } from "vitest-axe";
  expect(await axe(container)).toHaveNoViolations();
  ```
  (`vitest-axe/extend-expect` ya está en `test/setup.ts`).
- **Piezas de `shared/ui` que ya lo resuelven:**
  - `FormField` (rótulo, `aria-describedby`, `aria-invalid`);
  - `IconButton` y `RowActions` (nombre obligatorio: `aria-label` con el dato de la fila, "Acciones de Tomás Acosta");
  - `Dialog` (foco atrapado y devuelto con `useRestoreFocusOnClose`);
  - `DataTable` (encabezados, `aria-sort`, `aria-busy`);
  - `DateText` (`<time>`);
  - `EmptyValue` ("Sin dato");
  - `CountrySelect` ("País: Argentina, +54").
- **Teclado:** todo lo que se hace con el mouse se hace con Tab, Enter, Espacio, Escape y las flechas. Los tests abren los desplegables con el teclado.
- **Foco visible:** el anillo de foco usa el token `--foco` (que apunta a `--marca`) con el halo `--foco-halo` de 3 px ([tema.md](../architecture/tema.md)); `--ring` de shadcn es solo su alias en `index.css` (utilidades `ring-ring` y `outline-ring`). No se quita nunca.
- **Contraste:** los tokens de `index.css` están definidos con contraste AA (4,5:1 para texto y 3:1 para bordes de controles e íconos). Un color nuevo se agrega como token y se mide.
- **Movimiento:** las animaciones respetan `prefers-reduced-motion`.
- **Idioma:** `<html lang>` sigue a la cultura (lo hace `shared/i18n`).

## Prohibido
- `onClick` en un `div` o un `span` (Tab no los alcanza).
- Un botón de solo ícono sin nombre.
- `outline: none` sin reemplazo.
- Transmitir información solo con color: un estado lleva texto además del punto.
- Deshabilitar axe en un test.

## Copiá de
- `src/areas/business/roles/pages/RolesPage.test.tsx` (E4).

## Lo verifica
- `vitest-axe` en cada test de pantalla (`toHaveNoViolations`).
- Antes de cerrar una etapa: una pasada de axe en el navegador real, a 1440 y a 390, que cubre el contraste y no se puede hacer en jsdom.

## Detalle
[frontend.md §4, "Accesibilidad y diseño adaptable"](../architecture/frontend.md)
