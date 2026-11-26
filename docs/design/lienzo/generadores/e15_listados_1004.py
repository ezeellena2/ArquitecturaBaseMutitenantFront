"""Los listados y la planilla de la E15 (Respuestas) con el traspaso 18, tanda 3A (2026-11-26), sobre los tableros de siempre, con
la forma que la E14 dejó en `FRM-Formularios` y `M-FRM-Formularios` (`e14_listados_1004.py`) y las piezas de `base2_comun.py`:

- `FRM-Formularios-15`: el nombre abre «Diseño» (el editor) y el número de respuestas, la planilla (275); quien solo ve respuestas
  no tiene «Diseño» y su nombre sigue abriendo «Respuestas». Lo que la E14 sumó a la lista pasa a esta etapa: el filtro «Estado»
  con su botón, que abre la pieza, sin cantidades (262); el encabezado ordena con la flecha en el color de la marca, y «Ordenar
  por», último en la barra y separado del filtro, dice el orden con palabras y abre la pieza con «Columna» y «Orden» (264).
  «Respuestas», un número, va a la derecha, y su flecha antes del título (137 y 264). Suma «Ordenar por abierto» y «Ordenado por
  Respuestas» (de mayor a menor; el formulario sin respuestas, al final).
- `M-FRM-Formularios-15`: deja de juntar «N respuestas · estado» debajo del nombre: cada fila es una tarjeta con Respuestas,
  Recibida y, a todo el ancho, En WhatsApp, cada dato con su nombre (263), como la v186 de `M-FRM-Formularios`. La tarjeta abre
  «Diseño» y el número de respuestas, con su propia zona de toque, la planilla (275). «Ordenar por» arriba de la lista, que abre su
  pantalla (el estado nuevo «Ordenar por», 264), y «Filtros» con «Estado» en la pieza, sin cantidades (262).
- `FRM-Respuestas`: «Empresa» es un filtro con su botón, que abre la pieza (262); «Columnas» pasa de la lista de casillas a la pieza
  múltiple de la E13 (`FRM-Catalogo-13`, que la planilla reusa: `ColumnsMenu`), con sus grupos, el buscador y la cantidad porque son
  más de diez, N° apagada con su motivo y «Mostrar todas» al pie (262 y 211); «Ordenar por», último y separado de los filtros,
  dice «Recibida, más reciente primero» (264); el encabezado ordena con ↓ después de «Recibida», el orden sin elegir. Suma tres
  estados: «Ordenar por abierto» (la pieza con «Columna» y «Orden»; solo las columnas que ordenan: sin Cargó, Empresas ni Fallas,
  que elige varias), «Ordenada por Cliente» (de la A a la Z, con ↕ al pasar sobre «Motivo») y «Ordenada por un dato del catálogo»
  («Proveedor · CUIT», de la A a la Z, con lo vacío al final).
- `M-FRM-Respuestas`: cada fila es una tarjeta con Recibida, Cargó, Empresas y Cliente, sin datos unidos con «·» (263); la de un
  cliente dice «Es cliente: Sí» donde las demás dicen sus empresas, porque un cliente no tiene empresas (206). «Ordenar por», a todo
  el ancho arriba de la lista, con su pantalla (264). «Filtros» lleva cada filtro con su nombre y la pieza, también «Empresa», y
  «Monto estimado» con «Desde» y «Hasta» (262); una pregunta abre la pieza a pantalla completa (sale la lista con «Listo»), y la del
  servidor, «Cliente», con el buscador, la cantidad y «Mostrar 20 más» (el estado nuevo «Filtros: una pregunta del servidor»).
  La hoja de exportar pierde «Columnas»: en el teléfono no hay y exporta todas las preguntas, como dice la spec.
- `FRM-Respuestas-Filtros`: lo que se elige en una pregunta es la pieza: cerrada, un campo con su flecha; abierta, la lista con la
  tilde a la izquierda (262), y ya no el combo que busca escribiendo. Suma tres estados con «Cliente», que sale de los contactos (del
  servidor): el buscador adentro de la lista con «486 opciones» y «Mostrar 20 más», «Buscando…» y «Ninguna opción coincide…», como
  `Criterio-Elegir`. La planilla de atrás, con la barra y el encabezado de `FRM-Respuestas`.
- `FRM-Respuestas-Exportar`: «Columnas» pasa de los dos radios a la pieza (262), con su (i), que abre su tooltip en lugar del
  `title` del navegador; «Solo las visibles» apagada lleva su motivo en la lista (211). Suma «Columnas abierta». La planilla de
  atrás, como `FRM-Respuestas`.

Cambia los tableros en su lugar; no corre dos veces (el bloque `data-e15="t3"` lo marca). Al final corre
`traspaso10_piezas_1004.py --tableros` con los seis, que pone la escala de la compu. Para volver a correrlo, primero se restauran los
seis tableros (`git show HEAD:docs/design/lienzo/<Nombre>.dc.html`). No toca `canvas.json`.
"""
import json
import pathlib
import re
import subprocess
import sys

G = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(G))
import acciones_asistente_1004 as acc  # noqa: E402
import base2_comun as b2  # noqa: E402
import e12_editor_1004 as e12e  # noqa: E402
import e12_listado_1004 as e12l  # noqa: E402
import e14_listados_1004 as e14l  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
MARCA = '<style data-e15="t3">'
TABLEROS = ["FRM-Formularios-15", "M-FRM-Formularios-15", "FRM-Respuestas", "M-FRM-Respuestas", "FRM-Respuestas-Filtros",
            "FRM-Respuestas-Exportar"]
leer, escribir, una, fin_sc_if, props = e12l.leer, e12l.escribir, e12l.una, e12l.fin_sc_if, e12l.props
cierre, sc_ifs, renombrar = e12e.cierre, e12e.sc_ifs, e12e.renombrar


