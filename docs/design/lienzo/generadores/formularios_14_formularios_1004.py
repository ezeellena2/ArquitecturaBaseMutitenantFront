"""Etapa 14 · Formularios (orden nuevo, decisión 78), con `14-texto-diseno.md` y la §9 de `14-formularios.md` del back.

Los tableros de la E14 los arma `formularios_e12_sin_idioma_1004.py`, que ya suma CA4 (la pregunta de catálogo con «Permitir
elegir varias», más de 20 en varias y la presentación propia), «Un catálogo demasiado grande» al publicar y, al mandar,
menos que el mínimo y una opción que no entra. Acá se separan por etapa (decisión del usuario del 25/10, un tablero por
etapa): la versión de la 14 queda sin lo que llega después, y lo de la 18 pasa a su tablero, con la etapa en el nombre.
- FRM-Editor, FRM-Publicar y FRM-Publicando, sin el ⋮ de la banda (Copiar y Dar de baja son de la 17). FRM-Editor, sin fotos
  ni documentos (FRM-Editor-18); FRM-Publicar, sin «Más de 10 archivos» (FRM-Publicar-18).
- M-FRM-Editor, sin el ⋮, sin las reglas (21) ni la pregunta de foto (M-FRM-Editor-18).
- WA-Chats-Respuesta y M-WA-Conversacion-Respuesta, sin los archivos (sus -18).
- «Mis mensajes» (T16): WA-Mensajes-14 y M-WA-Mensaje-14, con la tarjeta de una respuesta propia de quien vinculó su cuenta.
- Desde la v142, las fechas completas, con año y hora, en la zona de quien mira (formatos.md, decisión del usuario del 25/10):
  nunca «Hoy», «Ayer», «hace 2 minutos» ni «mañana»; y en Chats, nunca un teléfono como nombre (81).
- Desde la v147 (14-texto-diseno.md y la §9 de la spec), los títulos de sección (88) en FRM-Editor, M-FRM-Editor y, de fondo, en
  FRM-Publicar y FRM-Publicando; las versiones de la 18 quedan como estaban. Y FRM-Catalogo-14 y M-FRM-Catalogo-14, nuevos, sobre
  FRM-Catalogo-13: el catálogo «Productos» con la sección «Lo usan», «Quitar» apagado en un campo en uso y la advertencia al darlo de baja.
- Desde la v150 (125 a 129), con el armado real de ArquitecturaBase: «Usado en 2 formularios» va en la banda; un campo en uso no se quita y el diálogo dice dónde está; una
  opción que usa un formulario no se borra y se puede dar de baja.

- Con el traspaso 10 (165, 175, 176 y 88):
  - FRM-Publicando y M-FRM-Editor: el estado, una vez, sin pasos ni hojas: la etiqueta dice el estado y la banda (en el teléfono, el pie) trae
    «Consultar publicación», «Repetir el mismo intento», «No salió» y «Salió» solo cuando hacen falta; «Publicar en WhatsApp» apagado dice su motivo;
  - FRM-Vista-Oficial y M-FRM-Vista-Oficial, nuevos: la vista oficial en su diálogo, que se recorre; «Ver vista oficial» lleva ahí;
  - el envío nombra el formulario en los chats y en «Mis mensajes», y WA-Chats-Formulario suma elegir otro formulario y lo escrito que se conserva;
  - los tableros de la 18 también tienen «Agregar título» y el título entre las preguntas.

Corre después de `formularios_12_catalogos_1004.py` y antes de `formularios_etapas_1004.py`. Se puede volver a correr.
"""
import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import formularios_1004 as F  # noqa: E402
import formularios_ab_1004 as A  # noqa: E402
import formularios_ab_catalogos_1004 as C  # noqa: E402
import formularios_e12_sin_idioma_1004 as E  # noqa: E402
import formularios_12_catalogos_1004 as K  # noqa: E402
import formularios_13_campos_1004 as T13  # noqa: E402
import formularios_lista_y_ficha_1004 as L  # noqa: E402
import menus_y_solo_lectura_1004 as M  # noqa: E402

PROJ = A.PROJ
APROBADO = True  # el usuario la aprobó el 25/10 («publicalo y commitea», versión 141)
PARA_APROBAR = " · para aprobar"

EDITOR_18 = ["Pregunta de foto", "Pregunta de documento", "Sin almacenamiento"]
EDITOR_17 = ["Acciones del formulario"]
TEL_18 = ["Pregunta de foto"]
PUBLICAR_18 = ["Más de 10 archivos"]
RESPUESTA_18 = ["Bajando los archivos", "Con fotos y un documento", "Muchas fotos", "Reintentando", "No se pudo bajar un archivo", "Un archivo no es lo que dice"]
KEBAB_BANDA = re.compile(r'<span class="e-kw"><button type="button" class="ib o-borde" aria-label="Acciones de [^"]*" aria-haspopup="menu" aria-expanded="false">.*?</button></span>', re.S)
KEBAB_BARRA = re.compile(r'<button type="button" class="ap-ib" aria-label="Acciones de Visita a cliente">.*?</button>', re.S)


def leer(n):
    return (PROJ / f"{n}.dc.html").read_text(encoding="utf-8")
def escribir(n, t):
    (PROJ / f"{n}.dc.html").write_text(L.sin_disenar(n, con_vista_oficial(fechas(t))), encoding="utf-8")


def solo(t, estados):
    """Deja solo esos estados (el tablero de una etapa posterior)."""
    return L.sin_estados(t, [e for e in L.opciones_de(t) if e not in estados], estados[0])


def sin(t, estados):
    viejas = L.opciones_de(t)
    defecto = next(e for e in viejas if e not in estados)
    return L.sin_estados(t, estados, defecto if viejas[0] in estados else None)


def sin_kebab(t):
    return KEBAB_BARRA.sub("", KEBAB_BANDA.sub("", t))


def comprobar(n, t, prohibidos):
    html = t[:t.index('<script type="text/x-dc"')]  # sin el JS del tablero (el primer <script> es el de support.js)
    html = re.sub(r'\s(?:title|aria-label)="[^"]*"', "", html)  # lo que va en un ⓘ o en un tooltip no cuenta
    for p in prohibidos:
        assert p not in html, (n, p)


# ================================================================ Las fechas, completas (formatos.md, 25/10)
HOY, AYER = "25/10/2026", "24/10/2026"
FECHAS = [
    ('<span class="w-dia">Hoy</span>', f'<span class="w-dia">{HOY}</span>'), ('<span class="ap-dia">Hoy</span>', f'<span class="ap-dia">{HOY}</span>'),
    ("Se puede mandar hasta mañana a las 10:48.", "Se puede mandar hasta el 26/10/2026 10:48."), (" · hoy, 11:04", f" · {HOY} 11:04"),
    ("<b>Martín Paz</b><span>Ayer</span>", f"<b>Martín Paz</b><span>{AYER} 18:30</span>"),
    ("<b>Federico Díaz</b><span>Ayer</span>", f"<b>Federico Díaz</b><span>{AYER} 17:20</span>"),
    ("<b>Javier Pereyra</b><span>Ayer</span>", f"<b>Javier Pereyra</b><span>{AYER} 09:45</span>"),
    ("<b>Carla Ruiz</b><span>05/10</span>", "<b>Carla Ruiz</b><span>05/10/2026 12:10</span>"),
    # 81: un contacto sin nombre toma el de su perfil de WhatsApp; nunca un teléfono como nombre
    ("<b>0351 15-555-0192</b><span>10:15</span>", f"<b>Sergio Molina</b><span>{HOY} 10:15</span>"),
    ("<b>La Clementina</b><span>17:12</span>", f"<b>La Clementina</b><span>{HOY} 17:12</span>"),
    ("<b>Grupo Delta</b><span>Ayer</span>", f"<b>Grupo Delta</b><span>{AYER} 19:05</span>"),
    ("<b>Ferretería Rosales</b><span>28/09</span>", "<b>Ferretería Rosales</b><span>28/09/2026 11:20</span>"),
]


def fechas(t):
    for a, b in FECHAS:
        t = t.replace(a, b)
    # la hora del chat elegido en la lista, que arma el JS del tablero
    return re.sub(r"(hora: \{[^}]*\}\[e\] \?\? '[^']*')", lambda m: re.sub(r"([\"'])(\d\d:\d\d)([\"'])", rf"\g<1>{HOY} \2\3", m.group(1)), t)


RELATIVAS = ["Hoy<", "Ayer<", "hace 2 minutos", "mañana a las", "hoy, ", "0351 15-555-0192"]


# ================================================================ «Mis mensajes» (T16): la tarjeta de la respuesta propia
CSS_MM = """.w-msjs, .ap-chat { justify-content: flex-end; }
.w-m .gl .c-card, .ap-m .gl .c-card { display: flex; align-items: center; gap: 10px; margin-top: 8px; padding: 9px 10px; border-radius: 8px; background: #fff; border: 1px solid oklch(0.86 0.04 170); }
.c-card .ic { color: var(--marca-tx); display: inline-flex; }
.c-card .t { display: flex; flex-direction: column; line-height: 1.3; }
.c-card .t b { font-weight: 600; }
.c-card .t small { font-size: 12px; color: var(--t3); }
.w-m:has(.r-gl), .ap-m:has(.r-gl) { width: 72%; max-width: 72%; }
.ap-m:has(.r-gl) { width: 88%; max-width: 88%; }
.w-m .gl.r-gl, .ap-m .gl.r-gl { max-width: none; width: 100%; box-sizing: border-box; padding: 0; overflow: hidden; background: #fff; border: 1px solid var(--borde); color: var(--t1); }
.r-cab { display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: oklch(0.975 0.006 78); }
.r-cab svg { color: var(--t2); flex-shrink: 0; }
.r-cab b { font-weight: 600; }
.r-cab small { font-size: 12.5px; color: var(--t3); }
.r-gr { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); font-size: 13.5px; border-top: 1px solid var(--borde); }
.r-gr > span { padding: 8px 12px; border-top: 1px solid var(--borde); }
.r-gr > span:nth-child(-n+2) { border-top: 0; }
.r-gr .k { color: var(--t2); }
.r-ok { display: flex; align-items: center; gap: 8px; padding: 9px 12px; border-top: 1px solid var(--borde); background: oklch(0.97 0.03 155); color: oklch(0.4 0.1 155); font-size: 13px; }
.r-ok b { font-weight: 700; }
"""
VALORES_MM = [("¿Retiraste el pedido?", "Sí"), ("Cantidad", "12"), ("¿Cómo estuvo?", "Muy bien")]
ULTIMO = "Gracias, paso a las 17.</span><span class=\"pie\">10:42</span></div>"


