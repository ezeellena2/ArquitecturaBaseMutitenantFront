"""Tablero «Criterio · Decisiones por pantalla»: lo que el usuario eligió en cada pantalla y las reglas que dejó.
Cada decisión nueva suma una fila en DECISIONES; si deja una regla, va también a REGLAS y al tablero de esa pieza."""
import json
import pathlib
import re

PROJ = pathlib.Path(__file__).resolve().parent.parent  # docs/design/lienzo: los tableros y canvas.json
ALTO = 7420
ARCHIVO = "Criterio-Decisiones.dc.html"
TITULO = "Criterio · Decisiones por pantalla"

botones = (PROJ / "Criterio-Botones.dc.html").read_text(encoding="utf-8")
head = botones.split("</helmet>", 1)[0].replace("<title>Criterio · Botones</title>", f"<title>{TITULO}</title>")
head = re.sub(r"(\.crit \{[^}]*min-height: )\d+px", lambda m: m.group(1) + f"{ALTO}px", head)

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
    ("Dentro de una caja, dos columnas iguales que ocupan todo el ancho.", "Formularios y campos", "02/10/2026"),
    ("Sin textos que explican: el estado se dice una vez arriba y un ⓘ abre el aviso importante.", "Avisos y errores · Diálogos", "02/10/2026"),
    ("Una celda puede llevar una segunda línea gris que aclara la primera.", "Tablas y listas", "02/10/2026"),
    ("Una lista se lee; cambiar una fila o sumar otra abre un diálogo chico.", "Tablas y listas", "02/10/2026"),
    ("Los permisos de un rol van en grupos que se abren y se cierran.", "Tablas y listas", "02/10/2026"),
    ("Lo que solo crece, como la auditoría, se pide de a tandas con «Cargar más» y sin total.", "Tablas y listas", "02/10/2026"),
    ("Dos vistas del mismo contenido pueden ir en pestañas (Bot: Configuración y Recorrido).", "Marco y pantallas", "03/10/2026"),
    ("Los módulos de uso diario (WhatsApp) van arriba, debajo de Inicio, y abren su propio panel; Administración, abajo con una línea.", "Menús y desplegables", "03/10/2026"),
    ("Antes de algo que se paga (difusión, plantilla), se muestra el costo estimado.", "Diálogos", "03/10/2026"),
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
    ],
    "Organización · 13 pantallas": [
        ("Usuarios", "A", "Usuario (nombre y correo), Rol en la organización, Empresa (con su rol debajo), Estado («Vence …» si es una invitación) y ⋮. Sin empresa, una sola raya.", "Dibujada"),
        ("Editar usuario", "B", "«Acceso a la organización» en dos columnas a todo el ancho. «Empresas» es una lista para leer («Delta S.A.» / «Solo lectura») con ⋮; cambiar los roles o «+ Sumar empresa» abre un diálogo chico.", "Dibujada"),
        ("Roles y permisos", "A", "Rol (con «De sistema» debajo), Vale en, Usuarios, Permisos y ⋮. Sin descripción ni tipo.", "Dibujada"),
        ("Editar un rol", "A", "Una fila por permiso, solo con el nombre. Cada área se abre y se cierra; al entrar, abiertas las que tienen algo marcado.", "Dibujada"),
        ("Empresas", "A", "Empresa (con el CUIT debajo, o «Sin CUIT»), Zona horaria, Miembros, Estado y ⋮.", "Dibujada"),
        ("Ficha de empresa", "A", "Quedan las pestañas Miembros y Roles. Miembros: Miembro (nombre y correo), Roles en la empresa, Estado y ⋮. Sin roles, una raya.", "Dibujada"),
        ("Configuración", "A", "Datos en dos columnas y la caja «Dominio de correo». Sin dominio: «Sin dominio» y «+ Agregar dominio». Pendiente: «Pendiente · Falta cargar un registro en el DNS del dominio», con «Verificar» y ⋮. «Quitar» aclara que los correos ya administrados siguen igual.", "Dibujada"),
        ("Página pública", "A", "Dos columnas; el logo es la primera fila de «Página». Arriba solo el estado («● Publicada»); la dirección, en «Publicación» y en su campo. «Nombre de la página». Borrador: interruptor «Visible en delta.plataforma.com». Despublicada: el estado arriba, en rojo; un ⓘ y el interruptor trabado.", "Dibujada"),
        ("Auditoría", "A", "Fecha y hora, Qué pasó (con el nombre: «Cambió los roles de Tomás Acosta»), Dónde y Quién. Tocar «Qué pasó» abre el detalle; sin el ojo. Arriba, sin cantidad. «Cargar más» al pie. El backend tiene que sumar el nombre y la empresa.", "Dibujada"),
        ("Inicio de la organización", "A", "Arriba, las áreas en tarjetas con un dato real (11 usuarios, ● Publicada…); abajo, «Para resolver» como tabla: Pendiente, Área, Estado, Desde y el enlace que lo resuelve. Sin pendientes, «Nada para resolver».", "Dibujada"),
        ("Inicio de un miembro", "A", "«Tus empresas» en las mismas tarjetas (su rol y cuántos miembros); si administra su empresa, abajo su «Para resolver».", "Dibujada"),
        ("Sin permiso o no encontrada", "A", "Solo el título («No tenés permiso para ver esta página» o «No encontramos esta página») y «Ir al inicio», sin la línea que explica.", "Dibujada"),
        ("Avisos del sistema", "A", "Sin conexión: solo el cartel de arriba. Error del servidor: el código, detrás de «Copiar código». Módulo apagado: sin la línea que explica. De fondo, Configuración en dos columnas.", "Dibujada"),
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
        ("Bot", "A y B", "Pestañas «Configuración» (cajas) y «Recorrido» (diagrama); la opción del menú pasa a un equipo o contesta un texto.", "Dibujada"),
        ("Equipos", "A", "Tabla; crear y editar en un diálogo.", "Dibujada"),
        ("Plantillas", "B", "Lista con estado en Meta; «Nueva plantilla» en un diálogo con nombre, tipo y texto.", "Dibujada"),
        ("Cargar teléfonos de empleados", "A", "Desde Usuarios, en dos pasos: pegar o subir y revisar qué pasa con cada número.", "Dibujada"),
        ("Mensajes de la persona", "A", "En el perfil personal, solo para leer, con «Seguir en WhatsApp».", "Dibujada"),
        ("Permisos", "A", "Área WhatsApp con 4: Atender clientes, Atender internos, Mandar difusiones y Administrar WhatsApp.", "Dibujada"),
        ("Correo «Chats esperando»", "A", "Solo el resumen y «Ver los chats», sin copiar mensajes ni teléfonos.", "Dibujada"),
        ("Menú de la organización", "", "«WhatsApp» arriba, debajo de Inicio, con el contador de Chats; abre un segundo panel (Chats, Contactos, Difusiones) como Administración, y solo uno de los dos abre a la vez. «Administración» queda abajo, con la línea, por ser configuración. En el teléfono, la barra de abajo y «Más».", "Dibujada"),
        ("Menú de Plataforma", "B", "«WhatsApp» para atender y la configuración dentro de «Configuración».", "Dibujada"),
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
        ("Bot · Equipos · Plantillas · Cargar teléfonos · Mensajes", "", "Decididos con los mismos criterios: ajustes en grupos, recorrido como línea de pasos, listas con ⋮ y «+», acción fija abajo, Mensajes con su propia barra (Inicio, Mensajes, Más).", "Dibujada"),
    ],
    "Organización · teléfonos (como app)": [
        ("Usuarios · Roles · Empresas", "", "Listas de borde a borde con ⋮ en cada fila y «+» para invitar, crear rol o crear empresa. En Usuarios, «Cargar teléfonos» va en el ⋮ de arriba.", "Dibujada"),
        ("Ficha de empresa", "", "Pestañas «Miembros | Roles»; cada miembro con su rol y estado, ⋮ y «+» para agregar.", "Dibujada"),
        ("Editar usuario", "", "Grupos «Acceso a la organización» (Estado, Roles) y «Empresas» con «Sumar empresa»; abajo, fijos, «Descartar cambios» y «Guardar cambios».", "Dibujada"),
        ("Editar un rol", "", "Nombre, Vale en y Descripción; los permisos se abren por área, con casillas; abajo, fijos, «Cancelar» y «Guardar cambios».", "Dibujada"),
        ("Configuración · Página pública", "", "Campos a lo ancho y grupos (Dominio de correo; Publicación, Página y Contacto); abajo, fijos, «Descartar cambios» y «Guardar cambios».", "Dibujada"),
        ("Diálogos", "", "Invitar usuario, Sumar empresa, Agregar y Verificar dominio como hojas; Quitar dominio, confirmación sin ✕ y con el botón rojo.", "Dibujada"),
        ("Auditoría", "", "Qué pasó con la fecha, y dónde y quién debajo; «Cargar más» al final.", "Dibujada"),
        ("Inicio", "C", "Como una billetera: cabecera de color con «Hola, Lucía» y la organización; atajos redondos con un globito rojo con lo pendiente de cada área; «Para resolver» en filas con ícono redondo del color de la urgencia y la acción en un botón cápsula.", "Dibujada"),
    ],
    "Plataforma y perfil personal · teléfonos (como app)": [
        ("Barra de abajo de Plataforma", "", "Organizaciones, Cuentas, Recuperaciones, Chats y «Más» (WhatsApp, Administración, Configuración de WhatsApp, Mi cuenta y Salir).", "Dibujada"),
        ("Organizaciones · Cuentas · Recuperaciones", "", "Listas de borde a borde con ⋮ y estado de color; «+» para crear organización e invitar operador.", "Dibujada"),
        ("Fichas de organización y de cuenta", "", "Muchas pestañas: se deslizan de costado.", "Dibujada"),
        ("Auditoría de la plataforma", "", "El detalle de un evento sube como hoja, con «Cerrar».", "Dibujada"),
        ("Barra de abajo de la persona", "", "Inicio, Mensajes y «Más» (perfiles, Mi cuenta y Salir).", "Dibujada"),
        ("Mi cuenta", "", "En grupos (Tus datos, Cómo entrás, Privacidad), con «Descartar cambios» y «Guardar cambios» fijos abajo; agregar, verificar y dar de baja en hojas.", "Dibujada"),
    ],
    "Plataforma · compu": [
        ("Menú", "B", "Gestión, WhatsApp (Chats, Contactos, Difusiones) y Administración, con la configuración de WhatsApp dentro de Administración.", "Dibujada"),
        ("Organizaciones", "", "Organización (alta y origen debajo), Dueño (correo debajo), Empresas, Miembros y Estado.", "Dibujada"),
        ("Ficha de una organización", "", "Con pestañas (Historial, Dueños, Módulos, Dominio verificado, Página pública); el primer módulo es WhatsApp.", "Dibujada"),
        ("Cuentas", "", "Cuenta (nombre y correo), Perfiles, Último ingreso (cómo entró debajo) y Estado; sin Teléfono.", "Dibujada"),
        ("Ficha de una cuenta", "", "Los métodos como en Mi cuenta: filas sin encabezado, el tipo y quién lo administra debajo, y el estado solo si pide atención.", "Dibujada"),
        ("Recuperaciones · Auditoría · Legales · Configuración", "", "Cuenta con la fecha debajo; auditoría sin ojo ni cantidad y detalle en grilla; legales como lista («Versión N · vigente desde…»); «Registro y altas» con su encabezado.", "Dibujada"),
    ],
    "Sitio público": [
        ("Portada", "B", "Sin la etiqueta del héroe; después de «Dos lados separados», la sección «Empresas en ArquitecturaBase» con buscador, tres empresas y «Ver todas las empresas», que lleva al directorio. «Empresas», arriba, baja a esa sección.", "Dibujada"),
        ("Directorio", "B", "El encabezado de la portada con «Empresas» marcado y las empresas en tarjetas (logo, nombre, descripción y dirección), con la paginación debajo.", "Dibujada"),
        ("Página pública", "B", "Una tarjeta centrada: logo, nombre, descripción, los cuatro datos de contacto y «Ingresá para continuar» (vuelve a la misma página). Con sesión, sin el botón y con tu menú arriba. «No disponible», en la misma tarjeta, sin decir por qué.", "Dibujada"),
        ("Portada · teléfono", "A", "Web en una columna: la marca, «Ingresar» y ☰ (Personas, Cómo empezar, Empresas e «Ingresá como empresa»); la sección de empresas en tarjetas, una debajo de otra.", "Dibujada"),
        ("Directorio · teléfono", "", "El ☰ de la portada con «Empresas» marcado; buscador a lo ancho y tarjetas en una columna. Dirección: /empresas.", "Dibujada"),
        ("Página pública · teléfono", "", "La misma tarjeta de la compu, con sus tres estados; sin ☰, porque es la página de la organización.", "Dibujada"),
    ],
    "Lo que sigue": [
        ("Alta de Meta", "", "Se dibuja cuando el usuario lo pida.", "Falta decidir"),
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
paginas_html = "\n\n".join(
    f"""  <section>
    <h2>{pagina}</h2>
    <div class="dec">
      <div class="c" style="grid-template-columns: {COLS_D};"><span>Pantalla</span><span>Qué se eligió</span><span>En el lienzo</span></div>
      {"".join(fila_decision(*d) for d in filas)}
    </div>
  </section>"""
    for pagina, filas in DECISIONES.items()
)

BODY = f"""<div class="crit">
  <div>
    <h1>Decisiones por pantalla</h1>
    <p class="sub">Lo que elegiste en cada pantalla. Si una decisión deja una regla para todas, la regla va también a su tablero.</p>
  </div>

  <section>
    <h2>Reglas que salieron de estas decisiones</h2>
    <div class="dec">
      <div class="c" style="grid-template-columns: {COLS_R};"><span>Regla</span><span>Tablero</span><span>Desde</span></div>
      {reglas_html}
    </div>
  </section>

{paginas_html}
</div>"""

SCRIPT = f"""<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":1440,"height":{ALTO}}}}}'>
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
c["boards"][ARCHIVO] = {"x": 10640, "y": 260, "w": 1440, "h": ALTO, "title": TITULO, "page": "criterio"}
if ARCHIVO not in c["order"]:
    c["order"].append(ARCHIVO)
c["notes"]["t-criterio"]["maxW"] = 8000
ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")
print("ok", len(html))