def con_css(t, css):
    assert MARCA not in t
    return una(t, "</helmet>", f"{MARCA}\n{css}</style>\n</helmet>")


def para_aprobar(t):
    m = re.search(r"<title>([^<]*)</title>", t)
    assert "para aprobar" not in m.group(1)
    return t[:m.end(1)] + " · para aprobar" + t[m.end(1):]


def sumar(t, despues, nuevos, base):
    """Suma los estados (como `sumar_estados` de la E12) y, si el tablero tiene migas por estado, la de su estado de base."""
    t, sv = e12e.sumar_estados(t, despues, nuevos)
    m = re.search(r"miga: (\[.*?\])\[k\]", t)
    if m:
        migas = json.loads(m.group(1))
        migas += [migas[int(base[n][1:])] for n in nuevos]
        t = t[:m.start(1)] + json.dumps(migas, ensure_ascii=False) + t[m.end(1):]
    return t, sv


def copiar_estado(t, base, nuevo, cambiar):
    """Cada `sc-if` del estado `base`, copiado para `nuevo` justo después del suyo; `cambiar(bloque)` ajusta la copia."""
    for a, b in reversed(sc_ifs(t, base)):
        t = t[:b] + cambiar(renombrar(t[a:b], base, nuevo)) + t[b:]
    return t


def pop_orden(columnas, elegida, orden):
    """La pieza de «Ordenar por» (264): «Columna», abierta con la elegida tildada, y «Orden»."""
    return ('<div class="b2-pop" role="dialog" aria-label="Ordenar por">'
            '<div class="b2-pop-c"><span class="et">Columna</span>'
            + b2.campo(elegida, abierto=True, aria="Columna",
                       extra=b2.lista([b2.op(c, elegida=c == elegida, activa=c == elegida) for c in columnas]))
            + '</div><div class="b2-pop-c"><span class="et">Orden</span>' + b2.campo(orden, aria="Orden") + '</div></div>')


CSS_POP = """
/* E15 · los filtros son botones que abren la pieza (262), y «Ordenar por» abre «Columna» y «Orden» (264). */
button.w-pil { font: inherit; }
.w-pil[aria-expanded="true"] { border-color: var(--marca); }
.o-fb .b2-pkl.barra { min-width: 220px; }
.b2-ordenar { position: relative; }
.b2-pop { position: absolute; z-index: 30; right: 0; top: calc(100% + 4px); display: grid; grid-template-columns: 1fr 1fr; gap: 12px; width: 420px; padding: 12px; border: 1px solid var(--borde2); border-radius: 3px; background: #fff; box-shadow: 0 12px 32px oklch(0.24 0.014 78 / 0.14); white-space: normal; text-align: left; }
.b2-pop .et { display: block; margin-bottom: 5px; color: var(--t2); font-size: 13px; font-weight: 600; }
.b2-pop .b2-pkl { width: 100%; }
"""


# ---------------------------------------------------------------------------------------------------------------- Formularios
FORM_COLS = ["Formulario", "En WhatsApp", "Respuestas", "Última respuesta", "Recibida"]
ORDEN_FORM = "Ordenar por: Formulario, de la A a la Z"
ORDEN_RESP = "Ordenar por: Respuestas, de mayor a menor"
POR_RESP = ["Entrega de pedido", "Control de vehículo", "Visita a cliente", "Reclamo"]  # 48, 31, 24 y 0: sin respuestas, al final
CSS_FORMULARIOS = b2.CSS_B2 + CSS_POP + """
/* 137 · los números a la derecha: la cantidad de respuestas. */
.w-th.fx15 > :nth-child(3), .w-th.fx3 > :nth-child(2) { text-align: right; }
.w-tr.fx15 > :nth-child(3), .w-tr.fx3 > :nth-child(2) { justify-self: stretch; text-align: right; }
/* 275 · el nombre abre «Diseño» y el número de respuestas, la planilla. */
.w-tr .fx-cnt { color: var(--marca-tx); font-weight: 600; text-decoration: none; }
.w-tr .fx-cnt:hover { text-decoration: underline; }
"""
CNT = re.compile(r'<span class="num">(\d+)</span>(<span><a class="fx-num")')


def con_enlace_cnt(bloque, cuantos):
    """El número de respuestas abre la planilla (275); el 0 de un borrador no tiene planilla."""
    bloque, n = CNT.subn(lambda m: f'<span class="num"><a class="fx-cnt" href="FRM-Respuestas.dc.html">{m.group(1)}</a></span>{m.group(2)}', bloque)
    assert n == cuantos, n
    return bloque