def mis_mensajes(t, clase):
    """Después de «Gracias, paso a las 17.»: La Clementina le manda un formulario y la persona ve su respuesta. El mensaje lo nombra (165)."""
    card = f'<span class="c-card"><span class="ic">{F.ICONO}</span><span class="t"><b>Retiro de pedido</b><small>Formulario</small></span></span>'
    grilla = '<div class="r-gr">' + "".join(f'<span class="k">{k}</span><span class="v">{v}</span>' for k, v in VALORES_MM) + "</div>"
    nuevo = (f'<div class="{clase} ent"><span class="gl">{A.mensaje_de("Retiro de pedido")}{card}</span><span class="pie">La Clementina · 17:10</span></div>'
             f'<div class="{clase} sal"><span class="gl r-gl"><span class="r-cab">{F.ICONO}<b>Retiro de pedido</b><small>Tu respuesta</small></span>{grilla}'
             f'<div class="r-ok">{A.TILDE} Guardada como <b>RET-000018</b></div></span><span class="pie">17:12</span></div>')
    assert ULTIMO in t
    t = t.replace(ULTIMO, ULTIMO + nuevo)
    t = t.replace("Vos: Gracias, paso a las 17.", "Vos: Respondiste Retiro de pedido")
    t = re.sub(r'(<b>La Clementina</b><span>)10:42(</span>)', r"\g<1>17:12\2", t)
    return t.replace("</helmet>", f'<style data-e14="mis-mensajes">\n{CSS_MM}</style>\n</helmet>', 1)


# ================================================================ 175 · Cómo termina una publicación: el estado, una vez (traspaso 10)
# Como el editor de ArquitecturaBase (EP1-A de formularios-whatsapp.md; PublicationActions y PublicationProgress): sin zona ni pasos. La etiqueta
# del encabezado dice el estado y la banda suma, solo cuando hacen falta, «Consultar publicación» («Consultando…» con su aro), «Repetir el mismo
# intento» y, con «Necesita revisión», «No salió» y «Salió». «Publicar en WhatsApp» apagado dice su motivo en el tooltip. Lo rechazado queda marcado
# en su pregunta; la cuenta no disponible y qué hacer con una publicación en revisión van en el aviso importante de su ⓘ.
EN_CURSO = "Ya hay una publicación en curso para este formulario."
SIN_CONFIRMAR = "Todavía no sabemos si WhatsApp recibió la versión 4."
SIN_RESPUESTA = "No sabemos si llegó el pedido de publicar la versión 4."
EN_REVISION = "Esta publicación necesita revisión: decinos si salió."
FLOW = "Visita a cliente · v4 · ab63a1f9"  # el nombre del Flow en Meta (165): el formulario, la versión y el final del id de la publicación
PUBLICANDO = '<span class="w-est pend">Publicando la versión 4</span>'
SIN_CONF = '<span class="w-est pend">Sin confirmar · versión 4</span>'
REVISION = '<span class="w-est mal">Necesita revisión · versión 4</span>'
NO_SALIO = '<span class="w-est mal">No se pudo publicar la versión 4</span>'
QUE_HACER = "Qué hacer"
ESTADOS_PUBLICANDO = ["Publicando", "La lectura se cortó", "Publicado", "WhatsApp rechazó una pregunta", "La cuenta no está disponible",
                      "La cuenta no está disponible: qué hacer", "Sin confirmar", "Consultando", "El pedido no tuvo respuesta", "Necesita revisión",
                      "Necesita revisión: qué hacer", "Salió: confirmar", "No salió: confirmar"]
# 186: «Salió» y «No salió» piden confirmar con el número, porque ninguno de los dos se deshace (la 161 en la 175)
SALIO = ("¿La versión 4 salió en WhatsApp?", "Salió")
NO_SALIO_CONF = ("¿La versión 4 no salió en WhatsApp?", "No salió")
CSS_DEC = """.w-dlg.dec { width: 420px; }
.w-dlg.dec .dc .ib { display: none; }
.w-dlg.dec .cb-sec.foco { box-shadow: 0 0 0 3px oklch(0.48 0.115 140 / 0.25); border-color: var(--marca); }
"""


def dlg_decidir(titulo, boton):
    """Decidir a propósito (161): sin ✕, como toda confirmación; la principal sin rojo y el foco en «Cancelar», así Enter no decide."""
    pie = f'<button type="button" class="cb cb-sec foco">Cancelar</button><button type="button" class="cb cb-pri">{boton}</button>'
    return F.dialogo(titulo, f'<p class="d-tx">{FLOW}</p>', pie).replace('class="w-dlg"', 'class="w-dlg dec"', 1)
CSS_AVISO = """.o-mot { display: flex; gap: 12px; align-items: flex-start; padding: 14px 16px; border-radius: 10px; background: var(--peligro-t); color: oklch(0.42 0.16 25); grid-column: 1 / -1; }
.o-mot svg { flex-shrink: 0; margin-top: 1px; }
.o-mot b { display: block; font-size: 15px; font-weight: 600; color: oklch(0.38 0.15 25); }
.o-mot span { display: block; margin-top: 2px; font-size: 12.5px; }
.o-sub { font-size: 12.5px; font-weight: 600; color: var(--t3); grid-column: 1 / -1; }
.o-pasos { display: flex; flex-direction: column; gap: 10px; margin: 0; padding: 0; list-style: none; grid-column: 1 / -1; }
.o-pasos li { display: flex; gap: 10px; align-items: center; font-size: 13.5px; }
.o-pasos .n { width: 22px; height: 22px; border-radius: 50%; background: var(--s3); color: var(--t2); font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
.w-bnd .ac { flex-shrink: 1; min-width: 0; flex-wrap: wrap; justify-content: flex-end; row-gap: 6px; }
"""


def acc_pub(motivo="", consultar="", repetir=False, revision=False, tip=True):
    """Las acciones de la banda: las de la publicación, solo cuando hacen falta, justo antes de «Publicar en WhatsApp»; apagado, con su motivo."""
    a = E.acc("limpio", tip=tip and bool(motivo), apagado=motivo)
    extra = ""
    if consultar:
        extra += E.trabaja("Consultando…", "cb-sec") if consultar == "trabaja" else '<button type="button" class="cb cb-sec">Consultar publicación</button>'
    if repetir:
        extra += '<button type="button" class="cb cb-sec">Repetir el mismo intento</button>'
    if revision:
        extra += '<button type="button" class="cb cb-sec">No salió</button><button type="button" class="cb cb-sec">Salió</button>'
    k = a.index("Publicar en WhatsApp")
    k = a.rindex('<span class="e-tipw">', 0, k) if '<span class="e-tipw">' in a[:k] else a.rindex("<", 0, k)
    return a[:k] + extra + a[k:]


def aviso_importante(titulo, motivo, detalle, pasos):
    """El aviso importante de una ⓘ (Criterio · Diálogos): el motivo en rojo suave y «Qué podés hacer», en pasos numerados."""
    cuerpo = (f'<div class="o-mot">{F.ALERTA}<div><b>{motivo}</b><span>{detalle}</span></div></div><span class="o-sub">Qué podés hacer</span>'
              '<ol class="o-pasos">' + "".join(f'<li><span class="n">{k}</span>{p}</li>' for k, p in enumerate(pasos, 1)) + "</ol>")
    return F.dialogo(titulo, cuerpo, '<button type="button" class="cb cb-pri">Entendido</button>')


AVISO_CUENTA = ("No se pudo publicar la versión 4", "WhatsApp no aceptó la versión 4: la cuenta no está disponible.", "No es por una pregunta del formulario.",
                ["Revisá el número en WhatsApp › Números: suele faltar el medio de pago.", "Cuando la cuenta esté disponible, publicá de nuevo."])
AVISO_REVISION = ("Necesita revisión · versión 4", "No pudimos confirmar si WhatsApp publicó la versión 4.", f"En WhatsApp se llama «{FLOW}».",
                  ["Buscalo con ese nombre en el administrador de WhatsApp de Meta.", "Si figura publicado, tocá «Salió»; si no, «No salió»."])


