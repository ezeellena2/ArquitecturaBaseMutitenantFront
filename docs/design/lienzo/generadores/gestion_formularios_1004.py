"""Gestión de formularios (decisión 34) y la opción de menú apagada (decisión 43), del 2026-10-24 (pedido de la Guía).

La navegación queda como en ArquitecturaBase (MF1 del lienzo «Formularios por WhatsApp», anexo D del traspaso 2):
- el menú principal dice «Gestión de formularios», y su panel tiene Formularios (con lo que espera tu decisión), Diseñar
  formularios, Catálogos y Formularios que faltan; «Por aprobar» y «Respuestas» salen del panel y de Más en el teléfono;
- «Formularios» (FRM-Formularios, nuevo) es la tabla de formularios publicados: Por aprobar, Respuestas y Última respuesta,
  con «Activos | Dados de baja» (dos vistas de la misma lista, Criterio · Menús) y «Aprobación ▾» en la caja de filtros;
- al entrar en uno, «Por aprobar · 3» va arriba de la planilla, de la más vieja a la más nueva, con «Revisar»;
- FRM-Por-Aprobar y M-FRM-Por-Aprobar pasan al Archivo: no hay bandeja aparte.

Decisión 43: una opción de menú que no se puede usar queda solo grisada, sin texto debajo, con el motivo en su tooltip
(reemplaza la del 13/10). Cambia Criterio · Menús y «Inactivar» en el ⋮ de un rol con usuarios. Las de formularios cambian
con su etapa.

Corre al final de todo, después de `botones_sin_explicar_1004.py`. Se puede volver a correr.
"""
import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import formularios_1004 as F  # noqa: E402

PROJ = pathlib.Path(__file__).resolve().parent.parent
CANVAS = PROJ / "canvas.json"
APROBADO = True  # el usuario la aprobó el 24/10 («si publica y commitea», versión 138)
PARA_APROBAR = " · para aprobar"
VOLVER = F.svg('<path d="M14.5 5.5 8 12l6.5 6.5"/>', 16, "2")


def r(t, a, b, n=1):
    assert t.count(a) == n, (a[:120], t.count(a))
    return t.replace(a, b)


def leer(n):
    return (PROJ / f"{n}.dc.html").read_text(encoding="utf-8")


def escribir(n, t):
    (PROJ / f"{n}.dc.html").write_text(t, encoding="utf-8")


# ================================================================ Archivo: la bandeja «Por aprobar» deja de existir
AL_ARCHIVO = {"FRM-Por-Aprobar": (0, 5360), "M-FRM-Por-Aprobar": (0, 6380)}


def mover_al_archivo(c):
    for n, (x, y) in AL_ARCHIVO.items():
        b = c["boards"][f"{n}.dc.html"]
        b.update(page="archivo", x=x, y=y)
        b["title"] = b["title"].replace(PARA_APROBAR, "")


# ================================================================ El panel de «Gestión de formularios»
PANEL_RE = re.compile(r'<aside class="w-panel" aria-label="(?:Formularios|Gestión de formularios)">.*?</aside>', re.S)


def piezas_del_panel():
    """Los íconos del panel actual, por su destino (sirve antes y después de este generador)."""
    p = PANEL_RE.search(leer("FRM-Listado")).group(0)
    ic = {h: s for h, s in re.findall(r'href="([^"]+)">(<svg.*?</svg>)', p, re.S)}
    plegar = re.search(r'<button type="button" class="w-plegar"[^>]*>(<svg.*?</svg>)</button>', p, re.S).group(1)
    return ic, plegar


ICONOS, PLEGAR = piezas_del_panel()
ENTRADAS = [  # clave, destino, ícono, texto, cantidad
    ("formularios", "FRM-Formularios.dc.html", F.ICONO, "Formularios", "4"),
    ("disenar", "FRM-Listado.dc.html", ICONOS["FRM-Listado.dc.html"], "Diseñar formularios", ""),
    ("catalogos", "FRM-Catalogos.dc.html", ICONOS["FRM-Catalogos.dc.html"], "Catálogos", ""),
    ("faltan", "FRM-Faltan.dc.html", ICONOS["FRM-Faltan.dc.html"], "Formularios que faltan", "3"),
]
DE_FORMULARIOS = {"FRM-Formularios", "FRM-Respuestas", "FRM-Respuestas-Filtros", "FRM-Respuesta", "FRM-Respuestas-Exportar",
                  "FRM-Respuesta-Aprobacion", "FRM-Respuesta-Cadena"}