def frm_formularios_15():
    t, nl = leer("FRM-Formularios-15")
    t = para_aprobar(con_css(t, CSS_FORMULARIOS))
    t = e14l.barra(t, FORM_COLS, "De la A a la Z", [("est", ["Todos los estados", "Publicados", "Borradores"], "conEstado")])
    assert t.count('<span class="ord" aria-hidden="true">▲</span>') == 4
    t = b2.con_orden(t)

    # Con los dos permisos, el nombre abre «Diseño» y el número, la planilla (275).
    i = t.index('<sc-if value="{{colsTodas}}"')
    j = fin_sc_if(t, i)
    todas, n = re.subn(r'<span class="fx-n"><a href="FRM-Respuestas\.dc\.html">', '<span class="fx-n"><a href="FRM-Editor.dc.html">', t[i:j])
    assert n == 3, n
    todas = con_enlace_cnt(todas, 3)
    # El bloque va último en la lista: la pasada de las piezas copia en la carga el último encabezado de antes, y la carga tiene
    # que mostrar el de quien tiene los dos permisos.
    t = t[:i] + t[j:]
    k = t.index('<div class="w-pie">', t.index('<sc-if value="{{conFilas}}"'))
    t = t[:k] + todas + t[k:]

    # Quien solo ve respuestas: su nombre sigue abriendo «Respuestas», y el número también (275).
    i = t.index('<sc-if value="{{colsLee}}"')
    j = fin_sc_if(t, i)
    assert t[i:j].count('<a href="FRM-Respuestas.dc.html">') == 3 and "FRM-Editor" not in t[i:j]
    t = t[:i] + con_enlace_cnt(t[i:j], 3) + t[j:]

    # Las filas por la cantidad de respuestas, de mayor a menor (264), en su bloque, después de «Cargando».
    filas = {}
    for m in re.finditer(r'<sc-if value="\{\{r\w+\}\}" hint-placeholder-val="\{\{si\}\}">(<div class="w-tr fx15">.*?)</sc-if>', todas, re.S):
        filas[re.search(r'<a href="[^"]+">([^<]+)</a>', m.group(1)).group(1)] = m.group(1)
    assert sorted(filas) == sorted(POR_RESP), list(filas)
    pie = '<div class="w-pie"><span>1–4 de 4</span><span>10 por página · Página 1 de 1</span></div>'
    j = fin_sc_if(t, t.index('<sc-if value="{{cargando}}"'))
    t = t[:j] + ('<sc-if value="{{porResp}}" hint-placeholder-val="{{no}}">'
                 + e14l.encabezado("fx15", FORM_COLS, "Respuestas", "descending", antes=True)
                 + "".join(filas[n] for n in POR_RESP) + pie + "</sc-if>") + t[j:]

    # Los estados y sus valores.
    def estados(p):
        ops = p["estado"]["options"]
        k = ops.index("Borradores") + 1
        ops[k:k] = ["Ordenar por abierto", "Ordenado por Respuestas"]
    t = props(t, estados)
    t = una(t, "    const lista = !['Sin coincidencias', 'Cargando', 'Todavía no hay formularios', 'No se pudo cargar', 'Sin permiso'].includes(v);\n",
            "    const lista = !['Sin coincidencias', 'Cargando', 'Todavía no hay formularios', 'No se pudo cargar', 'Sin permiso', 'Ordenado por Respuestas'].includes(v);\n"
            "    const porResp = v === 'Ordenado por Respuestas', ordMenu = v === 'Ordenar por abierto';\n")
    t = una(t, "estMenu, estAlternar: () => {},", "estMenu, estExp: estMenu ? 'true' : 'false',")
    t = una(t, "      estOn_t: pub || bor || baja ? '' : 'on', estOn_p: pub ? 'on' : '', estOn_b: bor ? 'on' : '', estOn_d: baja ? 'on' : '', "
               "estC_t: '4', estC_p: '3', estC_b: '1', estC_d: '1',\n"
               "      estElegir_t: () => {}, estElegir_p: () => {}, estElegir_b: () => {}, estElegir_d: () => {},\n", "")
    t = una(t, "conTabla: v !== 'Sin permiso', conFilas: lista,",
            "conTabla: v !== 'Sin permiso', conFilas: lista, porResp, ordMenu, ordExp: ordMenu ? 'true' : 'false',\n"
            f"      ordTexto: porResp ? '{ORDEN_RESP}' : '{ORDEN_FORM}',")
    assert "▲" not in t and "{{estC_" not in t and "{{total}}" not in t and "{{estAlternar}}" not in t
    assert t.count('class="fx-cnt"') == 9  # 3 con los dos permisos, 3 de quien solo ve respuestas y 3 ordenadas
    escribir("FRM-Formularios-15", t, nl)


CSS_TEL_FORMULARIOS = e12l.CSS_TEL + """
/* 275 · la tarjeta abre «Diseño»; el número de respuestas, la planilla, con su propia zona de toque de 44 px. */
.e15-tj .b2-tj-a::after { content: ""; position: absolute; inset: 0; }
.e15-tj .dl { position: relative; pointer-events: none; }
.e15-tj .dl .b2-i { pointer-events: auto; }
.e15-tj .e15-cnt { position: relative; z-index: 1; display: inline-flex; align-items: center; min-height: 44px; margin: -12px 0; padding-right: 24px; color: var(--marca-tx); font-weight: 600; text-decoration: none; pointer-events: auto; }
"""
FILA_FORM_TEL = re.compile(r'<div class="ap-fila fx"><a class="tx" href="([^"]+)"><span class="l1">([^<]+)</span>'
                           r'<span class="l2">([^<]*)</span></a></div>')
RECIBIDA = {"Visita a cliente": "15/10/2026, 16:20", "Entrega de pedido": "14/10/2026, 10:05", "Control de vehículo": "12/10/2026, 18:05"}
CLASE_WA = {"Publicado": "ok", "Borrador": "", "No se pudo publicar": "mal"}
POR_QUE_FORM = {"No se pudo publicar": "La versión 2 publicada sigue activa."}


def celda(k, v, todo=False):
    return f'<span class="c{" todo" if todo else ""}"><span class="k">{k}</span><span class="v">{v}</span></span>'


def tarjeta_form(m):
    _, nombre, l2 = m.groups()
    respuestas, en_wa = l2.split(" · ", 1)
    cuantas = respuestas.removesuffix(" respuestas")
    est = b2.est(CLASE_WA[en_wa.split(" · ")[0]], en_wa, info=POR_QUE_FORM.get(en_wa))
    num = cuantas if cuantas == "0" else f'<a class="e15-cnt" href="M-FRM-Respuestas.dc.html">{cuantas}</a>'
    datos = celda("Respuestas", num) + celda("Recibida", RECIBIDA.get(nombre, b2.NADA_T)) + celda("En WhatsApp", est, True)
    return (f'<div class="b2-tj e15-tj"><a class="b2-tj-a" href="M-FRM-Editor.dc.html"><span class="cu"><span class="nm">{nombre}</span>'
            f'</span></a><span class="dl">{datos}</span></div>')


