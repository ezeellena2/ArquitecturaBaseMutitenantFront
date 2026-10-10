# Cuentas de Plataforma
Leé la ficha backend `docs/features/plataforma.md` y datos/API, paginado, formularios, errores, formatos y permisos; copiá business/users sin imports cruzados.
Lista y ficha copian Cuentas/Cuenta-Plat y sus M aprobados; Page, List, DataTable y grupos son compartidos.
Identidad: nombre, maskedPrimaryPhone recibido, correo y vacío; Phone principal gana al correo de respaldo. Una máscara no pasa por PhoneText; sin nombre conserva el avatar apagado con raya.
La propia cuenta, PendingDeletion y Deleted no tienen menú; accounts.manage y operators.manage habilitan acciones distintas, accounts.read lo aplica la ruta.
POST de cuenta sólo motivo sin versión, con ReasonDialog/useDialogFailure; 409 de estado relee al cerrar. Baja lee evidencia fresca al abrir/LastAdmin y fecha real tras POST.
Reenviar copia DomainActions: recurso estable, éxito en adaptador, error final MutationCache/meta, useIsMutating y vida antes/después; sin mapas ni cambios comunes.
URL, estado, permisos o destino inválido abandonan diálogos/reintentos; ficha por key=id. PUT/DELETE operador adoptan operatorVersion propia, sin reemplazarla por GET.