def activo_de(n):
    if n in DE_FORMULARIOS:
        return "formularios"
    if n.startswith("FRM-Catalogo"):
        return "catalogos"
    if n == "FRM-Faltan":
        return "faltan"
    return "disenar"


def panel(activo, condiciones=None, cantidad=None):
    """condiciones: {clave: bandera} para mostrar una entrada según los permisos; cantidad: el número de «Formularios»."""
    nav = ""
    for clave, href, icono, texto, cnt in ENTRADAS:
        cnt = cantidad if clave == "formularios" and cantidad is not None else cnt
        on = " on" if clave == activo else ""
        num = f' <span class="cnt">{cnt}</span>' if cnt else ""
        a = f'<a class="w-ln{on}" href="{href}">{icono} {texto}{num}</a>'
        if condiciones and clave in condiciones:
            a = f'<sc-if value="{{{{{condiciones[clave]}}}}}" hint-placeholder-val="{{{{si}}}}">{a}</sc-if>'
        nav += a
    return (f'<aside class="w-panel" aria-label="Gestión de formularios"><button type="button" class="w-plegar" aria-label="Cerrar Gestión de formularios">'
            f'{PLEGAR}</button><div class="pc">Gestión de formularios</div><nav class="w-nav">{nav}</nav></aside>')


# ================================================================ Todos los tableros vigentes: menú, panel, migas y enlaces
def marco(n, t):
    # El menú principal
    t = re.sub(r'<a class="w-ln( on)?" href="FRM-Listado\.dc\.html">(<svg.*?</svg>) Formularios(<span class="fl">)',
               r'<a class="w-ln\1" href="FRM-Formularios.dc.html">\2 Gestión de formularios\3', t, flags=re.S)
    t = re.sub(r'href="FRM-Listado\.dc\.html">(<svg(?:(?!</svg>).)*</svg>)<span class="ab-sidebar__link-label">Formularios</span>',
               r'href="FRM-Formularios.dc.html">\1<span class="ab-sidebar__link-label">Gestión de formularios</span>', t, flags=re.S)
    # El panel
    if n.startswith("FRM-"):
        t = PANEL_RE.sub(lambda m: panel(activo_de(n)), t)
    # Las migas
    t = t.replace("Inicio / Formularios / Respuestas / ", "Inicio / Gestión de formularios / Formularios / ")
    t = t.replace("Inicio / Formularios / Biblioteca", "Inicio / Gestión de formularios / Diseñar formularios / Biblioteca")
    t = t.replace("Inicio / Formularios / ", "Inicio / Gestión de formularios / ")
    # Lo que apuntaba a la bandeja
    t = t.replace('href="FRM-Por-Aprobar.dc.html"', 'href="FRM-Formularios.dc.html"')
    t = t.replace('href="M-FRM-Por-Aprobar.dc.html"', 'href="M-FRM-Respuestas.dc.html"')
    # El grupo, debajo del título en el teléfono
    if n.startswith("M-FRM-"):
        t = t.replace('class="sub">Formularios</span>', 'class="sub">Gestión de formularios</span>')
    return t


def comprobar_marco(n, t):
    sb = re.search(r'<aside class="w-sb".*?</aside>', t, re.S)
    if sb:
        assert "> Formularios<" not in sb.group(0), n
    assert 'ab-sidebar__link-label">Formularios<' not in t, n
    assert 'aria-label="Formularios">' not in t, n
    assert "Inicio / Formularios" not in t, n
    assert "Por-Aprobar.dc.html" not in t, n


# ================================================================ Más en el teléfono
CSS_MAS = '<style data-mf1="mas">.ap-it .ap-cnt { min-width: 22px; height: 22px; padding: 0 7px; box-sizing: border-box; border-radius: 999px; background: oklch(0.95 0.06 85); color: oklch(0.45 0.1 70); font-size: 12.5px; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; }</style>\n</helmet>'


def mas_del_telefono():
    t = leer("M-WA-Menu")
    m = re.search(r'<span class="ap-gtit">(?:Formularios|Gestión de formularios)</span><div class="ap-grupo">(.*?)</div>', t, re.S)
    chev = re.search(r'<span class="chev">(<svg.*?</svg>)</span>', m.group(1), re.S).group(1)

    def it(href, texto, cnt=""):
        c = f'<span class="ap-cnt" aria-label="{cnt} por aprobar">{cnt}</span>' if cnt else ""
        return f'<a class="ap-it " href="{href}"><span class="tx"><b>{texto}</b></span>{c}<span class="chev">{chev}</span></a>'

    grupo = ('<span class="ap-gtit">Gestión de formularios</span><div class="ap-grupo">'
             + it("M-FRM-Respuestas.dc.html", "Formularios", "4") + it("M-FRM-Listado.dc.html", "Diseñar formularios")
             + it("M-FRM-Catalogos.dc.html", "Catálogos") + it("M-FRM-Faltan.dc.html", "Formularios que faltan") + "</div>")
    t = t.replace(m.group(0), grupo)
    if 'data-mf1="mas"' not in t:
        t = r(t, "</helmet>", CSS_MAS)
    escribir("M-WA-Menu", t)


