# Lienzo del sistema visual

Copia de la **versión 183** (2026-11-24), la publicada, del lienzo «Sistema visual · Multitenant», que vive en claude.ai como artefacto de tipo Design: <https://claude.ai/artifact/WzoVTM574QGka8nCU4iFEK> (de la cuenta del dueño, compartido por enlace). Tiene 502 tableros vivos `.dc.html` y los 32 del Archivo, que desde la v180 siguen en esta carpeta y en git pero no en el lienzo publicado ni en `canvas.json`; además, `canvas.json` (páginas, posiciones y notas), el motor `support.js`, los recursos de `ds/` y los scripts que los generan, en `generadores/`.

El 2026-10-10 el usuario aprobó corregir localmente, sobre v115, la confirmación y el aviso de revocación de clave propia en `Organizacion.dc.html`: revocar no cambia automáticamente la financiación ni los topes. El tablero móvil sólo contiene la fila y su hoja de acciones, sin esas promesas. Este ajuste de fuente no declara una publicación remota ni una versión nueva del lienzo. La versión 116 lo publica, junto con «Avanzado: datos técnicos» en el diálogo de agregar o editar un modelo del catálogo (`Plat-Asistente-Config` y `M-Plat-Asistente-Config`, D26). La versión 117 suma el segundo factor de los operadores (Etapa 9: bloqueo, recuperación, «Confirmá que sos vos» y «Restablecer el autenticador») y pone al día los tableros de WhatsApp de atención (Etapa 11) con las ADR 0043 a 0049, con `generadores/alineamiento_v117_1004.py`. La versión 118 completa «Avanzado: datos técnicos» del catálogo de modelos con los campos del contrato del back (`853b5aed`): capacidades, esfuerzos permitidos, caché de 5 minutos y de 1 hora, y contexto largo con su caché. La versión 119 saca del resumen de `Asistente-Uso-Org` la clave en uso y las consultas por persona por día, que pueden cambiar a mitad de mes y se ven en Configuración. La versión 120 pone un tope a «Para resolver»: cada tipo de pendiente en su grupo, con su total, hasta 10 filas y «Ver todos» hacia el listado filtrado (`generadores/para_resolver_v120_1004.py`). La versión 121 pasa «Decisiones por pantalla» a tres columnas, para que quede debajo de los 8000 de alto que el lienzo admite. La versión 122 dibuja la Etapa 12, Formularios por WhatsApp: la página «Organización · Formularios» con 10 tableros de compu y 5 de teléfono (listado, nuevo, ficha con Preguntas, Inglés y Publicación, pregunta, prefijo, publicar, y mandar y recibir un formulario en un chat de Internos), y suma «Formularios» al menú de la organización, sus 5 permisos en Rol y el módulo en la ficha de una organización (`generadores/formularios_1004.py` y `generadores/formularios_ajustes_1004.py`). La versión 123 publica la regla única de secciones, pestañas y filtros en todo el lienzo y la Etapa 13 en curso, tal como las dejó Diseño (`f2f8e5bb`), y deja los tableros de la Etapa 11 sin contradicciones con las decisiones D1 a D9 del plan y con los estados que faltaban (`generadores/etapa11_1004.py`):
- números con el contador siempre, sin medio de pago, el tope pasado, desconectar y «A quién atiende»;
- chats con Internos, adjuntos como «Mandó…», el chat que atiende o tomó otra persona, el número desconectado y sin medio de pago, y las plantillas en revisión o rechazadas apagadas con su motivo;
- el bot con «Configuración | Recorrido» segmentado, sin «Activo» ni interruptores en las respuestas automáticas (D9), y con sus diálogos;
- equipos con «No avisar», contactos (editar, sin vínculo, importar con filas que no entran), difusiones (programar con la zona, cancelar, «Por qué no llegó»);
- «Mensajes» de la persona, «Cargar teléfonos» en dos pasos, las invitaciones por teléfono en Usuarios, los permisos de WhatsApp de un operador, los mensajes del bot que ofrece vincular y el correo «Consultas esperando».

La versión 124:
- suma a los tableros de la Etapa 11 los estados que el front ya programó, copiados de la app, con sus formatos (teléfonos en formato nacional, horas «09:00 a 18:00», fecha corta en la lista de chats) y las decisiones de la puerta: solo plantillas aprobadas al elegir, «Crear «VIP»» en las etiquetas y «Quitar opción» en el teléfono (`generadores/etapa11_tanda_a_1004.py` y `generadores/etapa11_tanda_b_1004.py`, que corren después de `etapa11_1004.py`);
- completa la Etapa 13, Catálogos, en la compu y el teléfono: listado, nuevo, ficha a mano, opción, ficha con filtros, la pregunta «Elegir de un catálogo», los avisos al mandar, la respuesta con catálogo y los dos permisos en Rol (`generadores/formularios_catalogos_1004.py`);
- escribe en Criterio · Menús la regla de las opciones apagadas y las cuatro formas de secciones, pestañas y filtros;
- abre la página «Plataforma · Formularios» de la Etapa 17 con la biblioteca y «Nueva plantilla» (`generadores/formularios_biblioteca_1004.py`);
- vacía la página «Archivo» (`generadores/vaciar_archivo_1004.py`).

La versión 125 dibuja el «Para Diseño» de la Etapa 9 con las decisiones del usuario del 16/10:
- «Confirmá que sos vos» con código de recuperación, su error, el bloqueo y cancelar, que vuelve al formulario (Cuenta-Plat); en Recuperaciones y Documentos legales reemplaza al diálogo de la acción (`generadores/etapa9_reauth_1004.py` y `generadores/etapa9_otras_1004.py`);
- los doce límites de uso como una sección más de Configuración, con motivo, «Confirmá que sos vos» y otra persona que cambió (`generadores/etapa9_limites_1004.py`);
- el aviso al llegar a un límite, como el del ingreso, en el Asistente, al guardar un rol y en Usuarios (`generadores/etapa9_aviso_limite_1004.py`);
- los eventos nuevos del autenticador en Auditoría (`generadores/etapa9_auditoria_1004.py`) y «Inactivar» apagado con su motivo en Roles (`generadores/etapa9_roles_inactivar_1004.py`);
- el texto del mensaje de WhatsApp que no se pudo mandar, como el del back.

La versión 126 completa la Etapa 17, la biblioteca de formularios, con las decisiones del usuario del 16/10 y el 17/10 (`generadores/formularios_biblioteca_1004.py`):
- en Plataforma, la ficha de una plantilla con Preguntas, Inglés, Catálogos (una fila por catálogo) y Publicación, «Retirar» en el ⋮, publicar con la comprobación, retirar y las categorías con su orden y motivo («Borrar» apagado si está en uso);
- en la organización, «Nuevo formulario» con «Desde cero» y «Desde una plantilla», la biblioteca en tarjetas, la vista de una plantilla y «Usar esta plantilla» con el prefijo propuesto;
- los teléfonos de la biblioteca y de una plantilla, y la biblioteca de Plataforma solo para ver;
- el permiso «Administrar la biblioteca de formularios» en Cuenta-Plat (`generadores/formularios_permiso_plat_1004.py`).

La versión 127 deja «Editar contacto» como la app: el nombre es opcional y «Guardar cambios» va apagado hasta que se cambia algo, en WA-Contacto y M-WA-Contacto (`generadores/etapa11_contacto_1004.py`, que corre después de `etapa11_tanda_b_1004.py`).

La versión 128 rehace la Etapa 12 con la disposición del lienzo «Formularios por WhatsApp» de ArquitecturaBase, aprobada por el usuario el 17/10 (`generadores/formularios_ab_1004.py`, que corre después de los demás generadores de Formularios):
- «Diseñar formularios» con la tabla de allá (Formulario, Preguntas, En WhatsApp, Último cambio); el nombre abre el editor;
- el editor en una sola pantalla (`FRM-Editor`), con «Textos en» (solo el idioma original es obligatorio), las preguntas que se abren en el lugar y «Así lo ve el empleado»; reemplaza a la ficha, Inglés, la pregunta, el prefijo y el nuevo formulario;
- publicar (`FRM-Publicar`) y cómo termina una publicación, con sus pasos y la vista oficial (`FRM-Publicando`);
- enviar un formulario desde un chat de Internos y la respuesta, y los cuatro teléfonos (`M-FRM-Editor` nuevo);
- lo reemplazado pasa al Archivo: los tableros del 13/10 con su nombre y, de los rehechos con el mismo nombre, una copia «-v127»; `formularios_1004.py` queda como biblioteca de piezas y ya no los escribe. Donde la disposición chocaba con una regla del lienzo, mandó la del lienzo (Criterio · Decisiones por pantalla).

La versión 129, aprobada por el usuario el 17/10, trae dos cosas:
- la Etapa 13 rehecha con la disposición de ArquitecturaBase (`generadores/formularios_ab_catalogos_1004.py`, que corre después de `formularios_ab_1004.py`):
  - Catálogos con «Origen ▾» y «Estado ▾»;
  - «Nuevo catálogo», que pregunta solo de dónde salen las opciones;
  - el editor escrito a mano en una sola pantalla, con las opciones que se abren en el lugar;
  - el editor con filtros, con «Como si lo recibiera» (lo de más de 200 opciones se corrigió en la 130);
  - la pregunta «Elegir de un catálogo» en el editor de formularios, y las opciones por pregunta al mandar y al responder;
  - los teléfonos;
  - lo del 13 y 14/10 pasa al Archivo, con copias «-v128»;
- los índices: la página «Mapa general» pasa a «Índice y mapas», con un índice general y uno por área, que siguen los capítulos de la guía (`generadores/indices_1004.py`).

La versión 130, aprobada por el usuario el 18/10, trae cuatro cosas:
- la Etapa 13 corregida según las decisiones 21 y 22: con más de 200 opciones, el catálogo se guarda con un aviso de que no se va a poder mandar, y los nombres largos se cortan en la lista y se ven completos en el detalle;
- la plantilla de Plataforma (Etapa 17) usa el editor de la Etapa 12: la pestaña «Plantilla» reemplaza a «Preguntas» e «Inglés», y con cambios ofrece Descartar, Guardar borrador y Publicar (`generadores/formularios_ab_biblioteca_1004.py`);
- la Etapa 14 con la disposición de ArquitecturaBase (`generadores/formularios_ab_archivos_1004.py`): las preguntas «Foto» y «Documento» con «Archivos: hasta N de 10», «Más de 10 archivos» al publicar, la respuesta con miniaturas y documentos (bajando, reintentando y rechazada con «Mandar de nuevo») y el visor nuevo (`WA-Chats-Visor`, `M-WA-Chats-Visor`);
- lo que no coincidía con la app en el fondo de los tableros de la Etapa 9 (`generadores/alineamiento_e9_app_1004.py`, que corre al final): los permisos del asistente en la cuenta de un operador, Configuración de Plataforma con una tarjeta por sección, ⚠ en las bandas del límite y de conflicto, publicar un documento legal, subtítulos y recuadros del teléfono, el asistente sin ⚡, «Confirmá que sos vos» con ✕ y el ⋮ de una fila que abre hacia abajo.

La versión 131, aprobada por el usuario el 18/10, trae la Etapa 15 con la disposición de ArquitecturaBase (`generadores/formularios_ab_planilla_1004.py`, que corre después de `formularios_ab_archivos_1004.py`):
- «Respuestas» como grupo del panel de Formularios, con un enlace por formulario publicado; en el teléfono, Más › Formularios › Respuestas;
- la planilla (`FRM-Respuestas`) con «Empresa ▾» y la columna «Empresas» (decisión 24), «Columnas» y sus casos;
- «Más filtros» en un panel al costado (`FRM-Respuestas-Filtros`);
- una respuesta al costado de la planilla, D2 (`FRM-Respuesta`);
- exportar a Excel (`FRM-Respuestas-Exportar`);
- los dos teléfonos (`M-FRM-Respuestas`, `M-FRM-Respuesta`) y el recorrido «Revisar las respuestas y exportarlas».

La versión 132, aprobada por el usuario el 18/10, trae la Etapa 16 con la disposición de ArquitecturaBase (`generadores/formularios_ab_reglas_1004.py`, que corre después de `formularios_ab_planilla_1004.py`):
- «Cuando llega una respuesta» en el editor (`FRM-Editor-Reglas`, el editor más abajo), con las reglas en palabras, su «Guardar reglas» y el historial;
- el diseño del PDF (`FRM-Pdf`), con la vista previa en los dos idiomas;
- «Por aprobar» (`FRM-Por-Aprobar`), en el panel de Formularios y en «Para resolver» del inicio;
- decidir, la actividad y el PDF en el detalle al costado, con la columna Estado en la planilla (`FRM-Respuesta-Aprobacion`);
- los avisos automáticos en el chat (`WA-Chats-Avisos`);
- los teléfonos (`M-FRM-Reglas`, `M-FRM-Por-Aprobar`, `M-FRM-Respuesta-Aprobacion`, `M-WA-Conversacion-Avisos`), «Por aprobar» en Más › Formularios y el enlace a las reglas en el editor del teléfono;
- los recorridos «Aprobar o rechazar una respuesta» y «Armar las reglas y el PDF».

La versión 133, aprobada por el usuario el 18/10, trae el asistente de formularios con la disposición de ArquitecturaBase (`generadores/formularios_ab_asistente_1004.py`, que corre después de `formularios_ab_reglas_1004.py`). Se diseña ahora y se programa después del bloque (decisión 19):
- el modo Asistente en un chat de Internos, con sus límites (`WA-Chats-Asistente`), la sugerencia en atención manual (`WA-Chats-Sugerencia`) y los audios (`WA-Chats-Audio`);
- el catálogo propuesto (`FRM-Catalogo-Propuesta`) y «Formularios que faltan» (`FRM-Faltan`), con su entrada en el panel y en Más › Formularios;
- «Cuándo lo ofrece el asistente» (`FRM-Editor-Asistente`) y «Qué sugerir después» (`FRM-Editor-Sugerencias`) en el editor;
- de dónde vino una respuesta y la cadena (`FRM-Respuesta-Cadena`);
- los teléfonos (`M-WA-Conversacion-Asistente`, `M-FRM-Faltan`) y el recorrido «El asistente atiende un chat».

La versión 134, aprobada por el usuario el 20/10, trae las reglas de ejemplo y el diseño del PDF de una plantilla de la Etapa 17, con las decisiones 30 a 33 de la hoja de ruta (`generadores/formularios_ab_ejemplos_1004.py`, que corre después de `formularios_ab_asistente_1004.py`):
- en Plataforma, la sección «Cuando llega una respuesta» de la E16 debajo de las preguntas de la plantilla, guardada con el borrador, con «Lo elige cada organización» y «Rol sugerido» en las acciones que piden un rol (`Plat-FRM-Plantilla-Reglas`), y el diseño del PDF de la plantilla (`Plat-FRM-Pdf`); publicar comprueba también las reglas;
- en la organización, al usar una plantilla, las reglas precargadas y sin guardar, con «Elegí el rol», una pregunta borrada marcada y la revisión 1 al guardar (`FRM-Editor-Reglas-Plantilla`, `M-FRM-Reglas-Plantilla`), y las reglas de ejemplo en palabras en la vista de una plantilla (`FRM-Plantilla`, `M-FRM-Plantilla`);
- el recorrido «Usar una plantilla» sigue hasta guardar las reglas.

