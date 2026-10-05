# API de página pública

Funciones tipadas para leer, editar, publicar y despublicar la página (`/api/organization/public-page`) y para ver si un slug está libre (`/api/public-site/slug-availability`).
Usá el contrato OpenAPI generado y la versión de la página en cada edición.
La lectura pública del subdominio (`GET /api/public-site`, `PublicSiteController`) no va acá: va en `areas/storefront/` (E7).
