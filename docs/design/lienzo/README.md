# Lienzo del sistema visual

Copia de la **versión 132** (2026-10-18) del lienzo «Sistema visual · Multitenant», que vive en claude.ai como artefacto de tipo Design: <https://claude.ai/artifact/WzoVTM574QGka8nCU4iFEK> (privado, de la cuenta del dueño). Tiene 269 tableros `.dc.html`, `canvas.json` (páginas, posiciones y notas), el motor `support.js`, los recursos de `ds/` y los scripts que los generan, en `generadores/`.

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

Los generadores de Formularios leen sus tableros base de commits fijos (`f2f8e5bb` y `d5d5edc5`) para no seguir cambios posteriores de otros generadores.

**La guía del lienzo** recorre estas pantallas en el orden en que una persona usa el sistema: <https://claude.ai/artifact/3afhCQaqwMx6kLxY4B6gpZ>. Se regenera y se publica con cada versión del lienzo; cómo, en [`../guia/README.md`](../guia/README.md).

Esta carpeta es la fuente de cada pantalla y de sus estados: **un tablero validado manda sobre cualquier descripción textual** de la arquitectura, las fichas o el plan. Antes de programar una pantalla, buscá su tablero y copiá sus estados, contenido y disposición. Una pantalla nueva se dibuja primero y se programa después de que el usuario la elige.

## Páginas y estado

El título de cada tablero dice en qué estado está:

- **sin marca:** validado por el usuario; se puede programar;
- **«· para aprobar»:** refinado con el criterio y esperando el visto bueno;
- **«· por refinar»:** dibujado antes del criterio; no se programa así.

| Página | Tableros | Estado |
|---|---|---|
| Criterio de diseño | 8 | Validado. Es la regla de botones, tablas, diálogos, formularios, avisos, menús y marco. «Decisiones por pantalla» anota lo que el usuario eligió en cada pantalla y las reglas que salieron de eso. El lienzo abre acá. |
| Índice y mapas | 14 | El índice general, un índice por área (los capítulos de la guía, con una tarjeta por pantalla que lleva a su compu, su teléfono y lo que se abre desde ahí) y los dos mapas: quién es quién y todos los casos del ingreso. |
| Sitio público | 6 | Aprobado el 2026-10-03 (Etapa 7), pantalla por pantalla: la portada (con la sección «Empresas en ArquitecturaBase»), el directorio en tarjetas (`/empresas`) y la página pública en una tarjeta centrada, con sus tres estados. Los teléfonos son web, no app: una columna y ☰ arriba. |
| Ingreso y registro | 20 | Validado. Desde el 2026-10-03 suma los teléfonos de Sesión y de Organización no disponible, en formato app. |
| Perfil personal | 15 | Validado. Los 7 teléfonos están en formato app desde el 2026-10-03. Mi cuenta suma los estados de WhatsApp (Etapa 8): agregar y verificar un número, quitarlo o hacerlo principal, y sin el módulo. |
| Organización | 41 | Escritorio y móviles aprobados el 2026-10-03, con los dos inicios: las áreas en tarjetas y «Para resolver» como tabla. Los 17 teléfonos están en formato app (el del inicio, como una billetera), con los de Sin permiso y Avisos. |
| Organización · WhatsApp | 55 | Escritorio y teléfonos aprobados el 2026-10-03, pantalla por pantalla (Etapa 11 ampliada). Los 27 teléfonos son los primeros en formato app. El alta de Meta no se dibuja hasta que el usuario lo pida. |
| Plataforma | 38 | Aprobada el 2026-10-03, compu y teléfonos. En la compu, Gestión, WhatsApp y Administración abren un segundo panel; en el teléfono, barra de abajo (Organizaciones, Cuentas, Recuperaciones, Chats y Más). Plataforma › WhatsApp (Etapa 11), aprobado el 2026-10-03: solo consultas, con Consultas, Número, Bot, Equipos y Plantillas, en la compu y en el teléfono; la barra de abajo lleva «Consultas». |
| Textos y mensajes | 2 | Validado |
| Organización · Formularios | 39 | Rehecha el 2026-10-17 con la disposición de ArquitecturaBase, aprobada: Etapa 12 (listado, editor, publicar, cómo termina, enviar y la respuesta en el chat), Etapa 13 (catálogos, editor a mano y con filtros), Etapa 14 (fotos y documentos, con el visor, aprobada el 18/10), Etapa 15 (respuestas: la planilla, los filtros, el detalle al costado y Excel, aprobada el 18/10), Etapa 16 (reglas, aprobación, PDF y avisos, aprobada el 18/10) y la biblioteca de la organización (Etapa 17), con sus teléfonos. |
| Plataforma · Formularios | 7 | Etapa 17, aprobada el 2026-10-17: biblioteca, plantilla, publicar, retirar y categorías. Desde el 18/10, la plantilla usa el editor de la Etapa 12. |
| Archivo | 24 | Descartado. Son versiones anteriores; están como referencia y no se programan. Desde la versión 128, los tableros de la Etapa 12 del 13/10; desde la 129, los de la Etapa 13 del 13 y 14/10. |