Además saca de `WA-Chats-Audio` el estado «Ya no está» (los audios se guardan mientras exista el contacto: D4 de la E11).

La versión 135, aprobada por el usuario el 20/10, trae «Exportar mis datos» de la Etapa 10 en Mi cuenta (`generadores/exportar_datos_1004.py`, el «Para Diseño» del plan de la 10 del back): un Tweak «exportar» en `Cuenta` y once estados en `M-Cuenta` (pidiendo, pedido recibido, sin conexión, demasiados pedidos, sin correo verificado y su motivo, y desde el enlace del correo: descargando, descargado, vencido, pedido con otra cuenta y no se pudo descargar), con el recorrido «Pedir mis datos». Sin pantalla nueva ni historial; el correo de Mensajes no cambia.

La versión 136, aprobada por el usuario el 20/10, ordena los menús de ficha y los datos de solo lectura, a pedido del Coordinador de la 9 (`generadores/menus_y_solo_lectura_1004.py`, que corre al final de todo):
- en el teléfono, el ⋮ de la barra de una ficha o de una lista abre una hoja desde abajo con el nombre de la ficha, como el de una fila (Criterio · Menús): pasan a hoja los seis desplegables que había y se dibuja abierto en `M-Usuario`, `M-WA-Difusion-Resultados` y `M-WA-Conversacion`;
- en la compu, cada opción de un ⋮ lleva su ícono gris, el mismo para la misma acción, en los diez tableros que no lo tenían;
- A11: el Proveedor de un modelo, el teléfono al editar un contacto y la bandeja al editar un equipo pasan a campo apagado, y Configuración suma su estado de solo lectura (Tweak «permiso» y estado en `M-Configuracion`).

La versión 137, aprobada por el usuario el 24/10, pasa al lienzo el flujo de botones y avisos que decidió el usuario ese día (`generadores/botones_sin_explicar_1004.py`, que corre al final de todo): un botón está habilitado o grisado, sin textos al lado ni debajo; la banda no dice «Cambios sin guardar»; el botón que trabaja o espera queda grisado con su mismo texto, sin «Guardando…» ni la cuenta «Reintentá en…», que pasa al aviso de error. Lo cambian Criterio · Botones, Criterio · Marco, Criterio · Decisiones, este README y los tableros del sistema; los de formularios cambian con su etapa, y «Reenviar en 30 s» queda hasta que el usuario decida.

La versión 138, aprobada por el usuario el 24/10, pone la navegación de formularios como en ArquitecturaBase (decisión 34) y la opción de menú apagada de la decisión 43 (`generadores/gestion_formularios_1004.py`, que corre al final de todo, después de `botones_sin_explicar_1004.py`):
- el menú principal dice «Gestión de formularios»; su panel tiene Formularios (con lo que espera tu decisión), Diseñar formularios, Catálogos y Formularios que faltan, en todos los tableros y en Más del teléfono, con las migas «Inicio / Gestión de formularios / …»;
- «Formularios» (`FRM-Formularios`, nuevo) es la lista MF1: una fila por formulario publicado con Por aprobar, Respuestas y Última respuesta, «Activos | Dados de baja» como dos vistas y «Aprobación ▾» en la caja de filtros, con los estados de quien solo ve respuestas, quien solo aprueba y sin permiso; en el teléfono, `M-FRM-Respuestas`;
- al entrar en un formulario, «Por aprobar · 3» va arriba de la planilla con «Revisar», y la ← vuelve a Formularios; la bandeja «Por aprobar» (`FRM-Por-Aprobar` y `M-FRM-Por-Aprobar`) pasa al Archivo;
- «Inactivar» en el ⋮ de un rol con usuarios queda solo grisado, con el motivo en su tooltip, y Criterio · Menús lo dice; las opciones de formularios cambian con su etapa.

La versión 139, aprobada por el usuario el 24/10, redibuja la Etapa 12 con las decisiones 34 a 50 y el texto para Diseño de su spec (`generadores/formularios_e12_sin_idioma_1004.py`, que corre después de `gestion_formularios_1004.py` y rearma los tableros con las piezas de `formularios_ab_1004.py`):
- el contenido no tiene idioma (35): sin «Textos en», sin pares en inglés ni avisos de traducción, y el diálogo de enviar no dice en qué idioma le llega;
- «elegir varias» es un tipo de pregunta (38), con Mínimo y Máximo y casillas con «Elegí hasta 3» en la vista previa; «Elegir de una lista» pasa a «Elegir una»;
- los botones del 24/10 (43): «Guardar cambios» con cambios, «Publicar en WhatsApp» grisado con cambios sin guardar y el motivo en su tooltip, grisado con su mismo texto mientras trabaja, sin «Guardado sin confirmar», «Consultar guardado», «Consultar envío» ni «La comprobación venció»; «Ya lo revisé» abre «Resolver el envío»;
- «Para quién es» en el editor (50) y enviar un formulario desde un chat de Clientes (49), en `WA-Chats-Formulario-Cliente` y `M-WA-Chats-Formulario-Cliente`, nuevos;
- la vista previa se llama «Así lo ve quien lo recibe» en todos los tableros.

La versión 140, aprobada por el usuario el 25/10, dibuja la Etapa 12b y la campana:
- la Etapa 12b, ciclo de vida (`generadores/formularios_e12b_ciclo_de_vida_1004.py`, que corre después de `formularios_e12_sin_idioma_1004.py`): «Activos | Dados de baja» y un ⋮ por fila en la lista de formularios, dar de baja, reactivar, eliminar y copiar, y el editor de un dado de baja, en `FRM-Editor-Baja`, `FRM-Dar-De-Baja`, `FRM-Reactivar-Eliminar`, `FRM-Copiar` y `M-FRM-Editor-Baja`, nuevos;
- la regla de avisos del 25/10 (`docs/rules/pantallas-y-ui.md`): cada aviso en un solo lugar, y lo que llegó, lo que falló en segundo plano y lo que espera a alguien, en la campana del encabezado, con su número (`generadores/campana_1004.py`, que corre al final de todo). La campana va en el encabezado de todos los tableros con sesión de la compu y en la barra de arriba de las pantallas principales del teléfono; la lista abierta, en `Campana` y `M-Campana`, nuevos. Lo cambian Criterio · Avisos y Criterio · Decisiones, y los carteles del cuerpo de la Etapa 12 y la 12b pasan a la banda con su ⓘ; los demás tableros pasan a la regla cuando les toca su etapa.

La versión 141, aprobada por el usuario el 25/10, dibuja los formularios por etapa, con el orden nuevo (decisiones 78 a 82; 12 Catálogos … 25 Documentos):
- un tablero por etapa (elección del usuario del 25/10): cada tablero muestra solo lo que existe hasta su etapa, y cuando una pantalla cambia después, esa versión es otro tablero, con la etapa en el nombre (`FRM-Formularios-15`, `FRM-Catalogos-14`); la página «Organización · Formularios» va en filas, una por etapa, y el panel de «Gestión de formularios» de cada tablero es el de su etapa (`generadores/formularios_etapas_1004.py`);
- sale «Diseñar formularios» (79): una sola lista «Formularios», con su versión de la 14, la 15, la 17, la 21 y la 22, y cada formulario con sus pestañas; `FRM-Listado` y `M-FRM-Listado` pasan al Archivo (`generadores/formularios_lista_y_ficha_1004.py`);
- la Etapa 12, catálogos (`generadores/formularios_12_catalogos_1004.py`): el catálogo a mano como CA1-A, importar y pegar (CA2), el tipo de valor (CA3) y los contactos de WhatsApp (55), en `FRM-Catalogo-Importar`, `FRM-Catalogo-Tipo` y `FRM-Catalogo-Contactos`, nuevos; sin «Textos en» ni «Cambios sin guardar», y con el origen y el tipo de valor como la A11;
- la Etapa 14, formularios (`generadores/formularios_14_formularios_1004.py`): la pregunta de catálogo con «Permitir elegir varias» y la presentación propia (CA4), «Un catálogo demasiado grande» al publicar, los avisos de la oferta al mandar y la tarjeta de «Mis mensajes» (`WA-Mensajes-14` y `M-WA-Mensaje-14`); lo de la 17 y la 18 sale de sus tableros, y lo de la 18 queda en `FRM-Editor-18`, `FRM-Publicar-18` y las respuestas `-18`;
- la 80: sin «Envío sin confirmar», «Ya lo revisé» ni «Resolver el envío»; Criterio · Decisiones suma las filas de la 78 a la 82 y pasa a cinco columnas.

La versión 142, aprobada por el usuario el 25/10, aplica sus pedidos de ese día, que pasó la Guía (`generadores/reglas_25_10_1004.py`, que corre después de `formularios_14_formularios_1004.py`, y los generadores de la 12 y la 14):
- un dato por celda, en un renglón (front 4fdcab2b): lo que aclaraba una celda va en su propia columna o no va; Criterio · Tablas y listas suma Correo y Vencimiento, y las listas de Catálogos y Formularios pierden la segunda línea;
- las fechas, completas, con año y hora, en la zona de quien mira (formatos.md, d7644064): nunca «hoy», «ayer» ni «hace…»; en los tableros de la 12 y la 14, también en los chats;
- el teléfono de la vista previa va sin rótulo, en todo el lienzo; el catálogo, como la maqueta (52505a0 y cde670e): el nombre y el tipo en una fila, de dónde salen en la banda y sin «Una opción | Varias»;
- «Dados de baja» es una opción del filtro Estado desde la 17, sin la vista «Activos | Dados de baja»;
- los tableros de las etapas cerradas pasan a estas reglas en la base de la 12. El lienzo no se achica al 85 % de la maqueta (el usuario, 25/10).

La versión 143, aprobada por el usuario el 25/10, suma lo que siguió ese día, por la Guía y la maqueta:
- la Etapa 13, campos de los catálogos (`generadores/formularios_13_campos_1004.py`): `FRM-Catalogo-13` y `M-FRM-Catalogo-13`, nuevos, con «Proveedores» (CUIT y Zona), la tabla de campos que se edita ahí mismo (forma B: Campo, Tipo, Obligatorio, Único, Límite y ⋮) y la tabla de opciones con una columna por campo, grisada hasta guardar si el campo es nuevo. Se dibuja a 1280 con el panel abierto;
- las tablas de un catálogo no se aplastan (maqueta a1303a5 y af5eceb): cada columna con su ancho mínimo y, si no entran, se desplazan a lo ancho, con la casilla, el número y «Texto» (o «Campo») fijos a la izquierda y el ⋮ fijo a la derecha, cada uno con su línea;
- la columna ordenada muestra ▲; en las listas de Formularios, la última respuesta va con su número y la hora en «Recibida»;
- «Persona», con su rótulo: en los catálogos de los miembros es obligatoria y, sin ella, «Crear catálogo» marca el campo; en los de los contactos es opcional, con «Ninguna». Con más de 200 opciones, el teléfono termina con «y N opciones más», sin texto debajo (maqueta 52e4ce2 y c131368);
- la versión nueva del sistema se avisa en la campana, primera y sin leer; tocarla recarga la página, y sale de Avisos (maqueta 6691dff);
- «Dar de baja» y «Reactivar» en todo el sistema (front 744e3931), con el estado «De baja» y el filtro «Dados de baja», en todos los tableros vigentes (`generadores/reglas_25_10_1004.py`); salen «Deshabilitar», «Habilitar», «Inactivar», «Activar» e «Inactivo».

La versión 144, aprobada por el usuario el 26/10, suma:
- «Otro acceso» (opción A, front 744e3931): un link del otro acceso ofrece entrar con ese acceso, dentro del marco y con la forma de «No encontramos esta página»; con varias organizaciones, se elige con cuál. `Otro-Acceso` y `Otro-Acceso-Persona`, con sus teléfonos, en la página Ingreso (`generadores/otro_acceso_1004.py`);
- borrar la cuenta propia (front 87609fd0): «Borrar mi cuenta», el estado «Por borrar» y «Se borra el …» con fecha y hora; en Plataforma, «¿Borrar la cuenta de …?». Los miembros de una empresa, con «Dar de baja» y «Reactivar»;
- «Borrar» y «Borrado» para borrar para siempre, nunca «Eliminar» (front 75663922): el ⋮ de un formulario y una cuenta ya borrada («Borrada el …»). Todo en `reglas_25_10_1004.py`;
- Criterio · Decisiones a 6900 de alto: la columna más alta ya medía 6763.

La versión 145, del 26/10, suma los pedidos de ese día sobre la ficha de un catálogo (front 29451ed6), por la Guía:
- el encabezado de una sección lleva su título y, a la derecha, solo su acción y un ⋮; nunca cantidades. Salen «4 opciones · 3 activas», «2 campos», «7 preguntas», «Archivos: hasta 5 de 10» (va en el ⓘ de «Cuántas») y el «N de M» de los grupos de permisos de un rol, en la compu y en el teléfono (`reglas_25_10_1004.py` y los generadores de la 12 y la 13);
- «Opciones» lleva «+ Agregar opción» y el ⋮ con Pegar desde Excel, Importar, Exportar, Descargar la plantilla, Ordenar de la A a la Z y Generar los códigos que faltan; en el teléfono, la acción de cada sección va entera;
- «En WhatsApp» del catálogo (CE3), la opción C que eligió el usuario: Título y Descripción con desplegables por renglón, en `FRM-Catalogo-13` y su teléfono;
- «Bajas pedidas» pasa a «Cuentas por borrar» en «Para resolver».

La versión 146, aprobada por el usuario el 1/11, termina el bloque 0 del plan de diseño del 27/10: los tableros de las etapas cerradas pasan a las reglas del 25 y el 26/10, copiando la maqueta (`generadores/bloque0_*_1004.py`, que se pueden volver a correr):
- un dato por celda, las listas cortas en un renglón y las fechas completas, en Organización, Plataforma y WhatsApp;
- sin carteles en el cuerpo: el estado va en la banda, y lo que espera a alguien, en la campana (`M-Campana-Personal`, nuevo);
- en Chats, el buscador y los filtros en una fila, y un contacto sin nombre toma el de su perfil de WhatsApp;
- en la ficha de un contacto, un ⓘ con de dónde salió el consentimiento, que la maqueta todavía no tiene.

Once tableros de chats de etapas posteriores siguen con la barra vieja: se pasan con su etapa.

La versión 147 dibuja los textos para Diseño de la 13 y la 14, con los títulos de sección (88). Los tableros de una etapa muestran solo lo que existe hasta ella (78):
- `FRM-Catalogo-13`: un valor de una opción dada de baja, solo lectura y un título que no entra, también en el teléfono;
- `FRM-Catalogos` y `FRM-Catalogos-14`: el filtro «Estado» dice «Activos» y «Dados de baja»;
- nuevos: `FRM-Catalogo-14` y su teléfono, con «Lo usan», `M-FRM-Catalogo-Contactos`, y las campanas `Campana-14`, `M-Campana-14`, `Campana-Plat` y `M-Campana-Plat`;
- la campana: cada acceso ve sus avisos, `Campana` se abre sobre Usuarios y el número es el de lo que lista: 1 en una organización y 2 en Plataforma y en la 14. Los teléfonos de Plataforma la suman en la barra de sus pantallas principales;
- `FRM-Publicar`: sin número conectado, una cuenta sin el formulario y un título sin preguntas; `FRM-Publicando`: «Salió» y «No salió» en «Necesita revisión»; `M-FRM-Editor`: «Sin confirmar» y «Necesita revisión», con su hoja;
- `FRM-Editor` y su teléfono: los títulos de sección;
- los chats de enviar un formulario y de la respuesta: la barra y las fechas de `WA-Chats`, y un formulario que no está publicado para ese número (103). «Mis mensajes» de la 14 toma las fechas de `WA-Mensajes`.

