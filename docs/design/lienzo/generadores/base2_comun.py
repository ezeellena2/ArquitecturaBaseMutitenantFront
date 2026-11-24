"""Las piezas de los tableros de la segunda parte de la base (F4, F5 y F10 a F13 del plan del back del 2026-11-19), que se dibujan
para aprobar en la página «Propuesta · Base 2». Los usan los `base2_*_1004.py`; este archivo no escribe tableros.

Cada tablero parte de la copia de los tableros de siempre en la v179 (`base2_1004/`, que arma `base2_1004/capturar.mjs`) y escribe
las medidas de antes de la escala: después va `traspaso10_piezas_1004.py --tableros <los de la compu y sus teléfonos>`, que pone las
piezas y la escala de la compu (180). El tablero nuevo lleva el nombre del de siempre con `-Base2` y « · para aprobar» en el título;
cuando el usuario lo aprueba, reemplaza al de siempre.

Las piezas nuevas:
- **las áreas plegables de un rol** (260, RO3-D de ArquitecturaBase), con lo incluido y lo que quien edita no puede dar apagados con
  su motivo (269 y 0061), y la lectura del Dueño;
- **la pieza para elegir** (262, DS1-A y DS2-A): cerrada, un campo con su flecha fina; abierta, la lista de los menús, con la tilde a
  la izquierda, la casilla en varias, el buscador adentro y lo apagado con su motivo; en el teléfono, a pantalla completa;
- **el orden de una tabla** (264, OT1-C): la flecha en el color de la marca después del título y «Ordenar por» al final de la barra;
- **la fila del teléfono como tarjeta** (263): cada dato con su nombre, de a dos, sin datos unidos con «·» debajo del nombre;
- **el estado de entrega** de una invitación o de un envío (0066): el punto y la palabra.
"""
import json
import pathlib
import re
import sys

import acciones_asistente_1004 as acc

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
COPIA = pathlib.Path(__file__).resolve().parent / "base2_1004"
PAGINA = {"id": "propuesta-base2", "name": "Propuesta · Base 2"}
MARCA = 'data-b2="base2"'
PARA_APROBAR = " · para aprobar"

una_vez, fin_div, svg_de, sc_if, por_estado = acc.una_vez, acc.fin_div, acc.svg_de, acc.sc_if, acc.por_estado
SVG_I, SVG_OK, SVG_ATEN, SVG_X, SVG_TILDE, SVG_MENOS, SVG_CHEV, SVG_FLECHA = (
    acc.SVG_I, acc.SVG_OK, acc.SVG_ATEN, acc.SVG_X, acc.SVG_TILDE, acc.SVG_MENOS, acc.SVG_CHEV, acc.SVG_FLECHA)
ARO, AD = acc.ARO, acc.AD
SVG_LUPA = ('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
            'stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>')
SVG_KEB = ('<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5" r="1.8"/>'
           '<circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>')
SVG_LAPIZ = ('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
             'stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/></svg>')
SVG_ERR = ('<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
           'stroke-linejoin="round" aria-hidden="true"><path d="M8.2 3h7.6L21 8.2v7.6L15.8 21H8.2L3 15.8V8.2Z"/><path d="M12 8v4.5"/>'
           '<path d="M12 16h.01"/></svg>')
SVG_REENVIAR = ('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
                'stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v5h-5"/></svg>')
SVG_REVISAR = ('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
               'stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>')
SVG_BORRAR = ('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
              'stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13"/>'
              '<path d="M9 7V4h6v3"/></svg>')


NADA_T = '<span style="color: var(--t3);">—</span>'


def copia(nombre):
    return (COPIA / f"{nombre}.html").read_text(encoding="utf-8").strip()


def sin_svg(t):
    return re.sub(r"<svg.*?</svg>", "<svg/>", t, flags=re.S)


# ---------------------------------------------------------------------------------------------------------------- el tablero
def cabeza(base, titulo, otras=()):
    """Lo de `base` hasta `</helmet>` con su título, y sus estilos de fuera del helmet; suma los de `otras` que `base` no tiene."""
    t = (PROJ / f"{base}.dc.html").read_text(encoding="utf-8")
    i, j = t.index("</helmet>"), t.index("</x-dc>")
    afuera = "".join(re.findall(r"<style\b[^>]*>.*?</style>", t[i:j], re.S))
    cab = re.sub(r"<title>.*?</title>", f"<title>{titulo}</title>", t[:i], count=1)
    cab = re.sub(r"<style (?:data-b2=\"base2\"|data-acc=\"acciones\")>.*?</style>\n?", "", cab, flags=re.S)
    for otra in otras:
        o = (PROJ / f"{otra}.dc.html").read_text(encoding="utf-8")
        k = o.index("</helmet>")
        propios = re.findall(r"<style\b[^>]*>.*?</style>", cab, re.S)
        suma = [b for b in re.findall(r"<style\b[^>]*>.*?</style>", o[:k], re.S)
                if b not in propios and 'data-t10="piezas"' not in b and "data-b2=" not in b and "data-acc=" not in b]
        cab += "\n".join(suma) + "\n"
        afuera += "".join(b for b in re.findall(r"<style\b[^>]*>.*?</style>", o[k:o.index("</x-dc>")], re.S) if b not in afuera)
    return cab, afuera


def tablero(base, titulo, css, plantilla, estados, ancho, alto, otras=()):
    """Un tablero con un Tweak «estado»: cada estado es un `sc-if` con su cuerpo entero. Sin `estados`, un dibujo solo."""
    cab, afuera = cabeza(base, titulo + PARA_APROBAR, otras)
    estados = estados or ["Tablero"]
    props = {"estado": {"editor": "enum", "options": estados, "default": estados[0], "section": "Estado"},
             "$preview": {"width": ancho, "height": alto}}
    texto_props = json.dumps(props, ensure_ascii=False, separators=(",", ":"))
    assert "'" not in texto_props
    lista = json.dumps(estados, ensure_ascii=False)
    vals = ", ".join(f"e{i}: k === {i}" for i in range(len(estados)))
    guion = (f"<script type=\"text/x-dc\" data-dc-script data-props='{texto_props}'>\n"
             "class Component extends DCLogic {\n"
             "  renderVals() {\n"
             f"    const k = {lista}.indexOf(this.props.estado ?? {json.dumps(estados[0], ensure_ascii=False)});\n"
             f"    return {{ si: true, no: false, {vals} }};\n"
             "  }\n"
             "}\n"
             "</script>\n</body>\n</html>\n")
    assert "{{" not in re.sub(r"\{\{(e\d+|si|no)\}\}", "", plantilla), "una variable sin valor en la plantilla"
    return f"{cab}<style {MARCA}>\n{css}</style>\n</helmet>\n{afuera}\n{plantilla}\n</x-dc>\n{guion}"


