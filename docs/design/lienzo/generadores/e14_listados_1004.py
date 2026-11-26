"""Los listados y el catálogo de la E14 con el traspaso 18, tanda 2 (2026-11-26), sobre los tableros de siempre, con la forma que la
E12 dejó en `FRM-Catalogos`, `M-FRM-Catalogos`, `FRM-Catalogo` y `M-FRM-Catalogo` (`e12_listado_1004.py` y `e12_editor_1004.py`):

- `FRM-Formularios`: el filtro «Estado» con su botón, que abre la pieza, sin cantidades (262); el encabezado ordena con la flecha en
  el color de la marca después del título, y «Ordenar por», último en la barra y separado del filtro, dice el orden con palabras y
  abre la pieza con «Columna» y «Orden» (264). «Preguntas», un número, va a la derecha (137). Suma «Ordenar por abierto» y
  «Ordenado por Último cambio» (más reciente primero). El nombre sigue abriendo el editor (275); en la E14 la fila no tiene ⋮.
- `M-FRM-Formularios`: «Ordenar por» arriba de la lista, que abre su pantalla con «Columna» y «Orden» (el estado nuevo «Ordenar
  por»); «Filtros» con «Estado» en la pieza, sin cantidades (262); cada fila, una tarjeta con Preguntas, Último cambio y, a todo
  el ancho, En WhatsApp, cada dato con su nombre y nada unido con «·» debajo del nombre (263).
- `FRM-Catalogos-14`: el listado de la E12 con «Lo usan», que también ordena (264): filtros con su botón, «Ordenar por» último y
  los estados «Ordenar por abierto» y «Ordenado por Lo usan» (de mayor a menor, lo vacío al final). El resumen dice solo
  «8 catálogos» (decisión del usuario del 2026-11-26, respuesta de la tanda 1).
- `M-FRM-Catalogos-14`: como `M-FRM-Catalogos`, con tres datos en la tarjeta (De dónde salen, Lo usan y Estado: sale Opciones);
  la hoja de elegir el origen se va (262) y su estado pasa a «Ordenar por»; «Nuevo catálogo» abre el editor.
- `FRM-Catalogo-14`: lo que se hace con una opción va en su ⋮ (261): «Restaurar» de la que se borra al guardar, con ↑ ↓ ✎ 🗑 a la
  vista en las demás; las filas sin nada en el ⋮ guardan su lugar. Suma «Restaurar una opción» (el ⋮ abierto sobre la que no se
  pudo borrar) y «Reactivar una opción» (la misma, ya dada de baja, como dice el error de la 129, con su ⋮ abierto). «Lo usan» ordena
  con la flecha después de «Formulario» (264).
- `M-FRM-Catalogo-14`: cada opción, una tarjeta con «Código» y, si no está activa, «Estado» (263); el ⋮ de la fila (261). Suma «Una
  opción en uso» (la que eligió una respuesta, que la compu ya tenía), «Restaurar una opción» y «Reactivar una opción», con su hoja.

Cambia los tableros en su lugar; no corre dos veces (el bloque `data-e14="t2"` lo marca). Después va
`traspaso10_piezas_1004.py --tableros FRM-Formularios,M-FRM-Formularios,FRM-Catalogos-14,M-FRM-Catalogos-14,FRM-Catalogo-14,M-FRM-Catalogo-14`,
que pone la escala de la compu.
"""
import json
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import base2_comun as b2  # noqa: E402
import e12_editor_1004 as e12e  # noqa: E402
import e12_listado_1004 as e12l  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = '<style data-e14="t2">'
leer, escribir, una, fin_sc_if, props = e12l.leer, e12l.escribir, e12l.una, e12l.fin_sc_if, e12l.props
cierre, sc_ifs, renombrar, sumar_estados, abrir_menu = e12e.cierre, e12e.sc_ifs, e12e.renombrar, e12e.sumar_estados, e12e.abrir_menu


def con_css(t, css):
    assert MARCA not in t
    return una(t, "</helmet>", f"{MARCA}\n{css}</style>\n</helmet>")


def para_aprobar(t):
    m = re.search(r"<title>([^<]*)</title>", t)
    assert "para aprobar" not in m.group(1)
    return t[:m.end(1)] + " · para aprobar" + t[m.end(1):]