La versión 148, del 2/11, suma lo que el usuario adoptó del traspaso 4 de ArquitecturaBase (decisiones 109 a 122), sobre la 147:
- los tableros «Criterio» (`generadores/reglas_2_11_1004.py`): sin leyendas, la (i) con tooltip y la ⓘ para lo que no se puede hacer; el botón que trabaja con el aro y su gerundio, con su color; la confirmación abierta hasta la respuesta, y la tabla que vuelve a leer. En el teléfono, la (i) abre una hoja chica y lo apagado avisa en la franja. Los tableros de las etapas cerradas cambian en la base de la 12: hasta entonces manda `Criterio-Botones`;
- los tableros «Criterio» (`generadores/reglas_3_11_1004.py`), con lo que se adoptó del traspaso 5 de ArquitecturaBase: la línea entre columnas y los números a la derecha; las lecturas en pasos, en dos columnas y lado a lado; lo elegido relleno, con su borde, su tilde o su barra; los filtros de opciones sin cantidades y un solo «Filtros» con chips, y las zonas plegadas de una pregunta de catálogo. Las etapas lo toman cuando se redibujan;
- la 12: `FRM-Catalogo-Opciones` y su teléfono, nuevos, con las opciones en un modal; `FRM-Catalogo` sin la fila vacía ni «Pegar desde Excel»; `FRM-Catalogo-Importar` con «Origen» y «Revisión» a la vista y la grilla de pegar;
- la 13: el catálogo de un campo en un combo, y `FRM-Catalogo-Opciones-13` y su teléfono, nuevos;
- la 14: `FRM-Publicar` por zonas, con el límite en concreto; el combo en la pregunta, y «Consultando…» en `FRM-Publicando`.

La versión 149, del 2/11, redibuja la 15 con `generadores/formularios_15_respuestas_1004.py`:
- la planilla sin fotos ni remito, con Canal en su columna, un cliente con su marca, «Persona sin información», «Elegir varias», los campos sellados y la tabla que vuelve a leer;
- «Más filtros» con «Fallas» y «Contando…»; exportar con «Exportando…» y el diálogo abierto hasta la respuesta;
- la vista rápida con «Abrir en pantalla completa», y `FRM-Respuesta-Completa` y `M-FRM-Formularios-15`, nuevos. `M-FRM-Respuesta` es la pantalla completa en el teléfono;
- `FRM-Tablero` sin «Por estado», y la lista de quien solo ve formularios, sin las columnas de respuestas.

La versión 150, del 2/11, suma la 16 con `generadores/formularios_16_personas_1004.py`: `FRM-Datos-Personas`, en Administración; la ficha con la pestaña «Datos»; el papel de un campo, en el modal de campos; «Qué opciones ve cada persona» en la pregunta; la zona «Avisos» al publicar; lo que no se puede mandar, con su motivo, y la subcolumna de un filtro apagada en la planilla. Además, sigue el armado real de `../ArquitecturaBaseFront` en las etapas 12 a 16 (decisiones 125 a 130 de la hoja de ruta): el catálogo con «Opciones» a todo el ancho y «Agregar campos · N», el modal nuevo `FRM-Catalogo-Campos`, «En WhatsApp» con chips, ↑ ↓ ✎ 🗑 a la vista en opciones, preguntas y campos, «Publicar» en cajas, y la planilla, «Más filtros», exportar y «Datos de las personas» como allá. La E12 no muestra «En WhatsApp» ni «Agregar campos», que llegan con la 13 (78).

La versión 151, del 2/11, alinea la 17 con el front real de ArquitecturaBase: reactivar se abre en el formulario, con las zonas de «Publicar»; borrar suma un publicado y el error; «Dar de baja» queda sin lo de etapas posteriores, y con respuestas «Borrar» queda grisado.

La versión 152, del 2/11, suma la 18 con `generadores/formularios_18_archivos_1004.py`: la planilla con las columnas de archivos, la vista rápida con «Fotos», la pantalla completa con «Descargar», dar de baja y los archivos del chat, que allá no existen. Las preguntas de foto y documento y el visor siguen el front real de ArquitecturaBase.

La versión 153, del 2/11, suma la 19 con `generadores/formularios_19_logica_1004.py`: «Mostrar si», la pregunta «Cálculo» y el grupo de líneas en el editor, y lo que suman a publicar, la planilla, la respuesta, el chat y el tablero, con el ejemplo «Pedido de materiales».

La versión 154, del 2/11, suma la 20 con `generadores/formularios_20_carga_1004.py`: la lista con «Cargar», la página y el panel de «Nueva respuesta», las listas de catálogo, los archivos, «Enviada», la planilla con «App», lo propio, «Según otra respuesta» y publicar solo para la app, con el front real de ArquitecturaBase como modelo.

La versión 155, del 3/11, suma la 21 con `generadores/formularios_21_reglas_1004.py` y `generadores/formularios_21_respuestas_1004.py`: las reglas como pestaña, con «Adjuntar el PDF» y su historial; el diseño del PDF con tres estilos; aprobar con confirmación, la cola desde la campana y quien solo aprueba; la planilla con «Estado» y el tablero con «Por estado»; corregir y anular; lo propio; la pregunta «Correo»; los avisos en el chat y lo que se conserva al dar de baja, con el front real de ArquitecturaBase como modelo.

La versión 156, del 3/11, redibuja la 22 con `generadores/formularios_22_biblioteca_1004.py`: en Plataforma, la biblioteca con su caja de filtros, la plantilla con el editor de la 14 y, debajo, las reglas de la 21 con candado en lo que elige cada organización, el diseño del PDF con marcadores, publicar con la comprobación, retirar y las categorías con ↑ ↓ ✎ 🗑; en la organización, la lista con «Nuevo formulario ▾», la biblioteca por categoría, la vista de una plantilla, usarla y sus reglas por completar. En ArquitecturaBase no hay biblioteca: el modelo son esas piezas, ya alineadas.

La versión 157, del 3/11, dibuja la 23 con `generadores/formularios_23_asistente_1004.py` y `generadores/formularios_23_chats_1004.py`: la pantalla «Asistente» de WhatsApp, como el editor de un formulario (elegido por el usuario), con Perfil, Conocimiento, Casos, Límites y Atención, un solo Guardar y «Probar» al costado; los casos en el chat de Clientes, con «Por qué respondió esto», «Necesita una persona», la ráfaga y el borrador; las preguntas sin respuesta; «Cuándo lo ofrece», la pestaña «Sugerencias» y «Armar desde un texto» en el formulario; el catálogo «Por aprobar»; lo que deja de pasar al dar de baja; de dónde vino una respuesta, y los máximos de Plataforma. Los chats, los audios, las sugerencias y el conocimiento siguen al front real de ArquitecturaBase.

**Lienzo aparte: «Módulos y suscripciones»**: <https://claude.ai/artifact/TWmqhEkZ3KmLr2pRXgr4HR>, privado del dueño. Son los tableros de la etapa «Módulos y suscripciones» (ADR 0069 del back; spec `docs/plans/formularios/modulos-y-suscripciones.md`), que va después de la E25. Se dibujaron para aprobar el 23/11, en la versión 2 del artefacto, aparte porque el principal quedó en 507 de los 512 archivos que admite una versión, y son 25. El usuario los aprobó el 24/11 («Aprobados los tableros de Módulos») y eligió que se queden en su lienzo («En su lienzo aparte»). Lo hace `generadores/modulos_suscripciones_1004.py`:
- parte de la copia de la v179 en `generadores/modulos_suscripciones_1004/` (la arma `capturar.mjs`);
- escribe los tableros en esta carpeta y su índice en `canvas-modulos.json`, que se publica como `project/canvas.json` del lienzo aparte, con los cuatro archivos de `ds/ab/` copiados del principal; conserva `Indice-modulos`, que escribe `indices_1004.py`;
- después corre la pasada de las piezas con `--tableros` sobre los 25.

Qué tableros son:
- en la organización: `MOD-Modulos` (Administración › Módulos, con cada estado de un módulo y sus acciones en el ⋮), `MOD-Suscribir` (el precio, lo que incluye, la tarjeta de MercadoPago.js y el consentimiento; también cambiar la tarjeta), `MOD-Pedir` (también con «Propuesta del asistente»), `MOD-Confirmar` (probar gratis y dar de baja) y `MOD-Exportar`;
- en Plataforma: `Plat-MOD-Catalogo`, `Plat-MOD-Modulo`, `Plat-MOD-Precio`, `Plat-MOD-Pedidos`, `Plat-MOD-Suscripciones`, `Plat-Org-Modulos` (la pestaña «Módulos» de una organización, con las filas por origen y los topes) y `Config-Plat-Modulos`;
- los ocho avisos, en `Mensajes-Modulos`, y cada pantalla con su teléfono.

Sus 307 estados abren sin errores. No están en el `canvas.json` del principal. En el lienzo aparte, los enlaces a pantallas del principal no llevan a ningún lado.

La versión 183, del 24/11, registra que el usuario aprobó los 25 tableros de «Módulos y suscripciones», que se quedan en su lienzo aparte:
- allá pierden «· para aprobar», la página se llama «Módulos y suscripciones» (conserva su id, `propuesta-modulos`, para que sigan andando los enlaces de antes) y la nota dice que están aprobados. Su índice pasó de `canvas-propuesta-modulos.json` a `canvas-modulos.json`;
- entran en la guía como el capítulo «Contrata módulos» de `../guia/recorrido.py`, después de «Administra la organización», con trece pantallas. Ese capítulo está en `LIENZOS_APARTE`, que dice en qué lienzo están sus tableros y cuál es su índice. `generar_recorrido.py` toma sus tableros de ese índice, y el capítulo lleva «Abrir su lienzo»;
- `indices_1004.py` escribe `Indice-modulos` (685 de alto) y lo registra arriba a la izquierda del lienzo aparte, sin «Índice general»; en el principal, la tarjeta «Contrata módulos» del índice general abre el lienzo aparte en otra pestaña. `paleta_pradera_1004.py` pasa también por los tableros del lienzo aparte.

En el principal solo cambia `Indice`, publicado en la versión 230 del artefacto, y `canvas.json` no cambia. El lienzo aparte quedó en su versión 4, con los 25 tableros, `Indice-modulos` y su `canvas.json`. Las dos guías siguen en la 179 hasta que se regeneren.

La versión 182, del 23/11, suma a la guía y a los índices `WA-Config-Base2`, la única pantalla nueva de la segunda parte de la base: «Configuración de WhatsApp», en el capítulo «Atiende por WhatsApp» de `../guia/recorrido.py`, con su compu y su teléfono. Corrieron `indices_1004.py`, `paleta_pradera_1004.py` y la pasada de las piezas sobre los doce índices; solo cambian `Indice` e `Indice-whatsapp`, y la tarjeta nueva entra en su alto de siempre, así que `canvas.json` no cambia. Se publicaron los dos índices en la versión 227 del artefacto. Las dos guías siguen en la 179 hasta que se regeneren.

La versión 181, del 23/11, registra que el usuario aprobó ese día los 41 tableros de la segunda parte de la base de la v180 («Aprobados los tableros de la base 2»), así que ya se pueden programar la F4, la F5 y la F10 a la F13:
- sus títulos pierden «· para aprobar», y la página pasa a llamarse «Segunda parte de la base» (conserva su id, `propuesta-base2`, para que sigan andando los enlaces de antes). Sus notas dicen que están aprobados (`base2_comun.py` y `base2_1004.py`);
- cada `-Base2` manda sobre su tablero de siempre en lo que dibuja, y el de siempre conserva sus demás estados. Por ejemplo, la matriz de permisos de `Rol` queda reemplazada por las áreas plegables de `Rol-Base2`, y «Guardar: demasiados pedidos» sigue en `Rol`;
- `WA-Config-Base2` es la única pantalla nueva y todavía no está en la guía ni en los índices, que hoy edita la sesión de Módulos. Entra con la próxima pasada de `../guia/recorrido.py` e `indices_1004.py`.

Se publicaron los 41 tableros y `canvas.json`, armado sobre el publicado, en la versión 225 del artefacto. Sus 178 estados abren sin errores.

La versión 180, del 23/11, dibuja para aprobar los tableros que esperan la segunda parte de la base (F4, F5 y F10 a F13 del plan del back del 19/11), en la página nueva «Propuesta · Base 2», con las decisiones 260 a 273 y las ADR 0061, 0062 y 0066. Lo hace `generadores/base2_1004.py`, que corre un generador por grupo y la pasada de las piezas sobre sus tableros. Son 41, la mayoría con su teléfono:
- los «Criterio»: `Criterio-Tablas-Base2`, con el encabezado que ordena y «Ordenar por» (264), ninguna fila con un botón con texto (261), nada debajo de otro dato (263), los permisos en áreas plegables (260) y las filas del teléfono como tarjetas; y `Criterio-Elegir`, nuevo, con la pieza para elegir (262) y los tres detalles de la revisión del 23/11;
- roles y personas: `Rol` en áreas plegables, con lo incluido y lo que quien edita no puede dar apagados con su motivo, también en un rol de una empresa; la entrega de una invitación (la columna «Entrega»: Pendiente, Enviada, Sin confirmar y No se pudo enviar) en `Usuarios`, `Usuario`, `Empresa`, `Cuentas` y `Cuenta-Plat`, con reenviar una sin confirmar; los permisos de un operador en áreas, y la (i) de los ingresos en `Auditoria-Plat`;
- WhatsApp: un mensaje «Sin confirmar» con «Marcar como revisado» y quién lo revisó, y los ocho motivos de «No se pudo mandar», en la organización y en Plataforma; un destinatario sin confirmar en una difusión (255);
- las reglas en Configuración: «Nombre y correos» con «Así llega», «Privacidad y retención» y los países que reciben códigos en `Config-Plat`; la configuración de WhatsApp de la organización, nueva (`WA-Config-Base2`), y el cupo del día de la IA en los tres asistentes (271);
- la pieza en pantalla: la zona horaria y el idioma en `Cuenta` y `Configuracion`, y «Fuera de horario» con el horario en una tabla de lectura;
- nada debajo de otro dato: `Legales`, `WA-Difusiones` y las listas del teléfono del núcleo (`M-Filas-Base2`).

Cada uno es el tablero de siempre con lo nuevo, con `-Base2` en el nombre y «· para aprobar» en el título; el de siempre no cambia hasta que el usuario lo apruebe. Parten de la copia de la v179 en `generadores/base2_1004/` (la arma `capturar.mjs`) y no entran en la guía ni en los índices hasta que se aprueben. Sus 178 estados abren sin errores. Para que entraran, porque el lienzo publicado admite 512 archivos por versión y tenía 498, el usuario eligió sacar del lienzo la página «Archivo» con sus 32 tableros descartados («Remove the Archivo»): siguen en esta carpeta y en git, y `canvas.json` ya no los nombra. Se publicó solo lo que cambió, con `canvas.json` armado sobre el publicado, en la versión 224 del artefacto.