def publicando():
    banda = lambda est, ac: E.banda("Visita a cliente", est, ac, E.VOL)  # noqa: E731
    cuerpo = E.cuerpo_editor(abierta=None, modo="fijo")
    cuenta = NO_SALIO + E.info_btn("Por qué no se publicó")
    revision = REVISION + E.info_btn(QUE_HACER)
    V = {
        "Publicando": (banda(PUBLICANDO, acc_pub(EN_CURSO)), cuerpo),
        "La lectura se cortó": (banda(PUBLICANDO, acc_pub(EN_CURSO, consultar="si", tip=False)), cuerpo),
        "Publicado": (banda(E.EST_PUB4, acc_pub()), cuerpo),
        "WhatsApp rechazó una pregunta": (banda(NO_SALIO, acc_pub()), E.cuerpo_editor(abierta=None, modo="fijo", mal=7)),
        "La cuenta no está disponible": (banda(cuenta, acc_pub()), cuerpo),
        "La cuenta no está disponible: qué hacer": (banda(cuenta, acc_pub()), cuerpo),
        "Sin confirmar": (banda(SIN_CONF, acc_pub(SIN_CONFIRMAR, consultar="si")), cuerpo),
        "Consultando": (banda(SIN_CONF, acc_pub(SIN_CONFIRMAR, consultar="trabaja", tip=False)), cuerpo),
        # El pedido de publicar no tuvo respuesta y al volver a leer no aparece: la etiqueta sigue en la versión 3
        "El pedido no tuvo respuesta": (banda(E.EST_PUB, acc_pub(SIN_RESPUESTA, repetir=True)), cuerpo),
        # con las cinco de siempre y las tres de la revisión, la banda baja de renglón: el motivo de «Publicar», en su tooltip cerrado
        "Necesita revisión": (banda(revision, acc_pub(EN_REVISION, consultar="si", revision=True, tip=False)), cuerpo),
        "Necesita revisión: qué hacer": (banda(revision, acc_pub(EN_REVISION, consultar="si", revision=True, tip=False)), cuerpo),
        "Salió: confirmar": (banda(revision, acc_pub(EN_REVISION, consultar="si", revision=True, tip=False)), cuerpo),
        "No salió: confirmar": (banda(revision, acc_pub(EN_REVISION, consultar="si", revision=True, tip=False)), cuerpo),
    }
    assert list(V) == ESTADOS_PUBLICANDO
    capas = {"La lectura se cortó": A.toast("No pudimos actualizar el estado de la publicación.", "mal"),
             "Publicado": A.toast("Publicamos la versión 4."), "WhatsApp rechazó una pregunta": A.toast("No pudimos publicar la versión 4.", "mal"),
             "La cuenta no está disponible: qué hacer": aviso_importante(*AVISO_CUENTA), "Necesita revisión: qué hacer": aviso_importante(*AVISO_REVISION),
             "Salió: confirmar": dlg_decidir(*SALIO), "No salió: confirmar": dlg_decidir(*NO_SALIO_CONF)}
    return A.pagina_editor(V, capas, ESTADOS_PUBLICANDO, "Publicar en WhatsApp · cómo termina", E.CSS_E12 + E.css_titulos() + CSS_AVISO + CSS_DEC)


# ================================================================ M-FRM-Editor: la publicación sin hojas (175), y «Ver vista oficial» en el ⋮
# Es `E.tel_editor` con la publicación de la 175: las acciones van en el pie fijo, el motivo de lo apagado en la franja oscura de abajo (122) y
# «Necesita revisión» abre su aviso importante. El ⋮ de la barra vuelve con «Ver vista oficial» (lo de la 17 sale de este tablero).
ESTADOS_TED = ["Sin cambios", "Con cambios", "Guardando", "Acciones del formulario", "Editar una pregunta", "Elegir varias", "Pregunta con catálogo",
               "Así lo ve el empleado", "Publicar", "Publicando", "Publicado", "WhatsApp rechazó una pregunta", "Nuevo formulario", "Editar un título",
               "Sin confirmar", "Consultando", "El motivo de Publicar apagado", "El pedido no tuvo respuesta", "Necesita revisión", "Necesita revisión: qué hacer",
               "Salió: confirmar", "No salió: confirmar", "Revisar los cambios"]
CSS_TPUB = """.ap-hoja.dec .hc .ap-ib { display: none; }
.ap-hoja.dec .cb-sec.foco { box-shadow: 0 0 0 3px oklch(0.48 0.115 140 / 0.25); border-color: var(--marca); }
.ap-fijo.filas { flex-direction: column; align-items: stretch; gap: 10px; }
.ap-fijo.filas .fila { display: flex; gap: 12px; }
.ap-fijo .cb.full { justify-content: center; }
.f-snack.alto { bottom: 172px; }
.f-snack .mal { color: oklch(0.78 0.14 25); display: inline-flex; }
.ap-mot { display: flex; gap: 12px; align-items: flex-start; padding: 14px 16px; border-radius: 14px; background: var(--peligro-t); color: oklch(0.42 0.16 25); }
.ap-mot svg { flex-shrink: 0; margin-top: 1px; }
.ap-mot b { display: block; font-size: 15.5px; font-weight: 600; color: oklch(0.38 0.15 25); }
.ap-mot span { display: block; margin-top: 2px; font-size: 13.5px; }
.ap-sub { font-size: 13px; font-weight: 600; color: var(--t3); margin-bottom: -2px; }
.ap-pasos { display: flex; flex-direction: column; gap: 14px; margin: 0; padding: 0; list-style: none; }
.ap-pasos li { display: flex; gap: 12px; align-items: center; font-size: 15px; }
.ap-pasos .n { width: 28px; height: 28px; border-radius: 50%; background: var(--s3); color: var(--t2); font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
"""


def t_aviso_importante(titulo, motivo, detalle, pasos):
    cuerpo = (f'<div class="ap-mot">{F.ALERTA}<div><b>{motivo}</b><span>{detalle}</span></div></div><span class="ap-sub">Qué podés hacer</span>'
              '<ol class="ap-pasos">' + "".join(f'<li><span class="n">{k}</span>{p}</li>' for k, p in enumerate(pasos, 1)) + "</ol>")
    return F.thoja(titulo, cuerpo, '<button type="button" class="cb cb-pri">Entendido</button>')


def t_hoja_decidir(titulo, boton):
    """186 en el teléfono: una hoja sin ✕, con la principal primero y el foco en «Cancelar»."""
    pie = f'<button type="button" class="cb cb-pri lleno">{boton}</button><button type="button" class="cb cb-sec foco">Cancelar</button>'
    return F.thoja(titulo, E.t_tx(FLOW), pie).replace('class="ap-hoja"', 'class="ap-hoja dec"', 1)


def t_fijo_pub(*filas):
    """El pie fijo con las acciones de la publicación, una fila por acción (no entran dos de lado en 390): «Publicar en WhatsApp» apagado
    se puede tocar y dice su motivo en la franja oscura."""
    pub = '<button type="button" class="cb cb-pri full" aria-disabled="true">Publicar en WhatsApp</button>'
    h = "".join(f'<div class="fila">{pub if f == "publicar" else f}</div>' for f in filas)
    return f'<div class="ap-fijo filas">{h}</div>'


def t_franja(texto, icono="", alto=False):
    ic = f'<span class="mal">{icono}</span>' if icono else ""
    return f'<div class="f-snack{" alto" if alto else ""}" role="status">{ic}<span class="tx">{texto}</span></div>'


