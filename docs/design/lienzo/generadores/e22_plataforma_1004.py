"""La biblioteca y la plantilla de Plataforma de la E22 con el traspaso 18 (tanda 3B de Diseño, 2026-11-26), en ocho tableros, con
la forma que dejaron aprobada `FRM-Formularios` y `M-FRM-Formularios` (los listados), `FRM-Editor` (el editor de la E14) y
`FRM-Editor-Reglas` y `FRM-Pdf` (la E21): todo lo que se elige, en la pieza (262); nada debajo de otro dato (263); el encabezado que
ordena y «Ordenar por» (264); lo de una fila en su ⋮ (261), y el motivo de lo apagado en un tooltip (211).

- **`Plat-FRM-Biblioteca`:** «Estado» y «Categoría» son filtros con su botón que abren la pieza, sin cantidades (262); el encabezado
  ordena con la flecha en el color de la marca después del título, y «Ordenar por», último en la barra y separado de los filtros,
  dice el orden con palabras y abre la pieza con «Columna» y «Orden» (264). «La usaron», un número, va a la derecha (137). El resumen
  dice solo «4 plantillas», como «7 catálogos» (284). La carga muestra el encabezado y el aro (160). Estados nuevos: «Categoría:
  menú», «Ordenar por abierto» y «Ordenado por Estado», que ordena por el circuito: Borrador, Publicada, Retirada, y con el mismo
  estado sigue por el nombre (264).
- **`M-Plat-FRM-Biblioteca`:** cada plantilla es una tarjeta con Categoría, Estado, La usaron y Última publicación, cada dato con su
  nombre, y nada junto debajo del nombre (263); «Ordenar por» arriba de la lista, a todo el ancho, que abre su pantalla (estado
  nuevo «Ordenar por», 264); «Filtros» pasa de la hoja «Filtrar por estado» a la pantalla de filtros, con «Estado» y «Categoría» en
  la pieza, sin cantidades (262). Sigue siendo solo para ver: sin «Nueva plantilla» ni ⋮.
- **`Plat-FRM-Plantilla-Nueva`:** la categoría, en la pieza (262), también vacía y con su error; detrás, la biblioteca redibujada.
  Estado nuevo «Elegir la categoría», con las cuatro en el orden de Categorías.
- **`Plat-FRM-Plantilla`:** las preguntas en columnas, con «Tipo» y «Obligatoria», sin el catálogo ni sus detalles en la fila (263 y
  285, que manda sobre el pedido viejo de una columna para el catálogo); la categoría, «Para quién es», el tipo y el catálogo de una
  pregunta, en la pieza (262). «Catálogos»: el encabezado ordena en el navegador, con «Opciones» a la derecha (137 y 264); «La usa»
  nombra la pregunta, sin «Pregunta 1 ·» delante (206), y no ordena porque puede tener varias (264); ✎ y 🗑 pasan al ⋮ de la fila,
  con «Quitar» apagado y su motivo en el tooltip (261 y 211), porque el orden de los catálogos no es un dato. «Publicación»: la fecha
  y quién, cada uno en su renglón («Última publicación» y «Publicada por»; «Retirada» y «Retirada por», 206 y 263). Estados nuevos:
  «Elegir la categoría», «Acciones de un catálogo», «Catálogos ordenados por Opciones» (de mayor a menor, lo vacío al final) y
  «Agregar un catálogo», con «De dónde salen las opciones» abierta en la pieza, que arranca en «Escritas a mano» y «Texto» (284).
- **`Plat-FRM-Plantilla-Reglas`:** como `FRM-Editor-Reglas`: «Cuándo», cada acción, «A quién», la pregunta y la condición, en la pieza
  (262); el diseño que arma «Armar el PDF», en su campo «Diseño del PDF» y no debajo del tipo (263); «Pedir aprobación» suma, debajo
  del rol y del rol sugerido, «Puede decidir quien cargó» y «Exigir motivo al rechazar», con su (i), y la (i) del rol deja de decir
  quién no decide (276). Lo de cada organización sigue con candado. Estado nuevo «Elegir la acción», con «Pedir aprobación a un rol»
  apagada y su motivo en el tooltip (211). Crece a 1700 de alto, como `FRM-Editor-Reglas`.
- **`Plat-FRM-Pdf`:** como `FRM-Pdf`: el estilo, en la pieza, y las preguntas de cada sección, en la pieza múltiple (262); el
  encabezado del diseño deja la línea gris de los datos de la página pública debajo del nombre (263: la (i) ya dice de dónde salen).
  El color sigue con candado. Estado nuevo «Elegir el estilo».
- **`Plat-FRM-Publicar`:** el editor de atrás, como `Plat-FRM-Plantilla` (las preguntas en columnas y lo que se elige en la pieza), y
  la publicación de atrás de «Volver a publicar», con la fecha y quién en su renglón. El diálogo no cambia, como `FRM-Publicar`.
- **`Plat-FRM-Retirar`:** la publicación de atrás, con la fecha y quién en su renglón.

`Plat-FRM-Categorias` no cambia: su orden es un dato, con ↑ ↓ ✎ 🗑 a la vista (127 y 264), y ya da el motivo de «Quitar» apagado en
su tooltip (211).

Corre una vez sobre los tableros de la v188 (si el bloque `<style data-t3b="e22-plataforma">` ya está, no hace nada) y después pasa
`traspaso10_piezas_1004.py --tableros <los ocho>`, que escala el bloque nuevo de la compu. Ninguno muestra el panel de «Gestión de
formularios»: Plataforma tiene el suyo. Uso: `python e22_plataforma_1004.py`.
"""
import pathlib
import re
import subprocess
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import base2_comun as b2  # noqa: E402
import e12_listado_1004 as e12l  # noqa: E402
import e14_editor_1004 as e14e  # noqa: E402
import e14_listados_1004 as e14l  # noqa: E402
import e21_reglas_1004 as e21r  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-t3b="e22-plataforma"'
SUFIJO = " · para aprobar"
SVG = r"<svg\b[^>]*>(?:(?!</svg>).)*</svg>"  # un dibujo, sin cruzar al siguiente
DIBUJO = "(" + SVG + ")"
COMPU = ["Plat-FRM-Biblioteca", "Plat-FRM-Plantilla-Nueva", "Plat-FRM-Plantilla", "Plat-FRM-Plantilla-Reglas", "Plat-FRM-Pdf",
         "Plat-FRM-Publicar", "Plat-FRM-Retirar"]
