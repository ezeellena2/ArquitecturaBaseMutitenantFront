# Tests

**Regla:** cada pantalla, hook y formateador tiene su test al lado (`X.test.tsx`). Nada se da por terminado sin `npm run build`, `npm run lint` y `npm test` limpios.

## Cómo se hace
- `renderRouteWithProviders(path, { as: "business-admin" })` y, para el sitio público, `{ host: "empresa-a.localtest.me" }`. Los usuarios de prueba están en `test/mocks/currentUsers.ts`: persona sin organizaciones, persona con organizaciones, empresa admin, empresa sin permisos y operador.
- MSW con `onUnhandledRequest: "error"`: toda llamada tiene su handler.
- **Por pantalla, obligatorio:**
  - carga, vacío, sin coincidencias, error con reintento y sin permiso;
  - el recorrido de sus diálogos;
  - cada `code` de error que traduce la feature;
  - el formato de sus datos en **es-AR y en-US**;
  - **axe sin violaciones** ([accesibilidad](accesibilidad.md));
  - la vista a **390 px** si tiene tabla o formulario ([responsive](responsive.md));
  - en una edición, el **409 de concurrencia**; en un alta, que el reintento manda la **misma** `Idempotency-Key`.
- Las consultas van por rol y por texto accesible (`getByRole("button", { name: … })`). Los desplegables de Radix se abren con teclado.

## Prohibido
- `getByTestId` si existe un rol accesible.
- Snapshots de pantallas enteras.
- Timers reales: se usan los falsos de Vitest.
- Tests que dependen del orden.

## Copiá de
- `src/areas/business/roles/pages/RolesPage.test.tsx` (E4)

## Lo verifica
- El CI (`npm test`) y `harness.test.ts` (E0), que usa `HarnessStage` para exigir solo los tests de etapas cerradas.

## Detalle
[frontend.md §4, "Tests"](../architecture/frontend.md#tests)