# ================================================================ Los datos de «Formularios»
# (nombre, por aprobar, respuestas, última, cuándo, clase del estado, estado, destino de la última)
ACTIVOS = [
    ("Visita a cliente", 3, 24, "VIS-000130", "15/10/2026 16:20", "amb", "Por aprobar", "FRM-Respuesta-Aprobacion.dc.html"),
    ("Entrega de pedido", 1, 48, "ENT-000048", "14/10/2026 10:05", "", "Aprobada", "FRM-Respuesta.dc.html"),
    ("Control de vehículo", 0, 31, "VEH-000031", "12/10/2026 18:05", "off", "Recibida", "FRM-Respuesta.dc.html"),
]
DADOS_DE_BAJA = [("Relevamiento de obra", 0, 12, "REL-000012", "30/09/2026 10:15", "", "Aprobada", "FRM-Respuesta.dc.html")]
PENDIENTES = [  # de la más vieja a la más nueva, como el anexo D (MF1, nota 5)
    ("VIS-000127", "Tomás Acosta", "14/10/2026 09:30", "hace 1 día"),
    ("VIS-000129", "Florencia Fernández de los Santos", "15/10/2026 11:47", "hace 7 horas"),
    ("VIS-000130", "Paula Méndez", "15/10/2026 16:20", "hace 2 horas"),
]


# ================================================================ FRM-Respuestas: la ← a Formularios y «Por aprobar · 3» arriba
CSS_PEND = """<style data-mf1="pendientes">
.fm-pend { flex-shrink: 0; }
.fm-pend .w-cab { font-size: 13.5px; }
.w-th.fm-p, .w-tr.fm-p { grid-template-columns: 150px minmax(0, 1.4fr) 170px 150px 104px; }
.w-tr.fm-p { min-height: 48px; }
.w-tr.fm-p .r { display: flex; justify-content: flex-end; }
.w-tr.fm-p .cb { height: 30px; padding: 0 12px; font-size: 13px; }
.w-tr.fm-p .q { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
</helmet>"""


def bloque_pendientes(destino):
    filas = "".join(
        f'<div class="w-tr fm-p"><span><a class="pl-num" href="{destino}">{num}</a></span><span class="q" title="{quien}">{quien}</span>'
        f'<span>{cuando}</span><span>{espera}</span><span class="r"><a class="cb cb-sec" href="{destino}">Revisar</a></span></div>'
        for num, quien, cuando, espera in PENDIENTES)
    return (f'<div class="w-caja fm-pend"><div class="w-cab"><span>Por aprobar · {len(PENDIENTES)}</span></div>'
            '<div class="w-th fm-p"><span>N°</span><span>Cargó</span><span>Recibida</span><span>Esperando</span><span class="sr">Acciones</span></div>'
            f"{filas}</div>")


def planilla():
    t = leer("FRM-Respuestas")
    vol = f'<a class="vol" href="FRM-Formularios.dc.html" aria-label="Volver a Formularios">{VOLVER}</a>'
    t = re.sub(r'(<div class="w-bnd"><div class="iz">)<span class="ic"><svg.*?</svg></span>(<div><h1>Visita a cliente</h1>)', lambda m: m.group(1) + vol + m.group(2), t, flags=re.S)
    if "fm-pend" not in t:
        bloque = bloque_pendientes("FRM-Respuesta-Aprobacion.dc.html")
        for s, v in (("s0", "si"), ("s1", "no"), ("s2", "no"), ("s3", "no"), ("s6", "no"), ("s8", "no"), ("s11", "no")):
            t = r(t, f'<sc-if value="{{{{{s}}}}}" hint-placeholder-val="{{{{{v}}}}}"><div class="w-body">',
                  f'<sc-if value="{{{{{s}}}}}" hint-placeholder-val="{{{{{v}}}}}"><div class="w-body">{bloque}')
    t = re.sub(r'<style data-mf1="pendientes">.*?</style>\n', "", t, flags=re.S)
    t = r(t, "</helmet>", CSS_PEND)
    # Sin respuestas en el panel, «Muchos formularios» ya no es un estado
    t = t.replace('"No se pudo actualizar","Sin permiso","Muchos formularios","Sin permiso para exportar"]',
                  '"No se pudo actualizar","Sin permiso","Sin permiso para exportar"]')
    escribir("FRM-Respuestas", t)


