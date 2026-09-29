Acceso activo, cambio entre Personal y organizaciones y selección de perfil.
Leé `docs/architecture/frontend.md` §3 y `docs/rules/accesos-y-permisos.md`.
El acceso y la organización activos vienen del token y `/api/me`; no se guardan en localStorage.
Al cambiar, renová el token con el acceso pedido, limpiá la caché y recién entonces navegá.
