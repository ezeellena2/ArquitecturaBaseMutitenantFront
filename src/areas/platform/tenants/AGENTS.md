# Organizaciones de Plataforma

Leé la ficha del backend `docs/features/plataforma.md` y las reglas de paginado, formularios, formatos, errores y permisos.
La lista y el alta copian `Organizaciones` y `M-Organizaciones`; la ficha, `Organizacion` y `M-Organizacion` del lienzo vigente.
T21c monta banda, Historial por cursor y Dueños actuales/contacto pendiente. Módulos, Dominio y Página pública siguen pendientes de T21d.
`Provisioning` se muestra como «Falló el alta». Banda global; conteos de filtros cruzados; servidor pagina y ordena.
Las acciones piden motivo con `shared/platform/ReasonDialog`, salvo reintentar el alta, que manda sólo versión.
La próxima acción toma la versión respondida por la escritura propia; una relectura no la reemplaza. Tras 409, cerrar relee la lista.
La ficha conserva sólo versión/estado propios y descarta un `lastStateChange` incompatible; las fechas y motivos se leen del servidor.