La versión 179, del 23/11, registra que el usuario aprobó ese día los diez tableros de «Acciones del asistente» de la v178 («Aprobados los diez tableros»), así que ya se pueden programar:
- sus títulos pierden «· para aprobar», y la página pasa a llamarse «Organización · Acciones del asistente» (`acciones_asistente_1004.py`);
- entran en la guía y en los índices como cinco pantallas del capítulo «Le pregunta al asistente», cada una con su compu y su teléfono (`../guia/recorrido.py` e `indices_1004.py`, con `Indice-asistente` medido en 579 de alto). Después corrieron `paleta_pradera_1004.py` y la pasada de las piezas sobre los doce índices; solo cambian `Indice` y `Indice-asistente`.

Se publicaron los diez tableros, los dos índices y `canvas.json` en la versión 219 del artefacto. Las dos guías, regeneradas con la 179 (441 capturas y 54 recorridos con 273 pasos, sin errores ni imágenes en blanco), suman las cinco pantallas de las acciones en el capítulo del asistente; se publicaron en dos envíos cada una: la del lienzo en sus versiones 76 y 77, y la de Formularios en la 21 y la 22.

La versión 178, del 23/11, da de baja un rol con el verbo de la pantalla de Roles, como eligió el usuario ese día: la tarjeta se llama «Baja de rol», su botón rojo contorneado dice «Revisar y dar de baja» y, aplicada, se pliega en «Rol dado de baja». La confirmación sigue siendo la de Roles («¿Dar de baja el rol …?»). Cambian `Asistente-Org-Acciones`, `Confirmar-Propuesta` y sus teléfonos, desde `acciones_asistente_1004.py`, y se publicaron con `canvas.json` (el título de `Confirmar-Propuesta` y la nota de la página) en la versión 218 del artefacto.

La versión 177, del 23/11, dibuja para aprobar la etapa «Acciones del asistente» (ADR 0068 y decisión 268 del back; spec `docs/plans/formularios/acciones-del-asistente.md`), que va después de la segunda parte de la base y antes de la E12. Lo hace `generadores/acciones_asistente_1004.py`, seguido de la pasada de las piezas sobre sus diez tableros, en la página nueva «Propuesta · Acciones del asistente». Cada tablero muestra solo lo que existe hasta esta etapa (78), sin «Gestión de formularios»:
- `Asistente-Org-Acciones`: el Inicio con la tarjeta de cada acción en el hilo, debajo del texto de la IA. Copia la tarjeta de armar de `Asistente-Org-25`, con cada dato en su renglón (263). Sus estados son nueva; con «Revisá» y su motivo en un dato; reemplazada; ya no disponible, con sus cuatro motivos; aplicada y plegada, las seis, con el enlace a lo hecho si se puede ver; y sin confirmar. Quitar y borrar llevan el botón rojo contorneado;
- `Usuarios-Invitar-Propuesta`: «Invitar usuario» sobre el Inicio, con «Propuesta del asistente» junto al título y un rol con «Revisá». Muestra la pieza para elegir abierta, con lo que no se puede dar apagado y su motivo (262, 211 y 0061), el aviso de que manda la invitación, «Invitando…» y «Ya se guardó»;
- `Usuario-Propuesta`: la ficha con «Lo que cambia» (un rol que se suma y otro que se quita) y el aviso de que la persona cambió desde la propuesta, con lo que cambia contado sobre lo de ahora;
- `Rol-Propuesta`: el editor con los permisos en áreas plegables (260). Muestra un rol nuevo, con lo incluido y lo que no tenés apagados con su motivo, y un cambio de permisos en «Lo que cambia», también con el rol que cambió desde la propuesta;
- `Confirmar-Propuesta`: la confirmación de quitar, sobre la ficha, y la de dar de baja un rol, sobre Roles, también con el rol que ya tiene personas;
- cada uno con su teléfono (`M-`).

Quien pide es Valeria Castro, con el rol «Administración de personas». No es Dueña: hay roles y permisos que no puede dar, y su menú muestra solo lo que sus permisos dejan ver. Los tableros parten de la copia de las pantallas de siempre en la v176 (`generadores/acciones_asistente_1004/`, que arma `capturar.mjs`). Las áreas plegables y la pieza para elegir se dibujan acá, porque los tableros de la segunda parte de la base todavía no las tienen. Queda para decidir con el usuario si la acción se llama «Borrar rol», como dice la spec, o «Dar de baja», como dice hoy Roles para la misma ruta. No entran en la guía ni en los índices hasta que se aprueben. Se publicó solo lo que cambió: los diez tableros y `canvas.json`, armado sobre el publicado, en la versión 216 del artefacto. Sus 66 estados abren sin errores.

La versión 176, del 18/11, cierra el traspaso 15 en el lienzo, sobre la 175:
- `Criterio-Decisiones` suma «Traspaso 15, tandas 2 a 4 · El usuario · v176 · 18/11», con la 215 a la 242 y la 254, y tres reglas: «Ordenar por…» (224), exportar con chips (226) y «Un diálogo no pliega nada» (254), que tacha y reemplaza «Catálogo de modelos: datos técnicos» plegados (`criterio_decisiones.py`, con `ALTO` en 6400, porque la columna más alta llega a 6191). Al regenerarlo se vuelve a correr `tanda2_t15_1004.py`, que suma lo suyo a ese tablero;
- las nueve pantallas nuevas de las tandas 2 y 3 (`FRM-Catalogo-Ordenar`, `-Ordenar-13`, `FRM-Respuestas-Exportar-19`, `FRM-Editor-20`, `FRM-Editor-Ubicacion` y sus teléfonos), en `../guia/recorrido.py`, en el índice general y en el de Formularios (`indices_1004.py`, que ya no copia a los índices el estilo de las reglas del traspaso 15), seguido de `paleta_pradera_1004.py`.

Se publicó solo lo que cambió desde la 175: `Indice-formularios`, `Indice` y `Criterio-Decisiones`, con `canvas.json`, en las versiones 208 a 210 del artefacto. Antes se comprobó que nadie lo había cambiado desde la página, y los 451 tableros vivos abren sin errores. Las dos guías, regeneradas con la 176 (431 capturas y 54 recorridos con 273 pasos, sin errores ni imágenes faltantes), se publicaron en dos envíos cada una: la del lienzo en sus versiones 74 y 75, y la de Formularios en la 19 y la 20.

La versión 175, del 18/11, trae las reglas de diseño, fechas y números del traspaso 15 para toda la app (decisiones 205 a 214 de la hoja de ruta del back):
- las fechas y los números en los 205 tableros vivos que los tienen (`generadores/traspaso15_textos_1004.py`): la hora después de una coma, un mes como su rango en «Uso del asistente» y en los correos del tope, el porcentaje pegado y la ayuda de un número por WhatsApp con coma;
- los avisos según el tipo en todos los tableros: blancos, con un filo de 3 px y el ícono de su tipo, también la franja de error, los carteles y la franja oscura del teléfono (`CSS_AVISOS` de la pasada de las piezas), con el octógono del error y el triángulo de la atención (`generadores/avisos_iconos_1004.py`);
- los «Criterio» con sus reglas y un ejemplo dibujado (`generadores/reglas_t15_1004.py`): un dato por columna, las fechas y la matriz de permisos en Tablas; el ⋮ y lo apagado en Botones; el ⋮ de una banda en Menús; la grilla y la frase en Diálogos; una cosa, una zona y el número ambiguo en Formularios, y los avisos en Avisos. `Criterio-Decisiones` suma «Traspaso 15 · 18/11» y tacha las tres reglas que cambian (`criterio_decisiones.py`);
- los permisos de un rol y de un operador, en una matriz, en `Rol`, `Cuenta-Plat`, la invitación de `Cuentas` y sus teléfonos (`generadores/roles_matriz_1004.py`);
- Formularios con el ⋮ y un dato por columna (`generadores/formularios_t15_1004.py`): «Dar de baja» y «Reactivar» de un catálogo y «Corregir» de una respuesta, al ⋮; «Aprobar» y «Rechazar», primeros en la pantalla completa; «Corregida» y «Es cliente», en su columna; el bloque con «3 ítems» y los documentos con su cantidad; el tope de una pregunta, en la (i) de su título, y la revisión de importar y «¿Aprobar…?», con la lista de chequeo;
- la baja y el borrado de un formulario, enviar desde el chat, verificar un número o un correo y los ajustes del asistente, repasados con la lista de chequeo (`generadores/dialogos_t15_1004.py`).
- la tanda 4 (biblioteca, asistente, documentos e IA; decisiones 215 a 223 y ADR 0064 del back), en 27 tableros:
  - el asistente de WhatsApp (`generadores/tanda4_asistente_1004.py`): Probar con hasta cinco mensajes y sin «Ver respuestas», «El asistente no pudo responder» y el motivo de una derivación, y «Sin revisar» con «Marcar como revisado» en «Formularios que faltan» y «Preguntas sin respuesta», que abren en «Pendientes» y muestran en su columna quién descartó un tema y cuándo;
  - los documentos y la IA que arma (`generadores/tanda4_documentos_1004.py`): «Venció» con «Volver a abrir», el PDF protegido y el tope del día como motivo de un sin clasificar, pasar un repetido, los ejemplos que no van a la IA, «Lo escribió la IA», el chat con la planilla y el tope, y en el Inicio y por WhatsApp, armar desde un documento, el prefijo corregido, importar en un catálogo que existe, la propuesta que no entra, borrar con sus audios y el motivo cuando no crea;
  - el chat del Inicio y su configuración (`generadores/tanda4_inicio_1004.py`): «Se cortó», «Conversación no disponible», subir sin cupo y una subida a la vez, borrar con sus archivos, y cada falla del proveedor según quién paga; y el diálogo de un modelo del catálogo, en pasos, sin plegar (254): al agregar, los datos técnicos son el segundo paso, y al editar se leen en una grilla, con «Cambiar datos técnicos».
- las tandas 2 y 3 (catálogos, formularios, lo que se carga y lo que se decide; decisiones 224 a 237 y 239 del back, más la 240 de la tanda 5), en 68 tableros, 9 de ellos nuevos:
  - de la E12 a la E17 (`generadores/tanda2_t15_1004.py`, que corre después de `criterio_decisiones.py`): «Ordenar por…» en el ⋮ de las opciones, con el orden pendiente y «Cancelar orden», el diálogo nuevo (`FRM-Catalogo-Ordenar`, `-Ordenar-13` y sus teléfonos) y ordenar por un campo de cada tipo; «Descartar esta publicación» con «Sin confirmar», en la E14 y al reactivar; exportar con «Respuestas» y «Filtros» en una grilla, con los chips sin la ✕, también en la E18 y en anular, y `Criterio-Decisiones` con «Ordenar por…» y la tercera vista;
  - la E19 y la E21 (`generadores/formularios_t15_e19_e21_1004.py`): la pantalla de cierre del bloque al final, el cálculo dentro del bloque, el aviso de una condición que WhatsApp no muestra, el Excel con «Filas» (`FRM-Respuestas-Exportar-19`, nuevo), «Por aprobar | Por resolver | Todas» con la columna «Reglas», la actividad con «Sin confirmar», «No aplica» de quien dejó el rol y el rol sin personas, el error de «Ver respuestas» al guardar una regla, las horas del PDF con su zona y la ubicación, el aviso a quien cargó cuando su regla se frena y «Ubicación» entre los tipos de la E21;
  - la E20 (`generadores/cargar_web_t15_1004.py`): «Dónde se completa» (`FRM-Editor-20`, nuevo, con su teléfono), publicar que frena con «Pasar a «Solo en la app»», las columnas «Estado» y «Dónde se completa», la pregunta «Ubicación» en el editor (`FRM-Editor-Ubicacion`, nuevo, con su teléfono), la carga, la planilla, el detalle y el chat, y el cálculo en gris mientras se carga.

Los generadores corren al final de todo, en este orden: `traspaso15_textos_1004.py`, `roles_matriz_1004.py`, `formularios_t15_1004.py`, `dialogos_t15_1004.py`, `reglas_t15_1004.py`, `tanda4_asistente_1004.py`, `tanda4_documentos_1004.py`, `tanda4_inicio_1004.py`, `tanda2_t15_1004.py`, `formularios_t15_e19_e21_1004.py`, `cargar_web_t15_1004.py`, `avisos_iconos_1004.py` y la pasada de las piezas; una segunda corrida no cambia nada, y los 451 tableros vivos abren sin errores. Quedan para revisar el tope de «Descripción · hasta 300» en los campos de un catálogo, y las cantidades de «Un valor ambiguo» al importar. Se publicó en las versiones 202 a 206 del artefacto, y la guía del lienzo, regenerada con la 175, en sus versiones 72 y 73; la de Formularios quedó en la 174.

La versión 174, del 10/11, trae dos cosas:
- el dólar con su símbolo, una corrección: en es-AR el `DisplaySymbol` de USD en el dato de referencia del back es «US$», como muestran `DisplayFormatter`, `MoneyText` y los correos del tope del asistente (back `121f18ae`). Lo hace `generadores/dolares_1004.py`, que corre al final de todo, en `Mensajes` y en las pantallas del asistente (`Asistente-Uso-Org`, `Asistente-Config-Org`, `Asistente-Plat`, `Plat-Asistente-Uso`, `Plat-Asistente-Config` y `Plat-Asistente-Config-23`, con sus teléfonos): cada importe como `MoneyText`, con «US$» y sus dos decimales («USD 100» pasa a «US$ 100,00»). Quedan con el código, como en la app, el prefijo de un `MoneyField` con `fixedCurrency` y el selector de monedas («Dólar estadounidense (USD)»). En `M-Asistente-Uso-Org` con el tope cerca, lo que no entra baja entero, sin partir un importe;
- el eje por semana, con la regla de los gráficos por día extendida ese día (`docs/rules/formatos.md`): en «Cuántas llegaron, por semana» de `FRM-Tablero`, `FRM-Tablero-19` y `FRM-Tablero-21`, cada marca lleva la fecha completa del lunes y el cartel de cada barra, el rango con su valor («21/09/2026 – 27/09/2026 · 3 respuestas»), desde `eje_por_dia_1004.py`. El eje por mes («septiembre de 2026») no tiene tablero.

Los dos corren seguidos de la pasada de las piezas sobre sus 15 tableros, y una segunda corrida no cambia nada. Se publicaron los 15 tableros en la versión 200 del artefacto, y las dos guías, regeneradas con la 174: la del lienzo en su versión 71 y la de Formularios en la 18.

La versión 173, del 10/11, pasa a los gráficos por día la decisión del usuario de ese día, que precisa la de las fechas completas de `docs/rules/formatos.md`: cada marca del eje lleva la fecha completa (27/09/2026), nunca «27/09», el día solo ni una fecha relativa, y para que entren van menos marcas; el cartel de cada barra también lleva la fecha completa. Lo hace `generadores/eje_por_dia_1004.py`, que corre al final de todo, seguido de la pasada de las piezas sobre sus seis tableros, `FRM-Tablero`, `FRM-Tablero-19` y `FRM-Tablero-21`, con sus teléfonos:
- en la compu, «Cuántas llegaron, por día» y el monto por día llevan una marca cada lunes, el día en que empieza una semana del tablero (28/09/2026, 05/10/2026 y 12/10/2026); en el teléfono, una cada tres días, que es lo que entra sin pisarse, con la primera y la última adentro del gráfico;
- cada barra lleva su cartel con la fecha y lo que vale («03/10/2026 · 1 respuesta»), y el estado nuevo «Una barra: su cartel» lo dibuja sobre una barra sin marca;
- las barras de la compu van en proporción a su valor: la escala de la 180 achicaba solo las de 18 a 72 px, y la más alta se aplastaba.

