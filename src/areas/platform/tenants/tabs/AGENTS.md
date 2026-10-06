# Pestañas de Organización

Leé `docs/rules/paginado-y-listados.md`, `formatos.md`, `responsive.md`, `accesibilidad.md` y `tests.md`.
Copiá Organizacion/M-Organizacion vigentes y los patrones de `CompanyMembersTab` sin importar otra feature.
Historial usa `useCursorList`/`LoadMore`, cuatro columnas y la fila `ListRow` del teléfono; no tiene total ni cantidad en la pestaña. `action` es el texto traducido de Qué pasó; `summary` contiene cambios técnicos y no se muestra.
Dueños salen de la ficha global, con identidad/membresía actuales y último ingreso relativo. Sin Dueño, sólo un `ownerEmail` real permite la fila de contacto pendiente, sin identidad ni membresía inventadas.
Cada lista declara su `mobileRow` con `ListRow`, sin avatar donde el tablero no lo dibuja. Las tres pestañas T21d derivan sus filas de los datos/roles de columnas, sin medidas propias.
Módulos muestra las claves del catálogo real, con `platformTenants:modules.<clave>` y fallback a la clave. No agrega módulos productivos. Prender/Apagar usa Manual sin fin; Extender usa Trial y fecha civil, siempre con motivo/version.
Dominio sólo muestra el TXT pendiente. Verificar es directo; Quitar pide motivo. Página muestra dirección por `publicSiteHost`, fecha real sólo publicada y motivo real sólo bloqueada; Ver página queda oculto hasta E7.
Verificar monta acciones estables por dominio, con instancia idempotente propia. Su éxito vive en el adaptador de operación con guardia de vida; el error se avisa desde la suscripción local de MutationCache sólo en `updated/actionerror` final, por meta organización/dominio y ApiError. Así el polling interno es silencioso y el agotamiento terminal se avisa aun sin observer; no depende de callbacks per-call. `useIsMutating` filtra esa meta para incluir los retries y toda la espera `Request.InProgress`.
Las queries viven en el padre y las bases propias se coordinan por recurso. Dominios y Página pública requieren manage y lectura al abrir; no hay cantidades en sus pestañas ni ⋮ con Closed.
Cada formulario se monta abierto y abandona su operación al cancelar/desmontar; POST usa adaptador idempotente, PUT/DELETE comprueban su vida antes del envío y de aceptar la respuesta.
