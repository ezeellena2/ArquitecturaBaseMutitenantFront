# Pantallas de Organizaciones

Leé pantallas-y-ui, paginado-y-listados, responsive y tests; copiá Organizaciones/M-Organizaciones y Organizacion/M-Organizacion vigentes.
Listado por usePagedQuery, banda global/filtros cruzados, lista en Query; ficha con Page/pestañas tabs, canPlatform y acciones por estado. Se coordina sólo versión/estado propios.
Confirmaciones con shared/platform/ReasonDialog, sin cambios visuales propios ni ficha futura; 404/errores comunes, Historial sin total, Dueños con filas disponibles.
Módulos usa catálogo real y se oculta vacío; Dominio/Pública se leen al abrir con manage, sin cantidad en pestañas.
Vida de ficha por id: envoltorio key=id desmonta Query/estado/diálogos/mutaciones al cambiar organización, aunque la otra esté cacheada.
Padre conserva sólo bases de escrituras propias por módulo/dominio/página, cada query sus datos; cambiar pestaña no deja que una lectura ajena sustituya versión respondida.
