"""La etapa 18, fotos y documentos (18-fotos-y-documentos.md del back), con el armado real de ArquitecturaBaseFront: lo que suma a la planilla, la vista rápida,
la pantalla completa y dar de baja, y los archivos del chat, que allá no existen. Salen de los tableros aprobados de la 15 y la 17, y muestran solo lo que existe
hasta la 18 (78): sin aprobación, estado, PDF, «Cargar» ni asistente. El editor, publicar, la tarjeta y el visor siguen en `formularios_ab_1004.py`.
Desde la v163 (traspaso 5), la planilla, el detalle y los teléfonos usan las piezas nuevas de la 15: un solo «Filtros», en el que las fotos y los documentos
no entran (143), el detalle alineado (139) y la actividad en columnas.
Con el traspaso 10, el visor del chat (`WA-Chats-Visor` y su teléfono) toma el mensaje que nombra el formulario (165); el editor, publicar y la tarjeta
de la 18 los arma `formularios_14_formularios_1004.py`, con «Agregar título» (88).

Corre después de `formularios_16_personas_1004.py` y antes de `formularios_etapas_1004.py`. Se puede volver a correr.
"""
import json
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import formularios_1004 as F  # noqa: E402
import formularios_ab_1004 as A  # noqa: E402
import formularios_ab_catalogos_1004 as C  # noqa: E402
import formularios_ab_planilla_1004 as P  # noqa: E402
import formularios_e12_sin_idioma_1004 as E  # noqa: E402
import formularios_e12b_ciclo_de_vida_1004 as B  # noqa: E402
import formularios_lista_y_ficha_1004 as L  # noqa: E402
import formularios_15_respuestas_1004 as R  # noqa: E402

PROJ = F.PROJ
svg, CHEV, ARCHIVO, TILDE, ALERTA = F.svg, F.CHEV, P.ARCHIVO, A.TILDE, A.ALERTA
CLIP = A.CLIP
PLAY = svg('<path d="M8 5.5v13l10.5-6.5z"/>', 16)
CAMARA_T = svg('<rect x="3.5" y="6.5" width="17" height="13" rx="2"/><circle cx="12" cy="13" r="3.5"/><path d="M9 6.5 10.2 4h3.6L15 6.5"/>', 16)

# ================================================================ Los datos
# La planilla de la 18 con las preguntas de archivo a la vista: la versión 4 las suma, y las de antes dicen «—» (la pregunta no existía)
COLS = [("num", "N°", 112, ""), ("rec", "Recibida", 136, ""), ("quien", "Cargó", 170, ""), ("cli", "Cliente", 160, ""), ("fot", "Fotos de la visita", 140, ""),
        ("rem", "Remito firmado", 130, ""), ("mot", "Motivo", 120, ""), ("obs", "Observaciones", 240, "")]
ARCHIVOS = {"VIS-000130": (2, "1 PDF"), "VIS-000129": (3, None), "VIS-000128": (1, "1 PDF"), "VIS-000127": (2, None), "VIS-000126": (2, "1 PDF")}
FOTOS_F = "Fotos de la visita"
VALORES = [(k, v) for k, v in R.VALORES_126[:5]] + [(FOTOS_F, A.thumbs(2)), ("Remito firmado", A.doc_chip())] + R.VALORES_126[5:]
CONSERVA = "Se conservan las 24 respuestas, con sus fotos y documentos"
AYUDA_EXCEL = "De las fotos y los documentos va la cantidad y los nombres, sin los archivos."
CSS_18 = """.pl-arch { display: flex; align-items: center; gap: 8px; min-width: 0; }
.pl-arch .r-th { width: 30px; height: 30px; border-radius: 5px; }
.pl-arch svg { flex: none; color: var(--t3); }
.ex-tit { position: relative; display: inline-flex; align-items: center; width: fit-content; }
.ex-tip { top: 50%; left: calc(100% + 10px); right: auto; transform: translateY(-50%); width: 270px; white-space: normal; line-height: 1.35; }
.ex-tip::before { top: calc(50% - 4px); left: -4px; right: auto; }
.d2-fotos { display: flex; flex-wrap: wrap; gap: 8px; }
.d2-fotos .r-th { width: 96px; height: 96px; }
.g-det .r-ths { margin: 2px 0; }
"""


def c_fotos(n):
    return f'<span class="pl-arch"><span class="r-th" role="img" aria-label="Ver las fotos"></span>{n} {"foto" if n == 1 else "fotos"}</span>'


