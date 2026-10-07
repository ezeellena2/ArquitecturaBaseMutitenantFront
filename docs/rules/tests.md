# Tests

**Regla:** las pantallas con interacción, hooks y formateadores con lógica tienen tests junto al código (`X.test.tsx`); un DTO, texto o delegado simple no necesita un test que refleje su implementación. Por cada cambio coherente con lógica, escribir primero un test focal que falle, hacerlo pasar y verificar el build y lint del alcance afectado antes del commit. Al cerrar una etapa y en CI, ejecutar `npm run build`, `npm run lint`, `npm test` y `npm run contracts:check` completos y limpios.

## Cómo se hace
- `renderRouteWithProviders(path, { as: "business-admin" })` y, para el sitio público, `{ host: "empresa-a.localtest.me" }`. Los usuarios de prueba están en `test/mocks/currentUsers.ts`: persona sin organizaciones, persona con organizaciones, empresa admin, empresa sin permisos y operador.
- MSW con `onUnhandledRequest: "error"`: toda llamada tiene su handler.
- **Cada test entra en 5 s, también con la máquina cargada:** una prueba lenta primero se aliviana: la pantalla que la ruta carga con `lazyPage` se importa en un `beforeAll`, un texto largo se pega (`user.paste`) en vez de tipearse letra por letra y un recorrido largo se parte en dos; para salir de una pantalla con cambios se usa un enlace a una pantalla ya cargada («Inicio»). Si igual no entra, el límite se sube en ese test con un comentario que dice por qué.
- Cada test empieza limpio: `resetBetweenTests` (`test/utils/isolation.ts`, en el setup) desmonta la pantalla, quita el bloqueo de la vista y cierra los avisos, que sonner guarda fuera de React y volvería a mostrar en el test siguiente.
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
- **Migración de sesiones (A8):** el recorrido real conserva, antes de tocar cada puerta pública, una cookie `Identity.Application` firmada como la versión anterior a A3. La emite `RealE2ESetup` con la cuenta y las claves Data Protection de la base aislada; no es una sesión simulada ni una cookie del usuario. Su archivo local se consume y se elimina sin imprimirlo. El resto del recorrido ingresa por la UI y los códigos reales, y verifica que la cookie independiente de Plataforma siga funcionando.

## Prohibido
- `getByTestId` si existe un rol accesible.
- Snapshots de pantallas enteras.
- Timers reales: se usan los falsos de Vitest.
- Tests que dependen del orden.
- Reemplazar el recorrido real por MSW o por el arnés de capturas: esas pruebas tienen objetivos distintos.

## Copiá de
- `src/areas/business/roles/pages/RolesPage.test.tsx` y `RoleEditorPage.test.tsx` (E4): cada caso con axe y su caso en el teléfono · `src/areas/business/roles/lib/permissionPicker.test.ts` (E4): la lógica de una feature, sin pantalla

## Lo verifica
- El CI (`npm test`) y `harness.test.ts` (E0), que usa `HarnessStage` para exigir solo los tests de etapas cerradas.
- `isolation.test.tsx` (E7): el aviso de un test no aparece en el siguiente.
- `scripts/test-e2e-real.test.mjs` (E3): ninguna etapa desde E3a se cierra si el recorrido real está rojo.

## Detalle
[frontend.md §4, "Tests"](../architecture/frontend.md#tests)
