Acceso activo, cambio entre Personal y organizaciones y selección de perfil.
Leé `docs/architecture/frontend.md` §3 y `docs/rules/accesos-y-permisos.md`.
El inicio, la puerta de ingreso, la organización activa y los estados no disponibles salen de `access.ts`: un acceso nuevo se suma ahí.
El acceso y la organización activos vienen del token y `/api/me`; no se guardan en localStorage.
La dirección pública visible sale de [publicSite.ts](publicSite.ts): `publicSiteHost(slug)` y el sufijo actual compartido; E7 lo completa desde el issuer.
Al cambiar, renová el token con el acceso pedido, limpiá la caché y recién entonces navegá.