TELS = ["M-Plat-FRM-Biblioteca"]
TABLEROS = COMPU + TELS

leer, escribir, cierre, sc_ifs, una, s_de, partir = e14e.leer, e14e.escribir, e14e.cierre, e14e.sc_ifs, e14e.una, e14e.s_de, e14e.partir
clonar = e21r.clonar

# ---------------------------------------------------------------------------------------------------------------- los datos
# La biblioteca de la spec (§8): cuatro plantillas, por nombre, que es el orden de siempre.
PLANTILLAS = [("Comprobante de transferencia", "Ventas", "Publicada", "", "5", "20/10/2026, 10:15"),
              ("Control de vehículo", "Logística", "Borrador", "off", None, None),
              ("Orden de trabajo", "Mantenimiento", "Retirada", "off", "3", "01/10/2026, 15:30"),
              ("Visita a cliente", "Ventas", "Publicada", "", "12", "05/10/2026, 11:20")]
CIRCUITO = ["Borrador", "Publicada", "Retirada"]  # el estado ordena por su circuito (264); con el mismo, por el nombre
POR_ESTADO = sorted(PLANTILLAS, key=lambda p: (CIRCUITO.index(p[2]), p[0]))
COLS_BIB = ["Plantilla", "Categoría", "Estado", "La usaron", "Última publicación"]
ORDEN_NOMBRE = "Ordenar por: Plantilla, de la A a la Z"
ORDEN_ESTADO = "Ordenar por: Estado, de Borrador a Retirada"
ESTADOS_FILTRO = ["Todos los estados", "Borradores", "Publicadas", "Retiradas"]
# Las categorías en el orden que les da Plataforma en Categorías (es un dato, 264).
CATEGORIAS = ["Ventas", "Logística", "Mantenimiento", "Calidad"]
GRIS = '<span class="gris">—</span>'
RESUMEN_VIEJO = '<p class="res">4 plantillas · 2 publicadas</p>'
RESUMEN = '<p class="res">4 plantillas</p>'  # solo la cantidad, como «7 catálogos» (284)
CARGA = ('<div class="t10-carga" aria-label="Cargando" role="status"><span class="t10-aro" aria-hidden="true"></span></div>')
CARGA_TEL = ('<div class="ap-cuerpo t10-carga-tel" aria-label="Cargando" role="status"><span class="t10-aro" aria-hidden="true">'
             '</span></div>')

# La pestaña «Catálogos»: de dónde salen, con los textos de `FRM-Catalogo` llevados a Plataforma, donde los de los miembros y de
# los contactos llegan sin filtros (64); el nuevo arranca en «Escritas a mano» y «Texto» (284).
ORIGENES = [("Escritas a mano", "Para listas que mantiene una persona: motivos, proveedores, zonas."),
            ("De los miembros", "Se arma sola con los miembros de cada organización. Llega sin filtros."),
            ("De los contactos de WhatsApp", "Se arma sola con los contactos de cada organización. Llega sin filtros.")]
CAT_COLS = ["Catálogo", "De dónde salen las opciones", "Opciones", "La usa"]
POR_QUIEN = {"Última publicación": "Publicada por", "Retirada": "Retirada por"}

# Las acciones de una regla, como en `FRM-Editor-Reglas`; «Pedir aprobación» solo cuando se recibe una respuesta.
ACCIONES = [("Pedir aprobación a un rol", "Solo cuando se recibe una respuesta, y va última."), ("Armar el PDF", None),
            ("Mandarle un mensaje a quien la cargó", None), ("Avisar a un rol", None), ("Avisar a una persona", None),
            ("Mandar por correo", None), ("Mandar el PDF a un cliente", None)]
DISENO_PLAT = re.compile(r'<span>«([^»]+)» · (<a class="lnk" href="Plat-FRM-Pdf\.dc\.html">Ver el diseño</a>)</span>')