# ---------------------------------------------------------------------------------------------------------------- la compu
CSS_LISTADO = b2.CSS_B2 + """
/* E14 · los listados: los filtros son botones que abren la pieza (262), y «Ordenar por» abre «Columna» y «Orden» (264). */
button.w-pil { font-family: inherit; }
.w-pil[aria-expanded="true"] { border-color: var(--marca); }
.o-fb .b2-pkl.barra { min-width: 220px; }
.b2-ordenar { position: relative; }
.b2-pop { position: absolute; z-index: 30; right: 0; top: calc(100% + 4px); display: grid; grid-template-columns: 1fr 1fr; gap: 12px; width: 420px; padding: 12px; border: 1px solid var(--borde2); border-radius: 3px; background: #fff; box-shadow: 0 12px 32px oklch(0.24 0.014 78 / 0.14); white-space: normal; }
.b2-pop .et { display: block; margin-bottom: 5px; color: var(--t2); font-size: 13px; font-weight: 600; }
.b2-pop .b2-pkl { width: 100%; }
"""


def barra(t, columnas, orden, filtros):
    """La barra de un listado: la búsqueda, cada filtro con su botón y la pieza (262) y «Ordenar por», último y separado (264).
    `filtros`: [(prefijo de las variables, opciones de la lista, sc-if que envuelve al filtro o None)]."""
    i = t.index('<div class="w-caja o-fb">')
    j = b2.fin_div(t, i)
    viejo = t[i:j]
    flecha_pil = re.search(r'\{\{\w+Texto\}\} (<svg.*?</svg>)', viejo, re.S).group(1)
    lupa = re.search(r'<span class="w-bus \{\{busClase\}\}">(<svg.*?</svg>)', viejo, re.S).group(1)
    pop = ('<div class="b2-pop" role="dialog" aria-label="Ordenar por">'
           '<div class="b2-pop-c"><span class="et">Columna</span>'
           + b2.campo(columnas[0], abierto=True, aria="Columna",
                      extra=b2.lista([b2.op(c, elegida=k == 0, activa=k == 0) for k, c in enumerate(columnas)]))
           + '</div><div class="b2-pop-c"><span class="et">Orden</span>' + b2.campo(orden, aria="Orden") + '</div></div>')
    partes = []
    for p, opciones, envuelto in filtros:
        lst = b2.lista([b2.op(o, elegida=k == 0, activa=k == 0, sep=k == 1) for k, o in enumerate(opciones)], barra=True)
        f = (f'<span class="f-env"><button type="button" class="w-pil {{{{{p}Clase}}}}" aria-haspopup="listbox" aria-expanded="{{{{{p}Exp}}}}">'
             f'{{{{{p}Texto}}}} {flecha_pil}</button><sc-if value="{{{{{p}Menu}}}}" hint-placeholder-val="{{{{no}}}}">{lst}</sc-if></span>')
        partes.append(f'<sc-if value="{{{{{envuelto}}}}}" hint-placeholder-val="{{{{si}}}}">{f}</sc-if>' if envuelto else f)
    nuevo = ('<div class="w-caja o-fb">'
             f'<span class="w-bus {{{{busClase}}}}">{lupa} {{{{busqueda}}}}</span>' + "".join(partes)
             + '<sc-if value="{{hayFiltro}}" hint-placeholder-val="{{no}}"><button type="button" class="cb cb-enl">Limpiar filtros</button></sc-if>'
             '<span class="b2-sep" aria-hidden="true"></span><span class="envoltura b2-ordenar">'
             '<button type="button" class="w-pil" aria-haspopup="dialog" aria-expanded="{{ordExp}}">{{ordTexto}} ' + b2.SVG_FLECHA + '</button>'
             f'<sc-if value="{{{{ordMenu}}}}" hint-placeholder-val="{{{{no}}}}">{pop}</sc-if></span></div>')
    return t[:i] + nuevo + t[j:]


def encabezado(clase, columnas, por, sentido, antes=False):
    """El encabezado ordenado por la columna `por`: ↑ o ↓ después del título, o antes en una de números (264)."""
    flecha = "↑" if sentido == "ascending" else "↓"
    celdas = []
    for c in columnas:
        if c != por:
            celdas.append(f"<span>{c}</span>")
        elif antes:
            celdas.append(f'<span aria-sort="{sentido}"><span class="b2-fl" aria-hidden="true" style="margin: 0 5px 0 0;">{flecha}</span>{c}</span>')
        else:
            celdas.append(f'<span aria-sort="{sentido}">{c}<span class="b2-fl" aria-hidden="true">{flecha}</span></span>')
    return f'<div class="w-th {clase}">{"".join(celdas)}</div>'


# ---------------------------------------------------------------------------------------------------------------- Formularios
FORM_COLS = ["Formulario", "Preguntas", "En WhatsApp", "Último cambio"]
ORDEN_FORM = "Ordenar por: Formulario, de la A a la Z"
ORDEN_CAMBIO = "Ordenar por: Último cambio, más reciente primero"
CAMBIOS = {"Visita a cliente": "08/10/2026, 14:20", "Entrega de pedido": "02/10/2026, 09:15",
           "Control de vehículo": "12/10/2026, 17:40", "Reclamo": "14/10/2026, 11:05"}
