# Pestañas de Organización

Leé paginado-y-listados, formatos, responsive, accesibilidad y tests; copiá Organizacion/M-Organizacion y CompanyMembersTab sin imports cruzados. Listas mobileRow/ListRow, sin avatar ausente en tablero ni medidas propias; filas T21d derivadas de datos/roles de columnas.
Historial usa useCursorList/LoadMore, cuatro columnas y ListRow; sin total/cantidad en pestaña. action traducida Qué pasó; summary técnico no se muestra. Dueños actuales de ficha global con ingreso relativo; sin Dueño sólo ownerEmail real permite contacto pendiente sin identidad/membresía inventadas.
Módulos: catálogo real con platformTenants:modules.<clave> y fallback, sin módulos productivos; Prender/Apagar Manual sin fin, Extender Trial/fecha civil, siempre motivo/versión.
Dominio sólo TXT pendiente: Verificar directo, Quitar motivo. Página por publicSiteHost, fecha real sólo publicada, motivo real sólo bloqueada; Ver página oculto hasta E7. Ambas requieren manage, lectura al abrir, sin cantidad ni ⋮ Closed.
Verificar tiene instancia idempotente estable por dominio; éxito en adaptador con guardia de vida, error final por suscripción MutationCache updated/actionerror/meta organización-dominio/ApiError; polling silencioso, agotamiento avisa aun sin observer, sin callbacks per-call. useIsMutating/meta incluye retries y toda espera Request.InProgress.
Queries en padre, bases propias por recurso; formularios sólo abiertos y abandonan al cancelar/desmontar. POST idempotente; PUT/DELETE comprueban vida antes del envío y de aceptar respuesta.
