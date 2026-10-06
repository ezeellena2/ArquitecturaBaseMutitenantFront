# API de Organizaciones

Cliente tipado con alias de `shared/api/types.ts`, `httpClient` y claves de TanStack Query.
Leé `docs/rules/datos-y-api.md` y `docs/rules/errores.md`; copiá `business/users/api/users.ts` sin importarlo.
POST de estado lleva versión y motivo; reintentar alta lleva sólo versión. Toda clave idempotente la recibe del caller.
Detalle e Historial globales usan `tenantsQueryRoot`; el cursor opaco viaja con `after` y límite 25, sin total. Los alias se derivan del schema generado.
Módulos usa GET y PUT con `expiresOn` civil y versión 0 sin fila; sin Idempotency-Key en PUT. Dominios usa GET, POST verify con clave y DELETE con versión/motivo en el cuerpo, sin clave. Página usa GET y POST unpublish/allow-publish con clave y versión propia.
Las tres claves de subrecurso incluyen el id; las lecturas privadas no se usan para anticipar conteos.
