# Inicio de Plataforma

Compone Inicio mediante el registro neutral `shared/modules`; `PlatformHomeRoute` conserva la entrada anterior cuando no hay contribución.
No importa implementaciones de `modules/` ni agrega permisos: las guardas pertenecen al registro.
`PlatformToResolve` entrega el bloque del núcleo en Bienvenida y Sin configurar. Lee todas las páginas de organizaciones en espera y recuperaciones pendientes sólo con sus permisos existentes, conserva DTOs/orden del back y no importa APIs de otras features. Los métodos tapados se muestran sin reconstruirlos.
Leé [accesos y permisos](../../../../docs/rules/accesos-y-permisos.md) y [pantallas y UI](../../../../docs/rules/pantallas-y-ui.md).
