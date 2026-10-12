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
- **Datos de referencia:** `shared/referenceData` lee `GET /api/reference-data` con TanStack Query (`staleTime: Infinity`) y conserva `ETag` para revalidar. Recibe todas las filas de los cinco catálogos traducidas, con `isEnabled`: `shared/ui/fields` ofrece solo las habilitadas para entradas nuevas y `shared/format` usa también las deshabilitadas para mostrar valores guardados. Mientras cargan, los campos muestran estado de carga; si falla la primera carga, el proveedor muestra un error traducido con «Reintentar» sin dejar la app en blanco. E1 recibe JSON del back; E2, las tablas, sin cambiar la API ([diseño canónico](../../../ArquitecturaBaseMutitenant/docs/architecture/datos-de-referencia.md)).
- **Registro con Google:** `GoogleButton` obtiene el token antiforgery con TanStack Query y `httpClient`; el navegador envía un formulario `POST /api/auth/external/google` para continuar con el desafío OAuth. El formulario técnico se asocia al botón sin anidar el formulario de correo de Registro. El acceso existente con Google sigue por `GET`.
- **Almacenamiento local opcional:** `shared/hooks/safeStorage.ts` centraliza la lectura y escritura de preferencias. Si el navegador bloquea `localStorage`, la app inicia con la cultura predeterminada del catálogo y deja cambiar de idioma durante la sesión sin interrumpirse: lo elegido queda en memoria y puede no persistir al cerrar la pestaña. Nunca se guardan tokens allí.
- **Espera entre códigos y Retry-After:** `useCountdown` fija un vencimiento y recalcula los segundos con el reloj, también al recuperar foco o visibilidad. Los timers del navegador pueden atrasarse o pausarse: no se resta una unidad por callback ni se prolonga la espera después de retomar una pestaña. `useRetryAfterCountdown` conserva los límites recibidos y solo habilita el botón; nunca reenvía por su cuenta. Lo verifican `useCountdown.test.ts` y `useRetryAfterCountdown.test.tsx`.
- Si cambió el contrato del back: `npm run contracts` y commitear `generated/`.
- `npm run contracts:check` es obligatorio en local. En el CI del front, si falta el checkout de `../ArquitecturaBaseMutitenant`, el comando lo omite con un aviso visible; si está presente, compara `schema.d.ts` con `openapi.json` y falla ante diferencias. El checkout cruzado en el CI llega con la Etapa 10 (ADR 0016).
- El `.npmrc` de la raíz mantiene `legacy-peer-deps=true` porque `openapi-typescript` 7.13 declara TypeScript 5 como peer y la plantilla usa TypeScript 6. Se retira solo cuando el generador declare compatibilidad con TypeScript 6 y pasen `npm ci` sin ese ajuste, `npm run build`, `npm test` y `contracts:check`.
- **Altas y envíos:** `useIdempotentMutation(fn)` en lugar de `useMutation`. Genera la `Idempotency-Key` al montar y la conserva ante red o 5xx. La renueva después de un éxito o de un 4xx definitivo para que un formulario corregido pueda enviarse con otro cuerpo. Un 409 `Request.InProgress` conserva la clave, espera y reintenta hasta 30 veces; al desmontar cancela la espera y no vuelve a enviar. «Reintentar» ejecuta la mutación original en MutationCache. Los callbacks de `mutate(variables, { onSuccess, onError })` sólo corren si su observer sigue asociado: otro envío puede retirarlo. Copiá el adaptador del formulario o recurso correspondiente; no dependas de esos callbacks para un recorrido que pueda reintentarse después de otro envío. `useIdempotentMutation(fn, { meta })` lleva la `meta` al manejo global de errores ([errores](errores.md)).
  - Si el formulario deja corregir los datos después de una respuesta perdida, pasá `sameOperation(previous, next)` en las opciones: compara explícitamente el cuerpo completo y, si corresponde, el recorrido. El hook conserva la clave solo para reintentar esa misma operación; al cambiar los datos o abandonar el recorrido, genera otra antes de enviar. Las variables contienen todos los datos del pedido, sin leer campos mutables desde el callback. No se compara por texto de errores, hash ni serialización. Recuperar usa esta opción para sus tres pedidos, sin cambiar el nonce del recorrido. Lo verifican `useIdempotentMutation.test.ts` (E5) y `RecoverAccountPage.test.tsx` (E5).
  - **Acciones directas por recurso:** copiá `DomainActions` de `areas/platform/tenants/tabs/OrganizationDomainTab.tsx`. El componente estable por recurso posee su hook y conserva la clave al operar sobre otro. El éxito usa las variables originales en el adaptador y comprueba vida antes de enviar y después de responder; el error final se observa con una suscripción local a MutationCache, filtrada por meta del recurso, `updated/actionerror`, `ApiError` y vida activa. `useIsMutating` con esa meta incluye reintentos sin observer y la espera completa. No avisar errores por cada intento `Request.InProgress`: el agotamiento sí avisa una vez. Limpiar la suscripción al desmontar; no copiar el polling ni mantener mapas manuales de claves ni cambiar las piezas comunes. `OrganizationDomainTab.test.tsx` verifica A→B→Retry A, dos envíos de A, claves/versiones, respuestas tardías y 31 pedidos/30 esperas con y sin observer.