La aplicación se migra al criterio visual por etapas: Mi cuenta y las piezas compartidas se abordaron en la Etapa 4; las pantallas de Organización aprobadas se implementan en la Etapa 6. Los dos inicios de Organización siguen pendientes de diseño.

Ajuste solicitado el 2026-10-03: el detalle de Auditoría de Plataforma usa el encabezado arena de `Criterio-Dialogos`, con la fecha en el cuerpo, datos de lectura y cierre compacto. En teléfono aparece desde abajo y ocupa todo el ancho. Este ajuste no aprueba el resto de Plataforma ni las propuestas de WhatsApp.

Navegación de Plataforma elegida el 2026-10-03: **Gestión**, arriba, agrupa Organizaciones, Cuentas y Recuperaciones; **Administración**, al pie, agrupa Auditoría, Documentos legales y Configuración. En escritorio se abre un único segundo panel al lado del menú principal, con la sección actual marcada. La aprobación alcanza esta distribución y el ajuste del modal de Auditoría; no autoriza las propuestas de WhatsApp. Los dueños usan el panel de Organización y no este menú global.

**El teléfono es una app** (decisión del 2026-10-03, «Criterio · Marco y pantallas»): barra de estado arriba y título grande en la barra, con la organización debajo; barra de abajo con hasta cuatro secciones y «Más»; listas de borde a borde; lo que en la compu es un diálogo es una hoja desde abajo con manija; crear es un «+» flotante; la acción de una tarea va fija abajo. Nada de la web achicada (marca arriba, banda, cajas con cabecera beige, menú ☰). Todos los teléfonos con sesión iniciada (WhatsApp, Organización, Plataforma y perfil personal) ya están así; el ingreso, el registro y el sitio público no llevan la barra de abajo.

## Verlo sin claude.ai

Serví esta carpeta con un servidor estático, por ejemplo con `python -m http.server`, y abrí `<Tablero>.dc.html`. Cada estado se elige con el control **Tweak**. El estado inicial está en el atributo `data-props` como `default`.

## Criterio, en corto

Lo que manda son los tableros «Criterio · …». Estas son las decisiones que más se repiten:

- **Compacto.** Letra de 13. Botones de 36, y de 32 los chicos; solo el ingreso y el registro usan 44. Campos de 36.
- **Encabezados con color arena:** tablas, cajas y diálogos (`oklch(0.945 0.018 76)`). Filas alternadas, sin mayúsculas.
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
- **Avisos y errores:**
  - lo que salió bien: aviso verde abajo a la derecha, que se va solo;
  - una acción directa que falló: aviso rojo con ✕, que no se va solo;
  - un error de formulario: debajo del campo, o en una franja arriba;
  - lo que sigue pasando: un cartel debajo de la banda;
  - lo que no se deshace: un diálogo de confirmación, sin ✕ y con el botón rojo lleno.
- **Botones:**
  - solo «Guardar cambios» se apaga cuando no hay cambios;
  - «Descartar cambios» siempre está habilitado;
  - nada se deshabilita sin explicar por qué;
  - el único ícono que lleva un botón es el «+».
- **Menús:**
  - las acciones de fila y las secundarias van en ⋮;
  - tu menú, arriba a la derecha, tiene Perfiles, Mi cuenta y Salir;
  - Administración es un segundo panel al lado del menú lateral;
  - una línea fina entre cada opción de un menú desplegable, y una franja antes de las de peligro;
  - una línea fina entre cada opción del menú lateral y de su panel, como la que separa Administración;
  - la flechita que contrae el menú lateral va en blanco.
- **Listas:** se paginan con más de 10 elementos. Pestañas, solo si hay dos tablas o más.
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
