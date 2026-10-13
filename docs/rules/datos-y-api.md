# Datos y API

**Regla:** todo pasa por `shared/api/httpClient`. Los datos del servidor viven en TanStack Query. `generated/` contiene `schema.d.ts` y `validation.ts` (restricciones y categorías del mismo OpenAPI) y no se edita a mano; los alias escritos a mano viven en `shared/api/types.ts`, que reexporta desde ese schema. Los alias exclusivos de un módulo opcional viven en `src/modules/<nombre>/api/types.ts` y apuntan al mismo schema generado; el núcleo conserva sólo los alias neutrales.

## Cómo se hace
- `api/<feature>.ts`:
  ```ts
  import type { RoleRow, PagedResultOfRoleRow } from "@/shared/api/types";
  export const rolesQueryKeyRoot = ["roles"] as const;
  export const rolesQueryKey = (q: RolesQuery) => [...rolesQueryKeyRoot, q] as const;
  export const fetchRoles = (q: RolesQuery) => api.get<PagedResultOfRoleRow>(`/api/roles?${toSearch(q)}`);
  ```
- En la página: `useQuery({ queryKey, queryFn, placeholderData: keepPreviousData })`. Una mutación invalida `rolesQueryKeyRoot`. El contrato HTTP de roles incluye el nombre de empresa en `companyName` y las asignaciones incluyen `companyStatus`; no se pide un detalle por fila para mostrarlas. La clave y lectura de empresa están en `shared/api/resourceOptions` (`companyQuery`/`fetchCompany`). La ficha de cuenta de Plataforma incluye la cultura efectiva en su clave para releer los nombres traducidos cuando cambia el idioma.
- **Datos de referencia:** `shared/referenceData` lee `GET /api/reference-data` con TanStack Query (`staleTime: Infinity`) y conserva `ETag` para revalidar. Recibe todas las filas de los cinco catálogos traducidas, con `isEnabled`: `shared/ui/fields` ofrece solo las habilitadas para entradas nuevas y `shared/format` usa también las deshabilitadas para mostrar valores guardados. Mientras cargan, los campos muestran estado de carga; si falla la primera carga, el proveedor muestra un error traducido con «Reintentar» sin dejar la app en blanco. E1 recibe JSON del back; E2, las tablas, sin cambiar la API ([diseño canónico](../../../ArquitecturaBaseMutitenant/docs/architecture/datos-de-referencia.md)).
- **Registro con Google:** `GoogleButton` obtiene el token antiforgery con TanStack Query y `httpClient`; el navegador envía un formulario `POST /api/auth/external/google` para continuar con el desafío OAuth. El formulario técnico se asocia al botón sin anidar el formulario de correo de Registro. El acceso existente con Google sigue por `GET`.
- **Almacenamiento local opcional:** `shared/hooks/safeStorage.ts` centraliza la lectura y escritura de preferencias. Si el navegador bloquea `localStorage`, la app inicia con la cultura predeterminada del catálogo y deja cambiar de idioma durante la sesión sin interrumpirse: lo elegido queda en memoria y puede no persistir al cerrar la pestaña. Nunca se guardan tokens allí.
- **Espera entre códigos y Retry-After:** `useCountdown` fija un vencimiento y recalcula los segundos con el reloj, también al recuperar foco o visibilidad. Los timers del navegador pueden atrasarse o pausarse: no se resta una unidad por callback ni se prolonga la espera después de retomar una pestaña. `useRetryAfterCountdown` conserva los límites recibidos y solo habilita el botón; nunca reenvía por su cuenta. Lo verifican `useCountdown.test.ts` y `useRetryAfterCountdown.test.tsx`.
- Si cambió el contrato del back: `npm run contracts` y commitear `generated/`.
- `npm run contracts:check` es obligatorio en local. En el CI del front, si falta el checkout de `../ArquitecturaBaseMutitenant`, el comando lo omite con un aviso visible; si está presente, compara `schema.d.ts` y `validation.ts` con `openapi.json` y falla ante diferencias. El checkout cruzado en el CI llega con la Etapa 10 (ADR 0016).
- El `.npmrc` de la raíz mantiene `legacy-peer-deps=true` porque `openapi-typescript` 7.13 declara TypeScript 5 como peer y la plantilla usa TypeScript 6. Se retira solo cuando el generador declare compatibilidad con TypeScript 6 y pasen `npm ci` sin ese ajuste, `npm run build`, `npm test` y `contracts:check`.
- **Altas y envíos:** `useIdempotentMutation(fn)` en lugar de `useMutation`. Genera la `Idempotency-Key` al montar y la conserva ante red o 5xx. La renueva después de un éxito o de un 4xx definitivo para que un formulario corregido pueda enviarse con otro cuerpo. Un 409 `Request.InProgress` conserva la clave, espera y reintenta hasta 30 veces; al desmontar cancela la espera y no vuelve a enviar. «Reintentar» ejecuta la mutación original en MutationCache. Los callbacks de `mutate(variables, { onSuccess, onError })` sólo corren si su observer sigue asociado: otro envío puede retirarlo. Copiá el adaptador del formulario o recurso correspondiente; no dependas de esos callbacks para un recorrido que pueda reintentarse después de otro envío. `useIdempotentMutation(fn, { meta })` lleva la `meta` al manejo global de errores ([errores](errores.md)).
  - Si el formulario deja corregir los datos después de una respuesta perdida, pasá `sameOperation(previous, next)` en las opciones: compara explícitamente el cuerpo completo y, si corresponde, el recorrido. El hook conserva la clave solo para reintentar esa misma operación; al cambiar los datos o abandonar el recorrido, genera otra antes de enviar. Las variables contienen todos los datos del pedido, sin leer campos mutables desde el callback. No se compara por texto de errores, hash ni serialización. Recuperar usa esta opción para sus tres pedidos, sin cambiar el nonce del recorrido. Lo verifican `useIdempotentMutation.test.ts` (E5) y `RecoverAccountPage.test.tsx` (E5).
  - **Acciones directas por recurso:** usá `useResourceAction` junto con `useIdempotentMutation`; el componente estable por recurso conserva su clave al operar sobre otro. El hook tipa las variables que efectivamente ejecutó, comprueba vida/borrador antes de enviar y después de responder, observa sólo el error final de su meta y cuenta reintentos sin observer. El hook crea su `meta`, que se pasa a la mutación sin inventar claves ni un matcher externo. `guarded` recibe el pedido y un callback de éxito con las variables originales. No copiar suscripciones a MutationCache, casts de variables, polling ni mapas de claves. Para un formulario con callbacks nativos que el observer puede reemplazar, `bindCallbacks` conserva el dueño del primer intento. `OrganizationDomainTab.test.tsx` y `useResourceAction.test.tsx` verifican recursos independientes, reintentos y respuestas tardías.
  - **Vida y salida de editores:** `useMountedRef` conserva la vida del componente; `useEditPage` usa `useAbandonOnLeave` sobre el único `useBlocker` público. Pasá `onNavigationAttempt` para retirar la elección/borrador y comprobá `canAct()` en respuestas tardías. No leer contextos `UNSAFE_`, suscribir el router ni comparar una ruta literal para decidir si se puede guardar; una dirección con barra final mantiene el mismo editor. La guarda `form-concurrency.test.ts` prohíbe las APIs internas del router.
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
- `platform-contract.test.ts` (E5)

## Detalle
[frontend.md §4, "Datos y API"](../architecture/frontend.md#datos-y-api)