def c_doc(texto):
    return f'<span class="pl-arch">{ARCHIVO}{texto}</span>'


def celda(k, r):
    if k not in ("fot", "rem"):
        return R.celda(k, r)
    fotos, doc = ARCHIVOS.get(r[0], (None, None))
    if r[12] < 4:
        return f"<span>{R.gris('—')}</span>"
    if k == "fot":
        return c_fotos(fotos) if fotos else f"<span>{R.gris('Sin respuesta')}</span>"
    return c_doc(doc) if doc else f"<span>{R.gris('Sin respuesta')}</span>"


def tabla(sel=None):
    filas = "".join(f'<div class="w-tr pl{" sel" if r[0] == sel else ""}">' + "".join(celda(k, r) for k, *_ in COLS) + "</div>" for r in R.RESP)
    return (f'<div class="w-caja pl-caja" style="--pl-cols: {R.plantilla(COLS)};"><div class="pl-scroll">{R.cabecera(COLS)}{filas}</div>'
            '<div class="w-pie"><span>1–10 de 24</span><span>10 por página · Página 1 de 3</span></div></div>')


def fondo(sel=None, modo="normal"):
    """La barra de la 15 (143 y 144): las preguntas de archivo no entran en «Filtros»."""
    return R.CUERPO.format(R.barra5(modo) + tabla(sel))


def dlg_exportar():
    t = R.dlg_exportar().replace("4 respuestas", "24 respuestas").replace("3 filtros aplicados", "0 filtros aplicados")
    m = re.search(r'(<span class="ex-tit">Columnas a exportar)<span class="f-i"[^>]*>.*?</span>(</span>)', t, re.S)
    return t[:m.start()] + m.group(1) + F.info(AYUDA_EXCEL) + f'<span class="e-tip ex-tip" role="tooltip">{AYUDA_EXCEL}</span>' + m.group(2) + t[m.end():]


# ================================================================ FRM-Respuestas-18
ESTADOS_PL = ["Planilla", "Ver las fotos", "Filtros", "Exportar"]


def respuestas():
    capas = A.con_estados([("Planilla", ""), ("Ver las fotos", A.dlg_visor(0)), ("Filtros", ""), ("Exportar", dlg_exportar())])
    cuerpo = A.con_estados([(e, fondo(modo="filtros-inicio" if e == "Filtros" else "normal")) for e in ESTADOS_PL])
    bnd = A.con_estados([(e, R.banda(ac=R.EXPORTAR)) for e in ESTADOS_PL])
    t = R.pagina("Respuestas · /org/formularios/:id/respuestas · etapa 18", bnd, cuerpo, ESTADOS_PL,
                 css=C.CSS_K2 + P.CSS_EX + R.CSS_EX2 + A.CSS_ARCH + A.CSS_VISOR + R.CSS_T5 + CSS_18)
    t = F.con_dialogo(t, capas)
    return enlaces(t)


def enlaces(t):
    """Desde la planilla de la 18 se sigue por los tableros de la 18."""
    for a, b in [("FRM-Respuesta.dc.html", "FRM-Respuesta-18.dc.html"), ("FRM-Respuesta-Completa.dc.html", "FRM-Respuesta-Completa-18.dc.html"),
                 ("FRM-Respuestas-Filtros.dc.html", "FRM-Respuestas-18.dc.html"), ("FRM-Respuestas-Exportar.dc.html", "FRM-Respuestas-18.dc.html"),
                 ("FRM-Respuestas.dc.html", "FRM-Respuestas-18.dc.html"), ("WA-Chats-Respuesta.dc.html", "WA-Chats-Respuesta-18.dc.html"),
                 ("M-FRM-Respuesta.dc.html", "M-FRM-Respuesta-18.dc.html"), ("M-WA-Conversacion-Respuesta.dc.html", "M-WA-Conversacion-Respuesta-18.dc.html")]:
        t = t.replace(f'"{a}"', f'"{b}"')
    return t


# ================================================================ FRM-Respuesta-18: la vista rápida, con «Fotos»
ESTADOS_D = ["Respuesta", "Fotos", "Ver una foto"]
TAB = '<span role="tab" class="on">Respuesta</span>'