def m_frm_formularios_15():
    t, nl = leer("M-FRM-Formularios-15")
    t = para_aprobar(con_css(t, CSS_TEL_FORMULARIOS))

    # «Filtros»: «Estado» con su nombre y la pieza, sin cantidades (262).
    i = t.index('<div class="t10-fl">')
    j = b2.fin_div(t, i)
    assert 'role="radiogroup" aria-label="Estado"' in t[i:j]
    t = t[:i] + '<div class="t10-fl">' + e12l.campo_tel("Estado", "Todos los estados") + "</div>" + t[j:]

    # Las filas como tarjetas (263), que abren «Diseño» (275).
    t, n = FILA_FORM_TEL.subn(tarjeta_form, t)
    assert n == 4, n

    # «Ordenar por» arriba de la lista (264) y su pantalla, un estado nuevo.
    t = e14l.boton_ordenar_tel(t, ("s0", "s2", "s3"), ORDEN_FORM)
    volver = re.search(r'<a class="ap-ib" aria-label="Volver" href="M-FRM-Formularios-15.dc.html">(<svg.*?</svg>)</a>', t, re.S).group(1)
    t = una(t, '<span class="ap-raya"></span>', '<sc-if value="{{s4}}" hint-placeholder-val="{{no}}">'
            + e14l.pantalla_ordenar(volver, "M-FRM-Formularios-15", "Formulario", "De la A a la Z") + '</sc-if><span class="ap-raya"></span>')
    t = props(t, lambda p: p["estado"]["options"].append("Ordenar por"))
    t = una(t, '"No se pudo cargar"].indexOf(e);', '"No se pudo cargar", "Ordenar por"].indexOf(e);')
    t = una(t, "      s3: k === 3,\n", "      s3: k === 3,\n      s4: k === 4,\n")
    assert " · " not in "".join(re.findall(r'<span class="l2">([^<]*)</span>', t)) and 'role="radiogroup"' not in t
    escribir("M-FRM-Formularios-15", t, nl)


# ---------------------------------------------------------------------------------------------------------------- la planilla
ORDEN_RECIBIDA = "Ordenar por: Recibida, más reciente primero"
ORDEN_CLIENTE = "Ordenar por: Cliente, de la A a la Z"
ORDEN_CUIT = "Ordenar por: Proveedor · CUIT, de la A a la Z"
# Las columnas que ordenan de la planilla de «Visita a cliente» (264): sin Cargó (el nombre no vive en Formularios), Empresas ni
# Fallas, que elige varias.
COLS_ORDENAN = ["N°", "Recibida", "Es cliente", "Canal", "Cliente", "¿Se concretó la venta?", "Monto estimado", "Motivo", "Observaciones",
                "Contacto en el local"]
EMPRESAS = ["Todas las empresas", "Delta Norte S.A.", "Delta S.A.", "Delta Sur S.R.L.", "Sin empresa"]
CSS_PLANILLA = b2.CSS_B2 + CSS_POP + """
/* E15 · «Ordenar por», último en la barra y separado de los filtros (264). */
.pl-fb .pl-der .b2-ordenar { margin-left: 0; }
/* «Columnas», la pieza múltiple (262): los grupos de columnas, como en la lista de antes. */
.b2-pkl .ops > .g { padding: 8px 12px 4px; border-top: 1px solid var(--borde); color: var(--t2); font-size: 12.5px; font-weight: 600; }
.b2-pkl .ops > .g:first-child { border-top: 0; }
.b2-pkl .ops > .g + .b2-op { border-top: 0; }
.pl-der .b2-pkl .ops { max-height: none; }
.b2-op.apag .cb.on { border-color: oklch(0.75 0.01 78); background: oklch(0.75 0.01 78); }
"""
EMPRESA = re.compile(r'<span class="f-env"><span class="w-pil( con)?" role="button" aria-haspopup="listbox">([^<]+) (<svg.*?</svg>)</span>', re.S)


def pieza_empresa():
    """«Todas las empresas» primero y separada; «Sin empresa», al final y separada (262), sin cantidades."""
    return b2.lista([b2.op(o, elegida=k == 0, activa=k == 0, sep=k in (1, len(EMPRESAS) - 1)) for k, o in enumerate(EMPRESAS)], barra=True)


def barra_planilla(barra, orden):
    """La barra de la planilla: «Empresa» con su botón y la pieza (262) y, al final, «Ordenar por», separado (264)."""
    i = barra.index('<span class="f-env">')
    j = cierre(barra, i, "span")
    m = EMPRESA.match(barra[i:j])
    assert m, barra[i:i + 200]
    con, texto, svg = m.groups()
    abierta = 'aria-label="Filtrar por empresa"' in barra[i:j]
    barra = (barra[:i] + f'<span class="f-env"><button type="button" class="w-pil{con or ""}" aria-haspopup="listbox" '
             f'aria-expanded="{"true" if abierta else "false"}">{texto} {svg}</button>{pieza_empresa() if abierta else ""}</span>' + barra[j:])
    barra = columnas_planilla(barra)
    i = barra.index('<span class="pl-der">')
    j = cierre(barra, i, "span")
    boton = ('<span class="b2-sep" aria-hidden="true"></span><span class="envoltura b2-ordenar">'
             f'<button type="button" class="w-pil" aria-haspopup="dialog" aria-expanded="false">{orden} {b2.SVG_FLECHA}</button></span>')
    return barra[:j - 7] + boton + barra[j - 7:]


