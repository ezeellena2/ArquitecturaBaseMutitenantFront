# Tests

**Regla:** las pantallas con interacción, hooks y formateadores con lógica tienen tests junto al código (`X.test.tsx`); un DTO, texto o delegado simple no necesita un test que refleje su implementación. Por cada cambio coherente con lógica, escribir primero un test focal que falle, hacerlo pasar y verificar el build y lint del alcance afectado antes del commit. Al cerrar una etapa y en CI, ejecutar `npm run build`, `npm run lint`, `npm test` y `npm run contracts:check` completos y limpios.

## Cómo se hace
- `renderRouteWithProviders(path, { as: "business-admin" })` y, para el sitio público, `{ host: "empresa-a.localtest.me" }`. Los usuarios de prueba están en `test/mocks/currentUsers.ts`: persona sin organizaciones, persona con organizaciones, empresa admin, empresa sin permisos y operador.
- MSW con `onUnhandledRequest: "error"`: toda llamada tiene su handler.
- **Por pantalla, probar solo los estados y recorridos que realmente le aplican:**
  - carga, vacío, sin coincidencias, error con reintento y sin permiso, cuando cada estado existe;
  - el recorrido de los diálogos presentes;
  - cada `code` de error que traduce la feature;
  - el formato de los datos que muestra en **es-AR y en-US**;
  - **axe sin violaciones** ([accesibilidad](accesibilidad.md));
  - la vista a **390 px** si tiene tabla o formulario ([responsive](responsive.md));
  - en una edición, el **409 de concurrencia**; en un alta, que el reintento manda la **misma** `Idempotency-Key`.
- Las consultas van por rol y por texto accesible (`getByRole("button", { name: … })`). Los desplegables de Radix se abren con teclado.
- `referenceData.test.ts` (E1) comprueba que los selectores tomen opciones habilitadas y traducciones de `GET /api/reference-data`, el estado de carga y el `ETag`; `formatters.test.ts` (E1) recorre los mismos casos que el back. Ningún test fija un array de países, monedas o zonas en un componente.
- `renderWithProviders` entrega un QueryClient nuevo a todos los providers por cada render; el test comprueba que también aísla la carga inicial de referencias. `parity.test.ts` exige recursos para los idiomas de culturas habilitadas en el JSON del back (repo hermano obligatorio en local; solo ese chequeo se omite en CI aislado con aviso). `columns-mobile.test.ts` inspecciona automáticamente cada `areas/**/columns.tsx` real cuando nazcan en E4: cada definición exportada debe tener una sola columna `mobile: "primary"`. En E2 no existe ningún archivo de ese patrón; completar esta guardia con la receta de Roles en E4.
- Los tests de generación de contratos lanzan Node en subprocesos; usan un límite de 20 segundos por caso para evitar fallos por carga de workers en Windows. Una ejecución aislada o con dos workers puede terminar bastante antes.
- Desde E3a y en cada etapa posterior, ejecutar `npm run test:e2e:real` contra front y Api reales, con una base PostgreSQL propia del E2E, separada del volumen Development de Aspire, y `Email:Delivery=PickupDirectory`. El runner crea en esa base la persona y la organización necesarias. `E2E_PICKUP_DIR` apunta al mismo directorio absoluto temporal que `Email:PickupDirectory`; Playwright lee los códigos de los `.eml` sin imprimirlos y verifica `/registro` → Personal → logout → cuenta propia por `/login/empresa` → `/org` → F5 conserva el acceso empresa → Perfiles/Personal → logout. El test no intercepta red ni simula API, cookie, base, sesión o correo.
- Al cerrar una etapa, comparar visualmente las pantallas nuevas o modificadas y sus estados afectados con los tableros aprobados del lienzo; resolver o documentar los hallazgos.

## Prohibido
- `getByTestId` si existe un rol accesible.
- Snapshots de pantallas enteras.
- Timers reales: se usan los falsos de Vitest.
- Tests que dependen del orden.
- Reemplazar el recorrido real por MSW o por el arnés de capturas: esas pruebas tienen objetivos distintos.

## Copiá de
- `src/areas/business/roles/pages/RolesPage.test.tsx` (E4)

## Lo verifica
- El CI (`npm test`) y `harness.test.ts` (E0), que usa `HarnessStage` para exigir solo los tests de etapas cerradas.
- `scripts/test-e2e-real.test.mjs` (E3): ninguna etapa desde E3a se cierra si el recorrido real está rojo.

## Detalle
[frontend.md §4, "Tests"](../architecture/frontend.md#tests)