def d2(fotos=False):
    t = R.d3(valores=VALORES)  # el detalle alineado de la 15 (139)
    assert t.count(TAB) == 1
    if not fotos:
        return t.replace(TAB, TAB + '<span role="tab">Fotos <span class="c">2</span></span>')
    t = t.replace(TAB, '<span role="tab">Respuesta</span><span role="tab" class="on">Fotos <span class="c">2</span></span>')
    i = t.index('<div class="d2-b">') + len('<div class="d2-b">')
    j = t.index('</div><div class="d2-pie">')
    return t[:i] + '<div class="d2-fotos"><span class="r-th" role="img" aria-label="Ver frente-local.jpg"></span><span class="r-th b" role="img" aria-label="Ver gondola.jpg"></span></div>' + t[j:]


def detalle():
    capas = A.con_estados([("Respuesta", d2()), ("Fotos", d2(True)), ("Ver una foto", d2(True) + A.dlg_visor(0))])
    cuerpo = A.con_estados([(e, fondo("VIS-000126")) for e in ESTADOS_D])
    bnd = A.con_estados([(e, R.banda(ac=R.EXPORTAR)) for e in ESTADOS_D])
    t = R.pagina("Respuesta · /org/formularios/:id/respuestas?respuesta=VIS-000126 · etapa 18", bnd, cuerpo, ESTADOS_D,
                 css=F.CSS_GRILLA + P.CSS_D2 + R.CSS_DET + R.CSS_D3 + R.CSS_T5 + ".d2-h a.nv { text-decoration: none; }\n.o-tabs .c { margin-left: 4px; font-size: 12px; color: var(--t3); }\n"
                 + A.CSS_ARCH + A.CSS_VISOR + CSS_18)
    return enlaces(F.con_dialogo(t, capas))


# ================================================================ FRM-Respuesta-Completa-18: suma «Descargar ▾», con los documentos
ESTADOS_C = ["Respuesta", "Descargar: menú"]


def boton_descargar(abierto=False):
    menu = '<div class="f-menu" role="menu" aria-label="Descargar"><span class="f-mi" role="menuitem">remito-0810.pdf</span></div>' if abierto else ""
    return (f'<span class="e-kw"><button type="button" class="cb cb-sec" aria-haspopup="menu" aria-expanded="{"true" if abierto else "false"}">Descargar {CHEV}</button>{menu}</span>')


def completa():
    def banda(abierto):
        t = R.rc_banda(pos="2 de 4")
        return t.replace("Abrir conversación</a>", "Abrir conversación</a>" + boton_descargar(abierto), 1)
    # la actividad en columnas fijas, como la 15 (139); las dos secciones abiertas, sin plegar (163 y 164, traspaso 10)
    cuerpo = R.CUERPO.format(R.rc_seccion("Respuesta", F.grilla(VALORES), "9 preguntas · 9 respondidas", True, plegable=False)
                             + R.rc_seccion("Actividad", R.actividad4(R.ACT4_126), "Recibida el 13/10/2026 15:30", True, plegable=False))
    t = R.pagina("Respuesta · /org/formularios/:id/respuestas/:recordId/completa · etapa 18", A.con_estados([(e, banda(e != "Respuesta")) for e in ESTADOS_C]),
                 A.con_estados([(e, cuerpo) for e in ESTADOS_C]), ESTADOS_C, css=F.CSS_GRILLA + R.CSS_RC + R.CSS_RC_FIJA + R.CSS_D3 + A.CSS_ARCH + CSS_18)
    return enlaces(t)


# ================================================================ FRM-Dar-De-Baja-18
def dar_de_baja():
    antes = E.CON_TITULOS
    E.CON_TITULOS = True  # 88 (v169): el editor de atrás, con «Agregar título» y su título, como desde la 14
    try:
        t = B.dar_de_baja()
    finally:
        E.CON_TITULOS = antes
    assert "Se conservan las 24 respuestas" in t
    t = t.replace("Se conservan las 24 respuestas", CONSERVA)
    return L.sin_estados(t, [e for e in B.ESTADOS_BAJA if e != "Con envíos abiertos"])


