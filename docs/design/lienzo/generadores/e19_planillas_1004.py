"""Las planillas de la E19 y la E20 con el traspaso 18, tanda 3B (2026-11-26), sobre los tableros de siempre, con la forma que
la E14 dejó en `FRM-Formularios` y `M-FRM-Formularios` (`e14_listados_1004.py`) y la que la E15 pide para toda planilla (pedido
del 19/11): «Ordenar por», último y separado de los filtros, y el encabezado que ordena (264); «Empresa» en la pieza para elegir, y
el filtro de una opción en la pieza, con el buscador adentro si vienen del servidor (262).

- `FRM-Respuestas-19`: en la barra, «Empresa» es un botón que abre la pieza, y «Ordenar por», después de «Columnas» y de una línea,
  dice el orden con palabras («Recibida, más reciente primero»); el encabezado lleva ↓ después de «Recibida» (264). En «Filtros»,
  «Producto» va en la pieza abierta, con el buscador adentro y la cantidad, porque sale de un catálogo (262); «En algún ítem de
  Productos», que explicaba el filtro, pasa a la (i) del nombre (109). Suma «Ordenar por abierto» (la pieza con «Columna» y «Orden»:
  «Productos» no está, porque el bloque no ordena) y «Ordenado por Total» (el cálculo sí ordena: de mayor a menor, con la flecha
  antes del título, que es de números, y lo vacío al final, «Sin respuesta» y «—», en el orden de siempre), por la 263 y la 264.
- `M-FRM-Respuestas-19`: cada respuesta es una tarjeta con su número y Recibida, Cliente, ¿Se concretó la venta?, Monto, Productos
  y Total, cada dato con su nombre y nada unido con «·» debajo de otro (263); «Ordenar por» arriba de la lista, a lo ancho (264).
  «Filtros», como el de `M-FRM-Respuestas` de la E15: cada filtro con su nombre y la pieza, un número o una fecha con «Desde» y
  «Hasta», y las preguntas del bloque bajo una banda «Productos» (sale la lista con «Todas ›»). «Filtros: una pregunta del bloque»
  pasa a la pieza a pantalla completa sobre «Filtros», con el buscador, «10 opciones» y «Todas» primero, separada; elegir cierra, sin
  «Listo» (262). Suma «Ordenar por», «Ordenar por: columna» (la pieza, sin «Productos») y «Ordenado por Total».
- `FRM-Respuestas-Exportar-19`: «Filas» («Una por ítem de Productos» o «Una por respuesta») y «Columnas» («Todas las preguntas» o
  «Solo las visibles») van en la pieza, cada una con su (i); se van los radios (262). La planilla de atrás, con la barra y el
  encabezado nuevos. Suma «Filas abierta» y «Columnas abierta». Se cierra bien «Ninguno» en «Más de 100.000 filas».
- `FRM-Respuestas-20`: «Empresa» y «Canal» con su botón; «Canal: menú» abre la pieza, sin cantidades, con «Todos los canales»
  primero y separada (262 y 143); «Ordenar por» y la flecha de «Recibida» (264). Suma «Ordenar por abierto»: no están Cargó (264),
  «Lugar de entrega» (la ubicación no ordena, E20) ni «Productos». «Filtros» no ofrecía la ubicación: no hay nada que sacar.
- `M-FRM-Respuestas-20`: las tarjetas (Recibida, Canal, Cargó, Cliente, Productos y Total) y «Ordenar por». Suma «Filtros», como el
  de la E19, con «Empresa» y «Canal» primero y sin «Lugar de entrega» ni «Foto del remito», que no se filtran (143 y E20); «Filtros:
  Canal», la pieza a pantalla completa, sin cantidades; y «Ordenar por».
- `FRM-Respuestas-Propias`: como la planilla de la E15 (262 y 264): «Empresa» y «Canal» con su botón, «Ordenar por» y la flecha.
  Suma «Empresa abierta» (la pieza como la de `FRM-Respuestas`: «Todas las empresas» primero y «Sin empresa» al final, cada una
  separada) y «Ordenar por abierto».
- `M-FRM-Respuestas-Propias`: las tarjetas (Recibida, Canal, Cliente, Productos y Total) y «Ordenar por», con su estado.

No cambia la vista rápida de «Una respuesta suya» en `FRM-Respuestas-Propias`: la respuesta como el formulario (266) la dibuja
`FRM-Respuesta-20`, de otro grupo, y se copia cuando esté aprobada.

Cambia los tableros en su lugar; no corre dos veces (el bloque `data-t3b="e19-planillas"` lo marca). Al final pasa
`traspaso10_piezas_1004.py --tableros <los siete>`, que pone la escala de la compu, y después parte en dos grupos el panel de
«Gestión de formularios» (275) de `FRM-Respuestas-19`, `-Exportar-19` y `-20`, con la pieza de `e14_panel_1004.py`; el de
`FRM-Respuestas-Propias` tiene solo «Formularios» (quien solo carga no ve «Catálogos») y no cambia. Para volver a correrlo, primero
se restauran los siete tableros (`git show HEAD:docs/design/lienzo/<Nombre>.dc.html`). No toca `canvas.json`.

Uso: `python e19_planillas_1004.py`.
"""
import json
import pathlib
import re
import subprocess
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import base2_comun as b2  # noqa: E402
import e12_editor_1004 as e12e  # noqa: E402
import e12_listado_1004 as e12l  # noqa: E402
import e14_listados_1004 as e14l  # noqa: E402
import e14_panel_1004 as e14p  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = '<style data-t3b="e19-planillas">'
leer, escribir, una, props = e12l.leer, e12l.escribir, e12l.una, e12l.props
cierre, sc_ifs, renombrar, sumar_estados = e12e.cierre, e12e.sc_ifs, e12e.renombrar, e12e.sumar_estados
para_aprobar = e14l.para_aprobar
GRIS = '<span style="color: var(--t3);">{}</span>'