POR_CAMBIO = ["Reclamo", "Control de vehículo", "Visita a cliente", "Entrega de pedido"]  # el último cambio, el más reciente primero
CSS_FORMULARIOS = CSS_LISTADO + """
/* 137 · los números a la derecha: la cantidad de preguntas. */
.w-th.fx14 > :nth-child(2) { text-align: right; }
.w-tr.fx14 > :nth-child(2) { justify-self: stretch; text-align: right; }
"""


def frm_formularios():
    t, nl = leer("FRM-Formularios")
    t = para_aprobar(con_css(t, CSS_FORMULARIOS))
    t = barra(t, FORM_COLS, "De la A a la Z", [("est", ["Todos los estados", "Publicados", "Borradores"], "conEstado")])
    assert t.count('<span class="ord" aria-hidden="true">▲</span>') == 2
    t = b2.con_orden(t)

    # Las filas por el último cambio, la más reciente primero (264): su propio bloque, como el de la E12.
    i = t.index('<sc-if value="{{conFilas}}"')
    j = fin_sc_if(t, i)
    cuerpo = t[i:j]
    filas = {}
    for m in re.finditer(r'<sc-if value="\{\{r\w+\}\}" hint-placeholder-val="\{\{si\}\}">(<div class="w-tr fx14">.*?)</sc-if>', cuerpo, re.S):
        filas[re.search(r'<a href="[^"]+">([^<]+)</a>', m.group(1)).group(1)] = m.group(1)
    assert sorted(filas) == sorted(CAMBIOS), list(filas)
    pie = re.search(r'<div class="w-pie">.*?</div>', cuerpo, re.S).group(0).replace("{{rango}}", "1–4 de 4")
    # Va después de «Cargando»: la pasada de las piezas copia en la carga el último encabezado de antes, que tiene que ser el de
    # la lista por nombre.
    j = fin_sc_if(t, t.index('<sc-if value="{{cargando}}"'))
    t = t[:j] + ('<sc-if value="{{porCambio}}" hint-placeholder-val="{{no}}">'
                 + encabezado("fx14", FORM_COLS, "Último cambio", "descending") + "".join(filas[n] for n in POR_CAMBIO) + pie
                 + "</sc-if>") + t[j:]

    # Los estados y sus valores.
    def estados(p):
        ops = p["estado"]["options"]
        k = ops.index("Borradores") + 1
        ops[k:k] = ["Ordenar por abierto", "Ordenado por Último cambio"]
    t = props(t, estados)
    t = una(t, "    const lista = !['Sin coincidencias', 'Cargando', 'Todavía no hay formularios', 'No se pudo cargar', 'Sin permiso'].includes(v);\n",
            "    const lista = !['Sin coincidencias', 'Cargando', 'Todavía no hay formularios', 'No se pudo cargar', 'Sin permiso', 'Ordenado por Último cambio'].includes(v);\n"
            "    const porCambio = v === 'Ordenado por Último cambio', ordMenu = v === 'Ordenar por abierto';\n")
    t = una(t, "estMenu, estAlternar: () => {},", "estMenu, estExp: estMenu ? 'true' : 'false',")
    t = una(t, "      estOn_t: pub || bor || baja ? '' : 'on', estOn_p: pub ? 'on' : '', estOn_b: bor ? 'on' : '', estOn_d: baja ? 'on' : '', "
               "estC_t: '4', estC_p: '3', estC_b: '1', estC_d: '1',\n"
               "      estElegir_t: () => {}, estElegir_p: () => {}, estElegir_b: () => {}, estElegir_d: () => {},\n", "")
    t = una(t, "conTabla: v !== 'Sin permiso', conFilas: lista,",
            "conTabla: v !== 'Sin permiso', conFilas: lista, porCambio, ordMenu, ordExp: ordMenu ? 'true' : 'false',\n"
            f"      ordTexto: porCambio ? '{ORDEN_CAMBIO}' : '{ORDEN_FORM}',")
    assert "▲" not in t and "{{estC_" not in t and "{{total}}" not in t and "{{estAlternar}}" not in t
    escribir("FRM-Formularios", t, nl)


CLASE_WA = {"Publicado": "ok", "Borrador": "", "No se pudo publicar": "mal"}
FILA_FORM_TEL = re.compile(r'<div class="ap-fila fx"><a class="tx" href="([^"]+)"><span class="l1">([^<]+)</span>'
                           r'<span class="l2">([^<]*)</span></a></div>')
POR_QUE_FORM = {"No se pudo publicar": "La versión 2 publicada sigue activa."}