# ---------------------------------------------------------------------------------------------------------------- estilos
CSS_BIB = e14l.CSS_LISTADO + """
/* E22 · 137 · «La usaron», un número, a la derecha (la flecha, antes del título si ordena por ella). */
.w-th.pb > :nth-child(4) { text-align: right; }
.w-tr.pb > .num { justify-self: stretch; text-align: right; }
"""
CSS_NUEVA = CSS_BIB + """
/* E22 · La categoría, en la pieza (262): la lista abierta sale del diálogo. */
.w-dlg:has(.b2-pkl) { overflow: visible; }
"""
CSS_TEL = e12l.CSS_TEL + """
/* E22 · La biblioteca del teléfono es solo para ver: la tarjeta no lleva ⋮ y usa todo el ancho. */
.b2-tj.t3b-solo { padding-right: 16px; }
"""
CSS_PLANTILLA = e14e.CSS_COMPU + """
/* E22 · «Catálogos»: «Opciones», un número, a la derecha (137); el ⋮ de cada fila (261), con su menú encima de la caja. */
.w-th.ct2 > :nth-child(3) { text-align: right; }
.w-tr.ct2 > .num { justify-self: stretch; text-align: right; }
.w-tr.ct2 .q-acc2 { justify-content: flex-end; }
.w-body .w-caja:has(.f-menu) { overflow: visible; }
.w-dlg:has(.b2-pkl) { overflow: visible; }
"""
CSS_REGLAS = b2.css(False) + e21r.CSS_REGLAS + """
/* E22 · 276 · Las dos casillas de «Pedir aprobación», debajo del rol y del rol sugerido. */
.rg2-a .dos + .t3b-apr { margin-top: 2px; }
"""
CSS_PDF = b2.css(False) + e21r.CSS_PDF
CSS_RETIRAR = """
/* E22 · La publicación de atrás: la fecha y quién, cada uno en su renglón (206 y 263). Sin estilos nuevos. */
"""


# ---------------------------------------------------------------------------------------------------------------- utilidades
def con_css(t, css):
    assert MARCA not in t
    t = re.sub(r"<title>(.*?)</title>", lambda m: f"<title>{m.group(1).removesuffix(SUFIJO)}{SUFIJO}</title>", t, count=1)
    return t.replace("</helmet>", f"<style {MARCA}>\n{css}</style>\n</helmet>", 1)


def ya_corrio(nombre, t):
    if MARCA in t:
        print(nombre, "ya tiene el bloque: no hace nada")
        return True
    return False


def alto(t, px):
    """Un tablero más alto: el `$preview` del Tweak y el alto de la app, que pisa los de antes."""
    t, n = re.subn(r'"\$preview":\{"width":1440,"height":\d+\}', f'"$preview":{{"width":1440,"height":{px}}}', t)
    assert n == 1, n
    return t.replace(f"<style {MARCA}>\n", f"<style {MARCA}>\n.w-app {{ height: {px}px !important; }}\n", 1)


def adentro(b, nuevo):
    """El mismo `sc-if` con otro contenido."""
    assert b.endswith("</sc-if>"), b[-40:]
    return b[:b.index(">") + 1] + nuevo + "</sc-if>"


def cambiar_bloque(t, s, k, fn):
    a, b = sc_ifs(t, s)[k]
    return t[:a] + fn(t[a:b]) + t[b:]


def abrir(viejo, nuevo, en=1):
    return lambda k, b: una(b, viejo, nuevo) if k == en else b


# ---------------------------------------------------------------------------------------------------------------- la biblioteca
def svgs_bib(t):
    lupa = re.search(r'<span class="w-bus">' + DIBUJO + r' Buscar plantilla</span>', t, re.S).group(1)
    pil = re.search(r'<span class="w-pil" role="button" aria-haspopup="listbox">Estado ' + DIBUJO + r'</span>', t, re.S).group(1)
    return lupa, pil


def filtro(texto, pil, con=False, opciones=None):
    """Un filtro de la barra: su botón y, abierto, la lista de la pieza, sin cantidades, con «Todos» primero y separado (262)."""
    lista = ""
    if opciones:
        lista = b2.lista([b2.op(o, elegida=k == 0, activa=k == 0, sep=k == 1) for k, o in enumerate(opciones)], barra=True)
    return (f'<span class="f-env"><button type="button" class="w-pil{" con" if con else ""}" aria-haspopup="listbox" '
            f'aria-expanded="{"true" if opciones else "false"}">{texto} {pil}</button>{lista}</span>')


def ordenar_por(texto, abierto=False):
    """«Ordenar por», último en la barra y separado de los filtros, con «Columna» y «Orden» en la pieza (264)."""
    pop = ""
    if abierto:
        columnas = b2.lista([b2.op(c, elegida=k == 0, activa=k == 0) for k, c in enumerate(COLS_BIB)])
        pop = ('<div class="b2-pop" role="dialog" aria-label="Ordenar por"><div class="b2-pop-c"><span class="et">Columna</span>'
               + b2.campo(COLS_BIB[0], abierto=True, aria="Columna", extra=columnas)
               + '</div><div class="b2-pop-c"><span class="et">Orden</span>' + b2.campo("De la A a la Z", aria="Orden") + "</div></div>")
    return ('<span class="b2-sep" aria-hidden="true"></span><span class="envoltura b2-ordenar">'
            f'<button type="button" class="w-pil" aria-haspopup="dialog" aria-expanded="{"true" if abierto else "false"}">{texto} '
            f'{b2.SVG_FLECHA}</button>{pop}</span>')


def barra_bib(lupa, pil, busqueda=None, estado=None, menu=None, limpiar=False, orden=ORDEN_NOMBRE, orden_abierto=False):
    bus = (f'<span class="w-bus lleno">{lupa} {busqueda}</span>' if busqueda else f'<span class="w-bus">{lupa} Buscar plantilla</span>')
    est = filtro(f"Estado: {estado}" if estado else "Estado", pil, con=bool(estado), opciones=ESTADOS_FILTRO if menu == "estado" else None)
    cat = filtro("Categoría", pil, opciones=["Todas las categorías"] + CATEGORIAS if menu == "categoria" else None)
    lim = '<button type="button" class="cb cb-enl">Limpiar filtros</button>' if limpiar else ""
    return f'<div class="w-caja o-fb">{bus}{est}{cat}{lim}{ordenar_por(orden, orden_abierto)}</div>'


