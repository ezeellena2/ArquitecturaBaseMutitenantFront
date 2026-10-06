# Organizaciones de Plataforma

Leé la ficha backend docs/features/plataforma.md y paginado, formularios, formatos, errores y permisos. Lista/alta copian Organizaciones/M-Organizaciones; ficha, Organizacion/M-Organizacion vigentes.
T21c–d monta banda global, Historial por cursor, Dueños actuales/contacto pendiente, Módulos, Dominio y Pública; filtros cruzados y paginado/orden en servidor. Provisioning dice «Falló el alta».
Las acciones piden motivo con shared/platform/ReasonDialog, salvo reintentar alta (sólo versión) y Verificar dominio (motivo fijo traducido); tras409, cerrar relee lista.
La siguiente acción toma versión de escritura propia, nunca de relectura. Ficha conserva sólo versión/estado propios, descarta lastStateChange incompatible y lee fechas/motivos del servidor.
Cada módulo/dominio/página conserva base propia en padre key=id, también al cambiar pestaña; PUT/DELETE sin clave idempotente, POST con clave.
Módulos se oculta con catálogo vacío; Dominio/Pública se leen al abrir con manage, sin cantidades; Ver página se habilita en E7.