# ---------------------------------------------------------------------------------------------------------------- estilos
CSS_COMPU = e14l.CSS_LISTADO + """
/* E19 y E20 · la planilla: «Ordenar por», después de «Columnas» y de una línea, último en la barra (264). */
.pl-fb .pl-der .b2-ordenar { margin-left: 0; }
/* «Filtros»: el nombre con su (i) y la pieza a lo ancho, abierta sobre lo de abajo (262). */
.pl-fmn .fd .et { display: flex; align-items: center; gap: 2px; }
.pl-fmn .fd .b2-env { width: 100%; }
"""
CSS_EXPORTAR = CSS_COMPU + """
/* E19 · Exportar: «Filas» y «Columnas» en la pieza (262); la lista abierta sale del diálogo. */
.w-dlg.ex:has(.b2-pkl) { overflow: visible; }
.t2-grupo .b2-env { width: 100%; }
"""
_PK = e12e.CSS_TEL
CSS_TEL = e12l.CSS_TEL + _PK[_PK.index("/* E12 · La pieza a pantalla completa"):_PK.index("/* E12 · Cada opción")] + """
/* E19 y E20 · cada respuesta, una tarjeta: su número arriba y cada dato con su nombre, de a dos (263). */
.b2-tj .nm { font-variant-numeric: tabular-nums; }
/* «Filtros» a pantalla completa, como la planilla de la E15: cada filtro con su nombre y la pieza; un número o una fecha, «Desde» y
   «Hasta»; las preguntas del bloque, bajo su nombre en una banda (262). */
.t10-fl { display: flex; flex-direction: column; background: #fff; padding-bottom: 96px; }
.t10-fl .gr { display: block; padding: 20px 16px 8px; font-size: 13px; font-weight: 600; color: var(--t3); }
.t10-fl .e19-blq { display: block; margin-top: 20px; padding: 10px 16px; border-top: 1px solid var(--borde); border-bottom: 1px solid var(--borde); background: oklch(0.975 0.01 95); font-size: 13.5px; font-weight: 600; color: var(--t2); }
.t10-pie { position: absolute; left: 0; right: 0; bottom: 0; display: flex; gap: 10px; padding: 12px 16px 28px; background: #fff; border-top: 1px solid var(--borde); }
.t10-pie .cb { flex: 1; height: 48px; }
.e19-dos { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; padding: 0 16px; }
.e19-dos > span { display: flex; flex-direction: column; gap: 4px; }
.e19-dos .r { font-size: 13px; color: var(--t2); }
.e19-dos .in { height: 48px; box-sizing: border-box; border: 1px solid var(--borde2); border-radius: 10px; background: #fff; }
"""

