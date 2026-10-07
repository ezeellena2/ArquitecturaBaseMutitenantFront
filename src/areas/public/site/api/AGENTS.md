# API del sitio público principal

El recurso del directorio vive una sola vez en `directory.ts`: claves de TanStack Query y funciones con `httpClient`.
Los DTO son alias de `shared/api/generated/schema.d.ts` en `shared/api/types.ts`; no se escriben contratos a mano.
Copiá Roles y leé [datos y API](../../../../../docs/rules/datos-y-api.md) y [paginado y listados](../../../../../docs/rules/paginado-y-listados.md).
La portada pide la primera página de 10 y muestra las primeras tres; el directorio reutiliza este recurso con `usePagedQuery`.
No imports de otras features ni datos privados de organizaciones; cada enlace público usa `tenancy/publicSite`.
