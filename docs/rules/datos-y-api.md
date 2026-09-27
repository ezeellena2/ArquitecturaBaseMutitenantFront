# Datos y API

**Regla:** todo pasa por `shared/api/httpClient`. Los datos del servidor viven en TanStack Query. Los tipos salen de `shared/api/generated/`, que no se edita a mano.

## Cómo se hace
- `api/<feature>.ts`:
  ```ts
  import type { RoleRow, PagedResultOfRoleRow } from "@/shared/api/generated/types";
  export const rolesQueryKeyRoot = ["roles"] as const;
  export const rolesQueryKey = (q: RolesQuery) => [...rolesQueryKeyRoot, q] as const;
  export const fetchRoles = (q: RolesQuery) => api.get<PagedResultOfRoleRow>(`/api/roles?${toSearch(q)}`);
  ```
- En la página: `useQuery({ queryKey, queryFn, placeholderData: keepPreviousData })`. Una mutación invalida `rolesQueryKeyRoot`.
- Si cambió el contrato del back: `npm run contracts` y commitear `generated/`.
- **Altas y envíos:** `useIdempotentMutation(fn)` en lugar de `useMutation`. Genera la `Idempotency-Key` al montar, la repite en los reintentos (también en el del `httpClient`) y la renueva después de un éxito. Un 409 `Request.InProgress` no es un error: espera y reintenta.
- **Ediciones:** la `version` que trae la ficha viaja en el `PUT` o `DELETE` ([formularios](formularios.md), "Ediciones simultáneas").
- **Módulos:** una query de un módulo apagado no se dispara; `useFeature("reportes")` lo dice ([accesos-y-permisos](accesos-y-permisos.md)).
- **El front no calcula dinero ni reglas de negocio:** muestra lo que llega y los totales vienen del back.
- Al cambiar de acceso u organización, `queryClient.clear()` (lo hace `useSwitchAccess`).

## Prohibido
- `fetch` o `axios` directo.
- `useEffect` con fetch.
- Interfaces escritas a mano para lo que existe en `generated/`.
- Guardar datos del servidor en `useState` o en localStorage.
- Tokens fuera de memoria.

## Copiá de
- `src/areas/business/roles/api/roles.ts` (E4)

## Lo verifica
- `contracts:check` en el CI: `generated/` al día con `openapi.json`.
- `tsc` estricto; `httpClient.test.ts`.

## Detalle
[frontend.md §4, "Datos y API"](../architecture/frontend.md#datos-y-api)