def alto(t, px):
    """El `.ab-root` de la compu mide 1440 × 900: para leer una pantalla larga entera, el tablero se estira."""
    return t.replace("width: 1440px; height: 900px;", f"width: 1440px; height: {px}px;", 1)


# ---------------------------------------------------------------------------------------------------------------- estilos
# Medidas de antes de la escala: la pasada de las piezas las achica en la compu.
CSS_B2 = """
/* Base 2 · el estado de una entrega o de un envío: el punto y la palabra, sin fondo (0066). */
.b2-est { display: inline-flex; align-items: center; gap: 7px; white-space: nowrap; color: var(--t1); }
.b2-est::before { content: ""; flex: none; width: 8px; height: 8px; border-radius: 50%; background: oklch(0.75 0.01 78); }
.b2-est.ok::before { background: oklch(0.6 0.13 155); }
.b2-est.pend::before { background: oklch(0.62 0.12 240); }
.b2-est.aten::before { background: oklch(0.72 0.15 70); }
.b2-est.mal::before { background: oklch(0.57 0.2 25); }
.b2-nw { display: inline-flex; align-items: center; white-space: nowrap; }
.ap-grupo.b2-vis { overflow: visible; }
.b2-i { position: relative; display: inline-flex; vertical-align: middle; margin-left: 5px; color: var(--t3); cursor: help; }
.b2-i svg { width: 14px; height: 14px; }
.b2-i .acc-tip { left: -12px; }
.b2-tip-abajo { top: calc(100% + 6px) !important; bottom: auto !important; }
.b2-tip-abajo::after { top: auto !important; bottom: 100%; border-top-color: transparent !important; border-bottom-color: oklch(0.27 0.012 60) !important; }
.b2-tip-der { left: auto !important; right: -12px; }
.b2-tip-der::after { left: auto !important; right: 14px; }
.acc-tip { white-space: pre-line; }

/* El orden de una tabla (264): la flecha en el color de la marca después del título; ↕ al pasar el mouse. */
.b2-fl { margin-left: 5px; color: var(--marca-tx); font-weight: 700; }
.b2-fl.hov { color: var(--t3); font-weight: 400; }
.b2-hov { background: oklch(0.92 0.03 95); }
.b2-sep { align-self: stretch; width: 1px; margin: 3px 2px; background: var(--borde); }
.b2-ordenar { margin-left: auto; white-space: nowrap; }
.b2-ordenar > button, .pil.b2-ordenar { white-space: nowrap; }

/* La pieza para elegir (262): cerrada, un campo con su flecha fina. */
.b2-pkc { display: flex; align-items: center; gap: 8px; box-sizing: border-box; width: 100%; height: 36px; padding: 0 10px 0 12px; border: 1px solid var(--borde2); border-radius: 3px; background: #fff; color: var(--t1); font: inherit; font-size: 14px; text-align: left; cursor: pointer; }
.b2-pkc .v { flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.b2-pkc .g, .b2-pkc .b2-vac { color: var(--t3); }
.b2-pkc .v { text-align: left; }
.b2-pkc > svg { flex: none; color: var(--t2); }
.b2-pkc[aria-expanded="true"] { border-color: var(--marca); box-shadow: 0 0 0 1px var(--marca); }
.b2-pkc.apag { background: var(--s3); color: var(--t3); cursor: default; }
.b2-pkc.err { border-color: oklch(0.57 0.2 25); box-shadow: 0 0 0 1px oklch(0.57 0.2 25); }
.b2-err { display: block; margin-top: 5px; color: var(--peligro); font-size: 12.5px; }
.b2-env { position: relative; }
.w-caja:has(.b2-pkl), .p-hoja:has(.b2-pkl), .hoja:has(.b2-pkl), .tarjeta:has(.b2-pkl), .w-caja:has(.acc-tip), .p-hoja:has(.acc-tip), .tarjeta:has(.acc-tip) { overflow: visible !important; }

/* Abierta: la lista de los menús, del ancho del campo; la de un botón de la barra, del ancho de sus nombres. */
.b2-pkl { position: absolute; z-index: 50; top: calc(100% + 4px); left: 0; box-sizing: border-box; width: 100%; padding: 4px 0; border: 1px solid var(--borde2); border-radius: 3px; background: #fff; box-shadow: 0 12px 32px oklch(0.24 0.014 78 / 0.14); font-size: 14px; text-align: left; }
.b2-pkl.barra { width: max-content; min-width: 200px; max-width: 360px; }
.b2-pkl .bus { display: flex; align-items: center; gap: 8px; margin: 4px 6px 2px; padding: 0 10px; height: 34px; border: 1px solid var(--marca); border-radius: 3px; box-shadow: 0 0 0 1px var(--marca); color: var(--t3); }
.b2-pkl .bus span { color: var(--t1); }
.b2-pkl .bus .ph { color: var(--t3); }
.b2-pkl .cant { padding: 4px 12px 6px; color: var(--t2); font-size: 12.5px; }
.b2-pkl .tope { padding: 6px 12px; color: var(--t2); font-size: 12.5px; border-bottom: 1px solid var(--borde); }
.b2-pkl .ops { max-height: 320px; overflow: hidden; }
.b2-op { position: relative; display: flex; align-items: flex-start; gap: 9px; padding: 7px 12px; border-top: 1px solid var(--borde); color: var(--t1); line-height: 1.35; }
.b2-op:first-child { border-top: 0; }
.b2-op.sep { border-top: 1px solid var(--borde2); margin-top: 3px; padding-top: 9px; }
.b2-op.act { background: oklch(0.965 0.02 140); }
.b2-op .mk { flex: none; display: inline-flex; width: 16px; height: 16px; margin-top: 1px; align-items: center; justify-content: center; color: var(--marca-tx); }
.b2-op .mk svg { width: 14px; height: 14px; }
.b2-op .cb { flex: none; display: inline-flex; width: 16px; height: 16px; margin-top: 1px; box-sizing: border-box; align-items: center; justify-content: center; border: 1.5px solid var(--borde2); border-radius: 3px; background: #fff; color: #fff; }
.b2-op .cb.on { border-color: var(--marca); background: var(--marca); }
.b2-op .cb svg { width: 12px; height: 12px; }
.b2-op .tx { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.b2-op .d { color: var(--t2); font-size: 12.5px; }
.b2-op.apag, .b2-op.apag .d { color: var(--t3); }
.b2-op.apag .cb { border-color: var(--borde); background: var(--s3); }
.b2-op .acc-tip { left: 34px; bottom: calc(100% - 2px); }
.b2-pkl .msj { padding: 10px 12px; color: var(--t2); }
.b2-pkl .msj.err { display: flex; align-items: center; justify-content: space-between; gap: 10px; color: var(--t1); }
.b2-pkl .mas { display: block; width: calc(100% - 12px); margin: 4px 6px 2px; padding: 7px 10px; border: 0; border-top: 1px solid var(--borde); background: transparent; color: var(--marca-tx); font: inherit; font-size: 13px; font-weight: 600; text-align: left; }
.b2-pkl .rein, .b2-pkl .lnk { color: var(--marca-tx); font-weight: 600; }

/* La fila del teléfono como tarjeta (263): cada dato con su nombre, de a dos. */
.b2-tj { position: relative; display: block; padding: 12px 52px 12px 16px; border-bottom: 1px solid var(--borde); background: #fff; color: var(--t1); text-decoration: none; }
.b2-tj .nm { display: block; font-size: 16px; font-weight: 600; line-height: 1.3; overflow-wrap: anywhere; }
.b2-tj .dl { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 8px 14px; margin: 8px 0 0; }
.b2-tj .dl > .c { display: block; min-width: 0; }
.b2-tj .dl > .c.todo { grid-column: 1 / -1; }
.b2-tj .k { display: block; color: var(--t2); font-size: 12.5px; line-height: 1.3; }
.b2-tj .v { display: block; font-size: 14.5px; line-height: 1.35; overflow-wrap: anywhere; }
.b2-tj .keb { position: absolute; top: 4px; right: 4px; display: inline-flex; width: 44px; height: 44px; align-items: center; justify-content: center; border: 0; background: transparent; color: var(--t2); }
.b2-tj-a { display: flex; gap: 14px; color: inherit; text-decoration: none; }
.b2-tj-a .cu { flex: 1; min-width: 0; }
.b2-tj .w-av { flex: none; }
"""