# ================================================================ Los teléfonos de la planilla y la respuesta
def tel_respuestas():
    t = R.tel_respuestas5()
    for n, (f, d) in ARCHIVOS.items():
        texto = " · ".join(x for x in [f"{f} {'foto' if f == 1 else 'fotos'}", d] if x)
        # en cada estado que muestra la lista (también detrás de «Exportar»)
        t, cuantas = re.subn(rf'({n}<span class="hr">.*?<span class="l3">[^<]*)(</span>)', lambda m: m.group(1) + " · " + texto + m.group(2), t, flags=re.S)
        assert cuantas >= 1, n
    # Exportar, con los datos de la compu (109, v169): lo que va de las fotos y los documentos, en la (i) de las columnas
    todas = '<span class="t-lin">Todas las preguntas (13 columnas)</span>'
    assert t.count(todas) == 1
    t = t.replace(todas, todas.replace("</span>", A.t_info(AYUDA_EXCEL) + "</span>"))
    t = L.sin_estados(t, [e for e in R.ESTADOS_TPL5 if e not in ("Respuestas", "Filtros", "Exportar")])
    return enlaces(re.sub(r"<title>[^<]*</title>", "<title>Respuestas · teléfono · etapa 18</title>", t))


def tel_respuesta():
    viejos = R.VALORES_126
    R.VALORES_126 = VALORES
    try:
        t = R.tel_respuesta5()
    finally:
        R.VALORES_126 = viejos
    t = t.replace("7 preguntas · 7 respondidas", "9 preguntas · 9 respondidas")
    t = L.sin_estados(t, [e for e in R.ESTADOS_TR5 if e != "Respuesta"])  # sin «Las dos plegadas» (163 y 164)
    t = L.con_css(t, "e18", A.CSS_ARCH + ".tr-gr .r-doc { display: grid; grid-template-columns: auto minmax(0, 1fr); }\n.tr-gr .r-doc .cb { grid-column: 1 / -1; height: 36px; }\n.tr-gr .r-doc .t { overflow-wrap: anywhere; }\n")
    return enlaces(re.sub(r"<title>[^<]*</title>", "<title>Respuesta · teléfono · etapa 18</title>", t))


# ================================================================ WA-Chats-Adjuntos: los archivos del chat (48), en un chat de Clientes
E_ADJ = ["Lo que llega", "Antes de mandar", "Una foto, con un texto", "Demasiado grande", "Enviando", "Enviado", "No se pudo", "Fuera de las 24 horas"]
FOTO_MB = "Una foto puede pesar hasta 5 MB. Esta pesa 7,2 MB."
FUERA = "Pasaron 24 horas desde su último mensaje."
CSS_ADJ = """.ad-foto { display: block; width: 240px; height: 170px; border-radius: 8px;
  background: linear-gradient(180deg, oklch(0.85 0.04 240) 0 18%, transparent 18%), linear-gradient(180deg, transparent 82%, oklch(0.65 0.01 150) 82%),
  repeating-linear-gradient(90deg, oklch(0.82 0.04 75) 0 18px, oklch(0.6 0.05 60) 18px 36px); }
.ad-vid { position: relative; display: flex; align-items: center; justify-content: center; width: 240px; height: 140px; border-radius: 8px; background: oklch(0.3 0.015 150); color: #fff; }
.ad-vid small { position: absolute; right: 8px; bottom: 6px; font-size: 12px; }
.ad-aud { display: flex; align-items: center; gap: 10px; min-width: 240px; }
.ad-aud .pl { width: 32px; height: 32px; border: 0; border-radius: 50%; background: var(--marca); color: #fff; display: inline-flex; align-items: center; justify-content: center; }
.ad-aud .br { flex: 1; height: 4px; border-radius: 2px; background: var(--s3); }
.ad-aud small { font-size: 12.5px; color: var(--t3); font-variant-numeric: tabular-nums; }
.ad-tx { display: block; margin-top: 6px; }
.ad-baja { display: inline-flex; align-items: center; gap: 8px; color: var(--t2); font-size: 14px; }
.ad-sin { display: inline-flex; align-items: center; gap: 8px; color: var(--t2); font-style: italic; }
.w-m .gl .r-doc { min-width: 300px; }
.ad-clip { flex: none; }
.ad-prev { display: flex; flex-direction: column; gap: 12px; }
.ad-prev .ad-foto { width: 100%; height: 220px; }
.ad-arch { display: flex; align-items: center; gap: 10px; }
.ad-arch .t { display: flex; flex-direction: column; font-size: 14px; line-height: 1.35; }
.ad-arch small { font-size: 12.5px; color: var(--t3); }
.ad-err { font-size: 13px; color: var(--peligro); }
.e-tipw { position: relative; display: inline-flex; flex: none; }
.e-tip { position: absolute; z-index: 30; left: 0; bottom: calc(100% + 8px); padding: 6px 10px; border-radius: 6px; background: oklch(0.27 0.012 78); color: #fff; font-size: 12.5px; font-weight: 500; white-space: nowrap; }
.e-tip::before { content: ""; position: absolute; left: 14px; bottom: -4px; width: 8px; height: 8px; background: inherit; transform: rotate(45deg); }
.ad-clip[aria-disabled="true"] { opacity: 0.45; }
"""


