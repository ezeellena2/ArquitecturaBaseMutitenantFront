"""Tablero «Criterio · Decisiones por pantalla»: lo que el usuario eligió en cada pantalla y las reglas que dejó.
Cada decisión nueva suma una fila en DECISIONES; si deja una regla, va también a REGLAS y al tablero de esa pieza.
Va en cuatro columnas (5920 de ancho): el lienzo recorta un tablero a 8000 de alto; en dos columnas ya no entraba (v120) y en tres tampoco (v130)."""
import json
import pathlib
import re

PROJ = pathlib.Path(__file__).resolve().parent.parent  # docs/design/lienzo: los tableros y canvas.json
ALTO = 6900
ANCHO = 5920
COLUMNAS = 4
ARCHIVO = "Criterio-Decisiones.dc.html"
TITULO = "Criterio · Decisiones por pantalla"

botones = (PROJ / "Criterio-Botones.dc.html").read_text(encoding="utf-8")
head = botones.split("</helmet>", 1)[0].replace("<title>Criterio · Botones</title>", f"<title>{TITULO}</title>")
head = re.sub(r"(\.crit \{[^}]*min-height: )\d+px", lambda m: m.group(1) + f"{ALTO}px", head)
head = re.sub(r"(\.crit \{ width: )1440px", lambda m: m.group(1) + f"{ANCHO}px", head)

CSS = """  <style data-criterio="decisiones">
.dec { background: #fff; border: 1px solid var(--borde); border-radius: 12px; overflow: hidden; font-size: 13.5px; }
.dec .c, .dec .f { display: grid; gap: 20px; align-items: center; padding: 0 18px; }
.dec .c { min-height: 40px; background: oklch(0.945 0.018 76); border-bottom: 1px solid oklch(0.89 0.02 76); font-size: 13px; font-weight: 600; color: var(--t2); }
.dec .f { min-height: 52px; padding-top: 10px; padding-bottom: 10px; box-sizing: border-box; border-bottom: 1px solid var(--borde); line-height: 1.5; }
.dec .f:last-child { border-bottom: 0; }
.dec .f:nth-child(odd) { background: oklch(0.975 0.008 78); }
.dec .f strong { font-weight: 600; }
.dec .f .op { font-weight: 600; color: var(--marca-tx); margin-right: 6px; }
.dec .f .nada { color: var(--t3); }
.dec .f .gris { color: var(--t3); }
.est { display: inline-flex; align-items: center; gap: 8px; }
.est::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: var(--t3); flex-shrink: 0; }
.est.ok::before { background: oklch(0.6 0.13 155); }
.est.pend::before { background: var(--marca); }
.est.alerta::before { background: oklch(0.72 0.15 70); }
.est.off { color: var(--t2); }
.est.off::before { background: oklch(0.75 0.01 78); }
.cols { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 48px; align-items: start; }
.cols > div { display: flex; flex-direction: column; gap: 36px; }
  </style>"""

COLS_R = "minmax(0, 1fr) 300px 120px"
COLS_D = "220px minmax(0, 1fr) 230px"
ESTADOS = {
    "Dibujada": "ok",
    "Dibujada en parte": "ok",
    "Falta dibujar": "alerta",
    "En revisión": "pend",
    "Falta decidir": "off",
    "Para repensar": "pend",
    "Decidido": "ok",
}

# Reglas generales que salieron de las decisiones: (regla, tablero donde quedó, fecha).
REGLAS = [
    ("Un número sin cuenta o que ya es de otra cuenta se avisa debajo del campo, como un correo, y no manda código.", "Formularios y campos", "08/10/2026"),
    ("Un dato que no se puede cambiar va en el mismo campo que al editar, deshabilitado (fondo y texto grises); nunca rótulo y texto suelto.", "Formularios y campos", "07/10/2026"),
    ("En el teléfono, la barra de abajo lleva hasta cinco pestañas; lo que no entra pasa a «Más».", "Marco y pantallas", "07/10/2026"),
    ("Un desplegable se abre debajo del campo y del mismo ancho, como los filtros y el ⋮ de una fila.", "Formularios y campos", "05/10/2026"),
    ("En el teléfono, el ⋮ de una fila de cualquier lista abre una hoja desde abajo con el dato de la fila como título.", "Menús y desplegables", "05/10/2026"),
    ("«Guardar cambios» se apaga sin cambios en todas las ediciones, también en los diálogos; ningún botón se apaga porque falta un dato.", "Botones", "05/10/2026"),
    ("Un botón que espera dice qué está haciendo, también los de peligro: «Quitando…», «Desvinculando…», «Dando de baja…».", "Botones", "05/10/2026"),
    ("Una ficha con un solo grupo de datos va sin la barra de pestañas.", "Marco y pantallas", "05/10/2026"),
    ("Un rechazo del back sobre un dato va debajo de su campo; la franja queda para lo que no es de un campo.", "Formularios y campos", "05/10/2026"),
    ("La vista previa de la página pública va en un diálogo de 640, con la tarjeta del público tal cual.", "Diálogos", "05/10/2026"),
    ("Las pestañas de una ficha van abajo de la banda, sobre el fondo, alineadas con el contenido.", "Marco y pantallas", "04/10/2026"),
    ("El pie del paginado va con letra de 12.", "Tablas y listas", "04/10/2026"),
    ("El botón principal lleva el degradé de la marca en todas las pantallas, también en el teléfono.", "Botones", "04/10/2026"),
    ("Dentro de una caja, dos columnas iguales que ocupan todo el ancho; tres solo si todos los datos son cortos, como en «Tus datos».", "Formularios y campos", "04/10/2026"),
    ("El selector de país de un teléfono lleva la bandera, como imagen y no emoji, en la lista y en el control cerrado: «[bandera] +54».", "Formularios y campos", "04/10/2026"),
    ("Sin textos que explican: el estado se dice una vez arriba y un ⓘ abre el aviso importante.", "Avisos y errores · Diálogos", "02/10/2026"),
    ("En el teléfono, lo pasajero va abajo en una franja oscura y lo que sigue, debajo de la barra de arriba.", "Avisos y errores", "03/10/2026"),
    ("En el teléfono, la franja de error de un formulario usa la letra de los avisos del teléfono: 14,5 con interlineado 1,4. En la compu, 13.", "Formularios y campos", "04/10/2026"),
    ("Nada revela si un correo o un teléfono tiene cuenta, en «Recuperar mi cuenta» ni en Mi cuenta: la pantalla sigue igual y a ese correo le llega un aviso en lugar del código. Excepción: «Invitar operador», porque quien tiene permiso de cuentas ya las ve.", "Avisos y errores", "03/10/2026"),
    ("Una celda puede llevar una segunda línea gris que aclara la primera.", "Tablas y listas", "02/10/2026"),
    ("Filas de 40; si alguna fila de la tabla tiene segunda línea, todas son de 52, para que la tabla quede pareja.", "Tablas y listas", "04/10/2026"),
    ("En las listas del teléfono, una fecha del año en curso va sin el año («27/09» o «27/09 10:42»); de otro año, completa. En la compu, siempre con el año.", "Tablas y listas", "04/10/2026"),
    ("En el panel de Administración, un grupo arranca abierto solo si estás en una de sus pantallas; los demás, cerrados.", "Menús y desplegables", "04/10/2026"),
    ("El círculo con la inicial de una persona lleva el degradé de la marca, en la compu y en el teléfono.", "Marco y pantallas", "04/10/2026"),
    ("Sin ☰ en las pantallas con sesión: el menú lateral se achica con la flecha redonda de su borde.", "Menús y desplegables", "04/10/2026"),
    ("Un dato personal tapado muestra lo mínimo: el teléfono, «•••• 4521»; el correo, «lu•••@gmail.com».", "Tablas y listas", "04/10/2026"),
    ("Una lista se lee; cambiar una fila o sumar otra abre un diálogo chico.", "Tablas y listas", "02/10/2026"),
    ("Los permisos de un rol van en grupos que se abren y se cierran.", "Tablas y listas", "02/10/2026"),
    ("Lo que solo crece, como la auditoría, se pide de a tandas con «Cargar más», sin total y sin cantidades en los filtros.", "Tablas y listas", "04/10/2026"),
    ("Dos vistas del mismo contenido pueden ir en pestañas (Bot: Configuración y Recorrido).", "Marco y pantallas", "03/10/2026"),
    ("Una ficha lleva una pestaña por cada grupo de datos, aunque tenga una sola fila (organización, cuenta, empresa).", "Marco y pantallas", "04/10/2026"),
    ("En el teléfono, una pantalla interna lleva el camino debajo del título («Administración»), también «Sin permiso» y «No encontrada».", "Marco y pantallas", "04/10/2026"),
    ("En el perfil de una organización, el menú muestra el correo que administra esa organización; si no hay, el principal. En el personal, el principal.", "Menús y desplegables", "04/10/2026"),
    ("Editar algo que ya existe lleva «Descartar cambios», que deja lo guardado sin salir; crear algo nuevo lleva «Cancelar», que vuelve.", "Botones", "04/10/2026"),
    ("Los módulos de uso diario (WhatsApp) van arriba, debajo de Inicio, y abren su propio panel; Administración, abajo con una línea.", "Menús y desplegables", "03/10/2026"),
    ("Antes de algo que se paga (difusión, plantilla), se muestra el costo estimado.", "Diálogos", "03/10/2026"),
    ("Atrás de un diálogo, la pantalla solo oscurecida, sin difuminar. Un error general del diálogo, en franja roja clara arriba de los botones.", "Diálogos", "04/10/2026"),
    ("Una línea fina entre cada opción de un menú desplegable; antes de las de peligro, una franja.", "Menús y desplegables", "03/10/2026"),
    ("En el teléfono, una app: barra de abajo con «Más», título en la barra, listas de borde a borde y hojas con manija.", "Marco y pantallas", "03/10/2026"),
    ("El sitio público en el teléfono es web, no app (se abre desde un enlace y no tiene sesión): una columna y ☰ arriba.", "Marco y pantallas", "03/10/2026"),
    ("En el teléfono, crear algo nuevo es un «+» flotante abajo a la derecha, también con la lista vacía.", "Marco y pantallas", "03/10/2026"),
    ("En el teléfono, el ⋮ de una fila va solo si tiene acciones; si no, se toca la fila.", "Marco y pantallas", "03/10/2026"),
    ("La flechita que contrae el menú lateral va en blanco, con borde arena.", "Menús y desplegables", "03/10/2026"),
    ("«Para resolver» muestra solo estados que ya existen, que quien mira puede resolver y que tienen una acción; se calcula al abrir y se va solo.", "Tablas y listas", "03/10/2026"),
    ("Una línea fina entre cada opción del menú lateral y de su panel, como la que separa Administración.", "Menús y desplegables", "03/10/2026"),
    ("En el teléfono, las pantallas de edición llevan fijos abajo «Descartar cambios» y «Guardar cambios».", "Marco y pantallas", "03/10/2026"),
    ("Una ficha lleva pestañas aunque alguna tenga un solo dato.", "Marco y pantallas", "03/10/2026"),
    ("El detalle de solo lectura en un diálogo va en una grilla con líneas: rótulo a la izquierda sobre arena clara, valor a la derecha.", "Diálogos", "03/10/2026"),
]