# ================================================================ El teléfono: Formularios y, al entrar en uno, lo que espera arriba
CSS_TEL = """<style data-mf1="telefono">
.ap-fila .fm-cnt { margin-left: auto; align-self: center; min-width: 24px; height: 24px; padding: 0 8px; box-sizing: border-box; border-radius: 999px; background: oklch(0.95 0.06 85); color: oklch(0.45 0.1 70); font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; }
</style>
</helmet>"""


def telefono():
    t = leer("M-FRM-Respuestas")
    i = t.index('<sc-if value="{{s0}}"')
    j = t.index('<sc-if value="{{s1}}"')
    s0 = t[i:j]
    s0 = s0.replace("<h1>Respuestas</h1>", "<h1>Formularios</h1>")
    s0 = s0.replace('<span class="sub">Formularios</span>', '<span class="sub">Gestión de formularios</span>')
    if 'class="ap-seg"' not in s0:
        s0 = r(s0, '<div class="ap-cuerpo">', '<div class="ap-seg" role="radiogroup" aria-label="Ver"><span class="on" role="radio" aria-checked="true">Activos <span class="c">3</span></span>'
               '<span role="radio" aria-checked="false">Dados de baja <span class="c">1</span></span></div><div class="ap-cuerpo">')
    s0 = s0.replace(">8 respuestas · versión 1<", ">48 respuestas · versión 1<")
    if "fm-cnt" not in s0:
        for nombre, cnt in (("Visita a cliente", 3), ("Entrega de pedido", 1)):
            s0 = r(s0, f'<span class="l1">{nombre}</span>', f'<span class="l1">{nombre}</span>', 1)
            s0 = re.sub(rf'(<span class="l1">{nombre}</span><span class="l2">[^<]*</span></div>)(</a>)',
                        lambda m: m.group(1) + f'<span class="fm-cnt" aria-label="{cnt} por aprobar">{cnt}</span>' + m.group(2), s0)
    t = t[:i] + s0 + t[j:]
    # Al entrar en uno: lo que espera, arriba
    k = t.index('<sc-if value="{{s1}}"')
    if 'Todas las respuestas' not in t:
        filas = "".join(
            f'<a class="ap-fila" href="M-FRM-Respuesta-Aprobacion.dc.html"><div class="tx"><span class="l1">{num}<span class="hr">{cuando[:5]} {cuando[-5:]}</span></span>'
            f'<span class="l2">{quien if len(quien) <= 24 else quien[:24] + "…"} · {espera}</span></div></a>'
            for num, quien, cuando, espera in PENDIENTES)
        m = t.index('<div class="ap-cuerpo">', k)
        n = m + len('<div class="ap-cuerpo">')
        t = t[:n] + f'<span class="ap-gtit">Por aprobar · {len(PENDIENTES)}</span>{filas}<span class="ap-gtit">Todas las respuestas</span>' + t[n:]
    if 'data-mf1="telefono"' not in t:
        t = r(t, "</helmet>", CSS_TEL)
    escribir("M-FRM-Respuestas", t)


# ================================================================ FRM-Formularios (MF1)
ESTADOS = ["Activos", "Aprobación: menú", "Con algo por aprobar", "Dados de baja", "Quien solo ve respuestas", "Quien solo aprueba",
           "Sin coincidencias", "Cargando", "Todavía no hay formularios", "No se pudo cargar", "Sin permiso"]
