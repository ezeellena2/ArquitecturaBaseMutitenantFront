Cliente OIDC del SPA, recuperación y estados de sesión, guardas de rutas por acceso.
accountIdentity deriva la identidad visible de Me: nombre, máscara Phone recibida, correo y vacío; la máscara no se formatea ni se usa como inicial. Menús, lateral y Más reutilizan sus datos con Avatar apagado/raya cuando corresponde.
Leé `docs/architecture/frontend.md` («Auth»), `docs/rules/accesos-y-permisos.md` y `docs/rules/datos-y-api.md`.
Los tokens viven solo en memoria; `AccessRoute` decide la experiencia y la Api autoriza.
Salir es siempre `useSignOut()`; las rutas de cada acceso, `tenancy/access.ts`.
Los permisos y módulos de la sesión salen de `usePermissions` (`effectivePermissions` y `features` de `/api/me`).
`issuer.ts` fija la autoridad; callbacks, canje, renovación y logout-return usan el origen propio (`authConfig`).
En un subdominio válido, `recoveryAccess` fuerza Consumer y `SessionRecovery` usa iframe, sin bloquear el Outlet público ni crear un espacio personal silenciosamente.