# ---------------------------------------------------------------------------------------------------------------- textos
ORDEN_RECIBIDA = "Ordenar por: Recibida, más reciente primero"
ORDEN_TOTAL = "Ordenar por: Total, de mayor a menor"
RECIENTE = "Más reciente primero"
# Lo que ordena de cada planilla (264): no van el bloque, la ubicación ni Cargó.
COLS_19 = ["N°", "Recibida", "Cliente", "¿Se concretó la venta?", "Monto", "Total", "Observaciones"]
COLS_20 = ["N°", "Recibida", "Canal", "Cliente", "Total"]
COLS_PROPIAS = ["N°", "Recibida", "Canal", "Cliente", "Total"]
# Las opciones del catálogo «Productos» (10, como dice `FRM-Catalogos-14`).
PRODUCTOS = ["Caño de 1/2 pulgada", "Caño de 3/4 pulgada", "Cinta de teflón", "Codo de 90°", "Cupla de 1/2 pulgada", "Llave de paso",
             "Niple de 1/2 pulgada", "Sellador para roscas", "Tee de 1/2 pulgada", "Unión doble de 3/4 pulgada"]
EN_ALGUN_ITEM = "Alcanza con que lo cumpla un ítem de Productos."
EMPRESAS = ["Todas las empresas", "Delta Norte S.A.", "Delta S.A.", "Delta Sur S.R.L.", "Sin empresa"]
# «Filtros» en el teléfono, como el de `M-FRM-Respuestas` (E15): cada filtro con su nombre y la pieza; un número o una fecha de una
# pregunta, «Desde» y «Hasta»; las preguntas del bloque, bajo su nombre. No van la ubicación ni las fotos (143 y E20), ni los textos
# largos, que se buscan arriba.
BLOQUE_TEL = [("grupo", "Productos"), ("pieza", "Producto", "Todas"), ("rango", "Cantidad"), ("rango", "Importe")]
FILTROS_19 = ([("pieza", "Empresa", "Todas las empresas"), ("pieza", "Recibida", "Todas las fechas"), ("pieza", "Cliente", "Todas"),
               ("pieza", "¿Se concretó la venta?", "Todas"), ("pieza", "Motivo", "Todas"), ("rango", "Monto"), ("rango", "Fecha de entrega")]
              + BLOQUE_TEL + [("rango", "Total"), ("pieza", "Cargó", "Todas"), ("pieza", "Versión del formulario", "Todas")])
FILTROS_20 = ([("pieza", "Empresa", "Todas las empresas"), ("pieza", "Canal", "Todos los canales"), ("pieza", "Recibida", "Todas las fechas"),
               ("pieza", "Cliente", "Todas"), ("pieza", "¿Se concretó la venta?", "Todas"), ("pieza", "Motivo", "Todas"), ("rango", "Monto"),
               ("pieza", "Zona", "Todas"), ("rango", "Fecha de entrega"), ("pieza", "Proveedor", "Todas")]
              + BLOQUE_TEL + [("rango", "Total"), ("pieza", "Cargó", "Todas"), ("pieza", "Versión del formulario", "Todas")])
# Por Total, de mayor a menor: las tres con total y, al final, lo vacío en el orden de siempre (264).
POR_TOTAL = ["PED-000043", "PED-000041", "PED-000045", "PED-000044", "PED-000042", "PED-000040", "PED-000039", "PED-000038",
             "PED-000037", "PED-000036"]


def lista_empresa():
    """Como la de `FRM-Respuestas` (E15): «Todas las empresas» primero y separada; «Sin empresa», al final y separada (262)."""
    return b2.lista([b2.op(o, elegida=k == 0, activa=k == 0, sep=k in (1, len(EMPRESAS) - 1)) for k, o in enumerate(EMPRESAS)], barra=True)


def lista_canal():
    return b2.lista([b2.op("Todos los canales", elegida=True, activa=True), b2.op("App", sep=True), b2.op("WhatsApp")], barra=True)


# ---------------------------------------------------------------------------------------------------------------- utilidades
def con_css(t, css):
    assert MARCA not in t
    return una(t, "</helmet>", f"{MARCA}\n{css}</style>\n</helmet>")


def en_estado(t, s, f):
    """Aplica `f` a cada `sc-if` del estado `s`."""
    out, pos = [], 0
    for i, j in sc_ifs(t, s):
        out += [t[pos:i], f(t[i:j])]
        pos = j
    return "".join(out) + t[pos:]


def copiar_estado(t, de, a):
    """Los `sc-if` del estado `de`, copiados para el estado `a`, cada uno después de su original."""
    for i, j in reversed(sc_ifs(t, de)):
        t = t[:j] + renombrar(t[i:j], de, a) + t[j:]
    return t


def mas_miga(t, nuevas):
    m = re.search(r"miga: (\[.*?\])\[k\],", t)
    lista = json.loads(m.group(1)) + nuevas
    return t[:m.start(1)] + json.dumps(lista, ensure_ascii=False) + t[m.end(1):]


