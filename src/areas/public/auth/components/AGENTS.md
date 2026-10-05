Controles propios de ingreso y registro. Leé `docs/rules/formularios.md` y `docs/rules/pantallas-y-ui.md`.
Copiá solo controles y estados de los tableros Ingreso y Registro; lo genérico sube a `shared/ui`.
Textos en resources y test junto a cada control.
Una sola pieza por cosa: la pantalla de estado es `AuthStatus`, el paso del código es `AuthCodeStep` y sus mensajes van en `AuthMessage`; un enlace de texto es `AuthLink` y su renglón («¿No tenés cuenta? Creá una»), `AuthLinkRow`; las páginas no copian su marcado.