# Decisiones por página: (pantalla, opción elegida, qué se eligió, estado en el lienzo).
DECISIONES = {
    "Perfil personal": [
        ("Mi cuenta · única Dueña", "", "Un ⓘ junto a «Dar de baja mi cuenta» y el botón apagado; los dos abren el aviso importante.", "Dibujada"),
        ("Mi cuenta · el ⋮ de «Cómo entrás»", "", "Solo en las filas con acciones: el principal, si es el único método personal, no lo lleva; el correo de la empresa, con «Hacer principal» y «Quitar»; el teléfono sin verificar, con «Quitar».", "Dibujada"),
        ("Mi cuenta › WhatsApp · agregar y verificar", "", "«WhatsApp» con país y número (solo los países que habilita WhatsApp); error: país que no habilita (un número de otra cuenta no da error: no se revela); el código por WhatsApp con «Reenviar», incorrecto o vencido. Sin el módulo, ni la fila ni la opción.", "Dibujada"),
        ("Mi cuenta › WhatsApp · quitar o hacer principal", "A", "⋮ con «Hacer principal» y «Quitar»; el código llega a otro método, y el WhatsApp también es ese otro método. Para cambiar el número se agrega el nuevo y se quita el viejo.", "Dibujada"),
        ("Mi cuenta › Agregar · país", "A", "La lista de países con las filas de los desplegables (36 de alto, letra de 13, radio 6, la elegida en 500) como en la app. Solo Argentina, el único país habilitado, y sin buscador: aparece con más de 10 opciones (también en el teléfono).", "Dibujada"),
    ],
    "Organización · 13 pantallas": [
        ("Usuarios", "A", "Usuario (nombre y correo), Rol en la organización, Empresa (con su rol debajo), Estado («Vence …» si es una invitación) y ⋮. Sin empresa, una sola raya.", "Dibujada"),
        ("Editar usuario", "B", "«Acceso a la organización» en dos columnas a todo el ancho. «Empresas» es una lista para leer («Delta S.A.» / «Solo lectura») con ⋮; cambiar los roles o «+ Sumar empresa» abre un diálogo chico.", "Dibujada"),
        ("Roles y permisos", "A", "Rol (con «De sistema» debajo), Vale en, Usuarios, Permisos y ⋮. Sin descripción ni tipo.", "Dibujada"),
        ("Editar un rol", "A", "Una fila por permiso, solo con el nombre. Cada área se abre y se cierra; al entrar, abiertas las que tienen algo marcado.", "Dibujada"),
        ("Empresas", "A", "Empresa (con el CUIT debajo, o «Sin CUIT»), Zona horaria, Miembros, Estado y ⋮.", "Dibujada"),
        ("Ficha de empresa", "A", "Quedan las pestañas Miembros y Roles. Miembros: Miembro (nombre y correo), Roles en la empresa, Estado y ⋮. Sin roles, una raya.", "Dibujada"),
        ("Configuración", "A", "Datos en dos columnas y la caja «Dominio de correo». Sin dominio: «Sin dominio» y «+ Agregar dominio». Pendiente: el dominio con «Pendiente» y «Verificar», sin el texto del DNS, que va en el paso de verificar. Verificado: «Verificado · N correos administrados por Grupo Delta». «Quitar» aclara que los correos ya administrados siguen igual.", "Dibujada"),
        ("Página pública", "A", "Dos columnas; el logo es la primera fila de «Página». Arriba solo el estado («● Publicada»); la dirección, en «Publicación» y en su campo. «Nombre de la página». Borrador: interruptor «Visible en delta.plataforma.com». Despublicada: el estado arriba, en rojo; un ⓘ y el interruptor trabado.", "Dibujada"),
        ("Auditoría", "A", "Fecha y hora, Qué pasó (con el nombre: «Cambió los roles de Tomás Acosta»), Dónde y Quién. Tocar «Qué pasó» abre el detalle; sin el ojo. Arriba, sin cantidad. «Cargar más» al pie. El backend tiene que sumar el nombre y la empresa.", "Dibujada"),
        ("Inicio de la organización", "A", "Arriba, las áreas en tarjetas con un dato real (11 usuarios, ● Publicada…); abajo, «Para resolver» como tabla: Pendiente, Área, Estado, Desde y el enlace que lo resuelve. Sin pendientes, «Nada para resolver».", "Dibujada"),
        ("Inicio de un miembro", "A", "«Tus empresas» en las mismas tarjetas (su rol y cuántos miembros); si administra su empresa, abajo su «Para resolver».", "Dibujada"),
        ("Sin permiso o no encontrada", "A", "Solo el título («No tenés permiso para ver esta página» o «No encontramos esta página») y «Ir al inicio», sin la línea que explica.", "Dibujada"),
        ("Avisos del sistema", "A", "Sin conexión: solo el cartel de arriba. Error del servidor: el código, detrás de «Copiar código». Módulo apagado: sin la línea que explica. De fondo, Configuración en dos columnas.", "Dibujada"),
        ("Ficha de empresa · diálogos", "", "«Roles de …» (un campo) y «Agregar miembro» (dos) en el ancho chico, 420; «Editar empresa» (tres) queda en 560.", "Dibujada"),
        ("Sumar empresa", "A", "«Empresa» es obligatoria y lleva asterisco; «Roles en la empresa» aparece al elegirla y es opcional, como en la app. En el teléfono, los roles sin asterisco.", "Dibujada"),
        ("Panel de Administración", "A", "Abre solo el grupo de la pantalla en la que estás: «Gestión de usuarios» en Usuarios y Roles; WhatsApp en sus pantallas. Las seis pantallas con la pieza vieja (Usuarios, Roles, Empresas, Empresa, Auditoría e Inicio) pasan a la del criterio: filas de 32 y WhatsApp como grupo.", "Dibujada"),
    ],
    "WhatsApp · cómo funciona": [
        ("Números", "", "La plataforma tiene el suyo (códigos, avisos, bot de ingreso y soporte). Cada organización conecta uno o más, y cada uno atiende a toda la organización o a una empresa. La persona B2C no tiene: escribe y recibe.", "Decidido"),
        ("Quién escribe", "A", "Es empleado si el número está verificado en la cuenta de un miembro activo; lo que puede hacer sale de sus roles. Si no, es cliente.", "Decidido"),
        ("Conexión", "A", "Alta embebida de Meta (la plataforma como Tech Provider), con coexistencia: se puede conectar el número que ya usa la app WhatsApp Business.", "Decidido"),
        ("Pago", "A", "Cada organización le paga a Meta con su tarjeta. Desde el 01/10/2026: 1.000 respuestas gratis por número y por mes; sin medio de pago, no responde.", "Decidido"),
        ("Bot", "A", "Respuestas automáticas y un menú (una lista de WhatsApp, hasta 10 opciones) que contesta o pasa a un equipo. Sin sub-menús por ahora.", "Decidido"),
        ("Equipos", "A", "Cada equipo atiende una bandeja (Clientes o Internos). Alguien toma el chat y lo puede pasar.", "Decidido"),
        ("Cliente con cuenta", "C", "La persona decide vincular la conversación a su cuenta: la organización ve su nombre verificado y ella ve sus charlas en «Mensajes».", "Decidido"),
        ("Plantillas y difusiones", "A", "Las plantillas se crean desde la plataforma y Meta las aprueba. Las difusiones van solo a quienes aceptaron, muestran el costo antes de mandar y respetan «Baja».", "Decidido"),
        ("Módulo y avisos", "A · B", "La plataforma lo prende por organización. Si nadie toma un chat a tiempo, sale un correo al equipo.", "Decidido"),
    ],
    "WhatsApp · pantallas": [
        ("Chats", "A", "Una pantalla con «Clientes | Internos», filtros por equipo y estado, tercera línea con equipo y quién atiende («Sin tomar» en ámbar).", "Dibujada"),
        ("Chat sin tomar", "A", "Se puede responder directo y el primer mensaje lo toma; si otro lo tomó antes, avisa.", "Dibujada"),
        ("Pasar", "B", "Desplegable directo con equipos y personas.", "Dibujada"),
        ("Notas internas", "B", "Un botón a la izquierda de donde se escribe prende la nota: el campo se pone amarillo y se guarda; la ve solo el equipo. Reemplaza «Mensaje | Nota interna».", "Dibujada"),
        ("Pasaron 24 horas", "B", "Donde se escribe: «Pasaron 24 horas» con ⓘ y «Elegir plantilla».", "Dibujada"),
        ("Elegir plantilla", "A", "Diálogo con la plantilla, sus datos, la vista previa y el costo.", "Dibujada"),
        ("Contactos", "A", "Contacto (con «Vinculada»), Etiquetas, Promociones y Última conversación; «Importar contactos» con «Descargar ejemplo» y sin casilla: el consentimiento va por contacto, en la columna «Acepta promociones» del archivo.", "Dibujada"),
        ("Ficha del contacto", "B", "Datos en la segunda línea de arriba y pestañas «Conversaciones | Difusiones».", "Dibujada"),
        ("Difusiones", "A", "Lista; «Nueva difusión» en pantalla propia con vista previa y costo; resultados con los números y cada contacto.", "Dibujada"),
        ("Números", "A", "Tabla con Atiende a, Estado y Este mes; «Falta medio de pago» en rojo con ⓘ.", "Dibujada"),
        ("Conectar número", "A", "«Atiende a» antes de abrir la ventana de Meta, para que «Cancelar» no deje nada a medias; sin empresas, se abre directo. Después, «Número conectado», «No se conectó el número» o el código del error de Meta. Recién conectado, el número dice «Conectado»: Meta revisa el nombre visible recién cuando sube el límite de mensajes.", "Dibujada"),
        ("Ventana de Meta", "A", "La de Meta tal cual, en inglés como en sus capturas (con Facebook en español, Meta la traduce): títulos, campos y botones copiados, los párrafos largos en gris y «Meta» en texto en lugar del logo. Si el número ya está en la app WhatsApp Business, Meta pasa sola a la coexistencia (perfil, código QR) y el número queda «también en la app».", "Dibujada"),
        ("Bot", "A y B", "Pestañas «Configuración» (cajas) y «Recorrido» (diagrama); la opción del menú pasa a un equipo o contesta un texto.", "Dibujada"),
        ("Equipos", "A", "Tabla; crear y editar en un diálogo.", "Dibujada"),
        ("Plantillas", "B", "Lista con estado en Meta; «Nueva plantilla» en un diálogo con nombre, tipo y texto.", "Dibujada"),
        ("Cargar teléfonos de empleados", "A", "Desde Usuarios, en dos pasos: pegar o subir y revisar qué pasa con cada número: «Ya es miembro», «Se invita» o «Número inválido». Nunca dice si un número tiene cuenta (ADR 0043 y la precisión del 11/10 de la 0038): la cuenta se vincula al aceptar la invitación.", "Dibujada"),
        ("Mensajes de la persona", "A", "En el perfil personal, solo para leer, con «Seguir en WhatsApp».", "Dibujada"),
        ("Permisos", "A", "Área WhatsApp con 4: Atender clientes, Atender internos, Mandar difusiones y Administrar WhatsApp.", "Dibujada"),
        ("Correo «Chats esperando»", "A", "Solo el resumen y «Ver los chats», sin copiar mensajes ni teléfonos.", "Dibujada"),
        ("Menú de la organización", "", "«WhatsApp» arriba, debajo de Inicio, con el contador de Chats; abre un segundo panel (Chats, Contactos, Difusiones) como Administración, y solo uno de los dos abre a la vez. «Administración» queda abajo, con la línea, por ser configuración. En el teléfono, la barra de abajo y «Más».", "Dibujada"),
        ("Menú de Plataforma", "B", "«WhatsApp» va directo a la bandeja Consultas; la configuración, en Administración › WhatsApp (Número, Bot, Equipos y Plantillas).", "Dibujada"),
    ],
    "WhatsApp · teléfonos (como app)": [
        ("Marco", "A", "Barra de abajo: Inicio, Chats (con los sin leer), Contactos, Difusiones y «Más». Título grande en la barra de arriba, con la organización debajo.", "Dibujada"),
        ("Más", "", "Tu cuenta, Perfiles, Administración, WhatsApp (Números, Bot, Equipos, Plantillas), Mi cuenta y Salir, en grupos.", "Dibujada"),
        ("Lista de chats", "A", "«Clientes | Internos» arriba; buscar y filtrar como íconos (los filtros abren una hoja). Filas de tres líneas.", "Dibujada"),
        ("Conversación", "B", "Arriba ‹, el nombre y «Vinculada a su cuenta · Mayorista». «Pasar» y «Ver ficha del contacto» en el ⋮. Sin barra de abajo.", "Dibujada"),
        ("Chat sin tomar", "B", "«Sin tomar · Ventas» en ámbar; «Tomar», «Pasar» y «Ver ficha» en el ⋮. Responder ya lo toma.", "Dibujada"),
        ("Pasar · Elegir plantilla · Importar", "A", "Hojas desde abajo, con manija.", "Dibujada"),
        ("Nota interna", "B", "El botón de nota prende el modo nota: campo amarillo y botón ámbar con tilde.", "Dibujada"),
        ("Pasaron 24 horas", "", "Abajo: el botón de nota, «Pasaron 24 horas» con ⓘ y «Elegir plantilla».", "Dibujada"),
        ("Contactos", "B", "Lista como Chats: nombre y última conversación, número con «Vinculada», etiqueta y promociones. Tocar abre la ficha.", "Dibujada"),
        ("Ficha del contacto", "B", "Avatar grande al centro, nombre y datos debajo; pestañas «Conversaciones | Difusiones»; «Abrir chat» fijo abajo.", "Dibujada"),
        ("Difusiones · Nueva difusión", "A", "Lista con «+» flotante. Nueva difusión: los campos y la vista previa; abajo fijo, cantidad, costo y «Programar».", "Dibujada"),
        ("Resultados", "B", "Los números son también el filtro, en una fila que se desliza; «No llegaron» suma los que no recibieron.", "Dibujada"),
        ("Números", "A", "Lista de tres líneas con ⋮ (Cambiar a quién atiende, Desconectar) y «+»; «Falta medio de pago» abre el aviso como hoja.", "Dibujada"),
        ("Sin números", "A", "La frase y el «+» de siempre.", "Dibujada"),
        ("Conectar número", "", "«Atiende a» en una hoja y sus opciones en otra; «Ventana de Meta abierta», en hoja; los avisos, abajo. La ventana de Meta no se dibuja: en el celular se abre a pantalla completa y Meta no publica cómo se ve.", "Dibujada"),
        ("Bot · Equipos · Plantillas · Cargar teléfonos · Mensajes", "", "Decididos con los mismos criterios: ajustes en grupos, recorrido como línea de pasos, listas con ⋮ y «+», acción fija abajo, Mensajes con su propia barra (Inicio, Mensajes, Más).", "Dibujada"),
    ],
    "Organización · teléfonos (como app)": [
        ("Usuarios · Roles · Empresas", "", "Listas de borde a borde con ⋮ en cada fila y «+» para invitar, crear rol o crear empresa. En Usuarios, «Cargar teléfonos» va en el ⋮ de arriba.", "Dibujada"),
        ("Ficha de empresa", "", "Pestañas «Miembros | Roles»; cada miembro con su rol y estado, ⋮ y «+» para agregar.", "Dibujada"),
        ("Editar usuario", "", "Grupos «Acceso a la organización» (Estado, Roles) y «Empresas» con «Sumar empresa»; abajo, fijos, «Descartar cambios» y «Guardar cambios».", "Dibujada"),
        ("Editar un rol", "", "Nombre, Vale en y Descripción; los permisos se abren por área, con casillas; abajo, fijos, «Descartar cambios» y «Guardar cambios» (al crear un rol, «Cancelar» y «Crear rol»).", "Dibujada"),
        ("Configuración · Página pública", "", "Campos a lo ancho y grupos (Dominio de correo; Publicación, Página y Contacto); abajo, fijos, «Descartar cambios» y «Guardar cambios».", "Dibujada"),
        ("Diálogos", "", "Invitar usuario, Sumar empresa, Agregar y Verificar dominio como hojas; Quitar dominio, confirmación sin ✕ y con el botón rojo.", "Dibujada"),
        ("Auditoría", "", "Qué pasó con la fecha, y dónde y quién debajo; «Cargar más» al final.", "Dibujada"),
        ("Inicio", "C", "Como una billetera: cabecera de color con «Hola, Lucía» y la organización; atajos redondos con un globito rojo con lo pendiente de cada área; «Para resolver» en filas con ícono redondo del color de la urgencia y la acción en un botón cápsula.", "Dibujada"),
        ("Editar usuario · Estado y Roles", "A", "«Estado» y «Roles de la organización» abren hojas de opciones: el estado con tilde, que se cierra al elegir; los roles con casillas y «Listo». Hasta guardar, «Cambios sin guardar».", "Dibujada"),
    ],
    "Ingreso y avisos · teléfonos (como app)": [
        ("Sesión", "", "Como el arranque de una app: el logo con una ruedita al iniciar o cerrar; al cambiar de lado, la inicial del perfil con un anillo que gira; si falla, «Volver a ingresar» fijo abajo.", "Dibujada"),
        ("Organización no disponible", "", "Ícono del color del estado, título y su línea; «Elegí otro perfil» en un grupo de filas y «Salir» abajo.", "Dibujada"),
        ("Sin permiso o no encontrada", "", "Dentro de la app, con ‹ y la barra de abajo de la persona; al centro, el mensaje e «Ir al inicio».", "Dibujada"),
        ("Avisos del sistema", "", "Lo pasajero, abajo en una franja oscura; lo que sigue, debajo de la barra de arriba; «¿Salir sin guardar?», en una hoja sin ✕; «Reintentá en 0:39», en el botón fijo.", "Dibujada"),
        ("No se pudo abrir", "", "La pieza común «No pudimos abrir esta pantalla» con «Reintentar», dentro de la app: tercer estado de la pantalla de error.", "Dibujada"),
        ("Franja de error", "A", "En la hoja del formulario, con la letra de 14,5 de los avisos del teléfono y el ícono arriba si ocupa dos líneas.", "Dibujada"),
    ],
    "Plataforma y perfil personal · teléfonos (como app)": [
        ("Barra de abajo de Plataforma", "", "Organizaciones, Cuentas, Recuperaciones, Consultas y «Más» (Administración; WhatsApp con Número, Bot, Equipos y Plantillas; Mi cuenta y Salir).", "Dibujada"),
        ("Organizaciones · Cuentas · Recuperaciones", "", "Listas de borde a borde con ⋮ y estado de color; «+» para crear organización e invitar operador.", "Dibujada"),
        ("Fichas de organización y de cuenta", "", "Muchas pestañas: se deslizan de costado.", "Dibujada"),
        ("Auditoría de la plataforma", "", "El detalle de un evento sube como hoja, con «Cerrar».", "Dibujada"),
        ("Barra de abajo de la persona", "", "Inicio, Mensajes y «Más» (perfiles, Mi cuenta y Salir).", "Dibujada"),
        ("Mi cuenta › WhatsApp", "", "Los estados de la compu en hojas; el país, en su propia hoja; el ⋮, como hoja de acciones; las confirmaciones, sin ✕.", "Dibujada"),
        ("Mi cuenta", "", "En grupos (Tus datos, Cómo entrás, Privacidad), con «Descartar cambios» y «Guardar cambios» fijos abajo; agregar, verificar y dar de baja en hojas.", "Dibujada"),
    ],
    "Plataforma › WhatsApp": [
        ("Qué hace", "A", "Solo consultas, además de los códigos, invitaciones y avisos: sin Contactos ni Difusiones, porque una difusión puede bajar la calidad del número y cortar los códigos. «WhatsApp» va directo a la bandeja; Administración › WhatsApp lleva Número, Bot, Equipos y Plantillas.", "Decidido"),
        ("Consultas", "", "La bandeja de la organización sin Clientes ni Internos; en la conversación, «Ver la cuenta» abre su ficha.", "Dibujada"),
        ("Número", "", "En filas, no una tabla de una fila: el número con su estado y «Qué hace» (códigos y avisos, siempre; consultas, con interruptor). Sin medio de pago, el ⓘ avisa que los códigos salen solo por correo.", "Dibujada"),
        ("Conectar número", "", "Sin «Atiende a»: abre la ventana de Meta directo. Si Meta informa un error, el código va al soporte de Meta.", "Dibujada"),
        ("Bot", "", "Sin selector de número ni «Además»; la opción «Entrar a mi cuenta» manda el enlace para entrar y es del sistema.", "Dibujada"),
        ("Equipos · Plantillas", "", "Equipos de operadores, sin bandeja. Plantillas en pestañas: «Para consultas» y «Del sistema» (las de la Etapa 8, que no se borran).", "Dibujada"),
        ("Teléfonos", "", "En la barra de abajo, «Chats» pasa a «Consultas»; «Más» lleva WhatsApp (Número, Bot, Equipos, Plantillas).", "Dibujada"),
    ],
    "Plataforma · compu": [
        ("Menú", "B", "Gestión, WhatsApp (directo a Consultas desde el 03/10) y Administración, con Número, Bot, Equipos y Plantillas de WhatsApp dentro.", "Dibujada"),
        ("Organizaciones", "", "Organización (alta y origen debajo), Dueño (correo debajo), Empresas, Miembros y Estado.", "Dibujada"),
        ("Ficha de una organización", "", "Con pestañas (Historial, Dueños, Módulos, Dominio verificado, Página pública); el primer módulo es WhatsApp.", "Dibujada"),
        ("Cuentas", "", "Cuenta (nombre y correo), Perfiles, Último ingreso (cómo entró debajo) y Estado; sin Teléfono.", "Dibujada"),
        ("Ficha de una cuenta", "", "Los métodos como en Mi cuenta: filas sin encabezado, el tipo y quién lo administra debajo, y el estado solo si pide atención.", "Dibujada"),
        ("Recuperaciones · Auditoría · Legales · Configuración", "", "Cuenta con la fecha debajo; auditoría sin ojo ni cantidad y detalle en grilla; legales como lista («Versión N · vigente desde…»); «Registro y altas» con su encabezado.", "Dibujada"),
        ("Configuración · Contacto", "", "Correo de ventas y correo de soporte, debajo de «Registro y altas»: son los que muestran el registro de empresa cerrado o en el límite y la cuenta suspendida.", "Dibujada"),
        ("Aviso de baja por la plataforma", "", "«La plataforma inició la baja de tu cuenta», en dos variantes: cuenta activa, con «Ingresar» para cancelarla antes de la fecha; cuenta suspendida, sin «Ingresar» y con el correo de soporte. Por WhatsApp, las plantillas baja_cuenta_plataforma y baja_cuenta_plataforma_suspendida.", "Dibujada"),
        ("Aviso «Alguien pidió recuperar tu cuenta»", "", "A los métodos de la cuenta que siguen andando, antes de que lo revise un operador; nunca a quien lo pidió (ADR 0041). Sin botón; la nota da el correo de soporte. Por WhatsApp, la plantilla recuperacion_aviso_cuenta.", "Dibujada"),
        ("Invitar operador", "B", "La invitación queda pendiente hasta el primer ingreso y vence a los 7 días: «Invitación pendiente» o «Invitación vencida», con «Reenviar invitación» y «Revocar invitación». El correo dice quién invita, los permisos y el vencimiento; sale solo por correo.", "Dibujada"),
        ("Invitar operador · casos", "A", "Si quien invita no tiene nombre, el correo firma «El equipo de ArquitecturaBase». Si el correo ya tiene una invitación pendiente o vencida: «Ese correo ya tiene una invitación. Reenviala desde la lista.»", "Dibujada"),
    ],
    "Sitio público": [
        ("Portada", "B", "Sin la etiqueta del héroe; después de «Dos lados separados», la sección «Empresas en ArquitecturaBase» con buscador, tres empresas y «Ver todas las empresas», que lleva al directorio. «Empresas», arriba, baja a esa sección. Enter en el buscador abre /empresas con lo escrito. Sin empresas publicadas, dice «Todavía no hay empresas publicadas», como el directorio vacío, y sale «Ver todas las empresas».", "Dibujada"),
        ("Directorio", "B", "El encabezado de la portada con «Empresas» marcado y las empresas en tarjetas (logo, nombre, descripción y dirección), con la paginación debajo. Con sesión, igual.", "Dibujada"),
        ("Página pública", "B", "Una tarjeta centrada: logo, nombre, descripción, los cuatro datos de contacto y «Ingresá para continuar»; ingresar o registrarse desde ahí vuelve a la misma página. Con sesión, que la página recupera sola, sin el botón y con tu menú de siempre arriba, con tus organizaciones. «No disponible», en la misma tarjeta, sin decir por qué.", "Dibujada"),
        ("Portada · teléfono", "A", "Web en una columna: la marca, «Ingresar» y ☰ (Personas, Cómo empezar, Empresas e «Ingresá como empresa»); la sección de empresas en tarjetas, una debajo de otra.", "Dibujada"),
        ("Directorio · teléfono", "", "El ☰ de la portada con «Empresas» marcado; buscador a lo ancho y tarjetas en una columna. Dirección: /empresas.", "Dibujada"),
        ("Página pública · teléfono", "", "La misma tarjeta de la compu, con sus tres estados; sin ☰, porque es la página de la organización.", "Dibujada"),
    ],
    "Alineación con la app · 04/10": [
        ("Marco", "", "Las 8 pantallas de Organización y las 8 de Plataforma con el marco viejo pasan al del criterio: perfil en 14/700, opciones de 32 en 400, pie con el avatar de 32 y migas en 13. Plataforma › Administración: WhatsApp como grupo.", "Dibujada"),
        ("Avatar y ☰", "A", "El círculo con la inicial, con el degradé en todos lados; sin ☰ arriba.", "Dibujada"),
        ("Buscador de las listas", "", "36 de alto y 360 de ancho en las nueve listas que lo tenían de 32.", "Dibujada"),
        ("Rótulos de los campos", "", "12,5 con interlineado 1,5 en los 24 tableros de la compu.", "Dibujada"),
        ("Registro · Dirección de la página", "", "44 de alto y radio 10, como los demás campos de ingreso y registro.", "Dibujada"),
        ("Mensajes de ingreso y registro", "", "Triángulo en los de atención y círculo en los de error. En la compu, radio 8 e ícono 16; en el teléfono, la franja de 14,5.", "Dibujada"),
        ("Invitación aceptada", "", "«Agregá un correo personal…» como cartel de atención, ámbar y con el triángulo.", "Dibujada"),
        ("Datos tapados", "A", "Teléfono «•••• 4521» y correo «lu•••@…» en Plataforma, Cuenta, Enlace y Mensajes. En Auditoría, el correo de la invitación también va tapado.", "Dibujada"),
        ("Diálogos", "", "Cuerpo con 20 de margen y 14 entre campos.", "Dibujada"),
        ("Sumar empresa", "", "«Sumar» nunca se apaga: sin empresa, el campo dice «Elegí una empresa.». En el teléfono, «Todos» en los roles.", "Dibujada"),
        ("CUIT de ejemplo", "", "Los tres pasan el dígito verificador: 30-71234567-1, 30-71555444-1 y 30-12345678-1.", "Dibujada"),
    ],
    "Estados que faltaban · 04/10": [
        ("Invitación", "", "Cargando («Cargando invitación…»), aceptando (el botón con la ruedita) y error al aceptar (la franja roja debajo del texto legal), en la compu y en el teléfono.", "Dibujada"),
        ("Inicios", "", "Inicio personal sin el aviso (solo el título, como la app). En el teléfono, el de la organización con «Nada para resolver» y uno nuevo para alguien con roles en una sola empresa: la billetera con «Tus empresas» y, si administra, su «Para resolver».", "Dibujada"),
        ("Mi cuenta", "", "Correo inválido, código incorrecto, vincular y desvincular Google, la baja sin motivo o con código incorrecto, la sesión cerrada por la baja y los avisos de cada acción con la lista como queda. En el teléfono, además, «Cambios sin guardar». No se dibuja «ese correo ya lo usa otra cuenta» (ADR 0041).", "Dibujada"),
        ("Roles · teléfono", "", "Crear un rol, un rol de toda la organización y el rol Dueño, solo para leer.", "Dibujada"),
        ("Usuario", "", "En el teléfono, la hoja de roles de una empresa y la franja de error al guardar. «Sumar empresa» con el 409 («Otra persona cambió esto…»), en la compu y en el teléfono.", "Dibujada"),
        ("Empresas y Empresa", "", "«Crear empresa» con el CUIT repetido, en la compu y en el teléfono. En el teléfono, la hoja de crear y la de editar, la pestaña Roles y la hoja de roles de un miembro con su error. Las hojas suben desde abajo, no a pantalla completa.", "Dibujada"),
        ("Configuración · teléfono", "", "Dominio pendiente, con «Verificar», y «Cambios sin guardar».", "Dibujada"),
        ("Página pública", "", "En el teléfono, borrador, despublicada por la plataforma (con su hoja), «Cambios sin guardar» y error al guardar. En la compu, el error al guardar arriba del contenido.", "Dibujada"),
    ],
    "La app manda · 04/10": [
        ("Pestañas", "B", "Abajo de la banda, sobre el fondo, como Empresa y la app.", "Dibujada"),
        ("Usuarios", "", "«Vence…» debajo de la palabra del estado, no del punto.", "Dibujada"),
        ("Paginado", "", "El pie con letra de 12.", "Dibujada"),
        ("Inicio · Para resolver", "", "Todas las filas de 52.", "Dibujada"),
        ("Flecha para achicar el menú", "", "En el borde del último panel de las 49 pantallas con el marco nuevo: en Administración si está abierta; si no, en el menú.", "Dibujada"),
        ("Campo con error", "", "Borde rojo también en Empresas, Empresa y los tableros que lo dejaban gris.", "Dibujada"),
        ("Agregar dominio", "", "Con el asterisco; sin dominio, «Escribí el dominio.», en la compu y en el teléfono.", "Dibujada"),
        ("Página pública · vista previa", "", "La misma tarjeta que ve el público: en un diálogo en la compu y en una hoja en el teléfono. Cambia la app.", "Dibujada"),
        ("Página pública · otra persona cambió", "", "El cartel ámbar con «Seguir editando» y «Ver lo nuevo», en la compu y en el teléfono.", "Dibujada"),
        ("Auditoría", "", "Los textos del back: «Cambió la invitación de …» (aceptada o revocada), «Habilitó a …» y «Cambió el acceso de …». El correo de la invitación vencida, tapado; la zona, con su nombre. De la plataforma, solo la aprobación. El detalle queda como el tablero: cambia la app.", "Dibujada"),
        ("Empresas", "", "Toda empresa tiene su zona; «La de la organización», en gris, solo al crear. Al editar, el CUIT sin guiones y «Guardar cambios» activo. En el teléfono, la hoja de roles sin bajada ni «Todos», con «Sin roles».", "Dibujada"),
        ("Usuario · teléfono", "", "El error al guardar con el caso de la app: Lucía se quita el rol de Dueña y la franja dice «Tiene que quedar al menos un Dueño…».", "Dibujada"),
        ("Botón principal", "", "Con el degradé en todas las pantallas, como la app.", "Dibujada"),
    ],
    "La Guía y el usuario · 05/10": [
        ("Administrador de una empresa", "A", "Sin roles de la organización: suma a su empresa personas de la organización (con el correo tapado), reenvía y revoca las invitaciones de su empresa desde la ficha y ve la ficha sin pestañas.", "Dibujada"),
        ("Guardar cambios", "", "Apagado sin cambios en todas las ediciones, también en «Editar empresa» y en los roles de un miembro; nunca por un dato que falta.", "Dibujada"),
        ("Textos de espera", "", "«Quitando…», «Desvinculando…» y «Dando de baja…», como los demás botones.", "Dibujada"),
        ("Página pública · vista previa", "", "En el teléfono, la misma tarjeta que la página del público; en la compu, diálogo de 640.", "Dibujada"),
        ("Auditoría", "", "«Quién» con las personas por nombre y después «Sistema» y «Plataforma»; en el teléfono, la hoja del detalle de un cambio.", "Dibujada"),
        ("Quitar dominio", "", "Con un correo administrado, «El que ya lo está sigue igual.»; sin ninguno, sin la frase.", "Dibujada"),
        ("Roles", "", "«Crear rol» nunca apagado; «Vale en» sin asterisco; casillas fijas en gris; la lista vacía del teléfono con el recuadro punteado.", "Dibujada"),
        ("Empresas", "", "El CUIT repetido debajo del campo, con el texto del back.", "Dibujada"),
        ("Botones de peligro · teléfono", "", "«Dar de baja», «Quitar» y «Desvincular» en rojo: v107 los había dejado en petróleo.", "Dibujada"),
        ("Desplegables", "A", "Debajo del campo y del mismo ancho; la app lo cambia en una sola pieza.", "Dibujada"),
        ("Invitaciones en la ficha de una empresa", "", "Revocar dice «El enlace deja de funcionar.»; la vencida, «Venció …» (también en Usuarios); «Revocar invitación» abajo, en rojo y después de una franja; «Agregar miembro» con el correo tapado para todos.", "Dibujada"),
    ],
    "El usuario · 07/10": [
        ("Solo lectura", "", "En todo el sistema, el mismo campo que al editar, deshabilitado y gris: Rol, M-Rol y Usuario (v113).", "Dibujada"),
        ("Inicio · compu", "", "Con el asistente prendido, el inicio de los tres lados es el asistente: el historial a la izquierda, que se pliega con el mismo botón del menú, y lo de hoy («Para resolver» y las tarjetas) como bienvenida.", "Dibujada"),
        ("Inicio de Plataforma", "", "«Inicio» arriba del menú, con el asistente y un «Para resolver» con las organizaciones por aprobar y las recuperaciones pendientes; Organizaciones sigue en Gestión.", "Dibujada"),
        ("Barra de abajo · teléfono", "", "«Asistente» en el segundo lugar; Difusiones (organización) y Recuperaciones (Plataforma) pasan a «Más».", "Dibujada"),
        ("Configuración y Uso del asistente", "", "En Administración › Asistente, como WhatsApp; con la clave de la plataforma, los topes van deshabilitados porque los fija ella.", "Dibujada"),
        ("Módulos de una organización", "", "«Asistente» dice qué clave usa y el ⋮ permite o quita la clave propia, con motivo.", "Dibujada"),
        ("Aviso de la primera vez", "", "«Tus consultas las procesa un proveedor de IA; no subas datos sensibles.» con «Entendido», en un diálogo sin cerrar ni cancelar (D22).", "Dibujada"),
        ("Catálogo de modelos", "", "Una pestaña en Configuración del asistente de Plataforma: modelo, proveedor, ID, precios de entrada y de salida, y activo (D26).", "Dibujada"),
        ("Correos de alerta del asistente", "", "Al 80 % y al 100 % del tope del mes: al Dueño si usa su clave y a la plataforma si usa la de ella (D23).", "Dibujada"),
    ],
    "La Guía y el usuario · 08/10": [
        ("Teléfonos: número sin cuenta u ocupado", "", "Como el correo (0043): el error debajo del campo y la acción real, sin código ni aviso al dueño. Ingreso, Registro, Recuperar y Mi cuenta.", "Dibujada"),
        ("Mi cuenta sin códigos", "", "Quitar, hacer principal y dar de baja sin código (0045); el código queda solo para verificar un método nuevo.", "Dibujada"),
        ("Bot de WhatsApp", "", "A un número sin cuenta, el registro personal en la web, o ingresar y recuperar si el registro está cerrado; a un operador, «Para entrar, usá la web.», sin enlace ni botones (0049).", "Dibujada"),
        ("Avisos de la organización por WhatsApp", "", "Aprobada, rechazada, página despublicada y permitido volver a publicar, con el mismo contenido que el correo (0049).", "Dibujada"),
        ("Asistente", "", "«Todavía no tenés mensajes con empresas»; con su clave, un Dueño con correo verificado o «Agregar un correo»; el tope del día dice a qué hora se renueva (0049).", "Dibujada"),
        ("Módulos de una organización", "", "El Asistente se suma; vuelve la fila de prueba de «Módulo B».", "Dibujada"),
    ],
    "El usuario · 10/10": [
        ("Catálogo de modelos: datos técnicos", "", "El diálogo de agregar o editar un modelo suma «Avanzado: datos técnicos», plegado: capacidades, límites y tarifas especiales, con el error debajo del campo; la tabla sigue con sus seis columnas y los modelos de Claude precargados ya los traen (D26).", "Dibujada"),
    ],
    "La Guía · 10/10": [
        ("Segundo factor de los operadores", "", "En el ingreso, además del código y del alta del autenticador: el bloqueo por demasiados códigos (el mismo de la cuenta), el código de recuperación que no sirve y el código que no activa el autenticador (Etapa 9).", "Dibujada"),
        ("Confirmá que sos vos", "", "Antes de una acción sensible de Plataforma, si el último código no es reciente: el código del autenticador en un diálogo (una hoja en el teléfono), con el error debajo y «Usar un código de recuperación». Dibujado al guardar permisos (Etapa 9).", "Dibujada"),
        ("Restablecer el autenticador", "", "En el ⋮ de un operador, con motivo: cierra sus sesiones y anula sus códigos de recuperación; al volver a entrar, lo configura de nuevo (Etapa 9).", "Dibujada"),
        ("WhatsApp de atención, al día", "", "Plantillas del sistema: las 16 del catálogo (0049), de a 10; el bot de Plataforma manda el enlace para entrar o registrarse; «Mis mensajes con empresas» muestra las conversaciones; Cargar teléfonos con el panel de Administración vigente (Etapa 11).", "Dibujada"),
        ("Catálogo de modelos: datos técnicos completos", "", "«Avanzado» suma Texto y Pensamiento adaptativo, los esfuerzos permitidos, la caché (lectura y escritura de 5 minutos y de 1 hora) y el contexto largo con su caché; editar muestra Claude Haiku 5.5, el único con tramo largo (contrato del back 853b5aed).", "Dibujada"),
    ],
    "El usuario · 11/10": [
        ("Uso del asistente de la organización", "", "El resumen del mes deja solo el gasto contra el tope, las consultas y las personas: la clave y los topes pueden cambiar a mitad de mes, así que se ven en Configuración.", "Dibujada"),
    ],
    "El usuario · 12/10": [
        ("Para resolver", "", "Cada tipo de pendiente va en su grupo, con su área y su total, y muestra hasta 10 filas; si hay más, «Ver todos» lleva al listado ya filtrado (Usuarios con «Vencidas» o «Baja pedida», Organizaciones con «Pendiente de aprobación», Recuperaciones con «Pendientes»). Con 10 o menos no hay «Ver todos». En los inicios de la organización, de Plataforma y del miembro, en compu y teléfono.", "Dibujada"),
    ],
    "E12 · Formularios · El usuario · 13/10": [
        ("Formularios · listado", "A", "«Formularios» en el menú principal, debajo de WhatsApp, con su panel (Formularios y Catálogos); filtro «Estado ▾» (regla única del 13/10); nombre, prefijo, estado (el motivo de «No se pudo publicar» en ⓘ) y última publicación, con ⋮ y «Nuevo formulario».", "Dibujada"),
        ("Formularios · nuevo", "A", "Un diálogo con solo «Nombre *»; al crear abre la ficha, donde se ve el prefijo propuesto. Errores debajo del campo y «Creando…».", "Dibujada"),
        ("Formularios · ficha › Preguntas", "A", "Se guarda a mano, como el resto del lienzo: «Cambios sin guardar», «Descartar cambios», «Guardar cambios» y «Publicar». Lista numerada con Editar, Subir, Bajar y Quitar en el ⋮; «Botón final» aparte; la vista previa del teléfono al costado, en español o inglés. El 409 con el cartel «Otra persona cambió esto…».", "Dibujada"),
        ("Formularios · pregunta", "A", "El diálogo va en español: tipo, pregunta, ayuda y «Obligatoria»; según el tipo, el largo máximo, los decimales (de 0 a 6) o las opciones. Cambiar el tipo avisa que es una pregunta nueva. El inglés se escribe en su pestaña.", "Dibujada"),
        ("Formularios · ficha › Inglés", "A", "Una tabla con todos los textos: el español al lado y el campo en inglés; lo que falta, en ámbar con «Falta», y la cuenta en la pestaña. La vista previa en inglés dice «Falta», nunca el texto en español. Se guarda incompleto; para publicar, todo.", "Dibujada"),
        ("Formularios · prefijo", "A", "Una caja «Datos» arriba de las preguntas, con «Nombre *» y «Prefijo *», que se guardan con el borrador. Debajo, «Las respuestas: INS-000001» con ⓘ. Tomado o con mal formato, el error debajo del campo; publicado, el mismo campo deshabilitado y gris.", "Dibujada"),
        ("Formularios · publicar", "A", "El diálogo comprueba antes de publicar: «Qué cambia en la versión N», «Queda fijo al publicar» (el prefijo, la primera vez) y los problemas por pregunta con «Editar». Con problemas, «Publicar versión N» apagado; sin guardar, «Guardar cambios»; con otra en curso, «Ver la publicación»; sin WhatsApp, «Ir a WhatsApp».", "Dibujada"),
        ("Formularios · publicación", "A", "La pestaña Publicación muestra la versión en curso con una palabra corta y su ⓘ (Publicando, Sin confirmar, No se pudo publicar con el motivo por pregunta) y la versión activa con la vista previa oficial de WhatsApp en español o inglés. La cabecera y el listado dicen lo mismo.", "Dibujada"),
        ("WhatsApp · mandar formulario", "A", "En un chat de Internos, el botón «Formulario» al lado de «Enviar» abre el diálogo: formulario en un desplegable, mensaje de hasta 1024 con contador y la vista del mensaje con «Abrir formulario» («Le llega en español, el idioma de su cuenta.»). Apagado, el motivo en su ⓘ; después, «En cola» o «No se pudo mandar» con «Reintentar».", "Dibujada"),
        ("WhatsApp · respuesta del formulario", "D", "Llega como un mensaje de quien respondió: cabecera con el ícono, el nombre del formulario, «Respuesta del formulario · versión N» y el número; debajo, renglones con el valor a la derecha, plegados a 3 con «Ver las N respuestas». «Sin respuesta» en gris. Sin permiso, solo el número con ⓘ; rechazada, en rojo con ⓘ; esperando y vencida, en el pie del envío.", "Dibujada"),
        ("Formularios · teléfono", "A", "Se edita todo, como app: el listado con «Filtros» y «+» (la hoja «Nuevo formulario»); la ficha con Preguntas, Inglés y Publicación, el ⋮ de cada pregunta en una hoja, y «Publicar» o «Descartar cambios» y «Guardar cambios» fijos abajo.", "Dibujada"),
        ("Formularios · pregunta en el teléfono", "A", "Una hoja desde abajo sobre la ficha, con los mismos campos, tipos y errores que el diálogo de la compu.", "Dibujada"),
        ("WhatsApp · mandar formulario en el teléfono", "C", "«Mandar formulario» va en el ⋮ del chat, debajo de «Pasar» y «Ver ficha del contacto»: el menú aguanta lo que sumen las etapas 13 a 17 sin llenar de botones donde se escribe. Apagado, en gris con el motivo debajo. Abre la hoja «Mandar formulario», copia de «Mandar plantilla».", "Dibujada"),
        ("WhatsApp · respuesta en el teléfono", "B", "La misma tarjeta plegada de la compu; «Ver las N respuestas» abre una hoja con todas en grilla, así la burbuja no crece con formularios largos.", "Dibujada"),
        ("Detalle de solo lectura", "", "Vale para diálogos, pestañas y listas de cambios: grilla con líneas, el rótulo sobre arena (Publicar y Publicación de Formularios, 13/10).", "Dibujada"),
    ],
    "E11 · WhatsApp · El usuario · 13/10": [
        ("WhatsApp · bot", "B", "«Configuración | Recorrido» son dos vistas de lo mismo: control segmentado arriba, no pestañas. El bot no se apaga (D9): sin «Activo» y sin interruptor en la bienvenida y el fuera de horario, que se editan.", "Dibujada"),
        ("WhatsApp · números", "", "Cada número muestra siempre «N de 1.000 gratis»; pasado el tope, «1.240 · 240 se cobran». Sin medio de pago responde hasta 1.000 por mes y no manda plantillas ni difusiones (D1). Desconectar deja sus chats para leer (D7).", "Dibujada"),
        ("WhatsApp · chats", "", "Fotos, audios y documentos se ven como «Mandó…», sin descarga (D7). Un chat que tomó otra persona se lee y lleva notas. Las plantillas en revisión o rechazadas aparecen apagadas con su motivo.", "Dibujada"),
        ("WhatsApp · equipos", "", "El aviso por correo: a los 10, 15 o 30 minutos, o «No avisar» (D6).", "Dibujada"),
        ("Plataforma · plantillas", "", "«Para consultas | Del sistema» con control segmentado; la invitación a una organización es Marketing en español y Utilidad en inglés.", "Dibujada"),
    ],
    "E13 · Catálogos · El usuario · 13/10 y 14/10": [
        ("Secciones, pestañas y filtros", "", "Regla única, en Criterio · Menús: las secciones de un área, en un segundo panel; las pestañas, solo para los grupos de datos de una ficha; los filtros de un listado, con desplegables (en el teléfono, «Filtros» con un punto); dos vistas de la misma lista, con control segmentado (Chats, plantillas de Plataforma y Uso del asistente).", "Dibujada"),
        ("Opciones apagadas", "A", "En un menú o un desplegable, lo que no aplica no va; lo que no se puede usar por algo que se resuelve va en gris con su motivo debajo (Criterio · Menús).", "Dibujada"),
        ("Catálogos · dónde viven", "B", "Un ítem del panel «Formularios», al lado de Formularios: nombre, origen, opciones, «Lo usan» y estado con ⓘ; filtro «Origen ▾».", "Dibujada"),
        ("Catálogos · nuevo", "A", "El diálogo pide el nombre y el origen con el control segmentado «Escribirlas a mano | Tomarlas de los miembros, con filtros»; el ⓘ dice «No se puede cambiar después.».", "Dibujada"),
        ("Catálogo a mano", "A", "Pestañas «Opciones | Datos». La tabla con número, texto, detalle, código y estado; ⋮ con Editar, Subir, Bajar y Dar de baja o Reactivar; tope de 500. Datos: nombre y descripción en español e inglés, y «Lo usan» en grilla.", "Dibujada"),
        ("Catálogos · opción", "A", "Cada texto con su inglés a la derecha; el texto, hasta 30 con contador; el código, único en el catálogo.", "Dibujada"),
        ("Catálogo con filtros", "A", "Pestañas «Filtros | Datos». Condiciones en filas con tres desplegables, «Otras opciones» y «Como si lo recibiera» al costado, con «Probar». Más de 200 avisa y se puede guardar; un rol borrado deja el catálogo sin poder usarse.", "Dibujada"),
        ("Pregunta · elegir de un catálogo", "A", "El campo «Catálogo»; los que no se pueden usar aparecen apagados con su motivo.", "Dibujada"),
        ("WhatsApp · mandar con catálogo", "A", "Un aviso por pregunta (más de 200, ninguna opción o catálogo que no se puede usar), con «Ver el catálogo», y «Mandar» apagado. En el teléfono, lo mismo en la hoja.", "Dibujada"),
        ("WhatsApp · respuesta con catálogo", "", "Se guarda el texto que vio la persona. Si la opción a mano se dio de baja, la tarjeta roja nombra la pregunta y ofrece «Mandar de nuevo».", "Dibujada"),
        ("Catálogos · teléfono", "A", "Listado con «Filtros» y «+»; fichas con pestañas y hojas; el editor de filtros completo, como la ficha de un formulario.", "Dibujada"),
    ],
    "E9 · Endurecimiento · El usuario · 16/10": [
        ("Confirmá que sos vos · estados", "A", "Vale 10 minutos y el ingreso cuenta. Con el código de la app o uno de recuperación, cada uno con su error; demasiados intentos es el mismo bloqueo de la cuenta, con todo apagado y el motivo arriba. Cancelar vuelve al formulario de la acción con lo cargado. La sesión vencida es el «Tu sesión venció» del ingreso.", "Dibujada"),
        ("Confirmá que sos vos · dónde", "", "Reemplaza al diálogo de la acción, nunca va encima (Cuenta-Plat, Recuperaciones, Documentos legales, Configuración). Lo piden: operadores (invitar, reenviar o anular la invitación, cambiar permisos, quitar, restablecer el autenticador); cuentas (suspender, reactivar, cerrar sesiones, baja); recuperaciones (aprobar, rechazar); organizaciones (crear, aprobar, reintentar el alta, rechazar, suspender, reactivar, cerrar, módulos, dominio y página pública); publicar un documento legal; guardar la configuración; la configuración del Asistente y del WhatsApp de Plataforma. Atender consultas y mirar, no.", "Dibujada"),
        ("Límites de uso", "A", "Una sección más de Configuración, con el mismo «Guardar cambios», motivo y versión: los doce perfiles agrupados (todo el servicio, ingreso, Asistente, WhatsApp), pedidos y «cada» con unidad. De 1 a 1.000.000 y de 1 segundo a 24 horas; sin cero. Arrancan moderados: IP 300, pública 60, cuenta 120 y organización 600 por minuto; consultas fijas 20 y conversaciones 10 por minuto; clave nueva 3 cada 15 minutos.", "Dibujada"),
        ("Aviso al llegar a un límite", "A", "Como el ingreso: un aviso corto pegado a la acción y el mismo botón dice «Reintentá en 0:41», apagado hasta que termina; después se toca a mano y no se pierde lo escrito. Si el botón es un ícono (mandar en el Asistente), la cuenta va en el aviso. En una lectura, el estado de error de la página con el mismo botón. Nunca se repite solo (Asistente, Rol y Usuarios).", "Dibujada"),
        ("Auditoría · eventos nuevos", "", "Configuró el autenticador, Restableció el autenticador (con su motivo), Ingresó con un código de recuperación y Confirmó con el autenticador; sin códigos ni secretos.", "Dibujada"),
        ("Etapa 9 · teléfono", "", "Las mismas piezas en la hoja de abajo; los límites, en filas con «cada», y el aviso arriba de la barra de abajo.", "Dibujada"),
        ("Roles · Inactivar", "", "Con usuarios, «Inactivar» va apagado en el ⋮ con el motivo debajo: «Lo tiene 1 usuario. Quitáselo primero.» o «Lo tienen N usuarios. Quitáselo primero.» (correctivo R10, como la app).", "Dibujada"),
    ],
    "E17 · Biblioteca de formularios · El usuario · 14/10 a 17/10": [
        ("Plataforma · dónde", "A", "«Formularios» es un grupo de Administración, con Biblioteca y Categorías.", "Dibujada"),
        ("Biblioteca de Plataforma", "", "Nombre, categoría, estado con «Cambios sin publicar» y «La usaron N»; filtros Estado y Categoría; vacía, sin resultados, cargando y error. En el teléfono, solo para ver.", "Dibujada"),
        ("Plantilla · ficha", "", "Pestañas Preguntas, Inglés, Catálogos y Publicación con las piezas de la E12 (más categoría y descripción); cambios sin guardar y conflicto.", "Dibujada"),
        ("Plantilla · catálogos", "B", "Una fila por catálogo con sus opciones y la pregunta que lo usa; se abre aparte, con sus opciones.", "Dibujada"),
        ("Plantilla · publicación", "", "Estado en grilla y versiones con número, fecha, operador y motivo; en borrador, «Todavía no se publicó.»; retirada, con quién, el motivo y «Volver a publicar».", "Dibujada"),
        ("Publicar una plantilla", "", "Motivo y comprobación: qué cambia, o los problemas por pregunta o por catálogo con «Publicar» apagado. La primera es la versión 1; volver a publicar sin cambios repite la misma.", "Dibujada"),
        ("Retirar", "A", "En el ⋮ de la banda, en rojo; el diálogo pide motivo y dice que las copias ya hechas no cambian.", "Dibujada"),
        ("Categorías", "A", "Lista con orden y ⋮ (Editar, Subir, Bajar, Borrar); crear, editar, mover y borrar piden motivo. Una en uso deja «Borrar» apagado con su motivo.", "Dibujada"),
        ("Permiso de operador", "", "«Administrar la biblioteca de formularios», en Cuenta-Plat y en «Cambiar permisos».", "Dibujada"),
        ("Organización · dónde", "A", "«Nuevo formulario ▾» abre «Desde cero» y «Desde una plantilla»; en el teléfono, el «+» pregunta lo mismo.", "Dibujada"),
        ("Biblioteca de la organización", "", "Tarjetas por categoría con buscador: nombre, descripción y cuántas preguntas y catálogos trae; sin plantillas, sin resultados, cargando y error.", "Dibujada"),
        ("Una plantilla", "", "Descripción, preguntas, catálogos que trae y vista previa. Sin permiso de catálogos, «Usar esta plantilla» apagado con ⓘ (en el teléfono, el motivo debajo).", "Dibujada"),
        ("Usar una plantilla", "", "Nombre y prefijo propuesto (si VIS está tomado, VIS2, con ⓘ); al crear abre la ficha del formulario nuevo, en borrador. Si se retiró en el medio, avisa y vuelve a la biblioteca.", "Dibujada"),
    ],
    "E12 · Formularios con la disposición de ArquitecturaBase · La Guía y el usuario · 17/10": [
        ("Disposición", "", "Copia la del lienzo «Formularios por WhatsApp» de ArquitecturaBase: qué hay en cada zona, qué va en un diálogo y los estados. Reemplaza las pantallas del 13/10, que pasan al Archivo. Donde choca con una regla del lienzo, manda la del lienzo.", "Dibujada"),
        ("Diseñar formularios", "", "El panel dice «Diseñar formularios». Tabla Formulario, Preguntas, En WhatsApp y Último cambio; el nombre abre el editor, sin columna de acciones. Regla del lienzo: el estado se filtra con «Estado ▾», no con el segmentado de allá.", "Dibujada"),
        ("Editor", "", "Una sola pantalla en lugar de la ficha con pestañas, Inglés y el diálogo de la pregunta: «Textos en» (Español · original | English con lo que falta), el formulario, las preguntas que se abren en el lugar y «Así lo ve el empleado» al costado. Regla del lienzo: Editar, Subir, Bajar y Quitar van en el ⋮.", "Dibujada"),
        ("Idioma", "", "Solo el idioma original es obligatorio; la traducción es opcional y nunca frena. Si no está completa, el formulario sale entero en español.", "Dibujada"),
        ("Guardar", "", "Guardado, no se guardó (lo escrito se conserva), guardado sin confirmar con «Consultar guardado» y, si otra persona guardó, la revisión: «Qué cambió | Guardado actualmente | Mis cambios».", "Dibujada"),
        ("Publicar", "", "«Publicar la versión N en WhatsApp»: qué cambia, en qué idioma sale, qué queda fijo y qué va a pasar, con la hora del borrador que se publica. Comprobando, primero guardá, una pregunta que no se puede mostrar (con el botón apagado), venció, cambió después de comprobar y ya se está publicando.", "Dibujada"),
        ("Cómo termina", "", "Arriba del editor, los pasos Aceptada, Enviada a WhatsApp, WhatsApp la revisa y Lista para mandar. Rechazada con «Ir a la pregunta»; sin confirmar con «Consultar ahora», nunca «Reintentar»; necesita revisión. La vista oficial va al costado, con «Borrador | Versión N en WhatsApp».", "Dibujada"),
        ("Enviar desde el chat", "", "«Enviar formulario» al lado de «Enviar» en Internos. El diálogo: tarjetas con «Versión N · K preguntas» (buscador y paginado si son muchos), el idioma de su cuenta, el mensaje prellenado (hasta 1024) y hasta cuándo se puede mandar. Reglas del lienzo: el motivo de un botón apagado va en su ⓘ y el diálogo va sin descripción arriba.", "Dibujada"),
        ("Después de enviar", "", "La burbuja lleva la tarjeta del formulario; abajo, En cola, Leído, No se pudo mandar (con ⓘ, sin reintento) o Envío sin confirmar con «Ya lo revisé», que pide confirmación. Pedido incierto: «Consultar envío». Con el diálogo abierto: ventana cerrada y formulario que ya no está.", "Dibujada"),
        ("La respuesta", "", "Tarjeta con las primeras 3 en grilla, «Ver las N respuestas» y «Guardada como VIS-000123»; guardando, no se pudo guardar, no reconocida, sin permiso, en inglés y el mensaje que ya no está. El encabezado del chat sigue el de la E11 (teléfono · Empleado · empresa).", "Dibujada"),
        ("Teléfono", "", "«Diseñar formularios» con las mismas columnas; el editor en una sola pantalla, la pregunta en una hoja y los botones fijos abajo. «Enviar formulario» sigue en el ⋮ del chat (C, 13/10) y «Ver las N respuestas» abre la hoja en grilla (B, 13/10).", "Dibujada"),
    ],
    "E13 · Catálogos con la disposición de ArquitecturaBase · La Guía y el usuario · 17/10": [
        ("Disposición", "", "Copia K1 a K7 del lienzo de ArquitecturaBase y reemplaza las pantallas del 13 y 14/10, que pasan al Archivo. La consulta con SQL (K5) no entra: allá también quedó para después.", "Dibujada"),
        ("Catálogos", "", "Tabla Catálogo (con su descripción), De dónde salen, Opciones, Lo usan y Estado (No se puede usar lleva el motivo debajo); el nombre abre el editor. Reglas del lienzo: «Origen ▾» y «Estado ▾» en lugar del segmentado, y sin columna de acciones.", "Dibujada"),
        ("Nuevo catálogo", "", "El diálogo pregunta solo de dónde salen las opciones, en dos tarjetas, y «Continuar» abre el editor, donde se escribe el nombre.", "Dibujada"),
        ("Catálogo escrito a mano", "", "Una sola pantalla, como el editor de formularios: «Textos en», el catálogo, las opciones con buscador y «Estado ▾» que se abren en el lugar, y al costado «Lo usan» y «Así lo ve el empleado». Todo se guarda junto. Reglas del lienzo: ⋮ por opción, «Guardar cambios» y «Dar de baja» en el ⋮ de la banda.", "Dibujada"),
        ("Catálogo con filtros", "", "Una sola pantalla: el catálogo, los miembros que entran (vista Miembros con Nombre, Rol, Empresa y Activo) y, al costado, «Como si lo recibiera» con «Probar». Con más de 200 se guarda con el aviso «Más de 200: no se va a poder mandar»: lo que frena es el envío (decisión 22). Un nombre de más de 30 se corta con «…» y va completo en el detalle (decisión 21). Sin persona de ejemplo no se crea.", "Dibujada"),
        ("La pregunta", "", "«Elegir de un catálogo» se abre en el lugar, con el desplegable de catálogos (los que no se pueden usar, apagados con su motivo), «Ver el catálogo» y el vacío.", "Dibujada"),
        ("Al mandar y al responder", "", "En el envío, las opciones por pregunta, «Preparando las opciones…» y, en rojo, más de 200, ninguna o catálogo que no se puede usar, con el envío apagado y sin enlace. La respuesta muestra el catálogo y el código; una opción dada de baja no se guarda y ofrece «Mandar de nuevo».", "Dibujada"),
        ("Teléfono", "", "El listado con «Filtros» y «+»; los dos editores en una sola pantalla, con opciones y condiciones en hojas y la vista previa abajo.", "Dibujada"),
    ],
    "E17 y E14 · El editor nuevo y los archivos · La Guía · 17/10": [
        ("Plantilla de Plataforma", "", "La pestaña «Plantilla» es el editor de formularios de la E12: «Textos en», la plantilla con categoría, prefijo sugerido y descripción, las preguntas que se abren en el lugar y «Así lo ve el empleado». Se van «Preguntas» e «Inglés»; Catálogos y Publicación siguen. Con cambios: Descartar, Guardar borrador y Publicar.", "Dibujada"),
        ("Foto y Documento", "", "Dos tipos más en el editor. Foto: «Cámara o galería» o «Solo cámara», y cuántas (mínimo y máximo; con mínimo 1 es obligatoria). Documento: PDF, Excel, Word, JPEG y PNG. Arriba, «Archivos: hasta N de 10»; la vista previa dice en qué pantalla queda. Sin almacenamiento, los dos tipos se ven apagados con su motivo.", "Dibujada"),
        ("Más de 10 archivos", "", "Se revisa al publicar, como el resto de la comprobación: «Publicar versión N» apagado e «Ir a las preguntas».", "Dibujada"),
        ("La respuesta con archivos", "", "Miniaturas y «+N» para las fotos; el documento con su nombre, su peso y «Descargar». Mientras baja, «Lo estamos bajando de WhatsApp y guardando…»; si reintenta, que no hace falta hacer nada. Si un archivo no baja o no es lo que dice, nada se guarda y ofrece «Mandar de nuevo».", "Dibujada"),
        ("El visor", "", "Sobre el chat: la foto grande, anterior y siguiente, la tira de miniaturas y abajo el nombre, el peso, si se sacó con la cámara y «Descargar». En el teléfono ocupa toda la pantalla. Si se pierde el permiso, se cierra y las miniaturas se van.", "Dibujada"),
    ],
    "E9 · Lo que no coincidía con la app · Coordinador de la E9 · 17/10": [
        ("Permisos de un operador", "", "Suman «Usar el asistente de Plataforma», «Configurar el asistente de Plataforma» y «Ver el uso del asistente»; «Cambiar la configuración» queda última, como en la app.", "Dibujada"),
        ("Configuración de Plataforma", "", "Una tarjeta por sección. En el teléfono, un título chico gris arriba de cada tarjeta; con un conflicto, la banda va de lado a lado y el formulario se ve desde arriba.", "Dibujada"),
        ("Bandas del límite y de conflicto", "", "Llevan ⚠, como Banner y ConcurrencyBanner. En la compu, «Seguir editando» va en verde.", "Dibujada"),
        ("Publicar un documento legal", "", "La miga suma «/ Publicar versión nueva»; el aviso va fuera de la tarjeta; una tarjeta «Versión» y otra «Contenido»; cuadros de unos cuatro renglones.", "Dibujada"),
        ("Teléfono", "", "El rol con cambios dice «Cambios sin guardar»; Auditoría dice «Administración»; el error de carga de Usuarios va en un recuadro punteado; el asistente lleva el título a la izquierda y los atajos sin ⚡; «Confirmá que sos vos» siempre con ✕.", "Dibujada"),
        ("El ⋮ de una fila", "", "Abre hacia abajo; sube solo si no hay lugar, en las dos últimas filas de una página llena.", "Dibujada"),
    ],
    "E15 · La planilla, el detalle y el Excel · La Guía · 18/10": [
        ("Respuestas en el panel", "", "Un grupo del panel de Formularios, como «Gestión de usuarios»: un enlace por formulario publicado y, con muchos, «Ver todos». Sin el permiso de ver respuestas, el grupo no aparece. En el teléfono, Más › Formularios › Respuestas.", "Dibujada"),
        ("La planilla", "", "Columnas fijas N°, Recibida, Cargó (con el canal) y Empresas; después una por pregunta, con las retiradas al final. «Sin respuesta» y «—» (no existía en esa versión) en gris. Se desplaza a lo ancho con el N° fijo.", "Dibujada"),
        ("Filtros", "", "«Buscar en Observaciones» (solo los textos largos), «Empresa ▾» (decisión 24), «Recibida ▾» y «Más filtros» en un panel al costado, con cuántas respuestas hay en cada opción. Lo elegido va en el filtro, sin fila de chips (Criterio · Menús).", "Dibujada"),
        ("Columnas", "", "«Columnas · 1 oculta ▾» con casillas: lo de la respuesta, las preguntas y las retiradas. Vive en la dirección.", "Dibujada"),
        ("Una respuesta (D2)", "", "Al costado de la planilla: el número, ↑ ↓ y ✕, con los atajos en el tooltip y sin línea de ayuda; «Abrir conversación»; Recibida con quién la respondió; pestañas Respuesta y Fotos. En el teléfono, a pantalla completa con «5 de 24».", "Dibujada"),
        ("Exportar", "", "Botón en la banda, solo con el permiso. El diálogo dice cuántas y con qué filtros; Todas las preguntas o Solo las columnas visibles; lo de los archivos en ⓘ. Con más de 10.000, Exportar se apaga y pide acotar.", "Dibujada"),
    ],
    "E16 · Reglas, aprobación, PDF y avisos · La Guía · 18/10": [
        ("Cuando llega una respuesta", "", "Sección del editor, debajo de las preguntas, con su propio «Guardar reglas» y el historial a la derecha. Cada regla en palabras (Cuando, Si, Hacer) con ⋮; se edita en el lugar. Que se guardan aparte va en ⓘ.", "Dibujada"),
        ("Diseño del PDF", "", "Página en dos columnas, con «Descartar» y «Guardar diseño» en la banda y la vista previa en Español o English. Si falta el inglés, la vista previa sale en español y lo avisa.", "Dibujada"),
        ("Por aprobar", "", "En el panel de Formularios, con su cantidad, y en «Para resolver» del inicio. «Ver: para mí ▾» en lugar del segmentado y «Formulario ▾»; de la más vieja a la más nueva. Sin permiso de ver respuestas, se decide en un diálogo sin los datos.", "Dibujada"),
        ("Decidir", "", "En el detalle, Aprobar y Rechazar van en el momento «Por aprobar»; rechazar pide un motivo de hasta 500. La respuesta propia queda apagada con ⓘ; si otra persona decidió antes, avisa y se actualiza. En el teléfono, los botones van fijos abajo.", "Dibujada"),
        ("Actividad y PDF", "", "Pestañas del detalle: qué hizo cada regla, con su estado (Hecho, Leído, Entregado, No se pudo, Sin confirmar), Reintentar y Consultar, y «Resolver el envío». El PDF es una copia fija, con Ver y Descargar.", "Dibujada"),
        ("Avisos en el chat", "", "Burbuja «Automático» con la tarjeta «Acción del formulario» (aviso o documento). Fuera de las 24 horas queda «No se pudo» (decisión 26).", "Dibujada"),
    ],
    "E17 · Reglas de ejemplo y PDF de una plantilla · La Guía · 18/10": [
        ("En Plataforma", "", "La sección «Cuando llega una respuesta» de la E16, debajo de las preguntas de la pestaña «Plantilla», sin botón propio ni historial: se guarda con el borrador y se publica con la plantilla (decisión 33). Publicar comprueba las reglas como la E16, salvo el rol.", "Dibujada"),
        ("Rol sugerido", "", "Una acción que pide un rol dice «Lo elige cada organización» (candado) y suma «Rol sugerido», que solo se muestra: nunca elige un rol, ni aunque el nombre coincida (decisión 32). En las reglas va como etiqueta punteada al final de la acción.", "Dibujada"),
        ("El PDF de la plantilla", "", "La página del diseño del PDF de la E16 dentro de Plataforma, desde «Ver el diseño», con «Descartar» y «Guardar borrador». La vista previa lleva «Logo» y «Nombre de la organización» en lugar de los de una organización.", "Dibujada"),
        ("Al usar la plantilla", "", "Las reglas llegan precargadas en el editor, con «De la plantilla» y «Sin guardar»: «Elegí el rol» en cada acción que lo pide, con el sugerido debajo, y «Guardar reglas» apagado con ⓘ hasta elegirlos. Lo que apunta a una pregunta borrada queda marcado para corregir o quitar. Al guardar nace la revisión 1 (decisión 30). El PDF llega listo, como primer diseño (decisión 31).", "Dibujada"),
        ("En la vista de la plantilla", "", "«Reglas de ejemplo» debajo de los catálogos, en palabras y sin ⋮, con «un rol que elegís al usarla» y el sugerido. En el teléfono, el mismo grupo, más abajo.", "Dibujada"),
    ],
    "El asistente de formularios · La Guía · 18/10": [
        ("El modo de la conversación", "", "En la cabecera, «Asistente» o «Atención manual», y la marca en la lista. Se pasa a Asistente desde el ⋮ con una confirmación, solo con «Administrar WhatsApp» y solo en Internos (decisiones 28 y 29). Mientras atiende, en lugar del compositor va «Tomar atención manual».", "Dibujada"),
        ("Lo que manda el asistente", "", "Burbuja «Asistente» con el formulario prellenado y una caja punteada «Por qué lo mandó». Las reglas siguen como «Automático». Nunca guarda: confirma la persona.", "Dibujada"),
        ("En atención manual", "", "Arriba del compositor, «El asistente sugiere mandarle…» con «No, gracias» y «Revisar y enviar», que abre el diálogo de envío con los prellenados para destildar.", "Dibujada"),
        ("Audios", "", "Burbuja de audio con la transcripción debajo; pasando a texto y sin poder pasarlo (queda para un operador). Se guardan mientras exista el contacto, como el texto del chat (D4 de la E11).", "Dibujada"),
        ("Catálogo propuesto", "", "La misma pantalla del catálogo con filtros, marcada «Propuesta del asistente», con «Descartar propuesta» y «Aprobar y activar». No se usa hasta que alguien la apruebe.", "Dibujada"),
        ("Formularios que faltan", "", "Entrada propia en el panel de Formularios, con su cantidad: temas con pedidos, personas y último pedido, sin nombres ni mensajes; ⋮ con «Crear formulario» y «Descartar»; «Estado ▾» en lugar del segmentado.", "Dibujada"),
        ("En el editor", "", "«Cuándo lo ofrece el asistente» en «El formulario», a todo el ancho. «Qué sugerir después» debajo de las reglas, con su guardado: el formulario, La IA decide o Preguntar siempre, el «cuándo» y los datos que pasan, del mismo tipo.", "Dibujada"),
        ("De dónde vino", "", "En el detalle, «La mandó el asistente» con lo que propuso y lo que cambió la persona, y «La cadena» con la respuesta que sugirió la siguiente.", "Dibujada"),
    ],
    "E10 · Exportar mis datos · La Guía · 20/10": [
        ("Pedir los datos", "", "En Mi cuenta › Privacidad, «Exportar» pide todo de una vez: sin opciones, sin historial y sin «Confirmá que sos vos». Mientras sale, «Pidiendo…»; al aceptarse, el aviso verde «Recibimos tu pedido. Te mandamos tus datos por correo cuando estén listos.»", "Dibujada"),
        ("Si falla", "", "Sin conexión, el aviso rojo con «Reintentar» y ✕. Con muchos pedidos, el cartel de la Etapa 9 y el botón «Reintentá en 0:41».", "Dibujada"),
        ("Sin correo verificado", "", "«Exportar» apagado con ⓘ; los dos abren el motivo, como «Dar de baja» de la única Dueña: «Agregá y verificá un correo para recibir tus datos.», con agregar un correo o vincular Google.", "Dibujada"),
        ("Desde el correo", "", "El enlace abre Mi cuenta con la sesión de la cuenta: «Descargando tus datos…» en un cartel y «Descargamos tus datos.» al terminar. Vencido, pedido con otra cuenta y no se pudo bajar, en el aviso rojo (los dos primeros sin «Reintentar»). Un pedido ajeno no dice si existe.", "Dibujada"),
    ],
    "Lo que sigue": [
        ("Nada pendiente", "", "El lienzo dibuja todos los estados que tiene la app de las etapas 1 a 6. Lo que llegue, en la próxima tanda.", "Decidido"),
    ],
}


