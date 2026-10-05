# Errores

**Regla:** se decide por **`error.code`**, nunca por el texto. El `detail` ya viene traducido por el backend. Lo global (red, 5xx y 429) lo maneja `queryClient`, en consultas y mutaciones, y cada feature traduce solo los códigos que merecen un texto o un campo propio. Todo texto de error sale de `shared/api/errorMessage.ts`.

## Cómo se hace
- `errors.ts` de la feature, solo si traduce algo (sin envoltorios vacíos): un texto propio (`users/errors.ts`) o el campo donde va el rechazo de un dato, con el texto del back:
  ```ts
  // business/roles/errors.ts
  const fields: Readonly<Record<string, RoleField>> = { "Roles.Role.AlreadyExists": "name", /* … */ };
  export function roleErrorField(error: unknown): RoleField | null {
    return error instanceof ApiError && error.code ? fields[error.code] ?? null : null;
  }
  ```
- **El texto de un error** sale de `apiErrorMessage(error, t)`: sin conexión, «No pudimos conectarnos. Revisá tu conexión.»; un 5xx, «Algo salió mal. Probá de nuevo en un rato.»; lo demás, el `detail` del back (también el de un 429). Se usa donde la pantalla muestra el error de una consulta (la tabla con «Reintentar») y en los flujos que declaran `meta: { handlesError: true }`.
- **La pantalla no se puede mostrar** (no cargó la ficha, la configuración, la página pública o `/api/me`, o la pantalla se rompió): `LoadErrorPage`, la «Pantalla de error» de «Criterio · Avisos» (M-Error-Org, «No se pudo abrir»): al centro, el ícono de alerta en su círculo, «No pudimos abrir esta pantalla» y «Reintentar» secundario, sin el texto del error. Solo cuando no hay nada que mostrar (`isError && !data`): si falla una relectura, la ficha sigue a la vista.
- **Mutaciones:** el `MutationCache` avisa red (con «Reintentar», que repite la misma mutación con la misma clave), 5xx (con «Copiar código») y 429, salvo las que declaran `meta: { handlesError: true }` (el ingreso y los registros, que muestran todo en su franja y la cuenta regresiva en el botón; `useIdempotentMutation(fn, { meta })`). La pantalla muestra solo lo de negocio, con `actionErrorMessage(error, t)`, que devuelve `null` si el error ya lo avisó el `MutationCache`: el mismo error nunca va en dos lugares. Lo que sigue a un guardado va en `onSuccess` (de la mutación o de `mutate(variables, { onSuccess })`), nunca después de un `await mutateAsync`: así «Reintentar» termina igual.
- **Formularios:** `applyApiErrorToForm(error, setError, fieldMap)`. Lo que no encaja en un campo va en `<FormError message={actionErrorMessage(error, t)} />` sobre la botonera.
- **ConfirmDialog o acción de fila:** `onError: (error) => toastActionError(error, t)`, un aviso abajo, en rojo y sin irse solo. En la ficha de Usuario, lo que el back rechaza al confirmar «Quitar de la organización» va en la franja de la ficha, como lo que rechaza al guardar (tablero Usuario, «Lucía (vos)»).
- **Pantalla:** un 403 de la **consulta principal** renderiza `ForbiddenPage`; un 404 en una ficha, `NotFoundPage` (también un id de otra organización o de otro acceso): la ficha lo distingue con `isNotFoundError(error)` antes de la pantalla de error, y las dos piezas viven en `shared/ui`; `Tenancy.Tenant.Suspended`, `Tenancy.Tenant.PendingApproval` y `Tenancy.Tenant.Closed` renderizan `OrganizationUnavailablePage` con su estado (Suspendida, Espera aprobación o Cerrada), y `Tenancy.Access.Wrong` lleva al inicio del acceso correcto.
- **Qué consulta bloquea la vista:** la principal de la pantalla (el listado, la ficha, la configuración) lo declara con `meta: { blocksView: true }`, y `QueryCache.onError` publica su 403 para el `AppShell`. El 403 de una consulta secundaria (las opciones de un filtro, un conteo, los roles de una pestaña) queda en su lugar y la pantalla sigue a la vista. `httpClient` solo transporta: nunca decide qué pantalla se ve. `Legal.AcceptanceRequired` sigue su camino: bloquea desde cualquier consulta o mutación y lo resuelve `LegalAcceptanceGate`.
- Query que maneja su error en pantalla: `meta: { silent: true }`. También `/api/me` (`useCurrentUser`, con `blocksView`): si falla, `LegalAcceptanceGate` muestra la pantalla de error (`LoadErrorPage`), sin el aviso de abajo; si falla la relectura de Mi cuenta, lo dice su franja.
- Si falla el catálogo inicial, `AppProviders` muestra el error y un botón «Reintentar»; el Toaster sigue montado aunque el contenido principal espere datos o traducciones.
- Si Vite emite `vite:preloadError`, `AppShell` muestra la franja de versión nueva sin cancelar el evento. Los fallos de render y de ruta se contienen en la misma pantalla de error (`AppErrorPage` usa `LoadErrorPage`); «Reintentar» recarga la página y la recarga sucede solo al pulsarlo.
- **Genéricos:** `shared/api` y `AppShell` resuelven red, 5xx, 429 (`retryAfterSeconds` y cuenta regresiva en el botón, sin reintento automático), 409, salir sin guardar y versión nueva en E1. La sesión vencida requiere Auth y se conecta en E3; módulo apagado, en E5. Una pantalla no los reimplementa ([frontend.md, "Errores"](../architecture/frontend.md#errores)).

## Prohibido
- `if (error.detail.includes(...))`.
- Mostrar `error.message` crudo o el `traceId` fuera del toast de 5xx.
- `try/catch` que se trague un error sin mostrarlo.
- Reintentar solo un 429 o un 409 `General.ConcurrencyConflict`. (El 409 `Request.InProgress` de un alta idempotente espera y reintenta: lo hace `useIdempotentMutation`.)

## Copiá de
- `src/areas/business/roles/pages/RoleEditorPage.tsx` (E4: el 409 y el error de guardado con `useEditPage`; el alta con `mutate(variables, { onSuccess, onError })`; el rechazo de un dato en su campo con `errors.ts`) · `src/areas/business/roles/pages/RolesPage.tsx` (E4: acciones de fila con `toastActionError`) · `src/areas/personal/account/components/AccountDeletionDialog.tsx` (E4: el error de un diálogo arriba de sus botones) · `src/shared/api/formErrors.ts` (E1) · `src/shared/api/errorMessage.ts`

## Lo verifica
- Tests de pantalla: cada `code` que traduce la feature tiene un test (tests.md). `errors.test.ts` (E7), de Roles: cada rechazo del back va en su campo.
- `formErrors.test.ts` (E1), `queryClient.test.ts` (E1; el 403 de la consulta principal, de una secundaria y de los términos nuevos).
- `CompanyDetailPage.test.tsx` (E7): el 403 de los roles (secundaria) no reemplaza la ficha; el de la ficha, sí.
- `UserDetailPage.test.tsx` (E7): si la última Dueña sale de la organización, lo dice la franja de la ficha y no el aviso de abajo.
- `LegalAcceptanceGate.test.tsx` (E7): si falla `/api/me`, la pantalla de error con «Reintentar», sin el aviso de abajo. `LoadErrorPage.test.tsx` (E7): la pantalla de error en la compu y en el teléfono; `UserDetailPage`, `CompanyDetailPage`, `RoleEditorPage`, `SettingsPage` y `PublicPagePage` (E7): si la ficha no carga, la pantalla de error, y «Reintentar» la vuelve a pedir. `UserDetailPage`, `CompanyDetailPage` y `RoleEditorPage` (E7): si el back no encuentra la ficha (404), «No encontramos esta página» con «Ir al inicio», sin «Reintentar». `AccountPage.test.tsx` (E7): si falla la relectura después de guardar, la franja lo dice una sola vez.
- `errorMessage.test.ts` (E7): el texto de cada error y que la pantalla no repita lo que avisó el `MutationCache`; `queryClient.test.ts` (E7): los avisos de las mutaciones y `meta.handlesError`; `RoleEditorPage.test.tsx` (E7): sin conexión al guardar, un solo aviso con «Reintentar», que vuelve a guardar.
- `sonner.test.tsx` (E7): el aviso de un 5xx (`toastErrorWithCode`) lleva «Copiar código» debajo del texto en la compu y al lado en el teléfono.

## Detalle
[frontend.md §4, "Errores"](../architecture/frontend.md#errores)