def nuevos_estados(t, ancla, nombres, compu=True):
    t, sv = sumar_estados(t, [(ancla, nombres)], nombres)
    if compu:
        miga = json.loads(re.search(r"miga: (\[.*?\])\[k\],", t).group(1))
        t = mas_miga(t, [miga[0]] * len(nombres))
    return t, sv


def celdas(fila):
    """Las celdas de una fila de la planilla: (texto, en gris)."""
    _, hs, _ = b2.hijos(fila)
    out = []
    for h in hs:
        texto = re.sub(r"<[^>]+>", "", re.sub(r"<svg.*?</svg>", "", h, flags=re.S)).strip()
        out.append((texto, 'class="pl-g"' in h))
    return out


def filas_de(t, s="s0"):
    """Las filas de la planilla del estado `s`: {número: [(texto, gris), …]}, en orden."""
    i, j = next((a, b) for a, b in sc_ifs(t, s) if 'class="w-tr pl' in t[a:b])
    filas = {}
    for m in re.finditer(r'<div class="w-tr pl[^"]*">.*?</div>', t[i:j], re.S):
        c = celdas(m.group(0))
        filas[c[0][0]] = c
    return filas


# ---------------------------------------------------------------------------------------------------------------- la barra
def filtro(env, lista=None):
    """Un filtro de la barra con su botón, que abre la pieza (262): `<span class="f-env">…</span>`."""
    a = len('<span class="f-env">')
    fin = cierre(env, a, "span")
    m = re.fullmatch(r'<span class="w-pil( con)?" role="button" aria-haspopup="listbox">(.*?) (<svg.*</svg>)</span>', env[a:fin], re.S)
    con, texto, svg = m.groups()
    return (f'<span class="f-env"><button type="button" class="w-pil{con or ""}" aria-haspopup="listbox" '
            f'aria-expanded="{"true" if lista else "false"}">{texto} {svg}</button>{lista or ""}</span>')


def pop_orden(columnas, elegida, orden):
    return ('<div class="b2-pop" role="dialog" aria-label="Ordenar por"><div class="b2-pop-c"><span class="et">Columna</span>'
            + b2.campo(elegida, abierto=True, aria="Columna",
                       extra=b2.lista([b2.op(c, elegida=c == elegida, activa=c == elegida) for c in columnas]))
            + '</div><div class="b2-pop-c"><span class="et">Orden</span>' + b2.campo(orden, aria="Orden") + "</div></div>")


def con_barra(bloque, orden=ORDEN_RECIBIDA, pop="", listas=None):
    """La barra de la planilla: cada filtro con su botón y, después de «Columnas» y de una línea, «Ordenar por» (264)."""
    i = bloque.find('<div class="w-caja o-fb pl-fb">')
    if i < 0:
        return bloque
    j = cierre(bloque, i, "div")
    barra = bloque[i:j]
    out, pos = [], 0
    for m in re.finditer(r'<span class="f-env">', barra):
        fin = cierre(barra, m.start(), "span")
        nombre = re.search(r'aria-haspopup="listbox">(\w+)', barra[m.start():fin]).group(1)
        out += [barra[pos:m.start()], filtro(barra[m.start():fin], (listas or {}).get(nombre))]
        pos = fin
    barra = "".join(out) + barra[pos:]
    assert "f-mn" not in barra and 'role="button" aria-haspopup="listbox"' not in barra
    k = barra.index('<span class="pl-der">')
    e = cierre(barra, k, "span")
    boton = ('<span class="b2-sep" aria-hidden="true"></span><span class="envoltura b2-ordenar">'
             f'<button type="button" class="w-pil" aria-haspopup="dialog" aria-expanded="{"true" if pop else "false"}">{orden} '
             f'{b2.SVG_FLECHA}</button>{pop}</span>')
    barra = barra[:e - 7] + boton + barra[e - 7:]
    return bloque[:i] + barra + bloque[j:]