def fila_regla(regla, tablero, fecha):
    return f'<div class="f" style="grid-template-columns: {COLS_R};"><span>{regla}</span><span>{tablero}</span><span class="gris">{fecha}</span></div>'


def fila_decision(pantalla, opcion, que, estado):
    op = f'<span class="op">{opcion}</span>' if opcion else ""
    cuerpo = f"<span>{op}{que}</span>" if que else '<span class="nada">—</span>'
    return (f'<div class="f" style="grid-template-columns: {COLS_D};"><strong>{pantalla}</strong>{cuerpo}'
            f'<span class="est {ESTADOS[estado]}">{estado}</span></div>')


reglas_html = "\n      ".join(fila_regla(*r) for r in REGLAS)
def seccion(pagina, filas):
    return f"""  <section>
    <h2>{pagina}</h2>
    <div class="dec">
      <div class="c" style="grid-template-columns: {COLS_D};"><span>Pantalla</span><span>Qué se eligió</span><span>En el lienzo</span></div>
      {"".join(fila_decision(*d) for d in filas)}
    </div>
  </section>"""


# Reparto en dos columnas sin cambiar el orden: la primera lleva las reglas y las secciones hasta la mitad del alto estimado
# (cada fila pesa según el largo de su texto, porque las largas ocupan dos o tres renglones).
def peso_filas(filas, i_texto):
    return 3 + sum(1 + len(f[i_texto]) // 120 for f in filas)


# Las reglas van en una columna más angosta y ocupan más renglones de lo que dice su largo (medido en la versión 129).
PESO_REGLAS = round(peso_filas(REGLAS, 0) * 1.25)
total = PESO_REGLAS + sum(peso_filas(f, 2) for f in DECISIONES.values())
# Las secciones van en orden, repartidas por peso entre las columnas; la primera empieza con las reglas.
columnas, acumulado, k = [[] for _ in range(COLUMNAS)], PESO_REGLAS, 0
for pagina, filas in DECISIONES.items():
    p = peso_filas(filas, 2)
    if k < COLUMNAS - 1 and acumulado + p / 2 > total * (k + 1) / COLUMNAS:
        k += 1
    columnas[k].append(seccion(pagina, filas))
    acumulado += p

BODY = f"""<div class="crit">
  <div>
    <h1>Decisiones por pantalla</h1>
    <p class="sub">Lo que elegiste en cada pantalla. Si una decisión deja una regla para todas, la regla va también a su tablero.</p>
  </div>
  <div class="cols">
  <div>
  <section>
    <h2>Reglas que salieron de estas decisiones</h2>
    <div class="dec">
      <div class="c" style="grid-template-columns: {COLS_R};"><span>Regla</span><span>Tablero</span><span>Desde</span></div>
      {reglas_html}
    </div>
  </section>

{chr(10).join(columnas[0])}
  </div>
{"".join("  <div>" + chr(10) + chr(10).join(c) + chr(10) + "  </div>" + chr(10) for c in columnas[1:])}  </div>
</div>"""

SCRIPT = f"""<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":{ANCHO},"height":{ALTO}}}}}'>
class Component extends DCLogic {{
  renderVals() {{
    return {{ si: true, no: false }};
  }}
}}
</script>"""

html = "\n".join([head, CSS, "</helmet>", "", BODY, "</x-dc>", "", SCRIPT, "</body>", "</html>", ""])
(PROJ / ARCHIVO).write_text(html, encoding="utf-8")

ruta = PROJ / "canvas.json"
c = json.loads(ruta.read_text(encoding="utf-8"))
c["boards"][ARCHIVO] = {"x": 10640, "y": 260, "w": ANCHO, "h": ALTO, "title": TITULO, "page": "criterio"}
if ARCHIVO not in c["order"]:
    c["order"].append(ARCHIVO)
c["notes"]["t-criterio"]["maxW"] = 8000
ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")
print("ok", len(html))