CSS_B2_TEL = """
/* El teléfono: la pieza a pantalla completa (262), con el buscador si son más de diez y renglones de 56 px. */
.b2-pkc { height: 48px; padding: 0 12px 0 14px; border-radius: 10px; font-size: 16px; }
.acc-pk .bus { display: flex; align-items: center; gap: 10px; margin: 10px 16px 4px; padding: 0 12px; height: 44px; border: 1px solid var(--marca); border-radius: 10px; box-shadow: 0 0 0 1px var(--marca); color: var(--t3); font-size: 16px; }
.acc-pk .bus span { color: var(--t1); }
.acc-pk .cant { padding: 2px 20px 8px; color: var(--t2); font-size: 13px; border-bottom: 1px solid var(--borde); }
.acc-pk .tope { padding: 8px 20px; color: var(--t2); font-size: 13px; border-bottom: 1px solid var(--borde); }
.acc-pk .op.sep { border-top: 1px solid var(--borde2); }
.acc-pk .op .mk { flex: none; display: inline-flex; width: 22px; justify-content: center; color: var(--marca-tx); }
.acc-pk .op .mk svg { width: 18px; height: 18px; }
.acc-pk .lst { flex: 1; overflow: hidden; }
.acc-pk .msj { padding: 16px 20px; color: var(--t2); font-size: 15px; }
.acc-pk .mas { display: block; width: 100%; padding: 16px 20px; border: 0; border-bottom: 1px solid var(--borde); background: transparent; color: var(--marca-tx); font: inherit; font-size: 15px; font-weight: 600; text-align: left; }
.b2-ordenar-tel { display: flex; width: 100%; }
.b2-i .acc-tip { left: -80px; max-width: 260px; }
.b2-i .acc-tip::after { left: 84px; }
"""


# ---------------------------------------------------------------------------------------------------------------- piezas chicas
def est(clase, texto, info=None, abierto=False, tip_clase=""):
    i = ""
    if info:
        tip = f'<span class="acc-tip {tip_clase}" role="tooltip">{info}</span>' if abierto else ""
        i = f'<span class="b2-i" tabindex="0" role="img" aria-label="{info}">{SVG_I}{tip}</span>'
    return f'<span class="b2-nw"><span class="b2-est {clase}">{texto}</span>{i}</span>'


def info(texto, abierto=False, tip_clase=""):
    tip = f'<span class="acc-tip {tip_clase}" role="tooltip">{texto}</span>' if abierto else ""
    return f'<span class="b2-i" tabindex="0" role="img" aria-label="{texto}">{SVG_I}{tip}</span>'


def tip(texto, clase=""):
    return f'<span class="acc-tip {clase}" role="tooltip">{texto}</span>'