def con_flecha(t, por, sentido="descending"):
    """El encabezado ordenado por `por` (264): la flecha en el color de la marca después del título, o antes en uno de números."""
    flecha = "↑" if sentido == "ascending" else "↓"

    def celda(m):
        clase, texto = m.group(1) or "", m.group(2)
        if texto != por:
            return m.group(0)
        if clase == ' class="r"':
            return (f'<span class="r" aria-sort="{sentido}"><span class="b2-fl" aria-hidden="true" style="margin: 0 5px 0 0;">'
                    f"{flecha}</span>{texto}</span>")
        return f'<span{clase} aria-sort="{sentido}">{texto}<span class="b2-fl" aria-hidden="true">{flecha}</span></span>'

    def th(m):
        if "aria-sort" in m.group(0):
            return m.group(0)
        nuevo = re.sub(r'<span( class="[^"]*")?>([^<]+)</span>', celda, m.group(0))
        assert nuevo != m.group(0), f"sin la columna {por}"
        return nuevo

    return re.sub(r'<div class="w-th pl">.*?</div>', th, t, flags=re.S)


def ordenar_filas(bloque, orden):
    """Las filas de la planilla en el orden de `orden` (los números)."""
    filas = list(re.finditer(r'<div class="w-tr pl[^"]*">.*?</div>', bloque, re.S))
    if not filas:  # la banda del estado
        return bloque
    por_num = {celdas(m.group(0))[0][0]: m.group(0) for m in filas}
    assert sorted(por_num) == sorted(orden), list(por_num)
    a, b = filas[0].start(), filas[-1].end()
    assert bloque[a:b] == "".join(m.group(0) for m in filas)
    return bloque[:a] + "".join(por_num[n] for n in orden) + bloque[b:]


# ---------------------------------------------------------------------------------------------------------------- la compu
def frm_respuestas_19():
    t, nl = leer("FRM-Respuestas-19")
    t = para_aprobar(con_css(t, CSS_COMPU))
    nuevos = ["Ordenar por abierto", "Ordenado por Total"]
    t, sv = nuevos_estados(t, "Con filtros", nuevos)
    s_pop, s_tot = sv[nuevos[0]], sv[nuevos[1]]
    t = copiar_estado(copiar_estado(t, "s0", s_pop), "s0", s_tot)

    # «Filtros»: «Producto» en la pieza abierta, con el buscador y la cantidad (262); la leyenda, en la (i) (109).
    viejo = re.search(r'<span class="fd"><b>Producto</b><span class="blq">En algún ítem de Productos</span>'
                      r'<span class="cmb" role="combobox" aria-expanded="false">Todas <svg.*?</svg></span></span>', t, re.S).group(0)
    pieza = b2.campo("Todas", abierto=True, aria="Producto",
                     extra=b2.lista([b2.op("Todas", elegida=True, activa=True)] + [b2.op(p, sep=k == 0) for k, p in enumerate(PRODUCTOS)],
                                    buscar="", cantidad="10 opciones"))
    t = una(t, viejo, f'<span class="fd"><span class="et"><b>Producto</b>{b2.info(EN_ALGUN_ITEM)}</span>{pieza}</span>')

    # La barra de cada estado y el encabezado (264).
    for s in ("s0", "s1", "s2"):
        t = en_estado(t, s, con_barra)
    t = en_estado(t, s_pop, lambda x: con_barra(x, pop=pop_orden(COLS_19, "Recibida", RECIENTE)))
    t = en_estado(t, s_tot, lambda x: con_flecha(ordenar_filas(con_barra(x, orden=ORDEN_TOTAL), POR_TOTAL), "Total"))
    t = con_flecha(t, "Recibida")
    escribir("FRM-Respuestas-19", t, nl)


def grupo_export(grupo, abierto):
    """«Filas» o «Columnas» del diálogo de exportar, en la pieza con su (i) (262), en lugar de los radios."""
    nombre = re.search(r'aria-label="([^"]+)"', grupo).group(1)
    tit = re.search(r'<span class="ex-tit">.*?</span></span>', grupo, re.S).group(0)
    ops = re.findall(r'<div class="ex-rd( on)?" role="radio" aria-checked="(?:true|false)"><span class="rd"></span>([^<]+)</div>', grupo)
    assert len(ops) == 2, ops
    elegida = next(n for on, n in ops if on)
    lista = b2.lista([b2.op(n, elegida=bool(on), activa=bool(on)) for on, n in ops]) if abierto else ""
    return f'<div class="t2-grupo">{tit}{b2.campo(elegida, abierto=abierto, aria=nombre, extra=lista)}</div>'


def con_grupos(bloque, abierta=None):
    out, pos = [], 0
    for m in re.finditer(r'<div class="t2-grupo" role="radiogroup" aria-label="(Filas|Columnas)">', bloque):
        fin = cierre(bloque, m.start(), "div")
        out += [bloque[pos:m.start()], grupo_export(bloque[m.start():fin], m.group(1) == abierta)]
        pos = fin
    return "".join(out) + bloque[pos:]