def ent(cuerpo, hora="10:43", sin_globo=False):
    return f'<div class="w-m ent"><span class="gl">{cuerpo}</span><span class="pie">{hora}</span></div>'


def sal(cuerpo, pie, clase=""):
    return f'<div class="w-m sal"><span class="gl">{cuerpo}</span><span class="pie {clase}">{pie}</span></div>'


def foto():
    return '<span class="ad-foto" role="img" aria-label="Ver frente-del-local.jpg"></span>'


def llega():
    return (ent(foto() + '<span class="ad-tx">Así quedó la entrada.</span>', "10:42")
            + ent(f'<span class="ad-aud"><button type="button" class="pl" aria-label="Escuchar el audio">{PLAY}</button><span class="br"></span><small>0:14</small></span>', "10:43")
            + ent(f'<span class="ad-vid" role="img" aria-label="Ver el video">{PLAY}<small>0:32</small></span>', "10:43")
            + ent(A.doc_chip("lista-de-precios.pdf", "2,4 MB"), "10:44")
            + ent(f'<span class="ad-baja">{A.RELOJ14} Bajando la foto…</span>', "10:44")
            + ent(f'<span class="ad-sin">{ARCHIVO} Mandó un documento</span>', "10:45"))


def sin_bajar(doc):
    """Lo que no salió no se descarga."""
    return re.sub(r'<button type="button" class="cb cb-sec"[^>]*>Descargar</button>', "", doc)


def boton_clip(apagado=False, tip=False):
    if not apagado:
        return f'<button type="button" class="o-nt ad-clip" aria-label="Adjuntar un archivo" title="Adjuntar un archivo">{CLIP}</button>'
    b = f'<button type="button" class="o-nt ad-clip" aria-label="Adjuntar un archivo" aria-disabled="true" title="{FUERA}">{CLIP}</button>'
    return f'<span class="e-tipw">{b}<span class="e-tip" role="tooltip">{FUERA}</span></span>' if tip else b


def escritura(apagado=False):
    t = A.escr("off", FUERA, "Pasaron 24 horas", cerrada=True) if apagado else A.escr()
    return re.sub(r'(<span class="area[^"]*">)', lambda m: boton_clip(apagado, apagado) + m.group(1), t, count=1)


NOTA_RE = re.compile(r'<button type="button" class="o-nt" aria-label="Nota interna"[^>]*>.*?</button>', re.S)
NOTA_TEL_RE = re.compile(r'<button type="button" class="ap-red nt" aria-label="Nota interna"[^>]*>.*?</button>', re.S)


def con_clip(t, tel=False):
    """78 (v169): un chat de la 18 con el clip al lado de «Nota interna», en cada estado, como WA-Chats-Adjuntos y su teléfono."""
    clip = f'<button type="button" class="ap-red nt" aria-label="Adjuntar un archivo">{CLIP}</button>' if tel else boton_clip()
    t, n = (NOTA_TEL_RE if tel else NOTA_RE).subn(lambda m: m.group(0) + clip, t)
    assert n, "sin «Nota interna»"
    return t if tel else L.con_css(t, "clip", ".ad-clip { flex: none; }\n")


def dlg_mandar(modo="documento"):
    es_foto = modo in ("foto", "grande")
    nombre, peso = ("frente-del-local.jpg", "7,2 MB" if modo == "grande" else "3,4 MB") if es_foto else ("presupuesto-octubre.pdf", "1,8 MB")
    vista = (foto() if es_foto else "") + f'<div class="ad-arch">{"" if es_foto else A.doc_chip_icono()}<span class="t">{nombre}<small>{peso}</small></span></div>'
    err = f'<span class="ad-err" role="alert">{FOTO_MB}</span>' if modo == "grande" else ""
    escrito = {"documento": "Te paso el presupuesto de octubre.", "enviando": "Te paso el presupuesto de octubre.", "foto": "Así quedó la entrega."}.get(modo)
    texto = f'<div class="w-cmp"><span class="rt">Texto</span><div class="ct{"" if escrito else " ph"}">{escrito or "Opcional"}</div></div>'
    g = modo == "enviando"
    d = " disabled" if g else ""
    boton = E.trabaja("Enviando…") if g else f'<button type="button" class="cb cb-pri"{" disabled" if modo == "grande" else ""}>Enviar</button>'
    return F.dialogo("Mandar un archivo a Martina López", f'<div class="ad-prev">{vista}{err}{texto}</div>', f'<button type="button" class="cb cb-sec"{d}>Cancelar</button>{boton}')