def fila_bib(p):
    nombre, cat, est, clase, usaron, fecha = p
    return (f'<div class="w-tr pb"><span><a href="Plat-FRM-Plantilla.dc.html">{nombre}</a></span><span>{cat}</span>'
            f'<span><span class="w-est{" " + clase if clase else ""}">{est}</span></span><span class="num">{usaron or GRIS}</span>'
            f'<span>{fecha or GRIS}</span></div>')


def pie(n):
    rango = f"1–{n} de {n}" if n > 1 else "1 de 1"
    return f'<div class="w-pie"><span>{rango}</span><span>10 por página · Página 1 de 1</span></div>'


def encabezado_bib(por="Plantilla", sentido="ascending"):
    return e14l.encabezado("pb", COLS_BIB, por, sentido, antes=por == "La usaron")


def tabla_bib(filas, por="Plantilla", sentido="ascending"):
    return encabezado_bib(por, sentido) + "".join(fila_bib(p) for p in filas) + pie(len(filas))


def cuerpo_bib(lupa, pil, caja, **barra):
    return f'<div class="w-body">{barra_bib(lupa, pil, **barra)}<div class="w-caja">{caja}</div></div>'


def biblioteca():
    nombre = "Plat-FRM-Biblioteca"
    t, nl = leer(nombre)
    if ya_corrio(nombre, t):
        return False
    t = con_css(t, CSS_BIB)
    lupa, pil = svgs_bib(t)
    print(nombre)
    # Lo de siempre, igual que antes, para comparar: las cuatro filas de «Todas».
    a, b = sc_ifs(t, "s0")[1]
    assert "".join(fila_bib(p) for p in PLANTILLAS) in t[a:b], "las filas de «Todas» no son las de siempre"
    assert t.count(RESUMEN_VIEJO) == 4, t.count(RESUMEN_VIEJO)
    t = t.replace(RESUMEN_VIEJO, RESUMEN)

    sin_resultados = ('<div class="f-cuerpo"><b>Ninguna plantilla coincide con los filtros.</b><button type="button" class="cb cb-enl">'
                      'Limpiar filtros</button></div>')
    error = '<div class="f-cuerpo"><b>No pudimos cargar las plantillas.</b><button type="button" class="cb cb-sec">Reintentar</button></div>'
    cuerpos = {
        "Todas": cuerpo_bib(lupa, pil, tabla_bib(PLANTILLAS)),
        "Estado: menú": cuerpo_bib(lupa, pil, tabla_bib(PLANTILLAS), menu="estado"),
        "Borradores": cuerpo_bib(lupa, pil, tabla_bib([PLANTILLAS[1]]), estado="Borradores", limpiar=True),
        "Sin resultados": cuerpo_bib(lupa, pil, sin_resultados, busqueda="inspección", limpiar=True),
        # La primera carga: el encabezado y el aro (160). El aro va con sus atributos en otro orden, así la pasada de las piezas
        # no lo vuelve a las barras y deja el encabezado, que es el de esta caja.
        "Cargando": cuerpo_bib(lupa, pil, encabezado_bib() + CARGA),
        "Error": cuerpo_bib(lupa, pil, error),
    }
    for estado, nuevo in cuerpos.items():
        t = cambiar_bloque(t, s_de(t, estado), 1, lambda b, n=nuevo: adentro(b, n))
    assert "w-pil\" role=\"button\"" not in t and 'class="ord"' not in t and 'class="tot"' not in t

    # Tres estados nuevos: la categoría abierta, «Ordenar por» abierto y la lista por el estado, por el circuito (264).
    nuevos = [("Categoría: menú", "Estado: menú", cuerpo_bib(lupa, pil, tabla_bib(PLANTILLAS), menu="categoria")),
              ("Ordenar por abierto", "Categoría: menú", cuerpo_bib(lupa, pil, tabla_bib(PLANTILLAS), orden_abierto=True)),
              ("Ordenado por Estado", "Ordenar por abierto", cuerpo_bib(lupa, pil, tabla_bib(POR_ESTADO, por="Estado"), orden=ORDEN_ESTADO))]
    for estado, ancla, nuevo in nuevos:
        t, _ = clonar(t, "Todas", estado, ancla, lambda k, b, n=nuevo: adentro(b, n) if k == 1 else b)
    escribir(nombre, t, nl)
    return True


# ---------------------------------------------------------------------------------------------------------------- el teléfono
def tarjeta_tel(p):
    """Cada plantilla, una tarjeta con cada dato nombrado (263); sin enlace ni ⋮: en el teléfono es solo para ver."""
    nombre, cat, est, _, usaron, fecha = p
    datos = [("Categoría", cat), ("Estado", b2.est("ok" if est == "Publicada" else "", est)), ("La usaron", usaron or b2.NADA_T),
             ("Última publicación", fecha or b2.NADA_T)]
    celdas = "".join(f'<span class="c"><span class="k">{k}</span><span class="v">{v}</span></span>' for k, v in datos)
    return (f'<div class="b2-tj t3b-solo"><div class="b2-tj-a"><span class="cu"><span class="nm">{nombre}</span>'
            f'<span class="dl">{celdas}</span></span></div></div>')


RENDER_TEL = """    const e = this.props.estado ?? 'Todas';
    // En el teléfono de Plataforma la biblioteca es solo para ver: sin «Nueva plantilla» ni ⋮.
    const lista = ['Todas', 'Sin resultados', 'Vacía', 'Cargando', 'Error'].includes(e);
    return {
      si: true, no: false, lista, filtros: e === 'Filtros', ordenar: e === 'Ordenar por', ordTel: lista && e !== 'Vacía',
      conFilas: e === 'Todas', cargando: e === 'Cargando', vacia: e === 'Vacía', sinResultados: e === 'Sin resultados', error: e === 'Error',
    };
"""