COLUMNAS_BOTON = re.compile(r'<span class="w-pil" role="button" aria-haspopup="menu" aria-expanded="(true|false)">Columnas (<svg.*?</svg>)</span>', re.S)
ITEM_COLUMNA = re.compile(r'<div class="g">([^<]+)</div>|<span class="mf-ck( on)?( fija)?" role="menuitemcheckbox" aria-checked="\w+">'
                          r'<span class="bx">(?:<svg.*?</svg>)?</span>([^<]+)</span>', re.S)


def columnas_planilla(barra):
    """«Columnas», la pieza múltiple de la E13 (262): una casilla por columna, en sus grupos; con más de diez, el buscador adentro y
    la cantidad; N°, fija, apagada con su motivo (211); al pie, «Mostrar todas»."""
    m = COLUMNAS_BOTON.search(barra)
    assert m, "sin «Columnas»"
    abierta, flecha = m.group(1) == "true", m.group(2)
    boton = f'<button type="button" class="w-pil" aria-haspopup="listbox" aria-expanded="{m.group(1)}">Columnas {flecha}</button>'
    if not abierta:
        return barra[:m.start()] + boton + barra[m.end():]
    i = barra.index('<div class="pl-colmn" role="menu" aria-label="Columnas">', m.end())
    j = b2.fin_div(barra, i)
    ops, n = [], 0
    for it in ITEM_COLUMNA.finditer(barra[i:j]):
        if it.group(1):
            ops.append(f'<div class="g" role="presentation">{it.group(1)}</div>')
            continue
        n += 1
        ops.append(b2.op(it.group(4), elegida=bool(it.group(2)), multiple=True, apagada="N° siempre se ve." if it.group(3) else None))
    assert n
    lst = b2.lista(ops, multiple=True, barra=True, buscar="" if n > 10 else None, cantidad=f"{n} columnas" if n > 10 else None,
                   pie='<button type="button" class="mas">Mostrar todas</button>')
    return barra[:m.start()] + boton + lst + barra[j:]


def barras(t, orden=ORDEN_RECIBIDA):
    out, pos = [], 0
    for m in re.finditer(r'<div class="w-caja o-fb pl-fb">', t):
        j = b2.fin_div(t, m.start())
        out.append(t[pos:m.start()] + barra_planilla(t[m.start():j], orden))
        pos = j
    assert out
    return "".join(out) + t[pos:]


def encabezado_pl(th, por="Recibida", sentido="descending", hov=None):
    """El encabezado de la planilla (264): ↑ o ↓ en el color de la marca después del título, antes en una de números (`r`), y ↕
    al pasar sobre `hov`."""
    th = re.sub(r'<span class="b2-fl[^"]*" aria-hidden="true"[^>]*>.</span>', "", th)
    th = re.sub(r' aria-sort="\w+"', "", th).replace(' class="b2-hov"', "")
    ab, hs, ci = b2.hijos(th)
    fl = "↑" if sentido == "ascending" else "↓"
    out, vistos = [], 0
    for h in hs:
        m = re.match(r'<span( class="r")?>([^<]+)</span>$', h)
        assert m, h
        r, titulo = m.groups()
        if titulo == por:
            vistos += 1
            h = (f'<span class="r" aria-sort="{sentido}"><span class="b2-fl" aria-hidden="true" style="margin: 0 5px 0 0;">{fl}</span>{titulo}</span>'
                 if r else f'<span aria-sort="{sentido}">{titulo}<span class="b2-fl" aria-hidden="true">{fl}</span></span>')
        elif titulo == hov:
            h = f'<span class="b2-hov">{titulo}<span class="b2-fl hov" aria-hidden="true">↕</span></span>'
        out.append(h)
    assert vistos == 1, (por, th[:200])
    return ab + "".join(out) + ci


def encabezados(t, **kw):
    t, n = re.subn(r'<div class="w-th pl">.*?</div>', lambda m: encabezado_pl(m.group(0), **kw), t, flags=re.S)
    assert n
    return t


def reordenar(bloque, orden):
    """Las filas de la planilla en el orden de sus números."""
    filas = list(re.finditer(r'<div class="w-tr pl">.*?</div>', bloque, re.S))
    por_num = {re.search(r'<a class="pl-num" href="[^"]+">([^<]+)</a>', f.group(0)).group(1): f.group(0) for f in filas}
    assert sorted(por_num) == sorted(orden), list(por_num)
    a, b = filas[0].start(), filas[-1].end()
    assert "".join(f.group(0) for f in filas) == bloque[a:b]
    return bloque[:a] + "".join(por_num[n] for n in orden) + bloque[b:]


def ordenada(texto, por, sentido, filas, hov=None):
    def cambiar(bloque):
        if '<div class="w-th pl">' not in bloque:
            return bloque  # la banda
        bloque = una(bloque, f">{ORDEN_RECIBIDA} ", f">{texto} ")
        bloque = encabezados(bloque, por=por, sentido=sentido, hov=hov)
        return reordenar(bloque, filas)
    return cambiar


def con_orden_abierto(columnas, elegida, orden):
    def cambiar(bloque):
        if "b2-ordenar" not in bloque:
            return bloque
        viejo = f'aria-expanded="false">{ORDEN_RECIBIDA} {b2.SVG_FLECHA}</button>'
        return una(bloque, viejo, viejo.replace('"false"', '"true"') + pop_orden(columnas, elegida, orden))
    return cambiar


