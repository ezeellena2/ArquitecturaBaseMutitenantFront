# API de Cuentas

Cliente tipado por shared/api/types.ts y schema generado; httpClient y TanStack Query. Leé datos-y-api y errores.
Paged usa búsqueda/orden/página/tipo/estado; filter-counts sólo búsqueda/tipo/estado. Detalle escapa id opaco.
POST suspend/reactivate/revoke-sessions/deletion lleva sólo reason y clave del caller; responde 204, sin versión.
Invitar lleva email/permisos y clave; Reenviar lleva sólo clave, sin cuerpo; Revocar es DELETE sin cuerpo ni clave.
