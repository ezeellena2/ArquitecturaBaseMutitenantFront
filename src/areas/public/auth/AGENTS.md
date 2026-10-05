Ingreso (las dos puertas comparten pantalla), registro de personas, «Registrá tu empresa» e invitación. Leé `docs/architecture/frontend.md` «Auth», `docs/rules/accesos-y-permisos.md` y los tableros Ingreso, Registro, Registro-Empresa, Invitacion y Sesion.
El código de correo es un paso de la misma pantalla, sin ruta propia; la pantalla de estado y el paso del código son las piezas de `components/`.
Los textos salen de `src/locales/`; el token no sale de `src/auth/`.