# ---------------------------------------------------------------------------------------------------------------- la entrega
# El estado de entrega de una invitación (`invitationDelivery`, 0066 §4) y sus motivos, con el canal.
ENTREGA = {
    "Pending": ("pend", "Pendiente"),
    "Sent": ("ok", "Enviada"),
    "Uncertain": ("aten", "Sin confirmar"),
    "Failed": ("mal", "No se pudo enviar"),
}
POR_QUE_ENTREGA = {
    ("Pending", "correo"): "Está en la cola: sale en unos minutos.",
    ("Pending", "whatsapp"): "Está en la cola: sale en unos minutos.",
    ("Uncertain", "correo"): "No sabemos si llegó: el servidor de correo no confirmó el envío. Revisá con la persona antes de reenviarla.",
    ("Uncertain", "whatsapp"): "No sabemos si llegó: WhatsApp no confirmó el envío. Revisá con la persona antes de reenviarla.",
    ("Failed", "correo"): "El servidor de correo no la aceptó. Revisá la dirección y reenviala.",
    ("Failed", "whatsapp"): "WhatsApp no pudo entregarla a ese número.",
}


def entrega(codigo, canal="correo", abierto=False, tip_clase=""):
    clase, texto = ENTREGA[codigo]
    motivo = POR_QUE_ENTREGA.get((codigo, canal))
    return est(clase, texto, motivo, abierto, tip_clase)


# Los ocho motivos de «No se pudo enviar» por WhatsApp (0066 §3), con los textos del módulo.
MOTIVOS_WA = [
    ("WhatsApp.Send.NotAllowed", "Ese número no puede recibir mensajes de esta cuenta."),
    ("WhatsApp.Send.WindowClosed", "Pasaron 24 horas desde su último mensaje."),
    ("WhatsApp.Send.Undeliverable", "WhatsApp no pudo entregarlo a ese número."),
    ("WhatsApp.Send.RateLimited", "WhatsApp frenó el envío por su límite de mensajes. Probá de nuevo en un rato."),
    ("WhatsApp.Send.TokenInvalid", "La conexión con WhatsApp venció. Hay que volver a conectar el número."),
    ("WhatsApp.Send.PermissionMissing", "A la conexión con WhatsApp le falta el permiso para mandar desde este número."),
    ("WhatsApp.Send.Unavailable", "No pudimos comunicarnos con WhatsApp, ni con los reintentos. Probá de nuevo en un rato."),
    ("WhatsApp.Send.Rejected", "WhatsApp rechazó el mensaje."),
]
SIN_CONFIRMAR_WA = "No sabemos si salió: WhatsApp no confirmó el envío. Mirá el chat en el teléfono antes de mandarlo de nuevo: no se repite solo."
REVISO = "Lo revisó Ana Gómez · 19/11/2026, 14:35"


# ---------------------------------------------------------------------------------------------------------------- áreas plegables
# El catálogo de hoy (sin Formularios, que llegan con la E12: 78), con lo que incluye cada permiso (260). «Invitar usuarios» y
# «Asignar roles» incluyen su «Ver» como dibujo, a confirmar contra sus pantallas (260).
ORG = [
    ("Usuarios", [("Ver usuarios", "Consultar la lista y la ficha de las personas de la organización."),
                  ("Invitar usuarios", "Enviar una invitación para sumarse a la organización."),
                  ("Administrar usuarios", "Editar, dar de baja, reactivar y quitar personas de la organización.")]),
    ("Roles", [("Ver roles", "Consultar los roles y los permisos que incluyen."), ("Administrar roles", "Crear, editar y dar de baja roles."),
               ("Asignar roles", "Asignar o quitar roles de las personas.")]),
    ("Empresas", [("Ver empresas", "Consultar las empresas de la organización."), ("Administrar empresas", "Crear, editar y dar de baja empresas.")]),
    ("Configuración", [("Ver la configuración", "Consultar la configuración de la organización."),
                       ("Cambiar la configuración", "Editar la configuración de la organización.")]),
    ("Auditoría", [("Ver la auditoría", "Consultar el registro de auditoría de la organización.")]),
    ("Página pública", [("Administrar la página pública", "Editar y publicar la página pública de la organización.")]),
    ("Asistente", [("Usar el asistente", "Consultar el asistente con tus permisos."),
                   ("Configurar el asistente", "Configurar y consultar el uso del asistente de la organización.")]),
    ("WhatsApp", [("Atender clientes", "Ver y responder la bandeja de Clientes, y ver, editar e importar los contactos."),
                  ("Atender internos", "Ver y responder la bandeja de Internos."),
                  ("Mandar difusiones", "Crear, programar y cancelar difusiones a los contactos que aceptan promociones."),
                  ("Administrar WhatsApp", "Conectar números y configurar el bot, los equipos y las plantillas.")]),
]
EMPRESA = [
    ("Miembros", [("Ver miembros", "Consultar las personas que integran la empresa."),
                  ("Administrar miembros", "Sumar, quitar y cambiar los roles de las personas de la empresa.")]),
]
PLAT = [
    ("Organizaciones", [("Ver organizaciones", "El listado y la ficha de cada organización."),
                        ("Administrar organizaciones", "Aprobar, suspender, reactivar y cerrar; módulos y página pública.")]),
    ("Cuentas", [("Ver cuentas", "Buscar cuentas y ver su ficha."), ("Administrar cuentas", "Suspender, cerrar sesiones y borrar.")]),
    ("Recuperaciones", [("Recuperaciones", "Aprobar o rechazar pedidos de «Recuperar mi cuenta».")]),
    ("Documentos legales", [("Documentos legales", "Publicar una versión nueva de términos o privacidad.")]),
    ("Operadores", [("Administrar operadores", "Invitar operadores y cambiar sus permisos.")]),
    ("Auditoría", [("Ver la auditoría", "Los eventos de seguridad de todo el servicio.")]),
    ("WhatsApp", [("Administrar el WhatsApp de Plataforma", "Conectar el número y configurar el bot, los equipos y las plantillas de consultas."),
                  ("Atender consultas", "Ver y responder las consultas que llegan al número de Plataforma.")]),
    ("Asistente", [("Usar el asistente de Plataforma", "Consultar el asistente con tus permisos de Plataforma."),
                   ("Configurar el asistente de Plataforma", "Configurar claves, modelos y topes del asistente."),
                   ("Ver el uso del asistente", "Ver costos y consultas agregados sin leer conversaciones.")]),
    ("Configuración", [("Cambiar la configuración", "Registro de personas, alta de organizaciones, plazos y correos.")]),
]
INCLUYE = {
    "Invitar usuarios": ["Ver usuarios"], "Administrar usuarios": ["Ver usuarios"],
    "Administrar roles": ["Ver roles"], "Asignar roles": ["Ver roles"],
    "Administrar empresas": ["Ver empresas"], "Cambiar la configuración": ["Ver la configuración"],
    "Administrar miembros": ["Ver miembros"],
    "Administrar organizaciones": ["Ver organizaciones"], "Administrar cuentas": ["Ver cuentas"],
    "Configurar el asistente de Plataforma": ["Ver el uso del asistente"],
}
NO_TENES = "No tenés este permiso."
NO_TENES_AREA = "Tiene permisos que no tenés."
POR_QUE_DUENO = "Es el rol del sistema con todos los permisos de la organización: no se cambia."


