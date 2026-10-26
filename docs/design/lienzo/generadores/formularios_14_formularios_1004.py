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
import formularios_e12_sin_idioma_1004 as E  # noqa: E402
import formularios_lista_y_ficha_1004 as L  # noqa: E402

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
    (PROJ / f"{n}.dc.html").write_text(L.sin_disenar(n, fechas(t)), encoding="utf-8")


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
    ("guardó este formulario hace 2 minutos.", f"guardó este formulario el {HOY} 10:46."), ("Hoy, 15:20", f"{HOY} 15:20"),
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
    """Después de «Gracias, paso a las 17.»: La Clementina le manda un formulario y la persona ve su respuesta."""
    card = f'<span class="c-card"><span class="ic">{F.ICONO}</span><span class="t"><b>Retiro de pedido</b><small>Formulario</small></span></span>'
    grilla = '<div class="r-gr">' + "".join(f'<span class="k">{k}</span><span class="v">{v}</span>' for k, v in VALORES_MM) + "</div>"
    nuevo = (f'<div class="{clase} ent"><span class="gl">Completá este formulario, por favor.{card}</span><span class="pie">La Clementina · 17:10</span></div>'
             f'<div class="{clase} sal"><span class="gl r-gl"><span class="r-cab">{F.ICONO}<b>Retiro de pedido</b><small>Tu respuesta</small></span>{grilla}'
             f'<div class="r-ok">{A.TILDE} Guardada como <b>RET-000018</b></div></span><span class="pie">17:12</span></div>')
    assert ULTIMO in t
    t = t.replace(ULTIMO, ULTIMO + nuevo)
    t = t.replace("Vos: Gracias, paso a las 17.", "Vos: Respondiste Retiro de pedido")
    t = re.sub(r'(<b>La Clementina</b><span>)10:42(</span>)', r"\g<1>17:12\2", t)
    return t.replace("</helmet>", f'<style data-e14="mis-mensajes">\n{CSS_MM}</style>\n</helmet>', 1)


# ================================================================ canvas.json
NUEVOS = {"FRM-Editor-18": (1440, 1400, "Formularios · un formulario · Diseño · etapa 18"),
          "M-FRM-Editor-18": (390, 844, "Formularios · un formulario · Diseño · teléfono · etapa 18"),
          "FRM-Publicar-18": (1440, 1400, "Formularios · publicar · etapa 18"),
          "WA-Chats-Respuesta-18": (1440, 900, "WhatsApp · Internos · la respuesta · etapa 18"),
          "M-WA-Conversacion-Respuesta-18": (390, 844, "WhatsApp · Internos · la respuesta · teléfono · etapa 18"),
          "WA-Mensajes-14": (1440, 900, "Perfil personal · Mensajes · una respuesta propia · etapa 14"),
          "M-WA-Mensaje-14": (390, 844, "Mensajes · conversación · teléfono · etapa 14")}
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
    editor = E.post("FRM-Editor", E.editor(), 1400)
    escribir("FRM-Editor-18", solo(editor, EDITOR_18))
    escribir("FRM-Editor", sin_kebab(sin(editor, EDITOR_17 + EDITOR_18)))
    # El teléfono, sin las reglas que le suma formularios_ab_reglas_1004.py (son de la 21)
    tel = E.post("M-FRM-Editor", E.tel_editor())
    escribir("M-FRM-Editor-18", solo(tel, TEL_18))
    escribir("M-FRM-Editor", sin_kebab(sin(tel, EDITOR_17 + TEL_18)))
    publicar = E.post("FRM-Publicar", E.publicar(), 1400)
    escribir("FRM-Publicar-18", solo(publicar, PUBLICAR_18))
    escribir("FRM-Publicar", sin_kebab(sin(publicar, PUBLICAR_18)))
    escribir("FRM-Publicando", sin_kebab(E.post("FRM-Publicando", E.publicando(), 1400)))
    for n, t in (("WA-Chats-Respuesta", E.chat_respuesta()), ("M-WA-Conversacion-Respuesta", E.tel_respuesta())):
        t = E.post(n, t)
        escribir(f"{n}-18", solo(t, RESPUESTA_18))
        escribir(n, sin(t, RESPUESTA_18))
    escribir("WA-Mensajes-14", mis_mensajes(leer("WA-Mensajes"), "w-m"))
    escribir("M-WA-Mensaje-14", mis_mensajes(leer("M-WA-Mensaje"), "ap-m"))
    # Los chats de la 14 que arma formularios_e12_sin_idioma_1004.py: solo las fechas (se puede volver a correr)
    for n in ("WA-Chats-Formulario", "M-WA-Chats-Formulario", "WA-Chats-Formulario-Cliente", "M-WA-Chats-Formulario-Cliente"):
        escribir(n, leer(n))
    for n in ("FRM-Editor", "M-FRM-Editor", "FRM-Publicar", "FRM-Publicando"):
        comprobar(n, leer(n), ["Dar de baja", "Fotos de la visita", "Remito firmado", "Cuando llega una respuesta", "Más de 10 archivos"] + RELATIVAS)
    for n in ("WA-Chats-Formulario", "M-WA-Chats-Formulario", "WA-Chats-Formulario-Cliente", "M-WA-Chats-Formulario-Cliente", "WA-Chats-Respuesta",
              "M-WA-Conversacion-Respuesta", "WA-Mensajes-14", "M-WA-Mensaje-14"):
        comprobar(n, leer(n), RELATIVAS)
    registrar()
    print("listo", list(NUEVOS))