CSS_MF1 = """<style data-mf1="formularios">
.fm-seg { display: inline-grid; grid-template-columns: 1fr 1fr; gap: 3px; padding: 3px; border-radius: 10px; background: var(--s3); align-self: flex-start; width: 320px; }
.fm-seg button { height: 30px; border: 0; border-radius: 8px; background: transparent; font: inherit; font-size: 13px; font-weight: 600; color: var(--t2); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 6px; }
.fm-seg button.on { background: #fff; color: var(--t1); box-shadow: 0 1px 3px oklch(0.24 0.014 78 / 0.12); }
.fm-seg .c { font-weight: 500; color: var(--t3); }
.w-th.fm4, .w-tr.fm4 { grid-template-columns: minmax(220px, 1.4fr) 130px 130px minmax(300px, 1.6fr); }
.w-th.fm3, .w-tr.fm3 { grid-template-columns: minmax(220px, 1.4fr) 130px minmax(300px, 1.6fr); }
.w-th.fm2, .w-tr.fm2 { grid-template-columns: minmax(220px, 1fr) 160px; }
.w-tr.fm4, .w-tr.fm3, .w-tr.fm2 { min-height: 48px; }
.w-tr .fm-n a { color: var(--t1); font-weight: 500; text-decoration: none; }
.w-tr .fm-n a:hover { text-decoration: underline; }
.fm-cnt { min-width: 22px; height: 22px; padding: 0 7px; box-sizing: border-box; border-radius: 999px; background: oklch(0.95 0.06 85); color: oklch(0.45 0.1 70); font-size: 12.5px; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; }
.fm-no { color: var(--t3); }
.fm-num { font-variant-numeric: tabular-nums; }
.fm-ult { display: flex; align-items: center; gap: 10px; min-width: 0; }
.fm-ult .pl-num { font-weight: 600; color: var(--t1); font-variant-numeric: tabular-nums; letter-spacing: 0.02em; }
.fm-ult .f { color: var(--t2); font-variant-numeric: tabular-nums; }
.w-est.amb { color: oklch(0.45 0.1 70); }
.w-est.amb::before { background: oklch(0.72 0.15 70); }
.w-est.off::before { background: var(--t3); }
.pl-pagina { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; text-align: center; color: var(--t1); min-height: 520px; }
.pl-pagina .ic { width: 52px; height: 52px; border-radius: 14px; background: var(--s2); color: var(--t2); display: inline-flex; align-items: center; justify-content: center; }
.pl-pagina b { font-size: 18px; font-weight: 600; }
.w-us .tx b span, .um .tx b span { color: inherit; font-size: inherit; }
</style>
</helmet>"""
CANDADO = F.svg('<rect x="5" y="11" width="14" height="9" rx="1.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', 24)


def fila_mf1(f, cols, bandera):
    n, apr, resp, ult, cuando, clase, est, destino = f
    celdas = [f'<span class="fm-n"><a href="FRM-Respuestas.dc.html">{n}</a></span>']
    if "apr" in cols:
        celdas.append(f'<span><span class="fm-cnt" aria-label="{apr} por aprobar">{apr}</span></span>' if apr else '<span class="fm-no">—</span>')
    if "resp" in cols:
        celdas.append(f'<span class="fm-num">{resp}</span>')
    if "ult" in cols:
        celdas.append(f'<span class="fm-ult"><a class="pl-num" href="{destino}">{ult}</a><span class="f">{cuando}</span>'
                      f'<span class="w-est {clase}">{est}</span></span>')
    clase_fila = {4: "fm4", 3: "fm3", 2: "fm2"}[len(cols) + 1]
    return f'<sc-if value="{{{{{bandera}}}}}" hint-placeholder-val="{{{{si}}}}"><div class="w-tr {clase_fila}">{"".join(celdas)}</div></sc-if>'


def tabla(cols, bandera):
    nombres = {"apr": "Por aprobar", "resp": "Respuestas", "ult": "Última respuesta"}
    clase = {4: "fm4", 3: "fm3", 2: "fm2"}[len(cols) + 1]
    cab = f'<div class="w-th {clase}"><span>Formulario</span>' + "".join(f"<span>{nombres[c]}</span>" for c in cols) + "</div>"
    claves = ["fVis", "fEnt", "fCon"]
    filas = "".join(fila_mf1(f, cols, k) for f, k in zip(ACTIVOS, claves)) + fila_mf1(DADOS_DE_BAJA[0], cols, "fRel")
    return f'<sc-if value="{{{{{bandera}}}}}" hint-placeholder-val="{{{{{"si" if bandera == "colsTodas" else "no"}}}}}">{cab}{filas}</sc-if>'