def biblioteca_tel():
    nombre = "M-Plat-FRM-Biblioteca"
    t, nl = leer(nombre)
    if ya_corrio(nombre, t):
        return False
    t = con_css(t, CSS_TEL)
    print(nombre)
    volver = re.search(r'<a class="ap-ib" aria-label="Volver" href="M-Mas-Plat\.dc\.html">' + DIBUJO + "</a>", t, re.S).group(1)
    fil = re.search(r'aria-label="Filtros">' + DIBUJO + "</button>", t, re.S).group(1)
    nav = re.search(r'<nav class="ap-nav".*?</nav>', t, re.S).group(0)
    a = t.index('<div class="ap-bar int">')
    raya = t.index('<span class="ap-raya"></span>')
    h = t.index('<sc-if value="{{hojaFiltros}}"')
    assert raya + len('<span class="ap-raya"></span>') == h, "algo entre la raya y la hoja de filtros"
    fin = cierre(t, h, "sc-if")

    def vacio(var, texto):
        return f'<sc-if value="{{{{{var}}}}}" hint-placeholder-val="{{{{no}}}}"><div class="ap-cuerpo"><div class="ap-vacio">{texto}</div></div></sc-if>'

    def pantalla(titulo, sub, campos, pie_html):
        s = f'<span class="sub">{sub}</span>' if sub else ""
        return (f'<div class="ap-bar int"><a class="ap-ib" aria-label="Volver" href="M-Plat-FRM-Biblioteca.dc.html">{volver}</a>'
                f'<div class="tit"><h1>{titulo}</h1>{s}</div></div><div class="ap-cuerpo"><div class="t10-fl">{campos}</div></div>'
                f'<div class="t10-pie">{pie_html}</div>')

    barra = (f'<div class="ap-bar int"><a class="ap-ib" aria-label="Volver" href="M-Mas-Plat.dc.html">{volver}</a>'
             '<div class="tit"><h1>Biblioteca de formularios</h1><span class="sub">Administración</span></div>'
             f'<button type="button" class="ap-ib" aria-label="Filtros">{fil}</button></div>')
    orden = (f'<sc-if value="{{{{ordTel}}}}" hint-placeholder-val="{{{{si}}}}"><div class="b2-ordtel"><button type="button" '
             f'aria-haspopup="dialog">{ORDEN_NOMBRE} {b2.SVG_FLECHA}</button></div></sc-if>')
    lista = ('<sc-if value="{{lista}}" hint-placeholder-val="{{si}}">' + barra + orden
             + '<sc-if value="{{conFilas}}" hint-placeholder-val="{{si}}"><div class="ap-cuerpo">'
             + "".join(tarjeta_tel(p) for p in PLANTILLAS) + "</div></sc-if>"
             + f'<sc-if value="{{{{cargando}}}}" hint-placeholder-val="{{{{no}}}}">{CARGA_TEL}</sc-if>'
             + vacio("vacia", "Todavía no hay plantillas.")
             + vacio("sinResultados", 'Ninguna plantilla coincide con los filtros.<button type="button" class="cb cb-sec">Limpiar filtros</button>')
             + vacio("error", 'No pudimos cargar las plantillas.<button type="button" class="cb cb-sec">Reintentar</button>')
             + nav + "</sc-if>")
    filtros = ('<sc-if value="{{filtros}}" hint-placeholder-val="{{no}}">'
               + pantalla("Filtros", "Biblioteca de formularios",
                          e12l.campo_tel("Estado", ESTADOS_FILTRO[0]) + e12l.campo_tel("Categoría", "Todas las categorías"),
                          '<button type="button" class="cb cb-sec">Limpiar todo</button><button type="button" class="cb cb-pri">Listo</button>')
               + "</sc-if>")
    ordenar = ('<sc-if value="{{ordenar}}" hint-placeholder-val="{{no}}">'
               + pantalla("Ordenar por", None, e12l.campo_tel("Columna", "Plantilla") + e12l.campo_tel("Orden", "De la A a la Z"),
                          '<button type="button" class="cb cb-pri">Listo</button>')
               + "</sc-if>")
    t = t[:a] + lista + filtros + ordenar + '<span class="ap-raya"></span>' + t[fin:]

    # El estado nuevo «Ordenar por», después de «Filtros», y los valores de cada estado.
    t = e12l.props(t, lambda p: p["estado"]["options"].insert(p["estado"]["options"].index("Filtros") + 1, "Ordenar por"))
    i = t.index("    const e = this.props.estado ?? 'Todas';")
    j = t.index("    };\n", i) + len("    };\n")
    t = t[:i] + RENDER_TEL + t[j:]
    assert "{{filClase}}" not in t and "hojaFiltros" not in t and "t-opc" not in t.split("</helmet>")[1]
    escribir(nombre, t, nl)
    return True


# ---------------------------------------------------------------------------------------------------------------- nueva plantilla
CATEGORIA_SEL = re.compile(r'<div class="ct sel( ph)?( mal)?" style="display: flex; justify-content: space-between;">([^<]*)' + SVG + "</div>",
                           re.S)


def lista_categorias(elegida):
    return b2.lista([b2.op(n, elegida=n == elegida, activa=n == elegida) for n in CATEGORIAS])


def categoria_en_pieza(cuerpo):
    cuerpo, n = CATEGORIA_SEL.subn(lambda m: b2.campo(m.group(3), vacio=bool(m.group(1)), error=bool(m.group(2)), aria="Categoría"), cuerpo)
    print("  categorías en la pieza:", n)
    return cuerpo