def tarjeta_form(m):
    href, nombre, l2 = m.groups()
    preguntas, en_wa = l2.split(" · ", 1)
    est = b2.est(CLASE_WA[en_wa.split(" · ")[0]], en_wa, info=POR_QUE_FORM.get(en_wa))
    # «En WhatsApp» va a todo el ancho, al final: «Publicado · versión 3» no entra en media tarjeta (su punto y su palabra no se cortan).
    return b2.tarjeta(nombre, [("Preguntas", preguntas.removesuffix(" preguntas")), ("Último cambio", CAMBIOS[nombre]),
                               ("En WhatsApp", est, True)], href=href)


def pantalla_ordenar(volver, lista, columna, orden):
    return ('<div class="ap-bar int">'
            f'<a class="ap-ib" aria-label="Volver" href="{lista}.dc.html">{volver}</a>'
            '<div class="tit"><h1>Ordenar por</h1></div></div><div class="ap-cuerpo"><div class="t10-fl">'
            + e12l.campo_tel("Columna", columna) + e12l.campo_tel("Orden", orden)
            + '</div></div><div class="t10-pie"><button type="button" class="cb cb-pri">Listo</button></div>')


def boton_ordenar_tel(t, estados, texto):
    boton = f'<div class="b2-ordtel"><button type="button" aria-haspopup="dialog">{texto} {b2.SVG_FLECHA}</button></div>'
    for s in estados:
        a = t.index(f'<sc-if value="{{{{{s}}}}}"')
        k = t.index('<div class="ap-cuerpo', a)
        assert k < fin_sc_if(t, a)
        t = t[:k] + boton + t[k:]
    return t


def m_frm_formularios():
    t, nl = leer("M-FRM-Formularios")
    t = para_aprobar(con_css(t, e12l.CSS_TEL))

    # «Filtros»: «Estado» con su nombre y la pieza, sin cantidades (262).
    i = t.index('<div class="t10-fl">')
    j = b2.fin_div(t, i)
    assert 'role="radiogroup" aria-label="Estado"' in t[i:j]
    t = t[:i] + '<div class="t10-fl">' + e12l.campo_tel("Estado", "Todos los estados") + "</div>" + t[j:]

    # Las filas como tarjetas (263).
    t, n = FILA_FORM_TEL.subn(tarjeta_form, t)
    assert n == 4, n

    # «Ordenar por» arriba de la lista (264) y su pantalla, un estado nuevo.
    t = boton_ordenar_tel(t, ("s0", "s2", "s3"), ORDEN_FORM)
    volver = re.search(r'<a class="ap-ib" aria-label="Volver" href="M-FRM-Formularios.dc.html">(<svg.*?</svg>)</a>', t, re.S).group(1)
    t = una(t, '<span class="ap-raya"></span>', '<sc-if value="{{s4}}" hint-placeholder-val="{{no}}">'
            + pantalla_ordenar(volver, "M-FRM-Formularios", "Formulario", "De la A a la Z") + '</sc-if><span class="ap-raya"></span>')
    t = props(t, lambda p: p["estado"]["options"].append("Ordenar por"))
    t = una(t, '"No se pudo cargar"].indexOf(e);', '"No se pudo cargar", "Ordenar por"].indexOf(e);')
    t = una(t, "      s3: k === 3,\n", "      s3: k === 3,\n      s4: k === 4,\n")
    assert " · " not in "".join(re.findall(r'<span class="l2">([^<]*)</span>', t))
    escribir("M-FRM-Formularios", t, nl)


# ---------------------------------------------------------------------------------------------------------------- Catálogos
CAT_COLS = ["Catálogo", "De dónde salen", "Tipo de valor", "Opciones", "Lo usan", "Estado"]
ORDEN_CATALOGO = "Ordenar por: Catálogo, de la A a la Z"
ORDEN_USAN = "Ordenar por: Lo usan, de mayor a menor"
# Por «Lo usan»: de mayor a menor, los empates por nombre y lo vacío («—») al final (264).
POR_USAN = ["Productos", "Clientes", "Motivos de visita", "Proveedores", "Supervisores", "Depósitos", "Recargo por zona",
            "Responsables de obra"]
CSS_CATALOGOS = CSS_LISTADO + """
/* 137 · los números a la derecha: la cantidad de opciones. */
.w-th.k14 > :nth-child(4), .w-tr.k14 > :nth-child(4) { text-align: right; }
"""


