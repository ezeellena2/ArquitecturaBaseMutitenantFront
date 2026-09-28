# Errores

**Regla:** se decide por **`error.code`**, nunca por el texto. El `detail` ya viene traducido por el backend. Lo global (red, 5xx) lo maneja `queryClient`, y cada feature traduce solo los códigos que merecen un texto o un campo propio.

## Cómo se hace
- `errors.ts` de la feature:
  ```ts
  export function roleErrorMessage(error: ApiError, t: TFunction): string {
    switch (error.code) {
      case "Roles.Role.HasUsers": return t("roles:errors.hasUsers", { count: error.problem.userCount });
      default: return error.detail;
    }
  }
  ```
- **Formularios:** `applyApiErrorToForm(error, setError, fieldMap)`. Lo que no encaja en un campo va en `<FormError>` sobre la botonera.
- **ConfirmDialog o acción de fila:** toast con el mensaje.
- **Pantalla:** un 403 renderiza `ForbiddenPage`; un 404 en una ficha, `NotFoundPage` (también un id de otra organización o de otro acceso); `Tenancy.Tenant.Suspended`, `Tenancy.Tenant.PendingApproval` y `Tenancy.Tenant.Closed` renderizan `OrganizationUnavailablePage` con su estado (Suspendida, Espera aprobación o Cerrada), y `Tenancy.Access.Wrong` lleva al inicio del acceso correcto.
- Query que maneja su error en pantalla: `meta: { silent: true }`.
- **Genéricos** (red, 5xx, 429 con cuenta regresiva, sesión vencida, 409, salir sin guardar, versión nueva, módulo apagado): los resuelven `shared/api` y el `AppShell`, como dice [frontend.md, "Errores"](../architecture/frontend.md#errores). Una pantalla no los reimplementa.

## Prohibido
- `if (error.detail.includes(...))`.
- Mostrar `error.message` crudo o el `traceId` fuera del toast de 5xx.
- `try/catch` que se trague un error sin mostrarlo.
- Reintentar solo un 429 o un 409 `General.ConcurrencyConflict`. (El 409 `Request.InProgress` de un alta idempotente espera y reintenta: lo hace `useIdempotentMutation`.)

## Copiá de
- `src/areas/business/users/errors.ts` (E6) · `src/shared/api/formErrors.ts` (E1)

## Lo verifica
- Tests de pantalla: cada `code` que traduce la feature tiene un test (tests.md).
- `formErrors.test.ts`, `queryClient.test.ts`.

## Detalle
[frontend.md §4, "Errores"](../architecture/frontend.md#errores)