def frm_respuestas():
    t, nl = leer("FRM-Respuestas")
    t = para_aprobar(con_css(t, CSS_PLANILLA))
    t = encabezados(barras(t))
    assert 'aria-label="Filtrar por empresa"' not in t

    nuevos = ["Ordenar por abierto", "Ordenada por Cliente", "Ordenada por un dato del catálogo"]
    base = {}
    lista = json.loads(re.search(r"const k = (\[.*?\])\.indexOf\(e\);", t).group(1))
    for n, b in zip(nuevos, ("Planilla", "Con filtros", "Elegir varias y campos")):
        base[n] = f"s{lista.index(b)}"
    t, sv = sumar(t, [("Empresa: menú", nuevos[:1]), ("Con filtros", nuevos[1:2]), ("Elegir varias y campos", nuevos[2:])], nuevos, base)
    t = copiar_estado(t, base[nuevos[0]], sv[nuevos[0]], con_orden_abierto(COLS_ORDENAN, "Recibida", "Más reciente primero"))
    t = copiar_estado(t, base[nuevos[1]], sv[nuevos[1]],
                      ordenada(ORDEN_CLIENTE, "Cliente", "ascending", ["VIS-000124", "VIS-000128", "VIS-000122", "VIS-000126"], hov="Motivo"))
    t = copiar_estado(t, base[nuevos[2]], sv[nuevos[2]],
                      ordenada(ORDEN_CUIT, "Proveedor · CUIT", "ascending", ["REP-000018", "REP-000016", "REP-000017", "REP-000015", "REP-000014"]))
    assert t.count("b2-fl hov") == 1 and t.count('class="b2-pop"') == 1
    escribir("FRM-Respuestas", t, nl)


# ---------------------------------------------------------------------------------------------------------------- los filtros
CLIENTES = ["Agroinsumos del Litoral S.A.", "Aluminios Quilmes", "Bulonera Avellaneda", "Casa Ruiz Materiales", "Construcciones Ríos",
            "Corralón El Puente", "Corralón San Martín", "Distribuidora Norte", "Electricidad Morón", "Ferretería Rosales", "Ferretería Sur",
            "Frío Sur", "Hierros Lanús", "Maderera Tigre", "Materiales Pampa", "Obra Centro", "Pinturerías del Centro", "Sanitarios Castelar",
            "Techos Zárate", "Vidriería Ramos"]  # las 20 primeras de los 486 contactos, de la A a la Z
MAS_CLIENTES = '<button type="button" class="mas">Mostrar 20 más</button>'
CSS_FILTROS = CSS_PLANILLA + """
/* E15 · «Filtros»: lo que se elige en una pregunta es la pieza, con el buscador adentro de la lista si viene del servidor (262). */
.pl-fmn .fd .b2-env { width: 100%; }
"""
CMB = re.compile(r'<span class="cmb( ab)?" role="combobox" aria-expanded="(?:true|false)">([^<]+) (?:<svg.*?</svg>)</span>', re.S)
OPCION_LST2 = re.compile(r'<span class="sep2"></span>|<span(?: class="sel")?><span class="tl">(?:<svg.*?</svg>)?</span>([^<]+)</span>', re.S)


def pieza_fd(t):
    """Cada combo de «Filtros» pasa a la pieza: cerrada, el campo; abierta, la lista con la elegida tildada (262)."""
    out, pos, n = [], 0, 0
    for m in CMB.finditer(t):
        nombre = re.findall(r"<b>([^<]+)</b>", t[:m.start()])[-1]
        abierta, valor = bool(m.group(1)), m.group(2)
        fin = m.end()
        extra = ""
        if abierta:
            assert t.startswith('<span class="lst2" role="listbox">', fin)
            fin_l = cierre(t, fin, "span")
            ops, sep = [], False
            for o in OPCION_LST2.finditer(t[fin:fin_l]):
                if o.group(1) is None:
                    sep = True
                    continue
                ops.append(b2.op(o.group(1), elegida=o.group(1) == valor, activa=o.group(1) == valor, sep=sep))
                sep = False
            extra, fin = b2.lista(ops), fin_l
        out.append(t[pos:m.start()] + b2.campo(valor, abierto=abierta, aria=nombre, extra=extra))
        pos, n = fin, n + 1
    assert n
    return "".join(out) + t[pos:]


def cliente_del_servidor(buscar=None, msj=None):
    def cambiar(bloque):
        if '<span class="fd">' not in bloque:
            return bloque
        bloque = una(bloque, '<span class="on">Recibida</span><span>Cliente</span>', '<span>Recibida</span><span class="on">Cliente</span>')
        i = bloque.index('<span class="fd">')
        j = cierre(bloque, i, "span")
        if msj:
            lst = b2.lista([], buscar=buscar, msj=msj)
        else:
            lst = b2.lista([b2.op("Todas", elegida=True, activa=True)] + [b2.op(c, sep=k == 0) for k, c in enumerate(CLIENTES)],
                           buscar="", cantidad="486 opciones", pie=MAS_CLIENTES)
        return bloque[:i] + '<span class="fd"><b>Cliente</b>' + b2.campo("Todas", abierto=True, aria="Cliente", extra=lst) + "</span>" + bloque[j:]
    return cambiar


def frm_respuestas_filtros():
    t, nl = leer("FRM-Respuestas-Filtros")
    t = para_aprobar(con_css(t, CSS_FILTROS))
    t = pieza_fd(encabezados(barras(t)))
    assert 'role="combobox"' not in t and "lst2" not in re.sub(r"<style\b.*?</style>", "", t, flags=re.S)

    nuevos = ["Una pregunta del servidor", "Del servidor: buscando", "Del servidor: ninguna coincide"]
    base = {n: "s0" for n in nuevos}
    t, sv = sumar(t, [("Una pregunta con opciones", nuevos)], nuevos, base)
    t = copiar_estado(t, "s0", sv[nuevos[0]], cliente_del_servidor())
    t = copiar_estado(t, "s0", sv[nuevos[1]], cliente_del_servidor("ferre", "Buscando…"))
    t = copiar_estado(t, "s0", sv[nuevos[2]], cliente_del_servidor("Bulonera Oeste", "Ninguna opción coincide con «Bulonera Oeste»."))
    escribir("FRM-Respuestas-Filtros", t, nl)