- **Ediciones:** la `version` que trae la ficha viaja en el `PUT` o `DELETE` ([formularios](formularios.md), "Ediciones simultáneas").
- **Acciones de Organizaciones de Plataforma:** `OrganizationsPage` conserva sólo `{version,status}` de cada escritura propia para coordinar la próxima acción. La respuesta manda aunque llegue otra versión por una relectura; el diálogo cierra sin esperar esa relectura. Cerrar tras 409 invalida la raíz y vuelve a aceptar la lectura autoritativa. El componente local `OrganizationStatusDialog` monta el adaptador idempotente por formulario y declara `meta.handlesError` para evitar dos avisos: `ReasonDialog` posee los callbacks del reintento global. Cancelar desmonta el adaptador y termina el recorrido, como en el alta; el aviso de un formulario cancelado ya no envía ni cierra otro diálogo. Los tests de la pantalla prueban esos recorridos y la clave estable del formulario activo ante red.
- **Módulos:** una query de un módulo apagado no se dispara; `usePermissions().hasFeature("reportes")` lo dice ([accesos-y-permisos](accesos-y-permisos.md)).
- **El front no calcula dinero ni reglas de negocio:** muestra lo que llega y los totales vienen del back.
- Al cambiar de acceso u organización, `queryClient.clear()` (lo hace `useSwitchAccess`).

## Prohibido
- `fetch` o `axios` directo.
- `useEffect` con fetch.
- Interfaces escritas a mano para lo que existe en `generated/`.
- Arrays de monedas, países, zonas, culturas o tipos fiscales en el front; solo se consumen del catálogo.
- Guardar datos del servidor en `useState` o en localStorage.
- Tokens fuera de memoria.

## Copiá de
- `src/areas/business/roles/api/roles.ts` (E4)
- `src/areas/public/auth/pages/RecoverAccountPage.tsx` y `src/areas/platform/tenants/tabs/OrganizationDomainTab.tsx` (E5): nonce sólo en memoria y comparación del cuerpo/recorrido; acción directa con dueño por recurso y reintentos nativos.

## Lo verifica
- `useCountdown.test.ts` (E7) y `useRetryAfterCountdown.test.tsx` (E3): tiempo transcurrido, reanudación, reinicio y botón sin reenvío automático.
- `contracts:check` (E1): obligatorio en local; en CI comprueba `generated/schema.d.ts` cuando está el repo hermano y deja aviso si falta.
- `referenceData.test.ts` (E1): catálogos, `ETag`, caché y estado de carga.
- `tsc` estricto (E0); `httpClient.test.ts` (E1).
- `RecoverAccountPage.test.tsx` y `OrganizationDomainTab.test.tsx` (E5): misma clave al reintentar la misma operación y abandono al corregir, volver o cambiar de recurso; `platform-contract.test.ts` (E5): permisos de `/api/me`, principal nullable de Cuenta y versiones de las acciones.

## Detalle
[frontend.md §4, "Datos y API"](../architecture/frontend.md#datos-y-api)