def tel_editor():
    estados = ESTADOS_TED
    kebab = f'<button type="button" class="ap-ib" aria-label="Acciones de Visita a cliente">{F.TKEBAB}</button>'

    def bar(titulo, sub, menu=True):
        return (f'<div class="ap-bar int"><a class="ap-ib" aria-label="Volver" href="M-FRM-Listado.dc.html">{F.TVOLVER}</a>'
                f'<div class="tit"><h1>{titulo}</h1><span class="sub">{sub}</span></div><button type="button" class="ap-ib" aria-label="Así lo ve el empleado">{F.OJO}</button>'
                + (kebab if menu else "") + "</div>")
    pub = "Publicado · versión 3"
    consultar = '<button type="button" class="cb cb-sec full">Consultar publicación</button>'
    revision = E.t_detalle(QUE_HACER)
    snack = f'<div class="f-snack" role="status"><span class="ok">{E.OK}</span><span class="tx">Publicamos la versión 4.</span></div>'
    V = {
        "Sin cambios": (bar("Visita a cliente", pub), E.t_cuerpo(), E.t_fijo("limpio")),
        "Con cambios": (bar("Visita a cliente", pub), E.t_cuerpo(), E.t_fijo("cambios")),
        "Guardando": (bar("Visita a cliente", pub), E.t_cuerpo(), E.t_fijo("guardando")),
        "Acciones del formulario": (bar("Visita a cliente", pub), E.t_cuerpo(), E.t_fijo("limpio")),
        "Editar una pregunta": (bar("Visita a cliente", pub), E.t_cuerpo(), E.t_fijo("cambios")),
        "Elegir varias": (bar("Visita a cliente", pub), E.t_cuerpo(), E.t_fijo("cambios")),
        "Pregunta con catálogo": (bar("Visita a cliente", pub), E.t_cuerpo(), E.t_fijo("cambios")),
        "Así lo ve el empleado": (bar("Visita a cliente", pub), E.t_cuerpo(), E.t_fijo("limpio")),
        "Publicar": (bar("Visita a cliente", pub), E.t_cuerpo(), E.t_fijo("limpio")),
        "Publicando": (bar("Visita a cliente", "Publicando la versión 4"), E.t_cuerpo(), t_fijo_pub("publicar")),
        "Publicado": (bar("Visita a cliente", "Publicado · versión 4"), E.t_cuerpo(), E.t_fijo("limpio") + snack),
        # la lista ya bajada hasta las preguntas: la que rechazó WhatsApp, marcada en su lugar (la franja del aviso la taparía: va en la compu)
        "WhatsApp rechazó una pregunta": (bar("Visita a cliente", "No se pudo publicar la versión 4"), E.t_cuerpo(mal=7, desde_preguntas=True), E.t_fijo("limpio")),
        "Nuevo formulario": (bar("Nuevo formulario", "Borrador", menu=False), E.t_cuerpo(vacia=True, fijo=False, nombre="Inspección de obra", prefijo="OBR"), E.t_fijo("nuevo")),
        "Editar un título": (bar("Visita a cliente", pub), E.t_cuerpo(desde_preguntas=True), E.t_fijo("cambios")),
        "Sin confirmar": (bar("Visita a cliente", "Sin confirmar · versión 4"), E.t_cuerpo(), t_fijo_pub(consultar, "publicar")),
        "Consultando": (bar("Visita a cliente", "Sin confirmar · versión 4"), E.t_cuerpo(), t_fijo_pub(E.trabaja("Consultando…", "cb-sec full"), "publicar")),
        "El motivo de Publicar apagado": (bar("Visita a cliente", "Sin confirmar · versión 4"), E.t_cuerpo(), t_fijo_pub(consultar, "publicar") + t_franja(SIN_CONFIRMAR, alto=True)),
        "El pedido no tuvo respuesta": (bar("Visita a cliente", pub), E.t_cuerpo(),
                                        t_fijo_pub('<button type="button" class="cb cb-sec full">Repetir el mismo intento</button>', "publicar")),
        # en revisión, el pie trae lo que la destraba; «Publicar en WhatsApp» no entra en una tercera fila
        "Necesita revisión": (bar("Visita a cliente", "Necesita revisión · versión 4" + revision), E.t_cuerpo(),
                              t_fijo_pub('<button type="button" class="cb cb-sec full">No salió</button><button type="button" class="cb cb-sec full">Salió</button>', consultar)),
        "Necesita revisión: qué hacer": (bar("Visita a cliente", "Necesita revisión · versión 4" + revision), E.t_cuerpo(),
                                         t_fijo_pub('<button type="button" class="cb cb-sec full">No salió</button><button type="button" class="cb cb-sec full">Salió</button>', consultar)),
        "Salió: confirmar": (bar("Visita a cliente", "Necesita revisión · versión 4" + revision), E.t_cuerpo(),
                             t_fijo_pub('<button type="button" class="cb cb-sec full">No salió</button><button type="button" class="cb cb-sec full">Salió</button>', consultar)),
        "No salió: confirmar": (bar("Visita a cliente", "Necesita revisión · versión 4" + revision), E.t_cuerpo(),
                                t_fijo_pub('<button type="button" class="cb cb-sec full">No salió</button><button type="button" class="cb cb-sec full">Salió</button>', consultar)),
        "Revisar los cambios": (bar("Visita a cliente", pub), E.t_cuerpo(), E.t_fijo("cambios")),
    }
    assert list(V) == estados
    cuerpo = A.con_estados([(e, v[0] + v[1] + v[2]) for e, v in V.items()])
    tilde = E.svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 14, "3")
    listo = '<button type="button" class="cb cb-pri">Listo</button><button type="button" class="cb cb-sec">Cancelar</button>'

    def ops(lista):
        return "".join(f'<div class="t-op"><div class="ap-cmp" style="flex: 1;"><div class="ct">{o}</div></div>{E.q_acciones(f"la opción {o}", k, len(lista), editar=False)}</div>'
                       for k, o in enumerate(lista, 1))
    editar = (F.tcampo("Pregunta", "Motivo", req=True) + F.tcampo("Tipo de respuesta", "Elegir una", select=True)
              + '<div class="ap-cmp"><span class="rt"><span>Opciones</span></span></div>' + ops(["Seguimiento", "Venta nueva", "Reclamo"])
              + f'<span class="t-mas">{E.MAS} Agregar opción</span>' + F.tcampo("Ayuda para quien lo recibe", "Opcional", vacio=True)
              + '<span class="t-chk"><i class="no"></i>Obligatoria</span>')
    varias = (F.tcampo("Pregunta", "Fallas", req=True) + F.tcampo("Tipo de respuesta", "Elegir varias", select=True)
              + '<div class="ap-cmp"><span class="rt"><span>Opciones</span></span></div>' + ops(E.FALLAS) + f'<span class="t-mas">{E.MAS} Agregar opción</span>'
              + '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">' + F.tcampo("Mínimo", "1") + F.tcampo("Máximo", "3") + "</div>"
              + F.tcampo("Ayuda para quien lo recibe", "Opcional", vacio=True))
    vp = '<div class="t-vp">'
    for n, _d in E.T_PREG:
        if n == "¿Se concretó la venta?":
            vp += f'<span class="t-sub">{E.TITULO_EJ}</span>'
        if n == "Fallas":
            vp += ('<div class="ap-cmp"><span class="rt"><span>Fallas</span></span><span class="ay">Elegí hasta 3</span><div class="t-cks">'
                   + "".join(f'<span class="t-chk"><i class="no"></i>{o}</span>' for o in E.FALLAS) + "</div></div>")
            continue
        opcional = "" if n == "Cliente" else " (opcional)"
        ph = "Elegí una opción" if n == "Motivo" else "Elegí una fecha" if n == "Fecha de la visita" else ""
        vp += f'<div class="ap-cmp"><span class="rt"><span>{n}{opcional}</span></span><div class="ct ph{" area" if n == "Observaciones" else ""}">{ph}</div></div>'
    vp += "</div>"
    publicar_h = ('<div class="p-tit2">Qué cambia respecto de la versión 3</div><div class="ap-grupo" style="margin: 0;">'
                  '<div class="ap-dato"><span class="k">Cambiada</span><span class="v">Motivo (las opciones)</span></div>'
                  '<div class="ap-dato"><span class="k">Cambiada</span><span class="v">Fallas (hasta 3)</span></div></div>'
                  f'<span class="t-lin">{E.TILDE} Las preguntas de la versión 4 ya no se editan; lo que cambies después va a la versión 5.</span>'
                  f'<span class="t-lin">{E.RELOJ} WhatsApp la revisa unos minutos. Recién ahí se puede mandar desde el chat.</span>')
    capas = {
        "Acciones del formulario": M.hoja("Visita a cliente", '<a role="menuitem" href="M-FRM-Vista-Oficial.dc.html">Ver vista oficial</a>'),
        "Editar una pregunta": F.thoja("Editar pregunta", editar, listo),
        "Elegir varias": F.thoja("Editar pregunta", varias, listo),
        "Pregunta con catálogo": F.thoja("Editar pregunta", F.tcampo("Pregunta", "Motivo", req=True) + F.tcampo("Tipo de respuesta", "Elegir de un catálogo", select=True)
                                         + F.tcampo("Catálogo", "Motivos de visita", req=True, select=True)
                                         + '<a class="t-mas" href="M-FRM-Catalogo.dc.html" style="text-decoration: none;">Ver el catálogo</a>'
                                         + f'<span class="t-chk"><i class="on">{tilde}</i>Permitir elegir varias</span>'
                                         + '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">' + F.tcampo("Mínimo", "1") + F.tcampo("Máximo", "2") + "</div>"
                                         + E.t_zona_plegada("En WhatsApp", E.RESUMEN_WA["varias"])
                                         + F.tcampo("Ayuda para quien lo recibe", "Opcional", vacio=True) + f'<span class="t-chk"><i>{tilde}</i>Obligatoria</span>', listo),
        "Así lo ve el empleado": F.thoja("Así lo ve el empleado", vp, '<button type="button" class="cb cb-pri" disabled>Enviar</button>', sub="Visita a cliente · borrador"),
        "Publicar": F.thoja("Publicar la versión 4", publicar_h, '<button type="button" class="cb cb-pri">Publicar versión 4</button><button type="button" class="cb cb-sec">Cancelar</button>'),
        "Editar un título": F.thoja("Editar título", F.tcampo("Título", E.TITULO_EJ, req=True).replace("</div></div>", f'</div><span class="ay" style="align-self: flex-end;">{len(E.TITULO_EJ)}/80</span></div>', 1), listo),
        "Necesita revisión: qué hacer": t_aviso_importante(*AVISO_REVISION),
        "Salió: confirmar": t_hoja_decidir(*SALIO),
        "No salió: confirmar": t_hoja_decidir(*NO_SALIO_CONF),
        "Revisar los cambios": F.thoja("Revisar los cambios", f'<span class="t-lin">{E.QUIEN_GUARDO}</span>' + E.t_comparacion(),
                                       '<button type="button" class="cb cb-pri">Conservar mis cambios</button><button type="button" class="cb cb-sec">Usar lo guardado</button>')
        .replace('<div class="hp">', '<div class="hp apilado">', 1),
    }
    hojas = "".join(f'<sc-if value="{{{{s{estados.index(k)}}}}}" hint-placeholder-val="{{{{no}}}}">{h}</sc-if>' for k, h in capas.items())
    t = F.pagina_tel(None, None, cuerpo, css=F.CSS_TFICHA + F.CSS_TPREGUNTA + F.CSS_TFORM + A.CSS_TED + F.CSS_TFILTRO + E.CSS_E12 + E.CSS_TED_E12 + E.CSS_TZONA
                     + E.CSS_TTITULOS + CSS_TPUB)
    i = t.index('<nav class="ap-nav"')
    j = t.index("</nav>", i) + len("</nav>")
    t = t[:i] + t[j:]
    k = t.index('<span class="ap-raya"></span>') + len('<span class="ap-raya"></span>')
    t = t[:k] + hojas + t[k:]
    props = {"estado": {"editor": "enum", "options": estados, "default": estados[0], "section": "Estado"}, "$preview": {"width": 390, "height": 844}}
    t = t.replace("""data-props='{"$preview":{"width":390,"height":844}}'""", "data-props='" + json.dumps(props, ensure_ascii=False, separators=(",", ":")) + "'")
    t = t.replace("    return { si: true, no: false };", f"    const e = this.props.estado ?? {json.dumps(estados[0], ensure_ascii=False)};\n" + A.js_estados(estados))
    return M.css(re.sub(r"<title>[^<]*</title>", "<title>Editor del formulario · teléfono</title>", t), M.CSS_HOJA, "hoja")