def frm_catalogos_14():
    t, nl = leer("FRM-Catalogos-14")
    t = para_aprobar(con_css(t, CSS_CATALOGOS))
    assert "FRM-Catalogo-Nuevo" not in t and "FRM-Catalogo-Tipo" not in t
    t = barra(t, CAT_COLS, "De la A a la Z",
              [("ori", ["Todos los orígenes", "Escritas a mano", "De los miembros", "De los contactos de WhatsApp"], None),
               ("est", ["Todos los estados", "Activos", "Dados de baja"], None)])

    # El encabezado: por nombre, la flecha después de «Catálogo»; por «Lo usan», después de «Lo usan» (264).
    i = t.index('<div class="w-th k14">')
    j = b2.fin_div(t, i)
    assert '<span class="ord" aria-hidden="true">▲</span>' in t[i:j]
    t = (t[:i] + f'<sc-if value="{{{{porNombre}}}}" hint-placeholder-val="{{{{si}}}}">{encabezado("k14", CAT_COLS, "Catálogo", "ascending")}</sc-if>'
         f'<sc-if value="{{{{porUsan}}}}" hint-placeholder-val="{{{{no}}}}">{encabezado("k14", CAT_COLS, "Lo usan", "descending")}</sc-if>' + t[j:])

    # Las filas por «Lo usan», en su propio bloque.
    i = t.index('<sc-if value="{{conFilas}}"')
    j = fin_sc_if(t, i)
    cuerpo = t[i:j]
    filas = {}
    for m in re.finditer(r'<sc-if value="\{\{ver\w+\}\}" hint-placeholder-val="\{\{si\}\}">(<div class="w-tr k14">.*?)</sc-if>', cuerpo, re.S):
        filas[re.search(r'<a href="[^"]+">([^<]+)</a>', m.group(1)).group(1)] = m.group(1)
    assert sorted(filas) == sorted(POR_USAN), list(filas)
    pie = re.search(r'<div class="w-pie">.*?</div>', cuerpo, re.S).group(0).replace("{{rango}}", "1–8 de 8")
    t = t[:j] + (f'<sc-if value="{{{{porUsan}}}}" hint-placeholder-val="{{{{no}}}}">' + "".join(filas[n] for n in POR_USAN)
                 + pie + "</sc-if>") + t[j:]

    # Los estados y sus valores.
    t = props(t, lambda p: p["estado"]["options"].extend(["Ordenar por abierto", "Ordenado por Lo usan"]))
    t = una(t, "const lista = ['Todos', 'Filtro abierto', 'Filtro de estado', 'Escritas a mano', 'De los miembros', 'De los contactos'].includes(f);",
            "const lista = ['Todos', 'Filtro abierto', 'Filtro de estado', 'Escritas a mano', 'De los miembros', 'De los contactos', 'Ordenar por abierto'].includes(f);\n"
            "    const porUsan = f === 'Ordenado por Lo usan', ordMenu = f === 'Ordenar por abierto';")
    t = una(t, "'8 catálogos · 7 activos'", "'8 catálogos'")
    t = una(t, "oriClase: elegido ? 'con' : '', oriMenu: f === 'Filtro abierto', oriAlternar: () => {},",
            "oriClase: elegido ? 'con' : '', oriMenu: f === 'Filtro abierto', oriExp: f === 'Filtro abierto' ? 'true' : 'false',")
    t = una(t, "      oriC_t: '8', oriC_m: '5', oriC_b: '2', oriC_c: '1', oriElegir_t: () => {}, oriElegir_m: () => {}, oriElegir_b: () => {}, oriElegir_c: () => {},\n", "")
    t = una(t, "estTexto: 'Estado', estClase: '', estMenu: f === 'Filtro de estado', estAlternar: () => {}, estOn_t: 'on', estOn_a: '', estOn_d: '',",
            "estTexto: 'Estado', estClase: '', estMenu: f === 'Filtro de estado', estExp: f === 'Filtro de estado' ? 'true' : 'false',")
    t = una(t, "      estC_t: '8', estC_a: '7', estC_d: '1', estElegir_t: () => {}, estElegir_a: () => {}, estElegir_d: () => {},\n", "")
    t = una(t, "      oriOn_t: elegido ? '' : 'on', oriOn_m: mano ? 'on' : '', oriOn_b: miembros ? 'on' : '', oriOn_c: contactos ? 'on' : '',\n", "")
    t = una(t, "conFilas: lista,",
            "conFilas: lista, porUsan, porNombre: !porUsan, ordMenu, ordExp: ordMenu ? 'true' : 'false',\n"
            f"      ordTexto: porUsan ? '{ORDEN_USAN}' : '{ORDEN_CATALOGO}',")
    assert "▲" not in t and "{{oriC_" not in t and "{{estC_" not in t and "{{total}}" not in t
    escribir("FRM-Catalogos-14", t, nl)


FILA_CAT_TEL = re.compile(r'<a class="ap-fila" href="([^"]+)"><div class="tx"><span class="l1">([^<]+)</span><span class="l2">([^<]*)</span>'
                          r'<span class="l3">(.*?)</span></div></a>', re.S)
CLASE_CAT = {"Activo": "ok", "De baja": "", "No se puede usar": "mal"}


