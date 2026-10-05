# API de Organizaciones

Cliente tipado con alias de `shared/api/types.ts`, `httpClient` y claves de TanStack Query.
Leé `docs/rules/datos-y-api.md` y `docs/rules/errores.md`; copiá `business/users/api/users.ts` sin importarlo.
POST de estado lleva versión y motivo; reintentar alta lleva sólo versión. Toda clave idempotente la recibe del caller.