# ================================================================ 176 · La vista oficial se recorre en un diálogo (FRM-Vista-Oficial y su teléfono)
# Como OfficialFormPreview de ArquitecturaBase (VO1-A): «Ver vista oficial» abre «Vista oficial · versión 4», con el marco de Meta de 480 × 840
# achicado entero (en la compu, como allá con la raíz al 75 %: 360 × 630), que arranca en la primera pantalla y se recorre como en el celular. Mientras
# carga, vence o falla, el lugar conserva la medida del marco. Lo de adentro es la página de Meta: sus clases van con `mw-`, que no son nuestras, adentro
# de `.tel-meta`, que es un teléfono, así la escala de la compu (180, `traspaso10_piezas_1004.py`) no la achica dos veces.
ESTADOS_VO = ["Cargando", "Lista", "Una lista abierta", "Vencida", "No se pudo cargar"]
TITULO_VO = "Vista oficial · versión 4"
CSS_VO = """.w-dlg.vo { width: 402px; }
.vo-db { display: flex; justify-content: center; padding: 16px 20px 4px; }
.vo-marco { position: relative; flex: none; width: 360px; height: 630px; overflow: hidden; border: 1px solid var(--borde); border-radius: 6px; background: #fff; }
.vo-est { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 24px; text-align: center; font-size: 13.5px; color: var(--t2); background: var(--s2); }
.vo-est .girar2 { width: 16px; height: 16px; box-sizing: border-box; border-radius: 50%; border: 2px solid currentColor; border-right-color: transparent; display: inline-block; animation: girar2 0.8s linear infinite; flex-shrink: 0; }
.tel-meta { position: absolute; inset: 0; }
.tel-meta .mw-pg { position: absolute; left: 0; top: 0; width: 480px; height: 840px; transform: scale(0.75); transform-origin: 0 0; display: flex; flex-direction: column; background: #f0f2f5;
  font-family: Helvetica, Arial, sans-serif; color: #111b21; }
.tel-meta .mw-top { height: 52px; flex: none; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; background: #fff; border-bottom: 1px solid #dadde1; font-size: 15px; }
.tel-meta .mw-top b { font-weight: 700; }
.tel-meta .mw-top .mw-bt { display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 12px; border-radius: 6px; background: #e4e6eb; font-size: 14px; font-weight: 600; color: #050505; }
.tel-meta .mw-tel { position: relative; flex: 1; min-height: 0; margin: 12px 24px 12px; display: flex; flex-direction: column; background: #fff; border: 1px solid #dadde1; border-radius: 12px; overflow: hidden; }
.tel-meta .mw-hd { height: 56px; flex: none; display: flex; align-items: center; gap: 16px; padding: 0 16px; border-bottom: 1px solid #e9edef; font-size: 17px; color: #54656f; }
.tel-meta .mw-hd b { flex: 1; font-weight: 600; color: #111b21; }
.tel-meta .mw-sc { flex: 1; min-height: 0; overflow: hidden; display: flex; flex-direction: column; gap: 10px; padding: 12px 16px; font-size: 15px; }
.tel-meta .mw-in { height: 44px; flex: none; box-sizing: border-box; display: flex; align-items: center; justify-content: space-between; padding: 0 14px; border: 1px solid #8696a0; border-radius: 8px; color: #54656f; }
.tel-meta .mw-in.area { height: 64px; align-items: flex-start; padding-top: 12px; }
.tel-meta .mw-sub { margin-top: 2px; font-size: 17px; font-weight: 700; }
.tel-meta .mw-l { font-size: 15px; }
.tel-meta .mw-ay { margin-top: -6px; font-size: 13px; color: #667781; }
.tel-meta .mw-op { display: flex; align-items: center; justify-content: space-between; font-size: 15px; }
.tel-meta .mw-op i { width: 18px; height: 18px; box-sizing: border-box; border: 2px solid #8696a0; border-radius: 50%; }
.tel-meta .mw-op i.ck { border-radius: 3px; }
.tel-meta .mw-pie { flex: none; display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 12px 16px 14px; border-top: 1px solid #e9edef; }
.tel-meta .mw-env { width: 100%; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 22px; background: #00a884; color: #fff; font-size: 15px; font-weight: 600; }
.tel-meta .mw-pie small { font-size: 12px; color: #667781; }
.tel-meta .mw-pie small u { color: #027eb5; text-decoration: none; }
.tel-meta .mw-velo { position: absolute; inset: 0; background: rgba(11, 20, 26, 0.4); }
.tel-meta .mw-hoja { position: absolute; left: 0; right: 0; bottom: 0; display: flex; flex-direction: column; background: #fff; border-radius: 12px 12px 0 0; }
.tel-meta .mw-hoja .h { display: flex; align-items: center; gap: 16px; height: 56px; padding: 0 16px; border-bottom: 1px solid #e9edef; font-size: 17px; font-weight: 600; }
.tel-meta .mw-hoja .h span { display: inline-flex; color: #54656f; font-weight: 400; }
.tel-meta .mw-hoja .o { display: flex; align-items: center; justify-content: space-between; height: 52px; padding: 0 16px; border-bottom: 1px solid #f0f2f5; font-size: 15px; }
.tel-meta .mw-hoja .o i { width: 20px; height: 20px; box-sizing: border-box; border: 2px solid #8696a0; border-radius: 50%; }
"""
CAL_MW = E.svg('<rect x="4" y="5.5" width="16" height="14" rx="2"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>', 18)
CHEV_MW = E.svg('<path d="m6 9 6 6 6-6"/>', 18, "2")
X_MW = E.svg('<path d="M6 6l12 12"/><path d="M18 6 6 18"/>', 20, "2")
KEBAB_MW = E.svg('<circle cx="12" cy="5.5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="18.5" r="1.4"/>', 20)
REINICIAR_MW = E.svg('<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4.5 4.5v4h4"/>', 16, "2")


def pagina_meta(abierta=False):
    """La primera pantalla del formulario en la página de Meta, en el idioma de quien mira; «abierta», con la lista de «Motivo» para elegir."""
    op = lambda t, ck=False: f'<span class="mw-op">{t}<i class="{"ck" if ck else ""}"></i></span>'  # noqa: E731
    sc = (f'<div class="mw-in"><span>Cliente</span></div><div class="mw-in"><span>Fecha de la visita (opcional)</span>{CAL_MW}</div>'
          f'<div class="mw-sub">{E.TITULO_EJ}</div><span class="mw-l">¿Se concretó la venta? (opcional)</span>{op("Sí")}{op("No")}'
          '<div class="mw-in"><span>Monto estimado (opcional)</span></div><span class="mw-ay">Usá punto para los decimales</span>'
          f'<div class="mw-in"><span>Motivo (opcional)</span>{CHEV_MW}</div>'
          '<span class="mw-l">Fallas</span><span class="mw-ay">Elegí hasta 3</span>' + "".join(op(f, True) for f in E.FALLAS)
          + '<div class="mw-in area"><span>Observaciones (opcional)</span></div>')
    hoja = ""
    if abierta:
        hoja = ('<div class="mw-velo"></div><div class="mw-hoja" role="listbox" aria-label="Motivo"><div class="h"><span>' + X_MW + "</span>Motivo</div>"
                + "".join(f'<div class="o">{o}<i></i></div>' for o in ("Seguimiento", "Venta nueva", "Reclamo")) + '<div style="height: 18px;"></div></div>')
    return (f'<div class="tel-meta"><div class="mw-pg"><div class="mw-top"><b>Vista previa</b><span class="mw-bt">{REINICIAR_MW} Reiniciar</span></div>'
            f'<div class="mw-tel"><div class="mw-hd">{X_MW}<b>Visita a cliente</b>{KEBAB_MW}</div><div class="mw-sc">{sc}</div>'
            '<div class="mw-pie"><span class="mw-env">Enviar</span><small>Administrado por la empresa. <u>Más información</u></small></div>'
            f'{hoja}</div></div></div>')


def region_vo(modo):
    if modo == "cargando":
        return f'<div class="vo-est" role="status">{E.GIRA}Cargando la vista de WhatsApp…</div>'
    if modo == "vencida":
        return '<div class="vo-est">La vista oficial venció.</div>'
    if modo == "error":
        return '<div class="vo-est">No pudimos cargar la vista de WhatsApp.</div>'
    return pagina_meta(abierta=modo == "abierta")


def dlg_vista(modo):
    pie = '<button type="button" class="cb cb-sec">Cerrar</button>'
    if modo in ("lista", "abierta"):
        pie += '<a class="cb cb-sec" href="#">Abrir en otra pestaña</a>'
    if modo in ("vencida", "error"):
        pie += '<button type="button" class="cb cb-pri">Cargarla de nuevo</button>'
    return (f'<div class="w-oscuro"><div class="w-dlg vo" role="dialog" aria-modal="true" aria-label="{TITULO_VO}"><div class="dc"><span>{TITULO_VO}</span>'
            f'<button type="button" class="ib" aria-label="Cerrar">{F.CERRAR}</button></div><div class="vo-db"><div class="vo-marco">{region_vo(modo)}</div></div>'
            f'<div class="df">{pie}</div></div></div>')


MODO_VO = {"Cargando": "cargando", "Lista": "lista", "Una lista abierta": "abierta", "Vencida": "vencida", "No se pudo cargar": "error"}


def vista_oficial():
    """El diálogo sobre el formulario publicado, sin cambios."""
    fondo = (E.banda("Visita a cliente", E.EST_PUB4, acc_pub(), E.VOL), E.cuerpo_editor(abierta=None, modo="fijo"))
    V = {e: fondo for e in ESTADOS_VO}
    capas = {e: dlg_vista(MODO_VO[e]) for e in ESTADOS_VO}
    # una ventana de 900 de alto: el diálogo, con el marco achicado, tiene que entrar entero (176)
    return A.pagina_editor(V, capas, ESTADOS_VO, "Publicar en WhatsApp · la vista oficial", E.CSS_E12 + E.css_titulos() + CSS_VO + ".w-app { height: 900px !important; }\n")


