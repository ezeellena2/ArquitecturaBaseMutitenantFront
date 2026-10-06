# Pestañas de Organización

Leé `docs/rules/paginado-y-listados.md`, `formatos.md`, `responsive.md`, `accesibilidad.md` y `tests.md`.
Copiá Organizacion/M-Organizacion vigentes y los patrones de `CompanyMembersTab` sin importar otra feature.
Historial usa `useCursorList`/`LoadMore`, cuatro columnas y la fila `ListRow` del teléfono; no tiene total ni cantidad en la pestaña. `action` es el texto traducido de Qué pasó; `summary` contiene cambios técnicos y no se muestra.
Dueños salen de la ficha global, con identidad/membresía actuales y último ingreso relativo. Sin Dueño, sólo un `ownerEmail` real permite la fila de contacto pendiente, sin identidad ni membresía inventadas.
Cada lista declara su `mobileRow`, sin avatar donde el tablero no lo dibuja. Módulos, Dominio y Página pública se implementan en T21d; no se anticipan sus lecturas.