def lo_incluyen(p, marcados):
    orden = [q for cat in (ORG, EMPRESA, PLAT) for _, ps in cat for q, _ in ps]
    return [k for k in orden if k in marcados and p in INCLUYE.get(k, [])]


def motivo_incluido(quienes):
    if len(quienes) == 1:
        return f"Lo incluye «{quienes[0]}»."
    return "Lo incluyen " + ", ".join(f"«{q}»" for q in quienes[:-1]) + f" y «{quienes[-1]}»."


def caja(forma, apagada):
    return acc.caja((forma, apagada))


def ayuda_area(lista):
    return "&#10;".join(f"{p} — {d}" for p, d in lista)


def areas(catalogo, marcados, abiertas, no_tiene=frozenset(), lectura=False, tip_en=None, info_en=None, aria="Permisos"):
    """Las áreas plegables (260): `marcados` es lo pedido (lo incluido se suma solo), `no_tiene` lo que quien edita no puede dar
    (269), `lectura` el Dueño o un rol que no se cambia (tildes, sin casillas). `tip_en` abre el motivo de ese permiso o área, e
    `info_en` la (i) de esa área."""
    filas = ['<div class="ph" role="row"><span role="columnheader">Permiso</span></div>']
    for area, lista in catalogo:
        nombres = [p for p, _ in lista]
        incluidos = {i for k in marcados for i in INCLUYE.get(k, []) if i in nombres}
        hay = [p for p in nombres if p in marcados or p in incluidos]
        forma = "lleno" if len(hay) == len(nombres) else "parcial" if hay else "vacia"
        apag_area = any(p in no_tiene for p in nombres)
        abierta = area in abiertas
        ayuda = ayuda_area(lista)
        tip_i = (f'<span class="acc-tip" role="tooltip" style="max-width: 460px;">{ayuda}</span>' if info_en == area else "")
        i_html = f'<span class="i" tabindex="0" role="img" aria-label="{ayuda}">{SVG_I}{tip_i}</span>'
        fl = (f'<button type="button" class="fl" aria-expanded="{"true" if abierta else "false"}" aria-label="{area}">{SVG_CHEV}</button>')
        if lectura:
            filas.append(f'<div class="acc-area b2-lect{"" if abierta else " cerrada"}" role="row">{fl}<span class="nm">{area}</span>{i_html}</div>')
        else:
            tip_area = (f'<span class="acc-tip acc-zc-tip" role="tooltip">{NO_TENES_AREA}</span>' if tip_en == area and apag_area else "")
            aria_c = "true" if forma == "lleno" else "mixed" if forma == "parcial" else "false"
            filas.append(f'<div class="acc-area{"" if abierta else " cerrada"}{" apag" if apag_area else ""}" role="row">{fl}'
                         f'<span class="zc" role="checkbox" aria-checked="{aria_c}"{AD if apag_area else ""} aria-label="Todos los permisos de {area}">'
                         f'{caja(forma, apag_area)}{tip_area}</span><span class="nm">{area}</span>{i_html}</div>')
        if not abierta:
            continue
        for p in nombres:
            if lectura:
                filas.append(f'<div class="acc-p b2-lect" role="row"><span class="b2-tilde" aria-label="Tiene este permiso">{SVG_TILDE}</span>'
                             f'<span>{p}</span></div>')
                continue
            on = p in marcados or p in incluidos
            quienes = lo_incluyen(p, marcados) if p in incluidos else []
            mot = motivo_incluido(quienes) if quienes else NO_TENES if p in no_tiene else None
            t = f'<span class="acc-tip" role="tooltip">{mot}</span>' if tip_en == p and mot else ""
            filas.append(f'<div class="acc-p{" apag" if mot else ""}" role="row"><span role="checkbox" aria-checked="{"true" if on else "false"}"'
                         f'{AD if mot else ""} style="display: inline-flex;">{caja("lleno" if on else "vacia", bool(mot))}</span>'
                         f'<span>{p}</span>{t}</div>')
    return f'<div class="acc-perm" role="table" aria-label="{aria}">{"".join(filas)}</div>'


CSS_AREAS = """
/* El rol que no se cambia se lee (260): la banda sin casilla, cada permiso con su tilde donde iría la casilla. */
.acc-area.b2-lect { gap: 10px; }
.acc-p.b2-lect { color: var(--t1); }
.b2-tilde { display: inline-flex; flex: none; width: @CASILLA@; justify-content: center; color: var(--marca-tx); }
.b2-tilde svg { width: 14px; height: 14px; }
.acc-area .i .acc-tip { left: -14px; }
"""


# ---------------------------------------------------------------------------------------------------------------- la pieza
def op(nombre, desc=None, elegida=False, multiple=False, apagada=None, sep=False, tip_abierto=False, activa=False):
    """Una opción de la lista: `apagada` es su motivo (211), que se abre en un tooltip."""
    if multiple:
        mk = f'<span class="cb{" on" if elegida else ""}" aria-hidden="true">{SVG_TILDE if elegida else ""}</span>'
    else:
        mk = f'<span class="mk" aria-hidden="true">{SVG_TILDE if elegida else ""}</span>'
    d = f'<span class="d">{desc}</span>' if desc else ""
    t = tip(apagada) if apagada and tip_abierto else ""
    clase = "b2-op" + (" sep" if sep else "") + (" apag" if apagada else "") + (" act" if activa else "")
    return (f'<div class="{clase}" role="option" aria-selected="{"true" if elegida else "false"}"{AD if apagada else ""}>'
            f'{mk}<span class="tx"><span>{nombre}</span>{d}</span>{t}</div>')