def nueva():
    nombre = "Plat-FRM-Plantilla-Nueva"
    t, nl = leer(nombre)
    if ya_corrio(nombre, t):
        return False
    t = con_css(t, CSS_NUEVA)
    lupa, pil = svgs_bib(t)
    print(nombre)
    assert t.count(RESUMEN_VIEJO) == 4, t.count(RESUMEN_VIEJO)
    t = t.replace(RESUMEN_VIEJO, RESUMEN)
    # Detrás, la biblioteca redibujada.
    fondo = cuerpo_bib(lupa, pil, tabla_bib(PLANTILLAS))
    for estado in ("Con los datos", "Vacío", "Faltan los datos", "Creando"):
        t = cambiar_bloque(t, s_de(t, estado), 1, lambda b: adentro(b, fondo))
    cab, cuerpo, guion = partir(t)
    t = cab + categoria_en_pieza(cuerpo) + guion
    assert 'class="ct sel' not in t

    # «Elegir la categoría»: la pieza abierta, con las cuatro en el orden de Categorías.
    t, _ = clonar(t, "Con los datos", "Elegir la categoría", "Con los datos",
                  abrir(b2.campo("Mantenimiento", aria="Categoría"),
                        b2.campo("Mantenimiento", abierto=True, aria="Categoría", extra=lista_categorias("Mantenimiento")), en=2))
    escribir(nombre, t, nl)
    return True


# ---------------------------------------------------------------------------------------------------------------- la plantilla
def piezas_plantilla(cuerpo):
    """La categoría, «Para quién es», el tipo y el catálogo de una pregunta, en la pieza (262)."""
    cuerpo = categoria_en_pieza(cuerpo)

    def abierta(m):
        v = m.group(1)
        return b2.campo(v, abierto=True, aria="Para quién es",
                        extra=b2.lista([b2.op(n, elegida=n == v, activa=n == v) for n in e14e.PARA_QUIEN]))
    cuerpo, n1 = re.subn(r'<div class="ct sel abierto">([^<]*)' + SVG + r'</div><div class="q-catmn" role="listbox" '
                         r'aria-label="Para quién es">.*?</div>', abierta, cuerpo, flags=re.S)

    def cerrada(m):
        v = m.group(1)
        aria = "Para quién es" if v in e14e.PARA_QUIEN else "Tipo de respuesta" if v in e21r.TIPOS else "Catálogo"
        return b2.campo(v, aria=aria)
    cuerpo, n2 = re.subn(r'<div class="ct sel">([^<]*)' + SVG + "</div>", cerrada, cuerpo, flags=re.S)
    assert 'class="ct sel' not in cuerpo and "q-catmn" not in cuerpo
    print("  piezas: abiertas", n1, "cerradas", n2)
    return cuerpo


def publicacion(cuerpo):
    """La fecha y quién, cada uno en su renglón de la grilla (206 y 263)."""
    cuerpo, n = re.subn(r'<span class="k">(Última publicación|Retirada)</span><span>(\d\d/\d\d/\d{4}, \d\d:\d\d) · ([^<]+)</span>',
                        lambda m: (f'<span class="k">{m.group(1)}</span><span>{m.group(2)}</span>'
                                   f'<span class="k">{POR_QUIEN[m.group(1)]}</span><span>{m.group(3)}</span>'), cuerpo)
    print("  publicación, la fecha y quién por separado:", n)
    return cuerpo


def encabezado_cat(por="Catálogo"):
    celdas = []
    for c in CAT_COLS:
        if c != por:
            celdas.append(f"<span>{c}</span>")
        elif c == "Opciones":
            celdas.append('<span aria-sort="descending"><span class="b2-fl" aria-hidden="true" style="margin: 0 5px 0 0;">↓</span>Opciones</span>')
        else:
            celdas.append(f'<span aria-sort="ascending">{c}<span class="b2-fl" aria-hidden="true">↑</span></span>')
    return f'<div class="w-th ct2">{"".join(celdas)}<span class="sr">Acciones</span></div>'


FILA_CAT = re.compile(r'<div class="w-tr ct2"><span><a href="#">([^<]+)</a></span><span>([^<]+)</span>'
                      r'(<span class="num">(?:<span class="gris">—</span>|\d+)</span>)<span>Pregunta \d+ · ([^<]+)</span>'
                      r'<span class="q-acc2">.*?</span></div>', re.S)


def fila_cat(nombre, origen, num, usa, keb, menu=""):
    return (f'<div class="w-tr ct2"><span><a href="#">{nombre}</a></span><span>{origen}</span>{num}<span>{usa}</span>'
            f'<span class="q-acc2"><button type="button" class="ib" aria-label="Acciones de {nombre}" aria-haspopup="menu" '
            f'aria-expanded="{"true" if menu else "false"}">{keb}</button>{menu}</span></div>')


def menu_cat(nombre, usa, quitar):
    """El ⋮ de un catálogo (261): «Quitar», apagado con su motivo en el tooltip (211)."""
    return (f'<div class="f-menu" role="menu" aria-label="Acciones de {nombre}"><span class="f-mi off" role="menuitem" aria-disabled="true">'
            f'{quitar} Quitar<span class="e-tip" role="tooltip">La usa la pregunta «{usa}». Cambiá la pregunta primero.</span></span></div>')


