"""Tablero «Criterio · Decisiones por pantalla»: lo que el usuario eligió en cada pantalla y las reglas que dejó.
Cada decisión nueva suma una fila en DECISIONES; si deja una regla, va también a REGLAS y al tablero de esa pieza."""
import json
import pathlib
import re

PROJ = pathlib.Path(__file__).resolve().parent.parent  # docs/design/lienzo: los tableros y canvas.json
ALTO = 3890
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
    ("Antes de algo que se paga (difusión, plantilla), se muestra el costo estimado.", "Diálogos", "03/10/2026"),
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
        ("Inicio de la organización", "", "Para repensar. Idea del usuario: las acciones pendientes van en un menú propio, no en el inicio.", "Para repensar"),
        ("Inicio de un miembro", "", "Para repensar, junto con el inicio de la organización.", "Para repensar"),
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
        ("Notas internas", "A", "Abajo se elige «Mensaje» o «Nota interna»; la nota, amarilla, la ve solo el equipo.", "Dibujada"),
        ("Pasaron 24 horas", "B", "Donde se escribe: «Pasaron 24 horas» con ⓘ y «Elegir plantilla».", "Dibujada"),
        ("Elegir plantilla", "A", "Diálogo con la plantilla, sus datos, la vista previa y el costo.", "Dibujada"),
        ("Contactos", "A", "Contacto (con «Vinculada»), Etiquetas, Promociones y Última conversación; «Importar contactos» con consentimiento obligatorio.", "Dibujada"),
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
        ("Menú de Plataforma", "B", "«WhatsApp» para atender y la configuración dentro de «Configuración».", "Dibujada"),
    ],
    "Lo que sigue": [
        ("Teléfonos", "", "Pasar lo decidido a M-Usuarios, M-Usuario, M-Roles, M-Rol, M-Empresas, M-Empresa y M-Auditoria-Org.", "Falta dibujar"),
        ("Inicios", "", "Repensar qué es un inicio en la plantilla y dónde van las acciones pendientes.", "Para repensar"),
        ("Teléfonos de WhatsApp", "", "Pasar lo decidido a M-WA-*.", "Falta dibujar"),
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