def lista(opciones, multiple=False, buscar=None, cantidad=None, barra=False, tope=None, pie="", msj=None, estilo=""):
    bus = ""
    if buscar is not None:
        texto = f"<span>{buscar}</span>" if buscar else '<span class="ph">Buscar</span>'
        bus = f'<div class="bus">{SVG_LUPA}{texto}</div>'
    cant = f'<div class="cant" role="status">{cantidad}</div>' if cantidad else ""
    tp = f'<div class="tope" role="status">{tope}</div>' if tope else ""
    cuerpo = f'<div class="msj{" err" if msj and "Reintentar" in msj else ""}" role="status">{msj}</div>' if msj else ""
    return (f'<div class="b2-pkl{" barra" if barra else ""}" role="listbox"{" aria-multiselectable=\"true\"" if multiple else ""}'
            f'{f" style=\"{estilo}\"" if estilo else ""}>{bus}{cant}{tp}{cuerpo}<div class="ops">{"".join(opciones)}</div>{pie}</div>')


def campo(valor, vacio=False, abierto=False, apagado=None, error=False, aria="", extra="", tip_abierto=True):
    v = f'<span class="v{" b2-vac" if vacio else ""}">{valor}</span>'
    clase = "b2-pkc" + (" apag" if apagado else "") + (" err" if error else "")
    dis = AD if apagado else ""
    b = (f'<button type="button" class="{clase}" aria-haspopup="listbox" aria-expanded="{"true" if abierto else "false"}"'
         f'{f" aria-label=\"{aria}\"" if aria else ""}{dis}>{v}{SVG_FLECHA}</button>')
    if apagado and tip_abierto:
        b += tip(apagado)
    return f'<div class="b2-env">{b}{extra}</div>'


def zona(ciudad, pais, desfase):
    return f'{ciudad} <span class="g">· hora de {pais} · {desfase}</span>'


ZONAS = [("Buenos Aires", "Argentina", "GMT−3"), ("Córdoba", "Argentina", "GMT−3"), ("Asunción", "Paraguay", "GMT−3"),
         ("Montevideo", "Uruguay", "GMT−3"), ("Santiago", "Chile", "GMT−3"), ("La Paz", "Bolivia", "GMT−4"),
         ("Lima", "Perú", "GMT−5"), ("Bogotá", "Colombia", "GMT−5"), ("Ciudad de México", "México", "GMT−6"),
         ("Madrid", "España", "GMT+1")]


def lista_zonas(buscar="", elegida="Buenos Aires", tel=False):
    if tel:
        return pk_tel("Zona horaria", [(c, f"hora de {p} · {d}", c == elegida, None) for c, p, d in ZONAS], buscar=buscar,
                      cantidad="418 zonas")
    return lista([op(c, f"hora de {p} · {d}", elegida=c == elegida, activa=c == elegida) for c, p, d in ZONAS],
                 buscar=buscar, cantidad="418 zonas")


def pk_tel(titulo, opciones, multiple=False, buscar=None, cantidad=None, tope=None, tip_en=None, listo=None, msj=None, pie_extra=""):
    """La pieza a pantalla completa en el teléfono: (nombre, descripción, elegida, motivo de apagada [, separada])."""
    filas = []
    for o in opciones:
        n, d, on, mot = o[:4]
        sep = len(o) > 4 and o[4]
        if multiple:
            mk = f'<span class="acc-cb{" lleno" if on else ""}{" apag" if mot else ""}">{SVG_TILDE if on else ""}</span>'
        else:
            mk = f'<span class="mk">{SVG_TILDE if on else ""}</span>'
        t = f'<span class="acc-tip" role="tooltip">{mot}</span>' if mot and n == tip_en else ""
        dd = f'<span class="d">{d}</span>' if d else ""
        filas.append(f'<div class="op{" apag" if mot else ""}{" sep" if sep else ""}" role="option" aria-selected="{"true" if on else "false"}"'
                     f'{AD if mot else ""}>{mk}<span class="n2"><span>{n}</span>{dd}</span>{t}</div>')
    bus = ""
    if buscar is not None:
        bus = f'<div class="bus">{SVG_LUPA}<span>{buscar}</span></div>' if buscar else f'<div class="bus">{SVG_LUPA}Buscar</div>'
    cant = f'<div class="cant" role="status">{cantidad}</div>' if cantidad else ""
    tp = f'<div class="tope" role="status">{tope}</div>' if tope else ""
    cuerpo = f'<div class="msj" role="status">{msj}</div>' if msj else ""
    pie = (f'<div class="pie"><button type="button" class="cb cb-pri">{listo}</button></div>' if listo else "")
    return (f'<div class="acc-pk" role="dialog" aria-label="{titulo}"><div class="bar"><h2>{titulo}</h2>'
            f'<button type="button" aria-label="Cerrar">{SVG_X}</button></div>{bus}{cant}{tp}{cuerpo}'
            f'<div class="lst" role="listbox"{" aria-multiselectable=\"true\"" if multiple else ""}>{"".join(filas)}{pie_extra}</div>{pie}</div>')


# ---------------------------------------------------------------------------------------------------------------- el orden
def con_orden(t, viejo_ord='<span class="ord" aria-hidden="true">▲</span>', flecha="↑"):
    """La columna que ordena: la flecha en el color de la marca después del título (264)."""
    assert viejo_ord in t, "sin la flecha de antes"
    return t.replace(viejo_ord, f'<span class="b2-fl" aria-hidden="true">{flecha}</span>')


def boton_ordenar(texto, clase="pill-sel"):
    return (f'<span class="b2-sep" aria-hidden="true"></span><span class="envoltura b2-ordenar"><button type="button" class="{clase}" '
            f'aria-haspopup="listbox" aria-expanded="false">Ordenar por: {texto} {SVG_FLECHA}</button></span>')


