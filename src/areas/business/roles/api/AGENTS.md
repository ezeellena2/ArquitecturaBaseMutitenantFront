Consultas y escrituras HTTP tipadas de Roles. Leé `../../../../../docs/rules/datos-y-api.md`, `../../../../../docs/rules/paginado-y-listados.md` y `../../../../../../ArquitecturaBaseMutitenant/docs/features/roles.md`.
Usá `httpClient`, los tipos de `src/shared/api/generated/` y claves de TanStack Query.
Los POST llevan `Idempotency-Key`; las ediciones y bajas envían la versión actual.