def a_clientes(t, tel=False):
    """El marco de los chats de Internos, en un chat de Clientes."""
    pares = [("<b>Tomás Acosta</b><span>{{hora}}</span>", "<b>Martina López</b><span>{{hora}}</span>"), ('<span class="w-av">TA</span>', '<span class="w-av">ML</span>'),
             ("Carga de pedidos · Lucía Fernández", "Ventas · Lucía Fernández"), ("<b>Martín Paz</b>", "<b>Romi Castro</b>"), ('<span class="w-av">MP</span>', '<span class="w-av">RC</span>'),
             ("Mañana paso por el depósito.", "Quiero consultar un pedido."), ("<span>Ayer</span>", "<span>12/10/2026 18:30</span>"),
             ("<b>Tomás Acosta</b><span>011 15-5555-4521 · Empleado · Delta S.A.</span>", "<b>Martina López</b><span>011 15-5555-6203 · Vinculada a su cuenta · Mayorista</span>"),
             ("Acciones de Tomás Acosta", "Acciones de Martina López"),
             ("Hola, Lucía. Ya terminé la visita en Ferretería Rosales.", "Hola, buen día. Les mando lo del pedido."),
             ("Genial, Tomás. Te mando el formulario de la visita.", "Hola, Martina. Dale, te leo."),
             ('role="radio" aria-checked="false">Clientes <span class="c">5</span></span><span class="on" role="radio" aria-checked="true">Internos', 'class="on" role="radio" aria-checked="true">Clientes <span class="c">5</span></span><span role="radio" aria-checked="false">Internos')]
    if tel:
        pares = [("<b>Tomás Acosta</b><span>Empleado · Delta S.A.</span>", "<b>Martina López</b><span>Vinculada a su cuenta · Mayorista</span>"), ('<span class="w-av">TA</span>', '<span class="w-av">ML</span>'),
                 ("Acciones de Tomás Acosta", "Acciones de Martina López"), ("Hola, Lucía. Ya terminé la visita en Ferretería Rosales.", "Hola, buen día. Les mando lo del pedido."),
                 ("Genial, Tomás. Te mando el formulario de la visita.", "Hola, Martina. Dale, te leo.")]
    for a, b in pares:
        assert a in t, a
        t = t.replace(a, b)
    return t


def chat_adjuntos():
    doc = A.doc_chip("presupuesto-octubre.pdf", "1,8 MB")
    msgs = {e: llega() for e in ("Lo que llega", "Antes de mandar", "Una foto, con un texto", "Demasiado grande", "Enviando")}
    msgs["Enviado"] = llega() + sal(doc + '<span class="ad-tx">Te paso el presupuesto de octubre.</span>', "Lucía Fernández · 10:52 · Entregado")
    msgs["No se pudo"] = llega() + sal(sin_bajar(doc), "No se pudo mandar" + F.info("WhatsApp no lo aceptó. El archivo no salió."), "mal")
    msgs["Fuera de las 24 horas"] = llega()
    capas = {"Antes de mandar": dlg_mandar(), "Una foto, con un texto": dlg_mandar("foto"), "Demasiado grande": dlg_mandar("grande"), "Enviando": dlg_mandar("enviando")}
    esc = {e: escritura(e == "Fuera de las 24 horas") for e in E_ADJ}
    vp = {e: "Mandó un documento" for e in E_ADJ}
    vp.update({"Enviado": "Vos: presupuesto-octubre.pdf", "No se pudo": "No se pudo mandar"})
    hora = {e: "13/10/2026 10:45" for e in E_ADJ}
    hora.update({"Enviado": "13/10/2026 10:52", "No se pudo": "13/10/2026 10:52"})
    t = A.pagina_chat(E_ADJ, esc, msgs, capas, vp, hora, "WhatsApp · los archivos del chat")
    t = a_clientes(t)
    t = t.replace('<span class="w-dia">Hoy</span>', '<span class="w-dia">13/10/2026</span>')
    return L.con_css(t, "adj", CSS_ADJ)