# ---------------------------------------------------------------------------------------------------------------- exportar
CSS_EXPORTAR = CSS_PLANILLA + "\n".join(l for l in acc.CSS_COMPU.splitlines() if l.startswith((".acc-tip {", ".acc-tip::after"))) + """
/* E15 · «Columnas» en la pieza (262); con la lista abierta, el diálogo la deja ver entera. */
.w-dlg.ex:has(.b2-pkl), .w-dlg.ex .db:has(.b2-pkl) { overflow: visible; }
"""
TODAS, VISIBLES = "Todas las preguntas", "Solo las visibles"
SE_VEN_TODAS = "Se ven todas las columnas."


def columnas_export(t):
    """«Columnas»: los dos radios pasan a la pieza, con su (i) en el título (262 y 226)."""
    out, pos, n = [], 0, 0
    for m in re.finditer(r'<div class="t2-grupo" role="radiogroup" aria-label="Columnas">', t):
        j = b2.fin_div(t, m.start())
        grupo = t[m.start():j]
        a = grupo.index('<span class="ex-tit">')
        tit = grupo[a:cierre(grupo, a, "span")]
        # La (i) del título abre su tooltip al pasar o con el foco, no el `title` del navegador (211).
        tit, k = re.subn(r'<span class="f-i" tabindex="0" role="img" aria-label="([^"]+)" title="[^"]+">(?:<svg.*?</svg>)</span>',
                         lambda x: b2.info(x.group(1)), tit, flags=re.S)
        assert k == 1, tit[:200]
        visibles = 'class="ex-rd on" role="radio" aria-checked="true"><span class="rd"></span>Solo las visibles' in grupo
        apagada = 'class="ex-rd off"' in grupo
        con_tip = 'class="e-tip"' in grupo
        if con_tip:
            campo = b2.campo(TODAS, abierto=True, aria="Columnas", extra=b2.lista([
                b2.op(TODAS, elegida=True, activa=True), b2.op(VISIBLES, apagada=SE_VEN_TODAS, tip_abierto=True)]))
        else:
            campo = b2.campo(VISIBLES if visibles else TODAS, aria="Columnas")
        out.append(t[pos:m.start()] + f'<div class="t2-grupo ex-col">{tit}{campo}</div>')
        pos, n = j, n + 1
    assert n
    return "".join(out) + t[pos:]


def columnas_abierta(bloque):
    viejo = b2.campo(TODAS, aria="Columnas")
    if viejo not in bloque:
        return bloque
    return una(bloque, viejo, b2.campo(TODAS, abierto=True, aria="Columnas", extra=b2.lista([
        b2.op(TODAS, elegida=True, activa=True), b2.op(VISIBLES)])))


def frm_respuestas_exportar():
    t, nl = leer("FRM-Respuestas-Exportar")
    t = para_aprobar(con_css(t, CSS_EXPORTAR))
    t = columnas_export(encabezados(barras(t)))
    assert "ex-rd" not in re.sub(r"<style\b.*?</style>", "", t, flags=re.S)
    t, sv = sumar(t, [("Exportar", ["Columnas abierta"])], ["Columnas abierta"], {"Columnas abierta": "s0"})
    t = copiar_estado(t, "s0", sv["Columnas abierta"], columnas_abierta)
    escribir("FRM-Respuestas-Exportar", t, nl)


# ---------------------------------------------------------------------------------------------------------------- el teléfono
CSS_TEL_RESPUESTAS = e12l.CSS_TEL + "\n".join(l for l in acc.CSS_TEL.splitlines() if l.startswith(".acc-pk")) + """
/* E15 · «Filtros» de la planilla a pantalla completa: cada filtro con su nombre y la pieza; un número, «Desde» y «Hasta» (262). */
.t10-fl { display: flex; flex-direction: column; background: #fff; padding-bottom: 96px; }
.t10-fl .gr { display: block; padding: 20px 16px 8px; font-size: 13px; font-weight: 600; color: var(--t3); }
.t10-pie { position: absolute; left: 0; right: 0; bottom: 0; display: flex; gap: 10px; padding: 12px 16px 28px; background: #fff; border-top: 1px solid var(--borde); }
.t10-pie .cb { flex: 1; height: 48px; }
.e15-dos { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; padding: 0 16px; }
.e15-dos > span { display: flex; flex-direction: column; gap: 4px; }
.e15-dos .r { font-size: 13px; color: var(--t2); }
.e15-dos .in { height: 48px; box-sizing: border-box; border: 1px solid var(--borde2); border-radius: 10px; background: #fff; }
.b2-tj .v .gris { color: var(--t3); }
"""
FILA_RESP_TEL = re.compile(r'<a class="ap-fila" href="(M-FRM-Respuesta\.dc\.html)"><div class="tx"><span class="l1">([^<]+)<span class="hr">([^<]+)</span>'
                           r'</span><span class="l2">([^<]*)</span><span class="l3">([^<]*)</span></div></a>')
FILTROS_TEL = [("Empresa", "Todas las empresas"), ("Recibida", "Últimos 7 días"), ("Cliente", "Todas"), ("¿Se concretó la venta?", "Todas"),
               ("Monto estimado", None), ("Motivo", "Todas"), ("Fallas", "Todas"), ("Cargó", "Todas"), ("Versión del formulario", "Todas")]
MOTIVOS = ["Seguimiento", "Venta nueva", "Reclamo", "Visita técnica"]