`Criterio-Decisiones` la anota en «El eje por día» (10/11), desde `criterio_decisiones.py`. Una segunda corrida de los dos no cambia nada. Se publicaron los siete tableros en la versión 199 del artefacto, y las dos guías, regeneradas con la 173: la del lienzo en su versión 70 y la de Formularios en la 17.

La versión 172, del 9/11, corrige con `generadores/galeria_base12_1004.py` lo que encontró la galería de la base de la 12, copiado de la app, que ya hacía lo correcto, y deja los correos de `Mensajes` con la fecha completa. El script corre al final de todo, seguido de la pasada de las piezas sobre sus 20 tableros:
- las pestañas «Historial» e «Historial de seguridad» van sin cantidad (lo que solo crece va con «Cargar más» y sin total, decisión del 04/10), y «Dominio verificado» y «Página pública» tampoco llevan número, en `Organizacion`, `Cuenta-Plat` y sus teléfonos;
- `M-Recuperaciones` y `M-WA-Difusiones` se abren desde «Más»: con ‹ y su grupo debajo del título, «Gestión» y «WhatsApp»;
- lo que cuenta la campana va sin leer, en `Campana`, `Campana-Plat` y las de la 14, la 21, la 23 y la 25, con sus teléfonos, también en «Versión nueva». «Avisos» en el teléfono lleva la barra de abajo sin ninguna sección marcada, y `M-Inicio-Miembro` suma la campana;
- los correos y los WhatsApp de `Mensajes` copian el texto y el formato del back: la baja dice la fecha sola («Tu cuenta se borra el 27/10/2026.») y que la plataforma «inició el borrado», y el tope del asistente dice «hasta el 01/11/2026» y «octubre de 2026».

`Criterio-Decisiones` tacha la decisión del 04/10 de la fecha sin año, reemplazada por «Las fechas» del 25/10, desde `criterio_decisiones.py`; al regenerarlo, la paleta lleva a Pradera tres colores que le quedaban de la vieja. Una segunda corrida de la cola del final no cambia nada. Se publicaron los 21 tableros en la versión 198 del artefacto, y las dos guías, regeneradas con la 172, con las imágenes de lo que cambió en la 171 y la 172: la del lienzo en su versión 69 y la de Formularios en la 16.

La versión 171, del 9/11, deja las fechas completas en los tableros vivos, con la regla de `docs/rules/formatos.md` (decisión del usuario del 25/10) y el formato que la app usa desde la F4 (front `47822f6d`): una fecha con su año, un momento con su hora, y nunca «hace 2 horas», «En 6 días», «Hoy», «Ayer» ni «27/09». Lo hace `generadores/fechas_completas_1004.py`, que corre al final de todo, seguido de la pasada de las piezas sobre sus 27 tableros; una segunda corrida de los dos no cambia nada:
- la invitación, como `InvitationPage.tsx` («Dueño · 30/09/2026 09:00» y «Vence 07/10/2026 09:00»), la campana de `Criterio-Avisos` y los chats y contactos del teléfono de `Criterio-Marco`;
- los chats de la 16 y de la 19 a la 21, con sus teléfonos: la fila con la fecha y la hora, el separador del hilo con la fecha (13/10/2026, el día de la visita) y «Se puede mandar hasta el 14/10/2026 10:48.». El comprobante del día siguiente de `WA-Chats-Avisos` va después de su separador;
- «Por aprobar» y «Aprobada» en el detalle de una respuesta de la 21 y la 23, y las semanas del tablero de un formulario, como `DateRangeText` («21/09/2026 – 27/09/2026»).

Quedan a propósito lo que no es una fecha (lo que dura, el período de un tope como «Te quedan 10 consultas hoy», el filtro «Hoy» de Auditoría y lo que dice un mensaje), la hora sola de una burbuja y de la actividad de una respuesta (la fecha va una vez por día, como en la app), las reglas que nombran lo prohibido, lo que no es nuestro (`Mensajes`), los datos que un tablero no dibuja y el Archivo. Los días del eje «por día» del tablero (26, 27…) esperan una decisión del usuario. Se publicó solo lo que cambió, los 27 tableros, en la versión 197 del artefacto.

La versión 170, del 8/11, dibuja la decisión 201 para la E21 con `generadores/plantilla_encabezado_21_1004.py` y la pasada de las piezas sobre sus dos tableros nuevos, `WA-Plantilla-Nueva-21` y `M-WA-Plantilla-Nueva-21`, copiados de los de la E11 y puestos al final de las filas de la etapa 21:
- «Nueva plantilla» suma «Encabezado» debajo de «Tipo»: un segmentado con «Sin encabezado», el de entrada, y «Documento (el PDF)», con una (i) que dice que el PDF de ejemplo que pide Meta lo arma la app. «Tipo» no ofrece Autenticación, así que no hay opción apagada;
- debajo del texto va «Así llega» (149), con los ejemplos y, con el PDF, el documento arriba y el cuerpo después. El ejemplo es «Comprobante», de Utilidad: «Aprobaron {{1}}. Te mandamos el comprobante.», con VIS-000130 y VIS-000130.pdf.

El usuario los aprobó el mismo día: están en el índice y en la guía de Formularios, como «Una plantilla de WhatsApp con el PDF» de la E21, en la fila 21 de `formularios_etapas_1004.py` y en `TABLEROS_21` de `campana_1004.py`. `Indice-formularios` pasa a 2121 de alto, lo que mide su contenido: con 1460 se cortaban sus últimas tarjetas. Se publicó solo lo que cambió: los dos tableros y `canvas.json`, en la versión 195 del artefacto, y los dos índices y `canvas.json`, en la 196.

La versión 169, del 8/11, corrige 78 tableros con la revisión de las specs de la E12 a la E25 (en el back, `d248c499`): lo que contradecía una decisión o un `Criterio-*`, y lo que el usuario decidió en esa revisión (193 a 199). No suma tableros:
- el núcleo y los catálogos de la E12 y la E13 (`generadores/revision_v169_nucleo_1004.py`, que corre después de la pasada), la E14 a la E18, la E19 y la E20, la E21, la E22 y la E25, cada una con sus generadores;
- «Filtros» de las listas de Formularios y Catálogos en el teléfono, a pantalla completa, como la de `M-FRM-Respuestas`: cada filtro con sus opciones, una por renglón, sin cantidades y con la elegida tildada a la izquierda, y al pie «Limpiar todo» y «Listo» (144 y 164). Es la pieza `filtros_tel` de `traspaso10_piezas_1004.py`, que también saca las cantidades de «Filtrar por estado» en `M-Plat-FRM-Biblioteca`;
- «Reactivar» se abre sobre el formulario también en los teléfonos de la 20, la 21 y la 22 (131), y `FRM-Dar-De-Baja-21` y `-23` suman «Agregar título» y «Agregar bloque» en el editor de atrás (88 y 177);
- cinco títulos de `canvas.json`, dos pasos de los recorridos guiados y `Criterio-Decisiones` con la 191 a la 199.

Se armó con una sola corrida: las pasadas de la cola sobre los tableros que cambiaron, sin los `Criterio-*`; `criterio_decisiones.py`; `indices_1004.py` y la cola sobre los índices; `traspaso10_piezas_1004.py` sobre los 440 vivos; `revision_v169_nucleo_1004.py` y la pasada sobre sus tableros, y una segunda corrida de las piezas, que no cambia nada. Se publicó solo lo que cambió: los 78 tableros y `canvas.json`.

La versión 168, del 8/11, es el armado final del traspaso 10: las cinco tandas que el usuario aprobó ese día y las decisiones 181 a 190, publicadas juntas:
- los tableros de las tandas «b» a «e» y de la E25 (el núcleo, la E14 a la E18, la E19 a la E21, la E22 y la E23, y los 24 de la 25), con 34 tableros nuevos. `FRM-Catalogos-23` y `FRM-Catalogo-Propuesta` pasan al Archivo, porque el catálogo propuesto es de la 25 (167), y `Enlace` y `M-Enlace` también, porque la página del enlace de un solo uso se retira (179);
- la pasada de las piezas suma la tilde de la opción elegida de un filtro y la barra de lo abierto (142 y 164); la vista previa del último mensaje en la lista de chats, en un renglón con «…», y el resto de esas filas entero (188); el panel verde del ingreso liso, también el cierre de la portada y la cabecera del Inicio del teléfono (189), y el correo cortado después de la «@», que se corta al dibujar, sin tocar el HTML guardado;
- la fila de la 25 en «Organización · Formularios», los índices rehechos desde la guía, los tres recorridos guiados de la 25 y `Criterio-Decisiones` con la 181 a la 190, en seis columnas de 6000 de alto.

Se armó con una sola corrida: `indices_1004.py`, `criterio_decisiones.py`, las pasadas de la cola sobre los tableros nuevos y los índices, y `traspaso10_piezas_1004.py` sobre los 440 vivos, que una segunda vez no cambia nada.

La versión 166, del 7/11, pasa el lienzo a la escala de ArquitecturaBase (decisión 180), con la misma `generadores/traspaso10_piezas_1004.py`. La 167, el mismo día, deja los íconos de los botones en su tamaño (con la escala, el relleno que el navegador le pone a un botón los aplastaba) y saca el color de avatar de los avisos de «Publicar»:
- en los tableros de la compu, la letra × 0,82 (sin bajar de 10,5 px); los altos y el interlineado de 18 a 72 px × 0,74, y el ancho de lo cuadrado; los rellenos, márgenes y separaciones de 4 px o más × 0,72, y las esquinas de 3 px como mucho, también en pastillas y avatares. Las medidas que salen están en `docs/architecture/tema.md` («Forma») y en `Criterio-Marco` y `Criterio-Tablas`;
- cada px que cambia guarda el de antes al lado (`29.6px/*40px*/`): otra corrida, o una escala distinta, parte siempre del original;
- los teléfonos (los tableros de menos de 768 de ancho y los que se dibujan adentro de una pantalla) conservan sus medidas táctiles, y las tablas de un catálogo con columnas fijas, sus posiciones;
- `Criterio-Decisiones` suma la 176 a la 180 a la sección «Traspaso 10 · 07/11».

En los 37 tableros que otras sesiones estaban rehaciendo ese día (la E22, la E23 y los del núcleo), la 167 publica lo de la 166 con esos dos arreglos; lo nuevo de cada uno llega con su tanda.

La versión 165, del 7/11, es la tanda «a» del traspaso 10 (§4.3 de su evaluación, retirada el 2026-11-08 en el back): las reglas visuales de toda la app, en las piezas compartidas de los 410 tableros vivos, con `generadores/traspaso10_piezas_1004.py`, que corre al final de todo:
- que no parezca plantilla (173): la marca es el nombre, sin cuadrado ni degradé; la banda, sin ícono; el avatar, un cuadrado chico con la inicial; el activo del menú, una barra de 2 px; los filtros y las etiquetas, con el radio de un control, y los contadores, como texto; el principal, sólido, y sin sombras salvo en menús, desplegables y tooltips;
- la línea entre columnas (137) en las tablas que no la tenían; los filtros sin cantidades ni el total en la barra, y «Filtros» en lugar de «Más filtros» (143 y 144); la primera carga de un listado con su encabezado y el aro en el alto de ocho filas (160), y el texto largo entero, que baja de renglón (174);
- los ocho «Criterio», con `generadores/reglas_7_11_1004.py` (la 160 a la 164 y la 173 a la 175) y la sección «Traspaso 10 · 07/11» de `criterio_decisiones.py`, que marca lo que esas decisiones reemplazan y pasa a seis columnas.

Lo propio de cada etapa (cada planilla con su «Filtros», las tablas de un catálogo, los textos de cada pantalla) llega con las tandas b a e. Las capturas de antes y después (el después, con la escala de la 167) están en `../capturas/plan/traspaso-10-tanda-a/`.

La versión 164, aprobada por el usuario el 4/11, pasa todo el lienzo a la paleta «Pradera», la que eligió el usuario ese día y ya tiene la app (front `93e5efd6` y `docs/architecture/tema.md`), con `generadores/paleta_pradera_1004.py`:
- la marca pasa del verde petróleo al verde pasto, y el marco y los neutros claros, del arena al paja: cada valor de los 438 tableros va al nuevo según su papel, con el de la app cuando lo hay;
- «pendiente» (invitación pendiente, se invita, difusión programada, espera aprobación) deja el color de la marca y va en celeste, como `--punto-pendiente`;
- no cambian los textos, las sombras neutras, los colores de estado y de alerta, ni lo que no es de la marca: las fotos de ejemplo, WhatsApp, Meta, Google y el globo de lo automático;
- en el diseño del PDF, el color arranca con el del sistema (82): «Verde, el del sistema» va primero y «Petróleo» queda como una opción más, en el lugar del verde de antes;
- Criterio dice «verde claro» al pasar el mouse sobre una fila, «letra verde» en el menú, «borde verde» al escribir y «celeste pendiente» en los estados.

La versión 163, del 3/11, redibuja con el traspaso 5 la planilla, el detalle y la pantalla completa de la 18, con sus teléfonos, con las piezas de la 15 (`barra5`, `d3`, `actividad4`, `tel_respuestas5` y `tel_respuesta5`): un solo «Filtros», en el que las fotos y los documentos no entran (143), el detalle alineado y la actividad en columnas (139). Se van «Más filtros» y su filtro «Respuesta» de cada pregunta de archivo.

La versión 162, del 3/11, redibuja con el traspaso 5 la 12, la 14 y la 16:
- **El importar:** «Cambios» lado a lado, con la línea entre columnas y la fila a la derecha (`tabla_cambios()` de `generadores/formularios_12_catalogos_1004.py`).
- **El editor:** la revisión de «otra persona guardó» lado a lado, también en el teléfono, y la zona «En WhatsApp» plegada en cada pregunta de catálogo, con `zona_plegada()` y `comparacion()` de `generadores/formularios_e12_sin_idioma_1004.py`.
- **Enviar un formulario:** «Elegido en otra página», con lo elegido primero.
- **La 16:** las dos zonas plegadas, lo de la persona probada en dos columnas y la planilla con un solo «Filtros».

La versión 161, del 3/11, rellena con la marca la elegida de los botones agrupados en todos los tableros que los tienen (142), con `elegido_en_todos()` de `generadores/reglas_3_11_1004.py`. Es solo el estilo: las tarjetas, la tilde de los desplegables, la barra de la conversación abierta y las líneas entre columnas llegan con cada etapa que se redibuja.

La versión 160, del 3/11, redibuja con el traspaso 5 la planilla y el detalle de la 15 (`generadores/formularios_15_respuestas_1004.py`): un solo «Filtros» con chips y sin cantidades, la línea entre columnas, la vista rápida con los momentos y los íconos junto a ↑ ↓, y la actividad en columnas. Las etapas 18 a 21 siguen con las piezas de antes (`barra`, `mas_filtros` y `d2`) hasta su tanda.

La versión 159, del 3/11, suma a `Criterio-Tablas`, `Criterio-Menus` y `Criterio-Formularios` las reglas del traspaso 5 (decisiones 136 a 149 de la hoja de ruta), y `Criterio-Decisiones` las anota. Las etapas que cambian se redibujan en las tandas siguientes.

