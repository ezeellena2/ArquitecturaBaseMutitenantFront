# Auditoría de organización

Leé la ficha de auditoría y las reglas de paginado y textos traducidos del backend.
La consulta por cursor (`GET /api/organization/audit`) muestra cuándo, qué pasó, dónde y quién; quién puede ser una persona, el Sistema o la Plataforma (`actorKind`), y el filtro «Quién» sale de `GET /api/organization/audit/actors`.
El detalle, en un diálogo de solo lectura con la grilla del tablero, conserva los cambios enmascarados que devuelve la API.
