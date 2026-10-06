# Organizaciones de Plataforma

Leé la ficha del backend `docs/features/plataforma.md` y las reglas de paginado, formularios, formatos, errores y permisos.
La lista y el alta copian `Organizaciones` y `M-Organizaciones`; la ficha, `Organizacion` y `M-Organizacion` del lienzo vigente.
T21c–d monta banda, Historial por cursor, Dueños actuales/contacto pendiente, Módulos, Dominio y Página pública.
`Provisioning` se muestra como «Falló el alta». Banda global; conteos de filtros cruzados; servidor pagina y ordena.
Las acciones piden motivo con `shared/platform/ReasonDialog`, salvo reintentar el alta (sólo versión) y Verificar dominio (motivo fijo traducido).
La próxima acción toma la versión respondida por la escritura propia; una relectura no la reemplaza. Tras 409, cerrar relee la lista.
La ficha conserva sólo versión/estado propios y descarta un `lastStateChange` incompatible; las fechas y motivos se leen del servidor.
Cada módulo, dominio y página conserva su propia base en el padre `key=id`, también al cambiar de pestaña. PUT/DELETE no llevan clave idempotente; los POST sí.
Módulos se oculta si el catálogo real viene vacío. Dominio y Página pública sólo se leen al abrir su pestaña, con manage, y no muestran cantidades; Ver página se habilita en E7.
