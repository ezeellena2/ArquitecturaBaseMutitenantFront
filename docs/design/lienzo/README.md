# Lienzo del sistema visual

Copia de la **versión 81** (2026-10-03) del lienzo «Sistema visual · Multitenant», que vive en claude.ai como artefacto de tipo Design: <https://claude.ai/artifact/WzoVTM574QGka8nCU4iFEK> (privado, de la cuenta del dueño). Tiene 162 tableros `.dc.html`, `canvas.json` (páginas, posiciones y notas), el motor `support.js`, los recursos de `ds/` y los scripts que los generan, en `generadores/`.

Esta carpeta es la fuente de cada pantalla y de sus estados: **un tablero validado manda sobre cualquier descripción textual** de la arquitectura, las fichas o el plan. Antes de programar una pantalla, buscá su tablero y copiá sus estados, contenido y disposición. Una pantalla nueva se dibuja primero y se programa después de que el usuario la elige.

## Páginas y estado

El título de cada tablero dice en qué estado está:

- **sin marca:** validado por el usuario; se puede programar;
- **«· para aprobar»:** refinado con el criterio y esperando el visto bueno;
- **«· por refinar»:** dibujado antes del criterio; no se programa así.

| Página | Tableros | Estado |
|---|---|---|
| Criterio de diseño | 8 | Validado. Es la regla de botones, tablas, diálogos, formularios, avisos, menús y marco. «Decisiones por pantalla» anota lo que el usuario eligió en cada pantalla y las reglas que salieron de eso. El lienzo abre acá. |
| Mapa general | 2 | Validado |
| Sitio público | 6 | Aprobado el 2026-10-03 (Etapa 7), pantalla por pantalla: la portada (con la sección «Empresas en ArquitecturaBase»), el directorio en tarjetas (`/empresas`) y la página pública en una tarjeta centrada, con sus tres estados. Los teléfonos son web, no app: una columna y ☰ arriba. |
| Ingreso y registro | 20 | Validado. Desde el 2026-10-03 suma los teléfonos de Sesión y de Organización no disponible, en formato app. |
| Perfil personal | 13 | Validado. Los 7 teléfonos están en formato app desde el 2026-10-03. Mi cuenta suma los estados de WhatsApp (Etapa 8): agregar y verificar un número, quitarlo o hacerlo principal, y sin el módulo. |
| Organización | 34 | Escritorio y móviles aprobados el 2026-10-03, con los dos inicios: las áreas en tarjetas y «Para resolver» como tabla. Los 17 teléfonos están en formato app (el del inicio, como una billetera), con los de Sin permiso y Avisos. |
| Organización · WhatsApp | 51 | Escritorio y teléfonos aprobados el 2026-10-03, pantalla por pantalla (Etapa 11 ampliada). Los 27 teléfonos son los primeros en formato app. El alta de Meta no se dibuja hasta que el usuario lo pida. |
| Plataforma | 30 | Aprobada el 2026-10-03, compu y teléfonos. En la compu, Gestión, WhatsApp y Administración abren un segundo panel; en el teléfono, barra de abajo (Organizaciones, Cuentas, Recuperaciones, Chats y Más). Plataforma › WhatsApp (Etapa 11), aprobado el 2026-10-03: solo consultas, con Consultas, Número, Bot, Equipos y Plantillas, en la compu y en el teléfono; la barra de abajo lleva «Consultas». |
| Textos y mensajes | 2 | Validado |
| Archivo | 14 | Descartado. Son versiones anteriores; están como referencia y no se programan. |

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

Después de correr `perfil_tableros.py`, `whatsapp_tableros.py` u `org_formularios.py`, corré `conectar_paginas.py`: esos tres dibujan el menú sin enlaces. `conectar_paginas.py`, `org_formularios2.py`, `org_vuelta_1002.py`, `wa_vuelta_1003.py`, `wa_telefonos_1004.py`, `org_telefonos_1004.py`, `plat_personal_telefonos_1004.py`, `wa_ajustes_1004.py`, `menus_con_lineas.py` y `flechita_blanca.py` se pueden volver a correr sin cambiar lo que ya está; los de 1004 van al final, después de `wa_vuelta_1003.py`, `perfil_tableros.py` y `conectar_paginas.py`, porque rehacen los teléfonos en formato app. Los otros reescriben `canvas.json`, así que revisá el diff antes de publicar. Para rehacer un formulario, se copia el formato de `org_formularios.py` y nunca se maquilla con CSS encima.

## Publicar en claude.ai

Se publica desde Claude Code, con la herramienta Artifact y la `url` de arriba:

1. **Leé antes de publicar.** Leé el lienzo (`read`) y compará `canvas.json` con esta copia: el dueño también edita y guarda desde la página.
2. **Todo va bajo `project/`.** Cada archivo se publica como `project/<archivo>`, por ejemplo con `files` = `{"project/Rol.dc.html": "docs/design/lienzo/Rol.dc.html", …}`. El `file_path` es `canvas.json` publicado como `project/canvas.json`. Lo que queda fuera de `project/` no se ve.
3. **Reglas del `canvas.json`:**
   - todo tablero y toda nota llevan `page`;
   - el `maxW` de una nota no pasa de 8000;
   - un tablero sin `"is_interactive": true` no muestra Play.
4. **Enlaces entre tableros:** `<a href="X.dc.html">` mueve Play a ese tablero aunque esté en otra página. Toda pantalla nueva nace con sus enlaces.
5. **Las propuestas nuevas** van en su propia página («Propuesta · …»). Cuando se aprueban, pasan a la página de su área. Las versiones reemplazadas van al Archivo.
6. **Después de publicar,** traé la versión nueva a esta carpeta y commiteala.