CSS_TVO = """.ap-cuerpo.tvo { display: flex; justify-content: center; padding: 6px 16px; overflow: hidden; }
.tvo .vo-marco { width: 358px; height: 627px; }
.tvo .tel-meta .mw-pg { transform: scale(0.7458); }
.tvo .vo-est { font-size: 15px; }
"""


def tel_vista_oficial():
    """En el teléfono ocupa la pantalla: el marco achicado al ancho, y «Abrir en otra pestaña» o «Cargarla de nuevo» en el pie fijo."""
    bar = (f'<div class="ap-bar int"><a class="ap-ib" aria-label="Cerrar" href="M-FRM-Editor.dc.html">{X_MW}</a>'
           '<div class="tit"><h1>Vista oficial</h1><span class="sub">Versión 4</span></div></div>')

    def pant(modo):
        if modo in ("vencida", "error"):
            pie = '<div class="ap-fijo"><button type="button" class="cb cb-pri full">Cargarla de nuevo</button></div>'
        elif modo == "cargando":
            pie = '<div class="ap-fijo"><a class="cb cb-sec full" href="#" aria-disabled="true">Abrir en otra pestaña</a></div>'
        else:
            pie = '<div class="ap-fijo"><a class="cb cb-sec full" href="#">Abrir en otra pestaña</a></div>'
        return bar + f'<div class="ap-cuerpo tvo"><div class="vo-marco">{region_vo(modo)}</div></div>' + pie
    cuerpo = {e: pant(MODO_VO[e]) for e in ESTADOS_VO}
    return C.tel_pagina(cuerpo, ESTADOS_VO, {}, "La vista oficial · teléfono", E.CSS_E12 + CSS_VO + CSS_TVO)


# ================================================================ 165 · El envío nombra el formulario, también al elegir otro
# Es `E.chat_enviar` y `E.tel_chat_enviar` con dos estados más: elegir otro formulario cambia el nombre en el mensaje propuesto, y lo que escribió el
# operador no se pisa. El texto del mensaje lo arma `A.dlg_enviar` con el formulario elegido.
OTRO = "Elegir otro formulario"
CONSERVA = "Lo escrito se conserva"
ESCRITO = "Tomás, completalo antes de irte, por favor."


def chat_enviar():
    estados = list(E.ESTADOS_CHAT)
    k = estados.index("Elegir el formulario") + 1
    estados[k:k] = [OTRO, CONSERVA]
    esc = {e: A.escr() for e in estados}
    esc["En cola"] = A.escr("off", "Hay un envío pendiente en esta conversación.", enviar=False)
    esc["Ventana cerrada"] = A.escr("off", "Pasaron 24 horas desde su último mensaje.", "Pasaron 24 horas", cerrada=True)
    esc["Cuenta inactiva"] = A.escr("off", "La cuenta de Tomás está inactiva: no puede completar formularios.")
    esc["Sin formularios para Tomás"] = A.escr("off", "Tomás no tiene formularios publicados que pueda completar.")
    msgs = {
        "En cola": A.burbuja("En cola · 10:51", icono=f'<span class="rel">{E.RELOJ14}</span>'),
        "Leído": A.burbuja("Lucía Fernández · 10:51 · Leído"),
        "No se pudo mandar": A.burbuja("No se pudo mandar", "mal", F.info("El formulario no le llegó. Podés mandarlo de nuevo con «Enviar formulario».")),
    }
    ventana = A.c_aviso("Pasaron 24 horas desde su último mensaje.", E.RELOJ14)
    d = E.dlg_enviar
    capas = {
        "Elegir el formulario": d(),
        OTRO: d(sel=1),
        CONSERVA: d(sel=1, mensaje=ESCRITO),
        "Muchos formularios": d("muchos", buscar=""),
        E.ELEGIDO_OTRA: d("otra", buscar=""),
        "Sin coincidencias": d("vacia", buscar="Inspección de planta", pie="off"),
        "Cargando formularios": d("cargando", pie="off"),
        "La lista no carga": d("error", pie="off"),
        "Falta el mensaje": d(err="vacio"),
        "Mensaje muy largo": d(err="largo", mensaje="Tomás, te paso el formulario de la visita. Acordate de anotar todo lo que revisaste en el local, si quedaron pedidos pendientes, qué productos faltaban en la góndola y cuándo conviene volver a pasar…"),
        "Enviando": d(pie="enviando"),
        "Se cerró la ventana": d(aviso=ventana, pie="off", hasta=False),
        "El formulario ya no está": d("baja", aviso=A.c_aviso("Visita a cliente ya no está disponible para Tomás. Elegí otro."), pie="off"),
        "Con catálogos": d(prob=A.prep_catalogo()),
        "Preparando las opciones": d(prob=A.prep_catalogo("preparando"), pie="off"),
        "Más de 200 opciones": d(prob=A.prob_catalogo("Supervisor a cargo: supera las 200 opciones que admite WhatsApp. Ajustá el catálogo antes de mandar."), pie="off"),
        "Ninguna opción": d(prob=A.prob_catalogo("Supervisor a cargo: no tiene opciones y la pregunta es obligatoria."), pie="off"),
        "Menos que el mínimo": d(prob=A.prob_catalogo("Motivo: tiene 1 opción y se piden al menos 2."), pie="off"),
        "Una opción que no entra": d(prob=A.prob_catalogo("Supervisor a cargo: una opción es más larga de lo que admite WhatsApp."), pie="off"),
        "Catálogo que no se puede usar": d(prob=A.prob_catalogo("Supervisor a cargo: el catálogo no se puede usar. Avisale a quien lo administra."), pie="off"),
        E.NO_PUBLICADO: d(prob=A.prob_catalogo(E.no_publicado("Visita a cliente")), pie="off"),
    }
    enviado = {"En cola": "Vos: Formulario · Visita a cliente", "Leído": "Vos: Formulario · Visita a cliente", "No se pudo mandar": "No se pudo mandar un formulario"}
    vp = {e: enviado.get(e, "Vos: Genial, Tomás. Te mando el formulario de la visita.") for e in estados}
    hora = {e: "10:51" for e in enviado}
    t = A.pagina_chat(estados, esc, msgs, capas, vp, hora, "WhatsApp · Internos · enviar un formulario")
    return t.replace("</helmet>", f'<style data-e12="resolver">\n{E.CSS_E12}</style>\n</helmet>', 1)


def tel_chat_enviar():
    estados = list(E.ESTADOS_TCHAT)
    k = estados.index("Elegir el formulario") + 1
    estados[k:k] = [OTRO, CONSERVA]
    esc = {e: A.t_escr() for e in estados}
    esc["Ventana cerrada"] = A.t_escr(cerrada=True)
    tb = A.t_burbuja
    msgs = {
        "En cola": tb("En cola · 10:51", icono=f'<span class="rel">{F.TRELOJ}</span>'),
        "Leído": tb("Lucía Fernández · 10:51 · Leído"),
        "No se pudo mandar": tb("No se pudo mandar", "mal", A.t_info("El formulario no le llegó. Podés mandarlo de nuevo con «Enviar formulario».")),
    }
    ventana = f'<div class="t-aviso">{E.RELOJ14}<span>Pasaron 24 horas desde su último mensaje.</span></div>'

    def prob(texto):
        return f'<div class="t-prob2">{E.ALERTA}<span>{texto}</span></div>'
    h = E.t_hoja_enviar
    capas = {
        "Menú abierto": E.t_menu(),
        "Elegir el formulario": h(),
        OTRO: h(sel=1),
        CONSERVA: h(sel=1, mensaje=ESCRITO),
        E.ELEGIDO_OTRA: h("otra"),
        "Cargando formularios": h("cargando", pie="off"),
        "Falta el mensaje": h(err="vacio"),
        "Enviando": h(pie="enviando"),
        "Se cerró la ventana": h(aviso=ventana, pie="off", hasta=False),
        "El formulario ya no está": h("baja", aviso='<div class="t-aviso">' + E.ALERTA + '<span>Visita a cliente ya no está disponible para Tomás. Elegí otro.</span></div>', pie="off"),
        "Ventana cerrada": E.t_menu("Pasaron 24 horas desde su último mensaje."),
        "Cuenta inactiva": E.t_menu("La cuenta de Tomás está inactiva: no puede completar formularios."),
        "Sin formularios para Tomás": E.t_menu("Tomás no tiene formularios publicados que pueda completar."),
        "Con catálogos": h(prob=f'<span class="t-lin">{F.LISTA} Motivo: 3 opciones</span><span class="t-lin">{F.LISTA} Supervisor a cargo: 7 opciones</span>'),
        "Más de 200 opciones": h(prob=prob("Supervisor a cargo: supera las 200 opciones que admite WhatsApp. Ajustá el catálogo antes de mandar."), pie="off"),
        "Ninguna opción": h(prob=prob("Supervisor a cargo: no tiene opciones y la pregunta es obligatoria."), pie="off"),
        "Catálogo que no se puede usar": h(prob=prob("Supervisor a cargo: el catálogo no se puede usar. Avisale a quien lo administra."), pie="off"),
        E.NO_PUBLICADO: h(prob=prob(E.no_publicado("Visita a cliente")), pie="off"),
    }
    t = A.pagina_tchat(estados, esc, msgs, capas, "WhatsApp · Internos · enviar un formulario · teléfono", E.CSS_E12 + E.CSS_TELEGIDO)
    return M.css(t, M.CSS_HOJA, "hoja")


