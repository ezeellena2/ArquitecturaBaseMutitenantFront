# Tests

**Regla:** cada pantalla, hook y formateador tiene su test al lado (`X.test.tsx`). Nada se da por terminado sin `npm run build`, `npm run lint` y `npm test` limpios.

## Cómo se hace
- `renderRouteWithProviders(path, { profile: "business-admin" })`. Los perfiles de prueba están en `test/mocks/currentUsers.ts`: personal, business admin, business sin permisos y operador.
- MSW con `onUnhandledRequest: "error"`: toda llamada tiene su handler.
- **Por pantalla, obligatorio:**
  - carga, vacío, sin coincidencias, error con reintento y sin permiso;
  - el recorrido de sus diálogos;
  - cada `code` de error que traduce la feature;
  - el formato de sus datos en **es-AR y en-US**.
- Las consultas van por rol y por texto accesible (`getByRole("button", { name: … })`). Los desplegables de Radix se abren con teclado.

## Prohibido
- `getByTestId` si existe un rol accesible.
- Snapshots de pantallas enteras.
- Timers reales: se usan los falsos de Vitest.
- Tests que dependen del orden.

## Copiá de
- `src/areas/business/roles/pages/RolesPage.test.tsx` (E4)

## Lo verifica
- El CI (`npm test`) y `harness.test.ts`.

## Detalle
[frontend.md §4, "Tests"](../architecture/frontend.md#tests)