def frm_respuestas_exportar_19():
    t, nl = leer("FRM-Respuestas-Exportar-19")
    t = para_aprobar(con_css(t, CSS_EXPORTAR))
    t = una(t, '<span class="g-vacio">Ninguno</span></span></span></div>', '<span class="g-vacio">Ninguno</span></div>')
    nuevos = ["Filas abierta", "Columnas abierta"]
    t, sv = nuevos_estados(t, "Una por respuesta", nuevos)
    for n in nuevos:
        t = copiar_estado(t, "s0", sv[n])
    for s in ["s0", "s1", "s2"] + list(sv.values()):
        t = en_estado(t, s, con_barra)
    t = en_estado(t, sv["Filas abierta"], lambda x: con_grupos(x, "Filas"))
    t = en_estado(t, sv["Columnas abierta"], lambda x: con_grupos(x, "Columnas"))
    t = con_grupos(t)
    assert 'role="radio"' not in t
    t = con_flecha(t, "Recibida")
    escribir("FRM-Respuestas-Exportar-19", t, nl)


def frm_respuestas_20():
    t, nl = leer("FRM-Respuestas-20")
    t = para_aprobar(con_css(t, CSS_COMPU))
    nuevos = ["Ordenar por abierto"]
    t, sv = nuevos_estados(t, "Canal: App", nuevos)
    s_pop = sv[nuevos[0]]
    t = copiar_estado(t, "s0", s_pop)
    t = en_estado(t, "s0", con_barra)
    t = en_estado(t, "s1", lambda x: con_barra(x, listas={"Canal": lista_canal()}))
    t = en_estado(t, "s2", con_barra)
    t = en_estado(t, s_pop, lambda x: con_barra(x, pop=pop_orden(COLS_20, "Recibida", RECIENTE)))
    t = con_flecha(t, "Recibida")
    escribir("FRM-Respuestas-20", t, nl)


def frm_respuestas_propias():
    t, nl = leer("FRM-Respuestas-Propias")
    t = para_aprobar(con_css(t, CSS_COMPU))
    nuevos = ["Empresa abierta", "Ordenar por abierto"]
    t, sv = nuevos_estados(t, "Lo suyo", nuevos)
    for n in nuevos:
        t = copiar_estado(t, "s0", sv[n])
    for s in ("s0", "s1", "s2", "s3"):
        t = en_estado(t, s, con_barra)
    t = en_estado(t, sv["Empresa abierta"], lambda x: con_barra(x, listas={"Empresa": lista_empresa()}))
    t = en_estado(t, sv["Ordenar por abierto"], lambda x: con_barra(x, pop=pop_orden(COLS_PROPIAS, "Recibida", RECIENTE)))
    t = con_flecha(t, "Recibida")
    escribir("FRM-Respuestas-Propias", t, nl)


# ---------------------------------------------------------------------------------------------------------------- el teléfono
def valor(texto, gris):
    return GRIS.format(texto) if gris else texto


def tarjetas(t, href, filas, datos):
    """Cada fila (`ap-fila`) pasa a una tarjeta (263), en el mismo orden: `datos` son (nombre, índice de la celda)."""
    patron = re.compile(r'<a class="ap-fila" href="%s"><div class="tx"><span class="l1">(PED-\d+)<span class="hr">[^<]*</span></span>'
                        r'<span class="l2">[^<]*</span><span class="l3">[^<]*</span></div></a>' % re.escape(href))

    def tarjeta(m):
        c = filas[m.group(1)]
        return b2.tarjeta(m.group(1), [(k, valor(*c[i])) for k, i in datos], href=href)

    t, n = patron.subn(tarjeta, t)
    assert n == len(filas), (n, len(filas))
    return t


def volver_svg(t):
    return re.search(r'<a class="ap-ib" aria-label="Volver" href="[^"]+">(<svg.*?</svg>)</a>', t, re.S).group(1)


def antes_de_raya(t, html):
    return una(t, '<span class="ap-raya"></span>', html + '<span class="ap-raya"></span>')


def estado_tel(s, html):
    return f'<sc-if value="{{{{{s}}}}}" hint-placeholder-val="{{{{no}}}}">{html}</sc-if>'


def pk_columnas(columnas):
    return b2.pk_tel("Columna", [(c, None, c == "Recibida", None) for c in columnas])