def con_mensaje_cliente(t):
    """Los chats de Clientes que arma `formularios_e12_sin_idioma_1004.py`: su burbuja toma `A.MENSAJE_AB` («Visita a cliente»), y el formulario que
    se manda es «Entrega de pedido». El diálogo ya lo nombra bien (`A.dlg_enviar` con el elegido)."""
    return t.replace(A.mensaje_de("Visita a cliente"), A.mensaje_de("Entrega de pedido"))


def con_vista_oficial(t):
    """«Ver vista oficial» abre su diálogo, en FRM-Vista-Oficial (176), y no el costado de FRM-Publicando."""
    return t.replace('href="FRM-Publicando.dc.html">Ver vista oficial', 'href="FRM-Vista-Oficial.dc.html">Ver vista oficial')


# ================================================================ 88 · Los títulos también en el editor de la 18
_CAJA_ARCHIVOS = A.caja_archivos


def caja_archivos(modo="foto", total="5"):
    """El editor con fotos y documentos (la caja de `A`): «Agregar título» al lado de «Agregar pregunta» y el título entre las preguntas, como en la 14."""
    h = _CAJA_ARCHIVOS(modo, total)
    if not E.CON_TITULOS:
        return h
    ancla = '<div class="q-it"><span class="num">3</span>'
    assert h.count(ancla) == 1, h.count(ancla)
    boton = f'<button type="button" class="cb cb-sec">{A.MAS} Agregar pregunta</button>'
    assert h.count(boton) == 1
    h = h.replace(ancla, E.fila_titulo() + ancla)
    return h.replace(boton, f'<button type="button" class="cb cb-sec">{A.MAS} Agregar título</button>' + boton)


A.caja_archivos = caja_archivos


# ================================================================ FRM-Catalogo-14 y M-FRM-Catalogo-14: «Productos», con lo que suma la 14
# Sobre FRM-Catalogo-13, con las piezas de formularios_13_campos_1004.py y los datos de la maqueta (demo/seed/forms-catalogs.ts). «Lo usan» es
# la lista de `GET …/catalogs/{id}/used-by`: solo el nombre del formulario, paginada, sin la cantidad en el encabezado y sin la pregunta,
# que el contrato no trae. Un campo que usa la presentación propia de una pregunta no se quita (T22): «Quitar» queda grisado, con el motivo.
CAMPOS_P = [("Precio", "Número con decimales", True, False, None, "precio"), ("Unidad", "Texto", False, False, None, "unidad")]
COLUMNAS_P = ["Texto", "Código", "Detalle"] + [c[0] for c in CAMPOS_P]
DESCRIPCION_P = ["Unidad"]
PRODUCTOS = [("Arena fina", "ARE1", "32.000,00", "m³"), ("Cal hidratada x 25 kg", "CAL25", "5.200,00", "bolsa"), ("Caño PVC 110 x 4 m", "PVC110", "15.800,00", "unidad"),
             ("Cemento x 50 kg", "CEM50", "9.800,00", "bolsa"), ("Hierro del 8 x 12 m", "HIE8", "8.900,00", "barra"), ("Ladrillo hueco", "LAD12", "690,50", "unidad"),
             ("Membrana 4 mm", "MEM4", "61.500,00", "rollo"), ("Pintura látex 20 l", "PIN20", "48.900,00", "balde"), ("Tarugos del 8 x 100", "TAR8", "3.500,00", "caja"),
             ("Tornillos 6x40 x 100", "TOR640", "4.100,00", "caja")]
USAN = ["Entrega de pedido", "Visita a cliente"]
EN_USO = "El campo está en uso. Sacá esos usos para poder quitarlo."
USO_CAMPO = "«Producto» en Entrega de pedido, en la versión activa"
BAJA_TITULO, BAJA_TEXTO = "¿Dar de baja «Productos»?", "Los formularios publicados que lo usan no se van a poder mandar, y no se va a poder elegir en preguntas nuevas. Se puede reactivar desde acá."
DESC_P = "Lo que vende Grupo Delta, con su precio de lista."
ESTADOS_CAT = ["Lo usan", "Ningún formulario lo usa", "Un campo en uso", "Una opción en uso", "Dar de baja el catálogo"]
ESTADOS_TCAT = ["El catálogo", "Lo usan", "Ningún formulario lo usa", "Un campo en uso", "Dar de baja el catálogo"]
CSS_USAN = """.w-th.ku, .w-tr.ku { grid-template-columns: minmax(0, 1fr); }
.w-th .ord { margin-left: 4px; font-size: 10px; color: var(--t2); }
.w-tr.ku { min-height: 40px; }
.w-tr.ku a { color: var(--t1); font-weight: 500; text-decoration: none; }
"""
CSS_TUSAN = """.ap-acciones2 span.off { color: var(--t3); }
.ap-fila.ku { min-height: 52px; }
"""


def opciones_p(uso=False):
    filas = ""
    for k, (n, cod, precio, unidad) in enumerate(PRODUCTOS, 1):
        kw = dict(borrar=True, aviso_f="No se puede borrar: la usa un formulario. Podés darla de baja.") if uso and k == 4 else {}
        filas += K.fila_editable(k, n, cod, "", True, tabla="kf", total=len(PRODUCTOS), campos=f'<span class="k-tab">{K.entrada(precio)}</span><span class="k-tab">{K.entrada(unidad)}</span>', **kw)
    pie = '<div class="w-pie"><span>1–10 de 10</span><span>10 por página · Página 1 de 1</span></div>'
    return K.caja_opciones(filas, "", pie, modo="cambios" if uso else "normal", tabla="kf", cab=["", "#", "Texto", "Código", "Precio", "Unidad", "Detalle", "Estado", "Acciones"], ancho=T13.ANCHO_OPCIONES,
                           boton_campos=T13.boton_campos(2), columnas=True)


def caja_usan(vacia=False):
    """«Lo usan»: una fila por formulario, que lleva al formulario."""
    if vacia:
        cuerpo = '<div class="k-vacio3">Ningún formulario lo usa.</div>'
    else:
        filas = "".join(f'<div class="w-tr ku"><a href="FRM-Editor.dc.html">{n}</a></div>' for n in USAN)
        cuerpo = ('<div class="w-th ku"><span aria-sort="ascending">Formulario<span class="ord" aria-hidden="true">▲</span></span></div>' + filas
                  + f'<div class="w-pie"><span>1–{len(USAN)} de {len(USAN)}</span><span>10 por página · Página 1 de 1</span></div>')
    return f'<div class="w-caja"><div class="f-cab"><span>Lo usan</span></div>{cuerpo}</div>'


def catalogo():
    items = [(n, u) for n, _c, _p, u in PRODUCTOS[:6]]
    ejemplo = (PRODUCTOS[0][0], PRODUCTOS[0][3])

    def cuerpo(vacia=False, uso=False):
        wa = T13.caja_whatsapp(descripcion=DESCRIPCION_P, columnas=COLUMNAS_P, ejemplo=ejemplo)
        return K.cuerpo_editor(opciones_p(uso) + caja_usan(vacia), K.caja_catalogo("Productos", DESC_P), items, "Producto", debajo=wa)
    usado = '<span class="k-us">Usado en 2 formularios ·</span>'
    b = C.banda_k("Productos", usado + K.ACTIVO, K.acc_editor(), "FRM-Catalogos-14.dc.html")
    b2 = C.banda_k("Productos", usado + K.ACTIVO, K.acc_editor(cambios=True), "FRM-Catalogos-14.dc.html")
    V = {"Lo usan": (b, cuerpo()), "Ningún formulario lo usa": (C.banda_k("Productos", K.ACTIVO, K.acc_editor(), "FRM-Catalogos-14.dc.html"), cuerpo(vacia=True)),
         "Un campo en uso": (b, cuerpo()), "Una opción en uso": (b2, cuerpo(uso=True)), "Dar de baja el catálogo": (b, cuerpo())}
    assert list(V) == ESTADOS_CAT
    js = A.js_estados(ESTADOS_CAT, extra="      menuMas: false, expMas: 'false', chkTodas: '', pvCerrado: true, pvAbierto: false, pvMuchas: false, pvUna: 'on', pvVarias: '', busqueda: 'Buscar opción', busClase: '',\n")
    t = C.pagina_k("Un catálogo que usan formularios · /org/formularios/catalogos/:id", "Inicio / Formularios / Catálogos / Productos",
                   A.con_estados([(k, v[0]) for k, v in V.items()]), A.con_estados([(k, v[1]) for k, v in V.items()]),
                   F.CSS_FICHA + F.CSS_ESTADOS + F.CSS_LISTADO + F.CSS_FILTRO + A.CSS_AB + E.CSS_E12 + K.CSS_EDITOR + T13.CSS + CSS_USAN, ESTADOS_CAT, js, alto=ALTO_CATALOGO)
    t = t.replace('"$preview":{"width":1440,', '"$preview":{"width":1280,', 1)
    uso = (f'<p class="d-tx">{EN_USO}</p><div class="md-usos"><span>{USO_CAMPO}</span><a href="FRM-Editor.dc.html">Ir a la pregunta</a></div>')
    capas = {"Un campo en uso": F.dialogo("Quitar «Precio»", uso, '<button type="button" class="cb cb-sec">Cerrar</button>'),
             "Dar de baja el catálogo": A.confirmar(BAJA_TITULO, BAJA_TEXTO, "Dar de baja")}
    over = "".join(f'<sc-if value="{{{{s{ESTADOS_CAT.index(k)}}}}}" hint-placeholder-val="{{{{no}}}}">{h}</sc-if>' for k, h in capas.items())
    return F.con_dialogo(t, over, T13.CSS_CAMPOS)


