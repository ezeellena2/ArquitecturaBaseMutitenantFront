# Errores

**Regla:** se decide por **`error.code`**, nunca por el texto. El `detail` ya viene traducido por el backend. Lo global (red, 5xx) lo maneja `queryClient`, y cada feature traduce solo los códigos que merecen un texto o un campo propio.

## Cómo se hace
- `errors.ts` de la feature:
  ```ts
  export function roleErrorMessage(error: ApiError, t: TFunction): string {
    switch (error.code) {
      case "Roles.Role.HasUsers": return t("roles:errors.hasUsers", { count: error.extensions.userCount });
      default: return error.detail;
    }
  }
  ```
- **Formularios:** `applyApiErrorToForm(error, setError, fieldMap)`. Lo que no encaja en un campo va en `<FormError>` sobre la botonera.
- **ConfirmDialog o acción de fila:** toast con el mensaje.
- **Pantalla:** un 403 renderiza `ForbiddenPage`; un 404 en una ficha, `NotFoundPage` (también un id de otro perfil); `Tenancy.Tenant.Suspended` renderiza `ProfileSuspendedPage`.
- Query que maneja su error en pantalla: `meta: { silent: true }`.

## Prohibido
- `if (error.detail.includes(...))`.
- Mostrar `error.message` crudo o el `traceId` fuera del toast de 5xx.
- `try/catch` que se trague un error sin mostrarlo.

## Copiá de
- `src/areas/business/users/errors.ts` (E6) · `src/shared/api/formErrors.ts` (E1)

## Lo verifica
- Tests de pantalla: cada `code` que traduce la feature tiene un test (tests.md).
- `formErrors.test.ts`, `queryClient.test.ts`.

## Detalle
[frontend.md §4, "Errores"](../architecture/frontend.md#errores)
