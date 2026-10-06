# Listado de Cuentas

Leé pantallas-y-ui, paginado-y-listados, responsive y tests. Copiá Cuentas/M-Cuentas con Page, FilterBar, DataTable, ListRow y Pagination.
usePagedQuery conserva filtros/búsqueda/orden/página en URL; el servidor pagina. La banda usa total global y suspendidas, sin módulos futuros de relleno.
Lista y ficha comparten reglas: Suspender Active/NeedsRecovery; Reactivar Suspended; Cerrar sesiones salvo invitación/PendingDeletion/Deleted.
Motivo con ReasonDialog; revocar invitación confirma sin motivo. GET nuevo fallido no permite usar evidencia cacheada para baja.
Subárbol de acción estable por id y recorrido; navegación/filtros/target inválido desmontan la vida anterior. Retry A después de B o de otro A conserva sus efectos originales.
