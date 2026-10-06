# Cuentas de Plataforma

Leé la ficha backend `docs/features/plataforma.md` y datos/API, paginado, formularios, errores, formatos y permisos; copiá business/users sin imports cruzados.
Lista/invitación copian Cuentas/M-Cuentas aprobados; T22a monta sólo lista, banda global, conteos cruzados y perfiles/métodos reales.
La propia cuenta, PendingDeletion y Deleted no tienen menú; accounts.manage y operators.manage habilitan acciones distintas, accounts.read lo aplica la ruta.
POST de cuenta sólo motivo sin versión, con ReasonDialog/useDialogFailure; 409 de estado relee al cerrar. Baja lee evidencia fresca al abrir/LastAdmin y fecha real tras POST.
Reenviar copia DomainActions: recurso estable, éxito en adaptador, error final MutationCache/meta, useIsMutating y vida antes/después; sin mapas ni cambios comunes.
URL, filtros o destino inválido abandonan diálogos/reintentos; una respuesta tardía no avisa ni afecta otro recorrido.