def tarjeta_cat(m):
    """Tres datos, como la tarjeta de Catálogos de la E12: De dónde salen, Lo usan y Estado (sale Opciones)."""
    href, nombre, l2, l3 = m.groups()
    partes = [x.strip() for x in l2.split(" · ")]
    usan = next((x for x in partes if x.endswith((" formulario", " formularios"))), b2.NADA_T)
    estado = re.search(r'<span class="w-est[^"]*">([^<]+)</span>', l3).group(1)
    por_que = re.search(r'title="([^"]+)"', l3)
    est = b2.est(CLASE_CAT[estado], estado, info=por_que.group(1) if por_que else None)
    return b2.tarjeta(nombre, [("De dónde salen", partes[0]), ("Lo usan", usan), ("Estado", est)], href=href)


def m_frm_catalogos_14():
    t, nl = leer("M-FRM-Catalogos-14")
    t = para_aprobar(con_css(t, e12l.CSS_TEL))

    # Sale el estado «Nuevo catálogo» (la hoja de elegir el origen, 262): en su lugar, la pantalla «Ordenar por» (264).
    a = t.index('<sc-if value="{{s6}}"')
    b = fin_sc_if(t, a)
    c = t.index('<sc-if value="{{s6}}"', b)
    d = fin_sc_if(t, c)
    assert 'aria-label="Nuevo catálogo"' in t[c:d]
    volver = re.search(r'<a class="ap-ib" aria-label="Volver" href="M-FRM-Catalogos-14.dc.html">(<svg.*?</svg>)</a>', t, re.S).group(1)
    t = (t[:a] + '<sc-if value="{{s6}}" hint-placeholder-val="{{no}}">'
         + pantalla_ordenar(volver, "M-FRM-Catalogos-14", "Catálogo", "De la A a la Z") + "</sc-if>" + t[b:c] + t[d:])
    t = props(t, lambda p: p["estado"]["options"].__setitem__(6, "Ordenar por"))
    t = una(t, '"Nuevo catálogo"].indexOf(e);', '"Ordenar por"].indexOf(e);')

    # «Filtros»: cada filtro con su nombre y la pieza, sin cantidades (262).
    i = t.index('<div class="t10-fl">')
    j = b2.fin_div(t, i)
    assert 'role="radiogroup" aria-label="Origen"' in t[i:j]
    t = (t[:i] + '<div class="t10-fl">' + e12l.campo_tel("Origen", "Todos los orígenes") + e12l.campo_tel("Estado", "Todos los estados")
         + "</div>" + t[j:])

    # Las filas como tarjetas (263) y «Nuevo catálogo» al editor (262).
    t, n = FILA_CAT_TEL.subn(tarjeta_cat, t)
    assert n == 8, n
    t, n = re.subn(r'<a class="ap-fab" aria-label="Nuevo catálogo" href="#">', '<a class="ap-fab" aria-label="Nuevo catálogo" href="M-FRM-Catalogo.dc.html">', t)
    assert n == 5, n

    # «Ordenar por» arriba de la lista, salvo sin catálogos (264).
    t = boton_ordenar_tel(t, ("s0", "s2", "s3", "s5"), ORDEN_CATALOGO)
    assert " · " not in "".join(re.findall(r'<span class="l2">([^<]*)</span>', t))
    escribir("M-FRM-Catalogos-14", t, nl)


# ---------------------------------------------------------------------------------------------------------------- el catálogo
EN_USO = "Cemento x 50 kg"
ERROR_EN_USO = "No se puede borrar: la eligió una respuesta. Podés darla de baja."


def reactivar_svg():
    t, _ = leer("FRM-Catalogo")
    return re.search(r'<span class="f-mi" role="menuitem">(<svg class="mi-ic"(?:(?!</svg>).)*</svg>) Reactivar</span>', t, re.S).group(1)


