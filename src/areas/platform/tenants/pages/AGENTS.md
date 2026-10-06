# Pantallas de Organizaciones

Leé `docs/rules/pantallas-y-ui.md`, `docs/rules/paginado-y-listados.md`, `docs/rules/responsive.md` y `docs/rules/tests.md`.
Copiá Organizaciones/M-Organizaciones y Organizacion/M-Organizacion vigentes; listado por `usePagedQuery`, ficha con `Page` y pestañas de `tabs/`, permisos `canPlatform` y acciones por estado.
La banda usa conteos globales, los filtros conteos cruzados. Sólo se coordina versión/estado propios; la lista vive en Query.
Las confirmaciones usan `shared/platform/ReasonDialog`; ningún cambio visual propio ni ficha futura de relleno.
La ficha usa 404/errores comunes, Historial sin total y Dueños con la cantidad de filas disponibles. Módulos usa el catálogo real y se oculta si está vacío; Dominio/Página pública sólo se piden al abrir con manage y sus pestañas no muestran cantidad.
La vida de la ficha pertenece al `id`: el envoltorio de ruta monta su componente local con `key=id`. Cambiar de organización desmonta Query/estado/diálogo/mutaciones anteriores, incluso si la otra ficha ya está cacheada.
El padre conserva únicamente bases de escrituras propias por módulo/dominio/página; cada query sigue siendo dueña de sus datos. Cambiar de pestaña no permite que una lectura ajena sustituya la versión respondida.