def m_frm_respuestas_19():
    t, nl = leer("M-FRM-Respuestas-19")
    t = para_aprobar(con_css(t, CSS_TEL))
    filas = filas_de(leer("FRM-Respuestas-19")[0])
    # N°, Recibida, Cliente, ¿Se concretó la venta?, Monto, Productos, Total, Observaciones
    t = tarjetas(t, "M-FRM-Respuesta-19.dc.html", filas,
                 [("Recibida", 1), ("Cliente", 2), ("¿Se concretó la venta?", 3), ("Monto", 4), ("Productos", 5), ("Total", 6)])
    t = e14l.boton_ordenar_tel(t, ("s0",), ORDEN_RECIBIDA)

    # «Filtros»: cada filtro con su nombre y la pieza, como la E15 (sale la lista con «Todas ›»); «Filtros: una pregunta del
    # bloque», la pieza a pantalla completa sobre «Filtros», con el buscador porque sale de un catálogo (262).
    (filtros,) = sc_ifs(t, "s1")
    (pregunta,) = sc_ifs(t, "s2")
    assert '<div class="t-fl">' in t[filtros[0]:filtros[1]] and '<div class="t-blq">' in t[pregunta[0]:pregunta[1]]
    pantalla = filtros_tel("M-FRM-Respuestas-19", volver_svg(t), FILTROS_19)
    pieza = b2.pk_tel("Producto", [("Todas", None, True, None)] + [(p, None, False, None, k == 0) for k, p in enumerate(PRODUCTOS)],
                      buscar="", cantidad="10 opciones")
    t = (t[:filtros[0]] + estado_tel("s1", pantalla) + t[filtros[1]:pregunta[0]] + estado_tel("s2", pantalla + pieza)
         + t[pregunta[1]:])
    assert 'class="t-fl"' not in t and 'class="t-blq"' not in t

    # «Ordenar por» (264): su pantalla, la columna en la pieza (sin «Productos», que no ordena) y la lista por Total.
    nuevos = ["Ordenar por", "Ordenar por: columna", "Ordenado por Total"]
    t, sv = nuevos_estados(t, "Filtros: una pregunta del bloque", nuevos, compu=False)
    pantalla = e14l.pantalla_ordenar(volver_svg(t), "M-FRM-Respuestas-19", "Recibida", RECIENTE)
    (lista,) = sc_ifs(t, "s0")
    por_total = renombrar(t[lista[0]:lista[1]], "s0", sv["Ordenado por Total"]).replace(ORDEN_RECIBIDA, ORDEN_TOTAL)
    tjs = list(re.finditer(r'<div class="b2-tj">.*?</div>', por_total, re.S))
    por_num = {re.search(r'<span class="nm">([^<]+)</span>', m.group(0)).group(1): m.group(0) for m in tjs}
    assert sorted(por_num) == sorted(POR_TOTAL)
    por_total = por_total[:tjs[0].start()] + "".join(por_num[n] for n in POR_TOTAL) + por_total[tjs[-1].end():]
    t = antes_de_raya(t, estado_tel(sv["Ordenar por"], pantalla)
                      + estado_tel(sv["Ordenar por: columna"], pantalla + pk_columnas(COLS_19)) + por_total)
    escribir("M-FRM-Respuestas-19", t, nl)


def filtros_tel(tablero, volver, filtros):
    """«Filtros» de la planilla en el teléfono, a pantalla completa (262), con «Limpiar todo» y «Listo»."""
    campos = []
    for f in filtros:
        if f[0] == "grupo":
            campos.append(f'<span class="e19-blq">{f[1]}</span>')
        elif f[0] == "rango":
            campos.append(f'<span class="gr">{f[1]}</span><div class="e19-dos"><span><span class="r">Desde</span><span class="in"></span></span>'
                          '<span><span class="r">Hasta</span><span class="in"></span></span></div>')
        else:
            campos.append(e12l.campo_tel(f[1], f[2]))
    return (f'<div class="ap-bar int"><a class="ap-ib" aria-label="Volver" href="{tablero}.dc.html">{volver}</a>'
            '<div class="tit"><h1>Filtros</h1><span class="sub">Pedido de materiales</span></div></div>'
            f'<div class="ap-cuerpo"><div class="t10-fl">{"".join(campos)}</div></div>'
            '<div class="t10-pie"><button type="button" class="cb cb-sec">Limpiar todo</button><button type="button" class="cb cb-pri">Listo</button></div>')


