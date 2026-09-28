# Datos y API

**Regla:** todo pasa por `shared/api/httpClient`. Los datos del servidor viven en TanStack Query. `generated/` contiene solo `schema.d.ts` y no se edita a mano; los alias escritos a mano viven en `shared/api/types.ts`, que reexporta desde ese schema.

## Cómo se hace
- `api/<feature>.ts`:
  ```ts
  import type { RoleRow, PagedResultOfRoleRow } from "@/shared/api/types";
  export const rolesQueryKeyRoot = ["roles"] as const;
  export const rolesQueryKey = (q: RolesQuery) => [...rolesQueryKeyRoot, q] as const;
  export const fetchRoles = (q: RolesQuery) => api.get<PagedResultOfRoleRow>(`/api/roles?${toSearch(q)}`);
  ```
- En la página: `useQuery({ queryKey, queryFn, placeholderData: keepPreviousData })`. Una mutación invalida `rolesQueryKeyRoot`.
- Si cambió el contrato del back: `npm run contracts` y commitear `generated/`.
- El `.npmrc` de la raíz mantiene `legacy-peer-deps=true` porque `openapi-typescript` 7.13 declara TypeScript 5 como peer y la plantilla usa TypeScript 6. Se retira solo cuando el generador declare compatibilidad con TypeScript 6 y pasen `npm ci` sin ese ajuste, `npm run build`, `npm test` y `contracts:check`.
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
- `contracts:check` en el CI (E1): `generated/schema.d.ts` al día con `openapi.json`.
- `tsc` estricto (E0); `httpClient.test.ts` (E1).

## Detalle
[frontend.md §4, "Datos y API"](../architecture/frontend.md#datos-y-api)