# ---------------------------------------------------------------------------------------------------------------- el teléfono
def tarjeta(nombre, datos, acciones=None, href="#", av=""):
    """Una fila del teléfono como tarjeta (263): el nombre y cada dato con su nombre, de a dos; un dato largo ocupa las dos."""
    celdas = "".join(f'<span class="c{" todo" if largo else ""}"><span class="k">{k}</span><span class="v">{v}</span></span>'
                     for k, v, largo in ((tuple(d) + (False,))[:3] for d in datos))
    keb = (f'<button type="button" class="keb" aria-label="Acciones de {acciones}">{SVG_KEB}</button>' if acciones else "")
    return (f'<div class="b2-tj"><a class="b2-tj-a" href="{href}">{av}<span class="cu"><span class="nm">{nombre}</span>'
            f'<span class="dl">{celdas}</span></span></a>{keb}</div>')


# ---------------------------------------------------------------------------------------------------------------- canvas.json
def registrar(filas, nota, notas_extra=(), ruta=None):
    """`filas`: [[(nombre, ancho, alto), …], …], una fila de tableros por grupo, de arriba abajo. La nota va a la izquierda. Con
    `ruta`, escribe en ese `canvas.json` (el publicado, traído al scratchpad) en lugar del de esta carpeta."""
    ruta = pathlib.Path(ruta) if ruta else PROJ / "canvas.json"
    c = json.loads(ruta.read_text(encoding="utf-8"))
    if not any(p["id"] == PAGINA["id"] for p in c["pages"]):
        c["pages"].insert(next(i for i, p in enumerate(c["pages"]) if p["id"] == "mapa") + 1, dict(PAGINA))
    nuevos = []
    y = 0
    for fila in filas:
        x = 700
        alto_fila = 0
        for nombre, w, h in fila:
            t = (PROJ / f"{nombre}.dc.html").read_text(encoding="utf-8")
            titulo = re.search(r"<title>(.*?)</title>", t).group(1)
            c["boards"][f"{nombre}.dc.html"] = {"h": h, "is_interactive": True, "page": PAGINA["id"], "title": titulo, "w": w, "x": x, "y": y}
            nuevos.append(f"{nombre}.dc.html")
            x += w + 100
            alto_fila = max(alto_fila, h)
        y += alto_fila + 160
    c["notes"]["propuesta-base2"] = {"color": "blue", "page": PAGINA["id"], "text": nota, "w": 620, "x": 0, "y": 0}
    for k, (nid, texto, yy) in enumerate(notas_extra):
        c["notes"][nid] = {"color": "yellow", "page": PAGINA["id"], "text": texto, "w": 620, "x": 0, "y": yy}
    if "noteOrder" in c:
        for nid in ["propuesta-base2"] + [n[0] for n in notas_extra]:
            if nid not in c["noteOrder"]:
                c["noteOrder"].append(nid)
    c["order"] = [o for o in c["order"] if o not in nuevos]
    primero_archivo = next((i for i, o in enumerate(c["order"]) if c["boards"].get(o, {}).get("page") == "archivo"), len(c["order"]))
    c["order"][primero_archivo:primero_archivo] = nuevos
    ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")
    return nuevos


def escribir(nombre, texto):
    (PROJ / f"{nombre}.dc.html").write_text(texto, encoding="utf-8")
    print("ok", nombre, len(texto))


def css(tel=False):
    areas_css = CSS_AREAS.replace("@CASILLA@", "22px" if tel else "16px")
    return (acc.CSS_TEL if tel else acc.CSS_COMPU) + CSS_B2 + areas_css + (CSS_B2_TEL if tel else "")


# ---------------------------------------------------------------------------------------------------------------- tablas
VACIOS = {"input", "img", "br", "hr", "meta", "link", "source", "col"}


def hijos(div):
    """Los elementos de primer nivel de un `<div …>…</div>`: (etiqueta de apertura, [hijos], cierre)."""
    a = div.index(">") + 1
    b = div.rindex("</div>")
    cuerpo = div[a:b]
    out, prof, ini = [], 0, None
    for m in re.finditer(r"<(/?)([a-zA-Z0-9-]+)\b[^>]*?(/?)>", cuerpo):
        cierre, tag, auto = m.group(1), m.group(2).lower(), m.group(3)
        if cierre:
            prof -= 1
            if prof == 0:
                out.append(cuerpo[ini:m.end()])
        else:
            if prof == 0:
                ini = m.start()
            if auto or tag in VACIOS:
                if prof == 0:
                    out.append(cuerpo[ini:m.end()])
            else:
                prof += 1
    return div[:a], out, div[b:]


def filas_tt(t, clase):
    """Las posiciones de cada `<div class="tt-h…">` o `<div class="tt-f…">` (según `clase`), de atrás para adelante."""
    pos = [m.start() for m in re.finditer(rf'<div class="{clase}\b', t)]
    return [(i, fin_div(t, i)) for i in reversed(pos)]


def sumar_col(t, titulo, despues, ancho, valor):
    """Suma una columna a una tabla de grilla (`tt-h` y `tt-f`), después de la columna `despues` (desde 0). `valor(fila)` da el
    contenido de la celda nueva de cada fila."""
    for clase, es_cab in (("tt-f", False), ("tt-h", True)):
        for i, j in filas_tt(t, clase):
            fila = t[i:j]
            ab, hs, ci = hijos(fila)
            celda = f"<span>{titulo}</span>" if es_cab else f"<span>{valor(fila)}</span>"
            hs = hs[:despues + 1] + [celda] + hs[despues + 1:]
            ab = re.sub(r"(grid-template-columns:\s*)((?:[^;\"]+\s)*?)(28px;)",
                        lambda m: m.group(1) + m.group(2) + f"{ancho} " + m.group(3), ab, count=1)
            t = t[:i] + ab + "".join(hs) + ci + t[j:]
    return t