def m_frm_respuestas_20():
    t, nl = leer("M-FRM-Respuestas-20")
    t = para_aprobar(con_css(t, CSS_TEL))
    filas = filas_de(leer("FRM-Respuestas-20")[0])
    # N°, Recibida, Cargó, Canal, Cliente, Lugar de entrega, Productos, Total
    t = tarjetas(t, "M-FRM-Respuesta-20.dc.html", filas,
                 [("Recibida", 1), ("Canal", 3), ("Cargó", 2), ("Cliente", 4), ("Productos", 6), ("Total", 7)])
    t = e14l.boton_ordenar_tel(t, ("s0",), ORDEN_RECIBIDA)
    nuevos = ["Filtros", "Filtros: Canal", "Ordenar por"]
    t, sv = nuevos_estados(t, "Respuestas", nuevos, compu=False)
    filtros = filtros_tel("M-FRM-Respuestas-20", volver_svg(t), FILTROS_20)
    canal = b2.pk_tel("Canal", [("Todos los canales", None, True, None), ("App", None, False, None, True), ("WhatsApp", None, False, None)])
    pantalla = e14l.pantalla_ordenar(volver_svg(t), "M-FRM-Respuestas-20", "Recibida", RECIENTE)
    t = antes_de_raya(t, estado_tel(sv["Filtros"], filtros) + estado_tel(sv["Filtros: Canal"], filtros + canal)
                      + estado_tel(sv["Ordenar por"], pantalla))
    escribir("M-FRM-Respuestas-20", t, nl)


def m_frm_respuestas_propias():
    t, nl = leer("M-FRM-Respuestas-Propias")
    t = para_aprobar(con_css(t, CSS_TEL))
    filas = filas_de(leer("FRM-Respuestas-Propias")[0])
    # N°, Recibida, Canal, Cliente, Productos, Total
    t = tarjetas(t, "M-FRM-Respuesta-20.dc.html", filas,
                 [("Recibida", 1), ("Canal", 2), ("Cliente", 3), ("Productos", 4), ("Total", 5)])
    t = e14l.boton_ordenar_tel(t, ("s0",), ORDEN_RECIBIDA)
    nuevos = ["Ordenar por"]
    t, sv = nuevos_estados(t, "Una dirección ajena", nuevos, compu=False)
    t = antes_de_raya(t, estado_tel(sv["Ordenar por"], e14l.pantalla_ordenar(volver_svg(t), "M-FRM-Respuestas-Propias", "Recibida",
                                                                             RECIENTE)))
    escribir("M-FRM-Respuestas-Propias", t, nl)


# ---------------------------------------------------------------------------------------------------------------- el panel
PANEL = ["FRM-Respuestas-19", "FRM-Respuestas-Exportar-19", "FRM-Respuestas-20"]


def panel():
    """El panel de «Gestión de formularios» en dos grupos (275), como `e14_panel_1004.main`, con estos tableros."""
    for nombre in PANEL:
        ruta = PROJ / f"{nombre}.dc.html"
        t = ruta.read_text(encoding="utf-8")
        nuevo, n = e14p.PANEL.subn(lambda m: e14p.partir(m.group(0)), t)
        assert n, f"{nombre} no tiene el panel"
        if e14p.BLOQUE not in nuevo:
            nuevo = nuevo.replace("</helmet>", e14p.CSS + "</helmet>", 1)
        if nuevo != t:
            ruta.write_text(nuevo, encoding="utf-8", newline="")
        print("ok panel", nombre, n, "(sin cambios)" if nuevo == t else "")


# Los de la compu primero: los teléfonos leen sus filas.
TABLEROS = [("FRM-Respuestas-19", frm_respuestas_19), ("FRM-Respuestas-Exportar-19", frm_respuestas_exportar_19),
            ("FRM-Respuestas-20", frm_respuestas_20), ("FRM-Respuestas-Propias", frm_respuestas_propias),
            ("M-FRM-Respuestas-19", m_frm_respuestas_19), ("M-FRM-Respuestas-20", m_frm_respuestas_20),
            ("M-FRM-Respuestas-Propias", m_frm_respuestas_propias)]

if __name__ == "__main__":
    hechos = []
    for nombre, f in TABLEROS:
        if MARCA in leer(nombre)[0]:
            print(nombre, "ya tiene el bloque: no hace nada")
            continue
        f()
        hechos.append(nombre)
    if hechos:
        piezas = pathlib.Path(__file__).resolve().parent / "traspaso10_piezas_1004.py"
        subprocess.run([sys.executable, str(piezas), "--tableros", ",".join(hechos)], check=True)
    panel()