def formularios():
    t = leer("FRM-Listado")
    seg = ('<sc-if value="{{conSeg}}" hint-placeholder-val="{{si}}"><div class="fm-seg" role="radiogroup" aria-label="Ver">'
           '<button type="button" role="radio" aria-checked="{{selAct}}" class="{{segAct}}">Activos <span class="c">3</span></button>'
           '<button type="button" role="radio" aria-checked="{{selBaja}}" class="{{segBaja}}">Dados de baja <span class="c">1</span></button></div></sc-if>')
    caja = ('<sc-if value="{{conFiltros}}" hint-placeholder-val="{{si}}"><div class="w-caja o-fb">'
            f'<span class="w-bus {{{{busClase}}}}">{F.BUSCAR} {{{{busqueda}}}}</span>'
            '<sc-if value="{{conAprobacion}}" hint-placeholder-val="{{si}}">'
            + F.filtro("Aprobación", [("t", "Todos", 3), ("c", "Con algo por aprobar", 2), ("n", "Nada por aprobar", 1)], "apr") + "</sc-if>"
            + '<sc-if value="{{hayFiltro}}" hint-placeholder-val="{{no}}"><button type="button" class="cb cb-enl">Limpiar filtros</button></sc-if>'
            '<span class="tot">{{total}}</span></div></sc-if>')
    lista = ('<sc-if value="{{conTabla}}" hint-placeholder-val="{{si}}"><div class="w-caja">'
             + tabla(["apr", "resp", "ult"], "colsTodas") + tabla(["resp", "ult"], "colsLee") + tabla(["apr"], "colsAprueba")
             + '<sc-if value="{{conFilas}}" hint-placeholder-val="{{si}}"><div class="w-pie"><span>{{rango}}</span><span>10 por página · Página 1 de 1</span></div></sc-if>'
             '<sc-if value="{{cargando}}" hint-placeholder-val="{{no}}"><div class="f-cuerpo izq"><div class="esq"><span style="width: 80%;"></span><span style="width: 65%;"></span><span style="width: 72%;"></span></div></div></sc-if>'
             '<sc-if value="{{vacio}}" hint-placeholder-val="{{no}}"><div class="f-cuerpo"><b>Todavía no hay formularios publicados.</b><a class="cb cb-sec" href="FRM-Listado.dc.html">Ir a Diseñar formularios</a></div></sc-if>'
             '<sc-if value="{{sinCoincidencias}}" hint-placeholder-val="{{no}}"><div class="f-cuerpo"><b>Ningún formulario coincide con los filtros.</b><button type="button" class="cb cb-enl">Limpiar filtros</button></div></sc-if>'
             '<sc-if value="{{error}}" hint-placeholder-val="{{no}}"><div class="f-cuerpo"><b>No pudimos cargar los formularios.</b><button type="button" class="cb cb-sec">Reintentar</button></div></sc-if>'
             "</div></sc-if>")
    sin_permiso = (f'<sc-if value="{{{{sinPermiso}}}}" hint-placeholder-val="{{{{no}}}}"><div class="pl-pagina"><span class="ic">{CANDADO}</span>'
                   '<b>No tenés permiso para ver esta página.</b><a class="cb cb-sec" href="Inicio-Org.dc.html">Ir al inicio</a></div></sc-if>')
    banda = ('<sc-if value="{{conBanda}}" hint-placeholder-val="{{si}}">' + F.banda("Formularios", "{{resumen}}", "") + "</sc-if>")
    cuerpo = '<div class="w-body">' + seg + caja + lista + sin_permiso + "</div>"
    i = t.index('<div class="w-bnd">')
    j = t.index("</div></div></div>\n</x-dc>")
    t = t[:i] + banda + cuerpo + t[j + len("</div></div>"):]
    # El panel según los permisos, y quién mira
    t = PANEL_RE.sub(lambda m: panel("formularios", {"formularios": "verFormularios", "disenar": "verDisena", "catalogos": "verDisena", "faltan": "verDisena"},
                                     '{{cntMenu}}'), t)
    t = t.replace('<span class="cnt">{{cntMenu}}</span>', '<sc-if value="{{conCnt}}" hint-placeholder-val="{{si}}"><span class="cnt">{{cntMenu}}</span></sc-if>')
    t = r(t, '<div class="w-us"><span class="w-av">L</span><span class="tx"><b>Lucía Fernández</b><span>lucia.fernandez@delta.ejemplo.com</span></span></div>',
          '<div class="w-us"><span class="w-av">{{yoIni}}</span><span class="tx"><b>{{yo}}</b><span>{{yoCorreo}}</span></span></div>')
    t = re.sub(r'(<summary class="um"[^>]*>)<span class="w-av">L</span><span class="tx"><b>Lucía Fernández</b>',
               r'\1<span class="w-av">{{yoIni}}</span><span class="tx"><b>{{yo}}</b>', t, count=1)
    t = re.sub(r'(<div class="w-abajo">)(<a class="w-ln" href="WA-Admin\.dc\.html">.*?</a>)',
               lambda m: m.group(1) + '<sc-if value="{{conAdmin}}" hint-placeholder-val="{{si}}">' + m.group(2) + "</sc-if>", t, count=1, flags=re.S)
    t = re.sub(r"<title>[^<]*</title>", "<title>Formularios · /org/formularios/respuestas</title>", t)
    t = r(t, "Inicio / Gestión de formularios / Diseñar formularios</span>", "Inicio / Gestión de formularios / Formularios</span>")
    t = re.sub(r'<style data-mf1="formularios">.*?</style>\n', "", t, flags=re.S)
    t = r(t, "</helmet>", CSS_MF1)
    props = {"estado": {"editor": "enum", "options": ESTADOS, "default": ESTADOS[0], "section": "Estado"}, "$preview": {"width": 1440, "height": 900}}
    script = ("<script type=\"text/x-dc\" data-dc-script data-props='" + json.dumps(props, ensure_ascii=False, separators=(",", ":")) + "'>\n"
              "class Component extends DCLogic {\n  renderVals() {\n    const e = this.props.estado ?? \"Activos\";\n" + JS + "  }\n}\n</script>")
    t = re.sub(r'<script type="text/x-dc" data-dc-script.*?</script>', lambda m: script, t, count=1, flags=re.S)
    assert "{{{" not in t.replace("{{{{", "")
    escribir("FRM-Formularios", t)


