Acceso activo, cambio entre Personal y organizaciones y selección de perfil.
Leé `docs/architecture/frontend.md` §3 y `docs/rules/accesos-y-permisos.md`.
El inicio, la puerta de ingreso, la organización activa y los estados no disponibles salen de `access.ts`: un acceso nuevo se suma ahí.
El acceso y la organización activos vienen del token y `/api/me`; no se guardan en localStorage.
El issuer fijo define [publicSite.ts](publicSite.ts): host exacto, sufijo, URL real y regreso al dominio principal; no elige el tenant privado.
Al cambiar, renová el token con el acceso pedido, limpiá la caché y recién entonces navegá.
`usePublicSite` es la única fuente HTTP/keys de lo publicado; sólo el 404 `PublicSite.PublicPage.NotFound` muestra No disponible.
`PublicAccessMenu` reutiliza `AccessMenu`/`useProfiles`: Cuenta y perfiles vuelven al principal; Salir vuelve a la raíz del propio sitio.