CSS_TADJ = """.ad-foto { display: block; width: 220px; height: 150px; border-radius: 8px;
  background: linear-gradient(180deg, oklch(0.85 0.04 240) 0 18%, transparent 18%), linear-gradient(180deg, transparent 82%, oklch(0.65 0.01 150) 82%),
  repeating-linear-gradient(90deg, oklch(0.82 0.04 75) 0 18px, oklch(0.6 0.05 60) 18px 36px); }
.ad-aud { display: flex; align-items: center; gap: 10px; width: 220px; }
.ad-aud .pl { width: 36px; height: 36px; border: 0; border-radius: 50%; background: var(--marca); color: #fff; display: inline-flex; align-items: center; justify-content: center; }
.ad-aud .br { flex: 1; height: 4px; border-radius: 2px; background: var(--s3); }
.ad-aud small { font-size: 13px; color: var(--t3); }
.ad-tx { display: block; margin-top: 6px; }
.ad-baja, .ad-sin { display: inline-flex; align-items: center; gap: 8px; color: var(--t2); font-size: 15px; }
.ad-sin { font-style: italic; }
.ap-m .gl .r-doc { width: 250px; box-sizing: border-box; }
.ad-prev { display: flex; flex-direction: column; gap: 12px; }
.ad-prev .ad-foto { width: 100%; height: 190px; }
.ad-arch { display: flex; align-items: center; gap: 10px; }
.ad-arch .t { display: flex; flex-direction: column; font-size: 15px; line-height: 1.35; }
.ad-arch small { font-size: 13px; color: var(--t3); }
"""
E_TADJ = ["Lo que llega", "Antes de mandar", "Enviando", "No se pudo", "Fuera de las 24 horas"]


def tel_adjuntos():
    def tent(cuerpo, hora):
        return f'<div class="ap-m ent"><span class="gl">{cuerpo}</span><span class="pie">{hora}</span></div>'
    hilo = (tent(foto() + '<span class="ad-tx">Así quedó la entrada.</span>', "10:42")
            + tent(f'<span class="ad-aud"><button type="button" class="pl" aria-label="Escuchar el audio">{PLAY}</button><span class="br"></span><small>0:14</small></span>', "10:43")
            + tent(A.doc_chip("lista-de-precios.pdf", "2,4 MB"), "10:44")
            + tent(f'<span class="ad-sin">{ARCHIVO} Mandó un documento</span>', "10:45"))
    doc = A.doc_chip("presupuesto-octubre.pdf", "1,8 MB")
    msgs = {e: hilo for e in E_TADJ}
    msgs["No se pudo"] = hilo + f'<div class="ap-m sal"><span class="gl">{sin_bajar(doc)}</span><span class="pie mal">No se pudo mandar</span></div>'
    clip = f'<button type="button" class="ap-red nt" aria-label="Adjuntar un archivo">{CLIP}</button>'

    def esc(fuera=False):
        t = A.t_escr(cerrada=fuera)
        if fuera:
            return t.replace('<span class="ap-24">', f'<button type="button" class="ap-red nt" aria-label="Adjuntar un archivo" aria-disabled="true" title="{FUERA}">{CLIP}</button><span class="ap-24">', 1)
        return t.replace('<span class="campo">', clip + '<span class="campo">', 1)
    prev = f'<div class="ad-prev"><div class="ad-arch">{A.doc_chip_icono()}<span class="t">presupuesto-octubre.pdf<small>1,8 MB</small></span></div>' + F.tcampo("Texto", "Opcional", vacio=True) + "</div>"
    pie = lambda g: (f'{E.trabaja("Enviando…")}<button type="button" class="cb cb-sec" disabled>Cancelar</button>' if g
                     else '<button type="button" class="cb cb-pri">Enviar</button><button type="button" class="cb cb-sec">Cancelar</button>')
    capas = {"Antes de mandar": F.thoja("Mandar un archivo", prev, pie(False)), "Enviando": F.thoja("Mandar un archivo", prev, pie(True))}
    t = A.pagina_tchat(E_TADJ, {e: esc(e == "Fuera de las 24 horas") for e in E_TADJ}, msgs, capas, "WhatsApp · los archivos del chat · teléfono", A.CSS_AB + A.CSS_ARCH + CSS_TADJ)
    t = a_clientes(t, tel=True)
    return t.replace('<span class="ap-dia">Hoy</span>', '<span class="ap-dia">13/10/2026</span>')