JS = """    const lee = e === 'Quien solo ve respuestas', aprueba = e === 'Quien solo aprueba', baja = e === 'Dados de baja';
    const conAlgo = e === 'Con algo por aprobar', menu = e === 'Aprobación: menú';
    const lista = ['Activos', 'Aprobación: menú', 'Con algo por aprobar', 'Dados de baja', 'Quien solo ve respuestas', 'Quien solo aprueba'].includes(e);
    const quien = lee ? ['Julieta Sosa', 'julieta.sosa@delta.ejemplo.com', 'J'] : aprueba ? ['Martín Paz', 'martin.paz@delta.ejemplo.com', 'M']
      : e === 'Sin permiso' ? ['Tomás Acosta', 'tomas.acosta@delta.ejemplo.com', 'T'] : ['Lucía Fernández', 'lucia.fernandez@delta.ejemplo.com', 'L'];
    const filas = aprueba ? 1 : conAlgo ? 2 : baja ? 1 : 3;
    return {
      si: true, no: false,
      yo: quien[0], yoCorreo: quien[1], yoIni: quien[2], conAdmin: !lee && !aprueba && e !== 'Sin permiso',
      verFormularios: e !== 'Sin permiso', verDisena: !lee && !aprueba, conCnt: !lee, cntMenu: aprueba ? '3' : '4',
      conBanda: e !== 'Sin permiso',
      resumen: e === 'Cargando' || e === 'No se pudo cargar' ? '' : e === 'Todavía no hay formularios' ? 'Sin formularios publicados'
        : baja ? '1 dado de baja' : lee ? '3 activos' : aprueba ? '3 por aprobar' : '3 activos · 4 por aprobar',
      conSeg: lista || e === 'Sin coincidencias', selAct: baja ? 'false' : 'true', selBaja: baja ? 'true' : 'false', segAct: baja ? '' : 'on', segBaja: baja ? 'on' : '',
      conFiltros: !['Todavía no hay formularios', 'Sin permiso'].includes(e), conAprobacion: !lee && !aprueba,
      busqueda: e === 'Sin coincidencias' ? 'inspección' : 'Buscar formularios', busClase: e === 'Sin coincidencias' ? 'lleno' : '',
      aprTexto: conAlgo ? 'Aprobación: Con algo por aprobar' : 'Aprobación', aprClase: conAlgo ? 'con' : '', aprMenu: menu, aprAlternar: () => {},
      aprOn_t: conAlgo ? '' : 'on', aprOn_c: conAlgo ? 'on' : '', aprOn_n: '', aprC_t: '3', aprC_c: '2', aprC_n: '1',
      aprElegir_t: () => {}, aprElegir_c: () => {}, aprElegir_n: () => {},
      hayFiltro: conAlgo || e === 'Sin coincidencias',
      total: e === 'Sin coincidencias' ? '0 formularios' : filas === 1 ? '1 formulario' : filas + ' formularios',
      conTabla: e !== 'Sin permiso', colsTodas: !lee && !aprueba, colsLee: lee, colsAprueba: aprueba,
      fVis: lista && !baja, fEnt: lista && !baja && !aprueba, fCon: lista && !baja && !conAlgo && !aprueba, fRel: baja,
      conFilas: lista, rango: filas === 1 ? '1 de 1' : '1–' + filas + ' de ' + filas,
      cargando: e === 'Cargando', vacio: e === 'Todavía no hay formularios', sinCoincidencias: e === 'Sin coincidencias', error: e === 'No se pudo cargar',
      sinPermiso: e === 'Sin permiso',
    };
"""