def catalogos(cuerpo, keb):
    """La pestaña «Catálogos»: el encabezado que ordena (264) y el ⋮ de cada fila (261); «La usa», solo el nombre (206)."""
    viejo = ('<div class="w-th ct2"><span>Catálogo</span><span>De dónde salen las opciones</span><span>Opciones</span><span>La usa</span>'
             '<span class="sr">Acciones</span></div>')
    n_cab = cuerpo.count(viejo)
    cuerpo = cuerpo.replace(viejo, encabezado_cat())
    filas = {}

    def fila(m):
        nombre, origen, num, usa = m.groups()
        filas[nombre] = (origen, num, usa)
        return fila_cat(nombre, origen, num, usa, keb)
    cuerpo, n = FILA_CAT.subn(fila, cuerpo)
    assert n == 2 * n_cab and n_cab == 3, (n, n_cab)
    print("  catálogos: encabezados", n_cab, "filas", n)
    return cuerpo, filas


def plantilla():
    nombre = "Plat-FRM-Plantilla"
    t, nl = leer(nombre)
    if ya_corrio(nombre, t):
        return False
    t = con_css(t, CSS_PLANTILLA)
    keb = e21r.svg_aria(t, "Acciones de Visita a cliente")
    quitar = e21r.svg_aria(t, "Quitar Clientes")
    x = re.search(r'<button type="button" class="ib" aria-label="Cerrar">' + DIBUJO + "</button>", t, re.S).group(1)
    cab, cuerpo, guion = partir(t)
    print(nombre)
    cuerpo = piezas_plantilla(e21r.filas_columnas(cuerpo))
    cuerpo, filas = catalogos(cuerpo, keb)
    cuerpo = publicacion(cuerpo)
    t = cab + cuerpo + guion

    # «Elegir la categoría»: la pieza abierta, con las cuatro en el orden de Categorías.
    t, _ = clonar(t, "Plantilla", "Elegir la categoría", "Para quién es",
                  abrir(b2.campo("Ventas", aria="Categoría"), b2.campo("Ventas", abierto=True, aria="Categoría", extra=lista_categorias("Ventas"))))

    # «Acciones de un catálogo»: el ⋮ de «Clientes» abierto, con «Quitar» apagado y su motivo (261 y 211).
    o, num, usa = filas["Clientes"]
    t, _ = clonar(t, "Catálogos", "Acciones de un catálogo", "Catálogos",
                  abrir(fila_cat("Clientes", o, num, usa, keb), fila_cat("Clientes", o, num, usa, keb, menu_cat("Clientes", usa, quitar))))

    # «Catálogos ordenados por Opciones»: de mayor a menor, la flecha antes del título y lo vacío al final (264).
    def por_opciones(k, b):
        if k != 1:
            return b
        b = una(b, encabezado_cat(), encabezado_cat("Opciones"))
        cli, mot = (fila_cat(n, *filas[n], keb) for n in ("Clientes", "Motivos de visita"))
        return una(b, cli + mot, mot + cli)
    t, _ = clonar(t, "Catálogos", "Catálogos ordenados por Opciones", "Acciones de un catálogo", por_opciones)

    # «Agregar un catálogo»: de dónde salen las opciones, en la pieza abierta (262), con «Escritas a mano» y «Texto» (284).
    t, v = clonar(t, "Catálogos", "Agregar un catálogo", "Un catálogo de los contactos")
    origenes = b2.lista([b2.op(n, d, elegida=k == 0, activa=k == 0) for k, (n, d) in enumerate(ORIGENES)])
    dlg = ('<div class="w-oscuro"><div class="w-dlg cat" role="dialog" aria-modal="true" aria-label="Nuevo catálogo"><div class="dc">'
           f'<span>Nuevo catálogo</span><button type="button" class="ib" aria-label="Cerrar">{x}</button></div><div class="db">'
           '<div class="w-cmp"><span class="rt">De dónde salen las opciones</span>'
           f'{b2.campo(ORIGENES[0][0], abierto=True, aria="De dónde salen las opciones", extra=origenes)}</div>'
           f'<div class="w-cmp"><span class="rt">Tipo de valor</span>{b2.campo("Texto", aria="Tipo de valor")}</div>'
           '<div class="w-cmp ancho"><span class="rt">Nombre <span class="req">*</span></span><div class="ct ph">Nombre del catálogo</div></div>'
           '</div><div class="df"><button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">'
           'Agregar catálogo</button></div></div></div>')
    a, b = sc_ifs(t, s_de(t, "Un catálogo de los contactos"))[2]  # después del catálogo de los contactos abierto
    t = t[:b] + f'<sc-if value="{{{{{v}}}}}" hint-placeholder-val="{{{{no}}}}">{dlg}</sc-if>' + t[b:]
    escribir(nombre, t, nl)
    return True


# ---------------------------------------------------------------------------------------------------------------- las reglas
def casillas_plat(cuerpo, tilde):
    """276 · Después del rol y del rol sugerido de cada «Pedir aprobación a un rol» abierta: sus dos casillas, y la (i) del rol,
    cierta con las dos."""
    n = 0
    while True:
        i = cuerpo.find(f'aria-label="{e21r.ROL_I_VIEJO}"')
        if i < 0:
            break
        a = cuerpo.rfind('<div class="dos">', 0, i)
        b = cierre(cuerpo, a, "div")
        assert i < b, "la (i) del rol no está en la fila del rol y del rol sugerido"
        cuerpo = cuerpo[:a] + cuerpo[a:b].replace(e21r.ROL_I_VIEJO, e21r.ROL_I) + e21r.casillas(tilde) + cuerpo[b:]
        n += 1
    print("  pedir aprobación, con sus casillas:", n)
    return cuerpo