La versión 158, del 3/11, dibuja la 24 con `generadores/formularios_24_asistentes_1004.py`: la lista de asistentes, el asistente de cada equipo en «Editar equipo» y, en el chat, quién contesta y el menú de equipos al empezar. En ArquitecturaBase no existe: todo sale de piezas de este lienzo.

La cola de los generadores de Formularios corre así, siempre con `indices_1004.py` antes, y dos corridas seguidas tienen que dar lo mismo: `formularios_e12_sin_idioma_1004`, `formularios_e12b_ciclo_de_vida_1004`, `formularios_15_respuestas_1004`, `formularios_lista_y_ficha_1004`, `formularios_12_catalogos_1004`, `formularios_13_campos_1004`, `formularios_14_formularios_1004`, `formularios_16_personas_1004`, `formularios_18_archivos_1004`, `formularios_19_logica_1004`, `formularios_20_carga_1004`, `formularios_21_reglas_1004`, `formularios_21_respuestas_1004`, `formularios_22_biblioteca_1004`, `formularios_23_asistente_1004`, `formularios_24_asistentes_1004`, `formularios_25_documentos_1004`, `bloque0_org_1004`, `bloque0_plat_1004`, `bloque0_wa_1004`, `reglas_25_10_1004`, `formularios_etapas_1004`, `campana_1004`, `bloque0_personal_1004`, `otro_acceso_1004`, `reglas_2_11_1004`, `reglas_3_11_1004`, `reglas_7_11_1004` y `criterio_decisiones`. Al final de todo, después de cualquier generador, corre `paleta_pradera_1004.py`, que lleva lo que salga con la paleta vieja a la «Pradera»; `fechas_completas_1004.py`, que deja las fechas completas; `galeria_base12_1004.py`, con lo que encontró la galería de la base de la 12; `eje_por_dia_1004.py`, que deja la fecha completa en el eje de los gráficos por día y por semana; `dolares_1004.py`, que escribe el dólar con «US$», y después `traspaso10_piezas_1004.py`, que pone en los tableros vivos las piezas del traspaso 10: si un generador rehace tableros, se vuelve a correr, con `--tableros A,B` para pasar solo por esos.

Los generadores de Formularios leen sus tableros base de commits fijos (`f2f8e5bb`, `d5d5edc5` y, para lo que el bloque 0 reescribe en el lugar, `b83403a5`) para no seguir cambios posteriores de otros generadores.

**La guía del lienzo** recorre estas pantallas en el orden en que una persona usa el sistema: <https://claude.ai/artifact/3afhCQaqwMx6kLxY4B6gpZ>. Formularios tiene su propia guía, porque en una sola ya no entraban las imágenes: <https://claude.ai/artifact/K78KMJcoq8dw6YmMjuRvEu>. Las dos se regeneran y se publican con cada versión del lienzo; cómo, en [`../guia/README.md`](../guia/README.md).

Esta carpeta es la fuente de cada pantalla y de sus estados: **un tablero validado manda sobre cualquier descripción textual** de la arquitectura, las fichas o el plan. Antes de programar una pantalla, buscá su tablero y copiá sus estados, contenido y disposición. Una pantalla nueva se dibuja primero y se programa después de que el usuario la elige.

## Páginas y estado

El título de cada tablero dice en qué estado está:

- **sin marca:** validado por el usuario; se puede programar;
- **«· para aprobar»:** refinado con el criterio y esperando el visto bueno;
- **«· por refinar»:** dibujado antes del criterio; no se programa así.