def tarjeta_resp(m):
    href, numero, fecha, l2, cliente = m.groups()
    quien, *resto = l2.split(" · ")
    cargo = f'<span class="gris">{quien}</span>' if quien == "Persona sin información" else quien
    if resto[0] == "Cliente":  # un cliente no tiene empresas (24): su tarjeta dice «Es cliente» en ese lugar (206)
        tercero = ("Es cliente", "Sí")
    else:
        tercero = ("Empresas", b2.NADA_T if resto == ["—"] else ", ".join(resto))
    return b2.tarjeta(numero, [("Recibida", fecha), ("Cargó", cargo), tercero, ("Cliente", cliente)], href=href)


def filtros_tel(barra, pie, motivo="Todas"):
    campos = []
    for nombre, valor in FILTROS_TEL:
        if valor is None:
            campos.append(f'<span class="gr">{nombre}</span><div class="e15-dos"><span><span class="r">Desde</span><span class="in"></span></span>'
                          '<span><span class="r">Hasta</span><span class="in"></span></span></div>')
        else:
            campos.append(e12l.campo_tel(nombre, motivo if nombre == "Motivo" else valor))
    return f'{barra}<div class="ap-cuerpo"><div class="t10-fl">{"".join(campos)}</div></div>{pie}'


def m_frm_respuestas():
    t, nl = leer("M-FRM-Respuestas")
    t = para_aprobar(con_css(t, CSS_TEL_RESPUESTAS))

    # Las filas como tarjetas (263).
    t, n = FILA_RESP_TEL.subn(tarjeta_resp, t)
    assert n == 44, n

    # «Filtros» (s1) y «Filtros: una pregunta» (s2): cada filtro en la pieza; la pregunta, la pieza a pantalla completa (262).
    a, b = sc_ifs(t, "s1")[0]
    barra = re.search(r'<div class="ap-bar int">.*?</div></div>', t[a:b], re.S).group(0)
    pie = re.search(r'<div class="t-pie">.*?</div>', t[a:b], re.S).group(0)
    assert "<h1>Filtros</h1>" in barra and t[a:b].count('<div class="t-fl">') == 1
    t = t[:a] + '<sc-if value="{{s1}}" hint-placeholder-val="{{no}}">' + filtros_tel(barra, pie) + "</sc-if>" + t[b:]
    a, b = sc_ifs(t, "s2")[0]
    assert "<h1>Motivo</h1>" in t[a:b]
    motivo = b2.pk_tel("Motivo", [("Todas", None, False, None)] + [(o, None, o == "Venta nueva", None, k == 0) for k, o in enumerate(MOTIVOS)])
    t = t[:a] + '<sc-if value="{{s2}}" hint-placeholder-val="{{no}}">' + filtros_tel(barra, pie, "Venta nueva") + motivo + "</sc-if>" + t[b:]
    assert 'class="t-fl"' not in t

    # «Ordenar por», a todo el ancho arriba de la lista (264).
    t = e14l.boton_ordenar_tel(t, ("s0", "s3", "s4", "s5", "s6", "s7", "s9"), ORDEN_RECIBIDA)

    # Dos estados nuevos: la pantalla «Ordenar por» y la pieza de una pregunta del servidor, con el buscador.
    nuevos = ["Filtros: una pregunta del servidor", "Ordenar por"]
    t, sv = sumar(t, [("Filtros: una pregunta", nuevos[:1]), ("Con filtros", nuevos[1:])], nuevos, {})
    volver = re.search(r'<a class="ap-ib" aria-label="Volver" href="M-FRM-Respuestas.dc.html">(<svg.*?</svg>)</a>', t, re.S).group(1)
    cliente = b2.pk_tel("Cliente", [("Todas", None, True, None)] + [(c, None, False, None, k == 0) for k, c in enumerate(CLIENTES)],
                        buscar="", cantidad="486 opciones", pie_extra=MAS_CLIENTES)
    t = una(t, '<span class="ap-raya"></span>',
            f'<sc-if value="{{{{{sv[nuevos[0]]}}}}}" hint-placeholder-val="{{{{no}}}}">{filtros_tel(barra, pie)}{cliente}</sc-if>'
            f'<sc-if value="{{{{{sv[nuevos[1]]}}}}}" hint-placeholder-val="{{{{no}}}}">'
            + e14l.pantalla_ordenar(volver, "M-FRM-Respuestas", "Recibida", "Más reciente primero") + '</sc-if><span class="ap-raya"></span>')
    # Exportar: en el teléfono no hay «Columnas» y exporta todas las preguntas (spec de la E15): sale ese dato de la hoja.
    t, n = re.subn(r'<div class="ap-dato"><span class="k">Columnas<span class="f-i"[^>]*>(?:<svg.*?</svg>)</span></span>'
                   r'<span class="v">Todas las preguntas</span></div>', "", t, flags=re.S)
    assert n == 1, n
    assert " · " not in "".join(re.findall(r'<span class="l2">([^<]*)</span>', t))
    escribir("M-FRM-Respuestas", t, nl)


if __name__ == "__main__":
    for nombre, f in (("FRM-Formularios-15", frm_formularios_15), ("M-FRM-Formularios-15", m_frm_formularios_15),
                      ("FRM-Respuestas", frm_respuestas), ("M-FRM-Respuestas", m_frm_respuestas),
                      ("FRM-Respuestas-Filtros", frm_respuestas_filtros), ("FRM-Respuestas-Exportar", frm_respuestas_exportar)):
        if MARCA in leer(nombre)[0]:
            print(nombre, "ya tiene el bloque: no hace nada")
            continue
        f()
    subprocess.run([sys.executable, str(G / "traspaso10_piezas_1004.py"), "--tableros", ",".join(TABLEROS)], check=True)