def caja_lectura(titulo, filas, accion=""):
    """Los datos de algo en dos columnas: el dato sobre arena clara y el valor a su derecha (lecturas, 138)."""
    celdas = "".join(f'<span class="k">{k}</span><span class="v">{v}</span>' for k, v in filas)
    return (f'<div class="b2-caja"><div class="b2-cab"><span>{titulo}</span>{accion}</div><div class="b2-lec">{celdas}</div></div>')


def confirmar_ab(titulo, texto, boton, clase="b-pri"):
    return ('<div class="velo"><div class="dlg chico" role="alertdialog" aria-modal="true" aria-labelledby="b2-ct">'
            f'<div class="dlg-h"><h2 id="b2-ct">{titulo}</h2></div><div class="dlg-t">{texto}</div>'
            f'<div class="dlg-f"><button type="button" class="b b-sec" autofocus>Cancelar</button><button type="button" class="b {clase}">{boton}</button></div></div></div>')


def confirmar_w(titulo, texto, boton, clase="cb-pri"):
    return ('<div class="w-oscuro" style="z-index: 6;"></div>'
            f'<div class="p-dlg" role="alertdialog" aria-modal="true" aria-label="{titulo}"><div class="dc"><span>{titulo}</span></div>'
            f'<div class="tx" style="padding-bottom: 16px;">{texto}</div><div class="df"><button type="button" class="cb cb-sec" autofocus>Cancelar</button>'
            f'<button type="button" class="cb {clase}">{boton}</button></div></div>')


def hoja_tel(titulo, texto, boton, clase="cb-pri"):
    return ('<div class="ap-velo"></div><div class="ap-hoja" role="alertdialog" aria-label="' + titulo + '"><span class="asa"></span>'
            f'<div class="hc"><h2>{titulo}</h2></div><div class="hb"><p class="ap-txt-l" style="margin: 0;">{texto}</p></div>'
            f'<div class="hp"><button type="button" class="cb {clase} lleno">{boton}</button><button type="button" class="cb cb-sec">Cancelar</button></div></div>')


def con_hoja(t, hoja):
    return una_vez(t, '<span class="ap-raya"></span></div>', hoja + '<span class="ap-raya"></span></div>')


def con_dialogo_w(t, dlg):
    """El diálogo de la familia `w-app`, al final del marco."""
    k = t.rindex("</div>")
    return t[:k] + dlg + t[k:]


def con_dialogo_ab(t, dlg):
    return una_vez(t, "</main>", dlg + "</main>")


def grupo_tel(titulo, filas, accion=""):
    it = "".join(f'<div class="ap-it "><span class="tx"><b>{k}</b><span>{v}</span></span></div>' for k, v in filas)
    return f'<span class="ap-gtit">{titulo}{accion}</span><div class="ap-grupo b2-vis">{it}</div>'


CSS_LECTURA = """
/* Una caja de lectura (138): el dato sobre arena clara y el valor a su derecha. */
.b2-caja { border: 1px solid var(--borde); border-radius: 3px; background: #fff; overflow: visible; }
.b2-cab { display: flex; align-items: center; justify-content: space-between; gap: 10px; min-height: 40px; padding: 0 14px; border-bottom: 1px solid var(--borde); border-radius: 3px 3px 0 0; background: oklch(0.945 0.027 95); color: var(--t1); font-size: 14px; font-weight: 600; }
.b2-lec { display: grid; grid-template-columns: 200px minmax(0, 1fr); font-size: 14px; }
.b2-lec > span { padding: 9px 14px; border-top: 1px solid var(--borde); min-width: 0; overflow-wrap: anywhere; }
.b2-lec > span:nth-child(-n+2) { border-top: 0; }
.b2-lec .k { background: oklch(0.975 0.006 95); color: var(--t2); }
.b2-lec .v { color: var(--t1); display: flex; align-items: center; flex-wrap: wrap; gap: 4px; }
"""
CSS_B2 = CSS_B2 + CSS_LECTURA


def areas_lectura(catalogo, tiene, abiertas=None, aria="Permisos"):
    """Los permisos que no se cambian acá (la ficha de un operador): solo las áreas con algo, abiertas, y lo que tiene con su
    tilde, también lo incluido (260)."""
    con_inc = set(tiene) | {i for k in tiene for i in INCLUYE.get(k, [])}
    filas = ['<div class="ph" role="row"><span role="columnheader">Permiso</span></div>']
    for area, lista in catalogo:
        nombres = [p for p, _ in lista if p in con_inc]
        if not nombres:
            continue
        abierta = abiertas is None or area in abiertas
        ayuda = ayuda_area(lista)
        filas.append(f'<div class="acc-area b2-lect{"" if abierta else " cerrada"}" role="row"><button type="button" class="fl" '
                     f'aria-expanded="{"true" if abierta else "false"}" aria-label="{area}">{SVG_CHEV}</button><span class="nm">{area}</span>'
                     f'<span class="i" tabindex="0" role="img" aria-label="{ayuda}">{SVG_I}</span></div>')
        if abierta:
            filas += [f'<div class="acc-p b2-lect" role="row"><span class="b2-tilde" aria-label="Tiene este permiso">{SVG_TILDE}</span>'
                      f'<span>{p}</span></div>' for p in nombres]
    return f'<div class="acc-perm" role="table" aria-label="{aria}">{"".join(filas)}</div>'


def reemplazar_div(t, inicio, nuevo):
    i = t.index(inicio)
    j = fin_div(t, i)
    return t[:i] + nuevo + t[j:]


def filas_tel(t, tarjetas, clase="w-conv"):
    """Cambia las filas del teléfono (`w-conv`), en orden, por `tarjetas` (el html de cada una); sobran, se van."""
    pos = [m.start() for m in re.finditer(rf'<div class="{clase}"', t)]
    bloques = [(i, fin_div(t, i)) for i in pos]
    nuevo = t
    for k, (i, j) in reversed(list(enumerate(bloques))):
        nuevo = nuevo[:i] + (tarjetas[k] if k < len(tarjetas) else "") + nuevo[j:]
    return nuevo


def avatar(fila_html):
    m = re.search(r'<span class="w-av[^"]*">.*?</span>', fila_html, re.S)
    return m.group(0) if m else ""