def frm_catalogo_14():
    t, nl = leer("FRM-Catalogo-14")
    t = para_aprobar(con_css(t, e12e.CSS_COMPU))

    # «Lo usan» ordena por «Formulario», con la flecha después del título (264).
    assert t.count('<span class="ord" aria-hidden="true">▲</span>') == 4
    t = b2.con_orden(t)

    nuevos = ["Restaurar una opción", "Reactivar una opción"]
    t, sv = sumar_estados(t, [("Una opción en uso", nuevos)], nuevos)
    lista = json.loads(re.search(r"const k = (\[.*?\])\.indexOf\(e\);", t).group(1))
    s_lo, s_uso = (f"s{lista.index(n)}" for n in ("Lo usan", "Una opción en uso"))

    # El ⋮ de cada fila (261): «Restaurar» de la que se borra al guardar; las demás guardan su lugar.
    lapiz = re.search(r'aria-label="Editar Arena fina">(<svg.*?</svg>)', t, re.S).group(1)
    ancla = 'aria-label="Más acciones de las opciones" aria-haspopup="menu" aria-expanded="{{expMas}}">'
    de = f'aria-label="Editar Reclamo">{lapiz}</button>{ancla}{e12e.svg_tras(t, ancla)}'
    t, keb = e12e.filas_compu(t, de=de)

    # «Restaurar una opción»: el ⋮ abierto sobre la que no se pudo borrar.
    (b_uso, c_uso) = sc_ifs(t, s_uso)
    (b_lo, c_lo) = sc_ifs(t, s_lo)
    bandas = [renombrar(t[b_uso[0]:b_uso[1]], s_uso, sv[nuevos[0]]), renombrar(t[b_lo[0]:b_lo[1]], s_lo, sv[nuevos[1]])]
    restaurar = abrir_menu(renombrar(t[c_uso[0]:c_uso[1]], s_uso, sv[nuevos[0]]), EN_USO, keb, "Restaurar", e12e.SVG_RESTAURAR)

    # «Reactivar una opción»: la misma opción, ya dada de baja como dice el error, con ↑ ↓ ✎ 🗑 a la vista y su ⋮ abierto.
    cuerpo = renombrar(t[c_lo[0]:c_lo[1]], s_lo, sv[nuevos[1]])
    k = cuerpo.index(f'aria-label="Activa: {EN_USO}"')
    a = cuerpo.rindex('<div class="w-tr kf">', 0, k)
    b = cierre(cuerpo, a, "div")
    fila = cuerpo[a:b].replace('<div class="w-tr kf">', '<div class="w-tr kf baja">', 1)
    fila, n = re.subn(r'<span class="k-chk on" role="checkbox" aria-checked="true" aria-label="Activa: %s"><svg.*?</svg></span>' % re.escape(EN_USO),
                      f'<span class="k-chk" role="checkbox" aria-checked="false" aria-label="Activa: {EN_USO}"></span>', fila, flags=re.S)
    assert n == 1
    fila = una(fila, '<span class="ib k-keb0" aria-hidden="true"></span>',
               f'<button type="button" class="ib" aria-label="Acciones de {EN_USO}" aria-haspopup="menu" aria-expanded="false">{keb}</button>')
    fila = abrir_menu(fila, EN_USO, keb, "Reactivar", reactivar_svg())
    reactivar = cuerpo[:a] + fila + cuerpo[b:]

    # Las bandas van después de la última banda de siempre; los cuerpos, después del último cuerpo (antes de los diálogos).
    ultimos = sc_ifs(t, "s4")
    fin_bandas, fin_cuerpos = ultimos[0][1], ultimos[1][1]
    t = t[:fin_bandas] + "".join(bandas) + t[fin_bandas:fin_cuerpos] + restaurar + reactivar + t[fin_cuerpos:]
    assert "cb cb-sec\" aria-label=\"Restaurar" not in t and ">Reactivar</button>" not in t
    escribir("FRM-Catalogo-14", t, nl)


CSS_TEL_CATALOGO = e12e.CSS_TEL + """
/* E14 · El error de la opción que eligió una respuesta, debajo de su tarjeta (129; 263 deja el error de un campo). */
.q-tj .q-err { grid-row: 3; grid-column: 2 / -1; display: flex; align-items: flex-start; gap: 6px; margin: 6px 0 0; color: var(--peligro); font-size: 13.5px; line-height: 1.35; }
.q-tj .q-err svg { flex: none; width: 16px; height: 16px; margin-top: 1px; }
"""


def hoja_tel(t, titulo, accion):
    x = re.search(r'<div class="hc"><div><h2>[^<]+</h2></div><button type="button" class="ap-ib" aria-label="Cerrar">(<svg.*?</svg>)', t, re.S).group(1)
    return (f'<div class="ap-velo"></div><div class="ap-hoja" role="dialog" aria-label="{titulo}"><span class="asa"></span>'
            f'<div class="hc"><div><h2>{titulo}</h2></div><button type="button" class="ap-ib" aria-label="Cerrar">{x}</button></div>'
            f'<div class="hb"><div class="ap-acciones2"><span role="menuitem">{accion}</span></div></div><div class="hp"></div></div>')


