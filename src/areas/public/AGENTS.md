Lo público del dominio principal: la portada (`site/`), el ingreso, los registros y la invitación (`auth/`), los documentos legales (`legal/`) y los errores (`errors/`, que reexporta las páginas de `shared/ui`).
Leé `docs/rules/pantallas-y-ui.md` y el tablero correspondiente en `docs/design/lienzo/`.
El ingreso, los registros y la invitación arman su pantalla de estado y el paso del código con `auth/components/` (`AuthStatus`, `AuthCodeStep`, `AuthMessage` y `AuthLink`); no se copian por página.
El subdominio de una organización (su página pública) no va acá: va en `areas/storefront/` (E7).