| Página | Tableros | Estado |
|---|---|---|
| Criterio de diseño | 8 | Validado. Es la regla de botones, tablas, diálogos, formularios, avisos, menús y marco. «Decisiones por pantalla» anota lo que el usuario eligió en cada pantalla y las reglas que salieron de eso. El lienzo abre acá. |
| Segunda parte de la base | 41 | Aprobada por el usuario el 2026-11-23 (v181): los tableros de la F4, la F5 y la F10 a la F13, cada uno con `-Base2` en el nombre, que manda sobre su tablero de siempre en lo que dibuja, y `Criterio-Elegir`, nuevo. Cada fila tiene su nota. |
| Índice y mapas | 14 | El índice general, un índice por área (los capítulos de la guía, con una tarjeta por pantalla que lleva a su compu, su teléfono y lo que se abre desde ahí) y los dos mapas: quién es quién y todos los casos del ingreso. |
| Sitio público | 6 | Aprobado el 2026-10-03 (Etapa 7), pantalla por pantalla: la portada (con la sección «Empresas en ArquitecturaBase»), el directorio en tarjetas (`/empresas`) y la página pública en una tarjeta centrada, con sus tres estados. Los teléfonos son web, no app: una columna y ☰ arriba. |
| Ingreso y registro | 22 | Validado. Desde el 2026-10-03 suma los teléfonos de Sesión y de Organización no disponible, en formato app. |
| Perfil personal | 16 | Validado. Los 7 teléfonos están en formato app desde el 2026-10-03. Mi cuenta suma los estados de WhatsApp (Etapa 8): agregar y verificar un número, quitarlo o hacerlo principal, y sin el módulo; y los de «Exportar mis datos» (Etapa 10). |
| Organización | 43 | Escritorio y móviles aprobados el 2026-10-03, con los dos inicios: las áreas en tarjetas y «Para resolver» como tabla. Los 17 teléfonos están en formato app (el del inicio, como una billetera), con los de Sin permiso y Avisos. Desde la versión 140, la campana: `Campana` y `M-Campana`. |
| Organización · Acciones del asistente | 10 | Aprobada por el usuario el 2026-11-23 (v179): la etapa «Acciones del asistente», después de la segunda parte de la base y antes de la E12. La tarjeta en el Inicio, «Invitar usuario», la ficha de una persona, el editor de roles y las confirmaciones con lo que propone el asistente, con sus teléfonos. |
| Organización · WhatsApp | 55 | Escritorio y teléfonos aprobados el 2026-10-03, pantalla por pantalla (Etapa 11 ampliada). Los 27 teléfonos son los primeros en formato app. El alta de Meta no se dibuja hasta que el usuario lo pida. |
| Plataforma | 40 | Aprobada el 2026-10-03, compu y teléfonos. En la compu, Gestión, WhatsApp y Administración abren un segundo panel; en el teléfono, barra de abajo (Organizaciones, Cuentas, Recuperaciones, Chats y Más). Plataforma › WhatsApp (Etapa 11), aprobado el 2026-10-03: solo consultas, con Consultas, Número, Bot, Equipos y Plantillas, en la compu y en el teléfono; la barra de abajo lleva «Consultas». |
| Textos y mensajes | 2 | Validado |
| Organización · Formularios | 222 | Rehecha el 2026-10-17 con la disposición de ArquitecturaBase, aprobada: Etapa 12 (listado, editor, publicar, cómo termina, enviar y la respuesta en el chat), Etapa 13 (catálogos, editor a mano y con filtros), Etapa 14 (fotos y documentos, con el visor, aprobada el 18/10), Etapa 15 (respuestas: la planilla, los filtros, el detalle al costado y Excel, aprobada el 18/10), Etapa 16 (reglas, aprobación, PDF y avisos, aprobada el 18/10), el asistente de formularios (aprobado el 18/10, se programa después del bloque) y la biblioteca de la organización (Etapa 17, con las reglas que trae una plantilla), con sus teléfonos. Desde el 24/10 todo va en «Gestión de formularios», con «Formularios» (MF1) en lugar de Respuestas y Por aprobar, y la Etapa 12 sin idioma, con «elegir varias» y clientes. Desde el 25/10, la Etapa 12b: dar de baja, reactivar, eliminar y copiar. Desde la versión 141, en filas por etapa con el orden nuevo (12 Catálogos … 25 Documentos), un tablero por etapa. |
| Plataforma · Formularios | 12 | Etapa 17, aprobada el 2026-10-17: biblioteca, plantilla, publicar, retirar y categorías. Desde el 18/10, la plantilla usa el editor de la Etapa 12, con sus reglas de ejemplo y el diseño del PDF. |
| Módulos y suscripciones | 26 | En su lienzo aparte (<https://claude.ai/artifact/TWmqhEkZ3KmLr2pRXgr4HR>), no en el principal. Aprobada por el usuario el 2026-11-24 (v183): la etapa que va después de la E25, con `Indice-modulos`, los cinco de la organización y los siete de Plataforma con sus teléfonos, y los avisos. |
| Archivo | 32 | Fuera del lienzo publicado desde la v180, por el tope de 512 archivos: siguen en esta carpeta y en git, y `canvas.json` no los nombra. Descartado. Son versiones anteriores; están como referencia y no se programan. Desde la versión 128, los tableros de la Etapa 12 del 13/10; desde la 129, los de la Etapa 13 del 13 y 14/10; desde la 138, la bandeja «Por aprobar»; desde la 141, «Diseñar formularios» (`FRM-Listado` y `M-FRM-Listado`); desde la 168, `FRM-Catalogos-23` y `FRM-Catalogo-Propuesta`, que pasaron a la 25, y `Enlace` y `M-Enlace`, que se retiran (179). |

La aplicación se migra al criterio visual por etapas: Mi cuenta y las piezas compartidas se abordaron en la Etapa 4; las pantallas de Organización aprobadas se implementan en la Etapa 6. Los dos inicios de Organización siguen pendientes de diseño.

Ajuste solicitado el 2026-10-03: el detalle de Auditoría de Plataforma usa el encabezado arena de `Criterio-Dialogos`, con la fecha en el cuerpo, datos de lectura y cierre compacto. En teléfono aparece desde abajo y ocupa todo el ancho. Este ajuste no aprueba el resto de Plataforma ni las propuestas de WhatsApp.

Navegación de Plataforma elegida el 2026-10-03: **Gestión**, arriba, agrupa Organizaciones, Cuentas y Recuperaciones; **Administración**, al pie, agrupa Auditoría, Documentos legales y Configuración. En escritorio se abre un único segundo panel al lado del menú principal, con la sección actual marcada. La aprobación alcanza esta distribución y el ajuste del modal de Auditoría; no autoriza las propuestas de WhatsApp. Los dueños usan el panel de Organización y no este menú global.

**El teléfono es una app** (decisión del 2026-10-03, «Criterio · Marco y pantallas»): barra de estado arriba y título grande en la barra, con la organización debajo; barra de abajo con hasta cuatro secciones y «Más»; listas de borde a borde; lo que en la compu es un diálogo es una hoja desde abajo con manija; crear es un «+» flotante; la acción de una tarea va fija abajo. Nada de la web achicada (marca arriba, banda, cajas con cabecera beige, menú ☰). Todos los teléfonos con sesión iniciada (WhatsApp, Organización, Plataforma y perfil personal) ya están así; el ingreso, el registro y el sitio público no llevan la barra de abajo.

## Verlo sin claude.ai

Serví esta carpeta con un servidor estático, por ejemplo con `python -m http.server`, y abrí `<Tablero>.dc.html`. Cada estado se elige con el control **Tweak**. El estado inicial está en el atributo `data-props` como `default`.

## Lista de chequeo de diseño

Todo tablero, toda pantalla y todo diálogo pasan estas trece preguntas antes de mostrarse para elegir y otra vez antes de programarse (decisión 213 de la [hoja de ruta](../../../../ArquitecturaBaseMutitenant/docs/plans/2026-10-12-formularios-dinamicos-hoja-de-ruta.md), del traspaso 15). Es un paso de Diseño, junto con `alinear-etapas --detectar`. No suma reglas: junta las de los «Criterio» y las [fichas](../../rules/README.md). Cada diferencia aceptada va en la nota del tablero, con su motivo, y lo que no pasa se corrige antes de mostrarlo o se muestra como una pregunta.

- **Sumar a lo que existe repasa el conjunto:** un control, un dato o un estado nuevo en algo que ya existe se dibuja con la pantalla o el diálogo entero, y se pasa la lista otra vez, no solo por lo nuevo.
- **Un cambio pedido sobre una pantalla** se busca en todas las parecidas, no solo en las que usan la misma pieza, y se escribe como regla de toda la app (136 y 164), nunca para un caso suelto.

1. **Entero y armado:** ¿muestra la pantalla o el diálogo entero, con sus estados y su recorrido, con las piezas de `shared/ui`? ¿Es un diálogo solo si es breve y contextual?
2. **Una tarea, zonas que se entienden solas:** ¿resuelve una tarea? ¿Cada zona es una cosa, en el orden en que se usa, sin partirla por tipo de control (213)?
3. **El control según el dato:** una colección en una tabla; todo lo que se elige (una o varias, de dos a cuatro fijas, el Sí o No, un filtro y la carga de un formulario), en la pieza para elegir; una casilla, solo para un sí o no suelto (262, que cambia la 143).
4. **Lo que se lee, en su lugar:** los datos de algo en `DetailGrid`, también lo que un diálogo dice que va a hacer (cuántas, con qué filtros, a quién, a qué archivo); lo que pasa en orden, en pasos; dos versiones, lado a lado (138); la respuesta de un formulario, con la forma de su formulario, y su actividad, renglón por renglón (266 y 267). Nunca «Rótulo: valor» corrido.
5. **Un dato por columna** (206), **nada debajo de otro dato** (263) y **toda columna con un dato ordena** (264).
6. **Sin leyendas:** ¿ningún texto debajo o al costado explica cómo funciona algo? Lo que sirve va en la (i) (109 y 116).
7. **Textos ciertos, una sola vez:** ¿cada texto sigue siendo cierto sin datos, con filtros, sin permiso, después de un error y al cambiar una opción? ¿El estado se dice una vez (175) y el idioma solo cuando es el otro?
8. **Botones y lo apagado:** ¿cada botón nombra su acción, «Cancelar» va junto a la principal, que va última, y la destructiva, separada? ¿Lo apagado no lleva nada al lado y da su motivo sobre el control (211)? ¿A la vista va la tarea y en el ⋮ lo demás, con lo destructivo al final (209)? ¿Una confirmación dice en una frase lo que se afecta? ¿Ninguna fila lleva un botón con texto (261)?
9. **Lo elegido y la espera:** ¿lo elegido se distingue por algo más que un tinte (142)? ¿Toda acción que tarda muestra el aro y su gerundio (115) y lo que carga no salta (160)?
10. **Estados y mensajes:** ¿están la carga, los dos vacíos, el error con reintento, la falta de permiso en cada acceso (organización, persona y Plataforma), «Organización no disponible», la espera de un 429 y el conflicto? ¿Cada mensaje tiene un solo dueño: el resultado en el aviso de abajo (210), la validación junto al campo y la decisión en una confirmación?
11. **Lo mismo, igual en toda la app:** ¿lo que ya tiene forma en otra pantalla usa la misma pieza (los filtros, como chips)? ¿Solo tokens, la escala (180) y medidas en `rem`? ¿Fechas solo con números (205) y números y porcentajes con la región del idioma (207 y 208)?
12. **Teléfono, teclado e idiomas:** ¿funciona desde 320 px sin desplazar de costado, con 44 para tocar, con teclado y lector de pantalla, con los textos del sistema en español y en inglés (el contenido no tiene idioma, 35) y con el estado de una colección en la URL?
13. **Datos de verdad:** ¿se diseñó con datos de verdad y las medidas de la app real: 331 opciones, textos largos, nombres en inglés, celdas vacías, varias versiones de un formulario y un bloque con muchos ítems (269)?

## Criterio, en corto

Lo que manda son los tableros «Criterio · …». Estas son las decisiones que más se repiten:

- **Compacto, con la escala de ArquitecturaBase** (180, desde la versión 166). Letra de 10,7, nunca menos de 10,5. Botones de 27, y de 24 los chicos; el ingreso y el registro usan 33. Campos de 27 y filas de 30; esquinas de 3 como mucho. El teléfono conserva 44 × 44.
- **Sin plantilla** (173, desde la versión 165): la marca es el nombre, sin cuadrado; el avatar, un cuadrado chico; el activo del menú, una barra de 2 px; el principal, sólido; sin pastillas ni sombras, salvo en menús, desplegables y tooltips; el panel del ingreso, liso (189). El texto largo se ve entero (174), salvo la vista previa de la lista de chats (188), y lo que carga no salta (160).
- **Encabezados con color arena:** tablas, cajas y diálogos (`oklch(0.945 0.027 95)`, el paja de la paleta «Pradera»). Filas alternadas, sin mayúsculas.
- **Nada de texto explicativo en la pantalla** (regla del 2026-10-02).
  - El estado se dice una sola vez, arriba, con color y palabra corta: «● Despublicada por la plataforma».
  - El detalle (cuándo, el motivo, qué hacer) va detrás de un ⓘ, que abre un diálogo de aviso importante. Ese diálogo tiene el motivo destacado en rojo suave y «Qué podés hacer» en pasos numerados.
- **Sin etiquetas.** Nada de pastillas ni rótulos con fondo al lado de un texto («Principal», «Suspendida», «De sistema»).
  - El estado va en la segunda línea, como punto de color y palabra.
  - Lo que estaba al lado del título va en la segunda línea de la banda, separado por «·».
- **Formularios:**
  - una caja por tema, con encabezado arena;
  - rótulo arriba;
  - dentro de una caja, todas las filas comparten las mismas columnas, en general dos iguales, y **ocupan todo el ancho de la caja**; un texto largo ocupa las dos (regla del 2026-10-02, que reemplaza a «cada campo del ancho de su dato»);
  - sin ayudas debajo;
  - lo que no se edita se muestra como texto, nunca como campo gris;
  - lo corto (agregar, verificar, confirmar) va en un diálogo.
- **Avisos y errores** (210):
  - el fondo nunca dice el tipo: todo aviso es blanco, con un filo de 3 px a la izquierda y el ícono del color de su tipo, y la ✕ adentro, a la derecha; en el teléfono, la franja oscura, con el mismo filo e ícono;
  - lo que salió bien: abajo a la derecha, y se va solo;
  - una acción directa que falló: se va sola a los 10 s; si trae una acción, como «Copiar código», queda hasta cerrarlo;
  - un error de formulario: debajo del campo, o en una franja arriba;
  - el estado, una vez, en la banda; lo que llegó, lo que falló en segundo plano y lo que espera a alguien, en la campana (el único cartel en el cuerpo es el que bloquea la pantalla entera);
  - lo que no se deshace: un diálogo de confirmación, sin ✕ y con el botón rojo lleno.
- **Botones** (decisión del usuario del 2026-10-24):
  - un botón está habilitado o grisado, sin textos al lado ni debajo; si el motivo no es obvio, va en un tooltip sobre el control entero, que se abre también con un clic o un toque, igual en el teléfono (211);
  - «Guardar cambios» se habilita cuando hay cambios, y al salir con cambios se pregunta «¿Salir sin guardar?»; la banda no dice «Cambios sin guardar» ni muestra revisiones;
  - lo que necesita algo antes queda grisado, como publicar con cambios sin guardar;
  - mientras trabaja, el botón pone el aro y su gerundio («Guardando…»), con su color (decisión 115 del 2026-11-02, que reemplaza lo decidido el 24/10);
  - mientras dura un límite de pedidos, también: cuándo se puede volver a probar lo dice el aviso de error («Reenviar en 30 s», al pedir un código, queda hasta que el usuario decida);
  - «Descartar cambios» siempre está habilitado;
  - el único ícono que lleva un botón es el «+».
- **Menús:**
  - las acciones de fila y lo que no es la tarea de la pantalla van en ⋮: corregir, anular, dar de baja, reactivar, eliminar, descargar la plantilla, ordenar; lo destructivo al final, en rojo (209);
  - tu menú, arriba a la derecha, tiene Perfiles, Mi cuenta y Salir;
  - Administración es un segundo panel al lado del menú lateral;
  - una línea fina entre cada opción de un menú desplegable, y una franja antes de las de peligro;
  - una línea fina entre cada opción del menú lateral y de su panel, como la que separa Administración;
  - la flechita que contrae el menú lateral va en blanco.
- **Listas:** se paginan con más de 10 elementos. Pestañas, solo si hay dos tablas o más. Un dato por columna (206): nada al lado del dato y ninguna celda resume otra tabla; nada debajo de otro dato, tampoco un texto en gris (263); toda columna con un dato ordena, con ↑ o ↓ y «Ordenar por» (264), y ninguna fila lleva un botón con texto (261).
- **Fechas y números** (205 y 208): «27/09/2026, 14:35», con la coma; un mes, como su rango, «01/10/2026 – 31/10/2026», nunca en letras; el porcentaje, pegado, «12,5%».
- **Roles** (260, que reemplaza a la 212): los permisos, en áreas plegables, con lo incluido y lo que no se puede dar apagados con su motivo, en cada acceso.
- **«Tenant» nunca en pantalla:** se dice «Organización».

## Generadores

Son scripts de Python 3, sin dependencias. Escriben los tableros y `canvas.json` en esta carpeta y se corren desde `generadores/`:

| Script | Qué hace |
|---|---|
| `criterio_*.py` | Los 8 tableros de «Criterio de diseño». Cada decisión nueva suma una fila en `criterio_decisiones.py` y, si deja una regla, se escribe también en el tablero de esa pieza |
| `auditoria_plat_dialogo.py` | Alinea el detalle de Auditoría de Plataforma, escritorio y teléfono, con `Criterio-Dialogos`, conservando los datos y la lógica. |
| `menu_plataforma.py` | Aplica a los ocho tableros de escritorio de Plataforma la agrupación aprobada Gestión / Administración. Conserva el contenido y los estados. Corre después de reconstruir estos tableros; es idempotente. |
| `perfil_tableros.py` | Perfil personal: Inicio, Mi cuenta y sus diálogos, con las versiones de teléfono |
| `whatsapp_tableros.py` | Los 15 de WhatsApp. Las piezas comunes (`w-*`, íconos, banda) salen de acá. |
| `org_formularios.py` | Configuración, Página pública y sus diálogos |
| `org_formularios2.py` | Usuario, Rol y Avisos. Rehace el dibujo y conserva la lógica de cada tablero. |
| `wa_vuelta_1003.py` | WhatsApp aprobado el 2026-10-03: corre las propuestas elegidas (`whatsapp_1003/propuestas`) sobre la copia de partida (`whatsapp_1003/base`), deja los 24 tableros con sus enlaces, suma lo de WhatsApp a Rol, Usuarios, Mensajes, el perfil personal y el menú de Plataforma, y acomoda la página. Corre al final. |
| `wa_telefonos_1004.py` | Los 27 teléfonos de WhatsApp en formato app: corre `telefonos_1004/app_todas.py` y `app_numeros.py` sobre la copia de partida (`telefonos_1004/base`), les pone nombre (`M-WA-*`), enlaces y título, y los acomoda en cuatro filas. Las piezas del marco de app salen de `telefonos_1004/app_marco.py` y `app_estilo.py`. |
| `org_telefonos_1004.py` | Los 14 teléfonos de Organización en formato app: corre `telefonos_1004/app_org.py`, les pone nombre (`M-*`), enlaces y título, y los acomoda en la página. Corre después de `wa_telefonos_1004.py`. |
| `plat_personal_telefonos_1004.py` | Los 16 teléfonos de Plataforma y del perfil personal en formato app: corre `telefonos_1004/app_plat_personal.py`, les pone nombre, enlaces y título, y los acomoda. Corre después de `org_telefonos_1004.py`. |
| `cuenta_wa_1004.py` | Mi cuenta › WhatsApp en la compu (Etapa 8): estados de agregar, verificar, quitar o hacer principal, y sin el módulo; crea Cuenta-Metodo. |
| `cuenta_wa_telefonos_1004.py` | Mi cuenta › WhatsApp en el teléfono: rehace M-Cuenta, M-Cuenta-Agregar y M-Cuenta-Verificar con sus estados y crea M-Cuenta-Metodo. Corre después de `plat_personal_telefonos_1004.py`. |
| `plat_vuelta_1004.py` | Plataforma en la compu con el criterio: celdas de dos líneas, auditoría sin ojo y con el detalle en grilla, la ficha de organización con pestañas, «Registro y altas» y WhatsApp en el menú. Antes corren `aplicar_criterio.py` y `criterio_marcado.py` sobre los 8 tableros; después, `plat_ajustes_1003.py`. |
| `mi_cuenta_sin_revelar_1004.py` | Mi cuenta sin revelar si un correo o un número tiene cuenta (ADR 0041): el aviso «Método de ingreso: ya es de una cuenta» en Mensajes. El estado de error sale de los generadores de Mi cuenta › WhatsApp. |
| `recuperar_sin_revelar_1004.py` | «Recuperar mi cuenta» sin revelar si el correo nuevo ya tiene cuenta (saca el error) y el aviso «Recuperación: ya tiene una cuenta» en Mensajes. |
| `alta_meta_1004.py` | El alta de Meta (alta embebida de WhatsApp): la ventana de Meta tal cual en sus 8 pasos (WA-Alta-Meta) y en la coexistencia (WA-Alta-Coexistencia), copiada de las capturas de su documentación; lo nuestro antes y después, «Atiende a», conectado, cancelado y error (WA-Alta, M-WA-Alta), y el número de la plataforma (Plat-WA-Alta, M-Plat-WA-Alta). Se rehace entero y registra los tableros en `canvas.json`. Corre después de `plat_wa_1004.py` y `plat_wa_telefonos_1004.py`, porque parte de sus tableros y de los de Números. |
| `baja_plataforma_1004.py` | El aviso «La plataforma inició la baja de tu cuenta» en Mensajes (ADR 0035), en dos variantes: cuenta activa (con «Ingresar» para cancelarla) y cuenta suspendida (sin «Ingresar» y con el correo de soporte). Por WhatsApp, `baja_cuenta_plataforma` y `baja_cuenta_plataforma_suspendida`. |
| `rol_descartar_1004.py` | Rol y M-Rol con los botones de una edición: «Descartar cambios» al editar un rol y «Cancelar» al crearlo. Corre después de los generadores de Organización. |
| `recuperar_aviso_1004.py` | El aviso «Alguien pidió recuperar tu cuenta» en Mensajes: a los métodos de la cuenta que siguen andando, antes de que lo revise un operador, con el correo de soporte (plantilla `recuperacion_aviso_cuenta`). |
| `operador_invitacion_1004.py` | La invitación de un operador con vencimiento (ADR 0042, 2026-10-04): el correo en Mensajes (quién invita, permisos y vencimiento) y el operador invitado en Cuentas y M-Cuentas, con «Reenviar invitación» y «Revocar invitación». |
| `auditoria_sin_cantidades_1004.py` | Las auditorías de Plataforma y de la organización sin la cantidad en cada opción de filtro (regla R8). |
| `viejos_criterio_1004.py` | Tableros que habían quedado viejos frente al criterio: pestañas subrayadas en Empresa, Organizacion y Cuenta-Plat, y los íconos de Usuarios en el panel Administración de los tableros con `w-panel`. |
| `telefonos_sin_revelar_1004.py` | «Cargar teléfonos de empleados» sin revelar si un número tiene cuenta (ADR 0041): «Ya es miembro», «Se invita» o «Número inválido», en WA-Telefonos y M-WA-Telefonos. |
| `portada_sin_empresas_1004.py` | Etapa 7: el estado «Sin empresas» de la sección de empresas en Landing y Landing-Movil, y las rutas del contrato sin prefijo de acceso (`/api/public-site`, `/api/directory`) en los comentarios. |
| `correcciones_cuenta_rol_1004.py` | El ⋮ de «Cómo entrás» solo en las filas con acciones (Cuenta y M-Cuenta, con sus estados de agregar, verificar y dar de baja) y «Vale en toda la organización» en minúscula en Rol. |
| `empresa_dialogo_1004.py` | El error del diálogo de roles de Empresa como franja roja clara arriba de los botones. |
| `fondo_oscurecido_1004.py` | Saca el difuminado del fondo de los diálogos (`.velo`) en los tableros vivos y en las copias de los generadores: atrás, solo oscurecido. |
| `banderas_1004.py` | La bandera de cada país en el selector de los teléfonos (el SVG 3:2 de `country-flag-icons`, a 24×16), en la lista y en el control cerrado, en los 13 tableros con un teléfono. Corre después de los generadores de esas pantallas. |
| `operador_repetido_1004.py` | «Invitar operador» con un correo que ya tiene una invitación: «Ese correo ya tiene una invitación. Reenviala desde la lista.». |
| `operador_sin_nombre_1004.py` | Mensajes: «Invitación como operador: sin nombre», firmada por «El equipo de ArquitecturaBase». |
| `consultas_1004.py` | Consultas del 2026-10-04: «Administración» debajo del título en M-Error-Org y M-Auditoria-Org; las hojas de «Estado» y «Roles» en M-Usuario; país y número en dos campos en M-Pagina-Org. Corre después de `banderas_1004.py` y de `operador_repetido_1004.py`. |
| `empresa_anchos_1004.py` | Ficha de Empresa: «Roles de …» y «Agregar miembro» en el diálogo chico, 420; la franja de error con el ícono arriba. |
| `error_pantalla_tel_1004.py` | M-Error-Org suma el estado «No se pudo abrir»: «No pudimos abrir esta pantalla» con «Reintentar». |
| `sumar_empresa_1004.py` | «Sumar empresa»: «Empresa» con asterisco y «Roles en la empresa» solo después de elegirla, opcional (Usuario); sin asterisco en los roles de M-Usuario-Empresa. |
| `paises_lista_1004.py` | Mi cuenta › Agregar (compu): la lista de países con las filas de Criterio · Formularios y el buscador como campo, como `SearchSelect`. Corre después de `cuenta_wa_1004.py` y `banderas_1004.py`. |
| `paises_sin_buscador_1004.py` | Cuenta-Agregar y M-Cuenta-Agregar sin «Buscar país» mientras haya un solo país: el buscador va con más de 10 opciones. Corre después de `paises_lista_1004.py`. |
| `panel_admin_1004.py` | Panel de Administración con la pieza del criterio en Usuarios, Roles, Empresas, Empresa, Auditoria-Org e Inicio-Org: abre solo el grupo de la pantalla en la que estás, filas de 32 y WhatsApp como grupo. |
| `marco_criterio_1004.py` | Marco del criterio en los 16 tableros con el marco viejo (8 de Organización y 8 de Plataforma): perfil, opciones de 32, pie y migas; sin ☰; Plataforma › Administración con WhatsApp como grupo. Corre después de `panel_admin_1004.py`. |
| `avatar_degrade_1004.py` | El círculo con la inicial (`.w-av`, `.ap-nav .yo`, `.av` liso) con el degradé de la marca en todos los tableros. |
| `buscador_36_1004.py` | El buscador de las nueve listas con la pieza vieja (`.fb-bus`) a 36 de alto y 360 de ancho. |
| `rotulos_1004.py` | Los rótulos de los campos de la compu (`.w-cmp .rt`) con interlineado de 18,75. |
| `registro_direccion_1004.py` | «Dirección de la página» del registro de empresa a 44 y radio 10, en la compu y el teléfono. |
| `avisos_1004.py` | M-Avisos con `.ap-txt-l`; el cartel de atención en la invitación aceptada; `.msj` de ingreso y registro con triángulo en los de atención, radio 8 en la compu y la franja de 14,5 en el teléfono. |
| `enmascarado_1004.py` | Datos tapados como `PersonalDataMask`: teléfono «•••• 4521», correo «lu•••@…» y el correo de la invitación tapado en Auditoría. |
| `cuit_valido_1004.py` | Los CUIT de ejemplo con el dígito verificador correcto. |
| `dialogos_r2b_1004.py` | Cuerpo de los diálogos con 20 de margen y 14 entre campos; «Sumar» de «Sumar empresa» nunca apagado; «Todos» en M-Usuario-Empresa. |
| `estados_util.py` | Ayudas para sumar estados clonando uno que ya existe (`clonar`, `con_estados_pantalla`, `hoja`, `campo`) y el CSS común del teléfono. La usan los `estados_*_1004.py`. |
| `estados_invitacion_1004.py` | Invitación y M-Invitacion: cargando, aceptando y error al aceptar. |
| `estados_inicios_1004.py` | Inicio personal sin el aviso, M-Inicio-Org «Nada para resolver» y el tablero nuevo M-Inicio-Miembro (con su lugar en `canvas.json`). |
| `estados_cuenta_1004.py` | Mi cuenta: correo inválido, código incorrecto, vincular y desvincular Google, la baja con errores, la sesión cerrada por la baja (Sesion y M-Sesion), los avisos de cada acción y «Cambios sin guardar» en el teléfono. |
| `estados_rol_tel_1004.py` | M-Rol: crear un rol, Recursos humanos y el rol Dueño. |
| `estados_org_1004.py` | Organización: 409 de «Sumar empresa», crear empresa con el CUIT repetido, las hojas del teléfono (roles de una empresa, crear y editar empresa, roles de un miembro), la pestaña Roles, Configuración y Página pública en el teléfono y el error al guardar la página. |
| `config_plat_correos_1004.py` | Configuración de la plataforma con la sección «Contacto»: correo de ventas y de soporte. El teléfono lo arma `telefonos_1004/app_plat_personal.py`. |
| `plat_menu_wa_1004.py` | Menú de Plataforma en la compu con WhatsApp solo para consultas: «WhatsApp» va directo a Consultas y Administración › WhatsApp lleva a los tableros Plat-WA-*. Corre después de `plat_vuelta_1004.py` y `plat_ajustes_1003.py`. |
| `plat_wa_1004.py` | Plataforma › WhatsApp en la compu (Etapa 11), a partir de los tableros de WhatsApp de la organización: Consultas, Número, Bot (con su recorrido), Equipos y Plantillas. |
| `plat_wa_telefonos_1004.py` | Plataforma › WhatsApp en el teléfono. Corre después de `plat_personal_telefonos_1004.py`. |
| `plat_ajustes_1003.py` | Ajustes aprobados en la otra conversación: Cuentas sin Teléfono, los métodos de la ficha de cuenta como en Mi cuenta y Documentos legales como lista. Les saca «· por refinar» a los títulos. |
| `wa_ajustes_1004.py` | En la compu: la nota interna se prende con un botón al lado de donde se escribe, e «Importar contactos» va sin casilla y con «Descargar ejemplo». |
| `menus_con_lineas.py` | Suma a todos los tableros la línea entre las opciones de los menús desplegables. Corre al final. |
| `lineas_menu_lateral.py` | Suma a todos los tableros la línea entre las opciones del menú lateral y de su panel. Corre al final. |
| `faltan_1004.py` | Los teléfonos que faltaban, en formato app: Sesión, Organización no disponible, Sin permiso o no encontrada y Avisos. Corre antes de las reglas finales. |
| `inicio_1004.py` | Inicios de la organización y del miembro, y el teléfono del inicio, aprobados el 2026-10-03. Corre antes de las reglas finales: el teléfono se arma entero cada vez. |
| `publico_1004.py` | Sitio público aprobado pantalla por pantalla (Etapa 7): la portada con la sección del directorio, el directorio en tarjetas y la página pública en una tarjeta, y sus teléfonos como web. |
| `flechita_blanca.py` | El botón redondo que contrae el menú lateral va en blanco, con borde arena, en todos los tableros que lo tienen. Corre al final. |
| `org_vuelta_1002.py` | Las decisiones de la vuelta de Organización del 2026-10-02 sobre los tableros de escritorio, y les saca «· para aprobar» a los aprobados. Corre después de `org_formularios2.py`. |
| `conectar_paginas.py` | Enlaces entre páginas: tu menú, el menú de WhatsApp y la entrada WhatsApp en Organización |
| `aplicar_criterio.py`, `criterio_marcado.py`, `terminos_sin_deshabilitar.py` | Pasan al criterio los tableros viejos sin rehacerlos |
| `etapa11_1004.py` | Etapa 11 (v123): los estados que faltaban y las contradicciones del plan en los tableros de WhatsApp, Usuarios, Cuenta-Plat y Mensajes, y los datos de ejemplo coherentes (ningún número de empleado y de cliente a la vez; las difusiones, solo a quienes aceptan). Corre al final, después de `formularios_catalogos_1004.py`. Cada tablero lleva la marca `data-e11` y no se vuelve a tocar; para rehacer uno, se restaura desde git y se corre de nuevo. |
| `paleta_pradera_1004.py` | La paleta «Pradera» (2026-11-04) en los 438 tableros: lleva cada color de la paleta vieja al nuevo según su papel, pone «pendiente» en celeste y el color del sistema primero en el diseño del PDF. Corre al final de todo y se puede volver a correr. |
| `reglas_7_11_1004.py` | Las reglas del traspaso 10 en los «Criterio» (2026-11-07): la primera carga y el texto entero en Tablas, la página que espera y que no parezca plantilla en Marco, un ajuste y ninguna elección en silencio en Formularios, decidir a propósito en Diálogos, el estado una vez en Avisos, el activo con barra en Menús y el principal sólido en Botones, con el alto nuevo de cada uno. Corre después de `reglas_3_11_1004.py` y antes de `criterio_decisiones.py`; rehace sus secciones si se vuelve a correr. |
| `traspaso10_piezas_1004.py` | Las piezas del traspaso 10 en los tableros vivos (2026-11-07 y 08): un bloque `data-t10="piezas"` que deja la marca sin cuadrado, la banda sin ícono, el avatar cuadrado, el activo con una barra, el principal sólido y sin sombras salvo en menús; suma la línea entre columnas, saca las cantidades de los filtros y el total de la barra, dice «Filtros», dibuja la primera carga de un listado con el aro, deja el texto entero (salvo la vista previa de los chats), tilda la elegida de un filtro, deja liso el panel del ingreso y corta los correos después de la «@» al dibujar. Desde la v175 suma los avisos según el tipo (210, `CSS_AVISOS`): blancos, con el filo y el ícono de su tipo. En la compu aplica la escala de ArquitecturaBase (180), con sus factores en `ESCALA` y el px de antes guardado al lado; los teléfonos no se escalan. Las sombras se calculan tablero por tablero. Corre al final de todo, después de `paleta_pradera_1004.py`, y se puede volver a correr; con `--tableros A,B`, solo sobre esos. |
| `fechas_completas_1004.py` | Las fechas completas en los tableros vivos (v171, 2026-11-09), con la regla de `docs/rules/formatos.md`: la invitación, la campana y los teléfonos de los Criterio, las filas y el separador de los chats de la 16 y de la 19 a la 21, los momentos de una respuesta de la 21 y la 23, y las semanas del tablero de un formulario. Solo cambia textos; corre después de `paleta_pradera_1004.py` y antes de la pasada de las piezas, y se puede volver a correr. |
| `galeria_base12_1004.py` | Lo que encontró la galería de la base de la 12 (v172, 2026-11-09), copiado de la app: las pestañas sin cantidad de `Organizacion` y `Cuenta-Plat`, ‹ en `M-Recuperaciones` y `M-WA-Difusiones`, lo contado de la campana sin leer y «Avisos» con la barra de abajo, la campana de `M-Inicio-Miembro` y los correos de `Mensajes` con el texto y la fecha del back. Corre después de `fechas_completas_1004.py` y antes de la pasada de las piezas, y se puede volver a correr. |
| `eje_por_dia_1004.py` | El eje de los gráficos por día con la fecha completa (v173, 2026-11-10), en el tablero de un formulario de la 15, la 19 y la 21, con sus teléfonos: una marca cada lunes en la compu y cada tres días en el teléfono, el cartel de cada barra con su fecha, el estado «Una barra: su cartel» y las barras de la compu en proporción a su valor. Desde la v174, el eje por semana marca el lunes y el cartel lleva el rango. Corre después de `galeria_base12_1004.py` y antes de la pasada de las piezas, y se puede volver a correr. |
| `dolares_1004.py` | El dólar con su símbolo (v174, 2026-11-10): los importes en dólares de `Mensajes` y de las pantallas del asistente, como `MoneyText` («US$ 100,00»), con un control que no deja otro «USD» en el lienzo vivo salvo donde la app muestra el código (el prefijo de un `MoneyField` fijo y el selector de monedas). Corre después de `eje_por_dia_1004.py` y antes de la pasada de las piezas, y se puede volver a correr. |
| `traspaso15_textos_1004.py` | Las fechas y los números del traspaso 15 en los tableros vivos (v175, 2026-11-18; decisiones 205 y 208): la hora después de una coma, el mes como su rango en «Uso del asistente» y en los correos del tope, y el porcentaje pegado. Solo cambia textos, también en los datos de cada estado. Corre después de `dolares_1004.py`, y se puede volver a correr. |
| `reglas_t15_1004.py` | Las reglas del traspaso 15 en seis «Criterio» (v175; 206 a 213): un dato por columna y las fechas en Tablas, el ⋮ y lo apagado en Botones, el ⋮ de una banda en Menús, la grilla y la frase en Diálogos, una cosa, una zona y el número ambiguo en Formularios, y los avisos según el tipo en Avisos, con el alto nuevo de cada uno en `ALTOS`. Corre después de `traspaso15_textos_1004.py` y antes de la pasada de las piezas; rehace sus secciones si se vuelve a correr. |
| `roles_matriz_1004.py` | Los permisos de un rol y de un operador de Plataforma, en una matriz (v175, 2026-11-18; 212): una fila por área con Ver, Administrar y «Otros permisos», la casilla del área y la (i) con qué permite cada uno, en `Rol`, `M-Rol`, `Cuenta-Plat`, `M-Cuenta-Plat` y la invitación de `Cuentas`; en el teléfono, una banda por área. Los nombres salen de `Permissions.resx` del back. Corre después de `traspaso15_textos_1004.py` y se puede volver a correr; si otro generador rehace esos diálogos, este corre después. |
| `base2_1004.py` | La segunda parte de la base (v180, aprobada en la v181, 2026-11-23): corre `base2_criterio_1004.py`, `base2_roles_1004.py`, `base2_personas_1004.py`, `base2_filas_1004.py`, `base2_whatsapp_1004.py` y `base2_config_1004.py`, que escriben los 41 tableros de la página «Segunda parte de la base» desde la copia de `base2_1004/` (la arma `capturar.mjs`), la pasada de las piezas sobre ellos y su lugar en `canvas.json`. Las piezas comunes (áreas plegables, la pieza para elegir, el orden, las tarjetas del teléfono y la entrega) están en `base2_comun.py`. `--canvas <ruta>` escribe en otro `canvas.json` (el publicado, traído al scratchpad), `--solo-registrar` no rehace los tableros y `--sin-archivo` saca la página «Archivo». Se puede volver a correr. |
| `acciones_asistente_1004.py` | La etapa «Acciones del asistente» (v177, 2026-11-23; ADR 0068): los diez tableros de la página «Propuesta · Acciones del asistente» y su lugar en `canvas.json`. Parte de la copia de las pantallas de siempre de `acciones_asistente_1004/` (la arma `capturar.mjs`, con Playwright del front) y escribe las medidas de antes de la escala; después corre la pasada de las piezas con `--tableros` sobre esos diez. Se puede volver a correr. |
| `avisos_iconos_1004.py` | El octógono del error en los avisos de los tableros vivos (v175; 210), en lugar del círculo con «!», que queda para la ⓘ. Corre después de `reglas_t15_1004.py` y antes de la pasada de las piezas, y se puede volver a correr. El filo de cada tipo lo pone la pasada de las piezas (`CSS_AVISOS`). |

Después de correr `perfil_tableros.py`, `whatsapp_tableros.py` u `org_formularios.py`, corré `conectar_paginas.py`: esos tres dibujan el menú sin enlaces. `conectar_paginas.py`, `org_formularios2.py`, `org_vuelta_1002.py`, `wa_vuelta_1003.py`, `wa_telefonos_1004.py`, `org_telefonos_1004.py`, `plat_personal_telefonos_1004.py`, `wa_ajustes_1004.py`, `menus_con_lineas.py` y `flechita_blanca.py` se pueden volver a correr sin cambiar lo que ya está; los de 1004 van al final, después de `wa_vuelta_1003.py`, `perfil_tableros.py` y `conectar_paginas.py`, porque rehacen los teléfonos en formato app. Los otros reescriben `canvas.json`, así que revisá el diff antes de publicar. Para rehacer un formulario, se copia el formato de `org_formularios.py` y nunca se maquilla con CSS encima.

## Publicar en claude.ai

Se publica desde Claude Code, con la herramienta Artifact y la `url` de arriba:

1. **Leé antes de publicar.** Leé el lienzo (`read`) y compará `canvas.json` con esta copia: el dueño también edita y guarda desde la página.
2. **Todo va bajo `project/`.** Cada archivo se publica como `project/<archivo>`, por ejemplo con `files` = `{"project/Rol.dc.html": "docs/design/lienzo/Rol.dc.html", …}`. El `file_path` es `canvas.json` publicado como `project/canvas.json`. Lo que queda fuera de `project/` no se ve.
3. **Reglas del `canvas.json`:**
   - todo tablero y toda nota llevan `page`;
   - el `maxW` de una nota no pasa de 8000;
   - un tablero sin `"is_interactive": true` no muestra Play.
4. **Enlaces entre tableros e índices:** `<a href="X.dc.html">` mueve Play a ese tablero aunque esté en otra página. Toda pantalla nueva nace con sus enlaces **y en su índice**: se suma a su pantalla en `../guia/recorrido.py` (el mismo orden de la guía) y se corre `generadores/indices_1004.py`, que rehace el índice general y el de cada área en la página «Índice y mapas».
5. **Las propuestas nuevas** van en su propia página («Propuesta · …»). Cuando se aprueban, pasan a la página de su área. Las versiones reemplazadas van al Archivo.
6. **Después de publicar,** traé la versión nueva a esta carpeta y commiteala.