def m_frm_catalogo_14():
    t, nl = leer("M-FRM-Catalogo-14")
    t = para_aprobar(con_css(t, CSS_TEL_CATALOGO))
    keb = re.search(r'class="ap-ib" aria-label="Más acciones">(<svg.*?</svg>)', t, re.S).group(1)
    err = re.search(r'<span class="k-err-f" role="alert">(<svg.*?</svg>)', leer("FRM-Catalogo-14")[0], re.S).group(1)

    # El ⋮ de cada fila guarda su lugar (261) y cada opción es una tarjeta (263).
    out, pos = [], 0
    for m in re.finditer(r'<span class="q-acc">', t):
        fin = cierre(t, m.start(), "span")
        out.append(t[pos:fin - 7] + '<span class="ap-ib q-keb0" aria-hidden="true"></span></span>')
        pos = fin
    t = "".join(out) + t[pos:]
    t = e12e.tarjetas_tel(t)

    nuevos = ["Una opción en uso", "Restaurar una opción", "Reactivar una opción"]
    t, sv = sumar_estados(t, [("Un campo en uso", nuevos)], nuevos)

    # La opción que eligió una respuesta, cuarta en la lista: por borrar con su error, o ya dada de baja.
    (c_lo,) = sc_ifs(t, "s1")
    base = t[c_lo[0]:c_lo[1]]
    i = base.index('<span class="q-acc"><button type="button" class="ap-ib" aria-label="Subir Caño PVC 110 x 4 m"')
    acc = base[i:cierre(base, i, "span")]
    acc_baja = una(acc.replace("Caño PVC 110 x 4 m", EN_USO), '<span class="ap-ib q-keb0" aria-hidden="true"></span>',
                   f'<button type="button" class="ap-ib" aria-label="Acciones de {EN_USO}" aria-haspopup="menu" aria-expanded="false">{keb}</button>')
    codigo = f'<span class="c"><span class="k">Código</span><span class="v mono">CEM50</span></span>'
    borrar = (f'<div class="b2-tj q-tj borrar"><span class="num">4</span><span class="nm">{EN_USO}</span><span class="q-acc">'
              f'<button type="button" class="ap-ib" aria-label="Acciones de {EN_USO}" aria-haspopup="menu" aria-expanded="false">{keb}</button></span>'
              f'<span class="dl">{codigo}<span class="c"><span class="k">Estado</span><span class="v"><span class="b2-est mal">Se borra al guardar</span>'
              f'</span></span></span><span class="q-err" role="alert">{err}{ERROR_EN_USO}</span></div>')
    baja = (f'<div class="b2-tj q-tj baja"><span class="num">4</span><span class="nm">{EN_USO}</span>{acc_baja}'
            f'<span class="dl">{codigo}<span class="c"><span class="k">Estado</span><span class="v"><span class="b2-est">De baja</span></span></span></span></div>')
    pie = ('<div class="ap-fijo"><button type="button" class="cb cb-sec full">Descartar</button>'
           '<button type="button" class="cb cb-pri full">Guardar cambios</button></div>')

    def con_opcion(cuerpo, tarjeta, con_pie):
        i = cuerpo.index('<div class="ap-grupo">', cuerpo.index('<div class="ap-gtit">Opciones</div>'))
        j = cierre(cuerpo, i, "div")
        cuerpo = cuerpo[:j - 6] + tarjeta + cuerpo[j - 6:]
        assert cuerpo.endswith("</sc-if>")
        return cuerpo[:-8] + (pie if con_pie else "") + "</sc-if>"

    cuerpos = [con_opcion(renombrar(base, "s1", sv[nuevos[0]]), borrar, True),
               con_opcion(renombrar(base, "s1", sv[nuevos[1]]), borrar, True),
               con_opcion(renombrar(base, "s1", sv[nuevos[2]]), baja, False)]
    capas = [f'<sc-if value="{{{{{sv[nuevos[1]]}}}}}" hint-placeholder-val="{{{{no}}}}">{hoja_tel(t, EN_USO, "Restaurar")}</sc-if>',
             f'<sc-if value="{{{{{sv[nuevos[2]]}}}}}" hint-placeholder-val="{{{{no}}}}">{hoja_tel(t, EN_USO, "Reactivar")}</sc-if>']
    t = una(t, '<span class="ap-raya"></span>', "".join(cuerpos) + '<span class="ap-raya"></span>')
    k = t.rindex("</div>\n</x-dc>")
    t = t[:k] + "".join(capas) + t[k:]
    assert "q-row" not in re.sub(r"<style\b.*?</style>", "", t, flags=re.S)
    escribir("M-FRM-Catalogo-14", t, nl)


if __name__ == "__main__":
    for nombre, f in (("FRM-Formularios", frm_formularios), ("M-FRM-Formularios", m_frm_formularios),
                      ("FRM-Catalogos-14", frm_catalogos_14), ("M-FRM-Catalogos-14", m_frm_catalogos_14),
                      ("FRM-Catalogo-14", frm_catalogo_14), ("M-FRM-Catalogo-14", m_frm_catalogo_14)):
        if MARCA in leer(nombre)[0]:
            print(nombre, "ya tiene el bloque: no hace nada")
            continue
        f()