# ================================================================ Decisión 43
def roles():
    t = leer("Roles")
    t = re.sub(r'(<button type="button" class="menu-it apagado) inact-off(" role="menuitem" aria-disabled="true")>(.*?)<span class="mot">Inactivar<small>\{\{r\.motivoInactivar\}\}</small></span></button>',
               lambda m: f'{m.group(1)}{m.group(2)} title="{{{{r.motivoInactivar}}}}">{m.group(3)}{" " if m.group(3) else ""}Inactivar</button>', t, flags=re.S)
    assert "<small>{{r.motivoInactivar}}</small>" not in t and 'title="{{r.motivoInactivar}}"' in t
    t = t.replace("// Etapa 9 (R10): con usuarios no se puede inactivar; la opción va apagada con el motivo debajo.",
                  "// Etapa 9 (R10): con usuarios no se puede inactivar; la opción va apagada, con el motivo en su tooltip (decisión 43).")
    escribir("Roles", t)


MENU_VIEJO = "<strong>Solo lo que se puede hacer con esa fila.</strong> Lo que no aplica no aparece; nada de opciones grises."
MENU_NUEVO = ("<strong>Solo lo que se puede hacer con esa fila.</strong> Lo que no aplica no aparece. Lo que no se puede usar todavía queda "
              "grisado, sin texto debajo, con el motivo en su tooltip: «Inactivar» en un rol con usuarios.")
PROHIBIDO_VIEJO = "Una opción gris sin su motivo. Si no aplica, no va; si no se puede usar por algo que se puede resolver, va en gris con el motivo debajo."
PROHIBIDO_NUEVO = "Una opción gris con un texto debajo que explica por qué: el motivo va en su tooltip."


def criterio_menus():
    for ruta in (PROJ / "Criterio-Menus.dc.html", PROJ / "generadores" / "criterio_menus.py"):
        t = ruta.read_text(encoding="utf-8")
        t = t.replace(MENU_VIEJO, MENU_NUEVO).replace(PROHIBIDO_VIEJO, PROHIBIDO_NUEVO)
        assert MENU_NUEVO in t and PROHIBIDO_NUEVO in t, ruta
        ruta.write_text(t, encoding="utf-8")


# ================================================================ canvas.json
TOCADOS = ["FRM-Formularios", "FRM-Respuestas", "M-FRM-Respuestas", "M-WA-Menu", "Roles"]


def registrar(c):
    b = c["boards"]
    if "FRM-Formularios.dc.html" not in b:
        for k, v in b.items():  # la fila de la planilla corre un lugar para que «Formularios» vaya primero
            if v.get("page") == "formularios" and v["y"] == 8200 and v["w"] == 1440:
                v["x"] += 1520
        b["FRM-Formularios.dc.html"] = {"h": 900, "is_interactive": True, "page": "formularios", "title": "Formularios · la lista de formularios",
                                        "w": 1440, "x": 0, "y": 8200}
    b["M-FRM-Respuestas.dc.html"]["title"] = "Formularios · Formularios y sus respuestas · teléfono"
    for n in TOCADOS:
        v = b[f"{n}.dc.html"]
        v["title"] = v["title"].replace(PARA_APROBAR, "") + ("" if APROBADO else PARA_APROBAR)


if __name__ == "__main__":
    c = json.loads(CANVAS.read_text(encoding="utf-8"))
    mover_al_archivo(c)
    archivo = {k[:-8] for k, v in c["boards"].items() if v.get("page") == "archivo"}
    cambiados = []
    for f in sorted(PROJ.glob("*.dc.html")):
        n = f.name[:-8]
        if n in archivo or n == "FRM-Formularios":
            continue
        t = f.read_text(encoding="utf-8")
        nuevo = marco(n, t)
        comprobar_marco(n, nuevo)
        if nuevo != t:
            f.write_text(nuevo, encoding="utf-8")
            cambiados.append(n)
    print("marco nuevo en", len(cambiados), "tableros")
    mas_del_telefono()
    planilla()
    telefono()
    formularios()
    roles()
    criterio_menus()
    registrar(c)
    CANVAS.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")
    print("listo")
