Pantallas de la página pública en el subdominio, sin importar pantallas privadas de otra área.
Leé `docs/rules/pantallas-y-ui.md`, `docs/rules/accesibilidad.md`, `docs/rules/responsive.md` y `docs/rules/textos-y-traducciones.md`.
Copiá Pagina-Publica y M-Pagina-Publica: No disponible no explica el estado ni lleva menú hamburguesa.
El enlace al dominio principal usa `tenancy/publicSite.ts`; los datos publicados usan `tenancy/usePublicSite.ts`.
`PublicPage` reutiliza `shared/ui/PublicPageCard` y su fondo; el 404 público exacto muestra `StorefrontUnavailablePage`, otros errores usan `apiErrorMessage` y reintento.
Sin sesión, la CTA inicia OIDC Consumer y conserva la ruta; con sesión se oculta y `PublicAccessMenu` usa los flujos centrales de perfiles y salida.
