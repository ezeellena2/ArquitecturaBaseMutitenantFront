Sitio publicado de una organización; una feature normal con las carpetas que necesita.
Leé `docs/rules/datos-y-api.md`, `docs/rules/errores.md`, `docs/rules/pantallas-y-ui.md` y `docs/rules/tests.md`.
Copiá Pagina-Publica y M-Pagina-Publica del lienzo aprobado; la tarjeta existente es `shared/ui/PublicPageCard`.
Los datos, la consulta y sus keys salen de `tenancy/usePublicSite.ts`, con el alias generado de `shared/api/types.ts`.
El 404 `PublicSite.PublicPage.NotFound` muestra No disponible sin revelar el motivo; otros errores conservan su recorrido.
