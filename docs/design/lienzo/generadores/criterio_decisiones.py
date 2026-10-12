"""Tablero «Criterio · Decisiones por pantalla»: lo que el usuario eligió en cada pantalla y las reglas que dejó.
Cada decisión nueva suma una fila en DECISIONES; si deja una regla, va también a REGLAS y al tablero de esa pieza.
Va en tres columnas (4440 de ancho): el lienzo recorta un tablero a 8000 de alto, y en dos columnas ya no entraba (v120)."""
import json
import pathlib
import re

PROJ = pathlib.Path(__file__).resolve().parent.parent  # docs/design/lienzo: los tableros y canvas.json
ALTO = 6000
ANCHO = 4440
COLUMNAS = 3
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
.cols { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 48px; align-items: start; }
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
        ("Cargar teléfonos de empleados", "A", "Desde Usuarios, en dos pasos: pegar o subir y revisar qué pasa con cada número: «Ya es miembro», «Se invita» o «Número inválido». Nunca dice si un número tiene cuenta (ADR 0041): la cuenta se vincula al aceptar la invitación.", "Dibujada"),
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


total = peso_filas(REGLAS, 0) + sum(peso_filas(f, 2) for f in DECISIONES.values())
# Las secciones van en orden, repartidas por peso entre las columnas; la primera empieza con las reglas.
columnas, acumulado, k = [[] for _ in range(COLUMNAS)], peso_filas(REGLAS, 0), 0
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
