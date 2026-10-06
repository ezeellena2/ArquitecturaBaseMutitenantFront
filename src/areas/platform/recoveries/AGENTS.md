# Recuperaciones de Plataforma
Leé ficha backend plataforma y datos/API, paginado, formularios, errores, formatos y permisos del front.
Copiá Recuperaciones/M-Recuperaciones aprobados con UsersPage, DetailGrid y useDialogFailure; sin imports de otra feature.
accountId decide si hay cuenta; métodos tapados del DTO, sin reconstrucción ni habilitar canales nuevos.
POST aprobar/rechazar llevan versión/motivo/Idempotency-Key; versión propia inmediata, un resuelto no vuelve a Revisar.
Vida por pedido/estado/permisos/URL/borrador; error terminal desde MutationCache/meta y busy con useIsMutating.
Motivo obligatorio para ambas acciones; sin cuenta sólo rechazo. AlreadyResolved/concurrencia releen al cerrar.