# ================================================================ canvas.json (la fila de cada uno la pone formularios_etapas_1004.py)
TITULOS = {"FRM-Respuestas-18": ("Formularios · la planilla con archivos · etapa 18", 1440, 900), "M-FRM-Respuestas-18": ("La planilla con archivos · teléfono · etapa 18", 390, 844),
           "FRM-Respuesta-18": ("Formularios · una respuesta con archivos · etapa 18", 1440, 900), "M-FRM-Respuesta-18": ("Una respuesta con archivos · teléfono · etapa 18", 390, 844),
           "FRM-Respuesta-Completa-18": ("Formularios · pantalla completa con archivos · etapa 18", 1440, 900), "FRM-Dar-De-Baja-18": ("Formularios · dar de baja · etapa 18", 1440, 1100),
           "WA-Chats-Adjuntos": ("WhatsApp · los archivos del chat · etapa 18", 1440, 900), "M-WA-Chats-Adjuntos": ("WhatsApp · los archivos del chat · teléfono · etapa 18", 390, 844)}


def registrar():
    ruta = PROJ / "canvas.json"
    c = json.loads(ruta.read_text(encoding="utf-8"))
    for n, (titulo, w, h) in TITULOS.items():
        v = c["boards"].setdefault(f"{n}.dc.html", {"x": 0, "y": 0, "is_interactive": True})
        v.update(w=w, h=h, page="formularios", title=titulo)
        if f"{n}.dc.html" not in c["order"]:
            c["order"].append(f"{n}.dc.html")
    ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    panel_e16 = re.search(r'<style data-e16="panel">\n(.*?)</style>', (PROJ / "FRM-Catalogos.dc.html").read_text(encoding="utf-8"), re.S)
    E.R.CSS_PANEL_E16 = panel_e16.group(1) if panel_e16 else ""
    for n, f, alto, pestana in [("FRM-Respuestas-18", respuestas, None, "respuestas"), ("FRM-Respuesta-18", detalle, None, "respuestas"), ("FRM-Respuesta-Completa-18", completa, None, None),
                                ("FRM-Dar-De-Baja-18", dar_de_baja, 1100, "diseno")]:
        t = L.sin_disenar(n, E.post(n, f(), alto))
        if pestana:
            t = L.con_pestanas(t, pestana)
        (PROJ / f"{n}.dc.html").write_text(t, encoding="utf-8")
    for n, f in [("M-FRM-Respuestas-18", tel_respuestas), ("M-FRM-Respuesta-18", tel_respuesta), ("WA-Chats-Adjuntos", chat_adjuntos), ("M-WA-Chats-Adjuntos", tel_adjuntos)]:
        (PROJ / f"{n}.dc.html").write_text(E.post(n, f()), encoding="utf-8")
    # 165 (traspaso 10): el visor, que armó formularios_ab_archivos_1004.py, sobre el chat con el mensaje que nombra el formulario.
    # 194 (v169): al pie del visor, el nombre, el tamaño y «Descargar», igual que en la planilla; quién la mandó y cuándo ya están en la tarjeta.
    for n in ("WA-Chats-Visor", "M-WA-Chats-Visor"):
        f = PROJ / f"{n}.dc.html"
        t = f.read_text(encoding="utf-8")
        nuevo = t.replace("Completá este formulario, por favor.", A.mensaje_de("Visita a cliente"))
        nuevo = re.sub(r"<small>([\d,]+ MB) · sacada con la cámara[^<]*</small>", r"<small>\1</small>", nuevo)
        if nuevo != t:
            f.write_text(nuevo, encoding="utf-8")
    # 78 (v169): el clip para adjuntar va al lado de «Nota interna», como en WA-Chats-Adjuntos, en los chats que muestran la 18
    for n in ("WA-Chats-Respuesta-18", "M-WA-Conversacion-Respuesta-18", "WA-Chats-Visor", "M-WA-Chats-Visor"):
        f = PROJ / f"{n}.dc.html"
        t = f.read_text(encoding="utf-8")
        if 'aria-label="Adjuntar un archivo"' not in t:
            f.write_text(con_clip(t, n.startswith("M-")), encoding="utf-8")
    if "--sin-canvas" not in sys.argv:  # para correrlo sobre el lienzo sin tocar canvas.json
        registrar()
    print("tableros", list(TITULOS))