def tel_catalogo():
    der = (f'<button type="button" class="ap-ib" aria-label="Así lo ve quien lo recibe">{F.OJO}</button>'
           f'<button type="button" class="ap-ib" aria-label="Más acciones">{F.TKEBAB}</button>')
    volver = "M-FRM-Catalogos-14.dc.html"
    botones = f'<div class="k-ops-b"><a class="cb cb-sec" href="#">Agregar opción</a><a class="cb cb-sec" href="{T13.DESTINO_T}">Agregar campos<span class="k-cont">2</span></a></div>'
    arriba = (C.t_bar("Productos", "Usado en 2 formularios · Activo", volver, der) + '<div class="ap-cuerpo"><div class="ap-gtit">El catálogo</div><div class="f-campos">'
              + K.tel_de() + F.tcampo("Nombre", "Productos", req=True) + F.tcampo("Descripción", DESC_P) + "</div>"
              + T13.tel_wa(T13.TITULO_WA, DESCRIPCION_P, (PRODUCTOS[0][0], PRODUCTOS[0][3])) + '<div style="height: 20px;"></div></div>')

    def usan(vacia=False):
        """La pantalla ya bajada hasta «Lo usan», la última sección, como en M-FRM-Editor."""
        filas = ('<div class="t-vacia">Ningún formulario lo usa.</div>' if vacia else
                 "".join(f'<a class="ap-fila ku" href="M-FRM-Editor.dc.html"><div class="tx"><span class="l1">{n}</span></div></a>' for n in USAN))
        opciones = "".join(K.q_opcion(k, n, cod, "", True, len(PRODUCTOS)) for k, (n, cod, _p, _u) in enumerate(PRODUCTOS[:3], 1))
        return (C.t_bar("Productos", "Activo" if vacia else "Usado en 2 formularios · Activo", volver, der) + f'<div class="ap-cuerpo"><div class="ap-gtit">Opciones</div>{botones}<div class="ap-grupo">{opciones}</div>'
                + f'<div class="ap-gtit">Lo usan</div><div class="ap-grupo">{filas}</div><div style="height: 20px;"></div></div>')
    Cu = {"El catálogo": arriba, "Lo usan": usan(), "Ningún formulario lo usa": usan(True), "Un campo en uso": arriba, "Dar de baja el catálogo": arriba}
    capas = {
        "Un campo en uso": F.thoja("Quitar «Precio»", f'<p style="margin: 0; font-size: 15px; line-height: 1.45; color: var(--t2);">{EN_USO} {USO_CAMPO}.</p>',
                                   '<a class="cb cb-pri" href="M-FRM-Editor.dc.html">Ir a la pregunta</a><button type="button" class="cb cb-sec">Cerrar</button>'),
        "Dar de baja el catálogo": F.thoja(BAJA_TITULO, f'<p style="margin: 0; font-size: 15px; line-height: 1.45; color: var(--t2);">{BAJA_TEXTO}</p>',
                                           '<button type="button" class="cb cb-pel lleno">Dar de baja</button><button type="button" class="cb cb-sec">Cancelar</button>'),
    }
    return C.tel_pagina(Cu, ESTADOS_TCAT, capas, "Un catálogo que usan formularios · teléfono", E.CSS_E12 + K.CSS_T12 + T13.CSS_TWA + CSS_TUSAN)


# ================================================================ canvas.json
ALTO_CATALOGO = 1700
NUEVOS = {"FRM-Editor-18": (1440, 1400, "Formularios · un formulario · Diseño · etapa 18"),
          "M-FRM-Editor-18": (390, 844, "Formularios · un formulario · Diseño · teléfono · etapa 18"),
          "FRM-Publicar-18": (1440, 1400, "Formularios · publicar · etapa 18"),
          "WA-Chats-Respuesta-18": (1440, 900, "WhatsApp · Internos · la respuesta · etapa 18"),
          "M-WA-Conversacion-Respuesta-18": (390, 844, "WhatsApp · Internos · la respuesta · teléfono · etapa 18"),
          "WA-Mensajes-14": (1440, 900, "Perfil personal · Mensajes · una respuesta propia · etapa 14"),
          "M-WA-Mensaje-14": (390, 844, "Mensajes · conversación · teléfono · etapa 14"),
          "FRM-Catalogo-14": (1280, ALTO_CATALOGO, "Formularios · catálogo escrito a mano · lo usan · a 1280 · etapa 14"),
          "M-FRM-Catalogo-14": (390, 844, "Catálogo escrito a mano · lo usan · teléfono · etapa 14"),
          # Los arma campana_1004.py; se registran acá para que formularios_etapas_1004.py los ubique en su fila
          "Campana-14": (1440, 900, "Avisos · la campana · etapa 14"),
          "M-Campana-14": (390, 844, "Avisos · la campana · teléfono · etapa 14")}
TOCADOS = ["FRM-Editor", "M-FRM-Editor", "FRM-Publicar", "FRM-Publicando", "WA-Chats-Formulario", "WA-Chats-Respuesta", "M-WA-Conversacion-Respuesta",
           "M-WA-Chats-Formulario", "WA-Chats-Formulario-Cliente", "M-WA-Chats-Formulario-Cliente"]


def registrar():
    ruta = PROJ / "canvas.json"
    c = json.loads(ruta.read_text(encoding="utf-8"))
    b = c["boards"]
    for n, (w, h, titulo) in NUEVOS.items():
        v = b.setdefault(f"{n}.dc.html", {"x": 0, "y": 0, "is_interactive": True})
        v.update(w=w, h=h, page="formularios", title=titulo)
    for n in TOCADOS + list(NUEVOS):
        v = b[f"{n}.dc.html"]
        v["title"] = v["title"].replace(PARA_APROBAR, "") + ("" if APROBADO else PARA_APROBAR)
    ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    panel_e16 = re.search(r'<style data-e16="panel">\n(.*?)</style>', leer("FRM-Catalogos"), re.S)
    E.R.CSS_PANEL_E16 = panel_e16.group(1) if panel_e16 else ""
    E.CON_TITULOS = True  # 88: desde acá, los tableros de la 14, y también los de la 18 (traspaso 10)
    escribir("FRM-Editor-18", solo(E.post("FRM-Editor", E.editor(), 1400), EDITOR_18))
    # El teléfono, sin las reglas que le suma formularios_ab_reglas_1004.py (son de la 21)
    escribir("M-FRM-Editor-18", solo(E.post("M-FRM-Editor", E.tel_editor()), TEL_18))
    escribir("FRM-Publicar-18", solo(E.post("FRM-Publicar", E.publicar(), 1400), PUBLICAR_18))
    escribir("FRM-Editor", sin_kebab(sin(E.post("FRM-Editor", E.editor(), 1400), EDITOR_17 + EDITOR_18)))
    escribir("M-FRM-Editor", E.post("M-FRM-Editor", tel_editor()))  # 175: con su ⋮, que trae «Ver vista oficial»
    escribir("FRM-Publicar", sin_kebab(sin(E.post("FRM-Publicar", E.publicar(), 1400), PUBLICAR_18)))
    escribir("FRM-Publicando", sin_kebab(E.post("FRM-Publicando", publicando(), 1400)))
    escribir("FRM-Vista-Oficial", sin_kebab(E.post("FRM-Vista-Oficial", vista_oficial())))  # 176, nuevo
    escribir("M-FRM-Vista-Oficial", E.post("M-FRM-Vista-Oficial", tel_vista_oficial()))
    E.CON_TITULOS = False
    for n, t in (("WA-Chats-Respuesta", E.chat_respuesta()), ("M-WA-Conversacion-Respuesta", E.tel_respuesta())):
        t = E.post(n, t)
        escribir(f"{n}-18", solo(t, RESPUESTA_18))
        escribir(n, sin(t, RESPUESTA_18))
    escribir("WA-Mensajes-14", mis_mensajes(F.leer_antes_del_bloque0("WA-Mensajes"), "w-m"))
    escribir("M-WA-Mensaje-14", mis_mensajes(F.leer_antes_del_bloque0("M-WA-Mensaje"), "ap-m"))
    # E.post acorta «Número con decimales» en las preguntas; un campo de catálogo conserva su tipo (13-campos.md)
    escribir("FRM-Catalogo-14", E.post("FRM-Catalogo-14", catalogo()).replace('<span class="k-in sel"><span>Número</span>', '<span class="k-in sel"><span>Número con decimales</span>'))
    escribir("M-FRM-Catalogo-14", E.post("M-FRM-Catalogo-14", tel_catalogo()))
    # Enviar un formulario desde Internos, con elegir otro formulario (165); los de Clientes que arma formularios_e12_sin_idioma_1004.py, con su mensaje
    escribir("WA-Chats-Formulario", E.post("WA-Chats-Formulario", chat_enviar()))
    escribir("M-WA-Chats-Formulario", E.post("M-WA-Chats-Formulario", tel_chat_enviar()))
    for n in ("WA-Chats-Formulario-Cliente", "M-WA-Chats-Formulario-Cliente"):
        escribir(n, con_mensaje_cliente(leer(n)))
    for n in ("FRM-Editor", "M-FRM-Editor", "FRM-Publicar", "FRM-Publicando", "FRM-Vista-Oficial", "M-FRM-Vista-Oficial"):
        comprobar(n, leer(n), ["Dar de baja", "Fotos de la visita", "Remito firmado", "Cuando llega una respuesta", "Más de 10 archivos", "Consultar ahora", "Ver los pasos"] + RELATIVAS)
    for n in ("WA-Chats-Formulario", "M-WA-Chats-Formulario", "WA-Chats-Formulario-Cliente", "M-WA-Chats-Formulario-Cliente", "WA-Chats-Respuesta",
              "M-WA-Conversacion-Respuesta", "WA-Mensajes-14", "M-WA-Mensaje-14"):
        comprobar(n, leer(n), RELATIVAS + ["Completá este formulario, por favor."])
    if "--sin-canvas" not in sys.argv:  # para correrlo sobre el lienzo sin tocar canvas.json
        registrar()
    print("listo", list(NUEVOS))