def reglas():
    nombre = "Plat-FRM-Plantilla-Reglas"
    t, nl = leer(nombre)
    if ya_corrio(nombre, t):
        return False
    t = alto(con_css(t, CSS_REGLAS), 1700)  # la regla 1 abierta suma las dos casillas, como `FRM-Editor-Reglas`
    cab, cuerpo, guion = partir(t)
    print(nombre)
    # El diseño que arma «Armar el PDF», en su campo, y no debajo del tipo (263).
    cuerpo, n = DISENO_PLAT.subn(lambda m: f'<div class="w-cmp"><span class="rt">{e21r.DISENO}</span><span class="t3b-lee">{m.group(1)}'
                                           f'{m.group(2)}</span></div>', cuerpo)
    print("  diseño del PDF en su campo:", n)
    cuerpo = e21r.piezas_reglas(cuerpo)
    tilde = re.search(r'<span class="q-chk"><i>' + DIBUJO + "</i>", cuerpo, re.S)
    cuerpo = casillas_plat(cuerpo, tilde.group(1) if tilde else b2.SVG_TILDE)
    t = cab + cuerpo + guion

    # «Elegir la acción»: la acción 3 de la regla 2, abierta en la pieza, con «Pedir aprobación a un rol» apagada y su motivo debajo,
    # así no tapa el campo (211).
    ops = [e21r.op_de(n, apagada=mot, tip_abierto=bool(mot), elegida=n == "Mandar por correo", activa=n == "Mandar por correo")
           for n, mot in ACCIONES]
    lista = b2.lista(ops).replace('<span class="acc-tip " role="tooltip">', '<span class="acc-tip b2-tip-abajo" role="tooltip">', 1)
    t, _ = clonar(t, "Mandar por correo", "Elegir la acción", "Editar una regla",
                  abrir(b2.campo("Mandar por correo", aria="Acción 3"),
                        b2.campo("Mandar por correo", abierto=True, aria="Acción 3", extra=lista)))
    escribir(nombre, t, nl)
    return True


# ---------------------------------------------------------------------------------------------------------------- el PDF
def pdf():
    nombre = "Plat-FRM-Pdf"
    t, nl = leer(nombre)
    if ya_corrio(nombre, t):
        return False
    t = con_css(t, CSS_PDF)
    cab, cuerpo, guion = partir(t)
    print(nombre)

    def estilo(m):
        on = re.search(r'<span class="op on" role="radio" aria-checked="true"><span class="mini [a-z]+">.*?</span>([^<]+)<small>',
                       m.group(0), re.S).group(1)
        return b2.campo(on, aria="Estilo")
    cuerpo, n1 = re.subn(r'<div class="pd-est" role="radiogroup" aria-label="Estilo">.*?</div>', estilo, cuerpo, flags=re.S)

    def seccion(m):
        cabeza, nombre_sec, qs = m.group(1), m.group(2), m.group(3)
        elegidas = [x.group(2) for x in re.finditer(r'<span class="q-chk"><i( class="no")?>(?:' + SVG + r')?</i>([^<]+)</span>', qs, re.S)
                    if not x.group(1)]
        assert elegidas, nombre_sec
        return (cabeza + f'<div class="t3b-qs"><div class="w-cmp"><span class="rt">Preguntas</span>'
                f'{e21r.campo_preguntas(nombre_sec, elegidas)}</div></div>')
    cuerpo, n2 = re.subn(r'(<div class="h"><span>([^<]+)</span>.*?</div>)<div class="qs">(.*?)</div>', seccion, cuerpo, flags=re.S)
    # El encabezado del diseño, sin la línea gris de los datos debajo del nombre (263): la (i) ya dice de dónde salen.
    cuerpo, n3 = re.subn(r'(<div class="pd-enc"><span class="lg ph">Logo</span><span class="tx"><b>Nombre de la organización</b>)'
                         r'<small>[^<]*</small>', r"\1", cuerpo)
    assert 'role="radiogroup"' not in cuerpo and 'class="qs"' not in cuerpo
    print("  estilos:", n1, "secciones:", n2, "encabezados:", n3)
    t = cab + cuerpo + guion

    # «Elegir el estilo»: la pieza abierta, con los tres estilos y lo que es cada uno.
    t, _ = clonar(t, "Diseño", "Elegir el estilo", "Estilo moderno",
                  abrir(b2.campo("Clásico", aria="Estilo"),
                        b2.campo("Clásico", abierto=True, aria="Estilo",
                                 extra=b2.lista([e21r.op_de(n, d, elegida=n == "Clásico", activa=n == "Clásico") for n, d in e21r.ESTILOS]))))
    escribir(nombre, t, nl)
    return True


# ---------------------------------------------------------------------------------------------------------------- publicar y retirar
def publicar():
    nombre = "Plat-FRM-Publicar"
    t, nl = leer(nombre)
    if ya_corrio(nombre, t):
        return False
    t = con_css(t, e14e.CSS_COMPU)
    cab, cuerpo, guion = partir(t)
    print(nombre)
    t = cab + publicacion(piezas_plantilla(e21r.filas_columnas(cuerpo))) + guion
    escribir(nombre, t, nl)
    return True


def retirar():
    nombre = "Plat-FRM-Retirar"
    t, nl = leer(nombre)
    if ya_corrio(nombre, t):
        return False
    t = con_css(t, CSS_RETIRAR)
    cab, cuerpo, guion = partir(t)
    print(nombre)
    escribir(nombre, cab + publicacion(cuerpo) + guion, nl)
    return True


# ---------------------------------------------------------------------------------------------------------------- todo
if __name__ == "__main__":
    hechos = [biblioteca(), biblioteca_tel(), nueva(), plantilla(), reglas(), pdf(), publicar(), retirar()]
    if any(hechos):
        subprocess.run([sys.executable, str(PROJ / "generadores" / "traspaso10_piezas_1004.py"), "--tableros", ",".join(TABLEROS)], check=True)
