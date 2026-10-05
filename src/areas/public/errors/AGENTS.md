Errores de ruta, permisos y estado de organización. Leé `docs/rules/errores.md` y `docs/architecture/frontend.md` §4.
`ForbiddenPage`, `NotFoundPage` y `ErrorPageFrame` viven en `shared/ui` y acá solo se reexportan; `OrganizationUnavailablePage` es propia (tablero Perfil-Suspendido).
Usá los estados y textos de los tableros Error-Org y Perfil-Suspendido. Un error de API se identifica por `code`; no infieras permisos desde el rol.
